import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DriverStatus } from "@/components/driver/DriverStatus";
import { DriverOpportunities } from "@/components/driver/DriverOpportunities";
import { DriverActive } from "@/components/driver/DriverActive";
import { DriverFinancial } from "@/components/driver/DriverFinancial";
import { Home, Map, Truck, Wallet } from "lucide-react";

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

    // Buscar perfil do motorista
    const { data: profile } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (!profile) {
      navigate('/motorista/onboarding');
      return;
    }

    if (profile.status !== 'approved') {
      navigate('/motorista/pending-approval');
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Dashboard do Motorista</h1>
          <p className="text-muted-foreground mt-2">
            Olá, {driverProfile?.full_name}
          </p>
        </div>

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
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
          </TabsList>

          <TabsContent value="status">
            <DriverStatus driverProfile={driverProfile} />
          </TabsContent>

          <TabsContent value="opportunities">
            <DriverOpportunities driverProfile={driverProfile} />
          </TabsContent>

          <TabsContent value="active">
            <DriverActive driverProfile={driverProfile} />
          </TabsContent>

          <TabsContent value="financial">
            <DriverFinancial driverProfile={driverProfile} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DriverDashboard;
