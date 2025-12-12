import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationAnimationProps {
  title: string;
  description: string;
  estimatedTime?: string;
  className?: string;
}

export const ConfirmationAnimation = ({
  title,
  description,
  estimatedTime,
  className,
}: ConfirmationAnimationProps) => {
  return (
    <div className={cn(
      "flex flex-col items-center text-center py-8 animate-fade-in",
      className
    )}>
      {/* Animated Check Circle */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-secondary/20 rounded-full animate-ping" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10 border-4 border-secondary">
          <CheckCircle2 className="h-10 w-10 text-secondary animate-scale-in" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-foreground mb-2">
        {title}
      </h2>
      
      <p className="text-muted-foreground max-w-md mb-6">
        {description}
      </p>
      
      {estimatedTime && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">{estimatedTime}</span>
        </div>
      )}
      
      {/* Progress indicator */}
      <div className="mt-6 w-full max-w-xs">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Cadastro enviado</span>
          <span>Em análise</span>
          <span>Aprovado</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-1000"
            style={{ width: "33%" }}
          />
        </div>
      </div>
    </div>
  );
};
