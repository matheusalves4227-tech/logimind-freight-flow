import { HelpCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FAQ = () => {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Como funciona a precificação do LogiMarket?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "O LogiMarket utiliza o LogiMind, nossa IA de precificação dinâmica, que analisa múltiplos fatores em tempo real: Preço base das transportadoras parceiras, Tipo de rota (alta demanda, retorno, padrão), Fator de risco da região, Performance histórica das transportadoras, Demanda atual do mercado. A comissão aplicada varia entre 5% e 18% dependendo desses fatores, garantindo sempre o melhor preço final para você."
        }
      },
      {
        "@type": "Question",
        "name": "O que é o LogiMind e como ele me ajuda a economizar?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "O LogiMind é nosso agente de precificação inteligente que otimiza custos através de três estratégias principais: Rotas de Alta Demanda (reduz nossa comissão para 5-6% garantindo preço imbatível), Rotas de Retorno (aplica comissão maior mas subsidia o transportador), Análise de Risco (avalia segurança da rota e recomenda LogiGuard Pro quando necessário). Resultado: economia média de 42% comparado a cotações tradicionais."
        }
      },
      {
        "@type": "Question",
        "name": "O que é o LogiGuard Pro?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "LogiGuard Pro é nosso serviço de segurança adicional para cargas de alto valor ou rotas de risco elevado. Inclui: Rastreamento 24/7 em tempo real, Escolta digital com alertas, Seguro adicional contra roubo de carga, Monitoramento por Central de Segurança. É recomendado automaticamente quando detectamos condições de risco."
        }
      },
      {
        "@type": "Question",
        "name": "Como funciona o rastreamento unificado?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Após contratar o frete, você recebe um código de rastreamento único (formato LM-YYYY-MM-XXXX). Este código consolida informações de todas as transportadoras parceiras em um único painel, eliminando a necessidade de acessar múltiplos sites."
        }
      },
      {
        "@type": "Question",
        "name": "Quais são as formas de pagamento aceitas?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Aceitamos: PIX (confirmação instantânea), Cartão de Crédito (parcelamento em até 12x), Boleto Bancário (confirmação em 1-2 dias úteis). O pagamento fica em custódia até a entrega confirmada."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Perguntas Frequentes - Como Funciona o LogiMarket</title>
        <meta name="description" content="Tire suas dúvidas sobre cotação de frete, rastreamento, pagamento e como funciona o marketplace logístico LogiMarket." />
        <link rel="canonical" href="https://logimarket.com.br/faq" />
        <meta property="og:url" content="https://logimarket.com.br/faq" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <HelpCircle className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary">Central de Ajuda</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Perguntas Frequentes
          </h1>
          <p className="text-lg text-muted-foreground">
            Tire suas dúvidas sobre como funciona a plataforma LogiMarket
          </p>
        </div>

        {/* FAQ Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Seção: Precificação e LogiMind */}
          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="text-primary">💰</span> Precificação e LogiMind
            </h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="faq-1">
                <AccordionTrigger className="text-left">
                  Como funciona a precificação do LogiMarket?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  O LogiMarket utiliza o LogiMind, nossa IA de precificação dinâmica, que analisa múltiplos fatores em tempo real:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Preço base das transportadoras parceiras</li>
                    <li>Tipo de rota (alta demanda, retorno, padrão)</li>
                    <li>Fator de risco da região</li>
                    <li>Performance histórica das transportadoras</li>
                    <li>Demanda atual do mercado</li>
                  </ul>
                  <p className="mt-2">
                    A comissão aplicada varia entre 5% e 18% dependendo desses fatores, garantindo sempre o melhor preço final para você.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-2">
                <AccordionTrigger className="text-left">
                  O que é o LogiMind e como ele me ajuda a economizar?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  O LogiMind é nosso agente de precificação inteligente que otimiza custos através de três estratégias principais:
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>Rotas de Alta Demanda:</strong> Reduz nossa comissão para 5-6% garantindo preço imbatível em rotas competitivas</li>
                    <li><strong>Rotas de Retorno:</strong> Aplica comissão maior (13-15%) mas subsidia o transportador, otimizando toda a cadeia</li>
                    <li><strong>Análise de Risco:</strong> Avalia segurança da rota e recomenda LogiGuard Pro quando necessário</li>
                  </ul>
                  <p className="mt-2 font-semibold text-foreground">
                    Resultado: economia média de 42% comparado a cotações tradicionais.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-3">
                <AccordionTrigger className="text-left">
                  Por que alguns fretes têm comissão maior que outros?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  A comissão varia conforme a estratégia de otimização do LogiMind:
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>Comissão Reduzida (5-7%):</strong> Aplicada em rotas de alta competição para garantir o melhor preço do mercado</li>
                    <li><strong>Comissão Padrão (10%):</strong> Aplicada em rotas normais com liquidez equilibrada</li>
                    <li><strong>Comissão Otimizada (13-18%):</strong> Aplicada em rotas de retorno para viabilizar melhor aproveitamento de veículos vazios</li>
                  </ul>
                  <p className="mt-2">
                    Toda variação é transparente e você sempre vê o breakdown completo na cotação.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-4">
                <AccordionTrigger className="text-left">
                  O que é o LogiGuard Pro?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  O LogiGuard Pro é nosso serviço premium de segurança para cargas de alto valor ou rotas de maior risco. Inclui:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Rastreamento 24/7 com GPS em tempo real</li>
                    <li>Escolta digital inteligente</li>
                    <li>Seguro adicional contra roubo e avarias</li>
                    <li>GRIS (Gerenciamento de Risco)</li>
                  </ul>
                  <p className="mt-2">
                    O LogiMind recomenda automaticamente quando detecta carga acima de R$ 50.000 ou fator de risco elevado na rota.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Seção: Onboarding e Cadastro */}
          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="text-primary">📋</span> Onboarding e Cadastro
            </h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="faq-5">
                <AccordionTrigger className="text-left">
                  Como faço para me cadastrar como embarcador?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  O cadastro é simples e rápido:
                  <ol className="list-decimal pl-6 mt-2 space-y-1">
                    <li>Clique em "Começar Grátis" ou "Criar Conta"</li>
                    <li>Preencha email, senha e dados básicos</li>
                    <li>Valide seu email através do link enviado</li>
                    <li>Pronto! Você já pode solicitar cotações</li>
                  </ol>
                  <p className="mt-2 font-semibold text-foreground">
                    Não é necessário cartão de crédito para começar.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-6">
                <AccordionTrigger className="text-left">
                  Quais documentos preciso para me cadastrar como motorista autônomo?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Para garantir segurança e compliance, solicitamos:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>Pessoais:</strong> CPF, RG, Comprovante de Residência</li>
                    <li><strong>Habilitação:</strong> CNH válida com categoria adequada (C, D ou E)</li>
                    <li><strong>Profissionais:</strong> RNTRC ativo (obrigatório para transporte de cargas)</li>
                    <li><strong>Veículo:</strong> Placa, CRLV válido, dados de capacidade</li>
                    <li><strong>Financeiros:</strong> Chave PIX ou dados bancários para repasse</li>
                    <li><strong>Segurança:</strong> Certidão de Antecedentes Criminais</li>
                  </ul>
                  <p className="mt-2">
                    Todos os documentos são analisados pela nossa equipe antes da aprovação.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-7">
                <AccordionTrigger className="text-left">
                  Quanto tempo leva para aprovar meu cadastro de motorista?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    O prazo de análise é de até <strong>48 horas úteis</strong> após o envio completo da documentação.
                  </p>
                  <p className="mt-2">
                    Você receberá notificação por email e WhatsApp assim que seu cadastro for aprovado ou se houver necessidade de correção em algum documento.
                  </p>
                  <p className="mt-2 text-foreground font-semibold">
                    Dica: Envie fotos nítidas e legíveis dos documentos para acelerar a aprovação!
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-8">
                <AccordionTrigger className="text-left">
                  Como uma transportadora pode se cadastrar na plataforma?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Transportadoras devem realizar cadastro B2B através do formulário específico:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Dados da empresa (Razão Social, CNPJ, contato comercial)</li>
                    <li>Informações de frota e capacidade operacional</li>
                    <li>Regiões de cobertura (estados/rotas que atende)</li>
                    <li>Tabela de preços ou proposta comercial</li>
                  </ul>
                  <p className="mt-2">
                    Nossa equipe comercial entrará em contato em até 24h para avaliar parceria e condições contratuais.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Seção: Pagamentos e Repasses */}
          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="text-primary">💳</span> Pagamentos e Repasses
            </h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="faq-9">
                <AccordionTrigger className="text-left">
                  Quais formas de pagamento são aceitas?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Aceitamos os principais meios de pagamento:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>PIX:</strong> Aprovação instantânea (recomendado)</li>
                    <li><strong>Cartão de Crédito:</strong> Em até 12x (taxas da operadora aplicam-se)</li>
                    <li><strong>Boleto Bancário:</strong> Aprovação em 1-2 dias úteis</li>
                  </ul>
                  <p className="mt-2">
                    Todos os pagamentos são processados de forma segura através do Stripe.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-10">
                <AccordionTrigger className="text-left">
                  Como funciona o repasse para motoristas?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Utilizamos o modelo de <strong>Pagamento Hold (Custódia)</strong> para segurança de ambas as partes:
                  <ol className="list-decimal pl-6 mt-2 space-y-2">
                    <li><strong>Pagamento:</strong> Embarcador paga o valor total ao contratar o frete</li>
                    <li><strong>Custódia:</strong> LogiMarket retém o valor em segurança</li>
                    <li><strong>Execução:</strong> Motorista realiza coleta e entrega</li>
                    <li><strong>Confirmação:</strong> Embarcador ou sistema confirma entrega realizada</li>
                    <li><strong>Repasse:</strong> Valor é liberado para o motorista descontando apenas a comissão LogiMarket</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-11">
                <AccordionTrigger className="text-left">
                  Quanto tempo leva para receber o pagamento após a entrega?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    O prazo padrão de repasse é de <strong>D+2 (2 dias úteis)</strong> após a confirmação de entrega pelo embarcador.
                  </p>
                  <p className="mt-2">
                    Se houver confirmação automática (sem contestação em 48h), o repasse é processado automaticamente.
                  </p>
                  <p className="mt-2 text-foreground font-semibold">
                    Pagamentos via PIX podem ser recebidos em até 4 horas após liberação!
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-12">
                <AccordionTrigger className="text-left">
                  Qual é a comissão do LogiMarket sobre cada frete?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  A comissão é dinâmica e varia conforme o LogiMind analisa cada rota:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>Mínima:</strong> 5% em rotas de altíssima demanda</li>
                    <li><strong>Padrão:</strong> 10% em rotas equilibradas</li>
                    <li><strong>Otimizada:</strong> 13-18% em rotas de retorno (com subsídio ao motorista)</li>
                  </ul>
                  <p className="mt-2">
                    A comissão exata é sempre exibida de forma transparente antes da contratação, tanto para embarcador quanto para motorista.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Seção: Rastreamento e Entregas */}
          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="text-primary">📍</span> Rastreamento e Entregas
            </h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="faq-13">
                <AccordionTrigger className="text-left">
                  Como faço para rastrear meu frete?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    Após a contratação, você recebe um <strong>Código de Rastreamento</strong> no formato LM-YYYY-MM-XXXX.
                  </p>
                  <p className="mt-2">
                    Use este código na página de Rastreamento ou acesse direto pelo seu Dashboard para acompanhar:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Status atual do pedido</li>
                    <li>Localização em tempo real (quando disponível)</li>
                    <li>Timeline completa de eventos</li>
                    <li>Previsão de entrega atualizada</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-14">
                <AccordionTrigger className="text-left">
                  O que fazer se minha entrega atrasar?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    Nosso sistema identifica automaticamente atrasos e você recebe notificação quando o prazo está próximo do vencimento.
                  </p>
                  <p className="mt-2">
                    No painel de Rastreamento, você pode:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Ver eventos críticos destacados em laranja</li>
                    <li>Abrir uma Ocorrência diretamente pelo sistema</li>
                    <li>Contatar o suporte LogiMarket para intermediação</li>
                  </ul>
                  <p className="mt-2 text-foreground font-semibold">
                    Seu pagamento só é liberado ao motorista após confirmação de entrega!
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-15">
                <AccordionTrigger className="text-left">
                  Como confirmo o recebimento da carga?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    Você tem duas opções para confirmar a entrega:
                  </p>
                  <ol className="list-decimal pl-6 mt-2 space-y-2">
                    <li><strong>Confirmação Manual:</strong> Acesse o pedido no Dashboard e clique em "Confirmar Entrega Realizada"</li>
                    <li><strong>Confirmação Automática:</strong> Se não houver contestação em 48h após o motorista registrar entrega, o sistema confirma automaticamente</li>
                  </ol>
                  <p className="mt-2">
                    Após confirmação, o repasse ao motorista é processado conforme prazo D+2.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Seção: Suporte e Segurança */}
          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="text-primary">🛡️</span> Suporte e Segurança
            </h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="faq-16">
                <AccordionTrigger className="text-left">
                  Meus dados estão seguros no LogiMarket?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    Sim! Levamos segurança muito a sério:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Criptografia SSL/TLS em todas as comunicações</li>
                    <li>Dados sensíveis armazenados com criptografia</li>
                    <li>Row Level Security (RLS) no banco de dados</li>
                    <li>Conformidade com LGPD (Lei Geral de Proteção de Dados)</li>
                    <li>Auditoria completa de todas as ações críticas</li>
                    <li>Pagamentos processados via Stripe (PCI-DSS compliant)</li>
                  </ul>
                  <p className="mt-2">
                    Você pode solicitar exclusão completa de seus dados a qualquer momento através do seu perfil.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-17">
                <AccordionTrigger className="text-left">
                  Como entro em contato com o suporte?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    Nossa equipe está disponível para ajudar:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>Email:</strong> suporte@logimarket.com.br</li>
                    <li><strong>WhatsApp:</strong> (11) 91234-5678</li>
                    <li><strong>Horário:</strong> Segunda a Sexta, 8h às 18h</li>
                  </ul>
                  <p className="mt-2">
                    Para questões urgentes de entrega, abra uma Ocorrência diretamente no painel de Rastreamento para priorização imediata.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-18">
                <AccordionTrigger className="text-left">
                  Posso cancelar um frete após a contratação?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    O cancelamento depende do status atual do frete:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>Antes da Coleta:</strong> Cancelamento gratuito em até 2h após contratação. Após esse prazo, taxa de 10% sobre o valor.</li>
                    <li><strong>Após Coleta Realizada:</strong> Não é possível cancelar, apenas solicitar devolução da carga (custo adicional aplica-se).</li>
                  </ul>
                  <p className="mt-2">
                    Entre em contato com o suporte para solicitar qualquer cancelamento ou alteração.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

        </div>

        {/* CTA Final */}
        <div className="max-w-4xl mx-auto mt-12 text-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl p-8 border-2 border-primary/20">
          <h3 className="text-2xl font-bold mb-2">Não encontrou sua resposta?</h3>
          <p className="text-muted-foreground mb-6">
            Nossa equipe está pronta para ajudar você
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:suporte@logimarket.com.br"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Falar com Suporte
            </a>
            <a 
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-card text-foreground font-semibold rounded-lg border-2 border-border hover:bg-muted transition-colors"
            >
              Voltar para Home
            </a>
          </div>
        </div>
      </div>

      <Footer />
      </div>
    </>
  );
};

export default FAQ;
