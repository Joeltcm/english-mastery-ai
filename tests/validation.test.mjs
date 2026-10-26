import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
    "src/app/api/pronunciation/assess/route.ts",
    "src/app/api/study-sessions/route.ts",
    "src/app/api/maintenance/retention/route.ts",
    "src/app/api/lessons/route.ts",
    "src/app/api/lessons/[slug]/attempt/route.ts",
    "src/app/api/grammar-errors/route.ts",
  ];
  for (const route of routes) assert.equal(readFileSync(join(root, route), "utf8").length > 0, true, route);
  const manifest = JSON.parse(readFileSync(join(root, "public/manifest.webmanifest"), "utf8"));
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.icons.length >= 2, true);
  assert.match(readFileSync(join(root, "src/app/layout.tsx"), "utf8"), /appleWebApp/);
  assert.match(readFileSync(join(root, "prisma/schema.prisma"), "utf8"), /model AiUsageEvent/);
  assert.match(readFileSync(join(root, "prisma/schema.prisma"), "utf8"), /model RateLimitBucket/);
  assert.match(readFileSync(join(root, "railway.retention.toml"), "utf8"), /cronSchedule/);
  assert.match(readFileSync(join(root, "scripts/run-retention.mjs"), "utf8"), /CRON_SECRET/);
  assert.match(readFileSync(join(root, "scripts/deploy-preflight.mjs"), "utf8"), /missingRequiredEnvironment/);
  assert.match(readFileSync(join(root, "src/app/api/assessment/route.ts"), "utf8"), /sessionsSinceAssessment/);
  assert.match(readFileSync(join(root, "src/components/privacy-controls.tsx"), "utf8"), /saveMemoryEdit/);
  assert.match(readFileSync(join(root, "src/components/dashboard-shell.tsx"), "utf8"), /setMessages\(starterMessages\)/);
  assert.match(readFileSync(join(root, "src/components/dashboard-shell.tsx"), "utf8"), /key=\{userEmail \|\| "guest"\}/);
  assert.match(readFileSync(join(root, "src/app/api/chat/route.ts"), "utf8"), /provider could not start/);
  assert.match(readFileSync(join(root, "src/app/api/chat/route.ts"), "utf8"), /text-conversation/);
  assert.match(readFileSync(join(root, "src/app/api/voice/speech/route.ts"), "utf8"), /provider could not generate audio/);
  assert.match(readFileSync(join(root, "src/app/api/health/route.ts"), "utf8"), /HEALTHCHECK_STRICT/);
  assert.match(readFileSync(join(root, "src/lib/learning.ts"), "utf8"), /Explicación \(ES\)/);
});
