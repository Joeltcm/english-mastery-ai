export const voiceOptions = [
  { value: "coral", label: "Coral", description: "Warm and expressive" },
  { value: "marin", label: "Marin", description: "Natural and clear" },
  { value: "cedar", label: "Cedar", description: "Steady and polished" },
  { value: "alloy", label: "Alloy", description: "Balanced and neutral" },
  { value: "ash", label: "Ash", description: "Focused and direct" },
  { value: "ballad", label: "Ballad", description: "Smooth and measured" },
  { value: "echo", label: "Echo", description: "Crisp and confident" },
  { value: "sage", label: "Sage", description: "Calm and thoughtful" },
  { value: "shimmer", label: "Shimmer", description: "Bright and friendly" },
  { value: "verse", label: "Verse", description: "Conversational and lively" },
] as const;

export type VoiceName = typeof voiceOptions[number]["value"];

export const defaultVoice: VoiceName = "coral";

export function isVoiceName(value: unknown): value is VoiceName {
  return typeof value === "string" && voiceOptions.some((voice) => voice.value === value);
}
