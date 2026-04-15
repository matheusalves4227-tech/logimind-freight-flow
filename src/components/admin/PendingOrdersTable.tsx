import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Eye, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PendingOrderDetail } from './PendingOrderDetail';

interface PendingOrder {
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
}

interface PendingOrdersTableProps {
  onUpdate: () => void;
}

export const PendingOrdersTable = ({ onUpdate }: PendingOrdersTableProps) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('pending-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    try {
      // Pedidos pendentes = pagamento confirmado MAS ainda SEM motorista atribuído
      // Quando motorista é atribuído, vai para aba "Aceitos"
      const { data, error } = await supabase
        .from('orders')
        .select('id, tracking_code, origin_address, destination_address, origin_cep, destination_cep, weight_kg, height_cm, width_cm, length_cm, service_type, final_price, base_price, commission_applied, comissao_logimarket_perc, status, carrier_name, driver_id, driver_name, created_at, estimated_delivery, user_id, status_pagamento')
        .in('status', ['pending', 'awaiting_contact'])
        .in('status_pagamento', ['PAGO', 'confirmed'])
        .is('driver_id', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar pedidos pendentes',
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

  const getTimeSinceCreated = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Menos de 1h';
    if (diffHours < 24) return `${diffHours}h atrás`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  const getUrgencyLevel = (date: string) => {
    const hours = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
    if (hours > 48) return 'high';
    if (hours > 24) return 'medium';
    return 'low';
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Pedidos Pendentes de Contato com Transportadora
        </CardTitle>
        <CardDescription>
          Pedidos contratados aguardando contato manual com a transportadora escolhida pelo cliente
        </CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum pedido pendente de contato</p>
            <p className="text-sm text-muted-foreground mt-2">
              Todos os pedidos foram processados e entraram em operação
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código Rastreio</TableHead>
                  <TableHead>Rota</TableHead>
                  <TableHead>Tipo / Peso</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Transportadora</TableHead>
                  <TableHead>Tempo Pendente</TableHead>
                  <TableHead>Urgência</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const urgency = getUrgencyLevel(order.created_at);
                  
                  return (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm font-medium">
                        {order.tracking_code}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="font-medium">{order.origin_cep}</span>
                          <span className="text-muted-foreground">→ {order.destination_cep}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="font-medium">{order.service_type || 'LTL'}</span>
                          <span className="text-muted-foreground">{order.weight_kg} kg</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-semibold text-primary">
                          {formatCurrency(order.final_price)}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm">
                          {order.carrier_name || 'Aguardando'}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {getTimeSinceCreated(order.created_at)}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        {urgency === 'high' && (
                          <Badge variant="destructive">
                            Alta Urgência
                          </Badge>
                        )}
                        {urgency === 'medium' && (
                          <Badge className="bg-accent text-accent-foreground">
                            Média Urgência
                          </Badge>
                        )}
                        {urgency === 'low' && (
                          <Badge variant="secondary">
                            Baixa Urgência
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setDetailOpen(true);
                          }}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <PendingOrderDetail
        order={selectedOrder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={() => {
          fetchOrders();
          onUpdate();
        }}
      />
    </Card>
  );
};
