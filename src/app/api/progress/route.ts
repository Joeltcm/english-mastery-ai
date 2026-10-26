import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ progress: null }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ progress: null, databaseConfigured: false });
  const userId = session.user.id;
  const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
  const [profile, reviewCount, studyMinutes, todayStudyMinutes, latestAssessment, assessmentHistory, pronunciation, grammarErrorCount, recentGrammarErrors] = await Promise.all([
    db.learningProfile.findUnique({ where: { userId }, select: { proficiencyLevel: true, dailyGoalMinutes: true, currentStreak: true, totalStudyMinutes: true, grammarScore: true, vocabularyScore: true } }),
    db.vocabularyReview.count({ where: { userId } }),
    db.studySession.aggregate({ where: { userId }, _sum: { minutes: true } }),
    db.studySession.aggregate({ where: { userId, startedAt: { gte: todayStart } }, _sum: { minutes: true } }),
    db.assessment.findFirst({ where: { userId }, orderBy: { completedAt: "desc" }, select: { id: true, kind: true, level: true, scores: true, completedAt: true } }),
    db.assessment.findMany({ where: { userId }, orderBy: { completedAt: "desc" }, take: 5, select: { id: true, kind: true, level: true, completedAt: true } }),
    db.pronunciationAttempt.aggregate({ where: { userId, score: { not: null } }, _avg: { score: true }, _count: { score: true } }),
    db.grammarError.count({ where: { userId } }),
    db.grammarError.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 3, select: { id: true, correctedText: true, explanationEs: true, createdAt: true } }),
  ]);
  return NextResponse.json({ progress: { profile, reviewCount, studyMinutes: studyMinutes._sum.minutes || 0, todayStudyMinutes: todayStudyMinutes._sum.minutes || 0, latestAssessment, assessmentHistory, pronunciationScore: pronunciation._avg.score, pronunciationAttempts: pronunciation._count.score, grammarErrorCount, recentGrammarErrors }, databaseConfigured: true });
}
