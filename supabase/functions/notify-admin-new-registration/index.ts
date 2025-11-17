import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  registrationType: "driver" | "b2b_carrier";
  userName: string;
  userEmail: string;
  registrationId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { registrationType, userName, userEmail, registrationId }: NotificationRequest = await req.json();

    console.log(`[NOTIFY-ADMIN] Novo cadastro ${registrationType}: ${userName} (${userEmail})`);

    // Verifica se a API key do Resend está configurada
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("[NOTIFY-ADMIN] RESEND_API_KEY not configured - email will not be sent");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email service not configured. Please add RESEND_API_KEY." 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const adminEmail = "admin@logimarket.com.br"; // Email do admin
    const typeLabel = registrationType === "driver" ? "Motorista Autônomo" : "Transportadora B2B";
    const detailPagePath = registrationType === "driver" ? "motoristas" : "transportadoras";
    const appUrl = Deno.env.get("SUPABASE_URL")?.replace('/supabase', '') || "https://logimarket.com.br";

    // Envia o email via API do Resend
    const emailData = {
      from: "LogiMarket Notificações <notifications@resend.dev>",
      to: [adminEmail],
      subject: `🔔 Novo Cadastro Pendente: ${typeLabel}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Novo Cadastro Pendente</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7f7f7;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f7f7f7;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #1A73E8 0%, #155bb3 100%); border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                        🔔 Novo Cadastro Pendente
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                        Olá, Administrador!
                      </p>
                      
                      <div style="background: linear-gradient(135deg, #f0f7ff 0%, #e5f1ff 100%); border-left: 4px solid #1A73E8; padding: 20px; border-radius: 8px; margin: 30px 0;">
                        <p style="margin: 0 0 15px; color: #1A73E8; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          DETALHES DO CADASTRO
                        </p>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #666666; font-size: 14px;">Tipo:</strong>
                            </td>
                            <td style="padding: 8px 0; text-align: right;">
                              <span style="background-color: #1A73E8; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                                ${typeLabel}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #666666; font-size: 14px;">Nome:</strong>
                            </td>
                            <td style="padding: 8px 0; text-align: right; color: #333333; font-size: 14px;">
                              ${userName}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #666666; font-size: 14px;">Email:</strong>
                            </td>
                            <td style="padding: 8px 0; text-align: right; color: #333333; font-size: 14px;">
                              ${userEmail}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #666666; font-size: 14px;">ID:</strong>
                            </td>
                            <td style="padding: 8px 0; text-align: right; color: #999999; font-size: 12px; font-family: monospace;">
                              ${registrationId}
                            </td>
                          </tr>
                        </table>
                      </div>
                      
                      <p style="margin: 30px 0 20px; color: #666666; font-size: 15px; line-height: 1.6;">
                        Este cadastro está aguardando sua análise e aprovação. Clique no botão abaixo para revisar os documentos e dados enviados:
                      </p>
                      
                      <!-- CTA Button -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${appUrl}/admin/${detailPagePath}" 
                               style="display: inline-block; background: linear-gradient(135deg, #FBBC05 0%, #f59e0b 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(251, 188, 5, 0.3); transition: all 0.3s;">
                              🔍 Analisar Cadastro Agora
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 30px 0;">
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                          ⏰ <strong>Atenção:</strong> Responder rapidamente aos cadastros pendentes melhora a experiência do parceiro e aumenta a taxa de conversão da plataforma.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f7f7f7; border-radius: 0 0 12px 12px; border-top: 1px solid #eeeeee;">
                      <p style="margin: 0 0 10px; color: #999999; font-size: 13px; text-align: center; line-height: 1.6;">
                        Esta é uma notificação automática do sistema LogiMarket.
                      </p>
                      <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                        <strong style="color: #1A73E8;">LogiMarket</strong> - Plataforma de Logística Inteligente<br>
                        Powered by LogiMind AI
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
      console.error("[NOTIFY-ADMIN] Erro ao enviar email:", errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Falha ao enviar email",
          details: errorText
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const result = await resendResponse.json();
    console.log("[NOTIFY-ADMIN] Email enviado com sucesso:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notificação enviada para admin com sucesso",
        emailId: result.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[NOTIFY-ADMIN] Erro ao processar notificação:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro desconhecido"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
