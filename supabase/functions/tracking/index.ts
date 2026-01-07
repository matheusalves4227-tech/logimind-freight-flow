import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de códigos de eventos internos para descrições amigáveis
const EVENT_MAPPING = {
  // Eventos de coleta
  'ORDER_CREATED': {
    code: 'ORDER_CREATED',
    description: 'Pedido criado e aguardando confirmação',
    isCritical: false
  },
  'ORDER_CONFIRMED': {
    code: 'ORDER_CONFIRMED',
    description: 'Pedido confirmado pela transportadora',
    isCritical: false
  },
  'PICKUP_SCHEDULED': {
    code: 'PICKUP_SCHEDULED',
    description: 'Coleta agendada',
    isCritical: false
  },
  'PICKED_UP': {
    code: 'PICKED_UP',
    description: 'Carga coletada no endereço de origem',
    isCritical: false
  },
  
  // Eventos de trânsito
  'IN_TRANSIT': {
    code: 'IN_TRANSIT',
    description: 'Carga em trânsito para o destino',
    isCritical: false
  },
  'AT_SORTING_CENTER': {
    code: 'AT_SORTING_CENTER',
    description: 'Carga chegou ao centro de distribuição',
    isCritical: false
  },
  'DEPARTED_SORTING_CENTER': {
    code: 'DEPARTED_SORTING_CENTER',
    description: 'Carga saiu do centro de distribuição',
    isCritical: false
  },
  'OUT_FOR_DELIVERY': {
    code: 'OUT_FOR_DELIVERY',
    description: 'O produto saiu para entrega final no endereço de destino',
    isCritical: false
  },
  
  // Eventos de entrega
  'DELIVERED': {
    code: 'DELIVERED',
    description: 'Carga entregue com sucesso ao destinatário',
    isCritical: false
  },
  
  // Eventos de exceção/críticos
  'RECIPIENT_ABSENT': {
    code: 'RECIPIENT_ABSENT',
    description: 'Destinatário ausente - Nova tentativa de entrega será agendada',
    isCritical: true
  },
  'DELIVERY_FAILED': {
    code: 'DELIVERY_FAILED',
    description: 'Falha na entrega - Carga retornará ao remetente',
    isCritical: true
  },
  'DAMAGED': {
    code: 'DAMAGED',
    description: 'Carga avariada durante o transporte',
    isCritical: true
  },
  'DELAYED': {
    code: 'DELAYED',
    description: 'Atraso na entrega - Novo prazo será informado',
    isCritical: true
  },
  'ADDRESS_ISSUE': {
    code: 'ADDRESS_ISSUE',
    description: 'Problema no endereço de entrega - Entre em contato',
    isCritical: true
  },
  'CANCELLED': {
    code: 'CANCELLED',
    description: 'Pedido cancelado',
    isCritical: true
  }
};

// Função para normalizar eventos de fontes externas
function normalizeExternalEvent(rawEvent: any, sourceType: 'ltl' | 'ftl'): any {
  console.log(`[Normalizer] Raw event from ${sourceType}:`, rawEvent);
  
  // Para transportadoras LTL, assumir que vem com formato específico da API da transportadora
  if (sourceType === 'ltl') {
    // Exemplo de mapeamento de códigos de transportadoras
    const carrierCodeMapping: Record<string, string> = {
      'COL': 'PICKED_UP',
      'TRA': 'IN_TRANSIT',
      'CDC': 'AT_SORTING_CENTER',
      'SAI': 'DEPARTED_SORTING_CENTER',
      'ENT': 'OUT_FOR_DELIVERY',
      'FIN': 'DELIVERED',
      'AUS': 'RECIPIENT_ABSENT',
      'FAL': 'DELIVERY_FAILED',
      'AVA': 'DAMAGED',
      'ATR': 'DELAYED'
    };
    
    const mappedCode = carrierCodeMapping[rawEvent.code] || 'IN_TRANSIT';
    const eventTemplate = EVENT_MAPPING[mappedCode as keyof typeof EVENT_MAPPING] || EVENT_MAPPING['IN_TRANSIT'];
    return {
      ...eventTemplate,
      timestamp: rawEvent.timestamp || rawEvent.data_hora,
      city: rawEvent.city || rawEvent.cidade,
      state: rawEvent.state || rawEvent.uf,
      rawData: rawEvent
    };
  }
  
  // Para motoristas autônomos FTL
  if (sourceType === 'ftl') {
    const eventTemplate = EVENT_MAPPING[rawEvent.event_code as keyof typeof EVENT_MAPPING] || EVENT_MAPPING['IN_TRANSIT'];
    return {
      ...eventTemplate,
      timestamp: rawEvent.timestamp,
      city: rawEvent.city,
      state: rawEvent.state,
      rawData: rawEvent
    };
  }
  
  return rawEvent;
}

// Função para chamar API da transportadora (mock para demonstração)
async function fetchCarrierTracking(externalTrackingCode: string, carrierName: string): Promise<any[]> {
  console.log(`[API] Fetching tracking from carrier: ${carrierName}, code: ${externalTrackingCode}`);
  
  // TODO: Implementar integração real com APIs de transportadoras
  // Por enquanto, retornar eventos mock
  return [
    {
      code: 'COL',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      cidade: 'São Paulo',
      uf: 'SP'
    },
    {
      code: 'TRA',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      cidade: 'Campinas',
      uf: 'SP'
    },
    {
      code: 'ENT',
      timestamp: new Date().toISOString(),
      cidade: 'São Paulo',
      uf: 'SP'
    }
  ];
}

