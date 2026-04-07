import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calculator, TrendingDown, DollarSign, Package, Truck, Clock, 
  Loader2, Flame, Wine, Snowflake, Gem, BoxIcon,
  FileDown, FolderPlus, Lightbulb, Target, Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CalculatorFormData {
  volume_mensal_estimado: string;
  peso_medio_kg: string;
  tipo_carga: string;
  sla_desejado: string;
  aceita_rota_retorno: boolean;
  necessita_seguro: boolean;
  logistica_reversa: boolean;
  pedagios_cliente: boolean;
  armazenagem_cliente: boolean;
}

interface PricingResult {
  preco_base_unitario: number;
  preco_com_volume_desconto: number;
  preco_com_tipo_carga: number;
  preco_com_sla: number;
  preco_com_rota_retorno: number;
  custos_adicionais: number;
  preco_final_unitario: number;
  valor_mensal_total: number;
  desconto_volume_percentual: number;
  desconto_total_percentual: number;
  economia_mensal: number;
  detalhamento: {
    base: string;
    volume: string;
    tipo_carga: string;
    sla: string;
    rota_retorno: string;
    custos_extras: string[];
  };
}

interface B2BQuoteCalculatorProps {
  quoteId?: string;
}

const cargoTypes = [
  { value: "geral", label: "Geral", icon: BoxIcon, color: "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200", activeColor: "bg-slate-600 text-white border-slate-600" },
  { value: "refrigerada", label: "Refrigerada", icon: Snowflake, color: "bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100", activeColor: "bg-sky-600 text-white border-sky-600", badge: "+30%" },
  { value: "perigosa", label: "Perigosa", icon: Flame, color: "bg-red-50 text-red-700 border-red-300 hover:bg-red-100", activeColor: "bg-red-600 text-white border-red-600", badge: "+50%" },
  { value: "fragil", label: "Frágil", icon: Wine, color: "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100", activeColor: "bg-amber-600 text-white border-amber-600", badge: "+20%" },
  { value: "alto_valor", label: "Alto Valor", icon: Gem, color: "bg-violet-50 text-violet-700 border-violet-300 hover:bg-violet-100", activeColor: "bg-violet-600 text-white border-violet-600", badge: "+40%" },
];

