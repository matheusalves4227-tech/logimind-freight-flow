import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, ArrowLeft, Package, Truck, MapPin, Calendar, Shield, DollarSign, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const B2BQuote = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Dados da Empresa
    razao_social: "",
    cnpj: "",
    email: "",
    telefone: "",
    contato_responsavel: "",
    
    // Volume e Recorrência
    volume_mensal_estimado: "",
    frequencia_envios: "semanal",
    
    // Rotas Principais
    rotas_origem: "",
    rotas_destino: "",
    
    // Características da Carga
    tipo_carga: "geral",
    peso_medio_kg: "",
    valor_medio_carga: "",
    necessita_seguro: false,
    carga_perigosa: false,
    carga_fragil: false,
    
    // SLA e Prazos
    sla_desejado: "standard",
    prazo_entrega_dias: "",
    
    // Otimização
    aceita_rota_retorno: false,
    flexibilidade_horario: false,
    
    // Custos Adicionais
    pedagios_cliente: false,
    armazenagem_cliente: false,
    logistica_reversa: false,
    
    // Informações Adicionais
    observacoes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Verificar se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        // Se não estiver autenticado, salvar no localStorage e redirecionar para auth
        localStorage.setItem('pendingB2BQuote', JSON.stringify(formData));
        toast({
          title: "Faça login para continuar",
          description: "Você será redirecionado para fazer login e depois poderá enviar sua cotação.",
          variant: "default",
        });
        navigate("/auth");
        return;
      }
      
      // Inserir a cotação no banco de dados
      const { error: insertError } = await supabase
        .from('b2b_quotes')
        .insert({
          user_id: user.id,
          razao_social: formData.razao_social,
          cnpj: formData.cnpj,
          email: formData.email,
          telefone: formData.telefone,
          contato_responsavel: formData.contato_responsavel,
          volume_mensal_estimado: parseInt(formData.volume_mensal_estimado),
          frequencia_envios: formData.frequencia_envios,
          rotas_origem: formData.rotas_origem,
          rotas_destino: formData.rotas_destino,
          tipo_carga: formData.tipo_carga,
          peso_medio_kg: parseFloat(formData.peso_medio_kg),
          valor_medio_carga: formData.valor_medio_carga ? parseFloat(formData.valor_medio_carga) : null,
          necessita_seguro: formData.necessita_seguro,
          carga_perigosa: formData.carga_perigosa,
          carga_fragil: formData.carga_fragil,
          sla_desejado: formData.sla_desejado,
          prazo_entrega_dias: formData.prazo_entrega_dias ? parseInt(formData.prazo_entrega_dias) : null,
          aceita_rota_retorno: formData.aceita_rota_retorno,
          flexibilidade_horario: formData.flexibilidade_horario,
          pedagios_cliente: formData.pedagios_cliente,
          armazenagem_cliente: formData.armazenagem_cliente,
          logistica_reversa: formData.logistica_reversa,
          observacoes: formData.observacoes || null,
          status: 'pending'
        });
      
      if (insertError) {
        throw insertError;
      }
      
      toast({
        title: "Cotação B2B Enviada com Sucesso!",
        description: "Nossa equipe comercial entrará em contato em até 24h com uma proposta personalizada.",
      });
      
      // Limpar o formulário e redirecionar
      navigate("/dashboard");
      
    } catch (error) {
      console.error("Erro ao enviar cotação B2B:", error);
      toast({
        title: "Erro ao enviar cotação",
        description: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Recuperar dados salvos no localStorage se o usuário voltar do login
  useEffect(() => {
    const pendingQuote = localStorage.getItem('pendingB2BQuote');
    if (pendingQuote) {
      try {
        const savedData = JSON.parse(pendingQuote);
        setFormData(savedData);
        localStorage.removeItem('pendingB2BQuote');
        toast({
          title: "Dados recuperados",
          description: "Continue preenchendo sua cotação B2B de onde parou.",
        });
      } catch (error) {
        console.error("Erro ao recuperar dados salvos:", error);
      }
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24 max-w-5xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Home
        </Button>

        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Cotação B2B Recorrente</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Preencha os dados abaixo para receber uma proposta comercial personalizada com tabela de preços diferenciada, 
            SLA garantido e condições exclusivas para sua operação logística.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados da Empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dados da Empresa
              </CardTitle>
              <CardDescription>
                Informações cadastrais da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="razao_social">Razão Social *</Label>
                  <Input
                    id="razao_social"
                    required
                    value={formData.razao_social}
                    onChange={(e) => handleInputChange("razao_social", e.target.value)}
                    placeholder="Nome da Empresa Ltda"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    required
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange("cnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Corporativo *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="contato@empresa.com.br"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    required
                    value={formData.telefone}
                    onChange={(e) => handleInputChange("telefone", e.target.value)}
                    placeholder="(11) 98765-4321"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="contato_responsavel">Nome do Responsável *</Label>
                  <Input
                    id="contato_responsavel"
                    required
                    value={formData.contato_responsavel}
                    onChange={(e) => handleInputChange("contato_responsavel", e.target.value)}
                    placeholder="João Silva"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Volume e Recorrência */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Volume e Recorrência
              </CardTitle>
              <CardDescription>
                Quanto maior o volume, maior o desconto na tarifa unitária
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="volume_mensal_estimado">Volume Mensal Estimado (Entregas) *</Label>
                  <Input
                    id="volume_mensal_estimado"
                    type="number"
                    required
                    value={formData.volume_mensal_estimado}
                    onChange={(e) => handleInputChange("volume_mensal_estimado", e.target.value)}
                    placeholder="Ex: 50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequencia_envios">Frequência de Envios *</Label>
                  <Select
                    value={formData.frequencia_envios}
                    onValueChange={(value) => handleInputChange("frequencia_envios", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diaria">Diária</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="quinzenal">Quinzenal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rotas e Distância */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Rotas e Localização
              </CardTitle>
              <CardDescription>
                Valor base por km rodado, com fator de dificuldade para regiões específicas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rotas_origem">Principais Origens (CEPs ou Cidades) *</Label>
                  <Textarea
                    id="rotas_origem"
                    required
                    value={formData.rotas_origem}
                    onChange={(e) => handleInputChange("rotas_origem", e.target.value)}
                    placeholder="Ex: São Paulo - SP, 01310-100"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rotas_destino">Principais Destinos (CEPs ou Cidades) *</Label>
                  <Textarea
                    id="rotas_destino"
                    required
                    value={formData.rotas_destino}
                    onChange={(e) => handleInputChange("rotas_destino", e.target.value)}
                    placeholder="Ex: Rio de Janeiro - RJ, 20040-020"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Características da Carga */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Natureza da Carga
              </CardTitle>
              <CardDescription>
                Cargas especiais exigem seguro e manuseio diferenciado, elevando o custo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_carga">Tipo de Carga *</Label>
                  <Select
                    value={formData.tipo_carga}
                    onValueChange={(value) => handleInputChange("tipo_carga", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Carga Geral</SelectItem>
                      <SelectItem value="refrigerada">Refrigerada</SelectItem>
                      <SelectItem value="perigosa">Perigosa</SelectItem>
                      <SelectItem value="fragil">Frágil</SelectItem>
                      <SelectItem value="alto_valor">Alto Valor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="peso_medio_kg">Peso Médio (kg) *</Label>
                  <Input
                    id="peso_medio_kg"
                    type="number"
                    required
                    value={formData.peso_medio_kg}
                    onChange={(e) => handleInputChange("peso_medio_kg", e.target.value)}
                    placeholder="Ex: 500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_medio_carga">Valor Médio da Carga (R$)</Label>
                  <Input
                    id="valor_medio_carga"
                    type="number"
                    value={formData.valor_medio_carga}
                    onChange={(e) => handleInputChange("valor_medio_carga", e.target.value)}
                    placeholder="Ex: 10000"
                  />
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="necessita_seguro"
                    checked={formData.necessita_seguro}
                    onCheckedChange={(checked) => handleInputChange("necessita_seguro", checked)}
                  />
                  <Label htmlFor="necessita_seguro" className="cursor-pointer">
                    Necessita seguro adicional
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="carga_perigosa"
                    checked={formData.carga_perigosa}
                    onCheckedChange={(checked) => handleInputChange("carga_perigosa", checked)}
                  />
                  <Label htmlFor="carga_perigosa" className="cursor-pointer">
                    Carga perigosa (requer certificações)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="carga_fragil"
                    checked={formData.carga_fragil}
                    onCheckedChange={(checked) => handleInputChange("carga_fragil", checked)}
                  />
                  <Label htmlFor="carga_fragil" className="cursor-pointer">
                    Carga frágil (manuseio especial)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prazo de Entrega (SLA) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Prazo de Entrega (SLA)
              </CardTitle>
              <CardDescription>
                Entregas expressas são significativamente mais caras que prazos estendidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sla_desejado">Tipo de SLA *</Label>
                  <Select
                    value={formData.sla_desejado}
                    onValueChange={(value) => handleInputChange("sla_desejado", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="same_day">Same Day (Mesmo Dia) - Premium</SelectItem>
                      <SelectItem value="express">Express (24-48h)</SelectItem>
                      <SelectItem value="standard">Standard (3-5 dias)</SelectItem>
                      <SelectItem value="economico">Econômico (7-10 dias)</SelectItem>
                      <SelectItem value="flexivel">Flexível (Sem prazo fixo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prazo_entrega_dias">Prazo Máximo de Entrega (dias)</Label>
                  <Input
                    id="prazo_entrega_dias"
                    type="number"
                    value={formData.prazo_entrega_dias}
                    onChange={(e) => handleInputChange("prazo_entrega_dias", e.target.value)}
                    placeholder="Ex: 5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Otimização de Rota */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Otimização e Economia
              </CardTitle>
              <CardDescription>
                Rotas de retorno otimizadas reduzem significativamente o custo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="aceita_rota_retorno"
                  checked={formData.aceita_rota_retorno}
                  onCheckedChange={(checked) => handleInputChange("aceita_rota_retorno", checked)}
                />
                <Label htmlFor="aceita_rota_retorno" className="cursor-pointer">
                  Aceita otimização de rota de retorno (pode reduzir custo em até 40%)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="flexibilidade_horario"
                  checked={formData.flexibilidade_horario}
                  onCheckedChange={(checked) => handleInputChange("flexibilidade_horario", checked)}
                />
                <Label htmlFor="flexibilidade_horario" className="cursor-pointer">
                  Flexibilidade de horário de coleta/entrega
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Custos Adicionais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Custos Adicionais e Responsabilidades
              </CardTitle>
              <CardDescription>
                Defina quem arca com pedágios, armazenagem e logística reversa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pedagios_cliente"
                  checked={formData.pedagios_cliente}
                  onCheckedChange={(checked) => handleInputChange("pedagios_cliente", checked)}
                />
                <Label htmlFor="pedagios_cliente" className="cursor-pointer">
                  Cliente arca com pedágios
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="armazenagem_cliente"
                  checked={formData.armazenagem_cliente}
                  onCheckedChange={(checked) => handleInputChange("armazenagem_cliente", checked)}
                />
                <Label htmlFor="armazenagem_cliente" className="cursor-pointer">
                  Cliente arca com armazenagem (se necessário)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="logistica_reversa"
                  checked={formData.logistica_reversa}
                  onCheckedChange={(checked) => handleInputChange("logistica_reversa", checked)}
                />
                <Label htmlFor="logistica_reversa" className="cursor-pointer">
                  Necessita logística reversa (devolução de produtos)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Observações Adicionais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
              <CardDescription>
                Descreva requisitos específicos ou informações relevantes para sua operação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange("observacoes", e.target.value)}
                placeholder="Ex: Necessitamos de veículos refrigerados certificados, horário de entrega restrito entre 8h-12h, etc."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Resumo dos Benefícios */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Benefícios do Contrato B2B</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">✓ Tabela de Preços Diferenciada</h4>
                  <p className="text-sm text-muted-foreground">
                    Descontos progressivos baseados no volume mensal contratado
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">✓ SLA Garantido</h4>
                  <p className="text-sm text-muted-foreground">
                    Prazos de entrega assegurados com penalidades em caso de descumprimento
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">✓ Relatórios Personalizados</h4>
                  <p className="text-sm text-muted-foreground">
                    KPIs customizados e dashboards exclusivos para acompanhamento
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">✓ Prioridade na Plataforma</h4>
                  <p className="text-sm text-muted-foreground">
                    Acesso prioritário a novos veículos e rotas otimizadas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <Button 
              type="submit" 
              size="lg" 
              className="min-w-[300px]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Solicitação de Cotação B2B"
              )}
            </Button>
          </div>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Nossa equipe comercial analisará sua solicitação e entrará em contato em até 24 horas úteis 
          com uma proposta personalizada para suas necessidades.
        </p>
      </div>
    </div>
  );
};

export default B2BQuote;
