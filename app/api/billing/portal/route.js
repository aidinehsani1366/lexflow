import Stripe from "stripe";
import { getUserFromRequest, supabaseAdmin } from "../../../../lib/serverSupabase";
import { ensureSubscription } from "../../../../lib/serverSubscriptions";

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

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard/billing`,
    });

    return jsonResponse({ url: portalSession.url });
  } catch (err) {
    console.error("POST /api/billing/portal error:", err);
    const status = err.status || 500;
    return jsonResponse({ error: err.message || "Failed to create portal link" }, status);
  }
}
