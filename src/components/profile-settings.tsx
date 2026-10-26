"use client";

import { Check, Target } from "lucide-react";
import { useState } from "react";

export function ProfileSettings({ user, initialMinutes }: { user: { name?: string | null; email?: string | null } | null; initialMinutes: number }) {
  const [minutes, setMinutes] = useState(String(initialMinutes));
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus(""); setError("");
    const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dailyGoalMinutes: Number(minutes) }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.error || "Could not update your goal."); else setStatus("Daily goal updated.");
  }

  return <div className="settings-row goal-settings"><div className="settings-icon"><Target size={18} /></div><div><strong>Daily learning goal</strong><small>Choose a sustainable number of minutes for your practice habit.</small></div>{user ? <form className="goal-form" onSubmit={save}><input aria-label="Daily learning goal in minutes" type="number" min="5" max="180" value={minutes} onChange={(event) => setMinutes(event.target.value)} /><span>min</span><button className="soft-button" aria-label="Save daily goal"><Check size={14} /> Save</button></form> : <span className="settings-status">Sign in to customize</span>}{status && <span className="settings-status enabled">{status}</span>}{error && <span className="privacy-error">{error}</span>}</div>;
}
