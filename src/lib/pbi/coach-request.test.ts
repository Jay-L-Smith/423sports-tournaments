import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_COACH_REQUESTS,
  PBI_STAFF_CONTACT,
  coachResubmitState,
  denyCoachNotice,
  resubmitTriesCopy,
} from "./coach-request.ts";

test("first deny still allows two resubmits", () => {
  const state = coachResubmitState({
    requestedRole: "coach",
    requestStatus: "denied",
    coachRequestCount: 1,
  });
  assert.equal(state.canResubmitCoach, true);
  assert.equal(state.coachAccessLocked, false);
  assert.equal(state.resubmitsLeft, 2);
});

test("second deny leaves one resubmit", () => {
  const state = coachResubmitState({
    requestedRole: "coach",
    requestStatus: "denied",
    coachRequestCount: 2,
  });
  assert.equal(state.canResubmitCoach, true);
  assert.equal(state.resubmitsLeft, 1);
});

test("third deny locks and points to PBI Staff", () => {
  const state = coachResubmitState({
    requestedRole: "coach",
    requestStatus: "denied",
    coachRequestCount: MAX_COACH_REQUESTS,
  });
  assert.equal(state.canResubmitCoach, false);
  assert.equal(state.coachAccessLocked, true);
  assert.equal(state.resubmitsLeft, 0);
  const notice = denyCoachNotice(MAX_COACH_REQUESTS);
  assert.match(notice.body, /423Sports Staff/);
  assert.equal(notice.body.includes(PBI_STAFF_CONTACT), true);
});

test("pending and approved coaches cannot resubmit", () => {
  assert.equal(
    coachResubmitState({
      requestedRole: "coach",
      requestStatus: "pending",
      coachRequestCount: 1,
    }).canResubmitCoach,
    false,
  );
  assert.equal(
    coachResubmitState({
      requestedRole: "coach",
      requestStatus: "approved",
      coachRequestCount: 1,
    }).canResubmitCoach,
    false,
  );
});

test("denied admin does not get coach resubmits", () => {
  const state = coachResubmitState({
    requestedRole: "admin",
    requestStatus: "denied",
    coachRequestCount: 0,
  });
  assert.equal(state.canResubmitCoach, false);
  assert.equal(state.coachAccessLocked, false);
});

test("try-left copy is plain language", () => {
  assert.equal(resubmitTriesCopy(2), "You can request again (2 tries left).");
  assert.equal(resubmitTriesCopy(1), "You can request again (1 try left).");
});
