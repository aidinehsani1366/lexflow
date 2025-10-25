import { supabaseAdmin, getUserFromRequest } from "../../../../lib/serverSupabase";

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

    const { data, error } = await supabaseAdmin
      .from("firms")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return jsonResponse({ data: data || [] });
  } catch (err) {
    console.error("GET /api/admin/firms error:", err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load firms" }, status);
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    await ensureAdmin(user.id);

    const body = await req.json();
    const name = body?.name?.trim();
    if (!name) return jsonResponse({ error: "Name is required" }, 400);

    const payload = {
      name,
      contact_email: body?.contact_email || null,
    };

    const { data, error } = await supabaseAdmin
      .from("firms")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return jsonResponse({ data }, 201);
  } catch (err) {
    console.error("POST /api/admin/firms error:", err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to create firm" }, status);
  }
}
