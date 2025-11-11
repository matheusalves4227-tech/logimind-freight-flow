import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, DollarSign, Calendar, CheckCircle } from "lucide-react";
import { formatarMoeda } from "@/lib/formatters";

interface DriverStatusProps {
  driverProfile: any;
}

export const DriverStatus = ({ driverProfile }: DriverStatusProps) => {
  const [isOnline, setIsOnline] = useState(false);
  const [expiringDocs, setExpiringDocs] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [nextPayment, setNextPayment] = useState<Date | null>(null);

  useEffect(() => {
    checkExpiringDocuments();
    loadFinancialData();
  }, [driverProfile]);

  const checkExpiringDocuments = async () => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Verificar CNH
    const { data: cnhData } = await supabase
      .from('driver_cnh_data')
      .select('*')
      .eq('driver_profile_id', driverProfile.id)
      .single();

    // Verificar veículos (CRLV)
    const { data: vehicles } = await supabase
      .from('driver_vehicles')
      .select('*')
      .eq('driver_profile_id', driverProfile.id);

    const expiring: any[] = [];

    if (cnhData && new Date(cnhData.expiry_date) <= thirtyDaysFromNow) {
      expiring.push({ type: 'CNH', date: cnhData.expiry_date });
    }

    vehicles?.forEach(vehicle => {
      if (vehicle.crlv_expiry_date && new Date(vehicle.crlv_expiry_date) <= thirtyDaysFromNow) {
        expiring.push({ 
          type: `CRLV - ${vehicle.license_plate}`, 
          date: vehicle.crlv_expiry_date 
        });
      }
    });

    setExpiringDocs(expiring);
  };

  const loadFinancialData = () => {
    // Mock data - em produção, viria de uma tabela de pagamentos
    setBalance(4850.00);
    const next = new Date();
    next.setDate(next.getDate() + 15);
    setNextPayment(next);
  };

  const handleToggleAvailability = async (checked: boolean) => {
    setIsOnline(checked);
    
    // Atualizar status no backend (futuramente)
    // await supabase
    //   .from('driver_availability')
    //   .upsert({ 
    //     driver_profile_id: driverProfile.id, 
    //     is_available: checked,
    //     last_location: ...
    //   });
  };

  return (
    <div className="space-y-6">
      {/* Toggle de Disponibilidade */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Status de Disponibilidade</span>
            <Badge variant={isOnline ? "default" : "secondary"} className="text-sm">
              {isOnline ? "ONLINE" : "OFFLINE"}
            </Badge>
          </CardTitle>
          <CardDescription>
            {isOnline 
              ? "Você está recebendo notificações de novas cargas próximas"
              : "Ative para começar a receber ofertas de frete"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`h-4 w-4 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="font-medium">
                {isOnline ? "Disponível para receber cargas" : "Indisponível"}
              </span>
            </div>
            <Switch 
              checked={isOnline} 
              onCheckedChange={handleToggleAvailability}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* KPIs Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo a Receber
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatarMoeda(balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Referente a 3 entregas concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próximo Pagamento
            </CardTitle>
            <Calendar className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {nextPayment?.toLocaleDateString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Prazo estimado de repasse
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Documentos Expirando */}
      {expiringDocs.length > 0 && (
        <Alert variant="destructive" className="border-orange-500 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="font-semibold mb-2">Atenção: Documentos próximos da expiração</div>
            <ul className="space-y-1 text-sm">
              {expiringDocs.map((doc, index) => (
                <li key={index}>
                  • {doc.type}: Expira em {new Date(doc.date).toLocaleDateString('pt-BR')}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Status de Aprovação */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Perfil Aprovado</p>
              <p className="text-sm text-green-700">
                Você está habilitado para dar lances e receber cargas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
