"use client";

import { Check, Globe2, LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

type User = { name?: string | null; email?: string | null } | null;

export function ToolPermissions({ user, onChanged }: { user: User; onChanged?: (enabled: boolean) => void }) {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch("/api/tools").then(async (response) => response.ok ? response.json() : null).then((data: { tools?: Array<{ provider: string; enabled: boolean }> } | null) => {
      const tool = data?.tools?.find((item) => item.provider === "web_research");
      setEnabled(Boolean(tool?.enabled));
      onChanged?.(Boolean(tool?.enabled));
    }).catch(() => undefined);
  }, [user, onChanged]);

  async function toggle() {
    if (!user || busy) return;
    const next = !enabled;
    setBusy(true); setError(""); setMessage("");
    const response = await fetch("/api/tools", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "web_research", enabled: next }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.error || "The tool permission could not be changed.");
    else { setEnabled(next); onChanged?.(next); setMessage(next ? "Web research is enabled. You still approve each search from the chat." : "Web research is disabled."); }
    setBusy(false);
  }

  if (!user) return <div className="settings-row"><div className="settings-icon"><Globe2 size={18} /></div><div><strong>Web research</strong><small>Sign in to control external search permissions.</small></div><span className="settings-status">Not connected</span></div>;
  return <div className="settings-row tool-permission-row"><div className="settings-icon"><Globe2 size={18} /></div><div><strong>Optional web research</strong><small>Allows public web searches with citations. Each chat search still requires your explicit toggle.</small></div><button className="toggle" aria-label="Toggle web research permission" aria-pressed={enabled} onClick={() => void toggle()} disabled={busy}><span className={enabled ? "toggle-knob on" : "toggle-knob"}>{busy ? <LoaderCircle className="spin" size={11} /> : enabled ? <Check size={11} /> : null}</span></button>{message && <small className="tool-permission-message">{message}</small>}{error && <small className="privacy-error tool-permission-message">{error}</small>}<span className={enabled ? "settings-status enabled" : "settings-status"}>{enabled ? <><ShieldCheck size={12} /> Enabled</> : "Disabled"}</span></div>;
}
