import assert from "node:assert/strict";
import test from "node:test";
import { defaultDayPlan } from "./weekends.ts";
import {
  ALL_SITES,
  buildGames,
  buildPools,
  collapseToOneField,
  gamesAtSite,
  isFutureSiteGame,
  layoutPoolTree,
  layoutSiteBracket,
  liveBracketRound,
  nextKnockoutGame,
  nextPowerOfTwo,
  numberPlayableGames,
  orderPoolGamesStayOn,
  packSchedule,
  poolPairings,
  poolSizes,
  roundsForSize,
  seedLabel,
  seedPlacement,
  shortParkName,
  sitesOnDay,
  sundayTeamCount,
  swapSeeds,
  syncSeeds,
  treeRoundLabel,
} from "./bracket.ts";

test("bracket size grows with the field: 3, 11, and 40", () => {
  assert.equal(nextPowerOfTwo(3), 4);
  assert.equal(nextPowerOfTwo(11), 16);
  assert.equal(nextPowerOfTwo(40), 64);
  assert.deepEqual(seedPlacement(4), [1, 4, 2, 3]);
  assert.deepEqual(seedPlacement(16).slice(0, 4), [1, 16, 8, 9]);
});

test("3 teams is one play-in and a final", () => {
  const games = buildGames(syncSeeds([], [1, 2, 3]));
  assert.equal(games.filter((g) => g.round === "sf").length, 2);
  assert.equal(games.filter((g) => g.round === "sf" && !g.isBye).length, 1);
  assert.equal(games.filter((g) => g.round === "f" && !g.isBye).length, 1);
  assert.equal(treeRoundLabel("sf", "sf", true), "Round 1 (Play-Ins)");
});

