import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

const memorySchema = z.object({ key: z.string().trim().min(2).max(80), value: z.string().trim().min(1).max(500), category: z.string().trim().max(40).optional() });

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to manage memory." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ memories: [], databaseConfigured: false });
  const memories = await db.agentMemory.findMany({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" }, select: { id: true, key: true, value: true, category: true, approved: true, createdAt: true, updatedAt: true } });
  return NextResponse.json({ memories, databaseConfigured: true });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to save memory." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "PostgreSQL is not configured." }, { status: 503 });
  const rate = consumeRateLimit(`memory:${session.user.id}`, 30);
  if (!rate.allowed) return NextResponse.json({ error: `Too many memory changes. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const parsed = memorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Memory needs a short label and value." }, { status: 400 });
  const memory = await db.agentMemory.upsert({ where: { userId_key: { userId: session.user.id, key: parsed.data.key } }, update: { value: parsed.data.value, category: parsed.data.category, approved: true, source: "user" }, create: { userId: session.user.id, key: parsed.data.key, value: parsed.data.value, category: parsed.data.category, approved: true, source: "user" }, select: { id: true, key: true, value: true, category: true, approved: true, createdAt: true, updatedAt: true } });
  return NextResponse.json({ memory }, { status: 201 });
}
