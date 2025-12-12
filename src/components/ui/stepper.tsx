import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export const Stepper = ({ steps, currentStep, className }: StepperProps) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div key={index} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  <div className="flex flex-col items-center">
                    {/* Círculo maior e mais proeminente */}
                    <div
                      className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full border-3 transition-all duration-300 font-bold text-lg shadow-sm",
                        isCompleted && "bg-secondary border-secondary text-secondary-foreground shadow-md",
                        isCurrent && "border-primary text-primary bg-primary/10 ring-4 ring-primary/20",
                        !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground bg-muted/50"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-7 h-7" />
                      ) : (
                        <span>{stepNumber}</span>
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <p
                        className={cn(
                          "text-sm font-semibold transition-colors duration-300",
                          isCompleted && "text-secondary",
                          isCurrent && "text-primary",
                          !isCompleted && !isCurrent && "text-muted-foreground"
                        )}
                      >
                        {step.label}
                      </p>
                      {step.description && (
                        <p className={cn(
                          "text-xs mt-1 transition-colors duration-300",
                          isCompleted ? "text-secondary/70" : "text-muted-foreground"
                        )}>
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Linha de conexão entre steps */}
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-1 mx-3 rounded-full transition-all duration-500",
                        isCompleted ? "bg-secondary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
