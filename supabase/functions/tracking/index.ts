import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Regex para detectar código de rastreamento dos Correios (ex: AB123456789BR)
const CORREIOS_CODE_REGEX = /^[A-Z]{2}\d{9}[A-Z]{2}$/;

// Mapeamento de status do SeuRastreio para eventos internos LogiMarket
const SEURASTREIO_STATUS_MAP: Record<string, string> = {
  'Objeto postado': 'PICKED_UP',
  'Objeto em trânsito': 'IN_TRANSIT',
  'Objeto encaminhado': 'IN_TRANSIT',
  'Objeto recebido na unidade de exportação': 'AT_SORTING_CENTER',
  'Objeto recebido pelos Correios do Brasil': 'AT_SORTING_CENTER',
  'Objeto encaminhado para': 'DEPARTED_SORTING_CENTER',
  'Objeto saiu para entrega ao destinatário': 'OUT_FOR_DELIVERY',
  'Objeto entregue ao destinatário': 'DELIVERED',
  'A entrega não pode ser efetuada': 'DELIVERY_FAILED',
  'Destinatário ausente': 'RECIPIENT_ABSENT',
  'Objeto aguardando retirada': 'RECIPIENT_ABSENT',
  'Objeto devolvido': 'DELIVERY_FAILED',
  'Atraso na entrega': 'DELAYED',
  'Endereço incorreto': 'ADDRESS_ISSUE',
};

// Mapeamento de códigos de eventos internos para descrições amigáveis
const EVENT_MAPPING: Record<string, { code: string; description: string; isCritical: boolean }> = {
  'ORDER_CREATED': { code: 'ORDER_CREATED', description: 'Pedido criado e aguardando confirmação', isCritical: false },
  'ORDER_CONFIRMED': { code: 'ORDER_CONFIRMED', description: 'Pedido confirmado pela transportadora', isCritical: false },
  'PICKUP_SCHEDULED': { code: 'PICKUP_SCHEDULED', description: 'Coleta agendada', isCritical: false },
  'PICKED_UP': { code: 'PICKED_UP', description: 'Carga coletada no endereço de origem', isCritical: false },
  'IN_TRANSIT': { code: 'IN_TRANSIT', description: 'Carga em trânsito para o destino', isCritical: false },
  'AT_SORTING_CENTER': { code: 'AT_SORTING_CENTER', description: 'Carga chegou ao centro de distribuição', isCritical: false },
  'DEPARTED_SORTING_CENTER': { code: 'DEPARTED_SORTING_CENTER', description: 'Carga saiu do centro de distribuição', isCritical: false },
  'OUT_FOR_DELIVERY': { code: 'OUT_FOR_DELIVERY', description: 'Saiu para entrega final no endereço de destino', isCritical: false },
  'DELIVERED': { code: 'DELIVERED', description: 'Carga entregue com sucesso ao destinatário', isCritical: false },
  'RECIPIENT_ABSENT': { code: 'RECIPIENT_ABSENT', description: 'Destinatário ausente - Nova tentativa será agendada', isCritical: true },
  'DELIVERY_FAILED': { code: 'DELIVERY_FAILED', description: 'Falha na entrega - Carga retornará ao remetente', isCritical: true },
  'DAMAGED': { code: 'DAMAGED', description: 'Carga avariada durante o transporte', isCritical: true },
  'DELAYED': { code: 'DELAYED', description: 'Atraso na entrega - Novo prazo será informado', isCritical: true },
  'ADDRESS_ISSUE': { code: 'ADDRESS_ISSUE', description: 'Problema no endereço de entrega - Entre em contato', isCritical: true },
  'CANCELLED': { code: 'CANCELLED', description: 'Pedido cancelado', isCritical: true },
};

