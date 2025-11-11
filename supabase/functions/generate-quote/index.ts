import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// LogiMind Constants - Subsídio de Rotas de Retorno
const COMISSAO_PADRAO = 0.10; // 10% - Comissão Padrão da Plataforma
const SUBSIDIO_MAXIMO_PERMITIDO = 0.50; // 50% - Máximo de subsídio sobre a comissão padrão
const COMISSAO_MINIMA = 0.05; // 5% - Comissão mínima da plataforma

// LogiMind 2.0 - Regra de Competição (mantida)
const TOLERANCIA_PRECO = 1.03; // 3% acima do preço de mercado

interface QuoteRequest {
  service_type: string;
  vehicle_type?: string; // Para FTL: "moto", "carro", "picape", "caminhao_toco", "caminhao_truck"
  origin_cep: string;
  origin_number: string;
  origin_type: string;
  destination_cep: string;
  destination_number: string;
  destination_type: string;
  weight_kg: number;
  height_cm?: number;
  width_cm?: number;
  length_cm?: number;
}

interface CarrierQuote {
  carrier_id: string;
  carrier_name: string;
  carrier_size?: string;
  specialties?: string[];
  base_price: number;
  delivery_days: number;
  quality_index: number;
}

interface ProcessedQuote {
  carrier_id: string;
  carrier_name: string;
  carrier_size?: string;
  specialties?: string[];
  base_price: number;
  commission_applied: number;
  final_price: number;
  delivery_days: number;
  quality_index: number;
  route_adjustment_factor: number;
  adjustment_reason?: string;
}

/**
 * Busca o preço de mercado de referência para a rota
 * Mock: retorna 90% do menor preço base das transportadoras
 */
function buscarPrecoMercadoReferencia(cotacoesBrutas: CarrierQuote[]): number {
  const menorPrecoBase = Math.min(...cotacoesBrutas.map(c => c.base_price));
  // Simula um preço de mercado competitivo (90% do menor preço)
  const precoMercado = menorPrecoBase * 0.90;
  console.log(`Market reference price: ${precoMercado} (based on lowest base: ${menorPrecoBase})`);
  return precoMercado;
}

/**
 * LogiMind 1.0 - Subsídio de Rotas de Retorno
 * Reduz a comissão da plataforma para aumentar o valor repassado ao transportador
 * em rotas de baixa ocupação, incentivando aceitação e fidelização.
 */
function aplicarLogiMind(
  cotacoesBrutas: CarrierQuote[], 
  routeAdjustmentFactor: number
): ProcessedQuote[] {
  console.log(`[LogiMind 1.0 - Subsídio] Fator de Atratividade da Rota: ${routeAdjustmentFactor}`);
  
  return cotacoesBrutas.map(cota => {
    const precoBrutoEmbarcador = cota.base_price;
    
    // 1. Valor Monetário da Comissão Padrão (10%)
    const valorComissaoPadrao = precoBrutoEmbarcador * COMISSAO_PADRAO;
    
    // 2. Cálculo do Percentual de Subsídio Efetivo
    // O subsídio é proporcional ao Fator de Atratividade (routeAdjustmentFactor)
    // e limitado ao máximo permitido (50% da comissão padrão)
    const percentualSubsidioEfetivo = routeAdjustmentFactor * SUBSIDIO_MAXIMO_PERMITIDO;
    
    // 3. Valor Monetário do Subsídio LogiMind
    // Este é o valor que a LogiMind renuncia da sua comissão
    const valorSubsidioLogiMind = valorComissaoPadrao * percentualSubsidioEfetivo;
    
    // 4. Nova Comissão para a LogiMind (após subsídio)
    let novaComissaoLogiMind = valorComissaoPadrao - valorSubsidioLogiMind;
    
    // Garantir que não fique abaixo da comissão mínima (5%)
    const comissaoMinimaValor = precoBrutoEmbarcador * COMISSAO_MINIMA;
    novaComissaoLogiMind = Math.max(novaComissaoLogiMind, comissaoMinimaValor);
    
    // 5. Calcular o percentual de comissão final aplicado
    const comissaoFinalPercentual = parseFloat((novaComissaoLogiMind / precoBrutoEmbarcador).toFixed(4));
    
    // 6. Preço Final para o Embarcador (Base + Comissão Final)
    const precoFinalEmbarcador = parseFloat((precoBrutoEmbarcador + novaComissaoLogiMind).toFixed(2));
    
    // 7. Valor que o Transportador receberá (Preço Final - Comissão)
    const valorTransportador = parseFloat((precoFinalEmbarcador - novaComissaoLogiMind).toFixed(2));
    
    console.log(
      `[LogiMind Subsídio] ${cota.carrier_name}: ` +
      `Base=${precoBrutoEmbarcador.toFixed(2)} | ` +
      `Comissão Padrão=${(COMISSAO_PADRAO * 100).toFixed(0)}% (R$ ${valorComissaoPadrao.toFixed(2)}) | ` +
      `Subsídio=${(percentualSubsidioEfetivo * 100).toFixed(1)}% (R$ ${valorSubsidioLogiMind.toFixed(2)}) | ` +
      `Nova Comissão=${(comissaoFinalPercentual * 100).toFixed(1)}% (R$ ${novaComissaoLogiMind.toFixed(2)}) | ` +
      `Preço Final Embarcador=${precoFinalEmbarcador} | ` +
      `Transportador Recebe=${valorTransportador}`
    );
    
    // 8. Retornar a Cotação com Subsídio Aplicado
    return {
      carrier_id: cota.carrier_id,
      carrier_name: cota.carrier_name,
      carrier_size: cota.carrier_size,
      specialties: cota.specialties,
      base_price: precoBrutoEmbarcador,
      commission_applied: comissaoFinalPercentual,
      final_price: precoFinalEmbarcador,
      delivery_days: cota.delivery_days,
      quality_index: cota.quality_index,
      route_adjustment_factor: routeAdjustmentFactor,
      adjustment_reason: routeAdjustmentFactor > 0 ? 'SUBSIDIZED_ROUTE' : 'STANDARD',
    };
  });
}

