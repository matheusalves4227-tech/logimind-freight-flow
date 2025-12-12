import { TrendingUp, Package, Users, Brain, Sparkles } from "lucide-react";

const Features = () => {
  return (
    <section id="features" className="py-20 bg-background-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bloco de Dados Chave (Prova de Escala) */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8">
            A Plataforma que{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Conecta Todo o Mercado
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 md:mb-12 px-4 md:px-0">
            {/* Métrica 1: Volume */}
            <div className="group bg-card/80 backdrop-blur-md rounded-[20px] p-6 md:p-8 shadow-lg border-2 border-secondary/20 hover:border-secondary/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="inline-flex p-3 rounded-xl bg-secondary/10 mb-4">
                <Package className="h-8 w-8 text-secondary" />
              </div>
              <div className="text-4xl font-bold text-secondary mb-2">2.5M+</div>
              <div className="text-lg font-bold text-foreground mb-1">
                Toneladas/Mês
              </div>
              <div className="text-sm text-muted-foreground">
                Volume transportado mensalmente
              </div>
            </div>

            {/* Métrica 2: Parceiros */}
            <div className="group bg-card/80 backdrop-blur-md rounded-[20px] p-6 md:p-8 shadow-lg border-2 border-primary/20 hover:border-primary/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="text-4xl font-bold text-primary mb-2">1.200+</div>
              <div className="text-lg font-bold text-foreground mb-1">
                Parceiros Logísticos
              </div>
              <div className="text-sm text-muted-foreground">
                Transportadoras e autônomos ativos
              </div>
            </div>

            {/* Métrica 3: Economia (DESTAQUE) */}
            <div className="group bg-card/80 backdrop-blur-md rounded-[20px] p-6 md:p-8 shadow-xl border-2 border-secondary hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative md:transform md:scale-105">
              <div className="absolute -top-3 right-4 z-10">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full shadow-lg">
                  🎯 Destaque
                </span>
              </div>
              <div className="inline-flex p-4 rounded-xl bg-secondary/10 mb-4">
                <TrendingUp className="h-10 w-10 text-secondary" />
              </div>
              <div className="text-5xl md:text-6xl font-black text-secondary mb-2">42%</div>
              <div className="text-xl font-bold text-foreground mb-1">
                Redução de Custo
              </div>
              <div className="text-sm text-muted-foreground">
                Economia média em logística
              </div>
            </div>
          </div>
        </div>

        {/* Banner LogiMind com Glassmorphism e Animated Border */}
        <div className="max-w-5xl mx-auto px-4 md:px-0">
          <div className="relative overflow-hidden">
            {/* Animated gradient border */}
            <div className="absolute -inset-[2px] bg-gradient-to-r from-primary via-[hsl(190,80%,50%)] to-primary rounded-[22px] animate-gradient-x opacity-75" />
            
            {/* Card content with glassmorphism */}
            <div className="relative bg-card/90 backdrop-blur-xl rounded-[20px] p-6 md:p-10 shadow-2xl">
              {/* Background decorativo */}
              <div className="absolute inset-0 bg-gradient-hero opacity-5 rounded-[20px]" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
              
              <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
                {/* Ícone LogiMind */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-hero opacity-30 rounded-2xl blur-xl animate-pulse" />
                    <div className="relative p-6 md:p-8 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-2xl">
                      <Brain className="h-12 w-12 md:h-16 md:w-16 text-primary-foreground" />
                    </div>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 text-center md:text-left space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-[hsl(190,80%,50%)]/20 rounded-full border border-primary/40">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold text-primary">Powered by AI</span>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                    LogiMind: A IA que Garante o{" "}
                    <span className="bg-gradient-hero bg-clip-text text-transparent">
                      Custo Total Otimizado
                    </span>
                  </h3>
                  
                  <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
                    Análise preditiva de risco e preço em tempo real. Transparência total na comissão, 
                    otimização de rotas de retorno e precificação dinâmica baseada em demanda.
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-lg border border-border">
                      <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                      <span className="text-sm font-medium text-foreground">Preço + Performance</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-lg border border-border">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-sm font-medium text-foreground">Análise de Risco OTIF</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-lg border border-border">
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      <span className="text-sm font-medium text-foreground">Otimização Contínua</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
