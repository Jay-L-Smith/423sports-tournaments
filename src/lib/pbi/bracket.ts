import { defaultDayPlan, parseDayPlan, type DayPlan } from "./weekends.ts";
import type { Tiebreaker } from "./rules.ts";

export const GAME_SLOT_MINUTES = 120;
export const FIRST_PITCH = "08:00";
export const LAST_START = "20:00";
export const LAST_DAY_LAST_START = "22:00";
export const MAX_POOL_SIZE = 7;

export const ROUND_IDS = ["r64", "r32", "r16", "qf", "sf", "f"] as const;
export type RoundId = (typeof ROUND_IDS)[number];
export const POOL_ROUND = "pool" as const;
export type GameRound = RoundId | typeof POOL_ROUND;
export const POOL_GAMES_PER_TEAM = 2;

export function isRoundId(value: string): value is RoundId {
  return (ROUND_IDS as readonly string[]).includes(value);
}

export function isGameRound(value: string): value is GameRound {
  return value === POOL_ROUND || isRoundId(value);
}

export function nextPowerOfTwo(n: number): number {
  if (n <= 2) return 2;
  let size = 2;
  while (size < n) size *= 2;
  return size;
}

export function previousPowerOfTwo(n: number): number {
  if (n <= 2) return 2;
  let size = 2;
  while (size * 2 < n) size *= 2;
  return size;
}

/** Extra byes so the next round is the previous power of two. Null for a full bracket or a single odd bye. */
export function playInPlan(teamCount: number): { byes: number; playing: number; games: number } | null {
  if (teamCount < 4) return null;
  const size = nextPowerOfTwo(teamCount);
  if (size === teamCount) return null;
  const byes = size - teamCount;
  const playing = teamCount - byes;
  if (byes <= 1 || playing < 2) return null;
  return { byes, playing, games: playing / 2 };
}

export function seedPlacement(size: number, firstVsLast = true): number[] {
  if (size <= 1) return [1];
  if (!firstVsLast) return Array.from({ length: size }, (_, i) => i + 1);
  const half = seedPlacement(size / 2, true);
  const out: number[] = [];
  for (const seed of half) {
    out.push(seed);
    out.push(size + 1 - seed);
  }
  return out;
}

export function roundsForSize(size: number): RoundId[] {
  const all: { id: RoundId; need: number }[] = [
    { id: "r64", need: 64 },
    { id: "r32", need: 32 },
    { id: "r16", need: 16 },
    { id: "qf", need: 8 },
    { id: "sf", need: 4 },
    { id: "f", need: 2 },
  ];
  return all.filter((row) => row.need <= size).map((row) => row.id);
}

export function roundLabel(round: GameRound): string {
  if (round === POOL_ROUND) return "Pool play";
  if (round === "f") return "Finals";
  if (round === "sf") return "Semifinals";
  if (round === "qf") return "Quarterfinals";
  if (round === "r16") return "Round of 16";
  if (round === "r32") return "Round of 32";
  return "Round of 64";
}

export function treeRoundLabel(round: RoundId, first: RoundId, playIns: boolean): string {
  if (round === first && round !== "f") return playIns ? "Play-ins" : "Round 1";
  return roundLabel(round);
}

/** True only when the first round gives more than the single odd-count bye. */
export function hasPlayInRound(games: { round: string; isBye?: boolean }[]): boolean {
  const first = ROUND_IDS.find((round) => games.some((game) => game.round === round));
  if (!first) return false;
  return games.filter((game) => game.round === first && game.isBye).length > 1;
}

/** Only the championship shares one field. Early games and semis can run in parallel. */
export function collapseToOneField(round: RoundId, _rounds: RoundId[], championshipCollapse = true): boolean {
  return championshipCollapse && round === "f";
}

export type SeedSlot = { seed: number; teamId: number | null; open?: boolean };

/** Real seeds only — 1..count. Padding byes are added in buildGames, not here. */
export function bracketField(count: number, teamAt: (seed: number) => number | null): SeedSlot[] {
  const n = Math.max(0, Math.trunc(count));
  return Array.from({ length: n }, (_, i) => {
    const seed = i + 1;
    return { seed, teamId: teamAt(seed), open: true };
  });
}

export function syncSeeds(existing: SeedSlot[], teamIds: number[]): SeedSlot[] {
  const unique = [...new Set(teamIds)];
  const size = nextPowerOfTwo(Math.max(unique.length, 2));
  const kept = new Set<number>();
  const slots: SeedSlot[] = [];
  for (let seed = 1; seed <= size; seed += 1) {
    const prior = existing.find((row) => row.seed === seed && row.teamId != null && unique.includes(row.teamId));
    if (prior?.teamId != null) {
      slots.push({ seed, teamId: prior.teamId });
      kept.add(prior.teamId);
    } else {
      slots.push({ seed, teamId: null });
    }
  }
  const incoming = unique.filter((id) => !kept.has(id));
  for (const id of incoming) {
    const empty = slots.find((row) => row.teamId == null);
    if (empty) empty.teamId = id;
  }
  return slots;
}

export function swapSeeds(slots: SeedSlot[], seedA: number, seedB: number): SeedSlot[] {
  const next = slots.map((row) => ({ ...row }));
  const a = next.find((row) => row.seed === seedA);
  const b = next.find((row) => row.seed === seedB);
  if (!a || !b || seedA === seedB) return next;
  const hold = a.teamId;
  a.teamId = b.teamId;
  b.teamId = hold;
  return next;
}

export type BuiltGame = {
  round: RoundId;
  slot: number;
  homeSeed: number | null;
  awaySeed: number | null;
  homeFromRound: RoundId | null;
  homeFromSlot: number | null;
  awayFromRound: RoundId | null;
  awayFromSlot: number | null;
  isBye: boolean;
  homeTeamId: number | null;
  awayTeamId: number | null;
};

function teamOn(entries: SeedSlot[], seed: number): number | null {
  return entries.find((row) => row.seed === seed)?.teamId ?? null;
}

function realEntries(slots: SeedSlot[]): SeedSlot[] {
  const flagged = slots.some((row) => row.open != null);
  const rows = flagged ? slots.filter((row) => row.open || row.teamId != null) : slots.filter((row) => row.teamId != null);
  const source = rows.length > 0 ? rows : slots;
  return source.slice().sort((a, b) => a.seed - b.seed);
}

function knownWinner(game: BuiltGame): number | null {
  if (!game.isBye) return null;
  return game.homeTeamId ?? game.awayTeamId;
}

