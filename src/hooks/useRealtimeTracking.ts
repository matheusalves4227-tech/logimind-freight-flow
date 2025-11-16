import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface TrackingEvent {
  id: string;
  order_id: string;
  event_code: string;
  event_description: string;
  event_timestamp: string;
  city: string | null;
  state: string | null;
  is_critical: boolean;
}

interface OrderLocation {
  current_latitude: number | null;
  current_longitude: number | null;
  last_location_update: string | null;
  status: string;
}

interface UseRealtimeTrackingProps {
  orderId: string | null;
  onEventUpdate?: (event: TrackingEvent) => void;
  onLocationUpdate?: (location: OrderLocation) => void;
}

export const useRealtimeTracking = ({ 
  orderId, 
  onEventUpdate, 
  onLocationUpdate 
}: UseRealtimeTrackingProps) => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    console.log(`🔄 Iniciando Realtime tracking para pedido: ${orderId}`);

    // Criar canal único para este pedido
    const realtimeChannel = supabase.channel(`tracking:${orderId}`, {
      config: {
        broadcast: { self: true }
      }
    });

    // Inscrever-se em novos eventos de tracking
    realtimeChannel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tracking_events',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          console.log('📍 Novo evento de tracking recebido:', payload.new);
          if (onEventUpdate && payload.new) {
            onEventUpdate(payload.new as TrackingEvent);
          }
        }
      )
      // Inscrever-se em atualizações de localização do pedido
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('📍 Atualização de localização recebida:', payload.new);
          if (onLocationUpdate && payload.new) {
            const location: OrderLocation = {
              current_latitude: (payload.new as any).current_latitude,
              current_longitude: (payload.new as any).current_longitude,
              last_location_update: (payload.new as any).last_location_update,
              status: (payload.new as any).status
            };
            onLocationUpdate(location);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Status da conexão Realtime: ${status}`);
        setIsConnected(status === 'SUBSCRIBED');
      });

    setChannel(realtimeChannel);

    // Cleanup ao desmontar
    return () => {
      console.log(`❌ Desconectando Realtime para pedido: ${orderId}`);
      realtimeChannel.unsubscribe();
    };
  }, [orderId, onEventUpdate, onLocationUpdate]);

  return {
    isConnected,
    disconnect: () => {
      if (channel) {
        channel.unsubscribe();
        setIsConnected(false);
      }
    }
  };
};
