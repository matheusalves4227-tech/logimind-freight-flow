import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, X, ExternalLink } from "lucide-react";
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

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;

    setConfirming(true);
    try {
      const { error } = await supabase.functions.invoke("confirm-pix-payment", {
        body: {
          order_id: selectedPayment.id,
          admin_notes: adminNotes,
        },
      });

      if (error) throw error;

      toast.success("Pagamento confirmado com sucesso!");
      setSelectedPayment(null);
      setAdminNotes("");
      fetchPendingPayments();
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      toast.error("Erro ao confirmar pagamento");
    } finally {
      setConfirming(false);
    }
  };

  const extractProofUrl = (notes: string): string | null => {
    const match = notes?.match(/Comprovante PIX: (https?:\/\/[^\s]+)/);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Carregando pagamentos pendentes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Pagamentos PIX Pendentes de Confirmação
            <Badge variant="outline">{payments.length} pendentes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum pagamento aguardando confirmação
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Transportadora</TableHead>
                  <TableHead>Rota</TableHead>
                  <TableHead>Data Pedido</TableHead>
                  <TableHead>Comprovante</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const proofUrl = extractProofUrl(payment.operational_notes);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">
                        {payment.tracking_code}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatarMoeda(payment.final_price)}
                      </TableCell>
                      <TableCell>{payment.carrier_name}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate">
                        {payment.origin_address} → {payment.destination_address}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(payment.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        {proofUrl ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(proofUrl, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        ) : (
                          <Badge variant="secondary">Aguardando</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => setSelectedPayment(payment)}
                          disabled={!proofUrl}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirmar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento PIX</DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Pedido:</p>
                  <p className="font-mono font-semibold">{selectedPayment.tracking_code}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor:</p>
                  <p className="font-semibold text-primary">
                    {formatarMoeda(selectedPayment.final_price)}
                  </p>
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
                />
              </div>

              <div className="bg-muted p-3 rounded text-sm">
                <p className="font-semibold mb-1">⚠️ Atenção:</p>
                <p>
                  Confirme que o valor foi recebido na conta PIX antes de aprovar. Esta ação
                  atualizará o status do pedido para "Confirmado" e permitirá iniciar a operação.
                </p>
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
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              {confirming ? "Confirmando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
