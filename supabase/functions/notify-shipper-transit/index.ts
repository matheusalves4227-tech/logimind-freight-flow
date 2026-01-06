import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransitNotificationRequest {
  orderId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId }: TransitNotificationRequest = await req.json();

    if (!orderId) {
      throw new Error('Order ID é obrigatório');
    }

    console.log(`Notificando embarcador sobre início do trânsito - Pedido: ${orderId}`);

    // Buscar dados completos do pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        driver_profiles:driver_id (
          full_name,
          phone,
          whatsapp
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Erro ao buscar pedido:', orderError);
      throw new Error('Pedido não encontrado');
    }

    // Buscar email do embarcador (dono do pedido)
    const { data: shipperProfile, error: shipperError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', order.user_id)
      .single();

    if (shipperError || !shipperProfile?.email) {
      console.error('Erro ao buscar perfil do embarcador:', shipperError);
      throw new Error('Email do embarcador não encontrado');
    }

    const driverData = order.driver_profiles as any;
    const driverName = driverData?.full_name || order.driver_name || 'Motorista';
    const driverPhone = driverData?.phone || order.driver_phone || 'Não informado';
    const driverWhatsapp = driverData?.whatsapp || driverPhone;

    // Enviar email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LogiMarket <noreply@logimarket.com.br>',
        to: [shipperProfile.email],
        subject: `🚚 Sua carga está em trânsito! - ${order.tracking_code}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: white; }
              .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .header .icon { font-size: 48px; margin-bottom: 10px; }
              .content { padding: 30px; }
              .alert-box { background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
              .info-grid { display: grid; gap: 15px; margin: 20px 0; }
              .info-item { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
              .info-item label { font-size: 12px; color: #64748b; display: block; margin-bottom: 5px; text-transform: uppercase; }
              .info-item value { font-size: 16px; color: #1e293b; font-weight: 600; }
              .driver-section { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .driver-section h3 { color: #166534; margin-top: 0; }
              .tracking-btn { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
              .status-badge { display: inline-block; background: #22c55e; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="icon">🚚</div>
                <h1>Sua carga está em trânsito!</h1>
              </div>
              
              <div class="content">
                <p>Olá, <strong>${shipperProfile.full_name}</strong>!</p>
                
                <div class="alert-box">
                  <strong>🎉 Ótima notícia!</strong><br>
                  O motorista iniciou a viagem com sua carga e está a caminho do destino.
                </div>

                <div style="text-align: center; margin: 20px 0;">
                  <span class="status-badge">EM TRÂNSITO</span>
                </div>

                <div class="info-grid">
                  <div class="info-item">
                    <label>Código de Rastreamento</label>
                    <value>${order.tracking_code}</value>
                  </div>
                  <div class="info-item">
                    <label>Origem</label>
                    <value>${order.origin_address}</value>
                  </div>
                  <div class="info-item">
                    <label>Destino</label>
                    <value>${order.destination_address}</value>
                  </div>
                  <div class="info-item">
                    <label>Peso da Carga</label>
                    <value>${order.weight_kg} kg</value>
                  </div>
                </div>

                <div class="driver-section">
                  <h3>👤 Motorista Responsável</h3>
                  <p><strong>Nome:</strong> ${driverName}</p>
                  <p><strong>Telefone:</strong> ${driverPhone}</p>
                  ${driverWhatsapp ? `<p><strong>WhatsApp:</strong> <a href="https://wa.me/55${driverWhatsapp.replace(/\D/g, '')}">${driverWhatsapp}</a></p>` : ''}
                </div>

                <div style="text-align: center;">
                  <a href="https://logimarket.com.br/rastreamento/${order.tracking_code}" class="tracking-btn">
                    📍 Acompanhar em Tempo Real
                  </a>
                </div>

                <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
                  Você receberá uma nova notificação assim que a entrega for concluída.
                </p>
              </div>
              
              <div class="footer">
                <p>Este é um email automático da LogiMarket.</p>
                <p>Em caso de dúvidas, entre em contato conosco.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error('Erro ao enviar email:', emailResult);
      throw new Error(`Falha ao enviar email: ${JSON.stringify(emailResult)}`);
    }

    console.log('Email de trânsito enviado com sucesso:', emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notificação de trânsito enviada ao embarcador',
        emailId: emailResult.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Erro na função notify-shipper-transit:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
