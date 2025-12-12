import { ArrowRight, UserPlus, Brain, FileCheck, Bell } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "1",
    title: "Cote ou Cadastre",
    description: "Escolha sua função: Embarcador, Transportadora ou Autônomo. Cadastro rápido e sem burocracia.",
    color: "secondary",
  },
  {
    icon: Brain,
    number: "2",
    title: "Conexão Inteligente",
    description: "O LogiMind encontra o melhor match de preço, performance e risco em tempo real.",
    color: "primary",
  },
  {
    icon: FileCheck,
    number: "3",
    title: "Execute",
    description: "Gerencie o frete completo: documentação, pagamento e rastreamento na plataforma.",
    color: "accent",
  },
  {
    icon: Bell,
    number: "4",
    title: "Monitore",
    description: "Receba alertas e acompanhe performance (OTIF, custos e eficiência) em tempo real.",
    color: "primary",
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
            Fluxo simples e universal para embarcadores, transportadoras e motoristas autônomos
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Connection lines */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-secondary via-primary via-accent to-primary -z-10" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const colorClasses = {
                secondary: {
                  bg: "bg-secondary",
                  text: "text-secondary",
                  border: "border-secondary/30 hover:border-secondary",
                  gradient: "from-secondary/20 to-secondary/5",
                },
                primary: {
                  bg: "bg-primary",
                  text: "text-primary",
                  border: "border-primary/30 hover:border-primary",
                  gradient: "from-primary/20 to-primary/5",
                },
                accent: {
                  bg: "bg-accent",
                  text: "text-accent",
                  border: "border-accent/30 hover:border-accent",
                  gradient: "from-accent/20 to-accent/5",
                },
              };
              const colors = colorClasses[step.color as keyof typeof colorClasses];

              return (
                <div key={index} className="relative group">
                  {/* Glassmorphism card */}
                  <div className={`bg-card/60 backdrop-blur-md bg-gradient-to-b ${colors.gradient} rounded-[20px] p-6 shadow-lg border-2 ${colors.border} hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full`}>
                    {/* Número do passo */}
                    <div className={`absolute -top-4 -left-4 w-12 h-12 ${colors.bg} rounded-full flex items-center justify-center shadow-lg border-4 border-background`}>
                      <span className="text-xl font-bold text-primary-foreground">{step.number}</span>
                    </div>

                    {/* Ícone */}
                    <div className={`inline-flex p-4 rounded-xl ${colors.bg}/10 mb-6 mt-4`}>
                      <Icon className={`h-8 w-8 ${colors.text}`} />
                    </div>

                    {/* Conteúdo */}
                    <h3 className="text-xl font-bold mb-3 text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex absolute top-16 -right-4 z-10">
                      <ArrowRight className={`h-6 w-6 ${colors.text}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Call-to-action footer */}
        <div className="text-center mt-16">
          <p className="text-lg text-muted-foreground mb-2">
            Junte-se aos milhares de profissionais que otimizam sua logística com inteligência
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-secondary/10 via-primary/10 to-accent/10 rounded-full border border-border backdrop-blur-sm">
            <Brain className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-foreground">
              Marketplace Triplo + IA Preditiva = Decisões Imbatíveis
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
