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
    // Criar cliente Supabase com service_role para deletar usuário
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

    // Verificar autenticação do usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { userId } = await req.json();

    // Verificar se o usuário está tentando deletar sua própria conta
    if (user.id !== userId) {
      throw new Error("You can only delete your own account");
    }

    console.log(`Deletando conta do usuário: ${userId}`);

    // Deletar dados associados (RLS + CASCADE devem cuidar de alguns, mas garantimos manualmente)
    
    // 1. Deletar perfil do usuário
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("user_id", userId);

    if (profileError) {
      console.error("Erro ao deletar perfil:", profileError);
    }

    // 2. Deletar driver_profile se existir
    const { error: driverError } = await supabaseAdmin
      .from("driver_profiles")
      .delete()
      .eq("user_id", userId);

    if (driverError) {
      console.error("Erro ao deletar driver profile:", driverError);
    }

    // 3. Deletar roles do usuário
    const { error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (rolesError) {
      console.error("Erro ao deletar roles:", rolesError);
    }

    // 4. Atualizar pedidos removendo referência ao usuário (manter histórico mas anonimizar)
    const { error: ordersError } = await supabaseAdmin
      .from("orders")
      .update({ user_id: "00000000-0000-0000-0000-000000000000" }) // UUID nulo
      .eq("user_id", userId);

    if (ordersError) {
      console.error("Erro ao anonimizar pedidos:", ordersError);
    }

    // 5. Deletar cotações do usuário
    const { error: quotesError } = await supabaseAdmin
      .from("quotes")
      .delete()
      .eq("user_id", userId);

    if (quotesError) {
      console.error("Erro ao deletar cotações:", quotesError);
    }

    // 6. Deletar arquivos do storage (avatar e documentos)
    const { data: avatarFiles } = await supabaseAdmin
      .storage
      .from("user-avatars")
      .list(userId);

    if (avatarFiles && avatarFiles.length > 0) {
      const filePaths = avatarFiles.map(file => `${userId}/${file.name}`);
      await supabaseAdmin.storage.from("user-avatars").remove(filePaths);
    }

    const { data: driverFiles } = await supabaseAdmin
      .storage
      .from("driver-documents")
      .list(userId);

    if (driverFiles && driverFiles.length > 0) {
      const filePaths = driverFiles.map(file => `${userId}/${file.name}`);
      await supabaseAdmin.storage.from("driver-documents").remove(filePaths);
    }

    const { data: driverProfileFiles } = await supabaseAdmin
      .storage
      .from("driver-profiles")
      .list(userId);

    if (driverProfileFiles && driverProfileFiles.length > 0) {
      const filePaths = driverProfileFiles.map(file => `${userId}/${file.name}`);
      await supabaseAdmin.storage.from("driver-profiles").remove(filePaths);
    }

    // 7. Finalmente, deletar o usuário da auth.users (CASCADE deve limpar dependências)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Erro ao deletar usuário do auth:", deleteError);
      throw deleteError;
    }

    console.log(`Conta do usuário ${userId} deletada com sucesso`);

    return new Response(
      JSON.stringify({ success: true, message: "Conta deletada com sucesso" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro ao deletar conta:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao deletar conta";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
