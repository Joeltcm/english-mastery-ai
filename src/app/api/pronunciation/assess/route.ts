import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumePersistentRateLimit } from "@/lib/rate-limit";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to save pronunciation results." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "PostgreSQL is not configured." }, { status: 503 });
  if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) return NextResponse.json({ error: "Specialized pronunciation scoring is not configured yet. No score was generated." }, { status: 503 });
  const rate = await consumePersistentRateLimit(`pronunciation:${session.user.id}`, 20);
  if (!rate.allowed) return NextResponse.json({ error: `Too many pronunciation attempts. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });

  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  const referenceText = typeof form?.get("referenceText") === "string" ? String(form?.get("referenceText")).trim() : "";
  if (!(audio instanceof File) || !audio.size || audio.size > MAX_AUDIO_BYTES) return NextResponse.json({ error: "Upload a WAV or OGG recording up to 10 MB." }, { status: 400 });
  if (!referenceText || referenceText.length > 500) return NextResponse.json({ error: "Add a short reference sentence." }, { status: 400 });
  const contentType = audio.type.includes("ogg") ? "audio/ogg; codecs=opus" : audio.type.includes("wav") ? "audio/wav; codecs=audio/pcm; samplerate=16000" : "";
  if (!contentType) return NextResponse.json({ error: "Use an audio/wav or audio/ogg recording for specialized scoring." }, { status: 415 });

  const pronunciationHeader = Buffer.from(JSON.stringify({ ReferenceText: referenceText, GradingSystem: "HundredMark", Granularity: "Word", Dimension: "Comprehensive", EnableProsodyAssessment: "True", EnableMiscue: "True" })).toString("base64");
  const endpoint = `https://${process.env.AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;
  const azureResponse = await fetch(endpoint, { method: "POST", headers: { Accept: "application/json", "Content-Type": contentType, "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY, "Pronunciation-Assessment": pronunciationHeader }, body: await audio.arrayBuffer() });
  const azureData = await azureResponse.json().catch(() => null) as { RecognitionStatus?: string; NBest?: Array<{ Display?: string; PronScore?: number; AccuracyScore?: number; FluencyScore?: number; CompletenessScore?: number; ProsodyScore?: number; Words?: unknown[] }> } | null;
  const best = azureData?.NBest?.[0];
  if (!azureResponse.ok || !best || typeof best.PronScore !== "number") return NextResponse.json({ error: "The pronunciation provider could not assess this recording. No score was saved." }, { status: 502 });
  const feedback = JSON.parse(JSON.stringify({ accuracy: best.AccuracyScore ?? null, fluency: best.FluencyScore ?? null, completeness: best.CompletenessScore ?? null, prosody: best.ProsodyScore ?? null, words: best.Words ?? [] }));
  const attempt = await db.pronunciationAttempt.create({ data: { userId: session.user.id, prompt: referenceText, transcript: best.Display || null, provider: "azure-speech-pronunciation", score: best.PronScore, feedback } });
  return NextResponse.json({ score: attempt.score, transcript: attempt.transcript, feedback, attemptId: attempt.id });
}
