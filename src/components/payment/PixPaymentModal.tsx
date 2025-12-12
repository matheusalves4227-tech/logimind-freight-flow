import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, CheckCircle, Upload, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

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

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${orderId}_${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-6 h-6 text-primary" />
            Pagamento via PIX - Pedido {pixData.tracking_code}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Valor */}
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Valor a pagar</p>
            <p className="text-3xl font-bold text-primary">
              R$ {parseFloat(pixData.amount).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-4 p-6 border rounded-lg">
            <p className="text-sm font-medium">Escaneie o QR Code com seu banco:</p>
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={pixData.payload} size={200} />
            </div>
          </div>

          {/* Chave PIX Copia e Cola */}
          <div className="space-y-2">
            <Label>Ou copie o código PIX:</Label>
            <div className="flex gap-2">
              <Textarea
                readOnly
                value={pixData.payload}
                className="font-mono text-xs resize-none h-20"
              />
              <Button
                onClick={handleCopyPixKey}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Favorecido: {pixData.recipient_name}
            </p>
          </div>

          {/* Upload de Comprovante */}
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="proof-upload" className="text-base font-semibold">
              Após realizar o pagamento, envie o comprovante:
            </Label>
            <div className="flex gap-2">
              <input
                id="proof-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                onChange={handleUploadProof}
                className="hidden"
                disabled={uploading || !!proofUrl}
              />
              <Button
                onClick={() => document.getElementById("proof-upload")?.click()}
                disabled={uploading || !!proofUrl}
                className="w-full"
                variant={proofUrl ? "outline" : "default"}
              >
                {uploading ? (
                  "Enviando..."
                ) : proofUrl ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Comprovante Enviado
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar Comprovante
                  </>
                )}
              </Button>
            </div>
            {proofUrl && (
              <p className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Seu pedido está aguardando confirmação do pagamento pela nossa equipe.
              </p>
            )}
          </div>

          {/* Instruções */}
          <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded">
            <p className="font-semibold">⚠️ Importante:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Realize o pagamento usando seu app bancário</li>
              <li>Envie o comprovante após concluir a transferência</li>
              <li>Seu frete será confirmado em até 2 horas após validação</li>
              <li>Você receberá notificação por e-mail quando aprovado</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
