import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BulkDriverActionsProps {
  selectedDriverIds: string[];
  onActionComplete: () => void;
  onClearSelection: () => void;
}

export function BulkDriverActions({
  selectedDriverIds,
  onActionComplete,
  onClearSelection,
}: BulkDriverActionsProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleBulkApprove = async () => {
    if (selectedDriverIds.length === 0) return;

    setProcessing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const driverId of selectedDriverIds) {
        try {
          const { error: updateError } = await supabase
            .from('driver_profiles')
            .update({
              status: 'approved',
              approved_at: new Date().toISOString(),
              approved_by: (await supabase.auth.getUser()).data.user?.id,
              approval_notes: approvalNotes || 'Aprovação em lote',
            })
            .eq('id', driverId);

          if (updateError) throw updateError;

          // Buscar dados do motorista para log
          const { data: driverData } = await supabase
            .from('driver_profiles')
            .select('full_name, cpf')
            .eq('id', driverId)
            .single();

          // Registrar log de auditoria
          await logAction({
            action: 'driver_approval',
            metadata: {
              driver_id: driverId,
              driver_name: driverData?.full_name,
              driver_cpf: driverData?.cpf,
              bulk_action: true,
              notes: approvalNotes || 'Aprovação em lote',
            },
          });

          // Atribuir role de driver
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: driverProfile } = await supabase
              .from('driver_profiles')
              .select('user_id')
              .eq('id', driverId)
              .single();

            if (driverProfile?.user_id) {
              await supabase.from('user_roles').insert({
                user_id: driverProfile.user_id,
                role: 'driver',
                created_by: user.id,
              });
            }
          }

          // Enviar notificação de aprovação
          await supabase.functions.invoke('send-approval-notification', {
            body: {
              driver_profile_id: driverId,
              action: 'approved',
              notes: approvalNotes || 'Aprovação em lote',
            },
          });

          successCount++;
        } catch (error) {
          console.error(`Erro ao aprovar motorista ${driverId}:`, error);
          failCount++;
        }
      }

      toast({
        title: 'Ação em Lote Concluída',
        description: `${successCount} motorista(s) aprovado(s) com sucesso${failCount > 0 ? `. ${failCount} falha(s).` : '.'}`,
        variant: successCount > 0 ? 'default' : 'destructive',
      });

      setShowApproveDialog(false);
      setApprovalNotes('');
      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error('Erro na aprovação em lote:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao processar aprovação em lote',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedDriverIds.length === 0 || !rejectionReason.trim()) {
      toast({
        title: 'Atenção',
        description: 'Por favor, informe o motivo da rejeição',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const driverId of selectedDriverIds) {
        try {
          const { error: updateError } = await supabase
            .from('driver_profiles')
            .update({
              status: 'rejected',
              rejected_reason: rejectionReason,
            })
            .eq('id', driverId);

          if (updateError) throw updateError;

          // Buscar dados do motorista para log
          const { data: driverData } = await supabase
            .from('driver_profiles')
            .select('full_name, cpf')
            .eq('id', driverId)
            .single();

          // Registrar log de auditoria
          await logAction({
            action: 'driver_rejection',
            reason: rejectionReason,
            metadata: {
              driver_id: driverId,
              driver_name: driverData?.full_name,
              driver_cpf: driverData?.cpf,
              bulk_action: true,
            },
          });

          // Enviar notificação de rejeição
          await supabase.functions.invoke('send-approval-notification', {
            body: {
              driver_profile_id: driverId,
              action: 'rejected',
              rejection_reason: rejectionReason,
            },
          });

          successCount++;
        } catch (error) {
          console.error(`Erro ao rejeitar motorista ${driverId}:`, error);
          failCount++;
        }
      }

      toast({
        title: 'Ação em Lote Concluída',
        description: `${successCount} motorista(s) rejeitado(s) com sucesso${failCount > 0 ? `. ${failCount} falha(s).` : '.'}`,
        variant: successCount > 0 ? 'default' : 'destructive',
      });

      setShowRejectDialog(false);
      setRejectionReason('');
      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error('Erro na rejeição em lote:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao processar rejeição em lote',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (selectedDriverIds.length === 0) return null;

  return (
    <>
      <div className="bg-primary/5 border-l-4 border-primary rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">
                {selectedDriverIds.length} motorista{selectedDriverIds.length !== 1 ? 's' : ''} selecionado{selectedDriverIds.length !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                Execute ações em lote nos motoristas selecionados
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowApproveDialog(true)}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Aprovar Selecionados
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowRejectDialog(true)}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Rejeitar Selecionados
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog de Aprovação */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Aprovação em Lote</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a aprovar {selectedDriverIds.length} motorista{selectedDriverIds.length !== 1 ? 's' : ''}. 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="approval-notes">Observações (opcional)</Label>
            <Textarea
              id="approval-notes"
              placeholder="Adicione observações sobre esta aprovação em lote..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkApprove}
              disabled={processing}
              className="bg-primary hover:bg-primary/90"
            >
              {processing ? 'Processando...' : 'Confirmar Aprovação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Rejeição */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Rejeição em Lote</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a rejeitar {selectedDriverIds.length} motorista{selectedDriverIds.length !== 1 ? 's' : ''}. 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Motivo da Rejeição *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Informe o motivo da rejeição em lote..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              required
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkReject}
              disabled={processing || !rejectionReason.trim()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {processing ? 'Processando...' : 'Confirmar Rejeição'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
