"use client";

import { Activity, Check, DollarSign, Target } from "lucide-react";
import { useEffect, useState } from "react";

export function ProfileSettings({ user, initialMinutes, initialBudget }: { user: { name?: string | null; email?: string | null } | null; initialMinutes: number; initialBudget: number }) {
  const [minutes, setMinutes] = useState(String(initialMinutes));
  const [budget, setBudget] = useState(String(initialBudget));
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<{ inputTokens: number; outputTokens: number; estimatedCostUsd: number; budgetUsd: number; requestCount: number; pricingConfigured: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/usage").then(async (response) => response.ok ? response.json() : null).then((data: { usage?: typeof usage } | null) => { if (data?.usage) setUsage(data.usage); }).catch(() => undefined);
  }, [user]);

  async function save(event: React.FormEvent<HTMLFormElement>, body: { dailyGoalMinutes?: number; monthlyBudgetUsd?: number }, success: string) {
    event.preventDefault(); setStatus(""); setError("");
    const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.error || "Could not update your settings."); else setStatus(success);
  }

  return <><div className="settings-row goal-settings"><div className="settings-icon"><Target size={18} /></div><div><strong>Daily learning goal</strong><small>Choose a sustainable number of minutes for your practice habit.</small></div>{user ? <form className="goal-form" onSubmit={(event) => save(event, { dailyGoalMinutes: Number(minutes) }, "Daily goal updated.")}><input aria-label="Daily learning goal in minutes" type="number" min="5" max="180" value={minutes} onChange={(event) => setMinutes(event.target.value)} /><span>min</span><button className="soft-button" aria-label="Save daily goal"><Check size={14} /> Save</button></form> : <span className="settings-status">Sign in to customize</span>}</div><div className="settings-row goal-settings"><div className="settings-icon"><DollarSign size={18} /></div><div><strong>Monthly AI budget</strong><small>Requests stop after the configured estimated budget when token pricing is configured.</small></div>{user ? <form className="goal-form" onSubmit={(event) => save(event, { monthlyBudgetUsd: Number(budget) }, "Budget updated.")}><span>$</span><input aria-label="Monthly AI budget in dollars" type="number" min="0" max="500" step="0.01" value={budget} onChange={(event) => setBudget(event.target.value)} /><button className="soft-button" aria-label="Save monthly AI budget"><Check size={14} /> Save</button></form> : <span className="settings-status">Sign in to customize</span>}</div>{usage && <div className="usage-summary"><div className="settings-icon"><Activity size={18} /></div><div><strong>AI usage this month</strong><small>{usage.inputTokens + usage.outputTokens} tokens · {usage.requestCount} requests · ${usage.estimatedCostUsd.toFixed(4)} estimated of ${usage.budgetUsd.toFixed(2)}</small><small>{usage.pricingConfigured ? "Budget gate is active." : "Add token pricing variables to calculate cost and enforce the budget."}</small></div></div>}{status && <p className="privacy-message profile-status">{status}</p>}{error && <p className="privacy-error profile-status">{error}</p>}</>;
}
