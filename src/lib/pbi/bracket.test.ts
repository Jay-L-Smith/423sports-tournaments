import assert from "node:assert/strict";
import test from "node:test";
import { defaultDayPlan } from "./weekends.ts";
import { DEFAULT_BRACKET_RULES, hasPlayableBracket, parseBracketRules } from "./rules.ts";
import {
  ALL_SITES,
  applyPoolSideSwap,
  applyPoolSlotSwap,
  bracketField,
  buildGames,
  buildPools,
  collapseToOneField,
  collectScheduleWarnings,
  fieldsNeeded,
  forfeitRemaining,
  gamesAtSite,
  guaranteedPlaces,
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
  poolStandings,
  restGaps,
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

test("unfilled real seeds stay on the bracket as games, not byes", () => {
  const slots = Array.from({ length: 8 }, (_, i) => ({
    seed: i + 1,
    teamId: null as number | null,
    open: i < 7,
  }));
  const games = buildGames(slots);
  const first = games.filter((game) => game.round === "qf");
  assert.equal(first.filter((game) => game.isBye).length, 1);
  assert.equal(first.filter((game) => !game.isBye).length, 3);
  assert.ok(games.some((game) => game.round === "f" && !game.isBye));
});

test("pool game numbers follow the clock, not the pairing slot", () => {
  const numbers = numberPlayableGames([
    { round: "pool", slot: 0, isBye: false, startDate: "2026-09-26", startTime: "08:00", locationId: 1 },
    { round: "pool", slot: 2, isBye: false, startDate: "2026-09-26", startTime: "10:00", locationId: 1 },
    { round: "pool", slot: 4, isBye: false, startDate: "2026-09-26", startTime: "12:00", locationId: 1 },
    { round: "pool", slot: 1, isBye: false, startDate: "2026-09-26", startTime: "14:00", locationId: 1 },
    { round: "pool", slot: 6, isBye: false, startDate: "2026-09-26", startTime: "16:00", locationId: 1 },
  ]);
  assert.equal(numbers.get("pool:0"), 1);
  assert.equal(numbers.get("pool:2"), 2);
  assert.equal(numbers.get("pool:4"), 3);
  assert.equal(numbers.get("pool:1"), 4);
  assert.equal(numbers.get("pool:6"), 5);
});

test("3 teams is one first game and a final", () => {
  const games = buildGames(syncSeeds([], [1, 2, 3]));
  assert.equal(games.filter((g) => g.round === "sf" && !g.isBye).length, 1);
  assert.equal(games.filter((g) => g.round === "f" && !g.isBye).length, 1);
  assert.equal(treeRoundLabel("sf", "sf", false), "Round 1");
  assert.equal(treeRoundLabel("r16", "r16", true), "Play-ins");
});

test("11 teams: top 5 bye and the bottom 6 play in", () => {
  const slots = syncSeeds([], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.equal(slots.length, 16);
  const games = buildGames(slots);
  const first = games.filter((g) => g.round === "r16");
  assert.equal(first.filter((g) => !g.isBye).length, 3);
  assert.equal(first.filter((g) => g.isBye).length, 5);
  const numbers = numberPlayableGames(games);
  assert.equal(numbers.size, 10);
  assert.ok(games.some((g) => g.round === "f" && !g.isBye));
});

test("20 teams is a 4-game play-in, not ten opening games", () => {
  const slots = bracketField(20, (seed) => seed);
  const games = buildGames(slots);
  const first = games.filter((game) => game.homeFromRound == null && game.awayFromRound == null);
  assert.equal(first.filter((game) => game.isBye).length, 12);
  assert.equal(first.filter((game) => !game.isBye).length, 4);
  const stale = bracketField(20, (seed) => (seed === 21 ? 99 : seed));
  assert.equal(stale.length, 20);
  assert.ok(stale.every((slot) => slot.teamId !== 99));
});

test("21 teams is five play-in games and eleven byes", () => {
  const games = buildGames(bracketField(21, (seed) => seed));
  const first = games.filter((game) => game.homeFromRound == null && game.awayFromRound == null);
  assert.equal(first.filter((game) => game.isBye).length, 11);
  assert.equal(first.filter((game) => !game.isBye).length, 5);
});

test("12 teams: bottom 8 play in and the top 4 bye into an 8-team bracket", () => {
  const ids = Array.from({ length: 12 }, (_, i) => i + 1);
  const games = buildGames(syncSeeds([], ids));
  const first = games.filter((g) => g.homeFromRound == null && g.awayFromRound == null);
  const playing = first
    .filter((g) => !g.isBye)
    .flatMap((g) => [g.homeSeed, g.awaySeed])
    .sort((a, b) => (a ?? 0) - (b ?? 0));
  assert.deepEqual(playing, [5, 6, 7, 8, 9, 10, 11, 12]);
  const byeSeeds = first
    .filter((g) => g.isBye)
    .map((g) => g.homeTeamId ?? g.awayTeamId)
    .sort((a, b) => (a ?? 0) - (b ?? 0));
  assert.deepEqual(byeSeeds, [1, 2, 3, 4]);
  assert.equal(games.filter((g) => !g.isBye).length, 11);
  const second = games.filter((g) => g.round === "qf" && !g.isBye);
  assert.equal(second.length, 4);
});

test("40 teams open with an 8-game play-in", () => {
  const ids = Array.from({ length: 40 }, (_, i) => i + 1);
  const slots = syncSeeds([], ids);
  assert.equal(slots.length, 64);
  const games = buildGames(slots);
  const first = games.filter((g) => g.round === "r64");
  assert.equal(first.filter((g) => !g.isBye).length, 8);
  assert.equal(first.filter((g) => g.isBye).length, 24);
  assert.equal(games.filter((g) => !g.isBye).length, 39);
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

test("opening rounds use both fields and the final stays on the first park", () => {
  const rounds = roundsForSize(16);
  assert.equal(collapseToOneField("r16", rounds, DEFAULT_BRACKET_RULES.championshipCollapse), false);
  assert.equal(collapseToOneField("sf", rounds, DEFAULT_BRACKET_RULES.championshipCollapse), false);
  assert.equal(collapseToOneField("f", rounds, DEFAULT_BRACKET_RULES.championshipCollapse), true);

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
  assert.equal(new Set(r16.map((row) => row.locationId)).size, 2);
  const final = packed.find((row) => row.round === "f");
  assert.equal(final?.locationId, 101);
  assert.ok(packed.every((row) => !row.startDate || (row.startDate >= "2026-09-26" && row.startDate <= "2026-09-27")));
});

test("pool sizes prefer 6–7 and keep 2 games each", () => {
  assert.deepEqual(poolSizes(3), [3]);
  assert.deepEqual(poolSizes(4), [4]);
  assert.deepEqual(poolSizes(5), [5]);
  assert.deepEqual(poolSizes(6), [6]);
  assert.deepEqual(poolSizes(7), [7]);
  assert.deepEqual(poolSizes(8), [4, 4]);
  assert.deepEqual(poolSizes(11), [6, 5]);
  assert.deepEqual(poolSizes(40), [7, 7, 7, 7, 6, 6]);
  assert.equal(fieldsNeeded(40), 6);
  assert.equal(fieldsNeeded(11), 2);
  for (const size of [3, 4, 5, 6, 7]) {
    const counts = Array.from({ length: size }, () => 0);
    for (const [a, b] of poolPairings(size)) {
      counts[a] += 1;
      counts[b] += 1;
    }
    assert.deepEqual(counts, Array.from({ length: size }, () => 2));
    for (const gap of restGaps(
      poolPairings(size).map(([a, b]) => ({ homeTeamId: a + 1, awayTeamId: b + 1 })),
    ).values()) {
      assert.ok(gap <= 1, `rest gap ${gap} on size ${size}`);
    }
  }
});

test("11 and 40 teams each play two pool games", () => {
  const eleven = buildPools(syncSeeds([], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]));
  assert.equal(eleven.length, 2);
  const elevenGames = eleven.flatMap((pool) => pool.games);
  assert.equal(elevenGames.length, 11);
  const fortyIds = Array.from({ length: 40 }, (_, i) => i + 1);
  const forty = buildPools(syncSeeds([], fortyIds));
  assert.equal(forty.length, 6);
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
  assert.ok(packed.every((row) => !row.startDate || row.startDate <= "2026-09-27"));
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
  assert.equal(sundayTeamCount(40, true, "top-per-pool", 1), 6);
  assert.equal(sundayTeamCount(40, true, "top-per-pool", 2), 12);
  assert.equal(sundayTeamCount(11, true, "top-per-pool", 1), 2);
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
  for (const pool of pools) {
    const places = packed.filter((row) => pool.games.some((game) => game.slot === row.slot && row.round === "pool"));
    const byDate = new Map<string, Set<number>>();
    for (const place of places) {
      if (!place.startDate || place.locationId == null) continue;
      const set = byDate.get(place.startDate) ?? new Set();
      set.add(place.locationId);
      byDate.set(place.startDate, set);
    }
    for (const parks of byDate.values()) assert.equal(parks.size, 1);
  }
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
  assert.ok(first?.slots.some((slot) => slot.game === bye));
  assert.ok(first?.slots.some((slot) => slot.game === other && slot.ghost));
  assert.equal(
    layout.rounds.flatMap((row) => row.slots).some((slot) => slot.game?.round === "pool"),
    false,
  );
  const late = layout.rounds.find((row) => row.round === "r32")?.slots ?? [];
  assert.equal(late.length, 2);
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

test("40-team gold sheet uses six fields and rest gaps of at most one", () => {
  const ids = Array.from({ length: 40 }, (_, i) => i + 1);
  const slots = syncSeeds([], ids);
  const pools = buildPools(slots);
  assert.deepEqual(
    pools.map((pool) => pool.teamIds.length),
    [7, 7, 7, 7, 6, 6],
  );
  for (const pool of pools) {
    for (const gap of restGaps(pool.games).values()) assert.ok(gap <= 1);
  }
  const packed = packSchedule({
    games: buildGames(slots),
    poolGames: pools.flatMap((pool) => pool.games),
    locations: Array.from({ length: 8 }, (_, i) => ({ id: i + 1 })),
    startDate: "2026-09-25",
    endDate: "2026-09-27",
    confirmed: [],
    teamCount: 40,
  });
  const poolPlaces = packed.filter((row) => row.round === "pool" && row.locationId != null);
  const parks = new Set(poolPlaces.map((row) => row.locationId));
  assert.equal(parks.size, 6);
  assert.ok(!parks.has(7) && !parks.has(8));
  const byPark = new Map<number, typeof poolPlaces>();
  for (const row of poolPlaces) {
    const list = byPark.get(row.locationId!) ?? [];
    list.push(row);
    byPark.set(row.locationId!, list);
  }
  const poolByKey = new Map(pools.flatMap((pool) => pool.games.map((game) => [`${game.round}:${game.slot}`, game])));
  for (const placed of byPark.values()) {
    const ordered = placed
      .slice()
      .sort((a, b) => `${a.startDate}|${a.startTime}`.localeCompare(`${b.startDate}|${b.startTime}`))
      .map((row) => poolByKey.get(`${row.round}:${row.slot}`))
      .filter((game): game is NonNullable<typeof game> => game != null);
    for (const gap of restGaps(ordered).values()) assert.ok(gap <= 1, `packed rest gap ${gap}`);
  }
});

test("a pull-out forfeits the remaining games and a double pull is a no-contest", () => {
  const open = { id: 1, homeTeamId: 4, awayTeamId: 9, homeScore: null, awayScore: null, forfeit: null as null };
  assert.deepEqual(forfeitRemaining([open, { id: 2, isBye: true, homeTeamId: 4, awayTeamId: null, homeScore: null, awayScore: null }], 4), [
    { id: 1, kind: "forfeit", side: "home" },
  ]);
  assert.deepEqual(
    forfeitRemaining([{ id: 3, homeTeamId: 4, awayTeamId: 9, homeScore: 2, awayScore: 1, forfeit: null }], 4),
    [],
  );
  assert.deepEqual(
    forfeitRemaining([{ id: 4, homeTeamId: 4, awayTeamId: 9, homeScore: 0, awayScore: 0, forfeit: "away" }], 4),
    [{ id: 4, kind: "no-contest" }],
  );
});

test("standings follow OM2 and ignore forfeit RS/RD/RA", () => {
  const standings = poolStandings(
    [1, 2, 3],
    [
      { homeTeamId: 1, awayTeamId: 2, homeScore: 8, awayScore: 1 },
      { homeTeamId: 1, awayTeamId: 3, homeScore: 2, awayScore: 1 },
      { homeTeamId: 2, awayTeamId: 3, homeScore: 0, awayScore: 0, forfeit: "home" },
    ],
    parseBracketRules({}).tiebreakers,
  );
  assert.equal(standings[0]?.teamId, 1);
  const three = standings.find((row) => row.teamId === 3);
  assert.equal(three?.wins, 1);
  assert.equal(three?.rs, 1);
  const two = standings.find((row) => row.teamId === 2);
  assert.equal(two?.losses, 2);
  assert.equal(two?.rs, 1);
});

test("live-fill only locks a seed that is 100% guaranteed", () => {
  const games = [
    { homeTeamId: 1, awayTeamId: 2, homeScore: 5, awayScore: 0 },
    { homeTeamId: 1, awayTeamId: 3, homeScore: 4, awayScore: 0 },
    { homeTeamId: 2, awayTeamId: 3, homeScore: null, awayScore: null },
  ];
  const locked = guaranteedPlaces([1, 2, 3], games, parseBracketRules({}).tiebreakers, true);
  assert.equal(locked.get(1), 1);
  assert.equal(locked.has(2), false);
  assert.equal(locked.has(3), false);
});

test("soft-fill default stays off and warnings catch a missing pool game", () => {
  assert.equal(parseBracketRules({}).softFill, true);
  const warnings = collectScheduleWarnings({
    teamIds: [1, 2, 3],
    poolGamesPerTeam: 2,
    poolGames: [
      { id: 10, homeTeamId: 1, awayTeamId: 2, locationId: 1, startDate: "2026-09-25", startTime: "08:00" },
    ],
  });
  assert.ok(warnings.some((row) => row.text.includes("1/2 pool games")));
});

test("regen block still sees a playable knockout game", () => {
  assert.equal(hasPlayableBracket([{ round: "qf", isBye: false }]), true);
  assert.equal(hasPlayableBracket([{ round: "pool", isBye: false }]), false);
});

test("five-team pool packs with rest of at most one", () => {
  const slots = syncSeeds([], [1, 2, 3, 4, 5]);
  const pools = buildPools(slots);
  const chain = orderPoolGamesStayOn(pools[0]!.games);
  for (const gap of restGaps(chain).values()) assert.ok(gap <= 1);
  const packed = packSchedule({
    games: buildGames(slots),
    poolGames: pools.flatMap((pool) => pool.games),
    locations: [{ id: 10 }, { id: 20 }],
    startDate: "2026-09-26",
    endDate: "2026-09-27",
    confirmed: [],
    teamCount: 5,
  });
  const placed = packed
    .filter((row) => row.round === "pool" && row.locationId != null)
    .sort((a, b) => `${a.startDate}|${a.startTime}`.localeCompare(`${b.startDate}|${b.startTime}`));
  const bySlot = new Map(pools[0]!.games.map((game) => [game.slot, game]));
  const ordered = placed
    .map((row) => bySlot.get(row.slot))
    .filter((game): game is NonNullable<typeof game> => game != null);
  for (const gap of restGaps(ordered).values()) assert.ok(gap <= 1, `rest ${gap}`);
  const warnings = collectScheduleWarnings({
    poolGames: ordered.map((game, i) => ({
      id: i + 1,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      locationId: placed[i]?.locationId ?? 10,
      startDate: placed[i]?.startDate ?? "2026-09-26",
      startTime: placed[i]?.startTime ?? "08:00",
    })),
    teamIds: [1, 2, 3, 4, 5],
    poolGamesPerTeam: 2,
    teamNames: { 1: "Athens Aces", 2: "Calhoun Crushers", 3: "Canes", 4: "Prime", 5: "Cardinals" },
    locationNames: { 10: "Tennessee Wesleyan" },
  });
  assert.equal(warnings.filter((row) => row.id.startsWith("gap-")).length, 0);
});

test("gap warning names the team, park, and times", () => {
  const warnings = collectScheduleWarnings({
    teamIds: [2],
    poolGamesPerTeam: 2,
    teamNames: { 2: "Calhoun Crushers" },
    locationNames: { 1: "Tennessee Wesleyan" },
    poolGames: [
      { id: 1, homeTeamId: 1, awayTeamId: 2, locationId: 1, startDate: "2026-09-26", startTime: "08:00" },
      { id: 2, homeTeamId: 1, awayTeamId: 3, locationId: 1, startDate: "2026-09-26", startTime: "10:00" },
      { id: 3, homeTeamId: 3, awayTeamId: 4, locationId: 1, startDate: "2026-09-26", startTime: "12:00" },
      { id: 4, homeTeamId: 4, awayTeamId: 5, locationId: 1, startDate: "2026-09-26", startTime: "14:00" },
      { id: 5, homeTeamId: 2, awayTeamId: 5, locationId: 1, startDate: "2026-09-26", startTime: "16:00" },
    ],
  });
  const gap = warnings.find((row) => row.id === "gap-2");
  assert.ok(gap?.text.includes("Calhoun Crushers"));
  assert.ok(gap?.text.includes("Tennessee Wesleyan"));
  assert.ok(gap?.text.includes("8:00 AM"));
  assert.ok(gap?.text.includes("4:00 PM"));
  assert.deepEqual(gap?.gameIds, [1, 5]);
});

test("swapping two pool slots trades every game, not one side", () => {
  const games = [
    { id: 1, homeTeamId: 1, awayTeamId: 2, homeSeed: 1, awaySeed: 2, poolIndex: 0 },
    { id: 2, homeTeamId: 3, awayTeamId: 4, homeSeed: 3, awaySeed: 4, poolIndex: 0 },
    { id: 3, homeTeamId: 1, awayTeamId: 3, homeSeed: 1, awaySeed: 3, poolIndex: 0 },
    { id: 4, homeTeamId: 2, awayTeamId: 4, homeSeed: 2, awaySeed: 4, poolIndex: 0 },
  ];
  const next = applyPoolSlotSwap(games, 2, 3);
  assert.deepEqual(
    next.map((row) => [row.homeTeamId, row.awayTeamId]),
    [
      [1, 3],
      [2, 4],
      [1, 2],
      [3, 4],
    ],
  );
  assert.equal(next[0]?.awaySeed, 3);
  assert.equal(next[3]?.homeSeed, 3);
});

test("slot swap can move a team onto another pool's field", () => {
  const games = [
    { id: 1, homeTeamId: 1, awayTeamId: 2, homeSeed: 1, awaySeed: 2, poolIndex: 0 },
    { id: 2, homeTeamId: 3, awayTeamId: 4, homeSeed: 1, awaySeed: 2, poolIndex: 1 },
  ];
  const next = applyPoolSlotSwap(games, 2, 4);
  assert.deepEqual(
    next.map((row) => [row.poolIndex, row.homeTeamId, row.awayTeamId]),
    [
      [0, 1, 4],
      [1, 3, 2],
    ],
  );
});

test("admin can swap pool opponents without putting a team on itself", () => {
  const games = [
    {
      id: 1,
      homeTeamId: 1,
      awayTeamId: 2,
      homeSeed: 1,
      awaySeed: 2,
      startDate: "2026-09-26",
      startTime: "08:00",
      poolIndex: 0,
    },
    {
      id: 2,
      homeTeamId: 1,
      awayTeamId: 3,
      homeSeed: 1,
      awaySeed: 3,
      startDate: "2026-09-26",
      startTime: "10:00",
      poolIndex: 0,
    },
    {
      id: 3,
      homeTeamId: 2,
      awayTeamId: 5,
      homeSeed: 2,
      awaySeed: 5,
      startDate: "2026-09-26",
      startTime: "16:00",
      poolIndex: 0,
    },
  ];
  const swapped = applyPoolSideSwap(games, { gameId: 1, side: "away" }, { gameId: 2, side: "away" });
  assert.equal(swapped[0]?.awayTeamId, 3);
  assert.equal(swapped[1]?.awayTeamId, 2);

  const flipped = applyPoolSideSwap(games, { gameId: 1, side: "home" }, { gameId: 1, side: "away" });
  assert.equal(flipped[0]?.homeTeamId, 2);
  assert.equal(flipped[0]?.awayTeamId, 1);

  assert.throws(
    () => applyPoolSideSwap(games, { gameId: 1, side: "home" }, { gameId: 2, side: "away" }),
    /cannot play itself/,
  );
  assert.throws(() => {
    applyPoolSideSwap(
      [
        ...games,
        {
          id: 4,
          homeTeamId: 4,
          awayTeamId: 6,
          homeSeed: 4,
          awaySeed: 6,
          startDate: "2026-09-26",
          startTime: "08:00",
          poolIndex: 1,
        },
      ],
      { gameId: 1, side: "away" },
      { gameId: 4, side: "home" },
    );
  }, /same pool/);
});

test("round 1 does not keep teams on yesterday's park", () => {
  const ids = [1, 2, 3, 4, 5, 6, 7, 8];
  const slots = syncSeeds([], ids);
  const pools = buildPools(slots);
  const games = buildGames(slots);
  const packed = packSchedule({
    games,
    poolGames: pools.flatMap((pool) => pool.games),
    locations: [{ id: 1 }, { id: 2 }],
    startDate: "2026-09-26",
    endDate: "2026-09-27",
    confirmed: [],
    teamCount: 8,
    rules: { ...DEFAULT_BRACKET_RULES, packFillFields: false, championshipCollapse: false },
  });
  const first = games.find((game) => !game.isBye)?.round;
  const places = packed.filter((row) => row.round === first && row.locationId != null);
  assert.equal(new Set(places.map((row) => row.locationId)).size, 2);
});

test("round 1 times follow the bracket from top to bottom", () => {
  const slots = syncSeeds([], [1, 2, 3, 4, 5]);
  const games = buildGames(slots);
  const packed = packSchedule({
    games,
    locations: [{ id: 1 }, { id: 2 }],
    startDate: "2026-09-27",
    endDate: "2026-09-27",
    confirmed: [],
    teamCount: 5,
    rules: { ...DEFAULT_BRACKET_RULES, championshipCollapse: false, packFillFields: true },
  });
  const layout = layoutSiteBracket(games, games);
  const topDown = (layout.rounds[0]?.slots ?? [])
    .filter((slot) => slot.game && !slot.game.isBye)
    .slice()
    .sort((a, b) => a.rowStart - b.rowStart);
  const timeOf = new Map(packed.map((row) => [`${row.round}:${row.slot}`, row.startTime ?? ""]));
  const times = topDown.map((slot) => timeOf.get(`${slot.game!.round}:${slot.game!.slot}`) ?? "");
  const sorted = times.slice().sort();
  assert.deepEqual(times, sorted);
  assert.equal(times[0], "08:00");
});

test("12-team play-in and the round of 8 both stay on Sunday", () => {
  const games = buildGames(bracketField(12, (seed) => seed));
  const packed = packSchedule({
    games,
    locations: [{ id: 1 }, { id: 2 }],
    startDate: "2026-09-26",
    endDate: "2026-09-27",
    confirmed: [],
    dayPlan: defaultDayPlan("2026-09-26", "2026-09-27"),
    teamCount: 12,
  });
  const byKey = new Map(packed.map((row) => [`${row.round}:${row.slot}`, row]));
  const playIn = games.filter((game) => game.round === "r16" && !game.isBye);
  assert.equal(playIn.length, 4);
  assert.ok(playIn.every((game) => byKey.get(`r16:${game.slot}`)?.startDate === "2026-09-27"));
  const quarters = games.filter((game) => game.round === "qf" && !game.isBye);
  assert.equal(quarters.length, 4);
  assert.ok(quarters.every((game) => byKey.get(`qf:${game.slot}`)?.startDate === "2026-09-27"));
  const timed = packed.filter((row) => row.startTime);
  assert.ok(timed.length > 0);
  assert.ok(timed.every((row) => row.startDate === "2026-09-27"));
  assert.ok(packed.every((row) => !row.startDate || row.startDate <= "2026-09-27"));
});

test("a later round is never scheduled before the game that feeds it", () => {
  const slots = syncSeeds([], Array.from({ length: 12 }, (_, i) => i + 1));
  const games = buildGames(slots);
  const packed = packSchedule({
    games,
    locations: [{ id: 1 }, { id: 2 }],
    startDate: "2026-09-27",
    endDate: "2026-09-27",
    confirmed: [],
    teamCount: 12,
    rules: {
      ...DEFAULT_BRACKET_RULES,
      championshipCollapse: false,
      firstPitch: "18:00",
      lastStart: "20:00",
      lastDayLastStart: "20:00",
      slotMinutes: 120,
    },
  });
  const byKey = new Map(packed.map((row) => [`${row.round}:${row.slot}`, row]));
  for (const game of games) {
    if (game.isBye) continue;
    const place = byKey.get(`${game.round}:${game.slot}`);
    if (!place?.startDate || !place.startTime) continue;
    for (const [round, slot] of [
      [game.homeFromRound, game.homeFromSlot],
      [game.awayFromRound, game.awayFromSlot],
    ] as const) {
      if (round == null || slot == null) continue;
      const feeder = byKey.get(`${round}:${slot}`);
      if (!feeder?.startDate || !feeder.startTime) continue;
      const after =
        place.startDate > feeder.startDate ||
        (place.startDate === feeder.startDate && place.startTime > feeder.startTime);
      assert.ok(
        after,
        `${game.round} ${place.startDate} ${place.startTime} is not after ${feeder.startDate} ${feeder.startTime}`,
      );
    }
  }
});



