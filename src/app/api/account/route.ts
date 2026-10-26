import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to delete your account." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "PostgreSQL is not configured." }, { status: 503 });
  const body = await request.json().catch(() => null) as { confirmation?: unknown } | null;
  if (body?.confirmation !== "DELETE MY ACCOUNT") return NextResponse.json({ error: "Type DELETE MY ACCOUNT to confirm." }, { status: 400 });
  await db.user.delete({ where: { id: session.user.id } });
  return NextResponse.json({ deleted: true });
}
