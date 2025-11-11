import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Truck, Building2, User, TrendingUp, BarChart3, Map } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 -z-10" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Sua Logística Inteligente.{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Seu Frete Otimizado.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Conectando embarcadores, transportadoras e motoristas autônomos através de tecnologia inteligente e precificação dinâmica.
          </p>
        </div>

        {/* 3 Cards de Direcionamento Triplo */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {/* Card 1: Embarcador (Verde) */}
          <div className="group bg-card rounded-3xl p-8 shadow-lg border-2 border-secondary/30 hover:border-secondary hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-secondary/20 rounded-2xl blur-xl" />
                <div className="relative p-6 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl">
                  <Truck className="h-12 w-12 text-secondary-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">
                  Quero Cotação Preditiva
                </h3>
                <p className="text-sm text-muted-foreground">
                  LogiMind AI analisa risco e preço em tempo real para o menor CAC logístico
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-secondary">
                <BarChart3 className="h-4 w-4" />
                <span>Powered by LogiMind</span>
              </div>

              <Button 
                variant="default"
                size="lg" 
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/quote")}
              >
                Começar a Cotar Agora
              </Button>

              <div className="pt-4 space-y-1 text-xs text-muted-foreground border-t border-border w-full">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>Compare 500+ transportadoras</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>Resultado em 3 segundos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Transportadora (Azul) */}
          <div className="group bg-card rounded-3xl p-8 shadow-lg border-2 border-primary/30 hover:border-primary hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
                <div className="relative p-6 bg-gradient-to-br from-primary to-primary/80 rounded-2xl">
                  <Building2 className="h-12 w-12 text-primary-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">
                  Quero Ofertar Meus Fretes
                </h3>
                <p className="text-sm text-muted-foreground">
                  Acesse milhares de embarcadores e maximize a ocupação da sua frota
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <TrendingUp className="h-4 w-4" />
                <span>Volume + Clientes</span>
              </div>

              <Button 
                variant="default"
                size="lg" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/parceiro/cadastro")}
              >
                Cadastrar Minha Frota
              </Button>

              <div className="pt-4 space-y-1 text-xs text-muted-foreground border-t border-border w-full">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Otimização de rotas de retorno</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Pagamento garantido em D+2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Motorista Autônomo (Laranja) */}
          <div className="group bg-card rounded-3xl p-8 shadow-lg border-2 border-accent/30 hover:border-accent hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-xl" />
                <div className="relative p-6 bg-gradient-to-br from-accent to-accent/80 rounded-2xl">
                  <User className="h-12 w-12 text-accent-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">
                  Quero Encontrar Fretes
                </h3>
                <p className="text-sm text-muted-foreground">
                  Fretes spot, dedicados e last-mile na sua região com pagamento rápido
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-accent">
                <Map className="h-4 w-4" />
                <span>Frete + Renda</span>
              </div>

              <Button 
                variant="default"
                size="lg" 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/parceiro/cadastro")}
              >
                Ver Fretes Disponíveis
              </Button>

              <div className="pt-4 space-y-1 text-xs text-muted-foreground border-t border-border w-full">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span>Margem otimizada por rota</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span>App com rastreamento GPS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
