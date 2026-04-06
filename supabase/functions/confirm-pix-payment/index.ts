import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmPixPaymentRequest {
  order_id: string;
  admin_notes?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) {
      console.log("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract JWT token from Bearer header
    const jwt = authHeader.replace('Bearer ', '');
    
    // Cliente com contexto do usuário para autenticação e leitura
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    // Cliente admin para operações em tabelas com RLS restritivo
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Use getUser with JWT token directly
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      console.log("User auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id, user.email);

    // Verificar se é admin
    const { data: roleData, error: roleError } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    console.log("Role check result:", { roleData, roleError });

    if (roleError || !roleData) {
      console.log("Access denied - not admin");
      return new Response(
        JSON.stringify({ error: "Access denied: Admin privileges required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { order_id, admin_notes }: ConfirmPixPaymentRequest = await req.json();

    // Buscar pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Pedido não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atualizar status do pagamento
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status_pagamento: "PAGO",
        paid_at: new Date().toISOString(),
        status: "awaiting_driver",
        operational_notes: admin_notes 
          ? `${order.operational_notes || ""}\n[ADMIN] Pagamento PIX confirmado: ${admin_notes}`.trim()
          : `${order.operational_notes || ""}\n[ADMIN] Pagamento PIX confirmado manualmente`.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("Error confirming payment:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao confirmar pagamento" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar registro de transação financeira usando cliente admin (RLS restritivo)
    const { error: transactionError } = await supabaseAdmin
      .from("financial_transactions")
      .insert({
        order_id: order_id,
        type: "PAYMENT_IN",
        amount: order.final_price,
        status: "PAID",
        processed_at: new Date().toISOString(),
        gateway_response: {
          payment_method: "PIX_MANUAL",
          confirmed_by: user.id,
          confirmed_at: new Date().toISOString(),
          admin_notes: admin_notes,
        },
      });

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pagamento PIX confirmado com sucesso",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in confirm-pix-payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
