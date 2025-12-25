import OpenAI from "openai";
import { supabaseAdmin, getUserFromRequest } from "../../../../../lib/serverSupabase";
import { extractTextFromArrayBuffer } from "../../../../../lib/documentText";

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const EMBEDDING_MODEL = "text-embedding-3-small";
const MAX_CONTEXT_CHUNKS = 5;
const MAX_NAME_MATCH_DOCUMENTS = 2;
const MAX_NAME_MATCH_CHUNKS = 3;
const MAX_FALLBACK_CONTEXT_CHARS = 4000;

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

async function ensureSession(caseId, sessionId) {
  const { data, error } = await supabaseAdmin
    .from("case_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("case_id", caseId)
    .single();

  if (error || !data) {
    const err = new Error("Session not found");
    err.status = 404;
    throw err;
  }

  return data;
}

async function fetchMessages(caseId, sessionId) {
  const { data, error } = await supabaseAdmin
    .from("case_messages")
    .select("*")
    .eq("case_id", caseId)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
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

async function fetchChunkContext(caseId, questionEmbedding) {
  const { data, error } = await supabaseAdmin
    .from("document_chunks")
    .select("chunk_index, content, embedding, case_documents!inner(file_name, case_id)")
    .eq("case_documents.case_id", caseId)
    .limit(200);

  if (error) {
    console.error("Failed to load chunks:", error);
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
        label: `${row.case_documents?.file_name || "Document"}#${row.chunk_index + 1}`,
        content: row.content,
        score: cosineSimilarity(questionEmbedding, embeddingArray),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CONTEXT_CHUNKS)
    .filter((chunk) => chunk.score > 0);
}

function normalizeForMatch(value = "") {
  return value
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

async function fetchNameMatchContext(caseId, question) {
  const normalizedQuestion = normalizeForMatch(question || "");
  if (!normalizedQuestion) return [];

  const { data: docs, error: docsError } = await supabaseAdmin
    .from("case_documents")
    .select("id, file_name, file_path, mime_type")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (docsError) {
    console.error("Failed to load documents for name matching:", docsError);
    return [];
  }
  if (!docs?.length) return [];

  const matches = [];
  docs.forEach((doc) => {
    if (!doc?.file_name) return;
    const normalizedDoc = normalizeForMatch(doc.file_name);
    if (!normalizedDoc) return;
    if (normalizedQuestion.includes(normalizedDoc)) {
      matches.push(doc);
    }
  });

  if (!matches.length) return [];

  const contexts = [];
  const limitedMatches = matches.slice(0, MAX_NAME_MATCH_DOCUMENTS);
  for (const doc of limitedMatches) {
    try {
      const { data: chunkData, error: chunkError } = await supabaseAdmin
        .from("document_chunks")
        .select("chunk_index, content")
        .eq("document_id", doc.id)
        .order("chunk_index", { ascending: true })
        .limit(MAX_NAME_MATCH_CHUNKS);

      if (chunkError) {
        console.error("Failed to load document chunks for name match:", chunkError);
      }

      if (chunkData?.length) {
        contexts.push({
          label: `${doc.file_name}#${(chunkData[0]?.chunk_index || 0) + 1}`,
          content: chunkData.map((chunk) => chunk.content).join("\n\n"),
          score: 1,
        });
        continue;
      }

      if (doc.file_path) {
        try {
          const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from("documents")
            .download(doc.file_path);
          if (downloadError || !fileData) continue;
          const arrayBuffer = await fileData.arrayBuffer();
          let text = "";
          try {
            text = await extractTextFromArrayBuffer(arrayBuffer, {
              mimeType: doc.mime_type || fileData.type,
              fileName: doc.file_name,
            });
          } catch (extractErr) {
            console.error("Name match extraction failed:", extractErr);
          }
          const excerpt = text.slice(0, MAX_FALLBACK_CONTEXT_CHARS).trim();
          if (excerpt) {
            contexts.push({
              label: `${doc.file_name} excerpt`,
              content: excerpt,
              score: 1,
            });
          }
        } catch (downloadErr) {
          console.error("Name match download failed:", downloadErr);
        }
      }
    } catch (err) {
      console.error("Name match context build failure:", err);
    }
  }
  return contexts;
}

export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const caseId = params.id;
    await ensureCaseAccess(caseId, user.id);
    const sessionId = new URL(req.url).searchParams.get("sessionId");
    if (!sessionId) {
      return jsonResponse({ error: "sessionId query param is required" }, 400);
    }
    await ensureSession(caseId, sessionId);

    const messages = await fetchMessages(caseId, sessionId);
    return jsonResponse({ data: messages });
  } catch (err) {
    console.error(`GET /api/cases/${params.id}/messages error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load messages" }, status);
  }
}

export async function POST(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const caseId = params.id;
    await ensureCaseAccess(caseId, user.id);
    const sessionId = new URL(req.url).searchParams.get("sessionId");
    if (!sessionId) {
      return jsonResponse({ error: "sessionId query param is required" }, 400);
    }
    await ensureSession(caseId, sessionId);

    const { content } = await req.json();
    const trimmedContent = content?.trim();
    if (!trimmedContent) {
      return jsonResponse({ error: "Message content is required" }, 400);
    }

    const { error: userMsgError } = await supabaseAdmin
      .from("case_messages")
      .insert({
        case_id: caseId,
        session_id: sessionId,
        user_id: user.id,
        sender: "user",
        content: trimmedContent,
      })
      .select()
      .single();

    if (userMsgError) throw new Error(userMsgError.message);

    let aiContent = "I received your message and will analyze it shortly.";
    if (openaiClient) {
      try {
        const existingMessages = await fetchMessages(caseId, sessionId);
        const chatHistory = existingMessages.map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content,
        }));

        let contextChunks = [];
        try {
          const embeddingResponse = await openaiClient.embeddings.create({
            model: EMBEDDING_MODEL,
            input: trimmedContent,
          });
          const questionEmbedding = embeddingResponse.data[0]?.embedding || [];
          contextChunks = await fetchChunkContext(caseId, questionEmbedding);
        } catch (embeddingError) {
          console.error("Failed to build context chunks:", embeddingError);
        }

        try {
          const nameMatchChunks = await fetchNameMatchContext(caseId, trimmedContent);
          if (nameMatchChunks?.length) {
            const existingLabels = new Set(contextChunks.map((chunk) => chunk.label));
            nameMatchChunks.forEach((chunk) => {
              if (!existingLabels.has(chunk.label)) {
                contextChunks.push(chunk);
              }
            });
          }
        } catch (nameMatchError) {
          console.error("Failed to build name-based context:", nameMatchError);
        }

        const contextMessage = contextChunks.length
          ? {
              role: "system",
              content: `Relevant document excerpts (cite using the bracketed labels):\n${contextChunks
                .map((chunk) => `[${chunk.label}] ${chunk.content}`)
                .join("\n\n")}`,
            }
          : null;

        const completionMessages = [
          {
            role: "system",
            content:
              "You are LexFlow, an AI legal analyst. Provide concise, actionable answers without giving formal legal advice. When referencing documents, cite them using the provided labels in square brackets.",
          },
          ...(contextMessage ? [contextMessage] : []),
          ...chatHistory,
        ];

        const completion = await openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: completionMessages,
        });

        aiContent =
          completion.choices[0]?.message?.content?.trim() ||
          "Here is a reminder of your request. Let me know if you need a summary, next steps, or something more specific.";
      } catch (aiError) {
        console.error("AI chat completion failed:", aiError);
        aiContent = "I could not reach the AI service. Please try again in a moment.";
      }
    } else {
      aiContent = "AI is not configured yet. Please set OPENAI_API_KEY to enable responses.";
    }

    const { error: aiMsgError } = await supabaseAdmin
      .from("case_messages")
      .insert({
        case_id: caseId,
        session_id: sessionId,
        sender: "ai",
        content: aiContent,
      })
      .select()
      .single();

    if (aiMsgError) throw new Error(aiMsgError.message);

    const messages = await fetchMessages(caseId, sessionId);
    return jsonResponse({ data: messages });
  } catch (err) {
    console.error(`POST /api/cases/${params.id}/messages error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to send message" }, status);
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const caseId = params.id;
    await ensureCaseAccess(caseId, user.id);

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    const messageId = url.searchParams.get("messageId");
    if (!sessionId || !messageId) {
      return jsonResponse(
        { error: "sessionId and messageId query params are required" },
        400
      );
    }
    await ensureSession(caseId, sessionId);

    const { data: existingMessage, error: existingError } = await supabaseAdmin
      .from("case_messages")
      .select("id")
      .eq("id", messageId)
      .eq("case_id", caseId)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existingMessage) {
      return jsonResponse({ error: "Message not found" }, 404);
    }

    const { error: deleteError } = await supabaseAdmin
      .from("case_messages")
      .delete()
      .eq("id", messageId)
      .eq("case_id", caseId)
      .eq("session_id", sessionId);
    if (deleteError) throw deleteError;

    const messages = await fetchMessages(caseId, sessionId);
    return jsonResponse({ data: messages });
  } catch (err) {
    console.error(`DELETE /api/cases/${params.id}/messages error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to delete message" }, status);
  }
}
