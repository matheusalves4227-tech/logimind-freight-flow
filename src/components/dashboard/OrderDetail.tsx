import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, MapPin, Clock, DollarSign, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface OrderDetails {
  id: string;
  quote_id: string;
  status: string;
  carrier_name: string;
  carrier_type: "carrier" | "autonomous";
  vehicle_type?: string;
  origin: {
    cep: string;
    address: string;
    city: string;
  };
  destination: {
    cep: string;
    address: string;
    city: string;
  };
  base_price: number;
  commission_applied: number;
  adjustment_reason?: string;
  final_price: number;
  weight_kg: number;
  estimated_delivery: string;
  created_at: string;
  timeline: Array<{
    date: string;
    status: string;
    description: string;
  }>;
}

interface OrderDetailProps {
  order: OrderDetails;
  onBack: () => void;
}

export const OrderDetail = ({ order, onBack }: OrderDetailProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Detalhes do Frete</h1>
          <p className="text-sm text-muted-foreground">ID: {order.id}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Informações Principais */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Informações do Frete
          </h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Transportador</p>
              <p className="font-medium">{order.carrier_name}</p>
              {order.carrier_type === "autonomous" && order.vehicle_type && (
                <p className="text-sm text-muted-foreground">
                  Motorista Autônomo - {order.vehicle_type}
                </p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Peso da Carga</p>
              <p className="font-medium">{order.weight_kg} kg</p>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
              <p className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                {new Date(order.estimated_delivery).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </Card>

        {/* Detalhamento de Custos LogiMind */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Detalhamento de Custo LogiMind
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Preço Base</p>
              <p className="font-medium">R$ {order.base_price.toFixed(2)}</p>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Comissão Aplicada</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        {order.adjustment_reason === "COMPETITION" && 
                          "Comissão reduzida para manter competitividade de mercado"}
                        {order.adjustment_reason === "ROUTE_OPTIMIZED" && 
                          "Rota de retorno otimizada - margem aumentada"}
                        {(!order.adjustment_reason || order.adjustment_reason === "STANDARD") && 
                          "Comissão padrão aplicada"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="font-medium text-primary">
                {(order.commission_applied * 100).toFixed(1)}%
              </p>
            </div>

            {order.adjustment_reason && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Motivo do Ajuste:</p>
                <p className="text-sm font-medium">
                  {order.adjustment_reason === "COMPETITION" && "🎯 Otimização por Competição"}
                  {order.adjustment_reason === "ROUTE_OPTIMIZED" && "🚚 Rota de Retorno"}
                  {order.adjustment_reason === "STANDARD" && "📊 Comissão Padrão"}
                </p>
              </div>
            )}

            <Separator />

            <div className="flex justify-between items-center pt-2">
              <p className="font-semibold">Preço Final</p>
              <p className="text-2xl font-bold text-primary">
                R$ {order.final_price.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Endereços */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            Origem
          </h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-muted-foreground">CEP:</span> {order.origin.cep}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Endereço:</span> {order.origin.address}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Cidade:</span> {order.origin.city}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-accent" />
            Destino
          </h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-muted-foreground">CEP:</span> {order.destination.cep}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Endereço:</span> {order.destination.address}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Cidade:</span> {order.destination.city}
            </p>
          </div>
        </Card>
      </div>

      {/* Timeline de Eventos */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Timeline de Eventos</h3>
        <div className="space-y-4">
          {order.timeline.map((event, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${
                  index === 0 ? 'bg-primary' : 'bg-muted'
                }`} />
                {index !== order.timeline.length - 1 && (
                  <div className="w-0.5 h-full bg-border mt-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="text-sm text-muted-foreground">
                  {new Date(event.date).toLocaleString('pt-BR')}
                </p>
                <p className="font-medium">{event.status}</p>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
