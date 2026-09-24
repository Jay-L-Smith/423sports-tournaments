/** 423Sports weekend rules. Directors can see and change every locked option. */

export const MIN_BRACKET_TEAMS = 3;

export const ADVANCE_MODES = ["all-reseed", "top-per-pool"] as const;
export type AdvanceMode = (typeof ADVANCE_MODES)[number];

export const ELIMINATION_MODES = ["single"] as const;
export type EliminationMode = (typeof ELIMINATION_MODES)[number];

export const TIEBREAKERS = [
  "record",
  "runs-scored",
  "run-diff",
  "runs-allowed",
  "head-to-head",
  "coin-flip",
] as const;
export type Tiebreaker = (typeof TIEBREAKERS)[number];

/** Wins, runs, head-to-head, then a coin. Head-to-head stays in the list so it can be moved. */
export const DEFAULT_TIEBREAKER_ORDER: Tiebreaker[] = [
  "record",
  "runs-scored",
  "run-diff",
  "runs-allowed",
  "head-to-head",
  "coin-flip",
];

export const DIVISION_NAMES = ["Gold", "Silver", "Bronze", "Copper"] as const;
export type DivisionCut = { name: string; size: number };

export type BracketRules = {
  minTeams: number;
  elimination: EliminationMode;
  advance: AdvanceMode;
  advancePerPool: number;
  consolation: false;
  homePool: "coin-flip";
  homeBracket: "higher-seed";
  poolTies: boolean;
  championshipNoTimeLimit: boolean;
  timeLimitMinutes: number;
  mercy: boolean;
  mercyAfter3: number;
  mercyAfter4: number;
  mercyAfter5: number;
  tiebreakers: Tiebreaker[];
  poolGamesPerTeam: number;
  softFill: boolean;
  firstPitch: string;
  slotMinutes: number;
  lastStart: string;
  lastDayLastStart: string;
  championshipCollapse: boolean;
  packStayOnPark: boolean;
  packFillFields: boolean;
  packSeed1vsLast: boolean;
  packDayFilter: boolean;
  divisions: DivisionCut[];
  rainDelay: boolean;
  eventDays: 2 | 3;
  fieldCount: number;
};

export const DEFAULT_BRACKET_RULES: BracketRules = {
  minTeams: MIN_BRACKET_TEAMS,
  elimination: "single",
  advance: "all-reseed",
  advancePerPool: 2,
  consolation: false,
  homePool: "coin-flip",
  homeBracket: "higher-seed",
  poolTies: true,
  championshipNoTimeLimit: true,
  timeLimitMinutes: 105,
  mercy: true,
  mercyAfter3: 15,
  mercyAfter4: 10,
  mercyAfter5: 8,
  tiebreakers: [...DEFAULT_TIEBREAKER_ORDER],
  poolGamesPerTeam: 2,
  softFill: true,
  firstPitch: "08:00",
  slotMinutes: 120,
  lastStart: "20:00",
  lastDayLastStart: "22:00",
  championshipCollapse: true,
  packStayOnPark: true,
  packFillFields: true,
  packSeed1vsLast: true,
  packDayFilter: true,
  divisions: [{ name: "Gold", size: 40 }],
  rainDelay: false,
  eventDays: 2,
  fieldCount: 0,
};

export const ADVANCE_LABELS: Record<AdvanceMode, string> = {
  "all-reseed": "All teams (reseed)",
  "top-per-pool": "Top N from each pool",
};

export const ELIMINATION_LABELS: Record<EliminationMode, string> = {
  single: "Single elimination",
};

export const TIEBREAKER_LABELS: Record<Tiebreaker, string> = {
  record: "Win/Loss",
  "runs-scored": "Runs scored",
  "run-diff": "Run differential",
  "runs-allowed": "Runs allowed",
  "head-to-head": "Head-to-head (two teams)",
  "coin-flip": "Coin flip",
};

export const POOL_REGEN_BLOCKED =
  "A bracket already exists. Clear the bracket first before regenerating pool games.";

function asInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isInteger(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function asBool(value: unknown, fallback: boolean): boolean {
  if (value === true || value === 1 || value === "1" || value === "true" || value === "on") return true;
  if (value === false || value === 0 || value === "0" || value === "false" || value === "off") return false;
  return fallback;
}

function asClock(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  const hour = Number.parseInt(match[1] ?? "", 10);
  const minute = Number.parseInt(match[2] ?? "", 10);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour > 23 || minute > 59) return fallback;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function isAdvance(value: unknown): value is AdvanceMode {
  return typeof value === "string" && (ADVANCE_MODES as readonly string[]).includes(value);
}

function isTiebreaker(value: unknown): value is Tiebreaker {
  return typeof value === "string" && (TIEBREAKERS as readonly string[]).includes(value);
}

export function defaultDivisions(maxTeams: number): DivisionCut[] {
  return [{ name: "Gold", size: Math.max(MIN_BRACKET_TEAMS, maxTeams) }];
}

export function parseDivisions(value: unknown, maxTeams = 40): DivisionCut[] {
  if (!Array.isArray(value) || value.length === 0) return defaultDivisions(maxTeams);
  const out: DivisionCut[] = [];
  for (let i = 0; i < value.length && i < DIVISION_NAMES.length; i += 1) {
    const row = value[i];
    if (!row || typeof row !== "object") continue;
    const rec = row as { name?: unknown; size?: unknown };
    const fallback = DIVISION_NAMES[i] ?? `Division ${i + 1}`;
    const name =
      typeof rec.name === "string" && rec.name.trim().length > 0 ? rec.name.trim().slice(0, 24) : fallback;
    const size = asInt(rec.size, 0, 1, 40);
    if (size < 1) continue;
    out.push({ name, size });
  }
  return out.length > 0 ? out : defaultDivisions(maxTeams);
}

/** One division auto-resizes with max teams. Multiple cuts must sum to max. */
export function normalizeDivisions(value: unknown, maxTeams: number): DivisionCut[] {
  const cuts = parseDivisions(value, maxTeams);
  if (cuts.length <= 1) return defaultDivisions(maxTeams);
  const sum = cuts.reduce((n, row) => n + row.size, 0);
  if (sum !== maxTeams) {
    throw new Error(`Division cuts must add up to ${maxTeams} teams (now ${sum}).`);
  }
  return cuts;
}

export function setDivisionCount(current: DivisionCut[], count: number, maxTeams: number): DivisionCut[] {
  const n = Math.min(DIVISION_NAMES.length, Math.max(1, count));
  if (n === 1) return defaultDivisions(maxTeams);
  const sizes = Array.from({ length: n }, () => Math.floor(maxTeams / n));
  for (let i = 0; i < maxTeams % n; i += 1) sizes[i] += 1;
  return sizes.map((size, i) => ({
    name: current[i]?.name || DIVISION_NAMES[i] || `Division ${i + 1}`,
    size,
  }));
}

export function parseBracketRules(value: unknown, maxTeams = 40): BracketRules {
  let raw: unknown = value;
  if (typeof value === "string") {
    try {
      raw = JSON.parse(value);
    } catch {
      raw = {};
    }
  }
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const listed = Array.isArray(row.tiebreakers) ? row.tiebreakers.filter(isTiebreaker) : [];
  const tiebreakers = [...new Set(listed.length > 0 ? listed : DEFAULT_TIEBREAKER_ORDER)];
  if (!tiebreakers.includes("head-to-head")) {
    const coin = tiebreakers.indexOf("coin-flip");
    if (coin >= 0) tiebreakers.splice(coin, 0, "head-to-head");
    else tiebreakers.push("head-to-head");
  }
  if (tiebreakers.length === 0) tiebreakers.push(...DEFAULT_TIEBREAKER_ORDER);
  let divisions: DivisionCut[];
  try {
    divisions = normalizeDivisions(row.divisions, maxTeams);
  } catch {
    divisions = parseDivisions(row.divisions, maxTeams);
  }
  return {
    minTeams: asInt(row.minTeams, DEFAULT_BRACKET_RULES.minTeams, MIN_BRACKET_TEAMS, 8),
    elimination: "single",
    advance: isAdvance(row.advance) ? row.advance : DEFAULT_BRACKET_RULES.advance,
    advancePerPool: asInt(row.advancePerPool, 2, 1, 4),
    consolation: false,
    homePool: "coin-flip",
    homeBracket: "higher-seed",
    poolTies: asBool(row.poolTies, true),
    championshipNoTimeLimit: asBool(row.championshipNoTimeLimit, true),
    timeLimitMinutes: asInt(row.timeLimitMinutes, 105, 30, 240),
    mercy: true,
    mercyAfter3: asInt(row.mercyAfter3, 15, 1, 99),
    mercyAfter4: asInt(row.mercyAfter4, 10, 1, 99),
    mercyAfter5: asInt(row.mercyAfter5, 8, 1, 99),
    tiebreakers,
    poolGamesPerTeam: asInt(row.poolGamesPerTeam, 2, 1, 6),
    softFill: true,
    firstPitch: asClock(row.firstPitch, DEFAULT_BRACKET_RULES.firstPitch),
    slotMinutes: asInt(row.slotMinutes, 120, 15, 240),
    lastStart: asClock(row.lastStart, "20:00"),
    lastDayLastStart: asClock(row.lastDayLastStart, DEFAULT_BRACKET_RULES.lastDayLastStart),
    championshipCollapse: true,
    packStayOnPark: true,
    packFillFields: true,
    packSeed1vsLast: true,
    packDayFilter: true,
    divisions,
    rainDelay: asBool(row.rainDelay, false),
    eventDays: asInt(row.eventDays, 2, 2, 3) === 3 ? 3 : 2,
    fieldCount: asInt(row.fieldCount, 0, 0, 12),
  };
}

export function teamsNeededForBracket(rules: BracketRules, ageMin: number | null): number {
  return Math.max(MIN_BRACKET_TEAMS, rules.minTeams, ageMin ?? 0);
}

export function moveTiebreaker(list: Tiebreaker[], index: number, dir: -1 | 1): Tiebreaker[] {
  const next = list.slice();
  const swap = index + dir;
  if (index < 0 || index >= next.length || swap < 0 || swap >= next.length) return next;
  const hold = next[index]!;
  next[index] = next[swap]!;
  next[swap] = hold;
  return next;
}

export function addTiebreaker(list: Tiebreaker[], item: Tiebreaker): Tiebreaker[] {
  if (list.includes(item)) return list.slice();
  const next = list.slice();
  const coin = next.indexOf("coin-flip");
  if (coin >= 0) next.splice(coin, 0, item);
  else next.push(item);
  return next;
}

export function removeTiebreaker(list: Tiebreaker[], item: Tiebreaker): Tiebreaker[] {
  if (list.length <= 1) return list.slice();
  if (item === "coin-flip") return list.slice();
  return list.filter((row) => row !== item);
}

export function hasPlayableBracket(games: { round: string; isBye?: boolean }[]): boolean {
  return games.some((game) => game.round !== "pool" && !game.isBye);
}

export function hasBracketShell(games: { round: string }[]): boolean {
  return games.some((game) => game.round !== "pool");
}

export type ReadyCheckTo =
  | "/weekends/$weekendId/edit"
  | "/weekends/$weekendId/teams"
  | "/weekends/$weekendId/locations"
  | "/bracket/$weekendId";

export type ReadyCheck = { id: string; ok: boolean; label: string; to: ReadyCheckTo };

export function poolScheduleChecks(input: {
  ageGroups: string[];
  approvedByAge: Record<string, number>;
  locationCount: number;
  minTeams: number;
  hasBracket: boolean;
}): { ready: boolean; items: ReadyCheck[] } {
  const minTeams = Math.max(MIN_BRACKET_TEAMS, input.minTeams);
  const items: ReadyCheck[] = [];
  items.push({
    id: "ages",
    ok: input.ageGroups.length > 0,
    to: "/weekends/$weekendId/edit",
    label:
      input.ageGroups.length > 0
        ? `Age groups: ${input.ageGroups.join(", ")}`
        : "Pick at least one age group",
  });

  const readyAges = input.ageGroups.filter((age) => (input.approvedByAge[age] ?? 0) >= minTeams);
  if (input.ageGroups.length === 0) {
    items.push({
      id: "teams",
      ok: false,
      to: "/weekends/$weekendId/teams",
      label: `Approve at least ${minTeams} teams in an age`,
    });
  } else if (readyAges.length === 0) {
    const bits = input.ageGroups.map((age) => `${age} ${input.approvedByAge[age] ?? 0}/${minTeams}`);
    items.push({
      id: "teams",
      ok: false,
      to: "/weekends/$weekendId/teams",
      label: `Need ${minTeams} approved teams in an age (${bits.join(" · ")})`,
    });
  } else {
    items.push({
      id: "teams",
      ok: true,
      to: "/weekends/$weekendId/teams",
      label: `Approved teams ready: ${readyAges
        .map((age) => `${age} ${input.approvedByAge[age]}`)
        .join(" · ")}`,
    });
  }

  items.push({
    id: "parks",
    ok: input.locationCount > 0,
    to: "/weekends/$weekendId/locations",
    label:
      input.locationCount > 0
        ? `Parks: ${input.locationCount}`
        : "Add at least one park before generating",
  });

  if (input.hasBracket) {
    items.push({
      id: "bracket",
      ok: false,
      to: "/bracket/$weekendId",
      label: POOL_REGEN_BLOCKED,
    });
  }

  return { ready: items.every((row) => row.ok), items };
}

export function poolScheduleBlockReason(checks: { ready: boolean; items: ReadyCheck[] }): string | null {
  if (checks.ready) return null;
  const missing = checks.items.filter((row) => !row.ok).map((row) => row.label);
  return `Can’t generate yet:\n${missing.map((row) => `• ${row}`).join("\n")}`;
}
