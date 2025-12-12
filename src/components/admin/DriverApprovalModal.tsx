import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { CheckCircle2, XCircle, FileText, ExternalLink, Loader2 } from 'lucide-react';

interface DriverApprovalModalProps {
  driver: {
    id: string;
    full_name: string;
    cpf: string;
    phone: string;
    email: string;
  };
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface DriverDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  is_verified: boolean;
  expiry_date: string | null;
}

interface DriverCNH {
  cnh_number: string;
  cnh_category: string;
  expiry_date: string;
  issue_date: string;
}

export const DriverApprovalModal = ({ driver, open, onClose, onComplete }: DriverApprovalModalProps) => {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [cnhData, setCnhData] = useState<DriverCNH | null>(null);
  
  // Checklist de validação
  const [checks, setChecks] = useState({
    rntrc: false,
    cnhValidity: false,
    backgroundCheck: false,
  });
  
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (open) {
      fetchDriverDetails();
    }
  }, [open, driver.id]);

  const fetchDriverDetails = async () => {
    setLoading(true);
    try {
      // Buscar documentos
      const { data: docs, error: docsError } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('driver_profile_id', driver.id);

      if (docsError) throw docsError;
      setDocuments(docs || []);

      // Buscar dados da CNH
      const { data: cnh, error: cnhError } = await supabase
        .from('driver_cnh_data')
        .select('*')
        .eq('driver_profile_id', driver.id)
        .single();

      if (cnhError && cnhError.code !== 'PGRST116') {
        console.error('Erro ao buscar CNH:', cnhError);
      } else if (cnh) {
        setCnhData(cnh);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do motorista:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar informações do motorista',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDocumentUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('driver-documents')
        .createSignedUrl(filePath, 3600); // URL válida por 1 hora

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Erro ao gerar URL do documento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao acessar documento',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleViewDocument = async (filePath: string) => {
    const url = await getDocumentUrl(filePath);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleApprove = async () => {
    // Validar checklist
    if (!checks.rntrc || !checks.cnhValidity || !checks.backgroundCheck) {
      toast({
        title: 'Atenção',
        description: 'Complete todas as verificações antes de aprovar',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('approve-driver', {
        body: {
          driver_profile_id: driver.id,
          action: 'approve',
          notes: notes || null,
        },
      });

      if (error) throw error;

      // Registrar auditoria
      await logAction({
        action: 'driver_approval',
        metadata: {
          driver_id: driver.id,
          driver_name: driver.full_name,
          driver_cpf: driver.cpf,
          approval_notes: notes,
          checks_validated: checks,
          approved_at: new Date().toISOString(),
        },
      });

      toast({
        title: 'Sucesso',
        description: `Motorista ${driver.full_name} aprovado com sucesso!`,
      });

      onComplete();
    } catch (error) {
      console.error('Erro ao aprovar motorista:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao aprovar motorista. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Atenção',
        description: 'Informe o motivo da rejeição',
        variant: 'destructive',
      });
      return;
    }

    if (rejectionReason.trim().length < 10) {
      toast({
        title: 'Motivo muito curto',
        description: 'O motivo da rejeição deve ter pelo menos 10 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('approve-driver', {
        body: {
          driver_profile_id: driver.id,
          action: 'reject',
          rejection_reason: rejectionReason,
        },
      });

      if (error) {
        // Parse error message from edge function
        let errorMessage = 'Erro ao rejeitar motorista. Tente novamente.';
        if (error.message) {
          try {
            const parsed = JSON.parse(error.message);
            if (parsed.details?.rejection_reason) {
              errorMessage = parsed.details.rejection_reason[0];
            } else if (parsed.error) {
              errorMessage = parsed.error;
            }
          } catch {
            errorMessage = error.message;
          }
        }
        throw new Error(errorMessage);
      }

      // Registrar auditoria
      await logAction({
        action: 'driver_rejection',
        reason: rejectionReason,
        metadata: {
          driver_id: driver.id,
          driver_name: driver.full_name,
          driver_cpf: driver.cpf,
          rejected_at: new Date().toISOString(),
        },
      });

      toast({
        title: 'Motorista Rejeitado',
        description: `Cadastro de ${driver.full_name} foi rejeitado`,
      });

      onComplete();
    } catch (error: any) {
      console.error('Erro ao rejeitar motorista:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao rejeitar motorista. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'CNH': 'CNH - Carteira Nacional de Habilitação',
      'RNTRC': 'RNTRC - Registro Nacional de Transportadores',
      'COMPROVANTE_RESIDENCIA': 'Comprovante de Residência',
      'ANTECEDENTES': 'Certidão de Antecedentes Criminais',
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Análise de Documentação</DialogTitle>
          <DialogDescription>
            Revise os documentos e informações do motorista antes de aprovar ou rejeitar o cadastro
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Dados Pessoais */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Dados Pessoais
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Nome:</span>
                  <p className="font-medium">{driver.full_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CPF:</span>
                  <p className="font-medium">{driver.cpf}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">E-mail:</span>
                  <p className="font-medium">{driver.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Telefone:</span>
                  <p className="font-medium">{driver.phone}</p>
                </div>
              </div>
            </div>

            {/* Dados CNH */}
            {cnhData && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">CNH</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Número:</span>
                    <p className="font-medium">{cnhData.cnh_number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Categoria:</span>
                    <Badge variant="outline">{cnhData.cnh_category}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Emissão:</span>
                    <p className="font-medium">
                      {new Date(cnhData.issue_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Validade:</span>
                    <p className={`font-medium ${
                      new Date(cnhData.expiry_date) < new Date() 
                        ? 'text-destructive' 
                        : 'text-secondary'
                    }`}>
                      {new Date(cnhData.expiry_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Documentos */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">Documentos Enviados</h3>
              {documents.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum documento enviado</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{getDocumentTypeLabel(doc.document_type)}</p>
                          <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDocument(doc.file_path)}
                      >
                        Ver Documento
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checklist de Validação */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">Checklist de Validação</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rntrc"
                    checked={checks.rntrc}
                    onCheckedChange={(checked) => 
                      setChecks({ ...checks, rntrc: checked as boolean })
                    }
                  />
                  <Label htmlFor="rntrc" className="text-sm cursor-pointer">
                    RNTRC ativo e válido
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cnhValidity"
                    checked={checks.cnhValidity}
                    onCheckedChange={(checked) => 
                      setChecks({ ...checks, cnhValidity: checked as boolean })
                    }
                  />
                  <Label htmlFor="cnhValidity" className="text-sm cursor-pointer">
                    CNH válida com categoria adequada
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="backgroundCheck"
                    checked={checks.backgroundCheck}
                    onCheckedChange={(checked) => 
                      setChecks({ ...checks, backgroundCheck: checked as boolean })
                    }
                  />
                  <Label htmlFor="backgroundCheck" className="text-sm cursor-pointer">
                    Antecedentes criminais limpos
                  </Label>
                </div>
              </div>
            </div>

            {/* Área de Notas */}
            <div>
              <Label htmlFor="notes">Observações (Opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Adicione observações sobre a aprovação..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            {/* Área de Rejeição */}
            <div>
              <Label htmlFor="rejection">Motivo da Rejeição (se aplicável)</Label>
              <Textarea
                id="rejection"
                placeholder="Descreva o motivo caso vá rejeitar o cadastro..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleApprove}
                disabled={processing || !checks.rntrc || !checks.cnhValidity || !checks.backgroundCheck}
                className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Aprovar Motorista
              </Button>
              
              <Button
                onClick={handleReject}
                disabled={processing}
                variant="destructive"
                className="flex-1"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Rejeitar Motorista
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
