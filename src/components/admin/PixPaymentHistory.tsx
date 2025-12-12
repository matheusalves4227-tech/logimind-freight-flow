import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter, 
  Download, 
  Eye, 
  ExternalLink,
  FileSpreadsheet,
  Calendar,
  Building2
} from "lucide-react";
import { formatarMoeda } from "@/lib/formatters";

interface PixPayment {
  id: string;
  tracking_code: string;
  final_price: number;
  created_at: string;
  paid_at: string | null;
  status_pagamento: string;
  carrier_name: string;
  carrier_id: string | null;
  origin_address: string;
  destination_address: string;
  operational_notes: string | null;
}

interface Carrier {
  id: string;
  name: string;
  contact_phone?: string;
}

type StatusFilter = "all" | "PAGO" | "AGUARDANDO_PIX" | "CANCELADO";

export const PixPaymentHistory = () => {
  const [payments, setPayments] = useState<PixPayment[]>([]);
  const [carriers, setCarriers] = useState<Record<string, Carrier>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<{ url: string; code: string } | null>(null);

  useEffect(() => {
    fetchPayments();
    fetchCarriers();
  }, [statusFilter, startDate, endDate]);

  const fetchCarriers = async () => {
    try {
      const { data } = await supabase
        .from("carriers")
        .select("id, name, contact_phone");
      
      if (data) {
        const carriersMap: Record<string, Carrier> = {};
        data.forEach(c => {
          carriersMap[c.id] = c;
        });
        setCarriers(carriersMap);
      }
    } catch (error) {
      console.error("Error fetching carriers:", error);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select("*")
        .eq("payment_method", "PIX")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status_pagamento", statusFilter);
      } else {
        query = query.in("status_pagamento", ["PAGO", "AGUARDANDO_PIX", "CANCELADO"]);
      }

      if (startDate) {
        query = query.gte("created_at", `${startDate}T00:00:00`);
      }

      if (endDate) {
        query = query.lte("created_at", `${endDate}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      toast.error("Erro ao carregar histórico de pagamentos");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAGO":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            Confirmado
          </Badge>
        );
      case "AGUARDANDO_PIX":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Aguardando
          </Badge>
        );
      case "CANCELADO":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const exportToCSV = () => {
    const headers = ["Código", "Valor", "Status", "Transportadora", "CNPJ", "Rota", "Data Pedido", "Data Confirmação"];
    const rows = payments.map((p) => [
      p.tracking_code,
      p.final_price.toFixed(2).replace(".", ","),
      p.status_pagamento,
      p.carrier_name,
      p.carrier_id && carriers[p.carrier_id] ? "CNPJ Disponível" : "-",
      `${p.origin_address} -> ${p.destination_address}`,
      new Date(p.created_at).toLocaleDateString("pt-BR"),
      p.paid_at ? new Date(p.paid_at).toLocaleString("pt-BR") : "-",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `historico-pix-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Arquivo CSV exportado com sucesso!");
  };

  const exportToExcel = () => {
    // Excel-compatible CSV with semicolon separator
    exportToCSV();
  };

  const openLightbox = (paymentCode: string) => {
    // In a real implementation, this would fetch the actual proof URL
    const mockProofUrl = `https://via.placeholder.com/800x600?text=Comprovante+PIX+${paymentCode}`;
    setSelectedProof({ url: mockProofUrl, code: paymentCode });
    setLightboxOpen(true);
  };

  const downloadProof = () => {
    if (selectedProof) {
      const link = document.createElement("a");
      link.href = selectedProof.url;
      link.download = `comprovante-pix-${selectedProof.code}.png`;
      link.click();
    }
  };

  const totals = {
    confirmed: payments.filter((p) => p.status_pagamento === "PAGO").length,
    pending: payments.filter((p) => p.status_pagamento === "AGUARDANDO_PIX").length,
    cancelled: payments.filter((p) => p.status_pagamento === "CANCELADO").length,
    totalValue: payments
      .filter((p) => p.status_pagamento === "PAGO")
      .reduce((sum, p) => sum + p.final_price, 0),
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards with Audit Identity */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Confirmados
            </div>
            <p className="text-2xl font-bold text-emerald-600 font-serif tabular-nums">{totals.confirmed}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="w-4 h-4 text-amber-500" />
              Aguardando
            </div>
            <p className="text-2xl font-bold text-amber-600 font-serif tabular-nums">{totals.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <XCircle className="w-4 h-4 text-red-500" />
              Cancelados
            </div>
            <p className="text-2xl font-bold text-red-600 font-serif tabular-nums">{totals.cancelled}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Building2 className="w-4 h-4 text-primary" />
              Total Recebido
            </div>
            <p className="text-2xl font-bold text-primary font-serif tabular-nums">{formatarMoeda(totals.totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters with Date Range */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label htmlFor="status" className="text-xs font-medium text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="PAGO">✓ Confirmados</SelectItem>
                  <SelectItem value="AGUARDANDO_PIX">⏳ Aguardando</SelectItem>
                  <SelectItem value="CANCELADO">✕ Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Data De
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[160px]"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Até
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[160px]"
              />
            </div>

            <Button variant="outline" onClick={clearFilters} size="sm">
              Limpar Filtros
            </Button>

            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={exportToCSV} size="sm" className="gap-1.5">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
              <Button variant="outline" onClick={exportToExcel} size="sm" className="gap-1.5">
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table with Audit Identity */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Histórico de Pagamentos PIX
            </span>
            <Badge variant="outline" className="font-mono">{payments.length} registros</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                Nenhum pagamento encontrado com os filtros selecionados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="font-semibold">Código</TableHead>
                    <TableHead className="font-semibold text-right">Valor (R$)</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Transportadora</TableHead>
                    <TableHead className="font-semibold">Rota</TableHead>
                    <TableHead className="font-semibold">Data Pedido</TableHead>
                    <TableHead className="font-semibold">Data Confirmação</TableHead>
                    <TableHead className="font-semibold text-center">Comprovante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow 
                      key={payment.id}
                      className={`
                        hover:bg-slate-50 transition-colors
                        ${payment.status_pagamento === "PAGO" ? "border-l-4 border-l-emerald-500" : ""}
                        ${payment.status_pagamento === "CANCELADO" ? "border-l-4 border-l-red-300 opacity-75" : ""}
                      `}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {payment.tracking_code}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-800 tabular-nums text-base">
                        {formatarMoeda(payment.final_price)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status_pagamento)}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="font-medium text-sm">{payment.carrier_name}</span>
                          <p className="text-xs text-slate-500 font-mono">
                            CNPJ: 00.000.000/0001-00
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px]">
                        <div className="truncate text-slate-600">
                          {payment.origin_address}
                        </div>
                        <div className="text-slate-400">↓</div>
                        <div className="truncate text-slate-600">
                          {payment.destination_address}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {new Date(payment.created_at).toLocaleDateString("pt-BR")}
                        <span className="block text-xs text-slate-400">
                          {new Date(payment.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {payment.paid_at ? (
                          <div className="space-y-0.5">
                            <span className="text-emerald-700 font-medium">
                              {new Date(payment.paid_at).toLocaleDateString("pt-BR")}
                            </span>
                            <span className="block text-xs text-emerald-600">
                              {new Date(payment.paid_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {payment.status_pagamento === "PAGO" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openLightbox(payment.tracking_code)}
                            className="gap-1.5 hover:bg-primary/5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox Modal for Proof Viewing */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Comprovante PIX - {selectedProof?.code}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-100 rounded-xl p-4 min-h-[400px] flex items-center justify-center">
              {selectedProof && (
                <img 
                  src={selectedProof.url} 
                  alt="Comprovante PIX" 
                  className="max-w-full max-h-[500px] rounded-lg shadow-md"
                />
              )}
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => selectedProof && window.open(selectedProof.url, "_blank")}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir em nova aba
              </Button>
              <Button onClick={downloadProof} className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF/Imagem
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};