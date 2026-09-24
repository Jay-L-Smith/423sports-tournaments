import { normalizeDivisions, parseBracketRules, type BracketRules } from "./rules.ts";


export const AGE_GROUPS = [
  "8U",
  "9U",
  "10U",
  "11U",
  "12U",
  "13U",
  "14U",
  "15U",
  "16U",
  "17U",
] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number];

export const MAX_TOURNAMENT_TEAMS = 40;
export const DEFAULT_TOURNAMENT_TEAMS = 10;
export const DEFAULT_AGE_MIN_TEAMS = 3;

export const TEAM_STATUSES = ["pending", "approved", "denied"] as const;
export type TeamStatus = (typeof TEAM_STATUSES)[number];

export function isTeamStatus(value: string): value is TeamStatus {
  return (TEAM_STATUSES as readonly string[]).includes(value);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isAgeGroup(value: string): value is AgeGroup {
  return (AGE_GROUPS as readonly string[]).includes(value);
}

export function isIsoDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function isoDateFromLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Last day to add a team is the day before the tournament. A scored game closes it early. */
export function teamEntryClosed(opts: { startDate: string; today: string; scored?: boolean }): string | null {
  if (opts.today >= opts.startDate) {
    return "New teams close the day before the tournament starts.";
  }
  if (opts.scored) {
    return "New teams close once a game has a score.";
  }
  return null;
}

/** The sheet locks itself 72 hours before first pitch. A director can lock earlier or unlock. */
export const SHEET_LOCK_MS = 72 * 60 * 60 * 1000;
export type SheetLock = "auto" | "on" | "off";

export function parseSheetLock(value: unknown): SheetLock {
  return value === "on" || value === "off" ? value : "auto";
}

export function firstPitchAt(startDate: string, firstPitch: string): Date | null {
  if (!isIsoDate(startDate)) return null;
  const [y, m, d] = startDate.split("-").map(Number);
  const match = /^(\d{1,2}):(\d{2})/.exec(firstPitch || "");
  const hh = match ? Number(match[1]) : 8;
  const mm = match ? Number(match[2]) : 0;
  if (hh > 23 || mm > 59) return null;
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export function sheetIsLocked(opts: {
  lock: SheetLock;
  startDate: string;
  firstPitch: string;
  now?: Date;
}): boolean {
  if (opts.lock === "on") return true;
  if (opts.lock === "off") return false;
  const start = firstPitchAt(opts.startDate, opts.firstPitch);
  if (!start) return false;
  const now = opts.now ?? new Date();
  return now.getTime() >= start.getTime() - SHEET_LOCK_MS;
}

export function beforeFirstPitch(startDate: string, firstPitch: string, now = new Date()): boolean {
  const start = firstPitchAt(startDate, firstPitch);
  if (!start) return false;
  return now.getTime() < start.getTime();
}

export function defaultWeekendDates(now = new Date()): { startDate: string; endDate: string } {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  const day = d.getDay();
  const daysUntilSat = (6 - day + 7) % 7;
  d.setDate(d.getDate() + daysUntilSat);
  const end = new Date(d);
  end.setDate(d.getDate() + 1);
  return { startDate: isoDateFromLocal(d), endDate: isoDateFromLocal(end) };
}

function parseLocalIso(iso: string): Date | null {
  if (!isIsoDate(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const dt = parseLocalIso(iso);
  if (!dt) return iso;
  dt.setDate(dt.getDate() + days);
  return isoDateFromLocal(dt);
}

export function formatWeekendRange(start: string, end: string): string {
  const s = parseLocalIso(start);
  const e = parseLocalIso(end);
  if (!s || !e) return `${start} – ${end}`;
  if (start === end) {
    return s.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  const sameMonth = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth();
  if (sameMonth) {
    const month = s.toLocaleDateString("en-US", { month: "short" });
    return `${month} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
  }
  const left = s.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const right = e.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${left} – ${right}`;
}

export function formatAgeGroups(groups: string[]): string {
  return groups.join(" · ");
}

export const DAY_KINDS = ["pool", "mixed", "bracket"] as const;
export type DayKind = (typeof DAY_KINDS)[number];

export type DayPlan = {
  date: string;
  kind: DayKind;
};

export function isDayKind(value: unknown): value is DayKind {
  return typeof value === "string" && (DAY_KINDS as readonly string[]).includes(value);
}

export function eachIsoDate(start: string, end: string): string[] {
  if (!isIsoDate(start) || !isIsoDate(end) || end < start) return [];
  const out: string[] = [];
  let cur = start;
  let guard = 0;
  while (cur <= end && guard < 31) {
    out.push(cur);
    const [y, m, d] = cur.split("-").map(Number);
    cur = isoDateFromLocal(new Date(y, m - 1, d + 1));
    guard += 1;
  }
  return out;
}

/** 1 day mixed; 2 days pool then bracket; 3+ first pool, middle mixed, last bracket. */
export function defaultDayPlan(startDate: string, endDate: string): DayPlan[] {
  const dates = eachIsoDate(startDate, endDate);
  if (dates.length === 0) return [];
  if (dates.length === 1) return [{ date: dates[0]!, kind: "mixed" }];
  if (dates.length === 2) {
    return [
      { date: dates[0]!, kind: "pool" },
      { date: dates[1]!, kind: "bracket" },
    ];
  }
  return dates.map((date, i) => {
    if (i === 0) return { date, kind: "pool" as const };
    if (i === dates.length - 1) return { date, kind: "bracket" as const };
    return { date, kind: "mixed" as const };
  });
}

export function parseDayPlan(
  value: unknown,
  startDate: string,
  endDate: string,
  poolPlay = true,
): DayPlan[] {
  const dates = eachIsoDate(startDate, endDate);
  const fallback = poolPlay
    ? defaultDayPlan(startDate, endDate)
    : dates.map((date) => ({ date, kind: "bracket" as const }));
  let rows: unknown = value;
  if (typeof value === "string") {
    try {
      rows = JSON.parse(value);
    } catch {
      rows = [];
    }
  }
  const byDate = new Map<string, DayKind>();
  if (Array.isArray(rows)) {
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const rec = row as { date?: unknown; kind?: unknown };
      if (typeof rec.date !== "string" || !isIsoDate(rec.date) || !isDayKind(rec.kind)) continue;
      byDate.set(rec.date, rec.kind);
    }
  }
  if (byDate.size === 0) return fallback;
  const plan = dates.map((date, i) => ({
    date,
    kind: byDate.get(date) ?? fallback[i]?.kind ?? "bracket",
  }));
  // Two-day weekends stay Saturday pool, Sunday bracket. A mixed first day
  // puts pool games on the same sheet as the bracket.
  if (
    poolPlay &&
    plan.length === 2 &&
    plan[0]?.kind === "mixed" &&
    plan[1]?.kind === "bracket"
  ) {
    return [{ date: plan[0].date, kind: "pool" }, plan[1]];
  }
  return plan;
}

export function hasPoolDays(plan: DayPlan[]): boolean {
  return plan.some((row) => row.kind === "pool" || row.kind === "mixed");
}

export function formatDayTab(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (y == null || m == null || d == null) return iso;
  const dt = new Date(y, m - 1, d);
  const weekday = dt.toLocaleDateString("en-US", { weekday: "short" });
  const month = dt.toLocaleDateString("en-US", { month: "short" });
  return `${weekday} · ${month} ${dt.getDate()}`;
}

export function dayKindLabel(kind: DayKind): string {
  if (kind === "pool") return "Pool play";
  if (kind === "mixed") return "Pool + bracket";
  return "Bracket play";
}

export type WeekendInput = {
  name: string;
  startDate: string;
  endDate: string;
  ageGroups: AgeGroup[];
  maxTeams: number;
  poolPlay: boolean;
  dayPlan: DayPlan[];
  rules: BracketRules;
};

export function parsePoolPlay(value: unknown): boolean {
  if (value === true || value === 1 || value === "1" || value === "true" || value === "on") return true;
  if (value === false || value === 0 || value === "0" || value === "false" || value === "off") return false;
  return false;
}

export function parseWeekendInput(data: {
  name?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  ageGroups?: unknown;
  maxTeams?: unknown;
  poolPlay?: unknown;
  dayPlan?: unknown;
  rules?: unknown;
}): WeekendInput {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (name.length < 2) throw new Error("Give the tournament a name. Location is fine.");
  if (name.length > 80) throw new Error("Keep the name under 80 characters.");

  const startDate = typeof data.startDate === "string" ? data.startDate.trim() : "";
  const endDate = typeof data.endDate === "string" ? data.endDate.trim() : "";
  if (!isIsoDate(startDate)) throw new Error("Pick a first day.");
  if (!isIsoDate(endDate)) throw new Error("Pick a last day.");
  if (endDate < startDate) throw new Error("Last day can’t be before first day.");

  const raw = Array.isArray(data.ageGroups) ? data.ageGroups : [];
  const ageGroups = [...new Set(raw.filter((g): g is string => typeof g === "string").map((g) => g.trim()))]
    .filter(isAgeGroup)
    .sort((a, b) => AGE_GROUPS.indexOf(a) - AGE_GROUPS.indexOf(b));
  if (ageGroups.length === 0) throw new Error("Pick at least one age group.");

  const dayPlanGiven = data.dayPlan !== undefined && data.dayPlan !== null;
  const poolGiven = data.poolPlay !== undefined && data.poolPlay !== null;
  const dayPlan = dayPlanGiven
    ? parseDayPlan(data.dayPlan, startDate, endDate, true)
    : poolGiven && !parsePoolPlay(data.poolPlay)
      ? parseDayPlan([], startDate, endDate, false)
      : defaultDayPlan(startDate, endDate);
  const maxTeams = parseTournamentMax(data.maxTeams);

  return {
    name,
    startDate,
    endDate,
    ageGroups,
    maxTeams,
    dayPlan,
    poolPlay: hasPoolDays(dayPlan),
    rules: parseBracketRules(data.rules, maxTeams),
  };
}

export function parseTournamentMax(value: unknown): number {
  if (value == null || String(value).trim() === "") return DEFAULT_TOURNAMENT_TEAMS;
  const n = parseTeamCount(value, "Max teams");
  if (n == null) return DEFAULT_TOURNAMENT_TEAMS;
  return n;
}

export function parseStoredAgeGroups(value: unknown): AgeGroup[] {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = value.split(",").map((part) => part.trim());
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((g): g is AgeGroup => typeof g === "string" && isAgeGroup(g));
}

export function parseTeamCount(value: unknown, label: string): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    if (!Number.isInteger(value)) throw new Error(`${label} must be a whole number.`);
    if (value < 1 || value > MAX_TOURNAMENT_TEAMS) {
      throw new Error(`${label} must be between 1 and ${MAX_TOURNAMENT_TEAMS}.`);
    }
    return value;
  }
  const raw = String(value).trim();
  if (!raw) return null;
  if (!/^\d+$/.test(raw)) throw new Error(`${label} must be a whole number.`);
  const n = Number.parseInt(raw, 10);
  if (n < 1 || n > MAX_TOURNAMENT_TEAMS) {
    throw new Error(`${label} must be between 1 and ${MAX_TOURNAMENT_TEAMS}.`);
  }
  return n;
}

export type AgeCapInput = {
  ageGroup: AgeGroup;
  minTeams: number | null;
  maxTeams: number | null;
};

export function parseAgeCaps(data: { weekendId?: unknown; ages?: unknown }): {
  weekendId: number;
  ages: AgeCapInput[];
} {
  const weekendId = parsePositiveInt(data.weekendId, "Missing tournament.");
  if (!Array.isArray(data.ages) || data.ages.length === 0) {
    throw new Error("Set min and max on the ages for this tournament.");
  }
  const ages: AgeCapInput[] = [];
  const seen = new Set<string>();
  for (const row of data.ages) {
    if (!row || typeof row !== "object") throw new Error("Age caps look off. Try again.");
    const rec = row as { ageGroup?: unknown; minTeams?: unknown; maxTeams?: unknown };
    if (typeof rec.ageGroup !== "string" || !isAgeGroup(rec.ageGroup)) {
      throw new Error("Pick a real age group.");
    }
    if (seen.has(rec.ageGroup)) throw new Error(`Don’t repeat ${rec.ageGroup}.`);
    seen.add(rec.ageGroup);
    const minTeams = parseTeamCount(rec.minTeams, `${rec.ageGroup} min`);
    const maxTeams = parseTeamCount(rec.maxTeams, `${rec.ageGroup} max`);
    if (minTeams != null && maxTeams != null && minTeams > maxTeams) {
      throw new Error(`Min can’t be higher than max for ${rec.ageGroup}.`);
    }
    ages.push({ ageGroup: rec.ageGroup, minTeams, maxTeams });
  }
  ages.sort((a, b) => AGE_GROUPS.indexOf(a.ageGroup) - AGE_GROUPS.indexOf(b.ageGroup));
  return { weekendId, ages };
}

export function parseWeekendUpdate(data: {
  weekendId?: unknown;
  name?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  maxTeams?: unknown;
  ages?: unknown;
  poolPlay?: unknown;
  dayPlan?: unknown;
  rules?: unknown;
}): WeekendInput & { weekendId: number; ages: AgeCapInput[]; rules: BracketRules } {
  const weekendId = parsePositiveInt(data.weekendId, "Missing tournament.");
  const groups = Array.isArray(data.ages)
    ? data.ages.map((row) =>
        row && typeof row === "object" ? (row as { ageGroup?: unknown }).ageGroup : undefined,
      )
    : [];
  const base = parseWeekendInput({
    name: data.name,
    startDate: data.startDate,
    endDate: data.endDate,
    ageGroups: groups,
    maxTeams: data.maxTeams,
    poolPlay: data.poolPlay,
    dayPlan: data.dayPlan,
    rules: data.rules,
  });
  const caps = parseAgeCaps({ weekendId, ages: data.ages });
  return {
    weekendId,
    ...base,
    ages: caps.ages,
    rules: { ...base.rules, divisions: normalizeDivisions(base.rules.divisions, base.maxTeams) },
  };
}

export const PARK_AMENITIES = [
  ["chairs", "Chairs"],
  ["canopies", "Canopies"],
  ["concessions", "Concessions"],
  ["restrooms", "Restrooms"],
  ["lights", "Field lights"],
  ["bleachers", "Bleachers"],
] as const;

export type ParkAmenityKey = (typeof PARK_AMENITIES)[number][0];

export type ParkFlags = Record<ParkAmenityKey, boolean> & {
  entranceFee: boolean;
  entrancePrice: string;
  ageDiscount: boolean;
  discountAges: AgeGroup[];
  discountPrice: string;
};

export function emptyParkFlags(): ParkFlags {
  return {
    chairs: false,
    canopies: false,
    concessions: false,
    restrooms: false,
    lights: false,
    bleachers: false,
    entranceFee: false,
    entrancePrice: "",
    ageDiscount: false,
    discountAges: [],
    discountPrice: "",
  };
}

function parkMoney(value: unknown): string {
  const text = String(value ?? "").trim().replace(/^\$/, "");
  return /^\d{1,4}(\.\d{1,2})?$/.test(text) ? text : "";
}

export function parseParkFlags(data: unknown): ParkFlags {
  const src = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const flags = emptyParkFlags();
  for (const [key] of PARK_AMENITIES) flags[key] = src[key] === true;
  flags.entranceFee = src.entranceFee === true;
  flags.entrancePrice = parkMoney(src.entrancePrice);
  flags.ageDiscount = flags.entranceFee && src.ageDiscount === true;
  flags.discountPrice = flags.ageDiscount ? parkMoney(src.discountPrice) : "";
  const rawAges = Array.isArray(src.discountAges) ? src.discountAges : [];
  flags.discountAges = flags.ageDiscount
    ? AGE_GROUPS.filter((age) => rawAges.includes(age))
    : [];
  return flags;
}

export function parseLocationInput(data: {
  weekendId?: unknown;
  name?: unknown;
  address?: unknown;
}): { weekendId: number; name: string; address: string } {
  const weekendId = parsePositiveInt(data.weekendId, "Missing tournament.");
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const address = typeof data.address === "string" ? data.address.trim() : "";
  if (name.length < 2) throw new Error("Give the park a short name.");
  if (name.length > 80) throw new Error("Keep the park name under 80 characters.");
  if (address.length < 8) throw new Error("Add a street address so Navigate can work later.");
  if (address.length > 160) throw new Error("Keep the address under 160 characters.");
  return { weekendId, name, address };
}

export function parsePositiveInt(value: unknown, message: string): number {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isInteger(n) || n < 1) throw new Error(message);
  return n;
}

export function parseTeamRegister(data: {
  weekendId?: unknown;
  ageGroup?: unknown;
  name?: unknown;
}): { weekendId: number; ageGroup: AgeGroup; name: string } {
  const weekendId = parsePositiveInt(data.weekendId, "Pick a tournament.");
  if (typeof data.ageGroup !== "string" || !isAgeGroup(data.ageGroup)) {
    throw new Error("Pick an age group.");
  }
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (name.length < 2) throw new Error("Give the team a name.");
  if (name.length > 60) throw new Error("Keep the team name under 60 characters.");
  return { weekendId, ageGroup: data.ageGroup, name };
}

export function parseJersey(value: unknown): number {
  const raw = typeof value === "number" ? String(value) : String(value ?? "").trim();
  if (!raw) throw new Error("Give a jersey number.");
  if (!/^\d+$/.test(raw)) throw new Error("Jersey must be a whole number.");
  const n = Number.parseInt(raw, 10);
  if (n < 0 || n > 99) throw new Error("Jersey must be 0–99.");
  return n;
}

export function parsePlayerInput(data: {
  teamId?: unknown;
  name?: unknown;
  jersey?: unknown;
}): { teamId: number; name: string; jersey: number } {
  const teamId = parsePositiveInt(data.teamId, "Missing team.");
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (name.length < 2) throw new Error("Give the player a name.");
  if (name.length > 60) throw new Error("Keep the player name under 60 characters.");
  return { teamId, name, jersey: parseJersey(data.jersey) };
}

export function formatAgeAvailability(registered: number, max: number | null, open: boolean): string {
  if (open) {
    if (max == null) return registered === 0 ? "Open" : `${registered} in`;
    return `${registered}/${max}`;
  }
  return `${registered}/${max ?? MAX_TOURNAMENT_TEAMS} in`;
}

export function teamStatusLabel(status: TeamStatus): string {
  if (status === "approved") return "In";
  if (status === "denied") return "Not accepted";
  return "Waiting for Admin";
}

/** Full save payload so a section page can patch one field without wiping the rest. */
export function weekendSavePayload(
  detail: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    maxTeams: number;
    poolPlay: boolean;
    dayPlan?: DayPlan[];
    rules: BracketRules;
    ages: AgeCapInput[];
  },
  patch: Partial<{
    name: string;
    startDate: string;
    endDate: string;
    maxTeams: unknown;
    poolPlay: boolean;
    dayPlan: DayPlan[];
    rules: BracketRules;
    ages: { ageGroup: AgeGroup; minTeams?: unknown; maxTeams?: unknown }[];
  }> = {},
) {
  const startDate = patch.startDate ?? detail.startDate;
  const endDate = patch.endDate ?? detail.endDate;
  const dayPlan = parseDayPlan(
    patch.dayPlan ?? detail.dayPlan,
    startDate,
    endDate,
    patch.poolPlay ?? detail.poolPlay,
  );
  return parseWeekendUpdate({
    weekendId: detail.id,
    name: patch.name ?? detail.name,
    startDate,
    endDate,
    maxTeams: patch.maxTeams ?? detail.maxTeams,
    poolPlay: hasPoolDays(dayPlan),
    dayPlan,
    rules: patch.rules ?? detail.rules,
    ages: (patch.ages ?? detail.ages).map((age) => ({
      ageGroup: age.ageGroup,
      minTeams: age.minTeams,
      maxTeams: age.maxTeams,
    })),
  });
}

