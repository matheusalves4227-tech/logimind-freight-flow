import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RejectionNotificationRequest {
  orderId: string;
  trackingCode: string;
  driverName: string;
  driverEmail: string;
  rejectReason: string;
  originAddress: string;
  destinationAddress: string;
  valorRepasse: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const {
      orderId,
      trackingCode,
      driverName,
      driverEmail,
      rejectReason,
      originAddress,
      destinationAddress,
      valorRepasse,
    }: RejectionNotificationRequest = await req.json();

    console.log(`[notify-admin-rejection] Processing rejection for order ${trackingCode}`);

    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "admin@logimarket.com.br";
    const adminEmails: string[] = [adminEmail];

    // Buscar emails dos admins do sistema
    const { data: adminRoles } = await supabaseClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminRoles && adminRoles.length > 0) {
      for (const adminRole of adminRoles) {
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("email")
          .eq("user_id", adminRole.user_id)
          .single();
        
        if (profile?.email && !adminEmails.includes(profile.email)) {
          adminEmails.push(profile.email);
        }
      }
    }

    console.log(`[notify-admin-rejection] Sending to admins:`, adminEmails);

    // Enviar email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "LogiMarket <onboarding@resend.dev>",
        to: adminEmails,
        subject: `⚠️ Frete Recusado: ${trackingCode} - Ação Necessária`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .alert-box { background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .info-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .label { color: #6b7280; font-size: 14px; }
              .value { font-weight: bold; color: #111827; }
              .reason-box { background: #fff4e5; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
              .route-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">⚠️ Frete Recusado pelo Motorista</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Ação necessária para reatribuição</p>
              </div>
              
              <div class="content">
                <div class="alert-box">
                  <strong style="color: #dc2626; font-size: 18px;">Pedido ${trackingCode}</strong>
                  <p style="margin: 10px 0 0 0;">O motorista recusou este frete. É necessário atribuir a outro motorista.</p>
                </div>

                <h3 style="color: #111827; margin-bottom: 15px;">📋 Detalhes do Motorista</h3>
                <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                  <div class="info-row">
                    <span class="label">Nome:</span>
                    <span class="value">${driverName}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">${driverEmail}</span>
                  </div>
                </div>

                <h3 style="color: #111827; margin-bottom: 15px;">📍 Rota do Frete</h3>
                <div class="route-box">
                  <div style="margin-bottom: 10px;">
                    <span class="label">Origem:</span><br>
                    <span class="value">${originAddress}</span>
                  </div>
                  <div>
                    <span class="label">Destino:</span><br>
                    <span class="value">${destinationAddress}</span>
                  </div>
                </div>

                <h3 style="color: #111827; margin-bottom: 15px;">💬 Motivo da Recusa</h3>
                <div class="reason-box">
                  <p style="margin: 0; font-style: italic;">"${rejectReason}"</p>
                </div>

                <div style="background: white; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <div class="info-row">
                    <span class="label">Valor do Repasse:</span>
                    <span class="value" style="color: #059669;">R$ ${valorRepasse.toFixed(2)}</span>
                  </div>
                </div>

                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                  O pedido foi automaticamente devolvido para a fila de pendentes e precisa ser reatribuído a outro motorista.
                </p>

                <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                  Este é um email automático enviado pelo sistema LogiMarket.<br>
                  Data/Hora: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("[notify-admin-rejection] Email sent:", emailResult);

    // Registrar no audit log
    try {
      await supabaseClient.from("audit_logs").insert({
        user_id: "00000000-0000-0000-0000-000000000000",
        action: "DRIVER_REJECTED_FREIGHT",
        metadata: {
          order_id: orderId,
          tracking_code: trackingCode,
          driver_name: driverName,
          driver_email: driverEmail,
          reject_reason: rejectReason,
          notified_admins: adminEmails,
        },
        reason: `Motorista ${driverName} recusou o frete ${trackingCode}: ${rejectReason}`,
      });
    } catch (auditError) {
      console.error("[notify-admin-rejection] Audit error:", auditError);
    }

    return new Response(
      JSON.stringify({ success: true, notifiedAdmins: adminEmails.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[notify-admin-rejection] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
