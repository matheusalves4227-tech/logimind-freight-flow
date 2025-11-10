import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-10 -z-10" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center bg-card rounded-3xl p-12 shadow-xl border border-border">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pronto para Simplificar sua Logística?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de empresas que já economizam tempo e dinheiro com o LogiMarket. 
            Comece gratuitamente hoje mesmo.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" className="group">
              Começar Grátis
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="xl">
              Agendar Demo
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Sem cartão de crédito necessário • Cancele quando quiser • Suporte 24/7
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
