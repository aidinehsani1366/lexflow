import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text) return new Response("Missing text", { status: 400 });

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

    const checklist = completion.choices[0]?.message?.content?.trim() || "No checklist generated.";

    return new Response(JSON.stringify({ checklist }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("AI extract error:", err);
    return new Response(err.message, { status: 500 });
  }
}
