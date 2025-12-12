import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface SelectableChipProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
  icon?: React.ReactNode;
  variant?: "default" | "warning" | "danger" | "success";
  className?: string;
}

const variantStyles = {
  default: {
    base: "border-border hover:border-primary/50 hover:bg-primary/5",
    selected: "border-primary bg-primary/10 text-primary",
  },
  warning: {
    base: "border-border hover:border-amber-500/50 hover:bg-amber-500/5",
    selected: "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  danger: {
    base: "border-border hover:border-destructive/50 hover:bg-destructive/5",
    selected: "border-destructive bg-destructive/10 text-destructive",
  },
  success: {
    base: "border-border hover:border-secondary/50 hover:bg-secondary/5",
    selected: "border-secondary bg-secondary/10 text-secondary",
  },
};

export const SelectableChip = ({
  label,
  selected,
  onSelect,
  icon,
  variant = "default",
  className,
}: SelectableChipProps) => {
  const styles = variantStyles[variant];
  
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-primary/20",
        selected ? styles.selected : styles.base,
        selected && "shadow-sm",
        className
      )}
    >
      {selected ? (
        <Check className="h-4 w-4" />
      ) : icon ? (
        icon
      ) : null}
      {label}
    </button>
  );
};
