import { useEffect, useState, useRef, useCallback } from 'react';
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
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Use refs para callbacks para evitar re-subscriptions
  const onEventUpdateRef = useRef(onEventUpdate);
  const onLocationUpdateRef = useRef(onLocationUpdate);
  
  // Atualizar refs quando callbacks mudarem
  useEffect(() => {
    onEventUpdateRef.current = onEventUpdate;
  }, [onEventUpdate]);
  
  useEffect(() => {
    onLocationUpdateRef.current = onLocationUpdate;
  }, [onLocationUpdate]);

  useEffect(() => {
    if (!orderId) return;

    // Evitar re-subscription se já conectado ao mesmo orderId
    if (channelRef.current) {
      return;
    }

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
          if (onEventUpdateRef.current && payload.new) {
            onEventUpdateRef.current(payload.new as TrackingEvent);
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
          if (onLocationUpdateRef.current && payload.new) {
            const location: OrderLocation = {
              current_latitude: (payload.new as any).current_latitude,
              current_longitude: (payload.new as any).current_longitude,
              last_location_update: (payload.new as any).last_location_update,
              status: (payload.new as any).status
            };
            onLocationUpdateRef.current(location);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Status da conexão Realtime: ${status}`);
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = realtimeChannel;

    // Cleanup ao desmontar
    return () => {
      console.log(`❌ Desconectando Realtime para pedido: ${orderId}`);
      realtimeChannel.unsubscribe();
      channelRef.current = null;
    };
  }, [orderId]); // Apenas orderId como dependência

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  return {
    isConnected,
    disconnect
  };
};
