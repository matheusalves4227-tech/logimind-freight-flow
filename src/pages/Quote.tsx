import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Package, MapPin, Loader2, TrendingUp, Info, Truck, Clock, DollarSign, Zap, Building2, CreditCard, QrCode } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Stepper } from "@/components/ui/stepper";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatarMoeda, formatarPorcentagemSimples, formatarPeso, removerFormatacaoPeso, formatarValorMonetario, removerFormatacaoMonetaria } from "@/lib/formatters";
import { WeightInput } from "@/components/ui/weight-input";
import { MoneyInput } from "@/components/ui/money-input";
import { DimensionInput } from "@/components/ui/dimension-input";
import { PixPaymentModal } from "@/components/payment/PixPaymentModal";
import { PaymentMethodModal } from "@/components/payment/PaymentMethodModal";
import { ServiceTypeSelector } from "@/components/quote/ServiceTypeSelector";
import { AddressForm } from "@/components/quote/AddressForm";

interface ANTTReference {
  piso_minimo: number;
  distancia_km: number;
  eixos: number;
  tipo_carga: string;
  ccd_aplicado: number;
  cc_aplicado: number;
  retorno_vazio: boolean;
}

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
  antt_piso_minimo?: {
    valor: number;
    ccd_aplicado: number;
    cc_aplicado: number;
    tipo_carga: string;
    eixos: number;
    distancia_km: number;
    retorno_vazio: boolean;
  };
}

type SortOption = "price" | "delivery" | "quality";

