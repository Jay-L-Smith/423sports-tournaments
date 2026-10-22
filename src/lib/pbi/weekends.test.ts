import assert from "node:assert/strict";
import test from "node:test";
import {
  baseballAgeYear,
  beforeFirstPitch,
  divisionForTeam,
  leagueAge,
  playerMeetsAge,
  teamCanPlay,
  defaultDayPlan,
  DEFAULT_TOURNAMENT_TEAMS,
  neededToFinish,
  parseAgeCaps,
  parseDayPlan,
  parseJersey,
  parseLocationInput,
  parseParkFlags,
  parsePlayerInput,
  parseTeamCount,
  parseTeamRegister,
  parseTournamentMax,
  parseWeekendInput,
  parseWeekendUpdate,
  sheetIsLocked,
  liveLinkOpen,
  liveLinksCloseAt,
  weekendSavePayload,
  eligibilityLadder,
  eventEligibilityLines,
} from "./weekends.ts";
import { DEFAULT_BRACKET_RULES } from "./rules.ts";

test("eligibility copy uses the event age, with grads only from 14U up", () => {
  assert.deepEqual(eventEligibilityLines(["15U"], 2026), ["This event is 15U: born on or after May 1, 2011. Or 2030 grad or younger."]);
  assert.equal(eventEligibilityLines(["13U"], 2026)[0]?.includes("grad"), false);
  assert.equal(eligibilityLadder(2026)[0], "7U: born on or after May 1, 2019.");
  assert.equal(eligibilityLadder(2026).at(-2), "Underclass: 2029 grad or younger.");
  assert.equal(eligibilityLadder(2026).at(-1), "Upperclass: 2027 grad or younger.");
  assert.deepEqual(eventEligibilityLines(["15U"], 2027), ["This event is 15U: born on or after May 1, 2012. Or 2031 grad or younger."]);
});

test("the sheet locks 24 hours before first pitch", () => {
  const startDate = "2026-09-26";
  const firstPitch = "08:00";
  const dayBefore = new Date(2026, 8, 25, 7, 59, 0, 0);
  const lock = new Date(2026, 8, 25, 8, 0, 0, 0);
  const atPitch = new Date(2026, 8, 26, 8, 0, 0, 0);
  assert.equal(sheetIsLocked({ lock: "auto", startDate, firstPitch, now: dayBefore }), false);
  assert.equal(sheetIsLocked({ lock: "auto", startDate, firstPitch, now: dayBefore, scored: true }), true);
  assert.equal(sheetIsLocked({ lock: "auto", startDate, firstPitch, now: lock }), true);
  assert.equal(sheetIsLocked({ lock: "auto", startDate, firstPitch, now: atPitch }), true);
  assert.equal(sheetIsLocked({ lock: "off", startDate, firstPitch, now: lock, scored: true }), false);
  assert.equal(sheetIsLocked({ lock: "on", startDate, firstPitch, now: dayBefore }), true);
  assert.equal(beforeFirstPitch(startDate, firstPitch, new Date(2026, 8, 26, 7, 59, 0, 0)), true);
  assert.equal(beforeFirstPitch(startDate, firstPitch, new Date(2026, 8, 26, 8, 0, 0, 0)), false);
});

test("live links stay open until two weeks after the last fall game", () => {
  const closes = liveLinksCloseAt("2026-11-01");
  assert.ok(closes);
  const duringFall = new Date(2026, 9, 19, 12, 0, 0, 0);
  const lastDay = new Date(2026, 10, 15, 20, 0, 0, 0);
  const after = new Date(2026, 10, 16, 0, 0, 0, 0);
  assert.equal(liveLinkOpen({ locked: false, closesAt: closes, now: duringFall }), false);
  assert.equal(liveLinkOpen({ locked: true, closesAt: null, now: duringFall }), true);
  assert.equal(liveLinkOpen({ locked: true, closesAt: closes, now: duringFall }), true);
  assert.equal(liveLinkOpen({ locked: true, closesAt: closes, now: lastDay }), true);
  assert.equal(liveLinkOpen({ locked: true, closesAt: closes, now: after }), false);
  assert.equal(liveLinksCloseAt(null), null);
});

test("a full small field is not still needing teams", () => {
  const base = {
    ageGroups: ["16U"],
    maxTeams: 12,
    rules: { minTeams: 3 },
    locationCount: 2,
    hasBracket: true,
  };
  assert.deepEqual(neededToFinish({ ...base, approvedCount: 2 }), ["Needs teams"]);
  assert.deepEqual(neededToFinish({ ...base, approvedCount: 3 }), ["9 spots available"]);
  assert.deepEqual(neededToFinish({ ...base, approvedCount: 11 }), ["1 spot available"]);
  assert.deepEqual(neededToFinish({ ...base, approvedCount: 12 }), []);
});

test("empty min/max means no cap", () => {
  assert.equal(parseTeamCount("", "min"), null);
  assert.equal(parseTeamCount("8", "max"), 8);
});

