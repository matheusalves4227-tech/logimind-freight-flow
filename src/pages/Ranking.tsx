import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RankingDisplay } from "@/components/reviews/RankingDisplay";
import { Users, Truck, Trophy } from "lucide-react";

const Ranking = () => {
  const [activeTab, setActiveTab] = useState("drivers");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-4">
              <Trophy className="h-5 w-5 text-accent" />
              <span className="text-accent font-semibold">Ranking de Performance</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">
              Melhores da Plataforma
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ranking dinâmico baseado em entregas realizadas, avaliações de clientes
              e indicadores de performance (KPIs) da plataforma
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="drivers" className="gap-2">
                <Truck className="h-4 w-4" />
                Motoristas
              </TabsTrigger>
              <TabsTrigger value="carriers" className="gap-2">
                <Users className="h-4 w-4" />
                Transportadoras
              </TabsTrigger>
            </TabsList>

            <TabsContent value="drivers">
              <RankingDisplay type="driver" limit={20} />
            </TabsContent>

            <TabsContent value="carriers">
              <RankingDisplay type="carrier" limit={20} />
            </TabsContent>
          </Tabs>

          <div className="mt-8 p-6 bg-accent/5 rounded-lg border">
            <h3 className="font-semibold mb-2">Como Funciona o Ranking?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>Score Geral:</strong> Calculado com base em múltiplos fatores de performance</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>Avaliações:</strong> Média das notas dadas pelos clientes (peso 35-40%)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>Pontualidade:</strong> % de entregas realizadas no prazo (peso 30-35%)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>Taxa de Conclusão:</strong> % de pedidos aceitos e finalizados (peso 15-20%)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>Qualidade:</strong> Índice de danos e problemas reportados</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Ranking;
