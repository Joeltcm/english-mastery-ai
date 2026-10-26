import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumePersistentRateLimit } from "@/lib/rate-limit";

const toolProvider = "web_research";
const toolDefinition = {
  provider: toolProvider,
  label: "Public web research",
  permissions: ["Search publicly available web pages", "Include source citations in the answer"],
};

const updateSchema = z.object({ provider: z.literal(toolProvider), enabled: z.boolean() });

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to manage tool permissions." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "PostgreSQL is not configured." }, { status: 503 });
  const connection = await db.toolConnection.findUnique({ where: { userId_provider: { userId: session.user.id, provider: toolProvider } }, select: { id: true, enabled: true, updatedAt: true } });
  return NextResponse.json({ tools: [{ ...toolDefinition, id: connection?.id || null, enabled: connection?.enabled || false, updatedAt: connection?.updatedAt || null }] });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to manage tool permissions." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "PostgreSQL is not configured." }, { status: 503 });
  const rate = await consumePersistentRateLimit(`tools:${session.user.id}`, 20);
  if (!rate.allowed) return NextResponse.json({ error: `Too many permission changes. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The tool permission change is invalid." }, { status: 400 });
  const connection = await db.toolConnection.upsert({
    where: { userId_provider: { userId: session.user.id, provider: toolProvider } },
    update: { label: toolDefinition.label, permissions: toolDefinition.permissions, enabled: parsed.data.enabled },
    create: { userId: session.user.id, provider: toolProvider, label: toolDefinition.label, permissions: toolDefinition.permissions, enabled: parsed.data.enabled },
    select: { id: true, provider: true, label: true, permissions: true, enabled: true, updatedAt: true },
  });
  return NextResponse.json({ tool: connection });
}
