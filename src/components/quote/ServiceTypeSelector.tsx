import { Package, Lightbulb, Truck, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ServiceTypeSelectorProps {
  serviceType: string;
  onServiceTypeChange: (type: string) => void;
}

export const ServiceTypeSelector = ({ serviceType, onServiceTypeChange }: ServiceTypeSelectorProps) => {
  return (
    <Card className="p-4 md:p-6 mb-4 md:mb-6 shadow-md">
      <h3 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Escolha o tipo de serviço</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {/* Card LTL - Com badge Recomendado */}
        <button
          type="button"
          onClick={() => onServiceTypeChange("ltl")}
          className={`relative p-4 md:p-6 rounded-xl border-2 transition-all duration-300 text-left group hover:-translate-y-1 hover:shadow-lg ${
            serviceType === "ltl"
              ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
              : "border-border hover:border-primary/50 hover:bg-primary/[0.02]"
          }`}
        >
          {/* Badge Recomendado */}
          <Badge 
            className="absolute -top-2 right-4 bg-secondary text-secondary-foreground shadow-sm"
          >
            ⭐ Recomendado
          </Badge>

          <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
            <div className={`p-2 rounded-lg transition-colors duration-300 ${
              serviceType === "ltl" ? "bg-primary/20" : "bg-primary/10 group-hover:bg-primary/15"
            }`}>
              <Package className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-base md:text-lg">Frete Padrão (LTL)</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Carga Fracionada
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Consolidado, econômico. Ideal para caixas e pallets.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium">
              📦 Caixas
            </span>
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium">
              🏭 Pallets
            </span>
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium">
              💰 Econômico
            </span>
          </div>
        </button>

        {/* Card FTL */}
        <button
          type="button"
          onClick={() => onServiceTypeChange("ftl")}
          className={`p-4 md:p-6 rounded-xl border-2 transition-all duration-300 text-left group hover:-translate-y-1 hover:shadow-lg ${
            serviceType === "ftl"
              ? "border-accent bg-accent/5 shadow-md ring-2 ring-accent/20"
              : "border-border hover:border-accent/50 hover:bg-accent/[0.02]"
          }`}
        >
          <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
            <div className={`p-2 rounded-lg transition-colors duration-300 ${
              serviceType === "ftl" ? "bg-accent/20" : "bg-accent/10 group-hover:bg-accent/15"
            }`}>
              <Truck className="h-5 w-5 md:h-6 md:w-6 text-accent" />
            </div>
            <div>
              <h4 className="font-bold text-base md:text-lg">Frete Dedicado (FTL)</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Veículo Exclusivo
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Veículo exclusivo, urgência. Motoristas e Veículos Dedicados.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-md font-medium">
              🚚 Caminhão Completo
            </span>
            <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-md font-medium">
              🏍️ Entregas Rápidas
            </span>
            <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-md font-medium">
              ⚡ Urgente
            </span>
          </div>
        </button>
      </div>

      {serviceType === "ftl" && (
        <div className="mt-4 p-4 bg-accent/5 border-2 border-accent/30 rounded-xl animate-fade-in shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">
                <strong className="text-accent">Novo Recurso:</strong> Sistema de Lances para FTL
              </p>
              <p className="text-sm text-muted-foreground">
                No serviço Dedicado, você receberá ofertas de motoristas autônomos qualificados 
                que darão lances de preço e prazo para sua carga em tempo real.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
