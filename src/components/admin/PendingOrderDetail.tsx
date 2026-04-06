import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DriverSuggestions } from './DriverSuggestions';
import {
  Package,
  MapPin,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  AlertCircle,
  Upload,
  MapIcon,
  UserCheck,
  Save,
} from 'lucide-react';

interface PendingOrderDetailProps {
  order: {
    id: string;
    tracking_code: string;
    origin_address: string;
    destination_address: string;
    origin_cep: string;
    destination_cep: string;
    weight_kg: number;
    height_cm?: number;
    width_cm?: number;
    length_cm?: number;
    service_type: string;
    final_price: number;
    base_price?: number;
    commission_applied?: number;
    comissao_logimarket_perc?: number;
    status: string;
    carrier_name: string | null;
    created_at: string;
    user_id: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const PendingOrderDetail = ({ order, open, onOpenChange, onUpdate }: PendingOrderDetailProps) => {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [driverInstructions, setDriverInstructions] = useState('');
  const [operationalNotes, setOperationalNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [carrierDetails, setCarrierDetails] = useState<any>(null);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // Resetar estados quando o modal fecha ou quando muda de pedido
  useEffect(() => {
    if (!open) {
      // Limpar todos os estados quando fecha o modal
      setApprovalNotes('');
      setRejectionReason('');
      setDriverInstructions('');
      setOperationalNotes('');
      setSelectedDriverId('');
      setUserDetails(null);
      setCarrierDetails(null);
      setCurrentOrderId(null);
    }
  }, [open]);

  // Buscar detalhes do usuário e transportadora quando o modal abrir ou mudar de pedido
  useEffect(() => {
    if (order && open && order.id !== currentOrderId) {
      // Limpar estados do pedido anterior
      setApprovalNotes('');
      setRejectionReason('');
      setDriverInstructions('');
      setOperationalNotes('');
      setSelectedDriverId('');
      setCarrierDetails(null);
      setCurrentOrderId(order.id);
      
      const fetchDetails = async () => {
        // Buscar motoristas aprovados disponíveis
        const { data: drivers } = await supabase
          .from('driver_profiles')
          .select('id, full_name, phone, cpf')
          .eq('status', 'approved');
        
        if (drivers) {
          setAvailableDrivers(drivers);
        }

        // Buscar dados da transportadora escolhida
        if (order.carrier_name) {
          const { data: carrier, error } = await supabase
            .from('carriers')
            .select('id, name, contact_name, contact_phone, contact_email, contact_whatsapp, commercial_notes')
            .eq('name', order.carrier_name)
            .single();

          if (!error && carrier) {
            setCarrierDetails(carrier);
          }
        }

        // Buscar dados completos do pedido (incluindo driver_id existente)
        const { data: orderData } = await supabase
          .from('orders')
          .select('operational_notes, driver_id')
          .eq('id', order.id)
          .single();

        if (orderData?.operational_notes) {
          setOperationalNotes(orderData.operational_notes);
        }
        
        if (orderData?.driver_id) {
          setSelectedDriverId(orderData.driver_id);
        }
        
        // Buscar dados reais do embarcador (usuário que criou o pedido)
        if (order.user_id) {
          const { data: userProfile, error: userError } = await supabase
            .from('profiles')
            .select('full_name, phone, company_name, cnpj, email')
            .eq('user_id', order.user_id)
            .single();

          if (!userError && userProfile) {
            setUserDetails({
              full_name: userProfile.company_name || userProfile.full_name || 'Não informado',
              email: userProfile.email || 'Não disponível',
              phone: userProfile.phone || 'Não informado',
              cpf: userProfile.cnpj || 'Não informado'
            });
          } else {
            // Fallback se não encontrar perfil
            setUserDetails({
              full_name: 'Usuário não encontrado',
              email: 'Não disponível',
              phone: 'Não disponível',
              cpf: 'Não disponível'
            });
          }
        }
      };
      fetchDetails();
    }
  }, [order, open, currentOrderId]);

  if (!order) return null;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Salvar notas sem aprovar (permite salvar progresso)
  const handleSaveNotes = async () => {
    if (!operationalNotes.trim() && !selectedDriverId) {
      toast({
        title: 'Nada para Salvar',
        description: 'Adicione notas ou selecione um motorista para salvar',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const updateData: any = {
        operational_notes: operationalNotes,
        updated_at: new Date().toISOString(),
      };

      // Se tiver motorista selecionado, atribuir também
      if (selectedDriverId) {
        const selectedDriver = availableDrivers.find(d => d.id === selectedDriverId);
        updateData.driver_id = selectedDriverId;
        updateData.driver_name = selectedDriver?.full_name;
        updateData.driver_phone = selectedDriver?.phone;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: 'Dados Salvos',
        description: 'Notas e informações salvas com sucesso. O pedido continua pendente.',
      });

      onUpdate();
    } catch (error) {
      console.error('Erro ao salvar notas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar notas',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async () => {
    // Validação de campos obrigatórios
    if (!operationalNotes.trim()) {
      toast({
        title: 'Campo Obrigatório',
        description: 'Por favor, adicione notas operacionais antes de aprovar',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const selectedDriver = selectedDriverId 
        ? availableDrivers.find(d => d.id === selectedDriverId) 
        : null;
      
      // Se tem motorista selecionado, vai para awaiting_driver_acceptance
      // Se não tem, vai para confirmed (transportadora cuida da logística)
      const newStatus = selectedDriverId ? 'awaiting_driver_acceptance' : 'confirmed';
      
      const updateData: any = {
        status: newStatus,
        operational_notes: operationalNotes,
        updated_at: new Date().toISOString(),
      };

      // Só adiciona dados do motorista se um foi selecionado
      if (selectedDriver) {
        updateData.driver_id = selectedDriverId;
        updateData.driver_name = selectedDriver.full_name;
        updateData.driver_phone = selectedDriver.phone;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order.id);

      if (error) throw error;

      // Enviar notificação por email ao motorista (apenas se tiver motorista)
      if (selectedDriverId) {
        await notifyDriverAssignment(selectedDriverId, order.id);
      }

      // Registrar auditoria
      await logAction({
        action: 'order_approval',
        metadata: {
          order_id: order.id,
          tracking_code: order.tracking_code,
          carrier_name: order.carrier_name,
          driver_id: selectedDriverId || null,
          driver_name: selectedDriver?.full_name || null,
          status: newStatus,
          approved_at: new Date().toISOString(),
        },
      });

      if (selectedDriver) {
        toast({
          title: '🚚 Frete Enviado ao Motorista',
          description: `Aguardando ${selectedDriver.full_name} aceitar o frete.`,
        });
      } else {
        toast({
          title: '✅ Pedido Confirmado',
          description: `Pedido ${order.tracking_code} confirmado. A transportadora ${order.carrier_name} cuidará da logística.`,
        });
      }

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao aprovar pedido:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao aprovar pedido',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    // Validação do motivo de rejeição
    if (!rejectionReason.trim()) {
      toast({
        title: 'Motivo Obrigatório',
        description: 'Por favor, informe o motivo da rejeição',
        variant: 'destructive',
      });
      return;
    }

    if (rejectionReason.trim().length < 10) {
      toast({
        title: 'Motivo Insuficiente',
        description: 'O motivo da rejeição deve ter pelo menos 10 caracteres',
        variant: 'destructive',
      });
      return;
    }

    if (rejectionReason.length > 500) {
      toast({
        title: 'Motivo Muito Longo',
        description: 'O motivo da rejeição deve ter no máximo 500 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'rejected',
          operational_notes: `REJEITADO: ${rejectionReason}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      // Registrar auditoria
      await logAction({
        action: 'admin_access',
        reason: rejectionReason,
        metadata: {
          action_type: 'order_rejection',
          order_id: order.id,
          tracking_code: order.tracking_code,
          carrier_name: order.carrier_name,
          rejected_at: new Date().toISOString(),
        },
      });

      toast({
        title: 'Pedido Rejeitado',
        description: 'O pedido foi rejeitado com sucesso',
      });

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao rejeitar pedido:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao rejeitar pedido',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const notifyDriverAssignment = async (driverId: string, orderId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('notify-driver-assignment', {
        body: { orderId, driverId }
      });
      
      if (error) {
        console.error('Erro ao enviar notificação:', error);
      } else if (data?.success) {
        console.log('Notificação enviada para:', data.driverEmail);
      }
    } catch (err) {
      console.error('Erro ao notificar motorista:', err);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriverId) {
      toast({
        title: 'Motorista não selecionado',
        description: 'Por favor, selecione um motorista',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const selectedDriver = availableDrivers.find(d => d.id === selectedDriverId);
      
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'awaiting_driver_acceptance', // Aguardar aceite do motorista
          driver_id: selectedDriverId,
          driver_name: selectedDriver?.full_name,
          driver_phone: selectedDriver?.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      // Enviar notificação por email ao motorista
      await notifyDriverAssignment(selectedDriverId, order.id);

      // Registrar auditoria
      await logAction({
        action: 'freight_assignment',
        metadata: {
          order_id: order.id,
          tracking_code: order.tracking_code,
          driver_id: selectedDriverId,
          driver_name: selectedDriver?.full_name,
          driver_cpf: selectedDriver?.cpf,
          assigned_at: new Date().toISOString(),
        },
      });

      toast({
        title: 'Motorista Atribuído',
        description: `Frete enviado para ${selectedDriver?.full_name}. Aguardando aceite do motorista.`,
      });

      onUpdate();
    } catch (error) {
      console.error('Erro ao atribuir motorista:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atribuir motorista',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const commissionPerc = order.comissao_logimarket_perc || order.commission_applied || 0;
  const basePrice = order.base_price || (order.final_price / (1 + commissionPerc));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Detalhes do Pedido - Operação Manual
          </DialogTitle>
          <DialogDescription>
            Ficha completa para contato com transportadora e gestão manual do frete
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 1. IDENTIFICAÇÃO E DADOS DA CARGA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Identificação e Dados da Carga
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Código do Pedido</p>
                  <p className="font-mono font-semibold text-lg text-primary">
                    {order.tracking_code}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Serviço</p>
                  <Badge variant="secondary" className="mt-1">
                    {order.service_type || 'LTL - Carga Fracionada'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Peso</p>
                  <p className="font-semibold text-lg">{order.weight_kg} kg</p>
                  <p className="text-xs text-muted-foreground">
                    {(order.weight_kg / 1000).toFixed(2)} toneladas
                  </p>
                </div>
                {order.length_cm && order.width_cm && order.height_cm && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Dimensões (cm)</p>
                      <p className="font-medium">
                        {order.length_cm} × {order.width_cm} × {order.height_cm}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Volume</p>
                      <p className="font-medium">
                        {((order.length_cm * order.width_cm * order.height_cm) / 1000000).toFixed(2)} m³
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2. ROTA */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Origem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">CEP</p>
                  <p className="font-mono font-semibold">{order.origin_cep}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Endereço Completo</p>
                  <p className="font-medium">{order.origin_address}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-accent" />
                  Destino
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">CEP</p>
                  <p className="font-mono font-semibold">{order.destination_cep}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Endereço Completo</p>
                  <p className="font-medium">{order.destination_address}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. INFORMAÇÕES DE CONTATO */}
          {userDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Informações do Embarcador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome/Razão Social</p>
                    <p className="font-semibold">{userDetails.full_name || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                    <p className="font-mono">{userDetails.cpf || userDetails.cnpj || 'Não informado'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{userDetails.phone || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{userDetails.email || 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <a href={`tel:${userDetails.phone}`}>
                      <Phone className="h-4 w-4" />
                      Ligar
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <a href={`mailto:${userDetails.email}`}>
                      <Mail className="h-4 w-4" />
                      Enviar Email
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4. DADOS COMERCIAIS DA TRANSPORTADORA */}
          {order.carrier_name && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Transportadora Escolhida - Dados para Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-background rounded-lg p-4 border-2 border-primary/30">
                  <h3 className="font-bold text-xl text-primary mb-4">{order.carrier_name}</h3>
                  
                  {carrierDetails ? (
                    <>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        {carrierDetails.contact_name && (
                          <div>
                            <p className="text-sm text-muted-foreground">Contato Comercial</p>
                            <p className="font-semibold">{carrierDetails.contact_name}</p>
                          </div>
                        )}
                        
                        {carrierDetails.contact_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Telefone</p>
                              <p className="font-medium">{carrierDetails.contact_phone}</p>
                            </div>
                          </div>
                        )}
                        
                        {carrierDetails.contact_whatsapp && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-secondary" />
                            <div>
                              <p className="text-sm text-muted-foreground">WhatsApp</p>
                              <p className="font-medium">{carrierDetails.contact_whatsapp}</p>
                            </div>
                          </div>
                        )}
                        
                        {carrierDetails.contact_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Email</p>
                              <p className="font-medium">{carrierDetails.contact_email}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {carrierDetails.commercial_notes && (
                        <div className="bg-muted/50 rounded p-3 mb-4">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Notas de Parceria:</p>
                          <p className="text-sm">{carrierDetails.commercial_notes}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {carrierDetails.contact_phone && (
                          <Button variant="default" size="sm" className="gap-2" asChild>
                            <a href={`tel:${carrierDetails.contact_phone}`}>
                              <Phone className="h-4 w-4" />
                              Ligar Agora
                            </a>
                          </Button>
                        )}
                        {carrierDetails.contact_whatsapp && (
                          <Button variant="secondary" size="sm" className="gap-2" asChild>
                            <a 
                              href={`https://wa.me/${carrierDetails.contact_whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Phone className="h-4 w-4" />
                              WhatsApp
                            </a>
                          </Button>
                        )}
                        {carrierDetails.contact_email && (
                          <Button variant="outline" size="sm" className="gap-2" asChild>
                            <a href={`mailto:${carrierDetails.contact_email}`}>
                              <Mail className="h-4 w-4" />
                              Email
                            </a>
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <AlertCircle className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Dados comerciais não cadastrados para esta transportadora
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cadastre os dados de contato em Gestão de Transportadoras
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="operational-notes">Notas de Contato com a Transportadora</Label>
                  <Textarea
                    id="operational-notes"
                    placeholder="Registre aqui suas conversas: data/hora do contato, pessoa que atendeu, confirmação de disponibilidade, preço negociado, prazo acordado, etc."
                    value={operationalNotes}
                    onChange={(e) => setOperationalNotes(e.target.value)}
                    rows={5}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Dica: Registre todos os contatos para histórico e auditoria
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 5. DETALHES FINANCEIROS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Detalhamento Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Preço Base</p>
                  <p className="font-semibold text-lg">{formatCurrency(basePrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preço Final (Cliente)</p>
                  <p className="font-bold text-2xl text-primary">
                    {formatCurrency(order.final_price)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6. ATRIBUIÇÃO DE MOTORISTA (OPCIONAL) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">Opcional</Badge>
              <span>A transportadora escolhida pode designar o motorista internamente</span>
            </div>

            {/* Sugestão Inteligente de Motoristas */}
            <DriverSuggestions
              orderId={order.id}
              selectedDriverId={selectedDriverId}
              onSelectDriver={(driverId, driverName, driverPhone) => {
                setSelectedDriverId(driverId);
                const existingDriver = availableDrivers.find(d => d.id === driverId);
                if (!existingDriver) {
                  setAvailableDrivers(prev => [...prev, {
                    id: driverId,
                    full_name: driverName,
                    phone: driverPhone,
                    cpf: ''
                  }]);
                }
              }}
            />

            {/* Seleção Manual de Motorista */}
            <Card className="border-dashed border-muted-foreground/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                  <UserCheck className="h-5 w-5" />
                  Motorista (Opcional)
                  {selectedDriverId && (
                    <Badge className="bg-primary text-primary-foreground text-xs ml-2">Selecionado</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="driver-select">Selecionar Motorista Aprovado</Label>
                  <div className="flex gap-2">
                    <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                      <SelectTrigger id="driver-select">
                        <SelectValue placeholder="Nenhum — transportadora designa internamente" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDrivers.length > 0 ? (
                          availableDrivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.full_name} - {driver.cpf || 'CPF N/A'} - {driver.phone}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            Nenhum motorista aprovado disponível
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedDriverId && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSelectedDriverId('')}
                        title="Remover motorista"
                      >
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  💡 Se não selecionar um motorista, o pedido será confirmado diretamente com a transportadora
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 7. DOCUMENTAÇÃO E PREPARAÇÃO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentação e Preparação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nfe">Nota Fiscal (NFe)</Label>
                  <div className="flex gap-2">
                    <Input id="nfe" type="file" accept=".pdf,.xml" />
                    <Button variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Anexar ou gerar nota fiscal do frete
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mdfe">MDFe / CT-e</Label>
                  <div className="flex gap-2">
                    <Input id="mdfe" type="file" accept=".pdf,.xml" />
                    <Button variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Documentos de transporte obrigatórios
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instruções para o Motorista</Label>
                <Textarea
                  id="instructions"
                  placeholder="Informações adicionais para coleta, horários, detalhes específicos do local, contatos no destino, etc."
                  value={driverInstructions}
                  onChange={(e) => setDriverInstructions(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* 7. AÇÕES DO ADMINISTRADOR */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Ações Administrativas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="approval-notes">Notas de Aprovação (Opcional)</Label>
                <Textarea
                  id="approval-notes"
                  placeholder="Observações internas sobre a aprovação deste pedido..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Motivo da Rejeição (Obrigatório se rejeitar)</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Informe detalhadamente o motivo da rejeição deste pedido..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={2}
                />
              </div>

              <Separator />

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSaveNotes}
                  disabled={processing}
                  variant="secondary"
                  className="gap-2 flex-1 min-w-[180px]"
                >
                  <Save className="h-4 w-4" />
                  {processing ? 'Salvando...' : 'Salvar Progresso'}
                </Button>

                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="gap-2 flex-1 min-w-[180px]"
                >
                  <CheckCircle className="h-4 w-4" />
                  {processing ? 'Processando...' : 'Aprovar e Confirmar'}
                </Button>

                <Button
                  onClick={handleReject}
                  disabled={processing}
                  variant="destructive"
                  className="gap-2 flex-1 min-w-[180px]"
                >
                  <XCircle className="h-4 w-4" />
                  {processing ? 'Processando...' : 'Rejeitar Pedido'}
                </Button>

                <Button
                  variant="outline"
                  disabled
                  className="gap-2 flex-1 min-w-[180px]"
                  title="Rastreamento estará disponível após aprovação e início da execução"
                >
                  <MapIcon className="h-4 w-4" />
                  Rastreamento (Bloqueado)
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                ⚠️ O rastreamento só estará disponível após a aprovação e início da execução do frete
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
