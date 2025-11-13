import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Carrier {
  id: string;
  name: string;
}

interface PriceEntry {
  id: string;
  origin_region: string;
  destination_region: string;
  min_weight_kg: number;
  max_weight_kg: number;
  base_price: number;
  price_per_kg: number;
  delivery_days: number;
  is_active: boolean;
}

interface CarrierPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carrier: Carrier;
}

export function CarrierPriceDialog({ open, onOpenChange, carrier }: CarrierPriceDialogProps) {
  const { toast } = useToast();
  const [prices, setPrices] = useState<PriceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PriceEntry | null>(null);
  const [formData, setFormData] = useState({
    origin_region: '',
    destination_region: '',
    min_weight_kg: 0,
    max_weight_kg: 1000,
    base_price: 0,
    price_per_kg: 0,
    delivery_days: 3,
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      fetchPrices();
    }
  }, [open, carrier.id]);

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('carrier_price_table')
        .select('*')
        .eq('carrier_id', carrier.id)
        .order('origin_region');

      if (error) throw error;
      setPrices(data || []);
    } catch (error) {
      console.error('Erro ao buscar preços:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar tabela de preços',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        carrier_id: carrier.id,
      };

      if (editingPrice) {
        const { error } = await supabase
          .from('carrier_price_table')
          .update(dataToSave)
          .eq('id', editingPrice.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Preço atualizado com sucesso',
        });
      } else {
        const { error } = await supabase
          .from('carrier_price_table')
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Preço adicionado com sucesso',
        });
      }

      setShowForm(false);
      setEditingPrice(null);
      resetForm();
      fetchPrices();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar preço',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este preço?')) return;

    try {
      const { error } = await supabase
        .from('carrier_price_table')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Preço excluído com sucesso',
      });
      fetchPrices();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir preço',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (price: PriceEntry) => {
    setEditingPrice(price);
    setFormData({
      origin_region: price.origin_region,
      destination_region: price.destination_region,
      min_weight_kg: price.min_weight_kg,
      max_weight_kg: price.max_weight_kg,
      base_price: price.base_price,
      price_per_kg: price.price_per_kg,
      delivery_days: price.delivery_days,
      is_active: price.is_active,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      origin_region: '',
      destination_region: '',
      min_weight_kg: 0,
      max_weight_kg: 1000,
      base_price: 0,
      price_per_kg: 0,
      delivery_days: 3,
      is_active: true,
    });
  };

  const handleNewPrice = () => {
    setEditingPrice(null);
    resetForm();
    setShowForm(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tabela de Preços - {carrier.name}</DialogTitle>
          <DialogDescription>
            Gerencie os preços por rota desta transportadora
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showForm ? (
            <>
              <Button onClick={handleNewPrice} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Preço
              </Button>

              {prices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum preço cadastrado ainda.</p>
                  <p className="text-sm mt-2">Adicione preços para começar a cotar com esta transportadora.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prices.map((price) => (
                    <Card key={price.id} className="border-border/50">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={price.is_active ? 'default' : 'secondary'}>
                                {price.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
                              <span className="font-semibold text-sm">
                                {price.origin_region} → {price.destination_region}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-x-4 text-sm text-muted-foreground">
                              <p><strong>Peso:</strong> {price.min_weight_kg}kg - {price.max_weight_kg}kg</p>
                              <p><strong>Base:</strong> R$ {price.base_price.toFixed(2)}</p>
                              <p><strong>+ R$/kg:</strong> R$ {price.price_per_kg.toFixed(2)}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              <strong>Prazo:</strong> {price.delivery_days} dias úteis
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(price)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(price.id)}
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
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin_region">Região Origem (CEP/Estado) *</Label>
                  <Input
                    id="origin_region"
                    value={formData.origin_region}
                    onChange={(e) => setFormData({ ...formData, origin_region: e.target.value })}
                    required
                    placeholder="Ex: SP ou 01000-000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination_region">Região Destino *</Label>
                  <Input
                    id="destination_region"
                    value={formData.destination_region}
                    onChange={(e) => setFormData({ ...formData, destination_region: e.target.value })}
                    required
                    placeholder="Ex: RJ ou 20000-000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_weight_kg">Peso Mínimo (kg) *</Label>
                  <Input
                    id="min_weight_kg"
                    type="number"
                    step="0.01"
                    value={formData.min_weight_kg}
                    onChange={(e) => setFormData({ ...formData, min_weight_kg: parseFloat(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_weight_kg">Peso Máximo (kg) *</Label>
                  <Input
                    id="max_weight_kg"
                    type="number"
                    step="0.01"
                    value={formData.max_weight_kg}
                    onChange={(e) => setFormData({ ...formData, max_weight_kg: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_price">Preço Base (R$) *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_per_kg">Adicional por kg (R$)</Label>
                  <Input
                    id="price_per_kg"
                    type="number"
                    step="0.01"
                    value={formData.price_per_kg}
                    onChange={(e) => setFormData({ ...formData, price_per_kg: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_days">Prazo (dias úteis) *</Label>
                  <Input
                    id="delivery_days"
                    type="number"
                    value={formData.delivery_days}
                    onChange={(e) => setFormData({ ...formData, delivery_days: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Preço Ativo</Label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPrice(null);
                    resetForm();
                  }}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : editingPrice ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
