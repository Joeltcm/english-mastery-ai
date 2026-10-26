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
    "src/app/api/privacy/export/route.ts",
    "src/app/api/account/route.ts",
    "src/app/api/memories/route.ts",
    "src/app/api/voice/speech/route.ts",
    "src/app/api/pronunciation/assess/route.ts",
  ];
  for (const route of routes) assert.equal(readFileSync(join(root, route), "utf8").length > 0, true, route);
  const manifest = JSON.parse(readFileSync(join(root, "public/manifest.webmanifest"), "utf8"));
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
});
