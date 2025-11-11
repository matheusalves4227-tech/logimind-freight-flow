import { Package, Truck, CheckCircle, AlertTriangle, MapPin, Clock } from 'lucide-react';
import { formatarMoeda } from '@/lib/formatters';

interface TimelineEvent {
  data_hora: string;
  codigo_evento: string;
  descricao_amigavel: string;
  cidade_uf: string;
  ocorrencia_critica: boolean;
}

interface TrackingTimelineProps {
  events: TimelineEvent[];
}

const getEventIcon = (eventCode: string, isCritical: boolean) => {
  if (isCritical) return <AlertTriangle className="h-4 w-4 text-destructive" />;
  
  switch (eventCode) {
    case 'ORDER_CREATED':
    case 'ORDER_CONFIRMED':
      return <Package className="h-4 w-4 text-primary" />;
    case 'PICKED_UP':
    case 'IN_TRANSIT':
    case 'OUT_FOR_DELIVERY':
      return <Truck className="h-4 w-4 text-accent" />;
    case 'DELIVERED':
      return <CheckCircle className="h-4 w-4 text-secondary" />;
    default:
      return <MapPin className="h-4 w-4 text-muted-foreground" />;
  }
};

const getEventEmoji = (eventCode: string, isCritical: boolean) => {
  if (isCritical) return '⚠️';
  
  switch (eventCode) {
    case 'ORDER_CREATED':
    case 'ORDER_CONFIRMED':
      return '📝';
    case 'PICKED_UP':
      return '📦';
    case 'IN_TRANSIT':
    case 'AT_SORTING_CENTER':
    case 'DEPARTED_SORTING_CENTER':
      return '🚚';
    case 'OUT_FOR_DELIVERY':
      return '🏃';
    case 'DELIVERED':
      return '✅';
    default:
      return '📍';
  }
};

export const TrackingTimeline = ({ events }: TrackingTimelineProps) => {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Nenhum evento de rastreamento disponível</p>
      </div>
    );
  }

  return (
    <div className="relative pl-8 py-4">
      {/* Linha vertical da timeline */}
      <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-6">
        {events.map((event, index) => {
          const isCritical = event.ocorrencia_critica;
          const isLatest = index === 0;
          
          return (
            <div key={index} className="relative">
              {/* Ponto da timeline */}
              <div 
                className={`absolute -left-[23px] w-4 h-4 rounded-full border-[3px] border-background z-10 transition-all ${
                  isCritical 
                    ? 'bg-destructive shadow-md' 
                    : isLatest 
                    ? 'bg-accent shadow-accent animate-pulse' 
                    : event.codigo_evento === 'DELIVERED'
                    ? 'bg-secondary shadow-success'
                    : 'bg-primary'
                }`}
              />

              {/* Conteúdo do evento */}
              <div 
                className={`ml-2 p-3 rounded-lg border transition-all ${
                  isCritical 
                    ? 'bg-destructive/5 border-destructive/20 border-l-4 border-l-destructive' 
                    : isLatest
                    ? 'bg-accent/5 border-accent/20 border-l-4 border-l-accent'
                    : event.codigo_evento === 'DELIVERED'
                    ? 'bg-secondary/5 border-secondary/20 border-l-4 border-l-secondary'
                    : 'bg-muted/30 border-border/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className={`text-xs font-semibold ${
                    isCritical 
                      ? 'text-destructive' 
                      : isLatest
                      ? 'text-accent'
                      : event.codigo_evento === 'DELIVERED'
                      ? 'text-secondary'
                      : 'text-muted-foreground'
                  }`}>
                    {new Date(event.data_hora).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })} - {new Date(event.data_hora).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  
                  {getEventIcon(event.codigo_evento, isCritical)}
                </div>

                <p className={`text-sm font-medium mb-1 flex items-start gap-2 ${
                  isCritical ? 'text-destructive' : 'text-foreground'
                }`}>
                  <span className="text-base flex-shrink-0">
                    {getEventEmoji(event.codigo_evento, isCritical)}
                  </span>
                  <span className="flex-1">
                    {event.descricao_amigavel}
                  </span>
                </p>

                {event.cidade_uf !== 'N/A' && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                    <MapPin className="h-3 w-3" />
                    <span>{event.cidade_uf}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
