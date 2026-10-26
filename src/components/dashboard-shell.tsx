"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Activity, ArrowUpRight, BarChart3, BookOpenCheck, BrainCircuit, CheckCircle2, ChevronRight, Clock3, Flame, LayoutDashboard, LockKeyhole, Menu, MessageCircle, Mic, Moon, Paperclip, Send, Settings2, Sparkles, SunMedium, Target, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { VocabularyPractice } from "@/components/vocabulary-practice";
import { VoicePractice } from "@/components/voice-practice";
import { PrivacyControls } from "@/components/privacy-controls";
import { AssessmentCard } from "@/components/assessment-card";
import { ProfileSettings } from "@/components/profile-settings";
import { TravelSimulation } from "@/components/travel-simulation";
import { PronunciationPractice } from "@/components/pronunciation-practice";
import { AdaptiveLessonGrid } from "@/components/adaptive-lesson-grid";
import { ToolPermissions } from "@/components/tool-permissions";
import { extractCorrection } from "@/lib/corrections";

type Mode = "ASSISTANT" | "TUTOR" | "SMART";
type View = "overview" | "chat" | "learn" | "progress" | "settings";
type ChatMessage = { id: string; role: "user" | "assistant"; content: string };
type ConversationSummary = { id: string; title: string; mode: Mode; updatedAt: string };
type Profile = { proficiencyLevel: string; dailyGoalMinutes: number; currentStreak: number; totalStudyMinutes: number; grammarScore: number; vocabularyScore: number; monthlyBudgetUsd: number };

const modeInfo: Record<Mode, { label: string; eyebrow: string; description: string; color: string }> = {
  ASSISTANT: { label: "Assistant", eyebrow: "GENERAL SUPPORT", description: "Technology, business, travel, research, and everyday questions.", color: "violet" },
  TUTOR: { label: "English Tutor", eyebrow: "PRACTICE MODE", description: "Get corrections, explanations in Spanish, and a confidence boost.", color: "sky" },
  SMART: { label: "Smart Learning", eyebrow: "ADAPTIVE MODE", description: "Solve the task while turning your conversation into progress.", color: "emerald" },
};

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard }, { id: "chat", label: "AI Conversation", icon: MessageCircle }, { id: "learn", label: "Learning Path", icon: BookOpenCheck }, { id: "progress", label: "Progress", icon: BarChart3 }, { id: "settings", label: "Settings", icon: Settings2 },
];

const starterMessages: ChatMessage[] = [{ id: "welcome", role: "assistant", content: "Welcome back. I’m ready to help you think, learn, and speak with more confidence. What would you like to work on today?" }];

