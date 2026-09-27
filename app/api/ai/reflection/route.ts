import OpenAI from "openai";
import { buildWeeklyReflectionPrompt, weeklyReflectionSystemPrompt } from "../../../lib/weekly-prompt";
import type { WeeklyAIContext } from "../../../lib/weekly-ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
  }

  let context: WeeklyAIContext;
  try {
    context = (await request.json()) as WeeklyAIContext;
  } catch {
    return Response.json({ error: "Invalid Weekly AI context." }, { status: 400 });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: weeklyReflectionSystemPrompt },
        { role: "user", content: buildWeeklyReflectionPrompt(context) },
      ],
    });
    const summary = completion.choices[0]?.message.content?.trim();
    if (!summary) {
      return Response.json({ error: "The model returned an empty summary." }, { status: 502 });
    }
    return Response.json({ summary });
  } catch (error) {
    console.error("Weekly AI reflection failed", error);
    return Response.json({ error: "Weekly AI reflection failed." }, { status: 502 });
  }
}
