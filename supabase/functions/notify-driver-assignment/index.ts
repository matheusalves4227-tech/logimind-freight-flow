import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  orderId: string;
  driverId: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { orderId, driverId }: NotificationRequest = await req.json();

    if (!orderId || !driverId) {
      return new Response(
        JSON.stringify({ success: false, message: "orderId and driverId are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[NOTIFY-DRIVER] Notifying driver ${driverId} about order ${orderId}`);

    // Fetch driver details
    const { data: driver, error: driverError } = await supabaseClient
      .from('driver_profiles')
      .select('full_name, email, phone, whatsapp')
      .eq('id', driverId)
      .single();

    if (driverError || !driver) {
      console.error("[NOTIFY-DRIVER] Driver not found:", driverError);
      return new Response(
        JSON.stringify({ success: false, message: "Driver not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('tracking_code, origin_address, origin_cep, destination_address, destination_cep, weight_kg, final_price, service_type, codigo_coleta, valor_repasse_liquido')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error("[NOTIFY-DRIVER] Order not found:", orderError);
      return new Response(
        JSON.stringify({ success: false, message: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("[NOTIFY-DRIVER] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const appUrl = Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovableproject.com') || "https://xrerhrqxfvvwiefzlkux.lovableproject.com";
    
    const valorRepasse = order.valor_repasse_liquido || (order.final_price * 0.85);
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const emailData = {
      from: "LogiMarket <noreply@logimarket.com.br>",
      to: [driver.email],
      subject: `🚚 Novo Frete Atribuído - ${order.tracking_code}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f7f7f7;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f7f7f7;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 12px 12px 0 0;">
                      <div style="background-color: rgba(255,255,255,0.15); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 48px; line-height: 80px;">🚚</span>
                      </div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Novo Frete Atribuído!</h1>
                      <p style="margin: 12px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Olá, ${driver.full_name}!</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 4px solid #10B981; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                        <p style="margin: 0; color: #065f46; font-size: 15px; line-height: 1.6;">
                          <strong>🎉 Parabéns!</strong> Um novo frete foi atribuído a você. Confira os detalhes abaixo e acesse a plataforma para confirmar.
                        </p>
                      </div>

                      <!-- Order Details -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 25px;">
                        <tr>
                          <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px;">
                            <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Código do Frete</p>
                            <p style="margin: 0; color: #111827; font-size: 24px; font-weight: 700; font-family: monospace;">${order.tracking_code}</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Route Info -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 25px;">
                        <tr>
                          <td style="padding: 15px; background-color: #eff6ff; border-radius: 8px 8px 0 0; border-bottom: 1px dashed #93c5fd;">
                            <p style="margin: 0 0 5px; color: #3b82f6; font-size: 12px; font-weight: 600;">📍 ORIGEM</p>
                            <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">${order.origin_address}</p>
                            <p style="margin: 5px 0 0; color: #6b7280; font-size: 12px;">CEP: ${order.origin_cep}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 15px; background-color: #fef3c7; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0 0 5px; color: #d97706; font-size: 12px; font-weight: 600;">📍 DESTINO</p>
                            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">${order.destination_address}</p>
                            <p style="margin: 5px 0 0; color: #6b7280; font-size: 12px;">CEP: ${order.destination_cep}</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Cargo & Payment Info -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td width="48%" style="padding: 15px; background-color: #f3f4f6; border-radius: 8px; vertical-align: top;">
                            <p style="margin: 0 0 5px; color: #6b7280; font-size: 12px; font-weight: 600;">📦 CARGA</p>
                            <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 700;">${order.weight_kg} kg</p>
                            <p style="margin: 5px 0 0; color: #6b7280; font-size: 12px;">${order.service_type || 'LTL'}</p>
                          </td>
                          <td width="4%"></td>
                          <td width="48%" style="padding: 15px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 8px; vertical-align: top;">
                            <p style="margin: 0 0 5px; color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600;">💰 SEU REPASSE</p>
                            <p style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">${formatCurrency(valorRepasse)}</p>
                            <p style="margin: 5px 0 0; color: rgba(255,255,255,0.8); font-size: 12px;">Valor líquido</p>
                          </td>
                        </tr>
                      </table>

                      ${order.codigo_coleta ? `
                      <div style="margin-top: 25px; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; text-align: center;">
                        <p style="margin: 0 0 10px; color: #92400e; font-size: 12px; font-weight: 600;">🔐 CÓDIGO DE COLETA</p>
                        <p style="margin: 0; color: #78350f; font-size: 32px; font-weight: 700; font-family: monospace; letter-spacing: 4px;">${order.codigo_coleta}</p>
                        <p style="margin: 10px 0 0; color: #92400e; font-size: 12px;">Use este código para validar a coleta</p>
                      </div>
                      ` : ''}

                      <!-- CTA Button -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td align="center" style="padding: 30px 0 20px;">
                            <a href="${appUrl}/motorista" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 15px rgba(16,185,129,0.4);">
                              ✅ ACEITAR FRETE AGORA
                            </a>
                          </td>
                        </tr>
                      </table>

                      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-top: 20px;">
                        <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                          ⚠️ <strong>AÇÃO NECESSÁRIA:</strong> Você precisa aceitar ou recusar este frete no painel do motorista. O frete será reatribuído se não for aceito em tempo hábil.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f7f7f7; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px;">
                        Dúvidas? Responda este email ou entre em contato pelo WhatsApp
                      </p>
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        <strong style="color: #1A73E8;">LogiMarket</strong> - Powered by LogiMind AI
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailData),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("[NOTIFY-DRIVER] Resend error:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send email", details: errorText }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const result = await resendResponse.json();
    console.log("[NOTIFY-DRIVER] Email sent successfully:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification sent to driver",
        emailId: result.id,
        driverEmail: driver.email 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[NOTIFY-DRIVER] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
