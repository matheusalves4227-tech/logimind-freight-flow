import { Brain, Truck, Shield, Zap } from "lucide-react";

export const AuthBranding = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(217,45%,18%)] to-[hsl(220,40%,22%)] text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md text-center space-y-8">
        {/* Logo */}
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <Truck className="h-10 w-10 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold tracking-tight">LogiMarket</h1>
            <p className="text-sm text-white/70">Marketplace Logístico</p>
          </div>
        </div>

        {/* Main headline */}
        <div className="space-y-4">
          <h2 className="text-2xl lg:text-3xl font-bold leading-tight">
            Inteligência Logística
            <span className="block mt-1 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              LogiMind
            </span>
          </h2>
          <p className="text-white/80 text-base lg:text-lg leading-relaxed">
            Precificação dinâmica que otimiza rotas, maximiza margens e garante os melhores preços do mercado.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-4 pt-6">
          <div className="flex items-center gap-3 text-left p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">IA para Precificação</p>
              <p className="text-xs text-white/60">Algoritmo inteligente de comissão</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-left p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="p-2 bg-secondary/20 rounded-lg">
              <Shield className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="font-medium text-sm">Segurança Total</p>
              <p className="text-xs text-white/60">LogiGuard Pro para cargas de valor</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-left p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="p-2 bg-accent/20 rounded-lg">
              <Zap className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-sm">Cotação Instantânea</p>
              <p className="text-xs text-white/60">Compare preços em segundos</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 pt-6 border-t border-white/10">
          <div className="text-center">
            <p className="text-2xl font-bold">42%</p>
            <p className="text-xs text-white/60">Economia média</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">500+</p>
            <p className="text-xs text-white/60">Transportadoras</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">3s</p>
            <p className="text-xs text-white/60">Tempo cotação</p>
          </div>
        </div>
      </div>
    </div>
  );
};
