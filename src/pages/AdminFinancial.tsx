import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, TrendingUp, Percent, Package, ArrowUpRight, ArrowDownRight, 
  Wallet, CreditCard, Clock, AlertTriangle, RefreshCw, BarChart3
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { PendingPayoutsTable } from '@/components/admin/PendingPayoutsTable';
import { PayoutsQueueTable } from '@/components/admin/PayoutsQueueTable';
import { FinancialKPIs } from '@/components/admin/FinancialKPIs';

interface PerformanceData {
  month_year: string;
  total_pedidos: number;
  gmv_vendas_brutas: number;
  faturamento_liquido_logimarket: number;
  total_repasse_motorista: number;
  media_comissao_aplicada: number;
}

interface OrderFinancialSummary {
  total_orders: number;
  total_gmv: number;
  total_commission: number;
  total_payout: number;
  pending_payout_count: number;
  pending_payout_value: number;
  paid_count: number;
  unpaid_count: number;
}

const CHART_COLORS = {
  gmv: 'hsl(var(--primary))',
  revenue: 'hsl(var(--secondary))',
  payout: 'hsl(var(--accent))',
};

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];

const AdminFinancial = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [summary, setSummary] = useState<OrderFinancialSummary>({
    total_orders: 0, total_gmv: 0, total_commission: 0, total_payout: 0,
    pending_payout_count: 0, pending_payout_value: 0, paid_count: 0, unpaid_count: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/auth'); return; }
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      const hasAdmin = roles?.some(r => r.role === 'admin');
      if (!hasAdmin) { navigate('/dashboard'); return; }
      setIsAdmin(true);
      await fetchAllData();
    } catch { navigate('/auth'); }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchPerformance(), fetchOrderSummary(), fetchRecentOrders()]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast({ title: '✅ Dados atualizados', description: 'Dashboard financeiro atualizado com sucesso.' });
  };

  const fetchPerformance = async () => {
    try {
      const { data, error } = await supabase.rpc('get_logimarket_performance');
      if (error) throw error;
      setPerformanceData((data || []).map((d: any) => ({
        ...d,
        month_label: d.month_year ? new Date(d.month_year).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) : '-',
      })));
    } catch (e) { console.error('Erro performance:', e); }
  };

  const fetchOrderSummary = async () => {
    try {
      const { data: orders, error } = await supabase.from('orders').select('final_price, comissao_logimarket_val, valor_repasse_liquido, status, status_pagamento');
      if (error) throw error;
      if (!orders) return;

      const delivered = orders.filter(o => o.status === 'delivered');
      const pendingPayout = delivered.filter(o => o.status_pagamento !== 'REPASSE_CONCLUIDO');

      setSummary({
        total_orders: orders.length,
        total_gmv: orders.reduce((s, o) => s + (o.final_price || 0), 0),
        total_commission: orders.reduce((s, o) => s + (o.comissao_logimarket_val || 0), 0),
        total_payout: orders.reduce((s, o) => s + (o.valor_repasse_liquido || 0), 0),
        pending_payout_count: pendingPayout.length,
        pending_payout_value: pendingPayout.reduce((s, o) => s + (o.valor_repasse_liquido || 0), 0),
        paid_count: orders.filter(o => o.status_pagamento === 'PAGO' || o.status_pagamento === 'REPASSE_CONCLUIDO').length,
        unpaid_count: orders.filter(o => !o.status_pagamento || o.status_pagamento === 'pending').length,
      });
    } catch (e) { console.error('Erro summary:', e); }
  };

  const fetchRecentOrders = async () => {
    try {
      const { data, error } = await supabase.from('orders')
        .select('id, tracking_code, final_price, comissao_logimarket_val, valor_repasse_liquido, status, status_pagamento, carrier_name, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setRecentOrders(data || []);
    } catch (e) { console.error('Erro recent:', e); }
  };

  // Realtime subscription
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('financial-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrderSummary();
        fetchRecentOrders();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_transactions' }, () => {
        fetchOrderSummary();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtPct = (v: number) => (v * 100).toFixed(1) + '%';

  const paymentStatusData = [
    { name: 'Pagos', value: summary.paid_count },
    { name: 'Pendentes', value: summary.unpaid_count },
    { name: 'Rep. Pendente', value: summary.pending_payout_count },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Painel Financeiro | LogiMarket Admin</title>
        <meta name="description" content="Dashboard financeiro consolidado com métricas de receita, comissão e repasses." />
      </Helmet>
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-serif tracking-tight">
              💰 Painel Financeiro
            </h1>
            <p className="text-muted-foreground mt-1">
              Visão consolidada de receita, comissões e repasses em tempo real
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* KPIs Financeiros existentes */}
        <FinancialKPIs />

        {/* Cards de Destaque */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium">Comissão Acumulada</p>
                  <p className="text-2xl font-bold text-primary">{fmt(summary.total_commission)}</p>
                  <p className="text-xs text-muted-foreground">Receita retida total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium">Total Repassado</p>
                  <p className="text-2xl font-bold text-secondary">{fmt(summary.total_payout)}</p>
                  <p className="text-xs text-muted-foreground">Pagos aos motoristas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-l-4 shadow-md hover:shadow-lg transition-shadow ${summary.pending_payout_count > 0 ? 'border-l-destructive' : 'border-l-accent'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${summary.pending_payout_count > 0 ? 'bg-destructive/10' : 'bg-accent/10'}`}>
                  <Clock className={`h-6 w-6 ${summary.pending_payout_count > 0 ? 'text-destructive' : 'text-accent'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium">Repasses Pendentes</p>
                  <p className={`text-2xl font-bold ${summary.pending_payout_count > 0 ? 'text-destructive' : 'text-accent'}`}>
                    {summary.pending_payout_count}
                  </p>
                  <p className="text-xs text-muted-foreground">{fmt(summary.pending_payout_value)} a repassar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Percent className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium">Take Rate Médio</p>
                  <p className="text-2xl font-bold text-accent">
                    {summary.total_gmv > 0 ? fmtPct(summary.total_commission / summary.total_gmv) : '0%'}
                  </p>
                  <p className="text-xs text-muted-foreground">Comissão / GMV</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="revenue" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <BarChart3 className="h-4 w-4" />
              Receita
            </TabsTrigger>
            <TabsTrigger value="payouts" className="gap-2 relative data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <DollarSign className="h-4 w-4" />
              Repasses
              {summary.pending_payout_count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {summary.pending_payout_count}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <TrendingUp className="h-4 w-4" />
              Detalhamento
            </TabsTrigger>
          </TabsList>

          {/* Tab: Receita */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfico de Receita */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Evolução de Receita</CardTitle>
                  <CardDescription>GMV, Receita LogiMarket e Repasses ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  {performanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="gradGMV" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(142, 53%, 43%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(142, 53%, 43%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="month_label" 
                          className="text-xs fill-muted-foreground" 
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          className="text-xs fill-muted-foreground" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            fmt(value),
                            name === 'gmv_vendas_brutas' ? 'GMV Bruto' : 
                            name === 'faturamento_liquido_logimarket' ? 'Receita LogiMarket' : 'Repasse Motoristas'
                          ]}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Area type="monotone" dataKey="gmv_vendas_brutas" stroke="hsl(217, 91%, 50%)" fill="url(#gradGMV)" strokeWidth={2} name="gmv_vendas_brutas" />
                        <Area type="monotone" dataKey="faturamento_liquido_logimarket" stroke="hsl(142, 53%, 43%)" fill="url(#gradRevenue)" strokeWidth={2} name="faturamento_liquido_logimarket" />
                        <Area type="monotone" dataKey="total_repasse_motorista" stroke="hsl(43, 96%, 56%)" fill="none" strokeWidth={2} strokeDasharray="5 5" name="total_repasse_motorista" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Sem dados de receita ainda</p>
                        <p className="text-sm">Os dados aparecerão conforme pedidos forem concluídos</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Distribuição de Status de Pagamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status de Pagamentos</CardTitle>
                  <CardDescription>Distribuição dos pedidos por status</CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={paymentStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {paymentStatusData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                      <p>Sem dados</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Comissão por Mês */}
            {performanceData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comissão por Período</CardTitle>
                  <CardDescription>Média de comissão aplicada pelo LogiMind</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month_label" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <Tooltip formatter={(v: number) => [`${(v * 100).toFixed(2)}%`, 'Comissão Média']} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="media_comissao_aplicada" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Repasses */}
          <TabsContent value="payouts">
            <PendingPayoutsTable />
          </TabsContent>

          {/* Tab: Detalhamento */}
          <TabsContent value="breakdown" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Últimas Transações</CardTitle>
                <CardDescription>10 pedidos mais recentes com detalhes financeiros</CardDescription>
              </CardHeader>
              <CardContent>
                {recentOrders.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-medium text-muted-foreground">Código</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Transportadora</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Valor Total</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Comissão</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Repasse</th>
                          <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                          <th className="text-center p-3 font-medium text-muted-foreground">Pagamento</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map(order => (
                          <tr key={order.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-mono font-medium text-primary">{order.tracking_code}</td>
                            <td className="p-3">{order.carrier_name}</td>
                            <td className="p-3 text-right font-semibold">{fmt(order.final_price || 0)}</td>
                            <td className="p-3 text-right text-secondary font-medium">{fmt(order.comissao_logimarket_val || 0)}</td>
                            <td className="p-3 text-right text-accent font-medium">{fmt(order.valor_repasse_liquido || 0)}</td>
                            <td className="p-3 text-center">
                              <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="text-xs">
                                {order.status === 'delivered' ? 'Entregue' : 
                                 order.status === 'in_transit' ? 'Em Trânsito' :
                                 order.status === 'confirmed' ? 'Confirmado' : order.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              <Badge 
                                variant="outline"
                                className={`text-xs ${
                                  order.status_pagamento === 'PAGO' || order.status_pagamento === 'REPASSE_CONCLUIDO'
                                    ? 'border-secondary text-secondary'
                                    : 'border-accent text-accent'
                                }`}
                              >
                                {order.status_pagamento === 'PAGO' ? 'Pago' :
                                 order.status_pagamento === 'REPASSE_CONCLUIDO' ? 'Repassado' :
                                 order.status_pagamento || 'Pendente'}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground text-sm">
                              {new Date(order.created_at).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma transação encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo Financeiro */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Resumo Consolidado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-secondary" /> Entradas
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GMV Total:</span>
                        <span className="font-bold">{fmt(summary.total_gmv)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pedidos Pagos:</span>
                        <span className="font-bold">{summary.paid_count}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4 text-destructive" /> Saídas
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Repassado:</span>
                        <span className="font-bold">{fmt(summary.total_payout)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rep. Pendentes:</span>
                        <span className="font-bold text-destructive">{fmt(summary.pending_payout_value)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" /> Resultado
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lucro Bruto (Comissões):</span>
                        <span className="font-bold text-secondary">{fmt(summary.total_commission)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Pedidos:</span>
                        <span className="font-bold">{summary.total_orders}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminFinancial;
