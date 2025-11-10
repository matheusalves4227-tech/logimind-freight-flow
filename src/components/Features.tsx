import { TrendingUp, Search, Shield, Clock } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Cotação Instantânea",
    description: "Compare múltiplas transportadoras em segundos. Interface simples e intuitiva para cotações rápidas.",
    color: "primary",
  },
  {
    icon: TrendingUp,
    title: "Precificação Inteligente",
    description: "LogiMind otimiza preços dinamicamente baseado em rotas, demanda e qualidade de serviço.",
    color: "secondary",
  },
  {
    icon: Shield,
    title: "Transparência Total",
    description: "Veja preço, prazo e índice de qualidade lado a lado. Decisões informadas e seguras.",
    color: "accent",
  },
  {
    icon: Clock,
    title: "Rastreamento Unificado",
    description: "Acompanhe todas as suas cargas em um único painel. Sem precisar acessar múltiplos sites.",
    color: "primary",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Por que escolher o{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              LogiMarket
            </span>
            ?
          </h2>
          <p className="text-lg text-muted-foreground">
            Tecnologia de ponta para simplificar suas operações logísticas e maximizar resultados
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`inline-flex p-3 rounded-xl bg-${feature.color}/10 mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 text-${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
