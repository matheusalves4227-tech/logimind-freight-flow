import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Truck, Building2, User, TrendingUp, BarChart3, Map, Sparkles } from "lucide-react";
import heroIllustration from "@/assets/hero-logistics-illustration.png";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 -z-10" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section with Illustration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto mb-16">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Sua Logística Inteligente.{" "}
              <span className="text-primary">
                Seu Frete Otimizado.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              Conectando embarcadores, transportadoras e motoristas autônomos através de tecnologia inteligente e precificação dinâmica.
            </p>
          </div>
          
          {/* Illustration */}
          <div className="relative animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-3xl blur-3xl animate-pulse-slow" />
            <img 
              src={heroIllustration} 
              alt="Ilustração de Logística Inteligente" 
              className="relative w-full h-auto rounded-2xl"
            />
          </div>
        </div>

        {/* 4 Cards de Direcionamento com 3D Hover Effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 max-w-7xl mx-auto mb-12 md:mb-20 px-4 md:px-0 items-stretch">
          {/* Card 1: Embarcador (DESTAQUE PRINCIPAL) */}
          <div className="group bg-card/80 backdrop-blur-md rounded-[20px] p-6 md:p-8 shadow-xl border-2 border-primary card-3d-hover relative animate-fade-in">
            {/* Badge de Destaque */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-primary to-[hsl(217,82%,45%)] text-primary-foreground text-xs font-bold rounded-full shadow-lg">
                <Sparkles className="h-3 w-3" />
                Mais Popular
              </span>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/30 transition-all duration-300" />
                <div className="relative p-6 bg-gradient-to-br from-primary to-[hsl(217,82%,45%)] rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Truck className="h-12 w-12 text-primary-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">
                  Quero Cotação Preditiva
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  LogiMind AI analisa risco e preço em tempo real garantindo o melhor custo-benefício
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <BarChart3 className="h-4 w-4" />
                <span>Powered by LogiMind</span>
              </div>

              <div className="w-full space-y-2">
                <Button 
                  size="lg" 
                  className="w-full h-12 btn-gradient-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg animate-pulse-subtle"
                  onClick={() => navigate("/cadastro/embarcador")}
                >
                  Cadastre sua Empresa Grátis
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="w-full text-xs text-muted-foreground hover:text-primary"
                  onClick={() => navigate("/quote")}
                >
                  Já tenho cadastro? Cotar agora
                </Button>
              </div>

              <div className="pt-4 space-y-2 text-xs text-muted-foreground border-t border-border w-full">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Compare 500+ transportadoras</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Resultado em 3 segundos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Transportadora */}
          <div className="group bg-card/80 backdrop-blur-md rounded-[20px] p-6 md:p-8 shadow-lg border-2 border-border hover:border-secondary/50 card-3d-hover">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-6 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl shadow-md group-hover:shadow-lg transition-shadow">
                  <Building2 className="h-12 w-12 text-secondary-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">
                  Quero Ofertar Meus Fretes
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Acesse milhares de embarcadores e maximize a ocupação da sua frota
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-secondary">
                <TrendingUp className="h-4 w-4" />
                <span>Volume + Clientes</span>
              </div>

              <Button 
                size="lg" 
                className="w-full h-12 btn-gradient-primary text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-300 rounded-lg"
                onClick={() => navigate("/auth?redirect=/parceiro/cadastro?tipo=transportadora")}
              >
                Oferecer Fretes
              </Button>

              <div className="pt-4 space-y-2 text-xs text-muted-foreground border-t border-border w-full">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>Otimização de rotas de retorno</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>Pagamento garantido em D+2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Motorista Autônomo */}
          <div className="group bg-card/80 backdrop-blur-md rounded-[20px] p-6 md:p-8 shadow-lg border-2 border-border hover:border-accent/50 card-3d-hover">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-6 bg-gradient-to-br from-accent to-accent/80 rounded-2xl shadow-md group-hover:shadow-lg transition-shadow">
                  <User className="h-12 w-12 text-accent-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">
                  Quero Encontrar Fretes
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Fretes spot, dedicados e last-mile na sua região com pagamento rápido
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-accent">
                <Map className="h-4 w-4" />
                <span>Frete + Renda</span>
              </div>

              <Button 
                size="lg" 
                className="w-full h-12 btn-gradient-primary text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-300 rounded-lg"
                onClick={() => navigate("/auth?redirect=/parceiro/cadastro?tipo=motorista")}
              >
                Ver Fretes Disponíveis
              </Button>

              <div className="pt-4 space-y-2 text-xs text-muted-foreground border-t border-border w-full">
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

          {/* Card 4: Empresas B2B */}
          <div className="group bg-card/80 backdrop-blur-md rounded-[20px] p-6 md:p-8 shadow-xl border-2 border-accent card-3d-hover relative animate-fade-in bg-gradient-to-br from-accent/5 to-accent/10">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-xl group-hover:bg-accent/30 transition-all duration-300" />
                <div className="relative p-6 bg-gradient-to-br from-accent to-accent/80 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Building2 className="h-12 w-12 text-primary-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">
                  Contrato B2B Recorrente
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tabela diferenciada, SLA garantido e prioridade para empresas com volume
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-accent">
                <TrendingUp className="h-4 w-4" />
                <span>Economia em Escala</span>
              </div>

              <Button 
                size="lg" 
                className="w-full h-12 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-300 rounded-lg"
                onClick={() => navigate("/cotacao-b2b")}
              >
                Solicitar Cotação B2B
              </Button>

              <div className="pt-4 space-y-2 text-xs text-muted-foreground border-t border-border w-full">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span>Descontos por volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span>Relatórios personalizados</span>
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
