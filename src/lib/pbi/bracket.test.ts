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
  oneFieldGameDates,
  oneFieldGameSlots,
  placeOneOrTwoFields,
  placeTwoFieldPools,
  needsSecondField,
  orderPoolGamesStayOn,
  packSchedule,
  poolPairings,
  poolSizes,
  poolStandings,
  restGaps,
  restorePoolDraw,
  roundsForSize,
  seedLabel,
  seedPlacement,
  shortParkName,
  sitesOnDay,
  spreadStackedPoolGames,
  poolsNeedReseat,
  slideOpenHole,
  followFieldDelay,
  rescaleStartBlocks,
  shiftClockGames,
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

test("bracket game numbers start over at 1", () => {
  const numbers = numberPlayableGames([
    { round: "pool", slot: 0, isBye: false, startDate: "2027-03-06", startTime: "08:00" },
    { round: "pool", slot: 1, isBye: false, startDate: "2027-03-06", startTime: "10:00" },
    { round: "qf", slot: 0, isBye: false, startDate: "2027-03-07", startTime: "08:00" },
    { round: "qf", slot: 1, isBye: false, startDate: "2027-03-07", startTime: "10:00" },
    { round: "f", slot: 0, isBye: false, startDate: "2027-03-07", startTime: "12:00" },
  ]);
  assert.equal(numbers.get("pool:0"), 1);
  assert.equal(numbers.get("pool:1"), 2);
  assert.equal(numbers.get("qf:0"), 1);
  assert.equal(numbers.get("qf:1"), 2);
  assert.equal(numbers.get("f:0"), 3);
});

test("3 teams is one first game and a final", () => {
  const games = buildGames(syncSeeds([], [1, 2, 3]));
  assert.equal(games.filter((g) => g.round === "sf" && !g.isBye).length, 1);
  assert.equal(games.filter((g) => g.round === "f" && !g.isBye).length, 1);
  assert.equal(treeRoundLabel("sf", "sf", false), "Round 1");
  assert.equal(treeRoundLabel("r16", "r16", true), "Play-ins");
});

