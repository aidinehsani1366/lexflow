import { supabaseAdmin, getUserFromRequest } from "../../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function canModifyEvent(userId, eventId) {
  const { data: eventRow, error: eventError } = await supabaseAdmin
    .from("case_events")
    .select("case_id")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !eventRow) {
    const err = new Error(eventError?.message || "Event not found");
    err.status = eventError?.code === "PGRST116" ? 404 : 500;
    throw err;
  }

  const { data: caseRow, error: caseError } = await supabaseAdmin
    .from("cases")
    .select("id, user_id")
    .eq("id", eventRow.case_id)
    .maybeSingle();

  if (caseError || !caseRow) {
    const err = new Error(caseError?.message || "Case not found");
    err.status = caseError?.code === "PGRST116" ? 404 : 500;
    throw err;
  }

  if (caseRow.user_id === userId) return { allowed: true, caseId: eventRow.case_id };

  const { data: memberRows, error: memberError } = await supabaseAdmin
    .from("case_members")
    .select("member_id, role")
    .eq("case_id", eventRow.case_id)
    .eq("member_id", userId);

  if (memberError) {
    const err = new Error(memberError.message);
    err.status = 500;
    throw err;
  }

  const member = (memberRows || [])[0];
  const allowed = Boolean(member && ["editor", "owner"].includes(member.role));
  return { allowed, caseId: eventRow.case_id };
}

export async function PATCH(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const eventId = params.id;
    const { allowed } = await canModifyEvent(user.id, eventId);
    if (!allowed) return jsonResponse({ error: "Forbidden" }, 403);

    const payload = await req.json();
    const updates = {};
    if (payload.title !== undefined) updates.title = payload.title?.trim() || null;
    if (payload.description !== undefined) updates.description = payload.description || null;
    if (payload.event_date !== undefined) updates.event_date = payload.event_date;
    if (payload.reminder_minutes !== undefined) updates.reminder_minutes = payload.reminder_minutes;
    if (payload.suggested !== undefined) updates.suggested = Boolean(payload.suggested);
    if (payload.source !== undefined) updates.source = payload.source;

    if (Object.keys(updates).length === 0) {
      return jsonResponse({ error: "No valid fields to update." }, 400);
    }

    const { data, error } = await supabaseAdmin
      .from("case_events")
      .update(updates)
      .eq("id", eventId)
      .select()
      .single();

    if (error) throw error;
    return jsonResponse({ data });
  } catch (err) {
    console.error(`PATCH /api/case-events/${params.id} error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to update case event" }, status);
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const eventId = params.id;
    const { allowed } = await canModifyEvent(user.id, eventId);
    if (!allowed) return jsonResponse({ error: "Forbidden" }, 403);

    const { error } = await supabaseAdmin.from("case_events").delete().eq("id", eventId);
    if (error) throw error;
    return jsonResponse({ success: true });
  } catch (err) {
    console.error(`DELETE /api/case-events/${params.id} error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to delete case event" }, status);
  }
}
