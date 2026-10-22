import assert from "node:assert/strict";
import test from "node:test";
import {
  announcedWeekendName,
  archiveIsDue,
  archivePromptOn,
  defaultSeasonWindow,
  finalizeIsDue,
  finalizeOpensOn,
  preferredSeasonYear,
  seasonOverlaps,
  seasonSaturdays,
  softDeadline,
  suggestTournamentName,
} from "./weekends.ts";

test("season windows seed to the locked dates", () => {
  assert.deepEqual(defaultSeasonWindow("spring", 2027), {
    season: "spring",
    year: 2027,
    startDate: "2027-03-01",
    endDate: "2027-05-31",
  });
  assert.deepEqual(defaultSeasonWindow("summer", 2027), {
    season: "summer",
    year: 2027,
    startDate: "2027-06-01",
    endDate: "2027-08-31",
  });
  assert.deepEqual(defaultSeasonWindow("fall", 2027), {
    season: "fall",
    year: 2027,
    startDate: "2027-09-01",
    endDate: "2027-11-15",
  });
});

test("announced weekend name is the date span", () => {
  assert.equal(announcedWeekendName("2027-04-11", "2027-04-12"), "Apr 11–12");
});

test("finalize opens two weeks before the start", () => {
  assert.equal(finalizeOpensOn("2027-04-11"), "2027-03-28");
  assert.equal(finalizeIsDue("2027-03-28", "2027-04-11"), true);
  assert.equal(finalizeIsDue("2027-03-27", "2027-04-11"), false);
});

test("archive prompt is two weeks after fall ends", () => {
  assert.equal(archivePromptOn("2027-11-15"), "2027-11-29");
  assert.equal(archiveIsDue("2027-11-29", "2027-11-15"), true);
  assert.equal(archiveIsDue("2027-11-28", "2027-11-15"), false);
});

test("planning year never starts before 2026", () => {
  assert.equal(preferredSeasonYear("spring", "2026-04-01"), 2026);
  assert.equal(preferredSeasonYear("spring", "2025-04-01"), 2026);
  assert.equal(preferredSeasonYear("fall", "2026-12-01"), 2027);
});

test("season saturdays stay inside the window", () => {
  const days = seasonSaturdays("2027-03-01", "2027-03-14");
  assert.deepEqual(days[0], { startDate: "2027-03-06", endDate: "2027-03-07" });
  assert.ok(days.every((day) => day.startDate >= "2027-03-01" && day.startDate <= "2027-03-14"));
});

test("soft deadline is 30 days before the first saturday", () => {
  assert.equal(softDeadline("2027-03-01", "2027-03-06"), "2027-02-04");
});

test("season overlap names the shared days", () => {
  const messages = seasonOverlaps(
    { season: "spring", year: 2027, startDate: "2027-03-01", endDate: "2027-06-15" },
    [{ season: "summer", year: 2027, startDate: "2027-06-01", endDate: "2027-08-31" }],
  );
  assert.equal(messages.length, 1);
  assert.match(messages[0], /Spring and Summer overlap/);
});

test("tournament names are seasonal and not reused in the same year", () => {
  assert.equal(suggestTournamentName("spring", 2027, [], 0), "Spring Opener 2027");
  assert.equal(suggestTournamentName("spring", 2027, ["Spring Opener 2027"], 1), "Spring Classic 2027");
  assert.equal(suggestTournamentName("summer", 2027, ["Spring Classic 2027"], 0), "Summer Opener 2027");
  assert.equal(
    suggestTournamentName("fall", 2027, ["Fall Opener 2027", "Fall Classic 2027"], 2),
    "Fall Showdown 2027",
  );
});
