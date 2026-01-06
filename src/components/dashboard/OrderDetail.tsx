import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Clock, 
  DollarSign, 
  Truck, 
  Check, 
  CreditCard,
  Copy,
  CheckCircle,
  Upload,
  FileText,
  AlertCircle,
  Star,
  Camera,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { toast } from "sonner";

export interface OrderDetails {
  id: string;
  quote_id: string;
  status: string;
  status_pagamento?: string;
  carrier_name: string;
  carrier_type: "carrier" | "autonomous";
  vehicle_type?: string;
  driver_id?: string;
  carrier_id?: string;
  foto_entrega_url?: string;
  foto_entrega_timestamp?: string;
  origin: {
    cep: string;
    address: string;
    city: string;
  };
  destination: {
    cep: string;
    address: string;
    city: string;
  };
  base_price: number;
  commission_applied: number;
  adjustment_reason?: string;
  final_price: number;
  weight_kg: number;
  estimated_delivery: string;
  created_at: string;
  timeline: Array<{
    date: string;
    status: string;
    description: string;
  }>;
}

interface OrderDetailProps {
  order: OrderDetails;
  onBack: () => void;
}

// Status badge configuration
const getStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    'PENDING': { 
      label: 'Pendente', 
      className: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: <Clock className="h-3.5 w-3.5" />
    },
    'AGUARDANDO_PIX': { 
      label: 'Aguardando PIX', 
      className: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: <CreditCard className="h-3.5 w-3.5" />
    },
    'AGUARDANDO_COMPROVANTE': { 
      label: 'Aguardando Comprovante', 
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <Upload className="h-3.5 w-3.5" />
    },
    'COMPROVANTE_ENVIADO': { 
      label: 'Comprovante Enviado', 
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <FileText className="h-3.5 w-3.5" />
    },
    'PAGO': { 
      label: 'Pago', 
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: <CheckCircle className="h-3.5 w-3.5" />
    },
    'COLETA_CONFIRMADA': { 
      label: 'Coleta Confirmada', 
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: <Check className="h-3.5 w-3.5" />
    },
    'EM_TRANSITO': { 
      label: 'Em Trânsito', 
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <Truck className="h-3.5 w-3.5" />
    },
    'ENTREGUE': { 
      label: 'Entregue', 
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: <CheckCircle className="h-3.5 w-3.5" />
    },
    'CANCELADO': { 
      label: 'Cancelado', 
      className: 'bg-red-100 text-red-800 border-red-200',
      icon: <AlertCircle className="h-3.5 w-3.5" />
    },
  };
  return configs[status] || { 
    label: status, 
    className: 'bg-muted text-muted-foreground',
    icon: <Package className="h-3.5 w-3.5" />
  };
};

// Timeline event icon mapper
const getTimelineIcon = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('pag') || statusLower.includes('pix') || statusLower.includes('comprovante')) {
    return <CreditCard className="h-4 w-4" />;
  }
  if (statusLower.includes('coleta') || statusLower.includes('transit') || statusLower.includes('saiu')) {
    return <Truck className="h-4 w-4" />;
  }
  if (statusLower.includes('entreg') || statusLower.includes('conclu') || statusLower.includes('confirm')) {
    return <Check className="h-4 w-4" />;
  }
  return <Package className="h-4 w-4" />;
};

// Copy button component
const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 hover:bg-muted"
      onClick={handleCopy}
    >
      {copied ? (
        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </Button>
  );
};

