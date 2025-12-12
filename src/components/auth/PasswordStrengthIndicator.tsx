import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const requirements = [
    {
      label: "Mínimo 8 caracteres",
      met: password.length >= 8,
    },
    {
      label: "Letra maiúscula",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Letra minúscula",
      met: /[a-z]/.test(password),
    },
    {
      label: "Número",
      met: /[0-9]/.test(password),
    },
  ];

  const metCount = requirements.filter((r) => r.met).length;
  const strengthPercentage = (metCount / requirements.length) * 100;

  const getStrengthColor = () => {
    if (strengthPercentage <= 25) return "bg-destructive";
    if (strengthPercentage <= 50) return "bg-accent";
    if (strengthPercentage <= 75) return "bg-primary";
    return "bg-secondary";
  };

  return (
    <div className="space-y-3 mt-2">
      {/* Progress bar */}
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300 rounded-full",
            getStrengthColor()
          )}
          style={{ width: `${strengthPercentage}%` }}
        />
      </div>

      {/* Requirements list */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {requirements.map((req, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors duration-200",
              req.met ? "text-secondary" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="h-3 w-3 flex-shrink-0" />
            ) : (
              <X className="h-3 w-3 flex-shrink-0" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
