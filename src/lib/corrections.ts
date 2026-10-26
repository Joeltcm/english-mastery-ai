export type ExtractedCorrection = { correctedText: string; naturalAlternative?: string; explanationEs: string };

function lineValue(text: string, label: string) {
  const match = text.match(new RegExp(`^\\s*(?:\\*\\*)?${label}(?:\\*\\*)?\\s*:?\\s*(.+?)\\s*$`, "im"));
  return match?.[1]?.replace(/^\*\*|\*\*$/g, "").trim();
}

export function extractCorrection(text: string): ExtractedCorrection | null {
  const correctedText = lineValue(text, "Correction");
  const naturalAlternative = lineValue(text, "Natural alternative");
  const explanationEs = lineValue(text, "Explicación(?: \\(ES\\))?");
  return correctedText && explanationEs ? { correctedText, naturalAlternative, explanationEs } : null;
}

export function removeCorrectionLabels(text: string) {
  const spoken = text.split(/\r?\n/).filter((line) => !/^\s*(?:\*\*)?(?:Correction|Natural alternative|Explicación(?: \(ES\))?)(?:\*\*)?\s*:/i.test(line)).join(" ").replace(/\s+/g, " ").trim();
  return spoken || text.trim();
}
