import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// LogiMind Constants
const COMISSAO_PADRAO = 0.10; // 10%
const LIMITE_MAXIMO_AJUSTE = 0.08; // 8%
const LIMITE_MAXIMO_COMISSAO = 0.18; // 18%

interface QuoteRequest {
  origin_cep: string;
  destination_cep: string;
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

/**
 * Aplica a lógica LogiMind para ajustar a comissão e calcular o preço final.
 */
function aplicarLogiMind(
  cotacoesBrutas: CarrierQuote[], 
  routeAdjustmentFactor: number
): any[] {
  console.log(`Applying LogiMind with route adjustment factor: ${routeAdjustmentFactor}`);
  
  return cotacoesBrutas.map(cota => {
    const precoBaseFrete = cota.base_price;
    
    // 1. Calcular o Ajuste de Comissão baseado na Rota
    const ajusteProporcional = routeAdjustmentFactor * LIMITE_MAXIMO_AJUSTE;
    
    // 2. Calcular a Nova Comissão (Comissão Padrão + Ajuste)
    let novaComissao = COMISSAO_PADRAO + ajusteProporcional;
    
    // 3. Aplicar Limite Máximo (Garantindo que não ultrapasse 18%)
    let comissaoFinal = Math.min(novaComissao, LIMITE_MAXIMO_COMISSAO);
    comissaoFinal = parseFloat(comissaoFinal.toFixed(4));
    
    // 4. Calcular o Preço Final para o Embarcador
    const precoFinal = Math.round((precoBaseFrete * (1 + comissaoFinal)) * 100) / 100;
    
    console.log(`Carrier ${cota.carrier_name}: Base=${precoBaseFrete}, Commission=${comissaoFinal}, Final=${precoFinal}`);
    
    // 5. Retornar a Cotação Final com os novos dados
    return {
      carrier_id: cota.carrier_id,
      carrier_name: cota.carrier_name,
      carrier_size: cota.carrier_size,
      specialties: cota.specialties,
      base_price: precoBaseFrete,
      commission_applied: comissaoFinal,
      final_price: precoFinal,
      delivery_days: cota.delivery_days,
      quality_index: cota.quality_index,
      route_adjustment_factor: routeAdjustmentFactor,
    };
  });
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
      base_price: Math.round(basePrice * 100) / 100,
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

    // 4. Apply LogiMind pricing intelligence
    const cotacoesProcessadas = aplicarLogiMind(cotacoesBrutas, routeAdjustmentFactor);

    // 5. Create quote record
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

    // 6. Insert quote items
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

    // 7. Return processed quotes with quote ID
    return new Response(
      JSON.stringify({
        quote_id: quote.id,
        quotes: cotacoesProcessadas,
        route_type: routeAdjustmentFactor > 0.5 ? 'return' : routeAdjustmentFactor > 0 ? 'competitive' : 'standard',
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
