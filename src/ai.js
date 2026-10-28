import fs from "node:fs/promises";

const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
const apiKey = process.env.AI_API_KEY;
const model = process.env.AI_MODEL;

function getMessageText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map(part => typeof part?.text === "string" ? part.text : "").join("\n");
  }
  return "";
}

async function generateGeminiReply(messages, systemPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const contents = messages
    .map(message => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: getMessageText(message.content) }]
    }))
    .filter(message => message.parts[0].text.trim());

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.8, maxOutputTokens: 1024 }
    }),
    signal: AbortSignal.timeout(60000)
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || `Gemini API returned HTTP ${response.status}`);
  }

  const text = body?.candidates?.[0]?.content?.parts
    ?.map(part => typeof part.text === "string" ? part.text : "")
    .join("")
    .trim();

  if (!text) {
    const reason = body?.promptFeedback?.blockReason || body?.candidates?.[0]?.finishReason;
    throw new Error(reason ? `Gemini returned no text (reason: ${reason})` : "Gemini returned an empty reply");
  }
  return text;
}

async function generateOpenAICompatibleReply(messages, systemPrompt) {
  const baseUrl = process.env.AI_BASE_URL?.replace(/\/+$/, "");
  if (!baseUrl) throw new Error("AI_BASE_URL is required for the openai-compatible provider");

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

export async function generateReply(messages) {
  if (!apiKey || !model) {
    throw new Error("Missing AI_API_KEY or AI_MODEL in environment variables");
  }

  const promptPath = process.env.SYSTEM_PROMPT_FILE || "persona/persona.md";
  const systemPrompt = await fs.readFile(promptPath, "utf8");

  if (provider === "gemini") return generateGeminiReply(messages, systemPrompt);
  if (provider === "openai-compatible") return generateOpenAICompatibleReply(messages, systemPrompt);

  throw new Error("AI_PROVIDER must be 'gemini' or 'openai-compatible'");
}
