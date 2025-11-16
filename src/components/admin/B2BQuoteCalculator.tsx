import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingDown, DollarSign, Package, Truck, Clock, MapPin, Loader2 } from "lucide-react";
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

  return (
    <div className="space-y-6">
      {/* Formulário de Entrada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Precificação B2B
          </CardTitle>
          <CardDescription>
            Insira os dados da operação para calcular automaticamente a proposta comercial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volume">Volume Mensal Estimado *</Label>
              <div className="relative">
                <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="volume"
                  type="number"
                  placeholder="Ex: 50"
                  className="pl-10"
                  value={formData.volume_mensal_estimado}
                  onChange={(e) => handleInputChange("volume_mensal_estimado", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="peso">Peso Médio (kg) *</Label>
              <div className="relative">
                <Truck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="peso"
                  type="number"
                  placeholder="Ex: 500"
                  className="pl-10"
                  value={formData.peso_medio_kg}
                  onChange={(e) => handleInputChange("peso_medio_kg", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_carga">Tipo de Carga</Label>
              <Select
                value={formData.tipo_carga}
                onValueChange={(value) => handleInputChange("tipo_carga", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Carga Geral</SelectItem>
                  <SelectItem value="refrigerada">Refrigerada (+30%)</SelectItem>
                  <SelectItem value="perigosa">Perigosa (+50%)</SelectItem>
                  <SelectItem value="fragil">Frágil (+20%)</SelectItem>
                  <SelectItem value="alto_valor">Alto Valor (+40%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sla">SLA Desejado</Label>
              <Select
                value={formData.sla_desejado}
                onValueChange={(value) => handleInputChange("sla_desejado", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="same_day">Same Day (2x preço)</SelectItem>
                  <SelectItem value="express">Express 24-48h (+50%)</SelectItem>
                  <SelectItem value="standard">Standard 3-5 dias</SelectItem>
                  <SelectItem value="economico">Econômico 7-10 dias (-20%)</SelectItem>
                  <SelectItem value="flexivel">Flexível (-30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Otimizações e Custos</h4>
            
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rota_retorno"
                  checked={formData.aceita_rota_retorno}
                  onCheckedChange={(checked) => handleInputChange("aceita_rota_retorno", checked)}
                />
                <Label htmlFor="rota_retorno" className="cursor-pointer text-sm">
                  Aceita rota de retorno (-35%)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="seguro"
                  checked={formData.necessita_seguro}
                  onCheckedChange={(checked) => handleInputChange("necessita_seguro", checked)}
                />
                <Label htmlFor="seguro" className="cursor-pointer text-sm">
                  Necessita seguro adicional
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reversa"
                  checked={formData.logistica_reversa}
                  onCheckedChange={(checked) => handleInputChange("logistica_reversa", checked)}
                />
                <Label htmlFor="reversa" className="cursor-pointer text-sm">
                  Logística reversa necessária
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pedagios"
                  checked={formData.pedagios_cliente}
                  onCheckedChange={(checked) => handleInputChange("pedagios_cliente", checked)}
                />
                <Label htmlFor="pedagios" className="cursor-pointer text-sm">
                  Cliente arca com pedágios
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="armazenagem"
                  checked={formData.armazenagem_cliente}
                  onCheckedChange={(checked) => handleInputChange("armazenagem_cliente", checked)}
                />
                <Label htmlFor="armazenagem" className="cursor-pointer text-sm">
                  Cliente arca com armazenagem
                </Label>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleCalculate} 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Calcular Proposta
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado do Cálculo */}
      {resultado && (
        <div className="space-y-4">
          {/* Cards de Resumo */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Mensal Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(resultado.valor_mensal_total)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500/50 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <TrendingDown className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Desconto Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      {resultado.desconto_total_percentual.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/50 bg-blue-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Preço por Entrega</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(resultado.preco_final_unitario)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhamento Completo */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento da Precificação</CardTitle>
              <CardDescription>
                Breakdown completo dos fatores aplicados no cálculo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">{resultado.detalhamento.base}</span>
                  <span className="font-semibold">{formatCurrency(resultado.preco_base_unitario)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                  <span className="text-sm text-green-700">{resultado.detalhamento.volume}</span>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(resultado.preco_com_volume_desconto)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">{resultado.detalhamento.tipo_carga}</span>
                  <span className="font-semibold">{formatCurrency(resultado.preco_com_tipo_carga)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">{resultado.detalhamento.sla}</span>
                  <span className="font-semibold">{formatCurrency(resultado.preco_com_sla)}</span>
                </div>

                {resultado.detalhamento.rota_retorno.includes('Otimização') && (
                  <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                    <span className="text-sm text-green-700">{resultado.detalhamento.rota_retorno}</span>
                    <span className="font-semibold text-green-700">
                      {formatCurrency(resultado.preco_com_rota_retorno)}
                    </span>
                  </div>
                )}

                {resultado.detalhamento.custos_extras.length > 0 && (
                  <div className="p-3 bg-orange-500/10 rounded-lg space-y-1">
                    <p className="text-sm font-semibold text-orange-700">Custos Adicionais:</p>
                    {resultado.detalhamento.custos_extras.map((custo, idx) => (
                      <p key={idx} className="text-xs text-orange-600 ml-2">• {custo}</p>
                    ))}
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                  <span className="font-bold">Preço Final por Entrega</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(resultado.preco_final_unitario)}
                  </span>
                </div>
              </div>

              {resultado.economia_mensal > 0 && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-700">Economia Total</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(resultado.economia_mensal)}/mês
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Comparado ao preço sem os descontos aplicados
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default B2BQuoteCalculator;
