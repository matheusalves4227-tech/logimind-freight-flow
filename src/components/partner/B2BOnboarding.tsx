import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Building2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { validateCNPJ } from "@/lib/validators";
import { PhoneInput } from "@/components/ui/phone-input";
import { Dropzone } from "@/components/ui/dropzone";
import { SectionDivider } from "@/components/ui/section-divider";
import { ConfirmationAnimation } from "@/components/ui/confirmation-animation";
import { CpfCnpjInput } from "@/components/ui/cpf-cnpj-input";

interface B2BOnboardingProps {
  cnpj: string;
  onBack: () => void;
}

const B2BOnboarding = ({ cnpj: cnpjProp, onBack }: B2BOnboardingProps) => {
  const navigate = useNavigate();
  const [localCnpj, setLocalCnpj] = useState(cnpjProp || "");
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    razao_social: "",
    nome_gestor: "",
    email: "",
    telefone: "",
    capacidade_mensal: "",
    rotas_principais: "",
    tipos_veiculos: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanCnpj = localCnpj.replace(/\D/g, '');
    if (!cleanCnpj || cleanCnpj.length !== 14) {
      toast.error("CNPJ é obrigatório");
      return;
    }
    if (!validateCNPJ(cleanCnpj)) {
      toast.error("CNPJ inválido");
      return;
    }
    
    try {
      toast.loading("Validando CNPJ...");

      const { data: duplicityCheck, error: duplicityError } = await supabase.functions.invoke(
        'check-cpf-cnpj-duplicity',
        {
          body: {
            cpf_cnpj: localCnpj,
            type: 'cnpj'
          }
        }
      );

      if (duplicityError) {
        console.error("Erro ao verificar duplicidade:", duplicityError);
        toast.dismiss();
        toast.error("Erro ao validar CNPJ. Tente novamente.");
        return;
      }

      if (duplicityCheck.isDuplicate) {
        toast.dismiss();
        toast.error(`Este CNPJ já está cadastrado. Status: ${duplicityCheck.existingUser.status}`);
        return;
      }

      toast.dismiss();
      toast.loading("Criando sua conta...");

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: Math.random().toString(36).slice(-12) + "A1!",
        options: {
          data: {
            company_name: formData.razao_social,
          },
          emailRedirectTo: `${window.location.origin}/aguardando-aprovacao`,
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar usuário");

      const rotas = formData.rotas_principais.split(",").map(r => r.trim());
      const veiculos = formData.tipos_veiculos.split(",").map(v => v.trim());

      const { error: carrierError } = await supabase
        .from("b2b_carriers")
        .insert({
          user_id: authData.user.id,
          cnpj: cnpj.replace(/\D/g, ""),
          razao_social: formData.razao_social,
          nome_fantasia: formData.razao_social,
          email: formData.email,
          telefone: formData.telefone,
          address_cep: "00000-000",
          address_street: "A definir",
          address_number: "S/N",
          address_neighborhood: "A definir",
          address_city: "A definir",
          address_state: "SP",
          fleet_size: formData.capacidade_mensal ? parseInt(formData.capacidade_mensal) : null,
          coverage_regions: rotas,
          vehicle_types: veiculos,
          status: "pending"
        });

      if (carrierError) throw carrierError;

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: "user"
        });

      if (roleError) throw roleError;

      try {
        const { data: carrierData } = await supabase
          .from("b2b_carriers")
          .select("id")
          .eq("user_id", authData.user.id)
          .single();

        if (carrierData) {
          await supabase.functions.invoke('notify-admin-new-registration', {
            body: {
              registrationType: 'b2b_carrier',
              userName: formData.razao_social,
              userEmail: formData.email,
              registrationId: carrierData.id
            }
          });
        }
      } catch (notifyError) {
        console.error("[ONBOARDING B2B] Erro ao notificar admins:", notifyError);
      }

      // Enviar email de confirmação para a transportadora
      try {
        await supabase.functions.invoke('send-carrier-confirmation', {
          body: {
            email: formData.email,
            razaoSocial: formData.razao_social,
            nomeGestor: formData.nome_gestor
          }
        });
        console.log("[ONBOARDING B2B] Email de confirmação enviado");
      } catch (emailError) {
        console.error("[ONBOARDING B2B] Erro ao enviar email:", emailError);
      }

      toast.dismiss();
      setIsSubmitted(true);
      
    } catch (error: any) {
      toast.dismiss();
      console.error("Erro no cadastro:", error);
      toast.error(error.message || "Erro ao enviar cadastro. Tente novamente.");
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 shadow-lg rounded-xl">
              <ConfirmationAnimation
                title="Cadastro em Análise!"
                description="Recebemos seus dados com sucesso. Nossa equipe comercial entrará em contato em até 48h úteis para validação e próximos passos."
                estimatedTime="Prazo: até 48h úteis"
              />
              <div className="flex justify-center mt-6">
                <Button onClick={() => navigate("/")} variant="outline">
                  Voltar para Home
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Seleção
        </Button>

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-primary font-semibold">Transportadora B2B</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Cadastro de Transportadora
            </h1>
            <p className="text-muted-foreground">
              CNPJ: {cnpj}
            </p>
          </div>

          <Card className="p-6 shadow-lg rounded-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seção 1: Dados da Empresa */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    1
                  </span>
                  Dados da Empresa
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="razao_social">Razão Social *</Label>
                    <Input
                      id="razao_social"
                      value={formData.razao_social}
                      onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                      required
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nome_gestor">Nome do Gestor Comercial *</Label>
                    <Input
                      id="nome_gestor"
                      value={formData.nome_gestor}
                      onChange={(e) => setFormData({ ...formData, nome_gestor: e.target.value })}
                      required
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail Corporativo *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <PhoneInput
                    value={formData.telefone}
                    onChange={(value) => setFormData({ ...formData, telefone: value })}
                    label="Telefone"
                    required
                  />
                </div>
              </div>

              <SectionDivider />

              {/* Seção 2: Capacidade Operacional */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    2
                  </span>
                  Capacidade Operacional
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacidade_mensal">Capacidade Mensal de Fretes</Label>
                    <Input
                      id="capacidade_mensal"
                      placeholder="Ex: 500 fretes/mês"
                      value={formData.capacidade_mensal}
                      onChange={(e) => setFormData({ ...formData, capacidade_mensal: e.target.value })}
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipos_veiculos">Tipos de Veículos na Frota</Label>
                    <Input
                      id="tipos_veiculos"
                      placeholder="Ex: VUC, Toco, Truck, Carreta"
                      value={formData.tipos_veiculos}
                      onChange={(e) => setFormData({ ...formData, tipos_veiculos: e.target.value })}
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="rotas_principais">Rotas Principais (CEPs ou Estados)</Label>
                    <Textarea
                      id="rotas_principais"
                      placeholder="Ex: SP-MG-RJ, 01000-000 a 30000-000"
                      value={formData.rotas_principais}
                      onChange={(e) => setFormData({ ...formData, rotas_principais: e.target.value })}
                      rows={3}
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              <SectionDivider />

              {/* Seção 3: Documentação com Dropzone */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    3
                  </span>
                  Documentação
                </h3>

                <Dropzone
                  onFileSelect={setDocumentFile}
                  label="Arraste e solte ou clique para enviar"
                  description="Certidão Negativa de Débito (CND), Tabela de Frete (CSV/XML)"
                  uploaded={!!documentFile}
                  uploadedFileName={documentFile?.name}
                  onRemove={() => setDocumentFile(null)}
                />

                <p className="text-xs text-muted-foreground">
                  * Nossa equipe validará os documentos em até 48h úteis
                </p>
              </div>

              <SectionDivider />

              {/* Próximos Passos */}
              <div>
                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg mb-4 border border-primary/20">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-primary mb-1">
                      Próximos Passos após Validação
                    </p>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                      <li>• Configuração da API de integração</li>
                      <li>• Aceite do SLA e regras de comissão LogiMind</li>
                      <li>• Início do recebimento de cotações</li>
                    </ul>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5" 
                  size="lg"
                >
                  Enviar Cadastro para Análise
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default B2BOnboarding;
