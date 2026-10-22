/** Shared capacity math. Slot is start-to-start. Game length is the time limit only. */

export const DIVISION_CAP = 12;
export const DEFAULT_GAME_LENGTH_MIN = 105;
export const DEFAULT_SLOT_MIN = 120;
export const DEFAULT_POOL_FIRST = "08:00";
export const DEFAULT_POOL_LAST = "18:00";
export const DEFAULT_POOL_RAIN = "20:00";
export const DEFAULT_BRACKET_FIRST = "08:00";
export const DEFAULT_BRACKET_LAST = "16:00";
export const DEFAULT_BRACKET_RAIN = "18:00";
export const DEFAULT_MAX_PER_FIELD = 7;

export const EVENT_FORMATS = ["bracket-only", "pool-then-bracket"] as const;
export type EventFormat = (typeof EVENT_FORMATS)[number];

export type CapacityClock = {
  gameLengthMin?: number;
  slotMin?: number;
  poolFirstPitch?: string;
  poolLastMustPlay?: string;
  poolRainDelay?: string;
  bracketFirstPitch?: string;
  bracketLastMustPlay?: string;
  bracketRainDelay?: string;
  maxPerField?: number;
};

export type CapacityInput = CapacityClock & {
  teams: number;
  fields: number;
  days: number;
  format: EventFormat;
  rain: boolean;
  advance?: "all-reseed" | "top-per-pool";
  advancePerPool?: number;
};

export type CapacityReport = {
  fit: boolean;
  reasons: string[];
  maxTeams: number;
  poolGames: number;
  bracketGames: number;
  divisions: number[];
  poolStarts: string[];
  bracketStarts: string[];
  poolCapacity: number;
  bracketCapacity: number;
};

