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

  // Buscar detalhes do usuário e transportadora quando o modal abrir
  useEffect(() => {
    if (order && open) {
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

        // Buscar notas operacionais existentes do pedido
        const { data: orderData } = await supabase
          .from('orders')
          .select('operational_notes')
          .eq('id', order.id)
          .single();

        if (orderData?.operational_notes) {
          setOperationalNotes(orderData.operational_notes);
        }
        
        // Buscar email do auth.users via RPC ou usar os dados do order
        // Como não temos acesso direto a auth.users, vamos usar uma abordagem alternativa
        const { data: { user } } = await supabase.auth.getUser();
        
        // Por enquanto, vamos apenas setar um placeholder
        // Em produção, seria necessário criar uma view ou RPC para buscar dados do usuário
        setUserDetails({
          full_name: 'Embarcador',
          email: 'contato@example.com',
          phone: '(11) 99999-9999',
          cpf: 'Não disponível'
        });
      };
      fetchDetails();
    }
  }, [order, open]);

  if (!order) return null;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          operational_notes: operationalNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: 'Pedido Aprovado',
        description: 'O pedido foi aprovado e está pronto para operação',
      });

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
    if (!rejectionReason.trim()) {
      toast({
        title: 'Motivo Obrigatório',
        description: 'Por favor, informe o motivo da rejeição',
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

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
          driver_id: selectedDriverId,
          driver_name: selectedDriver?.full_name,
          driver_phone: selectedDriver?.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

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
        description: `Frete atribuído para ${selectedDriver?.full_name}`,
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
                Detalhamento Financeiro LogiMind
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Preço Base</p>
                  <p className="font-semibold text-lg">{formatCurrency(basePrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comissão LogiMind</p>
                  <p className="font-semibold text-lg text-primary">
                    {(commissionPerc * 100).toFixed(2)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(order.final_price - basePrice)}
                  </p>
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

          {/* 6. ATRIBUIÇÃO DE MOTORISTA */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Atribuir Motorista ao Frete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="driver-select">Selecionar Motorista Aprovado</Label>
                <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                  <SelectTrigger id="driver-select">
                    <SelectValue placeholder="Escolha um motorista..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.length > 0 ? (
                      availableDrivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.full_name} - {driver.cpf} - {driver.phone}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        Nenhum motorista aprovado disponível
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleAssignDriver}
                disabled={!selectedDriverId || processing}
                className="w-full"
              >
                {processing ? (
                  <>Atribuindo...</>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Atribuir Frete ao Motorista
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground">
                ⚠️ Esta ação registrará o motorista responsável pelo frete e será registrada em auditoria
              </p>
            </CardContent>
          </Card>

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
                  onClick={handleApprove}
                  disabled={processing}
                  className="gap-2 flex-1 min-w-[200px]"
                >
                  <CheckCircle className="h-4 w-4" />
                  {processing ? 'Processando...' : 'Confirmar Contato Feito'}
                </Button>

                <Button
                  onClick={handleReject}
                  disabled={processing}
                  variant="destructive"
                  className="gap-2 flex-1 min-w-[200px]"
                >
                  <XCircle className="h-4 w-4" />
                  {processing ? 'Processando...' : 'Rejeitar Pedido'}
                </Button>

                <Button
                  variant="outline"
                  disabled
                  className="gap-2 flex-1 min-w-[200px]"
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