export function buildGames(slots: SeedSlot[], opts?: { firstVsLast?: boolean }): BuiltGame[] {
  const entries = realEntries(slots);
  const count = entries.length;
  if (count < 2) return [];
  const maxSeed = entries.reduce((max, row) => Math.max(max, row.seed), 0);
  const size = nextPowerOfTwo(Math.max(count, maxSeed));
  const rounds = roundsForSize(size);
  const first = rounds[0];
  if (!first) return [];
  const placement = seedPlacement(size, opts?.firstVsLast !== false);
  const realSeeds = new Set(entries.map((row) => row.seed));
  const games: BuiltGame[] = [];
  const firstCount = size / 2;
  for (let slot = 0; slot < firstCount; slot += 1) {
    const homeSeed = placement[slot * 2] ?? null;
    const awaySeed = placement[slot * 2 + 1] ?? null;
    const homeReal = homeSeed != null && realSeeds.has(homeSeed);
    const awayReal = awaySeed != null && realSeeds.has(awaySeed);
    games.push({
      round: first,
      slot,
      homeSeed: homeReal ? homeSeed : null,
      awaySeed: awayReal ? awaySeed : null,
      homeFromRound: null,
      homeFromSlot: null,
      awayFromRound: null,
      awayFromSlot: null,
      isBye: !(homeReal && awayReal),
      homeTeamId: homeReal && homeSeed != null ? teamOn(entries, homeSeed) : null,
      awayTeamId: awayReal && awaySeed != null ? teamOn(entries, awaySeed) : null,
    });
  }
  for (let r = 1; r < rounds.length; r += 1) {
    const prev = rounds[r - 1];
    const curr = rounds[r];
    if (!prev || !curr) continue;
    const prevGames = games.filter((game) => game.round === prev);
    const nextCount = prevGames.length / 2;
    for (let slot = 0; slot < nextCount; slot += 1) {
      const left = prevGames[slot * 2];
      const right = prevGames[slot * 2 + 1];
      if (!left || !right) continue;
      const homeTeamId = knownWinner(left);
      const awayTeamId = knownWinner(right);
      const isBye = left.isBye && right.isBye && (homeTeamId == null || awayTeamId == null);
      games.push({
        round: curr,
        slot,
        homeSeed: null,
        awaySeed: null,
        homeFromRound: left.round,
        homeFromSlot: left.slot,
        awayFromRound: right.round,
        awayFromSlot: right.slot,
        isBye,
        homeTeamId,
        awayTeamId,
      });
    }
  }
  return games;
}

export type LocationRef = { id: number };