// Função para chamar API de motorista autônomo (mock para demonstração)
async function fetchDriverTracking(orderId: string, driverPhone: string): Promise<any> {
  console.log(`[API] Fetching tracking from driver: ${driverPhone}, order: ${orderId}`);
  
  // TODO: Implementar integração real com app de motoristas
  return {
    current_location: {
      lat: -23.5505,
      lng: -46.6333
    },
    last_update: new Date().toISOString(),
    events: [
      {
        event_code: 'PICKED_UP',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        city: 'São Paulo',
        state: 'SP'
      },
      {
        event_code: 'IN_TRANSIT',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        city: 'São Paulo',
        state: 'SP'
      }
    ]
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Cliente com contexto do usuário para leitura
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );
    
    // Cliente admin para inserções em tabelas com RLS restritivo
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
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

    // Extrair tracking_code da URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const trackingCode = pathParts[pathParts.length - 1];

    if (!trackingCode) {
      return new Response(
        JSON.stringify({ error: 'Tracking code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Tracking API] Request for tracking code: ${trackingCode}`);

    // 1. Buscar detalhes do frete no banco de dados
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('tracking_code', trackingCode)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      console.error('[Tracking API] Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Tracking API] Order found: ${order.id}, Service type: ${order.service_type}`);

    // 2. Buscar eventos já armazenados no banco
    const { data: existingEvents, error: eventsError } = await supabaseClient
      .from('tracking_events')
      .select('*')
      .eq('order_id', order.id)
      .order('event_timestamp', { ascending: false });

    if (eventsError) {
      console.error('[Tracking API] Error fetching events:', eventsError);
    }

    let normalizedEvents = [];

    // 3. Chamar API da fonte original e normalizar eventos
    if (order.service_type === 'ltl' && order.external_tracking_code) {
      // Chamar API da transportadora
      const rawEvents = await fetchCarrierTracking(order.external_tracking_code, order.carrier_name);
      normalizedEvents = rawEvents.map(e => normalizeExternalEvent(e, 'ltl'));
      
      console.log(`[Tracking API] Normalized ${normalizedEvents.length} LTL events`);
    } else if (order.service_type === 'ftl' && order.driver_phone) {
      // Chamar API do motorista autônomo
      const driverData = await fetchDriverTracking(order.id, order.driver_phone);
      normalizedEvents = driverData.events.map((e: any) => normalizeExternalEvent(e, 'ftl'));
      
      // Atualizar localização atual do veículo usando cliente admin
      if (driverData.current_location) {
        await supabaseAdmin
          .from('orders')
          .update({
            current_latitude: driverData.current_location.lat,
            current_longitude: driverData.current_location.lng,
            last_location_update: driverData.last_update
          })
          .eq('id', order.id);
      }
      
      console.log(`[Tracking API] Normalized ${normalizedEvents.length} FTL events`);
    }

    // 4. Sincronizar novos eventos com o banco de dados
    // (Aqui poderíamos inserir apenas eventos que ainda não existem)
    const existingEventCodes = new Set(existingEvents?.map(e => e.event_code) || []);
    const newEvents = normalizedEvents.filter((e: any) => !existingEventCodes.has(e.code));
    
    if (newEvents.length > 0) {
      console.log(`[Tracking API] Inserting ${newEvents.length} new events`);
      
      const eventsToInsert = newEvents.map((event: any) => ({
        order_id: order.id,
        event_code: event.code,
        event_description: event.description,
        event_timestamp: event.timestamp,
        city: event.city,
        state: event.state,
        is_critical: event.isCritical,
        raw_data: event.rawData
      }));

      // Usar cliente admin para insert em tracking_events (RLS restritivo)
      await supabaseAdmin
        .from('tracking_events')
        .insert(eventsToInsert);
    }
    // 5. Combinar eventos existentes e novos para resposta final
    const allEvents = [...(existingEvents || []), ...newEvents.map((e: any) => ({
      event_code: e.code,
      event_description: e.description,
      event_timestamp: e.timestamp,
      city: e.city,
      state: e.state,
      is_critical: e.isCritical
    }))].sort((a, b) => 
      new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime()
    );

    // 6. Montar resposta no formato padrão LogiMarket
    const response = {
      id_rastreio: order.tracking_code,
      status_principal: order.status.toUpperCase(),
      previsao_entrega: order.estimated_delivery,
      transportador_nome: order.carrier_name,
      tipo_veiculo: order.vehicle_type || 'N/A',
      historico_eventos: allEvents.map(event => ({
        data_hora: event.event_timestamp,
        codigo_evento: event.event_code,
        descricao_amigavel: event.event_description,
        cidade_uf: event.city && event.state ? `${event.city} - ${event.state}` : 'N/A',
        ocorrencia_critica: event.is_critical
      })),
      localizacao_atual: order.current_latitude && order.current_longitude ? {
        lat: parseFloat(order.current_latitude),
        lng: parseFloat(order.current_longitude),
        ultima_atualizacao: order.last_location_update
      } : null
    };

    console.log(`[Tracking API] Returning ${response.historico_eventos.length} events for tracking: ${trackingCode}`);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[Tracking API] Unexpected error:', error);
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
