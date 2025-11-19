import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckRequest {
  cpf_cnpj: string;
  type: "cpf" | "cnpj";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use SERVICE_ROLE_KEY to bypass RLS for public duplicate check
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Extract IP address for rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "anonymous";
    
    // Apply rate limiting: 10 requests per minute per user
    const rateLimit = await checkRateLimit(
      supabaseClient,
      ip,
      {
        endpoint: "check-cpf-cnpj-duplicity",
        limit: 10,
        windowMinutes: 1
      }
    );

    if (!rateLimit.allowed) {
      console.warn(`[CHECK-DUPLICITY] Rate limit exceeded for IP ${ip}`);
      return new Response(
        JSON.stringify({ 
          error: "Too many requests. Please try again later.",
          retryAfter: rateLimit.reset.toISOString()
        }),
        {
          status: 429,
          headers: { 
            "Content-Type": "application/json",
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.reset.toISOString(),
            ...corsHeaders 
          },
        }
      );
    }

    const { cpf_cnpj, type }: CheckRequest = await req.json();

    // Remove formatação (pontos, traços, barras)
    const cleanDocument = cpf_cnpj.replace(/\D/g, "");

    console.log(`[CHECK-DUPLICITY] Verificando ${type.toUpperCase()}: ${cleanDocument.substring(0, 3)}*** de IP ${ip}`);

    let isDuplicate = false;

    if (type === "cpf") {
      // Verificar na tabela driver_profiles
      const { data: drivers, error: driverError } = await supabaseClient
        .from("driver_profiles")
        .select("id")
        .eq("cpf", cleanDocument);

      if (driverError) {
        console.error("[CHECK-DUPLICITY] Erro ao buscar motoristas:", driverError);
        throw driverError;
      }

      isDuplicate = drivers && drivers.length > 0;
    } else if (type === "cnpj") {
      // Verificar na tabela b2b_carriers
      const { data: carriers, error: carrierError } = await supabaseClient
        .from("b2b_carriers")
        .select("id")
        .eq("cnpj", cleanDocument);

      if (carrierError) {
        console.error("[CHECK-DUPLICITY] Erro ao buscar transportadoras:", carrierError);
        throw carrierError;
      }

      isDuplicate = carriers && carriers.length > 0;
    }

    console.log(`[CHECK-DUPLICITY] Resultado: ${isDuplicate ? "DUPLICADO" : "DISPONÍVEL"}`);

    return new Response(
      JSON.stringify({ 
        isDuplicate,
        message: isDuplicate 
          ? `Este ${type.toUpperCase()} já está cadastrado no sistema.` 
          : `${type.toUpperCase()} disponível para cadastro.`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[CHECK-DUPLICITY] Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
