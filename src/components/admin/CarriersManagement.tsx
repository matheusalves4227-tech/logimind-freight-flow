import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { CarrierFormDialog } from './CarrierFormDialog';
import { CarrierPriceDialog } from './CarrierPriceDialog';

interface Carrier {
  id: string;
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  is_active: boolean;
  commercial_notes: string | null;
}

export function CarriersManagement() {
  const { toast } = useToast();
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);

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
      setCarriers(data || []);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transportadoras Parceiras</CardTitle>
              <CardDescription>
                Gerencie as transportadoras e suas tabelas de preço para cotações rápidas
              </CardDescription>
            </div>
            <Button onClick={handleNewCarrier} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Transportadora
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {carriers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma transportadora cadastrada ainda.</p>
              <p className="text-sm mt-2">Clique em "Nova Transportadora" para começar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {carriers.map((carrier) => (
                <Card key={carrier.id} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{carrier.name}</h3>
                          <Badge variant={carrier.is_active ? 'default' : 'secondary'}>
                            {carrier.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          {carrier.contact_name && (
                            <p><strong>Contato:</strong> {carrier.contact_name}</p>
                          )}
                          {carrier.contact_phone && (
                            <p><strong>Telefone:</strong> {carrier.contact_phone}</p>
                          )}
                          {carrier.contact_email && (
                            <p><strong>Email:</strong> {carrier.contact_email}</p>
                          )}
                          {carrier.contact_whatsapp && (
                            <p><strong>WhatsApp:</strong> {carrier.contact_whatsapp}</p>
                          )}
                        </div>
                        
                        {carrier.commercial_notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            {carrier.commercial_notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManagePrices(carrier)}
                          className="gap-2"
                        >
                          <DollarSign className="h-4 w-4" />
                          Tabela Preços
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(carrier)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(carrier.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
  );
}
