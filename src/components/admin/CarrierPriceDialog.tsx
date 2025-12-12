import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Utility functions for formatting
const formatNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  return parseInt(numbers).toLocaleString('pt-BR');
};

const parseFormattedNumber = (value: string): string => {
  return value.replace(/\./g, '');
};

const formatMoney = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  const amount = parseInt(numbers) / 100;
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseFormattedMoney = (value: string): string => {
  return value.replace(/\./g, '').replace(',', '.');
};

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface Carrier {
  id: string;
  name: string;
}

interface PriceEntry {
  id: string;
  carrier_id: string;
  origin_region: string;
  destination_region: string;
  origin_state: string | null;
  destination_state: string | null;
  min_distance_km: number | null;
  max_distance_km: number | null;
  min_weight_kg: number;
  max_weight_kg: number;
  base_price: number;
  price_per_kg: number;
  rate_per_km: number | null;
  fixed_cost: number | null;
  delivery_days: number;
  is_active: boolean;
  created_at?: string;
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
    origin_state: '',
    destination_state: '',
    min_distance_km: '',
    max_distance_km: '',
    min_weight_kg: '',
    max_weight_kg: '',
    base_price: '',
    price_per_kg: '',
    rate_per_km: '',
    fixed_cost: '',
    delivery_days: '',
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
      setPrices((data || []) as unknown as PriceEntry[]);
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
      const dataToSubmit = {
        carrier_id: carrier.id,
        origin_region: formData.origin_state || formData.origin_region,
        destination_region: formData.destination_state || formData.destination_region,
        origin_state: formData.origin_state || null,
        destination_state: formData.destination_state || null,
        min_distance_km: formData.min_distance_km ? parseFloat(parseFormattedNumber(formData.min_distance_km)) : null,
        max_distance_km: formData.max_distance_km ? parseFloat(parseFormattedNumber(formData.max_distance_km)) : null,
        min_weight_kg: parseFloat(parseFormattedNumber(formData.min_weight_kg)),
        max_weight_kg: parseFloat(parseFormattedNumber(formData.max_weight_kg)),
        base_price: parseFloat(parseFormattedMoney(formData.base_price)),
        price_per_kg: parseFloat(parseFormattedMoney(formData.price_per_kg)),
        rate_per_km: formData.rate_per_km ? parseFloat(parseFormattedMoney(formData.rate_per_km)) : null,
        fixed_cost: formData.fixed_cost ? parseFloat(parseFormattedMoney(formData.fixed_cost)) : null,
        delivery_days: parseInt(formData.delivery_days),
        is_active: formData.is_active,
      };

