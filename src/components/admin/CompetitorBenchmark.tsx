import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Competitor {
  name: string;
  price_min: number;
  price_max: number;
  delivery_days_min: number;
  delivery_days_max: number;
  service_type: string;
  notes?: string;
}

interface BenchmarkData {
  competitors: Competitor[];
  market_average: {
    price_min: number;
    price_max: number;
    delivery_days: number;
  };
  strategic_recommendations: string[];
  analysis_date: string;
  query: {
    origin_cep: string;
    destination_cep: string;
    weight_kg: number;
    cargo_value: number;
  };
  disclaimer: string;
  raw_analysis?: string;
}

export function CompetitorBenchmark() {
  const [isLoading, setIsLoading] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [formData, setFormData] = useState({
    origin_cep: '01310-100',
    destination_cep: '22041-080',
    weight_kg: 10,
    cargo_value: 500
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setBenchmarkData(null);

    try {
      const { data, error } = await supabase.functions.invoke('benchmark-competitors', {
        body: formData
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setBenchmarkData(data.data);
        toast.success('Análise de benchmark concluída!');
      } else {
        throw new Error(data?.error || 'Erro ao gerar benchmark');
      }
    } catch (error) {
      console.error('Benchmark error:', error);
      toast.error('Erro ao gerar benchmark. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Benchmark de Concorrentes
          </CardTitle>
          <CardDescription>
            Analise estimativas de preços dos principais concorrentes para uma rota específica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="origin_cep">CEP Origem</Label>
              <Input
                id="origin_cep"
                value={formData.origin_cep}
                onChange={(e) => setFormData(prev => ({ ...prev, origin_cep: e.target.value }))}
                placeholder="01310-100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination_cep">CEP Destino</Label>
              <Input
                id="destination_cep"
                value={formData.destination_cep}
                onChange={(e) => setFormData(prev => ({ ...prev, destination_cep: e.target.value }))}
                placeholder="22041-080"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight_kg">Peso (kg)</Label>
              <Input
                id="weight_kg"
                type="number"
                value={formData.weight_kg}
                onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: Number(e.target.value) }))}
                min={0.1}
                step={0.1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cargo_value">Valor da Carga (R$)</Label>
              <Input
                id="cargo_value"
                type="number"
                value={formData.cargo_value}
                onChange={(e) => setFormData(prev => ({ ...prev, cargo_value: Number(e.target.value) }))}
                min={1}
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  'Gerar Benchmark'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {benchmarkData && (
        <>
          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {benchmarkData.disclaimer}
            </p>
          </div>

          {/* Market Average */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Média de Mercado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Preço Mínimo</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(benchmarkData.market_average.price_min)}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Preço Máximo</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(benchmarkData.market_average.price_max)}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Prazo Médio</p>
                  <p className="text-2xl font-bold text-primary">
                    {benchmarkData.market_average.delivery_days} dias
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Competitors Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benchmarkData.competitors.map((competitor, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{competitor.name}</CardTitle>
                    <Badge variant="secondary">{competitor.service_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Preço:</span>
                    <span className="font-semibold">
                      {formatCurrency(competitor.price_min)} - {formatCurrency(competitor.price_max)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Prazo:</span>
                    <span className="font-medium">
                      {competitor.delivery_days_min === competitor.delivery_days_max 
                        ? `${competitor.delivery_days_min} dias`
                        : `${competitor.delivery_days_min}-${competitor.delivery_days_max} dias`
                      }
                    </span>
                  </div>
                  {competitor.notes && (
                    <p className="text-xs text-muted-foreground border-t pt-2">
                      {competitor.notes}
                    </p>
                  )}
                  
                  {/* Comparison indicator */}
                  {benchmarkData.market_average.price_min > 0 && (
                    <div className="pt-2 border-t">
                      {competitor.price_min < benchmarkData.market_average.price_min ? (
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <TrendingDown className="h-4 w-4" />
                          <span>
                            {Math.round(((benchmarkData.market_average.price_min - competitor.price_min) / benchmarkData.market_average.price_min) * 100)}% abaixo da média
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-red-600">
                          <TrendingUp className="h-4 w-4" />
                          <span>
                            {Math.round(((competitor.price_min - benchmarkData.market_average.price_min) / benchmarkData.market_average.price_min) * 100)}% acima da média
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Strategic Recommendations */}
          {benchmarkData.strategic_recommendations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Recomendações Estratégicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {benchmarkData.strategic_recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Raw Analysis (fallback) */}
          {benchmarkData.raw_analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Análise Detalhada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {benchmarkData.raw_analysis}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis metadata */}
          <p className="text-xs text-muted-foreground text-center">
            Análise gerada em {new Date(benchmarkData.analysis_date).toLocaleString('pt-BR')} | 
            Rota: {benchmarkData.query.origin_cep} → {benchmarkData.query.destination_cep} | 
            {benchmarkData.query.weight_kg}kg | {formatCurrency(benchmarkData.query.cargo_value)}
          </p>
        </>
      )}
    </div>
  );
}
