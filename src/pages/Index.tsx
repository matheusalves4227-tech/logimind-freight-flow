import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const Index = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "LogiMarket",
    "description": "Marketplace Logístico Inteligente com Precificação Dinâmica",
    "url": "https://logimarket.com.br",
    "logo": "https://logimarket.com.br/logo.png",
    "foundingDate": "2024",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "BR"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "contato@logimarket.com.br",
      "availableLanguage": "Portuguese"
    }
  };

  return (
    <>
      <Helmet>
        <title>LogiMarket - Marketplace Logístico Inteligente</title>
        <meta name="description" content="Compare preços, prazos e qualidade de múltiplas transportadoras. Cotação instantânea e precificação inteligente com LogiMind." />
        <link rel="canonical" href="https://logimarket.com.br/" />
        <meta property="og:url" content="https://logimarket.com.br/" />
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
        <Footer />
      </div>
    </>
  );
};

export default Index;
