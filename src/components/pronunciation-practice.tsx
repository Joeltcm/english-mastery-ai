"use client";

import { CheckCircle2, LoaderCircle, Mic, Square, Upload, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { encodePcmWav } from "@/lib/audio";

type User = { name?: string | null; email?: string | null } | null;
type PronunciationResult = { score: number; transcript: string | null; feedback: { accuracy: number | null; fluency: number | null; completeness: number | null; prosody: number | null } };

export function PronunciationPractice({ user, onSignIn }: { user: User; onSignIn: () => void }) {
  const [referenceText, setReferenceText] = useState("I have taken the early train to the airport.");
  const [recording, setRecording] = useState(false); const [audioBlob, setAudioBlob] = useState<Blob | null>(null); const [result, setResult] = useState<PronunciationResult | null>(null); const [error, setError] = useState(""); const [status, setStatus] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null); const chunksRef = useRef<Blob[]>([]); const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => () => { recorderRef.current?.stop(); streamRef.current?.getTracks().forEach((track) => track.stop()); }, []);

  async function startRecording() {
    if (!user) { onSignIn(); return; }
    setError(""); setResult(null); setStatus("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const recorder = new MediaRecorder(stream); chunksRef.current = []; streamRef.current = stream; recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => { const raw = new Blob(chunksRef.current, { type: recorder.mimeType }); stream.getTracks().forEach((track) => track.stop()); try { const context = new AudioContext(); const decoded = await context.decodeAudioData(await raw.arrayBuffer()); setAudioBlob(encodePcmWav(decoded)); await context.close(); setStatus("Recording ready. Send it for pronunciation scoring."); } catch { setError("This recording could not be converted to WAV. Upload a WAV or OGG file instead."); } };
      recorder.start(); setRecording(true); setStatus("Recording… read the sentence naturally.");
    } catch { setError("Microphone access was not available. Check the browser permission or upload an audio file."); }
  }

  function stopRecording() { recorderRef.current?.stop(); setRecording(false); }

  function selectFile(event: React.ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; if (!file.type.includes("wav") && !file.type.includes("ogg")) { setError("Use a WAV or OGG file for specialized scoring."); return; } setAudioBlob(file); setResult(null); setError(""); setStatus("Audio ready. Send it for pronunciation scoring."); }

  async function assess() {
    if (!user) { onSignIn(); return; } if (!audioBlob) return; setError(""); setStatus("Sending audio to the pronunciation provider…"); const form = new FormData(); form.append("audio", audioBlob, "pronunciation.wav"); form.append("referenceText", referenceText); form.append("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone); const response = await fetch("/api/pronunciation/assess", { method: "POST", body: form }); const data = await response.json().catch(() => ({})); if (!response.ok) { setError(data.error || "No pronunciation score was generated."); setStatus(""); return; } setResult(data); setStatus("Assessment complete. Repeat the sentence and compare your result.");
  }

  return <section className="pronunciation-card card-panel"><div className="panel-heading"><div><span className="eyebrow">PRONUNCIATION LAB</span><h3>Practice one sentence precisely</h3></div><Volume2 className="panel-spark" size={18} /></div><p className="assessment-note">Scores come only from the configured specialized provider. English Mastery never invents a pronunciation result.</p><label className="pronunciation-label">Reference sentence<textarea value={referenceText} onChange={(event) => setReferenceText(event.target.value)} maxLength={500} rows={2} /></label><div className="pronunciation-actions">{recording ? <button className="voice-stop" onClick={stopRecording}><Square size={14} /> Stop recording</button> : <button className="voice-start" onClick={startRecording}><Mic size={14} /> Record</button>}<label className="upload-button"><Upload size={14} /> Upload WAV/OGG<input type="file" accept="audio/wav,audio/ogg,.wav,.ogg" onChange={selectFile} /></label><button className="soft-button" onClick={assess} disabled={!audioBlob || recording || !user}>{status.startsWith("Sending") ? <LoaderCircle className="spin" size={14} /> : <CheckCircle2 size={14} />} Assess pronunciation</button></div>{status && <p className="pronunciation-status">{status}</p>}{error && <p className="privacy-error">{error}</p>}{result && <div className="pronunciation-result"><div><strong>{Math.round(result.score)}%</strong><small>pronunciation score</small></div><div className="pronunciation-metrics"><span>Accuracy <b>{Math.round(result.feedback.accuracy || 0)}%</b></span><span>Fluency <b>{Math.round(result.feedback.fluency || 0)}%</b></span><span>Completeness <b>{Math.round(result.feedback.completeness || 0)}%</b></span><span>Prosody <b>{Math.round(result.feedback.prosody || 0)}%</b></span></div><p>{result.transcript ? `Heard: “${result.transcript}”` : "The provider returned a score without a transcript."}</p></div>}</section>;
}
