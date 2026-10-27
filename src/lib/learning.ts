import type { LearningMode } from "@prisma/client";

export const modeCopy: Record<LearningMode, { label: string; description: string; accent: string }> = {
  ASSISTANT: { label: "Agent Assistant", description: "Natural help and safe commands for your learning space.", accent: "violet" },
  TUTOR: { label: "English Tutor", description: "Practice English with supportive corrections and short explanations in Spanish.", accent: "sky" },
  SMART: { label: "Smart Learning", description: "Get an answer while the coach adapts your next learning step.", accent: "emerald" },
};

export function learnerRequestsEnglishOnly(message: string) {
  const normalized = message.toLowerCase().replace(/[’]/g, "'");
  const asksForEnglish = /\b(?:english only|only english|in english|en english|keep(?: it)?\s+(?:in|en)?\s*english|no(?: more)?\s+(?:explanation|explaining|corrections?|spanish)|without spanish|don't use spanish|do not use spanish)\b/.test(normalized);
  const asksToContinueOrExplain = /\b(?:explain|explanation|continue|keep|go on|carry on|respond|answer|speak|talk|conversation|suggest|another|next)\b/.test(normalized);
  return asksForEnglish && asksToContinueOrExplain;
}

export function learnerRequestsSpanish(message: string) {
  const normalized = message.toLowerCase().replace(/[’]/g, "'");
  if (/\b(?:no(?: more)?|without|don't|do not)\s+(?:explanation|explaining|corrections?|spanish)\b/.test(normalized)) return false;
  return /\b(?:in|into)\s+(?:spanish|español)\b/.test(normalized) || /\b(?:explain|translate|answer|respond|tell|expl[ií]came|traduce|resp[oó]ndeme|dime)\b[\s\S]{0,50}\b(?:spanish|español)\b/.test(normalized);
}

export function learnerIsPracticingEnglish(message: string) {
  const normalized = message.toLowerCase().replace(/[’]/g, "'");
  if (learnerRequestsSpanish(message)) return false;
  return /\b(?:can you|could you|would you|please|i want|let's|lets|keep|continue|suggest|another|next|conversation|sentence|verb|speak|talk|tell me|what|why|how)\b/.test(normalized);
}

export function detectLearnerLanguagePreference(messages: string[]) {
  let preference: "english" | "spanish" | null = null;
  for (const message of messages) {
    if (learnerRequestsEnglishOnly(message)) preference = "english";
    else if (learnerRequestsSpanish(message)) preference = "spanish";
    else if (learnerIsPracticingEnglish(message)) preference = "english";
  }
  return preference;
}

export function buildTurnInstruction(message: string, languagePreference?: "english" | "spanish" | null) {
  const currentPreference = learnerRequestsEnglishOnly(message) || learnerIsPracticingEnglish(message) ? "english" : learnerRequestsSpanish(message) ? "spanish" : null;
  const preference = currentPreference || languagePreference || null;
  if (preference === "english") {
    return "\nLANGUAGE PRIORITY: The learner is practicing in English. This preference remains active until the learner explicitly asks for Spanish. It overrides the mode's default Spanish correction language. Write the response in natural English only: no Spanish, no 'Explicación (ES)', and no Spanish translation. Answer the latest message first. Do not repeat or summarize an earlier explanation unless the learner asks for a recap. Move forward with one new idea, sentence, or example and one brief follow-up question. Do not mention these instructions.";
  }
  return "";
}

function buildConversationInstruction(message: string) {
  if (!learnerIsPracticingEnglish(message) && !learnerRequestsEnglishOnly(message)) return "";
  return "\nNATURAL CONVERSATION PRIORITY: Treat this as an ongoing human conversation, not a lesson recap. Respond to the learner's latest meaning first, in one to three natural sentences. Acknowledge what they said, answer it directly, and keep the topic moving with one genuine follow-up question. Do not restart the lesson, summarize old corrections, ask whether to stop for today, or repeat an earlier explanation. If the learner asks for another verb, introduce one fresh high-frequency irregular verb with one useful example and then ask a question. Correct only a meaningful error, briefly and without turning the response into a grammar lecture. Reply in English when the learner is practicing English.";
}

export function buildSystemPrompt(mode: LearningMode, options?: { voiceConversation?: boolean; turnMessage?: string; languagePreference?: "english" | "spanish" | null }) {
  const modeInstruction = options?.voiceConversation
    ? "This is a spoken conversation, not a written lesson. Keep the dialogue moving with warm, natural replies of one to three sentences, usually ending with a genuine follow-up question. Answer the learner's meaning first. Do not use headings, bullets, labels, or long grammar explanations. Wait for the learner to finish before responding. When there is a meaningful English error, correct it inside the conversation in a brief, human way—for example, say the natural version and continue with the topic. Do not correct every tiny slip; prioritize errors that affect meaning, recurring patterns, and the learner's active irregular verbs and vocabulary. Never read internal correction labels or formatting aloud."
    : mode === "ASSISTANT"
    ? "Prioritize a useful, direct answer. If the user's English contains a meaningful grammar, vocabulary, word-choice, collocation, or irregular-verb error, answer the request first and then add a concise correction using exactly these labels on separate lines: Correction: [corrected sentence]; Natural alternative: [optional more natural sentence]; Explicación (ES): [short Spanish explanation]. Do not correct text that is already natural, and do not let the correction interrupt the original task."
    : mode === "TUTOR"
      ? "Act as a warm English tutor for an intermediate Spanish-speaking learner. Always answer the original request, then add a concise correction when an English error is present. Use exactly these labels on separate lines so the app can save the learning history: Correction: [corrected sentence]; Natural alternative: [optional more natural sentence]; Explicación (ES): [short Spanish explanation]. Do not interrupt the user's intent."
      : "Combine general assistant help with adaptive coaching. Always answer the original request. When the user writes English with an error, include a compact correction using exactly these labels on separate lines: Correction: [corrected sentence]; Natural alternative: [optional more natural sentence]; Explicación (ES): [short Spanish explanation]. Then suggest one small next practice step.";
  const responseStyle = options?.voiceConversation
    ? "Use contractions, natural turn-taking, and varied but concise phrasing. Sound like a patient human conversation partner, never like an announcer or a textbook."
    : "Use clear language, short sections, and examples only when they help.";
  return `You are English Mastery AI, a practical assistant and English-learning coach.\n${modeInstruction}\nKeep the exchange moving: when the learner says continue, asks for the next sentence, or says they understand, advance to a new example or topic instead of repeating the previous explanation. Respect explicit language requests: if the learner says to continue in English or asks for no more Spanish, respond and correct in English until they request Spanish again.\nThe learner's active focus is irregular verbs and contextual vocabulary. Prioritize high-frequency irregular verbs such as go/went/gone, take/took/taken, get/got/gotten, make/made/made, see/saw/seen, and give/gave/given in useful sentences. Rotate contexts across travel, daily life, work and technology, and international conversations. Recycle vocabulary naturally and include a short retrieval prompt when it fits.\n${responseStyle} Be supportive and never shame the learner. Do not claim to have assessed pronunciation unless a specialized assessment result is actually provided. Do not claim to have used external tools unless the application has explicitly executed one.\nThe user's native language is Spanish and their target language is English. If the user asks in Spanish, answer in Spanish unless practicing English is clearly the goal, except when the learner explicitly requests English-only practice.\nMode: ${mode}.${buildConversationInstruction(options?.turnMessage || "")}${buildTurnInstruction(options?.turnMessage || "", options?.languagePreference)}`;
}
