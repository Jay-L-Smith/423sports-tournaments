import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultDayPlan,
  parseAgeCaps,
  parseDayPlan,
  parseJersey,
  parseLocationInput,
  parsePlayerInput,
  parseTeamCount,
  parseTeamRegister,
  parseWeekendUpdate,
  weekendSavePayload,
} from "./weekends.ts";
import { DEFAULT_BRACKET_RULES } from "./rules.ts";

test("empty min/max means no cap", () => {
  assert.equal(parseTeamCount("", "min"), null);
  assert.equal(parseTeamCount("8", "max"), 8);
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
    { rules: { ...DEFAULT_BRACKET_RULES, minTeams: 4, consolation: true } },
  );
  assert.equal(next.name, "McMinn / TWU");
  assert.equal(next.rules.minTeams, 4);
  assert.equal(next.rules.consolation, true);
  assert.equal(next.ages[0]?.ageGroup, "15U");
  assert.equal(next.poolPlay, true);
  assert.deepEqual(
    next.dayPlan.map((row) => row.kind),
    ["pool", "bracket"],
  );
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

