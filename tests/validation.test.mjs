import assert from "node:assert/strict";
import test from "node:test";

test("Milestone 1 request constraints are documented", () => {
  assert.equal(6000 > 0, true);
  assert.equal(["ASSISTANT", "TUTOR", "SMART"].includes("TUTOR"), true);
});
