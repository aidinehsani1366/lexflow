import { supabaseAdmin, getUserFromRequest } from "../../../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function fetchDocument(documentId) {
  const { data, error } = await supabaseAdmin
    .from("case_documents")
    .select("id, case_id")
    .eq("id", documentId)
    .maybeSingle();

  if (error || !data) {
    const err = new Error(error?.code === "PGRST116" ? "Document not found" : error?.message);
    err.status = error?.code === "PGRST116" ? 404 : 500;
    throw err;
  }
  return data;
}

async function ensureCaseAccess(caseId, userId) {
  const { data: caseRow, error } = await supabaseAdmin
    .from("cases")
    .select("id, user_id")
    .eq("id", caseId)
    .single();

  if (error || !caseRow) {
    const err = new Error(error?.code === "PGRST116" ? "Case not found" : error?.message);
    err.status = error?.code === "PGRST116" ? 404 : 500;
    throw err;
  }

  if (caseRow.user_id === userId) return caseRow;

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

  if (!memberRows || memberRows.length === 0) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  return caseRow;
}

async function ensureDefaultSession(documentId, caseId, userId) {
  const { data, error } = await supabaseAdmin
    .from("document_ai_sessions")
    .select("id")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) throw error;
  if (data?.length) return data[0];

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("document_ai_sessions")
    .insert({ document_id: documentId, case_id: caseId, created_by: userId, title: "Document chat" })
    .select()
    .single();

  if (insertError) throw insertError;
  return inserted;
}

export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const document = await fetchDocument(params.id);
    await ensureCaseAccess(document.case_id, user.id);
    await ensureDefaultSession(document.id, document.case_id, user.id);

    const { data, error } = await supabaseAdmin
      .from("document_ai_sessions")
      .select("id, title, created_at")
      .eq("document_id", document.id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return jsonResponse({ data: data || [] });
  } catch (err) {
    console.error(`GET /api/documents/${params.id}/sessions error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load sessions" }, status);
  }
}

export async function POST(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const document = await fetchDocument(params.id);
    await ensureCaseAccess(document.case_id, user.id);

    const { title } = await req.json();
    const trimmed = title?.trim() || "Document chat";

    const { data, error } = await supabaseAdmin
      .from("document_ai_sessions")
      .insert({ document_id: document.id, case_id: document.case_id, created_by: user.id, title: trimmed })
      .select()
      .single();

    if (error) throw error;

    return jsonResponse({ data }, 201);
  } catch (err) {
    console.error(`POST /api/documents/${params.id}/sessions error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to create session" }, status);
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const document = await fetchDocument(params.id);
    await ensureCaseAccess(document.case_id, user.id);

    const sessionId = new URL(req.url).searchParams.get("sessionId");
    if (!sessionId) return jsonResponse({ error: "sessionId query param is required" }, 400);

    const { error: deleteMessagesError } = await supabaseAdmin
      .from("document_ai_messages")
      .delete()
      .eq("session_id", sessionId);
    if (deleteMessagesError) throw deleteMessagesError;

    const { error: deleteSessionError } = await supabaseAdmin
      .from("document_ai_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("document_id", document.id);
    if (deleteSessionError) throw deleteSessionError;

    return jsonResponse({ success: true });
  } catch (err) {
    console.error(`DELETE /api/documents/${params.id}/sessions error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to delete document chat" }, status);
  }
}
