import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, MapPin, Loader2, CheckCircle2, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Order {
  id: string;
  tracking_code?: string;
  quote_id: string;
  status: "in_transit" | "scheduled" | "delivered" | "incident";
  carrier_name: string;
  carrier_type: "carrier" | "autonomous";
  vehicle_type?: string;
  origin_city: string;
  destination_city: string;
  final_price: number;
  estimated_delivery: string;
  created_at: string;
  payment_status?: string;
  operational_notes?: string;
}

interface ActiveOrdersTableProps {
  orders: Order[];
  onViewDetails: (orderId: string) => void;
  onRetryPayment?: (orderId: string) => void;
}

const statusConfig = {
  in_transit: { label: "Em Trânsito", color: "bg-primary text-primary-foreground" },
  scheduled: { label: "Coleta Agendada", color: "bg-accent text-accent-foreground" },
  delivered: { label: "Entregue", color: "bg-secondary text-secondary-foreground" },
  incident: { label: "Ocorrência", color: "bg-destructive text-destructive-foreground" },
};

const paymentStatusConfig: Record<string, { label: string; color: string; icon?: "check" | "clock" | "pulse" }> = {
  paid: { label: "Pago", color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30", icon: "check" },
  PAGO: { label: "Pago", color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30", icon: "check" },
  pending: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
  processing: { label: "Processando", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  AGUARDANDO_PIX: { label: "Aguardando PIX", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-400/40", icon: "clock" },
  COMPROVANTE_ENVIADO: { label: "Comprovante Enviado", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-500/40", icon: "check" },
  AGUARDANDO_VALIDACAO: { label: "Aguardando Validação", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-500/40", icon: "pulse" },
  failed: { label: "Falhou", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" },
  FALHA_REPASSE: { label: "Falha Repasse", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" },
};

// Extrair cidade/UF de endereço completo
const extractCityState = (address: string) => {
  // Tenta extrair cidade - UF do formato "Rua X, 123 - Bairro - Cidade - UF"
  const parts = address.split(' - ');
  if (parts.length >= 2) {
    const lastTwo = parts.slice(-2);
    // Verifica se o último é um estado (2 letras maiúsculas)
    if (lastTwo[1]?.match(/^[A-Z]{2}$/)) {
      return `${lastTwo[0]}/${lastTwo[1]}`;
    }
    return lastTwo.join(' - ');
  }
  return address;
};

export const ActiveOrdersTable = ({ orders, onViewDetails, onRetryPayment }: ActiveOrdersTableProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.carrier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.origin_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.destination_city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const isNearDeadline = (date: string) => {
    const delivery = new Date(date);
    const now = new Date();
    const daysUntil = Math.ceil((delivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 2 && daysUntil >= 0;
  };

  const hasProofUploaded = (order: Order) => {
    return order.operational_notes?.includes("Comprovante PIX:");
  };

  const canRetryPayment = (order: Order) => {
    const validPaymentStatus = ['pending', 'processing', 'AGUARDANDO_PIX'].includes(order.payment_status || '');
    const validOrderStatus = order.status !== 'delivered' && order.status !== 'incident';
    const noProofYet = !hasProofUploaded(order);
    return validPaymentStatus && validOrderStatus && noProofYet;
  };

  const getPaymentDisabledReason = (order: Order) => {
    if (order.payment_status === 'paid' || order.payment_status === 'PAGO') return "Pedido já foi pago";
    if (hasProofUploaded(order)) return "Comprovante já enviado - aguardando validação";
    if (order.status === 'delivered') return "Pedido já foi entregue";
    if (order.status === 'incident') return "Pedido tem ocorrência";
    return "";
  };

  const getEffectivePaymentStatus = (order: Order) => {
    if (hasProofUploaded(order) && order.payment_status === 'AGUARDANDO_PIX') {
      return 'AGUARDANDO_VALIDACAO';
    }
    return order.payment_status;
  };

  const handlePaymentClick = async (orderId: string) => {
    if (!onRetryPayment) return;
    setLoadingOrderId(orderId);
    try {
      await onRetryPayment(orderId);
    } finally {
      setLoadingOrderId(null);
    }
  };

  return (
    <Card className="p-4 md:p-6 shadow-sm">
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Pedidos Ativos</h2>
        
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, transportadora ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 w-full md:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">Todos os Status</option>
            <option value="in_transit">Em Trânsito</option>
            <option value="scheduled">Coleta Agendada</option>
            <option value="delivered">Entregue</option>
            <option value="incident">Ocorrência</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 md:mx-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ID</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pagamento</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Transportador</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rota</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Valor</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Previsão</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum pedido encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const effectiveStatus = getEffectivePaymentStatus(order);
                const paymentConfig = paymentStatusConfig[effectiveStatus as keyof typeof paymentStatusConfig];
                
                return (
                  <TableRow key={order.id} className="hover:bg-muted/50 group">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig[order.status].color} text-xs`}>
                        {statusConfig[order.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${paymentConfig?.color || ""} text-xs flex items-center gap-1 w-fit`}
                      >
                        {paymentConfig?.icon === 'check' && <CheckCircle2 className="h-3 w-3" />}
                        {paymentConfig?.icon === 'clock' && <Clock className="h-3 w-3" />}
                        {paymentConfig?.icon === 'pulse' && <span className="w-2 h-2 rounded-full bg-current animate-pulse" />}
                        {paymentConfig?.label || effectiveStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{order.carrier_name}</p>
                        {order.carrier_type === "autonomous" && order.vehicle_type && (
                          <p className="text-xs text-muted-foreground">
                            Autônomo · {order.vehicle_type}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium text-sm">
                          {extractCityState(order.origin_city)} → {extractCityState(order.destination_city)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={order.origin_city}>
                          {order.origin_city.split(' - ').slice(0, 2).join(' - ')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono font-semibold text-primary tabular-nums">
                        {order.final_price.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm ${isNearDeadline(order.estimated_delivery) ? "text-amber-600 dark:text-amber-400 font-medium" : ""}`}>
                        {new Date(order.estimated_delivery).toLocaleDateString('pt-BR')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                        <TooltipProvider>
                          {/* Botão Pagar */}
                          {onRetryPayment && canRetryPayment(order) && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handlePaymentClick(order.id)}
                              disabled={loadingOrderId === order.id}
                              className="h-8 px-3 text-xs"
                            >
                              {loadingOrderId === order.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : order.payment_status === 'AGUARDANDO_PIX' ? (
                                'Enviar'
                              ) : (
                                'Pagar'
                              )}
                            </Button>
                          )}
                        
                          {/* Botão Rastrear - Ghost Button com ícone */}
                          {order.tracking_code && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/tracking/${order.tracking_code}`)}
                                  className="h-8 w-8"
                                >
                                  <MapPin className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Rastrear</TooltipContent>
                            </Tooltip>
                          )}
                          
                          {/* Botão Ver Detalhes - Ghost Button com ícone */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onViewDetails(order.id)}
                                className="h-8 w-8"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver Detalhes</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
