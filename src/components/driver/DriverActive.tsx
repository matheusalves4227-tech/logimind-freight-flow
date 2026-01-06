import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Package, CheckCircle, Camera } from "lucide-react";
import { formatarMoeda } from "@/lib/formatters";
import { toast } from "sonner";
import { DeliveryPhotoUpload } from "./DeliveryPhotoUpload";

interface DriverActiveProps {
  driverProfile: any;
}

interface ActiveLoad {
  id: string;
  tracking_code: string;
  origin_address: string;
  destination_address: string;
  weight_kg: number;
  final_price: number;
  status: string;
  pickup_deadline: Date;
}

export const DriverActive = ({ driverProfile }: DriverActiveProps) => {
  const [activeLoads, setActiveLoads] = useState<ActiveLoad[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState<string | null>(null);

  useEffect(() => {
    loadActiveLoads();
  }, []);

  const loadActiveLoads = async () => {
    if (!driverProfile?.id) return;

    try {
      // Buscar ordens reais onde o motorista foi atribuído
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, tracking_code, origin_address, destination_address, weight_kg, final_price, status')
        .eq('driver_id', driverProfile.id)
        .in('status', ['aguardando_coleta', 'em_coleta', 'carga_no_veiculo', 'em_transito'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const loads: ActiveLoad[] = (orders || []).map(order => ({
        id: order.id,
        tracking_code: order.tracking_code,
        origin_address: order.origin_address,
        destination_address: order.destination_address,
        weight_kg: order.weight_kg,
        final_price: order.final_price,
        status: order.status,
        pickup_deadline: new Date(Date.now() + 6 * 60 * 60 * 1000)
      }));

      setActiveLoads(loads);
    } catch (error) {
      console.error('Erro ao carregar cargas ativas:', error);
      setActiveLoads([]);
    }
  };

  const handleNavigateToPickup = (load: ActiveLoad) => {
    // Abrir Waze ou Google Maps com o endereço de origem
    const address = encodeURIComponent(load.origin_address);
    const wazeUrl = `https://waze.com/ul?q=${address}`;
    window.open(wazeUrl, '_blank');
  };

  const handleUpdateStatus = async (
    loadId: string, 
    newStatus: string, 
    statusLabel: string, 
    photoUrl?: string,
    location?: { latitude: number; longitude: number }
  ) => {
    setLoading(true);
    
    try {
      // Preparar dados de atualização
      const updateData: { 
        status: string; 
        actual_delivery?: string;
        foto_entrega_url?: string;
        foto_entrega_timestamp?: string;
        foto_entrega_latitude?: number;
        foto_entrega_longitude?: number;
      } = { status: newStatus };
      
      // Se status for entregue, registrar data/hora da entrega e foto
      if (newStatus === 'entregue') {
        updateData.actual_delivery = new Date().toISOString();
        if (photoUrl) {
          updateData.foto_entrega_url = photoUrl;
          updateData.foto_entrega_timestamp = new Date().toISOString();
        }
        if (location) {
          updateData.foto_entrega_latitude = location.latitude;
          updateData.foto_entrega_longitude = location.longitude;
        }
      }

      // Atualizar status da ordem
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', loadId);

      if (error) throw error;

      // Inserir evento de rastreamento
      await supabase
        .from('tracking_events')
        .insert({
          order_id: loadId,
          event_code: newStatus,
          event_description: statusLabel,
          event_timestamp: new Date().toISOString()
        });

      // Se o status mudou para em_transito, notificar o embarcador
      if (newStatus === 'em_transito') {
        try {
          const { error: notifyError } = await supabase.functions.invoke('notify-shipper-transit', {
            body: { orderId: loadId }
          });
          
          if (notifyError) {
            console.error('Erro ao notificar embarcador sobre trânsito:', notifyError);
          } else {
            console.log('Embarcador notificado sobre início do trânsito');
          }
        } catch (notifyErr) {
          console.error('Falha ao chamar notify-shipper-transit:', notifyErr);
        }
      }

      // Se o status mudou para entregue, notificar o embarcador
      if (newStatus === 'entregue') {
        try {
          const { error: notifyError } = await supabase.functions.invoke('notify-shipper-delivery', {
            body: { orderId: loadId }
          });
          
          if (notifyError) {
            console.error('Erro ao notificar embarcador sobre entrega:', notifyError);
          } else {
            console.log('Embarcador notificado sobre entrega concluída');
          }
        } catch (notifyErr) {
          console.error('Falha ao chamar notify-shipper-delivery:', notifyErr);
        }
      }

      toast.success(`Status atualizado: ${statusLabel}`);
      setShowPhotoUpload(null);
      loadActiveLoads();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error("Erro ao atualizar status. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveryPhotoUploaded = (
    loadId: string, 
    photoUrl: string, 
    location?: { latitude: number; longitude: number }
  ) => {
    // Confirmar entrega com a foto e geolocalização
    handleUpdateStatus(loadId, "entregue", "Entrega Concluída com Foto", photoUrl, location);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      aguardando_coleta: { label: "Aguardando Coleta", variant: "secondary" },
      em_coleta: { label: "Em Coleta", variant: "default" },
      carga_no_veiculo: { label: "Carga no Veículo", variant: "default" },
      em_transito: { label: "Em Trânsito", variant: "default" },
      entregue: { label: "Entregue", variant: "default" }
    };

    const statusInfo = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Cargas Ativas</h2>
        <p className="text-muted-foreground">Gerencie as cargas que você está transportando</p>
      </div>

      {activeLoads.length > 0 ? (
        <div className="space-y-4">
          {activeLoads.map((load) => (
            <Card key={load.id} className="border-2 border-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{load.tracking_code}</CardTitle>
                      {getStatusBadge(load.status)}
                    </div>
                    <CardDescription className="text-xs">
                      ID: {load.id}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {formatarMoeda(load.final_price)}
                    </p>
                    <p className="text-xs text-muted-foreground">Valor da carga</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Informações da Rota */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-blue-600 mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Origem</p>
                      <p className="text-sm font-medium">{load.origin_address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Destino</p>
                      <p className="text-sm font-medium">{load.destination_address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Package className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Peso</p>
                      <p className="text-sm font-medium">{load.weight_kg} kg</p>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="space-y-2 pt-4 border-t">
                  {load.status === "aguardando_coleta" && (
                    <>
                      <Button 
                        className="w-full gap-2" 
                        variant="outline"
                        onClick={() => handleNavigateToPickup(load)}
                      >
                        <Navigation className="h-4 w-4" />
                        Navegar para Coleta (Waze)
                      </Button>
                      <Button 
                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleUpdateStatus(load.id, "carga_no_veiculo", "Carga no Veículo")}
                        disabled={loading}
                      >
                        <Package className="h-4 w-4" />
                        Confirmar: Carga no Veículo
                      </Button>
                    </>
                  )}
                  
                  {load.status === "carga_no_veiculo" && (
                    <Button 
                      className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleUpdateStatus(load.id, "em_transito", "Em Trânsito para Destino")}
                      disabled={loading}
                    >
                      <Navigation className="h-4 w-4" />
                      Iniciar Viagem
                    </Button>
                  )}
                  
                  {load.status === "em_transito" && (
                    showPhotoUpload === load.id ? (
                      <DeliveryPhotoUpload
                        orderId={load.id}
                        trackingCode={load.tracking_code}
                        onPhotoUploaded={(photoUrl, location) => handleDeliveryPhotoUploaded(load.id, photoUrl, location)}
                        onCancel={() => setShowPhotoUpload(null)}
                      />
                    ) : (
                      <Button 
                        className="w-full gap-2 bg-green-600 hover:bg-green-700"
                        onClick={() => setShowPhotoUpload(load.id)}
                        disabled={loading}
                      >
                        <Camera className="h-4 w-4" />
                        Concluir Entrega (Foto Obrigatória)
                      </Button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Você não tem cargas ativas no momento.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Quando você ganhar um lance, a carga aparecerá aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