function saveCorrection(originalText: string, assistantText: string) {
  const correction = extractCorrection(assistantText);
  if (!correction) return;
  void fetch("/api/grammar-errors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ originalText, correctedText: correction.correctedText, naturalAlternative: correction.naturalAlternative, explanationEs: correction.explanationEs }) }).catch(() => undefined);
}

export function DashboardShell({ initialUser, initialProfile }: { initialUser: { name?: string | null; email?: string | null } | null; initialProfile: Profile | null }) {
  const { data: session, status } = useSession();
  const user = status === "loading" ? initialUser : session?.user ?? null;
  const userEmail = user?.email;
  const [activeView, setActiveView] = useState<View>("overview");
  const [mode, setMode] = useState<Mode>("SMART");
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [draft, setDraft] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [authOpen, setAuthOpen] = useState(!user);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [webResearch, setWebResearch] = useState(false);
  const [webResearchAllowed, setWebResearchAllowed] = useState(false);
  const [liveProfile, setLiveProfile] = useState<Profile | null>(null);
  const [todayStudyMinutes, setTodayStudyMinutes] = useState(0);

  const handleToolPermissionChange = useCallback((enabled: boolean) => {
    setWebResearchAllowed(enabled);
    if (!enabled) setWebResearch(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/conversations")
      .then(async (response) => response.ok ? response.json() : null)
      .then(async (data: { conversations?: ConversationSummary[] } | null) => {
        setConversations(data?.conversations || []);
        const latest = data?.conversations?.[0];
        if (!latest || cancelled) return;
        const detailResponse = await fetch(`/api/conversations/${latest.id}`);
        const detail = await detailResponse.json() as { conversation?: { id: string; messages: Array<{ id: string; role: "USER" | "ASSISTANT"; content: string }> } };
        if (cancelled || !detail.conversation) return;
        setConversationId(detail.conversation.id);
        setMessages(detail.conversation.messages.map((message) => ({ id: message.id, role: message.role === "USER" ? "user" : "assistant", content: message.content })));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!userEmail) return;
    let cancelled = false;
    fetch("/api/progress").then(async (response) => response.ok ? response.json() : null).then((data: { progress?: { profile?: Partial<Profile> | null; todayStudyMinutes?: number } } | null) => {
      if (cancelled || !data?.progress) return;
      if (data.progress.profile) setLiveProfile((current) => ({ proficiencyLevel: "B1", dailyGoalMinutes: 20, currentStreak: 0, totalStudyMinutes: 0, grammarScore: 62, vocabularyScore: 48, monthlyBudgetUsd: 5, ...current, ...data.progress?.profile }));
      setTodayStudyMinutes(data.progress.todayStudyMinutes || 0);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [userEmail, activeView]);

  useEffect(() => {
    if (!userEmail) return;
    fetch("/api/tools").then(async (response) => response.ok ? response.json() : null).then((data: { tools?: Array<{ provider: string; enabled: boolean }> } | null) => {
      setWebResearchAllowed(Boolean(data?.tools?.find((tool) => tool.provider === "web_research")?.enabled));
    }).catch(() => setWebResearchAllowed(false));
  }, [userEmail]);

  const effectiveLiveProfile = userEmail ? liveProfile : null;
  const profile = effectiveLiveProfile ?? initialProfile ?? { proficiencyLevel: "B1", dailyGoalMinutes: 20, currentStreak: 0, totalStudyMinutes: 0, grammarScore: 0, vocabularyScore: 0, monthlyBudgetUsd: 5 };
  const displayName = user?.name?.split(" ")[0] || "Learner";
  const goalMinutes = userEmail ? (effectiveLiveProfile ? todayStudyMinutes : 0) : 0;
  const progressPercent = Math.min(100, Math.round((goalMinutes / profile.dailyGoalMinutes) * 100));

  function goTo(view: View) { setActiveView(view); setMobileOpen(false); if (view === "chat") window.setTimeout(() => document.getElementById("chat-composer")?.focus(), 50); }
  function startPractice(prompt?: string) { if (prompt) { setMode("TUTOR"); setDraft(prompt); } goTo("chat"); }

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAuthError(""); setAuthBusy(true);
    try {
      if (authMode === "register") {
        const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
        const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to create account.");
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) throw new Error("Email or password is incorrect.");
      setAuthOpen(false);
    } catch (error) { setAuthError(error instanceof Error ? error.message : "Unable to sign in."); } finally { setAuthBusy(false); }
  }

  async function handleSignOut() {
    await signOut({ redirect: false });
    setMessages(starterMessages);
    setConversationId(undefined);
    setConversations([]);
    setDraft("");
    setLiveProfile(null);
    setTodayStudyMinutes(0);
    setWebResearchAllowed(false);
    setWebResearch(false);
    setActiveView("overview");
    setAuthOpen(true);
  }

  async function openConversation(id: string) {
    const response = await fetch(`/api/conversations/${id}`);
    const data = await response.json().catch(() => ({})) as { conversation?: { id: string; mode: Mode; messages: Array<{ id: string; role: "USER" | "ASSISTANT"; content: string }> } };
    if (!response.ok || !data.conversation) return;
    setConversationId(data.conversation.id);
    setMode(data.conversation.mode);
    setMessages(data.conversation.messages.map((message) => ({ id: message.id, role: message.role === "USER" ? "user" : "assistant", content: message.content })));
    setDraft("");
  }

  function startNewConversation() {
    setConversationId(undefined);
    setMessages(starterMessages);
    setDraft("");
    setMode("SMART");
  }

  async function sendMessage(event?: React.FormEvent) {
    event?.preventDefault(); const message = draft.trim(); if (!message || isSending) return; if (!user) { setAuthOpen(true); return; }
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: message }; const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "" };
    setMessages((current) => [...current, userMessage, assistantMessage]); setDraft(""); setIsSending(true);
    let assistantText = "";
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId, message, mode, webResearch }) });
      if (!response.ok || !response.body) { const data = await response.json().catch(() => ({})); throw new Error(data.error || "The assistant could not respond."); }
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const events = buffer.split("\n\n"); buffer = events.pop() || "";
        for (const eventText of events) {
          const dataLine = eventText.split("\n").find((line) => line.startsWith("data: ")); if (!dataLine) continue;
          const data = JSON.parse(dataLine.slice(6)) as { type: string; text?: string; error?: string; conversationId?: string };
          if (data.type === "delta" && data.text) { assistantText += data.text; setMessages((current) => current.map((item) => item.id === assistantMessage.id ? { ...item, content: item.content + data.text } : item)); }
          if (data.type === "done" && data.conversationId) {
            setConversationId(data.conversationId);
            setConversations((current) => [{ id: data.conversationId as string, title: message.slice(0, 56), mode, updatedAt: new Date().toISOString() }, ...current.filter((conversation) => conversation.id !== data.conversationId)].slice(0, 30));
          }
          if (data.type === "error") throw new Error(data.error || "The assistant could not finish.");
        }
      }
      saveCorrection(message, assistantText);
    } catch (error) { const errorMessage = error instanceof Error ? error.message : "Something went wrong."; setMessages((current) => current.map((item) => item.id === assistantMessage.id ? { ...item, content: `I couldn’t complete that response. ${errorMessage}` } : item)); } finally { setIsSending(false); }
  }

  function renderMain() {
    if (activeView === "chat") return <ChatPanel mode={mode} setMode={setMode} messages={messages} draft={draft} setDraft={setDraft} isSending={isSending} sendMessage={sendMessage} user={user} onSignIn={() => setAuthOpen(true)} onVoice={() => setVoiceOpen(true)} webResearch={webResearch} setWebResearch={setWebResearch} webResearchAllowed={webResearchAllowed} conversations={conversations} conversationId={conversationId} onSelectConversation={openConversation} onNewConversation={startNewConversation} />;
    if (activeView === "learn") return <LearningPath key={userEmail || "guest"} user={user} onStart={startPractice} onSignIn={() => setAuthOpen(true)} />;
    if (activeView === "progress") return <ProgressPanel key={userEmail || "guest"} profile={profile} user={user} />;
    if (activeView === "settings") return <SettingsPanel darkMode={darkMode} setDarkMode={setDarkMode} user={user} dailyGoalMinutes={profile.dailyGoalMinutes} monthlyBudgetUsd={profile.monthlyBudgetUsd} onSignOut={handleSignOut} onDeleted={handleSignOut} onToolPermissionChange={handleToolPermissionChange} />;
    return <Overview name={displayName} profile={profile} progressPercent={progressPercent} onChat={() => goTo("chat")} onLearn={() => goTo("learn")} />;
  }

  return <div className={darkMode ? "app-shell dark-shell" : "app-shell"}>
    <aside className={mobileOpen ? "sidebar sidebar-open" : "sidebar"}>
      <div className="brand-row"><div className="brand-mark"><BrainCircuit size={20} /></div><span>English Mastery</span><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
      <div className="workspace-label">YOUR LEARNING SPACE</div><nav className="nav-list" aria-label="Main navigation">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={activeView === id ? "nav-item active" : "nav-item"} onClick={() => goTo(id)}><Icon size={18} /><span>{label}</span>{id === "chat" && <span className="nav-dot" />}</button>)}</nav>
      <div className="sidebar-spacer" /><div className="sidebar-tip"><Sparkles size={17} /><div><strong>Small steps, big fluency</strong><p>Your daily goal is {profile.dailyGoalMinutes} minutes.</p></div></div>
      {user ? <div className="user-card"><div className="avatar">{displayName.slice(0, 1).toUpperCase()}</div><div className="user-card-copy"><strong>{user.name || "Learner"}</strong><span>{profile.proficiencyLevel} learner</span></div><button className="icon-button" onClick={() => void handleSignOut()} aria-label="Sign out"><ArrowUpRight size={16} /></button></div> : <button className="sidebar-signin" onClick={() => setAuthOpen(true)}><LockKeyhole size={16} /> Sign in to save progress</button>}
    </aside>
    {mobileOpen && <button className="sidebar-overlay" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <main className="main-content"><header className="topbar"><button className="icon-button menu-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{navItems.find((item) => item.id === activeView)?.label}</strong></div><div className="topbar-actions"><button className="icon-button" onClick={() => setDarkMode((current) => !current)} aria-label="Toggle theme">{darkMode ? <SunMedium size={18} /> : <Moon size={18} />}</button>{user ? <button className="profile-chip" onClick={() => goTo("settings")}><span className="avatar small">{displayName.slice(0, 1).toUpperCase()}</span><span>{displayName}</span></button> : <button className="top-signin" onClick={() => setAuthOpen(true)}>Sign in</button>}</div></header><div className="page-content">{renderMain()}</div></main>
    {authOpen && !session?.user && <AuthDialog mode={authMode} setMode={setAuthMode} onClose={() => setAuthOpen(false)} onSubmit={submitAuth} busy={authBusy} error={authError} email={email} setEmail={setEmail} password={password} setPassword={setPassword} name={name} setName={setName} />}
    {voiceOpen && <VoicePractice mode={mode} user={user} onClose={() => setVoiceOpen(false)} onSignIn={() => { setVoiceOpen(false); setAuthOpen(true); }} />}
  </div>;
}