/**
 * LogiMind 2.0 - Aplica regra de competição
 * Reduz comissão se o preço estiver acima do mercado
 */
function aplicarRegraCompeticao(
  cotasAjustadas: ProcessedQuote[],
  precoMercadoReferencia: number
): ProcessedQuote[] {
  console.log(`[LogiMind 2.0] Applying competition rule with market reference: ${precoMercadoReferencia}`);
  
  return cotasAjustadas.map(cota => {
    const precoFinalAtual = cota.final_price;
    const precoBase = cota.base_price;
    const comissaoAnterior = cota.commission_applied;
    
    // 1. Calcular o Preço Máximo Competitivo
    const precoCompetitivoMax = Math.round(precoMercadoReferencia * TOLERANCIA_PRECO * 100) / 100;
    
    // 2. Verificar se está acima do limite competitivo
    if (precoFinalAtual > precoCompetitivoMax) {
      // A. Calcular a comissão necessária para atingir o preço competitivo
      const comissaoNecessaria = (precoCompetitivoMax / precoBase) - 1;
      
      // B. Aplicar o piso mínimo de 5%
      const novaComissao = Math.max(comissaoNecessaria, COMISSAO_MINIMA);
      const novaComissaoFormatada = parseFloat(novaComissao.toFixed(4));
      
      // C. Recalcular o preço final (Garantindo 2 casas decimais)
      const novoPrecoFinal = parseFloat((precoBase * (1 + novaComissaoFormatada)).toFixed(2));
      
      console.log(
        `[LogiMind 2.0] ${cota.carrier_name}: ` +
        `Price ${precoFinalAtual} > ${precoCompetitivoMax} (competitive max). ` +
        `Reducing commission ${(comissaoAnterior * 100).toFixed(1)}% → ${(novaComissaoFormatada * 100).toFixed(1)}%, ` +
        `New price: ${novoPrecoFinal}`
      );
      
      return {
        ...cota,
        commission_applied: novaComissaoFormatada,
        final_price: novoPrecoFinal,
        adjustment_reason: 'COMPETITION',
      };
    }
    
    // Já está competitivo, mantém os valores da regra de rotas
    console.log(`[LogiMind 2.0] ${cota.carrier_name}: Price ${precoFinalAtual} is competitive (max: ${precoCompetitivoMax})`);
    return cota;
  });
}

/**
 * Verifica se um CEP está em área de difícil acesso ou com restrição
 */
function verificarAreaRestrita(cep: string): boolean {
  const cleanCep = cep.replace(/\D/g, "");
  
  // Mock de áreas restritas (primeiros 5 dígitos)
  const areasRestritas = [
    "01000", // Centro SP - restrição de caminhões
    "20000", // Centro RJ - restrição de horário
    "30100", // Centro BH - área de difícil acesso
    "40000", // Centro Salvador - restrição de circulação
  ];
  
  const prefix = cleanCep.substring(0, 5);
  return areasRestritas.includes(prefix);
}

/**
 * Gera cotações mockadas baseadas nos dados das transportadoras
 */
