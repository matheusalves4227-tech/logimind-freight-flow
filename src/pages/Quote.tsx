import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Package, MapPin, Loader2, TrendingUp, Info, Lightbulb, Truck, Clock, DollarSign, Zap } from "lucide-react";
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
      case "return":
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/20 rounded-full text-secondary text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            Rota de Retorno - Melhor Margem
          </div>
        );
      case "competitive":
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full text-accent text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            Rota Competitiva - Margem Ajustada
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full text-primary text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            Rota Padrão
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Cotação de Frete com{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                LogiMind
              </span>
            </h1>
            <p className="text-muted-foreground">
              Precificação inteligente baseada em rotas e demanda
            </p>
          </div>

          {/* Seletor de Serviço - Antes do Stepper */}
          <Card className="p-6 mb-6 shadow-md">
            <h3 className="font-semibold text-lg mb-4">Escolha o tipo de serviço</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, service_type: "ltl" })}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  formData.service_type === "ltl"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <Package className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-bold text-lg">Frete Padrão (LTL)</h4>
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
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  formData.service_type === "ftl"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50"
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <Package className="h-6 w-6 text-accent mt-1" />
                  <div>
                    <h4 className="font-bold text-lg">Frete Dedicado (FTL)</h4>
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

          <Card className="p-6 mb-8 shadow-md">
            <Stepper steps={steps} currentStep={currentStep} className="mb-8" />
            
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
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processando com LogiMind...
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex justify-center">
                  {getRouteTypeBadge()}
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground font-medium">Ordenar por:</span>
                  <div className="flex gap-2">
                    <Button
                      variant={sortBy === "price" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy("price")}
                    >
                      Menor Preço
                    </Button>
                    <Button
                      variant={sortBy === "delivery" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy("delivery")}
                    >
                      Menor Prazo
                    </Button>
                    <Button
                      variant={sortBy === "quality" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy("quality")}
                    >
                      Qualidade
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {getSortedQuotes().map((quote, index) => {
                  const isBestPrice = index === 0 && sortBy === "price";
                  const isFastest = index === 0 && sortBy === "delivery";
                  
                  return (
                    <Card 
                      key={quote.carrier_id}
                      className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border border-border/50 flex flex-col"
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
                              <p className="text-xs text-muted-foreground">
                                {quote.carrier_size === 'large' && 'Grande Porte'}
                                {quote.carrier_size === 'medium' && 'Médio Porte'}
                                {quote.carrier_size === 'small' && 'Pequeno Porte'}
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
                        {(isBestPrice || isFastest) && (
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg mb-3 md:mb-4 text-xs font-semibold ${
                            isBestPrice 
                              ? "bg-secondary/10 text-secondary border border-secondary/20" 
                              : "bg-accent/10 text-accent border border-accent/20"
                          }`}>
                            <span className="text-base">{isBestPrice ? "💰" : "⚡"}</span>
                            {isBestPrice ? "Melhor Preço" : "Mais Rápido"}
                          </div>
                        )}

                        {/* Seção de Preço - DESTAQUE CENTRAL */}
                        <div className="text-center py-3 md:py-5 mb-3 md:mb-4">
                          <p className="text-[10px] md:text-xs text-muted-foreground mb-1 uppercase tracking-wide flex items-center justify-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Preço Final LogiMarket
                          </p>
                          <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary leading-tight">
                            {formatarMoeda(quote.final_price)}
                          </div>
                        </div>

                        {/* Métricas em Cards Internos */}
                        <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                          {/* Prazo de Entrega - DESTAQUE LARANJA */}
                          <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg border-2 border-accent/20 shadow-sm">
                            <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                              <Clock className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] md:text-xs text-accent/80 font-semibold uppercase tracking-wide">
                                Prazo de Entrega
                              </p>
                              <p className="text-base md:text-lg font-extrabold text-accent">
                                {quote.delivery_days} {quote.delivery_days === 1 ? 'Dia' : 'Dias'} Úteis
                              </p>
                            </div>
                            <Zap className="h-4 w-4 md:h-5 md:w-5 text-accent flex-shrink-0" />
                          </div>

                          {/* Detalhes LogiMind - Discreto e Secundário */}
                          <div className="bg-muted/30 rounded-lg p-2.5 md:p-3 space-y-1.5 md:space-y-2 text-left">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5 md:mb-2 flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              Detalhes LogiMind
                            </p>
                            
                            {/* Preço Base */}
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                Preço base:
                              </span>
                              <span className="font-medium text-foreground">
                                {formatarMoeda(quote.base_price)}
                              </span>
                            </div>

                            {/* Comissão */}
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                Comissão aplicada:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-primary">
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
                                <p className="text-[10px] text-muted-foreground leading-tight">
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
                        >
                          Contratar Este Frete
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
