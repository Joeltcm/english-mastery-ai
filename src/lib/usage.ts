import { Prisma } from "@prisma/client";

import { db } from "@/lib/prisma";

export function monthStart() {
  const date = new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function monthlyBudgetDefault() {
  const value = Number(process.env.AI_DEFAULT_MONTHLY_BUDGET_USD || "5");
  return Number.isFinite(value) && value >= 0 ? value : 5;
}

export function estimateCostUsd(inputTokens: number, outputTokens: number) {
  const inputRate = Number(process.env.OPENAI_INPUT_COST_PER_MILLION_USD || "0");
  const outputRate = Number(process.env.OPENAI_OUTPUT_COST_PER_MILLION_USD || "0");
  const safeInputRate = Number.isFinite(inputRate) && inputRate >= 0 ? inputRate : 0;
  const safeOutputRate = Number.isFinite(outputRate) && outputRate >= 0 ? outputRate : 0;
  return (inputTokens / 1_000_000) * safeInputRate + (outputTokens / 1_000_000) * safeOutputRate;
}

export function pricingConfigured() {
  return Boolean(process.env.OPENAI_INPUT_COST_PER_MILLION_USD && process.env.OPENAI_OUTPUT_COST_PER_MILLION_USD);
}

export function estimateTtsCostUsd(characters: number) {
  const rate = Number(process.env.OPENAI_TTS_COST_PER_MILLION_CHAR_USD || "0");
  return Number.isFinite(rate) && rate >= 0 ? (characters / 1_000_000) * rate : 0;
}

export async function recordAiUsageEvent(input: { userId: string; provider: string; model: string; kind: string; estimatedCostUsd?: number; metadata?: Prisma.InputJsonValue }) {
  try {
    await db.aiUsageEvent.create({ data: { userId: input.userId, provider: input.provider, model: input.model, kind: input.kind, estimatedCostUsd: input.estimatedCostUsd || 0, metadata: input.metadata } });
  } catch {
    // Usage logging must never turn a successful voice response into an error.
  }
}
