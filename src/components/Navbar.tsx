import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Package, Menu, User, LayoutDashboard, Truck, Users, FileText, Home, Shield, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar role admin:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!data);
    } catch (error) {
      console.error('Erro ao verificar role admin:', error);
      setIsAdmin(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const handleScrollToSection = (sectionId: string) => {
    // Se não estiver na home, navegar primeiro
    if (window.location.pathname !== '/') {
      navigate('/');
      // Aguardar navegação e então rolar
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // Já está na home, apenas rolar
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setMobileMenuOpen(false);
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
            <button 
              onClick={() => handleScrollToSection('features')} 
              className="text-foreground hover:text-primary transition-colors"
            >
              Funcionalidades
            </button>
            <button 
              onClick={() => handleScrollToSection('how-it-works')} 
              className="text-foreground hover:text-primary transition-colors"
            >
              Como Funciona
            </button>
            <Link to="/ranking" className="text-foreground hover:text-primary transition-colors">
              Ranking
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

                {/* Menu Admin - Apenas para admins */}
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="hidden md:inline-flex gap-2">
                        <Shield className="h-4 w-4" />
                        Área Admin
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Painel Administrativo</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin/motoristas")}>
                        <Users className="h-4 w-4 mr-2" />
                        Motoristas
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/admin/pedidos")}>
                        <FileText className="h-4 w-4 mr-2" />
                        Pedidos & KPIs
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/admin/calculadora-b2b")}>
                        <Settings className="h-4 w-4 mr-2" />
                        Calculadora B2B
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

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

                  <Button
                    variant="ghost"
                    className="justify-start gap-3 text-base"
                    onClick={() => handleScrollToSection('features')}
                  >
                    <Package className="h-5 w-5" />
                    Funcionalidades
                  </Button>

                  <Button
                    variant="ghost"
                    className="justify-start gap-3 text-base"
                    onClick={() => handleScrollToSection('how-it-works')}
                  >
                    <FileText className="h-5 w-5" />
                    Como Funciona
                  </Button>

                  <Button
                    variant="ghost"
                    className="justify-start gap-3 text-base"
                    onClick={() => handleNavigation("/ranking")}
                  >
                    <Users className="h-5 w-5" />
                    Ranking
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

                      {/* Menu Admin - Mobile - Apenas para admins */}
                      {isAdmin && (
                        <>
                          <div className="border-t border-border my-2" />
                          <div className="px-3 py-2">
                            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              ÁREA ADMINISTRATIVA
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            className="justify-start gap-3 text-base"
                            onClick={() => handleNavigation("/admin/motoristas")}
                          >
                            <Truck className="h-5 w-5" />
                            Motoristas
                          </Button>

                          <Button
                            variant="ghost"
                            className="justify-start gap-3 text-base"
                            onClick={() => handleNavigation("/admin/pedidos")}
                          >
                            <FileText className="h-5 w-5" />
                            Pedidos & KPIs
                          </Button>

                          <Button
                            variant="ghost"
                            className="justify-start gap-3 text-base"
                            onClick={() => handleNavigation("/admin/calculadora-b2b")}
                          >
                            <Settings className="h-5 w-5" />
                            Calculadora B2B
                          </Button>
                        </>
                      )}

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
