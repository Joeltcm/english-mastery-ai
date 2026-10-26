import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumePersistentRateLimit } from "@/lib/rate-limit";

const updateSchema = z.object({ resolved: z.boolean() });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to update correction history." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "PostgreSQL is not configured." }, { status: 503 });
  const rate = await consumePersistentRateLimit(`grammar-error:${session.user.id}`, 60, 3_600_000);
  if (!rate.allowed) return NextResponse.json({ error: `Too many correction updates. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The correction update is invalid." }, { status: 400 });
  const { id } = await context.params;
  const updated = await db.grammarError.updateMany({ where: { id, userId: session.user.id }, data: { resolved: parsed.data.resolved } });
  if (!updated.count) return NextResponse.json({ error: "Correction not found." }, { status: 404 });
  return NextResponse.json({ updated: true, resolved: parsed.data.resolved });
}
