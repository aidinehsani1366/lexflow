import { supabaseAdmin, getUserFromRequest } from "../../../../lib/serverSupabase";

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

export async function PATCH(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const profile = await getProfile(user.id);
    const isAdmin = profile.role === "admin";

    const id = params.id;
    const lead = await getLead(id);

    const sameFirm = profile.firm_id && lead.firm_id && profile.firm_id === lead.firm_id;
    const canEdit =
      isAdmin || lead.assigned_to === user.id || (profile.role === "firm_admin" && sameFirm);

    if (!canEdit) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const body = await req.json();
    const updates = {};
    if (body.status) updates.status = body.status;
    if (body.referral_notes !== undefined) updates.referral_notes = body.referral_notes;

    if (isAdmin) {
      if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to;
      if (body.firm_id !== undefined) updates.firm_id = body.firm_id || null;
    }

    if (Object.keys(updates).length === 0) {
      return jsonResponse({ error: "No valid fields to update." }, 400);
    }

    const { data, error } = await supabaseAdmin
      .from("leads")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const changes = [];
    if (updates.status && updates.status !== lead.status) {
      changes.push({ field: "status", from: lead.status, to: updates.status });
    }
    if (updates.assigned_to !== undefined && updates.assigned_to !== lead.assigned_to) {
      changes.push({ field: "assigned_to", from: lead.assigned_to, to: updates.assigned_to });
    }
    if (updates.firm_id !== undefined && updates.firm_id !== lead.firm_id) {
      changes.push({ field: "firm_id", from: lead.firm_id, to: updates.firm_id });
    }
    if (updates.referral_notes !== undefined && updates.referral_notes !== lead.referral_notes) {
      changes.push({ field: "referral_notes" });
    }

    if (changes.length > 0) {
      await supabaseAdmin.from("lead_events").insert({
        lead_id: data.id,
        actor_id: user.id,
        event_type: "lead_updated",
        details: { changes },
      });
    }

    return jsonResponse({ data });
  } catch (err) {
    console.error(`PATCH /api/leads/${params.id} error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to update lead" }, status);
  }
}
