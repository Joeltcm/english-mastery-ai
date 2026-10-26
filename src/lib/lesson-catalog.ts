import type { LessonType } from "@prisma/client";

export type CatalogLesson = {
  slug: string;
  title: string;
  description: string;
  type: LessonType;
  level: string;
  estimatedMin: number;
  prompt: string;
  focus: "grammar" | "vocabulary" | "mixed" | "speaking";
};

export const lessonCatalog: CatalogLesson[] = [
  { slug: "irregular-verbs-in-travel", title: "Irregular verbs in travel stories", description: "Use go, take, get, and find while moving through an airport and hotel.", type: "IRREGULAR_VERBS", level: "A2-B1", estimatedMin: 12, prompt: "Run a travel story lesson with me. Make me use go/went/gone, take/took/taken, get/got/gotten, and find/found in natural airport and hotel situations.", focus: "grammar" },
  { slug: "contextual-vocabulary-at-work", title: "Vocabulary that works at work", description: "Build useful phrases for projects, updates, and international meetings.", type: "VOCABULARY", level: "B1", estimatedMin: 10, prompt: "Teach me contextual vocabulary for an international work meeting. Recycle make/made, give/gave/given, and know/knew/known in realistic turns.", focus: "vocabulary" },
  { slug: "mixed-recall-daily-life", title: "Mixed recall in daily life", description: "Retrieve the right verb without translating every sentence first.", type: "GRAMMAR", level: "A2-B1", estimatedMin: 8, prompt: "Give me a mixed retrieval lesson about daily life. Ask me to choose and use irregular verbs, then correct me concisely in Spanish when needed.", focus: "mixed" },
  { slug: "speaking-confidence-lab", title: "Speaking confidence lab", description: "Practice a natural conversation and reflect on what you can say next time.", type: "SPEAKING", level: "B1-B2", estimatedMin: 15, prompt: "Act as my speaking coach. Have a natural conversation about a recent experience, wait for my complete turns, and give concise corrections plus one stronger alternative after each turn.", focus: "speaking" },
  { slug: "listening-for-the-past", title: "Listening for the past", description: "Listen for irregular verbs in short travel and everyday stories.", type: "LISTENING", level: "A2-B1", estimatedMin: 10, prompt: "Create a listening lesson using short, natural sentences about travel and daily life. Read them aloud, ask what I heard, and recycle go/went/gone and see/saw/seen.", focus: "mixed" },
  { slug: "read-a-travel-update", title: "Read a travel update", description: "Understand a realistic message and notice verbs in context.", type: "READING", level: "B1", estimatedMin: 9, prompt: "Give me a short travel update to read. Ask comprehension questions, highlight useful context vocabulary, and make me reuse the irregular verbs naturally.", focus: "vocabulary" },
  { slug: "write-a-natural-work-message", title: "Write a natural work message", description: "Turn your ideas into a clear, confident international message.", type: "WRITING", level: "B1-B2", estimatedMin: 12, prompt: "Guide me through writing a concise international work message. Correct my English with the corrected sentence, a natural alternative, and a short Spanish explanation.", focus: "grammar" },
];
