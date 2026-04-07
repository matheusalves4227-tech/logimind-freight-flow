import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error('orderId é obrigatório');
    }

    console.log('[NOTIFY-ADMIN-ORDER] Novo pedido criado:', orderId);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar detalhes do pedido
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        tracking_code,
        carrier_name,
        service_type,
        vehicle_type,
        origin_cep,
        origin_address,
        destination_cep,
        destination_address,
        weight_kg,
        base_price,
        final_price,
        commission_applied,
        delivery_days:estimated_delivery,
        user_id,
        created_at,
        logiguard_pro_contratado,
        logiguard_pro_valor
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[NOTIFY-ADMIN-ORDER] Erro ao buscar pedido:', orderError);
      throw new Error('Pedido não encontrado');
    }

    // Buscar perfil do usuário que criou o pedido
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, phone, company_name')
      .eq('user_id', order.user_id)
      .single();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.warn('[NOTIFY-ADMIN-ORDER] RESEND_API_KEY não configurada');
      return new Response(
        JSON.stringify({ success: false, message: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminEmail = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ?? 'admin@logimarket.com.br';
    const appUrl = 'https://logimind-freight-flow.lovable.app';
    const serviceLabel = order.service_type === 'ftl' ? 'Carga Completa (FTL)' : 'Carga Fracionada (LTL)';
    const createdAt = new Date(order.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const logiGuardLabel = order.logiguard_pro_contratado 
      ? `✅ Sim (R$ ${Number(order.logiguard_pro_valor || 0).toFixed(2)})` 
      : '❌ Não';

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LogiMarket <noreply@resend.dev>',
        to: [adminEmail],
        subject: `🚚 Novo Pedido Criado - ${order.tracking_code}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #1A73E8 0%, #155bb3 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
              .content { padding: 30px; background: #f9fafb; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #1A73E8; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
              .info-box h3 { margin-top: 0; color: #1A73E8; }
              .info-box p { margin: 8px 0; font-size: 14px; }
              .highlight { color: #1A73E8; font-weight: bold; }
              .price { font-size: 24px; color: #10B981; font-weight: bold; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              .button { display: inline-block; background: #1A73E8; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin-top: 15px; font-weight: 600; }
              .badge { display: inline-block; background: #DBEAFE; color: #1E40AF; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">🚚 Novo Pedido Criado</h1>
              <p style="margin: 8px 0 0; opacity: 0.9;">Um novo frete foi contratado na plataforma</p>
            </div>
            <div class="content">
              <div style="text-align: center; margin-bottom: 20px;">
                <span class="badge">${order.tracking_code}</span>
                <p style="margin: 5px 0; color: #666; font-size: 13px;">${createdAt}</p>
              </div>

              <div class="info-box">
                <h3>👤 Cliente</h3>
                <p><strong>Nome:</strong> ${profile?.full_name || 'Não informado'}</p>
                <p><strong>Email:</strong> ${profile?.email || 'Não informado'}</p>
                <p><strong>Telefone:</strong> ${profile?.phone || 'Não informado'}</p>
                ${profile?.company_name ? `<p><strong>Empresa:</strong> ${profile.company_name}</p>` : ''}
              </div>

              <div class="info-box">
                <h3>📍 Rota</h3>
                <p><strong>Origem:</strong> ${order.origin_address || `CEP ${order.origin_cep}`}</p>
                <p><strong>Destino:</strong> ${order.destination_address || `CEP ${order.destination_cep}`}</p>
              </div>

              <div class="info-box">
                <h3>📦 Detalhes do Frete</h3>
                <p><strong>Transportadora:</strong> ${order.carrier_name}</p>
                <p><strong>Tipo de Serviço:</strong> ${serviceLabel}</p>
                ${order.vehicle_type ? `<p><strong>Veículo:</strong> ${order.vehicle_type}</p>` : ''}
                <p><strong>Peso:</strong> ${order.weight_kg ? `${order.weight_kg} kg` : 'Não informado'}</p>
                <p><strong>LogiGuard Pro:</strong> ${logiGuardLabel}</p>
              </div>

              <div class="info-box">
                <h3>💰 Valores</h3>
                <p><strong>Preço Base:</strong> R$ ${Number(order.base_price).toFixed(2)}</p>
                <p><strong>Comissão:</strong> ${(Number(order.commission_applied) * 100).toFixed(1)}%</p>
                <p><strong>Valor Final:</strong> <span class="price">R$ ${Number(order.final_price).toFixed(2)}</span></p>
              </div>

              <div style="text-align: center; margin-top: 25px;">
                <a href="${appUrl}/admin/pedidos" class="button">Ver Pedido no Painel</a>
              </div>
            </div>
            <div class="footer">
              <p>LogiMarket - Plataforma de Fretes Inteligente</p>
              <p>Este é um email automático de notificação administrativa.</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('[NOTIFY-ADMIN-ORDER] Erro ao enviar email:', errorText);
      // Não falhar o pedido por causa do email
      return new Response(
        JSON.stringify({ success: false, message: 'Erro ao enviar email', details: errorText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailResult = await emailResponse.json();
    console.log('[NOTIFY-ADMIN-ORDER] Email enviado com sucesso:', emailResult);

    return new Response(
      JSON.stringify({ success: true, message: 'Admin notificado sobre novo pedido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[NOTIFY-ADMIN-ORDER] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
