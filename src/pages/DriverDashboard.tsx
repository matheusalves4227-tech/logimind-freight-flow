import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DriverStatus } from "@/components/driver/DriverStatus";
import { DriverPendingFreights } from "@/components/driver/DriverPendingFreights";
import { DriverOpportunities } from "@/components/driver/DriverOpportunities";
import { DriverActive } from "@/components/driver/DriverActive";
import { DriverBankAccount } from "@/components/driver/DriverBankAccount";
import { DriverFinancialKPIs } from "@/components/driver/DriverFinancialKPIs";
import { DriverPaymentHistory } from "@/components/driver/DriverPaymentHistory";
import { DriverProfile } from "@/components/driver/DriverProfile";
import { DriverNotifications } from "@/components/driver/DriverNotifications";
import { Home, Map, Truck, Wallet, UserCircle } from "lucide-react";

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [driverProfile, setDriverProfile] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    // Mock: Perfil de motorista aprovado
    // Descomente quando os tipos Supabase forem atualizados:
    // const { data: profile } = await supabase
    //   .from('driver_profiles')
    //   .select('*')
    //   .eq('user_id', session.user.id)
    //   .maybeSingle();
    // if (!profile) {
    //   navigate('/motorista/onboarding');
    //   return;
    // }
    // if (profile.status !== 'approved') {
    //   navigate('/motorista/pending-approval');
    //   return;
    // }
    
    // Buscar perfil real do motorista
    const { data: profile, error } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      navigate('/');
      return;
    }

    if (!profile) {
      // Sem perfil de motorista, redirecionar para cadastro
      navigate('/parceiro/cadastro?tipo=motorista');
      return;
    }

    if (profile.status !== 'approved') {
      navigate('/aguardando-aprovacao');
      return;
    }
    
    setDriverProfile(profile);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard do Motorista - LogiMarket</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard do Motorista</h1>
          <h1 className="text-3xl font-bold text-foreground">Dashboard do Motorista</h1>
          <p className="text-muted-foreground mt-2">
            Olá, {driverProfile?.full_name}
          </p>
        </div>

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="status" className="gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Status</span>
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="gap-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Oportunidades</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Ativos</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Financeiro</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <UserCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-6">
            {/* Fretes aguardando aceite - PRIORIDADE */}
            <DriverPendingFreights driverProfile={driverProfile} />
            
            {/* Status geral */}
            <DriverStatus driverProfile={driverProfile} />
          </TabsContent>

          <TabsContent value="opportunities">
            <DriverOpportunities driverProfile={driverProfile} />
          </TabsContent>

          <TabsContent value="active">
            <DriverActive driverProfile={driverProfile} />
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            {/* KPIs Financeiros */}
            <DriverFinancialKPIs />
            
            {/* Cadastro de Dados Bancários */}
            <DriverBankAccount />
            
            {/* Histórico de Repasses */}
            <DriverPaymentHistory />
          </TabsContent>

          <TabsContent value="profile">
            <DriverProfile driverProfile={driverProfile} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </>
  );
};

export default DriverDashboard;
