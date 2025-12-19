import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MatchDriversRequest {
  order_id: string;
}

interface DriverMatch {
  driver_id: string;
  driver_name: string;
  phone: string;
  region_match_score: number;
  capacity_match: boolean;
  performance_score: number;
  total_score: number;
  match_reasons: string[];
  distance_km?: number;
  vehicle_type?: string;
  max_weight_kg?: number;
}

// Extrai estado do CEP brasileiro
function getStateFromCep(cep: string): string {
  const cleanCep = cep.replace(/\D/g, '');
  const prefix = parseInt(cleanCep.substring(0, 3));
  
  // Faixas de CEP por estado
  if (prefix >= 10 && prefix <= 199) return 'SP';
  if (prefix >= 200 && prefix <= 289) return 'RJ';
  if (prefix >= 290 && prefix <= 299) return 'ES';
  if (prefix >= 300 && prefix <= 399) return 'MG';
  if (prefix >= 400 && prefix <= 489) return 'BA';
  if (prefix >= 490 && prefix <= 499) return 'SE';
  if (prefix >= 500 && prefix <= 569) return 'PE';
  if (prefix >= 570 && prefix <= 579) return 'AL';
  if (prefix >= 580 && prefix <= 589) return 'PB';
  if (prefix >= 590 && prefix <= 599) return 'RN';
  if (prefix >= 600 && prefix <= 639) return 'CE';
  if (prefix >= 640 && prefix <= 649) return 'PI';
  if (prefix >= 650 && prefix <= 659) return 'MA';
  if (prefix >= 660 && prefix <= 688) return 'PA';
  if (prefix >= 689 && prefix <= 689) return 'AP';
  if (prefix >= 690 && prefix <= 692) return 'AM';
  if (prefix >= 693 && prefix <= 698) return 'RR';
  if (prefix >= 699 && prefix <= 699) return 'AM';
  if (prefix >= 700 && prefix <= 727) return 'DF';
  if (prefix >= 728 && prefix <= 729) return 'GO';
  if (prefix >= 730 && prefix <= 769) return 'GO';
  if (prefix >= 770 && prefix <= 779) return 'TO';
  if (prefix >= 780 && prefix <= 788) return 'MT';
  if (prefix >= 789 && prefix <= 789) return 'MT';
  if (prefix >= 790 && prefix <= 799) return 'MS';
  if (prefix >= 800 && prefix <= 879) return 'PR';
  if (prefix >= 880 && prefix <= 899) return 'SC';
  if (prefix >= 900 && prefix <= 999) return 'RS';
  if (prefix >= 690 && prefix <= 699) return 'AC';
  if (prefix >= 768 && prefix <= 769) return 'RO';
  
  return 'XX';
}

