import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import B2BQuoteCalculator from "@/components/admin/B2BQuoteCalculator";

const AdminB2BCalculator = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/admin/pedidos")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Admin
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Calculadora B2B Automática</h1>
          <p className="text-lg text-muted-foreground">
            Gere propostas comerciais automaticamente com base nos fatores de variação
          </p>
        </div>

        <B2BQuoteCalculator />
      </div>
    </div>
  );
};

export default AdminB2BCalculator;
