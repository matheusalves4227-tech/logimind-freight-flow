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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, name, status, userType, rejectionReason }: NotificationRequest = await req.json();

    console.log(`Sending ${status} notification to ${email} (${userType})`);

    // Verifica se a API key do Resend está configurada
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured - email will not be sent");
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

    // Envia o email via API do Resend
    const emailData = {
      from: "LogiMarket <onboarding@resend.dev>",
      to: [email],
      subject: "",
      html: "",
    };

    const userTypeLabel = userType === "driver" ? "Motorista Autônomo" : "Transportadora B2B";

    if (status === "approved") {
      emailData.subject = "✅ Cadastro Aprovado - LogiMarket";
      emailData.html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">Parabéns, ${name}!</h1>
          <p>Seu cadastro como <strong>${userTypeLabel}</strong> foi aprovado com sucesso!</p>
          <p>Você já pode acessar a plataforma LogiMarket e começar a utilizar nossos serviços.</p>
          <div style="margin: 30px 0;">
            <a href="${Deno.env.get("SUPABASE_URL")?.replace('/supabase', '')}" 
               style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Acessar Plataforma
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Caso tenha alguma dúvida, entre em contato com nosso suporte.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            LogiMarket - Plataforma de Logística Inteligente
          </p>
        </div>
      `;
    } else {
      emailData.subject = "❌ Cadastro Não Aprovado - LogiMarket";
      emailData.html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Olá, ${name}</h1>
          <p>Infelizmente, seu cadastro como <strong>${userTypeLabel}</strong> não foi aprovado.</p>
          ${rejectionReason ? `
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
              <strong>Motivo:</strong><br>
              ${rejectionReason}
            </div>
          ` : ''}
          <p>Você pode corrigir as informações e tentar novamente.</p>
          <div style="margin: 30px 0;">
            <a href="${Deno.env.get("SUPABASE_URL")?.replace('/supabase', '')}/parceiro" 
               style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Tentar Novamente
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Caso tenha alguma dúvida, entre em contato com nosso suporte.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            LogiMarket - Plataforma de Logística Inteligente
          </p>
        </div>
      `;
    }

    // Faz a requisição HTTP para a API do Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error sending email:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-approval-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
