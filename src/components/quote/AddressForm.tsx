import { MapPin, Flag, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressFormProps {
  formData: {
    origin_cep: string;
    origin_number: string;
    origin_type: string;
    origin_address: string;
    origin_neighborhood: string;
    origin_city: string;
    destination_cep: string;
    destination_number: string;
    destination_type: string;
    destination_address: string;
    destination_neighborhood: string;
    destination_city: string;
  };
  loadingCep: "origin" | "destination" | null;
  onFormChange: (updates: Partial<AddressFormProps["formData"]>) => void;
  onCepChange: (cep: string, type: "origin" | "destination") => void;
}

export const AddressForm = ({ formData, loadingCep, onFormChange, onCepChange }: AddressFormProps) => {
  return (
    <div className="relative">
      {/* Linha vertical pontilhada conectando origem e destino */}
      <div className="absolute left-6 top-12 bottom-12 w-0.5 border-l-2 border-dashed border-primary/30 hidden md:block" />

      <div className="space-y-6">
        {/* Endereço de Origem */}
        <div className="relative space-y-4 p-4 md:p-5 bg-muted/30 rounded-xl border border-border/50">
          {/* Ícone de Pino Azul */}
          <div className="absolute -left-3 top-6 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md hidden md:flex">
            <MapPin className="h-3.5 w-3.5 text-primary-foreground" />
          </div>

          <h3 className="font-semibold flex items-center gap-2 text-primary">
            <MapPin className="h-4 w-4 md:hidden" />
            Endereço de Origem
          </h3>
          
          {/* Grid 3:1 para CEP e Número */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3 space-y-2">
              <Label htmlFor="origin_cep">CEP *</Label>
              <div className="relative">
                <Input
                  id="origin_cep"
                  placeholder="00000-000"
                  value={formData.origin_cep}
                  onChange={(e) => {
                    const value = e.target.value;
                    onFormChange({ origin_cep: value });
                    if (value.replace(/\D/g, "").length === 8) {
                      onCepChange(value, "origin");
                    }
                  }}
                  disabled={loadingCep === "origin"}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                />
                {loadingCep === "origin" && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                )}
              </div>
            </div>

            <div className="col-span-1 space-y-2">
              <Label htmlFor="origin_number">Nº *</Label>
              <Input
                id="origin_number"
                placeholder="123"
                value={formData.origin_number}
                onChange={(e) => onFormChange({ origin_number: e.target.value })}
                required
                className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {formData.origin_address && (
            <div className="grid md:grid-cols-3 gap-3 animate-fade-in">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Logradouro</Label>
                <Input value={formData.origin_address} disabled className="bg-muted/50 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Bairro</Label>
                <Input value={formData.origin_neighborhood} disabled className="bg-muted/50 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Cidade</Label>
                <Input value={formData.origin_city} disabled className="bg-muted/50 text-sm" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="origin_type" className="text-sm">Tipo de Local</Label>
            <select
              id="origin_type"
              value={formData.origin_type}
              onChange={(e) => onFormChange({ origin_type: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="commercial">🏢 Comercial</option>
              <option value="residential">🏠 Residencial</option>
            </select>
          </div>
        </div>

        {/* Endereço de Destino */}
        <div className="relative space-y-4 p-4 md:p-5 bg-muted/30 rounded-xl border border-border/50">
          {/* Ícone de Bandeira */}
          <div className="absolute -left-3 top-6 w-6 h-6 rounded-full bg-secondary flex items-center justify-center shadow-md hidden md:flex">
            <Flag className="h-3.5 w-3.5 text-secondary-foreground" />
          </div>

          <h3 className="font-semibold flex items-center gap-2 text-secondary">
            <Flag className="h-4 w-4 md:hidden" />
            Endereço de Destino
          </h3>
          
          {/* Grid 3:1 para CEP e Número */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3 space-y-2">
              <Label htmlFor="destination_cep">CEP *</Label>
              <div className="relative">
                <Input
                  id="destination_cep"
                  placeholder="00000-000"
                  value={formData.destination_cep}
                  onChange={(e) => {
                    const value = e.target.value;
                    onFormChange({ destination_cep: value });
                    if (value.replace(/\D/g, "").length === 8) {
                      onCepChange(value, "destination");
                    }
                  }}
                  disabled={loadingCep === "destination"}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-secondary/20"
                />
                {loadingCep === "destination" && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-secondary" />
                )}
              </div>
            </div>

            <div className="col-span-1 space-y-2">
              <Label htmlFor="destination_number">Nº *</Label>
              <Input
                id="destination_number"
                placeholder="123"
                value={formData.destination_number}
                onChange={(e) => onFormChange({ destination_number: e.target.value })}
                required
                className="transition-all duration-300 focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          {formData.destination_address && (
            <div className="grid md:grid-cols-3 gap-3 animate-fade-in">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Logradouro</Label>
                <Input value={formData.destination_address} disabled className="bg-muted/50 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Bairro</Label>
                <Input value={formData.destination_neighborhood} disabled className="bg-muted/50 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Cidade</Label>
                <Input value={formData.destination_city} disabled className="bg-muted/50 text-sm" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="destination_type" className="text-sm">Tipo de Local</Label>
            <select
              id="destination_type"
              value={formData.destination_type}
              onChange={(e) => onFormChange({ destination_type: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-all duration-300 focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            >
              <option value="commercial">🏢 Comercial</option>
              <option value="residential">🏠 Residencial</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
