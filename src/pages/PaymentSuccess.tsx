import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        toast({
          title: 'Erro',
          description: 'Sessão de pagamento não encontrada',
          variant: 'destructive',
        });
        setVerifying(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { session_id: sessionId },
        });

        if (error) throw error;

        if (data.success && data.payment_status === 'paid') {
          setPaymentConfirmed(true);
          setOrderId(data.order_id);
          toast({
            title: 'Pagamento Confirmado!',
            description: 'Seu frete foi contratado com sucesso.',
          });
        } else {
          toast({
            title: 'Pagamento Pendente',
            description: 'Aguardando confirmação do pagamento.',
            variant: 'default',
          });
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao verificar o pagamento. Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, toast]);

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          {verifying ? (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl">Verificando Pagamento...</CardTitle>
              <CardDescription>
                Aguarde enquanto confirmamos seu pagamento
              </CardDescription>
            </>
          ) : paymentConfirmed ? (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-green-600">
                Pagamento Confirmado!
              </CardTitle>
              <CardDescription>
                Seu frete foi contratado com sucesso
              </CardDescription>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <CardTitle className="text-2xl text-destructive">
                Falha na Verificação
              </CardTitle>
              <CardDescription>
                Não foi possível confirmar o pagamento neste momento
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {paymentConfirmed && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Próximos Passos:
              </h3>
              <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                <li>✓ Recebemos seu pagamento com sucesso</li>
                <li>✓ Nossa equipe entrará em contato com a transportadora</li>
                <li>✓ Você receberá atualizações por e-mail</li>
                <li>✓ Acompanhe seu pedido no dashboard</li>
              </ul>
            </div>
          )}

          {!verifying && !paymentConfirmed && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Se você concluiu o pagamento, pode levar alguns minutos para o processamento.
                Você pode verificar o status no seu dashboard.
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-center pt-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="default"
            >
              Ir para Dashboard
            </Button>
            
            {!verifying && !paymentConfirmed && (
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Tentar Novamente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
