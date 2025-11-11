import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, FileText, AlertCircle } from 'lucide-react';
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

const AdminDrivers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<PendingDriver | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
    } catch (error) {
      console.error('Erro ao buscar motoristas pendentes:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar motoristas pendentes',
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
                  <p className="text-3xl font-bold text-secondary">-</p>
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
                  <p className="text-3xl font-bold text-primary">-</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Motoristas Pendentes */}
        <Card className="card-logimarket">
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