test("max teams defaults to 10", () => {
  assert.equal(parseTournamentMax(""), DEFAULT_TOURNAMENT_TEAMS);
  assert.equal(parseTournamentMax(null), 10);
  assert.equal(parseTournamentMax("10"), 10);
  assert.equal(parseTournamentMax("40"), 40);
});

test("create form requires an age and keeps rules", () => {
  assert.throws(
    () =>
      parseWeekendInput({
        name: "McMinn / TWU",
        startDate: "2026-09-26",
        endDate: "2026-09-27",
        ageGroups: [],
      }),
    /at least one age/,
  );
  const created = parseWeekendInput({
    name: "McMinn / TWU",
    startDate: "2026-09-26",
    endDate: "2026-09-27",
    ageGroups: ["12U"],
    rules: { ...DEFAULT_BRACKET_RULES, poolGamesPerTeam: 3 },
  });
  assert.equal(created.maxTeams, 10);
  assert.deepEqual(created.ageGroups, ["12U"]);
  assert.equal(created.rules.poolGamesPerTeam, 2);
  assert.deepEqual(created.rules.divisions, [{ name: "Gold", size: 10 }]);
});

test("min cannot exceed max", () => {
  assert.throws(
    () =>
      parseAgeCaps({
        weekendId: 1,
        ages: [{ ageGroup: "15U", minTeams: "8", maxTeams: "4" }],
      }),
    /Min can’t be higher than max/,
  );
});

test("location needs a name and a real address", () => {
  const loc = parseLocationInput({
    weekendId: 1,
    name: "McMinn County HS",
    address: "2215 Congress Parkway, Athens, TN",
  });
  assert.equal(loc.name, "McMinn County HS");
  assert.throws(
    () => parseLocationInput({ weekendId: 1, name: "McMinn", address: "Athens" }),
    /street address/,
  );
  assert.throws(
    () => parseLocationInput({ weekendId: 1, name: "", address: "2215 Congress Parkway, Athens, TN" }),
    /short name/,
  );
  const flags = parseParkFlags({
    concessions: true,
    chairs: true,
    canopies: true,
    entranceFee: true,
    entrancePrice: "$8",
    ageDiscount: true,
    discountAges: ["8U", "10U", "nope"],
    discountPrice: "5",
  });
  assert.equal(flags.concessions, true);
  assert.equal(flags.chairs, true);
  assert.equal(flags.canopies, true);
  assert.equal(flags.entrancePrice, "8");
  assert.deepEqual(flags.discountAges, ["8U", "10U"]);
  assert.equal(flags.discountPrice, "5");
  assert.equal(parseParkFlags({}).lights, false);
  assert.equal(parseParkFlags({ ageDiscount: true, discountPrice: "3" }).ageDiscount, false);
});

test("team registration needs tournament, age, and name", () => {
  const team = parseTeamRegister({ weekendId: 1, ageGroup: "15U", name: " Tellico 15U " });
  assert.equal(team.name, "Tellico 15U");
  assert.throws(() => parseTeamRegister({ weekendId: 1, ageGroup: "15U", name: "A" }), /team a name/);
});

test("jersey is 0–99", () => {
  assert.equal(parseJersey("12"), 12);
  assert.throws(() => parseJersey("100"), /0–99/);
  assert.equal(parsePlayerInput({ teamId: 1, name: "Sam", jersey: "7" }).jersey, 7);
});

test("tournament update can add another age after the fact", () => {
  const next = parseWeekendUpdate({
    weekendId: 1,
    name: "McMinn / TWU",
    startDate: "2026-09-26",
    endDate: "2026-09-27",
    maxTeams: "40",
    ages: [
      { ageGroup: "15U", minTeams: "4", maxTeams: "8" },
      { ageGroup: "14U", minTeams: "", maxTeams: "" },
    ],
    poolPlay: true,
  });
  assert.deepEqual(
    next.ages.map((age) => age.ageGroup),
    ["14U", "15U"],
  );
  assert.equal(next.poolPlay, true);
});

test("tournament update still needs at least one age", () => {
  assert.throws(
    () =>
      parseWeekendUpdate({
        weekendId: 1,
        name: "McMinn / TWU",
        startDate: "2026-09-26",
        endDate: "2026-09-27",
        ages: [],
      }),
    /at least one age/,
  );
});

test("a rules-only save keeps name, dates, and ages", () => {
  const next = weekendSavePayload(
    {
      id: 1,
      name: "McMinn / TWU",
      startDate: "2026-09-26",
      endDate: "2026-09-27",
      maxTeams: 40,
      poolPlay: true,
      dayPlan: defaultDayPlan("2026-09-26", "2026-09-27"),
      rules: DEFAULT_BRACKET_RULES,
      ages: [{ ageGroup: "15U", minTeams: 4, maxTeams: 40 }],
    },
    { rules: { ...DEFAULT_BRACKET_RULES, minTeams: 4, poolGamesPerTeam: 3 } },
  );
  assert.equal(next.name, "McMinn / TWU");
  assert.equal(next.rules.minTeams, 4);
  assert.equal(next.rules.poolGamesPerTeam, 2);
  assert.equal(next.rules.consolation, false);
  assert.equal(next.ages[0]?.ageGroup, "15U");
  assert.equal(next.poolPlay, true);
  assert.deepEqual(
    next.dayPlan.map((row) => row.kind),
    ["pool", "bracket"],
  );
});

