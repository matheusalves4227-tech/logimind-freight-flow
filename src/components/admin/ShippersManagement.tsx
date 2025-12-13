import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Search, CheckCircle, XCircle, Eye, Filter, Phone, Mail, MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ShipperProfile {
  id: string;
  user_id: string;
  cnpj: string;
  razao_social: string | null;
  company_sector: string;
  monthly_freight_volume: string;
  corporate_email: string;
  responsible_name: string;
  responsible_cpf: string;
  phone: string;
  accepts_whatsapp_contact: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

const COMPANY_SECTORS = [
  "Todos",
  "Agronegócio",
  "E-commerce",
  "Indústria",
  "Varejo",
  "Distribuição",
  "Importação/Exportação",
  "Construção Civil",
  "Alimentício",
  "Farmacêutico",
  "Automotivo",
  "Outros"
];

const FREIGHT_VOLUMES = [
  { value: "all", label: "Todos os volumes" },
  { value: "1-10", label: "1 a 10 fretes/mês" },
  { value: "11-50", label: "11 a 50 fretes/mês" },
  { value: "51-200", label: "51 a 200 fretes/mês" },
  { value: "200+", label: "Mais de 200 fretes/mês" }
];

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os status" },
  { value: "pending", label: "Pendentes" },
  { value: "approved", label: "Aprovados" },
  { value: "rejected", label: "Rejeitados" }
];