// Calcula score de proximidade regional
function calculateRegionScore(driverState: string, originState: string, destState: string): number {
  let score = 0;
  
  // Motorista no estado de origem = melhor match
  if (driverState === originState) score += 50;
  
  // Motorista no estado de destino = bom para rota de retorno
  if (driverState === destState) score += 30;
  
  // Estados vizinhos (simplificado)
  const neighbors: Record<string, string[]> = {
    'SP': ['MG', 'RJ', 'PR', 'MS'],
    'RJ': ['SP', 'MG', 'ES'],
    'MG': ['SP', 'RJ', 'ES', 'BA', 'GO', 'DF', 'MS'],
    'PR': ['SP', 'SC', 'MS'],
    'SC': ['PR', 'RS'],
    'RS': ['SC'],
    'BA': ['MG', 'ES', 'SE', 'PE', 'PI', 'GO', 'TO'],
    'GO': ['MG', 'BA', 'TO', 'MT', 'MS', 'DF'],
    'DF': ['GO', 'MG'],
  };
  
  if (neighbors[driverState]?.includes(originState)) score += 20;
  if (neighbors[driverState]?.includes(destState)) score += 15;
  
  return score;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");

    console.log("[Match Drivers] Starting request");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[Match Drivers] Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!authHeader) {
      console.error("[Match Drivers] No authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cliente com service role para acesso completo
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Cliente com token do usuário para verificar permissões
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verificar se é admin
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      console.error("[Match Drivers] Auth error:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar role admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error("[Match Drivers] Not admin");
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { order_id }: MatchDriversRequest = await req.json();
    console.log("[Match Drivers] Processing order:", order_id);

    // Buscar dados do pedido
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, origin_cep, destination_cep, weight_kg, service_type, vehicle_type')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error("[Match Drivers] Order not found:", orderError?.message);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar motoristas aprovados com veículos
    const { data: drivers, error: driversError } = await supabaseAdmin
      .from('driver_profiles')
      .select(`
        id,
        full_name,
        phone,
        address_city,
        address_state,
        address_cep,
        driver_vehicles (
          id,
          vehicle_type,
          max_weight_kg,
          is_active
        )
      `)
      .eq('status', 'approved');

    if (driversError) {
      console.error("[Match Drivers] Error fetching drivers:", driversError.message);
      return new Response(
        JSON.stringify({ error: "Error fetching drivers" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar scores de performance
    const { data: performanceScores } = await supabaseAdmin
      .from('driver_performance_scores')
      .select('driver_id, overall_score, total_deliveries');

    const performanceMap = new Map(
      performanceScores?.map(p => [p.driver_id, p]) || []
    );

    // Buscar pedidos ativos por motorista (para verificar disponibilidade)
    const { data: activeOrders } = await supabaseAdmin
      .from('orders')
      .select('driver_id')
      .in('status', ['confirmed', 'in_transit', 'out_for_delivery'])
      .not('driver_id', 'is', null);

    const activeOrdersCount = new Map<string, number>();
    activeOrders?.forEach(o => {
      const count = activeOrdersCount.get(o.driver_id) || 0;
      activeOrdersCount.set(o.driver_id, count + 1);
    });

    const originState = getStateFromCep(order.origin_cep);
    const destState = getStateFromCep(order.destination_cep);
    
    console.log(`[Match Drivers] Route: ${originState} -> ${destState}, Weight: ${order.weight_kg}kg`);

    // Calcular match para cada motorista
    const matches: DriverMatch[] = [];

    for (const driver of drivers || []) {
      const driverState = driver.address_state || getStateFromCep(driver.address_cep || '');
      const activeCount = activeOrdersCount.get(driver.id) || 0;
      const performance = performanceMap.get(driver.id);
      
      // Verificar disponibilidade (máx 3 fretes ativos)
      if (activeCount >= 3) {
        console.log(`[Match Drivers] Driver ${driver.full_name} busy with ${activeCount} orders`);
        continue;
      }

      // Verificar veículos ativos
      const activeVehicles = driver.driver_vehicles?.filter((v: any) => v.is_active) || [];
      if (activeVehicles.length === 0) {
        console.log(`[Match Drivers] Driver ${driver.full_name} has no active vehicles`);
        continue;
      }

      // Verificar capacidade de peso
      const maxCapacity = Math.max(...activeVehicles.map((v: any) => v.max_weight_kg || 0));
      const canCarry = maxCapacity >= order.weight_kg;

      if (!canCarry) {
        console.log(`[Match Drivers] Driver ${driver.full_name} capacity ${maxCapacity}kg < ${order.weight_kg}kg`);
        continue;
      }

      // Calcular scores
      const regionScore = calculateRegionScore(driverState, originState, destState);
      const performanceScore = performance?.overall_score || 50;
      const availabilityBonus = activeCount === 0 ? 20 : (activeCount === 1 ? 10 : 0);
      const experienceBonus = (performance?.total_deliveries || 0) > 10 ? 10 : 0;

      const totalScore = regionScore + (performanceScore * 0.3) + availabilityBonus + experienceBonus;

      // Determinar razões do match
      const reasons: string[] = [];
      if (driverState === originState) reasons.push(`Localizado em ${originState} (origem)`);
      if (driverState === destState) reasons.push(`Localizado em ${destState} (destino)`);
      if (activeCount === 0) reasons.push('Totalmente disponível');
      if ((performance?.total_deliveries || 0) > 10) reasons.push('Motorista experiente');
      if (performanceScore >= 80) reasons.push('Alta performance');
      if (maxCapacity >= order.weight_kg * 1.5) reasons.push('Capacidade de sobra');

      const bestVehicle = activeVehicles.sort((a: any, b: any) => b.max_weight_kg - a.max_weight_kg)[0];

      matches.push({
        driver_id: driver.id,
        driver_name: driver.full_name,
        phone: driver.phone,
        region_match_score: regionScore,
        capacity_match: canCarry,
        performance_score: performanceScore,
        total_score: totalScore,
        match_reasons: reasons.length > 0 ? reasons : ['Motorista disponível'],
        vehicle_type: bestVehicle?.vehicle_type,
        max_weight_kg: maxCapacity,
      });
    }

    // Ordenar por score total (maior primeiro)
    matches.sort((a, b) => b.total_score - a.total_score);

    // Retornar top 5 matches
    const topMatches = matches.slice(0, 5);

    console.log(`[Match Drivers] Found ${matches.length} eligible drivers, returning top ${topMatches.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order_id,
        origin_state: originState,
        destination_state: destState,
        total_eligible: matches.length,
        matches: topMatches,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Match Drivers] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
