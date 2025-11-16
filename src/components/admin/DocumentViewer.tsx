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
import { CheckCircle, XCircle, Download, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    if (open && document) {
      loadDocument();
    }
  }, [open, document]);

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
      toast({
        title: 'Erro',
        description: 'Erro ao carregar documento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
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
  const isImage = document.file_type?.startsWith('image/') || 
                  /\.(jpg|jpeg|png|gif|webp)$/i.test(document.file_name);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{getDocumentTypeLabel(document.document_type)}</DialogTitle>
          <DialogDescription>
            Motorista: {document.driver_name} | CPF: {document.driver_cpf}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-lg bg-muted/20">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : documentUrl ? (
            <>
              {isPDF ? (
                <iframe
                  src={documentUrl}
                  className="w-full h-full"
                  title={document.file_name}
                />
              ) : isImage ? (
                <div className="flex items-center justify-center p-4 h-full">
                  <img
                    src={documentUrl}
                    alt={document.file_name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      Visualização não disponível para este tipo de arquivo
                    </p>
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Fazer Download
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-destructive">Erro ao carregar documento</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={!documentUrl}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="destructive" onClick={handleReject}>
            <XCircle className="h-4 w-4 mr-2" />
            Rejeitar
          </Button>
          <Button onClick={handleApprove}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprovar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