export type GamePlacement = {
  round: string;
  slot: number;
  locationId: number | null;
  startDate: string | null;
  startTime: string | null;
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type PackRules = {
  firstPitch?: string;
  slotMinutes?: number;
  lastStart?: string;
  lastDayLastStart?: string;
  championshipCollapse?: boolean;
  packFillFields?: boolean;
  packStayOnPark?: boolean;
  fieldCount?: number;
};

type Clocks = {
  firstPitch: string;
  slotMinutes: number;
  lastStart: string;
  lastDayLastStart: string;
  championshipCollapse: boolean;
  packStayOnPark: boolean;
};

export function packContextFromRules(rules?: PackRules | null): Clocks {
  return {
    firstPitch: rules?.firstPitch || FIRST_PITCH,
    slotMinutes: GAME_SLOT_MINUTES,
    lastStart: rules?.lastStart || LAST_START,
    lastDayLastStart: rules?.lastDayLastStart || LAST_DAY_LAST_START,
    championshipCollapse: rules?.championshipCollapse !== false,
    packStayOnPark: rules?.packStayOnPark !== false,
  };
}

function daySlots(date: string, weekendDates: string[], clocks: Clocks): string[] {
  const slots: string[] = [];
  let t = timeToMinutes(clocks.firstPitch);
  const lastDay = weekendDates[weekendDates.length - 1];
  const last = timeToMinutes(date === lastDay ? clocks.lastDayLastStart : clocks.lastStart);
  const step = Math.max(15, clocks.slotMinutes);
  while (t <= last) {
    slots.push(minutesToTime(t));
    t += step;
  }
  return slots;
}

/** Two-hour start blocks for one tournament day. The last day uses that day's cap. */
export function startBlocks(date: string, dates: string[], rules?: PackRules | null): string[] {
  if (!date) return [];
  return daySlots(date, dates.length > 0 ? dates : [date], packContextFromRules(rules));
}

/** Next start strictly after a feeder, and only on a date in `allowed`. Never invents a day. */
function openingAfter(
  date: string,
  time: string,
  allowed: string[],
  weekendDates: string[],
  clocks: Clocks,
): { date: string; time: string } | null {
  if (allowed.includes(date)) {
    const later = daySlots(date, weekendDates, clocks).find((slot) => slot > time);
    if (later) return { date, time: later };
  }
  const next = weekendDates.find((row) => row > date && allowed.includes(row));
  if (!next) return null;
  const first = daySlots(next, weekendDates, clocks)[0];
  if (!first) return null;
  return { date: next, time: first };
}

function notBefore(date: string, time: string, min: { date: string; time: string } | null): boolean {
  if (!min) return true;
  if (date > min.date) return true;
  if (date < min.date) return false;
  return time >= min.time;
}

function occKey(locationId: number, date: string, time: string): string {
  return `${locationId}|${date}|${time}`;
}

function consecutiveBlock(
  occupied: Set<string>,
  locationId: number,
  date: string,
  count: number,
  slots: string[],
): string[] | null {
  if (count <= 0) return [];
  for (let i = 0; i <= slots.length - count; i += 1) {
    const block = slots.slice(i, i + count);
    if (block.every((time) => !occupied.has(occKey(locationId, date, time)))) return block;
  }
  return null;
}

function locLoad(occupied: Set<string>, locationId: number, date?: string): number {
  const prefix = date ? `${locationId}|${date}|` : `${locationId}|`;
  let n = 0;
  for (const key of occupied) {
    if (key.startsWith(prefix)) n += 1;
  }
  return n;
}

function rememberTeams(
  teamDayPark: Map<string, number>,
  date: string,
  locationId: number,
  homeTeamId?: number | null,
  awayTeamId?: number | null,
) {
  if (homeTeamId != null) teamDayPark.set(`${homeTeamId}|${date}`, locationId);
  if (awayTeamId != null) teamDayPark.set(`${awayTeamId}|${date}`, locationId);
}

type GridGame = {
  round: string;
  slot: number;
  homeTeamId?: number | null;
  awayTeamId?: number | null;
  homeFromRound?: string | null;
  homeFromSlot?: number | null;
  awayFromRound?: string | null;
  awayFromSlot?: number | null;
};

function blankPlacement(game: { round: string; slot: number }): GamePlacement {
  return { round: game.round, slot: game.slot, locationId: null, startDate: null, startTime: null };
}

/**
 * Fill free fields as soon as they open. Same-day park stickiness only.
 * If a feeder has no later slot inside the allowed days, the game stays unscheduled.
 */
function packGamesOnGrid(
  games: GridGame[],
  locations: LocationRef[],
  allowedDates: string[],
  weekendDates: string[],
  occupied: Set<string>,
  confirmedMap: Map<string, number>,
  placed: Map<string, GamePlacement>,
  teamDayPark: Map<string, number>,
  collapse: boolean,
  clocks: Clocks,
): GamePlacement[] {
  const fields = collapse ? locations.slice(0, 1) : locations;
  const out: GamePlacement[] = [];
  if (fields.length === 0 || allowedDates.length === 0) {
    return games.map(blankPlacement);
  }

  for (const game of games) {
    const confirmedId = confirmedMap.get(`${game.round}:${game.slot}`);
    const pinned = confirmedId != null ? fields.filter((loc) => loc.id === confirmedId) : fields;
    const useFields = pinned.length > 0 ? pinned : fields;
    let minStart: { date: string; time: string } | null = null;
    let blocked = false;
    for (const feeder of [
      game.homeFromRound != null && game.homeFromSlot != null
        ? placed.get(`${game.homeFromRound}:${game.homeFromSlot}`)
        : undefined,
      game.awayFromRound != null && game.awayFromSlot != null
        ? placed.get(`${game.awayFromRound}:${game.awayFromSlot}`)
        : undefined,
    ]) {
      if (feeder === undefined) continue;
      if (!feeder?.startDate || !feeder.startTime) {
        blocked = true;
        break;
      }
      const after = openingAfter(feeder.startDate, feeder.startTime, allowedDates, weekendDates, clocks);
      if (!after) {
        blocked = true;
        break;
      }
      if (!minStart || after.date > minStart.date || (after.date === minStart.date && after.time > minStart.time)) {
        minStart = after;
      }
    }
    let chosen: GamePlacement | null = null;
    if (!blocked) {
      outer: for (const date of allowedDates) {
        const prefer: number[] = [];
        if (clocks.packStayOnPark) {
          if (game.homeTeamId != null) {
            const park = teamDayPark.get(`${game.homeTeamId}|${date}`);
            if (park != null) prefer.push(park);
          }
          if (game.awayTeamId != null) {
            const park = teamDayPark.get(`${game.awayTeamId}|${date}`);
            if (park != null) prefer.push(park);
          }
          const homeFeeder =
            game.homeFromRound != null && game.homeFromSlot != null
              ? placed.get(`${game.homeFromRound}:${game.homeFromSlot}`)
              : null;
          const awayFeeder =
            game.awayFromRound != null && game.awayFromSlot != null
              ? placed.get(`${game.awayFromRound}:${game.awayFromSlot}`)
              : null;
          if (homeFeeder?.startDate === date && homeFeeder.locationId != null) prefer.push(homeFeeder.locationId);
          if (awayFeeder?.startDate === date && awayFeeder.locationId != null) prefer.push(awayFeeder.locationId);
        }
        for (const time of daySlots(date, weekendDates, clocks)) {
          if (!notBefore(date, time, minStart)) continue;
          const free = useFields.filter((loc) => !occupied.has(occKey(loc.id, date, time)));
          if (free.length === 0) continue;
          free.sort((a, b) => {
            const ap = prefer.includes(a.id) ? 0 : 1;
            const bp = prefer.includes(b.id) ? 0 : 1;
            if (ap !== bp) return ap - bp;
            return locLoad(occupied, a.id, date) - locLoad(occupied, b.id, date) || a.id - b.id;
          });
          const loc = free[0]!;
          chosen = {
            round: game.round,
            slot: game.slot,
            locationId: loc.id,
            startDate: date,
            startTime: time,
          };
          break outer;
        }
      }
    }
    if (!chosen) chosen = blankPlacement(game);
    if (chosen.locationId != null && chosen.startDate && chosen.startTime) {
      occupied.add(occKey(chosen.locationId, chosen.startDate, chosen.startTime));
      rememberTeams(teamDayPark, chosen.startDate, chosen.locationId, game.homeTeamId, game.awayTeamId);
    }
    placed.set(`${game.round}:${game.slot}`, chosen);
    out.push(chosen);
  }
  return out;
}

export type BuiltPoolGame = {
  round: typeof POOL_ROUND;
  slot: number;
  poolIndex: number;
  homeTeamId: number;
  awayTeamId: number;
  homeSeed: number | null;
  awaySeed: number | null;
};

/** Keep a club on the field, but never leave them sitting more than one game. */
export function orderPoolGamesStayOn<T extends { homeTeamId: number; awayTeamId: number }>(games: T[]): T[] {
  if (games.length <= 1) return games.slice();
  const remaining = games.slice();
  const out: T[] = [];
  const lastSeen = new Map<number, number>();
  out.push(remaining.shift()!);
  for (const id of [out[0]!.homeTeamId, out[0]!.awayTeamId]) lastSeen.set(id, 0);
  while (remaining.length > 0) {
    const forced = remaining.filter((game) =>
      [game.homeTeamId, game.awayTeamId].some((id) => {
        const seen = lastSeen.get(id);
        return seen != null && out.length - seen > 1;
      }),
    );
    const last = out[out.length - 1]!;
    const hot = new Set([last.homeTeamId, last.awayTeamId]);
    const pool = forced.length > 0 ? forced : remaining;
    const hotIdx = pool.findIndex((game) => hot.has(game.homeTeamId) || hot.has(game.awayTeamId));
    const pick = hotIdx >= 0 ? pool[hotIdx]! : pool[0]!;
    remaining.splice(remaining.indexOf(pick), 1);
    for (const id of [pick.homeTeamId, pick.awayTeamId]) {
      if (!lastSeen.has(id)) lastSeen.set(id, out.length);
    }
    out.push(pick);
  }
  return out;
}

function packPoolBlocks(
  games: BuiltPoolGame[],
  locations: LocationRef[],
  dates: string[],
  weekendDates: string[],
  confirmedMap: Map<string, number>,
  occupied: Set<string>,
  teamDayPark: Map<string, number>,
  clocks: Clocks,
): GamePlacement[] {
  const out: GamePlacement[] = [];
  if (games.length === 0 || dates.length === 0 || locations.length === 0) return out;

  const byPool = new Map<number, BuiltPoolGame[]>();
  for (const game of games) {
    const list = byPool.get(game.poolIndex) ?? [];
    list.push(game);
    byPool.set(game.poolIndex, list);
  }
  const pools = [...byPool.entries()].sort((a, b) => a[0] - b[0]);

  function confirmedPark(poolGames: BuiltPoolGame[]): number | null {
    for (const game of poolGames) {
      const id = confirmedMap.get(`${game.round}:${game.slot}`);
      if (id != null) return id;
    }
    return null;
  }

  for (const [, raw] of pools) {
    const remaining = orderPoolGamesStayOn(raw);
    const preferId = confirmedPark(remaining);
    const parkOnDate = new Map<string, number>();
    let i = 0;
    while (i < remaining.length) {
      let best: { loc: LocationRef; date: string; block: string[]; count: number; score: number } | null = null;
      for (let di = 0; di < dates.length; di += 1) {
        const date = dates[di]!;
        const locked = parkOnDate.get(date);
        const locs = locked != null ? locations.filter((loc) => loc.id === locked) : locations;
        if (locs.length === 0) continue;
        const slots = daySlots(date, weekendDates, clocks);
        for (const loc of locs) {
          for (let count = remaining.length - i; count >= 1; count -= 1) {
            const block = consecutiveBlock(occupied, loc.id, date, count, slots);
            if (!block) continue;
            const score = -di * 10000 + count * 100 - locLoad(occupied, loc.id) + (loc.id === preferId ? 1 : 0);
            if (!best || score > best.score) best = { loc, date, block, count, score };
            break;
          }
        }
      }
      if (!best) {
        const game = remaining[i]!;
        out.push(blankPlacement(game));
        i += 1;
        continue;
      }
      for (let n = 0; n < best.count; n += 1) {
        const game = remaining[i + n]!;
        const time = best.block[n]!;
        occupied.add(occKey(best.loc.id, best.date, time));
        rememberTeams(teamDayPark, best.date, best.loc.id, game.homeTeamId, game.awayTeamId);
        parkOnDate.set(best.date, best.loc.id);
        out.push({
          round: game.round,
          slot: game.slot,
          locationId: best.loc.id,
          startDate: best.date,
          startTime: time,
        });
      }
      i += best.count;
    }
  }
  return out;
}

function roundListFor(games: BuiltGame[]): RoundId[] {
  return roundsForSize(
    games.some((g) => g.round === "r64")
      ? 64
      : games.some((g) => g.round === "r32")
        ? 32
        : games.some((g) => g.round === "r16")
          ? 16
          : games.some((g) => g.round === "qf")
            ? 8
            : games.some((g) => g.round === "sf")
              ? 4
              : 2,
  );
}

export function packSchedule(opts: {
  games: BuiltGame[];
  poolGames?: BuiltPoolGame[];
  locations: LocationRef[];
  startDate: string;
  endDate: string;
  confirmed: { round: string; slot: number; locationId: number }[];
  dayPlan?: DayPlan[];
  rules?: PackRules | null;
  teamCount?: number;
}): GamePlacement[] {
  const clocks = packContextFromRules(opts.rules);
  const cap =
    opts.rules?.fieldCount && opts.rules.fieldCount > 0
      ? opts.rules.fieldCount
      : opts.teamCount && opts.teamCount > 0
        ? fieldsNeeded(opts.teamCount)
        : opts.locations.length;
  const locations = opts.locations.slice(0, Math.max(0, cap));
  const roundList = roundListFor(opts.games);
  const confirmedMap = new Map(opts.confirmed.map((row) => [`${row.round}:${row.slot}`, row.locationId]));
  const hasPoolGames = (opts.poolGames?.length ?? 0) > 0;
  const plan =
    opts.dayPlan && opts.dayPlan.length > 0
      ? parseDayPlan(opts.dayPlan, opts.startDate, opts.endDate, true)
      : hasPoolGames
        ? defaultDayPlan(opts.startDate, opts.endDate)
        : parseDayPlan([], opts.startDate, opts.endDate, false);
  const weekendDates = plan.map((row) => row.date);
  const poolDates = plan.filter((row) => row.kind === "pool" || row.kind === "mixed").map((row) => row.date);
  const bracketDates = plan.filter((row) => row.kind === "bracket" || row.kind === "mixed").map((row) => row.date);
  const lastDay = weekendDates[weekendDates.length - 1] ?? opts.endDate;
  const bracketWindow = bracketDates.length > 0 ? bracketDates : [lastDay];
  const occupied = new Set<string>();
  const teamDayPark = new Map<string, number>();
  const out: GamePlacement[] = [];
  const pool = [...(opts.poolGames ?? [])].sort((a, b) => a.slot - b.slot);
  if (pool.length > 0 && poolDates.length > 0) {
    out.push(...packPoolBlocks(pool, locations, poolDates, weekendDates, confirmedMap, occupied, teamDayPark, clocks));
  }

  const placed = new Map<string, GamePlacement>();
  for (const round of roundList) {
    const real = opts.games
      .filter((game) => game.round === round && !game.isBye)
      .slice()
      .sort((a, b) => a.slot - b.slot);
    if (real.length === 0) continue;
    const collapse = collapseToOneField(round, roundList, clocks.championshipCollapse);
    out.push(
      ...packGamesOnGrid(
        real,
        locations,
        bracketWindow,
        weekendDates,
        occupied,
        confirmedMap,
        placed,
        teamDayPark,
        collapse,
        clocks,
      ),
    );
  }

  for (const game of opts.games) {
    if (out.some((row) => row.round === game.round && row.slot === game.slot)) continue;
    out.push(blankPlacement(game));
  }
  return out;
}

export function formatKickoff(date: string | null, time: string | null): string {
  if (!date || !time) return "Time TBD";
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const [h, min] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${day} · ${hour}:${String(min).padStart(2, "0")} ${suffix}`;
}

export function formatClock(time: string | null): string {
  if (!time) return "TBD";
  const [h, min] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(min).padStart(2, "0")} ${suffix}`;
}

export const ALL_SITES = "all" as const;
export type SiteFilter = number | typeof ALL_SITES;

export type SiteGameRef = {
  startDate: string | null;
  locationId: number | null;
  isBye?: boolean;
};

/** Playable games at a park. Pass onward to keep later days (gray future rounds). */
export function gamesAtSite<T extends SiteGameRef>(
  games: T[],
  opts: { date: string; locationId: SiteFilter; onward?: boolean },
): T[] {
  return games.filter((game) => {
    if (game.isBye) return false;
    if (opts.locationId !== ALL_SITES && game.locationId !== opts.locationId) return false;
    if (!game.startDate) return opts.locationId === ALL_SITES;
    if (opts.onward) return game.startDate >= opts.date;
    return game.startDate === opts.date;
  });
}

const SITE_ROUND_ORDER: Record<string, number> = {
  pool: 0,
  r64: 1,
  r32: 2,
  r16: 3,
  qf: 4,
  sf: 5,
  f: 6,
};

export function siteRoundOrder(round: string): number {
  return SITE_ROUND_ORDER[round] ?? 99;
}

/** First elimination round at this park on this day. Null = pool only today. */
export function liveBracketRound<T extends { round: string; startDate: string | null }>(
  games: T[],
  date: string,
): string | null {
  const today = games.filter(
    (game) => game.round !== POOL_ROUND && (!game.startDate || game.startDate === date),
  );
  if (today.length === 0) return null;
  return today.slice().sort((a, b) => siteRoundOrder(a.round) - siteRoundOrder(b.round))[0]?.round ?? null;
}

/** Later rounds (and later days) stay gray so kickoff times are still readable. */
export function isFutureSiteGame<T extends { round: string; startDate: string | null }>(
  game: T,
  opts: { date: string; liveRound: string | null },
): boolean {
  if (game.startDate && game.startDate > opts.date) return true;
  if (game.round === POOL_ROUND) return false;
  if (!opts.liveRound) return true;
  return siteRoundOrder(game.round) > siteRoundOrder(opts.liveRound);
}

export function sitesOnDay<T extends { id: number }>(
  locations: T[],
  games: SiteGameRef[],
  date: string,
): T[] {
  const ids = new Set<number>();
  for (const game of games) {
    if (game.isBye || game.startDate !== date || game.locationId == null) continue;
    ids.add(game.locationId);
  }
  return locations.filter((loc) => ids.has(loc.id));
}

/** Chip label: drop Park / Fields / Diamond so six sites fit. */
export function shortParkName(name: string): string {
  const trimmed = name
    .replace(/\s+((Community|City|Regional|Recreation|Ball)\s+)?(Park|Fields|Diamond)$/i, "")
    .trim();
  return trimmed || name;
}

export type SiteBracketRef = {
  round: string;
  slot: number;
  isBye?: boolean;
  locationId?: number | null;
  homeFromRound: string | null;
  homeFromSlot: number | null;
  awayFromRound: string | null;
  awayFromSlot: number | null;
};

export type SiteBracketSlot<T> = {
  game: T | null;
  ghost: boolean;
  rowStart: number;
  rowSpan: number;
  arms: number;
  armSpans: number[];
  cardAt?: number;
  armAts?: number[];
};

export type SiteBracketLayout<T> = {
  rounds: { round: string; label?: string; slots: SiteBracketSlot<T>[] }[];
  rowCount: number;
};

function roundSlotKey(round: string, slot: number): string {
  return `${round}:${slot}`;
}

/** Where a card sits in its slot, and where the two feeder lines meet it. */
function slotAnchors(
  rowStart: number,
  rowSpan: number,
  kids: { rowStart: number; rowSpan: number; cardAt: number }[],
): { cardAt: number; armAts: number[] } {
  if (kids.length === 0) return { cardAt: 0.5, armAts: [] };
  const top = rowStart - 1;
  const span = Math.max(1, rowSpan);
  const armAts = kids.map((kid) => (kid.rowStart - 1 + kid.cardAt * kid.rowSpan - top) / span);
  const cardAt = armAts.reduce((sum, at) => sum + at, 0) / armAts.length;
  return { cardAt, armAts };
}

/**
 * Tree for one park on one day. On-sheet games plus both feeder arms
 * (bye / other park / earlier day) so two lines join into one. Ghosts
 * are not expanded further — the last column is still today’s last
 * game at this park.
 */
export function layoutSiteBracket<T extends SiteBracketRef>(
  siteGames: T[],
  allGames: T[] = [],
): SiteBracketLayout<T> {
  const byKey = new Map<string, T>();
  for (const game of allGames.length > 0 ? allGames : siteGames) {
    byKey.set(roundSlotKey(game.round, game.slot), game);
  }
  const siteKeys = new Set<string>();
  for (const game of siteGames) {
    if (game.round === POOL_ROUND) continue;
    siteKeys.add(roundSlotKey(game.round, game.slot));
  }
  if (siteKeys.size === 0) return { rounds: [], rowCount: 0 };

  type Node = {
    key: string;
    game: T;
    ghost: boolean;
    childKeys: string[];
    rowStart: number;
    rowSpan: number;
    cardAt: number;
    armAts: number[];
  };
  const nodes = new Map<string, Node>();

  function ensure(key: string, ghost: boolean): Node | null {
    const existing = nodes.get(key);
    if (existing) {
      if (!ghost) existing.ghost = false;
      return existing;
    }
    const game = byKey.get(key);
    if (!game) return null;
    const node: Node = { key, game, ghost, childKeys: [], rowStart: 1, rowSpan: 1, cardAt: 0.5, armAts: [] };
    nodes.set(key, node);
    return node;
  }

  for (const key of siteKeys) ensure(key, false);

  for (const key of [...siteKeys]) {
    const game = byKey.get(key);
    if (!game) continue;
    const feeders: string[] = [];
    if (game.homeFromRound != null && game.homeFromSlot != null) {
      feeders.push(roundSlotKey(game.homeFromRound, game.homeFromSlot));
    }
    if (game.awayFromRound != null && game.awayFromSlot != null) {
      feeders.push(roundSlotKey(game.awayFromRound, game.awayFromSlot));
    }
    for (const feeder of feeders) {
      if (nodes.has(feeder)) continue;
      ensure(feeder, !siteKeys.has(feeder));
    }
  }

  for (const node of nodes.values()) {
    const kids: string[] = [];
    const home =
      node.game.homeFromRound != null && node.game.homeFromSlot != null
        ? roundSlotKey(node.game.homeFromRound, node.game.homeFromSlot)
        : null;
    const away =
      node.game.awayFromRound != null && node.game.awayFromSlot != null
        ? roundSlotKey(node.game.awayFromRound, node.game.awayFromSlot)
        : null;
    if (home && nodes.has(home)) kids.push(home);
    if (away && nodes.has(away)) kids.push(away);
    node.childKeys = kids;
  }

  const childOf = new Set<string>();
  for (const node of nodes.values()) {
    for (const child of node.childKeys) childOf.add(child);
  }
  const roots = [...nodes.values()]
    .filter((node) => !childOf.has(node.key))
    .sort((a, b) => siteRoundOrder(b.game.round) - siteRoundOrder(a.game.round) || a.game.slot - b.game.slot);

  function collectLeaves(key: string, out: Node[]) {
    const node = nodes.get(key);
    if (!node) return;
    if (node.childKeys.length === 0) {
      out.push(node);
      return;
    }
    for (const child of node.childKeys) collectLeaves(child, out);
  }

  let row = 1;
  for (const root of roots) {
    const leaves: Node[] = [];
    collectLeaves(root.key, leaves);
    for (const leaf of leaves) {
      leaf.rowStart = row;
      leaf.rowSpan = 1;
      row += 1;
    }
  }

  function bubble(key: string) {
    const node = nodes.get(key);
    if (!node || node.childKeys.length === 0) return;
    for (const child of node.childKeys) bubble(child);
    const kids = node.childKeys.map((child) => nodes.get(child)).filter((row): row is Node => Boolean(row));
    if (kids.length === 0) return;
    node.rowStart = Math.min(...kids.map((kid) => kid.rowStart));
    const end = Math.max(...kids.map((kid) => kid.rowStart + kid.rowSpan));
    node.rowSpan = Math.max(1, end - node.rowStart);
  }
  for (const root of roots) bubble(root.key);

  let rowCount = 0;
  for (const node of nodes.values()) {
    rowCount = Math.max(rowCount, node.rowStart + node.rowSpan - 1);
  }

  const anchored = [...nodes.values()].sort(
    (a, b) => siteRoundOrder(a.game.round) - siteRoundOrder(b.game.round) || a.game.slot - b.game.slot,
  );
  for (const node of anchored) {
    const kids = node.childKeys.map((child) => nodes.get(child)).filter((row): row is Node => Boolean(row));
    const anchors = slotAnchors(node.rowStart, node.rowSpan, kids);
    node.cardAt = anchors.cardAt;
    node.armAts = anchors.armAts;
  }

  const byRound = new Map<string, SiteBracketSlot<T>[]>();
  for (const node of nodes.values()) {
    const kids = node.childKeys.map((child) => nodes.get(child)).filter((row): row is Node => Boolean(row));
    const list = byRound.get(node.game.round) ?? [];
    list.push({
      game: node.game,
      ghost: node.ghost,
      rowStart: node.rowStart,
      rowSpan: node.rowSpan,
      arms: node.childKeys.length,
      armSpans: kids.map((kid) => kid.rowSpan),
      cardAt: node.cardAt,
      armAts: node.armAts,
    });
    byRound.set(node.game.round, list);
  }
  const rounds = ROUND_IDS.filter((round) => byRound.has(round)).map((round) => ({
    round,
    slots: (byRound.get(round) ?? []).slice().sort((a, b) => a.rowStart - b.rowStart || (a.game?.slot ?? 0) - (b.game?.slot ?? 0)),
  }));
  return { rounds, rowCount };
}

/** The game this winner feeds, if any (may be another day or park). */
export function nextKnockoutGame<T extends SiteBracketRef>(game: T, allGames: T[]): T | null {
  for (const row of allGames) {
    if (row.isBye || row.round === POOL_ROUND) continue;
    if (row.homeFromRound === game.round && row.homeFromSlot === game.slot) return row;
    if (row.awayFromRound === game.round && row.awayFromSlot === game.slot) return row;
  }
  return null;
}

export function poolTreeRoundLabel(index: number, total: number): string {
  if (total > 1 && index >= total - 1) return "Last game";
  return "Pool play";
}

function poolColumnCounts(gameCount: number, rootCount: number): number[] {
  if (gameCount <= 0) return [];
  if (gameCount === 1) return [1];
  const roots = Math.max(1, Math.min(rootCount, gameCount));
  const cols: number[] = [roots];
  let total = roots;
  while (total < gameCount) {
    cols.unshift(cols[0]! * 2);
    total += cols[0]!;
    if (cols.length > 8) break;
  }
  return cols;
}

/**
 * Pool games at one park, one day: earliest on the left, last pitch on
 * the right. Same 2-into-1 sheet as knockout — not a champion, just the
 * last game today. Parallel last-wave games (two fields) are two trees.
 */
export function layoutPoolTree<
  T extends {
    round: string;
    slot: number;
    isBye?: boolean;
    startDate?: string | null;
    startTime?: string | null;
  },
>(games: T[]): SiteBracketLayout<T> {
  const playable = games
    .filter((game) => game.round === POOL_ROUND && !game.isBye)
    .slice()
    .sort(
      (a, b) =>
        (a.startDate ?? "").localeCompare(b.startDate ?? "") ||
        (a.startTime ?? "").localeCompare(b.startTime ?? "") ||
        a.slot - b.slot,
    );
  if (playable.length === 0) return { rounds: [], rowCount: 0 };
  if (playable.length === 1) {
    return {
      rounds: [
        {
          round: "p0",
          label: poolTreeRoundLabel(0, 1),
          slots: [
            {
              game: playable[0]!,
              ghost: false,
              rowStart: 1,
              rowSpan: 1,
              arms: 0,
              armSpans: [],
              cardAt: 0.5,
              armAts: [],
            },
          ],
        },
      ],
      rowCount: 1,
    };
  }

  const last = playable[playable.length - 1]!;
  const lastStamp = `${last.startDate ?? ""}|${last.startTime ?? ""}`;
  const rootGames = playable.filter((game) => `${game.startDate ?? ""}|${game.startTime ?? ""}` === lastStamp);
  const cols = poolColumnCounts(playable.length, Math.max(1, rootGames.length));
  const lastCol = cols.length - 1;
  const grid: (T | null)[][] = cols.map((count) => Array.from({ length: count }, () => null));

  const placed = new Set<T>();
  rootGames.forEach((game, index) => {
    if (index < (cols[lastCol] ?? 0)) {
      grid[lastCol]![index] = game;
      placed.add(game);
    }
  });

  let remaining = playable.filter((game) => !placed.has(game));
  for (let c = lastCol - 1; c >= 0; c -= 1) {
    const need = cols[c] ?? 0;
    const takeAt = Math.max(0, remaining.length - need);
    const take = remaining.splice(takeAt, remaining.length - takeAt);
    for (let i = 0; i < need; i += 1) {
      grid[c]![i] = take[i] ?? null;
    }
  }

  type Node = {
    key: string;
    game: T | null;
    ghost: boolean;
    childKeys: string[];
    rowStart: number;
    rowSpan: number;
    col: number;
    index: number;
    cardAt: number;
    armAts: number[];
  };
  const nodes = new Map<string, Node>();
  function cellKey(col: number, index: number): string {
    return `p${col}:${index}`;
  }
  for (let c = 0; c < cols.length; c += 1) {
    const count = cols[c] ?? 0;
    for (let i = 0; i < count; i += 1) {
      const game = grid[c]![i] ?? null;
      const childKeys: string[] = [];
      if (c > 0) {
        childKeys.push(cellKey(c - 1, i * 2), cellKey(c - 1, i * 2 + 1));
      }
      nodes.set(cellKey(c, i), {
        key: cellKey(c, i),
        game,
        ghost: game == null,
        childKeys,
        rowStart: 1,
        rowSpan: 1,
        col: c,
        index: i,
        cardAt: 0.5,
        armAts: [],
      });
    }
  }

  const leaves = [...nodes.values()]
    .filter((node) => node.col === 0)
    .sort((a, b) => a.index - b.index);
  let row = 1;
  for (const leaf of leaves) {
    leaf.rowStart = row;
    leaf.rowSpan = 1;
    row += 1;
  }

  function bubble(key: string) {
    const node = nodes.get(key);
    if (!node || node.childKeys.length === 0) return;
    for (const child of node.childKeys) bubble(child);
    const kids = node.childKeys.map((child) => nodes.get(child)).filter((row): row is Node => Boolean(row));
    if (kids.length === 0) return;
    node.rowStart = Math.min(...kids.map((kid) => kid.rowStart));
    const end = Math.max(...kids.map((kid) => kid.rowStart + kid.rowSpan));
    node.rowSpan = Math.max(1, end - node.rowStart);
  }
  for (const node of nodes.values()) {
    if (node.col === lastCol) bubble(node.key);
  }

  const poolAnchored = [...nodes.values()].sort((a, b) => a.col - b.col || a.index - b.index);
  for (const node of poolAnchored) {
    const kids = node.childKeys.map((child) => nodes.get(child)).filter((row): row is Node => Boolean(row));
    const anchors = slotAnchors(node.rowStart, node.rowSpan, kids);
    node.cardAt = anchors.cardAt;
    node.armAts = anchors.armAts;
  }

  let rowCount = 0;
  const rounds = cols.map((count, c) => {
    const slots: SiteBracketSlot<T>[] = [];
    for (let i = 0; i < count; i += 1) {
      const node = nodes.get(cellKey(c, i));
      if (!node) continue;
      rowCount = Math.max(rowCount, node.rowStart + node.rowSpan - 1);
      const kids = node.childKeys.map((child) => nodes.get(child)).filter((row): row is Node => Boolean(row));
      slots.push({
        game: node.game,
        ghost: node.ghost,
        rowStart: node.rowStart,
        rowSpan: node.rowSpan,
        arms: node.childKeys.length,
        armSpans: kids.map((kid) => kid.rowSpan),
        cardAt: node.cardAt,
        armAts: node.armAts,
      });
    }
    return {
      round: `p${c}`,
      label: poolTreeRoundLabel(c, cols.length),
      slots,
    };
  });
  return { rounds, rowCount };
}

export function numberPlayableGames(
  games: {
    round: string;
    slot: number;
    isBye: boolean;
    startDate?: string | null;
    startTime?: string | null;
    locationId?: number | null;
  }[],
): Map<string, number> {
  const map = new Map<string, number>();
  let n = 0;
  const ordered = games
    .filter((game) => !game.isBye)
    .slice()
    .sort(
      (a, b) =>
        (a.round === POOL_ROUND ? 0 : 1) - (b.round === POOL_ROUND ? 0 : 1) ||
        (a.startDate ?? "").localeCompare(b.startDate ?? "") ||
        (a.startTime ?? "").localeCompare(b.startTime ?? "") ||
        ROUND_IDS.indexOf(a.round as RoundId) - ROUND_IDS.indexOf(b.round as RoundId) ||
        a.slot - b.slot,
    );
  for (const game of ordered) {
    n += 1;
    map.set(`${game.round}:${game.slot}`, n);
  }
  return map;
}

export function opponentLabel(opts: {
  teamName: string | null;
  seed: number | null;
  fromRound: RoundId | null;
  isBye: boolean;
}): string {
  if (opts.teamName) return opts.teamName;
  if (opts.fromRound) return `Winner · ${roundLabel(opts.fromRound)}`;
  if (opts.seed) return `Seed ${opts.seed}`;
  if (opts.isBye) return "Bye";
  return "TBD";
}

export function poolLabel(index: number): string {
  return `Pool ${String.fromCharCode(65 + (index % 26))}`;
}

/** How many clubs go into the bracket tree after pool play. */
export function sundayTeamCount(
  approved: number,
  poolPlay: boolean,
  advance: "all-reseed" | "top-per-pool" | "winners-only" = "all-reseed",
  advancePerPool = 2,
): number {
  if (!poolPlay || advance === "all-reseed") return approved;
  const pools = Math.max(1, poolSizes(approved).length);
  if (advance === "winners-only") return Math.min(approved, pools);
  return Math.min(approved, pools * Math.max(1, advancePerPool));
}

export function seedLabel(seed: number): string {
  const n = Math.abs(Math.trunc(seed));
  const tens = n % 100;
  const ones = n % 10;
  const suffix =
    tens >= 11 && tens <= 13 ? "th" : ones === 1 ? "st" : ones === 2 ? "nd" : ones === 3 ? "rd" : "th";
  return `${n}${suffix}`;
}

/** Pools of at most 7, split as evenly as possible. */
export function fieldsNeeded(n: number): number {
  if (n <= 0) return 0;
  return Math.ceil(n / MAX_POOL_SIZE);
}

export function poolSizes(n: number): number[] {
  if (n < 2) return [];
  const pools = Math.max(1, Math.ceil(n / MAX_POOL_SIZE));
  const base = Math.floor(n / pools);
  const extra = n % pools;
  return Array.from({ length: pools }, (_, i) => base + (i < extra ? 1 : 0));
}

/** Two games each. Order keeps the rest between a team's games at 0 or 1. */
export function poolPairings(size: number): [number, number][] {
  if (size <= 1) return [];
  if (size === 2) return [[0, 1]];
  const pairs: [number, number][] = [
    [0, 1],
    [0, 2],
  ];
  for (let k = 1; k <= size - 3; k += 1) pairs.push([k, k + 2]);
  pairs.push([size - 2, size - 1]);
  return pairs;
}

export type BuiltPool = {
  poolIndex: number;
  teamIds: number[];
  games: BuiltPoolGame[];
};

export function buildPools(slots: SeedSlot[], _gamesPerTeam = POOL_GAMES_PER_TEAM): BuiltPool[] {
  const teams = slots
    .filter((row) => row.teamId != null)
    .sort((a, b) => a.seed - b.seed)
    .map((row) => ({ id: row.teamId as number, seed: row.seed }));
  const sizes = poolSizes(teams.length);
  const pools: BuiltPool[] = [];
  let offset = 0;
  let slot = 0;
  for (let i = 0; i < sizes.length; i += 1) {
    const size = sizes[i] ?? 0;
    const group = teams.slice(offset, offset + size);
    offset += size;
    const games = poolPairings(group.length).map(([a, b]) => {
      const home = group[a];
      const away = group[b];
      const game: BuiltPoolGame = {
        round: POOL_ROUND,
        slot,
        poolIndex: i,
        homeTeamId: home?.id ?? 0,
        awayTeamId: away?.id ?? 0,
        homeSeed: home?.seed ?? null,
        awaySeed: away?.seed ?? null,
      };
      slot += 1;
      return game;
    });
    pools.push({
      poolIndex: i,
      teamIds: group.map((row) => row.id),
      games,
    });
  }
  return pools;
}

export function divisionSlotOffset(divisionIndex: number): number {
  return Math.max(0, Math.trunc(divisionIndex)) * 64;
}

/** Placeholder clubs until real teams fill the seed. Seed 1 is Team A. */
export function fillerName(seed: number | null): string {
  let n = Math.max(1, Math.trunc(seed ?? 1));
  let label = "";
  while (n > 0) {
    n -= 1;
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26);
  }
  return `Team ${label}`;
}

