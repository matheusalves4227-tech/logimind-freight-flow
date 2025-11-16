import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';

interface PaymentResult {
  success: boolean;
  message?: string;
  data?: {
    order_id: string;
    valor_total: number;
    comissao_logimarket: number;
    valor_repassado: number;
    status_pagamento: string;
    transaction_id: string;
  };
  error?: string;
}

export const PaymentTestPanel = () => {
  const { toast } = useToast();
  const [orderId, setOrderId] = useState('3d2cc146-72a9-4d0b-98f2-fa0a932757b8');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);

  const testPayment = async () => {
    try {
      setLoading(true);
      setResult(null);

      console.log('[TEST] Chamando edge function concluir-pagamento...');

      const { data, error } = await supabase.functions.invoke('concluir-pagamento', {
        body: { order_id: orderId },
      });

      if (error) {
        console.error('[TEST] Erro na chamada:', error);
        setResult({
          success: false,
          error: error.message,
        });
        
        toast({
          title: 'Erro ao processar repasse',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      console.log('[TEST] Resposta recebida:', data);
      setResult(data as PaymentResult);

      if (data.success) {
        toast({
          title: '✅ Repasse Processado!',
          description: `Valor repassado: R$ ${data.data.valor_repassado.toFixed(2)}`,
        });
      }
    } catch (error) {
      console.error('[TEST] Erro não tratado:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setResult({
        success: false,
        error: errorMessage,
      });

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  return (
    <Card className="card-logimarket">
      <CardHeader>
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>🧪 Teste de Repasse Financeiro</CardTitle>
            <CardDescription>
              Teste a Edge Function concluir-pagamento (LM-DEMO-004)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input do Order ID */}
        <div className="space-y-2">
          <Label htmlFor="orderId">Order ID (UUID)</Label>
          <Input
            id="orderId"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="UUID do pedido"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Pedido LM-DEMO-004 pré-configurado para teste
          </p>
        </div>

        {/* Botão de Teste */}
        <Button
          onClick={testPayment}
          disabled={loading || !orderId}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processando Repasse...
            </>
          ) : (
            <>
              <DollarSign className="mr-2 h-5 w-5" />
              Executar Repasse de Teste
            </>
          )}
        </Button>

        {/* Resultado */}
        {result && (
          <div className={`rounded-lg p-4 border-2 ${
            result.success 
              ? 'bg-secondary/10 border-secondary' 
              : 'bg-destructive/10 border-destructive'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
              ) : (
                <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
              )}
              
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className={`font-bold text-lg ${
                    result.success ? 'text-secondary' : 'text-destructive'
                  }`}>
                    {result.success ? '✅ Repasse Concluído!' : '❌ Falha no Repasse'}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.message || result.error}
                  </p>
                </div>

                {result.success && result.data && (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2 p-3 bg-background rounded border">
                      <div>
                        <p className="text-muted-foreground">Valor Total</p>
                        <p className="font-bold text-lg text-primary">
                          {formatCurrency(result.data.valor_total)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Taxa de Serviço</p>
                        <p className="font-bold text-lg text-accent">
                          {formatCurrency(result.data.comissao_logimarket)}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-secondary/10 rounded border-2 border-secondary">
                      <p className="text-muted-foreground text-xs mb-1">Valor Repassado ao Motorista</p>
                      <p className="font-bold text-2xl text-secondary">
                        {formatCurrency(result.data.valor_repassado)}
                      </p>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Transaction ID</p>
                      <p className="font-mono text-xs text-foreground mt-1 break-all">
                        {result.data.transaction_id}
                      </p>
                    </div>

                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs font-medium text-foreground">
                        Status: <span className="text-secondary font-bold">PAID</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instruções de Validação */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h5 className="font-semibold text-sm text-foreground">📋 Validação no Banco de Dados</h5>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Após executar o teste, verifique:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <code className="bg-background px-1 py-0.5 rounded text-xs">orders</code>: 
                status_pagamento = 'paid'
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded text-xs">financial_transactions</code>: 
                novo registro type = 'PAYMENT_OUT'
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
