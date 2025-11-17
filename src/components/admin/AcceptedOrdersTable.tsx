import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PendingOrderDetail } from './PendingOrderDetail';

interface AcceptedOrder {
  id: string;
  tracking_code: string;
  origin_address: string;
  destination_address: string;
  origin_cep: string;
  destination_cep: string;
  weight_kg: number;
  height_cm?: number;
  width_cm?: number;
  length_cm?: number;
  service_type: string;
  final_price: number;
  base_price?: number;
  commission_applied?: number;
  comissao_logimarket_perc?: number;
  status: string;
  carrier_name: string | null;
  driver_id: string | null;
  driver_name: string | null;
  created_at: string;
  estimated_delivery: string | null;
  user_id: string;
  updated_at: string;
}

interface AcceptedOrdersTableProps {
  onUpdate: () => void;
}

export const AcceptedOrdersTable = ({ onUpdate }: AcceptedOrdersTableProps) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<AcceptedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<AcceptedOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, tracking_code, origin_address, destination_address, origin_cep, destination_cep, weight_kg, height_cm, width_cm, length_cm, service_type, final_price, base_price, commission_applied, comissao_logimarket_perc, status, carrier_name, driver_id, driver_name, created_at, estimated_delivery, user_id, updated_at')
        .eq('status', 'confirmed')
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos aceitos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar pedidos aceitos',
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

  const handleViewDetails = (order: AcceptedOrder) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const handleUpdate = () => {
    fetchOrders();
    onUpdate();
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
            <CheckCircle className="h-5 w-5 text-green-600" />
            Pedidos Aceitos/Confirmados ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>Nenhum pedido aceito no momento</p>
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
                    <TableHead>Aceito em</TableHead>
                    <TableHead>Status</TableHead>
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
                        {order.driver_name && (
                          <div className="text-xs text-muted-foreground">
                            Motorista: {order.driver_name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{order.origin_cep}</div>
                          <div className="text-xs text-muted-foreground">→ {order.destination_cep}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(order.final_price)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(order.updated_at)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-600 text-white">
                          Confirmado
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalhes
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

      <PendingOrderDetail
        order={selectedOrder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={handleUpdate}
      />
    </>
  );
};
