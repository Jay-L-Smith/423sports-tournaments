import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bestSize,
  divisionsOnFields,
  maxTeamsOnFields,
  planClocks,
  sizeOptions,
} from "./weekend-plan.ts";

test("first days last-start at 8:00, rain holds Sunday at 4:00", () => {
  assert.deepEqual(planClocks(true), { lastStart: "20:00", lastDayLastStart: "16:00" });
  assert.deepEqual(planClocks(false), { lastStart: "20:00", lastDayLastStart: "18:00" });
});

test("12, 16, and 20 teams on a 2-day rain weekend", () => {
  assert.deepEqual(sizeOptions(12, 2, true), [
    { divisions: 1, fields: 2, sunday: "6:00" },
    { divisions: 2, fields: 2, sunday: "4:00" },
    { divisions: 1, fields: 3, sunday: "4:00" },
  ]);
  assert.deepEqual(sizeOptions(16, 2, true), [
    { divisions: 1, fields: 3, sunday: "6:00" },
    { divisions: 3, fields: 3, sunday: "4:00" },
    { divisions: 1, fields: 4, sunday: "4:00" },
  ]);
  assert.deepEqual(bestSize(20, 2, true), { divisions: 2, fields: 4, sunday: "4:00" });
  assert.deepEqual(sizeOptions(20, 2, true), [
    { divisions: 3, fields: 3, sunday: "6:00" },
    { divisions: 1, fields: 4, sunday: "6:00" },
    { divisions: 2, fields: 4, sunday: "4:00" },
    { divisions: 1, fields: 6, sunday: "4:00" },
  ]);
});

test("Sunday 8:00 is a choice only when 6:00 still does not fit", () => {
  assert.equal(sizeOptions(12, 2, true).some((option) => option.sunday === "8:00"), false);
  assert.equal(sizeOptions(13, 2, false).find((option) => option.divisions === 1 && option.fields === 2)?.sunday, "8:00");
  assert.deepEqual(bestSize(12, 2, true), { divisions: 2, fields: 2, sunday: "4:00" });
  assert.equal(planClocks(true, "6:00").lastDayLastStart, "18:00");
  assert.equal(planClocks(true, "8:00").lastDayLastStart, "20:00");
});

test("3 rain days lets 20 teams stay one division on 3 fields", () => {
  assert.deepEqual(bestSize(20, 3, true), { divisions: 1, fields: 3, sunday: "4:00" });
});

test("fields on hand cap the team count", () => {
  assert.equal(divisionsOnFields(20, 4, 2, true), 2);
  assert.equal(divisionsOnFields(20, 3, 2, true), null);
  assert.deepEqual(maxTeamsOnFields(3, 2, true), { teams: 18, divisions: 3 });
  assert.deepEqual(maxTeamsOnFields(4, 2, true), { teams: 24, divisions: 4 });
});

test("rain off still treats Sunday 6:00 as the normal last start", () => {
  assert.deepEqual(bestSize(20, 2, false), { divisions: 3, fields: 3, sunday: "6:00" });
  assert.equal(planClocks(false).lastDayLastStart, "18:00");
});
