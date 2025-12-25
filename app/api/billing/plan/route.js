import { getUserFromRequest } from "../../../../lib/serverSupabase";
import { ensureSubscription } from "../../../../lib/serverSubscriptions";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
    const data = await ensureSubscription(user.id);
    return jsonResponse({ data });
  } catch (err) {
    console.error("GET /api/billing/plan error:", err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load plan" }, status);
  }
}

export async function POST() {
  return jsonResponse({ error: "Plan changes are managed via Stripe." }, 405);
}