export const OrderDetail = ({ order, onBack }: OrderDetailProps) => {
  const statusConfig = getStatusConfig(order.status_pagamento || order.status);
  const needsProofUpload = order.status === 'AGUARDANDO_COMPROVANTE' || order.status_pagamento === 'AGUARDANDO_COMPROVANTE';
  
  const [hasReviewed, setHasReviewed] = useState<boolean | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const isDelivered = order.status === 'ENTREGUE' || order.status === 'entregue' || order.status === 'delivered';
  const canReview = isDelivered && order.driver_id;
  
  useEffect(() => {
    const checkExistingReview = async () => {
      if (!canReview || !order.driver_id) {
        setHasReviewed(false);
        return;
      }
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: existingReview } = await supabase
          .from('driver_reviews')
          .select('id')
          .eq('order_id', order.id)
          .eq('reviewer_user_id', user.id)
          .maybeSingle();
        
        setHasReviewed(!!existingReview);
      } catch (error) {
        console.error('Error checking review:', error);
        setHasReviewed(false);
      }
    };
    
    checkExistingReview();
  }, [order.id, order.driver_id, canReview]);
  
  const handleReviewSuccess = () => {
    setHasReviewed(true);
    setShowReviewForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">Detalhes do Frete</h1>
            <Badge 
              variant="outline" 
              className={`${statusConfig.className} border px-3 py-1 flex items-center gap-1.5 font-medium`}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">ID: {order.id}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Informações Principais */}
        <Card className="p-6 space-y-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Informações do Frete
          </h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Transportador</p>
              <p className="font-medium">{order.carrier_name}</p>
              {order.carrier_type === "autonomous" && order.vehicle_type && (
                <p className="text-sm text-muted-foreground">
                  Motorista Autônomo - {order.vehicle_type}
                </p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Peso da Carga</p>
              <p className="font-medium">{order.weight_kg} kg</p>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
              <p className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                {new Date(order.estimated_delivery).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </Card>

        {/* Resumo do Pagamento */}
        <Card className="p-6 space-y-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Valor do Frete
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center pt-2">
              <p className="font-semibold">Valor Total</p>
              <p className="text-2xl font-bold text-blue-600">
                {order.final_price.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
            
            {/* Upload button highlight for pending proof */}
            {needsProofUpload && (
              <div className="pt-3">
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium">
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Comprovante de Pagamento
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Endereços com botões de copiar */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-full bg-blue-100">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            Origem
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">CEP</p>
                <p className="font-medium">{order.origin.cep}</p>
              </div>
              <CopyButton text={order.origin.cep} label="CEP" />
            </div>
            <Separator />
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Endereço</p>
                <p className="font-medium">{order.origin.address}</p>
              </div>
              <CopyButton text={order.origin.address} label="Endereço" />
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Cidade</p>
              <p className="font-medium">{order.origin.city}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-full bg-amber-100">
              <MapPin className="h-5 w-5 text-amber-600" />
            </div>
            Destino
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">CEP</p>
                <p className="font-medium">{order.destination.cep}</p>
              </div>
              <CopyButton text={order.destination.cep} label="CEP" />
            </div>
            <Separator />
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Endereço</p>
                <p className="font-medium">{order.destination.address}</p>
              </div>
              <CopyButton text={order.destination.address} label="Endereço" />
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Cidade</p>
              <p className="font-medium">{order.destination.city}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Timeline de Eventos Elegante */}
      <Card className="p-6 rounded-xl shadow-sm">
        <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Timeline de Eventos
        </h3>
        <div className="relative pl-8">
          {/* Linha vertical da timeline */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-border" />
          
          <div className="space-y-6">
            {order.timeline.map((event, index) => {
              const isFirst = index === 0;
              const isLast = index === order.timeline.length - 1;
              
              return (
                <div key={index} className="relative flex gap-4">
                  {/* Ponto da timeline */}
                  <div className="absolute -left-8 flex items-center justify-center">
                    <div 
                      className={`
                        relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 
                        ${isFirst 
                          ? 'bg-primary border-primary text-white animate-pulse' 
                          : 'bg-background border-primary/50 text-primary'
                        }
                      `}
                    >
                      {getTimelineIcon(event.status)}
                    </div>
                    {/* Pulse effect for most recent */}
                    {isFirst && (
                      <div className="absolute inset-0 w-6 h-6 rounded-full bg-primary/20 animate-ping" />
                    )}
                  </div>
                  
                  {/* Conteúdo do evento */}
                  <div className={`
                    flex-1 pb-2 pl-2
                    ${isFirst ? 'bg-primary/5 -ml-2 p-3 rounded-lg border border-primary/10' : ''}
                  `}>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-sm font-semibold ${isFirst ? 'text-primary' : 'text-foreground'}`}>
                        {event.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Foto de Comprovante de Entrega */}
      {order.foto_entrega_url && (
        <Card className="p-6 rounded-xl shadow-sm">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Comprovante de Entrega
          </h3>
          
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30">
              <img 
                src={order.foto_entrega_url} 
                alt="Foto de comprovante da entrega"
                className="w-full max-h-96 object-contain"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {order.foto_entrega_timestamp && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Registrada em: {new Date(order.foto_entrega_timestamp).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
              
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => window.open(order.foto_entrega_url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir em nova aba
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Seção de Avaliação do Motorista */}
      {canReview && hasReviewed !== null && (
        <Card className="p-6 rounded-xl shadow-sm">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Avaliação do Motorista
          </h3>
          
          {hasReviewed ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-800">Avaliação enviada!</p>
                <p className="text-sm text-emerald-600">
                  Obrigado por avaliar o motorista. Sua opinião ajuda a melhorar nosso serviço.
                </p>
              </div>
            </div>
          ) : showReviewForm ? (
            <div className="space-y-4">
              <ReviewForm
                orderId={order.id}
                driverId={order.driver_id}
                type="driver"
                onSuccess={handleReviewSuccess}
              />
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setShowReviewForm(false)}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Como foi sua experiência com o motorista? Sua avaliação ajuda outros embarcadores.
              </p>
              <Button 
                onClick={() => setShowReviewForm(true)}
                className="w-full sm:w-auto"
              >
                <Star className="h-4 w-4 mr-2" />
                Avaliar Motorista
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
