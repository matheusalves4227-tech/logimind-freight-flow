import { Package, Mail, Phone, MapPin, Truck, Shield, Brain } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[hsl(222,47%,11%)] text-slate-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-primary to-[hsl(217,82%,45%)] rounded-xl shadow-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                LogiMarket
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Simplificando a logística brasileira com tecnologia inteligente, transparência e precificação dinâmica.
            </p>
            
            {/* Mini features */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Brain className="h-4 w-4 text-primary" />
                <span>Powered by LogiMind AI</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="h-4 w-4 text-secondary" />
                <span>LogiGuard Pro Security</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Truck className="h-4 w-4 text-accent" />
                <span>500+ Transportadoras</span>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-bold text-white mb-5 text-lg">Produto</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/#features" className="text-slate-400 hover:text-primary transition-colors duration-200">
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-slate-400 hover:text-primary transition-colors duration-200">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/ranking" className="text-slate-400 hover:text-primary transition-colors duration-200">
                  Ranking Transportadoras
                </Link>
              </li>
              <li>
                <Link to="#" className="text-slate-400 hover:text-primary transition-colors duration-200">
                  Integrações
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-white mb-5 text-lg">Empresa</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="#" className="text-slate-400 hover:text-primary transition-colors duration-200">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="#" className="text-slate-400 hover:text-primary transition-colors duration-200">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="#" className="text-slate-400 hover:text-primary transition-colors duration-200">
                  Carreiras
                </Link>
              </li>
              <li>
                <Link to="#" className="text-slate-400 hover:text-primary transition-colors duration-200">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-white mb-5 text-lg">Contato</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3 text-slate-400">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <span>contato@logimarket.com.br</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <Phone className="h-4 w-4 text-secondary" />
                </div>
                <span>(11) 4000-0000</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <MapPin className="h-4 w-4 text-accent" />
                </div>
                <span>São Paulo, SP</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © 2024 LogiMarket. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link to="#" className="hover:text-primary transition-colors">Termos de Uso</Link>
            <Link to="#" className="hover:text-primary transition-colors">Política de Privacidade</Link>
            <Link to="#" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
