import { db } from "@/lib/prisma";

import { NextResponse } from "next/server";

export async function GET() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  const openAIConfigured = Boolean(process.env.OPENAI_API_KEY);
  const strict = process.env.HEALTHCHECK_STRICT === "true" || process.env.NODE_ENV === "production";
  let databaseReachable: boolean | null = null;
  if (databaseConfigured) {
    try { await db.$queryRaw`SELECT 1`; databaseReachable = true; } catch { databaseReachable = false; }
  }
  const missingConfiguration = [!databaseConfigured ? "DATABASE_URL" : null, !openAIConfigured ? "OPENAI_API_KEY" : null].filter((value): value is string => Boolean(value));
  const healthy = strict ? databaseConfigured && databaseReachable === true && openAIConfigured : databaseReachable !== false;
  const status = healthy ? strict || (databaseConfigured && openAIConfigured) ? "ready" : "degraded" : "unhealthy";
  return NextResponse.json({ ok: healthy, service: "english-mastery-ai", status, strict, missingConfiguration, databaseConfigured, databaseReachable, openAIConfigured, timestamp: new Date().toISOString() }, { status: healthy ? 200 : 503 });
}
