import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      console.error('[NOTIFY-DRIVER-PAYOUT] Missing API keys');
      return new Response(JSON.stringify({ error: 'Missing API keys' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { driver_email, driver_name, payout_amount, tracking_code, order_id } = await req.json();

    if (!driver_email || !payout_amount) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formattedAmount = Number(payout_amount).toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL',
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎉 Entrega Confirmada!</h1>
          <p style="color: #a0a0b0; margin-top: 8px; font-size: 14px;">LogiMarket - Plataforma de Fretes</p>
        </div>
        
        <div style="padding: 32px;">
          <p style="color: #333; font-size: 16px;">Olá, <strong>${driver_name || 'Motorista'}</strong>!</p>
          
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            Sua entrega do pedido <strong style="color: #1a1a2e;">${tracking_code || ''}</strong> foi confirmada com sucesso!
          </p>

          <div style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; border: 1px solid #c8e6c9;">
            <p style="color: #666; font-size: 13px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Seu Repasse</p>
            <p style="color: #2e7d32; font-size: 36px; font-weight: bold; margin: 0;">${formattedAmount}</p>
            <p style="color: #888; font-size: 13px; margin-top: 8px;">Agendado para cair na sua conta em breve</p>
          </div>

          <p style="color: #555; font-size: 14px; line-height: 1.6;">
            O valor foi processado e está na fila de pagamento. Você pode acompanhar o status no seu 
            <strong>Dashboard → Financeiro → Meus Ganhos</strong>.
          </p>

          <div style="text-align: center; margin-top: 32px;">
            <a href="https://logimind-freight-flow.lovable.app/motorista" 
               style="background: #1a1a2e; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Ver Meu Extrato
            </a>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px 32px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            LogiMarket © ${new Date().getFullYear()} — Plataforma de Fretes Inteligente
          </p>
        </div>
      </div>
    </body>
    </html>`;

    console.log(`[NOTIFY-DRIVER-PAYOUT] Sending email to ${driver_email} for order ${tracking_code}`);

    const response = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'LogiMarket <onboarding@resend.dev>',
        to: [driver_email],
        subject: `🎉 Entrega confirmada! Repasse de ${formattedAmount} processado`,
        html,
      }),
    });

    const result = await response.json();
    console.log('[NOTIFY-DRIVER-PAYOUT] Resend response:', result);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[NOTIFY-DRIVER-PAYOUT] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
