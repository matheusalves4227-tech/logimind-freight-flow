import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, DollarSign, Search, Eye, Phone, MessageCircle, MapPin, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { CarrierFormDialog } from './CarrierFormDialog';
import { CarrierPriceDialog } from './CarrierPriceDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Carrier {
  id: string;
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  is_active: boolean;
  commercial_notes: string | null;
  coverage_states: string[] | null;
  coverage_type: 'estadual' | 'regional' | 'nacional' | null;
  specialties: string[] | null;
  base_rate_per_km: number | null;
  base_rate_per_kg: number | null;
}

export function CarriersManagement() {
  const { toast } = useToast();
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCarriers();
  }, []);

  const fetchCarriers = async () => {
    try {
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCarriers((data || []) as unknown as Carrier[]);
    } catch (error) {
      console.error('Erro ao buscar transportadoras:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar transportadoras',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transportadora?')) return;

    try {
      const { error } = await supabase
        .from('carriers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Transportadora excluída com sucesso',
      });
      fetchCarriers();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir transportadora',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    setIsFormOpen(true);
  };

  const handleNewCarrier = () => {
    setSelectedCarrier(null);
    setIsFormOpen(true);
  };

  const handleManagePrices = (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    setIsPriceDialogOpen(true);
  };

  const formatWhatsAppLink = (phone: string) => {
    const cleanNumber = phone.replace(/\D/g, '');
    const numberWithCountry = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    return `https://wa.me/${numberWithCountry}`;
  };

  const filteredCarriers = carriers.filter(carrier => 
    carrier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    carrier.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    carrier.contact_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Transportadoras Parceiras</CardTitle>
                  <CardDescription>
                    Gerencie as transportadoras e suas tabelas de preço para cotações rápidas
                  </CardDescription>
                </div>
              </div>
              <Button onClick={handleNewCarrier} className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Nova Transportadora
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Barra de Busca Global */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, contato ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 max-w-md"
              />
            </div>

            {filteredCarriers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma transportadora encontrada.</p>
                {searchQuery && (
                  <p className="text-sm mt-2">Tente ajustar sua busca.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCarriers.map((carrier) => (
                  <Card 
                    key={carrier.id} 
                    className="border-border/50 hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
                  >
                    <CardContent className="pt-5 pb-4">
                      <div className="space-y-3">
                        {/* Header do Card */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-sm truncate">{carrier.name}</h3>
                              <Badge 
                                variant={carrier.is_active ? 'default' : 'secondary'}
                                className="text-xs mt-0.5"
                              >
                                {carrier.is_active ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {/* Informações de Contato */}
                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          {carrier.contact_name && (
                            <p className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground">{carrier.contact_name}</span>
                            </p>
                          )}
                          {carrier.contact_phone && (
                            <p className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              {carrier.contact_phone}
                            </p>
                          )}
                          {carrier.contact_whatsapp && (
                            <a 
                              href={formatWhatsAppLink(carrier.contact_whatsapp)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                            >
                              <MessageCircle className="h-3 w-3" />
                              WhatsApp: {carrier.contact_whatsapp}
                            </a>
                          )}
                          {carrier.coverage_states && carrier.coverage_states.length > 0 && (
                            <p className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" />
                              {carrier.coverage_states.slice(0, 3).join(', ')}
                              {carrier.coverage_states.length > 3 && ` +${carrier.coverage_states.length - 3}`}
                            </p>
                          )}
                        </div>
                        
                        {carrier.commercial_notes && (
                          <p className="text-xs text-muted-foreground italic line-clamp-2 border-t pt-2">
                            {carrier.commercial_notes}
                          </p>
                        )}

                        {/* Ações */}
                        <div className="flex items-center gap-1.5 pt-2 border-t">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleManagePrices(carrier)}
                                className="flex-1 gap-1.5 text-xs h-8 hover:bg-primary/5 hover:border-primary/50 transition-all"
                              >
                                <DollarSign className="h-3.5 w-3.5" />
                                Tabela Preços
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Gerenciar tabela de preços</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(carrier)}
                                className="h-8 w-8 hover:bg-primary/10"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar transportadora</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(carrier.id)}
                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir transportadora</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <CarrierFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          carrier={selectedCarrier}
          onSuccess={() => {
            fetchCarriers();
            setIsFormOpen(false);
            setSelectedCarrier(null);
          }}
        />

        {selectedCarrier && (
          <CarrierPriceDialog
            open={isPriceDialogOpen}
            onOpenChange={setIsPriceDialogOpen}
            carrier={selectedCarrier}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
