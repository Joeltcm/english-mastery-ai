import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { buildSystemPrompt } from "@/lib/learning";
import { consumePersistentRateLimit } from "@/lib/rate-limit";
import { modeSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to start live voice practice." }, { status: 401 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Add OPENAI_API_KEY to enable live voice practice." }, { status: 503 });
  const rate = await consumePersistentRateLimit(`voice-realtime:${session.user.id}`, 10, 3_600_000);
  if (!rate.allowed) return NextResponse.json({ error: `Too many live voice sessions. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const body = await request.json().catch(() => null);
  const parsed = z.object({ mode: modeSchema.optional() }).safeParse(body);
  const mode = parsed.success ? parsed.data.mode || "TUTOR" : "TUTOR";
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ session: { type: "realtime", model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime", instructions: `${buildSystemPrompt(mode)}\nThis is a live voice conversation. Never interrupt the learner. Keep replies concise enough for natural turn-taking. Correct meaningful English mistakes after the learner finishes speaking.` } }),
    });
  } catch {
    return NextResponse.json({ error: "The live voice provider could not be reached. Try again shortly." }, { status: 502 });
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return NextResponse.json({ error: data?.error?.message || "OpenAI could not start live voice practice." }, { status: 502 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
