import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Loader2, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PendingPayout {
  id: string;
  tracking_code: string;
  final_price: number;
  comissao_logimarket_val: number;
  valor_repasse_liquido: number;
  repasse_data_limite: string | null;
  motorista_nome: string;
  pix_key_type: string | null;
  pix_key: string | null;
  bank_name: string | null;
  prioridade: string;
}

export const PendingPayoutsTable = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<PendingPayout | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchPendingPayouts();
  }, []);

  const fetchPendingPayouts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_pedidos_para_repasse');

      if (error) throw error;

      setPendingPayouts(data || []);
    } catch (error) {
      console.error('Erro ao buscar repasses pendentes:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar repasses pendentes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async (payout: PendingPayout) => {
    setSelectedPayout(payout);
    setDialogOpen(true);
  };

  const confirmProcessPayout = async () => {
    if (!selectedPayout) return;

    try {
      setProcessing(selectedPayout.id);
      setDialogOpen(false);

      console.log('[PAYOUT] Processando repasse:', selectedPayout.id);

      const { data, error } = await supabase.functions.invoke('processar-repasse-agora', {
        body: { order_id: selectedPayout.id },
      });

      if (error) {
        console.error('[PAYOUT] Erro na chamada:', error);
        toast({
          title: 'Erro ao processar repasse',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      console.log('[PAYOUT] Resposta recebida:', data);

      if (data.success) {
        toast({
          title: '✅ Repasse Processado!',
          description: `${data.data.motorista} - ${formatCurrency(data.data.valor_repassado)}`,
        });
        // Recarregar lista
        await fetchPendingPayouts();
      }
    } catch (error) {
      console.error('[PAYOUT] Erro não tratado:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
      setSelectedPayout(null);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getPriorityBadge = (prioridade: string) => {
    const configs = {
      vencido: { label: 'Vencido', className: 'bg-destructive text-destructive-foreground' },
      urgente: { label: 'Urgente', className: 'bg-accent text-accent-foreground' },
      normal: { label: 'Normal', className: 'bg-secondary text-secondary-foreground' },
    };
    
    const config = configs[prioridade as keyof typeof configs] || configs.normal;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card className="card-logimarket">
        <CardContent className="pt-12 pb-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="card-logimarket">
        <CardHeader>
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-accent" />
            <div>
              <CardTitle>Fila de Repasses Pendentes</CardTitle>
              <CardDescription>
                Pedidos entregues aguardando aprovação para repasse ao motorista
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pendingPayouts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-secondary mx-auto mb-4" />
              <p className="text-foreground font-medium">Nenhum repasse pendente</p>
              <p className="text-sm text-muted-foreground mt-2">
                Todos os repasses foram processados
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cód. Pedido</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Valor Repasse</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Data Limite</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayouts.map((payout) => (
                    <TableRow key={payout.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium font-mono text-sm">
                            {payout.tracking_code}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Total: {formatCurrency(payout.final_price)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-medium">{payout.motorista_nome}</span>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-lg text-primary">
                            {formatCurrency(payout.valor_repasse_liquido)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Comissão: {formatCurrency(payout.comissao_logimarket_val)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {payout.pix_key ? (
                          <div className="flex flex-col text-sm">
                            <span className="font-medium text-secondary">PIX</span>
                            <span className="text-muted-foreground">
                              {payout.pix_key_type}
                            </span>
                          </div>
                        ) : payout.bank_name ? (
                          <div className="flex flex-col text-sm">
                            <span className="font-medium text-primary">Transferência</span>
                            <span className="text-muted-foreground">
                              {payout.bank_name}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Sem dados</span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(payout.repasse_data_limite)}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {getPriorityBadge(payout.prioridade)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleProcessPayout(payout)}
                          disabled={processing === payout.id}
                          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        >
                          {processing === payout.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <DollarSign className="mr-2 h-4 w-4" />
                              Processar Repasse
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Processamento de Repasse</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {selectedPayout && (
                <>
                  <p>Você está prestes a processar o repasse:</p>
                  <div className="bg-muted p-4 rounded space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pedido:</span>
                      <span className="font-bold">{selectedPayout.tracking_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Motorista:</span>
                      <span className="font-bold">{selectedPayout.motorista_nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor:</span>
                      <span className="font-bold text-primary text-lg">
                        {formatCurrency(selectedPayout.valor_repasse_liquido)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Método:</span>
                      <span className="font-bold">
                        {selectedPayout.pix_key ? 'PIX' : 'Transferência Bancária'}
                      </span>
                    </div>
                  </div>
                  <p className="text-destructive font-medium">
                    ⚠️ Esta ação não pode ser desfeita. O valor será transferido da conta-custódia para o motorista.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmProcessPayout}
              className="bg-secondary hover:bg-secondary/90"
            >
              Confirmar Repasse
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
