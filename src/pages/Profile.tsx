import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CpfCnpjInput } from "@/components/ui/cpf-cnpj-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserAvatarUpload } from "@/components/profile/UserAvatarUpload";
import { 
  Loader2, 
  Save, 
  User, 
  Trash2, 
  ArrowLeft, 
  Shield, 
  Lock, 
  Download, 
  Building2, 
  Phone as PhoneIcon,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { formatCNPJ } from "@/lib/validators";
import { useAuditLog } from "@/hooks/useAuditLog";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Profile() {
  const navigate = useNavigate();
  const { logAction } = useAuditLog();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [originalProfile, setOriginalProfile] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
    company_name: "",
    cnpj: "",
  });
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
    company_name: "",
    cnpj: "",
  });

  // Check if profile has been modified
  const hasChanges = useMemo(() => {
    return (
      profile.full_name !== originalProfile.full_name ||
      profile.phone !== originalProfile.phone ||
      profile.company_name !== originalProfile.company_name ||
      profile.cnpj !== originalProfile.cnpj
    );
  }, [profile, originalProfile]);

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  const checkAuthAndLoadProfile = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Você precisa estar logado para acessar esta página.");
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
      setUserEmail(session.user.email || "");
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
        const profileData = {
          full_name: data.full_name || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || "",
          company_name: data.company_name || "",
          cnpj: data.cnpj || "",
        };
        setProfile(profileData);
        setOriginalProfile(profileData);
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
            email: userEmail, // Atualizar email do usuário
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
            email: userEmail, // Salvar email do usuário
          });

        if (error) throw error;
      }

      await logAction({
        action: "profile_update",
        metadata: {
          fields_updated: Object.keys(profile).filter(key => profile[key as keyof typeof profile]),
        }
      });

      setOriginalProfile(profile);
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      toast.error("Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos de senha.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("A nova senha e a confirmação não coincidem.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      toast.error("A senha deve conter letras maiúsculas, minúsculas e números.");
      return;
    }

    try {
      setChangingPassword(true);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Senha atual incorreta.");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      await logAction({
        action: "password_change",
        metadata: {
          changed_at: new Date().toISOString(),
        }
      });

      toast.success("Senha alterada com sucesso!");
      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      toast.error("Erro ao alterar senha. Tente novamente.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);

      const [profileData, ordersData, quotesData] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("orders").select("*").eq("user_id", userId),
        supabase.from("quotes").select("*").eq("user_id", userId),
      ]);

      const exportData = {
        export_date: new Date().toISOString(),
        user_id: userId,
        user_email: userEmail,
        profile: profileData.data,
        orders: ordersData.data || [],
        quotes: quotesData.data || [],
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `logimarket-dados-${userId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await logAction({
        action: "data_export",
        metadata: {
          export_date: new Date().toISOString(),
          records_exported: {
            orders: ordersData.data?.length || 0,
            quotes: quotesData.data?.length || 0,
          }
        }
      });

      toast.success("Dados exportados com sucesso!");
      setShowExportDialog(false);
    } catch (error: any) {
      console.error("Erro ao exportar dados:", error);
      toast.error("Erro ao exportar dados. Tente novamente.");
    } finally {
      setExporting(false);
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
    <>
      <Helmet>
        <title>Meu Perfil - LogiMarket</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="container max-w-4xl py-8 px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Home
        </Button>

        {/* Profile Header */}
        <Card className="mb-8 shadow-sm border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Avatar */}
              <UserAvatarUpload
                userId={userId}
                currentAvatarUrl={profile.avatar_url}
                onUploadComplete={handleAvatarUploadComplete}
              />

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold text-foreground">
                    {profile.full_name || "Usuário"}
                  </h1>
                  <Badge 
                    variant="secondary" 
                    className="text-xs gap-1 font-medium"
                  >
                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                    Verificada
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
                {profile.company_name && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 justify-center sm:justify-start mt-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {profile.company_name}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="w-full bg-muted/50 p-1 h-10">
            <TabsTrigger 
              value="personal" 
              className="flex-1 flex items-center justify-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
            >
              <User className="h-4 w-4" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="flex-1 flex items-center justify-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
          </TabsList>
          {/* Personal Data Tab */}
          <TabsContent value="personal" className="space-y-6 animate-fade-in">
            {/* Personal Info Card */}
            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                    <CardDescription>Seus dados de contato e identificação</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-xl p-5 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-sm font-medium">
                        Nome Completo <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Seu nome completo"
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <PhoneIcon className="h-3.5 w-3.5" />
                        Telefone
                      </Label>
                      <PhoneInput
                        value={profile.phone}
                        onChange={(value) => setProfile(prev => ({ ...prev, phone: value }))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Info Card */}
            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent/30">
                    <Building2 className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Dados da Empresa</CardTitle>
                    <CardDescription>Informações comerciais (opcional)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-xl p-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company_name" className="text-sm font-medium">
                        Nome da Empresa
                      </Label>
                      <Input
                        id="company_name"
                        value={profile.company_name}
                        onChange={(e) => setProfile(prev => ({ ...prev, company_name: e.target.value }))}
                        placeholder="Razão Social"
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">CNPJ</Label>
                      <CpfCnpjInput
                        value={profile.cnpj}
                        onChange={(value) => setProfile(prev => ({ ...prev, cnpj: value }))}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => navigate("/dashboard")}
                className="min-w-[120px]"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving || !hasChanges}
                className="min-w-[160px] transition-all duration-200"
              >
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
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6 animate-fade-in">
            {/* Security Options Card */}
            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Segurança da Conta</CardTitle>
                    <CardDescription>Gerencie sua senha e dados pessoais</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowPasswordDialog(true)}
                      className="flex-1 justify-start gap-3 h-12 bg-white hover:bg-slate-100"
                    >
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <div className="text-left">
                        <p className="font-medium">Alterar Senha</p>
                        <p className="text-xs text-muted-foreground">Atualize sua senha de acesso</p>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowExportDialog(true)}
                      className="flex-1 justify-start gap-3 h-12 bg-white hover:bg-slate-100"
                    >
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <div className="text-left">
                        <p className="font-medium">Exportar Dados</p>
                        <p className="text-xs text-muted-foreground">Baixe seus dados (LGPD)</p>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone Card */}
            <Card className="shadow-sm border-destructive/30 bg-destructive/5">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-destructive">Zona de Perigo</CardTitle>
                    <CardDescription>Ações irreversíveis que afetam permanentemente sua conta</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-white/80 rounded-xl p-5 border border-destructive/20">
                    <p className="text-sm text-muted-foreground mb-3">
                      Ao excluir sua conta, todos os seus dados serão permanentemente removidos:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2 mb-4">
                      <li>Perfil e informações pessoais</li>
                      <li>Histórico de cotações e pedidos</li>
                      <li>Documentos e uploads</li>
                      <li>Configurações e preferências</li>
                    </ul>
                    <p className="text-sm font-semibold text-destructive mb-4">
                      Esta ação não pode ser desfeita.
                    </p>
                    
                    {/* Ghost Red Button */}
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteDialog(true)}
                      className="border-destructive text-destructive bg-transparent hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir Minha Conta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* First Dialog - Initial Confirmation */}
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

      {/* Second Dialog - Type Confirmation */}
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

      {/* Dialog - Password Change */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Alterar Senha
            </DialogTitle>
            <DialogDescription>
              Digite sua senha atual e escolha uma nova senha segura.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres, maiúsculas, minúsculas e números"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                "Alterar Senha"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Data Export */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Exportar Meus Dados
            </DialogTitle>
            <DialogDescription>
              Baixe uma cópia de todos os seus dados pessoais em formato JSON.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-3">
                O arquivo incluirá:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                <li>Informações do perfil</li>
                <li>Histórico de pedidos</li>
                <li>Cotações realizadas</li>
                <li>Data e horário da exportação</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Esta exportação é fornecida de acordo com a LGPD (Lei Geral de Proteção de Dados).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExportData} disabled={exporting}>
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Dados
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
