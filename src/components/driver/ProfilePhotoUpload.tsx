import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import imageCompression from "browser-image-compression";

interface ProfilePhotoUploadProps {
  driverProfileId?: string;
  currentPhotoUrl?: string | null;
  onUploadComplete?: (url: string) => void;
}

export const ProfilePhotoUpload = ({
  driverProfileId,
  currentPhotoUrl,
  onUploadComplete,
}: ProfilePhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Por favor, envie uma imagem nos formatos JPG, PNG ou WEBP.",
        variant: "destructive",
      });
      return false;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 10MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: "image/jpeg",
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error("Erro ao comprimir imagem:", error);
      throw error;
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Compress image
      const compressedFile = await compressImage(file);

      // Generate unique file name
      const fileExt = "jpg"; // Always save as JPG after compression
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Delete old photo if exists
      if (photoUrl) {
        const oldPath = photoUrl.split("/").slice(-2).join("/");
        await supabase.storage.from("driver-profiles").remove([oldPath]);
      }

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("driver-profiles")
        .upload(fileName, compressedFile, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("driver-profiles")
        .getPublicUrl(uploadData.path);

      setPhotoUrl(publicUrl);
      setPreviewUrl(null);

      // Update driver profile if ID is provided
      if (driverProfileId) {
        const { error: updateError } = await supabase
          .from("driver_profiles")
          .update({ foto_perfil_url: publicUrl })
          .eq("id", driverProfileId);

        if (updateError) throw updateError;
      }

      toast({
        title: "Foto enviada com sucesso!",
        description: "Sua foto de perfil foi atualizada.",
      });

      onUploadComplete?.(publicUrl);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro ao enviar foto",
        description: "Não foi possível enviar a foto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!photoUrl) return;

    try {
      const oldPath = photoUrl.split("/").slice(-2).join("/");
      await supabase.storage.from("driver-profiles").remove([oldPath]);

      if (driverProfileId) {
        await supabase
          .from("driver_profiles")
          .update({ foto_perfil_url: null })
          .eq("id", driverProfileId);
      }

      setPhotoUrl(null);
      setPreviewUrl(null);

      toast({
        title: "Foto removida",
        description: "Sua foto de perfil foi removida.",
      });

      onUploadComplete?.(null);
    } catch (error) {
      console.error("Erro ao remover foto:", error);
      toast({
        title: "Erro ao remover foto",
        description: "Não foi possível remover a foto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-32 w-32">
          <AvatarImage src={previewUrl || photoUrl || undefined} alt="Foto de perfil" />
          <AvatarFallback className="bg-muted">
            <Camera className="h-12 w-12 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        
        {(photoUrl || previewUrl) && (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          className="relative"
        >
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleUpload}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {photoUrl ? "Alterar Foto" : "Adicionar Foto"}
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Formatos aceitos: JPG, PNG, WEBP. Tamanho máximo: 10MB.
        <br />
        A imagem será comprimida automaticamente.
      </p>
    </div>
  );
};
