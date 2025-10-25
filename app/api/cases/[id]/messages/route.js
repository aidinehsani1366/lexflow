import OpenAI from "openai";
import { supabaseAdmin, getUserFromRequest } from "../../../../../lib/serverSupabase";

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const EMBEDDING_MODEL = "text-embedding-3-small";
const MAX_CONTEXT_CHUNKS = 5;

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

async function fetchMessages(caseId) {
  const { data, error } = await supabaseAdmin
    .from("case_messages")
    .select("*")
    .eq("case_id", caseId)
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

export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const caseId = params.id;
    await ensureCaseAccess(caseId, user.id);

    const messages = await fetchMessages(caseId);
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

    const { content } = await req.json();
    const trimmedContent = content?.trim();
    if (!trimmedContent) {
      return jsonResponse({ error: "Message content is required" }, 400);
    }

    const { error: userMsgError } = await supabaseAdmin
      .from("case_messages")
      .insert({
        case_id: caseId,
        sender: "user",
        content: trimmedContent,
      })
      .select()
      .single();

    if (userMsgError) throw new Error(userMsgError.message);

    let aiContent = "I received your message and will analyze it shortly.";
    if (openaiClient) {
      try {
        const existingMessages = await fetchMessages(caseId);
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
          "Here is a reminder of your request. Please clarify if you need a checklist or summary.";
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
        sender: "ai",
        content: aiContent,
      })
      .select()
      .single();

    if (aiMsgError) throw new Error(aiMsgError.message);

    const messages = await fetchMessages(caseId);
    return jsonResponse({ data: messages });
  } catch (err) {
    console.error(`POST /api/cases/${params.id}/messages error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to send message" }, status);
  }
}
