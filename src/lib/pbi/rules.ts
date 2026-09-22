/** Standard travel-ball weekend rules. Directors can change every option. */

export const MIN_BRACKET_TEAMS = 3;

export const ADVANCE_MODES = ["all-reseed", "top-per-pool", "winners-only"] as const;
export type AdvanceMode = (typeof ADVANCE_MODES)[number];

export const ELIMINATION_MODES = ["single", "double"] as const;
export type EliminationMode = (typeof ELIMINATION_MODES)[number];

export const TIEBREAKERS = [
  "record",
  "head-to-head",
  "runs-allowed",
  "run-diff",
  "runs-scored",
  "coin-flip",
] as const;
export type Tiebreaker = (typeof TIEBREAKERS)[number];

export type BracketRules = {
  minTeams: number;
  elimination: EliminationMode;
  advance: AdvanceMode;
  advancePerPool: number;
  consolation: boolean;
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
  timeLimitMinutes: 120,
  mercy: true,
  mercyAfter3: 15,
  mercyAfter4: 10,
  mercyAfter5: 8,
  tiebreakers: [...TIEBREAKERS],
};

export const ADVANCE_LABELS: Record<AdvanceMode, string> = {
  "all-reseed": "All teams · 1st plays last",
  "top-per-pool": "Top N from each pool",
  "winners-only": "Pool winners only",
};

export const ELIMINATION_LABELS: Record<EliminationMode, string> = {
  single: "Single elimination",
  double: "Double elimination",
};

export const TIEBREAKER_LABELS: Record<Tiebreaker, string> = {
  record: "Win-loss record",
  "head-to-head": "Head-to-head (two teams)",
  "runs-allowed": "Fewest runs allowed",
  "run-diff": "Run differential (capped)",
  "runs-scored": "Most runs scored",
  "coin-flip": "Coin flip",
};

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

function isAdvance(value: unknown): value is AdvanceMode {
  return typeof value === "string" && (ADVANCE_MODES as readonly string[]).includes(value);
}

function isElimination(value: unknown): value is EliminationMode {
  return typeof value === "string" && (ELIMINATION_MODES as readonly string[]).includes(value);
}

function isTiebreaker(value: unknown): value is Tiebreaker {
  return typeof value === "string" && (TIEBREAKERS as readonly string[]).includes(value);
}

export function parseBracketRules(value: unknown): BracketRules {
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
  const tiebreakers = [...new Set(listed.length > 0 ? listed : DEFAULT_BRACKET_RULES.tiebreakers)];
  for (const item of TIEBREAKERS) {
    if (!tiebreakers.includes(item)) tiebreakers.push(item);
  }
  return {
    minTeams: asInt(row.minTeams, DEFAULT_BRACKET_RULES.minTeams, MIN_BRACKET_TEAMS, 8),
    elimination: isElimination(row.elimination) ? row.elimination : DEFAULT_BRACKET_RULES.elimination,
    advance: isAdvance(row.advance) ? row.advance : DEFAULT_BRACKET_RULES.advance,
    advancePerPool: asInt(row.advancePerPool, 2, 1, 4),
    consolation: asBool(row.consolation, false),
    homePool: "coin-flip",
    homeBracket: "higher-seed",
    poolTies: asBool(row.poolTies, true),
    championshipNoTimeLimit: asBool(row.championshipNoTimeLimit, true),
    timeLimitMinutes: asInt(row.timeLimitMinutes, 120, 60, 180),
    mercy: asBool(row.mercy, true),
    mercyAfter3: asInt(row.mercyAfter3, 15, 8, 20),
    mercyAfter4: asInt(row.mercyAfter4, 10, 6, 15),
    mercyAfter5: asInt(row.mercyAfter5, 8, 5, 12),
    tiebreakers,
  };
}

export function teamsNeededForBracket(rules: BracketRules, ageMin: number | null): number {
  return Math.max(MIN_BRACKET_TEAMS, rules.minTeams, ageMin ?? 0);
}
