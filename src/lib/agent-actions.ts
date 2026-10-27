export type AgentView = "overview" | "chat" | "learn" | "progress" | "settings";

export type AgentAction =
  | { type: "navigate"; view: AgentView }
  | { type: "set-mode"; mode: "TUTOR" | "SMART" }
  | { type: "open-voice" }
  | { type: "start-practice"; mode: "TUTOR" | "SMART"; prompt: string }
  | { type: "set-theme"; darkMode: boolean };

function normalizeCommand(input: string) {
  return input
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matches(command: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(command));
}

export function parseAgentCommand(input: string): AgentAction | null {
  const command = normalizeCommand(input);
  if (!command) return null;

  if (matches(command, [
    /\b(modo|mode|switch to|cambia a|pasame a|quiero practicar con|start)\s+(el\s+)?(tutor|english tutor)\b/,
    /\b(practicar|practice)\s+(ingles|english)\s+(con\s+)?(el\s+)?tutor\b/,
    /\b(quiero|i want to)\s+(practicar|practice)\s+(con\s+)?(el\s+)?tutor\b/,
  ])) return { type: "set-mode", mode: "TUTOR" };

  if (matches(command, [
    /\b(modo|mode|switch to|cambia a|pasame a|start)\s+(smart|inteligente|smart learning)\b/,
    /\b(aprendizaje|learning)\s+(inteligente|smart)\b/,
    /\b(quiero|i want to)\s+(aprender|study|learn)\s+(de forma\s+)?(inteligente|smart)\b/,
  ])) return { type: "set-mode", mode: "SMART" };

  if (matches(command, [
    /\b(abre|abrir|inicia|iniciar|start|open|quiero)\b.*\b(voz|voice|microfono|microphone|hablar en vivo|live audio)\b/,
    /\b(practicar|practice|conversar|talk)\s+(por|in|with)\s+(voz|voice)\b/,
  ])) return { type: "open-voice" };

  if (matches(command, [
    /\b(practica|practicar|repasa|repasar|practice|review|drill)\b.*\b(verbos irregulares|irregular verbs|vocabulario|vocabulary|travel|viaje|work|trabajo|technology|tecnologia)\b/,
    /\b(start|begin|inicia|iniciar|preparame|preparar)\b.*\b(practica|practice|sesion|session)\b/,
  ])) return { type: "start-practice", mode: "TUTOR", prompt: "Let’s practice irregular verbs and contextual vocabulary in a natural conversation." };

  if (matches(command, [
    /\b(activa|activar|enciende|encender|turn on|enable)\b.*\b(modo oscuro|dark mode|tema oscuro|dark theme)\b/,
  ])) return { type: "set-theme", darkMode: true };

  if (matches(command, [
    /\b(deshactiva|desactivar|apaga|apagar|turn off|disable)\b.*\b(modo oscuro|dark mode|tema oscuro|dark theme)\b/,
  ])) return { type: "set-theme", darkMode: false };

  if (matches(command, [
    /\b(muestrame|ensename|abre|ir a|llevame|go to|take me to|open|show me)\b.*\b(progreso|avance|progress|stats|estadisticas|performance|como voy|how am i doing)\b/,
    /\b(como voy|dime como voy|how am i doing|tell me how (?:am i|i(?:'m| am)) doing|how is my progress)\b/,
    /\b(quiero|i want to)\s+(ver|revisar|see|check)\s+(mi|my)?\s*(progreso|avance|progress|stats)\b/,
  ])) return { type: "navigate", view: "progress" };

  if (matches(command, [
    /\b(muestrame|ensename|abre|ir a|llevame|go to|take me to|open|show me)\b.*\b(ruta de aprendizaje|plan de estudio|lecciones|learning path|study plan|lessons)\b/,
    /\b(quiero|i want to)\s+(estudiar|study|learn|practicar|practice)\b/,
    /\b(start|begin)\s+(learning|studying|a lesson)\b/,
  ])) return { type: "navigate", view: "learn" };

  if (matches(command, [
    /\b(abre|ir a|llevame|go to|take me to|open|show me)\b.*\b(configuracion|ajustes|settings|preferences)\b/,
  ])) return { type: "navigate", view: "settings" };

  if (matches(command, [
    /\b(muestrame|ensename|abre|ir a|llevame|go to|take me to|open|show me)\b.*\b(inicio|resumen|panel|home|overview|dashboard)\b/,
    /\b(volver|regresar|go back)\s+(al\s+)?(inicio|home)\b/,
  ])) return { type: "navigate", view: "overview" };

  if (matches(command, [
    /\b(muestrame|ensename|abre|ir a|llevame|go to|take me to|open|show me)\b.*\b(chat|conversacion|conversation|assistant|asistente)\b/,
    /\b(hablemos|lets chat|start a conversation|iniciar una conversacion)\b/,
  ])) return { type: "navigate", view: "chat" };

  return null;
}

export function describeAgentAction(action: AgentAction) {
  if (action.type === "set-mode") return action.mode === "TUTOR" ? "Let’s practice with your English Tutor." : "Let’s continue with Smart Learning.";
  if (action.type === "open-voice") return "Opening live voice practice.";
  if (action.type === "start-practice") return "I’m preparing a focused practice session for you.";
  if (action.type === "set-theme") return action.darkMode ? "I’m turning dark mode on." : "I’m turning dark mode off.";
  const copy: Record<AgentView, string> = {
    overview: "Opening your overview.",
    chat: "Opening your conversation space.",
    learn: "Opening your learning path.",
    progress: "Opening your progress.",
    settings: "Opening your settings.",
  };
  return copy[action.view];
}
