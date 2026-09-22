import { defaultDayPlan, parseDayPlan, type DayPlan } from "./weekends.ts";

export const GAME_SLOT_MINUTES = 120;
export const FIRST_PITCH = "08:00";
export const LAST_START = "19:00";

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

export function seedPlacement(size: number): number[] {
  if (size <= 1) return [1];
  const half = seedPlacement(size / 2);
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
  if (round === first && playIns && round !== "f") return "Round 1 (Play-Ins)";
  return roundLabel(round);
}

/** Only the championship shares one field. Early games and semis can run in parallel. */
export function collapseToOneField(round: RoundId, _rounds: RoundId[]): boolean {
  return round === "f";
}

export type SeedSlot = { seed: number; teamId: number | null };

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

function teamAt(slots: SeedSlot[], seed: number): number | null {
  return slots.find((row) => row.seed === seed)?.teamId ?? null;
}

function knownWinner(game: BuiltGame): number | null {
  if (!game.isBye) return null;
  return game.homeTeamId ?? game.awayTeamId;
}

export function buildGames(slots: SeedSlot[]): BuiltGame[] {
  const size = slots.length;
  if (size < 2) return [];
  const rounds = roundsForSize(size);
  const placement = seedPlacement(size);
  const games: BuiltGame[] = [];
  const first = rounds[0];
  if (!first) return [];
  const firstCount = size / 2;
  for (let slot = 0; slot < firstCount; slot += 1) {
    const homeSeed = placement[slot * 2] ?? null;
    const awaySeed = placement[slot * 2 + 1] ?? null;
    const homeTeamId = homeSeed != null ? teamAt(slots, homeSeed) : null;
    const awayTeamId = awaySeed != null ? teamAt(slots, awaySeed) : null;
    games.push({
      round: first,
      slot,
      homeSeed,
      awaySeed,
      homeFromRound: null,
      homeFromSlot: null,
      awayFromRound: null,
      awayFromSlot: null,
      isBye: !(homeTeamId != null && awayTeamId != null),
      homeTeamId,
      awayTeamId,
    });
  }
  for (let r = 1; r < rounds.length; r += 1) {
    const prev = rounds[r - 1];
    const curr = rounds[r];
    const prevGames = games.filter((game) => game.round === prev);
    const count = prevGames.length / 2;
    for (let slot = 0; slot < count; slot += 1) {
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
  return h * 60 + m;
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function daySlots(date: string, dates: string[]): string[] {
  const slots: string[] = [];
  let t = timeToMinutes(FIRST_PITCH);
  const last = date === dates[dates.length - 1] ? timeToMinutes("22:00") : timeToMinutes(LAST_START);
  while (t <= last) {
    slots.push(minutesToTime(t));
    t += GAME_SLOT_MINUTES;
  }
  return slots;
}

function slotAfter(date: string, time: string, dates: string[]): { date: string; time: string } | null {
  const slots = daySlots(date, dates);
  const idx = slots.indexOf(time);
  if (idx >= 0 && idx + 1 < slots.length) return { date, time: slots[idx + 1]! };
  const later = dates.find((row) => row > date);
  if (!later) return null;
  return { date: later, time: FIRST_PITCH };
}

function notBefore(
  date: string,
  time: string,
  min: { date: string; time: string } | null,
): boolean {
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

/**
 * Fill free fields as soon as they open. Same-day park stickiness only —
 * yesterday’s field is not a reason to leave a diamond empty today.
 */
function packGamesOnGrid(
  games: GridGame[],
  locations: LocationRef[],
  dates: string[],
  occupied: Set<string>,
  confirmedMap: Map<string, number>,
  placed: Map<string, GamePlacement>,
  teamDayPark: Map<string, number>,
  collapse: boolean,
): GamePlacement[] {
  const fields = collapse ? locations.slice(0, 1) : locations;
  const out: GamePlacement[] = [];
  if (fields.length === 0 || dates.length === 0) {
    return games.map((game) => ({
      round: game.round,
      slot: game.slot,
      locationId: null,
      startDate: null,
      startTime: null,
    }));
  }

  for (const game of games) {
    const confirmedId = confirmedMap.get(`${game.round}:${game.slot}`);
    const pinned = confirmedId != null ? fields.filter((loc) => loc.id === confirmedId) : fields;
    const useFields = pinned.length > 0 ? pinned : fields;
    let minStart: { date: string; time: string } | null = null;
    for (const feeder of [
      game.homeFromRound != null && game.homeFromSlot != null
        ? placed.get(`${game.homeFromRound}:${game.homeFromSlot}`)
        : null,
      game.awayFromRound != null && game.awayFromSlot != null
        ? placed.get(`${game.awayFromRound}:${game.awayFromSlot}`)
        : null,
    ]) {
      if (!feeder?.startDate || !feeder.startTime) continue;
      const after = slotAfter(feeder.startDate, feeder.startTime, dates);
      if (!after) continue;
      if (!minStart || after.date > minStart.date || (after.date === minStart.date && after.time > minStart.time)) {
        minStart = after;
      }
    }
    let chosen: GamePlacement | null = null;
    outer: for (const date of dates) {
      const prefer: number[] = [];
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

      for (const time of daySlots(date, dates)) {
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
    if (!chosen) {
      const loc = useFields[0]!;
      const date = dates[dates.length - 1]!;
      const slots = daySlots(date, dates);
      chosen = {
        round: game.round,
        slot: game.slot,
        locationId: loc.id,
        startDate: date,
        startTime: slots[slots.length - 1] ?? LAST_START,
      };
    }
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

/** Keep a club on the field when we can so families are not sitting two hours. */
export function orderPoolGamesStayOn<T extends { homeTeamId: number; awayTeamId: number }>(games: T[]): T[] {
  if (games.length <= 1) return games.slice();
  const remaining = games.slice();
  const out: T[] = [];
  out.push(remaining.shift()!);
  while (remaining.length > 0) {
    const last = out[out.length - 1]!;
    const hot = new Set([last.homeTeamId, last.awayTeamId]);
    const idx = remaining.findIndex((game) => hot.has(game.homeTeamId) || hot.has(game.awayTeamId));
    const next = idx >= 0 ? remaining.splice(idx, 1)[0]! : remaining.shift()!;
    out.push(next);
  }
  return out;
}

function packPoolBlocks(
  games: BuiltPoolGame[],
  locations: LocationRef[],
  dates: string[],
  confirmedMap: Map<string, number>,
  occupied: Set<string>,
  teamDayPark: Map<string, number>,
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
        const slots = daySlots(date, dates);
        for (const loc of locs) {
          for (let count = remaining.length - i; count >= 1; count -= 1) {
            const block = consecutiveBlock(occupied, loc.id, date, count, slots);
            if (!block) continue;
            const score =
              -di * 10000 + count * 100 - locLoad(occupied, loc.id) + (loc.id === preferId ? 1 : 0);
            if (!best || score > best.score) best = { loc, date, block, count, score };
            break;
          }
        }
      }
      if (!best) {
        const game = remaining[i]!;
        const loc = locations[0]!;
        const date = dates[dates.length - 1]!;
        const time = daySlots(date, dates).at(-1) ?? LAST_START;
        out.push({
          round: game.round,
          slot: game.slot,
          locationId: loc.id,
          startDate: date,
          startTime: time,
        });
        occupied.add(occKey(loc.id, date, time));
        rememberTeams(teamDayPark, date, loc.id, game.homeTeamId, game.awayTeamId);
        parkOnDate.set(date, loc.id);
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

export function packSchedule(opts: {
  games: BuiltGame[];
  poolGames?: BuiltPoolGame[];
  locations: LocationRef[];
  startDate: string;
  endDate: string;
  confirmed: { round: string; slot: number; locationId: number }[];
  dayPlan?: DayPlan[];
}): GamePlacement[] {
  const roundList = roundsForSize(
    opts.games.some((g) => g.round === "r64")
      ? 64
      : opts.games.some((g) => g.round === "r32")
        ? 32
        : opts.games.some((g) => g.round === "r16")
          ? 16
          : opts.games.some((g) => g.round === "qf")
            ? 8
            : opts.games.some((g) => g.round === "sf")
              ? 4
              : 2,
  );
  const confirmedMap = new Map(opts.confirmed.map((row) => [`${row.round}:${row.slot}`, row.locationId]));
  const locations = opts.locations;
  const out: GamePlacement[] = [];
  const hasPoolGames = (opts.poolGames?.length ?? 0) > 0;
  const plan =
    opts.dayPlan && opts.dayPlan.length > 0
      ? parseDayPlan(opts.dayPlan, opts.startDate, opts.endDate, true)
      : hasPoolGames
        ? defaultDayPlan(opts.startDate, opts.endDate)
        : parseDayPlan([], opts.startDate, opts.endDate, false);
  const poolDates = plan.filter((row) => row.kind === "pool" || row.kind === "mixed").map((row) => row.date);
  const bracketDates = plan.filter((row) => row.kind === "bracket" || row.kind === "mixed").map((row) => row.date);
  const lastDay = plan[plan.length - 1]?.date ?? opts.endDate;
  const bracketWindow = bracketDates.length > 0 ? bracketDates : [lastDay];
  const occupied = new Set<string>();
  const placed = new Map<string, GamePlacement>();
  const teamDayPark = new Map<string, number>();

  const pool = [...(opts.poolGames ?? [])].sort((a, b) => a.slot - b.slot);
  if (pool.length > 0 && poolDates.length > 0) {
    out.push(...packPoolBlocks(pool, locations, poolDates, confirmedMap, occupied, teamDayPark));
  }

  for (const round of roundList) {
    const real = opts.games.filter((game) => game.round === round && !game.isBye);
    if (real.length === 0) continue;
    const collapse = collapseToOneField(round, roundList);
    out.push(
      ...packGamesOnGrid(real, locations, bracketWindow, occupied, confirmedMap, placed, teamDayPark, collapse),
    );
  }

  for (const game of opts.games) {
    if (out.some((row) => row.round === game.round && row.slot === game.slot)) continue;
    out.push({
      round: game.round,
      slot: game.slot,
      locationId: null,
      startDate: null,
      startTime: null,
    });
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
};

export type SiteBracketLayout<T> = {
  rounds: { round: string; label?: string; slots: SiteBracketSlot<T>[] }[];
  rowCount: number;
};

function roundSlotKey(round: string, slot: number): string {
  return `${round}:${slot}`;
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
    const node: Node = { key, game, ghost, childKeys: [], rowStart: 1, rowSpan: 1 };
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
  games: { round: string; slot: number; isBye: boolean }[],
): Map<string, number> {
  const map = new Map<string, number>();
  let n = 0;
  const pool = games
    .filter((game) => game.round === POOL_ROUND && !game.isBye)
    .slice()
    .sort((a, b) => a.slot - b.slot);
  for (const game of pool) {
    n += 1;
    map.set(`${game.round}:${game.slot}`, n);
  }
  for (const round of ROUND_IDS) {
    const list = games
      .filter((game) => game.round === round && !game.isBye)
      .slice()
      .sort((a, b) => a.slot - b.slot);
    for (const game of list) {
      n += 1;
      map.set(`${game.round}:${game.slot}`, n);
    }
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

/** Prefer pools of 4, then 3. n=5 is one pool so everyone still plays twice. */
export function poolSizes(n: number): number[] {
  if (n < 2) return [];
  if (n === 2) return [2];
  if (n === 5) return [5];
  const fours = Math.floor(n / 4);
  const rem = n % 4;
  if (rem === 0) return Array.from({ length: fours }, () => 4);
  if (rem === 3) return [...Array.from({ length: fours }, () => 4), 3];
  if (rem === 2) return [...Array.from({ length: fours - 1 }, () => 4), 3, 3];
  return [...Array.from({ length: fours - 2 }, () => 4), 3, 3, 3];
}

/** Index pairs inside a pool. Each team plays two except a leftover pair of 2. */
export function poolPairings(size: number): [number, number][] {
  if (size <= 1) return [];
  if (size === 2) return [[0, 1]];
  if (size === 3)
    return [
      [0, 1],
      [0, 2],
      [1, 2],
    ];
  if (size === 4)
    return [
      [0, 3],
      [1, 2],
      [0, 2],
      [1, 3],
    ];
  const pairs: [number, number][] = [];
  for (let i = 0; i < size; i += 1) pairs.push([i, (i + 1) % size]);
  return pairs;
}

export type BuiltPool = {
  poolIndex: number;
  teamIds: number[];
  games: BuiltPoolGame[];
};

export function buildPools(slots: SeedSlot[]): BuiltPool[] {
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