function Overview({ name, profile, progressPercent, onChat, onLearn }: { name: string; profile: { proficiencyLevel: string; dailyGoalMinutes: number; currentStreak: number; totalStudyMinutes: number; grammarScore: number; vocabularyScore: number }; progressPercent: number; onChat: () => void; onLearn: () => void }) {
  const todayLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date()).toUpperCase();
  return <div className="overview-view"><section className="welcome-row"><div><div className="eyebrow">{todayLabel} <span className="live-pill"><Activity size={11} /> PERSONALIZED</span></div><h1>Good morning, {name}<span className="wave">✦</span></h1><p className="lead">Keep your momentum going. Your next confident conversation is one practice away.</p></div><button className="primary-button" onClick={onChat}><MessageCircle size={17} /> Start a conversation</button></section><section className="hero-card"><div className="hero-copy"><span className="hero-kicker"><Sparkles size={15} /> SMART LEARNING</span><h2>Make irregular verbs<br />feel natural in context.</h2><p>Practice the verbs and vocabulary you need in travel, daily life, work, technology, and international conversations.</p><button className="hero-link" onClick={onChat}>Open Smart Learning <ArrowUpRight size={16} /></button></div><div className="hero-orbit"><div className="orbit-glow" /><div className="orbit-card card-one"><span>Today’s focus</span><strong>Go · went · gone</strong><small>Travel story practice</small></div><div className="orbit-card card-two"><span>Next context</span><strong>Work & technology</strong><small>8 words to recall</small></div><div className="orbit-core"><BrainCircuit size={30} /></div></div></section><section className="section-header"><div><span className="eyebrow">YOUR SNAPSHOT</span><h2>Progress that feels personal</h2></div><button className="text-button" onClick={onLearn}>View learning path <ChevronRight size={16} /></button></section><div className="metric-grid"><MetricCard icon={<Flame size={18} />} label="Current streak" value={`${profile.currentStreak} days`} detail="Keep it alive today" tone="orange" /><MetricCard icon={<Clock3 size={18} />} label="Study time" value={`${profile.totalStudyMinutes} min`} detail={`${profile.dailyGoalMinutes} min daily goal`} tone="violet" /><MetricCard icon={<Target size={18} />} label="English level" value={profile.proficiencyLevel} detail="Based on your latest check-in" tone="sky" /><MetricCard icon={<CheckCircle2 size={18} />} label="Today’s goal" value={`${progressPercent}%`} detail="A little more makes it count" tone="green" /></div><section className="dashboard-lower"><div className="card-panel focus-panel"><div className="panel-heading"><div><span className="eyebrow">RECOMMENDED NEXT</span><h3>Your 20-minute practice</h3></div><span className="progress-badge">{profile.dailyGoalMinutes} min</span></div><div className="practice-list"><PracticeRow number="01" title="Irregular verbs in context" detail="go, take, get, make in a travel story" duration="7 min" onClick={onChat} /><PracticeRow number="02" title="Vocabulary by environment" detail="Airport, hotel, daily life, and work" duration="8 min" onClick={onLearn} /><PracticeRow number="03" title="Quick recall challenge" detail="8 high-frequency verbs with spaced review" duration="5 min" onClick={onLearn} /></div></div><div className="card-panel insight-panel"><div className="panel-heading"><div><span className="eyebrow">LEARNING INSIGHT</span><h3>Your active focus</h3></div><Sparkles className="panel-spark" size={18} /></div><div className="insight-quote">“You’ll remember more when each irregular verb lives inside a situation you might actually talk about.”</div><div className="mini-bars"><ProgressBar label="Irregular verbs" value={profile.grammarScore} color="violet" /><ProgressBar label="Context vocabulary" value={profile.vocabularyScore} color="sky" /></div><button className="soft-button" onClick={onLearn}>Practice this focus <ArrowUpRight size={15} /></button></div></section></div>;
}

