export const voiceOptions = [
  { value: "natural", label: "Natural", description: "Warm conversational rhythm", style: { rate: 0.92, pitch: 0.98 } },
  { value: "clear", label: "Clear", description: "Steady pronunciation practice", style: { rate: 0.86, pitch: 1 } },
  { value: "slow", label: "Slow", description: "Extra time to follow along", style: { rate: 0.74, pitch: 0.98 } },
] as const;

export type VoiceName = typeof voiceOptions[number]["value"];

export const defaultVoice: VoiceName = "natural";

export function isVoiceName(value: unknown): value is VoiceName {
  return typeof value === "string" && voiceOptions.some((voice) => voice.value === value);
}
