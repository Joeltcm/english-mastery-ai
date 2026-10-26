import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "PostgreSQL is not configured." }, { status: 503 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { approved?: unknown; value?: unknown } | null;
  const update: { approved?: boolean; value?: string } = {};
  if (typeof body?.approved === "boolean") update.approved = body.approved;
  if (typeof body?.value === "string" && body.value.trim()) update.value = body.value.trim().slice(0, 500);
  if (!Object.keys(update).length) return NextResponse.json({ error: "No valid memory changes provided." }, { status: 400 });
  const memory = await db.agentMemory.updateMany({ where: { id, userId: session.user.id }, data: update });
  if (!memory.count) return NextResponse.json({ error: "Memory not found." }, { status: 404 });
  return NextResponse.json({ updated: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "PostgreSQL is not configured." }, { status: 503 });
  const { id } = await context.params;
  const memory = await db.agentMemory.deleteMany({ where: { id, userId: session.user.id } });
  if (!memory.count) return NextResponse.json({ error: "Memory not found." }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
