import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ conversations: [] });
  const conversations = await db.conversation.findMany({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" }, take: 30, select: { id: true, title: true, mode: true, updatedAt: true } });
  return NextResponse.json({ conversations });
}
