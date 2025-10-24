import OpenAI from "openai";
import { supabaseAdmin, getUserFromRequest } from "../../../../../lib/serverSupabase";

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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

        const completion = await openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are LexFlow, an AI legal analyst. Provide concise, actionable answers without giving formal legal advice.",
            },
            ...chatHistory,
          ],
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
