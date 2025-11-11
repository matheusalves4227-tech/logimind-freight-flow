import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, FileText, AlertCircle, CheckCircle, Wallet, Truck, TrendingUp, Clock } from 'lucide-react';
import { DriverApprovalModal } from '@/components/admin/DriverApprovalModal';
import { useToast } from '@/hooks/use-toast';

interface PendingDriver {
  id: string;
  full_name: string;
  cpf: string;
  phone: string;
  email: string;
  status: string;
  created_at: string;
  vehicles?: Array<{
    license_plate: string;
    vehicle_type: string;
  }>;
}

interface ApprovedDriver {
  id: string;
  full_name: string;
  cpf: string;
  phone: string;
  email: string;
  status: string;
  pix_key: string | null;
  bank_name: string | null;
  approved_at: string;
  vehicles?: Array<{
    license_plate: string;
    vehicle_type: string;
  }>;
}

const AdminDrivers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([]);
  const [approvedDrivers, setApprovedDrivers] = useState<ApprovedDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<PendingDriver | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [verifiedDocs, setVerifiedDocs] = useState(0);
  const [approvedWithPix, setApprovedWithPix] = useState(0);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [avgBidsPerDay, setAvgBidsPerDay] = useState(0);

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
      fetchPendingDrivers();
    } catch (error) {
      console.error('Erro ao verificar acesso admin:', error);
      navigate('/');
    }
  };

  const fetchPendingDrivers = async () => {
    try {
      // Buscar motoristas pendentes
      const { data: drivers, error } = await supabase
        .from('driver_profiles')
        .select(`
          id,
          full_name,
          cpf,
          phone,
          email,
          status,
          created_at,
          vehicles:driver_vehicles(license_plate, vehicle_type)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setPendingDrivers(drivers || []);
      
      // Buscar motoristas aprovados
      const { data: approvedData, error: approvedError } = await supabase
        .from('driver_profiles')
        .select(`
          id,
          full_name,
          cpf,
          phone,
          email,
          status,
          pix_key,
          bank_name,
          approved_at,
          vehicles:driver_vehicles(license_plate, vehicle_type)
        `)
        .eq('status', 'approved')
        .order('approved_at', { ascending: false });

      if (approvedError) throw approvedError;
      setApprovedDrivers(approvedData || []);
      
      // Buscar total de motoristas aprovados
      const { count: totalCount } = await supabase
        .from('driver_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved');
      
      setTotalDrivers(totalCount || 0);

      // Buscar aprovados com PIX
      const { count: pixCount } = await supabase
        .from('driver_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')
        .not('pix_key', 'is', null);
      
      setApprovedWithPix(pixCount || 0);

      // Buscar total de veículos
      const { count: vehiclesCount } = await supabase
        .from('driver_vehicles')
        .select('driver_profile_id', { count: 'exact', head: true })
        .in('driver_profile_id', approvedData?.map(d => d.id) || []);
      
      setTotalVehicles(vehiclesCount || 0);

      // Calcular média de lances por dia (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: bidsCount } = await supabase
        .from('driver_bids')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());
      
      setAvgBidsPerDay(bidsCount ? Math.round(bidsCount / 7) : 0);

      // Buscar total de documentos verificados
      const { count: docsCount } = await supabase
        .from('driver_documents')
        .select('id', { count: 'exact', head: true })
        .eq('is_verified', true);
      
      setVerifiedDocs(docsCount || 0);
      
    } catch (error) {
      console.error('Erro ao buscar dados de motoristas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados de motoristas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = (driver: PendingDriver) => {
    setSelectedDriver(driver);
    setModalOpen(true);
  };

  const handleApprovalComplete = () => {
    setModalOpen(false);
    setSelectedDriver(null);
    fetchPendingDrivers(); // Recarregar lista
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
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Gestão de Motoristas</h1>
          </div>
          <p className="text-muted-foreground">
            Painel administrativo para análise e aprovação de cadastros de motoristas
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Pendentes Análise</p>
                  <p className="text-3xl font-bold text-accent">{pendingDrivers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Motoristas</p>
                  <p className="text-3xl font-bold text-secondary">{totalDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Docs Verificados</p>
                  <p className="text-3xl font-bold text-primary">{verifiedDocs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Motoristas Pendentes */}
        <Card className="card-logimarket mb-8">
          <CardHeader>
            <CardTitle>Motoristas Pendentes de Aprovação</CardTitle>
            <CardDescription>
              Analise documentos e aprove ou rejeite cadastros de novos motoristas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingDrivers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum motorista pendente de análise</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Novos cadastros aparecerão aqui automaticamente
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF / Telefone</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Data Cadastro</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingDrivers.map((driver) => (
                      <TableRow key={driver.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{driver.full_name}</span>
                            <span className="text-xs text-muted-foreground">{driver.email}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span>{driver.cpf}</span>
                            <span className="text-muted-foreground">{driver.phone}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {driver.vehicles && driver.vehicles.length > 0 ? (
                            <div className="flex flex-col text-sm">
                              <span className="font-medium">{driver.vehicles[0].license_plate}</span>
                              <span className="text-muted-foreground">{driver.vehicles[0].vehicle_type}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sem veículo</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <span className="text-sm">
                            {new Date(driver.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </TableCell>
                        
                        <TableCell>
                          <Badge className="tag-status tag-status-atraso">
                            Pendente
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <Button
                            onClick={() => handleAnalyze(driver)}
                            className="bg-accent text-accent-foreground hover:bg-accent/90"
                          >
                            Analisar Documentos
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

        {/* Seção de Motoristas Aprovados e Ativos */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="h-7 w-7 text-secondary" />
            <h2 className="text-2xl font-bold text-foreground">Motoristas Aprovados e Ativos</h2>
          </div>

          {/* KPIs de Capacidade */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground mb-3">📊 Capacidade da Frota</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Total Aprovados</p>
                      <p className="text-3xl font-bold text-secondary">{totalDrivers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Aprovados c/ PIX</p>
                      <p className="text-3xl font-bold text-primary">{approvedWithPix}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <Truck className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Frota Total</p>
                      <p className="text-3xl font-bold text-accent">{totalVehicles}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* KPIs Operacionais */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">🟢 Visão Operacional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Média de Lances/Dia</p>
                      <p className="text-3xl font-bold text-secondary">{avgBidsPerDay}</p>
                      <p className="text-xs text-muted-foreground mt-1">Últimos 7 dias</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Docs Verificados</p>
                      <p className="text-3xl font-bold text-primary">{verifiedDocs}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total no sistema</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabela de Motoristas Aprovados */}
          <Card className="card-logimarket">
            <CardHeader>
              <CardTitle>Detalhes dos Motoristas Aprovados</CardTitle>
              <CardDescription>
                Auditoria e gestão da frota ativa LogiMarket
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvedDrivers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum motorista aprovado ainda</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Veículo Principal</TableHead>
                        <TableHead>Dados Bancários</TableHead>
                        <TableHead>Aprovado Em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedDrivers.map((driver) => (
                        <TableRow key={driver.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{driver.full_name}</span>
                              <span className="text-xs text-muted-foreground">{driver.email}</span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {driver.vehicles && driver.vehicles.length > 0 ? (
                              <div className="flex flex-col text-sm">
                                <span className="font-medium">{driver.vehicles[0].license_plate}</span>
                                <span className="text-muted-foreground capitalize">
                                  {driver.vehicles[0].vehicle_type.replace(/_/g, ' ')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Sem veículo</span>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {driver.pix_key ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-secondary" />
                                <span className="text-sm font-medium text-secondary">PIX Validado</span>
                              </div>
                            ) : driver.bank_name ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium text-primary">Conta Validada</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-accent" />
                                <span className="text-sm text-accent">Pendente</span>
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {new Date(driver.approved_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-2"
                            >
                              Ver Histórico
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                            >
                              Suspender
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
        </div>
      </main>

      {/* Modal de Aprovação */}
      {selectedDriver && (
        <DriverApprovalModal
          driver={selectedDriver}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onComplete={handleApprovalComplete}
        />
      )}
    </div>
  );
};

export default AdminDrivers;
