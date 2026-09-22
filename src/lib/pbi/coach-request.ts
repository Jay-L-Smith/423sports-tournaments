import type { RequestStatus, Role } from "./roles";

export type CoachAccessInput = {
  teamName: string;
  reason: string;
};

/** First Coach sign-up plus this many extra tries after a deny. */
export const MAX_COACH_RESUBMITS = 2;
export const MAX_COACH_REQUESTS = 1 + MAX_COACH_RESUBMITS;

export const PBI_STAFF_CONTACT =
  "Contact 423Sports Staff if you believe this was in error.";

export type CoachResubmitState = {
  canResubmitCoach: boolean;
  coachAccessLocked: boolean;
  resubmitsLeft: number;
};

export function parseCoachAccess(data: {
  teamName?: unknown;
  reason?: unknown;
}): CoachAccessInput {
  const teamName = typeof data.teamName === "string" ? data.teamName.trim() : "";
  const reason = typeof data.reason === "string" ? data.reason.trim() : "";
  if (teamName.length < 2) throw new Error("What team do you coach?");
  if (teamName.length > 80) throw new Error("Keep the team name under 80 characters.");
  if (reason.length < 8) throw new Error("Tell us why you need Coach access.");
  if (reason.length > 280) throw new Error("Keep the reason under 280 characters.");
  return { teamName, reason };
}

export function coachResubmitState(input: {
  requestedRole: Role;
  requestStatus: RequestStatus;
  coachRequestCount: number;
}): CoachResubmitState {
  const count = Math.max(0, input.coachRequestCount);
  const resubmitsUsed = Math.max(0, count - 1);
  const resubmitsLeft = Math.max(0, MAX_COACH_RESUBMITS - resubmitsUsed);
  const isDeniedCoach = input.requestStatus === "denied" && input.requestedRole === "coach";
  return {
    canResubmitCoach: isDeniedCoach && count < MAX_COACH_REQUESTS,
    coachAccessLocked: isDeniedCoach && count >= MAX_COACH_REQUESTS,
    resubmitsLeft: isDeniedCoach ? resubmitsLeft : 0,
  };
}

export function resubmitTriesCopy(left: number): string {
  if (left === 1) return "You can request again (1 try left).";
  return `You can request again (${left} tries left).`;
}

export function denyCoachNotice(coachRequestCountAfterDeny: number): { title: string; body: string } {
  const state = coachResubmitState({
    requestedRole: "coach",
    requestStatus: "denied",
    coachRequestCount: coachRequestCountAfterDeny,
  });
  if (state.coachAccessLocked) {
    return {
      title: "Coach access denied",
      body: `An Admin denied Coach access. You can keep using Parent tools. ${PBI_STAFF_CONTACT}`,
    };
  }
  const tries = resubmitTriesCopy(state.resubmitsLeft);
  return {
    title: "Coach access denied",
    body: `An Admin denied Coach access. If this was a mistake, ${tries.charAt(0).toLowerCase()}${tries.slice(1)} You can keep using Parent tools.`,
  };
}
