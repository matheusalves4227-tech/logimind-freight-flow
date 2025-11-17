import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { action, reason, metadata, userAgent } = await req.json();

    if (!action) {
      throw new Error("Action is required");
    }

    // Obter IP do usuário
    const ipAddress = req.headers.get("CF-Connecting-IP") || 
                     req.headers.get("X-Forwarded-For") || 
                     req.headers.get("X-Real-IP") || 
                     "unknown";

    console.log(`Registrando ação de auditoria: ${action} para usuário ${user.id}`);

    // Registrar log de auditoria
    const { error: auditError } = await supabaseAdmin
      .from("audit_logs")
      .insert({
        user_id: user.id,
        action: action,
        ip_address: ipAddress,
        user_agent: userAgent || "unknown",
        reason: reason || null,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          user_email: user.email,
        }
      });

    if (auditError) {
      console.error("Erro ao registrar log de auditoria:", auditError);
      throw auditError;
    }

    console.log(`Log de auditoria registrado com sucesso: ${action}`);

    return new Response(
      JSON.stringify({ success: true, message: "Ação registrada com sucesso" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro ao processar log de auditoria:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
