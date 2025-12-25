import { supabaseAdmin, getUserFromRequest } from "../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function listAccessibleCases(userId) {
  const caseMap = new Map();

  const { data: ownerCases, error: ownerError } = await supabaseAdmin
    .from("cases")
    .select("id, title")
    .eq("user_id", userId);

  if (ownerError) throw ownerError;
  (ownerCases || []).forEach((c) => caseMap.set(c.id, c));

  const { data: memberRows, error: memberError } = await supabaseAdmin
    .from("case_members")
    .select("case_id, cases (id, title)")
    .eq("member_id", userId);

  if (memberError) throw memberError;
  (memberRows || []).forEach((row) => {
    if (row.cases) {
      caseMap.set(row.cases.id, row.cases);
    }
  });

  return Array.from(caseMap.values());
}

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const cases = await listAccessibleCases(user.id);
    if (cases.length === 0) return jsonResponse({ data: [] });

    const caseIds = cases.map((c) => c.id);

    const { searchParams } = new URL(req.url);
    const includePast = searchParams.get("includePast") === "true";
    const nowIso = new Date().toISOString();

    let query = supabaseAdmin
      .from("case_events")
      .select("*, cases (id, title)")
      .in("case_id", caseIds)
      .order("event_date", { ascending: true });

    if (!includePast) {
      query = query.gte("event_date", nowIso);
    }

    const { data, error } = await query;
    if (error) throw error;

    const caseLookup = new Map(cases.map((c) => [c.id, c]));

    const formatted =
      data?.map((event) => ({
        ...event,
        case: event.cases || caseLookup.get(event.case_id) || null,
      })) || [];

    return jsonResponse({ data: formatted });
  } catch (err) {
    console.error("GET /api/case-events error:", err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load events" }, status);
  }
}
