import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { db } from "@/lib/prisma";

export default async function Home() {
  const session = await auth();
  let profile = null;
  if (session?.user?.id && process.env.DATABASE_URL) {
    try {
      profile = await db.learningProfile.findUnique({ where: { userId: session.user.id }, select: { proficiencyLevel: true, dailyGoalMinutes: true, currentStreak: true, totalStudyMinutes: true, grammarScore: true, vocabularyScore: true, monthlyBudgetUsd: true } });
    } catch {
      profile = null;
    }
  }
  return <DashboardShell initialUser={session?.user ?? null} initialProfile={profile} />;
}
