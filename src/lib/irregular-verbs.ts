export type IrregularVerb = {
  rank: number;
  base: string;
  past: string;
  participle: string;
  meaning: string;
  example: string;
};

// Practical frequency order for general English. Exact order changes by corpus and context.
export const irregularVerbs: IrregularVerb[] = [
  { rank: 1, base: "be", past: "was / were", participle: "been", meaning: "ser / estar", example: "I was tired, but I have been ready since eight." },
  { rank: 2, base: "have", past: "had", participle: "had", meaning: "tener / haber", example: "We had a meeting and have had good results." },
  { rank: 3, base: "do", past: "did", participle: "done", meaning: "hacer", example: "She did the work and has done it well." },
  { rank: 4, base: "say", past: "said", participle: "said", meaning: "decir", example: "He said hello and has said the same thing before." },
  { rank: 5, base: "go", past: "went", participle: "gone", meaning: "ir", example: "I went to the airport and have gone there many times." },
  { rank: 6, base: "get", past: "got", participle: "got / gotten", meaning: "obtener / llegar / conseguir", example: "We got the update and have gotten better results." },
  { rank: 7, base: "make", past: "made", participle: "made", meaning: "hacer / crear", example: "He made a plan and has made good progress." },
  { rank: 8, base: "know", past: "knew", participle: "known", meaning: "saber / conocer", example: "I knew the answer and have known her for years." },
  { rank: 9, base: "think", past: "thought", participle: "thought", meaning: "pensar", example: "I thought about it and have thought of another option." },
  { rank: 10, base: "take", past: "took", participle: "taken", meaning: "tomar / llevar", example: "She took the train and has taken this route before." },
  { rank: 11, base: "see", past: "saw", participle: "seen", meaning: "ver", example: "We saw the message and have seen it before." },
  { rank: 12, base: "come", past: "came", participle: "come", meaning: "venir", example: "They came early and have come prepared." },
  { rank: 13, base: "find", past: "found", participle: "found", meaning: "encontrar", example: "I found the hotel and have found a better route." },
  { rank: 14, base: "give", past: "gave", participle: "given", meaning: "dar", example: "She gave me directions and has given useful advice." },
  { rank: 15, base: "tell", past: "told", participle: "told", meaning: "decir / contar", example: "He told us the truth and has told the team." },
  { rank: 16, base: "feel", past: "felt", participle: "felt", meaning: "sentir", example: "I felt nervous and have felt more confident today." },
  { rank: 17, base: "become", past: "became", participle: "become", meaning: "convertirse", example: "The task became easier and has become routine." },
  { rank: 18, base: "leave", past: "left", participle: "left", meaning: "dejar / salir", example: "We left early and have left the keys at reception." },
  { rank: 19, base: "put", past: "put", participle: "put", meaning: "poner", example: "I put the file here and have put a note beside it." },
  { rank: 20, base: "mean", past: "meant", participle: "meant", meaning: "significar / querer decir", example: "What did you mean? I meant the earlier version." },
  { rank: 21, base: "keep", past: "kept", participle: "kept", meaning: "mantener / guardar", example: "She kept the receipt and has kept every record." },
  { rank: 22, base: "let", past: "let", participle: "let", meaning: "dejar / permitir", example: "They let us enter and have let us ask questions." },
  { rank: 23, base: "begin", past: "began", participle: "begun", meaning: "comenzar", example: "The class began at nine and has begun smoothly." },
  { rank: 24, base: "show", past: "showed", participle: "shown", meaning: "mostrar", example: "He showed me the screen and has shown the same example." },
  { rank: 25, base: "hear", past: "heard", participle: "heard", meaning: "oír / escuchar", example: "I heard the announcement and have heard it twice." },
  { rank: 26, base: "run", past: "ran", participle: "run", meaning: "correr / funcionar", example: "The system ran well and has run without errors." },
  { rank: 27, base: "bring", past: "brought", participle: "brought", meaning: "traer", example: "She brought the documents and has brought extra copies." },
  { rank: 28, base: "write", past: "wrote", participle: "written", meaning: "escribir", example: "I wrote the email and have written a shorter version." },
  { rank: 29, base: "hold", past: "held", participle: "held", meaning: "sostener / celebrar", example: "We held a meeting and have held several workshops." },
  { rank: 30, base: "stand", past: "stood", participle: "stood", meaning: "estar de pie / soportar", example: "He stood near the door and has stood there all morning." },
  { rank: 31, base: "meet", past: "met", participle: "met", meaning: "conocer / reunirse", example: "We met online and have met every Friday since then." },
  { rank: 32, base: "pay", past: "paid", participle: "paid", meaning: "pagar", example: "I paid the bill and have paid it already." },
  { rank: 33, base: "sit", past: "sat", participle: "sat", meaning: "sentarse", example: "She sat by the window and has sat there before." },
  { rank: 34, base: "speak", past: "spoke", participle: "spoken", meaning: "hablar", example: "He spoke clearly and has spoken with the manager." },
  { rank: 35, base: "lie", past: "lay", participle: "lain", meaning: "recostarse / estar tendido", example: "The phone lay on the desk and has lain there all day." },
  { rank: 36, base: "lead", past: "led", participle: "led", meaning: "liderar / guiar", example: "She led the project and has led the team well." },
  { rank: 37, base: "read", past: "read", participle: "read", meaning: "leer", example: "I read the report and have read the summary too." },
  { rank: 38, base: "grow", past: "grew", participle: "grown", meaning: "crecer", example: "The company grew quickly and has grown internationally." },
  { rank: 39, base: "lose", past: "lost", participle: "lost", meaning: "perder", example: "I lost my ticket but have lost it before." },
  { rank: 40, base: "fall", past: "fell", participle: "fallen", meaning: "caer", example: "The temperature fell and has fallen again today." },
  { rank: 41, base: "send", past: "sent", participle: "sent", meaning: "enviar", example: "I sent the file and have sent the link too." },
  { rank: 42, base: "build", past: "built", participle: "built", meaning: "construir", example: "They built the feature and have built a strong product." },
  { rank: 43, base: "understand", past: "understood", participle: "understood", meaning: "entender", example: "I understood the explanation and have understood the pattern." },
  { rank: 44, base: "draw", past: "drew", participle: "drawn", meaning: "dibujar / sacar", example: "She drew a map and has drawn a useful diagram." },
  { rank: 45, base: "break", past: "broke", participle: "broken", meaning: "romper", example: "The screen broke and has broken again." },
  { rank: 46, base: "spend", past: "spent", participle: "spent", meaning: "gastar / pasar tiempo", example: "We spent two hours there and have spent less this week." },
  { rank: 47, base: "cut", past: "cut", participle: "cut", meaning: "cortar", example: "He cut the cable and has cut the extra part." },
  { rank: 48, base: "rise", past: "rose", participle: "risen", meaning: "subir / elevarse", example: "Prices rose and have risen again this month." },
  { rank: 49, base: "drive", past: "drove", participle: "driven", meaning: "conducir", example: "I drove to work and have driven this route before." },
  { rank: 50, base: "buy", past: "bought", participle: "bought", meaning: "comprar", example: "She bought a ticket and has bought one online before." },
];
