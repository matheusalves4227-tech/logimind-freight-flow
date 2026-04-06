import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, QrCode, Loader2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatarMoeda } from '@/lib/formatters';

interface PaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  totalAmount: number;
  trackingCode: string;
  onSelectPix: () => void;
}

export function PaymentMethodModal({
  open,
  onOpenChange,
  orderId,
  totalAmount,
  trackingCode,
  onSelectPix,
}: PaymentMethodModalProps) {
  const [loadingStripe, setLoadingStripe] = useState(false);

  const handleStripeCheckout = async () => {
    setLoadingStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { order_id: orderId },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('URL de checkout não recebida');

      // Redirect to Stripe Checkout
      window.open(data.url, '_blank');
      onOpenChange(false);
      toast.success('Redirecionando para o checkout seguro...');
    } catch (error) {
      console.error('Stripe checkout error:', error);
      toast.error('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setLoadingStripe(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Escolha a forma de pagamento</DialogTitle>
          <DialogDescription>
            Pedido <span className="font-semibold text-foreground">{trackingCode}</span> — Total: <span className="font-bold text-primary">{formatarMoeda(totalAmount)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {/* PIX Option */}
          <button
            onClick={() => {
              onOpenChange(false);
              onSelectPix();
            }}
            className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-left group"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">PIX</h3>
                <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold uppercase">
                  Sem taxas
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Pagamento instantâneo via QR Code ou chave PIX
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Confirmação manual em até 2h úteis
              </p>
            </div>
          </button>

          {/* Stripe Option - Card/Boleto */}
          <button
            onClick={handleStripeCheckout}
            disabled={loadingStripe}
            className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-accent/50 hover:bg-accent/5 transition-all duration-200 text-left group disabled:opacity-60 disabled:cursor-wait"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
              {loadingStripe ? (
                <Loader2 className="h-6 w-6 text-accent animate-spin" />
              ) : (
                <CreditCard className="h-6 w-6 text-accent" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">Cartão ou Boleto</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Cartão de crédito, débito ou boleto bancário
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Confirmação automática e imediata
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 mt-4 p-3 bg-muted/50 rounded-lg">
          <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Pagamento seguro com criptografia de ponta a ponta. Seu dinheiro fica em custódia até a confirmação da entrega.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
