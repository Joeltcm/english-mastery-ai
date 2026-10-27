import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

async function loadTypeScriptModule(relativePath) {
  const source = readFileSync(join(root, relativePath), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

test("correction extraction requires explicit correction and Spanish explanation labels", async () => {
  const { extractCorrection, removeCorrectionLabels } = await loadTypeScriptModule("src/lib/corrections.ts");
  assert.deepEqual(extractCorrection("Correction: I went to the airport.\nNatural alternative: I headed to the airport.\nExplicación (ES): Usamos el pasado irregular de go."), {
    correctedText: "I went to the airport.",
    naturalAlternative: "I headed to the airport.",
    explanationEs: "Usamos el pasado irregular de go.",
  });
  assert.equal(extractCorrection("That sentence is understandable, but no correction block was provided."), null);
  assert.equal(extractCorrection("Correction: I went to the airport."), null);
  assert.equal(removeCorrectionLabels("The answer is ready.\nCorrection: I went to the airport.\nExplicación (ES): Usa went."), "The answer is ready.");
});

test("learning prompts preserve the original request and active focus", async () => {
  const { buildSystemPrompt } = await loadTypeScriptModule("src/lib/learning.ts");
  const tutorPrompt = buildSystemPrompt("TUTOR");
  const smartPrompt = buildSystemPrompt("SMART");
  const assistantPrompt = buildSystemPrompt("ASSISTANT");
  assert.match(tutorPrompt, /Always answer the original request/);
  assert.match(tutorPrompt, /Correction:/);
  assert.match(tutorPrompt, /Explicación \(ES\)/);
  assert.match(smartPrompt, /adaptive coaching/);
  assert.match(smartPrompt, /go\/went\/gone/);
  assert.match(assistantPrompt, /vocabulary, word-choice, collocation/);
  assert.match(assistantPrompt, /Correction:/);
  assert.match(assistantPrompt, /Explicación \(ES\)/);
});

test("agent commands understand natural Spanish and English requests", async () => {
  const { parseAgentCommand } = await loadTypeScriptModule("src/lib/agent-actions.ts");
  assert.deepEqual(parseAgentCommand("muéstrame mi progreso"), { type: "navigate", view: "progress" });
  assert.deepEqual(parseAgentCommand("open the learning path"), { type: "navigate", view: "learn" });
  assert.deepEqual(parseAgentCommand("quiero practicar con el tutor"), { type: "set-mode", mode: "TUTOR" });
  assert.deepEqual(parseAgentCommand("switch to smart learning"), { type: "set-mode", mode: "SMART" });
  assert.deepEqual(parseAgentCommand("abre configuración"), { type: "navigate", view: "settings" });
  assert.deepEqual(parseAgentCommand("start voice practice"), { type: "open-voice" });
  assert.deepEqual(parseAgentCommand("repasa verbos irregulares conmigo"), { type: "start-practice", mode: "TUTOR", prompt: "Let’s practice irregular verbs and contextual vocabulary in a natural conversation." });
  assert.deepEqual(parseAgentCommand("turn on dark mode"), { type: "set-theme", darkMode: true });
  assert.deepEqual(parseAgentCommand("apaga el modo oscuro"), { type: "set-theme", darkMode: false });
  assert.equal(parseAgentCommand("What is the difference between went and gone?"), null);
});

test("adaptive lesson ordering prioritizes pending lessons in the weaker focus", async () => {
  const { orderLessons } = await loadTypeScriptModule("src/lib/lesson-order.ts");
  const lessons = [
    { slug: "done-grammar", focus: "grammar", attemptCount: 1 },
    { slug: "pending-vocabulary", focus: "vocabulary", attemptCount: 0 },
    { slug: "pending-mixed", focus: "mixed", attemptCount: 0 },
  ];
  assert.deepEqual(orderLessons(lessons, "vocabulary").map((lesson) => lesson.slug), ["pending-vocabulary", "pending-mixed", "done-grammar"]);
});

test("vocabulary deck covers every requested environment", async () => {
  const { focusVocabulary } = await loadTypeScriptModule("src/lib/vocabulary.ts");
  const contexts = new Set(focusVocabulary.map((item) => item.context));
  for (const context of ["Travel", "Daily life", "Work", "Technology", "International", "Conversation"]) assert.equal(contexts.has(context), true, context);
  assert.equal(focusVocabulary.length >= 20, true);
});

test("progress date helpers respect the learner time zone", async () => {
  const { localDateKey, startOfLocalDay } = await loadTypeScriptModule("src/lib/time.ts");
  const latePanamaNight = new Date("2026-10-26T04:00:00.000Z");
  assert.equal(localDateKey(latePanamaNight, "America/Panama"), "2026-10-25");
  assert.equal(startOfLocalDay(latePanamaNight, "America/Panama").toISOString(), "2026-10-25T05:00:00.000Z");
});

test("study streaks use local calendar days", async () => {
  const { calculateStudyStreak } = await loadTypeScriptModule("src/lib/time.ts");
  const lateNightPanama = new Date("2026-10-26T04:00:00.000Z");
  assert.equal(calculateStudyStreak([new Date("2026-10-26T04:00:00.000Z"), new Date("2026-10-25T04:00:00.000Z")], lateNightPanama, "America/Panama"), 2);
  assert.equal(calculateStudyStreak([new Date("2026-10-26T04:00:00.000Z"), new Date("2026-10-25T04:00:00.000Z")], new Date("2026-10-26T06:00:00.000Z"), "America/Panama"), 2);
});

test("pronunciation audio is normalized to mono 16 kHz PCM WAV", async () => {
  const { encodePcmWav } = await loadTypeScriptModule("src/lib/audio.ts");
  const wav = encodePcmWav({ numberOfChannels: 2, length: 4, sampleRate: 8_000, getChannelData: (channel) => new Float32Array(channel === 0 ? [0, 0.5, 1, 0] : [0, -0.5, -1, 0]) });
  const bytes = new Uint8Array(await wav.arrayBuffer());
  const view = new DataView(bytes.buffer);
  assert.equal(wav.type, "audio/wav");
  assert.equal(view.getUint16(22, true), 1);
  assert.equal(view.getUint32(24, true), 16_000);
  assert.equal(view.getUint16(34, true), 16);
  assert.equal(view.getUint32(40, true), 16);
});
