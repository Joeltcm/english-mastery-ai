export const deepSeekProvider = "deepseek";

export const deepSeekBaseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
export const deepSeekModel = process.env.DEEPSEEK_MODEL || "deepseek-flash";
export const deepSeekVisionModel = process.env.DEEPSEEK_VISION_MODEL || deepSeekModel;
export const deepSeekWebModel = process.env.DEEPSEEK_WEB_MODEL || "deepseek-v4-pro";

export function deepSeekConfigured() {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export async function createDeepSeekResponse(body: Record<string, unknown>) {
  return fetch(`${deepSeekBaseUrl}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });
}
