import assert from "node:assert/strict";
import test from "node:test";
import { bracketField, buildGames } from "./bracket.ts";
import { bracketStarts, fieldGroups, splitDivisions } from "./capacity.ts";
import { assignBracketDay, type FieldAssignment, type SchedGame } from "./schedule.ts";

function bracket(teams: number): SchedGame[] {
  return buildGames(
    bracketField(teams, (seed) => seed),
    { firstVsLast: true },
  );
}

function at(rows: FieldAssignment[], round: string, slot: number): FieldAssignment | undefined {
  return rows.find((row) => row.round === round && row.slot === slot);
}

function childOf(games: SchedGame[], play: SchedGame): SchedGame | undefined {
  return games.find(
    (game) =>
      (game.homeFromRound === play.round && game.homeFromSlot === play.slot) ||
      (game.awayFromRound === play.round && game.awayFromSlot === play.slot),
  );
}

/** Slots a team sits between a real feeder and the game it feeds. */
function maxSit(games: SchedGame[], rows: FieldAssignment[], starts: string[]): number {
  const spot = new Map(rows.map((row) => [`${row.round}:${row.slot}`, row]));
  let max = 0;
  for (const game of games) {
    if (game.isBye) continue;
    const here = spot.get(`${game.round}:${game.slot}`);
    if (!here) continue;
    const hereIdx = here.dayIndex * starts.length + starts.indexOf(here.time);
    for (const [round, slot] of [
      [game.homeFromRound, game.homeFromSlot],
      [game.awayFromRound, game.awayFromSlot],
    ] as const) {
      if (round == null || slot == null) continue;
      const feeder = games.find((row) => row.round === round && row.slot === slot);
      if (!feeder || feeder.isBye) continue;
      const prev = spot.get(`${round}:${slot}`);
      if (!prev) continue;
      const prevIdx = prev.dayIndex * starts.length + starts.indexOf(prev.time);
      max = Math.max(max, hereIdx - prevIdx - 1);
    }
  }
  return max;
}

function playIns(games: SchedGame[]): SchedGame[] {
  return games.filter((game) => !game.isBye && game.homeFromRound == null && game.awayFromRound == null);
}

function knownGames(games: SchedGame[]): SchedGame[] {
  return games.filter((game) => {
    if (game.isBye || game.homeFromRound == null || game.awayFromRound == null) return false;
    const left = games.find((row) => row.round === game.homeFromRound && row.slot === game.homeFromSlot);
    const right = games.find((row) => row.round === game.awayFromRound && row.slot === game.awayFromSlot);
    return Boolean(left?.isBye && right?.isBye);
  });
}

const starts = bracketStarts({ rain: false });

test("10 teams on 2 fields: play-ins first, then stay-on, final at 16:00", () => {
  const games = bracket(10);
  const rows = assignBracketDay(games, 2, starts);
  const opening = playIns(games);
  assert.equal(opening.length, 2);
  const fields = new Set(opening.map((game) => at(rows, game.round, game.slot)?.fieldIndex));
  assert.equal(fields.size, 2);
  for (const play of opening) {
    const next = childOf(games, play);
    assert.ok(next);
    const playRow = at(rows, play.round, play.slot);
    const nextRow = at(rows, next.round, next.slot);
    assert.equal(playRow?.time, "08:00");
    assert.equal(nextRow?.time, "10:00");
    assert.equal(nextRow?.fieldIndex, playRow?.fieldIndex);
  }
  const known = knownGames(games);
  assert.equal(known.length, 2);
  for (const game of known) assert.equal(at(rows, game.round, game.slot)?.time, "12:00");
  const semis = games.filter((game) => game.round === "sf" && !game.isBye);
  assert.equal(semis.length, 2);
  for (const game of semis) assert.equal(at(rows, game.round, game.slot)?.time, "14:00");
  const final = rows.find((row) => row.round === "f");
  assert.equal(final?.time, "16:00");
  assert.equal(final?.fieldIndex, 0);
  assert.equal(rows.some((row) => row.time === "18:00"), false);
  assert.ok(maxSit(games, rows, starts) <= 1);
});

test("11 teams play in first and nobody sits two games", () => {
  const games = bracket(11);
  const rows = assignBracketDay(games, 2, starts);
  const opening = playIns(games);
  assert.equal(opening.length, 3);
  for (const play of opening) {
    const next = childOf(games, play);
    assert.ok(next);
    const playRow = at(rows, play.round, play.slot);
    const nextRow = at(rows, next.round, next.slot);
    assert.ok(playRow && nextRow);
    assert.equal(nextRow.fieldIndex, playRow.fieldIndex);
    assert.equal(
      starts.indexOf(nextRow.time) + nextRow.dayIndex * starts.length,
      starts.indexOf(playRow.time) + playRow.dayIndex * starts.length + 1,
    );
  }
  const known = knownGames(games);
  assert.equal(known.length, 1);
  const playAt = opening.map((game) => at(rows, game.round, game.slot)?.time ?? "99");
  const knownAt = at(rows, known[0]!.round, known[0]!.slot)?.time ?? "99";
  assert.ok(playAt.some((time) => time === "08:00"));
  assert.ok(Math.min(...playAt.map((time) => starts.indexOf(time))) <= starts.indexOf(knownAt));
  assert.notEqual(knownAt, "08:00");
  assert.equal(rows.length, games.filter((game) => !game.isBye).length);
  assert.ok(maxSit(games, rows, starts) <= 1, `sit ${maxSit(games, rows, starts)}`);
});

