import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Truck, Calendar, MapPin, Phone, Mail, CreditCard, Clock, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminDriverHistoryProps {
  driverId: string;
  driverName: string;
}

export const AdminDriverHistory = ({ driverId, driverName }: AdminDriverHistoryProps) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchDriverFullProfile();
  }, [driverId]);

  const fetchDriverFullProfile = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('driver_profiles')
        .select(`
          *,
          vehicles:driver_vehicles(*),
          cnh:driver_cnh_data(*),
          documents:driver_documents(*)
        `)
        .eq('id', driverId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Erro ao buscar perfil completo:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) return <p className="text-muted-foreground">Perfil não encontrado</p>;

  return (
    <div className="space-y-6">
      {/* Header com foto e info básica */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.foto_perfil_url || ''} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">CPF: {profile.cpf}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={profile.status === 'approved' ? 'default' : profile.status === 'suspended' ? 'destructive' : 'secondary'}>
                  {profile.status === 'approved' ? 'Ativo' : profile.status === 'suspended' ? 'Suspenso' : 'Pendente'}
                </Badge>
                {profile.approved_at && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Aprovado em {new Date(profile.approved_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Informações de Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações de Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Telefone:</span>
            <span>{profile.phone}</span>
          </div>
          {profile.whatsapp && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">WhatsApp:</span>
              <span>{profile.whatsapp}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Email:</span>
            <span>{profile.email}</span>
          </div>
          <Separator />
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Endereço:</span>
            <span>{profile.address_street}, {profile.address_number} - {profile.address_city}/{profile.address_state}</span>
          </div>
          <div className="text-sm">
            <span className="font-medium">CEP:</span> {profile.address_cep}
          </div>
        </CardContent>
      </Card>

      {/* Dados Bancários */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados Bancários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.pix_key ? (
            <>
              <div className="flex items-center gap-3 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Chave PIX ({profile.pix_key_type}):</span>
                <span className="font-mono">{profile.pix_key}</span>
              </div>
            </>
          ) : profile.bank_name ? (
            <>
              <div className="flex items-center gap-3 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Banco:</span>
                <span>{profile.bank_name}</span>
              </div>
              {profile.bank_agency && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium">Agência:</span>
                  <span>{profile.bank_agency}</span>
                </div>
              )}
              {profile.bank_account_number && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium">Conta:</span>
                  <span>{profile.bank_account_number}-{profile.bank_account_digit}</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Dados bancários não cadastrados</p>
          )}
        </CardContent>
      </Card>

      {/* Veículos */}
      {profile.vehicles && profile.vehicles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Veículos Cadastrados ({profile.vehicles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.vehicles.map((vehicle: any) => (
                <div key={vehicle.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{vehicle.license_plate}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {vehicle.vehicle_type.replace(/_/g, ' ')} - {vehicle.brand || 'Marca não informada'} {vehicle.model || ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Capacidade: {vehicle.max_weight_kg}kg
                      {vehicle.max_volume_m3 && ` | ${vehicle.max_volume_m3}m³`}
                    </p>
                  </div>
                  <Badge variant={vehicle.is_verified ? 'default' : 'secondary'}>
                    {vehicle.is_verified ? 'Verificado' : 'Pendente'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentos */}
      {profile.documents && profile.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos Enviados ({profile.documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {profile.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="text-sm font-medium capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      Enviado em {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge variant={doc.is_verified ? 'default' : 'secondary'}>
                    {doc.is_verified ? 'Verificado' : 'Pendente'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notas de Aprovação */}
      {profile.approval_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Notas de Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{profile.approval_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
