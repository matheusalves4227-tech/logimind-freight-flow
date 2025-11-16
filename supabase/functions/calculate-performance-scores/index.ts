import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerformanceData {
  totalDeliveries: number;
  completedDeliveries: number;
  onTimeDeliveries: number;
  totalReviews: number;
  averageRating: number;
  acceptedBids?: number;
  totalBids?: number;
  damageCount?: number;
}

function calculateDriverScore(data: PerformanceData): {
  overall: number;
  review: number;
  onTime: number;
  acceptance: number;
  completion: number;
} {
  const reviewScore = data.totalReviews > 0 ? (data.averageRating / 5) * 100 : 0;
  const onTimeScore = data.completedDeliveries > 0 
    ? (data.onTimeDeliveries / data.completedDeliveries) * 100 
    : 0;
  const acceptanceScore = data.totalBids && data.totalBids > 0
    ? ((data.acceptedBids || 0) / data.totalBids) * 100
    : 0;
  const completionScore = data.totalDeliveries > 0
    ? (data.completedDeliveries / data.totalDeliveries) * 100
    : 0;

  // Pesos para o score geral
  const weights = {
    review: 0.35,
    onTime: 0.30,
    acceptance: 0.15,
    completion: 0.20,
  };

  const overall = 
    reviewScore * weights.review +
    onTimeScore * weights.onTime +
    acceptanceScore * weights.acceptance +
    completionScore * weights.completion;

  return {
    overall: parseFloat(overall.toFixed(2)),
    review: parseFloat(reviewScore.toFixed(2)),
    onTime: parseFloat(onTimeScore.toFixed(2)),
    acceptance: parseFloat(acceptanceScore.toFixed(2)),
    completion: parseFloat(completionScore.toFixed(2)),
  };
}

function calculateCarrierScore(data: PerformanceData): {
  overall: number;
  review: number;
  onTime: number;
  damage: number;
} {
  const reviewScore = data.totalReviews > 0 ? (data.averageRating / 5) * 100 : 0;
  const onTimeScore = data.completedDeliveries > 0
    ? (data.onTimeDeliveries / data.completedDeliveries) * 100
    : 0;
  const damageScore = data.completedDeliveries > 0
    ? 100 - ((data.damageCount || 0) / data.completedDeliveries) * 100
    : 100;

  // Pesos para o score geral
  const weights = {
    review: 0.40,
    onTime: 0.35,
    damage: 0.25,
  };

  const overall = 
    reviewScore * weights.review +
    onTimeScore * weights.onTime +
    damageScore * weights.damage;

  return {
    overall: parseFloat(overall.toFixed(2)),
    review: parseFloat(reviewScore.toFixed(2)),
    onTime: parseFloat(onTimeScore.toFixed(2)),
    damage: parseFloat(damageScore.toFixed(2)),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, entityId } = await req.json();

    if (!type || !entityId) {
      throw new Error('Type and entityId are required');
    }

    console.log(`Calculating performance score for ${type}: ${entityId}`);

    if (type === 'driver') {
      // Buscar dados do motorista
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, estimated_delivery, actual_delivery')
        .eq('driver_id', entityId);

      if (ordersError) throw ordersError;

      const totalDeliveries = orders?.length || 0;
      const completedDeliveries = orders?.filter(o => o.status === 'delivered').length || 0;
      const onTimeDeliveries = orders?.filter(o => {
        if (o.status !== 'delivered' || !o.actual_delivery || !o.estimated_delivery) return false;
        return new Date(o.actual_delivery) <= new Date(o.estimated_delivery);
      }).length || 0;

      // Buscar reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('driver_reviews')
        .select('rating')
        .eq('driver_id', entityId);

      if (reviewsError) throw reviewsError;

      const totalReviews = reviews?.length || 0;
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

      // Buscar bids
      const { data: bids, error: bidsError } = await supabase
        .from('driver_bids')
        .select('status')
        .eq('driver_profile_id', entityId);

      if (bidsError) throw bidsError;

      const totalBids = bids?.length || 0;
      const acceptedBids = bids?.filter(b => b.status === 'accepted').length || 0;

      const scores = calculateDriverScore({
        totalDeliveries,
        completedDeliveries,
        onTimeDeliveries,
        totalReviews,
        averageRating,
        totalBids,
        acceptedBids,
      });

      // Upsert score
      const { error: upsertError } = await supabase
        .from('driver_performance_scores')
        .upsert({
          driver_id: entityId,
          overall_score: scores.overall,
          review_score: scores.review,
          on_time_delivery_score: scores.onTime,
          acceptance_rate_score: scores.acceptance,
          completion_rate_score: scores.completion,
          total_deliveries: totalDeliveries,
          total_reviews: totalReviews,
          average_rating: parseFloat(averageRating.toFixed(2)),
          last_calculated_at: new Date().toISOString(),
        }, {
          onConflict: 'driver_id'
        });

      if (upsertError) throw upsertError;

      console.log(`Driver score calculated successfully: ${scores.overall}`);

      return new Response(
        JSON.stringify({ success: true, scores }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (type === 'carrier') {
      // Buscar dados da transportadora
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, estimated_delivery, actual_delivery')
        .eq('carrier_id', entityId);

      if (ordersError) throw ordersError;

      const totalDeliveries = orders?.length || 0;
      const completedDeliveries = orders?.filter(o => o.status === 'delivered').length || 0;
      const onTimeDeliveries = orders?.filter(o => {
        if (o.status !== 'delivered' || !o.actual_delivery || !o.estimated_delivery) return false;
        return new Date(o.actual_delivery) <= new Date(o.estimated_delivery);
      }).length || 0;

      // Buscar reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('carrier_reviews')
        .select('rating')
        .eq('carrier_id', entityId);

      if (reviewsError) throw reviewsError;

      const totalReviews = reviews?.length || 0;
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

      // Buscar carrier data para damage rate
      const { data: carrier, error: carrierError } = await supabase
        .from('carriers')
        .select('damage_rate')
        .eq('id', entityId)
        .single();

      if (carrierError) throw carrierError;

      const damageCount = carrier?.damage_rate 
        ? Math.round((carrier.damage_rate / 100) * completedDeliveries)
        : 0;

      const scores = calculateCarrierScore({
        totalDeliveries,
        completedDeliveries,
        onTimeDeliveries,
        totalReviews,
        averageRating,
        damageCount,
      });

      // Upsert score
      const { error: upsertError } = await supabase
        .from('carrier_performance_scores')
        .upsert({
          carrier_id: entityId,
          overall_score: scores.overall,
          review_score: scores.review,
          on_time_delivery_score: scores.onTime,
          damage_rate_score: scores.damage,
          total_deliveries: totalDeliveries,
          total_reviews: totalReviews,
          average_rating: parseFloat(averageRating.toFixed(2)),
          last_calculated_at: new Date().toISOString(),
        }, {
          onConflict: 'carrier_id'
        });

      if (upsertError) throw upsertError;

      console.log(`Carrier score calculated successfully: ${scores.overall}`);

      return new Response(
        JSON.stringify({ success: true, scores }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      throw new Error('Invalid type. Must be "driver" or "carrier"');
    }

  } catch (error) {
    console.error('Error calculating performance scores:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