function MetricCard({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: string }) { return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><span className="metric-label">{label}</span><strong>{value}</strong><small>{detail}</small></div>; }
function PracticeRow({ number, title, detail, duration, onClick }: { number: string; title: string; detail: string; duration: string; onClick: () => void }) { return <button className="practice-row" onClick={onClick}><span className="practice-number">{number}</span><span className="practice-copy"><strong>{title}</strong><small>{detail}</small></span><span className="practice-duration">{duration}</span><ChevronRight size={16} /></button>; }
function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) { return <div className="progress-bar-row"><div><span>{label}</span><strong>{value}%</strong></div><div className="progress-track"><span className={`progress-fill ${color}`} style={{ width: `${value}%` }} /></div></div>; }

function ChatPanel({ mode, setMode, messages, draft, setDraft, isSending, sendMessage, user, onSignIn, onVoice, webResearch, setWebResearch, webResearchAllowed, conversations, conversationId, onSelectConversation, onNewConversation }: { mode: Mode; setMode: (mode: Mode) => void; messages: ChatMessage[]; draft: string; setDraft: (value: string) => void; isSending: boolean; sendMessage: (event?: React.FormEvent) => void; user: { name?: string | null } | null; onSignIn: () => void; onVoice: () => void; webResearch: boolean; setWebResearch: (value: boolean) => void; webResearchAllowed: boolean; conversations: ConversationSummary[]; conversationId?: string; onSelectConversation: (id: string) => void; onNewConversation: () => void }) {
  const info = modeInfo[mode]; const fileInputRef = useRef<HTMLInputElement>(null); const [fileName, setFileName] = useState("");
  async function attachTextFile(event: React.ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; const text = await file.text(); setFileName(file.name); setDraft(`Please help me with this document:\n\n${text.slice(0, 12_000)}`); event.target.value = ""; }
  return <div className="chat-view"><section className="chat-heading"><div><span className={`mode-tag ${info.color}`}>{info.eyebrow}</span><h1>{info.label}</h1><p>{info.description}</p></div><div className="mode-switcher" role="tablist" aria-label="Learning mode">{(Object.keys(modeInfo) as Mode[]).map((item) => <button key={item} className={mode === item ? "mode-switch active" : "mode-switch"} onClick={() => setMode(item)}>{modeInfo[item].label}</button>)}</div></section>{conversations.length > 0 && <section className="conversation-history" aria-label="Conversation history"><div className="conversation-history-heading"><span className="eyebrow">RECENT CONVERSATIONS</span><button className="text-button" onClick={onNewConversation}>New conversation</button></div><div className="conversation-history-list">{conversations.slice(0, 6).map((conversation) => <button key={conversation.id} className={conversation.id === conversationId ? "conversation-item active" : "conversation-item"} onClick={() => onSelectConversation(conversation.id)}><strong>{conversation.title || "Untitled conversation"}</strong><small>{modeInfo[conversation.mode]?.label || "Conversation"} · {new Date(conversation.updatedAt).toLocaleDateString()}</small></button>)}</div></section>}<div className="chat-workspace"><div className="messages-area">{messages.map((message) => <div className={message.role === "user" ? "message-row user-message" : "message-row"} key={message.id}><div className={message.role === "assistant" ? "message-avatar" : "message-avatar user-avatar"}>{message.role === "assistant" ? <BrainCircuit size={16} /> : <UserRound size={16} />}</div><div className="message-bubble"><span className="message-author">{message.role === "assistant" ? "English Mastery" : "You"}</span><p>{message.content || (isSending ? "Thinking…" : "")}</p></div></div>)}</div><form className="composer" onSubmit={sendMessage}><textarea id="chat-composer" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={user ? "Ask anything, or practice a sentence…" : "Sign in to start a private conversation…"} onFocus={() => !user && onSignIn()} disabled={!user || isSending} rows={2} /><div className="composer-footer"><div className="composer-tools"><input className="hidden-file-input" ref={fileInputRef} type="file" accept=".txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json" onChange={attachTextFile} /><button className="composer-tool document-tool" type="button" onClick={() => fileInputRef.current?.click()} title="Attach a text note" aria-label="Attach a text note"><Paperclip size={17} /></button><button className="composer-tool voice-tool" type="button" onClick={onVoice} title="Open voice practice" aria-label="Open voice practice"><Mic size={17} /></button><button className={webResearch ? "research-toggle active" : "research-toggle"} type="button" onClick={() => setWebResearch(!webResearch)} aria-pressed={webResearch} disabled={!webResearchAllowed} title={webResearchAllowed ? "Require web research for the next message" : "Enable web research in Settings first"}>Web research</button><span>{fileName || (webResearchAllowed ? `English corrections are active in ${info.label}` : "Enable web research in Settings to use public sources")}</span></div><button className="send-button" type="submit" disabled={!draft.trim() || isSending || !user} aria-label="Send message"><Send size={17} /></button></div></form>{webResearch && <p className="research-note">Web search is enabled for the next message and will be recorded in your tool activity.</p>}{!user && <button className="chat-auth-note" onClick={onSignIn}><LockKeyhole size={14} /> Sign in to save your conversations and learning progress</button>}</div></div>;
}

