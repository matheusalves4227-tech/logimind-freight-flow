import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Search, Activity, Users, Shield, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  reason: string | null;
  metadata: any;
  created_at: string;
}

const AdminAuditLogs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, actionFilter, searchQuery]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Acesso negado",
          description: "Você precisa estar logado para acessar esta página",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        toast({
          title: "Acesso negado",
          description: "Apenas administradores podem acessar logs de auditoria",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchLogs();
    } catch (error) {
      console.error("Erro ao verificar acesso admin:", error);
      navigate("/");
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os logs de auditoria",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (actionFilter !== "all") {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(log =>
        log.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ip_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.reason?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("deletion") || action.includes("rejection")) return "destructive";
    if (action.includes("approval") || action.includes("confirmation")) return "default";
    if (action.includes("access")) return "secondary";
    return "outline";
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      account_deletion: "Exclusão de Conta",
      profile_update: "Atualização de Perfil",
      password_change: "Alteração de Senha",
      data_export: "Exportação de Dados",
      admin_access: "Acesso Admin",
      driver_approval: "Aprovação de Motorista",
      driver_rejection: "Rejeição de Motorista",
      freight_assignment: "Atribuição de Frete",
      delivery_confirmation: "Confirmação de Entrega",
    };
    return labels[action] || action;
  };

  // Métricas do Dashboard
  const getActionMetrics = () => {
    const actionCounts: Record<string, number> = {};
    logs.forEach(log => {
      const label = getActionLabel(log.action);
      actionCounts[label] = (actionCounts[label] || 0) + 1;
    });
    return Object.entries(actionCounts).map(([name, value]) => ({ name, value }));
  };

  const getTimelineData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, "dd/MM"),
        fullDate: startOfDay(date),
        count: 0,
      };
    });

    logs.forEach(log => {
      const logDate = startOfDay(new Date(log.created_at));
      const dayData = last7Days.find(day => 
        day.fullDate.getTime() === logDate.getTime()
      );
      if (dayData) {
        dayData.count++;
      }
    });

    return last7Days.map(({ date, count }) => ({ date, count }));
  };

  const getTopUsers = () => {
    const userCounts: Record<string, number> = {};
    logs.forEach(log => {
      userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
    });
    
    return Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => ({
        userId: userId.substring(0, 8) + "...",
        count,
      }));
  };

  const getCriticalActions = () => {
    const critical = ["account_deletion", "driver_rejection", "admin_access"];
    return logs.filter(log => critical.includes(log.action)).slice(0, 10);
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24 max-w-7xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/admin/pedidos")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Admin
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Logs de Auditoria</h1>
          <p className="text-lg text-muted-foreground">
            Registro completo de todas as ações críticas da plataforma
          </p>
        </div>

        {/* KPIs de Auditoria */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Ações</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs.length}</div>
              <p className="text-xs text-muted-foreground">Últimos 500 registros</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ações Hoje</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {logs.filter(log => 
                  new Date(log.created_at).toDateString() === new Date().toDateString()
                ).length}
              </div>
              <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(logs.map(log => log.user_id)).size}
              </div>
              <p className="text-xs text-muted-foreground">Usuários únicos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ações Críticas</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getCriticalActions().length}
              </div>
              <p className="text-xs text-muted-foreground">Requerem atenção</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Timeline de Atividades */}
          <Card>
            <CardHeader>
              <CardTitle>Atividades nos Últimos 7 Dias</CardTitle>
              <CardDescription>Volume de ações diárias</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getTimelineData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Ações"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuição por Tipo de Ação */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Ações</CardTitle>
              <CardDescription>Tipos de ações mais frequentes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getActionMetrics()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getActionMetrics().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Usuários */}
          <Card>
            <CardHeader>
              <CardTitle>Usuários Mais Ativos</CardTitle>
              <CardDescription>Top 5 usuários com mais ações</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getTopUsers()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="userId" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="hsl(var(--secondary))" name="Ações" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Ações Críticas Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Críticas Recentes</CardTitle>
              <CardDescription>Últimas 10 ações que requerem atenção</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {getCriticalActions().map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedLog(log)}>
                    <div className="flex-1">
                      <Badge variant="destructive" className="mb-1">
                        {getActionLabel(log.action)}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {log.user_id.substring(0, 8)}...
                    </div>
                  </div>
                ))}
                {getCriticalActions().length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma ação crítica recente
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Histórico Completo</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuário, IP, ação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Ações</SelectItem>
              <SelectItem value="account_deletion">Exclusão de Conta</SelectItem>
              <SelectItem value="profile_update">Atualização de Perfil</SelectItem>
              <SelectItem value="password_change">Alteração de Senha</SelectItem>
              <SelectItem value="data_export">Exportação de Dados</SelectItem>
              <SelectItem value="admin_access">Acesso Admin</SelectItem>
              <SelectItem value="driver_approval">Aprovação de Motorista</SelectItem>
              <SelectItem value="driver_rejection">Rejeição de Motorista</SelectItem>
              <SelectItem value="freight_assignment">Atribuição de Frete</SelectItem>
              <SelectItem value="delivery_confirmation">Confirmação de Entrega</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Usuário ID</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLog(log)}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.user_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.ip_address || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Exibindo {filteredLogs.length} de {logs.length} registros
        </div>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
            <DialogDescription>
              Informações completas sobre a ação registrada
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Ação</label>
                <p className="text-lg font-medium">{getActionLabel(selectedLog.action)}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">Data/Hora</label>
                <p className="font-mono">{format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss")}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">Usuário ID</label>
                <p className="font-mono text-sm">{selectedLog.user_id}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">Endereço IP</label>
                <p className="font-mono">{selectedLog.ip_address || "N/A"}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">User Agent</label>
                <p className="text-sm break-all">{selectedLog.user_agent || "N/A"}</p>
              </div>

              {selectedLog.reason && (
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Motivo</label>
                  <p>{selectedLog.reason}</p>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Metadados</label>
                  <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAuditLogs;
