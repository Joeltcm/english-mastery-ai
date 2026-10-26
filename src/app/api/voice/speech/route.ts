import OpenAI from "openai";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { consumePersistentRateLimit } from "@/lib/rate-limit";
import { estimateTtsCostUsd, recordAiUsageEvent } from "@/lib/usage";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to use the voice coach." }, { status: 401 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OpenAI voice is not configured." }, { status: 503 });
  const rate = await consumePersistentRateLimit(`voice-speech:${session.user.id}`, 30);
  if (!rate.allowed) return NextResponse.json({ error: `Too many voice requests. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const body = await request.json().catch(() => null) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 4_096) return NextResponse.json({ error: "Voice text must be between 1 and 4,096 characters." }, { status: 400 });

  const model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let speech;
  try {
    speech = await client.audio.speech.create({ model, voice: process.env.OPENAI_TTS_VOICE || "coral", input: text, response_format: "mp3", ...(model.includes("gpt-4o-mini-tts") ? { instructions: "Warm, clear English teacher voice. Natural pauses, encouraging tone, moderate pace." } : {}) });
  } catch {
    return NextResponse.json({ error: "The AI voice provider could not generate audio." }, { status: 502 });
  }
  void recordAiUsageEvent({ userId: session.user.id, provider: "openai", model, kind: "voice_tts", estimatedCostUsd: estimateTtsCostUsd(text.length), metadata: { characters: text.length } });
  return new Response(await speech.arrayBuffer(), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}
