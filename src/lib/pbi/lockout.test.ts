import assert from "node:assert/strict";
import test from "node:test";
import { lockoutDue } from "./weekends.ts";

test("lock card waits for the create-time cutoff and hides after first pitch", () => {
  assert.equal(lockoutDue("2026-10-10", "2026-10-06", 3, "2026-09-01"), false);
  assert.equal(lockoutDue("2026-10-10", "2026-10-07", 3, "2026-09-01"), true);
  assert.equal(lockoutDue("2026-10-10", "2026-10-09", 3, "2026-09-01"), true);
  assert.equal(lockoutDue("2026-10-10", "2026-10-10", 3, "2026-09-01"), false);
});

test("a tournament created inside the lock window does not get the card", () => {
  assert.equal(lockoutDue("2026-09-26", "2026-09-24", 3, "2026-09-24T16:00:00.000Z"), false);
  assert.equal(lockoutDue("2026-09-26", "2026-09-24", 3, "2026-09-20"), true);
});