export type PoolGameResult = {
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number | null;
  awayScore: number | null;
  forfeit?: "home" | "away" | null;
};

export type PoolStanding = {
  teamId: number;
  place: number;
  wins: number;
  losses: number;
  ties: number;
  rs: number;
  ra: number;
  rd: number;
};

function compareStandings(
  a: PoolStanding,
  b: PoolStanding,
  tiebreakers: Tiebreaker[],
  h2h: Map<string, number>,
): number {
  for (const key of tiebreakers) {
    if (key === "record") {
      const aw = a.wins - a.losses;
      const bw = b.wins - b.losses;
      if (aw !== bw) return bw - aw;
    } else if (key === "runs-scored" && a.rs !== b.rs) return b.rs - a.rs;
    else if (key === "run-diff" && a.rd !== b.rd) return b.rd - a.rd;
    else if (key === "runs-allowed" && a.ra !== b.ra) return a.ra - b.ra;
    else if (key === "head-to-head") {
      const winner = h2h.get(`${a.teamId}:${b.teamId}`) ?? h2h.get(`${b.teamId}:${a.teamId}`);
      if (winner === a.teamId) return -1;
      if (winner === b.teamId) return 1;
    }
  }
  return a.teamId - b.teamId;
}

export function poolStandings(teamIds: number[], games: PoolGameResult[], tiebreakers: Tiebreaker[]): PoolStanding[] {
  const rows = new Map<number, PoolStanding>();
  for (const id of teamIds) {
    rows.set(id, { teamId: id, place: 0, wins: 0, losses: 0, ties: 0, rs: 0, ra: 0, rd: 0 });
  }
  const h2h = new Map<string, number>();
  for (const game of games) {
    const home = rows.get(game.homeTeamId);
    const away = rows.get(game.awayTeamId);
    if (!home || !away) continue;
    const scored = game.homeScore != null && game.awayScore != null;
    if (!game.forfeit && !scored) continue;
    let homeWin = false;
    let awayWin = false;
    if (game.forfeit === "home") awayWin = true;
    else if (game.forfeit === "away") homeWin = true;
    else if ((game.homeScore ?? 0) > (game.awayScore ?? 0)) homeWin = true;
    else if ((game.awayScore ?? 0) > (game.homeScore ?? 0)) awayWin = true;
    if (homeWin) {
      home.wins += 1;
      away.losses += 1;
      h2h.set(`${game.homeTeamId}:${game.awayTeamId}`, game.homeTeamId);
    } else if (awayWin) {
      away.wins += 1;
      home.losses += 1;
      h2h.set(`${game.homeTeamId}:${game.awayTeamId}`, game.awayTeamId);
    } else {
      home.ties += 1;
      away.ties += 1;
    }
    if (!game.forfeit && scored) {
      home.rs += game.homeScore ?? 0;
      home.ra += game.awayScore ?? 0;
      away.rs += game.awayScore ?? 0;
      away.ra += game.homeScore ?? 0;
    }
  }
  for (const row of rows.values()) row.rd = row.rs - row.ra;
  const list = [...rows.values()].sort((a, b) => compareStandings(a, b, tiebreakers, h2h));
  list.forEach((row, index) => {
    row.place = index + 1;
  });
  return list;
}

