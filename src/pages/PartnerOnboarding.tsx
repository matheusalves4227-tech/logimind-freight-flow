import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, Truck } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import B2BOnboarding from "@/components/partner/B2BOnboarding";
import AutonomousOnboarding from "@/components/partner/AutonomousOnboarding";
import { validateCPF, validateCNPJ } from "@/lib/validators";

type PartnerType = "b2b" | "autonomous" | null;

const PartnerOnboarding = () => {
  const navigate = useNavigate();
  const [partnerType, setPartnerType] = useState<PartnerType>(null);
  const [cnpjCpf, setCnpjCpf] = useState("");

  const handleTriagem = () => {
    const cleanValue = cnpjCpf.replace(/\D/g, "");
    
    // CNPJ tem 14 dígitos, CPF tem 11
    if (cleanValue.length === 14) {
      if (!validateCNPJ(cleanValue)) {
        toast.error("CNPJ inválido. Verifique os dígitos verificadores.");
        return;
      }
      setPartnerType("b2b");
    } else if (cleanValue.length === 11) {
      if (!validateCPF(cleanValue)) {
        toast.error("CPF inválido. Verifique os dígitos verificadores.");
        return;
      }
      setPartnerType("autonomous");
    }
  };

  if (partnerType === "b2b") {
    return <B2BOnboarding cnpj={cnpjCpf} onBack={() => setPartnerType(null)} />;
  }

  if (partnerType === "autonomous") {
    return <AutonomousOnboarding cpf={cnpjCpf} onBack={() => setPartnerType(null)} />;
  }

  return (
    <>
      <Helmet>
        <title>Cadastre sua Transportadora - Aumente Seus Fretes | LogiMarket</title>
        <meta name="description" content="Cadastre sua transportadora ou torne-se motorista parceiro. Acesse milhares de oportunidades de frete e aumente sua receita." />
        <link rel="canonical" href="https://logimarket.com.br/parceiro/cadastro" />
        <meta property="og:url" content="https://logimarket.com.br/parceiro/cadastro" />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3">
              Multiplique Seus Fretes com{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                LogiMarket
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Conecte-se a centenas de embarcadores e otimize sua operação
            </p>
          </div>

          <Card className="p-8 shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-2">
                Cadastro de Parceiro Logístico
              </h2>
              <p className="text-muted-foreground">
                Vamos identificar o melhor fluxo para você
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cnpj_cpf">CNPJ ou CPF *</Label>
                <Input
                  id="cnpj_cpf"
                  placeholder="00.000.000/0000-00 ou 000.000.000-00"
                  value={cnpjCpf}
                  onChange={(e) => setCnpjCpf(e.target.value)}
                  maxLength={18}
                />
                <p className="text-sm text-muted-foreground">
                  <strong>CNPJ:</strong> Para transportadoras e empresas logísticas<br />
                  <strong>CPF:</strong> Para motoristas autônomos e PJ individuais
                </p>
              </div>

              <Button
                onClick={handleTriagem}
                disabled={cnpjCpf.replace(/\D/g, "").length < 11}
                className="w-full"
                size="lg"
              >
                Continuar Cadastro
              </Button>

              <div className="grid md:grid-cols-2 gap-4 mt-8 pt-6 border-t">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3 mb-2">
                    <Building2 className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold text-primary">
                        Transportadora B2B
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Grande frota, operação estruturada
                      </p>
                    </div>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-9">
                    <li>• Integração via API</li>
                    <li>• Múltiplas rotas simultâneas</li>
                    <li>• Rastreamento corporativo</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <div className="flex items-start gap-3 mb-2">
                    <Truck className="h-6 w-6 text-accent mt-1" />
                    <div>
                      <h3 className="font-semibold text-accent">
                        Motorista Autônomo
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Flexibilidade, agilidade urbana
                      </p>
                    </div>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-9">
                    <li>• Cadastro simplificado</li>
                    <li>• Lances para cargas FTL</li>
                    <li>• App de rastreamento</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
};

export default PartnerOnboarding;
