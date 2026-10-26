import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumePersistentRateLimit } from "@/lib/rate-limit";
import { modeSchema } from "@/lib/validation";

const transcriptSchema = z.object({
  conversationId: z.string().cuid().optional(),
  role: z.enum(["USER", "ASSISTANT"]),
  content: z.string().trim().min(1).max(6_000),
  mode: modeSchema,
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to save live voice transcripts." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "PostgreSQL is not configured." }, { status: 503 });
  const rate = await consumePersistentRateLimit(`voice-realtime-transcript:${session.user.id}`, 120, 3_600_000);
  if (!rate.allowed) return NextResponse.json({ error: `Too many transcript updates. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const parsed = transcriptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The live voice transcript is invalid." }, { status: 400 });

  const { conversationId, role, content, mode } = parsed.data;
  const conversation = conversationId
    ? await db.conversation.findFirst({ where: { id: conversationId, userId: session.user.id } })
    : await db.conversation.create({ data: { userId: session.user.id, mode, title: content.slice(0, 56) } });
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  await db.message.create({ data: { conversationId: conversation.id, role, content, mode } });
  await db.conversation.update({ where: { id: conversation.id }, data: { mode } });
  return NextResponse.json({ saved: true, conversationId: conversation.id }, { status: 201 });
}
