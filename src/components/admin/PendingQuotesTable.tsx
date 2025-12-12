import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  FileText, 
  Eye, 
  Package, 
  MapPin, 
  ArrowRight, 
  Clock, 
  Shield, 
  MessageCircle,
  TrendingUp,
  SortDesc,
  Map,
  Phone,
  Mail,
  User,
  Scale,
  Calendar,
  Truck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Quote {
  id: string;
  origin_cep: string;
  destination_cep: string;
  weight_kg: number;
  height_cm?: number;
  width_cm?: number;
  length_cm?: number;
  status: string;
  created_at: string;
  user_id: string;
  quote_items?: Array<{
    carrier_id: string;
    final_price: number;
    delivery_days: number;
  }>;
}

interface Profile {
  full_name: string;
  phone?: string;
  company_name?: string;
}

interface PendingQuotesTableProps {
  onUpdate: () => void;
}

type SortType = 'recent' | 'value' | 'origin';

export const PendingQuotesTable = ({ onUpdate }: PendingQuotesTableProps) => {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<SortType>('recent');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

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
          height_cm,
          width_cm,
          length_cm,
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

  const fetchProfile = async (userId: string) => {
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, company_name')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setSelectedProfile(data);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      setSelectedProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const openDetails = async (quote: Quote) => {
    setSelectedQuote(quote);
    setSheetOpen(true);
    await fetchProfile(quote.user_id);
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
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `Criado há ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Criado há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Criado há ${diffDays}d`;
  };

  const getUFFromCEP = (cep: string) => {
    const prefix = parseInt(cep.substring(0, 2));
    if (prefix >= 1 && prefix <= 19) return 'SP';
    if (prefix >= 20 && prefix <= 28) return 'RJ';
    if (prefix >= 29 && prefix <= 29) return 'ES';
    if (prefix >= 30 && prefix <= 39) return 'MG';
    if (prefix >= 40 && prefix <= 48) return 'BA';
    if (prefix >= 49 && prefix <= 49) return 'SE';
    if (prefix >= 50 && prefix <= 56) return 'PE';
    if (prefix >= 57 && prefix <= 57) return 'AL';
    if (prefix >= 58 && prefix <= 58) return 'PB';
    if (prefix >= 59 && prefix <= 59) return 'RN';
    if (prefix >= 60 && prefix <= 63) return 'CE';
    if (prefix >= 64 && prefix <= 64) return 'PI';
    if (prefix >= 65 && prefix <= 65) return 'MA';
    if (prefix >= 66 && prefix <= 68) return 'PA';
    if (prefix >= 69 && prefix <= 69) return 'AM';
    if (prefix >= 70 && prefix <= 73) return 'DF';
    if (prefix >= 74 && prefix <= 76) return 'GO';
    if (prefix >= 77 && prefix <= 77) return 'TO';
    if (prefix >= 78 && prefix <= 78) return 'MT';
    if (prefix >= 79 && prefix <= 79) return 'MS';
    if (prefix >= 80 && prefix <= 87) return 'PR';
    if (prefix >= 88 && prefix <= 89) return 'SC';
    if (prefix >= 90 && prefix <= 99) return 'RS';
    return '--';
  };

  const getSortedQuotes = () => {
    const sorted = [...quotes];
    switch (sortType) {
      case 'recent':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'value':
        return sorted.sort((a, b) => {
          const aPrice = a.quote_items?.length ? Math.min(...a.quote_items.map(i => i.final_price)) : 0;
          const bPrice = b.quote_items?.length ? Math.min(...b.quote_items.map(i => i.final_price)) : 0;
          return bPrice - aPrice;
        });
      case 'origin':
        return sorted.sort((a, b) => getUFFromCEP(a.origin_cep).localeCompare(getUFFromCEP(b.origin_cep)));
      default:
        return sorted;
    }
  };

  const isHighValue = (quote: Quote) => {
    const bestPrice = quote.quote_items?.length 
      ? Math.min(...quote.quote_items.map(i => i.final_price)) 
      : 0;
    return bestPrice > 500;
  };

  const hasLogiGuard = (quote: Quote) => {
    // Simulate LogiGuard check based on high value or weight
    const bestPrice = quote.quote_items?.length 
      ? Math.min(...quote.quote_items.map(i => i.final_price)) 
      : 0;
    return bestPrice > 1000 || quote.weight_kg > 500;
  };

  const openWhatsApp = (phone: string | undefined) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanPhone}?text=Olá! Vi que você solicitou uma cotação de frete no LogiMarket. Posso ajudar?`, '_blank');
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedQuotes = getSortedQuotes();

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Cotações Pendentes de Conversão
              </CardTitle>
              <CardDescription>
                Clientes que solicitaram cotação mas ainda não contrataram o frete
              </CardDescription>
            </div>
            
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={sortType === 'recent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortType('recent')}
                className="gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                Mais Recentes
              </Button>
              <Button
                variant={sortType === 'value' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortType('value')}
                className="gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Maiores Valores
              </Button>
              <Button
                variant={sortType === 'origin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortType('origin')}
                className="gap-1.5"
              >
                <Map className="w-3.5 h-3.5" />
                Por UF Origem
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedQuotes.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma cotação pendente</p>
              <p className="text-sm text-muted-foreground mt-2">
                Todas as cotações foram convertidas ou expiradas
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {sortedQuotes.map((quote) => {
                const bestPrice = quote.quote_items && quote.quote_items.length > 0
                  ? Math.min(...quote.quote_items.map(item => item.final_price))
                  : 0;
                const bestDelivery = quote.quote_items && quote.quote_items.length > 0
                  ? Math.min(...quote.quote_items.map(item => item.delivery_days))
                  : 0;
                const originUF = getUFFromCEP(quote.origin_cep);
                const destUF = getUFFromCEP(quote.destination_cep);
                const showLogiGuard = hasLogiGuard(quote);
                const highValue = isHighValue(quote);
                
                return (
                  <Card 
                    key={quote.id} 
                    className={`
                      border-l-4 transition-all hover:shadow-md hover:bg-slate-50/50
                      ${quote.status === 'pending' ? 'border-l-amber-400' : 'border-l-blue-500'}
                    `}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left: ID + Time + Route */}
                        <div className="flex-1 space-y-2">
                          {/* ID and Time */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-mono text-sm font-medium text-slate-700">
                              #{quote.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getTimeSinceCreated(quote.created_at)}
                            </span>
                            {showLogiGuard && (
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1 text-xs">
                                <Shield className="w-3 h-3" />
                                LogiGuard
                              </Badge>
                            )}
                            {highValue && (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1 text-xs">
                                <TrendingUp className="w-3 h-3" />
                                Alto Valor
                              </Badge>
                            )}
                          </div>
                          
                          {/* Route - Horizontal */}
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                              <MapPin className="w-3.5 h-3.5 text-red-500" />
                              <span className="font-medium">{quote.origin_cep}</span>
                              <span className="text-xs text-slate-500">({originUF})</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="font-medium">{quote.destination_cep}</span>
                              <span className="text-xs text-slate-500">({destUF})</span>
                            </div>
                          </div>
                          
                          {/* Weight and Options */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Scale className="w-3.5 h-3.5" />
                              {quote.weight_kg} kg
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {quote.quote_items?.length || 0} opções disponíveis
                            </Badge>
                            {bestDelivery > 0 && (
                              <span className="flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5" />
                                {bestDelivery} dias
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Right: Price + Actions */}
                        <div className="flex items-center gap-4">
                          {/* Price */}
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Melhor Preço</p>
                            <p className="text-xl font-bold text-blue-700 tabular-nums">
                              {bestPrice > 0 ? formatCurrency(bestPrice) : 'N/A'}
                            </p>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDetails(quote)}
                              className="gap-1.5"
                            >
                              <Eye className="w-4 h-4" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Sheet/Drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalhes da Cotação
            </SheetTitle>
            <SheetDescription>
              #{selectedQuote?.id.slice(0, 8).toUpperCase()}
            </SheetDescription>
          </SheetHeader>
          
          {selectedQuote && (
            <div className="mt-6 space-y-6">
              {/* Route Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Rota</h4>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Origem</p>
                      <p className="font-medium">{selectedQuote.origin_cep} ({getUFFromCEP(selectedQuote.origin_cep)})</p>
                    </div>
                  </div>
                  <div className="border-l-2 border-dashed border-slate-300 h-4 ml-4"></div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Destino</p>
                      <p className="font-medium">{selectedQuote.destination_cep} ({getUFFromCEP(selectedQuote.destination_cep)})</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cargo Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Carga</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Peso</p>
                    <p className="font-semibold">{selectedQuote.weight_kg} kg</p>
                  </div>
                  {selectedQuote.height_cm && selectedQuote.width_cm && selectedQuote.length_cm && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Dimensões</p>
                      <p className="font-semibold text-sm">
                        {selectedQuote.length_cm}x{selectedQuote.width_cm}x{selectedQuote.height_cm} cm
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Dados do Embarcador</h4>
                {loadingProfile ? (
                  <div className="space-y-2">
                    <div className="h-10 bg-muted/50 rounded animate-pulse" />
                    <div className="h-10 bg-muted/50 rounded animate-pulse" />
                  </div>
                ) : selectedProfile ? (
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Nome</p>
                        <p className="font-medium">{selectedProfile.full_name}</p>
                      </div>
                    </div>
                    {selectedProfile.company_name && (
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Empresa</p>
                          <p className="font-medium">{selectedProfile.company_name}</p>
                        </div>
                      </div>
                    )}
                    {selectedProfile.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Telefone</p>
                          <p className="font-medium">{selectedProfile.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Perfil não encontrado</p>
                )}
              </div>

              {/* Quote Options */}
              {selectedQuote.quote_items && selectedQuote.quote_items.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Opções de Frete ({selectedQuote.quote_items.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedQuote.quote_items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-medium">Opção {idx + 1}</p>
                          <p className="text-xs text-muted-foreground">{item.delivery_days} dias úteis</p>
                        </div>
                        <p className="font-bold text-blue-700">{formatCurrency(item.final_price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Cotação criada em {new Date(selectedQuote.created_at).toLocaleDateString('pt-BR')} às {new Date(selectedQuote.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t space-y-3">
                {selectedProfile?.phone && (
                  <Button
                    onClick={() => openWhatsApp(selectedProfile.phone)}
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Falar com Cliente (WhatsApp)
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={() => setSheetOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
