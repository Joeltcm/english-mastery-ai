import { db } from "@/lib/prisma";
import { deepSeekConfigured } from "@/lib/deepseek";

import { NextResponse } from "next/server";

export async function GET() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  const authConfigured = Boolean(process.env.AUTH_SECRET);
  const deepseekConfigured = deepSeekConfigured();
  const strict = process.env.HEALTHCHECK_STRICT === "true" || process.env.NODE_ENV === "production";
  let databaseReachable: boolean | null = null;
  if (databaseConfigured) {
    try { await db.$queryRaw`SELECT 1`; databaseReachable = true; } catch { databaseReachable = false; }
  }
  const missingConfiguration = [!databaseConfigured ? "DATABASE_URL" : null, !authConfigured ? "AUTH_SECRET" : null, !deepseekConfigured ? "DEEPSEEK_API_KEY" : null].filter((value): value is string => Boolean(value));
  const healthy = strict ? databaseConfigured && databaseReachable === true && authConfigured && deepseekConfigured : databaseReachable !== false;
  const status = healthy ? strict || (databaseConfigured && deepseekConfigured) ? "ready" : "degraded" : "unhealthy";
  return NextResponse.json({ ok: healthy, service: "english-mastery-ai", status, strict, missingConfiguration, databaseConfigured, databaseReachable, authConfigured, deepseekConfigured, timestamp: new Date().toISOString() }, { status: healthy ? 200 : 503 });
}
