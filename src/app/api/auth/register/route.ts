import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/prisma";
import { registrationSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
  const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your name, email, and password." }, { status: 400 });
  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  try {
    const existing = await db.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.create({ data: { name, email: normalizedEmail, passwordHash, learningProfile: { create: {} } }, select: { id: true, name: true, email: true } });
    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create the account right now." }, { status: 500 });
  }
}
