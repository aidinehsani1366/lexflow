import { supabaseAdmin, getUserFromRequest } from "../../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function PATCH(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const id = params.id;
    const body = await req.json();
    const updates = {};
    if (body.status) updates.status = body.status;
    if (body.assigned_to) updates.assigned_to = body.assigned_to;
    if (body.referral_notes !== undefined) updates.referral_notes = body.referral_notes;

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
    return jsonResponse({ data });
  } catch (err) {
    console.error(`PATCH /api/leads/${params.id} error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to update lead" }, status);
  }
}
