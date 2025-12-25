import { supabaseAdmin, getUserFromRequest } from "../../../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function canAccessCase(userId, caseId) {
  const { data: caseRow, error: caseError } = await supabaseAdmin
    .from("cases")
    .select("id, user_id")
    .eq("id", caseId)
    .maybeSingle();

  if (caseError || !caseRow) {
    const err = new Error(caseError?.message || "Case not found");
    err.status = caseError?.code === "PGRST116" ? 404 : 500;
    throw err;
  }

  if (caseRow.user_id === userId) return true;

  const { data: memberRows, error: memberError } = await supabaseAdmin
    .from("case_members")
    .select("member_id")
    .eq("case_id", caseId)
    .eq("member_id", userId);

  if (memberError) {
    const err = new Error(memberError.message);
    err.status = 500;
    throw err;
  }

  return (memberRows || []).length > 0;
}

export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const caseId = params.id;
    const access = await canAccessCase(user.id, caseId);
    if (!access) return jsonResponse({ error: "Forbidden" }, 403);

    const { data, error } = await supabaseAdmin
      .from("case_events")
      .select("*")
      .eq("case_id", caseId)
      .order("event_date", { ascending: true });

    if (error) throw error;
    return jsonResponse({ data: data || [] });
  } catch (err) {
    console.error(`GET /api/cases/${params.id}/events error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load case events" }, status);
  }
}

export async function POST(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const caseId = params.id;
    const access = await canAccessCase(user.id, caseId);
    if (!access) return jsonResponse({ error: "Forbidden" }, 403);

    const payload = await req.json();
    const title = payload?.title?.trim();
    const eventDate = payload?.event_date;
    if (!title || !eventDate) {
      return jsonResponse({ error: "Title and event_date are required." }, 400);
    }

    const insertPayload = {
      case_id: caseId,
      title,
      description: payload?.description || null,
      event_date: eventDate,
      reminder_minutes: payload?.reminder_minutes ?? 1440,
      source: payload?.source || "manual",
      suggested: Boolean(payload?.suggested),
      created_by: user.id,
    };

    const { data, error } = await supabaseAdmin
      .from("case_events")
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;
    return jsonResponse({ data }, 201);
  } catch (err) {
    console.error(`POST /api/cases/${params.id}/events error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to create case event" }, status);
  }
}
