import { motion } from "framer-motion";

const MovingGradientBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Primary moving gradient blob */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-[100px]"
        style={{
          background: "radial-gradient(circle, hsl(217 91% 53% / 0.4) 0%, transparent 70%)",
        }}
        animate={{
          x: ["-20%", "60%", "-20%"],
          y: ["-10%", "40%", "-10%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary moving gradient blob */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-25 blur-[100px]"
        style={{
          background: "radial-gradient(circle, hsl(160 84% 39% / 0.3) 0%, transparent 70%)",
          right: 0,
        }}
        animate={{
          x: ["20%", "-40%", "20%"],
          y: ["60%", "10%", "60%"],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Accent moving gradient blob */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-[80px]"
        style={{
          background: "radial-gradient(circle, hsl(45 97% 50% / 0.25) 0%, transparent 70%)",
          bottom: "10%",
          left: "30%",
        }}
        animate={{
          x: ["0%", "30%", "0%"],
          y: ["0%", "-20%", "0%"],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Subtle grid overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(217 91% 53% / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(217 91% 53% / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
};

export default MovingGradientBackground;
