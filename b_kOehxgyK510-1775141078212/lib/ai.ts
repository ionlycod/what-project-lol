import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Model can be changed via environment variable, defaults to gpt-4o-mini
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"

// Generate AI summary of student reactions
export async function generateSummary(
  topic: string,
  messages: string[]
): Promise<string> {
  if (messages.length === 0) {
    return "No student submissions yet."
  }

  const prompt = `You are summarizing real-time student feedback for a teacher during a live class.
Topic: ${topic || "General class discussion"}

Student messages (each line is a separate submission):
${messages.map((m) => `- ${m}`).join("\n")}

Provide a concise summary with:
1. Common questions or themes (grouped if similar)
2. Key comments or insights from students
3. Any urgent concerns or confusion

Keep it brief and actionable for the teacher.`

  const result = await generateText({
    model: openai(MODEL),
    prompt,
  })

  return result.text
}
