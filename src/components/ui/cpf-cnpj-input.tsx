import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { validateCPF, validateCNPJ, formatCPF, formatCNPJ } from "@/lib/validators";
import { cn } from "@/lib/utils";

interface CpfCnpjInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const CpfCnpjInput = ({
  value,
  onChange,
  onValidationChange,
  label = "CPF/CNPJ",
  placeholder = "000.000.000-00 ou 00.000.000/0000-00",
  required = false,
  disabled = false,
  className,
}: CpfCnpjInputProps) => {
  const [isTouched, setIsTouched] = useState(false);
  const [validationState, setValidationState] = useState<"idle" | "valid" | "invalid">("idle");

  // Auto-detect and format based on length
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ""); // Remove non-digits
    
    let formatted = rawValue;
    
    // Auto-format based on length
    if (rawValue.length <= 11) {
      // CPF format
      formatted = formatCPF(rawValue);
    } else {
      // CNPJ format
      formatted = formatCNPJ(rawValue);
    }
    
    onChange(formatted);
  };

  // Validate on blur or when user stops typing
  useEffect(() => {
    if (!isTouched || !value) {
      setValidationState("idle");
      onValidationChange?.(false);
      return;
    }

    const rawValue = value.replace(/\D/g, "");
    
    // Determine if it's CPF or CNPJ based on length
    let isValid = false;
    
    if (rawValue.length === 11) {
      isValid = validateCPF(rawValue);
    } else if (rawValue.length === 14) {
      isValid = validateCNPJ(rawValue);
    }
    
    setValidationState(isValid ? "valid" : "invalid");
    onValidationChange?.(isValid);
  }, [value, isTouched, onValidationChange]);

  const getValidationIcon = () => {
    if (validationState === "idle" || !isTouched) return null;
    
    if (validationState === "valid") {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    
    return <XCircle className="h-5 w-5 text-destructive" />;
  };

  const getValidationMessage = () => {
    if (validationState === "idle" || !isTouched) return null;
    
    const rawValue = value.replace(/\D/g, "");
    
    if (validationState === "invalid") {
      if (rawValue.length < 11) {
        return <span className="text-xs text-muted-foreground">Continue digitando...</span>;
      }
      if (rawValue.length === 11) {
        return <span className="text-xs text-destructive">CPF inválido</span>;
      }
      if (rawValue.length === 14) {
        return <span className="text-xs text-destructive">CNPJ inválido</span>;
      }
      return <span className="text-xs text-muted-foreground">Documento incompleto</span>;
    }
    
    if (validationState === "valid") {
      const docType = rawValue.length === 11 ? "CPF" : "CNPJ";
      return <span className="text-xs text-green-600">{docType} válido ✓</span>;
    }
    
    return null;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="cpf-cnpj">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        <Input
          id="cpf-cnpj"
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={() => setIsTouched(true)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={18} // Max length for formatted CNPJ: 00.000.000/0000-00
          className={cn(
            "pr-10",
            validationState === "valid" && "border-green-500 focus-visible:ring-green-500",
            validationState === "invalid" && "border-destructive focus-visible:ring-destructive"
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {getValidationIcon()}
        </div>
      </div>
      {getValidationMessage()}
    </div>
  );
};