test("April 30 cutoff lets a 15U player play up into 16U", () => {
  assert.equal(baseballAgeYear("2026-10-07"), 2027);
  assert.equal(baseballAgeYear("2026-04-01"), 2026);
  assert.equal(leagueAge("2011-05-01", 2027), 15);
  assert.equal(leagueAge("2011-04-30", 2027), 16);
  assert.equal(playerMeetsAge("2011-05-01", "15U", 2027), true);
  assert.equal(playerMeetsAge("2011-04-30", "15U", 2027), false);
  assert.equal(playerMeetsAge("2011-04-30", "16U", 2027), true);
  assert.equal(playerMeetsAge("2010-01-15", "16U", 2027), false);
});

test("a team can play its own age or one year up", () => {
  assert.equal(divisionForTeam("15U", ["16U"]), "16U");
  assert.equal(teamCanPlay("15U", "16U"), true);
  assert.equal(divisionForTeam("16U", ["16U"]), "16U");
  assert.equal(divisionForTeam("14U", ["16U"]), null);
  assert.equal(teamCanPlay("16U", "15U"), true);
  assert.equal(divisionForTeam("16U", ["15U"]), "15U");
  assert.equal(divisionForTeam("17U", ["15U", "16U"]), "16U");
  assert.equal(divisionForTeam("15U", ["14U", "16U"]), "16U");
  assert.equal(divisionForTeam("14U", ["14U", "16U"]), "14U");
  assert.equal(divisionForTeam("8U", ["8U"]), "8U");
  assert.equal(divisionForTeam("8U", ["9U"]), "9U");
});

test("team fee survives a second save and can be cleared", () => {
  const detail = {
    id: 4,
    name: "Fall Opener",
    startDate: "2026-10-10",
    endDate: "2026-10-11",
    maxTeams: 12,
    poolPlay: true,
    dayPlan: defaultDayPlan("2026-10-10", "2026-10-11"),
    rules: DEFAULT_BRACKET_RULES,
    ages: [{ ageGroup: "16U" as const, minTeams: 3, maxTeams: 12 }],
    teamFeeCents: null as number | null,
  };
  const saved = weekendSavePayload(detail, { teamFee: "$350" });
  assert.equal(saved.teamFeeCents, 35000);
  const again = parseWeekendUpdate(saved);
  assert.equal(again.teamFeeCents, 35000);
  const rulesOnly = parseWeekendUpdate(weekendSavePayload({ ...detail, teamFeeCents: 35000 }, { rules: DEFAULT_BRACKET_RULES }));
  assert.equal(rulesOnly.teamFeeCents, 35000);
  const cleared = parseWeekendUpdate(weekendSavePayload({ ...detail, teamFeeCents: 35000 }, { teamFee: "" }));
  assert.equal(cleared.teamFeeCents, null);
});

test("default day plan: 1 mixed, 2 pool then bracket, 3+ mixed in the middle", () => {
  assert.deepEqual(
    defaultDayPlan("2026-09-25", "2026-09-25").map((row) => row.kind),
    ["mixed"],
  );
  assert.deepEqual(
    defaultDayPlan("2026-09-26", "2026-09-27").map((row) => row.kind),
    ["pool", "bracket"],
  );
  assert.deepEqual(
    defaultDayPlan("2026-09-25", "2026-09-27").map((row) => row.kind),
    ["pool", "mixed", "bracket"],
  );
  assert.deepEqual(
    defaultDayPlan("2026-09-21", "2026-09-27").map((row) => row.kind),
    ["pool", "mixed", "mixed", "mixed", "mixed", "mixed", "bracket"],
  );
});

test("two-day weekend keeps Saturday pool and Sunday bracket", () => {
  assert.deepEqual(
    parseDayPlan(
      [
        { date: "2026-10-02", kind: "mixed" },
        { date: "2026-10-03", kind: "bracket" },
      ],
      "2026-10-02",
      "2026-10-03",
      true,
    ).map((row) => row.kind),
    ["pool", "bracket"],
  );
});

test("changing dates keeps kinds on overlapping days", () => {
  const kept = parseDayPlan(
    [
      { date: "2026-09-26", kind: "pool" },
      { date: "2026-09-27", kind: "bracket" },
    ],
    "2026-09-25",
    "2026-09-27",
  );
  assert.equal(kept[0]?.date, "2026-09-25");
  assert.equal(kept[0]?.kind, "pool");
  assert.equal(kept[1]?.kind, "pool");
  assert.equal(kept[2]?.kind, "bracket");
});

