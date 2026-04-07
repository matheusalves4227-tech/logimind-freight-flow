import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";

interface UserAvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  onUploadComplete: (newUrl: string) => void;
}

export const UserAvatarUpload = ({ userId, currentAvatarUrl, onUploadComplete }: UserAvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WEBP.");
      return false;
    }

    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return false;
    }

    return true;
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };

    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error("Erro ao comprimir imagem:", error);
      return file;
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) return;

    try {
      setUploading(true);

      const compressedFile = await compressImage(file);

      if (avatarUrl) {
        const oldPath = avatarUrl.split("/").pop();
        if (oldPath) {
          await supabase.storage.from("user-avatars").remove([`${userId}/${oldPath}`]);
        }
      }

      const fileExt = compressedFile.name.split(".").pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("user-avatars")
        .upload(fileName, compressedFile, {
          upsert: true,
          contentType: compressedFile.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("user-avatars")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setPreviewUrl(null);
      onUploadComplete(publicUrl);
      toast.success("Foto de perfil atualizada!");
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao atualizar foto de perfil.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!avatarUrl) return;

    try {
      setUploading(true);

      const oldPath = avatarUrl.split("/").pop();
      if (oldPath) {
        await supabase.storage.from("user-avatars").remove([`${userId}/${oldPath}`]);
      }

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("user_id", userId);

      if (error) throw error;

      setAvatarUrl(null);
      setPreviewUrl(null);
      onUploadComplete("");
      toast.success("Foto removida com sucesso!");
    } catch (error) {
      console.error("Erro ao remover foto:", error);
      toast.error("Erro ao remover foto de perfil.");
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = previewUrl || avatarUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar className="h-24 w-24 border-2 border-border shadow-md">
        <AvatarImage src={displayUrl || ""} alt="Avatar" />
        <AvatarFallback className="text-2xl bg-primary/10 text-primary font-semibold">
          {userId.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          className="relative h-8 text-xs"
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            disabled={uploading}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {uploading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Camera className="mr-1.5 h-3.5 w-3.5" />
          )}
          {uploading ? "Enviando..." : "Alterar Foto"}
        </Button>
        
        {displayUrl && !uploading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-8 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Remover
          </Button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground/70 text-center">
        JPG, PNG ou WEBP · Máx 5MB
      </p>
    </div>
  );
};
