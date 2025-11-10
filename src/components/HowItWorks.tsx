import { ArrowRight, Search, BarChart3, Truck } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "1. Insira os Detalhes",
    description: "CEP origem, destino, peso e dimensões. Simples e rápido.",
  },
  {
    icon: BarChart3,
    title: "2. Compare Ofertas",
    description: "Veja preços, prazos e qualidade de todas as transportadoras.",
  },
  {
    icon: Truck,
    title: "3. Contrate e Rastreie",
    description: "Escolha a melhor opção e acompanhe sua carga em tempo real.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Como Funciona
          </h2>
          <p className="text-lg text-muted-foreground">
            Três passos simples para revolucionar sua logística
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connection lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent -translate-y-1/2 -z-10" />

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <div className="bg-card rounded-2xl p-8 shadow-md border border-border hover:shadow-lg transition-all">
                    <div className="inline-flex p-4 rounded-xl bg-gradient-primary mb-6">
                      <Icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-10">
                      <ArrowRight className="h-8 w-8 text-primary" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
