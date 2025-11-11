import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, Percent, Package } from 'lucide-react';

interface KPIData {
  pedidos_concluidos: number;
  gmv_total: number;
  faturamento_logimarket: number;
  margem_media: number;
  total_repassado: number;
}

export const FinancialKPIs = () => {
  const [kpis, setKpis] = useState<KPIData>({
    pedidos_concluidos: 0,
    gmv_total: 0,
    faturamento_logimarket: 0,
    margem_media: 0,
    total_repassado: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_logimarket_kpis_current');

      if (error) {
        console.error('Erro ao buscar KPIs:', error);
        return;
      }

      if (data && data.length > 0) {
        setKpis(data[0] as KPIData);
      }
    } catch (error) {
      console.error('Erro não tratado ao buscar KPIs:', error);
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

  const formatPercent = (value: number) => {
    return (value * 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + '%';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">💰 KPIs Financeiros</h3>
          <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Bruto (GMV) */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Faturamento Bruto (GMV)
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(kpis.gmv_total)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Volume total de fretes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faturamento Líquido LogiMarket */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Receita LogiMarket
                </p>
                <p className="text-2xl font-bold text-secondary">
                  {formatCurrency(kpis.faturamento_logimarket)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Comissões retidas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Margem Média */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Percent className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Margem Média
                </p>
                <p className="text-2xl font-bold text-accent">
                  {formatPercent(kpis.margem_media)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Eficácia LogiMind
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pedidos Concluídos */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Pedidos Concluídos
                </p>
                <p className="text-2xl font-bold text-primary">
                  {kpis.pedidos_concluidos}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Performance operacional
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento Adicional */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Repassado aos Motoristas:</span>
              <span className="font-bold text-foreground">
                {formatCurrency(kpis.total_repassado)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Take Rate (Comissão/GMV):</span>
              <span className="font-bold text-secondary">
                {kpis.gmv_total > 0 
                  ? formatPercent(kpis.faturamento_logimarket / kpis.gmv_total)
                  : '0,00%'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
