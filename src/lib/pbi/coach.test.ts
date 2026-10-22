import assert from "node:assert/strict";
import test from "node:test";
import { gamesForTeams, maxTeamsThatFit, mustPlaySlots, slotsOnDay } from "./coach";

test("rain holds the last start and is not a must-play slot", () => {
  const open = slotsOnDay("08:00", "20:00", 105, false);
  const held = slotsOnDay("08:00", "20:00", 105, true);
  assert.ok(open > 1);
  assert.equal(held, open - 1);
});

test("one day uses the last-day clock", () => {
  const slots = mustPlaySlots({
    days: 1,
    firstPitch: "08:00",
    lastStart: "20:00",
    lastDayLastStart: "18:00",
    slotMinutes: 105,
    rain: false,
  });
  assert.equal(slots, slotsOnDay("08:00", "18:00", 105, false));
});

test("small is bracket-only and top-per-pool fits more teams than all-reseed", () => {
  const slots = mustPlaySlots({
    days: 2,
    firstPitch: "08:00",
    lastStart: "20:00",
    lastDayLastStart: "18:00",
    slotMinutes: 105,
    rain: false,
  });
  const small = maxTeamsThatFit({ path: "small", fields: 1, slots, advance: "all-reseed", advancePerPool: 2 });
  assert.equal(small, Math.min(40, slots + 1));
  const all = maxTeamsThatFit({ path: "mid", fields: 2, slots, advance: "all-reseed", advancePerPool: 2 });
  const top = maxTeamsThatFit({ path: "mid", fields: 2, slots, advance: "top-per-pool", advancePerPool: 2 });
  assert.ok(top >= all);
  assert.equal(gamesForTeams({ path: "small", teams: 8, advance: "all-reseed", advancePerPool: 2 }), 7);
});
