import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Building2, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";

interface B2BOnboardingProps {
  cnpj: string;
  onBack: () => void;
}

const B2BOnboarding = ({ cnpj, onBack }: B2BOnboardingProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
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
    
    try {
      toast.loading("Criando sua conta...");

      // 1. Criar conta de usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: Math.random().toString(36).slice(-12) + "A1!", // Senha temporária
        options: {
          data: {
            company_name: formData.razao_social,
          },
          emailRedirectTo: `${window.location.origin}/aguardando-aprovacao`,
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar usuário");

      // 2. Criar perfil da transportadora B2B
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
          address_cep: "00000-000", // Placeholder - pode ser coletado em etapa futura
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

      // 3. Atribuir role de user (depois será promovido a carrier se aprovado)
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: "user"
        });

      if (roleError) throw roleError;

      toast.dismiss();
      toast.success("Cadastro recebido! Entraremos em contato em até 24h para validação.");
      
      // Redirecionar para página de aguardando aprovação
      setTimeout(() => navigate("/aguardando-aprovacao"), 2000);
    } catch (error: any) {
      toast.dismiss();
      console.error("Erro no cadastro:", error);
      toast.error(error.message || "Erro ao enviar cadastro. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6"
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

          <Card className="p-6 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    1
                  </span>
                  Dados da Empresa
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="razao_social">Razão Social *</Label>
                    <Input
                      id="razao_social"
                      value={formData.razao_social}
                      onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nome_gestor">Nome do Gestor Comercial *</Label>
                    <Input
                      id="nome_gestor"
                      value={formData.nome_gestor}
                      onChange={(e) => setFormData({ ...formData, nome_gestor: e.target.value })}
                      required
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    2
                  </span>
                  Capacidade Operacional
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacidade_mensal">Capacidade Mensal de Fretes</Label>
                    <Input
                      id="capacidade_mensal"
                      placeholder="Ex: 500 fretes/mês"
                      value={formData.capacidade_mensal}
                      onChange={(e) => setFormData({ ...formData, capacidade_mensal: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rotas_principais">Rotas Principais (CEPs ou Estados)</Label>
                    <Textarea
                      id="rotas_principais"
                      placeholder="Ex: SP-MG-RJ, 01000-000 a 30000-000"
                      value={formData.rotas_principais}
                      onChange={(e) => setFormData({ ...formData, rotas_principais: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipos_veiculos">Tipos de Veículos na Frota</Label>
                    <Input
                      id="tipos_veiculos"
                      placeholder="Ex: VUC, Toco, Truck, Carreta"
                      value={formData.tipos_veiculos}
                      onChange={(e) => setFormData({ ...formData, tipos_veiculos: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    3
                  </span>
                  Documentação
                </h3>

                <div className="p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <div className="flex flex-col items-center gap-3 py-6">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-medium text-sm mb-1">
                        Upload de Documentos
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Certidão Negativa de Débito (CND), Tabela de Frete (CSV/XML)
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm">
                      Selecionar Arquivos
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  * Nossa equipe validará os documentos em até 48h úteis
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg mb-4">
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

                <Button type="submit" className="w-full" size="lg">
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
