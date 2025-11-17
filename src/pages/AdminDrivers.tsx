import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Users, FileText, AlertCircle, CheckCircle, Wallet, Truck, TrendingUp, Clock, Package, Download, History, Ban } from 'lucide-react';
import { DriverApprovalModal } from '@/components/admin/DriverApprovalModal';
import { PaymentTestPanel } from '@/components/admin/PaymentTestPanel';
import { FinancialKPIs } from '@/components/admin/FinancialKPIs';
import { PendingPayoutsTable } from '@/components/admin/PendingPayoutsTable';
import { DriverFilters } from '@/components/admin/DriverFilters';
import { BulkDriverActions } from '@/components/admin/BulkDriverActions';
import { AdminDriverHistory } from '@/components/admin/AdminDriverHistory';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

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
  const { logAction } = useAuditLog();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([]);
  const [approvedDrivers, setApprovedDrivers] = useState<ApprovedDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<PendingDriver | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedApprovedDriver, setSelectedApprovedDriver] = useState<ApprovedDriver | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [driverToSuspend, setDriverToSuspend] = useState<ApprovedDriver | null>(null);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [verifiedDocs, setVerifiedDocs] = useState(0);
  const [approvedWithPix, setApprovedWithPix] = useState(0);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [avgBidsPerDay, setAvgBidsPerDay] = useState(0);
  
  // Filtros avançados
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState<Date | undefined>(undefined);
  const [dateToFilter, setDateToFilter] = useState<Date | undefined>(undefined);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Seleção múltipla
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);

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
          page: "admin_drivers",
          accessed_at: new Date().toISOString(),
        }
      });
      
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
    setSelectedDriverIds([]);
    fetchPendingDrivers(); // Recarregar lista
  };

  const handleViewHistory = (driver: ApprovedDriver) => {
    setSelectedApprovedDriver(driver);
    setProfileModalOpen(true);
  };

  const handleSuspendClick = (driver: ApprovedDriver) => {
    setDriverToSuspend(driver);
    setSuspendDialogOpen(true);
  };

  const handleSuspendConfirm = async () => {
    if (!driverToSuspend) return;

    try {
      const { error } = await supabase
        .from('driver_profiles')
        .update({ status: 'suspended' })
        .eq('id', driverToSuspend.id);

      if (error) throw error;

      // Registrar ação de auditoria
      await logAction({
        action: 'driver_rejection',
        reason: 'Motorista suspenso pelo administrador',
        metadata: {
          driver_id: driverToSuspend.id,
          driver_name: driverToSuspend.full_name,
          previous_status: driverToSuspend.status,
        },
      });

      toast({
        title: 'Motorista Suspenso',
        description: `${driverToSuspend.full_name} foi suspenso com sucesso`,
      });

      setSuspendDialogOpen(false);
      setDriverToSuspend(null);
      fetchPendingDrivers(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao suspender motorista:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível suspender o motorista',
        variant: 'destructive',
      });
    }
  };

  // Filtrar motoristas baseado nos filtros
  const filteredDrivers = useMemo(() => {
    let filtered = [...pendingDrivers];

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    // Filtro de região/estado
    if (regionFilter !== 'all') {
      filtered = filtered.filter(d => 
        d.vehicles?.some(v => v.vehicle_type?.includes(regionFilter))
      );
    }

    // Filtro de data (de)
    if (dateFromFilter) {
      filtered = filtered.filter(d => 
        new Date(d.created_at) >= dateFromFilter
      );
    }

    // Filtro de data (até)
    if (dateToFilter) {
      const endOfDay = new Date(dateToFilter);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(d => 
        new Date(d.created_at) <= endOfDay
      );
    }

    // Filtro de busca por nome/CPF
    if (searchFilter.trim()) {
      const search = searchFilter.toLowerCase();
      filtered = filtered.filter(d => 
        d.full_name.toLowerCase().includes(search) ||
        d.cpf.includes(search)
      );
    }

    return filtered;
  }, [pendingDrivers, statusFilter, regionFilter, dateFromFilter, dateToFilter, searchFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (regionFilter !== 'all') count++;
    if (dateFromFilter) count++;
    if (dateToFilter) count++;
    if (searchFilter.trim()) count++;
    return count;
  }, [statusFilter, regionFilter, dateFromFilter, dateToFilter, searchFilter]);

  const handleClearFilters = () => {
    setStatusFilter('all');
    setRegionFilter('all');
    setDateFromFilter(undefined);
    setDateToFilter(undefined);
    setSearchFilter('');
  };

  const handleToggleDriver = (driverId: string) => {
    setSelectedDriverIds(prev => 
      prev.includes(driverId) 
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  const handleToggleAll = () => {
    if (selectedDriverIds.length === filteredDrivers.length) {
      setSelectedDriverIds([]);
    } else {
      setSelectedDriverIds(filteredDrivers.map(d => d.id));
    }
  };

  const handleExportToExcel = () => {
    try {
      const exportData = filteredDrivers.map(driver => ({
        'Nome': driver.full_name,
        'CPF': driver.cpf,
        'Telefone': driver.phone,
        'Email': driver.email,
        'Status': driver.status === 'pending' ? 'Pendente' : 
                  driver.status === 'approved' ? 'Aprovado' : 
                  driver.status === 'rejected' ? 'Rejeitado' : 'Suspenso',
        'Data de Cadastro': new Date(driver.created_at).toLocaleDateString('pt-BR'),
        'Veículos': driver.vehicles?.map(v => `${v.vehicle_type} - ${v.license_plate}`).join(', ') || 'Nenhum',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Motoristas');

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 30 }, // Nome
        { wch: 15 }, // CPF
        { wch: 15 }, // Telefone
        { wch: 30 }, // Email
        { wch: 12 }, // Status
        { wch: 15 }, // Data
        { wch: 40 }, // Veículos
      ];
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `motoristas_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: 'Exportação Concluída',
        description: `${filteredDrivers.length} motorista(s) exportado(s) para Excel com sucesso`,
      });

      logAction({
        action: 'data_export',
        metadata: {
          export_type: 'drivers',
          record_count: filteredDrivers.length,
          filters_applied: activeFiltersCount,
        },
      });
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      toast({
        title: 'Erro na Exportação',
        description: 'Não foi possível exportar os dados para Excel',
        variant: 'destructive',
      });
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">Gestão de Motoristas</h1>
              </div>
              <p className="text-muted-foreground">
                Painel administrativo para análise e aprovação de cadastros de motoristas
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleExportToExcel}
                variant="outline"
                className="gap-2"
                disabled={filteredDrivers.length === 0}
              >
                <Download className="h-4 w-4" />
                Exportar Excel
              </Button>
              <Button
                onClick={() => navigate('/admin/pedidos')}
                variant="outline"
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                Ver Pedidos
              </Button>
            </div>
          </div>
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

        {/* Filtros Avançados */}
        <DriverFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          regionFilter={regionFilter}
          setRegionFilter={setRegionFilter}
          dateFromFilter={dateFromFilter}
          setDateFromFilter={setDateFromFilter}
          dateToFilter={dateToFilter}
          setDateToFilter={setDateToFilter}
          searchFilter={searchFilter}
          setSearchFilter={setSearchFilter}
          onClearFilters={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
        />

        {/* Ações em Lote */}
        <BulkDriverActions
          selectedDriverIds={selectedDriverIds}
          onActionComplete={handleApprovalComplete}
          onClearSelection={() => setSelectedDriverIds([])}
        />

        {/* KPIs Financeiros */}
        <FinancialKPIs />

        {/* Fila de Repasses Pendentes */}
        <PendingPayoutsTable />

        {/* Painel de Teste de Repasse Financeiro */}
        <PaymentTestPanel />

        {/* Tabela de Motoristas */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-accent" />
                  Motoristas ({filteredDrivers.length})
                </CardTitle>
                <CardDescription>
                  {activeFiltersCount > 0 
                    ? `Exibindo ${filteredDrivers.length} de ${pendingDrivers.length} motorista(s) com filtros aplicados`
                    : 'Analise os documentos e aprove ou rejeite os cadastros de motoristas'
                  }
                </CardDescription>
              </div>
              {filteredDrivers.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedDriverIds.length === filteredDrivers.length && filteredDrivers.length > 0}
                    onCheckedChange={handleToggleAll}
                  />
                  <span className="text-sm text-muted-foreground">Selecionar todos</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredDrivers.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-secondary mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {activeFiltersCount > 0 
                    ? 'Nenhum motorista encontrado com os filtros aplicados'
                    : 'Não há motoristas para exibir no momento'
                  }
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedDriverIds.length === filteredDrivers.length}
                          onCheckedChange={handleToggleAll}
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Cadastro</TableHead>
                      <TableHead>Veículo(s)</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrivers.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedDriverIds.includes(driver.id)}
                            onCheckedChange={() => handleToggleDriver(driver.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{driver.full_name}</TableCell>
                        <TableCell className="font-mono text-sm">{driver.cpf}</TableCell>
                        <TableCell>{driver.phone}</TableCell>
                        <TableCell className="text-sm">{driver.email}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              driver.status === 'pending' ? 'secondary' :
                              driver.status === 'approved' ? 'default' :
                              'destructive'
                            }
                          >
                            {driver.status === 'pending' ? 'Pendente' :
                             driver.status === 'approved' ? 'Aprovado' :
                             driver.status === 'rejected' ? 'Rejeitado' : 'Suspenso'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(driver.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {driver.vehicles && driver.vehicles.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {driver.vehicles.map((vehicle, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {vehicle.vehicle_type} - {vehicle.license_plate}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Nenhum veículo</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleAnalyze(driver)}
                            className="gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Analisar
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
                              onClick={() => handleViewHistory(driver)}
                            >
                              <History className="h-4 w-4 mr-1" />
                              Ver Histórico
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleSuspendClick(driver)}
                            >
                              <Ban className="h-4 w-4 mr-1" />
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

      {/* Modal de Histórico/Perfil */}
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico do Motorista</DialogTitle>
            <DialogDescription>
              Informações completas e histórico de atividades
            </DialogDescription>
          </DialogHeader>
          {selectedApprovedDriver && (
            <AdminDriverHistory 
              driverId={selectedApprovedDriver.id}
              driverName={selectedApprovedDriver.full_name}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Suspensão */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Suspensão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja suspender o motorista <strong>{driverToSuspend?.full_name}</strong>?
              <br /><br />
              Esta ação irá impedir que o motorista acesse o sistema e aceite novos fretes.
              A ação será registrada nos logs de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspendConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sim, Suspender
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDrivers;
