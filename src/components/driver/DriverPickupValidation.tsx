import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, XCircle, Clock, User, Package, MapPin, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DriverPickupValidationProps {
  orderId: string;
}

interface OrderValidationData {
  id: string;
  tracking_code: string;
  codigo_coleta: string | null;
  validado_para_coleta: boolean;
  validado_em: string | null;
  validado_por_nome: string | null;
  origin_address: string;
  destination_address: string;
  weight_kg: number;
  driver_name: string | null;
}

const DriverPickupValidation = ({ orderId }: DriverPickupValidationProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<OrderValidationData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchOrderData();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`order-validation-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('Order validation updated:', payload);
          fetchOrderData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, tracking_code, codigo_coleta, validado_para_coleta, validado_em, validado_por_nome, origin_address, destination_address, weight_kg, driver_name')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrderData(data);
    } catch (error) {
      console.error('Erro ao buscar dados do pedido:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do pedido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (orderData?.codigo_coleta) {
      navigator.clipboard.writeText(orderData.codigo_coleta);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "Código de coleta copiado para a área de transferência",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!orderData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Pedido não encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status da Validação */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {orderData.validado_para_coleta ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Validado para Coleta
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 text-orange-600" />
                  Aguardando Validação
                </>
              )}
            </CardTitle>
            <Badge variant={orderData.validado_para_coleta ? "default" : "secondary"}>
              {orderData.validado_para_coleta ? "Liberado" : "Pendente"}
            </Badge>
          </div>
          <CardDescription>
            {orderData.validado_para_coleta 
              ? `Validado por ${orderData.validado_por_nome || "Expedidor"} em ${new Date(orderData.validado_em!).toLocaleString('pt-BR')}`
              : "Apresente o código abaixo ao expedidor para liberar a coleta"
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {/* QR Code e Código de Coleta */}
      {!orderData.validado_para_coleta && orderData.codigo_coleta && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-center">Código de Validação</CardTitle>
            <CardDescription className="text-center">
              Mostre este código ou QR Code ao expedidor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-6 bg-white rounded-xl shadow-lg">
                <QRCodeSVG 
                  value={JSON.stringify({
                    orderId: orderData.id,
                    codigo: orderData.codigo_coleta,
                    tracking: orderData.tracking_code,
                    driver: orderData.driver_name
                  })}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
            </div>

            {/* Código Alfanumérico */}
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground font-medium">
                Ou digite o código:
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="px-6 py-4 bg-muted rounded-lg">
                  <p className="text-4xl font-mono font-bold tracking-wider">
                    {orderData.codigo_coleta}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Informações do Pedido */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Rastreio</p>
                  <p className="text-sm text-muted-foreground">{orderData.tracking_code}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Coleta</p>
                  <p className="text-sm text-muted-foreground">{orderData.origin_address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Motorista</p>
                  <p className="text-sm text-muted-foreground">{orderData.driver_name}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      {!orderData.validado_para_coleta && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Instruções para Coleta
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-6 list-disc">
                <li>Ao chegar no local de coleta, apresente o QR Code ou código ao expedidor</li>
                <li>O expedidor irá validar sua identidade e liberar a carga</li>
                <li>Após a validação, você poderá confirmar o carregamento da carga</li>
                <li>Tenha sua CNH em mãos para conferência, se necessário</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sucesso na Validação */}
      {orderData.validado_para_coleta && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  Coleta Liberada!
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Você está autorizado a coletar a carga. Proceda com o carregamento e confirme quando finalizado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriverPickupValidation;
