import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, Clock, DollarSign, Filter, Zap, Award, Calendar } from "lucide-react";
import { formatarMoeda } from "@/lib/formatters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DriverFreightDetail } from "./DriverFreightDetail";

interface DriverOpportunitiesProps {
  driverProfile: any;
}

interface Opportunity {
  id: string;
  origin_city: string;
  destination_city: string;
  distance_km: number;
  weight_kg: number;
  vehicle_type: string;
  // Valores LogiMind
  driver_receives: number; // Valor que o motorista recebe
  commission_standard: number; // Comissão padrão 10%
  commission_adjustment: number; // Ajuste LogiMind (ex: 5.6%)
  commission_total_percent: number; // Total 15.6%
  route_factor: number; // 0.7 = alta desbalanceamento
  bonus_amount: number; // R$ 56,00 de bônus
  is_premium: boolean; // true se comissão > 10%
  deadline_minutes?: number; // Minutos até expirar
}

export const DriverOpportunities = ({ driverProfile }: DriverOpportunitiesProps) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'premium' | 'nearby' | 'flexible'>('all');
  const [monthlyBonusEarnings, setMonthlyBonusEarnings] = useState(850);

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = () => {
    // Mock data com fretes premium de rotas de retorno
    const mockOpportunities: Opportunity[] = [
      {
        id: "FRT-001",
        origin_city: "São Paulo, SP",
        destination_city: "Três Corações, MG",
        distance_km: 320,
        weight_kg: 5000,
        vehicle_type: "Carreta Baú",
        driver_receives: 1250,
        commission_standard: 125, // 10% de 1250
        commission_adjustment: 56, // 5.6% adicional
        commission_total_percent: 15.6,
        route_factor: 0.7, // Alta desbalanceamento
        bonus_amount: 56,
        is_premium: true,
        deadline_minutes: 930, // 15h30min
      },
      {
        id: "FRT-002",
        origin_city: "São Paulo, SP",
        destination_city: "Campinas, SP",
        distance_km: 95,
        weight_kg: 2500,
        vehicle_type: "Caminhão Toco",
        driver_receives: 650,
        commission_standard: 65,
        commission_adjustment: 0,
        commission_total_percent: 10,
        route_factor: 1.0, // Rota balanceada
        bonus_amount: 0,
        is_premium: false,
      },
      {
        id: "FRT-003",
        origin_city: "Campinas, SP",
        destination_city: "Ribeirão Preto, SP",
        distance_km: 230,
        weight_kg: 4200,
        vehicle_type: "Carreta Sider",
        driver_receives: 980,
        commission_standard: 98,
        commission_adjustment: 39.2, // 4% adicional
        commission_total_percent: 14,
        route_factor: 0.8,
        bonus_amount: 39.2,
        is_premium: true,
        deadline_minutes: 45,
      }
    ];

    setOpportunities(mockOpportunities);
  };

  const getFilteredOpportunities = () => {
    if (activeFilter === 'premium') {
      return opportunities.filter(o => o.is_premium);
    }
    if (activeFilter === 'nearby') {
      return opportunities.filter(o => o.distance_km < 150);
    }
    if (activeFilter === 'flexible') {
      return opportunities.filter(o => !o.deadline_minutes || o.deadline_minutes > 120);
    }
    return opportunities;
  };

  const filteredOpportunities = getFilteredOpportunities();

  const formatDeadline = (minutes?: number) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}min`;
  };

  return (
    <div className="space-y-6">
      {/* Visão Rápida - Ganhos Extras */}
      <Card className="bg-gradient-to-r from-secondary/10 to-secondary/5 border-2 border-secondary/30">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center">
                <Award className="h-7 w-7 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Ganhos Extras LogiMind este Mês
                </p>
                <p className="text-3xl font-extrabold text-secondary">
                  {formatarMoeda(monthlyBonusEarnings)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Comissões otimizadas em rotas de retorno
                </p>
              </div>
            </div>
            <TrendingUp className="h-10 w-10 text-secondary opacity-30" />
          </div>
        </CardContent>
      </Card>

      {/* Filtros de Oportunidade */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveFilter('all')}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Todas ({opportunities.length})
        </Button>
        <Button
          variant={activeFilter === 'premium' ? 'default' : 'outline'}
          onClick={() => setActiveFilter('premium')}
          className="gap-2 bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-secondary-foreground border-secondary"
        >
          <Award className="h-4 w-4" />
          Premium / Retorno ({opportunities.filter(o => o.is_premium).length})
        </Button>
        <Button
          variant={activeFilter === 'nearby' ? 'default' : 'outline'}
          onClick={() => setActiveFilter('nearby')}
          className="gap-2"
        >
          <MapPin className="h-4 w-4" />
          Perto de Você
        </Button>
        <Button
          variant={activeFilter === 'flexible' ? 'default' : 'outline'}
          onClick={() => setActiveFilter('flexible')}
          className="gap-2"
        >
          <Calendar className="h-4 w-4" />
          Prazo Flexível
        </Button>
      </div>

      {/* Lista de Oportunidades */}
      <div className="grid grid-cols-1 gap-4">
        {filteredOpportunities.map((opp) => (
          <Card 
            key={opp.id} 
            className={`hover:shadow-lg transition-all duration-300 ${
              opp.is_premium ? 'border-2 border-secondary/40 bg-gradient-to-br from-secondary/5 to-background' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    opp.is_premium ? 'bg-gradient-to-br from-secondary to-secondary/70' : 'bg-primary/10'
                  }`}>
                    <DollarSign className={`h-6 w-6 ${opp.is_premium ? 'text-secondary-foreground' : 'text-primary'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{opp.id}</span>
                      <Badge variant="outline" className="text-xs">
                        {opp.vehicle_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{opp.origin_city} → {opp.destination_city}</span>
                      <span className="text-xs">• {opp.distance_km} km</span>
                    </div>
                  </div>
                </div>

                {opp.is_premium && (
                  <Badge className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground border-0 shadow-md">
                    <Award className="h-3 w-3 mr-1" />
                    Frete Premium
                  </Badge>
                )}
              </div>

              {/* Urgência */}
              {opp.deadline_minutes && opp.deadline_minutes < 120 && (
                <div className="flex items-center gap-2 p-2 bg-accent/10 border border-accent/30 rounded-lg">
                  <Zap className="h-4 w-4 text-accent flex-shrink-0" />
                  <span className="text-xs font-semibold text-accent">
                    ⚠️ Expira em {formatDeadline(opp.deadline_minutes)}!
                  </span>
                </div>
              )}
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Valor de Recebimento - DESTAQUE PRINCIPAL */}
                <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Você Recebe
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-extrabold text-primary">
                      {formatarMoeda(opp.driver_receives)}
                    </p>
                    {opp.is_premium && opp.bonus_amount > 0 && (
                      <Badge className="bg-secondary/10 text-secondary border border-secondary/30">
                        +{formatarMoeda(opp.bonus_amount)} Bônus
                      </Badge>
                    )}
                  </div>
                  {opp.is_premium && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="text-secondary font-semibold">{opp.commission_total_percent}%</span> Comissão LogiMind (Rota de Retorno)
                    </p>
                  )}
                </div>

                {/* Métricas Rápidas */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Peso</p>
                    <p className="font-bold text-sm">{opp.weight_kg} kg</p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Distância</p>
                    <p className="font-bold text-sm">{opp.distance_km} km</p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">R$/km</p>
                    <p className="font-bold text-sm text-secondary">
                      {formatarMoeda(opp.driver_receives / opp.distance_km)}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className={`w-full ${
                        opp.is_premium 
                          ? 'bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70' 
                          : ''
                      }`}
                      size="lg"
                      onClick={() => setSelectedOpportunity(opp)}
                    >
                      {opp.is_premium ? '⭐ Ver Detalhes Premium' : 'Ver Detalhes do Frete'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        Detalhes do Frete - {opp.id}
                        {opp.is_premium && (
                          <Badge className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground">
                            <Award className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </DialogTitle>
                    </DialogHeader>
                    {selectedOpportunity && (
                      <DriverFreightDetail opportunity={selectedOpportunity} />
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOpportunities.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Filter className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              Nenhuma oportunidade encontrada
            </p>
            <p className="text-sm text-muted-foreground">
              Tente ajustar os filtros ou aguarde novas cargas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
