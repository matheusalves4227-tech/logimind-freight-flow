import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { CheckCircle, Eye, Truck, Package } from 'lucide-react';

interface AcceptedOrder {
  id: string;
  tracking_code: string;
  origin_address: string;
  destination_address: string;
  origin_cep: string;
  destination_cep: string;
  weight_kg: number;
  service_type: string;
  final_price: number;
  status: string;
  carrier_name: string | null;
  driver_name: string | null;
  operational_notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface AcceptedOrdersTableProps {
  onUpdate: () => void;
}

export const AcceptedOrdersTable = ({ onUpdate }: AcceptedOrdersTableProps) => {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [orders, setOrders] = useState<AcceptedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<AcceptedOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, tracking_code, origin_address, destination_address, origin_cep, destination_cep, weight_kg, service_type, final_price, status, carrier_name, driver_name, operational_notes, created_at, updated_at, user_id')
        .in('status', ['in_transit', 'delivered'])
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar pedidos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!selectedOrder) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
          actual_delivery: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      await logAction({
        action: 'order_delivered',
        metadata: {
          order_id: selectedOrder.id,
          tracking_code: selectedOrder.tracking_code,
        },
      });

      toast({
        title: '📦 Entrega Confirmada!',
        description: `Pedido ${selectedOrder.tracking_code} marcado como entregue.`,
      });

      setDetailOpen(false);
      fetchOrders();
      onUpdate();
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao marcar como entregue', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_transit':
        return <Badge className="bg-blue-600 text-white gap-1"><Truck className="h-3 w-3" />Em Trânsito</Badge>;
      case 'delivered':
        return <Badge className="bg-emerald-600 text-white gap-1"><CheckCircle className="h-3 w-3" />Entregue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Em Trânsito / Entregues ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>Nenhum pedido em trânsito ou entregue no momento</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Transportadora</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.tracking_code}</TableCell>
                      <TableCell>
                        <div className="font-medium">{order.carrier_name || 'N/A'}</div>
                        {order.driver_name && (
                          <div className="text-xs text-muted-foreground">Motorista: {order.driver_name}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{order.origin_cep}</div>
                          <div className="text-xs text-muted-foreground">→ {order.destination_cep}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-primary">{formatCurrency(order.final_price)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(order.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelectedOrder(order); setDetailOpen(true); }}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes / Ações de Acompanhamento */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Acompanhamento — {selectedOrder?.tracking_code}
            </DialogTitle>
            <DialogDescription>
              Acompanhe e atualize o status de entrega
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-muted/50 border">
                <div>
                  <p className="text-xs text-muted-foreground">Transportadora</p>
                  <p className="font-semibold">{selectedOrder.carrier_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-semibold text-primary">{formatCurrency(selectedOrder.final_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Origem</p>
                  <p className="text-sm">{selectedOrder.origin_cep} — {selectedOrder.origin_address.split(',')[0]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Destino</p>
                  <p className="text-sm">{selectedOrder.destination_cep} — {selectedOrder.destination_address.split(',')[0]}</p>
                </div>
                {selectedOrder.driver_name && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Motorista</p>
                    <p className="text-sm font-medium">{selectedOrder.driver_name}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Status Atual</p>
                {getStatusBadge(selectedOrder.status)}
              </div>

              {selectedOrder.operational_notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notas Operacionais</p>
                  <div className="bg-muted/50 rounded p-3 text-sm font-mono whitespace-pre-wrap">
                    {selectedOrder.operational_notes}
                  </div>
                </div>
              )}

              <Separator />

              {selectedOrder.status === 'in_transit' && (
                <Button
                  onClick={handleMarkDelivered}
                  disabled={processing}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle className="h-4 w-4" />
                  {processing ? 'Processando...' : 'Marcar como Entregue'}
                </Button>
              )}

              {selectedOrder.status === 'delivered' && (
                <div className="text-center py-3 text-emerald-600 font-medium flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Entrega concluída — Aguardando repasse ao transportador
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
