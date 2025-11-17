import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Search } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

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
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
