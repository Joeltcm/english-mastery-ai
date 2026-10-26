import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumePersistentRateLimit } from "@/lib/rate-limit";
import { recordStudySession } from "@/lib/study";

const attemptSchema = z.object({ score: z.number().int().min(0).max(100).optional(), answers: z.array(z.object({ prompt: z.string().max(200), answer: z.string().max(500), correct: z.boolean() })).max(50).optional(), timezone: z.string().trim().max(100).optional() });

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to save lesson progress." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ saved: false, databaseConfigured: false });
  const rate = await consumePersistentRateLimit(`lesson-attempt:${session.user.id}`, 30, 3_600_000);
  if (!rate.allowed) return NextResponse.json({ error: `Too many lesson updates. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const parsed = attemptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The lesson result is invalid." }, { status: 400 });
  const { slug } = await context.params;
  const lesson = await db.lesson.findUnique({ where: { slug }, select: { id: true, estimatedMin: true, type: true } });
  if (!lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  const attempt = await db.lessonAttempt.create({ data: { userId: session.user.id, lessonId: lesson.id, score: parsed.data.score, answers: parsed.data.answers, completedAt: new Date() } });
  await recordStudySession(session.user.id, { activity: "adaptive-lesson", minutes: lesson.estimatedMin, timeZone: parsed.data.timezone, metadata: { lessonSlug: slug, score: parsed.data.score ?? null } });
  if (parsed.data.score !== undefined) {
    const profile = await db.learningProfile.findUnique({ where: { userId: session.user.id }, select: { grammarScore: true, vocabularyScore: true } });
    const field = lesson.type === "VOCABULARY" ? "vocabularyScore" : "grammarScore";
    const current = profile?.[field] ?? (field === "vocabularyScore" ? 48 : 62);
    await db.learningProfile.upsert({ where: { userId: session.user.id }, update: { [field]: Math.round((current * 0.8) + (parsed.data.score * 0.2)) }, create: { userId: session.user.id, [field]: parsed.data.score } });
  }
  return NextResponse.json({ saved: true, attemptId: attempt.id }, { status: 201 });
}
