import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  DollarSign, 
  Clock, 
  MapPin, 
  Info,
  Loader2,
  AlertTriangle,
  Radio,
  Search
} from 'lucide-react';
import { TrackingMap } from '@/components/tracking/TrackingMap';
import { TrackingTimeline } from '@/components/tracking/TrackingTimeline';
import { formatarMoeda, formatarPorcentagemSimples } from '@/lib/formatters';
import { useRealtimeTracking } from '@/hooks/useRealtimeTracking';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrackingData {
  id_rastreio: string;
  status_principal: string;
  previsao_entrega: string;
  transportador_nome: string;
  tipo_veiculo: string;
  historico_eventos: Array<{
    data_hora: string;
    codigo_evento: string;
    descricao_amigavel: string;
    cidade_uf: string;
    ocorrencia_critica: boolean;
  }>;
  localizacao_atual: {
    lat: number;
    lng: number;
    ultima_atualizacao: string;
  } | null;
}

interface OrderData {
  service_type: 'ltl' | 'ftl';
  carrier_name: string;
  base_price: number;
  commission_applied: number;
  final_price: number;
  origin_cep: string;
  destination_cep: string;
  estimated_delivery: string;
  status: string;
}

const Tracking = () => {
  const { trackingCode: urlTrackingCode } = useParams<{ trackingCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchCode, setSearchCode] = useState('');
  const [activeTrackingCode, setActiveTrackingCode] = useState<string | null>(urlTrackingCode || null);

  // Hook de Realtime tracking
  const { isConnected } = useRealtimeTracking({
    orderId,
    onEventUpdate: (event) => {
      console.log('🔔 Novo evento recebido via Realtime:', event);
      toast.success('Novo evento de rastreamento!', {
        description: event.event_description
      });
      
      // Atualizar dados do tracking
      setTrackingData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          historico_eventos: [
            {
              data_hora: event.event_timestamp,
              codigo_evento: event.event_code,
              descricao_amigavel: event.event_description,
              cidade_uf: event.city && event.state ? `${event.city} - ${event.state}` : 'N/A',
              ocorrencia_critica: event.is_critical
            },
            ...prev.historico_eventos
          ]
        };
      });
    },
    onLocationUpdate: (location) => {
      console.log('📍 Localização atualizada via Realtime:', location);
      
      if (location.current_latitude && location.current_longitude) {
        toast.info('Localização atualizada!', {
          description: 'O veículo mudou de posição'
        });
        
        // Atualizar localização no tracking
        setTrackingData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            localizacao_atual: {
              lat: location.current_latitude!,
              lng: location.current_longitude!,
              ultima_atualizacao: location.last_location_update || new Date().toISOString()
            }
          };
        });
      }

      // Atualizar status do pedido
      if (location.status && orderData) {
        setOrderData(prev => prev ? { ...prev, status: location.status } : prev);
      }
    }
  });

  useEffect(() => {
    if (urlTrackingCode) {
      setActiveTrackingCode(urlTrackingCode);
    }
  }, [urlTrackingCode]);

  useEffect(() => {
    if (activeTrackingCode) {
      fetchTrackingData(activeTrackingCode);
    }
  }, [activeTrackingCode]);

  const fetchTrackingData = async (code?: string) => {
    const trackingCodeToUse = code || activeTrackingCode;
    if (!trackingCodeToUse) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar dados do pedido primeiro (para info adicional)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_code', trackingCodeToUse)
        .single();

      if (orderError) {
        console.error('Order error:', orderError);
        setError('Pedido não encontrado');
        return;
      }

      setOrderData({
        ...order,
        service_type: order.service_type as 'ltl' | 'ftl'
      });

      // Armazenar order_id para Realtime
      setOrderId(order.id);

      // Chamar edge function de tracking
      const { data, error: trackingError } = await supabase.functions.invoke(
        `tracking/${trackingCodeToUse}`,
        {
          method: 'GET',
        }
      );

      if (trackingError) {
        console.error('Tracking error:', trackingError);
        toast.error('Erro ao buscar dados de rastreamento');
        return;
      }

      setTrackingData(data);
    } catch (err) {
      console.error('Error fetching tracking:', err);
      setError('Erro ao carregar rastreamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim()) {
      setActiveTrackingCode(searchCode.trim().toUpperCase());
      navigate(`/tracking/${searchCode.trim().toUpperCase()}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'PENDING': { label: 'Pendente', className: 'bg-gray-100 text-gray-700 border-gray-300' },
      'CONFIRMED': { label: 'Confirmado', className: 'bg-blue-100 text-blue-700 border-blue-300' },
      'IN_TRANSIT': { label: 'Em Trânsito', className: 'bg-blue-500 text-white border-blue-600' },
      'DELIVERED': { label: 'Entregue', className: 'bg-green-500 text-white border-green-600' },
      'CANCELLED': { label: 'Cancelado', className: 'bg-red-100 text-red-700 border-red-300' },
      'FAILED': { label: 'Falha na Entrega', className: 'bg-orange-500 text-white border-orange-600' }
    };

    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return (
      <Badge className={`text-xs font-semibold px-3 py-1 ${statusInfo.className}`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const hasCriticalEvents = trackingData?.historico_eventos.some(e => e.ocorrencia_critica);

  // Se não tiver código de rastreamento, mostrar formulário de busca
  if (!activeTrackingCode || (error && !trackingData && !orderData)) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Rastrear Pedido | LogiMarket</title>
          <meta name="description" content="Rastreie seu pedido em tempo real" />
        </Helmet>
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24">
          <Card className="p-8 max-w-md mx-auto">
            <div className="text-center mb-6">
              <Package className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Rastrear Pedido</h1>
              <p className="text-muted-foreground">
                Digite o código de rastreamento para acompanhar seu pedido
              </p>
            </div>
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Ex: LGM-XXXXXX"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  className="pl-10 text-center font-mono uppercase"
                />
              </div>
              <Button type="submit" className="w-full" disabled={!searchCode.trim()}>
                <Search className="mr-2 h-4 w-4" />
                Rastrear
              </Button>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando rastreamento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!trackingData || !orderData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24">
          <Card className="p-8 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Rastreamento não encontrado</h2>
            <p className="text-muted-foreground mb-6">
              Código de rastreamento: {activeTrackingCode}
            </p>
            <Button onClick={() => navigate('/tracking')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const lastEvent = trackingData.historico_eventos[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-6 sm:pt-24">
        {/* Header */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => fetchTrackingData()}>
              Atualizar
            </Button>
          </div>
          
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">Rastreamento</h1>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Código de Rastreio</p>
              <p className="text-sm md:text-base font-mono font-semibold break-all">{activeTrackingCode}</p>
            </div>
          </div>
        </div>

        {/* Layout em 3 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Coluna Esquerda: Visão Rápida e Detalhes LogiMind */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Status Geral */}
            <Card className="p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                  Status Geral
                </h3>
                {isConnected && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center gap-1.5 px-2.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping-marker absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 animate-blink-live"></span>
                          </span>
                          <span className="hidden sm:inline font-medium">Ao vivo</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Rastreamento em tempo real ativo</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="space-y-3">
                {getStatusBadge(trackingData.status_principal)}
                
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Código de Rastreio</p>
                  <p className="text-sm font-mono font-medium">{trackingData.id_rastreio}</p>
                </div>
              </div>
            </Card>

            {/* Previsão de Entrega */}
            <Card className="p-4 rounded-xl shadow-sm bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-accent/80 font-semibold uppercase tracking-wide mb-1">
                    Previsão de Entrega
                  </p>
                  <p className="text-base font-bold text-accent">
                    {trackingData.previsao_entrega ? (
                      <>
                        {new Date(trackingData.previsao_entrega).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })} - {new Date(trackingData.previsao_entrega).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </>
                    ) : (
                      'A definir'
                    )}
                  </p>
                </div>
              </div>
            </Card>

            {/* Transportador */}
            <Card className="p-4 rounded-xl shadow-sm">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-3 font-semibold flex items-center gap-1.5">
                <Truck className="h-3 w-3" />
                Transportador
              </h3>
              <p className="text-sm font-semibold mb-1">{trackingData.transportador_nome}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-[10px] rounded-lg">
                  {orderData.service_type === 'ltl' ? 'LTL' : 'FTL'}
                </Badge>
                {trackingData.tipo_veiculo !== 'N/A' && (
                  <span>{trackingData.tipo_veiculo}</span>
                )}
              </div>
            </Card>

            {/* Valor do Frete */}
            <Card className="p-4 rounded-xl shadow-sm bg-primary/5 border-primary/20">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-3 font-semibold flex items-center gap-1.5">
                <DollarSign className="h-3 w-3" />
                Valor do Frete
              </h3>
              <p className="text-xl font-bold text-primary">
                {formatarMoeda(orderData.final_price)}
              </p>
            </Card>

            {/* CTA Ocorrência */}
            {hasCriticalEvents && (
              <Button 
                variant="destructive" 
                className="w-full gap-2"
                onClick={() => toast.info('Funcionalidade de ocorrências em desenvolvimento')}
              >
                <AlertTriangle className="h-4 w-4" />
                Abrir Ocorrência
              </Button>
            )}
          </div>

          {/* Coluna Central: Mapa */}
          <div className="lg:col-span-5">
            <Card className="p-0 overflow-hidden h-[600px] rounded-2xl map-container-styled">
              <TrackingMap
                currentLocation={trackingData.localizacao_atual}
                originCep={orderData.origin_cep}
                destinationCep={orderData.destination_cep}
                lastEventCity={lastEvent?.cidade_uf}
                serviceType={orderData.service_type}
              />
            </Card>
          </div>

          {/* Coluna Direita: Timeline */}
          <div className="lg:col-span-4">
            <Card className="p-4 h-[600px] overflow-y-auto rounded-xl shadow-sm">
              <h3 className="text-sm uppercase tracking-wide text-muted-foreground mb-4 font-semibold flex items-center gap-2 sticky top-0 bg-card pb-2 z-10">
                <MapPin className="h-4 w-4" />
                Histórico de Eventos
              </h3>
              
              <TrackingTimeline events={trackingData.historico_eventos} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tracking;
