import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Download, Loader2, Brain, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentViewerProps {
  document: {
    id: string;
    document_type: string;
    file_name: string;
    file_path: string;
    file_type: string | null;
    driver_name: string;
    driver_cpf: string;
    is_verified?: boolean | null;
    verification_notes?: string | null;
  };
  open: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const DocumentViewer = ({
  document,
  open,
  onClose,
  onApprove,
  onReject,
}: DocumentViewerProps) => {
  const { toast } = useToast();
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrData, setOcrData] = useState<any>(null);

  useEffect(() => {
    if (open && document) {
      loadDocument();
      parseOcrNotes();
    }
  }, [open, document]);

  const parseOcrNotes = () => {
    if (document.verification_notes) {
      try {
        const parsed = JSON.parse(document.verification_notes);
        setOcrData(parsed);
      } catch {
        setOcrData(null);
      }
    } else {
      setOcrData(null);
    }
  };

  const loadDocument = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage
        .from('driver-documents')
        .createSignedUrl(document.file_path, 3600);

      if (error) throw error;
      setDocumentUrl(data.signedUrl);
    } catch (error) {
      console.error('Erro ao carregar documento:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar documento', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRunOCR = async () => {
    setOcrRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-document-ocr', {
        body: {
          documentId: document.id,
          filePath: document.file_path,
          documentType: document.document_type,
        },
      });

      if (error) throw error;

      if (data?.result) {
        setOcrData({
          ocr_confidence: data.result.confidence,
          ocr_document_type: data.result.documentType,
          extracted_data: data.result.extractedData,
          errors: data.result.validationErrors,
          warnings: data.result.validationWarnings,
          validated_at: new Date().toISOString(),
          validated_by: 'ocr_auto',
        });

        toast({
          title: data.result.isValid ? '✅ Documento validado' : '⚠️ Problemas encontrados',
          description: `Confiança: ${data.result.confidence}%`,
          variant: data.result.isValid ? 'default' : 'destructive',
        });
      }
    } catch (error: any) {
      toast({ title: 'Erro no OCR', description: error.message, variant: 'destructive' });
    } finally {
      setOcrRunning(false);
    }
  };

  const handleDownload = () => {
    if (documentUrl) window.open(documentUrl, '_blank');
  };

  const handleApprove = () => {
    onApprove(document.id);
    onClose();
  };

  const handleReject = () => {
    onReject(document.id);
    onClose();
  };

  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      cnh_frente: 'CNH - Frente',
      cnh_verso: 'CNH - Verso',
      crlv: 'CRLV',
      comprovante_residencia: 'Comprovante de Residência',
      foto_veiculo: 'Foto do Veículo',
    };
    return labels[type] || type;
  };

  const isPDF = document.file_type === 'application/pdf' || document.file_name.endsWith('.pdf');
  const isImage = document.file_type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(document.file_name);

  const extractedLabels: Record<string, string> = {
    nome_completo: 'Nome', cpf: 'CPF', numero_registro: 'Registro', categoria: 'Categoria',
    validade: 'Validade', data_emissao: 'Emissão', orgao_emissor: 'Órgão',
    placa: 'Placa', renavam: 'RENAVAM', marca_modelo: 'Marca/Modelo',
    ano_fabricacao: 'Ano', cor: 'Cor', chassi: 'Chassi',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getDocumentTypeLabel(document.document_type)}
            {document.is_verified && (
              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Verificado por OCR
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Motorista: {document.driver_name} | CPF: {document.driver_cpf}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Document preview */}
          <div className="flex-1 overflow-auto border rounded-lg bg-muted/20">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : documentUrl ? (
              <>
                {isPDF ? (
                  <iframe src={documentUrl} className="w-full h-full" title={document.file_name} />
                ) : isImage ? (
                  <div className="flex items-center justify-center p-4 h-full">
                    <img src={documentUrl} alt={document.file_name} className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Button onClick={handleDownload}><Download className="h-4 w-4 mr-2" />Fazer Download</Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-destructive">Erro ao carregar documento</p>
              </div>
            )}
          </div>

          {/* OCR panel */}
          <div className="w-80 border rounded-lg p-4 overflow-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-1">
                <Brain className="h-4 w-4" /> Validação OCR
              </h3>
              <Button size="sm" variant="outline" onClick={handleRunOCR} disabled={ocrRunning}>
                {ocrRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              </Button>
            </div>

            {ocrRunning && (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Analisando documento com IA...
              </div>
            )}

            {ocrData && !ocrRunning && (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant={ocrData.ocr_confidence >= 70 ? 'default' : 'secondary'}>
                    {ocrData.ocr_confidence}% confiança
                  </Badge>
                  <Badge variant="outline">{ocrData.ocr_document_type?.toUpperCase()}</Badge>
                </div>

                {ocrData.extracted_data && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Dados Extraídos</p>
                    {Object.entries(ocrData.extracted_data)
                      .filter(([, v]) => v && String(v).trim() !== '')
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{extractedLabels[key] || key}</span>
                          <span className="font-medium text-right max-w-[60%] truncate">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                )}

                {ocrData.errors?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-destructive">Erros</p>
                    {ocrData.errors.map((e: string, i: number) => (
                      <p key={i} className="text-xs text-destructive flex items-start gap-1">
                        <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> {e}
                      </p>
                    ))}
                  </div>
                )}

                {ocrData.warnings?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-amber-600">Avisos</p>
                    {ocrData.warnings.map((w: string, i: number) => (
                      <p key={i} className="text-xs text-amber-600">• {w}</p>
                    ))}
                  </div>
                )}

                {ocrData.validated_at && (
                  <p className="text-[10px] text-muted-foreground">
                    Validado em {new Date(ocrData.validated_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </>
            )}

            {!ocrData && !ocrRunning && (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Nenhuma análise OCR disponível.
                <br />
                Clique em <RefreshCw className="h-3 w-3 inline" /> para analisar.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={!documentUrl}>
            <Download className="h-4 w-4 mr-2" />Download
          </Button>
          <Button variant="destructive" onClick={handleReject}>
            <XCircle className="h-4 w-4 mr-2" />Rejeitar
          </Button>
          <Button onClick={handleApprove}>
            <CheckCircle className="h-4 w-4 mr-2" />Aprovar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
