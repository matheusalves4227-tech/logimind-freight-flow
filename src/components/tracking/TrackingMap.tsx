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

      // Adicionar marcador de localização atual (FTL) - Caminhão animado
      if (serviceType === 'ftl' && currentLocation) {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="position: relative; width: 48px; height: 48px;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 48px; height: 48px; background: rgba(251, 188, 5, 0.2); border-radius: 50%; animation: pulse 2s infinite;"></div>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 32px; height: 32px; background: #FBBC05; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(251, 188, 5, 0.4);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 18.5C18 19.3284 17.3284 20 16.5 20C15.6716 20 15 19.3284 15 18.5C15 17.6716 15.6716 17 16.5 17C17.3284 17 18 17.6716 18 18.5Z" />
                <path d="M9 18.5C9 19.3284 8.32843 20 7.5 20C6.67157 20 6 19.3284 6 18.5C6 17.6716 6.67157 17 7.5 17C8.32843 17 9 17.6716 9 18.5Z" />
                <path d="M1 5H13V13H1V5Z M13 5H17L19 8V13H13V5Z M6 17H9 M15 17H18" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
            </div>
          </div>
          <style>
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
              50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.3); }
            }
          </style>
        `;
        el.style.width = '48px';
        el.style.height = '48px';

        new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([currentLocation.lng, currentLocation.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 8px; min-width: 200px;">
                  <strong style="color: #FBBC05; font-size: 14px;">🚚 Localização Atual</strong>
                  <p style="font-size: 12px; color: #666; margin-top: 4px;">
                    ${currentLocation.lastUpdate ? 
                      `Atualizado: ${new Date(currentLocation.lastUpdate).toLocaleString('pt-BR')}` 
                      : 'Última atualização disponível'}
                  </p>
                </div>
              `)
          )
          .addTo(map.current);
      }

      // Adicionar marcadores de origem e destino (pinos azuis)
      // Mock: usar coordenadas aproximadas baseadas em CEPs brasileiros comuns
      if (originCep) {
        const originEl = document.createElement('div');
        originEl.innerHTML = `
          <div style="width: 32px; height: 40px; position: relative;">
            <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z" fill="#1A73E8"/>
              <circle cx="16" cy="16" r="6" fill="white"/>
            </svg>
          </div>
        `;
        
        // Coordenadas mock para origem (exemplo: São Paulo)
        const originCoords: [number, number] = [-46.6333, -23.5505];
        
        new mapboxgl.Marker({ element: originEl, anchor: 'bottom' })
          .setLngLat(originCoords)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 8px;">
                  <strong style="color: #1A73E8;">📍 Origem</strong>
                  <p style="font-size: 12px; margin-top: 4px;">CEP: ${originCep}</p>
                </div>
              `)
          )
          .addTo(map.current);
      }

      if (destinationCep) {
        const destEl = document.createElement('div');
        destEl.innerHTML = `
          <div style="width: 32px; height: 40px; position: relative;">
            <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z" fill="#34A853"/>
              <circle cx="16" cy="16" r="6" fill="white"/>
            </svg>
          </div>
        `;
        
        // Coordenadas mock para destino (exemplo: Rio de Janeiro)
        const destCoords: [number, number] = [-43.1729, -22.9068];
        
        new mapboxgl.Marker({ element: destEl, anchor: 'bottom' })
          .setLngLat(destCoords)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 8px;">
                  <strong style="color: #34A853;">🏁 Destino</strong>
                  <p style="font-size: 12px; margin-top: 4px;">CEP: ${destinationCep}</p>
                </div>
              `)
          )
          .addTo(map.current);
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
