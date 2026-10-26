"use client";

import { CheckCircle2, ClipboardCheck, LockKeyhole, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";

type User = { name?: string | null; email?: string | null } | null;
type Question = { id: string; prompt: string; context: string; options: string[]; correct: string; skill: "grammar" | "vocabulary" };

const questions: Question[] = [
  { id: "travel-past", prompt: "Yesterday I ___ to the airport before sunrise.", context: "Travel", options: ["go", "went", "gone"], correct: "went", skill: "grammar" },
  { id: "work-participle", prompt: "She has ___ a clear plan for the new project.", context: "Work", options: ["make", "made", "making"], correct: "made", skill: "grammar" },
  { id: "hotel-meaning", prompt: "At a hotel, what does ‘check in’ mean?", context: "Travel", options: ["Register when you arrive", "Leave the room", "Ask for a discount"], correct: "Register when you arrive", skill: "vocabulary" },
  { id: "tech-verb", prompt: "We ___ the latest update this morning.", context: "Technology", options: ["get", "got", "getting"], correct: "got", skill: "grammar" },
  { id: "international-phrase", prompt: "Which sentence sounds natural in an international meeting?", context: "International", options: ["Could you give me a moment?", "Could you gave me a moment?", "Could you giving me a moment?"], correct: "Could you give me a moment?", skill: "vocabulary" },
  { id: "daily-life-see", prompt: "I have ___ that movie twice.", context: "Daily life", options: ["saw", "see", "seen"], correct: "seen", skill: "grammar" },
];

export function AssessmentCard({ user }: { user: User }) {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ level: string; overall: number; grammar: number; vocabulary: number } | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [error, setError] = useState("");
  const startedAtRef = useRef<number | null>(null);

  function finish() {
    const correctAnswers = questions.map((question) => ({ questionId: question.id, answer: answers[question.id] || "", correct: answers[question.id] === question.correct }));
    const overall = Math.round((correctAnswers.filter((answer) => answer.correct).length / questions.length) * 100);
    const grammarQuestions = questions.filter((question) => question.skill === "grammar"); const vocabularyQuestions = questions.filter((question) => question.skill === "vocabulary");
    const grammar = Math.round((grammarQuestions.filter((question) => answers[question.id] === question.correct).length / grammarQuestions.length) * 100); const vocabulary = Math.round((vocabularyQuestions.filter((question) => answers[question.id] === question.correct).length / vocabularyQuestions.length) * 100);
    const level = overall >= 84 ? "B2" : overall >= 58 ? "B1" : "A2";
    const next = { level, overall, grammar, vocabulary }; setResult(next); setStarted(false); setError("");
    if (user) {
      const elapsedMinutes = Math.max(1, Math.min(30, Math.ceil((Date.now() - (startedAtRef.current || Date.now())) / 60_000)));
      void fetch("/api/study-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activity: "initial-assessment", minutes: elapsedMinutes, metadata: { questionCount: questions.length } }) }).catch(() => undefined);
    }
    if (user) fetch("/api/assessment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "initial-focus", level, scores: next, answers: correctAnswers }) }).then(async (response) => { const data = await response.json().catch(() => ({})); setSaved(response.ok && Boolean(data.saved)); setSaveAttempted(true); }).catch(() => setSaveAttempted(true));
  }

  if (result) return <section className="assessment-card card-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR CHECK-IN</span><h3>Starting point: {result.level}</h3></div><CheckCircle2 className="panel-spark" size={19} /></div><div className="assessment-result"><strong>{result.overall}%</strong><span>focus score</span></div><div className="assessment-bars"><div><span>Grammar</span><strong>{result.grammar}%</strong></div><div><span>Context vocabulary</span><strong>{result.vocabulary}%</strong></div></div><p className="assessment-note">Your plan will recycle irregular verbs in real situations and keep strengthening the areas that need more retrieval.</p>{user ? saved ? <span className="assessment-saved">Saved to your learning profile</span> : saveAttempted ? <span className="assessment-saving">Local result — connect PostgreSQL to sync this result.</span> : <span className="assessment-saving">Saving to your profile…</span> : <span className="assessment-saving"><LockKeyhole size={13} /> Sign in to save this result</span>}<button className="soft-button" onClick={() => { setResult(null); setAnswers({}); setSaveAttempted(false); setSaved(false); }}><RotateCcw size={14} /> Retake check-in</button></section>;

  if (!started) return <section className="assessment-card card-panel"><div className="panel-heading"><div><span className="eyebrow">INITIAL CHECK-IN</span><h3>Find your best starting point</h3></div><ClipboardCheck className="panel-spark" size={19} /></div><p className="assessment-note">Six short questions across irregular verbs and real-world vocabulary. It takes about two minutes and gives the learning path a useful baseline.</p><button className="primary-button" onClick={() => { startedAtRef.current = Date.now(); setStarted(true); }}><ClipboardCheck size={16} /> Start check-in</button></section>;

  return <section className="assessment-card card-panel"><div className="panel-heading"><div><span className="eyebrow">INITIAL CHECK-IN</span><h3>Choose the sentence that fits</h3></div><span className="progress-badge">{Object.keys(answers).length} / {questions.length}</span></div><div className="assessment-questions">{questions.map((question) => <fieldset key={question.id}><legend><span>{question.context}</span>{question.prompt}</legend><div className="assessment-options">{question.options.map((option) => <label key={option} className={answers[question.id] === option ? "assessment-option selected" : "assessment-option"}><input type="radio" name={question.id} value={option} checked={answers[question.id] === option} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option }))} />{option}</label>)}</div></fieldset>)}</div>{error && <p className="form-error">{error}</p>}<button className="primary-button" onClick={() => { if (Object.keys(answers).length !== questions.length) { setError("Answer every question to get a useful baseline."); return; } finish(); }} disabled={Object.keys(answers).length !== questions.length}>Finish check-in</button></section>;
}
