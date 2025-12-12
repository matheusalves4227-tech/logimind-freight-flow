import { Package, Truck, CheckCircle, AlertTriangle, MapPin, Clock, CreditCard, FileCheck } from 'lucide-react';

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
  if (isCritical) return <AlertTriangle className="h-4 w-4" />;
  
  const code = eventCode.toLowerCase();
  if (code.includes('payment') || code.includes('pix') || code.includes('pago')) {
    return <CreditCard className="h-4 w-4" />;
  }
  if (code.includes('transit') || code.includes('saiu') || code.includes('delivery')) {
    return <Truck className="h-4 w-4" />;
  }
  if (code.includes('delivered') || code.includes('entreg') || code.includes('confirm')) {
    return <CheckCircle className="h-4 w-4" />;
  }
  if (code.includes('picked') || code.includes('coleta')) {
    return <FileCheck className="h-4 w-4" />;
  }
  if (code.includes('order') || code.includes('created')) {
    return <Package className="h-4 w-4" />;
  }
  return <MapPin className="h-4 w-4" />;
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
    <div className="relative pl-8">
      {/* Linha vertical da timeline */}
      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-border" />
      
      <div className="space-y-5">
        {events.map((event, index) => {
          const isCritical = event.ocorrencia_critica;
          const isFirst = index === 0;
          const isDelivered = event.codigo_evento === 'DELIVERED';
          
          // Determina cor do ponto
          const getPointColor = () => {
            if (isCritical) return 'bg-amber-500 border-amber-200';
            if (isDelivered) return 'bg-emerald-500 border-emerald-200';
            if (isFirst) return 'bg-primary border-primary/30';
            return 'bg-primary/60 border-primary/20';
          };
          
          return (
            <div key={index} className="relative flex gap-4">
              {/* Ponto da timeline com ícone */}
              <div className="absolute -left-8 flex items-center justify-center">
                <div 
                  className={`
                    relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 
                    ${getPointColor()}
                    ${isFirst ? 'text-white' : 'text-white'}
                    ${isCritical ? 'text-white' : ''}
                  `}
                >
                  {getEventIcon(event.codigo_evento, isCritical)}
                </div>
                
                {/* Efeito de pulse para evento mais recente */}
                {isFirst && !isCritical && (
                  <div className="absolute inset-0 w-6 h-6 rounded-full bg-primary/30 animate-ping-marker" />
                )}
                
                {/* Efeito de pulse para evento crítico */}
                {isCritical && (
                  <div className="absolute inset-0 w-6 h-6 rounded-full bg-amber-500/30 animate-ping-marker" />
                )}
              </div>
              
              {/* Conteúdo do evento */}
              <div 
                className={`
                  flex-1 pb-1 pl-2 rounded-lg transition-all
                  ${isFirst ? 'bg-primary/5 -ml-2 p-3 border border-primary/10' : ''}
                  ${isCritical ? 'bg-amber-50 -ml-2 p-3 border-l-4 border-l-amber-500 border border-amber-100' : ''}
                `}
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span 
                    className={`
                      text-sm font-semibold
                      ${isCritical ? 'text-amber-700' : isFirst ? 'text-primary' : 'text-foreground'}
                    `}
                  >
                    {event.descricao_amigavel}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {new Date(event.data_hora).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    })} às {new Date(event.data_hora).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  
                  {event.cidade_uf !== 'N/A' && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.cidade_uf}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
