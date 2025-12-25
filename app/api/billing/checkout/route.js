import Stripe from "stripe";
import { getUserFromRequest, supabaseAdmin } from "../../../../lib/serverSupabase";
import { ensureSubscription } from "../../../../lib/serverSubscriptions";
import { PLAN_PRESETS } from "../../../../lib/planConfig";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function POST(req) {
  try {
    if (!stripe) {
      return jsonResponse(
        { error: "Stripe secret key missing. Set STRIPE_SECRET_KEY in env." },
        500
      );
    }

    const origin = req.headers.get("origin") || process.env.APP_URL || "http://localhost:3000";
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { plan } = await req.json();
    if (!plan || !PLAN_PRESETS[plan]) {
      return jsonResponse({ error: "Invalid plan selection." }, 400);
    }

    const priceId = PLAN_PRESETS[plan].priceId;
    if (!priceId) {
      return jsonResponse(
        { error: `Missing Stripe price ID for plan ${plan}. Check env variables.` },
        500
      );
    }

    const subscription = await ensureSubscription(user.id);

    let customerId = subscription.stripe_customer_id;
    if (!customerId) {
      const { data: userData, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(
        user.id
      );
      if (fetchError || !userData?.user) {
        throw new Error(fetchError?.message || "Unable to load user profile");
      }
      const customer = await stripe.customers.create({
        email: userData.user.email || undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("id", subscription.id);
      if (updateError) throw updateError;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/billing`,
      metadata: {
        supabase_user_id: user.id,
        plan,
      },
    });

    return jsonResponse({ url: session.url });
  } catch (err) {
    console.error("POST /api/billing/checkout error:", err);
    const status = err.status || 500;
    return jsonResponse({ error: err.message || "Failed to create checkout session" }, status);
  }
}
