import { supabaseAdmin, getUserFromRequest } from "../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function getProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (error) {
    console.error("Failed to load profile role", error);
    return { role: "user" };
  }
  return data || { role: "user" };
}

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const profile = await getProfile(user.id);

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    let query = supabaseAdmin
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (profile.role !== "admin") {
      query = query.eq("assigned_to", user.id);
    }

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return jsonResponse({ data: data || [] });
  } catch (err) {
    console.error("GET /api/leads error:", err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load leads" }, status);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const contact_name = body?.contact_name?.trim();
    if (!contact_name) {
      return jsonResponse({ error: "Name is required." }, 400);
    }

    const payload = {
      contact_name,
      email: body?.email || null,
      phone: body?.phone || null,
      case_type: body?.case_type || null,
      jurisdiction: body?.jurisdiction || null,
      summary: body?.summary || null,
      source: body?.source || "website",
      metadata: body?.metadata || null,
    };

    const { error } = await supabaseAdmin.from("leads").insert(payload);
    if (error) throw error;

    return jsonResponse({ success: true }, 201);
  } catch (err) {
    console.error("POST /api/leads error:", err);
    return jsonResponse({ error: err.message || "Failed to submit lead" }, 500);
  }
}
