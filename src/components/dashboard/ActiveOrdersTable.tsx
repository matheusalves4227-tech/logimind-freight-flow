import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, MapPin, Loader2, CheckCircle2 } from "lucide-react";
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

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  paid: { label: "Pago", color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" },
  PAGO: { label: "Pago", color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" },
  pending: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20" },
  processing: { label: "Processando", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  AGUARDANDO_PIX: { label: "Aguardando PIX", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20" },
  COMPROVANTE_ENVIADO: { label: "Comprovante Enviado", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  failed: { label: "Falhou", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" },
  FALHA_REPASSE: { label: "Falha Repasse", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" },
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
    // Pode tentar pagamento apenas se:
    // 1. Pagamento está pendente, processando ou aguardando PIX (sem comprovante)
    // 2. Pedido não foi entregue
    // 3. Pedido não tem ocorrência
    // 4. Não tem comprovante já enviado
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
      return 'COMPROVANTE_ENVIADO';
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
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Pedidos Ativos</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
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
            className="flex h-10 w-full md:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Todos os Status</option>
            <option value="in_transit">Em Trânsito</option>
            <option value="scheduled">Coleta Agendada</option>
            <option value="delivered">Entregue</option>
            <option value="incident">Ocorrência</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID do Frete</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Status Pagamento</TableHead>
              <TableHead>Transportador</TableHead>
              <TableHead>Rota</TableHead>
              <TableHead>Preço Final</TableHead>
              <TableHead>Previsão de Entrega</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum pedido encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig[order.status].color}>
                      {statusConfig[order.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const effectiveStatus = getEffectivePaymentStatus(order);
                      return (
                        <Badge 
                          variant="outline" 
                          className={paymentStatusConfig[effectiveStatus as keyof typeof paymentStatusConfig]?.color || ""}
                        >
                          {(effectiveStatus === 'paid' || effectiveStatus === 'PAGO') && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {effectiveStatus === 'COMPROVANTE_ENVIADO' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {paymentStatusConfig[effectiveStatus as keyof typeof paymentStatusConfig]?.label || effectiveStatus}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.carrier_name}</p>
                      {order.carrier_type === "autonomous" && order.vehicle_type && (
                        <p className="text-xs text-muted-foreground">
                          Autônomo - {order.vehicle_type}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{order.origin_city}</p>
                      <p className="text-muted-foreground">→ {order.destination_city}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-primary">
                    {order.final_price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </TableCell>
                  <TableCell>
                    <span className={isNearDeadline(order.estimated_delivery) ? "text-accent font-medium" : ""}>
                      {new Date(order.estimated_delivery).toLocaleDateString('pt-BR')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <TooltipProvider>
                        {/* Botão Pagar Agora com validações */}
                        {onRetryPayment && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant={(order.payment_status === 'paid' || order.payment_status === 'PAGO' || hasProofUploaded(order)) ? "secondary" : "default"}
                                  size="sm"
                                  onClick={() => handlePaymentClick(order.id)}
                                  disabled={!canRetryPayment(order) || loadingOrderId === order.id}
                                  className="gap-2"
                                >
                                  {loadingOrderId === order.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Processando...
                                    </>
                                  ) : (order.payment_status === 'paid' || order.payment_status === 'PAGO') ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4" />
                                      Pago ✓
                                    </>
                                  ) : hasProofUploaded(order) ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4" />
                                      Aguardando Validação
                                    </>
                                  ) : order.payment_status === 'AGUARDANDO_PIX' ? (
                                    'Enviar Comprovante'
                                  ) : (
                                    'Pagar agora'
                                  )}
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {!canRetryPayment(order) && (
                              <TooltipContent>
                                <p>{getPaymentDisabledReason(order)}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        )}
                      
                        {/* Botão Rastrear para pedidos com código de rastreamento */}
                        {order.tracking_code && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/tracking/${order.tracking_code}`)}
                            className="gap-2"
                          >
                            <MapPin className="h-4 w-4" />
                            Rastrear
                          </Button>
                        )}
                        
                        {/* Botão Ver Detalhes sempre visível */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(order.id)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
