import Stripe from "stripe";
import { supabaseAdmin } from "../../../../lib/serverSupabase";
import { ensureSubscription } from "../../../../lib/serverSubscriptions";
import { PLAN_PRESETS, PRICE_TO_PLAN } from "../../../../lib/planConfig";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

export async function POST(req) {
  if (!stripe || !webhookSecret) {
    return new Response("Stripe not configured", { status: 500 });
  }

  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        const subscriptionRecord = await ensureSubscription(userId);
        const subscriptionId = session.subscription;
        if (!subscriptionId) break;

        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = stripeSubscription.items.data[0]?.price?.id;
        const plan = PRICE_TO_PLAN[priceId];
        if (!plan) break;

        await supabaseAdmin
          .from("subscriptions")
          .update({
            plan,
            seat_limit: PLAN_PRESETS[plan].seat_limit,
            docs_quota: PLAN_PRESETS[plan].docs_quota,
            ai_quota: PLAN_PRESETS[plan].ai_quota,
            status: stripeSubscription.status,
            stripe_customer_id: session.customer,
            renewal_date: stripeSubscription.current_period_end
              ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
              : null,
            trial_ends_at: null,
          })
          .eq("id", subscriptionRecord.id);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const stripeSubscription = event.data.object;
        const customerId = stripeSubscription.customer;
        const priceId = stripeSubscription.items.data[0]?.price?.id;
        const plan = PRICE_TO_PLAN[priceId];
        if (!plan) break;

        const { data, error } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (error || !data) break;

        await supabaseAdmin
          .from("subscriptions")
          .update({
            plan,
            seat_limit: PLAN_PRESETS[plan].seat_limit,
            docs_quota: PLAN_PRESETS[plan].docs_quota,
            ai_quota: PLAN_PRESETS[plan].ai_quota,
            status: stripeSubscription.status,
            renewal_date: stripeSubscription.current_period_end
              ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
              : null,
            trial_ends_at: null,
          })
          .eq("id", data.id);
        break;
      }
      case "customer.subscription.deleted": {
        const stripeSubscription = event.data.object;
        const customerId = stripeSubscription.customer;

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "canceled",
            plan: "solo",
            seat_limit: PLAN_PRESETS.solo.seat_limit,
            docs_quota: PLAN_PRESETS.solo.docs_quota,
            ai_quota: PLAN_PRESETS.solo.ai_quota,
            trial_ends_at: null,
          })
          .eq("stripe_customer_id", customerId);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Stripe webhook handling error:", err);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response("ok");
}

export const config = {
  api: {
    bodyParser: false,
  },
};
