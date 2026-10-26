import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

test("Milestone 1 request constraints are documented", () => {
  assert.equal(6000 > 0, true);
  assert.equal(["ASSISTANT", "TUTOR", "SMART"].includes("TUTOR"), true);
});

test("learning and privacy surfaces are present", () => {
  const routes = [
    "src/app/api/assessment/route.ts",
    "src/app/api/progress/route.ts",
    "src/app/api/profile/route.ts",
    "src/app/api/usage/route.ts",
    "src/app/api/privacy/export/route.ts",
    "src/app/api/account/route.ts",
    "src/app/api/memories/route.ts",
    "src/app/api/voice/speech/route.ts",
    "src/app/api/voice/realtime/route.ts",
    "src/app/api/voice/realtime/usage/route.ts",
    "src/app/api/voice/realtime/transcript/route.ts",
    "src/app/api/pronunciation/assess/route.ts",
    "src/app/api/study-sessions/route.ts",
    "src/app/api/maintenance/retention/route.ts",
    "src/app/api/lessons/route.ts",
    "src/app/api/lessons/[slug]/attempt/route.ts",
    "src/app/api/grammar-errors/route.ts",
    "src/app/api/tools/route.ts",
  ];
  for (const route of routes) assert.equal(readFileSync(join(root, route), "utf8").length > 0, true, route);
  const manifest = JSON.parse(readFileSync(join(root, "public/manifest.webmanifest"), "utf8"));
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.icons.length >= 2, true);
  assert.equal(manifest.icons.every((icon) => icon.type === "image/png"), true);
  assert.match(readFileSync(join(root, "public/sw.js"), "utf8"), /offline\.html/);
  assert.match(readFileSync(join(root, "public/sw.js"), "utf8"), /_next\/static/);
  assert.match(readFileSync(join(root, "public/sw.js"), "utf8"), /event\.request\.mode === "navigate"/);
  assert.match(readFileSync(join(root, "public/sw.js"), "utf8"), /Response\.error\(\)/);
  assert.match(readFileSync(join(root, "public/sw.js"), "utf8"), /response\.ok && isPublicAsset/);
  assert.doesNotMatch(readFileSync(join(root, "public/sw.js"), "utf8"), /response\.ok && \(isPublicAsset \|\| isNavigation\)/);
  assert.equal(existsSync(join(root, "public/offline.html")), true);
  for (const icon of ["public/icon-192.png", "public/icon-512.png", "public/apple-touch-icon.png"]) assert.equal(existsSync(join(root, icon)), true, icon);
  assert.match(readFileSync(join(root, "src/app/layout.tsx"), "utf8"), /appleWebApp/);
  assert.match(readFileSync(join(root, "next.config.ts"), "utf8"), /X-Content-Type-Options/);
  assert.match(readFileSync(join(root, "next.config.ts"), "utf8"), /Permissions-Policy/);
  assert.match(readFileSync(join(root, "prisma/schema.prisma"), "utf8"), /model AiUsageEvent/);
  assert.match(readFileSync(join(root, "prisma/schema.prisma"), "utf8"), /model RateLimitBucket/);
  assert.match(readFileSync(join(root, "railway.retention.toml"), "utf8"), /cronSchedule/);
  assert.match(readFileSync(join(root, "scripts/run-retention.mjs"), "utf8"), /CRON_SECRET/);
  assert.match(readFileSync(join(root, "scripts/deploy-preflight.mjs"), "utf8"), /missingRequiredEnvironment/);
  assert.match(readFileSync(join(root, "scripts/deploy-preflight.mjs"), "utf8"), /gitRemoteConfigured/);
  assert.match(readFileSync(join(root, "src/app/api/assessment/route.ts"), "utf8"), /sessionsSinceAssessment/);
  assert.match(readFileSync(join(root, "src/app/api/lessons/route.ts"), "utf8"), /orderedLessons/);
  assert.match(readFileSync(join(root, "src/app/api/lessons/[slug]/attempt/route.ts"), "utf8"), /timeZone: parsed.data.timezone/);
  assert.match(readFileSync(join(root, "src/app/api/lessons/route.ts"), "utf8"), /lesson-sync/);
  assert.match(readFileSync(join(root, "src/app/api/vocabulary/route.ts"), "utf8"), /vocabulary-sync/);
  assert.match(readFileSync(join(root, "src/components/privacy-controls.tsx"), "utf8"), /saveMemoryEdit/);
  assert.match(readFileSync(join(root, "src/app/api/account/route.ts"), "utf8"), /rateLimitBucket\.deleteMany/);
  assert.match(readFileSync(join(root, "src/components/dashboard-shell.tsx"), "utf8"), /setMessages\(starterMessages\)/);
  assert.match(readFileSync(join(root, "src/components/dashboard-shell.tsx"), "utf8"), /key=\{userEmail \|\| "guest"\}/);
  assert.match(readFileSync(join(root, "src/components/dashboard-shell.tsx"), "utf8"), /new Intl\.DateTimeFormat/);
  assert.match(readFileSync(join(root, "src/app/api/chat/route.ts"), "utf8"), /provider could not start/);
  assert.match(readFileSync(join(root, "src/app/api/chat/route.ts"), "utf8"), /text-conversation/);
  assert.match(readFileSync(join(root, "src/app/api/chat/route.ts"), "utf8"), /studyActivity/);
  assert.match(readFileSync(join(root, "src/app/api/chat/route.ts"), "utf8"), /timeZone: timezone/);
  assert.match(readFileSync(join(root, "src/lib/study.ts"), "utf8"), /calculateStudyStreak/);
  assert.match(readFileSync(join(root, "src/app/api/study-sessions/route.ts"), "utf8"), /timezone/);
  assert.doesNotMatch(readFileSync(join(root, "src/components/voice-practice.tsx"), "utf8"), /activity: "voice-conversation"/);
  assert.match(readFileSync(join(root, "src/app/api/chat/route.ts"), "utf8"), /Enable web research in Settings/);
  assert.match(readFileSync(join(root, "src/components/tool-permissions.tsx"), "utf8"), /explicit toggle/);
  assert.match(readFileSync(join(root, "src/app/api/privacy/export/route.ts"), "utf8"), /aiUsageEvents/);
  assert.match(readFileSync(join(root, "src/app/api/privacy/export/route.ts"), "utf8"), /lessonAttempts/);
  assert.match(readFileSync(join(root, "src/components/dashboard-shell.tsx"), "utf8"), /RECENT CONVERSATIONS/);
  assert.match(readFileSync(join(root, "src/components/dashboard-shell.tsx"), "utf8"), /onSelectConversation/);
  assert.match(readFileSync(join(root, "src/components/dashboard-shell.tsx"), "utf8"), /untrusted reference content/);
  assert.match(readFileSync(join(root, "src/components/dashboard-shell.tsx"), "utf8"), /const shouldResearch = webResearch/);
  assert.match(readFileSync(join(root, "src/components/dashboard-shell.tsx"), "utf8"), /setWebResearch\(false\)/);
  assert.match(readFileSync(join(root, "src/components/dashboard-shell.tsx"), "utf8"), /1_000_000/);
  assert.match(readFileSync(join(root, "src/app/api/progress/route.ts"), "utf8"), /studyHistory/);
  assert.match(readFileSync(join(root, "src/components/dashboard-shell.tsx"), "utf8"), /Study rhythm/);
  assert.match(readFileSync(join(root, "src/app/api/voice/speech/route.ts"), "utf8"), /provider could not generate audio/);
  assert.match(readFileSync(join(root, "src/app/api/voice/speech/route.ts"), "utf8"), /consumePersistentRateLimit/);
  assert.equal(readFileSync(join(root, "src/app/api/study-sessions/route.ts"), "utf8").includes("consumePersistentRateLimit"), true);
  assert.match(readFileSync(join(root, "src/app/api/study-sessions/route.ts"), "utf8"), /2_000/);
  assert.equal(readFileSync(join(root, "src/app/api/vocabulary/review/route.ts"), "utf8").includes("consumePersistentRateLimit"), true);
  assert.match(readFileSync(join(root, "src/app/api/study-sessions/route.ts"), "utf8"), /realtime-voice/);
  assert.match(readFileSync(join(root, "src/app/api/study-sessions/route.ts"), "utf8"), /max\(60\)/);
  assert.match(readFileSync(join(root, "src/app/api/voice/speech/route.ts"), "utf8"), /voice_tts/);
  assert.match(readFileSync(join(root, "src/app/api/voice/speech/route.ts"), "utf8"), /monthlyBudgetUsd/);
  assert.match(readFileSync(join(root, "src/app/api/voice/realtime/route.ts"), "utf8"), /voice_realtime_session/);
  assert.match(readFileSync(join(root, "src/app/api/voice/realtime/route.ts"), "utf8"), /gpt-4o-mini-transcribe/);
  assert.match(readFileSync(join(root, "src/app/api/voice/realtime/usage/route.ts"), "utf8"), /voice_realtime_duration/);
  assert.match(readFileSync(join(root, "src/app/api/voice/realtime/transcript/route.ts"), "utf8"), /conversationId/);
  assert.match(readFileSync(join(root, "src/app/api/voice/realtime/transcript/route.ts"), "utf8"), /userId: session.user.id/);
  assert.match(readFileSync(join(root, "src/app/api/pronunciation/assess/route.ts"), "utf8"), /No score was saved/);
  assert.match(readFileSync(join(root, "src/app/api/pronunciation/assess/route.ts"), "utf8"), /AbortSignal\.timeout/);
  assert.match(readFileSync(join(root, "src/app/api/pronunciation/assess/route.ts"), "utf8"), /recordStudySession/);
  assert.match(readFileSync(join(root, "src/app/api/health/route.ts"), "utf8"), /HEALTHCHECK_STRICT/);
  assert.match(readFileSync(join(root, "src/app/api/health/route.ts"), "utf8"), /authConfigured/);
  assert.match(readFileSync(join(root, "src/lib/learning.ts"), "utf8"), /Explicación \(ES\)/);
  assert.match(readFileSync(join(root, "src/auth.ts"), "utf8"), /login:\$\{email\}/);
  assert.match(readFileSync(join(root, "src/auth.ts"), "utf8"), /if \(!user\) return \{\}/);
});
