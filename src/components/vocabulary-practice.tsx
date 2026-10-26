"use client";

import { Check, ChevronRight, RotateCcw, Sparkles, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { focusVocabulary } from "@/lib/vocabulary";

type VocabularyItem = { id: string; term: string; translation: string; example: string; pronunciation: string; context: string };
type Rating = "AGAIN" | "HARD" | "GOOD" | "EASY";
type User = { name?: string | null; email?: string | null } | null;

const forms: Record<string, string> = { go: "went · gone", take: "took · taken", get: "got · gotten", make: "made · made", see: "saw · seen", give: "gave · given", know: "knew · known", find: "found · found" };
const contexts = ["Mixed", "Travel", "Daily life", "Work", "Technology", "International", "Conversation"];

const localItems: VocabularyItem[] = focusVocabulary.map((item) => ({ ...item, id: `local-${item.term}` }));

export function VocabularyPractice({ user }: { user: User }) {
  const [items, setItems] = useState<VocabularyItem[]>(localItems);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [context, setContext] = useState("Mixed");
  const [reviewed, setReviewed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/vocabulary")
      .then(async (response) => response.ok ? response.json() : null)
      .then((data: { items?: Array<Omit<VocabularyItem, "context">> } | null) => {
        if (cancelled || !data?.items?.length) return;
        const contextByTerm = new Map(localItems.map((item) => [item.term, item.context]));
        setItems(data.items.map((item) => ({ ...item, example: item.example || "Use this verb in a sentence about your day.", pronunciation: item.pronunciation || "", context: contextByTerm.get(item.term) || "Mixed" })));
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  const filteredItems = useMemo(() => context === "Mixed" ? items : items.filter((item) => item.context === context), [context, items]);
  const current = filteredItems[index % Math.max(1, filteredItems.length)] || items[0];

  function nextCard() {
    setIndex((value) => value + 1);
    setRevealed(false);
    setFeedback("");
  }

  async function rate(rating: Rating) {
    if (!current) return;
    setReviewed((value) => value + 1);
    setFeedback(rating === "EASY" ? "Great recall — this one can wait longer." : rating === "GOOD" ? "Nice. We’ll bring it back later." : rating === "HARD" ? "No problem. We’ll recycle it soon." : "That’s useful information. Let’s try it again.");
    if (!current.id.startsWith("local-")) {
      await fetch("/api/vocabulary/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vocabularyId: current.id, rating }) }).catch(() => undefined);
    }
    window.setTimeout(nextCard, 420);
  }

  if (!current) return null;

  return <section className="vocabulary-practice card-panel">
    <div className="panel-heading"><div><span className="eyebrow">RECALL LAB</span><h3>Irregular verbs that live in context</h3></div><span className="progress-badge">{reviewed} reviewed</span></div>
    <div className="context-filter" aria-label="Vocabulary environment">{contexts.map((item) => <button key={item} className={context === item ? "context-chip active" : "context-chip"} onClick={() => { setContext(item); setIndex(0); setRevealed(false); }}>{item}</button>)}</div>
    <div className="flashcard" aria-live="polite"><div className="flashcard-top"><span className="flashcard-context">{current.context}</span><span>{loading ? "Syncing your deck…" : `${(index % Math.max(1, filteredItems.length)) + 1} / ${filteredItems.length}`}</span></div><div className="flashcard-word"><strong>{current.term}</strong><small>{forms[current.term] || current.pronunciation}</small></div>{revealed ? <div className="flashcard-answer"><strong>{current.translation}</strong><p>{current.example}</p></div> : <button className="reveal-button" onClick={() => setRevealed(true)}><Sparkles size={16} /> Reveal meaning and example</button>}</div>
    {revealed && <div className="rating-row"><span className="rating-prompt">How easy was it to recall?</span><div className="rating-buttons"><button className="rating-again" onClick={() => rate("AGAIN")}><RotateCcw size={14} /> Again</button><button className="rating-hard" onClick={() => rate("HARD")}>Hard</button><button className="rating-good" onClick={() => rate("GOOD")}><Check size={14} /> Good</button><button className="rating-easy" onClick={() => rate("EASY")}>Easy</button></div></div>}
    {feedback && <p className="review-feedback">{feedback} <ChevronRight size={14} /></p>}
    <div className="flashcard-footer"><span><Volume2 size={14} /> Say the verb out loud, then make your own sentence.</span><span>{filteredItems.length} focus words</span></div>
  </section>;
}
