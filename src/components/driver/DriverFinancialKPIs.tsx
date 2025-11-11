import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatarMoeda } from '@/lib/formatters';

interface FinancialKPIs {
  saldoAReceber: number;
  proximoRepasse: string | null;
  ganhos30Dias: number;
}

export const DriverFinancialKPIs = () => {
  const [kpis, setKpis] = useState<FinancialKPIs>({
    saldoAReceber: 0,
    proximoRepasse: null,
    ganhos30Dias: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialKPIs();
  }, []);

  const fetchFinancialKPIs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar profile do motorista
      const { data: profile } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Buscar todos os pedidos aceitos/em andamento/entregues do motorista
      // TODO: Implementar relação order -> driver_bid quando o sistema de lances estiver completo
      // Por enquanto, vamos simular dados de exemplo
      
      // Saldo a Receber: Soma de todos os repasses PENDING
      const { data: pendingTransactions } = await supabase
        .from('financial_transactions')
        .select('amount, order_id')
        .eq('type', 'PAYMENT_OUT')
        .in('status', ['PENDING', 'HELD']);

      const saldoAReceber = pendingTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Ganhos últimos 30 dias: Soma de todos os PAID nos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: paidTransactions } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('type', 'PAYMENT_OUT')
        .eq('status', 'PAID')
        .gte('processed_at', thirtyDaysAgo.toISOString());

      const ganhos30Dias = paidTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Próximo repasse estimado (data mais antiga de PENDING)
      const { data: oldestPending } = await supabase
        .from('financial_transactions')
        .select('created_at')
        .eq('type', 'PAYMENT_OUT')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      let proximoRepasse = null;
      if (oldestPending) {
        // Estimar 2 dias após a data de criação
        const estimatedDate = new Date(oldestPending.created_at);
        estimatedDate.setDate(estimatedDate.getDate() + 2);
        proximoRepasse = estimatedDate.toLocaleDateString('pt-BR');
      }

      setKpis({
        saldoAReceber,
        proximoRepasse,
        ganhos30Dias,
      });
    } catch (error) {
      console.error('Erro ao buscar KPIs financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-24 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Saldo a Receber */}
      <Card className="card-logimarket hover:border-primary transition-all">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium">Saldo a Receber</p>
              <p className="price-display-md mt-1">
                {formatarMoeda(kpis.saldoAReceber)}
              </p>
              <p className="detail-text-xs mt-1">
                Aguardando confirmação de entrega
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próximo Repasse */}
      <Card className="card-logimarket hover:border-accent transition-all">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium">Próximo Repasse</p>
              <p className="text-2xl font-bold text-accent mt-1">
                {kpis.proximoRepasse || 'N/A'}
              </p>
              <p className="detail-text-xs mt-1">
                {kpis.proximoRepasse ? 'Data estimada' : 'Nenhum repasse pendente'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ganhos 30 Dias */}
      <Card className="card-logimarket hover:border-secondary transition-all">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium">Últimos 30 Dias</p>
              <p className="text-2xl font-bold text-secondary mt-1">
                {formatarMoeda(kpis.ganhos30Dias)}
              </p>
              <p className="detail-text-xs mt-1">
                Total de repasses recebidos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
