import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatePixPaymentRequest {
  order_id: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { order_id }: CreatePixPaymentRequest = await req.json();

    // Buscar detalhes do pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, tracking_code, final_price, user_id")
      .eq("id", order_id)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Pedido não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Chave PIX real da LogiMarket (configurada via secret)
    const pixKey = Deno.env.get("LOGIMARKET_PIX_KEY") || "pix@logimarket.com.br";
    const pixRecipientName = "LogiMarket Logistica Ltda";
    const pixCity = "Sao Paulo";
    
    // Gerar payload PIX EMV (formato padrão Banco Central)
    const amount = order.final_price.toFixed(2);
    const txid = order.tracking_code.replace(/-/g, "").substring(0, 25);
    
    // Payload PIX simplificado (formato Copia e Cola)
    const pixPayload = generatePixPayload(pixKey, pixRecipientName, pixCity, amount, txid);

    // Atualizar pedido com dados do PIX
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status_pagamento: "AGUARDANDO_PIX",
        payment_method: "PIX_MANUAL",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("Error updating order:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao processar pagamento PIX" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`PIX payment generated for order ${order_id}, tracking: ${order.tracking_code}, amount: R$ ${amount}`);

    return new Response(
      JSON.stringify({
        success: true,
        pix_data: {
          key: pixKey,
          recipient_name: pixRecipientName,
          amount: amount,
          tracking_code: order.tracking_code,
          payload: pixPayload,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in create-pix-payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Função para calcular CRC16 CCITT
function calculateCRC16(payload: string): string {
  const polynomial = 0x1021;
  let crc = 0xFFFF;
  
  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Função auxiliar para gerar payload PIX EMV com CRC16 válido
function generatePixPayload(key: string, name: string, city: string, amount: string, txid: string): string {
  // Limpar e normalizar valores
  const cleanName = name.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 25);
  const cleanCity = city.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 15);
  const cleanTxid = txid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25);
  
  // Montar campos do PIX
  const payloadFormatIndicator = "000201";
  const merchantAccountInfo = `0014BR.GOV.BCB.PIX01${key.length.toString().padStart(2, '0')}${key}`;
  const merchantAccountInfoFull = `26${merchantAccountInfo.length.toString().padStart(2, '0')}${merchantAccountInfo}`;
  const merchantCategoryCode = "52040000";
  const transactionCurrency = "5303986";
  const transactionAmount = `54${amount.length.toString().padStart(2, '0')}${amount}`;
  const countryCode = "5802BR";
  const merchantName = `59${cleanName.length.toString().padStart(2, '0')}${cleanName}`;
  const merchantCity = `60${cleanCity.length.toString().padStart(2, '0')}${cleanCity}`;
  const additionalDataField = `05${cleanTxid.length.toString().padStart(2, '0')}${cleanTxid}`;
  const additionalDataFieldFull = `62${additionalDataField.length.toString().padStart(2, '0')}${additionalDataField}`;
  
  // Montar payload sem CRC
  const payloadWithoutCRC = `${payloadFormatIndicator}${merchantAccountInfoFull}${merchantCategoryCode}${transactionCurrency}${transactionAmount}${countryCode}${merchantName}${merchantCity}${additionalDataFieldFull}6304`;
  
  // Calcular e adicionar CRC16
  const crc = calculateCRC16(payloadWithoutCRC);
  
  return payloadWithoutCRC + crc;
}
