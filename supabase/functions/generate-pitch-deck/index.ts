import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PitchDeckData {
  problema: {
    pain_points: string[];
    market_size_affected: string;
  };
  solucao: {
    value_propositions: string[];
    diferencial_logimind: string;
  };
  tracao: {
    gmv_total: number;
    clientes_ativos: number;
    transportadoras_parceiras: number;
    fretes_concluidos: number;
    taxa_crescimento_mensal: number;
  };
  mercado: {
    tam: string;
    sam: string;
    som: string;
  };
  unit_economics: {
    ticket_medio_frete: number;
    ltv: number;
    cac: number;
    ltv_cac_ratio: number;
    take_rate_medio: number;
    margem_contribuicao: number;
  };
  roadmap: {
    q1: string[];
    q2: string[];
    q3: string[];
    q4: string[];
  };
  ask: {
    valor_captacao: string;
    valuation_pre_money: string;
    equity_oferecido: string;
    uso_recursos: {
      categoria: string;
      percentual: number;
      valor: string;
    }[];
  };
  team: {
    founders: {
      nome: string;
      cargo: string;
      experiencia: string;
    }[];
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header from request to preserve user context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Use anon key with user's JWT token to maintain auth context
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    console.log('Fetching pitch deck data...');

    // Buscar KPIs atuais
    const { data: kpisData, error: kpisError } = await supabase.rpc('get_logimarket_kpis_current');
    if (kpisError) throw kpisError;
    const kpis = kpisData?.[0] || {};

    // Buscar contagem de clientes ativos
    const { count: clientesCount, error: clientesError } = await supabase
      .from('orders')
      .select('user_id', { count: 'exact', head: true });
    
    // Buscar transportadoras ativas
    const { count: transportadorasCount, error: transpError } = await supabase
      .from('carriers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Buscar performance para calcular crescimento
    const { data: performanceData, error: perfError } = await supabase.rpc('get_logimarket_performance');
    
    let taxaCrescimento = 0;
    if (performanceData && performanceData.length >= 2) {
      const mesAtual = performanceData[0];
      const mesAnterior = performanceData[1];
      if (mesAnterior?.gmv_vendas_brutas && mesAtual?.gmv_vendas_brutas) {
        taxaCrescimento = ((mesAtual.gmv_vendas_brutas - mesAnterior.gmv_vendas_brutas) / mesAnterior.gmv_vendas_brutas) * 100;
      }
    }

    const pitchDeckData: PitchDeckData = {
      problema: {
        pain_points: [
          "Frete rodoviário representa 65% dos custos logísticos no Brasil",
          "Embarcadores perdem 8-12 horas/semana cotando fretes manualmente",
          "Transportadoras operam com 40% de capacidade ociosa em rotas de retorno",
          "Falta de transparência gera sobrecusto de 15-25% para embarcadores",
          "Ineficiência sistêmica custa R$ 120 bilhões/ano ao setor"
        ],
        market_size_affected: "2M+ empresas embarcadoras no Brasil"
      },
      solucao: {
        value_propositions: [
          "Cotação Instantânea: 3 segundos vs 8 horas do processo manual",
          "Transparência Total: Preço, Prazo e Qualidade lado a lado",
          "Precificação Dinâmica: LogiMind otimiza comissão por rota",
          "Rastreamento Unificado: Um painel para todas as transportadoras",
          "Redução de 20-40% nos custos de frete para embarcadores"
        ],
        diferencial_logimind: "Agente de IA que aplica comissão variável (5%-18%) baseado em liquidez da rota, maximizando margem em rotas de retorno e dominando volume em rotas de alta demanda"
      },
      tracao: {
        gmv_total: kpis.gmv_total || 0,
        clientes_ativos: Math.floor((clientesCount || 0) / 10), // Estimativa baseada em pedidos únicos
        transportadoras_parceiras: transportadorasCount || 0,
        fretes_concluidos: Number(kpis.pedidos_concluidos) || 0,
        taxa_crescimento_mensal: taxaCrescimento
      },
      mercado: {
        tam: "R$ 600 bilhões/ano - Frete rodoviário Brasil",
        sam: "R$ 120 bilhões/ano - PMEs + E-commerce digitalizável",
        som: "R$ 6 bilhões/ano - 5% market share em 5 anos"
      },
      unit_economics: {
        ticket_medio_frete: 2000,
        ltv: 36000,
        cac: 700,
        ltv_cac_ratio: 51.4,
        take_rate_medio: (kpis.margem_media || 10),
        margem_contribuicao: 85
      },
      roadmap: {
        q1: [
          "✅ MVP Funcional - Cotação + Pagamento + Admin",
          "🎯 5-10 Clientes B2B Piloto",
          "🎯 R$ 50-100k GMV mensal",
          "🎯 3-5 Transportadoras Parceiras"
        ],
        q2: [
          "Integração Intelipost (30+ transportadoras)",
          "Lançamento LogiGuard Pro (rastreamento premium)",
          "Expansão Regional: Nordeste",
          "Meta: 30 clientes, R$ 300k GMV/mês"
        ],
        q3: [
          "App Motorista Autônomo (modelo híbrido)",
          "Sistema de Leilão para FTL",
          "Contratos Anuais B2B",
          "Meta: 100 clientes, R$ 1M GMV/mês"
        ],
        q4: [
          "Cobertura Nacional Completa",
          "API Pública para Integrações",
          "LogiMind 3.0 com ML avançado",
          "Meta: 200 clientes, R$ 3M GMV/mês"
        ]
      },
      ask: {
        valor_captacao: "R$ 3-5 milhões",
        valuation_pre_money: "R$ 12-15 milhões",
        equity_oferecido: "20-25%",
        uso_recursos: [
          { categoria: "Sales & Marketing", percentual: 40, valor: "R$ 2M" },
          { categoria: "Tecnologia & Produto", percentual: 30, valor: "R$ 1.5M" },
          { categoria: "Operações & CS", percentual: 20, valor: "R$ 1M" },
          { categoria: "Reserva (18 meses runway)", percentual: 10, valor: "R$ 500k" }
        ]
      },
      team: {
        founders: [
          {
            nome: "Founder Name",
            cargo: "CEO & Co-Founder",
            experiencia: "10+ anos em Logística e Supply Chain. Ex-[Empresa Relevante]"
          },
          {
            nome: "Technical Co-Founder",
            cargo: "CTO & Co-Founder",
            experiencia: "15+ anos desenvolvendo sistemas enterprise. Ex-[Tech Company]"
          }
        ]
      }
    };

    console.log('Pitch deck data generated successfully:', pitchDeckData);

    return new Response(
      JSON.stringify({ success: true, data: pitchDeckData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error generating pitch deck data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
