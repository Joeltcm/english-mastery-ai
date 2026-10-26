import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

const attemptSchema = z.object({ score: z.number().int().min(0).max(100).optional(), answers: z.array(z.object({ prompt: z.string().max(200), answer: z.string().max(500), correct: z.boolean() })).max(50).optional() });

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to save lesson progress." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ saved: false, databaseConfigured: false });
  const rate = consumeRateLimit(`lesson-attempt:${session.user.id}`, 30, 3_600_000);
  if (!rate.allowed) return NextResponse.json({ error: `Too many lesson updates. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const parsed = attemptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The lesson result is invalid." }, { status: 400 });
  const { slug } = await context.params;
  const lesson = await db.lesson.findUnique({ where: { slug }, select: { id: true, estimatedMin: true } });
  if (!lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  const attempt = await db.lessonAttempt.create({ data: { userId: session.user.id, lessonId: lesson.id, score: parsed.data.score, answers: parsed.data.answers, completedAt: new Date() } });
  await db.studySession.create({ data: { userId: session.user.id, activity: "adaptive-lesson", minutes: lesson.estimatedMin, completedAt: new Date(), metadata: { lessonSlug: slug, score: parsed.data.score ?? null } } });
  return NextResponse.json({ saved: true, attemptId: attempt.id }, { status: 201 });
}
