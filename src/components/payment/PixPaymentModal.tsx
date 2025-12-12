import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, CheckCircle, Upload, QrCode, Clock, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Dropzone } from "@/components/ui/dropzone";

interface PixPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  pixData: {
    key: string;
    recipient_name: string;
    amount: string;
    tracking_code: string;
    payload: string;
  };
  onPaymentComplete: () => void;
}

export const PixPaymentModal = ({
  open,
  onOpenChange,
  orderId,
  pixData,
  onPaymentComplete,
}: PixPaymentModalProps) => {
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState<string>("");
  const [showDropzone, setShowDropzone] = useState(false);

  // Proteção contra pixData nulo
  if (!pixData) {
    return null;
  }

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(pixData.payload);
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileSelect = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${orderId}_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(filePath);

      setProofUrl(urlData.publicUrl);

      // Atualizar pedido com URL do comprovante
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          operational_notes: `Comprovante PIX: ${urlData.publicUrl}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // Adicionar evento na timeline
      await supabase.from("tracking_events").insert({
        order_id: orderId,
        event_code: "PAYMENT_PROOF_SENT",
        event_description: "Comprovante de pagamento PIX enviado pelo cliente",
        event_timestamp: new Date().toISOString(),
        city: "N/A",
        state: "N/A",
        is_critical: false,
      });

      toast.success("Comprovante enviado com sucesso!");
      
      // Aguardar 2 segundos e fechar modal
      setTimeout(() => {
        onPaymentComplete();
        onOpenChange(false);
      }, 2000);
    } catch (error: any) {
      console.error("Error uploading proof:", error);
      toast.error("Erro ao enviar comprovante. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo (imagens e PDF)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Apenas imagens (JPG, PNG, WebP) ou PDF são aceitos");
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB");
      return;
    }

    await handleFileSelect(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl backdrop-blur-sm sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Pagamento PIX - {pixData.tracking_code}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Valor com destaque institucional */}
          <div className="text-center p-4 sm:p-6 bg-[#f0f7ff] dark:bg-primary/10 rounded-xl border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
            <p className="text-3xl sm:text-4xl font-bold text-primary">
              R$ {parseFloat(pixData.amount).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Favorecido: {pixData.recipient_name}
            </p>
          </div>

          {/* QR Code responsivo */}
          <div className="flex flex-col items-center gap-3 p-4 sm:p-6 border rounded-xl bg-card">
            <p className="text-sm font-medium text-center">Escaneie o QR Code com seu app bancário:</p>
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
              <QRCodeSVG 
                value={pixData.payload} 
                size={160}
                className="w-32 h-32 sm:w-48 sm:h-48"
              />
            </div>
          </div>

          {/* Chave PIX Copia e Cola */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ou copie o código PIX:</Label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-muted rounded-lg border font-mono text-xs break-all max-h-20 overflow-y-auto">
                {pixData.payload}
              </div>
              <Button
                onClick={handleCopyPixKey}
                variant={copied ? "default" : "outline"}
                size="default"
                className={`shrink-0 min-w-[100px] sm:min-w-[120px] transition-all duration-200 ${
                  copied ? "bg-green-500 hover:bg-green-600 text-white" : ""
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Instruções numeradas */}
          <div className="bg-muted/50 p-4 rounded-xl border">
            <p className="font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="text-primary">📋</span> Como pagar:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">1</span>
                <p className="text-sm text-muted-foreground">Abra o app do seu banco e escolha a opção PIX</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">2</span>
                <p className="text-sm text-muted-foreground">Escaneie o QR Code ou cole o código PIX copiado</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">3</span>
                <p className="text-sm text-muted-foreground">Confirme o pagamento e envie o comprovante abaixo</p>
              </div>
            </div>
          </div>

          {/* Upload de Comprovante com Dropzone */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              Enviar Comprovante de Pagamento
            </Label>
            
            {proofUrl ? (
              /* Estado: Aguardando Validação */
              <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
                  <span className="font-semibold text-amber-700 dark:text-amber-400">Aguardando Validação</span>
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Comprovante enviado com sucesso! Nossa equipe validará seu pagamento em breve.
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span className="text-xs text-amber-500">Processando...</span>
                </div>
              </div>
            ) : showDropzone ? (
              /* Dropzone expandida */
              <div className="space-y-2">
                <Dropzone
                  onFileSelect={handleFileSelect}
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  maxSize={5 * 1024 * 1024}
                  label="Arraste o comprovante aqui"
                  description="JPG, PNG, WebP ou PDF (máx. 5MB)"
                  uploading={uploading}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDropzone(false)}
                  className="w-full text-muted-foreground"
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              /* Botão para abrir dropzone */
              <Button
                onClick={() => setShowDropzone(true)}
                disabled={uploading}
                className="w-full py-6 shadow-md hover:shadow-lg transition-all duration-200"
                size="lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                Enviar Comprovante
              </Button>
            )}
            
            {/* Input hidden para fallback */}
            <input
              id="proof-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              onChange={handleUploadProof}
              className="hidden"
              disabled={uploading || !!proofUrl}
            />
          </div>

          {/* Nota de rodapé */}
          <p className="text-xs text-center text-muted-foreground pt-2 border-t">
            ⏱️ Seu frete será confirmado em até 2 horas após a validação manual pelo admin.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
