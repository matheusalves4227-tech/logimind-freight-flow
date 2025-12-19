import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatarMoeda } from "@/lib/formatters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Weight,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DriverPendingFreightsProps {
  driverProfile: any;
  onFreightAccepted?: () => void;
}

interface PendingFreight {
  id: string;
  tracking_code: string;
  origin_address: string;
  origin_cep: string;
  destination_address: string;
  destination_cep: string;
  weight_kg: number;
  service_type: string;
  final_price: number;
  valor_repasse_liquido: number | null;
  status: string;
  created_at: string;
  estimated_delivery: string | null;
  carrier_name: string;
}

export const DriverPendingFreights = ({ driverProfile, onFreightAccepted }: DriverPendingFreightsProps) => {
  const { toast } = useToast();
  const [pendingFreights, setPendingFreights] = useState<PendingFreight[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedFreight, setSelectedFreight] = useState<PendingFreight | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (driverProfile?.id) {
      loadPendingFreights();
      
      // Realtime subscription para novos fretes
      const channel = supabase
        .channel('driver-pending-freights')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `driver_id=eq.${driverProfile.id}`,
          },
          () => {
            loadPendingFreights();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [driverProfile?.id]);

  const loadPendingFreights = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', driverProfile.id)
        .eq('status', 'awaiting_driver_acceptance')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingFreights(data || []);
    } catch (error) {
      console.error('Erro ao carregar fretes pendentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptFreight = async (freight: PendingFreight) => {
    setProcessing(freight.id);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', freight.id);

      if (error) throw error;

      toast({
        title: "Frete Aceito!",
        description: `Você aceitou o frete ${freight.tracking_code}. Bom trabalho!`,
      });

      loadPendingFreights();
      onFreightAccepted?.();
    } catch (error) {
      console.error('Erro ao aceitar frete:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aceitar o frete. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectFreight = async () => {
    if (!selectedFreight || !rejectReason.trim()) {
      toast({
        title: "Motivo Obrigatório",
        description: "Por favor, informe o motivo da recusa.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(selectedFreight.id);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'pending',
          driver_id: null,
          driver_name: null,
          driver_phone: null,
          operational_notes: `RECUSADO PELO MOTORISTA: ${rejectReason}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedFreight.id);

      if (error) throw error;

      // Notificar admin sobre a recusa
      try {
        await supabase.functions.invoke('notify-admin-rejection', {
          body: {
            orderId: selectedFreight.id,
            trackingCode: selectedFreight.tracking_code,
            driverName: driverProfile.full_name,
            driverEmail: driverProfile.email,
            rejectReason: rejectReason,
            originAddress: selectedFreight.origin_address,
            destinationAddress: selectedFreight.destination_address,
            valorRepasse: selectedFreight.valor_repasse_liquido || selectedFreight.final_price * 0.85,
          },
        });
        console.log('Admin notificado sobre recusa');
      } catch (notifyError) {
        console.error('Erro ao notificar admin:', notifyError);
      }

      toast({
        title: "Frete Recusado",
        description: "O frete foi devolvido para reatribuição. Admin foi notificado.",
      });

      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedFreight(null);
      loadPendingFreights();
    } catch (error) {
      console.error('Erro ao recusar frete:', error);
      toast({
        title: "Erro",
        description: "Não foi possível recusar o frete. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const openRejectDialog = (freight: PendingFreight) => {
    setSelectedFreight(freight);
    setRejectDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Carregando fretes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingFreights.length === 0) {
    return null; // Não mostrar nada se não houver fretes pendentes
  }

  return (
    <div className="space-y-4">
      {/* Header com alerta */}
      <Card className="border-2 border-accent bg-gradient-to-r from-accent/10 to-accent/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center animate-pulse">
              <AlertTriangle className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-accent">
                {pendingFreights.length} Frete{pendingFreights.length > 1 ? 's' : ''} Aguardando Seu Aceite!
              </h3>
              <p className="text-sm text-muted-foreground">
                Aceite ou recuse os fretes abaixo para continuar
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de fretes pendentes */}
      {pendingFreights.map((freight) => (
        <Card key={freight.id} className="border-2 border-primary/30 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-mono">{freight.tracking_code}</CardTitle>
                  <Badge variant="outline" className="mt-1">
                    {freight.service_type || 'LTL'}
                  </Badge>
                </div>
              </div>
              <Badge className="bg-accent/10 text-accent border-accent/30">
                <Clock className="h-3 w-3 mr-1" />
                Aguardando Aceite
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Rota */}
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
                <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Origem</p>
                  <p className="text-sm font-medium">{freight.origin_address}</p>
                  <p className="text-xs text-muted-foreground">CEP: {freight.origin_cep}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-secondary/5 rounded-lg">
                <MapPin className="h-4 w-4 text-secondary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Destino</p>
                  <p className="text-sm font-medium">{freight.destination_address}</p>
                  <p className="text-xs text-muted-foreground">CEP: {freight.destination_cep}</p>
                </div>
              </div>
            </div>

            {/* Informações da carga */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <Weight className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Peso</p>
                <p className="font-bold">{freight.weight_kg} kg</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Solicitado em</p>
                <p className="font-bold text-sm">
                  {format(new Date(freight.created_at), "dd/MM", { locale: ptBR })}
                </p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <Package className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Transportadora</p>
                <p className="font-bold text-sm truncate">{freight.carrier_name}</p>
              </div>
            </div>

            {/* Valor do repasse - DESTAQUE */}
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Seu Repasse</p>
                  <p className="text-3xl font-extrabold text-green-600">
                    {formatarMoeda(freight.valor_repasse_liquido || freight.final_price * 0.85)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Valor líquido após comissão</p>
                </div>
                <DollarSign className="h-12 w-12 text-green-500/30" />
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => openRejectDialog(freight)}
                disabled={processing === freight.id}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Recusar
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleAcceptFreight(freight)}
                disabled={processing === freight.id}
              >
                {processing === freight.id ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Aceitar Frete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Dialog de recusa */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Recusar Frete
            </DialogTitle>
            <DialogDescription>
              Informe o motivo da recusa. O frete será devolvido para a central reatribuí-lo a outro motorista.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium mb-2">Frete: {selectedFreight?.tracking_code}</p>
              <p className="text-sm text-muted-foreground">
                {selectedFreight?.origin_address} → {selectedFreight?.destination_address}
              </p>
            </div>

            <Textarea
              placeholder="Ex: Não consigo atender a região, veículo em manutenção, conflito de agenda..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectFreight}
              disabled={!rejectReason.trim() || processing === selectedFreight?.id}
            >
              {processing === selectedFreight?.id ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
