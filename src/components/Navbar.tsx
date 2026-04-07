import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Package, Menu, User, LayoutDashboard, Truck, Users, FileText, Home, Shield, Settings, LogOut, UserCircle, DollarSign } from "lucide-react";
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
import { cn } from "@/lib/utils";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled 
        ? "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm" 
        : "bg-background/80 backdrop-blur-lg border-b border-transparent"
    )}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px]">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="p-2 bg-gradient-primary rounded-lg group-hover:shadow-md transition-all">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              LogiMarket
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
            <button 
              onClick={() => handleScrollToSection('features')} 
              className="text-foreground hover:text-primary transition-colors text-sm whitespace-nowrap"
            >
              Funcionalidades
            </button>
            <button 
              onClick={() => handleScrollToSection('how-it-works')} 
              className="text-foreground hover:text-primary transition-colors text-sm whitespace-nowrap"
            >
              Como Funciona
            </button>
            <Link to="/ranking" className="text-foreground hover:text-primary transition-colors text-sm whitespace-nowrap">
              Ranking
            </Link>
            <Link to="/faq" className="text-foreground hover:text-primary transition-colors text-sm whitespace-nowrap">
              FAQ
            </Link>
            <Link to="/parceiro/cadastro" className="text-foreground hover:text-primary transition-colors text-sm whitespace-nowrap">
              Seja um Parceiro
            </Link>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            {user ? (
              <>
                <Link to="/dashboard" className="hidden lg:block">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden xl:inline">Dashboard</span>
                  </Button>
                </Link>

                {/* Menu de Conta - Refinado */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden lg:inline-flex gap-2 hover:bg-primary/5">
                      <User className="h-4 w-4" />
                      <span className="hidden xl:inline">Conta</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 bg-background/95 backdrop-blur-md z-50 shadow-xl border border-border/50 p-2">
                    <DropdownMenuLabel className="text-sm font-semibold text-foreground px-2 py-2">Minha Conta</DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem 
                      onClick={() => navigate("/perfil")}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors"
                    >
                      <UserCircle className="h-4 w-4 text-primary" />
                      <span>Meu Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-destructive/10 text-destructive transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Menu Admin - Apenas para admins */}
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="hidden lg:inline-flex gap-2 whitespace-nowrap border-primary/30 hover:bg-primary/5 hover:border-primary">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="hidden xl:inline">Área Admin</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 bg-background/95 backdrop-blur-md z-50 shadow-xl border border-border/50 p-2">
                      <DropdownMenuLabel className="text-sm font-semibold text-foreground px-2 py-2 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        Painel Administrativo
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem 
                        onClick={() => navigate("/admin/motoristas")}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors"
                      >
                        <Users className="h-4 w-4 text-secondary" />
                        <span>Motoristas</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate("/admin/pedidos")}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-accent" />
                        <span>Pedidos & KPIs</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate("/admin/financeiro")}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors"
                      >
                        <DollarSign className="h-4 w-4 text-secondary" />
                        <span>Financeiro</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate("/admin/calculadora-b2b")}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors"
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span>Calculadora B2B</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <Link to="/quote" className="flex-shrink-0">
                  <Button variant="hero" size="default" className="whitespace-nowrap">
                    Nova Cotação
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth" className="hidden lg:block flex-shrink-0">
                  <Button variant="ghost" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link to="/auth" className="flex-shrink-0">
                  <Button variant="hero" size="default" className="whitespace-nowrap">
                    Começar Grátis
                  </Button>
                </Link>
              </>
            )}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden flex-shrink-0"
                  data-testid="mobile-menu-trigger"
                >
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

                  <Button
                    variant="ghost"
                    className="justify-start gap-3 text-base"
                    onClick={() => handleNavigation("/faq")}
                  >
                    <FileText className="h-5 w-5" />
                    FAQ
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
                        onClick={() => handleNavigation("/perfil")}
                      >
                        <User className="h-5 w-5" />
                        Meu Perfil
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
                            onClick={() => handleNavigation("/admin/financeiro")}
                          >
                            <DollarSign className="h-5 w-5" />
                            Financeiro
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
