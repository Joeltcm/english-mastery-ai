import { Prisma } from "@prisma/client";

import { db } from "@/lib/prisma";
import { calculateStudyStreak } from "@/lib/time";

export async function recordStudySession(userId: string, input: { activity: string; minutes: number; metadata?: Prisma.InputJsonValue; timeZone?: string }) {
  const created = await db.studySession.create({ data: { userId, activity: input.activity, minutes: input.minutes, completedAt: new Date(), metadata: input.metadata } });
  const [aggregate, sessions] = await Promise.all([
    db.studySession.aggregate({ where: { userId, completedAt: { not: null } }, _sum: { minutes: true } }),
    db.studySession.findMany({ where: { userId, completedAt: { not: null } }, orderBy: { startedAt: "desc" }, take: 366, select: { startedAt: true } }),
  ]);
  const currentStreak = calculateStudyStreak(sessions.map((session) => session.startedAt), new Date(), input.timeZone);
  const totalStudyMinutes = aggregate._sum.minutes || 0;
  await db.learningProfile.upsert({ where: { userId }, update: { totalStudyMinutes, currentStreak }, create: { userId, totalStudyMinutes, currentStreak } });
  return { created, totalStudyMinutes, currentStreak };
}
