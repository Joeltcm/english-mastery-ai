"use client";

import { Download, LockKeyhole, Pencil, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

type User = { name?: string | null; email?: string | null } | null;
type Memory = { id: string; key: string; value: string; category?: string | null; approved: boolean };

export function PrivacyControls({ user, onDeleted }: { user: User; onDeleted: () => void }) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoryKey, setMemoryKey] = useState("");
  const [memoryValue, setMemoryValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch("/api/memories")
      .then(async (response) => response.ok ? response.json() : null)
      .then((data: { memories?: Memory[] } | null) => setMemories(data?.memories || []))
      .catch(() => undefined);
  }, [user]);

  async function exportData() {
    setError(""); setMessage("");
    const response = await fetch("/api/privacy/export");
    if (!response.ok) { setError((await response.json().catch(() => ({}))).error || "Export failed."); return; }
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "english-mastery-data.json"; link.click(); URL.revokeObjectURL(url); setMessage("Your export is ready.");
  }

  async function addMemory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!memoryKey.trim() || !memoryValue.trim()) return; setBusy(true); setError(""); setMessage("");
    const response = await fetch("/api/memories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: memoryKey, value: memoryValue, category: "learning" }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.error || "Memory could not be saved."); else { setMemories((current) => [data.memory, ...current.filter((item) => item.key !== data.memory.key)]); setMemoryKey(""); setMemoryValue(""); setMessage("Memory saved with your approval."); }
    setBusy(false);
  }

  async function removeMemory(id: string) {
    const response = await fetch(`/api/memories/${id}`, { method: "DELETE" });
    if (response.ok) setMemories((current) => current.filter((item) => item.id !== id));
  }

  async function saveMemoryEdit(id: string) {
    if (!editingValue.trim()) return;
    const response = await fetch(`/api/memories/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: editingValue }) });
    if (!response.ok) { setError((await response.json().catch(() => ({}))).error || "Memory could not be updated."); return; }
    setMemories((current) => current.map((memory) => memory.id === id ? { ...memory, value: editingValue.trim() } : memory));
    setEditingId(null); setEditingValue(""); setMessage("Memory updated with your approval.");
  }

  async function deleteAccount() {
    if (!window.confirm("This permanently deletes your account and learning data. Continue?")) return;
    setBusy(true); setError("");
    const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation: "DELETE MY ACCOUNT" }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error || "Account deletion failed."); setBusy(false); return; }
    onDeleted();
  }

  if (!user) return <div className="privacy-card"><div className="settings-icon"><LockKeyhole size={18} /></div><div><strong>Privacy controls</strong><small>Sign in to export data, manage memory, or delete your account.</small></div><span className="settings-status">Not connected</span></div>;

  return <div className="privacy-stack"><div className="privacy-card"><div className="settings-icon"><ShieldCheck size={18} /></div><div><strong>Privacy controls</strong><small>Conversations, reviews, and memories stay scoped to your account.</small></div><button className="soft-button" onClick={exportData}><Download size={14} /> Export data</button></div><div className="memory-card"><div className="panel-heading"><div><span className="eyebrow">YOUR MEMORY</span><h3>What should the tutor remember?</h3></div><span className="settings-status enabled">User approved</span></div><p className="memory-help">Only save preferences you choose, such as your goals, recurring contexts, or correction preferences.</p><form className="memory-form" onSubmit={addMemory}><input value={memoryKey} onChange={(event) => setMemoryKey(event.target.value)} placeholder="Label, e.g. Goal" aria-label="Memory label" maxLength={80} /><input value={memoryValue} onChange={(event) => setMemoryValue(event.target.value)} placeholder="Value, e.g. Practice travel English" aria-label="Memory value" maxLength={500} /><button className="soft-button" disabled={busy}><Plus size={14} /> Save</button></form>{memories.length > 0 && <div className="memory-list">{memories.map((memory) => <div className="memory-row" key={memory.id}>{editingId === memory.id ? <><input className="memory-edit-input" value={editingValue} onChange={(event) => setEditingValue(event.target.value)} maxLength={500} aria-label={`Edit ${memory.key}`} /><button className="soft-button" onClick={() => void saveMemoryEdit(memory.id)}>Save</button><button className="icon-button" onClick={() => setEditingId(null)} aria-label="Cancel edit"><X size={15} /></button></> : <><div><strong>{memory.key}</strong><small>{memory.value}</small></div><button className="icon-button" onClick={() => { setEditingId(memory.id); setEditingValue(memory.value); }} aria-label={`Edit ${memory.key}`}><Pencil size={14} /></button><button className="icon-button" onClick={() => void removeMemory(memory.id)} aria-label={`Delete ${memory.key}`}><X size={15} /></button></>}</div>)}</div>}</div><div className="privacy-danger"><div><strong>Delete account and learning data</strong><small>This permanently removes conversations, progress, reviews, memories, and tool records.</small></div><button className="danger-button" onClick={deleteAccount} disabled={busy}><Trash2 size={14} /> Delete account</button></div>{message && <p className="privacy-message">{message}</p>}{error && <p className="privacy-error">{error}</p>}</div>;
}
