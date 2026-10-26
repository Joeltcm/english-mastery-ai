import { NextResponse } from "next/server";

import { db } from "@/lib/prisma";

function authorized(request: Request) {
  const configured = process.env.CRON_SECRET;
  if (!configured) return false;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return bearer === configured || request.headers.get("x-cron-secret") === configured;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Retention job is not authorized." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "PostgreSQL is not configured." }, { status: 503 });
  const configuredDays = Number(process.env.DATA_RETENTION_DAYS || 365);
  const retentionDays = Number.isFinite(configuredDays) ? Math.min(3_650, Math.max(30, Math.floor(configuredDays))) : 365;
  const before = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const [usage, tools] = await Promise.all([
    db.aiUsageEvent.deleteMany({ where: { createdAt: { lt: before } } }),
    db.toolExecution.deleteMany({ where: { createdAt: { lt: before } } }),
  ]);
  return NextResponse.json({ deleted: { aiUsageEvents: usage.count, toolExecutions: tools.count }, retentionDays, before: before.toISOString() });
}
