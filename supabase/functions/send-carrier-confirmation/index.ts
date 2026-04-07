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
      endpoint: 'send-carrier-confirmation',
      limit: 5,
      windowMinutes: 60
    });

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ success: false, message: "Too many requests." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders, ...getRateLimitHeaders(rateLimitResult) } }
      );
    }

    const { email, razaoSocial, nomeGestor } = await req.json();

    if (!email || !razaoSocial) {
      return new Response(
        JSON.stringify({ success: false, message: "Email and razaoSocial are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      console.warn("[CARRIER-CONFIRMATION] Missing API keys");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const displayName = nomeGestor || 'Gestor';

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f7f7f7;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 30px;text-align:center;background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);border-radius:12px 12px 0 0;">
<div style="background-color:rgba(255,255,255,0.15);border-radius:50%;width:80px;height:80px;margin:0 auto 20px;">
<span style="font-size:48px;line-height:80px;">🏢</span>
</div>
<h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Bem-vindo(a), ${displayName}!</h1>
<p style="margin:12px 0 0;color:rgba(255,255,255,0.9);font-size:16px;">Cadastro da <strong>${razaoSocial}</strong> recebido</p>
</td></tr>
<tr><td style="padding:40px;">
<div style="background:linear-gradient(135deg,#e8f4fd 0%,#dbeafe 100%);border-left:4px solid #2563eb;padding:20px;border-radius:8px;margin-bottom:30px;">
<p style="margin:0;color:#1e40af;font-size:15px;line-height:1.6;">
<strong>🎯 Próximos Passos:</strong><br>
Nossa equipe comercial está analisando o perfil da sua transportadora. Entraremos em contato para alinhar os detalhes da parceria.
</p>
</div>

<h3 style="color:#0f172a;font-size:16px;margin:25px 0 15px;">O que acontece agora?</h3>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr><td style="padding:8px 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
<td style="background:#dbeafe;border-radius:50%;width:32px;height:32px;text-align:center;vertical-align:middle;font-size:14px;font-weight:bold;color:#2563eb;">1</td>
<td style="padding-left:12px;color:#333;font-size:14px;">Análise do cadastro e documentação</td>
</tr></table>
</td></tr>
<tr><td style="padding:8px 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
<td style="background:#dbeafe;border-radius:50%;width:32px;height:32px;text-align:center;vertical-align:middle;font-size:14px;font-weight:bold;color:#2563eb;">2</td>
<td style="padding-left:12px;color:#333;font-size:14px;">Contato comercial para alinhamento</td>
</tr></table>
</td></tr>
<tr><td style="padding:8px 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
<td style="background:#dbeafe;border-radius:50%;width:32px;height:32px;text-align:center;vertical-align:middle;font-size:14px;font-weight:bold;color:#2563eb;">3</td>
<td style="padding-left:12px;color:#333;font-size:14px;">Configuração de tabela de frete e rotas</td>
</tr></table>
</td></tr>
<tr><td style="padding:8px 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
<td style="background:#10b981;border-radius:50%;width:32px;height:32px;text-align:center;vertical-align:middle;font-size:14px;font-weight:bold;color:#fff;">✓</td>
<td style="padding-left:12px;color:#333;font-size:14px;">Ativação e início das operações</td>
</tr></table>
</td></tr>
</table>

<div style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:25px 0;">
<p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">
⏰ <strong>Prazo estimado:</strong> Até 48 horas úteis para retorno da equipe comercial.
</p>
</div>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr><td align="center" style="padding:25px 0;">
<a href="${APP_URL}/aguardando-aprovacao" style="display:inline-block;background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">📊 Acompanhar Status</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:30px 40px;background-color:#f7f7f7;border-radius:0 0 12px 12px;">
<p style="margin:0;color:#999999;font-size:12px;text-align:center;">
<strong style="color:#2563eb;">LogiMarket</strong> — Marketplace de Fretes Inteligente<br>
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
        subject: `🏢 Cadastro Recebido — ${razaoSocial} — LogiMarket`,
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[CARRIER-CONFIRMATION] Resend error:", result);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[CARRIER-CONFIRMATION] Email sent:", result.id);
    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[CARRIER-CONFIRMATION] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
