"use client";

import { ArrowUpRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

type Lesson = { slug: string; title: string; description: string; type: string; level: string; estimatedMin: number; prompt: string; recommended?: boolean; attemptCount: number };

const tones = ["violet", "sky", "green", "violet"];

export function AdaptiveLessonGrid({ onStart }: { onStart: (prompt?: string) => void }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/lessons").then(async (response) => response.ok ? response.json() : null).then((data: { lessons?: Lesson[] } | null) => {
      if (!cancelled) setLessons(data?.lessons || []);
    }).catch(() => undefined).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="lesson-grid"><div className="card-panel"><span className="eyebrow">ADAPTIVE PLAN</span><p className="assessment-note">Preparing your next lessons…</p></div></div>;

  async function markPracticed(lesson: Lesson) {
    setSavingSlug(lesson.slug);
    const response = await fetch(`/api/lessons/${lesson.slug}/attempt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    if (response.ok) setLessons((current) => current.map((item) => item.slug === lesson.slug ? { ...item, attemptCount: item.attemptCount + 1, recommended: false } : item));
    setSavingSlug(null);
  }

  return <div className="lesson-grid">{lessons.map((lesson, index) => <article className="lesson-card" key={lesson.slug}><span className={`lesson-number ${tones[index % tones.length]}`}>{String(index + 1).padStart(2, "0")}</span><div>{lesson.recommended && <span className="recommended-label"><Sparkles size={11} /> Recommended next</span>}<span className="eyebrow">{lesson.type.replaceAll("_", " ")} · {lesson.level}</span><h3>{lesson.title}</h3><p>{lesson.description}</p></div><div className="lesson-card-meta"><small>{lesson.estimatedMin} min · {lesson.attemptCount ? `${lesson.attemptCount} completed` : "New lesson"}</small><div className="lesson-card-actions"><button className="lesson-open-button" onClick={() => onStart(lesson.prompt)}>Open lesson <ArrowUpRight size={14} /></button><button className="lesson-complete-button" onClick={() => void markPracticed(lesson)} disabled={savingSlug === lesson.slug}>{savingSlug === lesson.slug ? "Saving…" : lesson.attemptCount ? "Practice again" : "Mark practiced"}</button></div></div></article>)}</div>;
}