      if (editingPrice) {
        const { error } = await supabase
          .from('carrier_price_table')
          .update(dataToSubmit)
          .eq('id', editingPrice.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Preço atualizado com sucesso',
        });
      } else {
        const { error } = await supabase
          .from('carrier_price_table')
          .insert([dataToSubmit]);

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
      origin_state: price.origin_state || '',
      destination_state: price.destination_state || '',
      min_distance_km: price.min_distance_km ? formatNumber(price.min_distance_km.toString()) : '',
      max_distance_km: price.max_distance_km ? formatNumber(price.max_distance_km.toString()) : '',
      min_weight_kg: formatNumber(price.min_weight_kg.toString()),
      max_weight_kg: formatNumber(price.max_weight_kg.toString()),
      base_price: formatMoney((price.base_price * 100).toFixed(0)),
      price_per_kg: formatMoney((price.price_per_kg * 100).toFixed(0)),
      rate_per_km: price.rate_per_km ? formatMoney((price.rate_per_km * 100).toFixed(0)) : '',
      fixed_cost: price.fixed_cost ? formatMoney((price.fixed_cost * 100).toFixed(0)) : '',
      delivery_days: price.delivery_days.toString(),
      is_active: price.is_active,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      origin_region: '',
      destination_region: '',
      origin_state: '',
      destination_state: '',
      min_distance_km: '',
      max_distance_km: '',
      min_weight_kg: '',
      max_weight_kg: '',
      base_price: '',
      price_per_kg: '',
      rate_per_km: '',
      fixed_cost: '',
      delivery_days: '',
      is_active: true,
    });
    setEditingPrice(null);
  };

  const handleNewPrice = () => {
    resetForm();
    setShowForm(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Tabela de Preços - {carrier.name}
          </DialogTitle>
          <DialogDescription>
            Configure preços por estado, distância e peso
          </DialogDescription>
        </DialogHeader>

        {!showForm ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleNewPrice} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Preço
              </Button>
            </div>

            {prices.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  Nenhum preço cadastrado ainda.
                  <br />
                  Clique em "Novo Preço" para começar.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {prices.map((price) => (
                  <Card key={price.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={price.is_active ? 'default' : 'secondary'}>
                            {price.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <p className="text-sm">
                          <strong>Rota:</strong> {price.origin_state || price.origin_region} → {price.destination_state || price.destination_region}
                        </p>
                        {(price.min_distance_km || price.max_distance_km) && (
                          <p className="text-sm">
                            <strong>Distância:</strong> {price.min_distance_km || 0}km - {price.max_distance_km || '∞'}km
                          </p>
                        )}
                        <p className="text-sm">
                          <strong>Peso:</strong> {price.min_weight_kg}kg - {price.max_weight_kg}kg
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><strong>Preço Base:</strong> R$ {price.base_price.toFixed(2)}</p>
                          <p><strong>Por KG:</strong> R$ {price.price_per_kg.toFixed(2)}</p>
                          {price.rate_per_km && (
                            <p><strong>Por KM:</strong> R$ {price.rate_per_km.toFixed(2)}</p>
                          )}
                          {price.fixed_cost && (
                            <p><strong>Custo Fixo:</strong> R$ {price.fixed_cost.toFixed(2)}</p>
                          )}
                        </div>
                        <p className="text-sm">
                          <strong>Prazo:</strong> {price.delivery_days} dias
                        </p>
                      </div>
                      <div className="flex gap-2">
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
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar à Lista
            </Button>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin_state">Estado Origem *</Label>
                  <Select
                    value={formData.origin_state}
                    onValueChange={(value) => setFormData({ ...formData, origin_state: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination_state">Estado Destino *</Label>
                  <Select
                    value={formData.destination_state}
                    onValueChange={(value) => setFormData({ ...formData, destination_state: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_distance_km">Distância Mínima (KM)</Label>
                  <Input
                    id="min_distance_km"
                    type="text"
                    inputMode="numeric"
                    value={formData.min_distance_km}
                    onChange={(e) => setFormData({ ...formData, min_distance_km: formatNumber(e.target.value) })}
                    placeholder="Ex: 0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_distance_km">Distância Máxima (KM)</Label>
                  <Input
                    id="max_distance_km"
                    type="text"
                    inputMode="numeric"
                    value={formData.max_distance_km}
                    onChange={(e) => setFormData({ ...formData, max_distance_km: formatNumber(e.target.value) })}
                    placeholder="Ex: 500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_weight_kg">Peso Mínimo (KG) *</Label>
                  <Input
                    id="min_weight_kg"
                    type="text"
                    inputMode="numeric"
                    value={formData.min_weight_kg}
                    onChange={(e) => setFormData({ ...formData, min_weight_kg: formatNumber(e.target.value) })}
                    required
                    placeholder="Ex: 0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_weight_kg">Peso Máximo (KG) *</Label>
                  <Input
                    id="max_weight_kg"
                    type="text"
                    inputMode="numeric"
                    value={formData.max_weight_kg}
                    onChange={(e) => setFormData({ ...formData, max_weight_kg: formatNumber(e.target.value) })}
                    required
                    placeholder="Ex: 1.000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate_per_km">Taxa por KM (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      id="rate_per_km"
                      type="text"
                      inputMode="decimal"
                      value={formData.rate_per_km}
                      onChange={(e) => setFormData({ ...formData, rate_per_km: formatMoney(e.target.value) })}
                      placeholder="0,00"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fixed_cost">Custo Fixo (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      id="fixed_cost"
                      type="text"
                      inputMode="decimal"
                      value={formData.fixed_cost}
                      onChange={(e) => setFormData({ ...formData, fixed_cost: formatMoney(e.target.value) })}
                      placeholder="0,00"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_per_kg">Preço por KG (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      id="price_per_kg"
                      type="text"
                      inputMode="decimal"
                      value={formData.price_per_kg}
                      onChange={(e) => setFormData({ ...formData, price_per_kg: formatMoney(e.target.value) })}
                      required
                      placeholder="0,00"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_price">Preço Base Total (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      id="base_price"
                      type="text"
                      inputMode="decimal"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: formatMoney(e.target.value) })}
                      required
                      placeholder="0,00"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_days">Prazo de Entrega (dias úteis)</Label>
                  <Input
                    id="delivery_days"
                    type="number"
                    value={formData.delivery_days}
                    onChange={(e) => setFormData({ ...formData, delivery_days: e.target.value })}
                    required
                    placeholder="Ex: 5"
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
