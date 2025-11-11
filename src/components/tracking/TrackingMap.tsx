import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface TrackingMapProps {
  currentLocation?: {
    lat: number;
    lng: number;
    lastUpdate?: string;
  } | null;
  originCep?: string;
  destinationCep?: string;
  lastEventCity?: string;
  serviceType: 'ltl' | 'ftl';
}

export const TrackingMap = ({ 
  currentLocation, 
  originCep, 
  destinationCep,
  lastEventCity,
  serviceType 
}: TrackingMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  useEffect(() => {
    // Buscar token do Mapbox
    const fetchToken = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-mapbox-token');
        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    // Definir centro do mapa baseado no tipo de serviço
    let center: [number, number] = [-46.6333, -23.5505]; // Default: São Paulo
    let zoom = 10;

    if (serviceType === 'ftl' && currentLocation) {
      // FTL com localização em tempo real
      center = [currentLocation.lng, currentLocation.lat];
      zoom = 13;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center,
        zoom,
      });

      // Adicionar controles de navegação
      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      // Adicionar marcador de localização atual (FTL)
      if (serviceType === 'ftl' && currentLocation) {
        const el = document.createElement('div');
        el.className = 'custom-marker-truck';
        el.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiNGQkJDMDUiIGZpbGwtb3BhY2l0eT0iMC4yIi8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEyIiBmaWxsPSIjRkJCQzA1Ii8+CjxwYXRoIGQ9Ik0yMCAxNEwyMCAyNk0xNCAyMEwyNiAyMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+)';
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.backgroundSize = 'contain';
        el.style.backgroundRepeat = 'no-repeat';

        new mapboxgl.Marker(el)
          .setLngLat([currentLocation.lng, currentLocation.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div class="p-2">
                  <strong class="text-accent">Localização Atual</strong>
                  <p class="text-xs text-muted-foreground mt-1">
                    ${currentLocation.lastUpdate ? 
                      `Atualizado: ${new Date(currentLocation.lastUpdate).toLocaleString('pt-BR')}` 
                      : 'Última atualização disponível'}
                  </p>
                </div>
              `)
          )
          .addTo(map.current);
      }

      // Adicionar marcadores de origem e destino
      if (originCep && destinationCep) {
        // TODO: Geocodificar CEPs para adicionar marcadores
        // Por enquanto, apenas mostrar marcador genérico se houver lastEventCity
      }

      setLoading(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      setLoading(false);
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, currentLocation, serviceType, originCep, destinationCep]);

  if (loading || !mapboxToken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-md" />
      
      {serviceType === 'ltl' && (
        <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-border/50">
          <p className="text-xs text-muted-foreground">Transportadora LTL</p>
          <p className="text-sm font-semibold text-foreground">
            {lastEventCity || 'Localização não disponível em tempo real'}
          </p>
        </div>
      )}
      
      {serviceType === 'ftl' && currentLocation && (
        <div className="absolute top-4 left-4 bg-accent/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-accent/30 animate-pulse">
          <p className="text-xs text-accent-foreground/80">🚚 Rastreamento em Tempo Real</p>
          <p className="text-sm font-semibold text-accent-foreground">
            Motorista Autônomo
          </p>
        </div>
      )}
    </div>
  );
};
