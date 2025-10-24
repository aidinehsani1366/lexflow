import { supabaseAdmin, getUserFromRequest } from "../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data: ownerCases, error: ownerError } = await supabaseAdmin
      .from("cases")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (ownerError) throw ownerError;

    const { data: memberRows, error: memberError } = await supabaseAdmin
      .from("case_members")
      .select("case_id")
      .eq("member_id", user.id);

    if (memberError) throw memberError;

    let sharedCases = [];
    const memberCaseIds = (memberRows || []).map((row) => row.case_id);
    if (memberCaseIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("cases")
        .select("*")
        .in("id", memberCaseIds);
      if (error) throw error;
      sharedCases = data || [];
    }

    const caseMap = new Map();
    (ownerCases || []).forEach((item) => caseMap.set(item.id, item));
    sharedCases.forEach((item) => caseMap.set(item.id, item));

    const cases = Array.from(caseMap.values()).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    return jsonResponse({ data: cases });
  } catch (err) {
    console.error("GET /api/cases error:", err);
    const status = err.message === "Unauthorized" ? 401 : 500;
    return jsonResponse({ error: err.message || "Failed to fetch cases" }, status);
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { title } = await req.json();
    const trimmedTitle = title?.trim();
    if (!trimmedTitle) {
      return jsonResponse({ error: "Title is required" }, 400);
    }

    const { data, error } = await supabaseAdmin
      .from("cases")
      .insert({
        title: trimmedTitle,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return jsonResponse({ data }, 201);
  } catch (err) {
    console.error("POST /api/cases error:", err);
    const status = err.message === "Unauthorized" ? 401 : 500;
    return jsonResponse({ error: err.message || "Failed to create case" }, status);
  }
}
