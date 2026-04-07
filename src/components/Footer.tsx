import { Package, Mail, Phone, MapPin, Truck, Shield, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type FooterSheetKey = "sobre" | "blog" | "carreiras" | "privacidade" | "integracoes" | "termos" | "cookies" | null;

const sheetContent: Record<Exclude<FooterSheetKey, null>, { title: string; content: React.ReactNode }> = {
  sobre: {
    title: "Sobre Nós",
    content: (
      <div className="space-y-4 text-muted-foreground">
        <p>
          A <strong className="text-foreground">LogiMarket</strong> nasceu da necessidade de simplificar a logística brasileira. 
          Somos um marketplace logístico inteligente que conecta embarcadores a transportadoras e motoristas autônomos de forma transparente e eficiente.
        </p>
        <p>
          Com tecnologia de ponta — incluindo nossa IA proprietária <strong className="text-foreground">LogiMind</strong> — oferecemos precificação dinâmica, 
          rastreamento em tempo real e uma experiência sem burocracia para todos os envolvidos na cadeia logística.
        </p>
        <p>
          Nossa missão é democratizar o acesso a serviços logísticos de qualidade, 
          permitindo que empresas de todos os tamanhos encontrem as melhores opções de transporte com transparência em preços, prazos e qualidade.
        </p>
        <div className="pt-4 border-t border-border">
          <p className="text-sm font-medium text-foreground">📍 São Paulo, SP — Brasil</p>
          <p className="text-sm">Fundada em 2024</p>
        </div>
      </div>
    ),
  },
  blog: {
    title: "Blog",
    content: (
      <div className="space-y-4 text-muted-foreground">
        <p>
          Nosso blog está sendo preparado com conteúdos sobre logística, tecnologia e inovação no transporte de cargas.
        </p>
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium text-foreground">📦 Em breve</p>
            <p className="text-sm">Guia completo: Como reduzir custos logísticos com precificação dinâmica</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium text-foreground">🚛 Em breve</p>
            <p className="text-sm">O futuro do transporte autônomo no Brasil: tendências para 2025</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium text-foreground">🤖 Em breve</p>
            <p className="text-sm">Como a IA está revolucionando a logística brasileira</p>
          </div>
        </div>
        <p className="text-sm italic">
          Quer ser notificado quando publicarmos? Entre em contato pelo e-mail contato@logimarket.com.br
        </p>
      </div>
    ),
  },
  carreiras: {
    title: "Carreiras",
    content: (
      <div className="space-y-4 text-muted-foreground">
        <p>
          Estamos construindo o futuro da logística brasileira e buscamos pessoas apaixonadas por tecnologia e inovação.
        </p>
        <p>
          No momento, estamos em fase de pré-lançamento e nosso time ainda é enxuto. 
          Mas em breve abriremos vagas nas seguintes áreas:
        </p>
        <div className="space-y-2">
          {["Engenharia de Software (Full-Stack)", "Produto & UX Design", "Operações & Logística", "Comercial & Parcerias", "Customer Success"].map((vaga) => (
            <div key={vaga} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <span className="text-primary">●</span>
              <span className="text-sm text-foreground">{vaga}</span>
            </div>
          ))}
        </div>
        <p className="text-sm">
          Interessado? Envie seu currículo para <strong className="text-foreground">carreiras@logimarket.com.br</strong>
        </p>
      </div>
    ),
  },
  privacidade: {
    title: "Política de Privacidade",
    content: (
      <div className="space-y-4 text-muted-foreground text-sm">
        <p>
          A LogiMarket leva a proteção dos seus dados a sério. Esta política descreve como coletamos, 
          usamos e protegemos suas informações pessoais em conformidade com a LGPD (Lei Geral de Proteção de Dados).
        </p>
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-foreground mb-1">Dados coletados</h4>
            <p>Nome, e-mail, telefone, CPF/CNPJ, endereços de origem e destino, dados de veículos e documentos (para motoristas).</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Finalidade</h4>
            <p>Prestação do serviço de marketplace logístico, cálculo de cotações, processamento de pagamentos e comunicações operacionais.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Compartilhamento</h4>
            <p>Seus dados podem ser compartilhados com transportadoras e motoristas exclusivamente para execução do serviço contratado.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Segurança</h4>
            <p>Utilizamos criptografia, controle de acesso e monitoramento contínuo. Seus dados são armazenados em infraestrutura segura com certificações internacionais.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Seus direitos</h4>
            <p>Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento pelo e-mail privacidade@logimarket.com.br.</p>
          </div>
        </div>
      </div>
    ),
  },
  integracoes: {
    title: "Integrações",
    content: (
      <div className="space-y-4 text-muted-foreground">
        <p>
          A LogiMarket está desenvolvendo integrações com as principais plataformas do mercado para facilitar sua operação logística.
        </p>
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium text-foreground">🔗 API REST</p>
            <p className="text-sm">API aberta para integração com ERPs, e-commerces e sistemas de gestão</p>
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">Em desenvolvimento</span>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium text-foreground">🛒 E-commerce</p>
            <p className="text-sm">Shopify, WooCommerce, Nuvemshop e outras plataformas</p>
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Planejado</span>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium text-foreground">📊 ERPs</p>
            <p className="text-sm">SAP, TOTVS, Bling e Omie</p>
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Planejado</span>
          </div>
        </div>
        <p className="text-sm italic">
          Precisa de uma integração específica? Fale conosco: contato@logimarket.com.br
        </p>
      </div>
    ),
  },
  termos: {
    title: "Termos de Uso",
    content: (
      <div className="space-y-4 text-muted-foreground text-sm">
        <p>
          Ao utilizar a plataforma LogiMarket, você concorda com os seguintes termos:
        </p>
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-foreground mb-1">Natureza do serviço</h4>
            <p>A LogiMarket atua como marketplace, conectando embarcadores a prestadores de serviço logístico. Não somos uma transportadora.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Responsabilidades</h4>
            <p>O transporte é executado por transportadoras e motoristas parceiros. A LogiMarket oferece ferramentas de rastreamento, seguro opcional (LogiGuard Pro) e suporte à resolução de problemas.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Pagamentos</h4>
            <p>Os pagamentos são processados de forma segura através de gateways certificados. A comissão da plataforma está inclusa no preço final apresentado na cotação.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Cancelamentos</h4>
            <p>Pedidos podem ser cancelados antes da coleta sem custos. Após a coleta, podem ser aplicadas taxas proporcionais ao serviço já executado.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Foro</h4>
            <p>Fica eleito o foro da comarca de São Paulo/SP para dirimir questões decorrentes do uso da plataforma.</p>
          </div>
        </div>
      </div>
    ),
  },
  cookies: {
    title: "Política de Cookies",
    content: (
      <div className="space-y-4 text-muted-foreground text-sm">
        <p>
          Utilizamos cookies para melhorar sua experiência na plataforma LogiMarket.
        </p>
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-foreground mb-1">Cookies essenciais</h4>
            <p>Necessários para o funcionamento da plataforma, como autenticação e preferências de sessão. Não podem ser desativados.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Cookies de desempenho</h4>
            <p>Nos ajudam a entender como você usa a plataforma para podermos melhorá-la continuamente.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Cookies de marketing</h4>
            <p>Utilizados para personalizar anúncios e conteúdo. Você pode desativá-los nas configurações do seu navegador.</p>
          </div>
        </div>
        <p>
          Para mais informações, entre em contato: privacidade@logimarket.com.br
        </p>
      </div>
    ),
  },
};

const Footer = () => {
  const [openSheet, setOpenSheet] = useState<FooterSheetKey>(null);

  const SheetLink = ({ sheetKey, children }: { sheetKey: Exclude<FooterSheetKey, null>; children: React.ReactNode }) => (
    <button
      onClick={() => setOpenSheet(sheetKey)}
      className="text-slate-400 hover:text-primary transition-colors duration-200 text-left"
    >
      {children}
    </button>
  );

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
                <SheetLink sheetKey="integracoes">Integrações</SheetLink>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-white mb-5 text-lg">Empresa</h3>
            <ul className="space-y-3 text-sm">
              <li><SheetLink sheetKey="sobre">Sobre Nós</SheetLink></li>
              <li><SheetLink sheetKey="blog">Blog</SheetLink></li>
              <li><SheetLink sheetKey="carreiras">Carreiras</SheetLink></li>
              <li><SheetLink sheetKey="privacidade">Política de Privacidade</SheetLink></li>
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
            <SheetLink sheetKey="termos">Termos de Uso</SheetLink>
            <SheetLink sheetKey="privacidade">Política de Privacidade</SheetLink>
            <SheetLink sheetKey="cookies">Cookies</SheetLink>
          </div>
        </div>
      </div>

      {/* Sheet modals */}
      {openSheet && (
        <Sheet open={!!openSheet} onOpenChange={(open) => !open && setOpenSheet(null)}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{sheetContent[openSheet].title}</SheetTitle>
              <SheetDescription className="sr-only">
                {sheetContent[openSheet].title}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              {sheetContent[openSheet].content}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </footer>
  );
};

export default Footer;
