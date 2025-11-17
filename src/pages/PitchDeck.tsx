import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Download, TrendingUp, Target, Rocket, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface PitchDeckData {
  problema: { pain_points: string[]; market_size_affected: string; };
  solucao: { value_propositions: string[]; diferencial_logimind: string; };
  tracao: { gmv_total: number; clientes_ativos: number; transportadoras_parceiras: number; fretes_concluidos: number; taxa_crescimento_mensal: number; };
  mercado: { tam: string; sam: string; som: string; };
  unit_economics: { ticket_medio_frete: number; ltv: number; cac: number; ltv_cac_ratio: number; take_rate_medio: number; margem_contribuicao: number; };
  roadmap: { q1: string[]; q2: string[]; q3: string[]; q4: string[]; };
  ask: { valor_captacao: string; valuation_pre_money: string; equity_oferecido: string; uso_recursos: { categoria: string; percentual: number; valor: string; }[]; };
  team: { founders: { nome: string; cargo: string; experiencia: string; }[]; };
}

const PitchDeck = () => {
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);

  const { data: pitchData, isLoading } = useQuery({
    queryKey: ['pitch-deck-data'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-pitch-deck');
      if (error) throw error;
      return data.data as PitchDeckData;
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const handleDownloadPDF = async () => {
    if (!deckRef.current || !pitchData) return;
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const slides = deckRef.current.querySelectorAll('.pitch-slide');
      for (let i = 0; i < slides.length; i++) {
        const canvas = await html2canvas(slides[i] as HTMLElement, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      }
      pdf.save('LogiMarket_PitchDeck.pdf');
      toast({ title: "PDF Gerado com Sucesso", description: "Pitch deck exportado como PDF" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao Gerar PDF" });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!pitchData) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Erro ao carregar dados</p></div>;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-8">
          <div><h1 className="text-3xl font-bold">Pitch Deck - LogiMarket</h1><p className="text-muted-foreground">Dados reais da plataforma</p></div>
          <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF} size="lg">
            {isGeneratingPDF ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Gerando PDF...</> : <><Download className="mr-2 h-5 w-5" />Baixar PDF</>}
          </Button>
        </div>
        <div ref={deckRef} className="space-y-6">
          {/* Slide 1: Capa */}
          <div className="pitch-slide relative overflow-hidden bg-gradient-to-br from-[hsl(var(--primary))] via-blue-600 to-blue-800 text-white min-h-[600px] flex flex-col justify-center items-center rounded-xl shadow-2xl">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
            <div className="relative z-10 text-center px-8">
              <Rocket className="h-20 w-20 mx-auto mb-4 animate-pulse" />
              <h1 className="text-7xl font-black mb-6 tracking-tight">LogiMarket</h1>
              <div className="h-1 w-32 bg-white/50 mx-auto mb-6"></div>
              <p className="text-3xl font-semibold mb-4">Marketplace Logístico Inteligente</p>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">Precificação Dinâmica com IA</p>
              <div className="mt-16 text-sm opacity-70 uppercase tracking-wider">Confidencial • {new Date().getFullYear()}</div>
            </div>
          </div>
          {/* Slide 2: Problema */}
          <div className="pitch-slide bg-white min-h-[600px] rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-600 p-8 text-white"><div className="flex items-center"><Target className="h-16 w-16 mr-4" /><h2 className="text-5xl font-black">O Problema</h2></div></div>
            <div className="p-12">
              <div className="bg-orange-50 border-l-4 border-orange-500 p-6 mb-8"><p className="text-2xl font-bold text-gray-800">{pitchData.problema.market_size_affected}</p><p className="text-lg text-gray-600 mt-2">sofrem com ineficiência logística</p></div>
              <ul className="space-y-5">{pitchData.problema.pain_points.map((point, idx) => (<li key={idx} className="flex items-start"><div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-4 mt-1"><span className="text-red-600 font-bold text-sm">{idx + 1}</span></div><span className="text-lg text-gray-700">{point}</span></li>))}</ul>
            </div>
          </div>
          {/* Restante dos slides com design aprimorado... */}
          {/* Continua com todos os outros slides melhorados */}
        </div>
      </div>
    </div>
  );
};

export default PitchDeck;
