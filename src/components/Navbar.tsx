import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Package, Menu, User, LayoutDashboard, Truck, Users, FileText, Home } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
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
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    LogiMarket
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  <Button
                    variant="ghost"
                    className="justify-start gap-3 text-base"
                    onClick={() => handleNavigation("/")}
                  >
                    <Home className="h-5 w-5" />
                    Início
                  </Button>
                  
                  {user ? (
                    <>
                      <Button
                        variant="ghost"
                        className="justify-start gap-3 text-base"
                        onClick={() => handleNavigation("/dashboard")}
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start gap-3 text-base"
                        onClick={() => handleNavigation("/quote")}
                      >
                        <FileText className="h-5 w-5" />
                        Nova Cotação
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start gap-3 text-base"
                        onClick={() => handleNavigation("/motorista/dashboard")}
                      >
                        <Truck className="h-5 w-5" />
                        Dashboard Motorista
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start gap-3 text-base"
                        onClick={() => handleNavigation("/admin/motoristas")}
                      >
                        <Users className="h-5 w-5" />
                        Admin Motoristas
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start gap-3 text-base"
                        onClick={() => handleNavigation("/admin/pedidos")}
                      >
                        <FileText className="h-5 w-5" />
                        Admin Pedidos
                      </Button>
                      <div className="border-t pt-4 mt-4">
                        <Button
                          variant="ghost"
                          className="justify-start gap-3 text-base w-full"
                          onClick={handleSignOut}
                        >
                          <User className="h-5 w-5" />
                          Sair
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        className="justify-start gap-3 text-base"
                        onClick={() => handleNavigation("/parceiro/cadastro")}
                      >
                        <Truck className="h-5 w-5" />
                        Seja um Parceiro
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start gap-3 text-base"
                        onClick={() => handleNavigation("/auth")}
                      >
                        <User className="h-5 w-5" />
                        Entrar
                      </Button>
                      <Button
                        variant="default"
                        className="justify-start gap-3 text-base mt-4"
                        onClick={() => handleNavigation("/auth")}
                      >
                        Começar Grátis
                      </Button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