function gerarCotacoesMockadas(carriers: any[], weight_kg: number): CarrierQuote[] {
  // Base price calculation: R$ 0.50 per kg + base fee
  const baseFeePerKg = 0.50;
  const baseOperationalFee = 50;
  
  return carriers.map(carrier => {
    // Add randomness based on quality rating
    const qualityMultiplier = 1 + ((5 - carrier.avg_quality_rating) * 0.05);
    const basePrice = (weight_kg * baseFeePerKg + baseOperationalFee) * qualityMultiplier;
    
    // Delivery days based on quality (better quality = faster)
    const deliveryDays = Math.ceil(5 - (carrier.avg_quality_rating * 0.5));
    
    return {
      carrier_id: carrier.id,
      carrier_name: carrier.name,
      carrier_size: carrier.carrier_size,
      specialties: carrier.specialties,
      base_price: parseFloat(basePrice.toFixed(2)),
      delivery_days: Math.max(2, deliveryDays),
      quality_index: carrier.avg_quality_rating,
    };
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from token
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const quoteRequest: QuoteRequest = await req.json();
    console.log('Quote request:', quoteRequest);

    // Validate input
    if (!quoteRequest.origin_cep || !quoteRequest.destination_cep || !quoteRequest.weight_kg) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log do tipo de serviço e veículo (se FTL)
    console.log(`Service type: ${quoteRequest.service_type || 'ltl'} (LTL=Transportadoras, FTL=Autônomos)`);
    if (quoteRequest.service_type === 'ftl' && quoteRequest.vehicle_type) {
      console.log(`Vehicle type requested: ${quoteRequest.vehicle_type}`);
    }

    // Verificar áreas restritas
    const restrictedOrigin = verificarAreaRestrita(quoteRequest.origin_cep);
    const restrictedDestination = verificarAreaRestrita(quoteRequest.destination_cep);
    
    if (restrictedOrigin || restrictedDestination) {
      console.log(`Restricted areas detected - Origin: ${restrictedOrigin}, Destination: ${restrictedDestination}`);
    }

    // 1. Fetch all active carriers
    const { data: carriers, error: carriersError } = await supabaseClient
      .from('carriers')
      .select('*')
      .eq('is_active', true);

    if (carriersError || !carriers || carriers.length === 0) {
      console.error('Error fetching carriers:', carriersError);
      return new Response(
        JSON.stringify({ error: 'No carriers available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get route adjustment factor (if exists)
    const { data: route } = await supabaseClient
      .from('routes')
      .select('adjustment_factor')
      .eq('origin_cep', quoteRequest.origin_cep)
      .eq('destination_cep', quoteRequest.destination_cep)
      .maybeSingle();

    const routeAdjustmentFactor = route?.adjustment_factor ?? 0;
    console.log(`Route adjustment factor: ${routeAdjustmentFactor}`);

    // 3. Generate mock quotes from carriers
    const cotacoesBrutas = gerarCotacoesMockadas(carriers, quoteRequest.weight_kg);

    // 4. Apply LogiMind 1.0 - Route optimization
    const cotacoesComRotas = aplicarLogiMind(cotacoesBrutas, routeAdjustmentFactor);

    // 5. Get market reference price
    const precoMercadoReferencia = buscarPrecoMercadoReferencia(cotacoesBrutas);

    // 6. Apply LogiMind 2.0 - Competition rule
    const cotacoesProcessadas = aplicarRegraCompeticao(cotacoesComRotas, precoMercadoReferencia);

    // 7. Create quote record
    const { data: quote, error: quoteError } = await supabaseClient
      .from('quotes')
      .insert({
        user_id: user.id,
        origin_cep: quoteRequest.origin_cep,
        destination_cep: quoteRequest.destination_cep,
        weight_kg: quoteRequest.weight_kg,
        height_cm: quoteRequest.height_cm,
        width_cm: quoteRequest.width_cm,
        length_cm: quoteRequest.length_cm,
        status: 'pending',
      })
      .select()
      .single();

    if (quoteError || !quote) {
      console.error('Error creating quote:', quoteError);
      return new Response(
        JSON.stringify({ error: 'Failed to create quote' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Insert quote items
    const quoteItems = cotacoesProcessadas.map(item => ({
      quote_id: quote.id,
      carrier_id: item.carrier_id,
      base_price: item.base_price,
      commission_applied: item.commission_applied,
      final_price: item.final_price,
      delivery_days: item.delivery_days,
      quality_index: item.quality_index,
      route_adjustment_factor: item.route_adjustment_factor,
    }));

    const { error: itemsError } = await supabaseClient
      .from('quote_items')
      .insert(quoteItems);

    if (itemsError) {
      console.error('Error creating quote items:', itemsError);
      // Continue anyway, we have the processed quotes
    }

    // 9. Return processed quotes with quote ID
    return new Response(
      JSON.stringify({
        quote_id: quote.id,
        quotes: cotacoesProcessadas,
        route_type: routeAdjustmentFactor > 0.5 ? 'return' : routeAdjustmentFactor > 0 ? 'competitive' : 'standard',
        restricted_origin: restrictedOrigin,
        restricted_destination: restrictedDestination,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-quote function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
