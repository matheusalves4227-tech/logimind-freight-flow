import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastEventTimestampRef = useRef<string | null>(null);
  const lastLocationUpdateRef = useRef<string | null>(null);

  const onEventUpdateRef = useRef(onEventUpdate);
  const onLocationUpdateRef = useRef(onLocationUpdate);

  useEffect(() => {
    onEventUpdateRef.current = onEventUpdate;
  }, [onEventUpdate]);

  useEffect(() => {
    onLocationUpdateRef.current = onLocationUpdate;
  }, [onLocationUpdate]);

  useEffect(() => {
    if (!orderId) return;

    const poll = async () => {
      try {
        // Poll for new tracking events
        let query = supabase
          .from('tracking_events')
          .select('*')
          .eq('order_id', orderId)
          .order('event_timestamp', { ascending: false })
          .limit(1);

        if (lastEventTimestampRef.current) {
          query = query.gt('event_timestamp', lastEventTimestampRef.current);
        }

        const { data: events } = await query;
        if (events && events.length > 0) {
          lastEventTimestampRef.current = events[0].event_timestamp;
          if (onEventUpdateRef.current) {
            onEventUpdateRef.current(events[0] as TrackingEvent);
          }
        }

        // Poll for order location updates
        const { data: order } = await supabase
          .from('orders')
          .select('current_latitude, current_longitude, last_location_update, status')
          .eq('id', orderId)
          .single();

        if (order && order.last_location_update !== lastLocationUpdateRef.current) {
          lastLocationUpdateRef.current = order.last_location_update;
          if (onLocationUpdateRef.current) {
            onLocationUpdateRef.current(order as OrderLocation);
          }
        }
      } catch (err) {
        console.error('Tracking poll error:', err);
      }
    };

    // Initial fetch
    poll();
    setIsConnected(true);

    // Poll every 15 seconds
    intervalRef.current = setInterval(poll, 15_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsConnected(false);
    };
  }, [orderId]);

  const disconnect = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsConnected(false);
    }
  }, []);

  return {
    isConnected,
    disconnect
  };
};
