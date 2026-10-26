import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

const assessmentSchema = z.object({ kind: z.string().trim().min(2).max(40), level: z.string().trim().min(2).max(10), scores: z.record(z.string(), z.number().min(0).max(100)), answers: z.array(z.object({ questionId: z.string().max(40), answer: z.string().max(100), correct: z.boolean() })).max(50) });

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ assessment: null }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ assessment: null, databaseConfigured: false });
  const assessment = await db.assessment.findFirst({ where: { userId: session.user.id }, orderBy: { completedAt: "desc" }, select: { id: true, kind: true, level: true, scores: true, completedAt: true } });
  const sessionsSinceAssessment = await db.studySession.count({ where: { userId: session.user.id, ...(assessment ? { startedAt: { gt: assessment.completedAt } } : {}) } });
  return NextResponse.json({ assessment, sessionsSinceAssessment, assessmentDue: !assessment || sessionsSinceAssessment >= 7, databaseConfigured: true });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to save your assessment." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ saved: false, databaseConfigured: false });
  const rate = consumeRateLimit(`assessment:${session.user.id}`, 6, 3_600_000);
  if (!rate.allowed) return NextResponse.json({ error: `Too many assessments. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const parsed = assessmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The assessment data is invalid." }, { status: 400 });
  const { kind, level, scores, answers } = parsed.data;
  const assessment = await db.assessment.create({ data: { userId: session.user.id, kind, level, scores, answers } });
  await db.learningProfile.upsert({ where: { userId: session.user.id }, update: { proficiencyLevel: level, grammarScore: Math.round(scores.grammar ?? scores.overall ?? 0), vocabularyScore: Math.round(scores.vocabulary ?? scores.overall ?? 0) }, create: { userId: session.user.id, proficiencyLevel: level, grammarScore: Math.round(scores.grammar ?? scores.overall ?? 0), vocabularyScore: Math.round(scores.vocabulary ?? scores.overall ?? 0) } });
  return NextResponse.json({ saved: true, assessment: { id: assessment.id, level: assessment.level, scores: assessment.scores, completedAt: assessment.completedAt } }, { status: 201 });
}
