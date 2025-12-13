import { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Brain, Truck, Shield, Zap } from "lucide-react";

// Particle type for the neural network background
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// Neural Network Background Component
const NeuralNetworkBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles
    const particleCount = 40;
    particlesRef.current = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));

    const connectionDistance = 120;

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;

      // Update and draw particles
      particles.forEach((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off walls
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Keep within bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(147, 197, 253, 0.6)";
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.3;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(147, 197, 253, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ willChange: "transform" }}
    />
  );
};

// Count-up animation hook
const useCountUp = (end: number, duration: number = 2000, suffix: string = "") => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count + suffix;
};

// Glowing Icon Component
const GlowingIcon = ({ 
  icon: Icon, 
  color, 
  bgColor 
}: { 
  icon: typeof Brain; 
  color: string; 
  bgColor: string;
}) => {
  return (
    <motion.div 
      className={`relative p-2 ${bgColor} rounded-lg`}
      whileHover={{ scale: 1.1 }}
    >
      {/* Glow effect */}
      <motion.div
        className={`absolute inset-0 ${bgColor} rounded-lg blur-md`}
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <Icon className={`h-5 w-5 ${color} relative z-10`} />
    </motion.div>
  );
};

// Stagger container variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Slide up item variants
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export const AuthBranding = () => {
  const economyCount = useCountUp(42, 2000, "%");
  const transportersCount = useCountUp(500, 2200, "+");
  const timeCount = useCountUp(3, 1500, "s");

  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(217,45%,18%)] to-[hsl(220,40%,22%)] text-white relative overflow-hidden">
      {/* Neural Network Background */}
      <NeuralNetworkBackground />

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(222,47%,11%)]/50 to-transparent pointer-events-none" />

      {/* Content with stagger animation */}
      <motion.div
        className="relative z-10 max-w-md text-center space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div 
          className="inline-flex items-center gap-3 mb-6"
          variants={itemVariants}
        >
          <motion.div 
            className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Truck className="h-10 w-10 text-white" />
          </motion.div>
          <div className="text-left">
            <h1 className="text-3xl font-bold tracking-tight">LogiMarket</h1>
            <p className="text-sm text-white/70">Marketplace Logístico</p>
          </div>
        </motion.div>

        {/* Main headline */}
        <motion.div className="space-y-4" variants={itemVariants}>
          <h2 className="text-2xl lg:text-3xl font-bold leading-tight">
            Inteligência Logística
            <motion.span 
              className="block mt-1 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% 200%" }}
            >
              LogiMind
            </motion.span>
          </h2>
          <p className="text-white/80 text-base lg:text-lg leading-relaxed">
            Precificação dinâmica que otimiza rotas, maximiza margens e garante os melhores preços do mercado.
          </p>
        </motion.div>

        {/* Features with glowing icons */}
        <motion.div className="grid grid-cols-1 gap-4 pt-6" variants={itemVariants}>
          <motion.div 
            className="flex items-center gap-3 text-left p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
            variants={itemVariants}
            whileHover={{ x: 5 }}
          >
            <GlowingIcon icon={Brain} color="text-primary" bgColor="bg-primary/20" />
            <div>
              <p className="font-medium text-sm">IA para Precificação</p>
              <p className="text-xs text-white/60">Algoritmo inteligente de comissão</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-3 text-left p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
            variants={itemVariants}
            whileHover={{ x: 5 }}
          >
            <GlowingIcon icon={Shield} color="text-secondary" bgColor="bg-secondary/20" />
            <div>
              <p className="font-medium text-sm">Segurança Total</p>
              <p className="text-xs text-white/60">LogiGuard Pro para cargas de valor</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-3 text-left p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
            variants={itemVariants}
            whileHover={{ x: 5 }}
          >
            <GlowingIcon icon={Zap} color="text-accent" bgColor="bg-accent/20" />
            <div>
              <p className="font-medium text-sm">Cotação Instantânea</p>
              <p className="text-xs text-white/60">Compare preços em segundos</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Stats with count-up animation */}
        <motion.div 
          className="flex justify-center gap-8 pt-6 border-t border-white/10"
          variants={itemVariants}
        >
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.1 }}
          >
            <p className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {economyCount}
            </p>
            <p className="text-xs text-white/60">Economia média</p>
          </motion.div>
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.1 }}
          >
            <p className="text-2xl font-bold bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">
              {transportersCount}
            </p>
            <p className="text-xs text-white/60">Transportadoras</p>
          </motion.div>
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.1 }}
          >
            <p className="text-2xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              {timeCount}
            </p>
            <p className="text-xs text-white/60">Tempo cotação</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};
