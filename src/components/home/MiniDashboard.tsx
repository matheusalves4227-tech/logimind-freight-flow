import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Truck, DollarSign, Zap, Clock, Package } from "lucide-react";

interface StatusItem {
  id: string;
  icon: typeof CheckCircle2;
  text: string;
  color: string;
  bgColor: string;
}

const statusMessages: Omit<StatusItem, "id">[] = [
  { icon: CheckCircle2, text: "Carga Alocada - SP → RJ", color: "text-secondary", bgColor: "bg-secondary/20" },
  { icon: DollarSign, text: "Preço Otimizado -12%", color: "text-primary", bgColor: "bg-primary/20" },
  { icon: Truck, text: "Motorista Aceito", color: "text-secondary", bgColor: "bg-secondary/20" },
  { icon: Zap, text: "LogiMind: Rota Alta Demanda", color: "text-accent", bgColor: "bg-accent/20" },
  { icon: Clock, text: "Entrega Prevista: 4h", color: "text-primary", bgColor: "bg-primary/20" },
  { icon: Package, text: "Nova Carga Disponível", color: "text-accent", bgColor: "bg-accent/20" },
  { icon: CheckCircle2, text: "Coleta Confirmada", color: "text-secondary", bgColor: "bg-secondary/20" },
  { icon: DollarSign, text: "Comissão Aplicada: 8%", color: "text-primary", bgColor: "bg-primary/20" },
];

const MiniDashboard = () => {
  const [items, setItems] = useState<StatusItem[]>([]);

  useEffect(() => {
    // Add initial items
    const initialItems: StatusItem[] = statusMessages.slice(0, 3).map((msg, i) => ({
      ...msg,
      id: `initial-${i}`,
    }));
    setItems(initialItems);

    // Add new items periodically
    let messageIndex = 3;
    const interval = setInterval(() => {
      const newMessage = statusMessages[messageIndex % statusMessages.length];
      const newItem: StatusItem = {
        ...newMessage,
        id: `item-${Date.now()}`,
      };

      setItems((prev) => {
        const updated = [newItem, ...prev];
        // Keep max 4 items
        return updated.slice(0, 4);
      });

      messageIndex++;
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[200px] rounded-xl bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(217,45%,15%)] to-[hsl(220,40%,18%)] border border-white/10 p-4 overflow-hidden">
      {/* Scanning line effect */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        animate={{ y: [0, 200, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-secondary"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-xs font-medium text-white/80">LogiMind Ativo</span>
        </div>
        <span className="text-[10px] text-white/50">Tempo Real</span>
      </div>

      {/* Status Feed */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.25, 0.46, 0.45, 0.94],
                  delay: index * 0.05 
                }}
                className={`flex items-center gap-3 p-2.5 rounded-lg ${item.bgColor} backdrop-blur-sm border border-white/5`}
              >
                <div className={`p-1.5 rounded-md ${item.bgColor}`}>
                  <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                </div>
                <span className="text-xs font-medium text-white/90 truncate">
                  {item.text}
                </span>
                <motion.div
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom Stats */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] text-white/50">
        <span>23 matches/h</span>
        <span>127 fretes ativos</span>
      </div>
    </div>
  );
};

export default MiniDashboard;
