import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Quote {
  id: string;
  origin_cep: string;
  destination_cep: string;
  weight_kg: number;
  status: string;
  created_at: string;
  user_id: string;
  quote_items?: Array<{
    carrier_id: string;
    final_price: number;
    delivery_days: number;
  }>;
}

interface PendingQuotesTableProps {
  onUpdate: () => void;
}

export const PendingQuotesTable = ({ onUpdate }: PendingQuotesTableProps) => {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          id,
          origin_cep,
          destination_cep,
          weight_kg,
          status,
          created_at,
          user_id,
          quote_items(
            carrier_id,
            final_price,
            delivery_days
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setQuotes(data || []);
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar cotações pendentes',
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

  const getTimeSinceCreated = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Menos de 1h';
    if (diffHours < 24) return `${diffHours}h atrás`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Cotações Pendentes de Conversão
        </CardTitle>
        <CardDescription>
          Clientes que solicitaram cotação mas ainda não contrataram o frete
        </CardDescription>
      </CardHeader>
      <CardContent>
        {quotes.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma cotação pendente</p>
            <p className="text-sm text-muted-foreground mt-2">
              Todas as cotações foram convertidas ou expiradas
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID da Cotação</TableHead>
                  <TableHead>Rota (CEPs)</TableHead>
                  <TableHead>Peso (kg)</TableHead>
                  <TableHead>Opções Disponíveis</TableHead>
                  <TableHead>Melhor Preço</TableHead>
                  <TableHead>Tempo Pendente</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => {
                  const bestPrice = quote.quote_items && quote.quote_items.length > 0
                    ? Math.min(...quote.quote_items.map(item => item.final_price))
                    : 0;
                  
                  return (
                    <TableRow key={quote.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">
                        {quote.id.slice(0, 8)}...
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="font-medium">{quote.origin_cep}</span>
                          <span className="text-muted-foreground">→ {quote.destination_cep}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-medium">{quote.weight_kg} kg</span>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {quote.quote_items?.length || 0} opções
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-semibold text-primary">
                          {bestPrice > 0 ? formatCurrency(bestPrice) : 'N/A'}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {getTimeSinceCreated(quote.created_at)}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className="bg-accent text-accent-foreground">
                          Aguardando Cliente
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
