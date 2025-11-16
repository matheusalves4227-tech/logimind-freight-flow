import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, User, Mail, Phone, MapPin, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";

interface DriverProfileProps {
  driverProfile: any;
}

export const DriverProfile = ({ driverProfile }: DriverProfileProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("driver_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      toast({
        title: "Erro ao carregar perfil",
        description: "Não foi possível carregar os dados do perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (url: string | null) => {
    setProfile((prev: any) => ({ ...prev, foto_perfil_url: url }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Foto de Perfil
          </CardTitle>
          <CardDescription>
            Sua foto ajuda na identificação durante a coleta de cargas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfilePhotoUpload
            driverProfileId={profile?.id}
            currentPhotoUrl={profile?.foto_perfil_url}
            onUploadComplete={handlePhotoUpload}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Informações do Perfil
          </CardTitle>
          <CardDescription>
            Seus dados cadastrados na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                Nome Completo
              </Label>
              <Input value={profile?.full_name || ""} disabled />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                E-mail
              </Label>
              <Input value={profile?.email || ""} disabled />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                Telefone
              </Label>
              <Input value={profile?.phone || ""} disabled />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                WhatsApp
              </Label>
              <Input value={profile?.whatsapp || ""} disabled />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Label className="flex items-center gap-2 text-muted-foreground mb-3">
              <MapPin className="h-4 w-4" />
              Endereço
            </Label>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">CEP</Label>
                <Input value={profile?.address_cep || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Rua</Label>
                <Input value={profile?.address_street || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Número</Label>
                <Input value={profile?.address_number || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Bairro</Label>
                <Input value={profile?.address_neighborhood || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Cidade</Label>
                <Input value={profile?.address_city || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Estado</Label>
                <Input value={profile?.address_state || ""} disabled />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Para atualizar seus dados cadastrais, entre em contato com o suporte.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
