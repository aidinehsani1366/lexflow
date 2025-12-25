import { supabaseAdmin, getUserFromRequest } from "../../../../lib/serverSupabase";

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

async function getFee(id) {
  const { data, error } = await supabaseAdmin
    .from("referral_fees")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    const err = new Error("Referral fee not found");
    err.status = 404;
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

export async function PATCH(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const fee = await getFee(params.id);
    const lead = await getLead(fee.lead_id);
    const profile = await getProfile(user.id);

    if (!canManageFees(user, profile, lead)) {
      const err = new Error("Forbidden");
      err.status = 403;
      throw err;
    }

    const body = await req.json();
    const updates = {};

    if (body.status) {
      if (!["pending", "paid"].includes(body.status)) {
        return jsonResponse({ error: "Invalid status" }, 400);
      }
      updates.status = body.status;
      if (body.status === "paid" && !body.paid_at) {
        updates.paid_at = new Date().toISOString();
      } else if (body.status === "pending") {
        updates.paid_at = null;
      }
    }

    if (body.paid_at) updates.paid_at = body.paid_at;
    if (body.due_date !== undefined) updates.due_date = body.due_date || null;
    if (body.notes !== undefined) updates.notes = body.notes;

    if (Object.keys(updates).length === 0) {
      return jsonResponse({ error: "No valid fields to update" }, 400);
    }

    const { data, error } = await supabaseAdmin
      .from("referral_fees")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from("lead_events").insert({
      lead_id: data.lead_id,
      actor_id: user.id,
      event_type: "referral_fee_updated",
      details: {
        status: data.status,
        paid_at: data.paid_at,
        due_date: data.due_date,
      },
    });

    return jsonResponse({ data });
  } catch (err) {
    console.error(`PATCH /api/referral-fees/${params.id} error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to update referral fee" }, status);
  }
}
