import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConcluirPagamentoRequest {
  order_id: string;
}

interface OrderData {
  id: string;
  status: string;
  preco_final_embarcador?: number;
  final_price: number;
  comissao_logimarket_perc: number;
  comissao_logimarket_val: number;
  gateway_transaction_id?: string;
  status_pagamento: string;
  driver_name?: string;
  carrier_name: string;
  user_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

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

    const { order_id }: ConcluirPagamentoRequest = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: 'order_id é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[REPASSE] Iniciando processo para pedido: ${order_id}`);

    // 1. Buscar dados do pedido
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', user.id) // Garantir que o pedido pertence ao usuário
      .single();

    if (orderError || !order) {
      console.error('Erro ao buscar pedido:', orderError);
      return new Response(
        JSON.stringify({ error: 'Pedido não encontrado' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const orderData = order as OrderData;

    // 2. Validar Status - Pedido deve estar ENTREGUE
    const statusLower = orderData.status.toLowerCase();
    if (statusLower !== 'delivered' && statusLower !== 'entregue') {
      console.warn(`[REPASSE] Pedido ${order_id} não está em status DELIVERED (status atual: ${orderData.status})`);
      return new Response(
        JSON.stringify({ 
          error: 'Pedido não está em status de repasse. Status atual: ' + orderData.status 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Validar se pagamento já não foi processado
    const statusPagamentoLower = (orderData.status_pagamento || '').toLowerCase();
    if (statusPagamentoLower === 'paid' || statusPagamentoLower === 'pago') {
      console.warn(`[REPASSE] Pedido ${order_id} já foi pago`);
      return new Response(
        JSON.stringify({ 
          error: 'Pagamento já foi processado para este pedido',
          status: 'already_paid'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Calcular o Repasse Líquido
    const precoFinal = orderData.preco_final_embarcador || orderData.final_price;
    const comissaoPerc = orderData.comissao_logimarket_perc || 0.10; // Default 10%
    const comissaoVal = parseFloat((precoFinal * comissaoPerc).toFixed(2));
    const valorRepasseLiquido = parseFloat((precoFinal - comissaoVal).toFixed(2));

    console.log(`[REPASSE] Cálculo financeiro:`, {
      precoFinal,
      comissaoPerc: `${(comissaoPerc * 100).toFixed(2)}%`,
      comissaoVal: `R$ ${comissaoVal.toFixed(2)}`,
      valorRepasseLiquido: `R$ ${valorRepasseLiquido.toFixed(2)}`
    });

    // 5. SIMULAÇÃO: Integração com Gateway de Pagamento
    // TODO: Implementar integração real com Pagar.me, Stripe Connect, ou Mercado Pago
    // Por enquanto, simularemos o sucesso do repasse
    
    const simulatedGatewayResponse = {
      success: true,
      transaction_id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount: valorRepasseLiquido,
      recipient: orderData.driver_name || orderData.carrier_name,
      processed_at: new Date().toISOString(),
      method: 'PIX', // Método de repasse simulado
    };

    console.log(`[REPASSE] Resposta simulada do gateway:`, simulatedGatewayResponse);

    // 6. Atualizar Order com dados financeiros e status
    const { error: updateOrderError } = await supabaseClient
      .from('orders')
      .update({
        comissao_logimarket_val: comissaoVal,
        valor_repasse_liquido: valorRepasseLiquido,
        status_pagamento: simulatedGatewayResponse.success ? 'paid' : 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    if (updateOrderError) {
      console.error('[REPASSE] Erro ao atualizar pedido:', updateOrderError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar status do pedido' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 7. Registrar transação de SAÍDA (PAYMENT_OUT - Repasse ao Motorista)
    const { error: transactionError } = await supabaseClient
      .from('financial_transactions')
      .insert({
        order_id: order_id,
        type: 'PAYMENT_OUT',
        amount: valorRepasseLiquido,
        status: simulatedGatewayResponse.success ? 'PAID' : 'FAILED',
        gateway_transaction_id: simulatedGatewayResponse.transaction_id,
        gateway_response: simulatedGatewayResponse,
        processed_at: new Date().toISOString(),
      });

    if (transactionError) {
      console.error('[REPASSE] Erro ao registrar transação:', transactionError);
      // Não vamos falhar a requisição, apenas logar o erro
    }

    // 8. TODO: Enviar notificação ao motorista/transportadora
    // Implementar webhook ou notificação push informando sobre o repasse

    console.log(`[REPASSE] ✅ Processo concluído com sucesso para pedido ${order_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Repasse processado com sucesso',
        data: {
          order_id,
          valor_total: precoFinal,
          comissao_logimarket: comissaoVal,
          valor_repassado: valorRepasseLiquido,
          status_pagamento: 'paid',
          transaction_id: simulatedGatewayResponse.transaction_id,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[REPASSE] Erro não tratado:', error);
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
