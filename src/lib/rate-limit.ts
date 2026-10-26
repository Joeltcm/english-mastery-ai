import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/prisma";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function consumeRateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  if (buckets.size > 1_000) for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey);
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (current.count >= limit) return { allowed: false, remaining: 0, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  current.count += 1;
  return { allowed: true, remaining: limit - current.count };
}

export async function consumePersistentRateLimit(key: string, limit = 20, windowMs = 60_000) {
  if (!process.env.DATABASE_URL) return consumeRateLimit(key, limit, windowMs);
  try {
    const rows = await db.$queryRaw<Array<{ count: number; resetAt: Date }>>(Prisma.sql`
      INSERT INTO "RateLimitBucket" ("id", "key", "count", "resetAt", "updatedAt")
      VALUES (${randomUUID()}, ${key}, 1, NOW() + (${windowMs} * INTERVAL '1 millisecond'), NOW())
      ON CONFLICT ("key") DO UPDATE
      SET "count" = CASE WHEN "RateLimitBucket"."resetAt" <= NOW() THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
          "resetAt" = CASE WHEN "RateLimitBucket"."resetAt" <= NOW() THEN NOW() + (${windowMs} * INTERVAL '1 millisecond') ELSE "RateLimitBucket"."resetAt" END,
          "updatedAt" = NOW()
      RETURNING "count", "resetAt"
    `);
    const row = rows[0];
    if (!row) return consumeRateLimit(key, limit, windowMs);
    const resetAt = new Date(row.resetAt).getTime();
    return { allowed: Number(row.count) <= limit, remaining: Math.max(0, limit - Number(row.count)), retryAfter: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)) };
  } catch {
    return consumeRateLimit(key, limit, windowMs);
  }
}
