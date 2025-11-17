import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, X, Loader2, Eye, ZoomIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import imageCompression from "browser-image-compression";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DocumentUploadProps {
  driverProfileId: string;
  documentType: string;
  label: string;
  required?: boolean;
  onUploadComplete?: (filePath: string) => void;
}

export const DocumentUpload = ({
  driverProfileId,
  documentType,
  label,
  required = false,
  onUploadComplete,
}: DocumentUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 0.5, // Target 500KB
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/jpeg",
    };

    try {
      const compressedFile = await imageCompression(file, options);
      console.log(`Compressão: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`);
      return compressedFile;
    } catch (error) {
      console.error("Erro ao comprimir imagem:", error);
      return file; // Return original if compression fails
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validação de tamanho (máx 10MB antes da compressão)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB",
          variant: "destructive",
        });
        return;
      }
      
      // Validação de tipo
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Apenas imagens (JPG, PNG) e PDF são permitidos",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
      
      // Generate preview for images
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      let fileToUpload = file;
      
      // Compress image if it's an image file
      if (file.type.startsWith("image/")) {
        setUploadProgress(20);
        toast({
          title: "Comprimindo imagem...",
          description: "Otimizando arquivo para upload",
        });
        fileToUpload = await compressImage(file);
        setUploadProgress(40);
      }
      
      // Gera nome único para o arquivo
      const fileExt = fileToUpload.type.startsWith("image/") ? "jpg" : file.name.split('.').pop();
      const fileName = `${driverProfileId}/${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `driver-documents/${fileName}`;

      setUploadProgress(60);
      
      // Upload para o storage
      const { error: uploadError } = await supabase.storage
        .from('driver-documents')
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;
      
      setUploadProgress(80);

      // Registra o documento na tabela
      const { error: dbError } = await supabase
        .from('driver_documents')
        .insert({
          driver_profile_id: driverProfileId,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
        });

      if (dbError) throw dbError;

      setUploadProgress(100);
      setUploaded(true);
      setPreviewUrl(null);
      
      toast({
        title: "Documento enviado com sucesso",
        description: "Seu documento foi enviado e será verificado em breve",
      });

      onUploadComplete?.(filePath);
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro ao enviar documento",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setUploaded(false);
    setPreviewUrl(null);
    setUploadProgress(0);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={documentType}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      
      {!file && !uploaded && (
        <div className="flex items-center gap-2">
          <Input
            id={documentType}
            type="file"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>
      )}

      {file && !uploaded && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {previewUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPreview(true)}
                      disabled={uploading}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Enviar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRemove}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {uploading && uploadProgress > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progresso do upload</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Documento</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="relative">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-auto rounded-lg"
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Use o zoom do navegador (Ctrl/Cmd + ou -) para ampliar
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {uploaded && (
        <Card className="border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-500">
                    Documento enviado com sucesso
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {file?.name}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
