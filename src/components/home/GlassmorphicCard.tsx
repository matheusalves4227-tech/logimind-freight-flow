import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassmorphicCardProps {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "accent" | "default";
  featured?: boolean;
  onClick?: () => void;
}

const GlassmorphicCard = ({
  children,
  className,
  variant = "default",
  featured = false,
  onClick,
}: GlassmorphicCardProps) => {
  const variantStyles = {
    primary: "border-primary/40 hover:border-primary/60",
    secondary: "border-secondary/30 hover:border-secondary/50",
    accent: "border-accent/30 hover:border-accent/50",
    default: "border-white/20 hover:border-white/40",
  };

  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden rounded-[20px] p-6 md:p-8",
        "bg-white/70 dark:bg-white/5",
        "backdrop-blur-xl",
        "border-2 transition-all duration-500",
        variantStyles[variant],
        featured && "shadow-2xl ring-2 ring-primary/20",
        !featured && "shadow-lg hover:shadow-xl",
        className
      )}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
    >
      {/* Border Beam Animation (LogiMind Pulse) */}
      <div className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 rounded-[20px] border-beam" />
      </div>

      {/* Inner glow on hover */}
      <motion.div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
          variant === "primary" && "bg-gradient-to-br from-primary/10 to-transparent",
          variant === "secondary" && "bg-gradient-to-br from-secondary/10 to-transparent",
          variant === "accent" && "bg-gradient-to-br from-accent/10 to-transparent",
          variant === "default" && "bg-gradient-to-br from-white/10 to-transparent"
        )}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

export default GlassmorphicCard;
