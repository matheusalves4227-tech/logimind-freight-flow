import { Card } from "@/components/ui/card";
import { TrendingDown, CheckCircle, Package, AlertTriangle, Check } from "lucide-react";

interface KPIData {
  averageSavings: number;
  onTimeDeliveryRate: number;
  activeShipments: number;
  openIncidents: number;
}

interface KPICardsProps {
  data: KPIData;
}

// Mini Sparkline Component
const Sparkline = ({ color, trend = "up" }: { color: string; trend?: "up" | "down" | "flat" }) => {
  const paths = {
    up: "M0,20 L8,18 L16,22 L24,15 L32,17 L40,10 L48,8 L56,5 L64,3",
    down: "M0,5 L8,8 L16,6 L24,12 L32,10 L40,18 L48,15 L56,20 L64,22",
    flat: "M0,12 L8,14 L16,11 L24,13 L32,12 L40,14 L48,11 L56,13 L64,12"
  };
  
  return (
    <svg 
      className="absolute bottom-0 left-0 right-0 h-12 w-full opacity-20"
      viewBox="0 0 64 24" 
      preserveAspectRatio="none"
    >
      <path
        d={paths[trend]}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const KPICards = ({ data }: KPICardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
      {/* Economia Média - Destaque LogiMind */}
      <Card className="p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden border-green-500/20 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20">
        <Sparkline color="hsl(142, 71%, 45%)" trend="up" />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-muted-foreground">Economia Média</p>
              <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded font-medium">
                LogiMind
              </span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">
                {data.averageSavings}%
              </p>
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              vs. preço de mercado
            </p>
          </div>
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-green-500/10 flex items-center justify-center">
            <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>

      {/* Taxa de Entrega Pontual */}
      <Card className="p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
        <Sparkline 
          color={data.onTimeDeliveryRate >= 90 ? "hsl(142, 71%, 45%)" : "hsl(45, 93%, 47%)"} 
          trend={data.onTimeDeliveryRate >= 90 ? "up" : "flat"} 
        />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Entregas Pontuais</p>
            <p className="text-3xl md:text-4xl font-bold" style={{ 
              color: data.onTimeDeliveryRate >= 90 
                ? 'hsl(142, 71%, 45%)' 
                : data.onTimeDeliveryRate >= 75 
                  ? 'hsl(45, 93%, 47%)' 
                  : 'hsl(0, 84%, 60%)'
            }}>
              {data.onTimeDeliveryRate}%
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              SLA de qualidade
            </p>
          </div>
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-secondary/10 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-secondary" />
          </div>
        </div>
      </Card>

      {/* Fretes em Trânsito */}
      <Card className="p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
        <Sparkline color="hsl(217, 91%, 60%)" trend="flat" />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Em Trânsito</p>
            <p className="text-3xl md:text-4xl font-bold text-primary">
              {data.activeShipments}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              fretes ativos
            </p>
          </div>
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
        </div>
      </Card>

      {/* Ocorrências Abertas */}
      <Card className="p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
        <Sparkline 
          color={data.openIncidents === 0 ? "hsl(142, 71%, 45%)" : "hsl(45, 93%, 47%)"} 
          trend={data.openIncidents === 0 ? "flat" : "down"} 
        />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Ocorrências</p>
            <p className="text-3xl md:text-4xl font-bold" style={{ 
              color: data.openIncidents === 0 
                ? 'hsl(142, 71%, 45%)' 
                : 'hsl(45, 93%, 47%)'
            }}>
              {data.openIncidents}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              problemas ativos
            </p>
          </div>
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-accent" />
          </div>
        </div>
      </Card>
    </div>
  );
};
