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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                {getSortedQuotes().map((quote, index) => {
                  const isBestPrice = index === 0 && sortBy === "price";
                  const isFastest = index === 0 && sortBy === "delivery";
                  
                  return (
                    <Card 
                      key={quote.carrier_id}
                      className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border border-border flex flex-col rounded-xl animate-fade-in bg-card h-full"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Ribbon lateral de destaque */}
                      {(isBestPrice || isFastest) && (
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          isBestPrice ? "bg-secondary" : "bg-accent"
                        }`} />
                      )}

                      <div className="p-4 flex flex-col h-full">
                        {/* Header compacto com nome e rating */}
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
                          <div className="flex-1 min-w-0 mr-2">
                            <h3 className="text-base font-bold mb-1 truncate flex items-center gap-2">
                              {quote.carrier_name}
                              {formData.service_type === "ltl" ? (
                                <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">
                                  LTL
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent rounded font-medium">
                                  FTL
                                </span>
                              )}
                            </h3>
                            {quote.carrier_size && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                {quote.carrier_size === 'large' && '🏢 Frota Grande'}
                                {quote.carrier_size === 'medium' && '🏢 Médio Porte'}
                                {quote.carrier_size === 'small' && '🏢 PME'}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded-full flex-shrink-0">
                            <span className="text-[10px] text-secondary">★</span>
                            <span className="text-xs font-bold text-secondary">
                              {quote.quality_index.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {/* Badge de Destaque - Compacto */}
                        {(isBestPrice || isFastest || routeType === "high_demand") && (
                          <div className="mb-2">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold ${
                              routeType === "high_demand" && isBestPrice
                                ? "bg-gradient-to-r from-primary/15 to-secondary/15 text-primary border border-primary/30" 
                                : isBestPrice 
                                ? "bg-secondary/10 text-secondary border border-secondary/20" 
                                : "bg-accent/10 text-accent border border-accent/20"
                            }`}>
                              <span className="text-xs">
                                {routeType === "high_demand" && isBestPrice ? "🏆" : isBestPrice ? "💰" : "⚡"}
                              </span>
                              {routeType === "high_demand" && isBestPrice ? "Melhor Preço" : isBestPrice ? "Melhor Preço" : "Mais Rápido"}
                            </div>
                          </div>
                        )}

                        {/* Preço Final - Destaque Máximo com altura fixa */}
                        <div className="text-center py-3 mb-3 bg-primary/5 rounded-lg border border-primary/10" style={{ minHeight: '85px' }}>
                          <p className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wider">
                            Preço Final
                          </p>
                          <div className="text-3xl font-black text-primary leading-none mb-1">
                            {formatarMoeda(quote.final_price)}
                          </div>
                          {routeType === "high_demand" && isBestPrice && (
                            <p className="text-[9px] text-secondary font-semibold">
                              -4% vs. Mercado 🎯
                            </p>
                          )}
                        </div>

                        {/* Prazo - Compacto */}
                        <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-accent/5 to-accent/10 rounded-md border border-accent/20 mb-3">
                          <Clock className="h-4 w-4 text-accent flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-[9px] text-accent/70 uppercase tracking-wide">Entrega</p>
                            <p className="text-sm font-bold text-accent leading-tight">
                              {quote.delivery_days} {quote.delivery_days === 1 ? 'dia' : 'dias'} úteis
                            </p>
                          </div>
                        </div>

                        {/* Detalhes LogiMind - Discreto */}
                        <div className="bg-muted/20 rounded-md p-2 mb-3 text-[10px]">
                          <p className="text-[8px] uppercase tracking-wide text-muted-foreground font-medium mb-1.5 flex items-center gap-1">
                            <Info className="h-2.5 w-2.5" />
                            Detalhes
                          </p>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Base:</span>
                              <span className="font-medium">{formatarMoeda(quote.base_price)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Comissão:</span>
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-primary">
                                  {formatarPorcentagemSimples(quote.commission_applied)}
                                </span>
                                {(quote.adjustment_reason === 'HIGH_DEMAND_ROUTE' || quote.adjustment_reason === 'COMPETITION') && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info className="h-2.5 w-2.5 text-primary" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-[200px] text-xs">
                                        {quote.adjustment_reason === 'HIGH_DEMAND_ROUTE' && (
                                          <p>Rota de alta demanda - comissão reduzida para melhor preço</p>
                                        )}
                                        {quote.adjustment_reason === 'COMPETITION' && (
                                          <p>Preço ajustado para competitividade de mercado</p>
                                        )}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Alerta de Restrição */}
                        {(restrictedAreas.origin || restrictedAreas.destination) && (
                          <div className="flex items-center gap-1.5 p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md mb-3">
                            <span className="text-xs">⚠️</span>
                            <p className="text-[9px] text-amber-700 dark:text-amber-300 font-medium">
                              Área com restrição
                            </p>
                          </div>
                        )}

                        {/* LogiGuard Pro - Compacto */}
                        {quote.logiguard_pro?.available && (
                          <div className={`mb-3 p-2 rounded-md border text-[10px] ${
                            quote.logiguard_pro.recommended 
                              ? 'bg-accent/5 border-accent/30' 
                              : 'bg-muted/20 border-border'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1">
                                <span className="text-xs">🛡️</span>
                                <span className="font-bold text-[10px]">LogiGuard Pro</span>
                                {quote.logiguard_pro.recommended && (
                                  <span className="text-[8px] px-1 py-0.5 bg-accent/20 text-accent rounded font-bold">
                                    RECOMENDADO
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-accent text-xs">
                                +{formatarMoeda(quote.logiguard_pro.total_price)}
                              </span>
                            </div>
                            <p className="text-[9px] text-muted-foreground mb-1.5 leading-tight">
                              Rastreamento 24/7 + Escolta Digital
                            </p>
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-background/50 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={selectedLogiGuard[quote.carrier_id] || false}
                                onChange={(e) => setSelectedLogiGuard({
                                  ...selectedLogiGuard,
                                  [quote.carrier_id]: e.target.checked
                                })}
                                className="w-3 h-3 text-accent rounded"
                              />
                              <span className="text-[9px] font-medium">Adicionar ao frete</span>
                            </label>
                          </div>
                        )}

                        {/* Botão Contratar - Fixo no bottom */}
                        <Button 
                          variant="hero" 
                          size="lg" 
                          className="w-full mt-auto"
                          onClick={() => handleContractFreight(quote)}
                          disabled={contractingCarrierId !== null}
                        >
                          {contractingCarrierId === quote.carrier_id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Contratando...
                            </>
                          ) : (
                            "Contratar Frete"
                          )}
                        </Button>
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