// ============================================================
// Integração REAL com SeuRastreio (Correios + Total Express)
// ============================================================
async function fetchSeuRastreioTracking(trackingCode: string): Promise<any[]> {
  const apiKey = Deno.env.get('SEURASTREIO_API_KEY');
  if (!apiKey) {
    console.error('[SeuRastreio] API key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `https://seurastreio.com.br/api/public/rastreio/${trackingCode}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`[SeuRastreio] API error [${response.status}]: ${await response.text()}`);
      return [];
    }

    const data = await response.json();
    console.log('[SeuRastreio] Raw response:', JSON.stringify(data));

    // Normalizar eventos do SeuRastreio para formato interno
    const events = data.eventos || data.events || [];
    return events.map((evt: any) => {
      const statusText = evt.status || evt.descricao || '';
      const mappedCode = mapSeuRastreioStatus(statusText);
      const template = EVENT_MAPPING[mappedCode] || EVENT_MAPPING['IN_TRANSIT'];

      // Extrair cidade/UF do campo local
      const location = evt.local || evt.unidade || '';
      const { city, state } = parseLocation(location);

      return {
        code: template.code,
        description: evt.descricao || evt.status || template.description,
        isCritical: template.isCritical,
        timestamp: evt.data ? parseCorreiosDate(evt.data, evt.hora) : new Date().toISOString(),
        city,
        state,
        rawData: evt,
      };
    });
  } catch (error) {
    console.error('[SeuRastreio] Fetch error:', error);
    return [];
  }
}

