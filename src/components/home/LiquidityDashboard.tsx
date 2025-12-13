import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Package, TrendingUp, Zap, Activity, MapPin } from "lucide-react";

// Subtle notification sound using Web Audio API - only plays on home page
const playMatchSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant "ding" sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    oscillator.frequency.exponentialRampToValueAtTime(1320, audioContext.currentTime + 0.1); // E6 note
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Start quiet
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3); // Fade out
    
    oscillator.type = "sine";
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Silently fail if audio is not supported
    console.log("Audio not supported");
  }
};

interface FreightPoint {
  id: string;
  type: "driver" | "cargo";
  x: number;
  y: number;
  city: string;
  state: string;
  status: "available" | "matching" | "matched";
  matchedWith?: string;
}

interface MatchLine {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

const BRAZILIAN_CITIES = [
  { city: "São Paulo", state: "SP", x: 65, y: 72 },
  { city: "Rio de Janeiro", state: "RJ", x: 75, y: 70 },
  { city: "Belo Horizonte", state: "MG", x: 68, y: 58 },
  { city: "Curitiba", state: "PR", x: 58, y: 78 },
  { city: "Porto Alegre", state: "RS", x: 52, y: 90 },
  { city: "Salvador", state: "BA", x: 82, y: 38 },
  { city: "Brasília", state: "DF", x: 58, y: 48 },
  { city: "Recife", state: "PE", x: 88, y: 25 },
  { city: "Fortaleza", state: "CE", x: 82, y: 15 },
  { city: "Manaus", state: "AM", x: 28, y: 15 },
  { city: "Goiânia", state: "GO", x: 55, y: 52 },
  { city: "Campinas", state: "SP", x: 62, y: 70 },
  { city: "Vitória", state: "ES", x: 78, y: 60 },
  { city: "Florianópolis", state: "SC", x: 55, y: 85 },
];

const generateRandomPoint = (existingPoints: FreightPoint[]): FreightPoint => {
  const cityData = BRAZILIAN_CITIES[Math.floor(Math.random() * BRAZILIAN_CITIES.length)];
  const type = Math.random() > 0.45 ? "cargo" : "driver";
  
  // Add small random offset to avoid exact overlaps
  const offsetX = (Math.random() - 0.5) * 4;
  const offsetY = (Math.random() - 0.5) * 4;
  
  return {
    id: `point-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    x: Math.max(5, Math.min(95, cityData.x + offsetX)),
    y: Math.max(5, Math.min(95, cityData.y + offsetY)),
    city: cityData.city,
    state: cityData.state,
    status: "available",
  };
};

const LiquidityDashboard = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [points, setPoints] = useState<FreightPoint[]>([]);
  const [matchLines, setMatchLines] = useState<MatchLine[]>([]);
  const [liquidityIndex, setLiquidityIndex] = useState(1.35);
  const [totalFreights, setTotalFreights] = useState(127);
  const [matchesPerHour, setMatchesPerHour] = useState(23);

  // Track page visibility to stop sounds when page is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === "visible");
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Derived state: only play sounds when on home page AND page is visible
  const shouldPlaySound = isHomePage && isPageVisible;

  // Generate initial points
  useEffect(() => {
    const initialPoints: FreightPoint[] = [];
    for (let i = 0; i < 12; i++) {
      initialPoints.push(generateRandomPoint(initialPoints));
    }
    setPoints(initialPoints);
  }, []);

  // Simulate new freight appearing
  useEffect(() => {
    const interval = setInterval(() => {
      setPoints((prev) => {
        // Remove old matched points and add new ones
        const filteredPoints = prev.filter((p) => p.status !== "matched");
        if (filteredPoints.length < 15) {
          return [...filteredPoints, generateRandomPoint(filteredPoints)];
        }
        return filteredPoints;
      });
      
      // Update metrics
      setTotalFreights((prev) => prev + Math.floor(Math.random() * 3));
      setLiquidityIndex((prev) => {
        const change = (Math.random() - 0.5) * 0.1;
        return Math.max(0.8, Math.min(2.0, prev + change));
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Simulate matching animation
  useEffect(() => {
    const matchInterval = setInterval(() => {
      setPoints((prev) => {
        const drivers = prev.filter((p) => p.type === "driver" && p.status === "available");
        const cargos = prev.filter((p) => p.type === "cargo" && p.status === "available");

        if (drivers.length > 0 && cargos.length > 0) {
          const driver = drivers[Math.floor(Math.random() * drivers.length)];
          const cargo = cargos[Math.floor(Math.random() * cargos.length)];

          // Create match line
          const newMatchLine: MatchLine = {
            id: `match-${Date.now()}`,
            from: { x: driver.x, y: driver.y },
            to: { x: cargo.x, y: cargo.y },
          };
          
          setMatchLines((prevLines) => [...prevLines, newMatchLine]);
          setMatchesPerHour((m) => m + 1);
          
          // Play subtle notification sound only on home page and when visible
          if (shouldPlaySound) {
            playMatchSound();
          }

          // Remove match line after animation
          setTimeout(() => {
            setMatchLines((prevLines) => prevLines.filter((l) => l.id !== newMatchLine.id));
          }, 1500);

          // Update points to matched status
          return prev.map((p) => {
            if (p.id === driver.id || p.id === cargo.id) {
              return { ...p, status: "matching" as const };
            }
            return p;
          });
        }
        return prev;
      });

      // Mark as matched and fade out
      setTimeout(() => {
        setPoints((prev) =>
          prev.map((p) => (p.status === "matching" ? { ...p, status: "matched" as const } : p))
        );
      }, 1200);
    }, 4000);

    return () => clearInterval(matchInterval);
  }, []);

  const isHighDemand = liquidityIndex < 1.2;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-[hsl(215,30%,10%)] via-[hsl(215,25%,12%)] to-[hsl(220,25%,8%)] border border-primary/20 shadow-2xl">
      {/* Header with Liquidity Index */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <motion.div
          className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md ${
            isHighDemand
              ? "bg-accent/20 border border-accent/40"
              : "bg-secondary/20 border border-secondary/40"
          }`}
          animate={{ scale: isHighDemand ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Activity className={`h-4 w-4 ${isHighDemand ? "text-accent" : "text-secondary"}`} />
          <span className="text-xs font-medium text-white/90">Market Liquidity</span>
          <span className={`text-sm font-bold ${isHighDemand ? "text-accent" : "text-secondary"}`}>
            {liquidityIndex.toFixed(2)}
          </span>
        </motion.div>

        <AnimatePresence>
          {isHighDemand && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/30 border border-accent/50"
            >
              <Zap className="h-3 w-3 text-accent animate-pulse" />
              <span className="text-[10px] font-semibold text-accent">
                ALTA DEMANDA - Preços Dinâmicos Ativos
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Panel */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-md border border-white/10">
          <Package className="h-3 w-3 text-accent" />
          <span className="text-xs text-white/70">Fretes Ativos</span>
          <span className="text-sm font-bold text-white">{totalFreights}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-md border border-white/10">
          <TrendingUp className="h-3 w-3 text-secondary" />
          <span className="text-xs text-white/70">Matches/h</span>
          <span className="text-sm font-bold text-white">{matchesPerHour}</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[300px] sm:h-[350px] lg:h-[400px]">
        {/* Brazil Map Outline (simplified SVG) */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full opacity-20"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M20,5 Q30,8 45,10 Q60,12 75,15 Q88,20 90,30 Q92,45 88,55 Q85,65 78,75 Q70,85 55,90 Q45,95 35,90 Q25,85 20,75 Q15,60 18,45 Q15,30 20,5 Z"
            fill="none"
            stroke="hsl(217 91% 53%)"
            strokeWidth="0.5"
            className="animate-pulse"
          />
        </svg>

        {/* Heatmap Gradient Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {points.filter((p) => p.type === "cargo").map((point) => (
            <motion.div
              key={`heat-${point.id}`}
              className="absolute rounded-full bg-accent/20 blur-xl"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                width: "60px",
                height: "60px",
                transform: "translate(-50%, -50%)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
            />
          ))}
          {points.filter((p) => p.type === "driver").map((point) => (
            <motion.div
              key={`heat-driver-${point.id}`}
              className="absolute rounded-full bg-primary/20 blur-xl"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                width: "50px",
                height: "50px",
                transform: "translate(-50%, -50%)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
            />
          ))}
        </div>

        {/* Match Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <AnimatePresence>
            {matchLines.map((line) => (
              <motion.line
                key={line.id}
                x1={`${line.from.x}%`}
                y1={`${line.from.y}%`}
                x2={`${line.to.x}%`}
                y2={`${line.to.y}%`}
                stroke="url(#matchGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            ))}
          </AnimatePresence>
          <defs>
            <linearGradient id="matchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(217 91% 53%)" />
              <stop offset="100%" stopColor="hsl(160 84% 39%)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Freight Points */}
        <AnimatePresence mode="popLayout">
          {points.map((point) => (
            <motion.div
              key={point.id}
              className="absolute z-20"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: point.status === "matching" ? 1.3 : 1,
                opacity: point.status === "matched" ? 0 : 1,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "backOut" }}
            >
              {/* Pulse Ring */}
              <motion.div
                className={`absolute -inset-3 rounded-full ${
                  point.type === "driver" ? "bg-primary/30" : "bg-accent/30"
                }`}
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
              
              {/* Icon Container */}
              <div
                className={`relative flex items-center justify-center w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg ${
                  point.type === "driver"
                    ? "bg-gradient-to-br from-primary to-primary/80"
                    : "bg-gradient-to-br from-accent to-accent/80"
                } ${point.status === "matching" ? "ring-2 ring-secondary ring-offset-2 ring-offset-transparent" : ""}`}
              >
                {point.type === "driver" ? (
                  <Truck className="h-4 w-4 text-white" />
                ) : (
                  <Package className="h-4 w-4 text-white" />
                )}
              </div>

              {/* Success Animation on Match */}
              <AnimatePresence>
                {point.status === "matching" && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="w-6 h-6 rounded-full bg-secondary/50" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom Legend */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50" />
          <span className="text-xs text-white/70">Motoristas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent shadow-lg shadow-accent/50" />
          <span className="text-xs text-white/70">Cargas</span>
        </div>
        <div className="flex items-center gap-1">
          <motion.div
            className="w-2 h-2 rounded-full bg-secondary"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-xs text-white/70">Match em tempo real</span>
        </div>
      </div>

      {/* LogiMind Badge */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 backdrop-blur-md">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Activity className="h-3 w-3 text-primary" />
          </motion.div>
          <span className="text-[10px] font-semibold text-white/80">Powered by LogiMind 3.0</span>
        </div>
      </div>
    </div>
  );
};

export default LiquidityDashboard;