function LearningPath({ user, onStart, onSignIn }: { user: { name?: string | null; email?: string | null } | null; onStart: (prompt?: string) => void; onSignIn: () => void }) { return <div className="section-view"><div className="view-intro"><span className="eyebrow">LEARNING PATH</span><h1>Build recall through real situations.</h1><p>Your active focus is irregular verbs plus vocabulary that changes with the environment.</p></div><AdaptiveLessonGrid onStart={onStart} /><AssessmentCard user={user} /><TravelSimulation onStart={onStart} /><PronunciationPractice user={user} onSignIn={onSignIn} /><VocabularyPractice user={user} /><div className="card-panel path-note"><div className="metric-icon violet"><Sparkles size={18} /></div><div><strong>Your curriculum now follows this focus.</strong><p>Each conversation can recycle a verb, place it in context, and check whether you can recall it later.</p></div><button className="soft-button" onClick={() => onStart()}>Practice the focus <ArrowUpRight size={15} /></button></div></div>; }
function ProgressPanel({ profile, user }: { profile: { grammarScore: number; vocabularyScore: number; currentStreak: number; totalStudyMinutes: number }; user: { name?: string | null; email?: string | null } | null }) { const [live, setLive] = useState<{ profile: { grammarScore: number; vocabularyScore: number; currentStreak: number; totalStudyMinutes: number } | null; reviewCount: number; studyMinutes: number; todayStudyMinutes: number; pronunciationScore: number | null; pronunciationAttempts: number; latestAssessment: { level: string | null; completedAt: string } | null; assessmentHistory?: Array<{ id: string; kind: string; level: string | null; completedAt: string }>; grammarErrorCount: number; recentGrammarErrors: Array<{ id: string; correctedText: string; explanationEs: string; createdAt: string }> } | null>(null); useEffect(() => { if (!user) return; fetch("/api/progress").then(async (response) => response.ok ? response.json() : null).then((data: { progress?: typeof live } | null) => { if (data?.progress) setLive(data.progress); }).catch(() => undefined); }, [user]); const displayed = live?.profile || profile; return <div className="section-view"><div className="view-intro"><span className="eyebrow">PROGRESS</span><h1>See the confidence building.</h1><p>Simple signals that help you keep the habit sustainable.</p></div><div className="progress-dashboard"><div className="card-panel progress-big"><div className="panel-heading"><div><span className="eyebrow">SKILL BALANCE</span><h3>Your current snapshot</h3></div><BarChart3 size={18} /></div><ProgressBar label="Grammar" value={displayed.grammarScore} color="violet" /><ProgressBar label="Vocabulary" value={displayed.vocabularyScore} color="sky" /><ProgressBar label="Consistency" value={Math.min(100, displayed.currentStreak * 12)} color="green" /></div><div className="metric-card progress-stat"><div className="metric-icon orange"><Flame size={18} /></div><span className="metric-label">Streak</span><strong>{displayed.currentStreak} days</strong><small>Momentum is a skill too.</small></div><div className="metric-card progress-stat"><div className="metric-icon violet"><Clock3 size={18} /></div><span className="metric-label">Minutes practiced</span><strong>{live?.studyMinutes || displayed.totalStudyMinutes}</strong><small>{live ? `${live.reviewCount} vocabulary reviews` : "Across your recent sessions."}</small></div></div><div className="progress-detail-grid"><div className="card-panel"><span className="eyebrow">ASSESSMENT</span><h3>{live?.latestAssessment?.level ? `Latest level: ${live.latestAssessment.level}` : "Complete your initial check-in"}</h3><p>{live?.latestAssessment ? `Completed ${new Date(live.latestAssessment.completedAt).toLocaleDateString()}.` : "Use the Learning Path check-in to create your baseline."}</p>{live?.assessmentHistory && live.assessmentHistory.length > 1 && <div className="assessment-history"><span className="eyebrow">RECENT CHECK-INS</span>{live.assessmentHistory.map((assessment) => <small key={assessment.id}>{assessment.level || "Unrated"} · {new Date(assessment.completedAt).toLocaleDateString()}</small>)}</div>}{live?.grammarErrorCount ? <div className="assessment-history"><span className="eyebrow">CORRECTIONS SAVED</span><small>{live.grammarErrorCount} correction{live.grammarErrorCount === 1 ? "" : "s"} from your conversations.</small>{live.recentGrammarErrors.map((error) => <small key={error.id}>{error.correctedText}</small>)}</div> : null}</div><div className="card-panel"><span className="eyebrow">PRONUNCIATION</span><h3>{live?.pronunciationAttempts ? `${Math.round(live.pronunciationScore || 0)}% average` : "Not assessed yet"}</h3><p>{live?.pronunciationAttempts ? `${live.pronunciationAttempts} attempts recorded.` : "No score is shown until a specialized assessment is actually available."}</p></div></div></div>; }
function SettingsPanel({ darkMode, setDarkMode, user, dailyGoalMinutes, monthlyBudgetUsd, onSignOut, onDeleted, onToolPermissionChange }: { darkMode: boolean; setDarkMode: (value: boolean) => void; user: { name?: string | null; email?: string | null } | null; dailyGoalMinutes: number; monthlyBudgetUsd: number; onSignOut: () => void; onDeleted: () => void; onToolPermissionChange: (enabled: boolean) => void }) { const accountKey = user?.email || "guest"; return <div className="section-view"><div className="view-intro"><span className="eyebrow">SETTINGS</span><h1>Your space, your pace.</h1><p>Control how English Mastery supports your learning.</p></div><div className="settings-list"><div className="settings-row"><div className="settings-icon"><Moon size={18} /></div><div><strong>Appearance</strong><small>{darkMode ? "Dark mode is on" : "Light mode is on"}</small></div><button className="toggle" aria-pressed={darkMode} onClick={() => setDarkMode(!darkMode)}><span className={darkMode ? "toggle-knob on" : "toggle-knob"} /></button></div><ProfileSettings key={`profile-${accountKey}`} user={user} initialMinutes={dailyGoalMinutes} initialBudget={monthlyBudgetUsd} /><ToolPermissions key={`tools-${accountKey}`} user={user} onChanged={onToolPermissionChange} /><div className="settings-row"><div className="settings-icon"><Sparkles size={18} /></div><div><strong>Active learning focus</strong><small>Irregular verbs + contextual vocabulary across travel, daily life, work, technology, and international conversations.</small></div><span className="settings-status enabled">Active</span></div><div className="settings-row"><div className="settings-icon"><UserRound size={18} /></div><div><strong>{user?.name || "Guest learner"}</strong><small>{user?.email || "Sign in to sync your progress"}</small></div>{user ? <button className="soft-button" onClick={onSignOut}>Sign out</button> : <span className="settings-status">Not connected</span>}</div><div className="settings-row"><div className="settings-icon"><CheckCircle2 size={18} /></div><div><strong>English correction preference</strong><small>Corrections stay concise and include Spanish explanations.</small></div><span className="settings-status enabled">Enabled</span></div></div><PrivacyControls key={`privacy-${accountKey}`} user={user} onDeleted={onDeleted} /></div>; }
function AuthDialog({ mode, setMode, onClose, onSubmit, busy, error, email, setEmail, password, setPassword, name, setName }: { mode: "login" | "register"; setMode: (mode: "login" | "register") => void; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; busy: boolean; error: string; email: string; setEmail: (value: string) => void; password: string; setPassword: (value: string) => void; name: string; setName: (value: string) => void }) { return <div className="modal-backdrop" role="presentation"><div className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="icon-button dialog-close" onClick={onClose} aria-label="Close sign in"><X size={18} /></button><div className="auth-brand"><div className="brand-mark"><BrainCircuit size={20} /></div><span>English Mastery</span></div><span className="eyebrow">PRIVATE LEARNING SPACE</span><h2 id="auth-title">{mode === "login" ? "Welcome back." : "Start your learning space."}</h2><p className="auth-subtitle">{mode === "login" ? "Sign in to keep your conversations and progress together." : "Create an account to make every practice session count."}</p><form onSubmit={onSubmit} className="auth-form">{mode === "register" && <label>Name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>}<label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label>Password<input required minLength={10} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 10 characters" /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button full" disabled={busy}>{busy ? "Connecting…" : mode === "login" ? "Sign in" : "Create account"}</button></form><p className="auth-switch">{mode === "login" ? "New here?" : "Already have an account?"} <button onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create an account" : "Sign in"}</button></p></div></div>; }
