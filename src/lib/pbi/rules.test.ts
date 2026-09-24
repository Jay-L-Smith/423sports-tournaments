import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_BRACKET_RULES,
  DEFAULT_TIEBREAKER_ORDER,
  MIN_BRACKET_TEAMS,
  POOL_REGEN_BLOCKED,
  addTiebreaker,
  hasPlayableBracket,
  moveTiebreaker,
  normalizeDivisions,
  parseBracketRules,
  poolScheduleBlockReason,
  poolScheduleChecks,
  setDivisionCount,
  teamsNeededForBracket,
} from "./rules.ts";
import { teamEntryClosed } from "./weekends.ts";

test("new teams close the day before, or when a game is scored", () => {
  assert.equal(teamEntryClosed({ startDate: "2026-09-26", today: "2026-09-25" }), null);
  assert.equal(
    teamEntryClosed({ startDate: "2026-09-26", today: "2026-09-26" }),
    "New teams close the day before the tournament starts.",
  );
  assert.equal(
    teamEntryClosed({ startDate: "2026-09-26", today: "2026-09-24", scored: true }),
    "New teams close once a game has a score.",
  );
});

test("empty rules fall back to 423Sports defaults", () => {
  const rules = parseBracketRules({});
  assert.equal(rules.minTeams, 3);
  assert.equal(rules.advance, "all-reseed");
  assert.equal(rules.elimination, "single");
  assert.equal(rules.softFill, true);
  assert.equal(rules.poolGamesPerTeam, 2);
  assert.equal(rules.consolation, false);
  assert.equal(rules.homePool, "coin-flip");
  assert.equal(rules.homeBracket, "higher-seed");
  assert.deepEqual(rules.tiebreakers, DEFAULT_TIEBREAKER_ORDER);
  assert.deepEqual(rules.divisions, [{ name: "Gold", size: 40 }]);
});

test("tiebreakers include head-to-head and it can be moved", () => {
  const order = parseBracketRules({}).tiebreakers;
  assert.deepEqual(order, ["record", "runs-scored", "run-diff", "runs-allowed", "head-to-head", "coin-flip"]);
  const moved = moveTiebreaker(order, order.indexOf("head-to-head"), -1);
  assert.equal(moved[moved.length - 2], "runs-allowed");
});

test("H2H can be added and stays available", () => {
  const withH2h = addTiebreaker(DEFAULT_TIEBREAKER_ORDER, "head-to-head");
  assert.ok(withH2h.includes("head-to-head"));
  assert.equal(withH2h[withH2h.length - 1], "coin-flip");
});

test("pool games per team cannot go below 1", () => {
  assert.equal(parseBracketRules({ poolGamesPerTeam: 0 }).poolGamesPerTeam, 1);
  assert.equal(parseBracketRules({ poolGamesPerTeam: 1 }).poolGamesPerTeam, 1);
  assert.equal(parseBracketRules({ poolGamesPerTeam: "3" }).poolGamesPerTeam, 3);
});

test("soft-fill is always on", () => {
  assert.equal(parseBracketRules({}).softFill, true);
  assert.equal(parseBracketRules({ softFill: false }).softFill, true);
  assert.equal(DEFAULT_BRACKET_RULES.softFill, true);
});

test("advance defaults to all-reseed and drops winners-only", () => {
  assert.equal(parseBracketRules({}).advance, "all-reseed");
  assert.equal(parseBracketRules({ advance: "winners-only" }).advance, "all-reseed");
  assert.equal(parseBracketRules({ advance: "top-per-pool" }).advance, "top-per-pool");
  assert.equal(DEFAULT_BRACKET_RULES.advance, "all-reseed");
});

test("double-elim and consolation are stripped", () => {
  const rules = parseBracketRules({ elimination: "double", consolation: true });
  assert.equal(rules.elimination, "single");
  assert.equal(rules.consolation, false);
});

test("min teams to draw a bracket cannot go below 3", () => {
  assert.equal(parseBracketRules({ minTeams: 1 }).minTeams, MIN_BRACKET_TEAMS);
  assert.equal(parseBracketRules({ minTeams: "4" }).minTeams, 4);
  assert.equal(teamsNeededForBracket(DEFAULT_BRACKET_RULES, null), 3);
  assert.equal(teamsNeededForBracket(DEFAULT_BRACKET_RULES, 5), 5);
});

