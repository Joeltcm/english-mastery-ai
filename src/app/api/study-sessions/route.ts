import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

const studySessionSchema = z.object({
  activity: z.string().trim().min(2).max(80),
  minutes: z.number().int().min(1).max(180),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to record study time." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "PostgreSQL is not configured." }, { status: 503 });
  const rate = consumeRateLimit(`study-session:${session.user.id}`, 60, 3_600_000);
  if (!rate.allowed) return NextResponse.json({ error: `Too many study-session updates. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const parsed = studySessionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The study session details are invalid." }, { status: 400 });
  const metadata = parsed.data.metadata ? parsed.data.metadata as Prisma.InputJsonValue : undefined;
  const created = await db.studySession.create({ data: { userId: session.user.id, activity: parsed.data.activity, minutes: parsed.data.minutes, completedAt: new Date(), metadata } });
  return NextResponse.json({ saved: true, id: created.id }, { status: 201 });
}
