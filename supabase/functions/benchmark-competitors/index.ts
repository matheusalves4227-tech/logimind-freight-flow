import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COMPETITOR_INFO = `
## Informações Públicas de Concorrentes de Frete no Brasil

### Loggi
- Site: loggi.com
- Foco: entregas expressas e last-mile
- Modelo: B2C e B2B, marketplace de entregadores
- Pricing público: Calculadora disponível em loggi.com/calcular-frete
- Características: entregas no mesmo dia, rastreamento em tempo real

### Mandaê
- Site: mandae.com.br
- Foco: e-commerce, pequenos e médios volumes
- Modelo: agregador de transportadoras
- Pricing público: Simulador disponível em mandae.com.br/simulador
- Características: integração com marketplaces, múltiplas transportadoras

### Melhor Envio
- Site: melhorenvio.com.br
- Foco: e-commerce, integração com Correios e transportadoras
- Modelo: intermediário com descontos por volume
- Pricing público: Calculadora disponível
- Características: etiquetas gratuitas, rastreamento unificado

### Frenet
- Site: frenet.com.br
- Foco: gateway de frete para e-commerce
- Modelo: SaaS de cotação multi-transportadora
- Características: API robusta, integração com plataformas

### Jadlog
- Site: jadlog.com.br
- Foco: encomendas e cargas fracionadas
- Modelo: transportadora tradicional
- Pricing: tabela por peso e região

### Correios (SEDEX/PAC)
- Site: correios.com.br
- Foco: encomendas de qualquer tamanho
- Modelo: estatal com tabela pública
- Pricing: baseado em peso, dimensões e CEPs
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { origin_cep, destination_cep, weight_kg, cargo_value } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`[Benchmark] Analisando concorrentes para ${origin_cep} → ${destination_cep}, ${weight_kg}kg, R$ ${cargo_value}`);

    const prompt = `
Você é um analista de mercado de logística no Brasil. Baseado nas informações dos concorrentes abaixo e seu conhecimento sobre o mercado de fretes brasileiro, estime os preços que cada concorrente cobraria para este frete:

**Dados do Frete:**
- CEP Origem: ${origin_cep}
- CEP Destino: ${destination_cep}
- Peso: ${weight_kg} kg
- Valor da Carga: R$ ${cargo_value}

${COMPETITOR_INFO}

**Instruções:**
1. Analise cada concorrente e estime o preço que cobrariam
2. Considere:
   - Distância aproximada entre os CEPs
   - Modelo de negócio de cada empresa
   - Tipo de serviço (expresso, econômico, etc.)
   - Taxas típicas do mercado brasileiro

3. Retorne uma análise estruturada com:
   - Nome do concorrente
   - Preço estimado mínimo e máximo
   - Prazo de entrega estimado
   - Tipo de serviço
   - Observações relevantes

4. Ao final, dê recomendações estratégicas para o LogiMarket se posicionar competitivamente.

**Importante:** Estas são ESTIMATIVAS baseadas em conhecimento de mercado, não cotações reais.
`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em logística e análise de mercado no Brasil. Forneça estimativas realistas e bem fundamentadas baseadas em seu conhecimento do mercado de fretes.' 
          },
          { role: 'user', content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "benchmark_analysis",
              description: "Retorna análise de benchmark estruturada dos concorrentes",
              parameters: {
                type: "object",
                properties: {
                  competitors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nome do concorrente" },
                        price_min: { type: "number", description: "Preço mínimo estimado em reais" },
                        price_max: { type: "number", description: "Preço máximo estimado em reais" },
                        delivery_days_min: { type: "number", description: "Prazo mínimo em dias" },
                        delivery_days_max: { type: "number", description: "Prazo máximo em dias" },
                        service_type: { type: "string", description: "Tipo de serviço (expresso, econômico, etc.)" },
                        notes: { type: "string", description: "Observações relevantes" }
                      },
                      required: ["name", "price_min", "price_max", "delivery_days_min", "delivery_days_max", "service_type"]
                    }
                  },
                  market_average: {
                    type: "object",
                    properties: {
                      price_min: { type: "number" },
                      price_max: { type: "number" },
                      delivery_days: { type: "number" }
                    },
                    required: ["price_min", "price_max", "delivery_days"]
                  },
                  strategic_recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "Recomendações estratégicas para posicionamento competitivo"
                  },
                  analysis_date: { type: "string", description: "Data da análise no formato ISO" }
                },
                required: ["competitors", "market_average", "strategic_recommendations", "analysis_date"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "benchmark_analysis" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Benchmark] AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Benchmark] AI response received');

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let benchmarkData;

    if (toolCall?.function?.arguments) {
      try {
        benchmarkData = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error('[Benchmark] Failed to parse tool response:', e);
        benchmarkData = null;
      }
    }

    // Fallback to text response if tool call failed
    if (!benchmarkData) {
      const textContent = data.choices?.[0]?.message?.content;
      benchmarkData = {
        raw_analysis: textContent,
        competitors: [],
        market_average: { price_min: 0, price_max: 0, delivery_days: 0 },
        strategic_recommendations: ['Análise em texto disponível acima'],
        analysis_date: new Date().toISOString()
      };
    }

    // Add metadata
    benchmarkData.query = {
      origin_cep,
      destination_cep,
      weight_kg,
      cargo_value
    };
    benchmarkData.disclaimer = "Estas são ESTIMATIVAS baseadas em conhecimento de mercado, não cotações reais. Para preços exatos, consulte diretamente os sites dos concorrentes.";

    console.log(`[Benchmark] Análise concluída com ${benchmarkData.competitors?.length || 0} concorrentes`);

    return new Response(
      JSON.stringify({ success: true, data: benchmarkData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Benchmark] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
