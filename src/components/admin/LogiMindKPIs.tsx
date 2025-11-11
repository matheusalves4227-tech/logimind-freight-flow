import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Target, Shield, ArrowUp, ArrowDown, Minus, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface LogiMindKPIData {
  // KPI 1: Margem Rotas de Retorno
  kpi1_take_rate_retorno: number;
  kpi1_comissao_media: number;
  kpi1_total_fretes: number;
  
  // KPI 2: Volume Alta Demanda
  kpi2_crescimento_volume: number;
  kpi2_fretes_atual: number;
  kpi2_gmv_atual: number;
  
  // KPI 3: LogiGuard Pro
  kpi3_taxa_adesao: number;
  kpi3_arpf: number;
}

export const LogiMindKPIs = () => {
  const [kpis, setKpis] = useState<LogiMindKPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      const { data, error } = await supabase
        .from('vw_logimind_dashboard_kpis')
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao buscar KPIs LogiMind:', error);
        return;
      }

      if (data) {
        setKpis(data as LogiMindKPIData);
      }
    } catch (error) {
      console.error('Erro não tratado ao buscar KPIs LogiMind:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined) return '0,00%';
    return (value * 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + '%';
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return '0';
    return value.toLocaleString('pt-BR');
  };

  const getTrendIcon = (value: number | null, targetMin: number, targetMax: number) => {
    if (value === null || value === undefined) return <Minus className="h-4 w-4" />;
    if (value >= targetMin && value <= targetMax) {
      return <Target className="h-4 w-4 text-secondary" />;
    } else if (value > targetMax) {
      return <ArrowUp className="h-4 w-4 text-secondary" />;
    } else {
      return <ArrowDown className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusBadge = (value: number | null, targetMin: number, targetMax: number) => {
    if (value === null || value === undefined) {
      return <Badge variant="outline" className="text-muted-foreground">Sem Dados</Badge>;
    }
    if (value >= targetMin && value <= targetMax) {
      return <Badge variant="default" className="bg-secondary text-secondary-foreground">No Alvo 🎯</Badge>;
    } else if (value > targetMax) {
      return <Badge variant="default" className="bg-secondary text-secondary-foreground">Acima do Alvo ⬆️</Badge>;
    } else {
      return <Badge variant="destructive">Abaixo do Alvo ⬇️</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">🧠 LogiMind KPIs de Sucesso</h3>
            <p className="text-sm text-muted-foreground">Métricas críticas de precificação dinâmica</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const takeRateRetorno = kpis?.kpi1_take_rate_retorno || 0;
  const crescimentoVolume = kpis?.kpi2_crescimento_volume || 0;
  const taxaAdesaoLogiguard = kpis?.kpi3_taxa_adesao || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            LogiMind KPIs de Sucesso
          </h3>
          <p className="text-sm text-muted-foreground">
            Métricas críticas de precificação dinâmica - Últimos 30 dias
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* KPI 1: Margem Rotas de Retorno */}
        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              {getStatusBadge(takeRateRetorno, 0.13, 0.15)}
            </div>
            <CardTitle className="text-base mt-3">
              KPI 1: Margem por Tipo de Rota
            </CardTitle>
            <CardDescription className="text-xs">
              Rotas de Retorno - Meta: 13% a 15%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Métrica Principal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  Take-Rate Médio
                </span>
                {getTrendIcon(takeRateRetorno, 0.13, 0.15)}
              </div>
              <p className="text-3xl font-bold text-primary">
                {formatPercent(takeRateRetorno)}
              </p>
              <Progress 
                value={Math.min((takeRateRetorno / 0.15) * 100, 100)} 
                className="h-2"
              />
            </div>

            {/* Métricas Secundárias */}
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Comissão Média:</span>
                <span className="font-semibold text-foreground">
                  {formatPercent(kpis?.kpi1_comissao_media)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Total de Fretes:</span>
                <span className="font-semibold text-foreground">
                  {formatNumber(kpis?.kpi1_total_fretes)}
                </span>
              </div>
            </div>

            {/* Insight */}
            <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground">
              <p className="leading-relaxed">
                {takeRateRetorno >= 0.13 && takeRateRetorno <= 0.15 ? (
                  <>✅ Excelente! LogiMind está maximizando margem em rotas de baixa ocupação.</>
                ) : takeRateRetorno > 0.15 ? (
                  <>⬆️ Acima do alvo. Margem otimizada além da meta.</>
                ) : (
                  <>⚠️ Abaixo do alvo. Ajustar Fator de Ajuste de Rota para aumentar margem.</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Volume vs. Competitividade */}
        <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <ArrowUp className="h-6 w-6 text-secondary" />
              </div>
              {getStatusBadge(crescimentoVolume / 100, 0.15, 1.0)}
            </div>
            <CardTitle className="text-base mt-3">
              KPI 2: Volume vs. Competitividade
            </CardTitle>
            <CardDescription className="text-xs">
              Rotas de Alta Demanda - Meta: +15% em 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Métrica Principal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  Crescimento de Volume (30d)
                </span>
                {crescimentoVolume >= 15 ? (
                  <ArrowUp className="h-4 w-4 text-secondary" />
                ) : crescimentoVolume > 0 ? (
                  <TrendingUp className="h-4 w-4 text-accent" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-destructive" />
                )}
              </div>
              <p className={`text-3xl font-bold ${
                crescimentoVolume >= 15 ? 'text-secondary' : 
                crescimentoVolume > 0 ? 'text-accent' : 'text-destructive'
              }`}>
                {crescimentoVolume >= 0 ? '+' : ''}{formatNumber(crescimentoVolume)}%
              </p>
              <Progress 
                value={Math.min((crescimentoVolume / 15) * 100, 100)} 
                className="h-2"
              />
            </div>

            {/* Métricas Secundárias */}
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Fretes Atual (30d):</span>
                <span className="font-semibold text-foreground">
                  {formatNumber(kpis?.kpi2_fretes_atual)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">GMV Alta Demanda:</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(kpis?.kpi2_gmv_atual)}
                </span>
              </div>
            </div>

            {/* Insight */}
            <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground">
              <p className="leading-relaxed">
                {crescimentoVolume >= 15 ? (
                  <>✅ Excelente! Estratégia de comissão reduzida está dominando mercado.</>
                ) : crescimentoVolume > 0 ? (
                  <>📈 Crescendo. Continue monitorando competitividade de preço.</>
                ) : (
                  <>⚠️ Volume estagnado. Considerar reduzir ainda mais comissão em rotas-chave.</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: LogiGuard Pro */}
        <Card className="border-2 border-accent/20 hover:border-accent/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <Badge variant="outline" className="text-muted-foreground">
                Em Breve
              </Badge>
            </div>
            <CardTitle className="text-base mt-3">
              KPI 3: Adoção LogiGuard Pro
            </CardTitle>
            <CardDescription className="text-xs">
              Serviços de Valor Agregado - Meta: 10% de adesão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Métrica Principal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  Taxa de Adesão
                </span>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold text-muted-foreground">
                {formatPercent(taxaAdesaoLogiguard)}
              </p>
              <Progress 
                value={0} 
                className="h-2 opacity-50"
              />
            </div>

            {/* Métricas Secundárias */}
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">ARPF LogiGuard:</span>
                <span className="font-semibold text-muted-foreground">
                  {formatCurrency(kpis?.kpi3_arpf)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Fretes com Serviço:</span>
                <span className="font-semibold text-muted-foreground">
                  0
                </span>
              </div>
            </div>

            {/* Insight */}
            <div className="p-2 bg-accent/5 border border-accent/20 rounded text-xs">
              <p className="font-semibold text-accent mb-1">🚀 Próximo Passo</p>
              <p className="text-muted-foreground leading-relaxed">
                Implementar tracking de LogiGuard Pro contratado para ativar este KPI e medir nova linha de receita.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo e Ações */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Resumo de Performance LogiMind
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="p-3 bg-background/50 rounded">
              <p className="text-xs text-muted-foreground mb-1">Status Geral</p>
              <p className="font-semibold text-foreground">
                {takeRateRetorno >= 0.13 && takeRateRetorno <= 0.15 && crescimentoVolume >= 5 ? (
                  <>✅ Sistema Operando no Alvo</>
                ) : (
                  <>⚙️ Calibração Recomendada</>
                )}
              </p>
            </div>
            <div className="p-3 bg-background/50 rounded">
              <p className="text-xs text-muted-foreground mb-1">Próxima Revisão</p>
              <p className="font-semibold text-foreground">Mensal</p>
            </div>
            <div className="p-3 bg-background/50 rounded">
              <p className="text-xs text-muted-foreground mb-1">Ação Prioritária</p>
              <p className="font-semibold text-foreground">
                {takeRateRetorno < 0.13 ? 'Aumentar Ajuste Rota' : 
                 crescimentoVolume < 5 ? 'Reduzir Comissão Alta Demanda' : 
                 'Implementar Tracking LogiGuard'}
              </p>
            </div>
          </div>

          <div className="p-3 bg-accent/5 border border-accent/20 rounded">
            <p className="text-xs text-muted-foreground mb-2">
              💡 <strong>Calibração LogiMind:</strong>
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• Se KPI 1 {'<'} 13%: Aumentar Fator de Ajuste de Rota para maximizar margem em retornos</li>
              <li>• Se KPI 2 {'<'} +15%: Reduzir comissão em rotas de alta demanda para dominar volume</li>
              <li>• Se KPI 3 {'<'} 10%: Revisar triggers de recomendação do LogiGuard Pro</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