test("11 teams make 3 play-in games and a championship", () => {
  const slots = syncSeeds([], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.equal(slots.length, 16);
  const games = buildGames(slots);
  const r16 = games.filter((g) => g.round === "r16");
  assert.equal(r16.length, 8);
  assert.equal(r16.filter((g) => !g.isBye).length, 3);
  const numbers = numberPlayableGames(games);
  assert.equal(numbers.size, 10);
  assert.ok(games.some((g) => g.round === "f" && !g.isBye));
});

test("40 teams open a 64-slot tree", () => {
  const ids = Array.from({ length: 40 }, (_, i) => i + 1);
  const slots = syncSeeds([], ids);
  assert.equal(slots.length, 64);
  const games = buildGames(slots);
  assert.equal(games.filter((g) => g.round === "r64").length, 32);
  assert.equal(games.filter((g) => g.round === "r64" && !g.isBye).length, 8);
});

test("keeping seeds when a team is added or dropped", () => {
  const first = syncSeeds([], [10, 20, 30]);
  const grown = syncSeeds(first, [10, 20, 30, 40]);
  assert.equal(grown.find((row) => row.teamId === 10)?.seed, 1);
  const shrunk = syncSeeds(grown, [20, 30]);
  assert.equal(shrunk.find((row) => row.teamId === 20)?.seed, 2);
});

test("admin swap trades two seeds including a bye", () => {
  const slots = syncSeeds([], [1, 2, 3]);
  const swapped = swapSeeds(slots, 1, 4);
  assert.equal(swapped.find((row) => row.seed === 1)?.teamId, slots.find((row) => row.seed === 4)?.teamId);
  assert.equal(swapped.find((row) => row.seed === 4)?.teamId, slots.find((row) => row.seed === 1)?.teamId);
});

test("two fields start in parallel and only the final shares one", () => {
  const rounds = roundsForSize(16);
  assert.equal(collapseToOneField("r16", rounds), false);
  assert.equal(collapseToOneField("sf", rounds), false);
  assert.equal(collapseToOneField("f", rounds), true);

  const slots = syncSeeds([], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const games = buildGames(slots);
  const packed = packSchedule({
    games,
    locations: [{ id: 101 }, { id: 202 }],
    startDate: "2026-09-26",
    endDate: "2026-09-27",
    confirmed: [],
  });
  const r16 = packed.filter((row) => row.round === "r16" && row.startTime);
  assert.equal(r16.length, 3);
  assert.ok(r16.some((row) => row.locationId === 101));
  assert.ok(r16.some((row) => row.locationId === 202));
  const semis = packed.filter((row) => row.round === "sf" && row.startTime);
  assert.equal(new Set(semis.map((row) => row.locationId)).size, 2);
  const final = packed.find((row) => row.round === "f");
  assert.equal(final?.locationId, 101);
});

test("pool sizes prefer 4s and keep 2 games each", () => {
  assert.deepEqual(poolSizes(3), [3]);
  assert.deepEqual(poolSizes(4), [4]);
  assert.deepEqual(poolSizes(5), [5]);
  assert.deepEqual(poolSizes(11), [4, 4, 3]);
  assert.deepEqual(poolSizes(40), Array.from({ length: 10 }, () => 4));
  for (const size of [3, 4, 5]) {
    const counts = Array.from({ length: size }, () => 0);
    for (const [a, b] of poolPairings(size)) {
      counts[a] += 1;
      counts[b] += 1;
    }
    assert.deepEqual(counts, Array.from({ length: size }, () => 2));
  }
});

test("11 and 40 teams each play two pool games", () => {
  const eleven = buildPools(syncSeeds([], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]));
  assert.equal(eleven.length, 3);
  const elevenGames = eleven.flatMap((pool) => pool.games);
  assert.equal(elevenGames.length, 11);
  const fortyIds = Array.from({ length: 40 }, (_, i) => i + 1);
  const forty = buildPools(syncSeeds([], fortyIds));
  assert.equal(forty.length, 10);
  assert.equal(forty.flatMap((pool) => pool.games).length, 40);
  const played = new Map<number, number>();
  for (const game of forty.flatMap((pool) => pool.games)) {
    played.set(game.homeTeamId, (played.get(game.homeTeamId) ?? 0) + 1);
    played.set(game.awayTeamId, (played.get(game.awayTeamId) ?? 0) + 1);
  }
  assert.equal(played.size, 40);
  for (const n of played.values()) assert.equal(n, 2);
});

test("stay-on pool order keeps a club on the field", () => {
  const games = [
    { homeTeamId: 1, awayTeamId: 4 },
    { homeTeamId: 2, awayTeamId: 3 },
    { homeTeamId: 1, awayTeamId: 3 },
    { homeTeamId: 2, awayTeamId: 4 },
  ];
  const ordered = orderPoolGamesStayOn(games);
  assert.equal(ordered[0]?.homeTeamId, 1);
  assert.ok(
    ordered[1]?.homeTeamId === 1 ||
      ordered[1]?.awayTeamId === 1 ||
      ordered[1]?.homeTeamId === 4 ||
      ordered[1]?.awayTeamId === 4,
  );
});

test("a pool stays at one park with games packed back to back", () => {
  const slots = syncSeeds([], [1, 2, 3, 4, 5, 6, 7, 8]);
  const games = buildGames(slots);
  const pools = buildPools(slots);
  const packed = packSchedule({
    games,
    poolGames: pools.flatMap((pool) => pool.games),
    locations: [{ id: 10 }, { id: 20 }],
    startDate: "2026-09-25",
    endDate: "2026-09-27",
    confirmed: [],
    dayPlan: defaultDayPlan("2026-09-25", "2026-09-27"),
  });
  const poolTimes = packed.filter((row) => row.round === "pool");
  assert.equal(poolTimes.length, 8);
  const bySlot = new Map(poolTimes.map((row) => [row.slot, row]));
  for (const pool of pools) {
    const places = pool.games.map((game) => bySlot.get(game.slot));
    const parks = new Set(places.map((row) => row?.locationId));
    assert.equal(parks.size, 1);
    const dates = new Set(places.map((row) => row?.startDate));
    assert.equal(dates.size, 1);
    const times = places.map((row) => row?.startTime ?? "").sort();
    assert.equal(times.length, 4);
    assert.equal(times[0], "08:00");
    assert.equal(times[3], "14:00");
  }
  const byTeam = new Map<number, string[]>();
  for (const pool of pools) {
    for (const game of pool.games) {
      const place = bySlot.get(game.slot);
      const stamp = `${place?.startDate}|${place?.startTime}`;
      for (const id of [game.homeTeamId, game.awayTeamId]) {
        const list = byTeam.get(id) ?? [];
        list.push(stamp);
        byTeam.set(id, list);
      }
    }
  }
  for (const stamps of byTeam.values()) {
    stamps.sort();
    assert.equal(stamps.length, 2);
    const [a, b] = stamps;
    const t0 = a?.split("|")[1] ?? "";
    const t1 = b?.split("|")[1] ?? "";
    const gap =
      (Number.parseInt(t1.slice(0, 2), 10) - Number.parseInt(t0.slice(0, 2), 10)) * 60 +
      (Number.parseInt(t1.slice(3), 10) - Number.parseInt(t0.slice(3), 10));
    assert.ok(gap <= 360, `family sat ${gap} minutes`);
  }
});

test("pool play sits on Saturday and the bracket starts Sunday", () => {
  const slots = syncSeeds([], [1, 2, 3, 4, 5, 6, 7, 8]);
  const games = buildGames(slots);
  const pools = buildPools(slots);
  const packed = packSchedule({
    games,
    poolGames: pools.flatMap((pool) => pool.games),
    locations: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
    startDate: "2026-09-26",
    endDate: "2026-09-27",
    confirmed: [],
  });
  const poolTimes = packed.filter((row) => row.round === "pool");
  assert.equal(poolTimes.length, 8);
  assert.ok(poolTimes.every((row) => row.startDate === "2026-09-26"));
  const firstBracket = packed.find((row) => row.round === "qf" && row.startTime);
  assert.equal(firstBracket?.startDate, "2026-09-27");
  assert.equal(firstBracket?.startTime, "08:00");
});

test("40-team weekend: pools Saturday, title game Sunday night, no field collisions", () => {
  const ids = Array.from({ length: 40 }, (_, i) => i + 1);
  const slots = syncSeeds([], ids);
  const games = buildGames(slots);
  const pools = buildPools(slots);
  const locations = Array.from({ length: 8 }, (_, i) => ({ id: i + 1 }));
  const packed = packSchedule({
    games,
    poolGames: pools.flatMap((pool) => pool.games),
    locations,
    startDate: "2026-09-26",
    endDate: "2026-09-27",
    confirmed: [],
  });
  const poolTimes = packed.filter((row) => row.round === "pool");
  assert.ok(poolTimes.every((row) => row.startDate === "2026-09-26"));
  const playable = packed.filter((row) => row.startTime && row.locationId != null);
  const keys = playable.map((row) => `${row.startDate}|${row.startTime}|${row.locationId}`);
  assert.equal(keys.length, new Set(keys).size);
  const final = packed.find((row) => row.round === "f");
  assert.equal(final?.startDate, "2026-09-27");
  assert.notEqual(final?.startTime, "08:00");
});

test("standard seed tree is 1st vs last", () => {
  assert.deepEqual(seedPlacement(8), [1, 8, 4, 5, 2, 7, 3, 6]);
  assert.equal(seedLabel(1), "1st");
  assert.equal(seedLabel(2), "2nd");
  assert.equal(seedLabel(3), "3rd");
  assert.equal(seedLabel(32), "32nd");
});

test("Sunday field size follows who advances from pools", () => {
  assert.equal(sundayTeamCount(40, true, "all-reseed"), 40);
  assert.equal(sundayTeamCount(40, true, "winners-only"), 10);
  assert.equal(sundayTeamCount(40, true, "top-per-pool", 2), 20);
  assert.equal(sundayTeamCount(11, true, "winners-only"), 3);
});

test("3-day event: pools day 1, bracket starts the mixed middle day — not the last day", () => {
  const slots = syncSeeds([], [1, 2, 3, 4, 5, 6, 7, 8]);
  const games = buildGames(slots);
  const pools = buildPools(slots);
  const packed = packSchedule({
    games,
    poolGames: pools.flatMap((pool) => pool.games),
    locations: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
    startDate: "2026-09-25",
    endDate: "2026-09-27",
    confirmed: [],
    dayPlan: defaultDayPlan("2026-09-25", "2026-09-27"),
  });
  const poolTimes = packed.filter((row) => row.round === "pool");
  assert.ok(poolTimes.length > 0);
  assert.ok(poolTimes.every((row) => row.startDate === "2026-09-25"));
  const firstBracket = packed.find((row) => row.round === "qf" && row.startTime);
  assert.equal(firstBracket?.startDate, "2026-09-26");
  assert.equal(firstBracket?.startTime, "08:00");
});

test("mixed day can hold leftover pool games and then the bracket", () => {
  const slots = syncSeeds([], [1, 2, 3, 4, 5, 6, 7, 8]);
  const games = buildGames(slots);
  const pools = buildPools(slots);
  const packed = packSchedule({
    games,
    poolGames: pools.flatMap((pool) => pool.games),
    locations: [{ id: 1 }],
    startDate: "2026-09-25",
    endDate: "2026-09-27",
    confirmed: [],
    dayPlan: defaultDayPlan("2026-09-25", "2026-09-27"),
  });
  const poolDates = new Set(packed.filter((row) => row.round === "pool").map((row) => row.startDate));
  assert.ok(poolDates.has("2026-09-25"));
  assert.ok(poolDates.has("2026-09-26"));
  const saturday = packed.filter((row) => row.startDate === "2026-09-26" && row.startTime);
  assert.ok(saturday.some((row) => row.round === "pool"));
  assert.ok(saturday.some((row) => row.round !== "pool"));
});

test("40 teams on 6 parks fill Friday and start Saturday knockout at 8am — not glued to Friday parks", () => {
  const ids = Array.from({ length: 40 }, (_, i) => i + 1);
  const slots = syncSeeds([], ids);
  const games = buildGames(slots);
  const pools = buildPools(slots);
  const locations = Array.from({ length: 6 }, (_, i) => ({ id: i + 1 }));
  const packed = packSchedule({
    games,
    poolGames: pools.flatMap((pool) => pool.games),
    locations,
    startDate: "2026-09-25",
    endDate: "2026-09-27",
    confirmed: [],
    dayPlan: defaultDayPlan("2026-09-25", "2026-09-27"),
  });
  const friday = packed.filter((row) => row.startDate === "2026-09-25" && row.startTime);
  assert.ok(friday.some((row) => row.startTime === "16:00"));
  assert.ok(friday.some((row) => row.startTime === "18:00"));
  const saturday = packed.filter((row) => row.startDate === "2026-09-26" && row.startTime);
  const satEight = saturday.filter((row) => row.startTime === "08:00");
  assert.ok(satEight.length >= 6, `expected Saturday 8am to fill fields, got ${satEight.length}`);
  assert.ok(satEight.some((row) => row.round !== "pool"));
  const byPool = new Map<number, typeof packed>();
  for (const pool of pools) {
    const places = packed.filter((row) => pool.games.some((game) => game.slot === row.slot && row.round === "pool"));
    byPool.set(pool.poolIndex, places);
    const byDate = new Map<string, Set<number>>();
    for (const place of places) {
      if (!place.startDate || place.locationId == null) continue;
      const set = byDate.get(place.startDate) ?? new Set();
      set.add(place.locationId);
      byDate.set(place.startDate, set);
    }
    for (const parks of byDate.values()) assert.equal(parks.size, 1);
  }
  const movedOvernight = [...byPool.values()].some((places) => {
    const dates = [...new Set(places.map((row) => row.startDate))];
    if (dates.length < 2) return false;
    const parks = new Set(places.map((row) => row.locationId));
    return parks.size > 1;
  });
  assert.ok(movedOvernight, "leftover Saturday pool should be free to use a different park");
  const playable = packed.filter((row) => row.startTime && row.locationId != null);
  const keys = playable.map((row) => `${row.startDate}|${row.startTime}|${row.locationId}`);
  assert.equal(keys.length, new Set(keys).size);
});

test("site filter keeps one park’s games on one day and skips byes", () => {
  const games = [
    { startDate: "2026-09-25", locationId: 1, isBye: false, round: "pool" },
    { startDate: "2026-09-25", locationId: 2, isBye: false, round: "pool" },
    { startDate: "2026-09-26", locationId: 1, isBye: false, round: "qf" },
    { startDate: "2026-09-26", locationId: 1, isBye: true, round: "sf" },
  ];
  assert.equal(gamesAtSite(games, { date: "2026-09-25", locationId: 1 }).length, 1);
  assert.equal(gamesAtSite(games, { date: "2026-09-26", locationId: 1 }).length, 1);
  assert.equal(gamesAtSite(games, { date: "2026-09-25", locationId: ALL_SITES }).length, 2);
  assert.equal(gamesAtSite(games, { date: "2026-09-25", locationId: 1, onward: true }).length, 2);
  assert.deepEqual(
    sitesOnDay([{ id: 1 }, { id: 2 }, { id: 3 }], games, "2026-09-25").map((row) => row.id),
    [1, 2],
  );
  assert.equal(shortParkName("Athens Regional Park"), "Athens");
  assert.equal(shortParkName("Tennessee Wesleyan Diamond"), "Tennessee Wesleyan");
  assert.equal(shortParkName("Calhoun Community Park"), "Calhoun");
});

test("later rounds at a park are future until that round is live", () => {
  const games = [
    { round: "pool", startDate: "2026-09-25" },
    { round: "r64", startDate: "2026-09-26" },
    { round: "r32", startDate: "2026-09-26" },
    { round: "f", startDate: "2026-09-27" },
  ];
  assert.equal(liveBracketRound(games, "2026-09-25"), null);
  assert.equal(liveBracketRound(games, "2026-09-26"), "r64");
  assert.equal(isFutureSiteGame(games[0]!, { date: "2026-09-25", liveRound: null }), false);
  assert.equal(isFutureSiteGame(games[1]!, { date: "2026-09-25", liveRound: null }), true);
  assert.equal(isFutureSiteGame(games[1]!, { date: "2026-09-26", liveRound: "r64" }), false);
  assert.equal(isFutureSiteGame(games[2]!, { date: "2026-09-26", liveRound: "r64" }), true);
  assert.equal(isFutureSiteGame(games[3]!, { date: "2026-09-26", liveRound: "r64" }), true);
});

test("park sheet lays two games into one like a real bracket cone", () => {
  const leaf = (slot: number, locationId: number, isBye = false) => ({
    round: "r64",
    slot,
    locationId,
    isBye,
    homeFromRound: null,
    homeFromSlot: null,
    awayFromRound: null,
    awayFromSlot: null,
  });
  const a = leaf(0, 1);
  const b = leaf(1, 1);
  const parent = {
    round: "r32",
    slot: 0,
    locationId: 1,
    isBye: false,
    homeFromRound: "r64",
    homeFromSlot: 0,
    awayFromRound: "r64",
    awayFromSlot: 1,
  };
  const layout = layoutSiteBracket([a, b, parent]);
  assert.equal(layout.rowCount, 2);
  assert.deepEqual(
    layout.rounds.map((row) => row.round),
    ["r64", "r32"],
  );
  assert.equal(layout.rounds[0]?.slots.length, 2);
  const next = layout.rounds[1]?.slots[0];
  assert.equal(next?.rowStart, 1);
  assert.equal(next?.rowSpan, 2);
  assert.equal(next?.arms, 2);
});

test("park tree pulls a bye or another park as the missing arm so two lines join into one", () => {
  const play = {
    round: "r64",
    slot: 1,
    locationId: 1,
    isBye: false,
    homeFromRound: null,
    homeFromSlot: null,
    awayFromRound: null,
    awayFromSlot: null,
  };
  const bye = {
    round: "r64",
    slot: 0,
    locationId: 1,
    isBye: true,
    homeFromRound: null,
    homeFromSlot: null,
    awayFromRound: null,
    awayFromSlot: null,
  };
  const other = {
    round: "r64",
    slot: 2,
    locationId: 2,
    isBye: false,
    homeFromRound: null,
    homeFromSlot: null,
    awayFromRound: null,
    awayFromSlot: null,
  };
  const pool = {
    round: "pool",
    slot: 0,
    locationId: 1,
    isBye: false,
    homeFromRound: null,
    homeFromSlot: null,
    awayFromRound: null,
    awayFromSlot: null,
  };
  const r32a = {
    round: "r32",
    slot: 0,
    locationId: 1,
    isBye: false,
    homeFromRound: "r64",
    homeFromSlot: 0,
    awayFromRound: "r64",
    awayFromSlot: 1,
  };
  const r32b = {
    round: "r32",
    slot: 1,
    locationId: 1,
    isBye: false,
    homeFromRound: "r64",
    homeFromSlot: 2,
    awayFromRound: "r64",
    awayFromSlot: 3,
  };
  const missing = {
    round: "r64",
    slot: 3,
    locationId: 2,
    isBye: true,
    homeFromRound: null,
    homeFromSlot: null,
    awayFromRound: null,
    awayFromSlot: null,
  };
  const layout = layoutSiteBracket([pool, play, r32a, r32b], [pool, play, bye, other, missing, r32a, r32b]);
  const first = layout.rounds[0];
  assert.equal(first?.round, "r64");
  assert.ok(first?.slots.some((slot) => slot.game === play && !slot.ghost));
  assert.ok(first?.slots.some((slot) => slot.game === bye && slot.ghost));
  assert.ok(first?.slots.some((slot) => slot.game === other && slot.ghost));
  assert.equal(
    layout.rounds.flatMap((row) => row.slots).some((slot) => slot.game?.round === "pool"),
    false,
  );
  const late = layout.rounds.find((row) => row.round === "r32")?.slots ?? [];
  assert.equal(late.length, 2);
  assert.ok(late.every((slot) => slot.arms === 2 && slot.rowSpan === 2));
});

test("later rounds stay a cone — the other arm is a ghost line, not a new first-round tree", () => {
  const r16a = {
    round: "r16",
    slot: 0,
    locationId: 1,
    isBye: false,
    homeFromRound: "r32",
    homeFromSlot: 0,
    awayFromRound: "r32",
    awayFromSlot: 1,
  };
  const r32home = {
    round: "r32",
    slot: 0,
    locationId: 1,
    isBye: false,
    homeFromRound: null,
    homeFromSlot: null,
    awayFromRound: null,
    awayFromSlot: null,
  };
  const r32away = {
    round: "r32",
    slot: 1,
    locationId: 2,
    isBye: false,
    homeFromRound: null,
    homeFromSlot: null,
    awayFromRound: null,
    awayFromSlot: null,
  };
  const qf = {
    round: "qf",
    slot: 0,
    locationId: 1,
    isBye: false,
    homeFromRound: "r16",
    homeFromSlot: 0,
    awayFromRound: "r16",
    awayFromSlot: 1,
  };
  const otherR16 = {
    round: "r16",
    slot: 1,
    locationId: 2,
    isBye: false,
    homeFromRound: "r32",
    homeFromSlot: 2,
    awayFromRound: "r32",
    awayFromSlot: 3,
  };
  const layout = layoutSiteBracket([r16a, qf], [r32home, r32away, r16a, otherR16, qf]);
  assert.deepEqual(
    layout.rounds.map((row) => row.round),
    ["r32", "r16", "qf"],
  );
  assert.equal(layout.rounds[0]?.slots.length, 2);
  assert.ok(layout.rounds[0]?.slots.every((slot) => slot.ghost));
  assert.equal(layout.rounds[1]?.slots.length, 2);
  assert.equal(layout.rounds[1]?.slots.find((slot) => slot.game === r16a)?.arms, 2);
  assert.equal(layout.rounds[1]?.slots.find((slot) => slot.game === otherR16)?.ghost, true);
  assert.equal(layout.rounds[2]?.slots[0]?.arms, 2);
  assert.ok((layout.rounds[2]?.slots[0]?.rowSpan ?? 0) >= 2);
  assert.equal(nextKnockoutGame(r16a, [r32home, r32away, r16a, otherR16, qf]), qf);
  assert.equal(nextKnockoutGame(qf, [r32home, r32away, r16a, otherR16, qf]), null);
});

test("two last-round games at a park stack as two trees ending that day", () => {
  const leaf = (slot: number) => ({
    round: "r32",
    slot,
    locationId: 1,
    isBye: false,
    homeFromRound: null,
    homeFromSlot: null,
    awayFromRound: null,
    awayFromSlot: null,
  });
  const layout = layoutSiteBracket([leaf(0), leaf(1)]);
  assert.equal(layout.rounds.length, 1);
  assert.equal(layout.rounds[0]?.round, "r32");
  assert.equal(layout.rounds[0]?.slots.length, 2);
  assert.equal(layout.rowCount, 2);
  assert.ok(layout.rounds[0]?.slots.every((slot) => slot.arms === 0 && slot.rowSpan === 1));
});

function poolGame(slot: number, time: string, date = "2026-09-25") {
  return {
    round: "pool" as const,
    slot,
    isBye: false,
    startDate: date,
    startTime: time,
  };
}

test("three pool games at a park are a 2-into-1 tree into the last game", () => {
  const layout = layoutPoolTree([poolGame(0, "08:00"), poolGame(1, "10:00"), poolGame(2, "12:00")]);
  assert.deepEqual(
    layout.rounds.map((row) => row.round),
    ["p0", "p1"],
  );
  assert.equal(layout.rounds[0]?.slots.length, 2);
  assert.equal(layout.rounds[1]?.slots.length, 1);
  assert.equal(layout.rounds[0]?.slots.filter((slot) => slot.game == null).length, 0);
  assert.equal(layout.rounds[1]?.slots[0]?.game?.slot, 2);
  assert.equal(layout.rounds[1]?.slots[0]?.arms, 2);
  assert.equal(layout.rounds[1]?.slots[0]?.rowSpan, 2);
  assert.equal(layout.rounds[1]?.label, "Last game");
  assert.equal(layout.rowCount, 2);
});

test("six pool games cone to the last game of the day with a first-round bye", () => {
  const games = [
    poolGame(0, "08:00"),
    poolGame(1, "10:00"),
    poolGame(2, "12:00"),
    poolGame(3, "14:00"),
    poolGame(4, "16:00"),
    poolGame(5, "18:00"),
  ];
  const layout = layoutPoolTree(games);
  assert.deepEqual(
    layout.rounds.map((row) => [row.round, row.slots.length, row.label]),
    [
      ["p0", 4, "Pool play"],
      ["p1", 2, "Pool play"],
      ["p2", 1, "Last game"],
    ],
  );
  assert.equal(layout.rounds[0]?.slots.filter((slot) => slot.game == null).length, 1);
  assert.equal(layout.rounds[2]?.slots[0]?.game?.slot, 5);
  assert.equal(layout.rounds[2]?.slots[0]?.arms, 2);
  assert.ok((layout.rounds[2]?.slots[0]?.rowSpan ?? 0) >= 4);
  const mid = layout.rounds[1]?.slots ?? [];
  assert.ok(mid.every((slot) => slot.arms === 2));
  assert.equal(layout.rounds[0]?.slots[0]?.game?.slot, 0);
});

test("two last-wave pool games at a park are two stacked 2-into-1 trees", () => {
  const games = [
    poolGame(0, "08:00"),
    poolGame(1, "08:00"),
    poolGame(2, "10:00"),
    poolGame(3, "10:00"),
    poolGame(4, "12:00"),
    poolGame(5, "12:00"),
  ];
  const layout = layoutPoolTree(games);
  assert.deepEqual(
    layout.rounds.map((row) => row.slots.length),
    [4, 2],
  );
  assert.equal(layout.rounds[1]?.label, "Last game");
  assert.equal(layout.rounds[1]?.slots.filter((slot) => slot.game == null).length, 0);
  assert.ok(layout.rounds[1]?.slots.every((slot) => slot.arms === 2 && slot.rowSpan === 2));
  assert.equal(layout.rowCount, 4);
});

