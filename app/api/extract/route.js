// app/api/extract/route.js
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use service role key for DB inserts (⚠️ server-side only!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { text, fileName, userId } = await req.json();
    if (!text || !fileName || !userId) {
      return new Response("Missing text, fileName, or userId", { status: 400 });
    }

    // AI step
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

    // Save to Supabase DB
    const { error } = await supabase.from("checklists").insert({
      user_id: userId,
      file_name: fileName,
      checklist,
      created_at: new Date().toISOString()
    });

    if (error) throw error;

    return new Response(JSON.stringify({ checklist }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("AI extract error:", err);
    return new Response(err.message, { status: 500 });
  }
}
