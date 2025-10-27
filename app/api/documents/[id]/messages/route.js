import OpenAI from "openai";
import { supabaseAdmin, getUserFromRequest } from "../../../../../lib/serverSupabase";
import { extractTextFromArrayBuffer } from "../../../../../lib/documentText";

const openai = process.env.OPENAI_API_KEY && new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const EMBEDDING_MODEL = "text-embedding-3-small";
const MAX_CONTEXT_CHUNKS = 6;

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function fetchDocument(documentId) {
  const { data, error } = await supabaseAdmin
    .from("case_documents")
    .select("id, case_id, file_path, file_name")
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

async function ensureSession(documentId, sessionId) {
  const { data, error } = await supabaseAdmin
    .from("document_ai_sessions")
    .select("id, case_id")
    .eq("id", sessionId)
    .eq("document_id", documentId)
    .maybeSingle();

  if (error || !data) {
    const err = new Error("Session not found");
    err.status = 404;
    throw err;
  }
  return data;
}

async function fetchMessages(sessionId) {
  const { data, error } = await supabaseAdmin
    .from("document_ai_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

function cosineSimilarity(a = [], b = []) {
  if (!a.length || !b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function fetchChunkContext(documentId, questionEmbedding) {
  const { data, error } = await supabaseAdmin
    .from("document_chunks")
    .select("chunk_index, content, embedding")
    .eq("document_id", documentId)
    .limit(500);

  if (error) {
    console.error("Failed to load document chunks", error);
    return [];
  }

  if (!data?.length) return [];

  return data
    .map((row) => {
      const embeddingArray = Array.isArray(row.embedding)
        ? row.embedding
        : Array.isArray(row.embedding?.data)
        ? row.embedding.data
        : row.embedding
        ? Object.values(row.embedding)
        : [];
      return {
        label: `Chunk #${row.chunk_index + 1}`,
        content: row.content,
        score: cosineSimilarity(questionEmbedding, embeddingArray),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CONTEXT_CHUNKS)
    .filter((chunk) => chunk.score > 0);
}

export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const document = await fetchDocument(params.id);
    await ensureCaseAccess(document.case_id, user.id);

    const sessionId = new URL(req.url).searchParams.get("sessionId");
    if (!sessionId) return jsonResponse({ error: "sessionId query param is required" }, 400);
    await ensureSession(document.id, sessionId);

    const messages = await fetchMessages(sessionId);
    return jsonResponse({ data: messages });
  } catch (err) {
    console.error(`GET /api/documents/${params.id}/messages error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load document chat" }, status);
  }
}

export async function POST(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const document = await fetchDocument(params.id);
    await ensureCaseAccess(document.case_id, user.id);

    const sessionId = new URL(req.url).searchParams.get("sessionId");
    if (!sessionId) return jsonResponse({ error: "sessionId query param is required" }, 400);

    await ensureSession(document.id, sessionId);

    const { content } = await req.json();
    const trimmed = content?.trim();
    if (!trimmed) return jsonResponse({ error: "Message content is required" }, 400);

    const { error: insertError } = await supabaseAdmin
      .from("document_ai_messages")
      .insert({
        session_id: sessionId,
        document_id: document.id,
        role: "user",
        content: trimmed,
      });
    if (insertError) throw insertError;

    let assistantContent =
      "I received your question. Let me analyze the document and respond.";

    if (openai) {
      try {
        const history = await fetchMessages(sessionId);
        const chatHistory = history.map((msg) => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        }));

        let contextChunks = [];
        try {
          const embeddingResponse = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: trimmed,
          });
          const questionEmbedding = embeddingResponse.data[0]?.embedding || [];
          contextChunks = await fetchChunkContext(document.id, questionEmbedding);
        } catch (embeddingError) {
          console.error("Document embedding lookup failed", embeddingError);
        }

        if (!contextChunks.length && document.file_path) {
          try {
            const { data: fileData, error: downloadError } = await supabaseAdmin.storage
              .from("documents")
              .download(document.file_path);
            if (!downloadError && fileData) {
              const arrayBuffer = await fileData.arrayBuffer();
              let text = "";
              try {
                text = await extractTextFromArrayBuffer(arrayBuffer, {
                  mimeType: fileData.type,
                  fileName: document.file_name,
                });
              } catch (extractErr) {
                console.error("Document extraction failed", extractErr);
              }
              const excerpt = text.slice(0, 6000);
              if (excerpt) {
                contextChunks = [
                  {
                    label: document.file_name ? `${document.file_name} excerpt` : "Document excerpt",
                    content: excerpt,
                    score: 1,
                  },
                ];
              }
            }
          } catch (downloadErr) {
            console.error("Unable to fetch fallback document excerpt", downloadErr);
          }
        }

        if (!contextChunks.length) {
          assistantContent =
            "I couldn't find readable text in this document. It may be a scanned image or an unsupported format. Please provide a text-based version or share the relevant excerpts.";
        } else {
        const completionMessages = [
          {
            role: "system",
            content:
              "You are assisting with legal document analysis. Provide concise, professional answers. Cite chunk labels when referencing text.",
          },
          {
            role: "system",
            content: `Relevant document excerpts:\n${contextChunks
              .map((chunk) => `[${chunk.label}] ${chunk.content}`)
              .join("\n\n")}`,
          },
          ...chatHistory,
          { role: "user", content: trimmed },
        ];

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: completionMessages,
        });
        assistantContent =
          completion.choices[0]?.message?.content?.trim() || assistantContent;
        }
      } catch (aiError) {
        console.error("Document chat AI error", aiError);
        assistantContent =
          "I encountered an issue analyzing the document. Please try again or refine your request.";
      }
    }

    const { error: assistantError } = await supabaseAdmin
      .from("document_ai_messages")
      .insert({
        session_id: sessionId,
        document_id: document.id,
        role: "assistant",
        content: assistantContent,
      });
    if (assistantError) throw assistantError;

    const messages = await fetchMessages(sessionId);
    return jsonResponse({ data: messages });
  } catch (err) {
    console.error(`POST /api/documents/${params.id}/messages error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to process message" }, status);
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const document = await fetchDocument(params.id);
    await ensureCaseAccess(document.case_id, user.id);

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    const messageId = url.searchParams.get("messageId");
    if (!sessionId || !messageId) {
      return jsonResponse(
        { error: "sessionId and messageId query params are required" },
        400
      );
    }

    await ensureSession(document.id, sessionId);

    const { data: existingMessage, error: existingError } = await supabaseAdmin
      .from("document_ai_messages")
      .select("id")
      .eq("id", messageId)
      .eq("session_id", sessionId)
      .eq("document_id", document.id)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existingMessage) {
      return jsonResponse({ error: "Message not found" }, 404);
    }

    const { error: deleteError } = await supabaseAdmin
      .from("document_ai_messages")
      .delete()
      .eq("id", messageId)
      .eq("session_id", sessionId)
      .eq("document_id", document.id);
    if (deleteError) throw deleteError;

    const messages = await fetchMessages(sessionId);
    return jsonResponse({ data: messages });
  } catch (err) {
    console.error(`DELETE /api/documents/${params.id}/messages error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to delete document message" }, status);
  }
}