function minutes(clock: string): number {
  const match = /^(\d{1,2}):(\d{2})/.exec(clock);
  if (!match) return 8 * 60;
  return Number(match[1]) * 60 + Number(match[2]);
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Inclusive starts from first through last, stepping by slot minutes. */
export function clockStarts(first: string, last: string, slotMin: number): string[] {
  const step = Math.max(15, slotMin);
  const end = minutes(last);
  const out: string[] = [];
  for (let t = minutes(first); t <= end; t += step) out.push(fromMinutes(t));
  return out;
}

export function poolStarts(input: CapacityClock = {}): string[] {
  return clockStarts(
    input.poolFirstPitch || DEFAULT_POOL_FIRST,
    input.poolLastMustPlay || DEFAULT_POOL_LAST,
    input.slotMin ?? DEFAULT_SLOT_MIN,
  );
}

/** Must-play starts, plus the rain-delay start only when the buffer is off. */
export function bracketStarts(input: CapacityClock & { rain?: boolean } = {}): string[] {
  const base = clockStarts(
    input.bracketFirstPitch || DEFAULT_BRACKET_FIRST,
    input.bracketLastMustPlay || DEFAULT_BRACKET_LAST,
    input.slotMin ?? DEFAULT_SLOT_MIN,
  );
  if (input.rain) return base;
  const rain = input.bracketRainDelay || DEFAULT_BRACKET_RAIN;
  if (!base.includes(rain)) base.push(rain);
  return [...new Set(base)].sort();
}

/** Sunday 6:00 stays the last game. 8:00 is the rain buffer only when a bracket up to 36 does not fit. */
export const SUNDAY_LATE_LAST = "18:00";
export const SUNDAY_LATE_RAIN = "20:00";
export const SUNDAY_LATE_MAX_TEAMS = 36;

export function bracketClockForFit(input: CapacityInput): {
  bracketLastMustPlay: string;
  bracketRainDelay: string;
  late: boolean;
} {
  const preferred = {
    bracketLastMustPlay: input.bracketLastMustPlay || DEFAULT_BRACKET_LAST,
    bracketRainDelay: input.bracketRainDelay || DEFAULT_BRACKET_RAIN,
    late: false,
  };
  if (input.teams < 2 || input.teams > SUNDAY_LATE_MAX_TEAMS || assessCapacity(input).fit) return preferred;
  const late = {
    ...input,
    bracketLastMustPlay: SUNDAY_LATE_LAST,
    bracketRainDelay: SUNDAY_LATE_RAIN,
  };
  if (!assessCapacity(late).fit) return preferred;
  return { bracketLastMustPlay: SUNDAY_LATE_LAST, bracketRainDelay: SUNDAY_LATE_RAIN, late: true };
}

/** Balanced pieces of at most 12. 19 → 10+9, 20 → 10+10, 36 → 12+12+12. */
export function splitDivisions(teams: number, cap = DIVISION_CAP): number[] {
  const n = Math.max(0, Math.trunc(teams));
  if (n === 0) return [];
  if (n <= cap) return [n];
  const count = Math.ceil(n / cap);
  const base = Math.floor(n / count);
  const extra = n % count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
}

const DIVISION_NAMES = ["Gold", "Silver", "Bronze", "Copper"];

export function divisionName(index: number): string {
  return DIVISION_NAMES[index] || `Division ${index + 1}`;
}

export function namedDivisions(
  teams: number,
  current: { name: string; size: number }[] = [],
): { name: string; size: number }[] {
  return splitDivisions(teams).map((size, i) => ({
    name: current[i]?.name || divisionName(i),
    size,
  }));
}

/** Disjoint field indexes. 2 divisions on 4 fields → [0,1] and [2,3]. */
export function fieldGroups(divisionCount: number, fieldCount: number): number[][] {
  const divisions = Math.max(1, divisionCount);
  const fields = Math.max(1, fieldCount);
  const base = Math.floor(fields / divisions);
  const extra = fields % divisions;
  let cursor = 0;
  const groups: number[][] = [];
  for (let i = 0; i < divisions; i += 1) {
    const count = Math.max(1, base + (i < extra ? 1 : 0));
    const group: number[] = [];
    for (let n = 0; n < count && cursor < fields; n += 1) group.push(cursor++);
    if (group.length === 0) group.push(i % fields);
    groups.push(group);
  }
  return groups;
}

function dayLoads(days: number, format: EventFormat): { poolDays: number; bracketDays: number } {
  const count = Math.max(1, Math.trunc(days));
  if (format === "bracket-only") return { poolDays: 0, bracketDays: count };
  if (count === 1) return { poolDays: 1, bracketDays: 1 };
  return { poolDays: 1, bracketDays: count - 1 };
}

function bracketEntrants(input: CapacityInput): number {
  if (input.format === "bracket-only" || input.advance !== "top-per-pool") return input.teams;
  const perField = input.maxPerField ?? DEFAULT_MAX_PER_FIELD;
  const pools = Math.max(1, Math.ceil(input.teams / Math.max(1, perField)));
  const per = Math.min(4, Math.max(1, input.advancePerPool ?? 2));
  return Math.max(2, Math.min(input.teams, pools * per));
}

export function gamesFor(input: CapacityInput): { poolGames: number; bracketGames: number; divisions: number[] } {
  const divisions = splitDivisions(input.teams);
  const poolGames = input.format === "pool-then-bracket" ? input.teams : 0;
  const entrants = bracketEntrants(input);
  const bracketDivisions = splitDivisions(entrants);
  const bracketGames = bracketDivisions.reduce((sum, size) => sum + Math.max(0, size - 1), 0);
  return { poolGames, bracketGames, divisions };
}

export function assessCapacity(input: CapacityInput): Omit<CapacityReport, "maxTeams"> {
  const fields = Math.max(0, Math.trunc(input.fields));
  const teams = Math.max(0, Math.trunc(input.teams));
  const poolList = poolStarts(input);
  const bracketList = bracketStarts({ ...input, rain: input.rain });
  const loads = dayLoads(input.days, input.format);
  const poolCapacity = fields * poolList.length * loads.poolDays;
  const bracketCapacity = fields * bracketList.length * loads.bracketDays;
  const games = gamesFor({ ...input, teams, fields });
  const reasons: string[] = [];
  const perField = input.maxPerField ?? DEFAULT_MAX_PER_FIELD;
  if (teams < 2) reasons.push("Need at least 2 teams.");
  if (fields < 1) reasons.push("Need at least 1 field.");
  if (input.format === "pool-then-bracket" && teams > fields * perField) {
    reasons.push(`${teams} teams is more than ${perField} per field.`);
  }
  if (games.poolGames > poolCapacity) reasons.push("Pool games do not fit the must-play slots.");
  if (games.bracketGames > bracketCapacity) reasons.push("Bracket games do not fit the must-play slots.");
  return {
    fit: reasons.length === 0,
    reasons,
    poolGames: games.poolGames,
    bracketGames: games.bracketGames,
    divisions: games.divisions,
    poolStarts: poolList,
    bracketStarts: bracketList,
    poolCapacity,
    bracketCapacity,
  };
}

export function maxTeamsFor(input: Omit<CapacityInput, "teams">, ceiling = 80): number {
  let best = 0;
  for (let teams = 2; teams <= ceiling; teams += 1) {
    if (assessCapacity({ ...input, teams }).fit) best = teams;
  }
  return best;
}

export function capacityReport(input: CapacityInput): CapacityReport {
  const assessed = assessCapacity(input);
  return { ...assessed, maxTeams: maxTeamsFor(input) };
}
