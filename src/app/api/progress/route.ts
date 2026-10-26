import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { localDateKey, safeTimeZone, startOfLocalDay } from "@/lib/time";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ progress: null }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ progress: null, databaseConfigured: false });
  const userId = session.user.id;
  const timeZone = safeTimeZone(new URL(request.url).searchParams.get("timezone"));
  const todayStart = startOfLocalDay(new Date(), timeZone);
  const historyStartDate = new Date(todayStart); historyStartDate.setUTCDate(historyStartDate.getUTCDate() - 6);
  const historyStart = startOfLocalDay(historyStartDate, timeZone);
  const [profile, reviewCount, studyMinutes, todayStudyMinutes, studySessions, latestAssessment, assessmentHistory, pronunciation, grammarErrorCount, recentGrammarErrors] = await Promise.all([
    db.learningProfile.findUnique({ where: { userId }, select: { proficiencyLevel: true, dailyGoalMinutes: true, currentStreak: true, totalStudyMinutes: true, grammarScore: true, vocabularyScore: true } }),
    db.vocabularyReview.count({ where: { userId } }),
    db.studySession.aggregate({ where: { userId }, _sum: { minutes: true } }),
    db.studySession.aggregate({ where: { userId, startedAt: { gte: todayStart } }, _sum: { minutes: true } }),
    db.studySession.findMany({ where: { userId, startedAt: { gte: historyStart } }, select: { startedAt: true, minutes: true }, orderBy: { startedAt: "asc" } }),
    db.assessment.findFirst({ where: { userId }, orderBy: { completedAt: "desc" }, select: { id: true, kind: true, level: true, scores: true, completedAt: true } }),
    db.assessment.findMany({ where: { userId }, orderBy: { completedAt: "desc" }, take: 5, select: { id: true, kind: true, level: true, completedAt: true } }),
    db.pronunciationAttempt.aggregate({ where: { userId, score: { not: null } }, _avg: { score: true }, _count: { score: true } }),
    db.grammarError.count({ where: { userId } }),
    db.grammarError.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 3, select: { id: true, correctedText: true, explanationEs: true, createdAt: true } }),
  ]);
  const minutesByDay = new Map<string, number>();
  for (let offset = 6; offset >= 0; offset -= 1) { const date = new Date(todayStart); date.setUTCDate(date.getUTCDate() - offset); minutesByDay.set(localDateKey(date, timeZone), 0); }
  for (const studySession of studySessions) { const key = localDateKey(studySession.startedAt, timeZone); minutesByDay.set(key, (minutesByDay.get(key) || 0) + studySession.minutes); }
  const studyHistory = Array.from(minutesByDay, ([date, minutes]) => ({ date, minutes }));
  return NextResponse.json({ progress: { profile, reviewCount, studyMinutes: studyMinutes._sum.minutes || 0, todayStudyMinutes: todayStudyMinutes._sum.minutes || 0, studyHistory, latestAssessment, assessmentHistory, pronunciationScore: pronunciation._avg.score, pronunciationAttempts: pronunciation._count.score, grammarErrorCount, recentGrammarErrors }, databaseConfigured: true });
}
