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
    <div className="timeline-container">
      {events.map((event, index) => {
        const isCritical = event.ocorrencia_critica;
        const isDelivered = event.codigo_evento === 'DELIVERED';
        
        // Define o status do ponto
        const pontoStatus = isCritical 
          ? 'status-critico' 
          : isDelivered 
          ? 'status-entregue' 
          : 'status-normal';
        
        return (
          <div key={index} className="timeline-item relative">
            {/* Ponto da timeline */}
            <div className={`timeline-ponto ${pontoStatus}`} />

            {/* Conteúdo do evento */}
            <div className={`timeline-conteudo ${isCritical ? 'alerta-critico' : ''}`}>
              <span className={`data-hora ${isCritical ? 'laranja' : ''}`}>
                {new Date(event.data_hora).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })} - {new Date(event.data_hora).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              
              <p className="descricao-evento flex items-start gap-2">
                <span className="text-base flex-shrink-0">
                  {getEventEmoji(event.codigo_evento, isCritical)}
                </span>
                <span className="flex-1">
                  {event.descricao_amigavel}
                </span>
              </p>

              {event.cidade_uf !== 'N/A' && (
                <p className="cidade-uf flex items-center gap-1.5 mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{event.cidade_uf}</span>
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
