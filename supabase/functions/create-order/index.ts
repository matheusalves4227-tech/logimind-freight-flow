import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, getRateLimitHeaders, getClientIdentifier } from '../_shared/rateLimit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod Schema for Create Order Request Validation
const CreateOrderSchema = z.object({
  quote_id: z.string().uuid().nullish(),
  carrier_id: z.string().uuid().nullish(),
  carrier_name: z.string().min(1).max(200),
  service_type: z.enum(['ltl', 'ftl']),
  vehicle_type: z.string().max(50).nullish(),
  origin_cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  origin_address: z.string().max(500).nullish(),
  destination_cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  destination_address: z.string().max(500).nullish(),
  weight_kg: z.number().positive().max(50000).nullish(),
  height_cm: z.number().positive().max(1000).nullish(),
  width_cm: z.number().positive().max(1000).nullish(),
  length_cm: z.number().positive().max(2000).nullish(),
  base_price: z.number().nonnegative().max(1000000),
  commission_applied: z.number().nonnegative().max(1),
  final_price: z.number().positive().max(1000000),
  delivery_days: z.number().int().positive().max(365).nullish(),
  external_tracking_code: z.string().max(100).nullish(),
  driver_name: z.string().max(200).nullish(),
  driver_phone: z.string().max(20).nullish(),
  logiguard_pro_contratado: z.boolean().default(false),
  logiguard_pro_valor: z.number().nonnegative().max(100000).nullish(),
  cargo_description: z.string().max(500).nullish(),
  cargo_type: z.string().max(50).nullish(),
  cargo_value: z.number().nonnegative().max(100000000).nullish(),
  pricing_source: z.enum(['real', 'fallback']).nullish(),
});

// Função para gerar tracking code único
function generateTrackingCode(): string {
  const prefix = 'LM';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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

    // Service role client for rate limiting (bypasses RLS)
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit: 5 requests per minute for order creation
    const identifier = getClientIdentifier(req, user.id);
    const rateLimitResult = await checkRateLimit(
      supabaseServiceClient,
      identifier,
      {
        endpoint: 'create-order',
        limit: 5,
        windowMinutes: 1
      }
    );

    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.allowed) {
      console.warn('[Create Order] Rate limit exceeded for:', identifier);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000)
        }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders, 
            ...rateLimitHeaders,
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000).toString()
          } 
        }
      );
    }

    const requestBody = await req.json();
    console.log('[Create Order] Request received:', requestBody);

    // Validate input with Zod
    const validation = CreateOrderSchema.safeParse(requestBody);
    if (!validation.success) {
      console.error('[Create Order] Validation failed:', validation.error.flatten());
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validation.error.flatten().fieldErrors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData = validation.data;
    const {
      quote_id,
      carrier_id,
      carrier_name,
      service_type,
      vehicle_type,
      origin_cep,
      origin_address,
      destination_cep,
      destination_address,
      weight_kg,
      height_cm,
      width_cm,
      length_cm,
      base_price,
      commission_applied,
      final_price,
      delivery_days,
      external_tracking_code,
      driver_name,
      driver_phone,
      logiguard_pro_contratado,
      logiguard_pro_valor,
      cargo_description,
      cargo_type,
      cargo_value,
      pricing_source
    } = requestData;

    // Aviso operacional quando a cotação foi gerada com preço de fallback
    // (não havia transportadora real cadastrada para a rota/peso)
    const fallbackWarning = pricing_source === 'fallback'
      ? '⚠️ ATENÇÃO: Cotação gerada com preço de FALLBACK (sem transportadora cadastrada para esta rota). Validar valor e atribuir transportadora manualmente antes de confirmar.'
      : null;

    // Normalizar CEPs (remover hífen para compatibilidade com constraint do banco)
    const normalizedOriginCep = origin_cep.replace(/[^0-9]/g, '');
    const normalizedDestinationCep = destination_cep.replace(/[^0-9]/g, '');

    // Gerar tracking code único
    const trackingCode = generateTrackingCode();
    console.log('[Create Order] Generated tracking code:', trackingCode);

    // Calcular data estimada de entrega
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + (delivery_days || 5));

    // Inserir pedido
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        tracking_code: trackingCode,
        user_id: user.id,
        quote_id,
        carrier_id,
        service_type,
        vehicle_type,
        origin_cep: normalizedOriginCep,
        origin_address: origin_address || `CEP ${origin_cep}`,
        destination_cep: normalizedDestinationCep,
        destination_address: destination_address || `CEP ${destination_cep}`,
        weight_kg,
        height_cm,
        width_cm,
        length_cm,
        base_price,
        commission_applied,
        final_price,
        status: 'confirmed',
        estimated_delivery: estimatedDelivery.toISOString(),
        external_tracking_code,
        carrier_name,
        driver_name,
        driver_phone,
        logiguard_pro_contratado: logiguard_pro_contratado || false,
        logiguard_pro_valor: logiguard_pro_contratado ? logiguard_pro_valor : null,
        cargo_description: cargo_description || null,
        cargo_type: cargo_type || null,
        cargo_value: cargo_value ?? null,
        operational_notes: fallbackWarning
      })
      .select()
      .single();

    if (orderError) {
      console.error('[Create Order] Error inserting order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order', details: orderError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Create Order] Order created successfully:', order.id);

    // Criar evento inicial de rastreamento
    const { error: eventError } = await supabaseClient
      .from('tracking_events')
      .insert({
        order_id: order.id,
        event_code: 'ORDER_CONFIRMED',
        event_description: 'Pedido confirmado pela transportadora',
        event_timestamp: new Date().toISOString(),
        city: 'São Paulo',
        state: 'SP',
        is_critical: false
      });

    if (eventError) {
      console.error('[Create Order] Error creating initial event:', eventError);
    }

    // Notificar admin por email sobre novo pedido (fire-and-forget)
    try {
      const supabaseServiceClient2 = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await supabaseServiceClient2.functions.invoke('notify-admin-new-order', {
        body: { orderId: order.id }
      });
      console.log('[Create Order] Admin notification sent');
    } catch (notifyError) {
      console.error('[Create Order] Failed to notify admin (non-blocking):', notifyError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        tracking_code: trackingCode,
        message: 'Frete contratado com sucesso!'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[Create Order] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
