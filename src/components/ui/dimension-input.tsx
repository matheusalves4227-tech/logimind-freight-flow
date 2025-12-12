import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DimensionInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  unit?: string;
  maxValue?: number;
}

export const DimensionInput = ({
  value,
  onChange,
  label = "Dimensão",
  placeholder = "0",
  required = false,
  disabled = false,
  className,
  error,
  unit = "cm",
  maxValue = 9999,
}: DimensionInputProps) => {
  const formatDimension = (input: string): string => {
    // Remove tudo que não é número ou vírgula
    let cleaned = input.replace(/[^\d,]/g, "");
    
    // Limita a um máximo de uma vírgula
    const parts = cleaned.split(",");
    if (parts.length > 2) {
      cleaned = parts[0] + "," + parts.slice(1).join("");
    }
    
    // Limita casas decimais a 2
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = parts[0] + "," + parts[1].slice(0, 2);
    }
    
    // Limita o número de dígitos inteiros a 4
    if (parts[0].length > 4) {
      cleaned = parts[0].slice(0, 4) + (parts.length > 1 ? "," + parts[1] : "");
    }
    
    return cleaned;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDimension(e.target.value);
    
    // Verifica se o valor numérico não excede o máximo
    const numericValue = parseFloat(formatted.replace(",", "."));
    if (!isNaN(numericValue) && numericValue > maxValue) {
      return;
    }
    
    onChange(formatted);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={label}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={label}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={7} // 9999,99
          className={cn(
            "pr-10",
            error && "border-destructive focus-visible:ring-destructive"
          )}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          {unit}
        </span>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};
