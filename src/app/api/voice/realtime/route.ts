import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { buildSystemPrompt } from "@/lib/learning";
import { consumePersistentRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/prisma";
import { estimateRealtimeCostUsd, monthStart, monthlyBudgetDefault, recordAiUsageEvent } from "@/lib/usage";
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
  const minimumSessionCost = estimateRealtimeCostUsd(60);
  if (minimumSessionCost > 0 && process.env.DATABASE_URL) {
    const [profile, aggregate] = await Promise.all([
      db.learningProfile.findUnique({ where: { userId: session.user.id }, select: { monthlyBudgetUsd: true } }),
      db.aiUsageEvent.aggregate({ where: { userId: session.user.id, createdAt: { gte: monthStart() } }, _sum: { estimatedCostUsd: true } }),
    ]);
    const budget = profile?.monthlyBudgetUsd ?? monthlyBudgetDefault();
    if (budget > 0 && (aggregate._sum.estimatedCostUsd || 0) + minimumSessionCost >= budget) return NextResponse.json({ error: "Your monthly AI budget does not allow another live voice session." }, { status: 429 });
  }
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
  void recordAiUsageEvent({ userId: session.user.id, provider: "openai", model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime", kind: "voice_realtime_session", metadata: { mode } });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
