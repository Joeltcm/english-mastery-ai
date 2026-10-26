import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumePersistentRateLimit } from "@/lib/rate-limit";
import { profileUpdateSchema } from "@/lib/validation";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ profile: null }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ profile: null, databaseConfigured: false });
  const profile = await db.learningProfile.findUnique({ where: { userId: session.user.id }, select: { dailyGoalMinutes: true, proficiencyLevel: true, correctionPreference: true, monthlyBudgetUsd: true } });
  return NextResponse.json({ profile, databaseConfigured: true });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to update your learning goal." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "PostgreSQL is not configured." }, { status: 503 });
  const rate = await consumePersistentRateLimit(`profile:${session.user.id}`, 20);
  if (!rate.allowed) return NextResponse.json({ error: `Too many profile changes. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const parsed = profileUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a goal between 5 and 180 minutes or a budget between $0 and $500." }, { status: 400 });
  const profile = await db.learningProfile.upsert({ where: { userId: session.user.id }, update: parsed.data, create: { userId: session.user.id, ...parsed.data }, select: { dailyGoalMinutes: true, monthlyBudgetUsd: true } });
  return NextResponse.json({ profile });
}
