import { supabaseAdmin, getUserFromRequest } from "../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function getProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, role, firm_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    const err = new Error("Profile not found");
    err.status = 403;
    throw err;
  }

  return data;
}

async function getLead(id) {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    const err = new Error("Lead not found");
    err.status = 404;
    throw err;
  }

  return data;
}

function canManageFees(user, profile, lead) {
  if (profile.role === "admin") return true;
  const sameFirm = profile.firm_id && lead.firm_id && profile.firm_id === lead.firm_id;
  const isAssigned = lead.assigned_to === user.id;
  return sameFirm || isAssigned;
}

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");
    if (!leadId) return jsonResponse({ error: "leadId query param is required" }, 400);

    const lead = await getLead(leadId);
    const profile = await getProfile(user.id);

    if (!canManageFees(user, profile, lead)) {
      const err = new Error("Forbidden");
      err.status = 403;
      throw err;
    }

    const { data, error } = await supabaseAdmin
      .from("referral_fees")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return jsonResponse({ data: data || [] });
  } catch (err) {
    console.error("GET /api/referral-fees error:", err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load referral fees" }, status);
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const leadId = body?.lead_id;
    const amount = Number(body?.amount);
    if (!leadId || Number.isNaN(amount) || amount <= 0) {
      return jsonResponse({ error: "Valid lead_id and amount are required" }, 400);
    }

    const lead = await getLead(leadId);
    const profile = await getProfile(user.id);
    if (!canManageFees(user, profile, lead)) {
      const err = new Error("Forbidden");
      err.status = 403;
      throw err;
    }

    const firmId = body?.firm_id || lead.firm_id;
    if (!firmId) {
      return jsonResponse({ error: "Assign the lead to a firm before logging fees." }, 400);
    }

    const payload = {
      lead_id: leadId,
      firm_id: firmId,
      amount,
      due_date: body?.due_date || null,
      notes: body?.notes || null,
      created_by: user.id,
      status: "pending",
    };

    const { data, error } = await supabaseAdmin
      .from("referral_fees")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from("lead_events").insert({
      lead_id: leadId,
      actor_id: user.id,
      event_type: "referral_fee_logged",
      details: {
        amount,
        due_date: payload.due_date,
      },
    });

    return jsonResponse({ data }, 201);
  } catch (err) {
    console.error("POST /api/referral-fees error:", err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to create referral fee" }, status);
  }
}
