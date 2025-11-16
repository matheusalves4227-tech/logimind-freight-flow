import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SimulateTrackingRequest {
  order_id: string;
  type: 'location' | 'event';
  // Para atualização de localização
  latitude?: number;
  longitude?: number;
  // Para novo evento
  event_code?: string;
  event_description?: string;
  city?: string;
  state?: string;
  is_critical?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Autenticação necessária');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Não autenticado');
    }

    // Verificar se é admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!userRole) {
      throw new Error('Apenas administradores podem simular atualizações de tracking');
    }

    const body: SimulateTrackingRequest = await req.json();
    const { order_id, type } = body;

    if (!order_id || !type) {
      throw new Error('order_id e type são obrigatórios');
    }

    // Verificar se o pedido existe
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, tracking_code, status')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error('Pedido não encontrado');
    }

    let result;

    if (type === 'location') {
      // Atualizar localização
      const { latitude, longitude } = body;
      
      if (latitude === undefined || longitude === undefined) {
        throw new Error('latitude e longitude são obrigatórios para atualização de localização');
      }

      const { data, error } = await supabase
        .from('orders')
        .update({
          current_latitude: latitude,
          current_longitude: longitude,
          last_location_update: new Date().toISOString()
        })
        .eq('id', order_id)
        .select()
        .single();

      if (error) throw error;
      
      console.log('📍 Localização atualizada:', { order_id, latitude, longitude });
      result = { 
        message: 'Localização atualizada com sucesso', 
        location: {
          latitude,
          longitude,
          updated_at: data.last_location_update
        }
      };

    } else if (type === 'event') {
      // Criar novo evento de tracking
      const { event_code, event_description, city, state, is_critical } = body;
      
      if (!event_code || !event_description) {
        throw new Error('event_code e event_description são obrigatórios para novo evento');
      }

      const { data, error } = await supabase
        .from('tracking_events')
        .insert({
          order_id,
          event_code,
          event_description,
          event_timestamp: new Date().toISOString(),
          city: city || null,
          state: state || null,
          is_critical: is_critical || false
        })
        .select()
        .single();

      if (error) throw error;

      console.log('📍 Evento criado:', { order_id, event_code, event_description });
      result = { 
        message: 'Evento criado com sucesso', 
        event: data
      };
    } else {
      throw new Error('Tipo inválido. Use "location" ou "event"');
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro ao simular atualização:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao simular atualização de tracking';
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
