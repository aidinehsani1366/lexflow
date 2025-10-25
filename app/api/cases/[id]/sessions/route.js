import { supabaseAdmin, getUserFromRequest } from "../../../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function ensureCaseAccess(caseId, userId) {
  const { data: caseRow, error } = await supabaseAdmin
    .from("cases")
    .select("id, user_id")
    .eq("id", caseId)
    .single();

  if (error || !caseRow) {
    const errMessage = error?.code === "PGRST116" ? "Case not found" : error?.message;
    const err = new Error(errMessage || "Case not found");
    err.status = error?.code === "PGRST116" ? 404 : 500;
    throw err;
  }

  if (caseRow.user_id === userId) return caseRow;

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("case_members")
    .select("member_id")
    .eq("case_id", caseId)
    .eq("member_id", userId);

  if (membershipError) {
    const err = new Error(membershipError.message);
    err.status = 500;
    throw err;
  }

  if (!membership || membership.length === 0) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  return caseRow;
}

async function ensureDefaultSession(caseId, userId) {
  const { data, error } = await supabaseAdmin
    .from("case_sessions")
    .select("id")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) throw error;
  if (data?.length) return data[0];

  const { data: session, error: insertError } = await supabaseAdmin
    .from("case_sessions")
    .insert({ case_id: caseId, user_id: userId, title: "General" })
    .select()
    .single();

  if (insertError) throw insertError;
  return session;
}

export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const caseRow = await ensureCaseAccess(params.id, user.id);
    await ensureDefaultSession(caseRow.id, caseRow.user_id);

    const { data, error } = await supabaseAdmin
      .from("case_sessions")
      .select("id, title, created_at")
      .eq("case_id", caseRow.id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return jsonResponse({ data: data || [] });
  } catch (err) {
    console.error(`GET /api/cases/${params.id}/sessions error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load sessions" }, status);
  }
}

export async function POST(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const caseRow = await ensureCaseAccess(params.id, user.id);
    const { title } = await req.json();
    const trimmed = title?.trim();
    if (!trimmed) {
      return jsonResponse({ error: "Title is required." }, 400);
    }

    const { data, error } = await supabaseAdmin
      .from("case_sessions")
      .insert({ case_id: caseRow.id, user_id: user.id, title: trimmed })
      .select()
      .single();

    if (error) throw error;
    return jsonResponse({ data }, 201);
  } catch (err) {
    console.error(`POST /api/cases/${params.id}/sessions error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to create session" }, status);
  }
}
