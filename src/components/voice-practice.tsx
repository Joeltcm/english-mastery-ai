"use client";

import { BrainCircuit, LoaderCircle, Mic, Pause, Radio, Send, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { extractCorrection, removeCorrectionLabels } from "@/lib/corrections";

type Mode = "ASSISTANT" | "TUTOR" | "SMART";
type User = { name?: string | null; email?: string | null } | null;
type VoiceMessage = { id: string; role: "user" | "assistant"; content: string };
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = Event & { results: { length: number; [index: number]: RecognitionResult } };
type Recognition = { lang: string; interimResults: boolean; continuous: boolean; onresult: ((event: RecognitionEvent) => void) | null; onstart: (() => void) | null; onend: (() => void) | null; onerror: ((event: { error?: string }) => void) | null; start: () => void; stop: () => void };
type RecognitionConstructor = new () => Recognition;
type RealtimeStatus = "idle" | "connecting" | "connected" | "error";

const voiceIntro: VoiceMessage = { id: "voice-intro", role: "assistant", content: "Hi! Speak naturally. I’ll answer in English, keep the conversation moving, and gently help you improve when it matters." };

export function VoicePractice({ mode, user, onClose, onSignIn }: { mode: Mode; user: User; onClose: () => void; onSignIn: () => void }) {
  const [messages, setMessages] = useState<VoiceMessage[]>([voiceIntro]);
  const [draft, setDraft] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(() => {
    if (typeof window === "undefined") return true;
    const browserWindow = window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    return Boolean(browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition);
  });
  const [audioSource, setAudioSource] = useState<"ai" | "browser">("browser");
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("idle");
  const [realtimeTranscript, setRealtimeTranscript] = useState("");
  const recognitionRef = useRef<Recognition | null>(null);
  const realtimeConnectionRef = useRef<RTCPeerConnection | null>(null);
  const realtimeChannelRef = useRef<RTCDataChannel | null>(null);
  const realtimeStreamRef = useRef<MediaStream | null>(null);
  const realtimeAudioRef = useRef<HTMLAudioElement | null>(null);
  const realtimeStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); realtimeChannelRef.current?.close(); realtimeConnectionRef.current?.close(); realtimeStreamRef.current?.getTracks().forEach((track) => track.stop()); window.speechSynthesis?.cancel(); };
  }, []);

  function stopRealtime() {
    const startedAt = realtimeStartedAtRef.current;
    if (user && startedAt) {
      const durationSeconds = Math.max(1, Math.min(7_200, Math.ceil((Date.now() - startedAt) / 1_000)));
      void fetch("/api/voice/realtime/usage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ durationSeconds, mode }) }).catch(() => undefined);
      void fetch("/api/study-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activity: "realtime-voice", minutes: Math.max(1, Math.min(60, Math.ceil(durationSeconds / 60))), metadata: { mode } }) }).catch(() => undefined);
    }
    realtimeChannelRef.current?.close();
    realtimeConnectionRef.current?.close();
    realtimeStreamRef.current?.getTracks().forEach((track) => track.stop());
    if (realtimeAudioRef.current) realtimeAudioRef.current.srcObject = null;
    realtimeChannelRef.current = null;
    realtimeConnectionRef.current = null;
    realtimeStreamRef.current = null;
    realtimeAudioRef.current = null;
    realtimeStartedAtRef.current = null;
    setRealtimeStatus("idle");
  }

  async function startRealtime() {
    if (!user) { onSignIn(); return; }
    if (!window.RTCPeerConnection || !navigator.mediaDevices?.getUserMedia) { setError("Live audio is not available in this browser. You can use the regular microphone button or type below."); setRealtimeStatus("error"); return; }
    stopListening();
    setError(""); setRealtimeStatus("connecting");
    try {
      const tokenResponse = await fetch("/api/voice/realtime", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
      const tokenData = await tokenResponse.json().catch(() => ({}));
      if (!tokenResponse.ok) throw new Error(tokenData.error || "Live voice could not start.");
      const ephemeralKey = tokenData.value || tokenData.client_secret?.value;
      if (!ephemeralKey) throw new Error("Live voice did not return a temporary session key.");
      const connection = new RTCPeerConnection();
      const audio = new Audio(); audio.autoplay = true; realtimeAudioRef.current = audio;
      connection.ontrack = (event) => { audio.srcObject = event.streams[0]; void audio.play().catch(() => undefined); };
      connection.onconnectionstatechange = () => { if (connection.connectionState === "failed") { setRealtimeStatus("error"); setError("The live audio connection was interrupted. Try starting it again."); } };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => connection.addTrack(track, stream));
      const channel = connection.createDataChannel("oai-events");
      channel.onmessage = (event) => {
        const payload = JSON.parse(event.data) as { type?: string; transcript?: string; item_id?: string };
        if (payload.transcript) setRealtimeTranscript(payload.transcript);
        if (payload.type === "conversation.item.input_audio_transcription.completed" && payload.transcript) setMessages((current) => [...current, { id: payload.item_id || crypto.randomUUID(), role: "user" as const, content: payload.transcript as string }].slice(-6));
        if ((payload.type === "response.audio_transcript.done" || payload.type === "response.output_audio_transcript.done") && payload.transcript) setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant" as const, content: payload.transcript as string }].slice(-6));
      };
      const offer = await connection.createOffer(); await connection.setLocalDescription(offer);
      const answerResponse = await fetch("https://api.openai.com/v1/realtime/calls", { method: "POST", headers: { Authorization: `Bearer ${ephemeralKey}`, "Content-Type": "application/sdp" }, body: offer.sdp });
      if (!answerResponse.ok) throw new Error("Live voice could not negotiate an audio connection.");
      await connection.setRemoteDescription({ type: "answer", sdp: await answerResponse.text() });
      realtimeConnectionRef.current = connection; realtimeChannelRef.current = channel; realtimeStreamRef.current = stream; realtimeStartedAtRef.current = Date.now(); setRealtimeStatus("connected"); setAudioSource("ai"); setTranscript("Live audio is connected. Start speaking naturally.");
    } catch (caught) {
      realtimeConnectionRef.current?.close(); realtimeStreamRef.current?.getTracks().forEach((track) => track.stop());
      setRealtimeStatus("error"); setError(caught instanceof Error ? caught.message : "Live voice could not start.");
    }
  }

  async function speak(text: string) {
    if (!text.trim()) return;
    try {
      const response = await fetch("/api/voice/speech", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (response.ok) {
        const audio = new Audio(URL.createObjectURL(await response.blob()));
        setAudioSource("ai");
        audio.onended = () => URL.revokeObjectURL(audio.src);
        await audio.play();
        return;
      }
    } catch { /* Browser speech remains a useful local fallback. */ }
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = window.speechSynthesis.getVoices().find((candidate) => candidate.lang.toLowerCase().startsWith("en"));
      if (voice) utterance.voice = voice;
      utterance.lang = "en-US";
      utterance.rate = 0.92;
      utterance.pitch = 0.98;
      setAudioSource("browser");
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }

  async function sendVoiceMessage(rawText: string) {
    const message = rawText.trim();
    if (!message || isSending) return;
    if (!user) { onSignIn(); return; }
    const turnStartedAt = Date.now();
    setError(""); setTranscript(message); setDraft(""); setIsSending(true);
    const userMessage: VoiceMessage = { id: crypto.randomUUID(), role: "user", content: message };
    const assistantMessage: VoiceMessage = { id: crypto.randomUUID(), role: "assistant", content: "" };
    setMessages((current) => [...current, userMessage, assistantMessage]);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId, message, mode }) });
      if (!response.ok || !response.body) { const data = await response.json().catch(() => ({})); throw new Error(data.error || "The voice coach could not respond."); }
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let reply = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const events = buffer.split("\n\n"); buffer = events.pop() || "";
        for (const eventText of events) {
          const dataLine = eventText.split("\n").find((line) => line.startsWith("data: ")); if (!dataLine) continue;
          const data = JSON.parse(dataLine.slice(6)) as { type: string; text?: string; error?: string; conversationId?: string };
          if (data.type === "delta" && data.text) { reply += data.text; setMessages((current) => current.map((item) => item.id === assistantMessage.id ? { ...item, content: item.content + data.text } : item)); }
          if (data.type === "done" && data.conversationId) setConversationId(data.conversationId);
          if (data.type === "error") throw new Error(data.error || "The voice coach could not finish.");
        }
      }
      await speak(removeCorrectionLabels(reply));
      const correction = extractCorrection(reply);
      if (correction) void fetch("/api/grammar-errors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ originalText: message, correctedText: correction.correctedText, naturalAlternative: correction.naturalAlternative, explanationEs: correction.explanationEs }) }).catch(() => undefined);
      void fetch("/api/study-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activity: "voice-conversation", minutes: Math.max(1, Math.min(15, Math.ceil((Date.now() - turnStartedAt) / 60_000))), metadata: { mode, messageLength: message.length } }) }).catch(() => undefined);
    } catch (caught) {
      const messageError = caught instanceof Error ? caught.message : "The voice coach could not respond.";
      setError(messageError);
      setMessages((current) => current.map((item) => item.id === assistantMessage.id ? { ...item, content: `I couldn’t complete that response. ${messageError}` } : item));
    } finally { setIsSending(false); }
  }

  function startListening() {
    if (!user) { onSignIn(); return; }
    if (realtimeStatus === "connected" || realtimeStatus === "connecting") stopRealtime();
    const browserWindow = window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Constructor = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
    if (!Constructor) { setSupported(false); setError("Speech recognition is not available in this browser. You can type below, or use Chrome or Edge for voice input."); return; }
    const recognition = new Constructor(); recognition.lang = "en-US"; recognition.interimResults = true; recognition.continuous = false;
    recognition.onstart = () => { setError(""); setIsListening(true); setTranscript("Listening…"); };
    recognition.onresult = (event) => { let finalText = ""; let interim = ""; for (let index = 0; index < event.results.length; index += 1) { const result = event.results[index]; if (result.isFinal) finalText += result[0].transcript; else interim += result[0].transcript; } setTranscript(finalText || interim); if (finalText.trim()) void sendVoiceMessage(finalText); };
    recognition.onerror = () => { setIsListening(false); setError("I couldn’t hear that clearly. Try again, or type your sentence below."); };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    try { recognition.start(); } catch { setError("The microphone is already starting. Try once more."); }
  }

  function stopListening() { recognitionRef.current?.stop(); setIsListening(false); }

  return <div className="modal-backdrop voice-backdrop" role="presentation"><div className="voice-dialog" role="dialog" aria-modal="true" aria-labelledby="voice-title"><button className="icon-button dialog-close" onClick={() => { stopRealtime(); onClose(); }} aria-label="Close voice practice"><X size={18} /></button><div className="voice-header"><div className="voice-icon"><Mic size={20} /></div><div><span className="eyebrow">VOICE PRACTICE</span><h2 id="voice-title">Speak naturally</h2><p>Have a real conversation in {mode === "TUTOR" ? "tutor" : "smart learning"} mode.</p></div></div><div className="voice-disclosure"><Volume2 size={14} /> Replies can use an AI-generated voice when OpenAI audio is configured; browser voice is used as a local fallback.<button className="soft-button" onClick={realtimeStatus === "connected" ? stopRealtime : startRealtime} disabled={realtimeStatus === "connecting"}>{realtimeStatus === "connected" ? <><Radio size={14} /> End live audio</> : <><Radio size={14} /> {realtimeStatus === "connecting" ? "Connecting…" : "Start live audio"}</>}</button></div><div className="voice-messages">{messages.slice(-4).map((message) => <div className={message.role === "user" ? "voice-message user" : "voice-message"} key={message.id}><span className="voice-message-icon">{message.role === "assistant" ? <BrainCircuit size={14} /> : <Mic size={14} />}</span><p>{message.content || (isSending ? "Thinking…" : "")}</p></div>)}</div><div className="voice-listening-card"><div className={isListening || realtimeStatus === "connected" ? "voice-pulse active" : "voice-pulse"}><Mic size={22} /></div><div><strong>{realtimeStatus === "connected" ? "Live audio is on" : isListening ? "Listening…" : isSending ? "Preparing your reply…" : "Your turn to speak"}</strong><small>{realtimeTranscript || transcript || (supported ? "Press the microphone and say a complete sentence." : "Voice input is unavailable here; type your sentence below.")}</small></div>{isListening ? <button className="voice-stop" onClick={stopListening}><Pause size={16} /> Stop</button> : <button className="voice-start" onClick={startListening} disabled={isSending || realtimeStatus === "connected"}><Mic size={16} /> Speak</button>}</div><form className="voice-composer" onSubmit={(event) => { event.preventDefault(); void sendVoiceMessage(draft); }}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Or type what you want to say…" disabled={isSending || realtimeStatus === "connected"} /><button className="send-button" disabled={!draft.trim() || isSending || realtimeStatus === "connected"} aria-label="Send voice message">{isSending ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}</button></form>{error && <p className="voice-error">{error}</p>}<div className="voice-footer"><span>{realtimeStatus === "connected" || audioSource === "ai" ? "AI voice active" : "Browser voice fallback"}</span><span>Always review and repeat the sentence aloud.</span></div></div></div>;
}
