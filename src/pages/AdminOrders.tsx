import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Package, AlertCircle, Clock, TrendingUp, Truck, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PendingQuotesTable } from '@/components/admin/PendingQuotesTable';
import { PendingOrdersTable } from '@/components/admin/PendingOrdersTable';
import { LogiMindKPIs } from '@/components/admin/LogiMindKPIs';
import { CarriersManagement } from '@/components/admin/CarriersManagement';

interface StatsData {
  pendingQuotes: number;
  pendingOrders: number;
  totalOrders: number;
  avgResponseTime: number;
}

const AdminOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

      // Contar pedidos pendentes de motorista (status pending ou sem driver_id)
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .or('status.eq.pending,driver_id.is.null');

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
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Gestão de Pedidos e Cotações</h1>
            </div>
            <Button 
              onClick={() => navigate('/admin/calculadora-b2b')}
              className="gap-2"
            >
              <Calculator className="h-4 w-4" />
              Calculadora B2B
            </Button>
          </div>
          <p className="text-muted-foreground">
            Painel de operação manual - Intermediação entre clientes e transportadoras parceiras
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Cotações Pendentes</p>
                  <p className="text-3xl font-bold text-accent">{stats.pendingQuotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Pendentes de Contato</p>
            <p className="text-3xl font-bold text-destructive">{stats.pendingOrders}</p>
          </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total de Pedidos</p>
                  <p className="text-3xl font-bold text-primary">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Taxa Conversão</p>
                  <p className="text-3xl font-bold text-secondary">
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
          <TabsList className="grid w-full grid-cols-4 max-w-3xl">
            <TabsTrigger value="carriers" className="gap-2">
              <Truck className="h-4 w-4" />
              Transportadoras
            </TabsTrigger>
            <TabsTrigger value="kpis" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              KPIs LogiMind
            </TabsTrigger>
            <TabsTrigger value="quotes" className="gap-2">
              <FileText className="h-4 w-4" />
              Cotações
              {stats.pendingQuotes > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {stats.pendingQuotes}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Pedidos
              {stats.pendingOrders > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {stats.pendingOrders}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="carriers">
            <CarriersManagement />
          </TabsContent>

          <TabsContent value="kpis">
            <LogiMindKPIs />
          </TabsContent>

          <TabsContent value="quotes">
            <PendingQuotesTable onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="orders">
            <PendingOrdersTable onUpdate={fetchStats} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminOrders;
