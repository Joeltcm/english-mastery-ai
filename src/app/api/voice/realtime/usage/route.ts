import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumePersistentRateLimit } from "@/lib/rate-limit";
import { estimateRealtimeCostUsd, monthStart, monthlyBudgetDefault, recordAiUsageEvent } from "@/lib/usage";
import { modeSchema } from "@/lib/validation";
import { isVoiceName } from "@/lib/voice";

const usageSchema = z.object({ durationSeconds: z.number().int().min(1).max(7_200), mode: modeSchema.optional(), voice: z.string().optional() });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to record live voice usage." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "PostgreSQL is not configured." }, { status: 503 });
  const rate = await consumePersistentRateLimit(`voice-realtime-usage:${session.user.id}`, 30, 3_600_000);
  if (!rate.allowed) return NextResponse.json({ error: `Too many voice usage updates. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const parsed = usageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The live voice usage details are invalid." }, { status: 400 });
  const estimatedCost = estimateRealtimeCostUsd(parsed.data.durationSeconds);
  if (estimatedCost > 0) {
    const [profile, aggregate] = await Promise.all([
      db.learningProfile.findUnique({ where: { userId: session.user.id }, select: { monthlyBudgetUsd: true } }),
      db.aiUsageEvent.aggregate({ where: { userId: session.user.id, createdAt: { gte: monthStart() } }, _sum: { estimatedCostUsd: true } }),
    ]);
    const budget = profile?.monthlyBudgetUsd ?? monthlyBudgetDefault();
    if (budget > 0 && (aggregate._sum.estimatedCostUsd || 0) + estimatedCost >= budget) return NextResponse.json({ error: "This live voice session would exceed your monthly AI budget." }, { status: 429 });
  }
  await recordAiUsageEvent({ userId: session.user.id, provider: "openai", model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime", kind: "voice_realtime_duration", estimatedCostUsd: estimatedCost, metadata: { durationSeconds: parsed.data.durationSeconds, mode: parsed.data.mode || "TUTOR", ...(isVoiceName(parsed.data.voice) ? { voice: parsed.data.voice } : {}) } });
  return NextResponse.json({ recorded: true, estimatedCostUsd: estimatedCost });
}
