import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const CARGO_SPECIALTIES = [
  'Carga Geral',
  'Refrigerada',
  'Perecível',
  'Perigosa',
  'Frágil',
  'Alto Valor',
  'Granel',
  'Oversized'
];

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

interface CarrierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carrier: Carrier | null;
  onSuccess: () => void;
}

export function CarrierFormDialog({ open, onOpenChange, carrier, onSuccess }: CarrierFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    contact_whatsapp: '',
    commercial_notes: '',
    is_active: true,
    coverage_states: [] as string[],
    coverage_type: 'regional' as 'estadual' | 'regional' | 'nacional',
    specialties: [] as string[],
    base_rate_per_km: '',
    base_rate_per_kg: '',
  });

  useEffect(() => {
    if (carrier) {
      setFormData({
        name: carrier.name,
        contact_name: carrier.contact_name || '',
        contact_phone: carrier.contact_phone || '',
        contact_email: carrier.contact_email || '',
        contact_whatsapp: carrier.contact_whatsapp || '',
        commercial_notes: carrier.commercial_notes || '',
        is_active: carrier.is_active,
        coverage_states: carrier.coverage_states || [],
        coverage_type: carrier.coverage_type || 'regional',
        specialties: carrier.specialties || [],
        base_rate_per_km: carrier.base_rate_per_km?.toString() || '',
        base_rate_per_kg: carrier.base_rate_per_kg?.toString() || '',
      });
    } else {
      setFormData({
        name: '',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        contact_whatsapp: '',
        commercial_notes: '',
        is_active: true,
        coverage_states: [],
        coverage_type: 'regional',
        specialties: [],
        base_rate_per_km: '',
        base_rate_per_kg: '',
      });
    }
  }, [carrier, open]);

  const toggleState = (state: string) => {
    setFormData(prev => ({
      ...prev,
      coverage_states: prev.coverage_states.includes(state)
        ? prev.coverage_states.filter(s => s !== state)
        : [...prev.coverage_states, state]
    }));
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        base_rate_per_km: formData.base_rate_per_km ? parseFloat(formData.base_rate_per_km) : null,
        base_rate_per_kg: formData.base_rate_per_kg ? parseFloat(formData.base_rate_per_kg) : null,
      };

      if (carrier) {
        // Update
        const { error } = await supabase
          .from('carriers')
          .update(dataToSubmit)
          .eq('id', carrier.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Transportadora atualizada com sucesso',
        });
      } else {
        // Insert
        const { error } = await supabase
          .from('carriers')
          .insert([dataToSubmit]);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Transportadora cadastrada com sucesso',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar transportadora',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {carrier ? 'Editar Transportadora' : 'Nova Transportadora'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da transportadora parceira para cotações rápidas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Transportadora *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ex: Transportadora XYZ Ltda"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name">Nome do Contato</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="João Silva"
              />
            </div>

            <PhoneInput
              value={formData.contact_phone}
              onChange={(value) => setFormData({ ...formData, contact_phone: value })}
              label="Telefone Comercial"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email Comercial</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="comercial@transportadora.com"
              />
            </div>

            <PhoneInput
              value={formData.contact_whatsapp}
              onChange={(value) => setFormData({ ...formData, contact_whatsapp: value })}
              label="WhatsApp"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commercial_notes">Notas Comerciais</Label>
            <Textarea
              id="commercial_notes"
              value={formData.commercial_notes}
              onChange={(e) => setFormData({ ...formData, commercial_notes: e.target.value })}
              placeholder="Observações sobre relacionamento, acordos especiais, histórico..."
              rows={3}
            />
          </div>

          {/* Seção: Cobertura e Rotas de Atuação */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-foreground">Cobertura e Rotas de Atuação</h3>
            
            <div className="space-y-2">
              <Label htmlFor="coverage_type">Tipo de Cobertura</Label>
              <Select
                value={formData.coverage_type}
                onValueChange={(value: 'estadual' | 'regional' | 'nacional') =>
                  setFormData({ ...formData, coverage_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de cobertura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estadual">Estadual (Um estado)</SelectItem>
                  <SelectItem value="regional">Regional (Vários estados)</SelectItem>
                  <SelectItem value="nacional">Nacional (Todo o Brasil)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Estados de Atuação (Múltipla Escolha)</Label>
              <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {BRAZILIAN_STATES.map(state => (
                  <div key={state} className="flex items-center space-x-2">
                    <Checkbox
                      id={`state-${state}`}
                      checked={formData.coverage_states.includes(state)}
                      onCheckedChange={() => toggleState(state)}
                    />
                    <Label
                      htmlFor={`state-${state}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {state}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Seção: Especialidades e Precificação Base */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-foreground">Especialidades e Precificação Base</h3>
            
            <div className="space-y-2">
              <Label>Especialidades em Tipos de Carga</Label>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
                {CARGO_SPECIALTIES.map(spec => (
                  <div key={spec} className="flex items-center space-x-2">
                    <Checkbox
                      id={`spec-${spec}`}
                      checked={formData.specialties.includes(spec)}
                      onCheckedChange={() => toggleSpecialty(spec)}
                    />
                    <Label
                      htmlFor={`spec-${spec}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {spec}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_rate_per_km">Taxa Base por KM (R$)</Label>
                <Input
                  id="base_rate_per_km"
                  type="number"
                  step="0.01"
                  value={formData.base_rate_per_km}
                  onChange={(e) => setFormData({ ...formData, base_rate_per_km: e.target.value })}
                  placeholder="Ex: 2.50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base_rate_per_kg">Taxa Base por KG (R$)</Label>
                <Input
                  id="base_rate_per_kg"
                  type="number"
                  step="0.01"
                  value={formData.base_rate_per_kg}
                  onChange={(e) => setFormData({ ...formData, base_rate_per_kg: e.target.value })}
                  placeholder="Ex: 0.80"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 border-t pt-4">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Transportadora Ativa</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : carrier ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