export const ShippersManagement = () => {
  const [shippers, setShippers] = useState<ShipperProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState("Todos");
  const [volumeFilter, setVolumeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modal states
  const [selectedShipper, setSelectedShipper] = useState<ShipperProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [actionNotes, setActionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchShippers();
  }, []);

  const fetchShippers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("shipper_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShippers(data || []);
    } catch (error: any) {
      console.error("Error fetching shippers:", error);
      toast.error("Erro ao carregar embarcadores");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedShipper) return;
    
    setActionLoading(true);
    try {
      const newStatus = actionType === "approve" ? "approved" : "rejected";
      
      const { error } = await supabase
        .from("shipper_profiles")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedShipper.id);

      if (error) throw error;

      toast.success(
        actionType === "approve" 
          ? "Embarcador aprovado com sucesso!" 
          : "Embarcador rejeitado."
      );

      setIsActionModalOpen(false);
      setActionNotes("");
      fetchShippers();
    } catch (error: any) {
      console.error("Error updating shipper:", error);
      toast.error("Erro ao atualizar status do embarcador");
    } finally {
      setActionLoading(false);
    }
  };

  const formatCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, "");
    return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    }
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-secondary text-secondary-foreground">Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      case "pending":
      default:
        return <Badge variant="outline" className="border-amber-500 text-amber-600">Pendente</Badge>;
    }
  };

  const getVolumeBadge = (volume: string) => {
    switch (volume) {
      case "200+":
        return <Badge className="bg-primary text-primary-foreground">Alto Volume</Badge>;
      case "51-200":
        return <Badge className="bg-secondary/80 text-secondary-foreground">Médio Volume</Badge>;
      case "11-50":
        return <Badge variant="outline">Baixo Volume</Badge>;
      default:
        return <Badge variant="secondary">Iniciante</Badge>;
    }
  };

  const filteredShippers = shippers.filter((shipper) => {
    const matchesSearch = 
      shipper.responsible_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipper.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipper.cnpj.includes(searchTerm.replace(/\D/g, "")) ||
      shipper.corporate_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSector = sectorFilter === "Todos" || shipper.company_sector === sectorFilter;
    const matchesVolume = volumeFilter === "all" || shipper.monthly_freight_volume === volumeFilter;
    const matchesStatus = statusFilter === "all" || shipper.status === statusFilter;

    return matchesSearch && matchesSector && matchesVolume && matchesStatus;
  });

  const stats = {
    total: shippers.length,
    pending: shippers.filter(s => s.status === "pending").length,
    approved: shippers.filter(s => s.status === "approved").length,
    highVolume: shippers.filter(s => s.monthly_freight_volume === "200+" || s.monthly_freight_volume === "51-200").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Embarcadores</p>
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <Filter className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold text-secondary">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-secondary/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alto Volume</p>
                <p className="text-2xl font-bold text-accent">{stats.highVolume}</p>
              </div>
              <Building2 className="h-8 w-8 text-accent/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Embarcadores Cadastrados
              </CardTitle>
              <CardDescription>Gerencie empresas cadastradas na plataforma</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchShippers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ, razão social ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SECTORS.map((sector) => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={volumeFilter} onValueChange={setVolumeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Volume" />
              </SelectTrigger>
              <SelectContent>
                {FREIGHT_VOLUMES.map((vol) => (
                  <SelectItem key={vol.value} value={vol.value}>{vol.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Carregando...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredShippers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum embarcador encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShippers.map((shipper) => (
                    <TableRow key={shipper.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{shipper.razao_social || "Não informado"}</p>
                          <p className="text-xs text-muted-foreground">{formatCNPJ(shipper.cnpj)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{shipper.responsible_name}</p>
                          <p className="text-xs text-muted-foreground">{shipper.corporate_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{shipper.company_sector}</Badge>
                      </TableCell>
                      <TableCell>{getVolumeBadge(shipper.monthly_freight_volume)}</TableCell>
                      <TableCell>{getStatusBadge(shipper.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(shipper.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedShipper(shipper);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {shipper.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-secondary hover:text-secondary"
                                onClick={() => {
                                  setSelectedShipper(shipper);
                                  setActionType("approve");
                                  setIsActionModalOpen(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedShipper(shipper);
                                  setActionType("reject");
                                  setIsActionModalOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Detalhes do Embarcador
            </DialogTitle>
            <DialogDescription>
              Informações completas do cadastro
            </DialogDescription>
          </DialogHeader>

          {selectedShipper && (
            <div className="space-y-6">
              {/* Company Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Razão Social</Label>
                  <p className="font-medium">{selectedShipper.razao_social || "Não informado"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">CNPJ</Label>
                  <p className="font-medium">{formatCNPJ(selectedShipper.cnpj)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Setor</Label>
                  <p className="font-medium">{selectedShipper.company_sector}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Volume Mensal</Label>
                  <div className="mt-1">{getVolumeBadge(selectedShipper.monthly_freight_volume)}</div>
                </div>
              </div>

              {/* Responsible Info */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Dados do Responsável</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Nome</Label>
                    <p className="font-medium">{selectedShipper.responsible_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">CPF</Label>
                    <p className="font-medium">
                      {selectedShipper.responsible_cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Contato</h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${selectedShipper.corporate_email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      {selectedShipper.corporate_email}
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${selectedShipper.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      {formatPhone(selectedShipper.phone)}
                    </a>
                  </Button>
                  {selectedShipper.accepts_whatsapp_contact && (
                    <Button variant="outline" size="sm" className="text-secondary" asChild>
                      <a 
                        href={`https://wa.me/55${selectedShipper.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        WhatsApp
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="border-t pt-4 flex items-center justify-between">
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedShipper.status)}</div>
                </div>
                {selectedShipper.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="text-secondary border-secondary"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        setActionType("approve");
                        setIsActionModalOpen(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      variant="outline"
                      className="text-destructive border-destructive"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        setActionType("reject");
                        setIsActionModalOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Modal */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Aprovar Embarcador" : "Rejeitar Embarcador"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Confirme a aprovação do embarcador na plataforma."
                : "Informe o motivo da rejeição."}
            </DialogDescription>
          </DialogHeader>

          {selectedShipper && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedShipper.razao_social || selectedShipper.responsible_name}</p>
                <p className="text-sm text-muted-foreground">{formatCNPJ(selectedShipper.cnpj)}</p>
              </div>

              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={actionType === "approve" 
                    ? "Notas sobre a aprovação..." 
                    : "Motivo da rejeição..."}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading}
              className={actionType === "approve" 
                ? "bg-secondary hover:bg-secondary/90" 
                : "bg-destructive hover:bg-destructive/90"}
            >
              {actionLoading ? "Processando..." : actionType === "approve" ? "Aprovar" : "Rejeitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
