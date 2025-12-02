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
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Filter, Download } from "lucide-react";
import { formatarMoeda } from "@/lib/formatters";

interface PixPayment {
  id: string;
  tracking_code: string;
  final_price: number;
  created_at: string;
  paid_at: string | null;
  status_pagamento: string;
  carrier_name: string;
  origin_address: string;
  destination_address: string;
  operational_notes: string | null;
}

type StatusFilter = "all" | "PAGO" | "AGUARDANDO_PIX" | "CANCELADO";

export const PixPaymentHistory = () => {
  const [payments, setPayments] = useState<PixPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, startDate, endDate]);

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
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmado
          </Badge>
        );
      case "AGUARDANDO_PIX":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Aguardando
          </Badge>
        );
      case "CANCELADO":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
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
    const headers = ["Código", "Valor", "Status", "Transportadora", "Data Pedido", "Data Pagamento"];
    const rows = payments.map((p) => [
      p.tracking_code,
      p.final_price.toString(),
      p.status_pagamento,
      p.carrier_name,
      new Date(p.created_at).toLocaleDateString("pt-BR"),
      p.paid_at ? new Date(p.paid_at).toLocaleDateString("pt-BR") : "-",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `historico-pix-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
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
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Confirmados</p>
            <p className="text-2xl font-bold text-green-600">{totals.confirmed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Aguardando</p>
            <p className="text-2xl font-bold text-yellow-600">{totals.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Cancelados</p>
            <p className="text-2xl font-bold text-red-600">{totals.cancelled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Recebido</p>
            <p className="text-2xl font-bold text-primary">{formatarMoeda(totals.totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PAGO">Confirmados</SelectItem>
                  <SelectItem value="AGUARDANDO_PIX">Aguardando</SelectItem>
                  <SelectItem value="CANCELADO">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[160px]"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="endDate">Data Fim</Label>
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

            <Button variant="outline" onClick={exportToCSV} size="sm">
              <Download className="w-4 h-4 mr-1" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Histórico de Pagamentos PIX
            <Badge variant="outline">{payments.length} registros</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum pagamento encontrado com os filtros selecionados
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transportadora</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Data Pedido</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">
                        {payment.tracking_code}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatarMoeda(payment.final_price)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status_pagamento)}</TableCell>
                      <TableCell>{payment.carrier_name}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        {payment.origin_address} → {payment.destination_address}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(payment.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {payment.paid_at
                          ? new Date(payment.paid_at).toLocaleDateString("pt-BR")
                          : "-"}
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
  );
};
