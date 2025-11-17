import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod Schema for Approve Driver Request Validation
const ApproveDriverSchema = z.object({
  driver_profile_id: z.string().uuid('ID do motorista inválido'),
  action: z.enum(['approve', 'reject'], { 
    errorMap: () => ({ message: 'Ação deve ser "approve" ou "reject"' }) 
  }),
  notes: z.string().max(1000).optional(),
  rejection_reason: z.string().min(10, 'Motivo da rejeição deve ter pelo menos 10 caracteres').max(1000).optional(),
}).refine(
  (data) => data.action !== 'reject' || data.rejection_reason,
  { message: 'Motivo da rejeição é obrigatório quando action é "reject"', path: ['rejection_reason'] }
);

interface ApproveDriverRequest {
  driver_profile_id: string;
  action: 'approve' | 'reject';
  notes?: string;
  rejection_reason?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role para bypass RLS
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // 1. Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. CRÍTICO: Verificar se o usuário é admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.warn(`[APPROVE-DRIVER] Tentativa de acesso não autorizado por usuário: ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Permissão negada. Apenas administradores podem aprovar motoristas.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[APPROVE-DRIVER] Admin ${user.email} (${user.id}) iniciando processo de aprovação`);

    const requestBody = await req.json();
    
    // Validate input with Zod
    const validation = ApproveDriverSchema.safeParse(requestBody);
    if (!validation.success) {
      console.error('[APPROVE-DRIVER] Validation failed:', validation.error.flatten());
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validation.error.flatten().fieldErrors 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { driver_profile_id, action, notes, rejection_reason }: ApproveDriverRequest = validation.data;

    // 3. Buscar o perfil do motorista
    const { data: driverProfile, error: profileError } = await supabaseClient
      .from('driver_profiles')
      .select('*')
      .eq('id', driver_profile_id)
      .single();

    if (profileError || !driverProfile) {
      console.error('[APPROVE-DRIVER] Erro ao buscar perfil do motorista:', profileError);
      return new Response(
        JSON.stringify({ error: 'Perfil de motorista não encontrado' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Validar se o motorista está no status correto
    if (driverProfile.status !== 'pending') {
      return new Response(
        JSON.stringify({ 
          error: `Motorista não está pendente de aprovação. Status atual: ${driverProfile.status}` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 5. Atualizar o status do motorista
    const updateData: any = {
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      updateData.status = 'approved';
      updateData.approval_notes = notes || null;
      console.log(`[APPROVE-DRIVER] Aprovando motorista ${driverProfile.full_name} (${driver_profile_id})`);
    } else if (action === 'reject') {
      updateData.status = 'rejected';
      updateData.rejected_reason = rejection_reason || 'Documentação incompleta ou inválida';
      console.log(`[APPROVE-DRIVER] Rejeitando motorista ${driverProfile.full_name} (${driver_profile_id})`);
    } else {
      return new Response(
        JSON.stringify({ error: 'Ação inválida. Use "approve" ou "reject"' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { error: updateError } = await supabaseClient
      .from('driver_profiles')
      .update(updateData)
      .eq('id', driver_profile_id);

    if (updateError) {
      console.error('[APPROVE-DRIVER] Erro ao atualizar perfil:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar perfil do motorista' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 6. Se aprovado, criar role de 'driver' para o usuário
    if (action === 'approve') {
      const { error: roleInsertError } = await supabaseClient
        .from('user_roles')
        .insert({
          user_id: driverProfile.user_id,
          role: 'driver',
          created_by: user.id,
        });

      if (roleInsertError) {
        // Ignora erro se role já existe (unique constraint)
        if (!roleInsertError.message.includes('duplicate')) {
          console.error('[APPROVE-DRIVER] Erro ao criar role de driver:', roleInsertError);
        }
      }
    }

    // 7. Registrar log de auditoria
    const ipAddress = req.headers.get("CF-Connecting-IP") || 
                      req.headers.get("X-Forwarded-For") || 
                      req.headers.get("X-Real-IP") || 
                      "unknown";
    
    const userAgent = req.headers.get("User-Agent") || "unknown";

    const auditAction = action === 'approve' ? 'driver_approval' : 'driver_rejection';
    const auditMetadata = {
      driver_id: driver_profile_id,
      driver_name: driverProfile.full_name,
      driver_cpf: driverProfile.cpf,
      driver_email: driverProfile.email,
      action_taken: action,
      approval_notes: notes || null,
      rejection_reason: rejection_reason || null,
      timestamp: new Date().toISOString(),
    };

    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: auditAction,
        ip_address: ipAddress,
        user_agent: userAgent,
        reason: action === 'reject' ? rejection_reason : notes,
        metadata: auditMetadata,
      });

    // 8. TODO: Enviar notificação ao motorista (email ou push notification)
    // Implementar envio de e-mail informando aprovação ou rejeição

    console.log(`[APPROVE-DRIVER] ✅ Processo concluído com sucesso`);

    return new Response(
      JSON.stringify({
        success: true,
        message: action === 'approve' 
          ? 'Motorista aprovado com sucesso!' 
          : 'Motorista rejeitado',
        data: {
          driver_profile_id,
          action,
          new_status: updateData.status,
          approved_by: user.email,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[APPROVE-DRIVER] Erro não tratado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno ao processar aprovação',
        details: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
