/** Live create-tournament sizing. Sunday 6:00 and 8:00 are choices, not bans. */

import { bracketField, buildGames, type BuiltGame } from "./bracket.ts";

export const PLAN_MIN_TEAMS = 3;
export const PLAN_MAX_TEAMS = 40;
export const PLAN_MAX_FIELDS = 12;
export const PLAN_MAX_DIVISIONS = 4;

export type PlanDays = 2 | 3;

export type SundayLast = "4:00" | "6:00" | "8:00";

export type SizeOption = {
  divisions: number;
  fields: number;
  sunday: SundayLast;
};

const SUNDAY_STARTS: Record<SundayLast, number> = {
  "4:00": 5,
  "6:00": 6,
  "8:00": 7,
};

const waveCache = new Map<string, number>();

/** Rain holds Sunday at 4:00. First days last-start at 8:00. */
export function planStarts(rain: boolean): { saturday: number; sunday: number } {
  return rain ? { saturday: 7, sunday: 5 } : { saturday: 7, sunday: 6 };
}

/** Default clocks. Pass a Sunday time when he chooses to start later than the rain rule. */
export function planClocks(rain: boolean, sunday?: SundayLast): { lastStart: string; lastDayLastStart: string } {
  const lastDay =
    sunday === "8:00" ? "20:00" : sunday === "6:00" ? "18:00" : sunday === "4:00" ? "16:00" : rain ? "16:00" : "18:00";
  return { lastStart: "20:00", lastDayLastStart: lastDay };
}

export function breaksClock(option: SizeOption, rain: boolean): boolean {
  return rain ? option.sunday !== "4:00" : option.sunday !== "6:00";
}

function sundayChoices(rain: boolean): SundayLast[] {
  return rain ? ["4:00", "6:00", "8:00"] : ["6:00", "8:00"];
}

function realPreds(games: BuiltGame[]) {
  const byId = new Map(games.map((game) => [`${game.round}:${game.slot}`, game]));
  const memo = new Map<string, string[]>();
  function walk(id: string): string[] {
    const hit = memo.get(id);
    if (hit) return hit;
    const game = byId.get(id);
    if (!game) return [];
    if (!game.isBye) {
      memo.set(id, [id]);
      return [id];
    }
    const raw: string[] = [];
    if (game.homeFromRound) raw.push(`${game.homeFromRound}:${game.homeFromSlot}`);
    if (game.awayFromRound) raw.push(`${game.awayFromRound}:${game.awayFromSlot}`);
    const out: string[] = [];
    for (const row of raw) if (byId.has(row)) out.push(...walk(row));
    memo.set(id, out);
    return out;
  }
  const preds = new Map<string, string[]>();
  for (const game of games) {
    if (game.isBye) continue;
    const id = `${game.round}:${game.slot}`;
    const raw: string[] = [];
    if (game.homeFromRound) raw.push(`${game.homeFromRound}:${game.homeFromSlot}`);
    if (game.awayFromRound) raw.push(`${game.awayFromRound}:${game.awayFromSlot}`);
    const next: string[] = [];
    for (const row of raw) if (byId.has(row)) next.push(...walk(row));
    preds.set(id, [...new Set(next)]);
  }
  return preds;
}

function bracketWaves(parts: number[], fields: number): number {
  const key = `${parts.join(",")}|${fields}`;
  const cached = waveCache.get(key);
  if (cached != null) return cached;
  const ids: string[] = [];
  const preds = new Map<string, string[]>();
  parts.forEach((count, index) => {
    const local = realPreds(buildGames(bracketField(count, (seed) => seed)));
    for (const [id, rows] of local) {
      const gid = `${index}:${id}`;
      ids.push(gid);
      preds.set(gid, rows.map((row) => `${index}:${row}`));
    }
  });
  const depthOf = new Map<string, number>();
  function depth(id: string): number {
    const hit = depthOf.get(id);
    if (hit != null) return hit;
    let next = 1;
    for (const other of ids) if (preds.get(other)?.includes(id)) next = Math.max(next, 1 + depth(other));
    depthOf.set(id, next);
    return next;
  }
  const start = new Map<string, number>();
  const remaining = new Set(ids);
  let slot = 0;
  let guard = 0;
  while (remaining.size > 0 && guard < 2000) {
    guard += 1;
    const ready = [...remaining].filter((id) => (preds.get(id) ?? []).every((row) => (start.get(row) ?? 99) < slot));
    ready.sort((a, b) => depth(b) - depth(a));
    if (ready.length === 0) {
      slot += 1;
      continue;
    }
    for (const id of ready.slice(0, fields)) {
      start.set(id, slot);
      remaining.delete(id);
    }
    slot += 1;
  }
  const used = start.size > 0 ? Math.max(...start.values()) + 1 : 0;
  waveCache.set(key, used);
  return used;
}

