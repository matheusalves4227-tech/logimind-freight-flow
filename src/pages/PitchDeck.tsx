import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Download, TrendingUp, Users, DollarSign, Target, Rocket, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface PitchDeckData {
  problema: {
    pain_points: string[];
    market_size_affected: string;
  };
  solucao: {
    value_propositions: string[];
    diferencial_logimind: string;
  };
  tracao: {
    gmv_total: number;
    clientes_ativos: number;
    transportadoras_parceiras: number;
    fretes_concluidos: number;
    taxa_crescimento_mensal: number;
  };
  mercado: {
    tam: string;
    sam: string;
    som: string;
  };
  unit_economics: {
    ticket_medio_frete: number;
    ltv: number;
    cac: number;
    ltv_cac_ratio: number;
    take_rate_medio: number;
    margem_contribuicao: number;
  };
  roadmap: {
    q1: string[];
    q2: string[];
    q3: string[];
    q4: string[];
  };
  ask: {
    valor_captacao: string;
    valuation_pre_money: string;
    equity_oferecido: string;
    uso_recursos: {
      categoria: string;
      percentual: number;
      valor: string;
    }[];
  };
  team: {
    founders: {
      nome: string;
      cargo: string;
      experiencia: string;
    }[];
  };
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
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleDownloadPDF = async () => {
    if (!deckRef.current || !pitchData) return;

    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const slides = deckRef.current.querySelectorAll('.pitch-slide');
      
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        
        const canvas = await html2canvas(slide, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save('LogiMarket_PitchDeck.pdf');
      
      toast({
        title: "PDF Gerado com Sucesso",
        description: "Pitch deck exportado como PDF",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Erro ao Gerar PDF",
        description: "Tente novamente mais tarde",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pitchData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Erro ao carregar dados do pitch deck</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header com botão de download */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Pitch Deck - LogiMarket</h1>
            <p className="text-muted-foreground">Dados reais da plataforma</p>
          </div>
          <Button 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            size="lg"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Baixar PDF
              </>
            )}
          </Button>
        </div>

        {/* Slides do Pitch Deck */}
        <div ref={deckRef} className="space-y-6">
          
          {/* Slide 1: Capa */}
          <Card className="pitch-slide p-12 bg-gradient-to-br from-primary to-primary/70 text-white min-h-[600px] flex flex-col justify-center items-center">
            <h1 className="text-6xl font-bold mb-4">LogiMarket</h1>
            <p className="text-2xl mb-8">Marketplace Logístico Inteligente</p>
            <p className="text-xl opacity-90">Precificação Dinâmica com IA para Otimizar Fretes</p>
            <div className="mt-12 text-lg opacity-80">
              Pitch Deck Confidencial - {new Date().getFullYear()}
            </div>
          </Card>

          {/* Slide 2: O Problema */}
          <Card className="pitch-slide p-12 min-h-[600px]">
            <div className="flex items-center mb-8">
              <Target className="h-12 w-12 text-destructive mr-4" />
              <h2 className="text-4xl font-bold">O Problema</h2>
            </div>
            <div className="space-y-6">
              <p className="text-xl text-muted-foreground mb-6">
                {pitchData.problema.market_size_affected} sofrem com ineficiência logística
              </p>
              <ul className="space-y-4">
                {pitchData.problema.pain_points.map((point, idx) => (
                  <li key={idx} className="flex items-start text-lg">
                    <span className="text-destructive mr-3 text-2xl">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Slide 3: Solução LogiMind */}
          <Card className="pitch-slide p-12 min-h-[600px]">
            <div className="flex items-center mb-8">
              <Rocket className="h-12 w-12 text-primary mr-4" />
              <h2 className="text-4xl font-bold">Nossa Solução</h2>
            </div>
            <div className="space-y-6">
              <div className="bg-primary/10 p-6 rounded-lg border-l-4 border-primary">
                <h3 className="text-2xl font-bold mb-3">LogiMind - IA de Precificação</h3>
                <p className="text-lg">{pitchData.solucao.diferencial_logimind}</p>
              </div>
              <ul className="space-y-4 mt-6">
                {pitchData.solucao.value_propositions.map((prop, idx) => (
                  <li key={idx} className="flex items-start text-lg">
                    <span className="text-primary mr-3 text-2xl">✓</span>
                    <span className="font-medium">{prop}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Slide 4: Tração Real */}
          <Card className="pitch-slide p-12 min-h-[600px]">
            <div className="flex items-center mb-8">
              <TrendingUp className="h-12 w-12 text-secondary mr-4" />
              <h2 className="text-4xl font-bold">Tração Real</h2>
            </div>
            <div className="grid grid-cols-2 gap-8 mt-8">
              <div className="bg-primary/10 p-8 rounded-lg text-center">
                <DollarSign className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-4xl font-bold text-primary mb-2">
                  {formatCurrency(pitchData.tracao.gmv_total)}
                </div>
                <p className="text-lg text-muted-foreground">GMV Total</p>
              </div>
              
              <div className="bg-secondary/10 p-8 rounded-lg text-center">
                <Users className="h-12 w-12 text-secondary mx-auto mb-4" />
                <div className="text-4xl font-bold text-secondary mb-2">
                  {pitchData.tracao.clientes_ativos}
                </div>
                <p className="text-lg text-muted-foreground">Clientes B2B Ativos</p>
              </div>
              
              <div className="bg-orange-100 p-8 rounded-lg text-center">
                <TrendingUp className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {pitchData.tracao.transportadoras_parceiras}
                </div>
                <p className="text-lg text-muted-foreground">Transportadoras</p>
              </div>
              
              <div className="bg-green-100 p-8 rounded-lg text-center">
                <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {pitchData.tracao.fretes_concluidos}
                </div>
                <p className="text-lg text-muted-foreground">Fretes Concluídos</p>
              </div>
            </div>
            {pitchData.tracao.taxa_crescimento_mensal > 0 && (
              <div className="mt-8 p-6 bg-secondary/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-secondary">
                  +{pitchData.tracao.taxa_crescimento_mensal.toFixed(1)}% MoM Growth
                </p>
              </div>
            )}
          </Card>

          {/* Slide 5: Mercado TAM/SAM/SOM */}
          <Card className="pitch-slide p-12 min-h-[600px]">
            <h2 className="text-4xl font-bold mb-12">Oportunidade de Mercado</h2>
            <div className="space-y-8">
              <div className="relative">
                <div className="bg-primary/20 p-8 rounded-lg">
                  <h3 className="text-2xl font-bold mb-2">TAM - Total Addressable Market</h3>
                  <p className="text-3xl font-bold text-primary">{pitchData.mercado.tam}</p>
                </div>
              </div>
              
              <div className="relative ml-12">
                <div className="bg-primary/30 p-8 rounded-lg">
                  <h3 className="text-2xl font-bold mb-2">SAM - Serviceable Available Market</h3>
                  <p className="text-3xl font-bold text-primary">{pitchData.mercado.sam}</p>
                </div>
              </div>
              
              <div className="relative ml-24">
                <div className="bg-primary/40 p-8 rounded-lg">
                  <h3 className="text-2xl font-bold mb-2">SOM - Serviceable Obtainable Market</h3>
                  <p className="text-3xl font-bold text-primary">{pitchData.mercado.som}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Slide 6: Unit Economics */}
          <Card className="pitch-slide p-12 min-h-[600px]">
            <h2 className="text-4xl font-bold mb-12">Unit Economics Validados</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-primary/10 p-6 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">LTV (Lifetime Value)</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(pitchData.unit_economics.ltv)}</p>
              </div>
              
              <div className="bg-secondary/10 p-6 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">CAC (Customer Acquisition)</p>
                <p className="text-3xl font-bold text-secondary">{formatCurrency(pitchData.unit_economics.cac)}</p>
              </div>
              
              <div className="bg-green-100 p-6 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">LTV/CAC Ratio</p>
                <p className="text-3xl font-bold text-green-600">{pitchData.unit_economics.ltv_cac_ratio.toFixed(1)}x</p>
              </div>
              
              <div className="bg-orange-100 p-6 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Take Rate Médio</p>
                <p className="text-3xl font-bold text-orange-600">{pitchData.unit_economics.take_rate_medio.toFixed(1)}%</p>
              </div>
              
              <div className="bg-purple-100 p-6 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Margem Contribuição</p>
                <p className="text-3xl font-bold text-purple-600">{pitchData.unit_economics.margem_contribuicao}%</p>
              </div>
              
              <div className="bg-blue-100 p-6 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Ticket Médio Frete</p>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(pitchData.unit_economics.ticket_medio_frete)}</p>
              </div>
            </div>
            <div className="mt-8 p-6 bg-green-50 border-l-4 border-green-500 rounded-lg">
              <p className="text-lg font-semibold text-green-700">
                ✓ Unit Economics excelentes: LTV/CAC {">"}5x indica modelo escalável e sustentável
              </p>
            </div>
          </Card>

          {/* Slide 7: Roadmap 12 Meses */}
          <Card className="pitch-slide p-12 min-h-[600px]">
            <div className="flex items-center mb-8">
              <Calendar className="h-12 w-12 text-primary mr-4" />
              <h2 className="text-4xl font-bold">Roadmap 12 Meses</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-primary">Q1 2025</h3>
                <ul className="space-y-2">
                  {pitchData.roadmap.q1.map((item, idx) => (
                    <li key={idx} className="text-base">{item}</li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-secondary">Q2 2025</h3>
                <ul className="space-y-2">
                  {pitchData.roadmap.q2.map((item, idx) => (
                    <li key={idx} className="text-base">{item}</li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-orange-600">Q3 2025</h3>
                <ul className="space-y-2">
                  {pitchData.roadmap.q3.map((item, idx) => (
                    <li key={idx} className="text-base">{item}</li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-green-600">Q4 2025</h3>
                <ul className="space-y-2">
                  {pitchData.roadmap.q4.map((item, idx) => (
                    <li key={idx} className="text-base">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Slide 8: The Ask */}
          <Card className="pitch-slide p-12 min-h-[600px] bg-gradient-to-br from-primary/10 to-secondary/10">
            <h2 className="text-4xl font-bold mb-8">The Ask</h2>
            
            <div className="grid grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Valor Captação</p>
                <p className="text-3xl font-bold text-primary">{pitchData.ask.valor_captacao}</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Valuation Pre-Money</p>
                <p className="text-3xl font-bold text-secondary">{pitchData.ask.valuation_pre_money}</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Equity Oferecido</p>
                <p className="text-3xl font-bold text-orange-600">{pitchData.ask.equity_oferecido}</p>
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-6">Uso de Recursos</h3>
            <div className="space-y-4">
              {pitchData.ask.uso_recursos.map((uso, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-lg">{uso.categoria}</p>
                    <p className="text-sm text-muted-foreground">{uso.valor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{uso.percentual}%</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Slide 9: Fechamento */}
          <Card className="pitch-slide p-12 bg-gradient-to-br from-primary to-secondary text-white min-h-[600px] flex flex-col justify-center items-center">
            <h2 className="text-5xl font-bold mb-8 text-center">
              Vamos Revolucionar a Logística Brasileira Juntos
            </h2>
            <p className="text-2xl mb-12 text-center opacity-90">
              LogiMarket: Marketplace + IA = Fretes mais Eficientes
            </p>
            <div className="space-y-4 text-xl">
              <p>📧 contato@logimarket.com.br</p>
              <p>📱 WhatsApp: (11) 9 9999-9999</p>
              <p>🌐 www.logimarket.com.br</p>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default PitchDeck;
