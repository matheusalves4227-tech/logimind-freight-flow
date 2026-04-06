import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get session_id from request
    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");
    logStep("Session ID received", { session_id });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Session retrieved from Stripe", { 
      payment_status: session.payment_status,
      status: session.status 
    });

    // Get order from metadata
    const order_id = session.metadata?.order_id;
    if (!order_id) {
      throw new Error("Order ID not found in session metadata");
    }

    // Check if payment was successful
    if (session.payment_status === "paid") {
      logStep("Payment confirmed, updating order");

      // Get payment intent for additional details
      let paymentMethod = null;
      if (session.payment_intent) {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent as string
        );
        paymentMethod = paymentIntent.payment_method_types[0];
        logStep("Payment method retrieved", { paymentMethod });
      }

      // Update order with payment confirmation
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          status_pagamento: 'paid',
          stripe_payment_intent_id: session.payment_intent as string,
          payment_method: paymentMethod,
          paid_at: new Date().toISOString(),
          status: 'awaiting_driver', // Aguardando motorista após pagamento confirmado
          updated_at: new Date().toISOString(),
        })
        .eq("id", order_id);

      if (updateError) {
        logStep("ERROR updating order", { error: updateError });
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      // Create financial transaction record
      const { error: txError } = await supabaseAdmin
        .from("financial_transactions")
        .insert({
          order_id: order_id,
          type: 'PAYMENT_IN',
          amount: session.amount_total! / 100, // Converter de centavos para reais
          status: 'PAID',
          gateway_transaction_id: session.payment_intent as string,
          processed_at: new Date().toISOString(),
        });

      if (txError) {
        logStep("ERROR creating transaction", { error: txError });
      }

      logStep("Order and transaction updated successfully");

      return new Response(
        JSON.stringify({ 
          success: true, 
          payment_status: "paid",
          order_id: order_id,
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      logStep("Payment not completed", { payment_status: session.payment_status });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          payment_status: session.payment_status,
          message: "Payment not completed yet",
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
