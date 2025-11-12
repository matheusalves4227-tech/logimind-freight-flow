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

// Schema de validação com Zod
const step1Schema = z.object({
  nome_completo: z.string().trim().min(3, "Nome deve ter no mínimo 3 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("E-mail inválido").max(255, "E-mail muito longo"),
  telefone: z.string().trim().min(10, "Telefone inválido").max(20, "Telefone inválido"),
  whatsapp: z.string().trim().max(20, "WhatsApp inválido").optional(),
  cnh_numero: z.string().trim().min(11, "CNH inválida").max(11, "CNH inválida"),
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
    
    if (!validateStep(3)) return;
    
    toast.success("Cadastro recebido! Você receberá um e-mail com próximos passos.");
    setTimeout(() => navigate("/motorista/dashboard"), 2000);
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

                        <div className="space-y-2">
                          <Label htmlFor="telefone">Telefone *</Label>
                          <Input
                            id="telefone"
                            type="tel"
                            placeholder="(11) 98888-7777"
                            value={formData.telefone}
                            onChange={(e) => handleFormChange("telefone", e.target.value)}
                            className={errors.telefone ? "border-destructive" : ""}
                          />
                          {errors.telefone && (
                            <p className="text-xs text-destructive">{errors.telefone}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Usaremos para envio de fretes e alertas
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="whatsapp">WhatsApp (Opcional)</Label>
                          <Input
                            id="whatsapp"
                            type="tel"
                            placeholder="(11) 98888-7777"
                            value={formData.whatsapp}
                            onChange={(e) => handleFormChange("whatsapp", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
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

                      <div className="space-y-2">
                        <Label htmlFor="veiculo_capacidade_kg">Capacidade Máxima (kg) *</Label>
                        <Input
                          id="veiculo_capacidade_kg"
                          type="number"
                          placeholder="Ex: 5000"
                          value={formData.veiculo_capacidade_kg}
                          onChange={(e) => handleFormChange("veiculo_capacidade_kg", e.target.value)}
                          className={errors.veiculo_capacidade_kg ? "border-destructive" : ""}
                        />
                        {errors.veiculo_capacidade_kg && (
                          <p className="text-xs text-destructive">{errors.veiculo_capacidade_kg}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Evita sobrecarga e multas
                        </p>
                      </div>
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
