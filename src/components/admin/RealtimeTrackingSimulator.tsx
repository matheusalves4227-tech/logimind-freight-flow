import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapPin, Radio, Loader2 } from 'lucide-react';

export const RealtimeTrackingSimulator = () => {
  const [orderId, setOrderId] = useState('');
  const [updateType, setUpdateType] = useState<'location' | 'event'>('location');
  const [loading, setLoading] = useState(false);

  // Campos para atualização de localização
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Campos para novo evento
  const [eventCode, setEventCode] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isCritical, setIsCritical] = useState(false);

  const handleSimulate = async () => {
    if (!orderId) {
      toast.error('Informe o ID do pedido');
      return;
    }

    if (updateType === 'location') {
      if (!latitude || !longitude) {
        toast.error('Informe latitude e longitude');
        return;
      }
    } else {
      if (!eventCode || !eventDescription) {
        toast.error('Informe código e descrição do evento');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        order_id: orderId,
        type: updateType,
        ...(updateType === 'location' && {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        }),
        ...(updateType === 'event' && {
          event_code: eventCode,
          event_description: eventDescription,
          city: city || undefined,
          state: state || undefined,
          is_critical: isCritical
        })
      };

      const { data, error } = await supabase.functions.invoke(
        'simulate-tracking-update',
        { body: payload }
      );

      if (error) throw error;

      toast.success('Atualização simulada com sucesso!', {
        description: updateType === 'location' 
          ? 'Localização atualizada em tempo real' 
          : 'Novo evento de tracking criado'
      });

      // Limpar campos
      if (updateType === 'event') {
        setEventCode('');
        setEventDescription('');
        setCity('');
        setState('');
        setIsCritical(false);
      }
    } catch (error) {
      console.error('Erro ao simular:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao simular atualização', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para gerar localização aleatória próxima (simulação de movimento)
  const generateRandomNearbyLocation = () => {
    if (!latitude || !longitude) {
      toast.error('Defina uma localização base primeiro');
      return;
    }

    const baseLat = parseFloat(latitude);
    const baseLng = parseFloat(longitude);
    
    // Movimento de ~1-5km (0.01 a 0.05 graus de variação)
    const latOffset = (Math.random() - 0.5) * 0.05;
    const lngOffset = (Math.random() - 0.5) * 0.05;

    setLatitude((baseLat + latOffset).toFixed(6));
    setLongitude((baseLng + lngOffset).toFixed(6));

    toast.info('Nova localização gerada', {
      description: 'Simula movimento do veículo'
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Radio className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Simulador de Tracking em Tempo Real</h3>
      </div>

      <div className="space-y-4">
        {/* ID do Pedido */}
        <div>
          <Label htmlFor="orderId">ID do Pedido (UUID)</Label>
          <Input
            id="orderId"
            placeholder="ex: 123e4567-e89b-12d3-a456-426614174000"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
        </div>

        {/* Tipo de Atualização */}
        <div>
          <Label htmlFor="updateType">Tipo de Atualização</Label>
          <Select value={updateType} onValueChange={(value: 'location' | 'event') => setUpdateType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="location">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Atualizar Localização
                </div>
              </SelectItem>
              <SelectItem value="event">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  Criar Novo Evento
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campos específicos para LOCALIZAÇÃO */}
        {updateType === 'location' && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  placeholder="-23.550520"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  placeholder="-46.633308"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateRandomNearbyLocation}
              className="w-full"
            >
              Gerar Localização Próxima (Simular Movimento)
            </Button>
          </div>
        )}

        {/* Campos específicos para EVENTO */}
        {updateType === 'event' && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div>
              <Label htmlFor="eventCode">Código do Evento</Label>
              <Select value={eventCode} onValueChange={setEventCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um código" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PICKED_UP">PICKED_UP - Coletado</SelectItem>
                  <SelectItem value="IN_TRANSIT">IN_TRANSIT - Em Trânsito</SelectItem>
                  <SelectItem value="AT_SORTING_CENTER">AT_SORTING_CENTER - Centro de Triagem</SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY - Saiu para Entrega</SelectItem>
                  <SelectItem value="DELIVERED">DELIVERED - Entregue</SelectItem>
                  <SelectItem value="DELAY">DELAY - Atraso</SelectItem>
                  <SelectItem value="EXCEPTION">EXCEPTION - Exceção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="eventDescription">Descrição Amigável</Label>
              <Textarea
                id="eventDescription"
                placeholder="Pedido coletado no endereço de origem"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Cidade (opcional)</Label>
                <Input
                  id="city"
                  placeholder="São Paulo"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="state">Estado (opcional)</Label>
                <Input
                  id="state"
                  placeholder="SP"
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="isCritical" className="cursor-pointer">Evento Crítico?</Label>
                <p className="text-xs text-muted-foreground">Atraso ou problema</p>
              </div>
              <Switch
                id="isCritical"
                checked={isCritical}
                onCheckedChange={setIsCritical}
              />
            </div>
          </div>
        )}

        {/* Botão Simular */}
        <Button 
          onClick={handleSimulate} 
          disabled={loading}
          className="w-full"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Simular Atualização em Tempo Real
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          As atualizações serão enviadas via Realtime para todos os clientes conectados
        </p>
      </div>
    </Card>
  );
};