test("LOCKED: 3 teams stay 3 pool games and 2 bracket games, seed 1 bye", () => {
  const slots = syncSeeds([], [101, 102, 103]);
  const poolGames = buildPools(slots).flatMap((pool) => pool.games);
  assert.equal(poolGames.length, 3);
  const pairs = poolGames.map((game) => [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-")).sort();
  assert.deepEqual(pairs, ["1-2", "1-3", "2-3"]);
  for (const seed of [1, 2, 3]) {
    assert.equal(poolGames.filter((game) => game.homeSeed === seed || game.awaySeed === seed).length, 2);
  }
  const games = buildGames(slots);
  assert.equal(games.filter((game) => !game.isBye).length, 2);
  const opener = games.find((game) => game.round === "sf" && !game.isBye);
  assert.deepEqual([opener?.homeSeed, opener?.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)), [2, 3]);
  const bye = games.find((game) => game.round === "sf" && game.isBye);
  assert.equal(bye?.homeTeamId ?? bye?.awayTeamId, 101);
  const final = games.find((game) => game.round === "f" && !game.isBye);
  assert.equal(final?.homeTeamId ?? final?.awayTeamId, 101);
});

test("LOCKED: 4 teams stay 4 pool games and a 1v4, 2v3, final on one day", () => {
  const slots = syncSeeds([], [101, 102, 103, 104]);
  const poolGames = buildPools(slots).flatMap((pool) => pool.games);
  assert.equal(poolGames.length, 4);
  const pairs = poolGames.map((game) => [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-")).sort();
  assert.deepEqual(pairs, ["1-2", "1-3", "2-4", "3-4"]);
  for (const seed of [1, 2, 3, 4]) {
    assert.equal(poolGames.filter((game) => game.homeSeed === seed || game.awaySeed === seed).length, 2);
  }
  const games = buildGames(slots);
  assert.equal(games.filter((game) => game.isBye).length, 0);
  assert.equal(games.filter((game) => !game.isBye).length, 3);
  const semis = games.filter((game) => game.round === "sf").map((game) => [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-")).sort();
  assert.deepEqual(semis, ["1-4", "2-3"]);
  const final = games.find((game) => game.round === "f");
  assert.equal(final?.isBye, false);
  assert.equal(final?.homeTeamId, null);
  assert.equal(final?.awayTeamId, null);
  assert.equal(poolGames.length + games.filter((game) => !game.isBye).length, 7);
});

test("LOCKED: 6 teams stay 6 pool games, 4v5 and 3v6, seeds 1 and 2 bye, pool then bracket", () => {
  const slots = syncSeeds([], [101, 102, 103, 104, 105, 106]);
  const poolGames = buildPools(slots).flatMap((pool) => pool.games);
  assert.equal(poolGames.length, 6);
  const pairs = poolGames.map((game) => [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-")).sort();
  assert.deepEqual(pairs, ["1-2", "1-3", "2-4", "3-5", "4-6", "5-6"]);
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    assert.equal(poolGames.filter((game) => game.homeSeed === seed || game.awaySeed === seed).length, 2);
  }
  const games = buildGames(slots);
  const playIns = games.filter((game) => game.round === "qf" && !game.isBye);
  const byes = games.filter((game) => game.round === "qf" && game.isBye);
  assert.deepEqual(
    playIns.map((game) => [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-")).sort(),
    ["3-6", "4-5"],
  );
  assert.deepEqual(byes.map((game) => game.homeTeamId ?? game.awayTeamId).sort(), [101, 102]);
  assert.equal(games.filter((game) => game.round === "sf" && !game.isBye).length, 2);
  assert.equal(games.filter((game) => game.round === "f" && !game.isBye).length, 1);
  assert.equal(games.filter((game) => !game.isBye).length, 5);
  const times = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
  const days = oneFieldGameSlots(6, 5, "2027-03-06", times);
  assert.deepEqual(days.pool.map((game) => game.date), Array(6).fill("2027-03-06"));
  assert.deepEqual(days.pool.map((game) => game.time), ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"]);
  assert.deepEqual(days.bracket.map((game) => game.date), Array(5).fill("2027-03-07"));
  assert.equal(days.bracket[0]?.time, "08:00");
});

test("LOCKED: 5 teams stay 5 pool games, 4 vs 5, byes for 1 2 and 3, pool then bracket", () => {
  const slots = syncSeeds([], [101, 102, 103, 104, 105]);
  const poolGames = buildPools(slots).flatMap((pool) => pool.games);
  assert.equal(poolGames.length, 5);
  const pairs = poolGames.map((game) => [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-")).sort();
  assert.deepEqual(pairs, ["1-2", "1-3", "2-4", "3-5", "4-5"]);
  for (const seed of [1, 2, 3, 4, 5]) {
    assert.equal(poolGames.filter((game) => game.homeSeed === seed || game.awaySeed === seed).length, 2);
  }
  const games = buildGames(slots);
  const playIn = games.filter((game) => game.round === "qf" && !game.isBye);
  const byes = games.filter((game) => game.round === "qf" && game.isBye);
  assert.equal(playIn.length, 1);
  assert.deepEqual([playIn[0]?.homeSeed, playIn[0]?.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)), [4, 5]);
  assert.deepEqual(byes.map((game) => game.homeTeamId ?? game.awayTeamId).sort(), [101, 102, 103]);
  const semis = games.filter((game) => game.round === "sf" && !game.isBye);
  assert.equal(semis.length, 2);
  const twoThree = semis.find((game) => game.homeTeamId != null && game.awayTeamId != null);
  assert.deepEqual([twoThree?.homeTeamId, twoThree?.awayTeamId].sort((a, b) => (a ?? 0) - (b ?? 0)), [102, 103]);
  const wait = semis.find((game) => game !== twoThree);
  assert.equal(wait?.homeTeamId ?? wait?.awayTeamId, 101);
  assert.equal(games.filter((game) => game.round === "f" && !game.isBye).length, 1);
  assert.equal(games.filter((game) => !game.isBye).length, 4);
  const times = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
  const days = oneFieldGameSlots(5, 4, "2027-03-06", times);
  assert.deepEqual(days.pool.map((game) => game.time), ["08:00", "10:00", "12:00", "14:00", "16:00"]);
  assert.ok(days.pool.every((game) => game.date === "2027-03-06"));
  assert.deepEqual(days.bracket.map((game) => game.date), Array(4).fill("2027-03-07"));
  assert.equal(days.bracket[0]?.time, "08:00");
});

test("LOCKED: 7 teams stay 7 pool games, one bye for seed 1, pool then bracket", () => {
  const slots = syncSeeds([], [101, 102, 103, 104, 105, 106, 107]);
  const poolGames = buildPools(slots).flatMap((pool) => pool.games);
  assert.equal(poolGames.length, 7);
  const pairs = poolGames.map((game) => [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-")).sort();
  assert.deepEqual(pairs, ["1-2", "1-3", "2-4", "3-5", "4-6", "5-7", "6-7"]);
  for (const seed of [1, 2, 3, 4, 5, 6, 7]) {
    assert.equal(poolGames.filter((game) => game.homeSeed === seed || game.awaySeed === seed).length, 2);
  }
  const games = buildGames(slots);
  const quarters = games.filter((game) => game.round === "qf" && !game.isBye);
  const byes = games.filter((game) => game.round === "qf" && game.isBye);
  assert.deepEqual(
    quarters.map((game) => [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-")).sort(),
    ["2-7", "3-6", "4-5"],
  );
  assert.deepEqual(byes.map((game) => game.homeTeamId ?? game.awayTeamId), [101]);
  assert.equal(games.filter((game) => game.round === "sf" && !game.isBye).length, 2);
  assert.equal(games.filter((game) => game.round === "f" && !game.isBye).length, 1);
  assert.equal(games.filter((game) => !game.isBye).length, 6);
  const times = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
  const days = oneFieldGameSlots(7, 6, "2027-03-06", times);
  assert.deepEqual(days.pool.map((game) => game.time), times);
  assert.ok(days.pool.every((game) => game.date === "2027-03-06"));
  assert.deepEqual(days.bracket.map((game) => game.date), Array(6).fill("2027-03-07"));
  assert.equal(days.bracket[0]?.time, "08:00");
  assert.equal(days.bracket[5]?.time, "18:00");
});

test("LOCKED: 8 teams stay two 4-team pools, each on one field, then a two-field bracket", () => {
  const times = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
  const slots = syncSeeds([], [101, 102, 103, 104, 105, 106, 107, 108]);
  const pools = buildPools(slots);
  assert.deepEqual(pools.map((pool) => pool.teamIds), [
    [101, 102, 103, 104],
    [105, 106, 107, 108],
  ]);
  const pair = (pool: (typeof pools)[number]) =>
    pool.games.map((game) => [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-"));
  assert.deepEqual(pair(pools[0]!), ["1-2", "1-3", "2-4", "3-4"]);
  assert.deepEqual(pair(pools[1]!), ["5-6", "5-7", "6-8", "7-8"]);
  const pool = pools.flatMap((row) => row.games);
  const bracket = buildGames(slots).filter((game) => !game.isBye);
  assert.equal(buildGames(slots).filter((game) => game.isBye).length, 0);
  const placed = placeOneOrTwoFields(pool, bracket, "2027-03-06", times);
  assert.equal(placed.fields, 2);
  assert.deepEqual(
    placed.pool.map((game) => `${game.field}@${game.time}`),
    ["0@08:00", "0@10:00", "0@12:00", "0@14:00", "1@08:00", "1@10:00", "1@12:00", "1@14:00"],
  );
  assert.ok(placed.pool.every((game) => game.date === "2027-03-06"));
  const teamFields = new Map<number, number>();
  pool.forEach((game, index) => {
    for (const id of [game.homeTeamId, game.awayTeamId]) {
      if (id == null) continue;
      const field = placed.pool[index]!.field;
      const prior = teamFields.get(id);
      assert.ok(prior == null || prior === field);
      teamFields.set(id, field);
    }
  });
  const at = new Map(bracket.map((game, index) => [`${game.round}:${game.slot}`, placed.bracket[index]!]));
  const spot = (round: string, slot: number) => {
    const game = at.get(`${round}:${slot}`)!;
    return `${game.field}@${game.time}@${game.date}`;
  };
  assert.equal(spot("qf", 0), "0@08:00@2027-03-07");
  assert.equal(spot("qf", 1), "0@10:00@2027-03-07");
  assert.equal(spot("qf", 2), "1@08:00@2027-03-07");
  assert.equal(spot("qf", 3), "1@10:00@2027-03-07");
  assert.equal(spot("sf", 0), "0@12:00@2027-03-07");
  assert.equal(spot("sf", 1), "1@12:00@2027-03-07");
  assert.equal(spot("f", 0), "0@14:00@2027-03-07");
  const quarters = bracket.filter((game) => game.round === "qf");
  assert.deepEqual(
    quarters.map((game) => [game.homeSeed, game.awaySeed].join("-")),
    ["1-8", "4-5", "2-7", "3-6"],
  );
});

test("LOCKED: 9 teams stay a 5-team pool and a 4-team pool, then the play-in bracket", () => {
  const times = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
  const slots = syncSeeds([], [101, 102, 103, 104, 105, 106, 107, 108, 109]);
  const pools = buildPools(slots);
  assert.deepEqual(
    pools.map((pool) => pool.teamIds),
    [
      [101, 102, 103, 104, 105],
      [106, 107, 108, 109],
    ],
  );
  const pair = (pool: (typeof pools)[number]) =>
    pool.games.map((game) => [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-"));
  assert.deepEqual(pair(pools[0]!), ["1-2", "1-3", "2-4", "3-5", "4-5"]);
  assert.deepEqual(pair(pools[1]!), ["6-7", "6-8", "7-9", "8-9"]);
  const pool = pools.flatMap((row) => row.games);
  const all = buildGames(slots);
  const bracket = all.filter((game) => !game.isBye);
  const placed = placeOneOrTwoFields(pool, bracket, "2027-03-06", times);
  assert.equal(placed.fields, 2);
  assert.deepEqual(
    placed.pool.map((game) => `${game.field}@${game.time}`),
    ["0@08:00", "0@10:00", "0@12:00", "0@14:00", "0@16:00", "1@08:00", "1@10:00", "1@12:00", "1@14:00"],
  );
  assert.ok(placed.pool.every((game) => game.date === "2027-03-06"));
  const teamFields = new Map<number, number>();
  pool.forEach((game, index) => {
    for (const id of [game.homeTeamId, game.awayTeamId]) {
      if (id == null) continue;
      const field = placed.pool[index]!.field;
      const prior = teamFields.get(id);
      assert.ok(prior == null || prior === field);
      teamFields.set(id, field);
    }
  });
  const byes = all.filter((game) => game.isBye);
  assert.deepEqual(
    byes.map((game) => `${game.round}:${game.slot}:${game.homeSeed ?? game.awaySeed}`).sort(),
    ["r16:0:1", "r16:2:4", "r16:3:5", "r16:4:2", "r16:5:7", "r16:6:3", "r16:7:6"],
  );
  const playIn = all.find((game) => game.round === "r16" && !game.isBye);
  assert.deepEqual([playIn?.homeSeed, playIn?.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)), [8, 9]);
  const at = new Map(bracket.map((game, index) => [`${game.round}:${game.slot}`, placed.bracket[index]!]));
  const spot = (round: string, slot: number) => {
    const game = at.get(`${round}:${slot}`)!;
    return `${game.field}@${game.time}@${game.date}`;
  };
  assert.equal(spot("r16", 1), "0@08:00@2027-03-07");
  assert.equal(spot("qf", 0), "0@10:00@2027-03-07");
  assert.equal(spot("qf", 1), "0@12:00@2027-03-07");
  assert.equal(spot("qf", 2), "1@08:00@2027-03-07");
  assert.equal(spot("qf", 3), "1@10:00@2027-03-07");
  assert.equal(spot("sf", 0), "0@14:00@2027-03-07");
  assert.equal(spot("sf", 1), "1@12:00@2027-03-07");
  assert.equal(spot("f", 0), "0@16:00@2027-03-07");
});

test("LOCKED: 10 teams stay two 5-team pools, then two play-ins", () => {
  const times = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
  const slots = syncSeeds([], Array.from({ length: 10 }, (_, index) => 101 + index));
  const pools = buildPools(slots);
  assert.deepEqual(
    pools.map((pool) => pool.teamIds),
    [
      [101, 102, 103, 104, 105],
      [106, 107, 108, 109, 110],
    ],
  );
  const pair = (pool: (typeof pools)[number]) =>
    pool.games.map((game) => [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-"));
  assert.deepEqual(pair(pools[0]!), ["1-2", "1-3", "2-4", "3-5", "4-5"]);
  assert.deepEqual(pair(pools[1]!), ["6-7", "6-8", "7-9", "8-10", "9-10"]);
  const pool = pools.flatMap((row) => row.games);
  const all = buildGames(slots);
  const bracket = all.filter((game) => !game.isBye);
  const placed = placeOneOrTwoFields(pool, bracket, "2027-03-06", times);
  assert.equal(placed.fields, 2);
  assert.deepEqual(
    placed.pool.map((game) => `${game.field}@${game.time}`),
    ["0@08:00", "0@10:00", "0@12:00", "0@14:00", "0@16:00", "1@08:00", "1@10:00", "1@12:00", "1@14:00", "1@16:00"],
  );
  assert.ok(placed.pool.every((game) => game.date === "2027-03-06"));
  const teamFields = new Map<number, number>();
  pool.forEach((game, index) => {
    for (const id of [game.homeTeamId, game.awayTeamId]) {
      if (id == null) continue;
      const field = placed.pool[index]!.field;
      const prior = teamFields.get(id);
      assert.ok(prior == null || prior === field);
      teamFields.set(id, field);
    }
  });
  assert.deepEqual(
    all.filter((game) => game.isBye).map((game) => `${game.round}:${game.slot}:${game.homeSeed ?? game.awaySeed}`).sort(),
    ["r16:0:1", "r16:2:4", "r16:3:5", "r16:4:2", "r16:6:3", "r16:7:6"],
  );
  const playIns = all
    .filter((game) => game.round === "r16" && !game.isBye)
    .map((game) => [game.slot, [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-")]);
  assert.deepEqual(playIns, [
    [1, "8-9"],
    [5, "7-10"],
  ]);
  const at = new Map(bracket.map((game, index) => [`${game.round}:${game.slot}`, placed.bracket[index]!]));
  const spot = (round: string, slot: number) => {
    const game = at.get(`${round}:${slot}`)!;
    return `${game.field}@${game.time}@${game.date}`;
  };
  assert.equal(spot("r16", 1), "0@08:00@2027-03-07");
  assert.equal(spot("r16", 5), "1@08:00@2027-03-07");
  assert.equal(spot("qf", 0), "0@10:00@2027-03-07");
  assert.equal(spot("qf", 1), "0@12:00@2027-03-07");
  assert.equal(spot("qf", 2), "1@10:00@2027-03-07");
  assert.equal(spot("qf", 3), "1@12:00@2027-03-07");
  assert.equal(spot("sf", 0), "0@14:00@2027-03-07");
  assert.equal(spot("sf", 1), "1@14:00@2027-03-07");
  assert.equal(spot("f", 0), "0@16:00@2027-03-07");
});

test("LOCKED: 11 teams stay a 6-team pool and a 5-team pool, then three play-ins", () => {
  const times = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
  const slots = syncSeeds([], [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111]);
  const pools = buildPools(slots);
  assert.deepEqual(
    pools.map((pool) => pool.teamIds),
    [
      [101, 102, 103, 104, 105, 106],
      [107, 108, 109, 110, 111],
    ],
  );
  const pair = (pool: (typeof pools)[number]) =>
    pool.games.map((game) => [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-"));
  assert.deepEqual(pair(pools[0]!), ["1-2", "1-3", "2-4", "3-5", "4-6", "5-6"]);
  assert.deepEqual(pair(pools[1]!), ["7-8", "7-9", "8-10", "9-11", "10-11"]);
  const pool = pools.flatMap((row) => row.games);
  const all = buildGames(slots);
  const bracket = all.filter((game) => !game.isBye);
  const placed = placeOneOrTwoFields(pool, bracket, "2027-03-06", times);
  assert.equal(placed.fields, 2);
  assert.deepEqual(
    placed.pool.map((game) => `${game.field}@${game.time}`),
    ["0@08:00", "0@10:00", "0@12:00", "0@14:00", "0@16:00", "0@18:00", "1@08:00", "1@10:00", "1@12:00", "1@14:00", "1@16:00"],
  );
  assert.ok(placed.pool.every((game) => game.date === "2027-03-06"));
  const teamFields = new Map<number, number>();
  pool.forEach((game, index) => {
    for (const id of [game.homeTeamId, game.awayTeamId]) {
      if (id == null) continue;
      const field = placed.pool[index]!.field;
      const prior = teamFields.get(id);
      assert.ok(prior == null || prior === field);
      teamFields.set(id, field);
    }
  });
  const byes = all.filter((game) => game.isBye);
  assert.deepEqual(
    byes.map((game) => `${game.round}:${game.slot}:${game.homeSeed ?? game.awaySeed}`).sort(),
    ["r16:0:1", "r16:2:4", "r16:3:5", "r16:4:2", "r16:6:3"],
  );
  const playIns = all
    .filter((game) => game.round === "r16" && !game.isBye)
    .map((game) => [game.slot, [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-")]);
  assert.deepEqual(playIns, [
    [1, "8-9"],
    [5, "7-10"],
    [7, "6-11"],
  ]);
  const at = new Map(bracket.map((game, index) => [`${game.round}:${game.slot}`, placed.bracket[index]!]));
  const spot = (round: string, slot: number) => {
    const game = at.get(`${round}:${slot}`)!;
    return `${game.field}@${game.time}@${game.date}`;
  };
  assert.equal(spot("r16", 1), "0@08:00@2027-03-07");
  assert.equal(spot("r16", 5), "1@08:00@2027-03-07");
  assert.equal(spot("r16", 7), "1@10:00@2027-03-07");
  assert.equal(spot("qf", 0), "0@10:00@2027-03-07");
  assert.equal(spot("qf", 1), "0@12:00@2027-03-07");
  assert.equal(spot("qf", 2), "1@12:00@2027-03-07");
  assert.equal(spot("qf", 3), "1@14:00@2027-03-07");
  assert.equal(spot("sf", 0), "0@14:00@2027-03-07");
  assert.equal(spot("sf", 1), "1@16:00@2027-03-07");
  assert.equal(spot("f", 0), "0@18:00@2027-03-07");
});

test("LOCKED: 12 teams stay two 6-team pools, then four play-ins", () => {
  const times = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
  const slots = syncSeeds([], Array.from({ length: 12 }, (_, index) => 101 + index));
  const pools = buildPools(slots);
  assert.deepEqual(
    pools.map((pool) => pool.teamIds),
    [
      [101, 102, 103, 104, 105, 106],
      [107, 108, 109, 110, 111, 112],
    ],
  );
  const pair = (pool: (typeof pools)[number]) =>
    pool.games.map((game) => [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-"));
  assert.deepEqual(pair(pools[0]!), ["1-2", "1-3", "2-4", "3-5", "4-6", "5-6"]);
  assert.deepEqual(pair(pools[1]!), ["7-8", "7-9", "8-10", "9-11", "10-12", "11-12"]);
  const pool = pools.flatMap((row) => row.games);
  const all = buildGames(slots);
  const bracket = all.filter((game) => !game.isBye);
  const placed = placeOneOrTwoFields(pool, bracket, "2027-03-06", times);
  assert.equal(placed.fields, 2);
  assert.deepEqual(
    placed.pool.map((game) => `${game.field}@${game.time}`),
    ["0@08:00", "0@10:00", "0@12:00", "0@14:00", "0@16:00", "0@18:00", "1@08:00", "1@10:00", "1@12:00", "1@14:00", "1@16:00", "1@18:00"],
  );
  assert.ok(placed.pool.every((game) => game.date === "2027-03-06"));
  const teamFields = new Map<number, number>();
  pool.forEach((game, index) => {
    for (const id of [game.homeTeamId, game.awayTeamId]) {
      if (id == null) continue;
      const field = placed.pool[index]!.field;
      const prior = teamFields.get(id);
      assert.ok(prior == null || prior === field);
      teamFields.set(id, field);
    }
  });
  assert.deepEqual(
    all.filter((game) => game.isBye).map((game) => `${game.round}:${game.slot}:${game.homeSeed ?? game.awaySeed}`).sort(),
    ["r16:0:1", "r16:2:4", "r16:4:2", "r16:6:3"],
  );
  const playIns = all
    .filter((game) => game.round === "r16" && !game.isBye)
    .map((game) => [game.slot, [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-")]);
  assert.deepEqual(playIns, [
    [1, "8-9"],
    [3, "5-12"],
    [5, "7-10"],
    [7, "6-11"],
  ]);
  const at = new Map(bracket.map((game, index) => [`${game.round}:${game.slot}`, placed.bracket[index]!]));
  const spot = (round: string, slot: number) => {
    const game = at.get(`${round}:${slot}`)!;
    return `${game.field}@${game.time}@${game.date}`;
  };
  assert.equal(spot("r16", 1), "0@08:00@2027-03-07");
  assert.equal(spot("r16", 3), "0@10:00@2027-03-07");
  assert.equal(spot("r16", 5), "1@08:00@2027-03-07");
  assert.equal(spot("r16", 7), "1@10:00@2027-03-07");
  assert.equal(spot("qf", 0), "0@12:00@2027-03-07");
  assert.equal(spot("qf", 1), "0@14:00@2027-03-07");
  assert.equal(spot("qf", 2), "1@12:00@2027-03-07");
  assert.equal(spot("qf", 3), "1@14:00@2027-03-07");
  assert.equal(spot("sf", 0), "0@16:00@2027-03-07");
  assert.equal(spot("sf", 1), "1@16:00@2027-03-07");
  assert.equal(spot("f", 0), "0@18:00@2027-03-07");
});

test("a short 9:00 clock still gives 7 teams their own pool times", () => {
  const slots = syncSeeds([], [101, 102, 103, 104, 105, 106, 107]);
  const pool = buildPools(slots).flatMap((row) => row.games);
  const bracket = buildGames(slots).filter((game) => !game.isBye);
  const placed = placeOneOrTwoFields(pool, bracket, "2026-10-22", ["09:00"]);
  assert.equal(placed.fields, 1);
  assert.equal(placed.pool.length, 7);
  assert.ok(placed.pool.every((game) => game.date === "2026-10-22"));
  const keys = placed.pool.map((game) => `${game.field}|${game.date}|${game.time}`);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(placed.pool[0]?.time, "09:00");
  assert.notEqual(placed.pool[6]?.time, placed.pool[0]?.time);
});

test("moving a Sunday game forward only pulls games that are not waiting", () => {
  const moves = slideOpenHole(
    [
      { id: 2, startTime: "11:00" },
      { id: 3, startTime: "13:00" },
      { id: 4, startTime: "15:00", homeFromRound: "qf" },
      { id: 5, startTime: "17:00", homeFromRound: "sf" },
    ],
    "09:00",
  );
  assert.deepEqual(moves, [
    { id: 2, startTime: "09:00" },
    { id: 3, startTime: "11:00" },
  ]);
});

test("a rain delay keeps the odd time and pulls the games behind it on that field", () => {
  const field = (id: number, time: string, locationId = 1, home = id, away = id + 10): Parameters<typeof followFieldDelay>[0]["games"][number] => ({
    id,
    round: "pool",
    slot: id,
    locationId,
    startDate: "2026-10-22",
    startTime: time,
    homeTeamId: home,
    awayTeamId: away,
    homeFromRound: null,
    homeFromSlot: null,
    awayFromRound: null,
    awayFromSlot: null,
    frozen: false,
  });
  const games = [field(1, "09:00", 1, 1, 2), field(2, "11:00", 1, 3, 4), field(3, "13:00", 1, 5, 6), field(4, "15:00", 1, 7, 8), field(5, "13:00", 2, 9, 10)];
  const plan = followFieldDelay({ anchorId: 2, oldTime: "11:00", newTime: "13:40", block: 120, games });
  assert.deepEqual(plan.moves, [
    { id: 3, startTime: "15:40" },
    { id: 4, startTime: "17:40" },
  ]);
  assert.deepEqual(plan.held, []);
  const other = followFieldDelay({
    anchorId: 2,
    oldTime: "11:00",
    newTime: "13:40",
    block: 120,
    games: games.map((game) => (game.id === 3 ? { ...game, frozen: true } : game)),
  });
  assert.deepEqual(other.moves, [{ id: 4, startTime: "15:40" }]);
});

test("a shorter block squeezes the sheet and keeps a hole and a rain time", () => {
  const row = (id: number, time: string, locationId = 1): Parameters<typeof rescaleStartBlocks>[0]["games"][number] => ({
    id,
    round: "pool",
    slot: id,
    locationId,
    startDate: "2026-10-22",
    startTime: time,
    homeTeamId: id,
    awayTeamId: id + 20,
    homeFromRound: null,
    homeFromSlot: null,
    awayFromRound: null,
    awayFromSlot: null,
    frozen: false,
  });
  const squeezed = rescaleStartBlocks({
    games: [row(1, "09:00"), row(2, "11:00"), row(3, "15:00")],
    oldBlock: 120,
    newBlock: 105,
    firstPitch: "09:00",
  });
  assert.deepEqual(squeezed.moves, [
    { id: 2, startTime: "10:45" },
    { id: 3, startTime: "14:15" },
  ]);
  const delayed = rescaleStartBlocks({
    games: [row(1, "09:00"), row(2, "13:40"), row(3, "15:40")],
    oldBlock: 120,
    newBlock: 105,
    firstPitch: "09:00",
  });
  assert.deepEqual(delayed.moves, [{ id: 3, startTime: "15:25" }]);
  assert.equal(delayed.moves.some((move) => move.id === 2), false);
});

test("moving first pitch slides open games and leaves a scored game", () => {
  const row = (id: number, time: string, frozen = false): Parameters<typeof shiftClockGames>[0][number] => ({
    id,
    round: "pool",
    slot: id,
    locationId: 1,
    startDate: "2026-10-22",
    startTime: time,
    homeTeamId: id,
    awayTeamId: id + 10,
    homeFromRound: null,
    homeFromSlot: null,
    awayFromRound: null,
    awayFromSlot: null,
    frozen,
  });
  const plan = shiftClockGames([row(1, "08:00", true), row(2, "10:00"), row(3, "20:00")], 60);
  assert.deepEqual(plan.moves, [
    { id: 2, startTime: "11:00" },
    { id: 3, startTime: "21:00" },
  ]);
  assert.equal(plan.moves.some((move) => move.id === 1), false);
});

test("a second park puts the 7-team bracket on both fields without changing who plays", () => {
  const times = ["09:00", "10:45", "12:30", "14:15", "16:00", "17:45"];
  const slots = syncSeeds([], [101, 102, 103, 104, 105, 106, 107]);
  const bracket = buildGames(slots).filter((game) => !game.isBye);
  const pairs = bracket
    .filter((game) => game.round === "qf")
    .map((game) => [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-"))
    .sort();
  assert.deepEqual(pairs, ["2-7", "3-6", "4-5"]);
  const one = placeOneOrTwoFields([], bracket, "2026-10-31", times);
  assert.equal(one.fields, 1);
  const two = placeOneOrTwoFields([], bracket, "2026-10-31", times, 2);
  assert.equal(two.fields, 2);
  const placed = bracket.map((game, index) => ({ ...game, ...two.bracket[index]! }));
  const at = (seeds: string) => placed.find((game) => game.round === "qf" && [game.homeSeed, game.awaySeed].sort((a, b) => (a ?? 0) - (b ?? 0)).join("-") === seeds);
  const fourFive = at("4-5");
  const twoSeven = at("2-7");
  const threeSix = at("3-6");
  assert.equal(fourFive?.field, 0);
  assert.equal(fourFive?.date, "2026-11-01");
  assert.equal(fourFive?.time, "09:00");
  assert.equal(twoSeven?.field, 1);
  assert.equal(twoSeven?.time, "09:00");
  assert.equal(threeSix?.field, 1);
  assert.equal(threeSix?.time, "10:45");
  assert.equal(new Set(placed.map((game) => game.field)).size, 2);
  assert.ok(placed.every((game) => game.date === "2026-11-01"));
});

test("3 to 7 teams stay on one field", () => {
  const times = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
  for (const count of [3, 4, 5, 6, 7]) {
    const slots = syncSeeds([], Array.from({ length: count }, (_, i) => 101 + i));
    const pool = buildPools(slots).flatMap((row) => row.games);
    const bracket = buildGames(slots).filter((game) => !game.isBye);
    assert.equal(needsSecondField(pool.length, bracket.length, times.length), false);
    const placed = placeOneOrTwoFields(pool, bracket, "2027-03-06", times);
    assert.equal(placed.fields, 1);
  }
});

test("a second park splits 6 and 7 teams into two pools and keeps each team on one field", () => {
  const times = ["09:00", "10:45", "12:30", "14:15", "16:00", "17:45", "19:30"];
  const teams = [1, 2, 3, 4, 5, 6, 7].map((teamId) => ({ teamId, seed: teamId }));
  const games = placeTwoFieldPools(teams, times, "2026-10-31");
  assert.ok(games);
  const pairs = games.map((game) => [game.homeSeed, game.awaySeed]);
  assert.deepEqual(pairs.slice(0, 4), poolPairings(4).map(([home, away]) => [home + 1, away + 1]));
  assert.deepEqual(pairs.slice(4), poolPairings(3).map(([home, away]) => [home + 5, away + 5]));
  const fieldByTeam = new Map<number, number>();
  for (const game of games) {
    assert.equal(game.field, game.poolIndex);
    for (const id of [game.homeTeamId, game.awayTeamId]) {
      const prev = fieldByTeam.get(id);
      assert.ok(prev == null || prev === game.field);
      fieldByTeam.set(id, game.field);
    }
  }
  assert.equal(new Set(games.map((game) => game.field)).size, 2);
  const warnings = collectScheduleWarnings({
    teamIds: teams.map((team) => team.teamId),
    poolGamesPerTeam: 2,
    teamNames: Object.fromEntries(teams.map((team) => [team.teamId, `Test ${team.teamId}`])),
    locationNames: { 1: "Athens Regional Park", 2: "Meigs County HS" },
    poolGames: games.map((game, index) => ({
      id: index + 1,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      locationId: game.field + 1,
      startDate: game.date,
      startTime: game.time,
    })),
  });
  assert.equal(warnings.some((warning) => warning.text.includes("the same day")), false);
});

test("5 teams stay the locked one pool when a second park exists", () => {
  const times = ["09:00", "10:45", "12:30", "14:15", "16:00"];
  const teams = [1, 2, 3, 4, 5].map((teamId) => ({ teamId, seed: teamId }));
  assert.equal(placeTwoFieldPools(teams, times, "2026-10-31"), null);
  const slots = syncSeeds([], teams.map((team) => team.teamId));
  const games = buildPools(slots).flatMap((pool) => pool.games);
  assert.equal(games.length, 5);
  for (const seed of [1, 2, 3, 4, 5]) {
    assert.equal(games.filter((game) => game.homeSeed === seed || game.awaySeed === seed).length, 2);
  }
});

test("6 teams on two parks are two locked 3-team pools", () => {
  const times = ["09:00", "10:45", "12:30", "14:15"];
  const teams = [1, 2, 3, 4, 5, 6].map((teamId) => ({ teamId, seed: teamId }));
  const games = placeTwoFieldPools(teams, times, "2026-10-31");
  assert.ok(games);
  assert.equal(games.length, 6);
  for (const teamId of teams.map((team) => team.teamId)) {
    assert.equal(games.filter((game) => game.homeTeamId === teamId || game.awayTeamId === teamId).length, 2);
    assert.equal(new Set(games.filter((game) => game.homeTeamId === teamId || game.awayTeamId === teamId).map((game) => game.field)).size, 1);
  }
});

test("5 teams keep pool on day 1 and the bracket on day 2", () => {
  const three = oneFieldGameDates(3, 2, "2027-03-06", 7);
  assert.deepEqual(new Set([...three.pool, ...three.bracket]), new Set(["2027-03-06"]));
  const four = oneFieldGameDates(4, 3, "2027-03-06", 7);
  assert.deepEqual(new Set([...four.pool, ...four.bracket]), new Set(["2027-03-06"]));
  const five = oneFieldGameDates(5, 4, "2027-03-06", 7);
  assert.deepEqual(five.pool, ["2027-03-06", "2027-03-06", "2027-03-06", "2027-03-06", "2027-03-06"]);
  assert.deepEqual(five.bracket, ["2027-03-07", "2027-03-07", "2027-03-07", "2027-03-07"]);
});

test("4 teams on one day run the bracket after pool, not on top of it", () => {
  const times = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
  const four = oneFieldGameSlots(4, 3, "2027-03-06", times);
  assert.deepEqual(four.pool.map((game) => game.time), ["08:00", "10:00", "12:00", "14:00"]);
  assert.deepEqual(four.bracket.map((game) => game.time), ["16:00", "18:00", "20:00"]);
  assert.ok(four.pool.every((game) => game.date === "2027-03-06"));
  assert.ok(four.bracket.every((game) => game.date === "2027-03-06"));
  const five = oneFieldGameSlots(5, 4, "2027-03-06", times);
  assert.equal(five.bracket[0]?.date, "2027-03-07");
  assert.equal(five.bracket[0]?.time, "08:00");
  assert.equal(five.pool[0]?.time, "08:00");
});

test("LOCKED: play-in byes keep their rows but take no line, a single bye stays", () => {
  const five = buildGames(syncSeeds([], [1, 2, 3, 4, 5]));
  const fiveLayout = layoutSiteBracket(five, five);
  const opening = fiveLayout.rounds[0];
  assert.ok((opening?.slots.filter((slot) => slot.game?.isBye).length ?? 0) > 1);
  assert.equal(opening?.slots.filter((slot) => slot.game && !slot.game.isBye).length, 1);
  const semis = fiveLayout.rounds[1]?.slots ?? [];
  const fed = semis.find((slot) => slot.arms === 1);
  const open = semis.find((slot) => slot.arms === 0);
  assert.ok(fed && fed.rowSpan >= 2);
  assert.ok(open && open.rowSpan >= 2);
  const three = buildGames(syncSeeds([], [1, 2, 3]));
  const threeLayout = layoutSiteBracket(three, three);
  assert.equal(threeLayout.rounds[0]?.slots.some((slot) => slot.game?.isBye), true);
  assert.ok((threeLayout.rounds[1]?.slots[0]?.arms ?? 0) >= 1);
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
    rules: { slotMinutes: 120, lastDayLastStart: "22:00" },
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
    rules: { slotMinutes: 120, lastDayLastStart: "22:00" },
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
    rules: { slotMinutes: 120, lastStart: "20:00", lastDayLastStart: "22:00" },
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
  assert.equal(late.find((slot) => slot.game === r32a)?.arms, 1);
  assert.equal(late.find((slot) => slot.game === r32b)?.arms, 1);
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
  assert.equal(parseBracketRules({}).softFill, false);
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

test("a team on two fields the same day gets a yellow note", () => {
  const warnings = collectScheduleWarnings({
    teamIds: [2, 4],
    poolGamesPerTeam: 2,
    teamNames: { 2: "Dirt Bags", 4: "Smokies Keefe" },
    locationNames: { 1: "Athens", 2: "Etowah" },
    poolGames: [
      { id: 1, homeTeamId: 1, awayTeamId: 2, locationId: 1, startDate: "2026-10-23", startTime: "08:00" },
      { id: 2, homeTeamId: 2, awayTeamId: 4, locationId: 2, startDate: "2026-10-23", startTime: "12:00" },
      { id: 3, homeTeamId: 4, awayTeamId: 6, locationId: 2, startDate: "2026-10-23", startTime: "10:00" },
      { id: 4, homeTeamId: 4, awayTeamId: 8, locationId: 2, startDate: "2026-10-23", startTime: "12:00" },
    ],
  });
  const moved = warnings.find((row) => row.id === "fields-2-2026-10-23");
  assert.ok(moved?.text.includes("Dirt Bags"));
  assert.ok(moved?.text.includes("Athens"));
  assert.ok(moved?.text.includes("Etowah"));
  assert.equal(warnings.some((row) => row.id.startsWith("fields-4-")), false);
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

test("scoring a seed does not rewrite the other pool game for that seed", () => {
  const restored = restorePoolDraw([
    { id: 1, homeSeed: 1, awaySeed: 3, homeTeamId: 11, awayTeamId: 13, locked: true },
    { id: 2, homeSeed: 2, awaySeed: 4, homeTeamId: 12, awayTeamId: 14, locked: true },
    { id: 3, homeSeed: 3, awaySeed: 5, homeTeamId: 13, awayTeamId: 15, locked: true },
    { id: 4, homeSeed: 1, awaySeed: 2, homeTeamId: 14, awayTeamId: 12, locked: false },
    { id: 5, homeSeed: 4, awaySeed: 5, homeTeamId: 12, awayTeamId: 15, locked: false },
  ]);
  const openA = restored.find((game) => game.id === 4);
  const openE = restored.find((game) => game.id === 5);
  assert.deepEqual([openA?.homeTeamId, openA?.awayTeamId], [11, 12]);
  assert.deepEqual([openE?.homeTeamId, openE?.awayTeamId], [14, 15]);
  assert.equal(restored.find((game) => game.id === 1)?.homeTeamId, 11);
});

test("a rewritten open game gives the short team its missing opponent", () => {
  const restored = restorePoolDraw([
    { id: 1, homeSeed: 1, awaySeed: 3, homeTeamId: 11, awayTeamId: 13, locked: true, poolIndex: 0 },
    { id: 2, homeSeed: 2, awaySeed: 4, homeTeamId: 12, awayTeamId: 14, locked: true, poolIndex: 0 },
    { id: 3, homeSeed: 3, awaySeed: 5, homeTeamId: 13, awayTeamId: 15, locked: true, poolIndex: 0 },
    { id: 4, homeSeed: 4, awaySeed: 2, homeTeamId: 14, awayTeamId: 12, locked: false, poolIndex: 0 },
    { id: 5, homeSeed: 5, awaySeed: 2, homeTeamId: 15, awayTeamId: 12, locked: false, poolIndex: 0 },
  ]);
  assert.deepEqual(
    [restored.find((game) => game.id === 4)?.homeTeamId, restored.find((game) => game.id === 4)?.awayTeamId],
    [11, 12],
  );
  assert.deepEqual(
    [restored.find((game) => game.id === 5)?.homeTeamId, restored.find((game) => game.id === 5)?.awayTeamId],
    [14, 15],
  );
  const counts = new Map<number, number>();
  for (const game of restored) {
    for (const id of [game.homeTeamId, game.awayTeamId]) {
      if (id == null) continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  assert.deepEqual([...counts.values()].sort(), [2, 2, 2, 2, 2]);
});

test("a sheet with no seeds and a pool index on every game still restores the draw", () => {
  const restored = restorePoolDraw([
    { id: 1, homeSeed: null, awaySeed: null, homeTeamId: 11, awayTeamId: 13, locked: false, poolIndex: 0 },
    { id: 2, homeSeed: null, awaySeed: null, homeTeamId: 12, awayTeamId: 14, locked: false, poolIndex: 1 },
    { id: 3, homeSeed: null, awaySeed: null, homeTeamId: 13, awayTeamId: 15, locked: false, poolIndex: 2 },
    { id: 4, homeSeed: null, awaySeed: null, homeTeamId: 14, awayTeamId: 12, locked: false, poolIndex: 3 },
    { id: 5, homeSeed: null, awaySeed: null, homeTeamId: 15, awayTeamId: 12, locked: false, poolIndex: 4 },
  ]);
  const pair = (id: number) => {
    const game = restored.find((row) => row.id === id);
    return [game?.homeTeamId, game?.awayTeamId].sort((a, b) => (a ?? 0) - (b ?? 0));
  };
  assert.deepEqual(pair(4), [11, 12]);
  assert.deepEqual(pair(5), [14, 15]);
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

test("a second game at the same time moves onto the open field", () => {
  const plan = spreadStackedPoolGames(
    [
      { id: 1, locationId: 10, startDate: "2026-10-17", startTime: "09:00", poolIndex: 0, slot: 1, homeTeamId: 1, awayTeamId: 2, confirmed: false, scored: false },
      { id: 2, locationId: 10, startDate: "2026-10-17", startTime: "09:00", poolIndex: 1, slot: 2, homeTeamId: 3, awayTeamId: 4, confirmed: false, scored: false },
      { id: 3, locationId: 20, startDate: "2026-10-17", startTime: "09:00", poolIndex: 0, slot: 9, homeTeamId: null, awayTeamId: null, confirmed: false, scored: false },
      { id: 4, locationId: 10, startDate: "2026-10-17", startTime: "11:00", poolIndex: 0, slot: 3, homeTeamId: 1, awayTeamId: 5, confirmed: true, scored: false },
    ],
    [10, 20],
  );
  assert.deepEqual(plan.moves, [{ id: 2, locationId: 20 }]);
  assert.deepEqual(plan.deleteIds, [3]);
});

test("a pool split across both parks gets reseated, one moved game does not", () => {
  assert.equal(
    poolsNeedReseat(
      [
        { poolIndex: 0, locationId: 10 },
        { poolIndex: 0, locationId: 10 },
        { poolIndex: 1, locationId: 10 },
        { poolIndex: 1, locationId: 10 },
        { poolIndex: 1, locationId: 20 },
        { poolIndex: 1, locationId: 20 },
      ],
      2,
    ),
    true,
  );
  assert.equal(
    poolsNeedReseat(
      [
        { poolIndex: 0, locationId: 10 },
        { poolIndex: 0, locationId: 10 },
        { poolIndex: 1, locationId: 20 },
        { poolIndex: 1, locationId: 20 },
        { poolIndex: 1, locationId: 10 },
      ],
      2,
    ),
    false,
  );
});



