import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Package, TrendingUp, AlertCircle, CheckCircle2, DollarSign, Award, Info } from "lucide-react";
import { formatarMoeda, formatarPorcentagemSimples } from "@/lib/formatters";
import { toast } from "sonner";

interface Opportunity {
  id: string;
  origin_city: string;
  destination_city: string;
  distance_km: number;
  weight_kg: number;
  vehicle_type: string;
  driver_receives: number;
  commission_standard: number;
  commission_adjustment: number;
  commission_total_percent: number;
  route_factor: number;
  bonus_amount: number;
  is_premium: boolean;
}

interface DriverFreightDetailProps {
  opportunity: Opportunity;
}

export const DriverFreightDetail = ({ opportunity }: DriverFreightDetailProps) => {
  const [checklist, setChecklist] = useState({
    vehicle_match: false,
    route_confirm: false,
    deadline_ok: false,
  });

  const isChecklistComplete = Object.values(checklist).every(v => v);

  const handleAcceptFreight = () => {
    if (!isChecklistComplete) {
      toast.error("Complete o checklist antes de aceitar o frete");
      return;
    }

    toast.success(`Frete ${opportunity.id} aceito! Você receberá instruções de coleta em breve.`);
    // Aqui seria a chamada para aceitar o frete no backend
  };

  const getRouteImbalanceLevel = (factor: number) => {
    if (factor <= 0.7) return "Alto (70% desbalanceamento)";
    if (factor <= 0.85) return "Médio (40% desbalanceamento)";
    return "Baixo (Rota balanceada)";
  };

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro - Destaque Principal */}
      <Card className={`border-2 ${
        opportunity.is_premium 
          ? 'bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/40' 
          : 'border-primary/30'
      }`}>
        <CardContent className="pt-6 pb-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <DollarSign className={`h-6 w-6 ${opportunity.is_premium ? 'text-secondary' : 'text-primary'}`} />
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Você Recebe
              </p>
            </div>
            
            <div className="flex items-baseline justify-center gap-3">
              <p className={`text-5xl font-extrabold ${
                opportunity.is_premium ? 'text-secondary' : 'text-primary'
              }`}>
                {formatarMoeda(opportunity.driver_receives)}
              </p>
              
              {opportunity.is_premium && opportunity.bonus_amount > 0 && (
                <div className="text-left">
                  <Badge className="bg-secondary/20 text-secondary border border-secondary/40 text-sm">
                    <Award className="h-3.5 w-3.5 mr-1" />
                    +{formatarMoeda(opportunity.bonus_amount)}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    de Bônus LogiMind!
                  </p>
                </div>
              )}
            </div>

            {opportunity.is_premium && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/30 rounded-full">
                <TrendingUp className="h-4 w-4 text-secondary" />
                <span className="text-sm font-semibold text-secondary">
                  Frete Premium - Rota de Retorno Otimizada
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detalhe da Comissão - Transparência Total */}
      {opportunity.is_premium && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6 pb-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-primary mb-2">
                    Detalhamento da Comissão LogiMind
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comissão Padrão (10%):</span>
                      <span className="font-semibold">{formatarMoeda(opportunity.commission_standard)}</span>
                    </div>
                    <div className="flex justify-between text-secondary">
                      <span className="font-medium">+ Ajuste LogiMind ({formatarPorcentagemSimples(opportunity.commission_adjustment / opportunity.driver_receives * 100)}):</span>
                      <span className="font-bold">+{formatarMoeda(opportunity.commission_adjustment)}</span>
                    </div>
                    <div className="h-px bg-border my-2"></div>
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Comissão Total ({formatarPorcentagemSimples(opportunity.commission_total_percent)}):</span>
                      <span className="font-bold">{formatarMoeda(opportunity.commission_standard + opportunity.commission_adjustment)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Motivação da Rota - Educação do Parceiro */}
      {opportunity.is_premium && (
        <Card className="bg-accent/5 border-accent/30">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-accent mb-2">
                  🔄 Análise de Rota LogiMind
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  O LogiMind ajustou este preço porque esta é uma rota com{" "}
                  <strong className="text-accent">{getRouteImbalanceLevel(opportunity.route_factor)}</strong>.
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Por que isso importa?</strong> Rotas de retorno normalmente têm baixa liquidez. 
                  Ao aceitar este frete, você maximiza sua rentabilidade e ajuda a equilibrar a malha logística. 
                  Você ganha mais, a plataforma cresce, e o embarcador paga um preço justo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações da Carga */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Origem
              </p>
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">{opportunity.origin_city}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Destino
              </p>
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-semibold">{opportunity.destination_city}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Peso da Carga
              </p>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <p className="font-semibold text-lg">{opportunity.weight_kg} kg</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Distância Total
              </p>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <p className="font-semibold text-lg">{opportunity.distance_km} km</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist de Aceite */}
      <Card className="border-2 border-dashed">
        <CardContent className="pt-6 pb-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-accent" />
              <p className="font-semibold">Checklist de Aceite</p>
            </div>

            <div className="space-y-3">
              <div 
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setChecklist(prev => ({ ...prev, vehicle_match: !prev.vehicle_match }))}
              >
                <Checkbox
                  checked={checklist.vehicle_match}
                  onCheckedChange={(checked) => 
                    setChecklist(prev => ({ ...prev, vehicle_match: checked as boolean }))
                  }
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">Veículo compatível: {opportunity.vehicle_type}</p>
                  <p className="text-xs text-muted-foreground">
                    Confirmo que possuo o tipo de veículo necessário
                  </p>
                </div>
              </div>

              <div 
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setChecklist(prev => ({ ...prev, route_confirm: !prev.route_confirm }))}
              >
                <Checkbox
                  checked={checklist.route_confirm}
                  onCheckedChange={(checked) => 
                    setChecklist(prev => ({ ...prev, route_confirm: checked as boolean }))
                  }
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    Rota: {opportunity.origin_city} → {opportunity.destination_city}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Confirmo que conheço a rota ou posso realizá-la
                  </p>
                </div>
              </div>

              <div 
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setChecklist(prev => ({ ...prev, deadline_ok: !prev.deadline_ok }))}
              >
                <Checkbox
                  checked={checklist.deadline_ok}
                  onCheckedChange={(checked) => 
                    setChecklist(prev => ({ ...prev, deadline_ok: checked as boolean }))
                  }
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">Prazo: 3 dias úteis</p>
                  <p className="text-xs text-muted-foreground">
                    Confirmo que consigo cumprir o prazo de entrega
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Final */}
      <div className="space-y-3">
        {!isChecklistComplete && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-900 dark:text-amber-100">
              Complete o checklist acima para aceitar o frete
            </p>
          </div>
        )}

        <Button
          onClick={handleAcceptFreight}
          disabled={!isChecklistComplete}
          size="lg"
          className={`w-full text-lg ${
            opportunity.is_premium && isChecklistComplete
              ? 'bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70'
              : ''
          }`}
        >
          {isChecklistComplete ? (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {opportunity.is_premium ? '⭐ Aceitar Frete Premium' : 'Aceitar Frete'}
            </>
          ) : (
            <>Complete o Checklist</>
          )}
        </Button>
      </div>
    </div>
  );
};
