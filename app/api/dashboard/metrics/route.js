import { supabaseAdmin, getUserFromRequest } from "../../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function gatherCaseIds(userId) {
  const caseIds = new Set();

  const { data: ownerCases, error: ownerError } = await supabaseAdmin
    .from("cases")
    .select("id")
    .eq("user_id", userId);
  if (ownerError) throw ownerError;
  (ownerCases || []).forEach((row) => caseIds.add(row.id));

  const { data: memberRows, error: memberError } = await supabaseAdmin
    .from("case_members")
    .select("case_id")
    .eq("member_id", userId);
  if (memberError) throw memberError;
  (memberRows || []).forEach((row) => caseIds.add(row.case_id));

  return Array.from(caseIds);
}

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const caseIds = await gatherCaseIds(user.id);
    if (caseIds.length === 0) {
      return jsonResponse({
        data: {
          activeCases: 0,
          docsThisWeek: 0,
          aiPromptsThisWeek: 0,
        },
      });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysIso = sevenDaysAgo.toISOString();

    const { count: docsCount, error: docsError } = await supabaseAdmin
      .from("checklists")
      .select("*", { count: "exact", head: true })
      .in("case_id", caseIds)
      .gte("created_at", sevenDaysIso);
    if (docsError) throw docsError;

    const { count: promptsCount, error: msgError } = await supabaseAdmin
      .from("case_messages")
      .select("*", { count: "exact", head: true })
      .in("case_id", caseIds)
      .eq("sender", "user")
      .gte("created_at", sevenDaysIso);
    if (msgError) throw msgError;

    return jsonResponse({
      data: {
        activeCases: caseIds.length,
        docsThisWeek: docsCount || 0,
        aiPromptsThisWeek: promptsCount || 0,
      },
    });
  } catch (err) {
    console.error("GET /api/dashboard/metrics error:", err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load metrics" }, status);
  }
}
