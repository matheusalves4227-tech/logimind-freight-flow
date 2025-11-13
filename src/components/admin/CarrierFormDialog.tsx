import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

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
      });
    }
  }, [carrier, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (carrier) {
        // Update
        const { error } = await supabase
          .from('carriers')
          .update(formData)
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
          .insert([formData]);

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

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Telefone Comercial</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="(11) 3000-0000"
              />
            </div>
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

            <div className="space-y-2">
              <Label htmlFor="contact_whatsapp">WhatsApp</Label>
              <Input
                id="contact_whatsapp"
                value={formData.contact_whatsapp}
                onChange={(e) => setFormData({ ...formData, contact_whatsapp: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
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

          <div className="flex items-center space-x-2">
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
