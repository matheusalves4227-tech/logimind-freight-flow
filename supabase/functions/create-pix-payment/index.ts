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

    // Chave PIX da LogiMarket (usar chave real da empresa)
    const pixKey = "pix@logimarket.com.br"; // SUBSTITUIR pela chave PIX real
    const pixRecipientName = "LogiMarket Logística Ltda";
    const pixCity = "São Paulo";
    
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

// Função auxiliar para gerar payload PIX EMV (simplificada)
function generatePixPayload(key: string, name: string, city: string, amount: string, txid: string): string {
  // Formato PIX Copia e Cola simplificado
  // Em produção, usar biblioteca completa de geração de QR Code PIX
  const merchantAccountInfo = `0014BR.GOV.BCB.PIX01${key.length.toString().padStart(2, '0')}${key}`;
  const merchantName = `${name.length.toString().padStart(2, '0')}${name}`;
  const merchantCity = `${city.length.toString().padStart(2, '0')}${city}`;
  const transactionAmount = `${amount.length.toString().padStart(2, '0')}${amount}`;
  
  return `00020126${merchantAccountInfo.length.toString().padStart(2, '0')}${merchantAccountInfo}52040000530398654${transactionAmount}5802BR59${merchantName}60${merchantCity}62${(7 + txid.length).toString().padStart(2, '0')}05${txid.length.toString().padStart(2, '0')}${txid}6304`;
}
