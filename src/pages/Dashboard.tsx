import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { KPICards } from "@/components/dashboard/KPICards";
import { ActiveOrdersTable, Order } from "@/components/dashboard/ActiveOrdersTable";
import { OrderDetail, OrderDetails } from "@/components/dashboard/OrderDetail";
import { PixPaymentModal } from "@/components/payment/PixPaymentModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

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
      
      // Buscar pedidos reais da tabela orders
      // Garantir que buscamos apenas pedidos do usuário logado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error("Sessão inválida");
      }
      const userId = session.user.id;

      const { data: realOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (ordersError) throw ordersError;

      // Mapear status da ordem para o formato esperado
      const statusMapping: Record<string, Order["status"]> = {
        'pending': 'scheduled',
        'confirmed': 'scheduled',
        'in_transit': 'in_transit',
        'delivered': 'delivered',
        'cancelled': 'incident',
        'rejected': 'incident',
        'failed': 'incident'
      };

      const mappedOrders: Order[] = realOrders?.map((order) => ({
        id: order.id,
        tracking_code: order.tracking_code || `TEMP-${order.id.slice(0, 8)}`,
        quote_id: order.quote_id || order.id,
        status: statusMapping[order.status] || 'scheduled',
        carrier_name: order.carrier_name,
        carrier_type: order.service_type === 'ftl' ? 'autonomous' : 'carrier',
        vehicle_type: order.vehicle_type || undefined,
        origin_city: order.origin_address,
        destination_city: order.destination_address,
        final_price: parseFloat(order.final_price.toString()),
        estimated_delivery: order.estimated_delivery,
        created_at: order.created_at,
        payment_status: order.status_pagamento,
        operational_notes: order.operational_notes || undefined,
      })) || [];

      setOrders(mappedOrders);
    } catch (error: any) {
      console.error("Error loading orders:", error);
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (orderId: string) => {
    try {
      // Buscar detalhes do pedido e eventos de tracking reais em paralelo
      const [orderResult, trackingResult] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle(),
        supabase
          .from('tracking_events')
          .select('*')
          .eq('order_id', orderId)
          .order('event_timestamp', { ascending: true })
      ]);

      if (orderResult.error) throw orderResult.error;
      if (!orderResult.data) throw new Error("Pedido não encontrado");

      const order = orderResult.data;
      const trackingEvents = trackingResult.data || [];

      // Mapear eventos reais para o formato da timeline
      const realTimeline = trackingEvents.map(event => ({
        date: event.event_timestamp,
        status: event.event_description,
        description: event.city && event.state 
          ? `${event.city} - ${event.state}` 
          : event.event_code
      }));

      // Se não houver eventos, criar evento inicial de criação do pedido
      const timeline = realTimeline.length > 0 ? realTimeline : [
        {
          date: order.created_at,
          status: "Pedido Criado",
          description: "Pedido registrado no sistema LogiMarket"
        }
      ];

      const details: OrderDetails = {
        id: order.id,
        quote_id: order.quote_id || order.id,
        status: order.status === 'in_transit' ? 'in_transit' : 
                order.status === 'delivered' ? 'delivered' : 
                order.status === 'entregue' ? 'ENTREGUE' :
                order.status === 'incident' ? 'incident' : 'in_transit',
        carrier_name: order.carrier_name,
        carrier_type: order.service_type === 'ftl' ? "autonomous" : "carrier",
        vehicle_type: order.vehicle_type || undefined,
        driver_id: order.driver_id || undefined,
        carrier_id: order.carrier_id || undefined,
        foto_entrega_url: order.foto_entrega_url || undefined,
        foto_entrega_timestamp: order.foto_entrega_timestamp || undefined,
        foto_entrega_latitude: order.foto_entrega_latitude || undefined,
        foto_entrega_longitude: order.foto_entrega_longitude || undefined,
        origin: {
          cep: order.origin_cep,
          address: order.origin_address,
          city: order.origin_address.split(' - ').slice(-2).join(' - ')
        },
        destination: {
          cep: order.destination_cep,
          address: order.destination_address,
          city: order.destination_address.split(' - ').slice(-2).join(' - ')
        },
        base_price: parseFloat(order.base_price.toString()),
        commission_applied: parseFloat(order.commission_applied.toString()),
        adjustment_reason: "COMPETITION",
        final_price: parseFloat(order.final_price.toString()),
        weight_kg: parseFloat(order.weight_kg.toString()),
        estimated_delivery: order.estimated_delivery,
        created_at: order.created_at,
        timeline: timeline,
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

  const parsePaymentError = (error: any): string => {
    // Extrair mensagem de erro da resposta
    const errorMessage = error?.message || error?.error?.message || error?.toString() || '';
    
    // Mapear erros comuns para mensagens user-friendly
    if (errorMessage.includes('Order not found')) {
      return "Pedido não encontrado. Por favor, atualize a página.";
    }
    if (errorMessage.includes('unauthorized') || errorMessage.includes('not authorized')) {
      return "Você não tem permissão para pagar este pedido.";
    }
    if (errorMessage.includes('already paid')) {
      return "Este pedido já foi pago.";
    }
    if (errorMessage.includes('User not authenticated')) {
      return "Sessão expirada. Faça login novamente.";
    }
    if (errorMessage.includes('Invalid order status')) {
      return "Status do pedido não permite pagamento.";
    }
    
    // Mensagem genérica para erros desconhecidos
    return "Erro ao processar pagamento. Tente novamente ou contate o suporte.";
  };

  const handleRetryPayment = async (orderId: string) => {
    try {
      toast.loading("Gerando dados do pagamento PIX...", { id: 'retry-payment' });

      // Verificar autenticação antes de fazer qualquer chamada
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.", { id: 'retry-payment' });
        navigate("/auth");
        return;
      }

      // Validar que o pedido existe e pertence ao usuário
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        toast.error("Pedido não encontrado.", { id: 'retry-payment' });
        return;
      }

      // Gerar dados do PIX Manual
      const { data: pixPaymentData, error: pixError } = await supabase.functions.invoke(
        'create-pix-payment',
        {
          body: { order_id: orderId }
        }
      );

      if (pixError || !pixPaymentData?.pix_data) {
        console.error('PIX payment error:', pixError);
        toast.error("Erro ao gerar pagamento PIX. Tente novamente.", { id: 'retry-payment' });
        return;
      }

      toast.dismiss('retry-payment');
      
      // Mostrar modal com QR Code PIX
      setPixData(pixPaymentData.pix_data);
      setCurrentOrderId(orderId);
      setPixModalOpen(true);
    } catch (error: any) {
      console.error('Unexpected error retrying payment:', error);
      toast.error("Erro ao processar pagamento. Tente novamente.", { id: 'retry-payment' });
    }
  };

  const handlePixPaymentComplete = () => {
    toast.success("Comprovante enviado! Aguarde confirmação do admin.");
    setPixModalOpen(false);
    setPixData(null);
    setCurrentOrderId(null);
    // Recarregar pedidos para atualizar status
    loadOrders();
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Meu Dashboard - LogiMarket</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Meu Dashboard - LogiMarket</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
      
      <div className="container mx-auto px-4 pt-20 md:pt-24 pb-8 md:pb-12">
        {selectedOrderId && orderDetails ? (
          <OrderDetail order={orderDetails} onBack={handleBackToList} />
        ) : (
          <>
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Dashboard{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  LogiMind
                </span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Visão geral dos seus fretes e métricas de desempenho
              </p>
            </div>

            <KPICards data={kpiData} />
            
            <ActiveOrdersTable 
              orders={orders} 
              onViewDetails={handleViewDetails}
              onRetryPayment={handleRetryPayment}
            />
          </>
        )}
      </div>
    </div>

    {/* Modal de Pagamento PIX */}
    <PixPaymentModal
      open={pixModalOpen}
      onOpenChange={setPixModalOpen}
      orderId={currentOrderId || ""}
      pixData={pixData}
      onPaymentComplete={handlePixPaymentComplete}
    />
    </>
  );
};

export default Dashboard;
