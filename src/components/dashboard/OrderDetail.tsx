import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, MapPin, Clock, DollarSign } from "lucide-react";

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

        {/* Resumo do Pagamento - Apenas preço final */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Valor do Frete
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center pt-2">
              <p className="font-semibold">Valor Total</p>
              <p className="text-2xl font-bold text-primary">
                {order.final_price.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
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
