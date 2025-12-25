import { supabaseAdmin, getUserFromRequest } from "../../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const caseId = params.id;
    const { data: caseRow, error } = await supabaseAdmin
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return jsonResponse({ error: "Case not found" }, 404);
      }
      throw error;
    }

    if (caseRow.user_id === user.id) {
      return jsonResponse({ data: caseRow });
    }

    const { data: membershipRows, error: membershipError } = await supabaseAdmin
      .from("case_members")
      .select("member_id")
      .eq("case_id", caseId)
      .eq("member_id", user.id);

    if (membershipError) throw membershipError;
    const isMember = (membershipRows || []).length > 0;
    if (!isMember) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    return jsonResponse({ data: caseRow });
  } catch (err) {
    console.error(`GET /api/cases/${params.id} error:`, err);
    const status =
      err.message === "Unauthorized" ? 401 : err.message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: err.message || "Failed to load case" }, status);
  }
}
