import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod Schema for Approve B2B Carrier Request Validation
const ApproveCarrierSchema = z.object({
  carrier_id: z.string().uuid('ID da transportadora inválido'),
  action: z.enum(['approve', 'reject'], { 
    errorMap: () => ({ message: 'Ação deve ser "approve" ou "reject"' }) 
  }),
  notes: z.string().max(1000).optional(),
  rejection_reason: z.string().min(10, 'Motivo da rejeição deve ter pelo menos 10 caracteres').max(1000).optional(),
}).refine(
  (data) => data.action !== 'reject' || data.rejection_reason,
  { message: 'Motivo da rejeição é obrigatório quando action é "reject"', path: ['rejection_reason'] }
);

interface ApproveCarrierRequest {
  carrier_id: string;
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
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
      console.error('[APPROVE-CARRIER] Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log(`[APPROVE-CARRIER] Usuário autenticado: ${user.id}`);

    // 2. Verificar se o usuário é admin
    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('[APPROVE-CARRIER] Erro ao verificar roles:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar permissões' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const isAdmin = roles?.some((r) => r.role === 'admin') ?? false;

    if (!isAdmin) {
      console.warn(`[APPROVE-CARRIER] Usuário ${user.id} não é admin`);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem aprovar transportadoras.' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log(`[APPROVE-CARRIER] Usuário ${user.id} é admin - prosseguindo`);

    // 3. Validar payload com Zod
    const requestBody = await req.json();
    
    let validatedData: ApproveCarrierRequest;
    try {
      validatedData = ApproveCarrierSchema.parse(requestBody);
    } catch (validationError) {
      console.error('[APPROVE-CARRIER] Erro de validação:', validationError);
      if (validationError instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ 
            error: 'Dados inválidos', 
            details: validationError.errors 
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
      throw validationError;
    }

    const { carrier_id, action, notes, rejection_reason } = validatedData;

    console.log(`[APPROVE-CARRIER] Ação: ${action} para transportadora ${carrier_id}`);

    // 4. Verificar se a transportadora existe e está pendente
    const { data: carrierProfile, error: fetchError } = await supabaseClient
      .from('b2b_carriers')
      .select('*')
      .eq('id', carrier_id)
      .single();

    if (fetchError || !carrierProfile) {
      console.error('[APPROVE-CARRIER] Erro ao buscar transportadora:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Transportadora não encontrada' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (carrierProfile.status !== 'pending') {
      console.warn(`[APPROVE-CARRIER] Transportadora ${carrier_id} já foi processada (status: ${carrierProfile.status})`);
      return new Response(
        JSON.stringify({ 
          error: `Transportadora já foi ${carrierProfile.status === 'approved' ? 'aprovada' : 'rejeitada'}` 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // 5. Atualizar status da transportadora
    const updatePayload = action === 'approve'
      ? {
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          approval_notes: notes || null,
          rejected_reason: null,
        }
      : {
          status: 'rejected',
          rejected_reason: rejection_reason!,
          approval_notes: notes || null,
          approved_at: null,
          approved_by: null,
        };

    const { error: updateError } = await supabaseClient
      .from('b2b_carriers')
      .update(updatePayload)
      .eq('id', carrier_id);

    if (updateError) {
      console.error('[APPROVE-CARRIER] Erro ao atualizar transportadora:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar status da transportadora' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log(`[APPROVE-CARRIER] Transportadora ${carrier_id} ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso`);

    // 6. Enviar notificação por email
    try {
      const { error: emailError } = await supabaseClient.functions.invoke(
        'send-approval-notification',
        {
          body: {
            email: carrierProfile.email,
            name: carrierProfile.razao_social,
            status: action === 'approve' ? 'approved' : 'rejected',
            userType: 'b2b_carrier',
            rejectionReason: rejection_reason,
          },
        }
      );

      if (emailError) {
        console.error('[APPROVE-CARRIER] Erro ao enviar email:', emailError);
        // Não bloqueia o processo, apenas loga o erro
      } else {
        console.log(`[APPROVE-CARRIER] Email enviado para ${carrierProfile.email}`);
      }
    } catch (emailException) {
      console.error('[APPROVE-CARRIER] Exceção ao enviar email:', emailException);
    }

    // 7. Registrar log de auditoria
    const { error: auditError } = await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: action === 'approve' ? 'carrier_approval' : 'carrier_rejection',
        metadata: {
          carrier_id,
          carrier_name: carrierProfile.razao_social,
          action,
          notes,
          rejection_reason,
        },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

    if (auditError) {
      console.error('[APPROVE-CARRIER] Erro ao registrar auditoria:', auditError);
      // Não bloqueia o processo, apenas loga
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Transportadora ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso`,
        carrier: {
          id: carrier_id,
          status: action === 'approve' ? 'approved' : 'rejected',
          razao_social: carrierProfile.razao_social,
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error) {
    console.error('[APPROVE-CARRIER] Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno ao processar aprovação',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
