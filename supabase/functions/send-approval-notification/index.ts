import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  email: string;
  name: string;
  status: "approved" | "rejected";
  userType: "driver" | "b2b_carrier";
  rejectionReason?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, name, status, userType, rejectionReason }: NotificationRequest = await req.json();

    console.log(`[SEND-APPROVAL] Sending ${status} notification to ${email} (${userType})`);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("[SEND-APPROVAL] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const appUrl = Deno.env.get("SUPABASE_URL")?.replace('/supabase', '') || "https://logimarket.com.br";
    const userTypeLabel = userType === "driver" ? "Motorista Autônomo" : "Transportadora B2B";
    const dashboardPath = userType === "driver" ? "motorista/dashboard" : "dashboard";

    let emailData = {
      from: "LogiMarket <onboarding@resend.dev>",
      to: [email],
      subject: "",
      html: "",
    };

    if (status === "approved") {
      emailData.subject = "✅ Parabéns! Seu Cadastro foi Aprovado - LogiMarket";
      emailData.html = `
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
                  <tr>
                    <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #34A853 0%, #2d8e47 100%); border-radius: 12px 12px 0 0;">
                      <div style="background-color: rgba(255,255,255,0.15); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px;">
                        <span style="font-size: 48px; line-height: 80px;">✅</span>
                      </div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Parabéns, ${name}!</h1>
                      <p style="margin: 12px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Seu cadastro foi aprovado</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-left: 4px solid #34A853; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                        <p style="margin: 0; color: #1b5e20; font-size: 15px; line-height: 1.6;">
                          <strong>🎉 Bem-vindo à LogiMarket!</strong><br>Você foi cadastrado como <strong>${userTypeLabel}</strong>.
                        </p>
                      </div>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr><td align="center" style="padding: 30px 0;">
                          <a href="${appUrl}/${dashboardPath}" style="display: inline-block; background: linear-gradient(135deg, #1A73E8 0%, #155bb3 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">🚀 Acessar Plataforma</a>
                        </td></tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f7f7f7; border-radius: 0 0 12px 12px;">
                      <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;"><strong style="color: #1A73E8;">LogiMarket</strong> - Powered by LogiMind AI</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    } else {
      emailData.subject = "❌ Atualização sobre seu Cadastro - LogiMarket";
      emailData.html = `
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
                  <tr>
                    <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px 12px 0 0;">
                      <div style="background-color: rgba(255,255,255,0.15); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px;">
                        <span style="font-size: 48px; line-height: 80px;">❌</span>
                      </div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Olá, ${name}</h1>
                      <p style="margin: 12px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Atualização sobre seu cadastro</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 25px; color: #333333; font-size: 15px;">Seu cadastro como <strong>${userTypeLabel}</strong> não pôde ser aprovado.</p>
                      ${rejectionReason ? `
                        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 30px 0;">
                          <p style="margin: 0 0 10px; color: #991b1b; font-size: 14px; font-weight: 600;">MOTIVO DA RECUSA</p>
                          <p style="margin: 0; color: #7f1d1d; font-size: 15px;">${rejectionReason}</p>
                        </div>
                      ` : ''}
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr><td align="center" style="padding: 30px 0;">
                          <a href="${appUrl}/parceiro" style="display: inline-block; background: linear-gradient(135deg, #1A73E8 0%, #155bb3 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">🔄 Fazer Novo Cadastro</a>
                        </td></tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f7f7f7; border-radius: 0 0 12px 12px;">
                      <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;"><strong style="color: #1A73E8;">LogiMarket</strong> - Powered by LogiMind AI</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    }

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
      console.error("[SEND-APPROVAL] Erro:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Falha ao enviar email", details: errorText }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const result = await resendResponse.json();
    console.log("[SEND-APPROVAL] Email enviado:", result);

    return new Response(
      JSON.stringify({ success: true, message: "Email enviado com sucesso", emailId: result.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[SEND-APPROVAL] Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Erro desconhecido" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