test("clocks and pack toggles parse with engine defaults", () => {
  const rules = parseBracketRules({});
  assert.equal(rules.firstPitch, "08:00");
  assert.equal(rules.slotMinutes, 120);
  assert.equal(rules.timeLimitMinutes, 105);
  assert.equal(rules.lastStart, "20:00");
  assert.equal(rules.lastDayLastStart, "22:00");
  assert.equal(rules.championshipCollapse, true);
  assert.equal(rules.packStayOnPark, true);
  assert.equal(rules.packFillFields, true);
  assert.equal(rules.packSeed1vsLast, true);
  assert.equal(parseBracketRules({ packDayFilter: false, packFillFields: false }).packDayFilter, true);
  assert.equal(parseBracketRules({ packStayOnPark: false }).packStayOnPark, true);
});

test("regen is blocked when a playable bracket exists", () => {
  assert.equal(hasPlayableBracket([{ round: "pool", isBye: false }]), false);
  assert.equal(hasPlayableBracket([{ round: "r16", isBye: true }]), false);
  assert.equal(hasPlayableBracket([{ round: "qf", isBye: false }]), true);
  assert.equal(POOL_REGEN_BLOCKED.includes("Clear the bracket"), true);
});

test("one division resizes with max teams; two cuts must sum", () => {
  assert.deepEqual(normalizeDivisions([], 32), [{ name: "Gold", size: 32 }]);
  assert.deepEqual(normalizeDivisions([{ name: "Gold", size: 16 }, { name: "Silver", size: 24 }], 40), [
    { name: "Gold", size: 16 },
    { name: "Silver", size: 24 },
  ]);
  assert.throws(() => normalizeDivisions([{ name: "Gold", size: 10 }, { name: "Silver", size: 10 }], 40));
  const two = setDivisionCount([], 2, 40);
  assert.equal(two.length, 2);
  assert.equal(two.reduce((n, row) => n + row.size, 0), 40);
});

test("admin can set slot minutes other than 120", () => {
  assert.equal(parseBracketRules({ slotMinutes: 90 }).slotMinutes, 90);
  assert.equal(parseBracketRules({ slotMinutes: "75" }).slotMinutes, 75);
  assert.equal(parseBracketRules({ slotMinutes: 15 }).slotMinutes, 15);
  assert.equal(parseBracketRules({ slotMinutes: 240 }).slotMinutes, 240);
});

test("generate checklist names what is missing", () => {
  const empty = poolScheduleChecks({
    ageGroups: [],
    approvedByAge: {},
    locationCount: 0,
    minTeams: 3,
    hasBracket: false,
  });
  assert.equal(empty.ready, false);
  assert.equal(empty.items.find((row) => row.id === "ages")?.to, "/weekends/$weekendId/edit");
  assert.equal(empty.items.find((row) => row.id === "teams")?.to, "/weekends/$weekendId/teams");
  assert.equal(empty.items.find((row) => row.id === "parks")?.to, "/weekends/$weekendId/locations");
  const reason = poolScheduleBlockReason(empty);
  assert.ok(reason?.includes("age group"));
  assert.ok(reason?.includes("park"));

  const ready = poolScheduleChecks({
    ageGroups: ["12U"],
    approvedByAge: { "12U": 8 },
    locationCount: 1,
    minTeams: 3,
    hasBracket: false,
  });
  assert.equal(ready.ready, true);
  assert.equal(poolScheduleBlockReason(ready), null);

  const blocked = poolScheduleChecks({
    ageGroups: ["12U"],
    approvedByAge: { "12U": 8 },
    locationCount: 1,
    minTeams: 3,
    hasBracket: true,
  });
  assert.equal(blocked.ready, false);
  assert.equal(blocked.items.find((row) => row.id === "bracket")?.to, "/bracket/$weekendId");
  assert.ok(poolScheduleBlockReason(blocked)?.includes("Clear the bracket"));
});
