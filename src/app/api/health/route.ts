import { db } from "@/lib/prisma";

import { NextResponse } from "next/server";

export async function GET() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  let databaseReachable: boolean | null = null;
  if (databaseConfigured) {
    try { await db.$queryRaw`SELECT 1`; databaseReachable = true; } catch { databaseReachable = false; }
  }
  const healthy = databaseReachable !== false;
  return NextResponse.json({ ok: healthy, service: "english-mastery-ai", status: healthy ? databaseConfigured ? "ready" : "degraded" : "unhealthy", databaseConfigured, databaseReachable, openAIConfigured: Boolean(process.env.OPENAI_API_KEY), timestamp: new Date().toISOString() }, { status: healthy ? 200 : 503 });
}
