import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Package, Menu, User, LayoutDashboard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-gradient-primary rounded-lg group-hover:shadow-md transition-all">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              LogiMarket
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/#features" className="text-foreground hover:text-primary transition-colors">
              Funcionalidades
            </Link>
            <Link to="/#how-it-works" className="text-foreground hover:text-primary transition-colors">
              Como Funciona
            </Link>
            <Link to="/parceiro/cadastro" className="text-foreground hover:text-primary transition-colors">
              Seja um Parceiro
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" className="hidden md:inline-flex">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/quote">
                  <Button variant="hero" size="lg" className="text-sm sm:text-base px-3 sm:px-6">
                    <span className="hidden sm:inline">Nova Cotação</span>
                    <span className="sm:hidden">Nova Cotação</span>
                  </Button>
                </Link>
                <Button variant="ghost" onClick={handleSignOut} className="hidden md:inline-flex">
                  <User className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="hidden md:inline-flex">
                    Entrar
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="hero" size="lg" className="text-sm sm:text-base px-3 sm:px-6">
                    <span className="hidden sm:inline">Começar Grátis</span>
                    <span className="sm:hidden">Começar</span>
                  </Button>
                </Link>
              </>
            )}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
