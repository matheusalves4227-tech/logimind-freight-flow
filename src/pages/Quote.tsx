import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Package, MapPin, Loader2, TrendingUp, Info, Lightbulb, Truck, Clock, DollarSign, Zap, Building2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Stepper } from "@/components/ui/stepper";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatarMoeda, formatarPorcentagemSimples } from "@/lib/formatters";

interface QuoteResult {
  carrier_id: string;
  carrier_name: string;
  carrier_size?: string;
  specialties?: string[];
  base_price: number;
  commission_applied: number;
  final_price: number;
  delivery_days: number;
  quality_index: number;
  route_adjustment_factor: number;
  adjustment_reason?: string;
  logiguard_pro?: {
    available: boolean;
    recommended: boolean;
    base_cost: number;
    markup_value: number;
    total_price: number;
    risk_factor: number;
  };
}

type SortOption = "price" | "delivery" | "quality";

const Quote = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    service_type: "ltl", // "ltl" (Padrão/Econômico) ou "ftl" (Dedicado/Expresso)
    vehicle_type: "", // Para FTL: "moto", "carro", "picape", "caminhao"
    cargo_value: "", // Valor declarado da carga (para LogiGuard Pro)
    origin_cep: "",
    origin_number: "",
    origin_type: "commercial",
    origin_address: "",
    origin_neighborhood: "",
    origin_city: "",
    destination_cep: "",
    destination_number: "",
    destination_type: "commercial",
    destination_address: "",
    destination_neighborhood: "",
    destination_city: "",
    weight_kg: "",
    height_cm: "",
    width_cm: "",
    length_cm: "",
  });
  const [quotes, setQuotes] = useState<QuoteResult[]>([]);
  const [routeType, setRouteType] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("price");
  const [loadingCep, setLoadingCep] = useState<"origin" | "destination" | null>(null);
  const [restrictedAreas, setRestrictedAreas] = useState<{origin: boolean, destination: boolean}>({
    origin: false,
    destination: false
  });
  const [contractingCarrierId, setContractingCarrierId] = useState<string | null>(null);
  const [selectedLogiGuard, setSelectedLogiGuard] = useState<{ [key: string]: boolean }>({});

  const steps = [
    { label: "Localidades", description: "Origem e destino" },
    { label: "Carga", description: "Peso e dimensões" },
    { label: "Revisar", description: "Confirmar dados" },
  ];

  // Preencher CEPs da URL e buscar dados
  useEffect(() => {
    const origin = searchParams.get("origin");
    const dest = searchParams.get("dest");
    
    if (origin || dest) {
      setFormData(prev => ({
        ...prev,
        origin_cep: origin || prev.origin_cep,
        destination_cep: dest || prev.destination_cep,
      }));
      
      // Buscar dados do CEP automaticamente
      if (origin) fetchCepData(origin, "origin");
      if (dest) fetchCepData(dest, "destination");
    }
  }, [searchParams]);

  // Função para buscar dados do CEP via ViaCEP
  const fetchCepData = async (cep: string, type: "origin" | "destination") => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setLoadingCep(type);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      setFormData(prev => ({
        ...prev,
        [`${type}_address`]: data.logradouro,
        [`${type}_neighborhood`]: data.bairro,
        [`${type}_city`]: `${data.localidade} - ${data.uf}`,
      }));
    } catch (error) {
      console.error("Error fetching CEP:", error);
      toast.error("Erro ao buscar CEP");
    } finally {
      setLoadingCep(null);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Step 1: Localidades
      if (!formData.origin_cep || !formData.destination_cep) {
        toast.error("Por favor, preencha origem e destino");
        return;
      }
      if (!formData.origin_number || !formData.destination_number) {
        toast.error("Por favor, preencha os números dos endereços");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Step 2: Carga
      if (!formData.weight_kg) {
        toast.error("Por favor, preencha o peso da carga");
        return;
      }
      if (formData.service_type === "ftl" && !formData.vehicle_type) {
        toast.error("Por favor, selecione o tipo de veículo");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setQuotes([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Você precisa estar logado para cotar fretes");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-quote', {
        body: {
          service_type: formData.service_type,
          origin_cep: formData.origin_cep,
          origin_number: formData.origin_number,
          origin_type: formData.origin_type,
          destination_cep: formData.destination_cep,
          destination_number: formData.destination_number,
          destination_type: formData.destination_type,
          weight_kg: parseFloat(formData.weight_kg),
          height_cm: formData.height_cm ? parseFloat(formData.height_cm) : undefined,
          width_cm: formData.width_cm ? parseFloat(formData.width_cm) : undefined,
          length_cm: formData.length_cm ? parseFloat(formData.length_cm) : undefined,
          cargo_value: formData.cargo_value ? parseFloat(formData.cargo_value) : undefined,
        }
      });

      if (error) {
        throw error;
      }

      setQuotes(data.quotes);
      setRouteType(data.route_type);
      setRestrictedAreas({
        origin: data.restricted_origin || false,
        destination: data.restricted_destination || false,
      });
      toast.success("Cotação gerada com sucesso!");
    } catch (error: any) {
      console.error("Error generating quote:", error);
      toast.error(error.message || "Erro ao gerar cotação");
    } finally {
      setLoading(false);
    }
  };

  const getSortedQuotes = () => {
    const sorted = [...quotes];
    switch (sortBy) {
      case "price":
        return sorted.sort((a, b) => a.final_price - b.final_price);
      case "delivery":
        return sorted.sort((a, b) => a.delivery_days - b.delivery_days);
      case "quality":
        return sorted.sort((a, b) => b.quality_index - a.quality_index);
      default:
        return sorted;
    }
  };

  const getRouteTypeBadge = () => {
    switch (routeType) {
      case "high_demand":
        return (
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-primary to-secondary rounded-full text-white text-xs sm:text-sm font-medium shadow-md">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Rota de Alta Demanda - Preço Otimizado LogiMind</span>
            <span className="sm:hidden">Rota Padrão</span>
          </div>
        );
      case "return":
        return (
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-secondary/20 rounded-full text-secondary text-xs sm:text-sm font-medium">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Rota de Retorno - Melhor Margem</span>
            <span className="sm:hidden">Retorno</span>
          </div>
        );
      case "competitive":
        return (
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-accent/20 rounded-full text-accent text-xs sm:text-sm font-medium">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Rota Competitiva - Margem Ajustada</span>
            <span className="sm:hidden">Competitivo</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary/20 rounded-full text-primary text-xs sm:text-sm font-medium">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            Rota Padrão
          </div>
        );
    }
  };

  const handleContractFreight = async (quote: QuoteResult) => {
    try {
      setContractingCarrierId(quote.carrier_id);
      
      // Verificar autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado para contratar um frete");
        navigate("/auth");
        return;
      }

      // Chamar edge function para criar pedido
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          carrier_id: quote.carrier_id,
          carrier_name: quote.carrier_name,
          service_type: formData.service_type,
          vehicle_type: formData.vehicle_type || null,
          origin_cep: formData.origin_cep,
          origin_address: `${formData.origin_address}, ${formData.origin_number} - ${formData.origin_city}`,
          destination_cep: formData.destination_cep,
          destination_address: `${formData.destination_address}, ${formData.destination_number} - ${formData.destination_city}`,
          weight_kg: parseFloat(formData.weight_kg),
          height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
          width_cm: formData.width_cm ? parseFloat(formData.width_cm) : null,
          length_cm: formData.length_cm ? parseFloat(formData.length_cm) : null,
          base_price: quote.base_price,
          commission_applied: quote.commission_applied,
          final_price: quote.final_price,
          delivery_days: quote.delivery_days,
          external_tracking_code: null,
          driver_name: null,
          driver_phone: null
        }
      });

      if (error) {
        console.error('Error creating order:', error);
        toast.error("Erro ao contratar frete. Tente novamente.");
        return;
      }

      toast.success(`Frete contratado! Código: ${data.tracking_code}`);
      
      // Redirecionar para página de rastreamento
      setTimeout(() => {
        navigate(`/tracking/${data.tracking_code}`);
      }, 1500);

    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error("Erro inesperado ao contratar frete");
    } finally {
      setContractingCarrierId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-20 md:pt-24 pb-8 md:pb-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 md:mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Cotação de Frete com{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                LogiMind
              </span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Precificação inteligente baseada em rotas e demanda
            </p>
          </div>

          {/* Seletor de Serviço - Antes do Stepper */}
          <Card className="p-4 md:p-6 mb-4 md:mb-6 shadow-md">
            <h3 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Escolha o tipo de serviço</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, service_type: "ltl" })}
                className={`p-4 md:p-6 rounded-lg border-2 transition-all text-left ${
                  formData.service_type === "ltl"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
                  <Package className="h-5 w-5 md:h-6 md:w-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-bold text-base md:text-lg">Frete Padrão (LTL)</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Carga Fracionada
                    </p>
                  </div>
                </div>
                <p className="text-sm">
                  Consolidado, econômico. Ideal para caixas e pallets.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                    📦 Caixas
                  </span>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                    🏭 Pallets
                  </span>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                    💰 Econômico
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, service_type: "ftl" })}
                className={`p-4 md:p-6 rounded-lg border-2 transition-all text-left ${
                  formData.service_type === "ftl"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50"
                }`}
              >
                <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
                  <Package className="h-5 w-5 md:h-6 md:w-6 text-accent mt-1" />
                  <div>
                    <h4 className="font-bold text-base md:text-lg">Frete Dedicado (FTL)</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Veículo Exclusivo
                    </p>
                  </div>
                </div>
                <p className="text-sm">
                  Veículo exclusivo, urgência. Motoristas e Veículos Dedicados.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-md">
                    🚚 Caminhão Completo
                  </span>
                  <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-md">
                    🏍️ Entregas Rápidas
                  </span>
                  <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-md">
                    ⚡ Urgente
                  </span>
                </div>
              </button>
            </div>

            {formData.service_type === "ftl" && (
              <div className="mt-4 p-4 bg-accent/5 border-2 border-accent/30 rounded-lg animate-fade-in shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">
                      <strong className="text-accent">Novo Recurso:</strong> Sistema de Lances para FTL
                    </p>
                    <p className="text-sm text-muted-foreground">
                      No serviço Dedicado, você receberá ofertas de motoristas autônomos qualificados 
                      que darão lances de preço e prazo para sua carga em tempo real.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-4 md:p-6 mb-6 md:mb-8 shadow-md">
            <Stepper steps={steps} currentStep={currentStep} className="mb-6 md:mb-8" />
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Localidades (Origin/Destination) */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-6">
                    {/* CEP e Endereço de Origem */}
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                      <h3 className="font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Endereço de Origem
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="origin_cep">CEP *</Label>
                          <Input
                            id="origin_cep"
                            placeholder="00000-000"
                            value={formData.origin_cep}
                            onChange={(e) => {
                              setFormData({ ...formData, origin_cep: e.target.value });
                              if (e.target.value.replace(/\D/g, "").length === 8) {
                                fetchCepData(e.target.value, "origin");
                              }
                            }}
                            disabled={loadingCep === "origin"}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="origin_number">Número *</Label>
                          <Input
                            id="origin_number"
                            placeholder="123"
                            value={formData.origin_number}
                            onChange={(e) => setFormData({ ...formData, origin_number: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      {formData.origin_address && (
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Logradouro</Label>
                            <Input value={formData.origin_address} disabled />
                          </div>
                          <div className="space-y-2">
                            <Label>Bairro</Label>
                            <Input value={formData.origin_neighborhood} disabled />
                          </div>
                          <div className="space-y-2">
                            <Label>Cidade</Label>
                            <Input value={formData.origin_city} disabled />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="origin_type">Tipo de Local</Label>
                        <select
                          id="origin_type"
                          value={formData.origin_type}
                          onChange={(e) => setFormData({ ...formData, origin_type: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="commercial">Comercial</option>
                          <option value="residential">Residencial</option>
                        </select>
                      </div>
                    </div>

                    {/* CEP e Endereço de Destino */}
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                      <h3 className="font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Endereço de Destino
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="destination_cep">CEP *</Label>
                          <Input
                            id="destination_cep"
                            placeholder="00000-000"
                            value={formData.destination_cep}
                            onChange={(e) => {
                              setFormData({ ...formData, destination_cep: e.target.value });
                              if (e.target.value.replace(/\D/g, "").length === 8) {
                                fetchCepData(e.target.value, "destination");
                              }
                            }}
                            disabled={loadingCep === "destination"}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="destination_number">Número *</Label>
                          <Input
                            id="destination_number"
                            placeholder="123"
                            value={formData.destination_number}
                            onChange={(e) => setFormData({ ...formData, destination_number: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      {formData.destination_address && (
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Logradouro</Label>
                            <Input value={formData.destination_address} disabled />
                          </div>
                          <div className="space-y-2">
                            <Label>Bairro</Label>
                            <Input value={formData.destination_neighborhood} disabled />
                          </div>
                          <div className="space-y-2">
                            <Label>Cidade</Label>
                            <Input value={formData.destination_city} disabled />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="destination_type">Tipo de Local</Label>
                        <select
                          id="destination_type"
                          value={formData.destination_type}
                          onChange={(e) => setFormData({ ...formData, destination_type: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="commercial">Comercial</option>
                          <option value="residential">Residencial</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={handleBack}>
                      Voltar
                    </Button>
                    <Button type="button" onClick={handleNext}>
                      Próximo
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Carga (Weight and Dimensions or Vehicle Type) */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* Peso - Sempre exibido */}
                  <div className="space-y-2">
                    <Label htmlFor="weight_kg">
                      <Package className="h-4 w-4 inline mr-2" />
                      Peso (kg) *
                    </Label>
                    <Input
                      id="weight_kg"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                      required
                    />
                  </div>

                  {/* Condicional: LTL mostra dimensões, FTL mostra tipo de veículo */}
                  {formData.service_type === "ltl" ? (
                    <>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="height_cm">Altura (cm) - Opcional</Label>
                          <Input
                            id="height_cm"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.height_cm}
                            onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="width_cm">Largura (cm) - Opcional</Label>
                          <Input
                            id="width_cm"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.width_cm}
                            onChange={(e) => setFormData({ ...formData, width_cm: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="length_cm">Comprimento (cm) - Opcional</Label>
                          <Input
                            id="length_cm"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.length_cm}
                            onChange={(e) => setFormData({ ...formData, length_cm: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="vehicle_type">Tipo de Veículo Necessário *</Label>
                      <select
                        id="vehicle_type"
                        value={formData.vehicle_type}
                        onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      >
                        <option value="">Selecione o tipo de veículo</option>
                        <option value="moto">🏍️ Moto</option>
                        <option value="carro">🚗 Carro Baú</option>
                        <option value="picape">🚙 Picape</option>
                        <option value="caminhao_toco">🚚 Caminhão Toco</option>
                        <option value="caminhao_truck">🚛 Caminhão Truck</option>
                      </select>
                    </div>
                   )}

                  {/* Valor da Carga (Opcional para LogiGuard Pro) */}
                  <div className="space-y-2 p-4 bg-accent/5 border border-accent/30 rounded-lg">
                    <Label htmlFor="cargo_value" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-accent" />
                      Valor da Carga (R$) - Opcional
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Informe o valor declarado da carga para receber recomendação de serviços de segurança (LogiGuard Pro)
                    </p>
                    <Input
                      id="cargo_value"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.cargo_value}
                      onChange={(e) => setFormData({ ...formData, cargo_value: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={handleBack}>
                      Voltar
                    </Button>
                    <Button type="button" onClick={handleNext}>
                      Próximo
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Confirme os dados da cotação</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo de Serviço</p>
                        <p className="font-medium">
                          {formData.service_type === "ltl" ? "Padrão / Econômico (LTL)" : "Dedicado / Expresso (FTL)"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Peso</p>
                        <p className="font-medium">{formData.weight_kg} kg</p>
                      </div>
                      {formData.service_type === "ftl" && formData.vehicle_type && (
                        <div>
                          <p className="text-sm text-muted-foreground">Tipo de Veículo</p>
                          <p className="font-medium">
                            {formData.vehicle_type === "moto" && "🏍️ Moto"}
                            {formData.vehicle_type === "carro" && "🚗 Carro Baú"}
                            {formData.vehicle_type === "picape" && "🚙 Picape"}
                            {formData.vehicle_type === "caminhao_toco" && "🚚 Caminhão Toco"}
                            {formData.vehicle_type === "caminhao_truck" && "🚛 Caminhão Truck"}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">CEP Origem</p>
                        <p className="font-medium">{formData.origin_cep} - Nº {formData.origin_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CEP Destino</p>
                        <p className="font-medium">{formData.destination_cep} - Nº {formData.destination_number}</p>
                      </div>
                      {formData.height_cm && (
                        <div>
                          <p className="text-sm text-muted-foreground">Altura</p>
                          <p className="font-medium">{formData.height_cm} cm</p>
                        </div>
                      )}
                      {formData.width_cm && (
                        <div>
                          <p className="text-sm text-muted-foreground">Largura</p>
                          <p className="font-medium">{formData.width_cm} cm</p>
                        </div>
                      )}
                      {formData.length_cm && (
                        <div>
                          <p className="text-sm text-muted-foreground">Comprimento</p>
                          <p className="font-medium">{formData.length_cm} cm</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={handleBack}>
                      Voltar
                    </Button>
                    <Button
                      type="submit" 
                      variant="hero" 
                      size="lg" 
                      disabled={loading}
                      className="w-full sm:w-auto"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          <span className="hidden sm:inline">Processando com LogiMind...</span>
                          <span className="sm:hidden">Processando...</span>
                        </>
                      ) : (
                        "Gerar Cotação"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Card>

              {quotes.length > 0 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-center">
                  {getRouteTypeBadge()}
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="text-sm text-muted-foreground font-medium">Ordenar por:</span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={sortBy === "price" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy("price")}
                      className="flex-1 sm:flex-none min-w-0"
                    >
                      <span className="hidden sm:inline">Menor Preço</span>
                      <span className="sm:hidden">Preço</span>
                    </Button>
                    <Button
                      variant={sortBy === "delivery" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy("delivery")}
                      className="flex-1 sm:flex-none min-w-0"
                    >
                      <span className="hidden sm:inline">Menor Prazo</span>
                      <span className="sm:hidden">Prazo</span>
                    </Button>
                    <Button
                      variant={sortBy === "quality" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy("quality")}
                      className="flex-1 sm:flex-none min-w-0"
                    >
                      Qualidade
                    </Button>
                  </div>
                </div>
              </div>

              {/* Alerta de Urgência para Rotas de Alta Demanda */}
              {routeType === "high_demand" && (
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30 rounded-lg mb-6 animate-pulse-subtle">
                  <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">⏱️ Preço Dinâmico - Oferta Limitada</p>
                    <p className="text-sm text-muted-foreground">
                      Este preço de <strong className="text-primary">Comissão Reduzida</strong> é válido por <strong className="text-primary">2 horas</strong> devido à demanda dinâmica da rota. 
                      Garanta agora a melhor oferta do mercado!
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {getSortedQuotes().map((quote, index) => {
                  const isBestPrice = index === 0 && sortBy === "price";
                  const isFastest = index === 0 && sortBy === "delivery";
                  
                  return (
                    <Card 
                      key={quote.carrier_id}
                      className="relative overflow-hidden hover:shadow-xl transition-fast border border-border/50 flex flex-col rounded-xl animate-fade-in bg-card"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Ribbon lateral de destaque */}
                      {(isBestPrice || isFastest) && (
                        <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                          isBestPrice ? "bg-secondary" : "bg-accent"
                        }`} />
                      )}

                      <div className="p-4 md:p-6 flex flex-col h-full">
                        {/* Header com nome, rating e badge */}
                        <div className="flex items-start justify-between pb-3 md:pb-4 border-b border-dashed border-border mb-4 md:mb-5">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base md:text-lg font-bold mb-1 flex items-center gap-2 flex-wrap">
                              <span className="truncate">{quote.carrier_name}</span>
                              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded font-medium flex-shrink-0 flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {formData.service_type === "ltl" ? "LTL" : "FTL"}
                              </span>
                            </h3>
                            {quote.carrier_size && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                {quote.carrier_size === 'autonomous' && (
                                  <>
                                    <Truck className="h-3 w-3 text-accent" />
                                    <span className="text-accent font-medium">Motorista Autônomo Certificado</span>
                                  </>
                                )}
                                {quote.carrier_size === 'large' && (
                                  <>
                                    <Building2 className="h-3 w-3 text-primary" />
                                    <span className="text-primary font-medium">Transportadora Parceira - Frota Grande</span>
                                  </>
                                )}
                                {quote.carrier_size === 'medium' && (
                                  <>
                                    <Building2 className="h-3 w-3 text-primary" />
                                    <span className="text-primary font-medium">Transportadora Parceira - Médio Porte</span>
                                  </>
                                )}
                                {quote.carrier_size === 'small' && (
                                  <>
                                    <Building2 className="h-3 w-3 text-primary" />
                                    <span className="text-primary font-medium">Transportadora Parceira - PME</span>
                                  </>
                                )}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 bg-secondary/10 px-2 md:px-2.5 py-1 rounded-full flex-shrink-0 ml-2">
                            <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center">
                              <span className="text-[10px] text-secondary-foreground">★</span>
                            </div>
                            <span className="text-xs md:text-sm font-bold text-secondary">
                              {quote.quality_index.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {/* Badge de Destaque */}
                        {(isBestPrice || isFastest || routeType === "high_demand") && (
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg mb-3 md:mb-4 text-xs font-semibold ${
                            routeType === "high_demand" && isBestPrice
                              ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border-2 border-primary/30 shadow-md" 
                              : isBestPrice 
                              ? "bg-secondary/10 text-secondary border border-secondary/20" 
                              : "bg-accent/10 text-accent border border-accent/20"
                          }`}>
                            <span className="text-base">
                              {routeType === "high_demand" && isBestPrice ? "🏆" : isBestPrice ? "💰" : "⚡"}
                            </span>
                            {routeType === "high_demand" && isBestPrice ? "Melhor Preço LogiMind - Oferta de Volume" : isBestPrice ? "Melhor Preço" : "Mais Rápido"}
                          </div>
                        )}

                        {/* Economia para Rotas de Alta Demanda */}
                        {routeType === "high_demand" && isBestPrice && (
                          <div className="flex items-center gap-2 p-2.5 bg-secondary/10 border border-secondary/20 rounded-lg mb-3 md:mb-4">
                            <TrendingUp className="h-4 w-4 text-secondary flex-shrink-0" />
                            <p className="text-xs font-semibold text-secondary">
                              Preço 4% Abaixo da Média de Mercado! 🎯
                            </p>
                          </div>
                        )}

                        {/* Seção de Preço - DESTAQUE CENTRAL */}
                        <div className="text-center py-3 mb-3">
                          <p className="text-[10px] md:text-xs text-muted-foreground mb-1.5 uppercase tracking-wide flex items-center justify-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Preço Final LogiMarket
                          </p>
                          <div className="text-[1.75rem] md:text-[2rem] font-extrabold text-primary leading-tight animate-fade-in">
                            {formatarMoeda(quote.final_price)}
                          </div>
                        </div>

                        {/* Métricas em Cards Internos */}
                        <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                          {/* Prazo de Entrega - DESTAQUE LARANJA com Hierarquia 1.1em */}
                          <div className="flex items-center gap-2 md:gap-3 p-3 md:p-3.5 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg border-2 border-accent/30 shadow-accent transition-fast hover:shadow-lg hover:border-accent/40">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                              <Clock className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] md:text-xs text-accent/80 font-semibold uppercase tracking-wide">
                                Prazo de Entrega
                              </p>
                              <p className="text-[1.1rem] md:text-[1.2rem] font-extrabold text-accent">
                                {quote.delivery_days} {quote.delivery_days === 1 ? 'Dia' : 'Dias'} Úteis
                              </p>
                            </div>
                            <Zap className="h-5 w-5 md:h-6 md:w-6 text-accent flex-shrink-0" />
                          </div>

                          {/* Detalhes LogiMind - Discreto e Secundário com Hierarquia 0.85em */}
                          <div className="bg-muted/30 rounded-lg p-2.5 md:p-3 space-y-1.5 md:space-y-2 text-left text-[0.85rem]">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5 md:mb-2 flex items-center gap-1 opacity-70">
                              <Info className="h-3 w-3" />
                              Detalhes LogiMind
                            </p>
                            
                            {/* Preço Base */}
                            <div className="flex justify-between items-center text-[0.8rem]">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                Preço base:
                              </span>
                              <span className="font-medium text-foreground/80">
                                {formatarMoeda(quote.base_price)}
                              </span>
                            </div>

                            {/* Comissão */}
                            <div className="flex justify-between items-center text-[0.8rem]">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                Comissão aplicada:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-primary/80">
                                  {formatarPorcentagemSimples(quote.commission_applied)}
                                </span>
                                {quote.adjustment_reason === 'ROUTE_OPTIMIZED' && quote.commission_applied >= 0.15 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info className="h-3 w-3 text-primary flex-shrink-0" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p className="text-sm">
                                          <strong>Rota Otimizada:</strong> Comissão ajustada para rotas com menor ocupação. 
                                          Isso ajuda a transportadora a maximizar eficiência operacional.
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {quote.adjustment_reason === 'HIGH_DEMAND_ROUTE' && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info className="h-3 w-3 text-primary flex-shrink-0" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30">
                                        <div className="space-y-2">
                                          <p className="text-sm font-semibold text-primary flex items-center gap-1">
                                            <Zap className="h-4 w-4" />
                                            LogiMind 3.0 - Rota de Alta Liquidez
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            📈 <strong>Análise de Rota:</strong> Esta é uma rota com alto volume de fretes, 
                                            o que nos permite reduzir nossa margem.
                                          </p>
                                          <div className="border-t border-primary/20 pt-2 space-y-1">
                                            <p className="text-xs"><strong>Base (Transportadora):</strong> {formatarMoeda(quote.base_price)}</p>
                                            <p className="text-xs text-primary">
                                              <strong>Comissão da Plataforma:</strong> {formatarPorcentagemSimples(quote.commission_applied)} 
                                              <span className="text-muted-foreground"> (Normalmente 10%)</span>
                                            </p>
                                          </div>
                                          <p className="text-xs font-semibold text-secondary border-t border-secondary/20 pt-2">
                                            💡 <strong>Vantagem:</strong> LogiMarket reduziu sua comissão em até 40% para garantir 
                                            o preço final mais baixo do mercado!
                                          </p>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {quote.adjustment_reason === 'COMPETITION' && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info className="h-3 w-3 text-secondary flex-shrink-0" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p className="text-sm">
                                          💡 <strong>LogiMind 2.0:</strong> Comissão reduzida automaticamente para garantir 
                                          o melhor preço do mercado. Você economiza e a plataforma permanece competitiva!
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </div>

                            {/* Motivo do Ajuste */}
                            {quote.adjustment_reason && (
                              <div className="flex items-start gap-1.5 pt-1">
                                <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <p className="text-[0.7rem] text-muted-foreground leading-tight opacity-80">
                                  {quote.adjustment_reason === 'HIGH_DEMAND_ROUTE' && "Rota de alta liquidez - Comissão reduzida para competitividade máxima"}
                                  {quote.adjustment_reason === 'SUBSIDIZED_ROUTE' && "Rota com menor ocupação - Subsídio LogiMind aplicado"}
                                  {quote.adjustment_reason === 'COMPETITION' && "Preço otimizado por competição de mercado"}
                                  {quote.adjustment_reason === 'ROUTE_OPTIMIZED' && "Rota com menor ocupação - Otimização LogiMind"}
                                  {quote.adjustment_reason === 'STANDARD' && "Comissão padrão aplicada"}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Alerta de Restrição */}
                        {(restrictedAreas.origin || restrictedAreas.destination) && (
                          <div className="flex items-start gap-2 p-2 md:p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-3 md:mb-4">
                            <span className="text-sm md:text-base flex-shrink-0">⚠️</span>
                            <div className="text-xs text-amber-700 dark:text-amber-300 min-w-0">
                              <p className="font-semibold">Área com Restrição</p>
                              <p className="text-[10px] mt-0.5 leading-tight">
                                Possível acréscimo ou restrição de horário
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Botão Contratar */}
                        <Button 
                          variant="hero" 
                          size="lg" 
                          className="w-full mt-auto shadow-md hover:shadow-lg transition-shadow text-sm md:text-base"
                          onClick={() => handleContractFreight(quote)}
                          disabled={contractingCarrierId !== null}
                        >
                          {contractingCarrierId === quote.carrier_id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Contratando...
                            </>
                          ) : (
                            "Contratar Este Frete"
                          )}
                        </Button>

                        {/* LogiGuard Pro - Upgrade de Segurança */}
                        {quote.logiguard_pro?.available && (
                          <div className={`mt-4 p-4 rounded-lg border-2 ${
                            quote.logiguard_pro.recommended 
                              ? 'bg-gradient-to-br from-accent/10 to-secondary/10 border-accent shadow-md' 
                              : 'bg-muted/30 border-border'
                          }`}>
                            {/* Selo Recomendado */}
                            {quote.logiguard_pro.recommended && (
                              <div className="flex items-center gap-2 mb-3 px-2 py-1 bg-accent/20 border border-accent rounded-md w-fit">
                                <span className="text-lg">🛡️</span>
                                <span className="text-xs font-bold text-accent uppercase tracking-wide">
                                  RECOMENDADO
                                </span>
                              </div>
                            )}

                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-bold text-sm flex items-center gap-2 mb-1">
                                  <span className="text-base">🛡️</span>
                                  LogiGuard Pro
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Rastreamento 24/7 + Escolta Digital
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">+</p>
                                <p className="text-lg font-bold text-accent">
                                  {formatarMoeda(quote.logiguard_pro.total_price)}
                                </p>
                              </div>
                            </div>

                            {/* Descrição */}
                            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                              Monitore sua carga em tempo real. Inclui seguro adicional contra roubo e 
                              acionamento automático de Escolta Digital em zonas de risco.
                            </p>

                            {/* Justificativa LogiMind */}
                            <div className="p-2.5 bg-background/50 rounded border border-border mb-3">
                              <p className="text-[10px] text-muted-foreground font-semibold mb-1 uppercase">
                                ⚙️ Análise LogiMind
                              </p>
                              <p className="text-xs text-foreground/80 leading-relaxed">
                                {formData.cargo_value && parseFloat(formData.cargo_value) > 100000 && (
                                  <>Recomendamos este serviço devido ao <strong>alto valor da sua carga</strong> (R$ {parseFloat(formData.cargo_value).toLocaleString('pt-BR', {minimumFractionDigits: 2})}) e o </>
                                )}
                                {(!formData.cargo_value || parseFloat(formData.cargo_value) <= 100000) && (
                                  <>Recomendamos este serviço devido ao </>
                                )}
                                <strong>Fator de Risco {(quote.logiguard_pro.risk_factor * 100).toFixed(0)}%</strong> desta rota.
                              </p>
                            </div>

                            {/* Checkbox/Toggle para adicionar */}
                            <label className="flex items-center gap-3 cursor-pointer hover:bg-background/50 p-2 rounded transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedLogiGuard[quote.carrier_id] || false}
                                onChange={(e) => setSelectedLogiGuard({
                                  ...selectedLogiGuard,
                                  [quote.carrier_id]: e.target.checked
                                })}
                                className="w-5 h-5 text-accent border-2 border-border rounded focus:ring-2 focus:ring-accent focus:ring-offset-0"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-semibold">
                                  Adicionar LogiGuard Pro
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Preço total com segurança: <strong className="text-foreground">
                                    {formatarMoeda(quote.final_price + quote.logiguard_pro.total_price)}
                                  </strong>
                                </p>
                              </div>
                            </label>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quote;
