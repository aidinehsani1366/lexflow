import { supabaseAdmin, getUserFromRequest } from "../../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function fetchDocument(documentId) {
  const { data, error } = await supabaseAdmin
    .from("case_documents")
    .select("id, case_id, file_path")
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

  if (caseRow.user_id === userId) return;

  const { data: memberRows, error: memberError } = await supabaseAdmin
    .from("case_members")
    .select("member_id, role")
    .eq("case_id", caseId)
    .eq("member_id", userId);

  if (memberError) {
    const err = new Error(memberError.message);
    err.status = 500;
    throw err;
  }

  const member = memberRows?.[0];
  if (!member || !["editor", "owner"].includes(member.role)) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
}

export async function PATCH(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const document = await fetchDocument(params.id);
    await ensureCaseAccess(document.case_id, user.id);

    const { file_name, document_type, notes } = await req.json();

    const updates = {};
    if (file_name !== undefined) updates.file_name = file_name.trim() || "Untitled document";
    if (document_type !== undefined) updates.document_type = document_type || "General";
    if (notes !== undefined) updates.notes = notes || null;

    if (Object.keys(updates).length === 0) {
      return jsonResponse({ error: "No valid fields to update." }, 400);
    }

    const { data, error: updateError } = await supabaseAdmin
      .from("case_documents")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return jsonResponse({ data });
  } catch (err) {
    console.error(`PATCH /api/case-documents/${params.id} error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to update document" }, status);
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const document = await fetchDocument(params.id);
    await ensureCaseAccess(document.case_id, user.id);

    const { error: chunkError } = await supabaseAdmin
      .from("document_chunks")
      .delete()
      .eq("document_id", params.id);
    if (chunkError) throw chunkError;

    const { error: deleteError } = await supabaseAdmin
      .from("case_documents")
      .delete()
      .eq("id", params.id);
    if (deleteError) throw deleteError;

    if (document.file_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("documents")
        .remove([document.file_path]);
      if (storageError) {
        console.error("Failed to remove storage object:", storageError);
      }
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error(`DELETE /api/case-documents/${params.id} error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to delete document" }, status);
  }
}
