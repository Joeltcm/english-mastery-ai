import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumePersistentRateLimit } from "@/lib/rate-limit";
import { focusVocabulary } from "@/lib/vocabulary";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to sync your vocabulary." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ items: [], databaseConfigured: false });

  const userId = session.user.id;
  const rate = await consumePersistentRateLimit(`vocabulary-sync:${userId}`, 30, 3_600_000);
  if (!rate.allowed) return NextResponse.json({ error: `Too many vocabulary syncs. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  await db.vocabularyItem.createMany({
    data: focusVocabulary.map((item) => ({ userId, term: item.term, translation: item.translation, example: item.example, pronunciation: item.pronunciation })),
    skipDuplicates: true,
  });
  const items = await db.vocabularyItem.findMany({
    where: { userId },
    orderBy: [{ nextReviewAt: "asc" }, { term: "asc" }],
    take: 24,
    select: { id: true, term: true, translation: true, example: true, pronunciation: true },
  });
  return NextResponse.json({ items, databaseConfigured: true });
}