const Quote = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [checkingAuth, setCheckingAuth] = useState(true);
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
  const [anttReference, setAnttReference] = useState<ANTTReference | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("price");
  const [loadingCep, setLoadingCep] = useState<"origin" | "destination" | null>(null);
  const [restrictedAreas, setRestrictedAreas] = useState<{origin: boolean, destination: boolean}>({
    origin: false,
    destination: false
  });
  const [contractingCarrierId, setContractingCarrierId] = useState<string | null>(null);
  const [selectedLogiGuard, setSelectedLogiGuard] = useState<{ [key: string]: boolean }>({});
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string>("");
  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string>("");
  const [pendingOrderAmount, setPendingOrderAmount] = useState<number>(0);
  const [pendingTrackingCode, setPendingTrackingCode] = useState<string>("");

  const steps = [
    { label: "Localidades", description: "Origem e destino" },
    { label: "Carga", description: "Peso e dimensões" },
    { label: "Revisar", description: "Confirmar dados" },
  ];

  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Você precisa fazer login para solicitar cotações");
        navigate("/auth?redirect=/quote&reason=quote");
        return;
      }

      // Verificar se é motorista - motoristas não podem fazer cotações
      const { data: driverProfile } = await supabase
        .from('driver_profiles')
        .select('id, status')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (driverProfile) {
        toast.error("Motoristas não têm acesso à área de cotações. Acesse o Dashboard do Motorista.");
        navigate("/motorista/dashboard");
        return;
      }
      
      setCheckingAuth(false);
    };

    checkAuth();
  }, [navigate]);

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
      // Step 1: Localidades - Validação robusta
      const originCepClean = formData.origin_cep.replace(/\D/g, '');
      const destCepClean = formData.destination_cep.replace(/\D/g, '');

      if (!formData.origin_cep || !formData.destination_cep) {
        toast.error("Preencha os CEPs de origem e destino");
        return;
      }

      if (originCepClean.length !== 8 || destCepClean.length !== 8) {
        toast.error("CEPs devem ter 8 dígitos");
        return;
      }

      if (originCepClean === '00000000' || destCepClean === '00000000') {
        toast.error("CEP inválido: não pode ser 00000-000");
        return;
      }

      if (!formData.origin_number || !formData.destination_number) {
        toast.error("Preencha os números dos endereços");
        return;
      }

      if (!formData.origin_address || !formData.destination_address) {
        toast.error("Erro ao buscar endereços dos CEPs. Verifique se os CEPs são válidos");
        return;
      }

      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Step 2: Carga - Validação de peso e dimensões
      const weight = parseFloat(formData.weight_kg.replace(',', '.'));
      
      if (!formData.weight_kg || isNaN(weight)) {
        toast.error("Preencha o peso da carga");
        return;
      }

      if (weight <= 0) {
        toast.error("O peso deve ser maior que zero");
        return;
      }

      if (weight > 30000) {
        toast.error("Peso excede o limite máximo de 30.000 kg");
        return;
      }

      // Validar dimensões apenas se preenchidas (são opcionais)
      if (formData.height_cm || formData.width_cm || formData.length_cm) {
        const height = formData.height_cm ? parseFloat(formData.height_cm) : 0;
        const width = formData.width_cm ? parseFloat(formData.width_cm) : 0;
        const length = formData.length_cm ? parseFloat(formData.length_cm) : 0;

        if (formData.height_cm && (isNaN(height) || height <= 0)) {
          toast.error("Altura deve ser um número válido maior que zero");
          return;
        }

        if (formData.width_cm && (isNaN(width) || width <= 0)) {
          toast.error("Largura deve ser um número válido maior que zero");
          return;
        }

        if (formData.length_cm && (isNaN(length) || length <= 0)) {
          toast.error("Comprimento deve ser um número válido maior que zero");
          return;
        }

        if (height > 500 || width > 500 || length > 1500) {
          toast.error("Dimensões excedem limites razoáveis (Altura/Largura: 500cm, Comprimento: 1500cm)");
          return;
        }
      }

      // Validar valor da carga se preenchido
      if (formData.cargo_value) {
        const cargoValue = parseFloat(formData.cargo_value.replace(/\./g, '').replace(',', '.'));
        if (!isNaN(cargoValue) && cargoValue > 100000000) {
          toast.error("Valor da carga excede o limite máximo de R$ 100.000.000");
          return;
        }
      }

      if (formData.service_type === "ftl" && !formData.vehicle_type) {
        toast.error("Selecione o tipo de veículo");
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
      setAnttReference(data.antt_reference || null);
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
        setContractingCarrierId(null);
        navigate("/auth");
        return;
      }

      // PASSO 1: Criar pedido no sistema
      toast.loading("Criando pedido...", { id: 'contract-freight' });
      
      // Check if LogiGuard Pro was selected for this carrier
      const logiGuardSelected = selectedLogiGuard[quote.carrier_id] || false;
      const logiGuardValue = logiGuardSelected && quote.logiguard_pro?.total_price 
        ? quote.logiguard_pro.total_price 
        : null;
      
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-order', {
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
          final_price: logiGuardSelected && quote.logiguard_pro?.total_price 
            ? quote.final_price + quote.logiguard_pro.total_price 
            : quote.final_price,
          delivery_days: quote.delivery_days,
          external_tracking_code: null,
          driver_name: null,
          driver_phone: null,
          logiguard_pro_contratado: logiGuardSelected,
          logiguard_pro_valor: logiGuardValue
        }
      });

      if (orderError) {
        console.error('Error creating order:', orderError);
        toast.error("Erro ao criar pedido. Tente novamente.", { id: 'contract-freight' });
        setContractingCarrierId(null);
        return;
      }

      toast.success(`Pedido criado! Código: ${orderData.tracking_code}`, { id: 'contract-freight' });

      // PASSO 2: Mostrar modal de seleção de método de pagamento
      const finalPrice = logiGuardSelected && quote.logiguard_pro?.total_price 
        ? quote.final_price + quote.logiguard_pro.total_price 
        : quote.final_price;
      
      setPendingOrderId(orderData.order_id);
      setPendingOrderAmount(finalPrice);
      setPendingTrackingCode(orderData.tracking_code);
      setPaymentMethodModalOpen(true);
      setContractingCarrierId(null);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error("Erro inesperado ao contratar frete", { id: 'contract-freight' });
      setContractingCarrierId(null);
    }
  };

  const handleSelectPix = async () => {
    try {
      toast.loading("Gerando dados do pagamento PIX...", { id: 'payment-redirect' });

      const { data: pixPaymentData, error: pixError } = await supabase.functions.invoke(
        'create-pix-payment',
        { body: { order_id: pendingOrderId } }
      );

      if (pixError || !pixPaymentData?.pix_data) {
        console.error('Error creating PIX payment:', pixError);
        toast.error("Erro ao gerar pagamento PIX. Tente novamente.", { id: 'payment-redirect' });
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      }

      toast.dismiss('payment-redirect');
      setPixData(pixPaymentData.pix_data);
      setCurrentOrderId(pendingOrderId);
      setPixModalOpen(true);
    } catch (error) {
      console.error('PIX error:', error);
      toast.error("Erro ao gerar PIX", { id: 'payment-redirect' });
    }
  };

  const handlePixPaymentComplete = () => {
    toast.success("Comprovante enviado! Aguarde confirmação.");
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {checkingAuth ? (
        <div className="container mx-auto px-4 pt-32 pb-12">
          <div className="max-w-md mx-auto text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Verificando autenticação...</p>
          </div>
        </div>
      ) : (
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

          {/* Seletor de Serviço - Componente refatorado */}
          <ServiceTypeSelector 
            serviceType={formData.service_type}
            onServiceTypeChange={(type) => setFormData({ ...formData, service_type: type })}
          />

          <Card className="p-4 md:p-6 mb-6 md:mb-8 shadow-md rounded-xl border-border/50">
            <Stepper steps={steps} currentStep={currentStep} className="mb-8 md:mb-10" />
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Localidades (Origin/Destination) */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <AddressForm
                    formData={formData}
                    loadingCep={loadingCep}
                    onFormChange={(updates) => setFormData({ ...formData, ...updates })}
                    onCepChange={(cep, type) => fetchCepData(cep, type)}
                  />

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={handleBack} className="transition-all duration-300 hover:shadow-md">
                      Voltar
                    </Button>
                    <Button type="button" onClick={handleNext} className="transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                      Próximo
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Carga (Weight and Dimensions or Vehicle Type) */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* Peso - Sempre exibido */}
                  <WeightInput
                    value={formData.weight_kg}
                    onChange={(value) => setFormData({ ...formData, weight_kg: value.replace(/\D/g, "") })}
                    label="Peso"
                    placeholder="1500"
                    required
                  />

                  {/* Condicional: LTL mostra dimensões, FTL mostra tipo de veículo */}
                  {formData.service_type === "ltl" ? (
                    <>
                      <div className="grid md:grid-cols-3 gap-4">
                        <DimensionInput
                          value={formData.height_cm}
                          onChange={(value) => setFormData({ ...formData, height_cm: value })}
                          label="Altura (cm) - Opcional"
                          placeholder="0"
                          unit="cm"
                          maxValue={500}
                        />

                        <DimensionInput
                          value={formData.width_cm}
                          onChange={(value) => setFormData({ ...formData, width_cm: value })}
                          label="Largura (cm) - Opcional"
                          placeholder="0"
                          unit="cm"
                          maxValue={500}
                        />

                        <DimensionInput
                          value={formData.length_cm}
                          onChange={(value) => setFormData({ ...formData, length_cm: value })}
                          label="Comprimento (cm) - Opcional"
                          placeholder="0"
                          unit="cm"
                          maxValue={1500}
                        />
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
                  <MoneyInput
                    value={formData.cargo_value}
                    onChange={(value) => setFormData({ ...formData, cargo_value: value })}
                    label="Valor da Carga"
                    placeholder="10.000,00"
                  />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={handleBack} className="transition-all duration-300 hover:shadow-md">
                      Voltar
                    </Button>
                    <Button type="button" onClick={handleNext} className="transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                      Próximo
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <Card className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700/50 shadow-sm space-y-4">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Confirme os dados da cotação
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-3 bg-background rounded-lg border border-border/50">
                        <p className="text-sm text-muted-foreground">Tipo de Serviço</p>
                        <p className="font-medium">
                          {formData.service_type === "ltl" ? "Padrão / Econômico (LTL)" : "Dedicado / Expresso (FTL)"}
                        </p>
                      </div>
                      <div className="p-3 bg-background rounded-lg border border-border/50">
                        <p className="text-sm text-muted-foreground">Peso</p>
                        <p className="font-medium">{formData.weight_kg} kg</p>
                      </div>
                      {formData.service_type === "ftl" && formData.vehicle_type && (
                        <div className="p-3 bg-background rounded-lg border border-border/50">
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
                      <div className="p-3 bg-background rounded-lg border border-border/50">
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary" /> CEP Origem
                        </p>
                        <p className="font-medium">{formData.origin_cep} - Nº {formData.origin_number}</p>
                      </div>
                      <div className="p-3 bg-background rounded-lg border border-border/50">
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-secondary" /> CEP Destino
                        </p>
                        <p className="font-medium">{formData.destination_cep} - Nº {formData.destination_number}</p>
                      </div>
                      {formData.height_cm && (
                        <div className="p-3 bg-background rounded-lg border border-border/50">
                          <p className="text-sm text-muted-foreground">Altura</p>
                          <p className="font-medium">{formData.height_cm} cm</p>
                        </div>
                      )}
                      {formData.width_cm && (
                        <div className="p-3 bg-background rounded-lg border border-border/50">
                          <p className="text-sm text-muted-foreground">Largura</p>
                          <p className="font-medium">{formData.width_cm} cm</p>
                        </div>
                      )}
                      {formData.length_cm && (
                        <div className="p-3 bg-background rounded-lg border border-border/50">
                          <p className="text-sm text-muted-foreground">Comprimento</p>
                          <p className="font-medium">{formData.length_cm} cm</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={handleBack} className="transition-all duration-300 hover:shadow-md">
                      Voltar
                    </Button>
                    <Button
                      type="submit" 
                      variant="hero" 
                      size="lg" 
                      disabled={loading}
                      className="w-full sm:w-auto transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
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
                
                {/* Segmented Control de Ordenação - Melhorado */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-3">
                  <span className="text-sm text-muted-foreground font-semibold">Ordenar por:</span>
                  <div className="inline-flex p-1.5 bg-muted/50 rounded-xl border border-border shadow-sm">
                    <button
                      onClick={() => setSortBy("price")}
                      className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        sortBy === "price"
                          ? "bg-primary text-primary-foreground shadow-md -translate-y-0.5"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="hidden sm:inline">Menor Preço</span>
                        <span className="sm:hidden">Preço</span>
                      </span>
                    </button>
                    <button
                      onClick={() => setSortBy("delivery")}
                      className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        sortBy === "delivery"
                          ? "bg-accent text-accent-foreground shadow-md -translate-y-0.5"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">Menor Prazo</span>
                        <span className="sm:hidden">Prazo</span>
                      </span>
                    </button>
                    <button
                      onClick={() => setSortBy("quality")}
                      className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        sortBy === "quality"
                          ? "bg-secondary text-secondary-foreground shadow-md -translate-y-0.5"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">★</span>
                        Qualidade
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card de Referência ANTT */}
              {anttReference && (
                <TooltipProvider>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-muted/50 border border-border rounded-lg mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Piso Mínimo ANTT</p>
                        <p className="text-lg font-bold text-primary">{formatarMoeda(anttReference.piso_minimo)}</p>
                      </div>
                    </div>
                    <div className="flex-1 text-xs text-muted-foreground hidden sm:block">
                      <span>Referência legal para {anttReference.distancia_km} km | {anttReference.eixos} eixos | </span>
                      <span className="capitalize">{anttReference.tipo_carga.replace(/_/g, ' ')}</span>
                      {anttReference.retorno_vazio && <span className="text-accent"> (+94% retorno vazio)</span>}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-1.5 rounded-full hover:bg-muted cursor-help">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="font-semibold mb-1">📋 Tabela de Frete ANTT</p>
                        <p className="text-xs mb-2">
                          O piso mínimo é calculado pela fórmula oficial: 
                          <code className="bg-muted px-1 rounded">(Distância × CCD) + CC</code>
                        </p>
                        <ul className="text-xs space-y-1">
                          <li>• CCD aplicado: {formatarMoeda(anttReference.ccd_aplicado)}/km</li>
                          <li>• CC (carga/descarga): {formatarMoeda(anttReference.cc_aplicado)}</li>
                          <li>• Distância estimada: {anttReference.distancia_km} km</li>
                          <li>• Eixos do veículo: {anttReference.eixos}</li>
                        </ul>
                        <p className="text-xs mt-2 text-muted-foreground italic">
                          Fonte: Resolução ANTT nº 5.867/2020, atualização Jul/2025
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              )}

              {/* Alerta de Urgência para Rotas de Alta Demanda */}
              {routeType === "high_demand" && (
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30 rounded-lg mb-6 animate-pulse-subtle">
                  <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">⏱️ Preço Dinâmico - Oferta Limitada</p>
                    <p className="text-sm text-muted-foreground">
                      Este <strong className="text-primary">preço especial</strong> é válido por <strong className="text-primary">2 horas</strong> devido à demanda dinâmica da rota. 
                      Garanta agora a melhor oferta do mercado!
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {getSortedQuotes().map((quote, index) => {
                  const isBestPrice = index === 0 && sortBy === "price";
                  const isFastest = index === 0 && sortBy === "delivery";
                  const isBestQuality = index === 0 && sortBy === "quality";
                  
                  return (
                    <div 
                      key={quote.carrier_id}
                      className="card-quote animate-fade-in relative group transition-all duration-300 hover:shadow-lg hover:border-foreground/20"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Badge flutuante Melhor Preço */}
                      {isBestPrice && (
                        <div className="absolute -top-3 -left-2 z-10">
                          <div className="px-3 py-1.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold rounded-lg shadow-lg transform -rotate-2">
                            💰 Melhor Preço
                          </div>
                        </div>
                      )}
                      {isFastest && !isBestPrice && (
                        <div className="absolute -top-3 -left-2 z-10">
                          <div className="px-3 py-1.5 bg-gradient-to-r from-accent to-accent/80 text-accent-foreground text-xs font-bold rounded-lg shadow-lg transform -rotate-2">
                            ⚡ Mais Rápido
                          </div>
                        </div>
                      )}
                      {isBestQuality && !isBestPrice && !isFastest && (
                        <div className="absolute -top-3 -left-2 z-10">
                          <div className="px-3 py-1.5 bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground text-xs font-bold rounded-lg shadow-lg transform -rotate-2">
                            🏆 Melhor Qualidade
                          </div>
                        </div>
                      )}

                      {/* Ribbon lateral de destaque */}
                      {(isBestPrice || isFastest || isBestQuality) && (
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                          isBestPrice ? "bg-primary" : isFastest ? "bg-accent" : "bg-secondary"
                        }`} />
                      )}

                      <div className="flex flex-col h-full">
                        {/* Header com nome, tipo e rating */}
                        <div className="flex items-start justify-between mb-4 pb-3 border-b-2 border-border/30">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Truck className="h-4 w-4 text-primary flex-shrink-0" />
                              <h3 className="font-bold text-base truncate">
                                {quote.carrier_name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {formData.service_type === "ltl" ? (
                                <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-semibold">
                                  FRETE LTL
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded-full font-semibold">
                                  FRETE FTL
                                </span>
                              )}
                              {quote.carrier_size && (
                                <span className="text-[10px] text-muted-foreground">
                                  {quote.carrier_size === 'large' && '🏢 Grande'}
                                  {quote.carrier_size === 'medium' && '🏢 Média'}
                                  {quote.carrier_size === 'small' && '🏢 PME'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-secondary/10 px-2.5 py-1 rounded-full flex-shrink-0 ml-2">
                            <span className="text-xs text-secondary">★</span>
                            <span className="text-sm font-bold text-secondary">
                              {quote.quality_index.toFixed(1)}
                            </span>
                          </div>
                        </div>


                        {/* Preço Final - Destaque Máximo com altura padronizada */}
                        <div className="text-center py-4 mb-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border-2 border-primary/20" style={{ minHeight: '100px' }}>
                          <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-widest font-semibold">
                            Preço Total
                          </p>
                          <div className="price-display-lg mb-1 justify-center">
                            {formatarMoeda(quote.final_price)}
                          </div>
                          {routeType === "high_demand" && isBestPrice && (
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <span className="text-xs text-secondary font-bold">
                                Economia de 4% 🎯
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Prazo de Entrega - Destacado */}
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg border border-accent/30 mb-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-accent" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] text-accent/80 uppercase tracking-wide font-semibold mb-0.5">Prazo de Entrega</p>
                            <p className="text-base font-bold text-accent leading-tight">
                              {quote.delivery_days} {quote.delivery_days === 1 ? 'dia útil' : 'dias úteis'}
                            </p>
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
                          <div className={`mb-4 p-3 rounded-lg border-2 ${
                            quote.logiguard_pro.recommended 
                              ? 'bg-accent/10 border-accent' 
                              : 'bg-muted/20 border-border'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-base">🛡️</span>
                                <span className="font-bold text-xs">LogiGuard Pro</span>
                                {quote.logiguard_pro.recommended && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-accent text-accent-foreground rounded-full font-bold uppercase">
                                    Recomendado
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-accent text-sm">
                                +{formatarMoeda(quote.logiguard_pro.total_price)}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mb-2 leading-relaxed">
                              📡 Rastreamento 24/7 + 🚨 Escolta Digital
                            </p>
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-background/50 p-1.5 rounded transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedLogiGuard[quote.carrier_id] || false}
                                onChange={(e) => setSelectedLogiGuard({
                                  ...selectedLogiGuard,
                                  [quote.carrier_id]: e.target.checked
                                })}
                                className="w-4 h-4 text-accent rounded border-accent/30"
                              />
                              <span className="text-[10px] font-semibold">Adicionar proteção extra</span>
                            </label>
                          </div>
                        )}

                        {/* Botão Contratar - Fixo no bottom com destaque e elevação */}
                        <Button 
                          variant="hero" 
                          size="lg" 
                          className="w-full mt-auto shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
                          onClick={() => handleContractFreight(quote)}
                          disabled={contractingCarrierId !== null}
                        >
                          {contractingCarrierId === quote.carrier_id ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <Truck className="mr-2 h-5 w-5" />
                              Contratar Frete
                             </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
      
      {/* Modal de Seleção de Método de Pagamento */}
      <PaymentMethodModal
        open={paymentMethodModalOpen}
        onOpenChange={setPaymentMethodModalOpen}
        orderId={pendingOrderId}
        totalAmount={pendingOrderAmount}
        trackingCode={pendingTrackingCode}
        onSelectPix={handleSelectPix}
      />

      {/* Modal de Pagamento PIX */}
      {pixData && (
        <PixPaymentModal
          open={pixModalOpen}
          onOpenChange={setPixModalOpen}
          orderId={currentOrderId}
          pixData={pixData}
          onPaymentComplete={handlePixPaymentComplete}
        />
      )}
    </div>
  );
};

export default Quote;
