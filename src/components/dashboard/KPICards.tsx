import { Card } from "@/components/ui/card";
import { TrendingDown, CheckCircle, Package, AlertTriangle } from "lucide-react";

interface KPIData {
  averageSavings: number;
  onTimeDeliveryRate: number;
  activeShipments: number;
  openIncidents: number;
}

interface KPICardsProps {
  data: KPIData;
}

export const KPICards = ({ data }: KPICardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Economia Média */}
      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Economia Média</p>
            <p className="text-3xl font-bold text-secondary">
              {data.averageSavings}%
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              vs. preço de mercado
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
            <TrendingDown className="h-6 w-6 text-secondary" />
          </div>
        </div>
      </Card>

      {/* Taxa de Entrega Pontual */}
      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Entregas Pontuais</p>
            <p className="text-3xl font-bold" style={{ 
              color: data.onTimeDeliveryRate >= 90 
                ? 'hsl(var(--secondary))' 
                : data.onTimeDeliveryRate >= 75 
                  ? 'hsl(var(--accent))' 
                  : 'hsl(var(--destructive))'
            }}>
              {data.onTimeDeliveryRate}%
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              SLA de qualidade
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-secondary" />
          </div>
        </div>
      </Card>

      {/* Fretes em Trânsito */}
      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Em Trânsito</p>
            <p className="text-3xl font-bold text-primary">
              {data.activeShipments}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              fretes ativos
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="h-6 w-6 text-primary" />
          </div>
        </div>
      </Card>

      {/* Ocorrências Abertas */}
      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Ocorrências</p>
            <p className="text-3xl font-bold" style={{ 
              color: data.openIncidents === 0 
                ? 'hsl(var(--secondary))' 
                : 'hsl(var(--accent))'
            }}>
              {data.openIncidents}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              problemas ativos
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-accent" />
          </div>
        </div>
      </Card>
    </div>
  );
};
