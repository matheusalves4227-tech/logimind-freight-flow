import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessarRepasseRequest {
  order_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verificar autenticação e role de admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar se é admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('[PROCESSAR-REPASSE] Usuário não é admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem processar repasses.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { order_id }: ProcessarRepasseRequest = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: 'order_id é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[PROCESSAR-REPASSE] Admin ${user.email} processando repasse do pedido: ${order_id}`);

    // 1. Buscar dados do pedido
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('[PROCESSAR-REPASSE] Erro ao buscar pedido:', orderError);
      return new Response(
        JSON.stringify({ error: 'Pedido não encontrado' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Validar status do pedido
    if (order.status_pagamento?.toLowerCase() !== 'pendente_repasse') {
      console.warn(`[PROCESSAR-REPASSE] Pedido não está em status PENDENTE_REPASSE: ${order.status_pagamento}`);
      return new Response(
        JSON.stringify({ 
          error: 'Pedido não está pendente de repasse',
          current_status: order.status_pagamento
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Buscar dados do motorista para repasse
    const { data: driver, error: driverError } = await supabaseClient
      .from('driver_profiles')
      .select('*')
      .eq('id', order.driver_id)
      .single();

    if (driverError || !driver) {
      console.error('[PROCESSAR-REPASSE] Erro ao buscar motorista:', driverError);
      return new Response(
        JSON.stringify({ error: 'Dados do motorista não encontrados' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Validar dados bancários do motorista
    if (!driver.pix_key && !driver.bank_account_number) {
      console.error('[PROCESSAR-REPASSE] Motorista sem dados bancários cadastrados');
      return new Response(
        JSON.stringify({ 
          error: 'Motorista não possui dados bancários cadastrados',
          driver_id: driver.id,
          driver_name: driver.full_name
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 5. SIMULAÇÃO: Integração com Gateway de Pagamento
    // TODO: Implementar integração real com Pagar.me, Stripe Connect, ou Mercado Pago
    console.log(`[PROCESSAR-REPASSE] Iniciando repasse via ${driver.pix_key ? 'PIX' : 'Transferência Bancária'}`);
    
    const simulatedGatewayResponse = {
      success: true,
      transaction_id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount: order.valor_repasse_liquido,
      recipient: driver.full_name,
      recipient_document: driver.cpf,
      method: driver.pix_key ? 'PIX' : 'BANK_TRANSFER',
      pix_key: driver.pix_key || undefined,
      bank_account: driver.bank_account_number || undefined,
      processed_at: new Date().toISOString(),
      processed_by: user.email,
    };

    console.log(`[PROCESSAR-REPASSE] Resposta simulada do gateway:`, simulatedGatewayResponse);

    // 6. Atualizar status do pedido para PAID
    const { error: updateOrderError } = await supabaseClient
      .from('orders')
      .update({
        status_pagamento: simulatedGatewayResponse.success ? 'PAID' : 'FAILED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    if (updateOrderError) {
      console.error('[PROCESSAR-REPASSE] Erro ao atualizar pedido:', updateOrderError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar status do pedido' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 7. Atualizar transação de PENDING para PAID
    const { error: updateTransactionError } = await supabaseClient
      .from('financial_transactions')
      .update({
        status: simulatedGatewayResponse.success ? 'PAID' : 'FAILED',
        gateway_transaction_id: simulatedGatewayResponse.transaction_id,
        gateway_response: simulatedGatewayResponse,
        processed_at: new Date().toISOString(),
      })
      .eq('order_id', order_id)
      .eq('type', 'PAYMENT_OUT')
      .eq('status', 'PENDING');

    if (updateTransactionError) {
      console.error('[PROCESSAR-REPASSE] Erro ao atualizar transação:', updateTransactionError);
    }

    // 8. TODO: Enviar notificação ao motorista
    // Implementar webhook ou notificação push informando sobre o repasse concluído

    console.log(`[PROCESSAR-REPASSE] ✅ Repasse processado com sucesso para pedido ${order_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Repasse processado com sucesso',
        data: {
          order_id,
          tracking_code: order.tracking_code,
          motorista: driver.full_name,
          valor_repassado: order.valor_repasse_liquido,
          metodo: simulatedGatewayResponse.method,
          transaction_id: simulatedGatewayResponse.transaction_id,
          processed_by: user.email,
          processed_at: simulatedGatewayResponse.processed_at,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[PROCESSAR-REPASSE] Erro não tratado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno ao processar repasse',
        details: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