const B2BQuoteCalculator = ({ quoteId }: B2BQuoteCalculatorProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<PricingResult | null>(null);
  
  const [formData, setFormData] = useState<CalculatorFormData>({
    volume_mensal_estimado: "",
    peso_medio_kg: "",
    tipo_carga: "geral",
    sla_desejado: "standard",
    aceita_rota_retorno: false,
    necessita_seguro: false,
    logistica_reversa: false,
    pedagios_cliente: false,
    armazenagem_cliente: false,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = async () => {
    if (!formData.volume_mensal_estimado || !formData.peso_medio_kg) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o volume mensal e peso médio para calcular.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const requestBody = quoteId 
        ? { quote_id: quoteId }
        : {
            quote_data: {
              volume_mensal_estimado: parseInt(formData.volume_mensal_estimado),
              peso_medio_kg: parseFloat(formData.peso_medio_kg),
              tipo_carga: formData.tipo_carga,
              sla_desejado: formData.sla_desejado,
              aceita_rota_retorno: formData.aceita_rota_retorno,
              necessita_seguro: formData.necessita_seguro,
              logistica_reversa: formData.logistica_reversa,
              pedagios_cliente: formData.pedagios_cliente,
              armazenagem_cliente: formData.armazenagem_cliente,
            }
          };

      const { data, error } = await supabase.functions.invoke('calculate-b2b-pricing', {
        body: requestBody
      });

      if (error) throw error;

      setResultado(data);
      toast({
        title: "Cálculo realizado com sucesso!",
        description: "Proposta comercial gerada automaticamente.",
      });
    } catch (error) {
      console.error("Erro ao calcular precificação:", error);
      toast({
        title: "Erro ao calcular",
        description: "Ocorreu um erro ao processar o cálculo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calcular margem LogiMind (estimativa baseada no desconto)
  const calculateMargin = () => {
    if (!resultado) return 12; // Default margin
    const baseMargin = 15;
    const adjustedMargin = baseMargin - (resultado.desconto_total_percentual * 0.3);
    return Math.max(adjustedMargin, 5);
  };

  const margin = calculateMargin();
  const marginHealthColor = margin < 8 ? "bg-amber-500" : "bg-emerald-500";
  const marginTextColor = margin < 8 ? "text-amber-600" : "text-emerald-600";

  // Sugestão LogiMind baseada nos parâmetros
  const getSuggestion = () => {
    if (!resultado) return null;
    
    if (margin < 8) {
      return {
        type: "warning",
        text: "Margem abaixo do ideal. Considere aumentar volume ou aceitar rotas de retorno para melhorar rentabilidade.",
        markup: "12%"
      };
    }
    if (formData.aceita_rota_retorno) {
      return {
        type: "success",
        text: "Excelente! Otimização de rotas ativada. Markup sugerido mantém competitividade.",
        markup: "10%"
      };
    }
    return {
      type: "info",
      text: "Proposta equilibrada. Ativar 'Aceita Rota de Retorno' pode aumentar desconto em 35%.",
      markup: "15%"
    };
  };

  const suggestion = getSuggestion();

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Lado Esquerdo - Formulário */}
      <div className="space-y-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-primary" />
              Simulador de Proposta B2B
            </CardTitle>
            <CardDescription>
              Configure os parâmetros para gerar proposta comercial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Volume e Peso com máscaras */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="volume" className="text-sm font-medium">Volume Mensal *</Label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="volume"
                    type="number"
                    placeholder="50"
                    className="pl-10 pr-16"
                    value={formData.volume_mensal_estimado}
                    onChange={(e) => handleInputChange("volume_mensal_estimado", e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium bg-slate-100 px-2 py-0.5 rounded">
                    entregas
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="peso" className="text-sm font-medium">Peso Médio *</Label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="peso"
                    type="number"
                    placeholder="500"
                    className="pl-10 pr-12"
                    value={formData.peso_medio_kg}
                    onChange={(e) => handleInputChange("peso_medio_kg", e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium bg-slate-100 px-2 py-0.5 rounded">
                    kg
                  </span>
                </div>
              </div>
            </div>

            {/* Chips de Natureza da Carga */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Natureza da Carga</Label>
              <div className="flex flex-wrap gap-2">
                {cargoTypes.map((cargo) => {
                  const Icon = cargo.icon;
                  const isActive = formData.tipo_carga === cargo.value;
                  return (
                    <button
                      key={cargo.value}
                      type="button"
                      onClick={() => handleInputChange("tipo_carga", cargo.value)}
                      className={`
                        inline-flex items-center gap-2 px-3 py-2 rounded-full border-2 text-sm font-medium
                        transition-all duration-200 cursor-pointer
                        ${isActive ? cargo.activeColor : cargo.color}
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{cargo.label}</span>
                      {cargo.badge && (
                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${isActive ? 'bg-white/20 text-white' : ''}`}>
                          {cargo.badge}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SLA */}
            <div className="space-y-2">
              <Label htmlFor="sla" className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                SLA de Entrega
              </Label>
              <Select
                value={formData.sla_desejado}
                onValueChange={(value) => handleInputChange("sla_desejado", value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="same_day">
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Same Day (2x preço)
                    </span>
                  </SelectItem>
                  <SelectItem value="express">Express 24-48h (+50%)</SelectItem>
                  <SelectItem value="standard">Standard 3-5 dias</SelectItem>
                  <SelectItem value="economico">Econômico 7-10 dias (-20%)</SelectItem>
                  <SelectItem value="flexivel">Flexível (-30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Otimizações */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">Otimizações e Custos</h4>
              
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <Checkbox
                    id="rota_retorno"
                    checked={formData.aceita_rota_retorno}
                    onCheckedChange={(checked) => handleInputChange("aceita_rota_retorno", checked)}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">Aceita rota de retorno</span>
                    <Badge className="ml-2 bg-emerald-100 text-emerald-700 text-[10px]">-35%</Badge>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <Checkbox
                    id="seguro"
                    checked={formData.necessita_seguro}
                    onCheckedChange={(checked) => handleInputChange("necessita_seguro", checked)}
                  />
                  <span className="text-sm font-medium">Necessita seguro adicional</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <Checkbox
                    id="reversa"
                    checked={formData.logistica_reversa}
                    onCheckedChange={(checked) => handleInputChange("logistica_reversa", checked)}
                  />
                  <span className="text-sm font-medium">Logística reversa necessária</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <Checkbox
                      id="pedagios"
                      checked={formData.pedagios_cliente}
                      onCheckedChange={(checked) => handleInputChange("pedagios_cliente", checked)}
                    />
                    <span className="text-sm font-medium">Pedágios por conta</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <Checkbox
                      id="armazenagem"
                      checked={formData.armazenagem_cliente}
                      onCheckedChange={(checked) => handleInputChange("armazenagem_cliente", checked)}
                    />
                    <span className="text-sm font-medium">Armazenagem inclusa</span>
                  </label>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleCalculate} 
              className="w-full h-12 text-base font-semibold" 
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5 mr-2" />
                  Simular Proposta
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lado Direito - Card de Resultado (Sticky) */}
      <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
        <Card className={`shadow-xl border-2 ${resultado ? 'bg-gradient-to-br from-blue-50 to-slate-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-blue-600" />
                Resultado da Proposta
              </span>
              {resultado && (
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  LogiMind
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {!resultado ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calculator className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <p className="text-sm">Preencha os parâmetros e clique em<br/><strong>"Simular Proposta"</strong> para ver os resultados</p>
              </div>
            ) : (
              <>
                {/* Preço por Viagem - Destaque Principal */}
                <div className="text-center p-6 bg-white rounded-xl border-2 border-blue-200 shadow-md">
                  <p className="text-sm text-muted-foreground mb-1">Preço por Viagem</p>
                  <p className="text-4xl font-bold text-blue-700 font-[Inter]" style={{ fontWeight: 700 }}>
                    {formatCurrency(resultado.preco_final_unitario)}
                  </p>
                </div>

                {/* Grid de Métricas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-white rounded-lg border border-slate-200">
                    <p className="text-xs text-muted-foreground">Valor Mensal</p>
                    <p className="text-xl font-bold text-slate-800 font-[Inter]" style={{ fontWeight: 600 }}>
                      {formatCurrency(resultado.valor_mensal_total)}
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-slate-200">
                    <p className="text-xs text-muted-foreground">Economia</p>
                    <p className="text-xl font-bold text-emerald-600 font-[Inter]" style={{ fontWeight: 600 }}>
                      {formatCurrency(resultado.economia_mensal)}
                    </p>
                  </div>
                </div>

                {/* Barra de Saúde da Margem */}
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Margem LogiMind</span>
                    <span className={`text-sm font-bold ${marginTextColor}`}>
                      {margin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`absolute left-0 top-0 h-full ${marginHealthColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(margin * 5, 100)}%` }}
                    />
                    {/* Marcador de 8% */}
                    <div className="absolute top-0 h-full w-0.5 bg-slate-400" style={{ left: '40%' }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">0%</span>
                    <span className="text-[10px] text-muted-foreground">8% (min)</span>
                    <span className="text-[10px] text-muted-foreground">20%</span>
                  </div>
                </div>

                {/* Sugestão LogiMind */}
                {suggestion && (
                  <div className={`p-4 rounded-lg border ${
                    suggestion.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                    suggestion.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Lightbulb className={`h-5 w-5 mt-0.5 ${
                        suggestion.type === 'warning' ? 'text-amber-600' :
                        suggestion.type === 'success' ? 'text-emerald-600' :
                        'text-blue-600'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Sugestão LogiMind</p>
                        <p className="text-xs text-slate-600">{suggestion.text}</p>
                        <Badge variant="outline" className="mt-2 text-[10px]">
                          Markup ideal: {suggestion.markup}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Desconto Aplicado */}
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">Desconto Total</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">
                    {resultado.desconto_total_percentual.toFixed(1)}%
                  </span>
                </div>

                <Separator />

                {/* Botões de Ação */}
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-11 border-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => toast({ title: "Gerando PDF...", description: "A proposta será baixada em instantes." })}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Gerar PDF
                  </Button>
                  <Button 
                    className="h-11 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => toast({ title: "Salvo no Funil!", description: "Proposta adicionada ao pipeline B2B." })}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Salvar no Funil
                  </Button>
                  <Button 
                    className="h-11 bg-primary hover:bg-primary/90"
                    onClick={async () => {
                      if (!resultado) return;
                      const emailDestino = prompt("Informe o e-mail do cliente B2B:");
                      if (!emailDestino) return;
                      const nomeContato = prompt("Nome do contato responsável:") || "Prezado(a)";
                      const razaoSocial = prompt("Razão Social da empresa:") || "Empresa";
                      
                      toast({ title: "Enviando proposta...", description: "Aguarde enquanto processamos." });
                      
                      try {
                        const { error } = await supabase.functions.invoke('send-transactional-email', {
                          body: {
                            templateName: 'b2b-proposal',
                            recipientEmail: emailDestino,
                            idempotencyKey: `b2b-proposal-${Date.now()}-${emailDestino}`,
                            templateData: {
                              razaoSocial,
                              contatoResponsavel: nomeContato,
                              volumeMensal: parseInt(formData.volume_mensal_estimado) || undefined,
                              pesoMedioKg: parseFloat(formData.peso_medio_kg) || undefined,
                              tipoCarga: formData.tipo_carga,
                              slaDesejado: formData.sla_desejado,
                              propostaValorMensal: resultado.valor_mensal_total,
                              propostaDescontoPercentual: resultado.desconto_total_percentual,
                              propostaObservacoes: `Economia mensal estimada: R$ ${resultado.economia_mensal.toFixed(2)}`,
                            },
                          },
                        });
                        
                        if (error) throw error;
                        
                        toast({ 
                          title: "✅ Proposta Enviada!", 
                          description: `E-mail enviado para ${emailDestino} com sucesso.`,
                        });
                      } catch (err) {
                        console.error('Erro ao enviar proposta:', err);
                        toast({ 
                          title: "Erro ao enviar", 
                          description: "Não foi possível enviar o e-mail. Tente novamente.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar Proposta por E-mail
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card de Detalhamento (se houver resultado) */}
        {resultado && (
          <Card className="border-slate-200">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-slate-600">Breakdown da Precificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-muted-foreground">Base (peso × km)</span>
                <span className="font-medium">{formatCurrency(resultado.preco_base_unitario)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-muted-foreground">Após desconto volume</span>
                <span className="font-medium text-emerald-600">{formatCurrency(resultado.preco_com_volume_desconto)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-muted-foreground">Fator tipo carga</span>
                <span className="font-medium">{formatCurrency(resultado.preco_com_tipo_carga)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-muted-foreground">Fator SLA</span>
                <span className="font-medium">{formatCurrency(resultado.preco_com_sla)}</span>
              </div>
              {resultado.custos_adicionais > 0 && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-muted-foreground">Custos adicionais</span>
                  <span className="font-medium text-amber-600">+{formatCurrency(resultado.custos_adicionais)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 bg-blue-50 -mx-4 px-4 rounded-lg mt-2">
                <span className="font-semibold text-blue-700">Preço Final</span>
                <span className="font-bold text-blue-700">{formatCurrency(resultado.preco_final_unitario)}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default B2BQuoteCalculator;
