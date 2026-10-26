import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumePersistentRateLimit } from "@/lib/rate-limit";

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to delete your account." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "PostgreSQL is not configured." }, { status: 503 });
  const rate = await consumePersistentRateLimit(`account-delete:${session.user.id}`, 3, 86_400_000);
  if (!rate.allowed) return NextResponse.json({ error: `Too many deletion attempts. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const body = await request.json().catch(() => null) as { confirmation?: unknown } | null;
  if (body?.confirmation !== "DELETE MY ACCOUNT") return NextResponse.json({ error: "Type DELETE MY ACCOUNT to confirm." }, { status: 400 });
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { email: true } });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  const userRateLimitKeys = [
    `account-delete:${session.user.id}`,
    `assessment:${session.user.id}`,
    `chat:${session.user.id}`,
    `export:${session.user.id}`,
    `grammar-error:${session.user.id}`,
    `lesson-attempt:${session.user.id}`,
    `lesson-sync:${session.user.id}`,
    `memory:${session.user.id}`,
    `pronunciation:${session.user.id}`,
    `profile:${session.user.id}`,
    `study-session:${session.user.id}`,
    `tools:${session.user.id}`,
    `vocabulary-sync:${session.user.id}`,
    `vocabulary-review:${session.user.id}`,
    `voice-realtime-usage:${session.user.id}`,
    `voice-realtime:${session.user.id}`,
    `voice-realtime-transcript:${session.user.id}`,
    `voice-speech:${session.user.id}`,
    `login:${user.email}`,
  ];
  await db.$transaction([
    db.user.delete({ where: { id: session.user.id } }),
    db.rateLimitBucket.deleteMany({ where: { key: { in: userRateLimitKeys } } }),
  ]);
  return NextResponse.json({ deleted: true });
}
