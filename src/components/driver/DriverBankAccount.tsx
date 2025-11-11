import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, AlertCircle, Lock, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BankAccountData {
  pix_key?: string;
  pix_key_type?: string;
  bank_name?: string;
  bank_account_type?: string;
  bank_agency?: string;
  bank_account_number?: string;
  bank_account_digit?: string;
}

export const DriverBankAccount = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [driverProfileId, setDriverProfileId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<BankAccountData>({
    pix_key: '',
    pix_key_type: 'cpf',
    bank_name: '',
    bank_account_type: 'corrente',
    bank_agency: '',
    bank_account_number: '',
    bank_account_digit: '',
  });

  useEffect(() => {
    fetchBankData();
  }, []);

  const fetchBankData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('driver_profiles')
        .select('id, pix_key, pix_key_type, bank_name, bank_account_type, bank_agency, bank_account_number, bank_account_digit')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (profile) {
        setDriverProfileId(profile.id);
        const hasBankData = profile.pix_key || profile.bank_account_number;
        setHasData(!!hasBankData);
        
        setFormData({
          pix_key: profile.pix_key || '',
          pix_key_type: profile.pix_key_type || 'cpf',
          bank_name: profile.bank_name || '',
          bank_account_type: profile.bank_account_type || 'corrente',
          bank_agency: profile.bank_agency || '',
          bank_account_number: profile.bank_account_number || '',
          bank_account_digit: profile.bank_account_digit || '',
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados bancários:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados bancários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!driverProfileId) {
      toast({
        title: 'Erro',
        description: 'Perfil de motorista não encontrado',
        variant: 'destructive',
      });
      return;
    }

    // Validação básica
    if (!formData.pix_key && !formData.bank_account_number) {
      toast({
        title: 'Atenção',
        description: 'Informe ao menos a chave PIX ou dados bancários completos',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('driver_profiles')
        .update({
          pix_key: formData.pix_key || null,
          pix_key_type: formData.pix_key_type || null,
          bank_name: formData.bank_name || null,
          bank_account_type: formData.bank_account_type || null,
          bank_agency: formData.bank_agency || null,
          bank_account_number: formData.bank_account_number || null,
          bank_account_digit: formData.bank_account_digit || null,
        })
        .eq('id', driverProfileId);

      if (error) throw error;

      setHasData(true);
      setEditing(false);
      
      toast({
        title: 'Sucesso',
        description: 'Dados bancários salvos com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao salvar dados bancários:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar dados bancários',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const maskPixKey = (key: string) => {
    if (!key || key.length < 4) return key;
    return key.substring(0, 3) + '***' + key.substring(key.length - 3);
  };

  const maskAccountNumber = (account: string) => {
    if (!account || account.length < 4) return account;
    return '****' + account.substring(account.length - 3);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-logimarket">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hasData ? (
              <CheckCircle2 className="h-8 w-8 text-secondary" />
            ) : (
              <AlertCircle className="h-8 w-8 text-accent" />
            )}
            <div>
              <CardTitle className="text-xl">
                {hasData ? 'Conta Validada' : 'Dados Bancários Pendentes'}
              </CardTitle>
              <CardDescription>
                {hasData 
                  ? 'Seus dados estão configurados e prontos para receber repasses'
                  : 'Configure seus dados bancários para receber os pagamentos'}
              </CardDescription>
            </div>
          </div>
          {hasData && !editing && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Seção PIX */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">PIX (Recomendado)</h3>
            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full font-semibold">
              PRIORITÁRIO
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pix_key_type">Tipo de Chave</Label>
              <Select 
                value={formData.pix_key_type} 
                onValueChange={(value) => setFormData({...formData, pix_key_type: value})}
                disabled={hasData && !editing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="random">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="pix_key">Chave PIX</Label>
              <div className="relative">
                <Input
                  id="pix_key"
                  value={hasData && !editing ? maskPixKey(formData.pix_key || '') : formData.pix_key}
                  onChange={(e) => setFormData({...formData, pix_key: e.target.value})}
                  placeholder="Digite sua chave PIX"
                  disabled={hasData && !editing}
                />
                {hasData && !editing && (
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-lg mb-4">Dados Bancários (Alternativo)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank_name">Banco</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                placeholder="Ex: Banco do Brasil"
                disabled={hasData && !editing}
              />
            </div>
            
            <div>
              <Label htmlFor="bank_account_type">Tipo de Conta</Label>
              <Select 
                value={formData.bank_account_type} 
                onValueChange={(value) => setFormData({...formData, bank_account_type: value})}
                disabled={hasData && !editing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Corrente</SelectItem>
                  <SelectItem value="poupanca">Poupança</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="bank_agency">Agência</Label>
              <Input
                id="bank_agency"
                value={formData.bank_agency}
                onChange={(e) => setFormData({...formData, bank_agency: e.target.value})}
                placeholder="Ex: 1234"
                disabled={hasData && !editing}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label htmlFor="bank_account_number">Número da Conta</Label>
                <div className="relative">
                  <Input
                    id="bank_account_number"
                    value={hasData && !editing ? maskAccountNumber(formData.bank_account_number || '') : formData.bank_account_number}
                    onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                    placeholder="12345678"
                    disabled={hasData && !editing}
                  />
                  {hasData && !editing && (
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="bank_account_digit">Dígito</Label>
                <Input
                  id="bank_account_digit"
                  value={formData.bank_account_digit}
                  onChange={(e) => setFormData({...formData, bank_account_digit: e.target.value})}
                  placeholder="0"
                  maxLength={2}
                  disabled={hasData && !editing}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        {(!hasData || editing) && (
          <div className="flex gap-3 pt-4">
            <Button 
              className="btn-primary-logimarket flex-1" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar Dados Bancários'}
            </Button>
            {editing && (
              <Button 
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  fetchBankData();
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
