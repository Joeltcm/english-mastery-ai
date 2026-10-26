export const focusVocabulary = [
  { term: "go", translation: "ir", example: "I went to the airport early, and I have gone there many times.", pronunciation: "/goʊ/", context: "Travel" },
  { term: "take", translation: "tomar / llevar", example: "She took the train and has taken the same route for years.", pronunciation: "/teɪk/", context: "Daily life" },
  { term: "get", translation: "obtener / llegar / conseguir", example: "We got the update and have gotten better results since then.", pronunciation: "/ɡet/", context: "Technology" },
  { term: "make", translation: "hacer / crear", example: "He made a clear plan and has made progress at work.", pronunciation: "/meɪk/", context: "Work" },
  { term: "see", translation: "ver", example: "I saw a new idea in the report and have seen it work in practice.", pronunciation: "/siː/", context: "Work" },
  { term: "give", translation: "dar", example: "They gave us directions and have given helpful advice before.", pronunciation: "/ɡɪv/", context: "International" },
  { term: "know", translation: "saber / conocer", example: "I knew the answer and have known this team for a long time.", pronunciation: "/noʊ/", context: "Conversation" },
  { term: "find", translation: "encontrar", example: "She found a quiet hotel and has found a better routine.", pronunciation: "/faɪnd/", context: "Travel" },
] as const;

export type FocusVocabulary = (typeof focusVocabulary)[number];
