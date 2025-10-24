// app/api/extract/route.js
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Service role for inserts (server-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function ensureCaseAccess(caseId, userId) {
  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("id, user_id")
    .eq("id", caseId)
    .single();

  if (caseError || !caseRow) {
    throw new Error(caseError?.message || "Case not found");
  }

  if (caseRow.user_id === userId) return true;

  const { data: memberRows, error: memberError } = await supabase
    .from("case_members")
    .select("member_id")
    .eq("case_id", caseId)
    .eq("member_id", userId);

  if (memberError) {
    throw new Error(memberError.message);
  }

  if (!memberRows || memberRows.length === 0) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  return true;
}

export async function POST(req) {
  try {
    const { filePath, fileName, userId, caseId, documentType, notes } = await req.json();
    if (!filePath || !fileName || !userId || !caseId) {
      return new Response("Missing filePath, fileName, caseId, or userId", { status: 400 });
    }

    await ensureCaseAccess(caseId, userId);

    // ✅ Download file from Supabase storage
    const { data, error: downloadError } = await supabase.storage
      .from("documents")
      .download(filePath);

    if (downloadError) throw downloadError;

    const text = await data.text();

    // ✅ AI step
    const prompt = `
You are a legal assistant AI. Read the following pleading text and extract
a list of required filings, supporting documents, and procedural steps.
Return your response as a clear, numbered checklist.

Pleading:
${text}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const checklist =
      completion.choices[0]?.message?.content?.trim() ||
      "No checklist generated.";

    // ✅ Save result to Supabase DB
    const { error: dbError } = await supabase.from("checklists").insert({
      user_id: userId,
      file_name: fileName,
      checklist,
      created_at: new Date().toISOString(),
      case_id: caseId,
      document_type: documentType || "General",
      notes: notes || null,
    });

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ checklist }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("AI extract error:", err);
    const status = err.status || 500;
    return new Response(err.message, { status });
  }
}
