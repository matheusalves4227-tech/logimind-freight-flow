import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { formatarMoeda } from "@/lib/formatters";
import { format } from "date-fns";

import {
  Clock,
  RefreshCw,
  User,
  MapPin,
  AlertCircle,
  RotateCcw,
  CheckCircle,
  Phone,
  Mail,
  FileText,
  Truck,
} from "lucide-react";

interface AwaitingOrder {
  id: string;
  tracking_code: string;
  origin_address: string;
  destination_address: string;
  origin_cep: string;
  destination_cep: string;
  carrier_name: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  final_price: number;
  operational_notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  cargo_description: string | null;
  cargo_type: string | null;
  cargo_value: number | null;
  weight_kg: number;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
}

interface CustomerInfo {
  full_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  cnpj: string | null;
}

interface AwaitingDriverTableProps {
  onUpdate?: () => void;
  refreshKey?: number;
}

export const AwaitingDriverTable = ({ onUpdate, refreshKey }: AwaitingDriverTableProps) => {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [orders, setOrders] = useState<AwaitingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AwaitingOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [contactNotes, setContactNotes] = useState('');
  const [carrierDetails, setCarrierDetails] = useState<any>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel('awaiting-driver-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshKey]);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, tracking_code, origin_address, destination_address, origin_cep, destination_cep, carrier_name, driver_name, driver_phone, final_price, operational_notes, created_at, updated_at, user_id, cargo_description, cargo_type, cargo_value, weight_kg, length_cm, width_cm, height_cm')
        .in('status', ['confirmed', 'awaiting_driver_acceptance'])
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (order: AwaitingOrder) => {
    setSelectedOrder(order);
    setContactNotes(order.operational_notes || '');
    setCarrierDetails(null);
    setCustomerInfo(null);
    setDetailOpen(true);

    // Buscar dados do cliente (expedidor)
    if (order.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone, company_name, cnpj')
        .eq('user_id', order.user_id)
        .maybeSingle();

      if (profile) setCustomerInfo(profile as CustomerInfo);
    }

    // Buscar dados da transportadora
    if (order.carrier_name) {
      const { data: carrier } = await supabase
        .from('carriers')
        .select('id, name, contact_name, contact_phone, contact_email, contact_whatsapp')
        .eq('name', order.carrier_name)
        .single();

      if (carrier) setCarrierDetails(carrier);
    }
  };

  const handleConfirmAccepted = async () => {
    if (!selectedOrder) return;
    setProcessing(selectedOrder.id);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'in_transit',
          operational_notes: contactNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      await logAction({
        action: 'order_confirmed_in_transit',
        metadata: {
          order_id: selectedOrder.id,
          tracking_code: selectedOrder.tracking_code,
          carrier_name: selectedOrder.carrier_name,
        },
      });

      toast({
        title: '🚚 Frete Em Trânsito!',
        description: `Pedido ${selectedOrder.tracking_code} confirmado pela transportadora. Status: Em Trânsito.`,
      });

      setDetailOpen(false);
      loadOrders();
      onUpdate?.();
    } catch (error) {
      console.error('Erro:', error);
      toast({ title: 'Erro', description: 'Erro ao confirmar pedido', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;
    setProcessing(selectedOrder.id);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          operational_notes: contactNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({
        title: '💾 Notas Salvas',
        description: 'Registros de contato atualizados com sucesso.',
      });

      loadOrders();
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar notas', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const handleRevokeAssignment = async () => {
    if (!selectedOrder) return;
    setProcessing(selectedOrder.id);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'pending',
          driver_id: null,
          driver_name: null,
          driver_phone: null,
          operational_notes: `${contactNotes}\n\n--- Revogado em ${format(new Date(), "dd/MM/yyyy HH:mm")} ---`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      await logAction({
        action: 'order_revoked',
        metadata: {
          order_id: selectedOrder.id,
          tracking_code: selectedOrder.tracking_code,
        },
      });

      toast({
        title: '↩️ Pedido Revogado',
        description: `Pedido ${selectedOrder.tracking_code} voltou para pendentes.`,
      });

      setDetailOpen(false);
      loadOrders();
      onUpdate?.();
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao revogar', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const getTimeSinceAssignment = (updatedAt: string) => {
    const now = new Date();
    const updated = new Date(updatedAt);
    const diffMs = now.getTime() - updated.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) return `${diffHours}h ${diffMins}min`;
    return `${diffMins}min`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Carregando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-accent" />
            Aguardando Confirmação da Transportadora
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Nenhum frete aguardando confirmação no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-accent" />
            Aguardando Confirmação da Transportadora
            <Badge variant="outline" className="ml-2 bg-accent/10 text-accent">
              {orders.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Transportadora</TableHead>
                <TableHead>Rota</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Aguardando há</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const waitTime = getTimeSinceAssignment(order.updated_at);
                const waitHours = parseInt(waitTime.split('h')[0]) || 0;
                const isLongWait = waitHours >= 2;

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-medium">
                      {order.tracking_code}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{order.carrier_name || 'N/A'}</div>
                      {order.driver_name && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {order.driver_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">
                          {order.origin_address.split(',')[0]} → {order.destination_address.split(',')[0]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatarMoeda(order.final_price)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={isLongWait ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-accent/10 text-accent border-accent/30"}
                      >
                        {isLongWait && <AlertCircle className="h-3 w-3 mr-1" />}
                        {waitTime}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetail(order)}
                        className="gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Gerenciar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Gerenciamento */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Gerenciar Pedido — {selectedOrder?.tracking_code}
            </DialogTitle>
            <DialogDescription>
              Entre em contato com a transportadora e registre o andamento
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-5 py-2">
              {/* Resumo do Pedido */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-muted/50 border">
                <div>
                  <p className="text-xs text-muted-foreground">Transportadora</p>
                  <p className="font-semibold">{selectedOrder.carrier_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-semibold text-primary">{formatarMoeda(selectedOrder.final_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Origem</p>
                  <p className="text-sm">{selectedOrder.origin_address.split(',')[0]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Destino</p>
                  <p className="text-sm">{selectedOrder.destination_address.split(',')[0]}</p>
                </div>
                {selectedOrder.driver_name && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Motorista Atribuído</p>
                    <p className="text-sm font-medium">{selectedOrder.driver_name} — {selectedOrder.driver_phone}</p>
                  </div>
                )}
              </div>

              {/* Dados do Cliente (Expedidor) */}
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Dados do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customerInfo ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Nome</p>
                          <p className="font-medium text-sm">{customerInfo.full_name}</p>
                        </div>
                        {customerInfo.company_name && (
                          <div>
                            <p className="text-xs text-muted-foreground">Empresa</p>
                            <p className="font-medium text-sm">{customerInfo.company_name}</p>
                          </div>
                        )}
                        {customerInfo.cnpj && (
                          <div>
                            <p className="text-xs text-muted-foreground">CNPJ</p>
                            <p className="font-medium text-sm">{customerInfo.cnpj}</p>
                          </div>
                        )}
                        {customerInfo.email && (
                          <div>
                            <p className="text-xs text-muted-foreground">E-mail</p>
                            <p className="font-medium text-sm break-all">{customerInfo.email}</p>
                          </div>
                        )}
                        {customerInfo.phone && (
                          <div>
                            <p className="text-xs text-muted-foreground">Telefone</p>
                            <p className="font-medium text-sm">{customerInfo.phone}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {customerInfo.phone && (
                          <Button variant="default" size="sm" className="gap-2" asChild>
                            <a href={`tel:${customerInfo.phone}`}>
                              <Phone className="h-4 w-4" />
                              Ligar
                            </a>
                          </Button>
                        )}
                        {customerInfo.phone && (
                          <Button variant="secondary" size="sm" className="gap-2" asChild>
                            <a
                              href={`https://wa.me/${customerInfo.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              WhatsApp
                            </a>
                          </Button>
                        )}
                        {customerInfo.email && (
                          <Button variant="outline" size="sm" className="gap-2" asChild>
                            <a href={`mailto:${customerInfo.email}`}>
                              <Mail className="h-4 w-4" />
                              E-mail
                            </a>
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Carregando dados do cliente…</p>
                  )}
                </CardContent>
              </Card>

              {/* Detalhes da Carga */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Detalhes da Carga
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Descrição</p>
                      <p className="text-sm">{selectedOrder.cargo_description || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="text-sm">{selectedOrder.cargo_type || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor declarado</p>
                      <p className="text-sm font-medium">
                        {selectedOrder.cargo_value != null ? formatarMoeda(selectedOrder.cargo_value) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Peso</p>
                      <p className="text-sm">{selectedOrder.weight_kg} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Dimensões (C×L×A)</p>
                      <p className="text-sm">
                        {selectedOrder.length_cm && selectedOrder.width_cm && selectedOrder.height_cm
                          ? `${selectedOrder.length_cm}×${selectedOrder.width_cm}×${selectedOrder.height_cm} cm`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contato da Transportadora */}
              {carrierDetails && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      Contato da Transportadora
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {carrierDetails.contact_name && (
                        <div>
                          <p className="text-xs text-muted-foreground">Responsável</p>
                          <p className="font-medium text-sm">{carrierDetails.contact_name}</p>
                        </div>
                      )}
                      {carrierDetails.contact_phone && (
                        <div>
                          <p className="text-xs text-muted-foreground">Telefone</p>
                          <p className="font-medium text-sm">{carrierDetails.contact_phone}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {carrierDetails.contact_phone && (
                        <Button variant="default" size="sm" className="gap-2" asChild>
                          <a href={`tel:${carrierDetails.contact_phone}`}>
                            <Phone className="h-4 w-4" />
                            Ligar
                          </a>
                        </Button>
                      )}
                      {carrierDetails.contact_whatsapp && (
                        <Button variant="secondary" size="sm" className="gap-2" asChild>
                          <a
                            href={`https://wa.me/${carrierDetails.contact_whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            WhatsApp
                          </a>
                        </Button>
                      )}
                      {carrierDetails.contact_email && (
                        <Button variant="outline" size="sm" className="gap-2" asChild>
                          <a href={`mailto:${carrierDetails.contact_email}`}>
                            <Mail className="h-4 w-4" />
                            Email
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notas de Contato */}
              <div className="space-y-2">
                <Label htmlFor="contact-notes">Notas de Contato com a Transportadora</Label>
                <Textarea
                  id="contact-notes"
                  placeholder="Registre aqui: data/hora do contato, pessoa que atendeu, confirmação de disponibilidade, previsão de coleta..."
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              <Separator />

              {/* Ações */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSaveNotes}
                  disabled={processing === selectedOrder.id}
                  variant="secondary"
                  className="gap-2 flex-1 min-w-[150px]"
                >
                  <FileText className="h-4 w-4" />
                  Salvar Notas
                </Button>

                <Button
                  onClick={handleConfirmAccepted}
                  disabled={processing === selectedOrder.id}
                  className="gap-2 flex-1 min-w-[150px] bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle className="h-4 w-4" />
                  Confirmar — Em Trânsito
                </Button>

                <Button
                  onClick={handleRevokeAssignment}
                  disabled={processing === selectedOrder.id}
                  variant="destructive"
                  className="gap-2 flex-1 min-w-[150px]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Revogar / Recusado
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                💡 "Confirmar" move para Em Trânsito • "Revogar" volta para Pendentes
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
