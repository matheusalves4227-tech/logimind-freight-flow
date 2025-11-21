import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Truck, CheckCircle2, AlertCircle, Smartphone, DollarSign, MapPin } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import Navbar from "@/components/Navbar";
import { Stepper } from "@/components/ui/stepper";
import { supabase } from "@/integrations/supabase/client";
import { validateCPF } from "@/lib/validators";
import { ProfilePhotoUpload } from "@/components/driver/ProfilePhotoUpload";
import { CpfCnpjInput } from "@/components/ui/cpf-cnpj-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { WeightInput } from "@/components/ui/weight-input";

// Schema de validação com Zod
const step1Schema = z.object({
  nome_completo: z.string().trim().min(3, "Nome deve ter no mínimo 3 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("E-mail inválido").max(255, "E-mail muito longo"),
  telefone: z.string().trim().min(10, "Telefone inválido").max(20, "Telefone inválido"),
  whatsapp: z.string().trim().max(20, "WhatsApp inválido").optional(),
  cnh_numero: z.string().trim().min(11, "CNH deve ter 11 dígitos").max(11, "CNH deve ter 11 dígitos").regex(/^\d+$/, "CNH deve conter apenas números"),
  cnh_categoria: z.string().min(1, "Selecione a categoria"),
  rntrc: z.string().trim().min(8, "RNTRC inválido").max(20, "RNTRC inválido"),
});

const step2Schema = z.object({
  veiculo_placa: z.string().trim().min(7, "Placa inválida").max(8, "Placa inválida"),
  veiculo_tipo: z.string().min(1, "Selecione o tipo de veículo"),
  veiculo_carroceria: z.string().trim().min(1, "Selecione o tipo de carroceria"),
  veiculo_capacidade_kg: z.string().trim().min(1, "Informe a capacidade").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Capacidade inválida"),
  regioes_atuacao: z.array(z.string()).min(1, "Selecione ao menos uma região"),
});

const step3Schema = z.object({
  pix_key_type: z.string().min(1, "Selecione o tipo de chave"),
  pix_key: z.string().trim().min(3, "Chave PIX inválida").max(100, "Chave PIX muito longa"),
  aceite_termos: z.boolean().refine((val) => val === true, "Você deve aceitar os termos"),
});

interface AutonomousOnboardingProps {
  cpf: string;
  onBack: () => void;
}

const AutonomousOnboarding = ({ cpf, onBack }: AutonomousOnboardingProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    whatsapp: "",
    cnh_numero: "",
    cnh_categoria: "",
    rntrc: "",
    veiculo_tipo: "",
    veiculo_placa: "",
    veiculo_carroceria: "",
    veiculo_capacidade_kg: "",
    pix_key_type: "",
    pix_key: "",
    aceite_termos: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { label: "Identificação", description: "Dados pessoais e CNH" },
    { label: "Frota", description: "Veículo e regiões" },
    { label: "Pagamento", description: "Dados bancários" },
  ];

  const regioes = [
    { id: "SP", label: "São Paulo" },
    { id: "RJ", label: "Rio de Janeiro" },
    { id: "MG", label: "Minas Gerais" },
    { id: "ES", label: "Espírito Santo" },
    { id: "PR", label: "Paraná" },
    { id: "SC", label: "Santa Catarina" },
    { id: "RS", label: "Rio Grande do Sul" },
    { id: "DF", label: "Distrito Federal" },
    { id: "GO", label: "Goiás" },
    { id: "MT", label: "Mato Grosso" },
    { id: "MS", label: "Mato Grosso do Sul" },
  ];

  const toggleRegion = useCallback((regionId: string) => {
    setSelectedRegions(prev => 
      prev.includes(regionId) 
        ? prev.filter(id => id !== regionId)
        : [...prev, regionId]
    );
  }, []);

  const handleFormChange = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateStep = (step: number) => {
    setErrors({});
    
    try {
      if (step === 1) {
        step1Schema.parse({
          nome_completo: formData.nome_completo,
          email: formData.email,
          telefone: formData.telefone,
          whatsapp: formData.whatsapp || undefined,
          cnh_numero: formData.cnh_numero,
          cnh_categoria: formData.cnh_categoria,
          rntrc: formData.rntrc,
        });
      } else if (step === 2) {
        step2Schema.parse({
          veiculo_placa: formData.veiculo_placa,
          veiculo_tipo: formData.veiculo_tipo,
          veiculo_carroceria: formData.veiculo_carroceria,
          veiculo_capacidade_kg: formData.veiculo_capacidade_kg,
          regioes_atuacao: selectedRegions,
        });
      } else if (step === 3) {
        step3Schema.parse({
          pix_key_type: formData.pix_key_type,
          pix_key: formData.pix_key,
          aceite_termos: formData.aceite_termos,
        });
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error("Por favor, corrija os erros no formulário");
      }
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      return;
    }

    try {
      toast.loading("Validando CPF...");

      // NOVO: Verificar duplicidade de CPF antes de criar conta
      const { data: duplicityCheck, error: duplicityError } = await supabase.functions.invoke(
        'check-cpf-cnpj-duplicity',
        {
          body: {
            cpf_cnpj: cpf,
            type: 'cpf'
          }
        }
      );

      if (duplicityError) {
        console.error("Erro ao verificar duplicidade:", duplicityError);
        toast.dismiss();
        toast.error("Erro ao validar CPF. Tente novamente.");
        return;
      }

      if (duplicityCheck?.isDuplicate) {
        toast.dismiss();
        toast.error("Este CPF já está cadastrado no sistema.");
        return;
      }

      // NOVO: Verificar duplicidade de EMAIL antes de criar conta
      toast.dismiss();
      toast.loading("Validando email...");

      const { data: emailCheck, error: emailError } = await supabase.functions.invoke(
        'check-cpf-cnpj-duplicity',
        {
          body: {
            email: formData.email,
            type: 'email'
          }
        }
      );

      if (emailError) {
        console.error("Erro ao verificar email:", emailError);
        toast.dismiss();
        toast.error("Erro ao validar email. Tente novamente.");
        return;
      }

      if (emailCheck?.isDuplicate) {
        toast.dismiss();
        toast.error("Este email já está em uso. Tente fazer login ou use outro email.");
        return;
      }

      // Validar CNH duplicada
      const { data: cnhData } = await supabase
        .from("driver_cnh_data")
        .select("cnh_number")
        .eq("cnh_number", formData.cnh_numero)
        .maybeSingle();

      if (cnhData) {
        toast.dismiss();
        toast.error("Este número de CNH já está cadastrado no sistema.");
        return;
      }

      // Validar placa duplicada
      const { data: plateData } = await supabase
        .from("driver_vehicles")
        .select("license_plate")
        .eq("license_plate", formData.veiculo_placa.toUpperCase())
        .maybeSingle();

      if (plateData) {
        toast.dismiss();
        toast.error("Esta placa de veículo já está cadastrada no sistema.");
        return;
      }

      toast.dismiss();
      toast.loading("Criando sua conta...");

      // 1. Criar conta de usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: Math.random().toString(36).slice(-12) + "A1!", // Senha temporária
        options: {
          data: {
            full_name: formData.nome_completo,
          },
          emailRedirectTo: `${window.location.origin}/aguardando-aprovacao`,
        }
      });

      if (authError) {
        console.error("Erro ao criar conta:", authError);
        toast.dismiss();
        
        // Tratamento específico para email já registrado
        if (authError.message.toLowerCase().includes("user already registered") || 
            authError.message.toLowerCase().includes("already registered") ||
            authError.message.toLowerCase().includes("already been registered")) {
          toast.error("Este email já está em uso. Tente fazer login ou use outro email.");
        } else {
          toast.error(`Erro ao criar conta: ${authError.message}`);
        }
        return;
      }
      if (!authData.user) throw new Error("Falha ao criar usuário");

      // 2. Criar perfil do motorista
      const { data: profileData, error: profileError } = await supabase
        .from("driver_profiles")
        .insert({
          user_id: authData.user.id,
          cpf: cpf.replace(/\D/g, ""),
          full_name: formData.nome_completo,
          email: formData.email,
          phone: formData.telefone,
          whatsapp: formData.whatsapp || formData.telefone,
          address_cep: "00000-000", // Placeholder - pode ser coletado em etapa futura
          address_street: "A definir",
          address_number: "S/N",
          address_neighborhood: "A definir",
          address_city: "A definir",
          address_state: "SP",
          pix_key_type: formData.pix_key_type,
          pix_key: formData.pix_key,
          foto_perfil_url: profilePhotoUrl,
          status: "pending"
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // 3. Criar dados da CNH
      const { error: cnhError } = await supabase
        .from("driver_cnh_data")
        .insert({
          driver_profile_id: profileData.id,
          cnh_number: formData.cnh_numero,
          cnh_category: formData.cnh_categoria as any,
          issue_date: new Date().toISOString().split('T')[0], // Data de hoje como placeholder
          expiry_date: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 anos no futuro
        });

      if (cnhError) throw cnhError;

      // 4. Criar veículo
      const { error: vehicleError } = await supabase
        .from("driver_vehicles")
        .insert({
          driver_profile_id: profileData.id,
          license_plate: formData.veiculo_placa.toUpperCase(),
          vehicle_type: formData.veiculo_tipo as any,
          max_weight_kg: parseFloat(formData.veiculo_capacidade_kg),
          is_active: true,
        });

      if (vehicleError) throw vehicleError;

      // 5. Notificar administradores sobre novo cadastro
      try {
        await supabase.functions.invoke('notify-admin-new-registration', {
          body: {
            registrationType: 'driver',
            userName: formData.nome_completo,
            userEmail: formData.email,
            registrationId: profileData.id
          }
        });
        console.log("[ONBOARDING] Notificação enviada aos administradores");
      } catch (notifyError) {
        console.error("[ONBOARDING] Erro ao notificar admins:", notifyError);
        // Não bloqueamos o fluxo se a notificação falhar
      }

      toast.dismiss();
      toast.success("Cadastro enviado com sucesso! Aguarde aprovação da equipe.");
      
      // Redirecionar para página de aguardando aprovação
      setTimeout(() => navigate("/aguardando-aprovacao"), 2000);
    } catch (error: any) {
      toast.dismiss();
      console.error("Erro no cadastro:", error);
      
      // Tratamento específico para erros de duplicidade
      if (error.code === "23505") {
        if (error.message.includes("driver_cnh_data_cnh_number_key")) {
          toast.error("Este número de CNH já está cadastrado no sistema.");
        } else if (error.message.includes("driver_vehicles_license_plate_key")) {
          toast.error("Esta placa de veículo já está cadastrada no sistema.");
        } else if (error.message.includes("driver_profiles_cpf_key")) {
          toast.error("Este CPF já está cadastrado no sistema.");
        } else {
          toast.error("Dados já cadastrados no sistema. Verifique CNH, placa ou CPF.");
        }
      } else {
        toast.error(error.message || "Erro ao enviar cadastro. Tente novamente.");
      }
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-4">
              <Truck className="h-5 w-5 text-accent" />
              <span className="text-accent font-semibold">Motorista Autônomo</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Cadastro de Motorista
            </h1>
            <p className="text-muted-foreground">
              CPF: {cpf}
            </p>
          </div>

          <Card className="p-6 shadow-lg">
            <Stepper steps={steps} currentStep={currentStep} className="mb-8" />
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* TELA 1: Identificação e Documentação */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-accent">
                      <CheckCircle2 className="h-5 w-5" />
                      Dados Pessoais e Documentação
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Precisamos validar seus dados para garantir segurança nas operações
                    </p>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome_completo">Nome Completo *</Label>
                        <Input
                          id="nome_completo"
                          value={formData.nome_completo}
                          onChange={(e) => handleFormChange("nome_completo", e.target.value)}
                          className={errors.nome_completo ? "border-destructive" : ""}
                        />
                        {errors.nome_completo && (
                          <p className="text-xs text-destructive">{errors.nome_completo}</p>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">E-mail *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleFormChange("email", e.target.value)}
                            className={errors.email ? "border-destructive" : ""}
                          />
                          {errors.email && (
                            <p className="text-xs text-destructive">{errors.email}</p>
                          )}
                        </div>

                        <PhoneInput
                          value={formData.telefone}
                          onChange={(value) => handleFormChange("telefone", value)}
                          label="Telefone"
                          required
                          error={errors.telefone}
                        />

                        <PhoneInput
                          value={formData.whatsapp}
                          onChange={(value) => handleFormChange("whatsapp", value)}
                          label="WhatsApp (Opcional)"
                          error={errors.whatsapp}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Foto de Perfil
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Adicione uma foto de perfil para facilitar sua identificação
                    </p>
                    <ProfilePhotoUpload
                      currentPhotoUrl={profilePhotoUrl}
                      onUploadComplete={(url) => setProfilePhotoUrl(url)}
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Documentação Legal
                    </h4>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cnh_numero">Número da CNH *</Label>
                        <Input
                          id="cnh_numero"
                          placeholder="00000000000"
                          maxLength={11}
                          value={formData.cnh_numero}
                          onChange={(e) => handleFormChange("cnh_numero", e.target.value.replace(/\D/g, ""))}
                          className={errors.cnh_numero ? "border-destructive" : ""}
                        />
                        {errors.cnh_numero && (
                          <p className="text-xs text-destructive">{errors.cnh_numero}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Precisamos validar se você pode dirigir o veículo
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cnh_categoria">Categoria da CNH *</Label>
                        <Select
                          value={formData.cnh_categoria || undefined}
                          onValueChange={(value) => handleFormChange("cnh_categoria", value)}
                        >
                          <SelectTrigger className={errors.cnh_categoria ? "border-destructive" : ""}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="B">B - Até 3.500kg</SelectItem>
                            <SelectItem value="C">C - Até 6.000kg</SelectItem>
                            <SelectItem value="D">D - Até 16.000kg</SelectItem>
                            <SelectItem value="E">E - Acima de 16.000kg</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.cnh_categoria && (
                          <p className="text-xs text-destructive">{errors.cnh_categoria}</p>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="rntrc">RNTRC (Registro Nacional) *</Label>
                        <Input
                          id="rntrc"
                          value={formData.rntrc}
                          onChange={(e) => handleFormChange("rntrc", e.target.value)}
                          className={errors.rntrc ? "border-destructive" : ""}
                        />
                        {errors.rntrc && (
                          <p className="text-xs text-destructive">{errors.rntrc}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Necessário para a emissão de documentos fiscais (CIOT, MDF-e)
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-amber-900 dark:text-amber-100">
                          <p className="font-medium mb-1">Conformidade Legal</p>
                          <p className="text-xs">
                            CNH válida e RNTRC ativo são pré-requisitos legais para transportar cargas no Brasil.
                            Você fará upload dos documentos após o cadastro inicial.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="button" onClick={handleNext} size="lg" className="px-8">
                      Continuar para Frota
                    </Button>
                  </div>
                </div>
              )}

              {/* TELA 2: Frota e Capacidade */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-accent">
                      <Truck className="h-5 w-5" />
                      Frota e Capacidade Operacional
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure seu veículo para receber fretes compatíveis
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="veiculo_placa">Placa do Veículo *</Label>
                        <Input
                          id="veiculo_placa"
                          placeholder="ABC-1D23"
                          maxLength={8}
                          value={formData.veiculo_placa}
                          onChange={(e) => handleFormChange("veiculo_placa", e.target.value.toUpperCase())}
                          className={errors.veiculo_placa ? "border-destructive" : ""}
                        />
                        {errors.veiculo_placa && (
                          <p className="text-xs text-destructive">{errors.veiculo_placa}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Qual a placa do seu caminhão/veículo principal?
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="veiculo_tipo">Tipo de Veículo *</Label>
                        <Select
                          value={formData.veiculo_tipo || undefined}
                          onValueChange={(value) => handleFormChange("veiculo_tipo", value)}
                        >
                          <SelectTrigger className={errors.veiculo_tipo ? "border-destructive" : ""}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="moto">Moto</SelectItem>
                            <SelectItem value="carro">Carro Baú</SelectItem>
                            <SelectItem value="picape">Picape</SelectItem>
                            <SelectItem value="van">Van</SelectItem>
                            <SelectItem value="caminhao_toco">Caminhão Toco</SelectItem>
                            <SelectItem value="caminhao_truck">Caminhão Truck</SelectItem>
                            <SelectItem value="carreta">Carreta Simples</SelectItem>
                            <SelectItem value="carreta_bi">Carreta Bi-Trem</SelectItem>
                            <SelectItem value="carreta_tri">Carreta Tri-Trem</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.veiculo_tipo && (
                          <p className="text-xs text-destructive">{errors.veiculo_tipo}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="veiculo_carroceria">Tipo de Carroceria *</Label>
                        <Select
                          value={formData.veiculo_carroceria || undefined}
                          onValueChange={(value) => handleFormChange("veiculo_carroceria", value)}
                        >
                          <SelectTrigger className={errors.veiculo_carroceria ? "border-destructive" : ""}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bau">Baú Fechado</SelectItem>
                            <SelectItem value="sider">Sider (Cortina)</SelectItem>
                            <SelectItem value="grade_baixa">Grade Baixa</SelectItem>
                            <SelectItem value="cacamba">Caçamba</SelectItem>
                            <SelectItem value="plataforma">Plataforma</SelectItem>
                            <SelectItem value="refrigerado">Baú Refrigerado</SelectItem>
                            <SelectItem value="tanque">Tanque</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.veiculo_carroceria && (
                          <p className="text-xs text-destructive">{errors.veiculo_carroceria}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Garante que você receba apenas fretes que cabem no seu veículo
                        </p>
                      </div>

                      <WeightInput
                        value={formData.veiculo_capacidade_kg}
                        onChange={(value) => handleFormChange("veiculo_capacidade_kg", value)}
                        label="Capacidade Máxima"
                        placeholder="5000"
                        required
                        error={errors.veiculo_capacidade_kg}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <div>
                        <Label className="text-base font-semibold">Regiões de Atuação *</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Quais estados você atende prioritariamente? O LogiMind priorizará rotas de retorno nessas regiões.
                        </p>
                      </div>
                    </div>
                    {errors.regioes_atuacao && (
                      <p className="text-xs text-destructive">{errors.regioes_atuacao}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {regioes.map((regiao) => (
                        <div
                          key={regiao.id}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                            selectedRegions.includes(regiao.id)
                              ? "border-accent bg-accent/10"
                              : "border-border hover:border-accent/50"
                          }`}
                        >
                          <Checkbox
                            checked={selectedRegions.includes(regiao.id)}
                            onCheckedChange={() => toggleRegion(regiao.id)}
                          />
                          <span className="text-sm font-medium">{regiao.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-accent mb-1">
                            Otimização LogiMind
                          </p>
                          <p className="text-xs text-muted-foreground">
                            O agente de precificação priorizará a oferta de rotas de retorno dentro das suas regiões de preferência, 
                            maximizando sua rentabilidade e reduzindo viagens vazias.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={handleBack}>
                      Voltar
                    </Button>
                    <Button type="button" onClick={handleNext} size="lg" className="px-8">
                      Continuar para Pagamento
                    </Button>
                  </div>
                </div>
              )}

              {/* TELA 3: Pagamento e Finalização */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-accent">
                      <DollarSign className="h-5 w-5" />
                      Dados de Pagamento
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure seus dados bancários para receber os pagamentos de frete
                    </p>

                    <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-secondary mb-1">
                            Pagamento Rápido com PIX
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Recomendamos o PIX para recebimento em até 24h após a conclusão do frete
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pix_key_type">Tipo de Chave PIX *</Label>
                        <Select
                          value={formData.pix_key_type || undefined}
                          onValueChange={(value) => handleFormChange("pix_key_type", value)}
                        >
                          <SelectTrigger className={errors.pix_key_type ? "border-destructive" : ""}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cpf">CPF</SelectItem>
                            <SelectItem value="cnpj">CNPJ</SelectItem>
                            <SelectItem value="email">E-mail</SelectItem>
                            <SelectItem value="telefone">Telefone</SelectItem>
                            <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.pix_key_type && (
                          <p className="text-xs text-destructive">{errors.pix_key_type}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pix_key">Chave PIX *</Label>
                        <Input
                          id="pix_key"
                          placeholder="Digite sua chave PIX"
                          value={formData.pix_key}
                          onChange={(e) => handleFormChange("pix_key", e.target.value)}
                          className={errors.pix_key ? "border-destructive" : ""}
                        />
                        {errors.pix_key && (
                          <p className="text-xs text-destructive">{errors.pix_key}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Próximo Passo: App LogiMind Driver
                    </h4>

                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Smartphone className="h-8 w-8 text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-primary mb-2">
                            Baixe o App para Receber Fretes
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">
                            Com o App LogiMind Driver você receberá fretes em tempo real, 
                            poderá enviar tracking e acompanhar seus pagamentos.
                          </p>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" disabled>
                              <span className="text-xs">📱 Google Play</span>
                            </Button>
                            <Button type="button" variant="outline" size="sm" disabled>
                              <span className="text-xs">🍎 App Store</span>
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Links serão enviados por e-mail após aprovação
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                      <Checkbox
                        id="aceite_termos"
                        checked={formData.aceite_termos}
                         onCheckedChange={(checked) => 
                           handleFormChange("aceite_termos", Boolean(checked))
                         }
                        className={errors.aceite_termos ? "border-destructive" : ""}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="aceite_termos" className="text-sm font-medium cursor-pointer">
                          Li e aceito as Regras de Uso e a Política de Comissão Dinâmica LogiMarket *
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          A comissão dinâmica do LogiMind significa que você pode ganhar mais em rotas de retorno 
                          otimizadas, ajudando a reduzir viagens vazias e aumentar sua rentabilidade.
                        </p>
                      </div>
                    </div>
                    {errors.aceite_termos && (
                      <p className="text-xs text-destructive ml-9">{errors.aceite_termos}</p>
                    )}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={handleBack}>
                      Voltar
                    </Button>
                    <Button type="submit" size="lg" className="px-8">
                      Criar Minha Conta de Motorista
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AutonomousOnboarding;
