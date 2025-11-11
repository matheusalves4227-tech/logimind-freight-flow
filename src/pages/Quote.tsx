import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Package, MapPin, Loader2, TrendingUp, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Stepper } from "@/components/ui/stepper";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
}

type SortOption = "price" | "delivery" | "quality";

const Quote = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    origin_cep: "",
    destination_cep: "",
    weight_kg: "",
    height_cm: "",
    width_cm: "",
    length_cm: "",
  });
  const [quotes, setQuotes] = useState<QuoteResult[]>([]);
  const [routeType, setRouteType] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("price");

  const steps = [
    { label: "Localidades", description: "Origem e destino" },
    { label: "Carga", description: "Peso e dimensões" },
    { label: "Revisar", description: "Confirmar dados" },
  ];

  // Preencher CEPs da URL
  useEffect(() => {
    const origin = searchParams.get("origin");
    const dest = searchParams.get("dest");
    
    if (origin || dest) {
      setFormData(prev => ({
        ...prev,
        origin_cep: origin || prev.origin_cep,
        destination_cep: dest || prev.destination_cep,
      }));
    }
  }, [searchParams]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.origin_cep || !formData.destination_cep) {
        toast.error("Por favor, preencha origem e destino");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.weight_kg) {
        toast.error("Por favor, preencha o peso da carga");
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
          origin_cep: formData.origin_cep,
          destination_cep: formData.destination_cep,
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

          <Card className="p-6 mb-8 shadow-md">
            <Stepper steps={steps} currentStep={currentStep} className="mb-8" />
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="origin_cep">
                    <MapPin className="h-4 w-4 inline mr-2" />
                    CEP Origem
                  </Label>
                  <Input
                    id="origin_cep"
                    placeholder="00000-000"
                    value={formData.origin_cep}
                    onChange={(e) => setFormData({ ...formData, origin_cep: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination_cep">
                    <MapPin className="h-4 w-4 inline mr-2" />
                    CEP Destino
                  </Label>
                  <Input
                    id="destination_cep"
                    placeholder="00000-000"
                    value={formData.destination_cep}
                    onChange={(e) => setFormData({ ...formData, destination_cep: e.target.value })}
                    required
                  />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="button" onClick={handleNext}>
                    Próximo
                  </Button>
                </div>
              </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="weight_kg">
                    <Package className="h-4 w-4 inline mr-2" />
                    Peso (kg)
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
              </div>

              <div className="grid md:grid-cols-2 gap-6">
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

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Confirme os dados da cotação</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">CEP Origem</p>
                        <p className="font-medium">{formData.origin_cep}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CEP Destino</p>
                        <p className="font-medium">{formData.destination_cep}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Peso</p>
                        <p className="font-medium">{formData.weight_kg} kg</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getSortedQuotes().map((quote, index) => (
                    <Card 
                      key={quote.carrier_id}
                      className="p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
                    >
                      {/* Header com nome e tag */}
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold">{quote.carrier_name}</h3>
                          {index === 0 && (
                            <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full font-bold whitespace-nowrap ml-2">
                              Melhor Preço
                            </span>
                          )}
                        </div>
                        
                        {/* Porte e Especialidades */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {quote.carrier_size && (
                            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md font-medium">
                              {quote.carrier_size === 'large' && '🏢 Grande Porte'}
                              {quote.carrier_size === 'medium' && '🏪 Médio Porte'}
                              {quote.carrier_size === 'small' && '🏠 Pequeno Porte'}
                            </span>
                          )}
                          {quote.specialties && quote.specialties.length > 0 && (
                            quote.specialties.slice(0, 2).map((spec, i) => (
                              <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium">
                                {spec}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                      
                      {/* Índice de Qualidade - Verde */}
                      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border bg-secondary/5 -mx-6 px-6 py-3">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full ${
                                i < Math.round(quote.quality_index)
                                  ? "bg-secondary"
                                  : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-base font-bold text-secondary">
                          {quote.quality_index.toFixed(1)}
                        </span>
                        <span className="text-sm font-medium text-secondary">
                          Qualidade
                        </span>
                      </div>

                      {/* Detalhes de Precificação */}
                      <div className="text-sm text-muted-foreground space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span>Preço base:</span>
                          <span className="font-medium">R$ {quote.base_price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Comissão:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{(quote.commission_applied * 100).toFixed(1)}%</span>
                            {quote.commission_applied >= 0.15 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-primary" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="text-sm">
                                      Comissão ajustada para otimizar rota de retorno. 
                                      Você está ajudando a transportadora a ser mais eficiente!
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                        {quote.route_adjustment_factor > 0 && (
                          <div className="flex justify-between text-secondary">
                            <span className="font-medium">Ajuste LogiMind:</span>
                            <span className="font-bold">+{(quote.route_adjustment_factor * 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>

                      {/* Preço Final - Destaque */}
                      <div className="text-center py-4 bg-primary/5 rounded-lg mb-4">
                        <div className="text-4xl font-bold text-primary mb-1">
                          R$ {quote.final_price.toFixed(2)}
                        </div>
                      </div>

                      {/* Prazo de Entrega - Laranja */}
                      <div className="flex items-center justify-center gap-3 mb-6 bg-accent/10 py-4 rounded-lg -mx-6 px-6">
                        <span className="text-3xl">🕒</span>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-accent">
                            {quote.delivery_days} dias
                          </div>
                          <div className="text-xs text-accent/80 font-medium">
                            úteis
                          </div>
                        </div>
                      </div>

                      {/* Botão Contratar - No final */}
                      <Button variant="hero" size="lg" className="w-full mt-auto">
                        Contratar
                      </Button>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quote;
