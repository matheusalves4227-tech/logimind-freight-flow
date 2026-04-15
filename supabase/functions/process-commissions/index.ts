import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default commission rate (15%) — can be overridden per order
const DEFAULT_COMMISSION_RATE = 0.15;

// Days after delivery to set as payout deadline
const PAYOUT_DEADLINE_DAYS = 3;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('[PROCESS-COMMISSIONS] Iniciando processamento automático de comissões...');

    // 1. Buscar pedidos entregues que ainda não tiveram comissão calculada
    //    status = 'delivered' AND (status_pagamento = 'pending' OR valor_repasse_liquido IS NULL)
    const { data: orders, error: fetchError } = await supabaseClient
      .from('orders')
      .select('id, tracking_code, final_price, base_price, commission_applied, comissao_logimarket_perc, driver_id, driver_name, actual_delivery')
      .eq('status', 'delivered')
      .is('valor_repasse_liquido', null)
      .not('driver_id', 'is', null);

    if (fetchError) {
      console.error('[PROCESS-COMMISSIONS] Erro ao buscar pedidos:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar pedidos entregues', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!orders || orders.length === 0) {
      console.log('[PROCESS-COMMISSIONS] Nenhum pedido pendente de cálculo de comissão.');
      return new Response(
        JSON.stringify({ processed: 0, message: 'Nenhum pedido pendente' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PROCESS-COMMISSIONS] Encontrados ${orders.length} pedidos para calcular comissão.`);

    const results = [];

    for (const order of orders) {
      try {
        // 2. Cálculo de comissão
        const taxRate = order.comissao_logimarket_perc
          ? order.comissao_logimarket_perc / 100
          : DEFAULT_COMMISSION_RATE;

        const comissaoVal = Math.round(order.final_price * taxRate * 100) / 100;
        const valorRepasseLiquido = Math.round((order.final_price - comissaoVal) * 100) / 100;

        // Data limite para repasse: 3 dias úteis após a entrega
        const deliveryDate = order.actual_delivery ? new Date(order.actual_delivery) : new Date();
        const deadlineDate = new Date(deliveryDate);
        deadlineDate.setDate(deadlineDate.getDate() + PAYOUT_DEADLINE_DAYS);

        console.log(`[PROCESS-COMMISSIONS] Pedido ${order.tracking_code}: Final=${order.final_price}, Taxa=${(taxRate * 100).toFixed(1)}%, Comissão=${comissaoVal}, Repasse=${valorRepasseLiquido}`);

        // 3. Atualizar o pedido com os valores calculados
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({
            comissao_logimarket_perc: taxRate * 100,
            comissao_logimarket_val: comissaoVal,
            valor_repasse_liquido: valorRepasseLiquido,
            repasse_data_limite: deadlineDate.toISOString(),
            status_pagamento: 'pendente_repasse',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        if (updateError) {
          console.error(`[PROCESS-COMMISSIONS] Erro ao atualizar pedido ${order.tracking_code}:`, updateError);
          results.push({ orderId: order.id, tracking_code: order.tracking_code, status: 'failed', error: updateError.message });
          continue;
        }

        // 4. Criar transação financeira (fila de repasse)
        const { error: txError } = await supabaseClient
          .from('financial_transactions')
          .insert({
            order_id: order.id,
            type: 'PAYMENT_OUT',
            amount: valorRepasseLiquido,
            status: 'PENDING',
          });

        if (txError) {
          console.error(`[PROCESS-COMMISSIONS] Erro ao criar transação para ${order.tracking_code}:`, txError);
          // Non-blocking: order already updated, transaction can be retried
        }

        results.push({
          orderId: order.id,
          tracking_code: order.tracking_code,
          status: 'success',
          commission: comissaoVal,
          payout: valorRepasseLiquido,
          deadline: deadlineDate.toISOString(),
        });

        console.log(`[PROCESS-COMMISSIONS] ✅ ${order.tracking_code} calculado com sucesso.`);

      } catch (orderError) {
        const msg = orderError instanceof Error ? orderError.message : 'Erro desconhecido';
        console.error(`[PROCESS-COMMISSIONS] Erro no pedido ${order.tracking_code}:`, msg);
        results.push({ orderId: order.id, tracking_code: order.tracking_code, status: 'failed', error: msg });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'failed').length;

    console.log(`[PROCESS-COMMISSIONS] Finalizado: ${successCount} sucesso, ${failCount} falha(s).`);

    return new Response(
      JSON.stringify({
        processed: results.length,
        success: successCount,
        failed: failCount,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PROCESS-COMMISSIONS] Erro não tratado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
