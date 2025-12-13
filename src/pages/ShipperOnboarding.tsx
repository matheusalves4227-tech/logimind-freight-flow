import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationAnimation } from "@/components/ui/confirmation-animation";
import { CpfCnpjInput } from "@/components/ui/cpf-cnpj-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Building2, User, Phone, Mail, Truck, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const COMPANY_SECTORS = [
  "Agronegócio",
  "E-commerce",
  "Indústria",
  "Varejo",
  "Distribuição",
  "Importação/Exportação",
  "Construção Civil",
  "Alimentício",
  "Farmacêutico",
  "Automotivo",
  "Outros"
];

const FREIGHT_VOLUMES = [
  { value: "1-10", label: "1 a 10 fretes/mês" },
  { value: "11-50", label: "11 a 50 fretes/mês" },
  { value: "51-200", label: "51 a 200 fretes/mês" },
  { value: "200+", label: "Mais de 200 fretes/mês" }
];

const ShipperOnboarding = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [cnpjValid, setCnpjValid] = useState(false);
  const [cpfValid, setCpfValid] = useState(false);

  const [formData, setFormData] = useState({
    cnpj: "",
    razaoSocial: "",
    companySector: "",
    monthlyFreightVolume: "",
    corporateEmail: "",
    responsibleName: "",
    responsibleCpf: "",
    phone: "",
    acceptsWhatsappContact: false
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado para se cadastrar como embarcador");
        navigate("/auth?redirect=/cadastro/embarcador");
        return;
      }
      setUser(session.user);
      // Pre-fill email if available
      if (session.user.email) {
        setFormData(prev => ({ ...prev, corporateEmail: session.user.email || "" }));
      }
    };
    checkAuth();
  }, [navigate]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Sessão expirada. Faça login novamente.");
      navigate("/auth?redirect=/cadastro/embarcador");
      return;
    }

    if (!cnpjValid) {
      toast.error("Por favor, insira um CNPJ válido");
      return;
    }

    if (!cpfValid) {
      toast.error("Por favor, insira um CPF válido");
      return;
    }

    if (!formData.companySector || !formData.monthlyFreightVolume) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setIsLoading(true);

    try {
      // Check CNPJ duplicity
      const { data: duplicityCheck, error: duplicityError } = await supabase.functions.invoke(
        "check-cpf-cnpj-duplicity",
        { body: { document: formData.cnpj.replace(/\D/g, ""), type: "cnpj" } }
      );

      if (duplicityError) throw duplicityError;
      if (duplicityCheck?.exists) {
        toast.error("Este CNPJ já está cadastrado na plataforma");
        setIsLoading(false);
        return;
      }

      // Insert shipper profile
      const { error: insertError } = await supabase.from("shipper_profiles").insert({
        user_id: user.id,
        cnpj: formData.cnpj.replace(/\D/g, ""),
        razao_social: formData.razaoSocial || null,
        company_sector: formData.companySector,
        monthly_freight_volume: formData.monthlyFreightVolume,
        corporate_email: formData.corporateEmail,
        responsible_name: formData.responsibleName,
        responsible_cpf: formData.responsibleCpf.replace(/\D/g, ""),
        phone: formData.phone.replace(/\D/g, ""),
        accepts_whatsapp_contact: formData.acceptsWhatsappContact,
        status: "approved" // Auto-approve shippers for now
      });

      if (insertError) throw insertError;

      // Update profiles table with company info
      await supabase.from("profiles").upsert({
        user_id: user.id,
        full_name: formData.responsibleName,
        phone: formData.phone,
        cnpj: formData.cnpj.replace(/\D/g, ""),
        company_name: formData.razaoSocial,
        email: formData.corporateEmail
      }, { onConflict: "user_id" });

      setIsSubmitted(true);
      toast.success("Cadastro realizado com sucesso!");

      // Redirect to quote page after 2 seconds
      setTimeout(() => {
        navigate("/quote");
      }, 2000);

    } catch (error: any) {
      console.error("Error submitting shipper registration:", error);
      toast.error(error.message || "Erro ao realizar cadastro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-8 pb-8">
              <ConfirmationAnimation 
                title="Cadastro Concluído!" 
                description="Você será redirecionado para fazer sua primeira cotação..."
              />
            </CardContent>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cadastro de Embarcador | LogiMarket</title>
        <meta name="description" content="Cadastre sua empresa e comece a economizar até 42% nos seus fretes com cotação inteligente LogiMind." />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Início
          </Button>

          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Truck className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Cadastro de Embarcador</CardTitle>
              <CardDescription className="text-base">
                Cadastre sua empresa e comece a economizar com cotações inteligentes
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Data Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-foreground border-b pb-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Dados da Empresa
                  </div>

                  <CpfCnpjInput
                    value={formData.cnpj}
                    onChange={(value) => handleInputChange("cnpj", value)}
                    onValidationChange={setCnpjValid}
                    label="CNPJ *"
                    placeholder="00.000.000/0001-00"
                    required
                  />

                  <div className="space-y-2">
                    <Label htmlFor="razaoSocial">Razão Social</Label>
                    <Input
                      id="razaoSocial"
                      value={formData.razaoSocial}
                      onChange={(e) => handleInputChange("razaoSocial", e.target.value)}
                      placeholder="Nome da empresa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companySector">Setor da Empresa *</Label>
                    <Select
                      value={formData.companySector}
                      onValueChange={(value) => handleInputChange("companySector", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o setor" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_SECTORS.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlyFreightVolume">Volume Mensal de Fretes *</Label>
                    <Select
                      value={formData.monthlyFreightVolume}
                      onValueChange={(value) => handleInputChange("monthlyFreightVolume", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o volume" />
                      </SelectTrigger>
                      <SelectContent>
                        {FREIGHT_VOLUMES.map((volume) => (
                          <SelectItem key={volume.value} value={volume.value}>
                            {volume.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Responsible Data Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-foreground border-b pb-2">
                    <User className="w-5 h-5 text-primary" />
                    Dados do Responsável
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responsibleName">Nome Completo *</Label>
                    <Input
                      id="responsibleName"
                      value={formData.responsibleName}
                      onChange={(e) => handleInputChange("responsibleName", e.target.value)}
                      placeholder="Nome do responsável"
                      required
                    />
                  </div>

                  <CpfCnpjInput
                    value={formData.responsibleCpf}
                    onChange={(value) => handleInputChange("responsibleCpf", value)}
                    onValidationChange={setCpfValid}
                    label="CPF do Responsável *"
                    placeholder="000.000.000-00"
                    required
                  />

                  <div className="space-y-2">
                    <Label htmlFor="corporateEmail">E-mail Corporativo *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="corporateEmail"
                        type="email"
                        value={formData.corporateEmail}
                        onChange={(e) => handleInputChange("corporateEmail", e.target.value)}
                        placeholder="email@empresa.com.br"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <PhoneInput
                    value={formData.phone}
                    onChange={(value) => handleInputChange("phone", value)}
                    label="Telefone/Celular *"
                    required
                  />
                </div>

                {/* Communications Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-foreground border-b pb-2">
                    <Phone className="w-5 h-5 text-primary" />
                    Comunicações
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                    <Checkbox
                      id="whatsappConsent"
                      checked={formData.acceptsWhatsappContact}
                      onCheckedChange={(checked) => 
                        handleInputChange("acceptsWhatsappContact", checked === true)
                      }
                    />
                    <div className="space-y-1">
                      <Label htmlFor="whatsappConsent" className="font-medium cursor-pointer">
                        Aceito receber contato via WhatsApp
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Você receberá atualizações sobre seus fretes e ofertas exclusivas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-lg py-6"
                  disabled={isLoading || !cnpjValid || !cpfValid}
                >
                  {isLoading ? (
                    "Cadastrando..."
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Cadastrar e Começar a Cotar
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Ao se cadastrar, você concorda com nossos Termos de Uso e Política de Privacidade
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ShipperOnboarding;
