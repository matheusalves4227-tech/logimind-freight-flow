import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PayoutRecord {
  id: string;
  order_id: string;
  driver_id: string;
  gross_amount: number;
  stripe_fee: number;
  platform_net_fee: number;
  payout_amount: number;
  status: string;
  scheduled_for: string;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
  orders?: { tracking_code: string } | null;
  driver_profiles?: { full_name: string; pix_key: string | null } | null;
}

interface QueueSummary {
  total: number;
  pending: number;
  ready: number;
  paid: number;
  failed: number;
  totalGross: number;
  totalStripeFees: number;
  totalPlatformNet: number;
  totalPayout: number;
}

export const PayoutsQueueTable = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [summary, setSummary] = useState<QueueSummary>({
    total: 0, pending: 0, ready: 0, paid: 0, failed: 0,
    totalGross: 0, totalStripeFees: 0, totalPlatformNet: 0, totalPayout: 0,
  });

  useEffect(() => {
    fetchPayouts();

    const channel = supabase
      .channel('payouts-queue-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payouts_queue' }, () => {
        fetchPayouts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payouts_queue')
        .select('*, orders(tracking_code), driver_profiles(full_name, pix_key)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const records = (data || []) as unknown as PayoutRecord[];
      setPayouts(records);

      // Calculate summary
      const s: QueueSummary = {
        total: records.length,
        pending: records.filter(p => p.status === 'pending').length,
        ready: records.filter(p => p.status === 'ready_for_transfer').length,
        paid: records.filter(p => p.status === 'paid').length,
        failed: records.filter(p => p.status === 'failed').length,
        totalGross: records.reduce((a, p) => a + (p.gross_amount || 0), 0),
        totalStripeFees: records.reduce((a, p) => a + (p.stripe_fee || 0), 0),
        totalPlatformNet: records.reduce((a, p) => a + (p.platform_net_fee || 0), 0),
        totalPayout: records.reduce((a, p) => a + (p.payout_amount || 0), 0),
      };
      setSummary(s);
    } catch (error) {
      console.error('Erro ao buscar fila de repasses:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar fila de repasses', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReady = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payouts_queue')
        .update({ status: 'ready_for_transfer' as any })
        .eq('id', id);
      if (error) throw error;
      toast({ title: '✅ Repasse aprovado', description: 'Marcado como pronto para transferência.' });
      fetchPayouts();
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao atualizar status', variant: 'destructive' });
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payouts_queue')
        .update({ status: 'paid' as any, processed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast({ title: '✅ Repasse concluído', description: 'Pagamento marcado como pago.' });
      fetchPayouts();
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao atualizar status', variant: 'destructive' });
    }
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pendente', className: 'bg-muted text-muted-foreground' },
    ready_for_transfer: { label: 'Pronto p/ Transf.', className: 'bg-accent/20 text-accent-foreground border-accent' },
    paid: { label: 'Pago', className: 'bg-secondary/20 text-secondary border-secondary' },
    failed: { label: 'Falhou', className: 'bg-destructive/20 text-destructive border-destructive' },
  };

  const filteredPayouts = statusFilter === 'all' ? payouts : payouts.filter(p => p.status === statusFilter);

  if (loading) {
    return (
      <Card className="card-logimarket">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">GMV Bruto</p>
            <p className="text-xl font-bold text-primary">{fmt(summary.totalGross)}</p>
            <p className="text-xs text-muted-foreground">{summary.total} operações</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Taxas Stripe</p>
            <p className="text-xl font-bold text-destructive">{fmt(summary.totalStripeFees)}</p>
            <p className="text-xs text-muted-foreground">~3.99% retido</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground">Lucro Líquido</p>
              <TrendingUp className="h-3 w-3 text-secondary" />
            </div>
            <p className="text-xl font-bold text-secondary">{fmt(summary.totalPlatformNet)}</p>
            <p className="text-xs text-muted-foreground">Margem real da plataforma</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Repasse Motoristas</p>
            <p className="text-xl font-bold text-accent">{fmt(summary.totalPayout)}</p>
            <p className="text-xs text-muted-foreground">{summary.pending + summary.ready} pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Payouts Table */}
      <Card className="card-logimarket">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Gestão de Repasses</CardTitle>
                <CardDescription>Fila completa com decomposição: GMV → Taxa Stripe → Lucro → Repasse</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos ({summary.total})</SelectItem>
                  <SelectItem value="pending">Pendentes ({summary.pending})</SelectItem>
                  <SelectItem value="ready_for_transfer">Prontos ({summary.ready})</SelectItem>
                  <SelectItem value="paid">Pagos ({summary.paid})</SelectItem>
                  <SelectItem value="failed">Falhados ({summary.failed})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayouts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-secondary mx-auto mb-4" />
              <p className="text-foreground font-medium">Nenhum repasse encontrado</p>
              <p className="text-sm text-muted-foreground mt-2">
                {statusFilter === 'all' ? 'Os repasses aparecerão quando pedidos forem entregues.' : 'Nenhum repasse com este filtro.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead className="text-right">
                      <span className="flex items-center justify-end gap-1">
                        <ArrowUpRight className="h-3 w-3 text-primary" /> GMV
                      </span>
                    </TableHead>
                    <TableHead className="text-right">
                      <span className="flex items-center justify-end gap-1">
                        <ArrowDownRight className="h-3 w-3 text-destructive" /> Stripe
                      </span>
                    </TableHead>
                    <TableHead className="text-right">
                      <span className="flex items-center justify-end gap-1">
                        <TrendingUp className="h-3 w-3 text-secondary" /> Lucro
                      </span>
                    </TableHead>
                    <TableHead className="text-right">Repasse</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Agendado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.map((p) => {
                    const sc = statusConfig[p.status] || statusConfig.pending;
                    return (
                      <TableRow key={p.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm font-medium">
                          {(p as any).orders?.tracking_code || p.order_id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {(p as any).driver_profiles?.full_name || '-'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{fmt(p.gross_amount)}</TableCell>
                        <TableCell className="text-right text-destructive text-sm">-{fmt(p.stripe_fee)}</TableCell>
                        <TableCell className="text-right text-secondary font-bold">{fmt(p.platform_net_fee)}</TableCell>
                        <TableCell className="text-right text-accent font-bold text-lg">{fmt(p.payout_amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={sc.className}>{sc.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(p.scheduled_for)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {p.status === 'pending' && (
                              <Button size="sm" variant="outline" onClick={() => handleMarkReady(p.id)}>
                                Aprovar
                              </Button>
                            )}
                            {p.status === 'ready_for_transfer' && (
                              <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => handleMarkPaid(p.id)}>
                                <DollarSign className="h-3 w-3 mr-1" />
                                Pagar
                              </Button>
                            )}
                            {p.status === 'paid' && (
                              <span className="text-xs text-muted-foreground">{fmtDate(p.processed_at)}</span>
                            )}
                            {p.status === 'failed' && (
                              <span className="text-xs text-destructive">{p.error_message || 'Erro'}</span>
                            )}
                          </div>
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
