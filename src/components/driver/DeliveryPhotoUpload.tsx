import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, X, CheckCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";

interface DeliveryPhotoUploadProps {
  orderId: string;
  trackingCode: string;
  onPhotoUploaded: (photoUrl: string) => void;
  onCancel: () => void;
}

export const DeliveryPhotoUpload = ({ 
  orderId, 
  trackingCode, 
  onPhotoUploaded, 
  onCancel 
}: DeliveryPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem.");
      return;
    }

    try {
      // Comprimir imagem
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      };
      
      const compressedFile = await imageCompression(file, options);
      setSelectedFile(compressedFile);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Erro ao comprimir imagem:', error);
      toast.error("Erro ao processar imagem. Tente novamente.");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Selecione uma foto primeiro.");
      return;
    }

    setUploading(true);

    try {
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const fileExt = selectedFile.name.split('.').pop() || 'jpg';
      const fileName = `${orderId}/${timestamp}.${fileExt}`;

      // Upload para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('delivery-photos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('delivery-photos')
        .getPublicUrl(fileName);

      toast.success("Foto enviada com sucesso!");
      onPhotoUploaded(publicUrl);
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error("Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <Card className="border-2 border-amber-500 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Camera className="h-5 w-5 text-amber-600" />
          Foto de Comprovação de Entrega
        </CardTitle>
        <CardDescription>
          Tire uma foto do local de entrega ou do produto entregue para confirmar a conclusão.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview da foto */}
        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="Preview da foto de entrega" 
              className="w-full h-48 object-cover rounded-lg border"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleRemovePhoto}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Nenhuma foto selecionada
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                className="gap-2"
              >
                <Camera className="h-4 w-4" />
                Tirar Foto
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Galeria
              </Button>
            </div>
          </div>
        )}

        {/* Inputs ocultos */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Botões de ação */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Confirmar Entrega
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          A foto é obrigatória para confirmar a entrega. Ela ficará disponível para o embarcador.
        </p>
      </CardContent>
    </Card>
  );
};