// app/api/checkout/route.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { priceId } = await req.json();
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "Missing priceId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/cancel`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function GET() {
  return new Response("Method Not Allowed", { status: 405 });
}
