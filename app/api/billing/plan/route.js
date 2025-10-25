import { supabaseAdmin, getUserFromRequest } from "../../../../lib/serverSupabase";
import { PLAN_PRESETS, ensureSubscription } from "../../../../lib/serverSubscriptions";

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

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { plan } = await req.json();
    if (!plan || !PLAN_PRESETS[plan]) {
      return jsonResponse({ error: "Invalid plan selection." }, 400);
    }

    const preset = PLAN_PRESETS[plan];
    const existing = await ensureSubscription(user.id);

    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        plan,
        seat_limit: preset.seat_limit,
        docs_quota: preset.docs_quota,
        ai_quota: preset.ai_quota,
        status: existing.status || "active",
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return jsonResponse({ data });
  } catch (err) {
    console.error("POST /api/billing/plan error:", err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to update plan" }, status);
  }
}
