import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { UserAvatarUpload } from "@/components/profile/UserAvatarUpload";
import { Loader2, Save, User, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCNPJ } from "@/lib/validators";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
    company_name: "",
    cnpj: "",
  });

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  const checkAuthAndLoadProfile = async () => {
    try {
      setLoading(true);
      
      // Verificar se o usuário está autenticado
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Você precisa estar logado para acessar esta página.");
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
      await loadProfile(session.user.id);
    } catch (error: any) {
      console.error("Erro ao verificar autenticação:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (userId: string) => {
    try {

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || "",
          company_name: data.company_name || "",
          cnpj: data.cnpj || "",
        });
      }
    } catch (error: any) {
      console.error("Erro ao carregar perfil:", error);
      toast.error("Erro ao carregar perfil.");
    }
  };

  const handleSave = async () => {
    if (!profile.full_name.trim()) {
      toast.error("Nome completo é obrigatório.");
      return;
    }

    try {
      setSaving(true);

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingProfile) {
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: profile.full_name,
            phone: profile.phone,
            company_name: profile.company_name,
            cnpj: profile.cnpj,
          })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .insert({
            user_id: userId,
            full_name: profile.full_name,
            phone: profile.phone,
            company_name: profile.company_name,
            cnpj: profile.cnpj,
          });

        if (error) throw error;
      }

      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      toast.error("Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUploadComplete = (newUrl: string) => {
    setProfile(prev => ({ ...prev, avatar_url: newUrl }));
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "EXCLUIR MINHA CONTA") {
      toast.error("Digite exatamente 'EXCLUIR MINHA CONTA' para confirmar.");
      return;
    }

    try {
      setDeleting(true);
      
      const { error } = await supabase.functions.invoke('delete-user-account', {
        body: { 
          userId,
          reason: deleteReason || "Não fornecido",
          userAgent: navigator.userAgent
        }
      });

      if (error) throw error;

      toast.success("Conta excluída com sucesso. Você será redirecionado.");
      
      // Fazer logout e redirecionar
      await supabase.auth.signOut();
      setTimeout(() => navigate("/"), 1500);
    } catch (error: any) {
      console.error("Erro ao excluir conta:", error);
      toast.error("Erro ao excluir conta. Por favor, tente novamente.");
    } finally {
      setDeleting(false);
      setShowConfirmDialog(false);
      setConfirmText("");
      setDeleteReason("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8 text-primary" />
          Meu Perfil
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas informações pessoais e preferências da conta
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
            <CardDescription>
              Atualize sua foto de perfil para personalizar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <UserAvatarUpload
              userId={userId}
              currentAvatarUrl={profile.avatar_url}
              onUploadComplete={handleAvatarUploadComplete}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize seus dados pessoais e informações de contato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados da Empresa (Opcional)</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nome da Empresa</Label>
                  <Input
                    id="company_name"
                    value={profile.company_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Razão Social"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={profile.cnpj}
                    onChange={(e) => setProfile(prev => ({ ...prev, cnpj: formatCNPJ(e.target.value) }))}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            <CardDescription>
              Ações irreversíveis que afetam permanentemente sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ao excluir sua conta, todos os seus dados serão permanentemente removidos, incluindo:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                <li>Perfil e informações pessoais</li>
                <li>Histórico de cotações e pedidos</li>
                <li>Documentos e uploads</li>
                <li>Configurações e preferências</li>
              </ul>
              <p className="text-sm font-semibold text-destructive">
                Esta ação não pode ser desfeita.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="w-full sm:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Minha Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Primeiro Dialog - Confirmação Inicial */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Esta ação não pode ser desfeita. Isso irá permanentemente excluir sua conta
                e remover todos os seus dados de nossos servidores.
              </p>
              <p className="font-semibold text-foreground">
                Você perderá acesso a todos os seus pedidos, cotações e histórico.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteDialog(false);
                setShowConfirmDialog(true);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Segundo Dialog - Confirmação com Digitação */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação Final</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Para confirmar a exclusão permanente da sua conta, digite exatamente:
              </p>
              <p className="font-mono font-bold text-foreground bg-muted p-2 rounded text-center">
                EXCLUIR MINHA CONTA
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-reason" className="text-sm">
                Motivo da exclusão (opcional - ajuda-nos a melhorar)
              </Label>
              <Input
                id="delete-reason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Ex: Encontrei outra solução, não preciso mais..."
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-text" className="text-sm">
                Digite para confirmar <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="EXCLUIR MINHA CONTA"
                className="font-mono"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setConfirmText("");
              setDeleteReason("");
            }}>
              Cancelar
            </AlertDialogCancel>
            <Button
              onClick={handleDeleteAccount}
              disabled={deleting || confirmText !== "EXCLUIR MINHA CONTA"}
              variant="destructive"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Conta Permanentemente
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
