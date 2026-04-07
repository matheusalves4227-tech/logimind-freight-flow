import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, X, Loader2, Eye, CheckCircle, AlertTriangle, ShieldCheck, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import imageCompression from "browser-image-compression";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface OCRExtractedData {
  nome_completo?: string;
  cpf?: string;
  numero_registro?: string;
  categoria?: string;
  validade?: string;
  data_emissao?: string;
  placa?: string;
  renavam?: string;
  marca_modelo?: string;
  ano_fabricacao?: string;
  cor?: string;
  [key: string]: string | undefined;
}

interface OCRResult {
  documentType: 'cnh' | 'crlv' | 'unknown';
  isValid: boolean;
  confidence: number;
  extractedData: OCRExtractedData;
  validationErrors: string[];
  validationWarnings: string[];
}

interface DocumentUploadProps {
  driverProfileId: string;
  documentType: string;
  label: string;
  required?: boolean;
  onUploadComplete?: (filePath: string, ocrData?: OCRResult) => void;
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
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showOcrDetails, setShowOcrDetails] = useState(false);
  const { toast } = useToast();

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/jpeg" as const,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch {
      return file;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: "O arquivo deve ter no máximo 10MB", variant: "destructive" });
        return;
      }
      
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({ title: "Tipo de arquivo inválido", description: "Apenas imagens (JPG, PNG) e PDF são permitidos", variant: "destructive" });
        return;
      }
      
      setFile(selectedFile);
      setOcrResult(null);
      
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  const runOCR = async (documentId: string, filePath: string) => {
    // Only run OCR for CNH and CRLV image documents
    const isOcrEligible = (documentType.includes('cnh') || documentType.includes('crlv')) && file?.type.startsWith('image/');
    if (!isOcrEligible) return;

    setOcrLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-document-ocr', {
        body: { documentId, filePath, documentType },
      });

      if (error) throw error;

      if (data?.result) {
        setOcrResult(data.result);
        
        if (data.result.isValid && data.result.confidence >= 70) {
          toast({
            title: "✅ Documento validado automaticamente",
            description: `${data.result.documentType.toUpperCase()} verificado com ${data.result.confidence}% de confiança`,
          });
        } else if (data.result.validationErrors.length > 0) {
          toast({
            title: "⚠️ Problemas encontrados no documento",
            description: data.result.validationErrors[0],
            variant: "destructive",
          });
        } else {
          toast({
            title: "📋 Documento analisado",
            description: `Confiança: ${data.result.confidence}%. Revisão manual pode ser necessária.`,
          });
        }

        onUploadComplete?.(filePath, data.result);
      }
    } catch (error: any) {
      console.error('OCR error:', error);
      toast({
        title: "OCR indisponível",
        description: "O documento foi enviado mas a validação automática falhou. Será revisado manualmente.",
      });
    } finally {
      setOcrLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      let fileToUpload = file;
      
      if (file.type.startsWith("image/")) {
        setUploadProgress(15);
        fileToUpload = await compressImage(file);
        setUploadProgress(30);
      }
      
      const fileExt = fileToUpload.type.startsWith("image/") ? "jpg" : file.name.split('.').pop();
      const fileName = `${driverProfileId}/${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `driver-documents/${fileName}`;

      setUploadProgress(50);
      
      const { error: uploadError } = await supabase.storage
        .from('driver-documents')
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;
      
      setUploadProgress(70);

      const { data: docData, error: dbError } = await supabase
        .from('driver_documents')
        .insert({
          driver_profile_id: driverProfileId,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
        })
        .select('id')
        .single();

      if (dbError) throw dbError;

      setUploadProgress(85);
      setUploaded(true);
      
      toast({
        title: "Documento enviado com sucesso",
        description: "Iniciando validação automática com OCR...",
      });

      setUploadProgress(100);

      // Run OCR validation automatically
      if (docData?.id) {
        await runOCR(docData.id, filePath);
      }

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({ title: "Erro ao enviar documento", description: error.message || "Tente novamente", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setUploaded(false);
    setPreviewUrl(null);
    setUploadProgress(0);
    setOcrResult(null);
  };

  const getOcrStatusBadge = () => {
    if (ocrLoading) {
      return (
        <Badge variant="secondary" className="animate-pulse">
          <Brain className="h-3 w-3 mr-1" />
          Analisando com IA...
        </Badge>
      );
    }
    if (!ocrResult) return null;

    if (ocrResult.isValid && ocrResult.confidence >= 70) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Validado ({ocrResult.confidence}%)
        </Badge>
      );
    }
    if (ocrResult.validationErrors.length > 0) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Problemas encontrados
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-amber-600 border-amber-300">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Revisão necessária
      </Badge>
    );
  };

  const renderOcrExtractedData = () => {
    if (!ocrResult) return null;
    const labels: Record<string, string> = {
      nome_completo: 'Nome Completo',
      cpf: 'CPF',
      numero_registro: 'Nº Registro',
      categoria: 'Categoria',
      validade: 'Validade',
      data_emissao: 'Data Emissão',
      orgao_emissor: 'Órgão Emissor',
      placa: 'Placa',
      renavam: 'RENAVAM',
      marca_modelo: 'Marca/Modelo',
      ano_fabricacao: 'Ano',
      cor: 'Cor',
      chassi: 'Chassi',
    };

    const entries = Object.entries(ocrResult.extractedData).filter(([, v]) => v && v.trim() !== '');

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {entries.map(([key, value]) => (
            <div key={key} className="text-sm">
              <span className="text-muted-foreground">{labels[key] || key}:</span>{' '}
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>

        {ocrResult.validationErrors.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">Erros:</p>
            {ocrResult.validationErrors.map((err, i) => (
              <p key={i} className="text-xs text-destructive">• {err}</p>
            ))}
          </div>
        )}

        {ocrResult.validationWarnings.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-600">Avisos:</p>
            {ocrResult.validationWarnings.map((warn, i) => (
              <p key={i} className="text-xs text-amber-600">• {warn}</p>
            ))}
          </div>
        )}
      </div>
    );
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
                    <Button size="sm" variant="outline" onClick={() => setShowPreview(true)} disabled={uploading}>
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar
                    </Button>
                  )}
                  <Button size="sm" onClick={handleUpload} disabled={uploading}>
                    {uploading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
                    ) : (
                      <><Upload className="mr-2 h-4 w-4" />Enviar</>
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleRemove} disabled={uploading}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {uploading && uploadProgress > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progresso</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
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
              <img src={previewUrl} alt="Preview" className="w-full h-auto rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* OCR Details Dialog */}
      <Dialog open={showOcrDetails} onOpenChange={setShowOcrDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Dados extraídos por OCR
            </DialogTitle>
          </DialogHeader>
          {renderOcrExtractedData()}
        </DialogContent>
      </Dialog>

      {uploaded && (
        <Card className={`border ${ocrResult?.isValid && ocrResult.confidence >= 70 ? 'border-emerald-500' : ocrResult?.validationErrors?.length ? 'border-destructive' : 'border-green-500'}`}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {ocrResult?.isValid && ocrResult.confidence >= 70 ? (
                    <ShieldCheck className="h-8 w-8 text-emerald-500" />
                  ) : ocrLoading ? (
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {ocrLoading ? 'Validando documento com IA...' : 'Documento enviado'}
                    </p>
                    <p className="text-xs text-muted-foreground">{file?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getOcrStatusBadge()}
                  {ocrResult && (
                    <Button size="sm" variant="ghost" onClick={() => setShowOcrDetails(true)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={handleRemove}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Inline OCR summary */}
              {ocrResult && ocrResult.isValid && ocrResult.confidence >= 70 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 text-sm">
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {ocrResult.extractedData.nome_completo && (
                      <p><span className="text-muted-foreground">Nome:</span> {ocrResult.extractedData.nome_completo}</p>
                    )}
                    {ocrResult.extractedData.numero_registro && (
                      <p><span className="text-muted-foreground">Registro:</span> {ocrResult.extractedData.numero_registro}</p>
                    )}
                    {ocrResult.extractedData.categoria && (
                      <p><span className="text-muted-foreground">Categoria:</span> {ocrResult.extractedData.categoria}</p>
                    )}
                    {ocrResult.extractedData.validade && (
                      <p><span className="text-muted-foreground">Validade:</span> {ocrResult.extractedData.validade}</p>
                    )}
                    {ocrResult.extractedData.placa && (
                      <p><span className="text-muted-foreground">Placa:</span> {ocrResult.extractedData.placa}</p>
                    )}
                    {ocrResult.extractedData.marca_modelo && (
                      <p><span className="text-muted-foreground">Veículo:</span> {ocrResult.extractedData.marca_modelo}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
