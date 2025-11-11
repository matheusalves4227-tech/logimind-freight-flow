import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [driverInstructions, setDriverInstructions] = useState('');
  const [processing, setProcessing] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);

  // Buscar detalhes do usuário quando o modal abrir
  useEffect(() => {
    if (order?.user_id && open) {
      const fetchUserDetails = async () => {
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
      fetchUserDetails();
    }
  }, [order?.user_id, open]);

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
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: 'Pedido Aprovado',
        description: 'O pedido foi aprovado e está pronto para atribuição de motorista',
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

  const commissionPerc = order.comissao_logimarket_perc || order.commission_applied || 0;
  const basePrice = order.base_price || (order.final_price / (1 + commissionPerc));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Detalhes do Pedido Pendente
          </DialogTitle>
          <DialogDescription>
            Ficha completa para validação, preparação e execução do frete
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

          {/* 4. DETALHES FINANCEIROS */}
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

          {/* 5. DOCUMENTAÇÃO E PREPARAÇÃO */}
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

          {/* 6. AÇÕES DO ADMINISTRADOR */}
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
                  {processing ? 'Processando...' : 'Aprovar Pedido'}
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
