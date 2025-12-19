import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatarMoeda } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Clock,
  RefreshCw,
  User,
  MapPin,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

interface AwaitingOrder {
  id: string;
  tracking_code: string;
  origin_address: string;
  destination_address: string;
  driver_name: string | null;
  driver_phone: string | null;
  final_price: number;
  created_at: string;
  updated_at: string;
}

export const AwaitingDriverTable = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<AwaitingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();

    // Realtime subscription
    const channel = supabase
      .channel('awaiting-driver-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'awaiting_driver_acceptance')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAssignment = async (order: AwaitingOrder) => {
    setProcessing(order.id);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'pending',
          driver_id: null,
          driver_name: null,
          driver_phone: null,
          operational_notes: `Atribuição revogada pelo admin em ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Atribuição Revogada",
        description: `Frete ${order.tracking_code} voltou para a fila de atribuição.`,
      });

      loadOrders();
    } catch (error) {
      console.error('Erro ao revogar atribuição:', error);
      toast({
        title: "Erro",
        description: "Não foi possível revogar a atribuição.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getTimeSinceAssignment = (updatedAt: string) => {
    const now = new Date();
    const updated = new Date(updatedAt);
    const diffMs = now.getTime() - updated.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}min`;
    }
    return `${diffMins}min`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Carregando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-accent" />
            Aguardando Aceite do Motorista
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Nenhum frete aguardando aceite no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-accent/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-accent" />
          Aguardando Aceite do Motorista
          <Badge variant="outline" className="ml-2 bg-accent/10 text-accent">
            {orders.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Rota</TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Aguardando há</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const waitTime = getTimeSinceAssignment(order.updated_at);
              const waitHours = parseInt(waitTime.split('h')[0]) || 0;
              const isLongWait = waitHours >= 2;

              return (
                <TableRow key={order.id}>
                  <TableCell className="font-mono font-medium">
                    {order.tracking_code}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">
                        {order.origin_address.split(',')[0]} → {order.destination_address.split(',')[0]}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{order.driver_name}</p>
                        <p className="text-xs text-muted-foreground">{order.driver_phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatarMoeda(order.final_price)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={isLongWait ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-accent/10 text-accent border-accent/30"}
                    >
                      {isLongWait && <AlertCircle className="h-3 w-3 mr-1" />}
                      {waitTime}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeAssignment(order)}
                      disabled={processing === order.id}
                      className="text-destructive hover:text-destructive"
                    >
                      {processing === order.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Revogar
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
