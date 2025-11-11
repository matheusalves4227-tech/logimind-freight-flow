import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatarMoeda } from '@/lib/formatters';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PaymentTransaction {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  processed_at: string | null;
  created_at: string;
  gateway_response: any;
  order: {
    tracking_code: string;
    comissao_logimarket_val: number;
    comissao_logimarket_perc: number;
  };
}

export const DriverPaymentHistory = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar profile do motorista
      const { data: profile } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Buscar todas as transações de PAYMENT_OUT do motorista
      // TODO: Implementar join com orders quando sistema de lances estiver completo
      // Por enquanto buscaremos todas as transações PAYMENT_OUT
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select(`
          id,
          order_id,
          amount,
          status,
          processed_at,
          created_at,
          gateway_response,
          order:orders (
            tracking_code,
            comissao_logimarket_val,
            comissao_logimarket_perc
          )
        `)
        .eq('type', 'PAYMENT_OUT')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setTransactions(transactions || []);
    } catch (error) {
      console.error('Erro ao buscar histórico de pagamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return <Badge className="tag-status tag-status-entregue">Pago</Badge>;
      case 'PENDING':
      case 'HELD':
        return <Badge className="tag-status tag-status-atraso">Pendente</Badge>;
      case 'FAILED':
        return <Badge className="tag-status tag-status-cancelado">Falha</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Carregando histórico...</div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="card-logimarket">
        <CardHeader>
          <CardTitle>Histórico de Repasses</CardTitle>
          <CardDescription>Acompanhe todos os seus pagamentos recebidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum repasse registrado ainda</p>
            <p className="text-sm text-muted-foreground mt-2">
              Os repasses aparecerão aqui após a conclusão dos fretes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-logimarket">
      <CardHeader>
        <CardTitle>Histórico de Repasses</CardTitle>
        <CardDescription>
          Acompanhe todos os seus pagamentos e comissões aplicadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID do Frete</TableHead>
                <TableHead>Valor Repassado</TableHead>
                <TableHead>Comissão LogiMarket</TableHead>
                <TableHead>Data do Repasse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Button
                      variant="link"
                      className="p-0 h-auto font-mono text-primary hover:text-primary/80"
                      onClick={() => navigate(`/tracking/${transaction.order?.tracking_code}`)}
                    >
                      {transaction.order?.tracking_code || transaction.order_id.substring(0, 8)}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </TableCell>
                  
                  <TableCell>
                    <span className={`font-bold ${
                      transaction.status === 'PAID' ? 'text-secondary' : 'text-foreground'
                    }`}>
                      {formatarMoeda(transaction.amount)}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            <span className="detail-text-sm">
                              {formatarMoeda(transaction.order?.comissao_logimarket_val || 0)}
                            </span>
                            <span className="detail-text-xs">
                              ({((transaction.order?.comissao_logimarket_perc || 0) * 100).toFixed(1)}%)
                            </span>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">
                            Comissão calculada pelo LogiMind baseada em otimização de rota e competitividade
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {transaction.processed_at
                          ? new Date(transaction.processed_at).toLocaleDateString('pt-BR')
                          : new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="detail-text-xs">
                        {transaction.processed_at
                          ? new Date(transaction.processed_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Aguardando processamento'}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(transaction.status)}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/tracking/${transaction.order?.tracking_code}`)}
                    >
                      Ver Frete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
