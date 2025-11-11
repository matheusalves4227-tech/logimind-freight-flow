import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const requestData = await req.json();
    console.log('[Create Order] Request data:', requestData);

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

    // Validar campos obrigatórios
    if (!carrier_name || !service_type || !origin_cep || !destination_cep || !final_price) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
