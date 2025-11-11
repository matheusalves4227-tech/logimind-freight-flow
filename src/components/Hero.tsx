import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Package, TrendingUp } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();
  const [originCep, setOriginCep] = useState("");
  const [destCep, setDestCep] = useState("");

  const handleQuickQuote = () => {
    if (originCep && destCep) {
      navigate(`/quote?origin=${originCep}&dest=${destCep}`);
    } else {
      navigate("/quote");
    }
  };

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 -z-10" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-full border border-secondary/30 shadow-sm">
              <TrendingUp className="h-5 w-5 text-secondary" />
              <span className="text-base font-bold text-foreground">
                Economize até 42% Comparando Fretes Agora!
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Cotação Inteligente:{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                Fretes mais Baratos
              </span>
              , Rotas Otimizadas
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl">
              Economize tempo e dinheiro comparando preços, prazos e qualidade de múltiplas transportadoras em segundos. 
              Decisões baseadas em dados reais com LogiMind AI.
            </p>

            {/* Quick quote CTA */}
            <div className="flex flex-col sm:flex-row gap-4 p-6 bg-card rounded-2xl shadow-md border border-border">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <Input 
                    placeholder="CEP Origem" 
                    className="flex-1"
                    value={originCep}
                    onChange={(e) => setOriginCep(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-secondary" />
                  <Input 
                    placeholder="CEP Destino" 
                    className="flex-1"
                    value={destCep}
                    onChange={(e) => setDestCep(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                variant="hero" 
                size="xl" 
                className="sm:self-center"
                onClick={handleQuickQuote}
              >
                Ver Opções em 3 Segundos
              </Button>
            </div>

            {/* Stats */}
            <div className="space-y-3 pt-4">
              <div className="flex gap-8">
                <div>
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Transportadoras</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-secondary">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-accent">24h</div>
                  <div className="text-sm text-muted-foreground">Suporte</div>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full border border-border">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  Powered by <span className="text-primary font-bold">LogiMind AI</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right visual - Simplified Single Card */}
          <div className="relative lg:h-[600px] hidden lg:block">
            <div className="absolute inset-0 bg-gradient-hero opacity-20 rounded-3xl blur-3xl" />
            <div className="relative h-full flex items-center justify-center">
              <div className="w-full max-w-md">
                {/* Single Unified Value Proposition Card */}
                <div className="bg-card rounded-2xl p-8 shadow-2xl border-2 border-primary/20 hover:border-primary/40 transition-all">
                  <div className="text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full">
                      <TrendingUp className="h-4 w-4 text-secondary" />
                      <span className="text-sm font-bold text-secondary">LogiMind AI</span>
                    </div>
                    
                    <div>
                      <div className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
                        42%
                      </div>
                      <div className="text-lg font-semibold text-foreground mb-1">
                        Economia Média
                      </div>
                      <div className="text-sm text-muted-foreground">
                        comparando fretes automaticamente
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                      <div>
                        <div className="text-2xl font-bold text-primary">3s</div>
                        <div className="text-xs text-muted-foreground">Cotação</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-secondary">500+</div>
                        <div className="text-xs text-muted-foreground">Opções</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-accent">100%</div>
                        <div className="text-xs text-muted-foreground">Transparente</div>
                      </div>
                    </div>

                    <div className="pt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-secondary" />
                        <span>Preços otimizados em tempo real</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span>Comparação instantânea</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <span>Decisões baseadas em dados</span>
                      </div>
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

export default Hero;
