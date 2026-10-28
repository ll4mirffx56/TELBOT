import fs from "node:fs/promises";

const baseUrl = process.env.AI_BASE_URL?.replace(/\/+$/, "");
const apiKey = process.env.AI_API_KEY;
const model = process.env.AI_MODEL;

export async function generateReply(messages) {
  if (!baseUrl || !apiKey || !model) {
    throw new Error("Missing AI_BASE_URL, AI_API_KEY, or AI_MODEL in environment variables");
  }

  const promptPath = process.env.SYSTEM_PROMPT_FILE || "persona/persona.md";
  const systemPrompt = await fs.readFile(promptPath, "utf8");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.8
    }),
    signal: AbortSignal.timeout(60000)
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || `AI provider returned HTTP ${response.status}`);
  }

  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("AI provider returned an empty reply");
  }
  return text.trim();
}
