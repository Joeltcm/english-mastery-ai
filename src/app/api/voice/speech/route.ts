import OpenAI from "openai";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumePersistentRateLimit } from "@/lib/rate-limit";
import { estimateTtsCostUsd, monthStart, monthlyBudgetDefault, recordAiUsageEvent } from "@/lib/usage";

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
  const estimatedCost = estimateTtsCostUsd(text.length);
  if (estimatedCost > 0 && process.env.DATABASE_URL) {
    const [profile, aggregate] = await Promise.all([
      db.learningProfile.findUnique({ where: { userId: session.user.id }, select: { monthlyBudgetUsd: true } }),
      db.aiUsageEvent.aggregate({ where: { userId: session.user.id, createdAt: { gte: monthStart() } }, _sum: { estimatedCostUsd: true } }),
    ]);
    const budget = profile?.monthlyBudgetUsd ?? monthlyBudgetDefault();
    if (budget > 0 && (aggregate._sum.estimatedCostUsd || 0) + estimatedCost >= budget) return NextResponse.json({ error: "Your monthly AI budget would be exceeded by this voice request. Update the budget in Settings or add the current TTS pricing." }, { status: 429 });
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let speech;
  try {
    speech = await client.audio.speech.create({ model, voice: process.env.OPENAI_TTS_VOICE || "coral", input: text, response_format: "mp3", ...(model.includes("gpt-4o-mini-tts") ? { instructions: "Warm, clear English teacher voice. Natural pauses, encouraging tone, moderate pace." } : {}) });
  } catch {
    return NextResponse.json({ error: "The AI voice provider could not generate audio." }, { status: 502 });
  }
  void recordAiUsageEvent({ userId: session.user.id, provider: "openai", model, kind: "voice_tts", estimatedCostUsd: estimatedCost, metadata: { characters: text.length } });
  return new Response(await speech.arrayBuffer(), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}
