import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet, ArrowUpRight, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PayoutRecord {
  id: string;
  order_id: string;
  gross_amount: number;
  payout_amount: number;
  status: string;
  scheduled_for: string;
  processed_at: string | null;
  created_at: string;
  orders?: { tracking_code: string } | null;
}

export const DriverEarningsStatement = () => {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [totalPending, setTotalPending] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);

  useEffect(() => {
    fetchPayouts();

    const channel = supabase
      .channel('driver-earnings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payouts_queue' }, () => {
        fetchPayouts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);

      // Get current user's driver profile id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        setLoading(false);
        return;
      }

      // Fetch payouts using the idx_payouts_driver_history index (driver_id, created_at DESC)
      const { data, error } = await supabase
        .from('payouts_queue')
        .select('id, order_id, gross_amount, payout_amount, status, scheduled_for, processed_at, created_at, orders(tracking_code)')
        .eq('driver_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const records = (data || []) as unknown as PayoutRecord[];
      setPayouts(records);

      // Calculate totals
      setTotalPending(
        records
          .filter(p => p.status === 'pending' || p.status === 'ready_for_transfer')
          .reduce((sum, p) => sum + (p.payout_amount || 0), 0)
      );
      setTotalReceived(
        records
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + (p.payout_amount || 0), 0)
      );
    } catch (error) {
      console.error('Erro ao buscar extrato:', error);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    pending: { label: 'Pendente', icon: <Clock className="h-3 w-3" />, className: 'bg-muted text-muted-foreground' },
    ready_for_transfer: { label: 'Agendado', icon: <ArrowUpRight className="h-3 w-3" />, className: 'bg-accent/20 text-accent-foreground border-accent' },
    paid: { label: 'Pago', icon: <CheckCircle className="h-3 w-3" />, className: 'bg-secondary/20 text-secondary border-secondary' },
    failed: { label: 'Falhou', icon: <AlertTriangle className="h-3 w-3" />, className: 'bg-destructive/20 text-destructive border-destructive' },
  };

  const filteredPayouts = statusFilter === 'all' ? payouts : payouts.filter(p => p.status === statusFilter);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-accent">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total a Receber</p>
                <p className="text-2xl font-bold text-accent">{fmt(totalPending)}</p>
                <p className="text-xs text-muted-foreground">
                  {payouts.filter(p => p.status === 'pending' || p.status === 'ready_for_transfer').length} repasses pendentes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Recebido</p>
                <p className="text-2xl font-bold text-secondary">{fmt(totalReceived)}</p>
                <p className="text-xs text-muted-foreground">
                  {payouts.filter(p => p.status === 'paid').length} repasses concluídos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statement Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Wallet className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Meus Ganhos</CardTitle>
                <CardDescription>Extrato financeiro com todos os seus repasses</CardDescription>
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos ({payouts.length})</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="ready_for_transfer">Agendados</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="failed">Falhados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayouts.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-foreground font-medium">Nenhum repasse encontrado</p>
              <p className="text-sm text-muted-foreground mt-2">
                Seus repasses aparecerão aqui após concluir entregas.
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cód. Pedido</TableHead>
                    <TableHead className="text-right">Valor do Frete</TableHead>
                    <TableHead className="text-right">Seu Repasse</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.map((p) => {
                    const sc = statusConfig[p.status] || statusConfig.pending;
                    return (
                      <TableRow key={p.id} className="hover:bg-muted/50">
                        <TableCell className="text-sm text-muted-foreground">
                          {fmtDate(p.created_at)}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium">
                          {(p as any).orders?.tracking_code || p.order_id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {fmt(p.gross_amount)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-lg text-primary">
                          {fmt(p.payout_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 ${sc.className}`}>
                            {sc.icon}
                            {sc.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
