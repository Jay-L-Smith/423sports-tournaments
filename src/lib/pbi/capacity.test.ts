import assert from "node:assert/strict";
import test from "node:test";
import {
  assessCapacity,
  bracketClockForFit,
  bracketStarts,
  maxTeamsFor,
  poolStarts,
  splitDivisions,
} from "./capacity.ts";

const twoDay = {
  fields: 2,
  days: 2,
  format: "pool-then-bracket" as const,
  rain: false,
};

test("default clocks are slot 120 and the day-type windows", () => {
  assert.deepEqual(poolStarts({}), ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"]);
  assert.deepEqual(bracketStarts({ rain: false }), ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"]);
  assert.deepEqual(bracketStarts({ rain: true }), ["08:00", "10:00", "12:00", "14:00", "16:00"]);
});

test("12 teams on 2 fields fits only when the rain slot is open", () => {
  assert.equal(assessCapacity({ ...twoDay, teams: 12, rain: false }).fit, true);
  assert.equal(assessCapacity({ ...twoDay, teams: 12, rain: true }).fit, false);
});

test("Sunday's rain buffer moves to 8:00 only when a bracket up to 36 needs it", () => {
  const twelve = { ...twoDay, teams: 12, rain: true };
  const late = bracketClockForFit(twelve);
  assert.equal(late.late, true);
  assert.equal(late.bracketLastMustPlay, "18:00");
  assert.equal(late.bracketRainDelay, "20:00");
  assert.equal(assessCapacity({ ...twelve, ...late }).fit, true);
  assert.equal(bracketClockForFit({ ...twelve, fields: 3 }).late, false);
  assert.equal(bracketClockForFit({ ...twoDay, teams: 11, rain: true }).late, false);
  assert.equal(bracketClockForFit({ ...twoDay, teams: 13, rain: true }).late, false);
  assert.equal(bracketClockForFit({ ...twoDay, teams: 24, fields: 4, rain: true }).late, true);
  assert.equal(bracketClockForFit({ ...twoDay, teams: 24, fields: 5, rain: true }).late, false);
  assert.equal(bracketClockForFit({ ...twoDay, teams: 36, fields: 6, rain: true }).late, true);
  assert.equal(bracketClockForFit({ ...twoDay, teams: 37, fields: 6, rain: true }).late, false);
});

test("14 teams on 2 fields do not fit pool", () => {
  const report = assessCapacity({ ...twoDay, teams: 14 });
  assert.equal(report.fit, false);
  assert.ok(report.reasons.some((row) => row.toLowerCase().includes("pool")));
});

test("max teams at the default clocks", () => {
  assert.equal(maxTeamsFor({ ...twoDay, fields: 2 }), 12);
  assert.equal(maxTeamsFor({ ...twoDay, fields: 4 }), 24);
  assert.equal(maxTeamsFor({ ...twoDay, fields: 6 }), 36);
});

test("knockout divisions stay at 12 or under", () => {
  assert.deepEqual(splitDivisions(12), [12]);
  assert.deepEqual(splitDivisions(19), [10, 9]);
  assert.deepEqual(splitDivisions(20), [10, 10]);
  assert.deepEqual(splitDivisions(24), [12, 12]);
  assert.deepEqual(splitDivisions(36), [12, 12, 12]);
});

test("a shorter slot recounts starts and can raise max teams", () => {
  const wide = poolStarts({ slotMin: 90 });
  assert.ok(wide.length > poolStarts({}).length);
  assert.ok(maxTeamsFor({ ...twoDay, fields: 2, slotMin: 90 }) > 12);
});