function mapSeuRastreioStatus(statusText: string): string {
  // Procurar match parcial nas chaves do mapa
  for (const [key, value] of Object.entries(SEURASTREIO_STATUS_MAP)) {
    if (statusText.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return 'IN_TRANSIT';
}

function parseLocation(location: string): { city: string; state: string } {
  if (!location) return { city: '', state: '' };
  // Formato típico: "CURITIBA / PR" ou "Unidade de Tratamento - CURITIBA / PR"
  const match = location.match(/([A-ZÀ-Ú\s]+)\s*\/\s*([A-Z]{2})/i);
  if (match) {
    return { city: match[1].trim(), state: match[2].trim().toUpperCase() };
  }
  return { city: location, state: '' };
}

function parseCorreiosDate(dateStr: string, timeStr?: string): string {
  // Formato: "dd/mm/yyyy" + "hh:mm"
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const time = timeStr || '00:00';
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${time}:00-03:00`).toISOString();
  }
  return new Date(dateStr).toISOString();
}

// ============================================================
// Normalização de eventos de fontes externas (FTL / transportadoras)
// ============================================================
function normalizeExternalEvent(rawEvent: any, sourceType: 'ltl' | 'ftl'): any {
  if (sourceType === 'ltl') {
    const carrierCodeMapping: Record<string, string> = {
      'COL': 'PICKED_UP', 'TRA': 'IN_TRANSIT', 'CDC': 'AT_SORTING_CENTER',
      'SAI': 'DEPARTED_SORTING_CENTER', 'ENT': 'OUT_FOR_DELIVERY',
      'FIN': 'DELIVERED', 'AUS': 'RECIPIENT_ABSENT', 'FAL': 'DELIVERY_FAILED',
      'AVA': 'DAMAGED', 'ATR': 'DELAYED',
    };
    const mappedCode = carrierCodeMapping[rawEvent.code] || 'IN_TRANSIT';
    const eventTemplate = EVENT_MAPPING[mappedCode] || EVENT_MAPPING['IN_TRANSIT'];
    return {
      ...eventTemplate,
      timestamp: rawEvent.timestamp || rawEvent.data_hora,
      city: rawEvent.city || rawEvent.cidade,
      state: rawEvent.state || rawEvent.uf,
      rawData: rawEvent,
    };
  }

  if (sourceType === 'ftl') {
    const eventTemplate = EVENT_MAPPING[rawEvent.event_code as string] || EVENT_MAPPING['IN_TRANSIT'];
    return {
      ...eventTemplate,
      timestamp: rawEvent.timestamp,
      city: rawEvent.city,
      state: rawEvent.state,
      rawData: rawEvent,
    };
  }

  return rawEvent;
}

// Fetch driver tracking (placeholder para app de motoristas)
async function fetchDriverTracking(orderId: string, driverPhone: string): Promise<any> {
  console.log(`[API] Fetching tracking from driver: ${driverPhone}, order: ${orderId}`);
  return {
    current_location: { lat: -23.5505, lng: -46.6333 },
    last_update: new Date().toISOString(),
    events: [
      { event_code: 'PICKED_UP', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), city: 'São Paulo', state: 'SP' },
      { event_code: 'IN_TRANSIT', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), city: 'São Paulo', state: 'SP' },
    ],
  };
}

// ============================================================
// Handler principal
// ============================================================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Validar autenticação
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Extrair tracking_code
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const trackingCode = pathParts[pathParts.length - 1];

    if (!trackingCode) {
      return new Response(JSON.stringify({ error: 'Tracking code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[Tracking API] Request for: ${trackingCode}`);

    // 1. Buscar pedido
    const { data: order, error: orderError } = await supabaseClient
      .from('orders').select('*')
      .eq('tracking_code', trackingCode).eq('user_id', user.id).single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Buscar eventos existentes
    const { data: existingEvents } = await supabaseClient
      .from('tracking_events').select('*')
      .eq('order_id', order.id).order('event_timestamp', { ascending: false });

    let normalizedEvents: any[] = [];

    // 3. Determinar fonte de rastreamento e buscar eventos reais
    const externalCode = order.external_tracking_code || trackingCode;
    const isCorreiosCode = CORREIOS_CODE_REGEX.test(externalCode);

    if (isCorreiosCode) {
      // ✅ API REAL — SeuRastreio (Correios + Total Express)
      console.log(`[Tracking API] Using SeuRastreio API for Correios code: ${externalCode}`);
      normalizedEvents = await fetchSeuRastreioTracking(externalCode);
    } else if (order.service_type === 'ftl' && order.driver_phone) {
      // Motorista autônomo FTL
      const driverData = await fetchDriverTracking(order.id, order.driver_phone);
      normalizedEvents = driverData.events.map((e: any) => normalizeExternalEvent(e, 'ftl'));

      if (driverData.current_location) {
        await supabaseAdmin.from('orders').update({
          current_latitude: driverData.current_location.lat,
          current_longitude: driverData.current_location.lng,
          last_location_update: driverData.last_update,
        }).eq('id', order.id);
      }
    } else if (order.service_type === 'ltl' && order.external_tracking_code) {
      // Transportadora LTL (placeholder para APIs futuras)
      console.log(`[Tracking API] LTL carrier tracking not yet integrated for: ${order.external_tracking_code}`);
    }

    // 4. Sincronizar novos eventos
    const existingEventCodes = new Set(existingEvents?.map(e => e.event_code) || []);
    const newEvents = normalizedEvents.filter((e: any) => !existingEventCodes.has(e.code));

    if (newEvents.length > 0) {
      console.log(`[Tracking API] Inserting ${newEvents.length} new events`);
      await supabaseAdmin.from('tracking_events').insert(
        newEvents.map((event: any) => ({
          order_id: order.id,
          event_code: event.code,
          event_description: event.description,
          event_timestamp: event.timestamp,
          city: event.city,
          state: event.state,
          is_critical: event.isCritical,
          raw_data: event.rawData,
        }))
      );
    }

    // 5. Combinar todos os eventos
    const allEvents = [
      ...(existingEvents || []),
      ...newEvents.map((e: any) => ({
        event_code: e.code,
        event_description: e.description,
        event_timestamp: e.timestamp,
        city: e.city,
        state: e.state,
        is_critical: e.isCritical,
      })),
    ].sort((a, b) => new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime());

    // 6. Resposta
    const response = {
      id_rastreio: order.tracking_code,
      status_principal: order.status.toUpperCase(),
      previsao_entrega: order.estimated_delivery,
      transportador_nome: order.carrier_name,
      tipo_veiculo: order.vehicle_type || 'N/A',
      fonte_rastreamento: isCorreiosCode ? 'seurastreio_correios' : order.service_type,
      historico_eventos: allEvents.map(event => ({
        data_hora: event.event_timestamp,
        codigo_evento: event.event_code,
        descricao_amigavel: event.event_description,
        cidade_uf: event.city && event.state ? `${event.city} - ${event.state}` : 'N/A',
        ocorrencia_critica: event.is_critical,
      })),
      localizacao_atual: order.current_latitude && order.current_longitude ? {
        lat: parseFloat(order.current_latitude),
        lng: parseFloat(order.current_longitude),
        ultima_atualizacao: order.last_location_update,
      } : null,
    };

    console.log(`[Tracking API] Returning ${response.historico_eventos.length} events (source: ${response.fonte_rastreamento})`);

    return new Response(JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[Tracking API] Unexpected error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
