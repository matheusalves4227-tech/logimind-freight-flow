import { supabase } from "@/integrations/supabase/client";

export type AuditAction = 
  | "account_deletion"
  | "password_change"
  | "email_change"
  | "data_export"
  | "admin_access"
  | "profile_update"
  | "document_upload"
  | "payment_processed"
  | "driver_approval"
  | "driver_rejection"
  | "freight_assignment"
  | "delivery_confirmation";

interface AuditLogParams {
  action: AuditAction;
  reason?: string;
  metadata?: Record<string, any>;
}

export const useAuditLog = () => {
  const logAction = async ({ action, reason, metadata }: AuditLogParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn("Tentativa de log de auditoria sem usuário autenticado");
        return;
      }

      const { error } = await supabase.functions.invoke('log-audit-action', {
        body: {
          action,
          reason: reason || undefined,
          metadata: metadata || {},
          userAgent: navigator.userAgent,
        }
      });

      if (error) {
        console.error("Erro ao registrar log de auditoria:", error);
      }
    } catch (error) {
      console.error("Erro ao chamar função de auditoria:", error);
    }
  };

  return { logAction };
};