export type SlotGame = {
  id: number;
  isBye?: boolean;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeScore: number | null;
  awayScore: number | null;
  forfeit?: "home" | "away" | null;
  noContest?: boolean;
};

export type SlotPatch =
  | { id: number; kind: "forfeit"; side: "home" | "away" }
  | { id: number; kind: "no-contest" };

/** Forfeit every remaining game for one club. A game both clubs left is a no-contest. */
export function forfeitRemaining(games: SlotGame[], teamId: number): SlotPatch[] {
  const out: SlotPatch[] = [];
  for (const game of games) {
    if (game.isBye) continue;
    if (game.homeTeamId !== teamId && game.awayTeamId !== teamId) continue;
    if (game.noContest) continue;
    const played = !game.forfeit && game.homeScore != null && game.awayScore != null;
    if (played) continue;
    const side: "home" | "away" = game.homeTeamId === teamId ? "home" : "away";
    if (game.forfeit === side) continue;
    if (game.forfeit && game.forfeit !== side) {
      out.push({ id: game.id, kind: "no-contest" });
      continue;
    }
    out.push({ id: game.id, kind: "forfeit", side });
  }
  return out;
}

/** A place is locked only when no remaining result can move that team. */
export function guaranteedPlaces(
  teamIds: number[],
  games: PoolGameResult[],
  tiebreakers: Tiebreaker[],
  _poolTies = true,
): Map<number, number> {
  const current = poolStandings(teamIds, games, tiebreakers);
  const wins = new Map(current.map((row) => [row.teamId, row.wins]));
  const left = new Map<number, number>();
  for (const id of teamIds) left.set(id, 0);
  for (const game of games) {
    const open = !game.forfeit && (game.homeScore == null || game.awayScore == null);
    if (!open) continue;
    left.set(game.homeTeamId, (left.get(game.homeTeamId) ?? 0) + 1);
    left.set(game.awayTeamId, (left.get(game.awayTeamId) ?? 0) + 1);
  }
  const locked = new Map<number, number>();
  const best = (id: number) => (wins.get(id) ?? 0) + (left.get(id) ?? 0);
  const worst = (id: number) => wins.get(id) ?? 0;
  for (const id of teamIds) {
    let minAhead = 0;
    let maxAhead = 0;
    for (const other of teamIds) {
      if (other === id) continue;
      if (worst(other) > best(id)) minAhead += 1;
      if (best(other) >= worst(id)) maxAhead += 1;
    }
    if (minAhead === maxAhead) locked.set(id, minAhead + 1);
  }
  return locked;
}

