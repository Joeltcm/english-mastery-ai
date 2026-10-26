import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

const grammarErrorSchema = z.object({ originalText: z.string().trim().min(1).max(6_000), correctedText: z.string().trim().min(1).max(2_000), naturalAlternative: z.string().trim().max(2_000).optional(), explanationEs: z.string().trim().min(1).max(2_000), category: z.string().trim().max(80).optional() });

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ errors: [] }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ errors: [], databaseConfigured: false });
  const errors = await db.grammarError.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, originalText: true, correctedText: true, explanationEs: true, category: true, resolved: true, createdAt: true } });
  return NextResponse.json({ errors, databaseConfigured: true });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to save correction history." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ saved: false, databaseConfigured: false });
  const rate = consumeRateLimit(`grammar-error:${session.user.id}`, 60, 3_600_000);
  if (!rate.allowed) return NextResponse.json({ error: `Too many correction updates. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const parsed = grammarErrorSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The correction data is invalid." }, { status: 400 });
  const error = await db.grammarError.create({ data: { userId: session.user.id, originalText: parsed.data.originalText, correctedText: parsed.data.correctedText, explanationEs: `${parsed.data.naturalAlternative ? `Natural alternative: ${parsed.data.naturalAlternative}\n` : ""}${parsed.data.explanationEs}`, category: parsed.data.category || "grammar" } });
  return NextResponse.json({ saved: true, id: error.id }, { status: 201 });
}
