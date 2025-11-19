import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import DriverPickupValidation from "@/components/driver/DriverPickupValidation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DriverPickupCode = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [orderId]);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Verificar se o usuário é motorista e tem acesso a este pedido
      const { data: driverProfile } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!driverProfile) {
        toast({
          title: "Acesso Negado",
          description: "Apenas motoristas podem acessar esta página",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      // Verificar se o pedido pertence a este motorista
      const { data: order } = await supabase
        .from('orders')
        .select('driver_id')
        .eq('id', orderId)
        .single();

      if (!order || order.driver_id !== driverProfile.id) {
        toast({
          title: "Acesso Negado",
          description: "Este pedido não está atribuído a você",
          variant: "destructive",
        });
        navigate('/motorista/dashboard');
        return;
      }

      setHasAccess(true);
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Validação de Coleta - LogiMarket</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/motorista/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Validação de Coleta</h1>
          <p className="text-muted-foreground">
            Apresente o código abaixo ao expedidor para liberar a coleta da carga
          </p>
        </div>

        <DriverPickupValidation orderId={orderId!} />
      </div>
    </div>
    </>
  );
};

export default DriverPickupCode;
