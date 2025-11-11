import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { KPICards } from "@/components/dashboard/KPICards";
import { ActiveOrdersTable, Order } from "@/components/dashboard/ActiveOrdersTable";
import { OrderDetail, OrderDetails } from "@/components/dashboard/OrderDetail";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  // Mock KPI data - Em produção, viria do backend
  const kpiData = {
    averageSavings: 12.5,
    onTimeDeliveryRate: 94,
    activeShipments: orders.filter(o => o.status === "in_transit").length,
    openIncidents: orders.filter(o => o.status === "incident").length,
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Você precisa estar logado para acessar o dashboard");
      navigate("/auth");
      return;
    }
    loadOrders();
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // Buscar cotações do usuário
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          id,
          origin_cep,
          destination_cep,
          created_at,
          quote_items (
            carrier_id,
            final_price,
            delivery_days,
            base_price,
            commission_applied,
            selected,
            carriers (
              name,
              carrier_size
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (quotesError) throw quotesError;

      // Transformar dados em formato de pedidos
      // Em produção, haveria uma tabela de "orders" com status real
      const mockOrders: Order[] = quotes?.map((quote, index) => {
        const selectedItem = quote.quote_items?.find(item => item.selected) || quote.quote_items?.[0];
        const carrier = selectedItem?.carriers;
        
        // Status aleatório para demonstração
        const statuses: Order["status"][] = ["in_transit", "scheduled", "delivered", "incident"];
        const randomStatus = statuses[index % statuses.length];
        
        return {
          id: quote.id,
          quote_id: quote.id,
          status: randomStatus,
          carrier_name: carrier?.name || "Transportadora Mock",
          carrier_type: Math.random() > 0.7 ? "autonomous" : "carrier",
          vehicle_type: Math.random() > 0.7 ? "Caminhão Toco" : undefined,
          origin_city: `CEP ${quote.origin_cep}`,
          destination_city: `CEP ${quote.destination_cep}`,
          final_price: selectedItem?.final_price || 0,
          estimated_delivery: new Date(Date.now() + (selectedItem?.delivery_days || 5) * 24 * 60 * 60 * 1000).toISOString(),
          created_at: quote.created_at,
        };
      }) || [];

      setOrders(mockOrders);
    } catch (error: any) {
      console.error("Error loading orders:", error);
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (orderId: string) => {
    try {
      // Buscar detalhes completos do pedido
      const { data: quote, error } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_items (
            *,
            carriers (
              name,
              carrier_size
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;

      const selectedItem = quote.quote_items?.find((item: any) => item.selected) || quote.quote_items?.[0];
      const carrier = selectedItem?.carriers;

      // Criar timeline mock
      const mockTimeline = [
        {
          date: quote.created_at,
          status: "Cotação Realizada",
          description: "Cotação criada no sistema LogiMarket"
        },
        {
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: "Coleta Realizada",
          description: "Carga coletada no endereço de origem"
        },
        {
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: "Em Transferência",
          description: "Mercadoria em trânsito para o centro de distribuição"
        },
      ];

      const details: OrderDetails = {
        id: quote.id,
        quote_id: quote.id,
        status: "in_transit",
        carrier_name: carrier?.name || "Transportadora Mock",
        carrier_type: Math.random() > 0.7 ? "autonomous" : "carrier",
        vehicle_type: Math.random() > 0.7 ? "Caminhão Toco" : undefined,
        origin: {
          cep: quote.origin_cep,
          address: "Rua Exemplo, 123",
          city: "São Paulo - SP"
        },
        destination: {
          cep: quote.destination_cep,
          address: "Av. Teste, 456",
          city: "Rio de Janeiro - RJ"
        },
        base_price: selectedItem?.base_price || 0,
        commission_applied: selectedItem?.commission_applied || 0.10,
        adjustment_reason: Math.random() > 0.5 ? "COMPETITION" : "ROUTE_OPTIMIZED",
        final_price: selectedItem?.final_price || 0,
        weight_kg: quote.weight_kg,
        estimated_delivery: new Date(Date.now() + (selectedItem?.delivery_days || 5) * 24 * 60 * 60 * 1000).toISOString(),
        created_at: quote.created_at,
        timeline: mockTimeline,
      };

      setOrderDetails(details);
      setSelectedOrderId(orderId);
    } catch (error: any) {
      console.error("Error loading order details:", error);
      toast.error("Erro ao carregar detalhes do pedido");
    }
  };

  const handleBackToList = () => {
    setSelectedOrderId(null);
    setOrderDetails(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {selectedOrderId && orderDetails ? (
          <OrderDetail order={orderDetails} onBack={handleBackToList} />
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Dashboard{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  LogiMind
                </span>
              </h1>
              <p className="text-muted-foreground">
                Visão geral dos seus fretes e métricas de desempenho
              </p>
            </div>

            <KPICards data={kpiData} />
            
            <ActiveOrdersTable 
              orders={orders} 
              onViewDetails={handleViewDetails}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