export type ScheduleWarning = {
  id: string;
  text: string;
  gameId?: number;
  gameIds?: number[];
};

type WarnGame = {
  id?: number;
  homeTeamId: number | null;
  awayTeamId: number | null;
  locationId?: number | null;
  startDate?: string | null;
  startTime?: string | null;
};

export function restGaps(games: { homeTeamId: number | null; awayTeamId: number | null }[]): Map<number, number> {
  const first = new Map<number, number>();
  const gaps = new Map<number, number>();
  games.forEach((game, index) => {
    for (const id of [game.homeTeamId, game.awayTeamId]) {
      if (id == null) continue;
      const prev = first.get(id);
      if (prev == null) first.set(id, index);
      else if (!gaps.has(id)) gaps.set(id, index - prev - 1);
    }
  });
  return gaps;
}

export function collectScheduleWarnings(opts: {
  teamIds: number[];
  poolGamesPerTeam: number;
  poolGames: WarnGame[];
  teamNames?: Record<number, string>;
  locationNames?: Record<number, string>;
}): ScheduleWarning[] {
  const warnings: ScheduleWarning[] = [];
  const byTeam = new Map<number, WarnGame[]>();
  for (const id of opts.teamIds) byTeam.set(id, []);
  for (const game of opts.poolGames) {
    for (const id of [game.homeTeamId, game.awayTeamId]) {
      if (id == null || !byTeam.has(id)) continue;
      byTeam.get(id)!.push(game);
    }
  }
  for (const id of opts.teamIds) {
    const list = byTeam.get(id) ?? [];
    if (list.length >= opts.poolGamesPerTeam) continue;
    const name = opts.teamNames?.[id] ?? `Team ${id}`;
    const ids = list.map((game) => game.id).filter((gameId): gameId is number => gameId != null);
    warnings.push({
      id: `pool-${id}`,
      text: `${name} has ${list.length}/${opts.poolGamesPerTeam} pool games`,
      gameId: ids[0],
      gameIds: ids,
    });
  }
  const groups = new Map<string, WarnGame[]>();
  for (const game of opts.poolGames) {
    if (game.locationId == null || !game.startTime) continue;
    const key = `${game.locationId}|${game.startDate ?? ""}`;
    const list = groups.get(key) ?? [];
    list.push(game);
    groups.set(key, list);
  }
  for (const [key, list] of groups) {
    const ordered = list.slice().sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
    const gaps = restGaps(ordered);
    for (const [teamId, gap] of gaps) {
      if (gap <= 1 || !opts.teamIds.includes(teamId)) continue;
      const mine = ordered.filter((game) => game.homeTeamId === teamId || game.awayTeamId === teamId);
      const name = opts.teamNames?.[teamId] ?? `Team ${teamId}`;
      const locId = Number(key.split("|")[0]);
      const park = opts.locationNames?.[locId] ?? "the park";
      const ids = mine.map((game) => game.id).filter((gameId): gameId is number => gameId != null);
      warnings.push({
        id: `gap-${teamId}`,
        text: `${name} sits too long at ${park} between ${formatClock(mine[0]?.startTime ?? null)} and ${formatClock(mine[mine.length - 1]?.startTime ?? null)}.`,
        gameId: ids[0],
        gameIds: ids,
      });
    }
  }
  return warnings;
}

