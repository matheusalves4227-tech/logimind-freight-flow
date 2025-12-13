import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Search, Activity, Users, Shield, TrendingUp, Code, Eye } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, subDays, startOfDay, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  Tooltip as RechartsTooltip,
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

interface GroupedLogs {
  dateLabel: string;
  logs: AuditLog[];
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
  const [userIdFilter, setUserIdFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, actionFilter, searchQuery, userIdFilter]);

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

    if (userIdFilter) {
      filtered = filtered.filter(log =>
        log.user_id.toLowerCase().includes(userIdFilter.toLowerCase())
      );
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

  // Action color coding based on type
  const getActionColor = (action: string): string => {
    const greenActions = ["login", "create", "approval", "confirmation", "signup"];
    const blueActions = ["update", "change", "access"];
    const redActions = ["delete", "deletion", "fail", "rejection", "error"];

    const actionLower = action.toLowerCase();
    
    if (greenActions.some(a => actionLower.includes(a))) return "text-green-600 bg-green-50 border-green-200";
    if (redActions.some(a => actionLower.includes(a))) return "text-red-600 bg-red-50 border-red-200";
    if (blueActions.some(a => actionLower.includes(a))) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-muted-foreground bg-muted border-border";
  };

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("deletion") || actionLower.includes("rejection") || actionLower.includes("fail")) return "destructive";
    if (actionLower.includes("approval") || actionLower.includes("confirmation") || actionLower.includes("create") || actionLower.includes("login")) return "default";
    if (actionLower.includes("update") || actionLower.includes("access")) return "secondary";
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
      login: "Login",
      logout: "Logout",
      signup: "Cadastro",
      create: "Criação",
      update: "Atualização",
      delete: "Exclusão",
    };
    return labels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format relative time with tooltip for full date
  const formatRelativeTime = (dateString: string) => {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  const formatFullDate = (dateString: string) => {
    return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  };

  // Group logs by date
  const groupedLogs = useMemo((): GroupedLogs[] => {
    const groups: Map<string, AuditLog[]> = new Map();
    
    filteredLogs.forEach(log => {
      const date = parseISO(log.created_at);
      let dateLabel: string;
      
      if (isToday(date)) {
        dateLabel = "Hoje";
      } else if (isYesterday(date)) {
        dateLabel = "Ontem";
      } else {
        dateLabel = format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      }
      
      const existing = groups.get(dateLabel) || [];
      existing.push(log);
      groups.set(dateLabel, existing);
    });
    
    return Array.from(groups.entries()).map(([dateLabel, logs]) => ({
      dateLabel,
      logs,
    }));
  }, [filteredLogs]);

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

  const handleOpenJsonModal = (log: AuditLog, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLog(log);
    setShowJsonModal(true);
  };

  const handleOpenDetailsModal = (log: AuditLog) => {
    setSelectedLog(log);
    setShowJsonModal(false);
  };

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
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Logs de Auditoria | LogiMarket Admin</title>
        </Helmet>
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
            <Card className="rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Ações</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{logs.length}</div>
                <p className="text-xs text-muted-foreground">Últimos 500 registros</p>
              </CardContent>
            </Card>

            <Card className="rounded-lg">
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

            <Card className="rounded-lg">
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

            <Card className="rounded-lg">
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
            <Card className="rounded-lg">
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
                    <RechartsTooltip />
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
            <Card className="rounded-lg">
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
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Usuários */}
            <Card className="rounded-lg">
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
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(var(--secondary))" name="Ações" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Ações Críticas Recentes */}
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Ações Críticas Recentes</CardTitle>
                <CardDescription>Últimas 10 ações que requerem atenção</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {getCriticalActions().map((log) => (
                    <div 
                      key={log.id} 
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" 
                      onClick={() => handleOpenDetailsModal(log)}
                    >
                      <div className="flex-1">
                        <Badge variant="destructive" className="mb-1">
                          {getActionLabel(log.action)}
                        </Badge>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-xs text-muted-foreground cursor-help">
                              {formatRelativeTime(log.created_at)}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            {formatFullDate(log.created_at)}
                          </TooltipContent>
                        </Tooltip>
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

          {/* Investigation Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Busca geral..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por ID do Usuário..."
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                className="pl-10 font-mono text-sm"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo de Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                <SelectItem value="account_deletion">🔴 Exclusão de Conta</SelectItem>
                <SelectItem value="profile_update">🔵 Atualização de Perfil</SelectItem>
                <SelectItem value="password_change">🔵 Alteração de Senha</SelectItem>
                <SelectItem value="data_export">🔵 Exportação de Dados</SelectItem>
                <SelectItem value="admin_access">🟢 Acesso Admin</SelectItem>
                <SelectItem value="driver_approval">🟢 Aprovação de Motorista</SelectItem>
                <SelectItem value="driver_rejection">🔴 Rejeição de Motorista</SelectItem>
                <SelectItem value="freight_assignment">🟢 Atribuição de Frete</SelectItem>
                <SelectItem value="delivery_confirmation">🟢 Confirmação de Entrega</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setUserIdFilter("");
                setActionFilter("all");
              }}
            >
              Limpar Filtros
            </Button>
          </div>

          {/* Grouped Logs Table */}
          {groupedLogs.map((group, groupIndex) => (
            <div key={group.dateLabel} className="mb-6">
              {/* Date Group Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-sm font-semibold text-muted-foreground px-3 py-1 bg-muted rounded-full">
                  {group.dateLabel} ({group.logs.length})
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[140px]">
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1">
                            🕐 Hora
                          </TooltipTrigger>
                          <TooltipContent>Data e hora da ação</TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="w-[180px]">
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1">
                            ⚡ Ação
                          </TooltipTrigger>
                          <TooltipContent>Tipo de ação executada</TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="w-[200px]">
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1">
                            👤 Usuário ID
                          </TooltipTrigger>
                          <TooltipContent>Identificador único do usuário</TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="w-[130px]">
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1">
                            🌐 IP
                          </TooltipTrigger>
                          <TooltipContent>Endereço IP de origem</TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="w-[120px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.logs.map((log, index) => (
                      <TableRow 
                        key={log.id} 
                        className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                        }`}
                        onClick={() => handleOpenDetailsModal(log)}
                        style={{
                          animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
                        }}
                      >
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm text-muted-foreground cursor-help">
                                {formatRelativeTime(log.created_at)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-mono text-xs">
                              {formatFullDate(log.created_at)}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${getActionColor(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <code className="font-mono text-xs bg-muted px-2 py-1 rounded select-all">
                            {log.user_id.substring(0, 12)}...
                          </code>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.ip_address || "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => handleOpenJsonModal(log, e)}
                                >
                                  <Code className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver JSON/Payload</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDetailsModal(log);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver Detalhes</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum log encontrado</p>
              <p className="text-sm">Tente ajustar os filtros de busca</p>
            </div>
          )}

          <div className="mt-4 text-sm text-muted-foreground">
            Exibindo {filteredLogs.length} de {logs.length} registros
          </div>
        </div>

        {/* Details Modal */}
        <Dialog open={!!selectedLog && !showJsonModal} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Detalhes do Log de Auditoria
              </DialogTitle>
              <DialogDescription>
                Informações completas sobre a ação registrada
              </DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ação</label>
                    <div className="mt-1">
                      <Badge variant={getActionBadgeVariant(selectedLog.action)} className="text-sm">
                        {getActionLabel(selectedLog.action)}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data/Hora</label>
                    <p className="font-mono text-sm mt-1">{formatFullDate(selectedLog.created_at)}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(selectedLog.created_at)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Usuário ID</label>
                  <code className="block font-mono text-sm mt-1 bg-muted p-2 rounded select-all">{selectedLog.user_id}</code>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endereço IP</label>
                    <code className="block font-mono text-sm mt-1">{selectedLog.ip_address || "N/A"}</code>
                  </div>

                  {selectedLog.reason && (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Motivo</label>
                      <p className="text-sm mt-1">{selectedLog.reason}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User Agent</label>
                  <p className="text-xs mt-1 break-all text-muted-foreground bg-muted p-2 rounded">
                    {selectedLog.user_agent || "N/A"}
                  </p>
                </div>

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Metadados</label>
                    <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto font-mono">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* JSON Modal */}
        <Dialog open={showJsonModal} onOpenChange={() => setShowJsonModal(false)}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Payload JSON
              </DialogTitle>
              <DialogDescription>
                Dados completos da alteração em formato JSON
              </DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                    {getActionLabel(selectedLog.action)}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatFullDate(selectedLog.created_at)}
                  </span>
                </div>
                
                <div className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-auto max-h-[50vh]">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify({
                      id: selectedLog.id,
                      action: selectedLog.action,
                      user_id: selectedLog.user_id,
                      ip_address: selectedLog.ip_address,
                      user_agent: selectedLog.user_agent,
                      reason: selectedLog.reason,
                      metadata: selectedLog.metadata,
                      created_at: selectedLog.created_at,
                    }, null, 2)}
                  </pre>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
                    toast({
                      title: "Copiado!",
                      description: "JSON copiado para a área de transferência",
                    });
                  }}
                >
                  <Code className="h-4 w-4 mr-2" />
                  Copiar JSON
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </TooltipProvider>
  );
};

export default AdminAuditLogs;
