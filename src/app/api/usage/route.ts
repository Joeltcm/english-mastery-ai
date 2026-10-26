import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { monthStart, monthlyBudgetDefault, pricingConfigured } from "@/lib/usage";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ usage: null }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ usage: null, databaseConfigured: false });
  const [profile, aggregate, count] = await Promise.all([
    db.learningProfile.findUnique({ where: { userId: session.user.id }, select: { monthlyBudgetUsd: true } }),
    db.aiUsageEvent.aggregate({ where: { userId: session.user.id, createdAt: { gte: monthStart() } }, _sum: { inputTokens: true, outputTokens: true, estimatedCostUsd: true } }),
    db.aiUsageEvent.count({ where: { userId: session.user.id, createdAt: { gte: monthStart() } } }),
  ]);
  return NextResponse.json({ usage: { inputTokens: aggregate._sum.inputTokens || 0, outputTokens: aggregate._sum.outputTokens || 0, estimatedCostUsd: aggregate._sum.estimatedCostUsd || 0, budgetUsd: profile?.monthlyBudgetUsd ?? monthlyBudgetDefault(), requestCount: count, pricingConfigured: pricingConfigured() }, databaseConfigured: true });
}
