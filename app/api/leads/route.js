import { supabaseAdmin, getUserFromRequest } from "../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function getProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role, firm_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load profile", error);
    throw new Error("Failed to load profile");
  }

  if (data) return data;

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("profiles")
    .insert({ id: userId })
    .select("role, firm_id")
    .single();

  if (insertError) throw new Error(insertError.message);

  return inserted;
}

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const profile = await getProfile(user.id);
    const isAdmin = profile.role === "admin";

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    let query = supabaseAdmin
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      const filters = [`assigned_to.eq.${user.id}`];
      if (profile.firm_id) {
        filters.push(`firm_id.eq.${profile.firm_id}`);
      }
      query = query.or(filters.join(","));
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
      firm_id: body?.firm_id || null,
    };

    const { error } = await supabaseAdmin.from("leads").insert(payload);
    if (error) throw error;

    return jsonResponse({ success: true }, 201);
  } catch (err) {
    console.error("POST /api/leads error:", err);
    return jsonResponse({ error: err.message || "Failed to submit lead" }, 500);
  }
}
