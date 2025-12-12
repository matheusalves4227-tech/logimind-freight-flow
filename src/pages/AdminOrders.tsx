import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Package, AlertCircle, Clock, TrendingUp, Truck, Calculator, CheckCircle, XCircle, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PendingQuotesTable } from '@/components/admin/PendingQuotesTable';
import { PendingOrdersTable } from '@/components/admin/PendingOrdersTable';
import { AcceptedOrdersTable } from '@/components/admin/AcceptedOrdersTable';
import { RejectedOrdersTable } from '@/components/admin/RejectedOrdersTable';
import { LogiMindKPIs } from '@/components/admin/LogiMindKPIs';
import { CarriersManagement } from '@/components/admin/CarriersManagement';
import { PendingPaymentsTable } from '@/components/admin/PendingPaymentsTable';
import { PixPaymentHistory } from '@/components/admin/PixPaymentHistory';

interface StatsData {
  pendingQuotes: number;
  pendingOrders: number;
  totalOrders: number;
  avgResponseTime: number;
}

const AdminOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<StatsData>({
    pendingQuotes: 0,
    pendingOrders: 0,
    totalOrders: 0,
    avgResponseTime: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Verificar se usuário é admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      if (roleError || !roleData) {
        toast({
          title: 'Acesso Negado',
          description: 'Você não tem permissão para acessar esta área',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      
      // Registrar acesso administrativo
      await logAction({
        action: "admin_access",
        metadata: {
          page: "admin_orders",
          accessed_at: new Date().toISOString(),
        }
      });
      
      await fetchStats();
    } catch (error) {
      console.error('Erro ao verificar acesso admin:', error);
      navigate('/');
    }
  };

  const fetchStats = async () => {
    try {
      // Contar cotações pendentes (sem order criada)
      const { count: quotesCount } = await supabase
        .from('quotes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Contar pedidos pendentes (status pending)
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Total de pedidos
      const { count: totalCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true });

      setStats({
        pendingQuotes: quotesCount || 0,
        pendingOrders: ordersCount || 0,
        totalOrders: totalCount || 0,
        avgResponseTime: 0, // Calcular depois se necessário
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar estatísticas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Gestão de Pedidos e Cotações</h1>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => navigate('/admin/auditoria')}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Logs de Auditoria
              </Button>
              <Button 
                onClick={() => navigate('/admin/calculadora-b2b')}
                className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-primary-foreground shadow-lg"
              >
                <Calculator className="h-4 w-4" />
                Calculadora B2B
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">
            Painel de operação manual - Intermediação entre clientes e transportadoras parceiras
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-md border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Cotações Pendentes</p>
                  <p className="text-3xl font-semibold text-amber-600 font-serif tracking-tight">{stats.pendingQuotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-destructive hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Pendentes de Contato</p>
                  <p className="text-3xl font-semibold text-destructive font-serif tracking-tight">{stats.pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-primary hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total de Pedidos</p>
                  <p className="text-3xl font-semibold text-primary font-serif tracking-tight">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Taxa Conversão</p>
                  <p className="text-3xl font-semibold text-emerald-600 font-serif tracking-tight">
                    {stats.pendingQuotes > 0 
                      ? Math.round((stats.totalOrders / (stats.totalOrders + stats.pendingQuotes)) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="carriers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 max-w-7xl bg-muted/50 p-1 rounded-lg">
            <TabsTrigger 
              value="carriers" 
              className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <Truck className="h-4 w-4" />
              Transportadoras
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="gap-2 relative data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <CheckCircle className="h-4 w-4" />
              PIX Pendentes
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                !
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="pix-history" 
              className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <History className="h-4 w-4" />
              Histórico PIX
            </TabsTrigger>
            <TabsTrigger 
              value="kpis" 
              className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <TrendingUp className="h-4 w-4" />
              KPIs LogiMind
            </TabsTrigger>
            <TabsTrigger 
              value="quotes" 
              className="gap-2 relative data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <FileText className="h-4 w-4" />
              Cotações
              {stats.pendingQuotes > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {stats.pendingQuotes}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="orders-pending" 
              className="gap-2 relative data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <AlertCircle className="h-4 w-4" />
              Pendentes
              {stats.pendingOrders > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {stats.pendingOrders}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="orders-accepted" 
              className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <CheckCircle className="h-4 w-4" />
              Aceitos
            </TabsTrigger>
            <TabsTrigger 
              value="orders-rejected" 
              className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <XCircle className="h-4 w-4" />
              Rejeitados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="carriers">
            <CarriersManagement />
          </TabsContent>

          <TabsContent value="payments">
            <PendingPaymentsTable />
          </TabsContent>

          <TabsContent value="pix-history">
            <PixPaymentHistory />
          </TabsContent>

          <TabsContent value="kpis">
            <LogiMindKPIs />
          </TabsContent>

          <TabsContent value="quotes">
            <PendingQuotesTable onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="orders-pending">
            <PendingOrdersTable onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="orders-accepted">
            <AcceptedOrdersTable onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="orders-rejected">
            <RejectedOrdersTable onUpdate={fetchStats} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminOrders;
