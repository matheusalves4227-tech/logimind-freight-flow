import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  User, 
  Truck, 
  Package,
  IdCard,
  Phone,
  MapPin,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { supabase } from "@/integrations/supabase/client";

interface DriverInfo {
  id: string;
  full_name: string;
  cpf: string;
  phone: string;
  foto_perfil_url: string | null;
  cnh_number: string | null;
  cnh_category: string | null;
}

interface OrderInfo {
  id: string;
  tracking_code: string;
  origin_address: string;
  destination_address: string;
  weight_kg: number;
  service_type: string;
  driver_id: string;
  driver_name: string;
  validado_para_coleta: boolean;
}

interface ShipperValidateDriverProps {
  orderId: string;
}

const ShipperValidateDriver = ({ orderId }: ShipperValidateDriverProps) => {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [codigoInput, setCodigoInput] = useState("");
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [isValidCode, setIsValidCode] = useState(false);

  useEffect(() => {
    fetchOrderInfo();
  }, [orderId]);

  const fetchOrderInfo = async () => {
    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, tracking_code, origin_address, destination_address, weight_kg, service_type, driver_id, driver_name, validado_para_coleta')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrderInfo(orderData);

      if (orderData.driver_id) {
        const { data: driverData, error: driverError } = await supabase
          .from('driver_profiles')
          .select('id, full_name, cpf, phone, foto_perfil_url')
          .eq('id', orderData.driver_id)
          .single();

        if (!driverError && driverData) {
          // Buscar dados da CNH
          const { data: cnhData } = await supabase
            .from('driver_cnh_data')
            .select('cnh_number, cnh_category')
            .eq('driver_profile_id', driverData.id)
            .single();

          setDriverInfo({
            ...driverData,
            cnh_number: cnhData?.cnh_number || null,
            cnh_category: cnhData?.cnh_category || null
          });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar informações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as informações do pedido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!codigoInput.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite o código de validação",
        variant: "destructive",
      });
      return;
    }

    setValidating(true);
    setValidationAttempted(true);

    try {
      // Verificar se o código corresponde ao pedido
      const { data, error } = await supabase
        .from('orders')
        .select('id, codigo_coleta')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      const codigoCorreto = data.codigo_coleta?.toUpperCase() === codigoInput.toUpperCase();
      setIsValidCode(codigoCorreto);

      if (!codigoCorreto) {
        toast({
          title: "Código Inválido",
          description: "O código informado não corresponde a este pedido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar o código",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmValidation = async () => {
    setValidating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('orders')
        .update({
          validado_para_coleta: true,
          validado_em: new Date().toISOString(),
          validado_por_email: user.email,
          validado_por_nome: user.user_metadata?.full_name || user.email
        })
        .eq('id', orderId);

      if (error) throw error;

      // Registrar auditoria
      await logAction({
        action: 'delivery_confirmation',
        metadata: {
          order_id: orderId,
          tracking_code: orderInfo?.tracking_code,
          driver_id: driverInfo?.id,
          driver_name: driverInfo?.full_name,
          validated_at: new Date().toISOString(),
          validation_code: codigoInput,
        },
      });

      toast({
        title: "Motorista Validado!",
        description: "A coleta foi liberada para o motorista",
      });

      // Atualizar dados
      await fetchOrderInfo();
      setCodigoInput("");
      setValidationAttempted(false);
      setIsValidCode(false);

    } catch (error) {
      console.error('Erro ao validar motorista:', error);
      toast({
        title: "Erro",
        description: "Não foi possível validar o motorista",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!orderInfo) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Pedido não encontrado</p>
        </CardContent>
      </Card>
    );
  }

  if (orderInfo.validado_para_coleta) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Coleta Já Validada
              </h3>
              <p className="text-sm text-green-700 dark:text-green-200">
                Este pedido já foi liberado para coleta
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informações do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Informações do Pedido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Código de Rastreio</Label>
              <p className="font-mono font-semibold">{orderInfo.tracking_code}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Tipo de Serviço</Label>
              <p className="font-semibold">{orderInfo.service_type}</p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-muted-foreground">Origem</Label>
              <p className="text-sm">{orderInfo.origin_address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validação por Código */}
      <Card>
        <CardHeader>
          <CardTitle>1. Validação por Código</CardTitle>
          <CardDescription>
            Solicite ao motorista o código de 6 dígitos exibido no aplicativo dele
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="codigo">Código de Validação</Label>
              <Input
                id="codigo"
                placeholder="Ex: A3B5C7"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                maxLength={6}
                className="font-mono text-lg"
                disabled={validating}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleVerifyCode}
                disabled={validating || !codigoInput.trim()}
              >
                {validating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar"
                )}
              </Button>
            </div>
          </div>

          {validationAttempted && (
            <Alert variant={isValidCode ? "default" : "destructive"}>
              {isValidCode ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {isValidCode 
                  ? "✓ Código válido! Confirme a identidade do motorista abaixo antes de liberar."
                  : "✗ Código inválido. Verifique e tente novamente."
                }
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Informações do Motorista */}
      {isValidCode && driverInfo && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>2. Confirmação Visual do Motorista</CardTitle>
              <CardDescription>
                Verifique se a pessoa presente corresponde aos dados do motorista cadastrado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Foto e Nome */}
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24 border-2 border-primary">
                  {driverInfo.foto_perfil_url ? (
                    <AvatarImage src={driverInfo.foto_perfil_url} alt={driverInfo.full_name} />
                  ) : (
                    <AvatarFallback>
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="text-2xl font-bold">{driverInfo.full_name}</h3>
                  <Badge variant="outline" className="mt-1">Motorista Aprovado</Badge>
                </div>
              </div>

              <Separator />

              {/* Dados do Motorista */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <IdCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <Label className="text-muted-foreground">CPF</Label>
                    <p className="font-mono">{driverInfo.cpf}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <Label className="text-muted-foreground">Telefone</Label>
                    <p className="font-mono">{driverInfo.phone}</p>
                  </div>
                </div>

                {driverInfo.cnh_number && (
                  <>
                    <div className="flex items-start gap-3">
                      <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <Label className="text-muted-foreground">CNH</Label>
                        <p className="font-mono">{driverInfo.cnh_number}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <Label className="text-muted-foreground">Categoria</Label>
                        <p className="font-semibold">{driverInfo.cnh_category}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Solicite um documento de identificação com foto (CNH ou RG) e
                  confirme que os dados correspondem ao motorista cadastrado antes de liberar a coleta.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Botão de Confirmação */}
          <Card className="border-primary">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" id="confirm-identity" className="rounded" required />
                  <label htmlFor="confirm-identity">
                    Confirmo que verifiquei a identidade do motorista e ele está autorizado a coletar esta carga
                  </label>
                </div>

                <Button 
                  onClick={handleConfirmValidation}
                  disabled={validating}
                  size="lg"
                  className="w-full"
                >
                  {validating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Liberar Coleta
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ShipperValidateDriver;
