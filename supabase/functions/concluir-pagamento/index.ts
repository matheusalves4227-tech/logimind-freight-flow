import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod Schema for Concluir Pagamento Request Validation
const ConcluirPagamentoSchema = z.object({
  order_id: z.string().uuid('ID do pedido inválido'),
});

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
    // Cliente com contexto do usuário para leitura/validação
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );
    
    // Cliente admin para operações em tabelas com RLS restritivo
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
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

    const requestBody = await req.json();
    
    // Validate input with Zod
    const validation = ConcluirPagamentoSchema.safeParse(requestBody);
    if (!validation.success) {
      console.error('[REPASSE] Validation failed:', validation.error.flatten());
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validation.error.flatten().fieldErrors 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { order_id }: ConcluirPagamentoRequest = validation.data;

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
    
    // Calcular data limite do repasse (D+2 úteis)
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + 2);

    console.log(`[REPASSE] Cálculo financeiro:`, {
      precoFinal,
      comissaoPerc: `${(comissaoPerc * 100).toFixed(2)}%`,
      comissaoVal: `R$ ${comissaoVal.toFixed(2)}`,
      valorRepasseLiquido: `R$ ${valorRepasseLiquido.toFixed(2)}`,
      dataLimiteRepasse: dataLimite.toISOString()
    });

    // 5. NOVO FLUXO: Marcar como PENDENTE_REPASSE ao invés de processar imediatamente
    // O repasse real será feito através da edge function processar-repasse-agora
    // após aprovação manual do time financeiro
    
    console.log(`[REPASSE] Marcando pedido como PENDENTE_REPASSE (fila de aprovação)`);

    // 6. Atualizar Order com dados financeiros e status PENDENTE_REPASSE
    const { error: updateOrderError } = await supabaseClient
      .from('orders')
      .update({
        comissao_logimarket_val: comissaoVal,
        valor_repasse_liquido: valorRepasseLiquido,
        status_pagamento: 'PENDENTE_REPASSE',
        repasse_data_limite: dataLimite.toISOString(),
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

    // 7. Registrar transação de PENDENTE usando cliente admin (RLS restritivo)
    const { error: transactionError } = await supabaseAdmin
      .from('financial_transactions')
      .insert({
        order_id: order_id,
        type: 'PAYMENT_OUT',
        amount: valorRepasseLiquido,
        status: 'PENDING',
        gateway_response: {
          message: 'Aguardando aprovação manual do time financeiro',
          data_limite: dataLimite.toISOString(),
        },
        created_at: new Date().toISOString(),
      });

    if (transactionError) {
      console.error('[REPASSE] Erro ao registrar transação:', transactionError);
      // Não vamos falhar a requisição, apenas logar o erro
    }

    console.log(`[REPASSE] ✅ Pedido ${order_id} marcado como PENDENTE_REPASSE`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pedido marcado para repasse. Aguardando aprovação do time financeiro.',
        data: {
          order_id,
          valor_total: precoFinal,
          comissao_logimarket: comissaoVal,
          valor_a_repassar: valorRepasseLiquido,
          status_pagamento: 'PENDENTE_REPASSE',
          data_limite_repasse: dataLimite.toISOString(),
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
