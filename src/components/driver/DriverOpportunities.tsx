import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Package, Calendar, DollarSign, Truck, AlertCircle } from "lucide-react";
import { formatarMoeda } from "@/lib/formatters";
import { toast } from "sonner";

interface DriverOpportunitiesProps {
  driverProfile: any;
}

interface Opportunity {
  id: string;
  origin_cep: string;
  origin_address: string;
  destination_cep: string;
  destination_address: string;
  weight_kg: number;
  vehicle_type: string;
  suggested_price_min: number;
  suggested_price_max: number;
  deadline: Date;
  distance_km: number;
}

export const DriverOpportunities = ({ driverProfile }: DriverOpportunitiesProps) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [bidPrice, setBidPrice] = useState("");
  const [bidDeliveryDate, setBidDeliveryDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    // Mock data - em produção, viria de uma query que busca FTL orders pendentes
    // filtradas por tipo de veículo do motorista e localização
    const mockOpportunities: Opportunity[] = [
      {
        id: "OPP-001",
        origin_cep: "01310-100",
        origin_address: "Av. Paulista, 1000 - São Paulo/SP",
        destination_cep: "20040-020",
        destination_address: "Centro - Rio de Janeiro/RJ",
        weight_kg: 5000,
        vehicle_type: "Carreta",
        suggested_price_min: 4800,
        suggested_price_max: 5200,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        distance_km: 430
      },
      {
        id: "OPP-002",
        origin_cep: "04538-133",
        origin_address: "Itaim Bibi - São Paulo/SP",
        destination_cep: "80060-000",
        destination_address: "Curitiba/PR",
        weight_kg: 3200,
        vehicle_type: "Truck",
        suggested_price_min: 2800,
        suggested_price_max: 3100,
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        distance_km: 410
      }
    ];

    setOpportunities(mockOpportunities);
  };

  const handleSubmitBid = async () => {
    if (!selectedOpportunity || !bidPrice || !bidDeliveryDate) {
      toast.error("Preencha todos os campos do lance");
      return;
    }

    const priceValue = parseFloat(bidPrice);
    
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error("Valor do lance inválido");
      return;
    }

    setLoading(true);

    try {
      // Aqui seria chamada a função LogiMind 3.0 para validar o lance
      // e calcular se a comissão reduzida ainda garante margem mínima
      
      // Mock: validação simples
      if (priceValue < selectedOpportunity.suggested_price_min * 0.8) {
        toast.error("Lance muito baixo. O LogiMind não consegue processar este valor.");
        setLoading(false);
        return;
      }

      // Mock: Simular inserção de lance
      // Descomente quando os tipos Supabase forem atualizados:
      // const { error } = await supabase
      //   .from('driver_bids')
      //   .insert({
      //     driver_profile_id: driverProfile.id,
      //     opportunity_id: selectedOpportunity.id,
      //     bid_price: priceValue,
      //     delivery_date: bidDeliveryDate,
      //     status: 'pending'
      //   });
      // if (error) throw error;
      
      console.log('Lance mock enviado:', {
        driver_profile_id: driverProfile.id,
        opportunity_id: selectedOpportunity.id,
        bid_price: priceValue,
        delivery_date: bidDeliveryDate
      });

      toast.success("Lance enviado com sucesso! Aguarde a resposta do embarcador.");
      setSelectedOpportunity(null);
      setBidPrice("");
      setBidDeliveryDate("");
      loadOpportunities();
    } catch (error) {
      console.error('Erro ao enviar lance:', error);
      toast.error("Erro ao enviar lance. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Oportunidades de Frete</h2>
          <p className="text-muted-foreground">Cargas FTL disponíveis próximas a você</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {opportunities.length} oportunidades
        </Badge>
      </div>

      {/* Mapa - Placeholder */}
      <Card>
        <CardContent className="pt-6">
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Mapa de oportunidades (Mapbox)</p>
              <p className="text-sm text-muted-foreground">Será implementado com integração Mapbox</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Oportunidades */}
      <div className="grid grid-cols-1 gap-4">
        {opportunities.map((opp) => (
          <Card key={opp.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{opp.id}</CardTitle>
                    <Badge variant="outline">{opp.vehicle_type}</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">
                      {opp.origin_address} → {opp.destination_address}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Peso</p>
                    <p className="font-semibold">{opp.weight_kg} kg</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Distância</p>
                    <p className="font-semibold">{opp.distance_km} km</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Prazo para lance</p>
                    <p className="font-semibold text-sm">
                      {opp.deadline.toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sugestão LogiMind</p>
                    <p className="font-semibold text-green-600 text-sm">
                      {formatarMoeda(opp.suggested_price_min)} - {formatarMoeda(opp.suggested_price_max)}
                    </p>
                  </div>
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full" 
                    onClick={() => setSelectedOpportunity(opp)}
                  >
                    Ver Detalhes e Dar Lance
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Detalhes da Carga - {opp.id}</DialogTitle>
                    <DialogDescription>
                      Analise os detalhes e envie seu melhor lance
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Mapa da Rota */}
                    <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Mapa da rota A → B</p>
                      </div>
                    </div>

                    {/* Detalhes da Carga */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Origem</p>
                        <p className="text-sm">{opp.origin_address}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Destino</p>
                        <p className="text-sm">{opp.destination_address}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Peso</p>
                        <p className="text-sm">{opp.weight_kg} kg</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Distância</p>
                        <p className="text-sm">{opp.distance_km} km</p>
                      </div>
                    </div>

                    {/* Sugestão LogiMind */}
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-semibold text-blue-900 text-sm">
                              💡 Sugestão do LogiMind
                            </p>
                            <p className="text-sm text-blue-800 mt-1">
                              O mercado está pagando entre <strong>{formatarMoeda(opp.suggested_price_min)}</strong> e{" "}
                              <strong>{formatarMoeda(opp.suggested_price_max)}</strong> por esta rota.
                            </p>
                            <p className="text-xs text-blue-700 mt-2">
                              Lance dentro desta faixa para aumentar suas chances de aprovação.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Formulário de Lance */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Seu Lance (R$)
                        </label>
                        <Input
                          type="number"
                          placeholder="Ex: 5000.00"
                          value={bidPrice}
                          onChange={(e) => setBidPrice(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Data de Entrega Proposta
                        </label>
                        <Input
                          type="date"
                          value={bidDeliveryDate}
                          onChange={(e) => setBidDeliveryDate(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <Button 
                        onClick={handleSubmitBid} 
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {loading ? "Enviando..." : "ENVIAR MEU LANCE"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {opportunities.length === 0 && (
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhuma oportunidade disponível no momento.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Ative seu status para receber notificações de novas cargas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
