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
