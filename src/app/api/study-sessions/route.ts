import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { consumePersistentRateLimit } from "@/lib/rate-limit";
import { recordStudySession } from "@/lib/study";

const studySessionSchema = z.object({
  activity: z.enum(["initial-assessment", "adaptive-lesson", "vocabulary-review", "voice-conversation", "realtime-voice", "text-conversation"]),
  minutes: z.number().int().min(1).max(60),
  metadata: z.record(z.string().trim().min(1).max(40), z.unknown()).optional().refine((value) => !value || JSON.stringify(value).length <= 2_000),
  timezone: z.string().trim().max(100).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to record study time." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "PostgreSQL is not configured." }, { status: 503 });
  const rate = await consumePersistentRateLimit(`study-session:${session.user.id}`, 60, 3_600_000);
  if (!rate.allowed) return NextResponse.json({ error: `Too many study-session updates. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const parsed = studySessionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The study session details are invalid." }, { status: 400 });
  const metadata = parsed.data.metadata ? parsed.data.metadata as Prisma.InputJsonValue : undefined;
  const recorded = await recordStudySession(session.user.id, { activity: parsed.data.activity, minutes: parsed.data.minutes, metadata, timeZone: parsed.data.timezone });
  return NextResponse.json({ saved: true, id: recorded.created.id, totalStudyMinutes: recorded.totalStudyMinutes, currentStreak: recorded.currentStreak }, { status: 201 });
}
