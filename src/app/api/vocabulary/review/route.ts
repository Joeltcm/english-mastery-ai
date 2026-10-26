import { ReviewRating } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

const reviewSchema = z.object({ vocabularyId: z.string().cuid(), rating: z.enum(["AGAIN", "HARD", "GOOD", "EASY"]), responseMs: z.number().int().min(0).max(120_000).optional() });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to save reviews." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ saved: false, databaseConfigured: false });
  const rate = consumeRateLimit(`vocabulary-review:${session.user.id}`, 120);
  if (!rate.allowed) return NextResponse.json({ error: `Too many review requests. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The review is invalid." }, { status: 400 });

  const { vocabularyId, rating, responseMs } = parsed.data;
  const userId = session.user.id;
  const item = await db.vocabularyItem.findFirst({ where: { id: vocabularyId, userId } });
  if (!item) return NextResponse.json({ error: "Vocabulary item not found." }, { status: 404 });

  const quality = { AGAIN: 0, HARD: 2, GOOD: 4, EASY: 5 }[rating];
  const nextRepetitions = quality < 3 ? 0 : item.repetitions + 1;
  const nextEase = Math.max(1.3, item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  const nextInterval = quality < 3 ? 0 : nextRepetitions === 1 ? 1 : nextRepetitions === 2 ? 3 : Math.max(1, Math.round(item.intervalDays * nextEase));
  const nextReviewAt = new Date(Date.now() + nextInterval * 86_400_000);
  await db.$transaction([
    db.vocabularyReview.create({ data: { userId, vocabularyId, rating: rating as ReviewRating, responseMs } }),
    db.vocabularyItem.update({ where: { id: vocabularyId }, data: { repetitions: nextRepetitions, easeFactor: nextEase, intervalDays: nextInterval, nextReviewAt } }),
  ]);
  const delta = { AGAIN: -2, HARD: -1, GOOD: 1, EASY: 2 }[rating];
  const profile = await db.learningProfile.findUnique({ where: { userId }, select: { vocabularyScore: true } });
  await db.learningProfile.upsert({ where: { userId }, update: { vocabularyScore: Math.max(0, Math.min(100, (profile?.vocabularyScore ?? 48) + delta)) }, create: { userId, vocabularyScore: Math.max(0, Math.min(100, 48 + delta)) } });
  return NextResponse.json({ saved: true, nextReviewAt, intervalDays: nextInterval });
}
