import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Sparkles,
  MapPin,
  Truck,
  Star,
  Phone,
  CheckCircle,
  RefreshCw,
  Zap,
  User,
  Weight,
} from 'lucide-react';

interface DriverMatch {
  driver_id: string;
  driver_name: string;
  phone: string;
  region_match_score: number;
  capacity_match: boolean;
  performance_score: number;
  total_score: number;
  match_reasons: string[];
  vehicle_type?: string;
  max_weight_kg?: number;
}

interface DriverSuggestionsProps {
  orderId: string;
  onSelectDriver: (driverId: string, driverName: string, driverPhone: string) => void;
  selectedDriverId?: string;
}

const vehicleTypeLabels: Record<string, string> = {
  moto: 'Moto',
  carro: 'Carro',
  picape: 'Picape',
  van: 'Van',
  caminhao_toco: 'Caminhão Toco',
  caminhao_truck: 'Caminhão Truck',
  carreta: 'Carreta',
  carreta_ls: 'Carreta LS',
  carreta_bi_truck: 'Bi-Truck',
};

export const DriverSuggestions = ({ orderId, onSelectDriver, selectedDriverId }: DriverSuggestionsProps) => {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<DriverMatch[]>([]);
  const [originState, setOriginState] = useState<string>('');
  const [destState, setDestState] = useState<string>('');
  const [totalEligible, setTotalEligible] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchSuggestions = async () => {
    if (!orderId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('match-drivers', {
        body: { order_id: orderId }
      });

      if (error) throw error;

      setMatches(data.matches || []);
      setOriginState(data.origin_state || '');
      setDestState(data.destination_state || '');
      setTotalEligible(data.total_eligible || 0);
      setHasSearched(true);

      if (data.matches?.length === 0) {
        toast.info('Nenhum motorista elegível encontrado para esta rota');
      }
    } catch (error: any) {
      console.error('Error fetching driver suggestions:', error);
      toast.error('Erro ao buscar motoristas sugeridos');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return { label: 'Excelente', color: 'bg-emerald-500' };
    if (score >= 60) return { label: 'Bom', color: 'bg-blue-500' };
    if (score >= 40) return { label: 'Regular', color: 'bg-amber-500' };
    return { label: 'Novo', color: 'bg-gray-500' };
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Sugestão Inteligente de Motoristas</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSuggestions}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {hasSearched ? 'Atualizar' : 'Buscar'}
          </Button>
        </CardTitle>
        {hasSearched && !loading && (
          <p className="text-sm text-muted-foreground">
            Rota: <span className="font-medium">{originState}</span> → <span className="font-medium">{destState}</span>
            {totalEligible > 0 && (
              <span className="ml-2">• {totalEligible} motorista(s) elegível(is)</span>
            )}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        )}

        {!loading && !hasSearched && (
          <div className="text-center py-6 text-muted-foreground">
            <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Clique em "Buscar" para encontrar motoristas</p>
            <p className="text-xs mt-1">O sistema analisa região, disponibilidade e capacidade</p>
          </div>
        )}

        {!loading && hasSearched && matches.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum motorista encontrado para esta rota</p>
            <p className="text-xs mt-1">Tente selecionar manualmente na lista abaixo</p>
          </div>
        )}

        {!loading && matches.map((match, index) => {
          const isSelected = selectedDriverId === match.driver_id;
          const perfBadge = getPerformanceBadge(match.performance_score);
          
          return (
            <div
              key={match.driver_id}
              className={`
                relative p-3 rounded-lg border transition-all duration-200
                ${isSelected 
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              {/* Ranking badge */}
              {index === 0 && (
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                  1
                </div>
              )}

              <div className="flex items-start gap-3">
                {/* Score Circle */}
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 font-bold text-sm
                  ${getScoreColor(match.total_score)}
                `}>
                  {Math.round(match.total_score)}
                </div>

                {/* Driver Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{match.driver_name}</span>
                    <Badge className={`${perfBadge.color} text-white text-xs`}>
                      <Star className="h-3 w-3 mr-1" />
                      {perfBadge.label}
                    </Badge>
                  </div>

                  {/* Vehicle & Capacity */}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {match.vehicle_type && (
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {vehicleTypeLabels[match.vehicle_type] || match.vehicle_type}
                      </span>
                    )}
                    {match.max_weight_kg && (
                      <span className="flex items-center gap-1">
                        <Weight className="h-3 w-3" />
                        {match.max_weight_kg.toLocaleString()}kg
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {match.phone}
                    </span>
                  </div>

                  {/* Match Reasons */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {match.match_reasons.slice(0, 3).map((reason, i) => (
                      <Badge key={i} variant="outline" className="text-xs py-0 h-5">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Select Button */}
                <Button
                  size="sm"
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => onSelectDriver(match.driver_id, match.driver_name, match.phone)}
                  className="shrink-0"
                >
                  {isSelected ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Selecionado
                    </>
                  ) : (
                    'Selecionar'
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
