import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { XCircle, Eye, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RejectedOrder {
  id: string;
  tracking_code: string;
  origin_address: string;
  destination_address: string;
  origin_cep: string;
  destination_cep: string;
  weight_kg: number;
  service_type: string;
  final_price: number;
  carrier_name: string | null;
  created_at: string;
  updated_at: string;
  operational_notes: string | null;
}

interface RejectedOrdersTableProps {
  onUpdate: () => void;
}

export const RejectedOrdersTable = ({ onUpdate }: RejectedOrdersTableProps) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<RejectedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<RejectedOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'rejected')
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos rejeitados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar pedidos rejeitados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetails = (order: RejectedOrder) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const getRejectionReason = (notes: string | null) => {
    if (!notes) return 'Motivo não informado';
    if (notes.startsWith('REJEITADO: ')) {
      return notes.replace('REJEITADO: ', '');
    }
    return notes;
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
            <XCircle className="h-5 w-5 text-red-600" />
            Pedidos Rejeitados ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <XCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>Nenhum pedido rejeitado</p>
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
                    <TableHead>Rejeitado em</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.tracking_code}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.carrier_name || 'N/A'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{order.origin_cep}</div>
                          <div className="text-xs text-muted-foreground">→ {order.destination_cep}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(order.final_price)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(order.updated_at)}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="text-sm text-muted-foreground truncate">
                          {getRejectionReason(order.operational_notes)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Motivo
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

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Pedido Rejeitado - {selectedOrder?.tracking_code}
            </DialogTitle>
            <DialogDescription>
              Detalhes do pedido que foi rejeitado pela administração
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Motivo da Rejeição</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
                    <p className="text-sm text-red-900 dark:text-red-200">
                      {getRejectionReason(selectedOrder.operational_notes)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Informações do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Transportadora</p>
                      <p className="font-medium">{selectedOrder.carrier_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="font-semibold text-lg">{formatCurrency(selectedOrder.final_price)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Rota</p>
                    <p className="font-medium">
                      {selectedOrder.origin_cep} → {selectedOrder.destination_cep}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedOrder.origin_address} → {selectedOrder.destination_address}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Criado em</p>
                      <p className="text-sm">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rejeitado em</p>
                      <p className="text-sm">{formatDate(selectedOrder.updated_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
