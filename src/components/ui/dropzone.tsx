import { useState, useCallback } from "react";
import { Upload, FileText, X, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  description?: string;
  uploading?: boolean;
  uploaded?: boolean;
  uploadedFileName?: string;
  onRemove?: () => void;
  className?: string;
}

export const Dropzone = ({
  onFileSelect,
  accept = "image/jpeg,image/jpg,image/png,application/pdf",
  maxSize = 10,
  label = "Arraste e solte ou clique para selecionar",
  description = "PDF, JPG ou PNG (máx. 10MB)",
  uploading = false,
  uploaded = false,
  uploadedFileName,
  onRemove,
  className,
}: DropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): boolean => {
    setError(null);
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo ${maxSize}MB`);
      return false;
    }
    
    // Check file type
    const allowedTypes = accept.split(",").map(t => t.trim());
    if (!allowedTypes.includes(file.type)) {
      setError("Tipo de arquivo não permitido");
      return false;
    }
    
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  }, [onFileSelect, accept, maxSize]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  }, [onFileSelect, accept, maxSize]);

  if (uploaded && uploadedFileName) {
    return (
      <div className={cn(
        "relative rounded-xl border-2 border-secondary bg-secondary/5 p-4 transition-all duration-300",
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
              <CheckCircle2 className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="font-medium text-secondary">Documento enviado</p>
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                {uploadedFileName}
              </p>
            </div>
          </div>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (uploading) {
    return (
      <div className={cn(
        "relative rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 transition-all duration-300",
        className
      )}>
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm font-medium text-primary">Enviando arquivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative rounded-xl border-2 border-dashed p-6 transition-all duration-300 cursor-pointer group",
        isDragging
          ? "border-primary bg-primary/10 scale-[1.02]"
          : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30",
        error && "border-destructive/50 bg-destructive/5",
        className
      )}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      
      <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
        <div className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300",
          isDragging
            ? "bg-primary/20 scale-110"
            : "bg-muted group-hover:bg-primary/10"
        )}>
          <Upload className={cn(
            "h-7 w-7 transition-colors duration-300",
            isDragging
              ? "text-primary"
              : "text-muted-foreground group-hover:text-primary"
          )} />
        </div>
        
        <div>
          <p className={cn(
            "text-sm font-medium transition-colors duration-300",
            isDragging ? "text-primary" : "text-foreground"
          )}>
            {label}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        </div>
        
        {error && (
          <p className="text-xs text-destructive font-medium">{error}</p>
        )}
      </div>
    </div>
  );
};
