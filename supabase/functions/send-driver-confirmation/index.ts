import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { checkRateLimit, getRateLimitHeaders, getClientIdentifier } from '../_shared/rateLimit.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_URL = 'https://api.resend.com';
const FROM_EMAIL = 'LogiMarket <matheus.alves@logimarket.com.br>';
const APP_URL = 'https://logimarket.com.br';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const clientIdentifier = getClientIdentifier(req);
    const rateLimitResult = await checkRateLimit(supabaseClient, clientIdentifier, {
      endpoint: 'send-driver-confirmation',
      limit: 5,
      windowMinutes: 60
    });

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ success: false, message: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders, ...getRateLimitHeaders(rateLimitResult) } }
      );
    }

    const { email, name } = await req.json();

    if (!email || !name) {
      return new Response(
        JSON.stringify({ success: false, message: "Email and name are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      console.warn("[DRIVER-CONFIRMATION] Missing API keys");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f7f7f7;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 30px;text-align:center;background:linear-gradient(135deg,#1A73E8 0%,#155bb3 100%);border-radius:12px 12px 0 0;">
<div style="background-color:rgba(255,255,255,0.15);border-radius:50%;width:80px;height:80px;margin:0 auto 20px;">
<span style="font-size:48px;line-height:80px;">🚛</span>
</div>
<h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Olá, ${name}!</h1>
<p style="margin:12px 0 0;color:rgba(255,255,255,0.9);font-size:16px;">Seu cadastro de motorista foi recebido com sucesso</p>
</td></tr>
<tr><td style="padding:40px;">
<div style="background:linear-gradient(135deg,#e8f4fd 0%,#dbeafe 100%);border-left:4px solid #1A73E8;padding:20px;border-radius:8px;margin-bottom:30px;">
<p style="margin:0;color:#1e40af;font-size:15px;line-height:1.6;">
<strong>🎯 Próximos Passos:</strong><br>
Nossa equipe está analisando sua documentação e dados do veículo. Você receberá um e-mail assim que seu cadastro for aprovado.
</p>
</div>
<div style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:20px 0;">
<p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">
⏰ <strong>Prazo estimado:</strong> Até 48 horas úteis para análise e aprovação.
</p>
</div>
<p style="margin:25px 0 0;color:#666666;font-size:14px;line-height:1.6;">
Enquanto isso, você pode acompanhar o status do seu cadastro acessando a plataforma:
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr><td align="center" style="padding:30px 0;">
<a href="${APP_URL}/aguardando-aprovacao" style="display:inline-block;background:linear-gradient(135deg,#FBBC05 0%,#f59e0b 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">🔍 Verificar Status</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:30px 40px;background-color:#f7f7f7;border-radius:0 0 12px 12px;">
<p style="margin:0;color:#999999;font-size:12px;text-align:center;">
<strong style="color:#1A73E8;">LogiMarket</strong> — Marketplace de Fretes Inteligente<br>
matheus.alves@logimarket.com.br
</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

    const response = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: '🚛 Cadastro Recebido — LogiMarket',
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[DRIVER-CONFIRMATION] Resend error:", result);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[DRIVER-CONFIRMATION] Email sent:", result.id);
    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[DRIVER-CONFIRMATION] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
