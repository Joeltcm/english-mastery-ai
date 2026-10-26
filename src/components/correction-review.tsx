"use client";

import { CheckCircle2, RotateCcw } from "lucide-react";
import { useState } from "react";

type Correction = { id: string; correctedText: string; explanationEs: string; resolved: boolean };

export function CorrectionReview({ initialErrors }: { initialErrors: Correction[] }) {
  const [errors, setErrors] = useState(initialErrors);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggle(error: Correction) {
    if (busyId) return;
    setBusyId(error.id);
    const response = await fetch(`/api/grammar-errors/${error.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resolved: !error.resolved }) });
    if (response.ok) setErrors((current) => current.map((item) => item.id === error.id ? { ...item, resolved: !item.resolved } : item));
    setBusyId(null);
  }

  return <div className="correction-review"><span className="eyebrow">CORRECTION REVIEW</span>{errors.map((error) => <div className={error.resolved ? "correction-row resolved" : "correction-row"} key={error.id}><div><strong>{error.correctedText}</strong><small>{error.explanationEs}</small></div><button className="icon-button" onClick={() => void toggle(error)} disabled={busyId === error.id} aria-label={error.resolved ? "Reopen correction" : "Mark correction as practiced"}>{error.resolved ? <RotateCcw size={14} /> : <CheckCircle2 size={14} />}</button></div>)}</div>;
}
