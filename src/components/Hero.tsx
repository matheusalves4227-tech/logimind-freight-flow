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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Precificação Inteligente com LogiMind
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Simplifique sua{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                Logística
              </span>
              {" "}com Transparência Total
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl">
              Compare preços, prazos e qualidade de múltiplas transportadoras em segundos. 
              Tome decisões inteligentes baseadas em dados reais.
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
                Cotar Agora
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
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
          </div>

          {/* Right visual */}
          <div className="relative lg:h-[600px] hidden lg:block">
            <div className="absolute inset-0 bg-gradient-hero opacity-20 rounded-3xl blur-3xl" />
            <div className="relative h-full flex items-center justify-center">
              <div className="space-y-4 w-full max-w-md">
                {/* Mock comparison cards */}
                <div className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-semibold text-lg">Express Log</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-secondary" />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">5.0</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">R$ 285</div>
                      <div className="text-xs text-muted-foreground">3-5 dias</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 text-center py-2 bg-secondary/10 rounded text-xs font-medium text-secondary">
                      Melhor Qualidade
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-semibold text-lg">Rápido Trans</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-secondary" />
                          ))}
                          <div className="w-2 h-2 rounded-full bg-muted" />
                        </div>
                        <span className="text-xs text-muted-foreground">4.2</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">R$ 195</div>
                      <div className="text-xs text-muted-foreground">2-3 dias</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 text-center py-2 bg-accent/10 rounded text-xs font-medium text-accent">
                      Mais Rápido
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-semibold text-lg">EconoFrete</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-secondary" />
                          ))}
                          {[4, 5].map((i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-muted" />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">3.8</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">R$ 165</div>
                      <div className="text-xs text-muted-foreground">5-7 dias</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 text-center py-2 bg-primary/10 rounded text-xs font-medium text-primary">
                      Melhor Preço
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
