import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumePersistentRateLimit } from "@/lib/rate-limit";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to export your data." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "PostgreSQL is not configured." }, { status: 503 });
  const rate = await consumePersistentRateLimit(`export:${session.user.id}`, 5, 3_600_000);
  if (!rate.allowed) return NextResponse.json({ error: `Too many exports. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const userId = session.user.id;
  const [user, profile, conversations, lessonAttempts, vocabularyItems, reviews, grammarErrors, pronunciationAttempts, assessments, studySessions, memories, toolConnections, toolExecutions, aiUsageEvents] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, image: true, role: true, createdAt: true, updatedAt: true } }),
    db.learningProfile.findUnique({ where: { userId } }),
    db.conversation.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { id: true, title: true, mode: true, createdAt: true, updatedAt: true, messages: { orderBy: { createdAt: "asc" }, select: { id: true, role: true, content: true, mode: true, createdAt: true } } } }),
    db.lessonAttempt.findMany({ where: { userId }, orderBy: { startedAt: "asc" }, select: { id: true, lessonId: true, score: true, answers: true, startedAt: true, completedAt: true, lesson: { select: { slug: true, title: true, type: true, level: true } } } }),
    db.vocabularyItem.findMany({ where: { userId }, orderBy: { term: "asc" }, select: { id: true, term: true, translation: true, example: true, pronunciation: true, easeFactor: true, intervalDays: true, repetitions: true, nextReviewAt: true, createdAt: true, updatedAt: true } }),
    db.vocabularyReview.findMany({ where: { userId }, orderBy: { reviewedAt: "asc" }, select: { id: true, vocabularyId: true, rating: true, responseMs: true, reviewedAt: true } }),
    db.grammarError.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    db.pronunciationAttempt.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    db.assessment.findMany({ where: { userId }, orderBy: { completedAt: "asc" } }),
    db.studySession.findMany({ where: { userId }, orderBy: { startedAt: "asc" } }),
    db.agentMemory.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { id: true, key: true, value: true, category: true, source: true, approved: true, createdAt: true, updatedAt: true } }),
    db.toolConnection.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { id: true, provider: true, label: true, permissions: true, enabled: true, createdAt: true, updatedAt: true } }),
    db.toolExecution.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { id: true, provider: true, action: true, input: true, output: true, status: true, approvedAt: true, completedAt: true, createdAt: true } }),
    db.aiUsageEvent.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { id: true, provider: true, model: true, kind: true, inputTokens: true, outputTokens: true, estimatedCostUsd: true, metadata: true, createdAt: true } }),
  ]);
  const payload = { exportedAt: new Date().toISOString(), user, profile, conversations, lessonAttempts, vocabularyItems, reviews, grammarErrors, pronunciationAttempts, assessments, studySessions, memories, toolConnections, toolExecutions, aiUsageEvents };
  return new Response(JSON.stringify(payload, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="english-mastery-export-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "no-store" } });
}
