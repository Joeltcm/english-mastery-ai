import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ conversation: null });
  const { id } = await context.params;
  const conversation = await db.conversation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, title: true, mode: true, messages: { orderBy: { createdAt: "asc" }, take: 40, select: { id: true, role: true, content: true } } },
  });
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  return NextResponse.json({ conversation });
}
