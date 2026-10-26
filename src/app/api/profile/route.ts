import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

const profileSchema = z.object({ dailyGoalMinutes: z.number().int().min(5).max(180) });

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ profile: null }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ profile: null, databaseConfigured: false });
  const profile = await db.learningProfile.findUnique({ where: { userId: session.user.id }, select: { dailyGoalMinutes: true, proficiencyLevel: true, correctionPreference: true } });
  return NextResponse.json({ profile, databaseConfigured: true });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to update your learning goal." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "PostgreSQL is not configured." }, { status: 503 });
  const rate = consumeRateLimit(`profile:${session.user.id}`, 20);
  if (!rate.allowed) return NextResponse.json({ error: `Too many profile changes. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a goal between 5 and 180 minutes." }, { status: 400 });
  const profile = await db.learningProfile.upsert({ where: { userId: session.user.id }, update: { dailyGoalMinutes: parsed.data.dailyGoalMinutes }, create: { userId: session.user.id, dailyGoalMinutes: parsed.data.dailyGoalMinutes }, select: { dailyGoalMinutes: true } });
  return NextResponse.json({ profile });
}