function poolDays(parts: number[], fields: number, saturdayStarts: number): number {
  const maxSize = Math.min(7, saturdayStarts);
  const loads: number[] = [];
  for (const count of parts) {
    const pools = Math.ceil(count / maxSize);
    const base = Math.floor(count / pools);
    const extra = count % pools;
    for (let i = 0; i < pools; i += 1) loads.push(base + (i < extra ? 1 : 0));
  }
  loads.sort((a, b) => b - a);
  const fieldLoad = Array.from({ length: fields }, () => 0);
  for (const games of loads) {
    let best = 0;
    for (let i = 1; i < fields; i += 1) if (fieldLoad[i]! < fieldLoad[best]!) best = i;
    fieldLoad[best] = (fieldLoad[best] ?? 0) + games;
  }
  return Math.ceil(Math.max(...fieldLoad) / saturdayStarts);
}

export function divisionParts(teams: number, divisions: number): number[] | null {
  if (divisions < 1 || divisions > PLAN_MAX_DIVISIONS) return null;
  if (teams < PLAN_MIN_TEAMS || teams > PLAN_MAX_TEAMS) return null;
  const base = Math.floor(teams / divisions);
  const extra = teams % divisions;
  const parts = Array.from({ length: divisions }, (_, index) => base + (index < extra ? 1 : 0));
  if (parts.some((size) => size < PLAN_MIN_TEAMS)) return null;
  return parts;
}

export function fieldsFor(
  teams: number,
  divisions: number,
  days: PlanDays,
  rain: boolean,
  sunday: SundayLast = rain ? "4:00" : "6:00",
): number | null {
  const parts = divisionParts(teams, divisions);
  if (!parts) return null;
  const { saturday } = planStarts(rain);
  const sundayStarts = SUNDAY_STARTS[sunday];
  for (let fields = 1; fields <= PLAN_MAX_FIELDS; fields += 1) {
    const pool = poolDays(parts, fields, saturday);
    const bracket = Math.ceil(bracketWaves(parts, fields) / sundayStarts);
    if (pool + bracket <= days) return fields;
  }
  return null;
}

/** Options that are not beaten by fewer fields, fewer divisions, or an earlier Sunday. */
export function sizeOptions(teams: number, days: PlanDays, rain: boolean): SizeOption[] {
  const all: SizeOption[] = [];
  for (let divisions = 1; divisions <= PLAN_MAX_DIVISIONS; divisions += 1) {
    for (const sunday of sundayChoices(rain)) {
      const fields = fieldsFor(teams, divisions, days, rain, sunday);
      if (fields != null) all.push({ divisions, fields, sunday });
    }
  }
  const kept = all.filter(
    (option) =>
      !all.some(
        (other) =>
          other !== option &&
          other.fields <= option.fields &&
          other.divisions <= option.divisions &&
          SUNDAY_STARTS[other.sunday] <= SUNDAY_STARTS[option.sunday] &&
          (other.fields < option.fields ||
            other.divisions < option.divisions ||
            SUNDAY_STARTS[other.sunday] < SUNDAY_STARTS[option.sunday]),
      ),
  );
  return kept.sort(
    (a, b) =>
      a.fields - b.fields || a.divisions - b.divisions || SUNDAY_STARTS[a.sunday] - SUNDAY_STARTS[b.sunday],
  );
}

export function bestSize(teams: number, days: PlanDays, rain: boolean): SizeOption | null {
  const all = sizeOptions(teams, days, rain);
  return all.find((option) => !breaksClock(option, rain)) ?? all[0] ?? null;
}

export function divisionsOnFields(
  teams: number,
  fields: number,
  days: PlanDays,
  rain: boolean,
): number | null {
  const fits = sizeOptions(teams, days, rain)
    .filter((option) => !breaksClock(option, rain) && option.fields <= fields)
    .sort((a, b) => a.divisions - b.divisions || a.fields - b.fields);
  return fits[0]?.divisions ?? null;
}

/** Mildest broken clock that keeps this team count on these fields. */
export function breakOption(teams: number, fields: number, days: PlanDays, rain: boolean): SizeOption | null {
  const fits = sizeOptions(teams, days, rain)
    .filter((option) => breaksClock(option, rain) && option.fields <= fields)
    .sort(
      (a, b) =>
        SUNDAY_STARTS[a.sunday] - SUNDAY_STARTS[b.sunday] || a.divisions - b.divisions || a.fields - b.fields,
    );
  return fits[0] ?? null;
}

export function maxTeamsOnFields(
  fields: number,
  days: PlanDays,
  rain: boolean,
): { teams: number; divisions: number } | null {
  const parks = Math.min(PLAN_MAX_FIELDS, Math.max(1, fields));
  for (let teams = PLAN_MAX_TEAMS; teams >= PLAN_MIN_TEAMS; teams -= 1) {
    const divisions = divisionsOnFields(teams, parks, days, rain);
    if (divisions != null) return { teams, divisions };
  }
  return null;
}
