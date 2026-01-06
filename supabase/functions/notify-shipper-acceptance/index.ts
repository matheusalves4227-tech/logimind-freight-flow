import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  orderId: string;
  driverName: string;
  driverPhone?: string;
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

    const { orderId, driverName, driverPhone }: NotificationRequest = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ success: false, message: "orderId is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[NOTIFY-SHIPPER] Notifying shipper about order ${orderId} acceptance by ${driverName}`);

    // Fetch order details with user_id (shipper)
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('tracking_code, origin_address, origin_cep, destination_address, destination_cep, weight_kg, final_price, service_type, user_id, estimated_delivery, codigo_coleta')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error("[NOTIFY-SHIPPER] Order not found:", orderError);
      return new Response(
        JSON.stringify({ success: false, message: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch shipper (user) profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('full_name, email, phone')
      .eq('user_id', order.user_id)
      .single();

    if (profileError || !profile || !profile.email) {
      console.error("[NOTIFY-SHIPPER] Shipper profile not found:", profileError);
      return new Response(
        JSON.stringify({ success: false, message: "Shipper profile not found or missing email" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("[NOTIFY-SHIPPER] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const appUrl = Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovableproject.com') || "https://xrerhrqxfvvwiefzlkux.lovableproject.com";
    
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const estimatedDelivery = order.estimated_delivery 
      ? new Date(order.estimated_delivery).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'A definir';

    const emailData = {
      from: "LogiMarket <noreply@logimarket.com.br>",
      to: [profile.email],
      subject: `✅ Motorista Confirmado - Frete ${order.tracking_code}`,
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
                        <span style="font-size: 48px; line-height: 80px;">✅</span>
                      </div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Motorista Confirmado!</h1>
                      <p style="margin: 12px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Olá, ${profile.full_name}!</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 4px solid #10B981; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                        <p style="margin: 0; color: #065f46; font-size: 15px; line-height: 1.6;">
                          <strong>🎉 Ótima notícia!</strong> O motorista aceitou seu frete e está preparado para realizar a coleta. Confira os detalhes abaixo.
                        </p>
                      </div>

                      <!-- Order Code -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 25px;">
                        <tr>
                          <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px;">
                            <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Código do Frete</p>
                            <p style="margin: 0; color: #111827; font-size: 24px; font-weight: 700; font-family: monospace;">${order.tracking_code}</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Driver Info -->
                      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                        <p style="margin: 0 0 10px; color: #1e40af; font-size: 12px; font-weight: 600; text-transform: uppercase;">🚚 MOTORISTA RESPONSÁVEL</p>
                        <p style="margin: 0; color: #1e3a8a; font-size: 20px; font-weight: 700;">${driverName}</p>
                        ${driverPhone ? `<p style="margin: 10px 0 0; color: #3b82f6; font-size: 14px;">📞 ${driverPhone}</p>` : ''}
                      </div>

                      <!-- Route Info -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 25px;">
                        <tr>
                          <td style="padding: 15px; background-color: #eff6ff; border-radius: 8px 8px 0 0; border-bottom: 1px dashed #93c5fd;">
                            <p style="margin: 0 0 5px; color: #3b82f6; font-size: 12px; font-weight: 600;">📍 ORIGEM (Coleta)</p>
                            <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">${order.origin_address}</p>
                            <p style="margin: 5px 0 0; color: #6b7280; font-size: 12px;">CEP: ${order.origin_cep}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 15px; background-color: #fef3c7; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0 0 5px; color: #d97706; font-size: 12px; font-weight: 600;">📍 DESTINO (Entrega)</p>
                            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">${order.destination_address}</p>
                            <p style="margin: 5px 0 0; color: #6b7280; font-size: 12px;">CEP: ${order.destination_cep}</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Details -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 25px;">
                        <tr>
                          <td width="32%" style="padding: 15px; background-color: #f3f4f6; border-radius: 8px; vertical-align: top; text-align: center;">
                            <p style="margin: 0 0 5px; color: #6b7280; font-size: 12px;">📦 Peso</p>
                            <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 700;">${order.weight_kg} kg</p>
                          </td>
                          <td width="2%"></td>
                          <td width="32%" style="padding: 15px; background-color: #f3f4f6; border-radius: 8px; vertical-align: top; text-align: center;">
                            <p style="margin: 0 0 5px; color: #6b7280; font-size: 12px;">📅 Previsão</p>
                            <p style="margin: 0; color: #111827; font-size: 14px; font-weight: 700;">${estimatedDelivery}</p>
                          </td>
                          <td width="2%"></td>
                          <td width="32%" style="padding: 15px; background-color: #f3f4f6; border-radius: 8px; vertical-align: top; text-align: center;">
                            <p style="margin: 0 0 5px; color: #6b7280; font-size: 12px;">💰 Valor</p>
                            <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 700;">${formatCurrency(order.final_price)}</p>
                          </td>
                        </tr>
                      </table>

                      ${order.codigo_coleta ? `
                      <div style="padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; text-align: center; margin-bottom: 25px;">
                        <p style="margin: 0 0 10px; color: #92400e; font-size: 12px; font-weight: 600;">🔐 CÓDIGO DE VALIDAÇÃO DA COLETA</p>
                        <p style="margin: 0; color: #78350f; font-size: 32px; font-weight: 700; font-family: monospace; letter-spacing: 4px;">${order.codigo_coleta}</p>
                        <p style="margin: 10px 0 0; color: #92400e; font-size: 12px;">Forneça este código ao motorista no momento da coleta</p>
                      </div>
                      ` : ''}

                      <!-- CTA Button -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${appUrl}/rastreio?codigo=${order.tracking_code}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(59,130,246,0.4);">
                              📍 ACOMPANHAR FRETE
                            </a>
                          </td>
                        </tr>
                      </table>

                      <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin-top: 15px;">
                        <p style="margin: 0; color: #0369a1; font-size: 14px; line-height: 1.6;">
                          💡 <strong>Próximos passos:</strong> O motorista entrará em contato para agendar a coleta. Tenha o código de validação em mãos.
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
      console.error("[NOTIFY-SHIPPER] Resend error:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send email", details: errorText }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const result = await resendResponse.json();
    console.log("[NOTIFY-SHIPPER] Email sent successfully:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Shipper notified about driver acceptance",
        emailId: result.id,
        shipperEmail: profile.email 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[NOTIFY-SHIPPER] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
