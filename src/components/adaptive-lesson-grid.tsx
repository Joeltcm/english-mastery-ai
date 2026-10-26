"use client";

import { ArrowUpRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

type Lesson = { slug: string; title: string; description: string; type: string; level: string; estimatedMin: number; prompt: string; recommended?: boolean; attemptCount: number };

const tones = ["violet", "sky", "green", "violet"];

export function AdaptiveLessonGrid({ onStart }: { onStart: (prompt?: string) => void }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/lessons").then(async (response) => response.ok ? response.json() : null).then((data: { lessons?: Lesson[] } | null) => {
      if (!cancelled) setLessons(data?.lessons || []);
    }).catch(() => undefined).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="lesson-grid"><div className="card-panel"><span className="eyebrow">ADAPTIVE PLAN</span><p className="assessment-note">Preparing your next lessons…</p></div></div>;

  return <div className="lesson-grid">{lessons.map((lesson, index) => <button className="lesson-card" key={lesson.slug} onClick={() => onStart(lesson.prompt)}><span className={`lesson-number ${tones[index % tones.length]}`}>{String(index + 1).padStart(2, "0")}</span><div>{lesson.recommended && <span className="recommended-label"><Sparkles size={11} /> Recommended next</span>}<span className="eyebrow">{lesson.type.replaceAll("_", " ")} · {lesson.level}</span><h3>{lesson.title}</h3><p>{lesson.description}</p></div><div className="lesson-card-meta"><small>{lesson.estimatedMin} min · {lesson.attemptCount ? `${lesson.attemptCount} completed` : "New lesson"}</small><ArrowUpRight size={17} /></div></button>)}</div>;
}
