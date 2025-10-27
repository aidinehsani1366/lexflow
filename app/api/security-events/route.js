import { supabaseAdmin, getUserFromRequest } from "../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function ensureAdmin(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data || data.role !== "admin") {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
}

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
    await ensureAdmin(user.id);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 200);

    const { data, error } = await supabaseAdmin
      .from("security_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return jsonResponse({ data: data || [] });
  } catch (err) {
    console.error("GET /api/security-events error:", err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load security events" }, status);
  }
}
