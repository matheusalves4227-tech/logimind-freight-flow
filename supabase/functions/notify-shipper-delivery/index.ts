import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      throw new Error('orderId é obrigatório');
    }

    console.log('Notificando embarcador sobre entrega concluída:', orderId);

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get order details with user info
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        tracking_code,
        origin_address,
        destination_address,
        weight_kg,
        final_price,
        driver_name,
        driver_phone,
        user_id,
        actual_delivery
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Erro ao buscar pedido:', orderError);
      throw new Error('Pedido não encontrado');
    }

    // Get shipper profile to get email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', order.user_id)
      .single();

    if (profileError || !profile?.email) {
      console.error('Erro ao buscar perfil do embarcador:', profileError);
      throw new Error('Email do embarcador não encontrado');
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY não configurada');
    }

    const trackingUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/tracking?code=${order.tracking_code}`;
    const deliveryDate = order.actual_delivery 
      ? new Date(order.actual_delivery).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      : new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // Send email via Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LogiMarket <noreply@resend.dev>',
        to: [profile.email],
        subject: `✅ Entrega Concluída - ${order.tracking_code}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { padding: 30px; background: #f9fafb; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10B981; }
              .success-icon { font-size: 48px; margin-bottom: 10px; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
              .highlight { color: #10B981; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="success-icon">✅</div>
              <h1>Entrega Concluída!</h1>
              <p>Seu frete foi entregue com sucesso</p>
            </div>
            <div class="content">
              <p>Olá <strong>${profile.full_name}</strong>,</p>
              
              <p>Temos o prazer de informar que seu frete foi <span class="highlight">entregue com sucesso</span>!</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">📦 Detalhes da Entrega</h3>
                <p><strong>Código de Rastreio:</strong> ${order.tracking_code}</p>
                <p><strong>Data/Hora da Entrega:</strong> ${deliveryDate}</p>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0;">📍 Informações do Frete</h3>
                <p><strong>Origem:</strong> ${order.origin_address}</p>
                <p><strong>Destino:</strong> ${order.destination_address}</p>
                <p><strong>Peso:</strong> ${order.weight_kg} kg</p>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0;">🚚 Motorista Responsável</h3>
                <p><strong>Nome:</strong> ${order.driver_name || 'Não informado'}</p>
                <p><strong>Telefone:</strong> ${order.driver_phone || 'Não informado'}</p>
              </div>

              <p style="text-align: center;">
                <a href="${trackingUrl}" class="button">Ver Histórico Completo</a>
              </p>

              <p style="margin-top: 20px; padding: 15px; background: #ECFDF5; border-radius: 8px; text-align: center;">
                💚 Obrigado por usar a <strong>LogiMarket</strong>!<br>
                <small>Se tiver alguma dúvida, entre em contato conosco.</small>
              </p>
            </div>
            <div class="footer">
              <p>LogiMarket - Sua Plataforma de Fretes</p>
              <p>Este é um email automático. Por favor, não responda diretamente.</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Erro ao enviar email:', errorText);
      throw new Error(`Erro ao enviar email: ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log('Email de entrega concluída enviado com sucesso:', emailResult);

    return new Response(
      JSON.stringify({ success: true, message: 'Embarcador notificado sobre entrega concluída' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro na função notify-shipper-delivery:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
