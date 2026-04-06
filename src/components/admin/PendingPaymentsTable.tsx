import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  CheckCircle, 
  X, 
  ExternalLink, 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  Clock, 
  AlertTriangle,
  Filter,
  CreditCard,
  Loader2
} from "lucide-react";
import { formatarMoeda } from "@/lib/formatters";

interface PendingPayment {
  id: string;
  tracking_code: string;
  final_price: number;
  created_at: string;
  payment_method: string;
  operational_notes: string;
  origin_address: string;
  destination_address: string;
  carrier_name: string;
}

export const PendingPaymentsTable = () => {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [viewingProof, setViewingProof] = useState<{ url: string; type: 'pdf' | 'image' } | null>(null);
  const [carrierFilter, setCarrierFilter] = useState<string>("all");

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status_pagamento", "AGUARDANDO_PIX")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      console.error("Error fetching pending payments:", error);
      toast.error("Erro ao carregar pagamentos pendentes");
    } finally {
      setLoading(false);
    }
  };

  // Lista única de transportadoras para filtro
  const uniqueCarriers = useMemo(() => {
    const carriers = [...new Set(payments.map(p => p.carrier_name))].filter(Boolean);
    return carriers.sort();
  }, [payments]);

  // Pagamentos filtrados
  const filteredPayments = useMemo(() => {
    if (carrierFilter === "all") return payments;
    return payments.filter(p => p.carrier_name === carrierFilter);
  }, [payments, carrierFilter]);

  // Verificar atraso > 2 horas
  const isDelayed = (createdAt: string): boolean => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffHours > 2;
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;

    setConfirming(true);
    setConfirmingId(selectedPayment.id);
    try {
      const { error } = await supabase.functions.invoke("confirm-pix-payment", {
        body: {
          order_id: selectedPayment.id,
          admin_notes: adminNotes,
        },
      });

      if (error) throw error;

      // Adicionar aos confirmados
      setConfirmedIds(prev => new Set([...prev, selectedPayment.id]));
      
      toast.success("💰 Pagamento PIX Confirmado!", {
        description: `Pedido ${selectedPayment.tracking_code} — R$ ${selectedPayment.final_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} validado com sucesso.`,
        duration: 6000,
        style: { background: 'hsl(142, 76%, 36%)', color: 'white', border: 'none' },
      });
      setSelectedPayment(null);
      setAdminNotes("");
      
      // Delay para mostrar animação de sucesso
      setTimeout(() => {
        fetchPendingPayments();
      }, 1500);
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      toast.error("❌ Falha na Confirmação", {
        description: error?.message || "Não foi possível confirmar o pagamento. Tente novamente.",
        duration: 6000,
        style: { background: 'hsl(0, 84%, 60%)', color: 'white', border: 'none' },
      });
    } finally {
      setConfirming(false);
      setConfirmingId(null);
    }
  };

  // Extrai URL do comprovante
  const extractProofUrl = (notes: string): string | null => {
    const match = notes?.match(/Comprovante PIX: (https?:\/\/[^\s]+)/);
    if (!match) return null;
    return match[1];
  };

  // Detectar tipo de arquivo
  const getFileType = (url: string): 'pdf' | 'image' => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith('.pdf')) return 'pdf';
    return 'image';
  };

  // Abrir visualizador inline
  const handleViewProof = (url: string) => {
    const type = getFileType(url);
    setViewingProof({ url, type });
  };

  // Formatar rota de forma compacta
  const formatRoute = (origin: string, destination: string) => {
    const extractCity = (address: string) => {
      const parts = address.split(',').map(p => p.trim());
      // Tentar encontrar cidade/UF
      const cityPart = parts.find(p => /\s*-\s*[A-Z]{2}$/.test(p)) || parts[parts.length - 2] || parts[0];
      return cityPart?.replace(/\s*-\s*([A-Z]{2})$/, '/$1') || address.substring(0, 20);
    };
    
    return {
      short: `${extractCity(origin)} → ${extractCity(destination)}`,
      full: `${origin} → ${destination}`
    };
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Carregando pagamentos pendentes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle>Pagamentos PIX Pendentes de Confirmação</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Verifique os comprovantes e confirme os pagamentos recebidos
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
              {filteredPayments.length} pendentes
            </Badge>
          </div>
          
          {/* Filtro por Transportadora */}
          {uniqueCarriers.length > 0 && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtrar:</span>
              <Select value={carrierFilter} onValueChange={setCarrierFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Todas as transportadoras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as transportadoras</SelectItem>
                  {uniqueCarriers.map(carrier => (
                    <SelectItem key={carrier} value={carrier}>
                      {carrier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {carrierFilter !== "all" && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCarrierFilter("all")}
                  className="text-xs"
                >
                  Limpar filtro
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum pagamento aguardando confirmação</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Transportadora</TableHead>
                  <TableHead>Rota</TableHead>
                  <TableHead>Data Pedido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Comprovante</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const proofUrl = extractProofUrl(payment.operational_notes);
                  const route = formatRoute(payment.origin_address, payment.destination_address);
                  const delayed = isDelayed(payment.created_at);
                  const isConfirmed = confirmedIds.has(payment.id);
                  const isConfirmingThis = confirmingId === payment.id;
                  
                  return (
                    <TableRow 
                      key={payment.id} 
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {payment.tracking_code}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-primary tabular-nums">
                          {formatarMoeda(payment.final_price)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{payment.carrier_name}</span>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <span className="text-xs cursor-help hover:text-primary transition-colors truncate block">
                              {route.short}
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80 text-xs">
                            <p className="font-medium mb-1">Rota completa:</p>
                            <p className="text-muted-foreground">{route.full}</p>
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">
                            {new Date(payment.created_at).toLocaleDateString("pt-BR")}
                          </span>
                          {delayed && (
                            <div className="flex items-center gap-0.5 text-destructive" title="Aguardando há mais de 2 horas">
                              <Clock className="h-3.5 w-3.5 animate-pulse" />
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {proofUrl ? (
                          <Badge className="bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200">
                            <FileText className="h-3 w-3 mr-1" />
                            Enviado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                            <Clock className="h-3 w-3 mr-1" />
                            Aguardando
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {proofUrl ? (
                          <div className="flex gap-1">
                            <HoverCard openDelay={200}>
                              <HoverCardTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewProof(proofUrl)}
                                  className="gap-1 text-xs h-7"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Ver
                                </Button>
                              </HoverCardTrigger>
                              <HoverCardContent side="left" className="w-64 p-2">
                                {getFileType(proofUrl) === 'image' ? (
                                  <img 
                                    src={proofUrl} 
                                    alt="Preview" 
                                    className="w-full h-auto rounded shadow-sm"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-32 bg-muted rounded">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                    <span className="ml-2 text-sm text-muted-foreground">Arquivo PDF</span>
                                  </div>
                                )}
                              </HoverCardContent>
                            </HoverCard>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(proofUrl, "_blank")}
                              className="h-7 w-7"
                              title="Abrir em nova aba"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isConfirmed ? (
                          <Button
                            size="sm"
                            disabled
                            className="bg-emerald-600 hover:bg-emerald-600 cursor-default gap-1 h-8"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Confirmado
                          </Button>
                        ) : (
                          <Button
                            onClick={() => setSelectedPayment(payment)}
                            disabled={!proofUrl || isConfirmingThis}
                            size="sm"
                            className="bg-primary hover:bg-primary/90 gap-1 h-8"
                          >
                            {isConfirmingThis ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Confirmando...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Confirmar
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Visualização do Comprovante */}
      <Dialog open={!!viewingProof} onOpenChange={() => setViewingProof(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingProof?.type === 'pdf' ? (
                <FileText className="w-5 h-5 text-primary" />
              ) : (
                <ImageIcon className="w-5 h-5 text-primary" />
              )}
              Comprovante de Pagamento PIX
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center min-h-[400px] max-h-[70vh] overflow-auto bg-muted/30 rounded-lg p-4">
            {viewingProof?.type === 'pdf' ? (
              <iframe
                src={viewingProof.url}
                className="w-full h-[60vh] border rounded-lg shadow-sm"
                title="Comprovante PIX PDF"
              />
            ) : (
              <img
                src={viewingProof?.url}
                alt="Comprovante PIX"
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  toast.error("Erro ao carregar imagem do comprovante");
                }}
              />
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => window.open(viewingProof?.url, "_blank")}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir em Nova Aba
            </Button>
            <Button onClick={() => setViewingProof(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Confirmar Pagamento PIX
            </DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Pedido</p>
                  <p className="font-mono font-semibold">{selectedPayment.tracking_code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Valor</p>
                  <p className="font-bold text-primary text-lg">
                    {formatarMoeda(selectedPayment.final_price)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Transportadora</p>
                  <p className="font-medium">{selectedPayment.carrier_name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-notes">Observações (opcional)</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ex: Pagamento verificado em extrato bancário, valor conferido..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800 mb-1">Atenção:</p>
                    <p className="text-amber-700">
                      Confirme que o valor foi recebido na conta PIX antes de aprovar. 
                      Esta ação atualizará o status para "Confirmado" e permitirá iniciar a operação.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPayment(null)}>
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={confirming}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirmar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
