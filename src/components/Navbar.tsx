import { Button } from "@/components/ui/button";
import { Package, Menu } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
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
            <Link to="/#pricing" className="text-foreground hover:text-primary transition-colors">
              Preços
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden md:inline-flex">
              Entrar
            </Button>
            <Button variant="hero" size="lg">
              Começar Grátis
            </Button>
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
