import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { cpf_cnpj, type }: CheckRequest = await req.json();

    // Remove formatação (pontos, traços, barras)
    const cleanDocument = cpf_cnpj.replace(/\D/g, "");

    console.log(`[CHECK-DUPLICITY] Verificando ${type.toUpperCase()}: ${cleanDocument.substring(0, 3)}***`);

    let isDuplicate = false;
    let existingUser = null;

    if (type === "cpf") {
      // Verificar na tabela driver_profiles
      const { data: drivers, error: driverError } = await supabaseClient
        .from("driver_profiles")
        .select("id, full_name, email, status")
        .eq("cpf", cleanDocument);

      if (driverError) {
        console.error("[CHECK-DUPLICITY] Erro ao buscar motoristas:", driverError);
        throw driverError;
      }

      if (drivers && drivers.length > 0) {
        isDuplicate = true;
        existingUser = {
          type: "driver",
          name: drivers[0].full_name,
          email: drivers[0].email,
          status: drivers[0].status,
        };
      }
    } else if (type === "cnpj") {
      // Verificar na tabela b2b_carriers
      const { data: carriers, error: carrierError } = await supabaseClient
        .from("b2b_carriers")
        .select("id, razao_social, email, status")
        .eq("cnpj", cleanDocument);

      if (carrierError) {
        console.error("[CHECK-DUPLICITY] Erro ao buscar transportadoras:", carrierError);
        throw carrierError;
      }

      if (carriers && carriers.length > 0) {
        isDuplicate = true;
        existingUser = {
          type: "carrier",
          name: carriers[0].razao_social,
          email: carriers[0].email,
          status: carriers[0].status,
        };
      }
    }

    console.log(`[CHECK-DUPLICITY] Resultado: ${isDuplicate ? "DUPLICADO" : "DISPONÍVEL"}`);

    return new Response(
      JSON.stringify({ 
        isDuplicate,
        existingUser,
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
