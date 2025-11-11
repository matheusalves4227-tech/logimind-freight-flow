import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod Schema for Create Order Request Validation
const CreateOrderSchema = z.object({
  quote_id: z.string().uuid().optional(),
  carrier_id: z.string().uuid().optional(),
  carrier_name: z.string().min(1).max(200),
  service_type: z.enum(['ltl', 'ftl']),
  vehicle_type: z.string().max(50).optional(),
  origin_cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  origin_address: z.string().max(500).optional(),
  destination_cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  destination_address: z.string().max(500).optional(),
  weight_kg: z.number().positive().max(50000).optional(),
  height_cm: z.number().positive().max(1000).optional(),
  width_cm: z.number().positive().max(1000).optional(),
  length_cm: z.number().positive().max(2000).optional(),
  base_price: z.number().nonnegative().max(1000000),
  commission_applied: z.number().nonnegative().max(1),
  final_price: z.number().positive().max(1000000),
  delivery_days: z.number().int().positive().max(365).optional(),
  external_tracking_code: z.string().max(100).optional(),
  driver_name: z.string().max(200).optional(),
  driver_phone: z.string().max(20).optional(),
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
      driver_phone
    } = requestData;

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
        origin_cep,
        origin_address: origin_address || `CEP ${origin_cep}`,
        destination_cep,
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
        driver_phone
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
      // Não retornar erro, pois o pedido foi criado com sucesso
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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
