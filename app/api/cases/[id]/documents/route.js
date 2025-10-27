import OpenAI from "openai";
import { supabaseAdmin, getUserFromRequest } from "../../../../../lib/serverSupabase";
import { extractTextFromArrayBuffer } from "../../../../../lib/documentText";

const openai =
  process.env.OPENAI_API_KEY && new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHUNK_CHAR_LIMIT = 1200;
const MAX_CONTEXT_CHARS = 40_000;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const EMBEDDING_MODEL = "text-embedding-3-small";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function chunkText(text) {
  const chunks = [];
  let start = 0;
  let index = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_CHAR_LIMIT, text.length);
    const slice = text.slice(start, end).trim();
    if (slice) {
      chunks.push({ index, content: slice });
      index += 1;
    }
    start = end;
  }
  return chunks;
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

async function buildChunks(documentId, text) {
  const chunks = chunkText(text);
  if (!chunks.length || !openai) return;

  try {
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: chunks.map((chunk) => chunk.content),
    });

    const rows = chunks.map((chunk, idx) => ({
      document_id: documentId,
      chunk_index: chunk.index,
      content: chunk.content,
      embedding: embeddingResponse.data[idx]?.embedding || null,
    }));

    if (rows.length) {
      await supabaseAdmin.from("document_chunks").insert(rows);
    }
  } catch (err) {
    console.error("Failed to generate embeddings:", err);
  }
}

export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const caseId = params.id;
    await ensureCaseAccess(caseId, user.id);

    const { data, error } = await supabaseAdmin
      .from("case_documents")
      .select("id, file_name, file_path, created_at, document_type, notes, file_size, mime_type")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return jsonResponse({ data: data || [] });
  } catch (err) {
    console.error(`GET /api/cases/${params.id}/documents error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load documents" }, status);
  }
}

export async function POST(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const caseId = params.id;
    await ensureCaseAccess(caseId, user.id);

    const { filePath, fileName, fileSize, mimeType, documentType, notes } = await req.json();
    if (!filePath || !fileName) {
      return jsonResponse({ error: "filePath and fileName are required" }, 400);
    }

    const { data, error: downloadError } = await supabaseAdmin.storage
      .from("documents")
      .download(filePath);

    if (downloadError) throw downloadError;
    if (!data) {
      return jsonResponse({ error: "File could not be downloaded" }, 400);
    }

    if (data.size > MAX_FILE_BYTES) {
      return jsonResponse({ error: "File exceeds 5MB limit." }, 413);
    }

    const arrayBuffer = await data.arrayBuffer();
    let text = "";
    try {
      text = await extractTextFromArrayBuffer(arrayBuffer, {
        mimeType: mimeType || data.type,
        fileName,
      });
    } catch (extractErr) {
      console.error("Document extraction failed", extractErr);
    }
    let truncated = false;
    if (text.length > MAX_CONTEXT_CHARS) {
      text = text.slice(0, MAX_CONTEXT_CHARS);
      truncated = true;
    }

    const { data: document, error: insertError } = await supabaseAdmin
      .from("case_documents")
      .insert({
        case_id: caseId,
        user_id: user.id,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize || data.size,
        mime_type: mimeType || data.type || "application/octet-stream",
        document_type: documentType || "General",
        notes: notes || null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    await buildChunks(document.id, text);

    return jsonResponse({ data: { ...document, truncated } }, 201);
  } catch (err) {
    console.error(`POST /api/cases/${params.id}/documents error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to store document" }, status);
  }
}
