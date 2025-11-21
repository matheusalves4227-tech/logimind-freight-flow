import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface WeightInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  unit?: "kg" | "g" | "t";
}

export const WeightInput = ({
  value,
  onChange,
  label = "Peso",
  placeholder = "0",
  required = false,
  disabled = false,
  className,
  error,
  unit = "kg",
}: WeightInputProps) => {
  const formatWeight = (weight: string) => {
    // Remove tudo que não é dígito ou vírgula/ponto
    const cleaned = weight.replace(/[^\d,.-]/g, "");
    
    // Remove múltiplas vírgulas/pontos
    const parts = cleaned.split(/[,.]/).filter(Boolean);
    
    if (parts.length === 0) return "";
    if (parts.length === 1) {
      // Formata com separador de milhares
      const number = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return number;
    }
    
    // Se tem parte decimal
    const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const decimal = parts[1].slice(0, 2); // Máximo 2 casas decimais
    
    return `${integer},${decimal}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWeight(e.target.value);
    onChange(formatted);
  };

  const getUnitLabel = () => {
    switch (unit) {
      case "kg":
        return "kg";
      case "g":
        return "g";
      case "t":
        return "ton";
      default:
        return "kg";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("pr-12", error ? "border-destructive" : "")}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          {getUnitLabel()}
        </span>
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};