type PoolSwapGame = {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeSeed: number | null;
  awaySeed: number | null;
  poolIndex?: number;
};

export function applyPoolSlotSwap<T extends PoolSwapGame>(games: T[], teamA: number, teamB: number): T[] {
  if (teamA === teamB) return games.map((game) => ({ ...game }));
  const seedOf = new Map<number, number | null>();
  for (const game of games) {
    seedOf.set(game.homeTeamId, game.homeSeed);
    seedOf.set(game.awayTeamId, game.awaySeed);
  }
  const seedA = seedOf.get(teamA) ?? null;
  const seedB = seedOf.get(teamB) ?? null;
  return games.map((game) => {
    const next = { ...game };
    if (next.homeTeamId === teamA) {
      next.homeTeamId = teamB;
      next.homeSeed = seedB;
    } else if (next.homeTeamId === teamB) {
      next.homeTeamId = teamA;
      next.homeSeed = seedA;
    }
    if (next.awayTeamId === teamA) {
      next.awayTeamId = teamB;
      next.awaySeed = seedB;
    } else if (next.awayTeamId === teamB) {
      next.awayTeamId = teamA;
      next.awaySeed = seedA;
    }
    return next;
  });
}

export function applyPoolSideSwap<T extends PoolSwapGame>(
  games: T[],
  a: { gameId: number; side: "home" | "away" },
  b: { gameId: number; side: "home" | "away" },
): T[] {
  const next = games.map((game) => ({ ...game }));
  const left = next.find((game) => game.id === a.gameId);
  const right = next.find((game) => game.id === b.gameId);
  if (!left || !right) return next;
  if ((left.poolIndex ?? 0) !== (right.poolIndex ?? 0)) throw new Error("Teams have to stay in the same pool.");
  const read = (game: T, side: "home" | "away") =>
    side === "home" ? { teamId: game.homeTeamId, seed: game.homeSeed } : { teamId: game.awayTeamId, seed: game.awaySeed };
  const write = (game: T, side: "home" | "away", value: { teamId: number; seed: number | null }) => {
    if (side === "home") {
      game.homeTeamId = value.teamId;
      game.homeSeed = value.seed;
    } else {
      game.awayTeamId = value.teamId;
      game.awaySeed = value.seed;
    }
  };
  const hold = read(left, a.side);
  write(left, a.side, read(right, b.side));
  write(right, b.side, hold);
  if (left.homeTeamId === left.awayTeamId || right.homeTeamId === right.awayTeamId) {
    throw new Error("A team cannot play itself.");
  }
  return next;
}

export type RainoutOption = {
  date: string;
  time: string;
  locationId: number;
  label: string;
};

export function proposeRainoutSlots(opts: {
  occupied: { locationId: number | null; date: string; time: string }[];
  locationId: number | null;
  locations: { id: number; name?: string }[];
  dates: string[];
  rules?: PackRules | null;
}): RainoutOption[] {
  const clocks = packContextFromRules(opts.rules);
  const taken = new Set(opts.occupied.map((row) => `${row.locationId}|${row.date}|${row.time}`));
  const locs = opts.locations.slice().sort((a, b) => {
    if (a.id === opts.locationId) return -1;
    if (b.id === opts.locationId) return 1;
    return a.id - b.id;
  });
  const out: RainoutOption[] = [];
  for (const date of opts.dates) {
    for (const time of daySlots(date, opts.dates, clocks)) {
      for (const loc of locs) {
        if (taken.has(`${loc.id}|${date}|${time}`)) continue;
        out.push({
          date,
          time,
          locationId: loc.id,
          label: `${formatClock(time)}`,
        });
        if (out.length >= 8) return out;
      }
    }
  }
  return out;
}
