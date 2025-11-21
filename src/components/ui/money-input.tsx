import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface MoneyInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export const MoneyInput = ({
  value,
  onChange,
  label = "Valor",
  placeholder = "R$ 0,00",
  required = false,
  disabled = false,
  className,
  error,
}: MoneyInputProps) => {
  const formatMoney = (money: string) => {
    // Remove tudo que não é dígito
    const numbers = money.replace(/\D/g, "");
    
    if (!numbers) return "";
    
    // Converte para número considerando os últimos 2 dígitos como centavos
    const amount = parseInt(numbers) / 100;
    
    // Formata com separador de milhares e decimais
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatMoney(e.target.value);
    onChange(formatted);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          R$
        </span>
        <Input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("pl-10", error ? "border-destructive" : "")}
        />
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};
