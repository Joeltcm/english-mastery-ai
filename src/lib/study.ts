import { Prisma } from "@prisma/client";

import { db } from "@/lib/prisma";
import { localDateKey, safeTimeZone, startOfLocalDay } from "@/lib/time";

export async function recordStudySession(userId: string, input: { activity: string; minutes: number; metadata?: Prisma.InputJsonValue; timeZone?: string }) {
  const created = await db.studySession.create({ data: { userId, activity: input.activity, minutes: input.minutes, completedAt: new Date(), metadata: input.metadata } });
  const [aggregate, sessions] = await Promise.all([
    db.studySession.aggregate({ where: { userId, completedAt: { not: null } }, _sum: { minutes: true } }),
    db.studySession.findMany({ where: { userId, completedAt: { not: null } }, orderBy: { startedAt: "desc" }, take: 366, select: { startedAt: true } }),
  ]);
  const timeZone = safeTimeZone(input.timeZone);
  const activeDays = new Set(sessions.map((session) => localDateKey(session.startedAt, timeZone)));
  const cursor = startOfLocalDay(new Date(), timeZone);
  if (!activeDays.has(localDateKey(cursor, timeZone))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let currentStreak = 0;
  while (activeDays.has(localDateKey(cursor, timeZone))) { currentStreak += 1; cursor.setUTCDate(cursor.getUTCDate() - 1); }
  const totalStudyMinutes = aggregate._sum.minutes || 0;
  await db.learningProfile.upsert({ where: { userId }, update: { totalStudyMinutes, currentStreak }, create: { userId, totalStudyMinutes, currentStreak } });
  return { created, totalStudyMinutes, currentStreak };
}
