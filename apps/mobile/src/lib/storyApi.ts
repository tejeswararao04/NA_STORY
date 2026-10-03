export type StoryResult = { story: string; source: "ai-service" | "gemini-direct" | "mock" };

const AI_URL = process.env.EXPO_PUBLIC_AI_URL ?? "";
const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";

function mockStory(name: string, prompt: string): string {
  const hero = name.trim() || "our hero";
  const idea = prompt.trim() || "a magical journey";
  return (
    `Once upon a time, ${hero} discovered ${idea}.\n\n` +
    `Along the way there were photos to remember, voice notes to keep, and a little courage that grew with every step.\n\n` +
    `And from that day, every evening became a new story. (mock — add a free API key to get AI stories)`
  );
}

/**
 * Order: 1) local AI service  2) Gemini direct  3) offline mock.
 * Later your finetuned model just replaces the AI service — app code stays the same.
 */
export async function generateStory(input: { name: string; prompt: string }): Promise<StoryResult> {
  // 1) AI service (services/ai) — recommended path
  if (AI_URL) {
    try {
      const r = await fetch(`${AI_URL.replace(/\/$/, "")}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: input.name, prompt: input.prompt }),
      });
      if (r.ok) {
        const j = await r.json();
        if (j?.story) return { story: String(j.story), source: "ai-service" };
      }
    } catch {
      // fall through to next option
    }
  }

  // 2) Gemini free key direct from app (dev only — move to backend before launch)
  if (GEMINI_KEY) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Write a short warm bedtime story (150-200 words) for ${input.name || "a child"} about: ${input.prompt}. Simple language, happy ending.`,
                },
              ],
            },
          ],
        }),
      }
    );
    if (!r.ok) throw new Error("Gemini error " + r.status);
    const j = await r.json();
    const text = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
    if (text) return { story: text, source: "gemini-direct" };
  }

  // 3) Offline mock — always works, $0
  return { story: mockStory(input.name, input.prompt), source: "mock" };
}
