import { cn } from "@/lib/utils";

interface SectionDividerProps {
  className?: string;
}

export const SectionDivider = ({ className }: SectionDividerProps) => {
  return (
    <div className={cn(
      "relative py-6",
      className
    )}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border/60" />
      </div>
    </div>
  );
};
