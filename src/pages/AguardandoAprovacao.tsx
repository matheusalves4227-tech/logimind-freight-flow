import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle, Home } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AguardandoAprovacao = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkApprovalStatus();
  }, []);

  const checkApprovalStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Verificar se é motorista
      const { data: driverProfile } = await supabase
        .from("driver_profiles")
        .select("status")
        .eq("user_id", user.id)
        .single();

      if (driverProfile) {
        setStatus(driverProfile.status);
        
        if (driverProfile.status === "approved") {
          toast.success("Cadastro aprovado! Redirecionando...");
          setTimeout(() => navigate("/motorista/dashboard"), 2000);
        }
      } else {
        // Verificar se é transportadora B2B
        const { data: b2bProfile } = await supabase
          .from("b2b_carriers")
          .select("status")
          .eq("user_id", user.id)
          .single();

        if (b2bProfile) {
          setStatus(b2bProfile.status);
          
          if (b2bProfile.status === "approved") {
            toast.success("Cadastro aprovado! Redirecionando...");
            setTimeout(() => navigate("/dashboard"), 2000);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      toast.error("Erro ao verificar status de aprovação");
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case "pending":
        return {
          icon: <Clock className="h-16 w-16 text-warning" />,
          title: "Aguardando Aprovação",
          description: "Seu cadastro está em análise. Entraremos em contato em até 48 horas.",
          color: "border-warning/20 bg-warning/5"
        };
      case "approved":
        return {
          icon: <CheckCircle2 className="h-16 w-16 text-success" />,
          title: "Cadastro Aprovado!",
          description: "Parabéns! Seu cadastro foi aprovado. Redirecionando...",
          color: "border-success/20 bg-success/5"
        };
      case "rejected":
        return {
          icon: <XCircle className="h-16 w-16 text-destructive" />,
          title: "Cadastro Não Aprovado",
          description: "Infelizmente seu cadastro não foi aprovado. Entre em contato conosco para mais informações.",
          color: "border-destructive/20 bg-destructive/5"
        };
      default:
        return {
          icon: <Clock className="h-16 w-16 text-muted-foreground" />,
          title: "Verificando Status",
          description: "Aguarde enquanto verificamos seu cadastro...",
          color: "border-border"
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando status...</p>
          </div>
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <Card className={`p-8 shadow-lg text-center ${statusDisplay.color}`}>
            <div className="flex justify-center mb-6">
              {statusDisplay.icon}
            </div>
            
            <h1 className="text-3xl font-bold mb-4">
              {statusDisplay.title}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8">
              {statusDisplay.description}
            </p>

            {status === "pending" && (
              <div className="bg-muted/50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-3">O que acontece agora?</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-md mx-auto">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Nossa equipe está analisando sua documentação</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Você receberá um e-mail com o resultado em até 48 horas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Em caso de aprovação, você poderá acessar sua área de trabalho</span>
                  </li>
                </ul>
              </div>
            )}

            {status === "rejected" && (
              <div className="bg-muted/50 rounded-lg p-6 mb-6">
                <p className="text-sm text-muted-foreground">
                  Entre em contato conosco através do e-mail{" "}
                  <a href="mailto:contato@logimarket.com" className="text-primary hover:underline">
                    contato@logimarket.com
                  </a>
                  {" "}para obter mais informações sobre a recusa.
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
              >
                <Home className="h-4 w-4 mr-2" />
                Ir para Início
              </Button>
              
              {status === "pending" && (
                <Button
                  onClick={checkApprovalStatus}
                  variant="default"
                >
                  Atualizar Status
                </Button>
              )}
            </div>
          </Card>

          {status === "pending" && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                Precisa de ajuda?{" "}
                <a href="mailto:suporte@logimarket.com" className="text-primary hover:underline">
                  Entre em contato conosco
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AguardandoAprovacao;
