import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, User, Mail, Lock, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthInputProps {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  icon?: "user" | "email" | "password";
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  user: User,
  email: Mail,
  password: Lock,
};

export const AuthInput = ({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  required = false,
  minLength,
  icon,
  className,
}: AuthInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;
  
  const IconComponent = icon ? iconMap[icon] : null;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <div className="relative">
        {IconComponent && (
          <IconComponent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
        <Input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          className={cn(
            "h-11 bg-background border-input transition-all duration-200",
            "focus:ring-2 focus:ring-primary/20 focus:border-primary",
            IconComponent && "pl-10",
            isPassword && "pr-10"
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
