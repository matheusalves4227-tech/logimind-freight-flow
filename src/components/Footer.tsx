import { Package, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                LogiMarket
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Simplificando a logística brasileira com tecnologia e transparência.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Produto</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/#features" className="text-muted-foreground hover:text-primary transition-colors">
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Integrações
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Carreiras
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contato</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                contato@logimarket.com.br
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                (11) 4000-0000
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                São Paulo, SP
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2024 LogiMarket. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