test("12 teams play the next game back to back on the same field", () => {
  const games = bracket(12);
  const rows = assignBracketDay(games, 4, starts);
  const opening = playIns(games);
  assert.equal(opening.length, 4);
  for (const play of opening) {
    const next = childOf(games, play);
    assert.ok(next);
    const playRow = at(rows, play.round, play.slot);
    const nextRow = at(rows, next.round, next.slot);
    assert.equal(playRow?.time, "08:00");
    assert.equal(nextRow?.fieldIndex, playRow?.fieldIndex);
    assert.equal(starts.indexOf(nextRow?.time ?? ""), starts.indexOf(playRow?.time ?? "") + 1);
  }
  assert.ok(maxSit(games, rows, starts) <= 1);
});

test("12 teams on 2 fields still play in, then stay on that field", () => {
  const games = bracket(12);
  const rows = assignBracketDay(games, 2, starts);
  assert.equal(rows.length, games.filter((game) => !game.isBye).length);
  for (const play of playIns(games)) {
    const next = childOf(games, play);
    assert.ok(next);
    const playRow = at(rows, play.round, play.slot);
    const nextRow = at(rows, next.round, next.slot);
    assert.equal(nextRow?.fieldIndex, playRow?.fieldIndex);
    assert.equal(starts.indexOf(nextRow?.time ?? ""), starts.indexOf(playRow?.time ?? "") + 1);
  }
  assert.ok(maxSit(games, rows, starts) <= 2);
});

test("a 10-team rebuild after an 11-team bracket keeps the rest rule", () => {
  const before = assignBracketDay(bracket(11), 2, starts);
  assert.equal(before.length, bracket(11).filter((game) => !game.isBye).length);
  const games = bracket(10);
  const rows = assignBracketDay(games, 2, starts);
  assert.ok(playIns(games).every((game) => at(rows, game.round, game.slot)?.time === "08:00"));
  assert.ok(maxSit(games, rows, starts) <= 1);
  assert.equal(rows.find((row) => row.round === "f")?.time, "16:00");
});

test("rain buffer on still lays a 10-team bracket and does not blank an 11-team bracket", () => {
  const rainStarts = bracketStarts({ rain: true });
  const ten = bracket(10);
  const tenRows = assignBracketDay(ten, 2, rainStarts);
  assert.ok(playIns(ten).every((game) => at(tenRows, game.round, game.slot)?.time === "08:00"));
  assert.equal(tenRows.find((row) => row.round === "f")?.time, "16:00");
  assert.ok(maxSit(ten, tenRows, rainStarts) <= 1);
  const eleven = bracket(11);
  const elevenRows = assignBracketDay(eleven, 2, rainStarts);
  assert.ok(elevenRows.length >= playIns(eleven).length);
  for (const play of playIns(eleven)) {
    const next = childOf(eleven, play);
    assert.ok(next);
    const playRow = at(elevenRows, play.round, play.slot);
    const nextRow = at(elevenRows, next.round, next.slot);
    if (!playRow || !nextRow) continue;
    assert.equal(nextRow.fieldIndex, playRow.fieldIndex);
    assert.equal(rainStarts.indexOf(nextRow.time), rainStarts.indexOf(playRow.time) + 1);
  }
});

test("19 teams split across four fields and run together", () => {
  const sizes = splitDivisions(19);
  assert.deepEqual(sizes, [10, 9]);
  const groups = fieldGroups(2, 4);
  assert.deepEqual(groups, [
    [0, 1],
    [2, 3],
  ]);
  const goldGames = bracket(10);
  const silverGames = bracket(9);
  const gold = assignBracketDay(goldGames, groups[0]!.length, starts);
  const silver = assignBracketDay(silverGames, groups[1]!.length, starts);
  assert.ok(gold.some((row) => row.time === "08:00"));
  assert.ok(silver.some((row) => row.time === "08:00"));
  assert.ok(gold.every((row) => groups[0]!.includes(row.fieldIndex) || row.fieldIndex < 2));
  assert.ok(maxSit(goldGames, gold, starts) <= 1);
  assert.ok(maxSit(silverGames, silver, starts) <= 1);
});
