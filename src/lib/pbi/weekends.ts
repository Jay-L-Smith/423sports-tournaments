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
  "Underclass",
  "Upperclass",
] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number];

export const MAX_TOURNAMENT_TEAMS = 40;
export const DEFAULT_TOURNAMENT_TEAMS = 10;
export const DEFAULT_AGE_MIN_TEAMS = 3;

export function neededToFinish(weekend: {
  ageGroups: string[];
  approvedCount?: number;
  approvedByAge?: Record<string, number>;
  maxTeams?: number;
  rules: { minTeams: number };
  locationCount: number;
  hasBracket: boolean;
  needsStaff?: boolean;
}): string[] {
  const needs: string[] = [];
  if (weekend.ageGroups.length === 0) needs.push("Needs an age");
  const count =
    weekend.approvedCount ??
    Object.values(weekend.approvedByAge ?? {}).reduce((sum, n) => sum + n, 0);
  const cap = weekend.maxTeams && weekend.maxTeams > 0 ? weekend.maxTeams : 12;
  if (weekend.ageGroups.length > 0 && count < DEFAULT_AGE_MIN_TEAMS) needs.push("Needs teams");
  else if (weekend.ageGroups.length > 0 && count < cap) {
    const spots = cap - count;
    needs.push(spots === 1 ? "1 spot available" : `${spots} spots available`);
  }
  if (weekend.locationCount === 0) needs.push("Needs a park");
  if (weekend.needsStaff) needs.push("Needs staff");
  if (!weekend.hasBracket) needs.push("Needs a bracket");
  return needs;
}

export const TEAM_STATUSES = ["pending", "approved", "denied"] as const;
export type TeamStatus = (typeof TEAM_STATUSES)[number];

export function isTeamStatus(value: string): value is TeamStatus {
  return (TEAM_STATUSES as readonly string[]).includes(value);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isAgeGroup(value: string): value is AgeGroup {
  return (AGE_GROUPS as readonly string[]).includes(value);
}

const YEAR_AGES = AGE_GROUPS.filter((age) => age.endsWith("U"));

function isYearAge(age: string): age is AgeGroup {
  return (YEAR_AGES as readonly string[]).includes(age);
}

function isClassAge(age: string): age is "Underclass" | "Upperclass" {
  return age === "Underclass" || age === "Upperclass";
}

/** The age one year younger. 16U → 15U. 8U has none. Class divisions are not a year step. */
export function ageOneYounger(age: string): AgeGroup | null {
  if (!isYearAge(age)) return null;
  const index = YEAR_AGES.indexOf(age);
  return index > 0 ? YEAR_AGES[index - 1]! : null;
}

/**
 * Division this team is seated in.
 * Their own age if that division is on the tournament.
 * Otherwise one year older (15U plays up into 16U), never more than one year.
 * An older team can play down into the closest younger division. The tournament age does not change.
 * Underclass can play up into Upperclass. Those two do not mix with the year ages.
 */
export function divisionForTeam(teamAge: string, divisions: readonly string[]): AgeGroup | null {
  if (!isAgeGroup(teamAge)) return null;
  if (isClassAge(teamAge)) {
    if (divisions.includes(teamAge)) return teamAge;
    if (teamAge === "Underclass" && divisions.includes("Upperclass")) return "Upperclass";
    if (teamAge === "Upperclass" && divisions.includes("Underclass")) return "Underclass";
    return null;
  }
  if (divisions.includes(teamAge)) return teamAge;
  const index = YEAR_AGES.indexOf(teamAge);
  const older = index >= 0 && index < YEAR_AGES.length - 1 ? YEAR_AGES[index + 1] : null;
  if (older && divisions.includes(older)) return older;
  const younger = divisions
    .filter((age): age is AgeGroup => isYearAge(age) && YEAR_AGES.indexOf(age) < index)
    .sort((a, b) => YEAR_AGES.indexOf(b) - YEAR_AGES.indexOf(a));
  return younger[0] ?? null;
}

/** Tournament ages, the age one year under each, and every older age. Used when adding a team. */
export function playableAges(tournamentAges: string[]): AgeGroup[] {
  const allowed = new Set<AgeGroup>();
  for (const age of tournamentAges) {
    if (!isAgeGroup(age)) continue;
    if (isClassAge(age)) {
      allowed.add(age);
      if (age === "Upperclass") allowed.add("Underclass");
      continue;
    }
    const index = YEAR_AGES.indexOf(age);
    allowed.add(age);
    if (index > 0) allowed.add(YEAR_AGES[index - 1]!);
    for (let step = index + 1; step < YEAR_AGES.length; step += 1) allowed.add(YEAR_AGES[step]!);
  }
  return AGE_GROUPS.filter((age) => allowed.has(age));
}

export function teamCanPlay(teamAge: string, divisionAge: string): boolean {
  return divisionForTeam(teamAge, [divisionAge]) != null;
}

/**
 * Baseball age year for a calendar date.
 * January–August use that year’s April 30. September–December start the next spring, so they use next year’s April 30.
 */
export function baseballAgeYear(on: string): number {
  if (!isIsoDate(on)) return FIRST_SEASON_YEAR;
  const year = Number(on.slice(0, 4));
  const month = Number(on.slice(5, 7));
  const ageYear = month >= 9 ? year + 1 : year;
  return Math.max(ageYear, FIRST_SEASON_YEAR);
}

/** Age on April 30 of `ageYear`. A May 1 birthday has not happened yet, so it stays the younger age. */
export function leagueAge(birthday: string, ageYear: number): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return null;
  const [year, month, day] = birthday.split("-").map(Number);
  if (!year || !month || !day) return null;
  let age = ageYear - year;
  if (month > 4 || (month === 4 && day > 30)) age -= 1;
  return age;
}

/** True when the player is that age or younger on April 30. Playing up is allowed. Playing down is not. */
export function playerMeetsAge(birthday: string, ageGroup: string, ageYear: number): boolean {
  const limit = Number.parseInt(ageGroup, 10);
  const age = leagueAge(birthday, ageYear);
  if (!limit || age == null) return false;
  return age >= 4 && age <= limit;
}

const ELIGIBILITY_AGES = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] as const;

function eligibilityBirthYear(age: number, year: number): number {
  return year - age;
}

function eligibilityGradYear(age: number, year: number): number {
  return eligibilityBirthYear(age, year) + 19;
}

function eligibilityRule(age: number, year: number): string {
  const born = `born on or after May 1, ${eligibilityBirthYear(age, year)}`;
  if (age <= 13) return `${born}.`;
  return `${born}. Or ${eligibilityGradYear(age, year)} grad or younger.`;
}

function classRule(age: "Underclass" | "Upperclass", year: number): string {
  const grad = age === "Upperclass" ? year + 1 : year + 3;
  return `${grad} grad or younger.`;
}

export function eligibilityLadder(year: number): string[] {
  const years = ELIGIBILITY_AGES.map((age) => `${age}U: ${eligibilityRule(age, year)}`);
  return [...years, `Underclass: ${classRule("Underclass", year)}`, `Upperclass: ${classRule("Upperclass", year)}`];
}

export function eventEligibilityLines(ages: readonly string[], year: number): string[] {
  const lines: string[] = [];
  const picked = [...new Set(ages.map((age) => Number.parseInt(age, 10)).filter((age) => age >= 7 && age <= 18))].sort((a, b) => a - b);
  for (const age of picked) lines.push(`This event is ${age}U: ${eligibilityRule(age, year)}`);
  if (ages.includes("Underclass")) lines.push(`This event is Underclass: ${classRule("Underclass", year)}`);
  if (ages.includes("Upperclass")) lines.push(`This event is Upperclass: ${classRule("Upperclass", year)}`);
  return lines;
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

/** True once today is on or after the drop cutoff (default 3 days before first pitch). */
export function pastDropCutoff(startDate: string, today: string, days = 3): boolean {
  const start = String(startDate ?? "").slice(0, 10);
  if (!isIsoDate(start) || !isIsoDate(today)) return false;
  return today >= addDays(start, -Math.max(0, days));
}

/**
 * Keep / rebuild is only due in the lock window from create:
 * from the drop-cutoff day until first pitch, and only if the tournament
 * already existed on that cutoff. Creating inside the window does not lock it.
 */
export function lockoutDue(startDate: string, today: string, days = 3, createdAt?: string | Date | null): boolean {
  const start = String(startDate ?? "").slice(0, 10);
  if (!isIsoDate(start) || !isIsoDate(today)) return false;
  const lead = Math.max(0, days);
  const cutoff = addDays(start, -lead);
  if (today < cutoff || today >= start) return false;
  if (createdAt == null || createdAt === "") return true;
  const created = createdAt instanceof Date ? isoDateFromLocal(createdAt) : dayFromStamp(String(createdAt));
  if (created && created > cutoff) return false;
  return true;
}

function dayFromStamp(value: string): string {
  const day = value.slice(0, 10);
  if (isIsoDate(day) && !value.includes("T")) return day;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return isIsoDate(day) ? day : "";
  return isoDateFromLocal(dt);
}


/** New teams close 24 hours before first pitch, or once a game has a score. */
export function teamEntryClosed(opts: { startDate: string; today?: string; scored?: boolean; days?: number; firstPitch?: string; now?: Date }): string | null {
  if (opts.scored) return "New teams close once a game has a score.";
  if (sheetLocksAt(opts.startDate, opts.firstPitch || "08:00", opts.now)) return "New teams close 24 hours before first pitch.";
  return null;
}

/** Past starts at 6:00 AM the morning after the last day, not at midnight. */
export function tournamentPastAt(endDate: string, now = new Date()): boolean {
  const [y, m, d] = (endDate || "").split("-").map(Number);
  if (!Number.isFinite(y) || !y) return false;
  return now.getTime() >= new Date(y, (m || 1) - 1, (d || 1) + 1, 6, 0, 0, 0).getTime();
}

/** Coaches cannot register once a tournament is live or past. */
export function registrationClosed(
  weekend: { endDate: string; hasChampion?: boolean; sheetLocked?: boolean; hasScoredGame?: boolean },
  now = new Date(),
): string | null {
  if (tournamentPastAt(weekend.endDate, now)) return "This tournament is over. Registration is closed.";
  if (weekend.hasChampion || weekend.sheetLocked || weekend.hasScoredGame) return "This tournament is already live. Registration is closed.";
  return null;
}

export function publicRegistrationLabel(opts: {
  endDate: string;
  approved: number;
  maxTeams: number | null;
  sheetLocked: boolean;
  hasScoredGame: boolean;
  hasChampion: boolean;
}): { status: "open" | "full" | "closed"; label: string } {
  if (registrationClosed(opts)) return { status: "closed", label: "Registration closed" };
  const cap = opts.maxTeams && opts.maxTeams > 0 ? opts.maxTeams : 12;
  if (opts.approved >= cap) return { status: "full", label: "Full" };
  const spots = cap - opts.approved;
  return { status: "open", label: spots === 1 ? "1 spot open" : `${spots} spots open` };
}

/** The sheet locks 24 hours before first pitch, or once a game has a score. Off is an admin override. On is a hand lock. */
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

export function sheetLocksAt(startDate: string, firstPitch: string, now = new Date()): boolean {
  const start = firstPitchAt(startDate, firstPitch);
  if (!start) return false;
  return now.getTime() >= start.getTime() - 24 * 60 * 60 * 1000;
}

export function sheetIsLocked(opts: {
  lock: SheetLock;
  startDate: string;
  firstPitch: string;
  scored?: boolean;
  now?: Date;
}): boolean {
  if (opts.lock === "off") return false;
  if (opts.lock === "on") return true;
  if (opts.scored) return true;
  return sheetLocksAt(opts.startDate, opts.firstPitch, opts.now ?? new Date());
}

export function lockReason(opts: {
  lock: SheetLock;
  startDate: string;
  firstPitch: string;
  scored?: boolean;
  now?: Date;
}): string | null {
  if (opts.lock === "off") return null;
  if (opts.lock === "on" && !opts.scored && !sheetLocksAt(opts.startDate, opts.firstPitch, opts.now)) return "an admin locked it.";
  const timed = sheetLocksAt(opts.startDate, opts.firstPitch, opts.now);
  if (opts.lock === "on" && opts.scored && timed) return "an admin locked it, a game has a score, and first pitch is inside 24 hours.";
  if (opts.scored && timed) return "a game has a score, and first pitch is inside 24 hours.";
  if (opts.scored) return "a game has a score.";
  if (timed) return "first pitch is inside 24 hours.";
  if (opts.lock === "on") return "an admin locked it.";
  return null;
}

export function beforeFirstPitch(startDate: string, firstPitch: string, now = new Date()): boolean {
  const start = firstPitchAt(startDate, firstPitch);
  if (!start) return false;
  return now.getTime() < start.getTime();
}

const LIVE_LINK_AFTER_FALL_MS = 14 * 24 * 60 * 60 * 1000;

/** Live links for a year stay up until two weeks after that year's last fall game. No fall game yet means they stay open. */
export function liveLinksCloseAt(lastFallEndDate: string | null): Date | null {
  if (!lastFallEndDate) return null;
  const end = endOfTournamentDay(lastFallEndDate);
  if (!end) return null;
  return new Date(end.getTime() + LIVE_LINK_AFTER_FALL_MS);
}

export function liveLinkOpen(opts: { locked: boolean; closesAt: Date | null; now?: Date }): boolean {
  if (!opts.locked) return false;
  if (!opts.closesAt) return true;
  return (opts.now ?? new Date()).getTime() <= opts.closesAt.getTime();
}

export function endOfTournamentDay(endDate: string): Date | null {
  if (!isIsoDate(endDate)) return null;
  const [y, m, d] = endDate.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

export function defaultWeekendDates(now = new Date()): { startDate: string; endDate: string } {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  d.setDate(d.getDate() + 1);
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

/** Put ages on a name when the name does not already say them. */
export function nameWithAges(name: string, ages: readonly string[]): string {
  const base = name.trim();
  const missing = ages.filter((age) => isAgeGroup(age) && !nameHasAge(base, age));
  if (!base || missing.length === 0) return base || name;
  return `${base} ${missing.join(" · ")}`;
}

function nameHasAge(name: string, age: string): boolean {
  const escaped = age.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "i").test(name);
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
  // Two-day events stay pool, then bracket — whatever the calendar days are.
  // A mixed first day puts pool games on the same sheet as the bracket.
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

export function formatWeekdayLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (y == null || m == null || d == null) return "";
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long" });
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
  teamFeeCents: number | null;
};

export function parsePoolPlay(value: unknown): boolean {
  if (value === true || value === 1 || value === "1" || value === "true" || value === "on") return true;
  if (value === false || value === 0 || value === "0" || value === "false" || value === "off") return false;
  return false;
}

export function parseTeamFee(value: unknown): number | null {
  if (value == null) return null;
  const raw = String(value).trim().replace(/[$,\s]/g, "");
  if (!raw) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) throw new Error("Team fee needs to be a dollar amount.");
  const cents = Math.round(Number(raw) * 100);
  if (cents < 0 || cents > 1000000) throw new Error("Team fee looks off.");
  return cents;
}

/** Already-parsed cents from a previous save. Blank stays unset. */
export function parseStoredTeamFeeCents(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isInteger(n) || n < 0 || n > 1000000) throw new Error("Team fee looks off.");
  return n;
}

function feeCentsFrom(data: { teamFee?: unknown; teamFeeCents?: unknown }): number | null {
  if (data.teamFee !== undefined) return parseTeamFee(data.teamFee);
  if (data.teamFeeCents !== undefined) return parseStoredTeamFeeCents(data.teamFeeCents);
  return null;
}

export function formatTeamFee(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** Blank field for an unset fee. Whole dollars stay without cents. */
export function teamFeeInputValue(cents: number | null | undefined): string {
  if (cents == null) return "";
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2);
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
  teamFee?: unknown;
  teamFeeCents?: unknown;
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
    teamFeeCents: feeCentsFrom(data),
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
  teamFee?: unknown;
  teamFeeCents?: unknown;
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
    teamFee: data.teamFee,
    teamFeeCents: data.teamFeeCents,
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
    teamFeeCents?: number | null;
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
    teamFee?: unknown;
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
    teamFee: patch.teamFee !== undefined ? patch.teamFee : detail.teamFeeCents == null ? null : detail.teamFeeCents / 100,
  });
}

export const SEASONS = ["spring", "summer", "fall"] as const;
export type Season = (typeof SEASONS)[number];

export type SeasonWindow = {
  season: Season;
  year: number;
  startDate: string;
  endDate: string;
};

export type SeasonSlot = {
  startDate: string;
  endDate: string;
  name: string;
  weekendId: number | null;
  selected: boolean;
  blocked: boolean;
  blockReason: string | null;
};

const SEASON_LABEL: Record<Season, string> = {
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
};

export function isSeason(value: unknown): value is Season {
  return value === "spring" || value === "summer" || value === "fall";
}

export function seasonLabel(season: Season): string {
  return SEASON_LABEL[season];
}

/** Inclusive defaults. Year is the year of the season’s start. */
export function defaultSeasonWindow(season: Season, year: number): SeasonWindow {
  if (season === "spring") return { season, year, startDate: `${year}-03-01`, endDate: `${year}-05-31` };
  if (season === "summer") return { season, year, startDate: `${year}-06-01`, endDate: `${year}-08-31` };
  return { season, year, startDate: `${year}-09-01`, endDate: `${year}-11-15` };
}

/** Spring through May, summer through August, fall from September on. */
export function seasonFromDate(start: string): { season: Season; year: number } | null {
  if (!isIsoDate(start)) return null;
  const year = Number(start.slice(0, 4));
  const month = Number(start.slice(5, 7));
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (month <= 5) return { season: "spring", year };
  if (month <= 8) return { season: "summer", year };
  return { season: "fall", year };
}

/** League scheduling starts here. Earlier years stay off these calendars. */
export const FIRST_SEASON_YEAR = 2026;

/** Days before a tournament starts when the director should finish building it. */
export const FINALIZE_LEAD_DAYS = 14;

/** The first day the director should finish a tournament that starts on `startDate`. */
export function finalizeOpensOn(startDate: string): string {
  return addDays(startDate, -FINALIZE_LEAD_DAYS);
}

/** True once a tournament is inside the two weeks before it starts. */
export function finalizeIsDue(today: string, startDate: string): boolean {
  if (!isIsoDate(today) || !isIsoDate(startDate)) return false;
  return today >= finalizeOpensOn(startDate);
}

/** Days after Fall ends before the director is asked to archive the year. */
export const ARCHIVE_AFTER_DAYS = 14;

/** If today is past this year’s default end, open next year. Never before {@link FIRST_SEASON_YEAR}. */
export function preferredSeasonYear(season: Season, today: string, endDate?: string): number {
  const year = Number(today.slice(0, 4));
  const safeYear = Number.isInteger(year) && year > 2000 ? year : new Date().getFullYear();
  const end = endDate && isIsoDate(endDate) ? endDate : defaultSeasonWindow(season, safeYear).endDate;
  const preferred = today > end ? safeYear + 1 : safeYear;
  return Math.max(preferred, FIRST_SEASON_YEAR);
}

/** The first day the archive prompt can show for a Fall that ended on `fallEnd`. */
export function archivePromptOn(fallEnd: string): string {
  return addDays(fallEnd, ARCHIVE_AFTER_DAYS);
}

/** True once Fall has been over for two weeks. */
export function archiveIsDue(today: string, fallEnd: string): boolean {
  if (!isIsoDate(today) || !isIsoDate(fallEnd)) return false;
  return today >= archivePromptOn(fallEnd);
}

export function formatMonthDay(iso: string): string {
  const dt = parseLocalIso(iso);
  if (!dt) return iso;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatSeasonSpan(start: string, end: string): string {
  return `${formatMonthDay(start)} – ${formatMonthDay(end)}`;
}

/** Card name for an announced weekend, e.g. Apr 11–12. */
export function announcedWeekendName(start: string, end: string): string {
  const s = parseLocalIso(start);
  const e = parseLocalIso(end);
  if (!s || !e) return `${start}–${end}`;
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    const month = s.toLocaleDateString("en-US", { month: "short" });
    return `${month} ${s.getDate()}–${e.getDate()}`;
  }
  return `${formatMonthDay(start)} – ${formatMonthDay(end)}`;
}

export function renameTournamentAge(name: string, from: string, to: string) {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}(?!.*${escaped})`);
  if (!re.test(name)) return `${name} ${to}`.trim();
  return name.replace(re, to);
}

const TOURNAMENT_TITLES = ["Opener", "Classic", "Showdown", "Invitational", "Challenge", "Showcase", "Shootout", "Championship", "Cup", "Series"];

/** Next unused season name. The first event of a season is the Opener. */
export function suggestTournamentName(season: Season, year: number, taken: string[], seasonCount: number): string {
  const label = seasonLabel(season);
  const used = new Set(taken.map((name) => name.trim().toLowerCase()));
  const titles = seasonCount === 0 ? TOURNAMENT_TITLES : TOURNAMENT_TITLES.slice(1);
  for (const title of titles) {
    const name = `${label} ${title} ${year}`;
    if (!used.has(name.toLowerCase())) return name;
  }
  let n = Math.max(seasonCount, 1) + 1;
  while (used.has(`${label} Tournament ${n} ${year}`.toLowerCase())) n += 1;
  return `${label} Tournament ${n} ${year}`;
}

/** Every Sat–Sun whose Saturday falls inside the inclusive window. */
export function seasonSaturdays(start: string, end: string): { startDate: string; endDate: string }[] {
  if (!isIsoDate(start) || !isIsoDate(end) || end < start) return [];
  const first = parseLocalIso(start);
  if (!first) return [];
  const toSat = (6 - first.getDay() + 7) % 7;
  let cursor = addDays(start, toSat);
  const out: { startDate: string; endDate: string }[] = [];
  let guard = 0;
  while (cursor <= end && guard < 40) {
    out.push({ startDate: cursor, endDate: addDays(cursor, 1) });
    cursor = addDays(cursor, 7);
    guard += 1;
  }
  return out;
}

/** First selected Saturday minus 30 days, or season start minus 30 when nothing is picked. */
export function softDeadline(seasonStart: string, firstSaturday: string | null): string {
  const base = firstSaturday && isIsoDate(firstSaturday) ? firstSaturday : seasonStart;
  return addDays(base, -30);
}

export function softDeadlineCopy(season: Season, deadline: string): string {
  const when = parseLocalIso(deadline)?.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) ?? deadline;
  return `${seasonLabel(season)}'s first weekend is usually locked in by ${when}. You can still add or cancel — just don’t make last-minute the habit.`;
}

export function rangeOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): { start: string; end: string } | null {
  if (!isIsoDate(aStart) || !isIsoDate(aEnd) || !isIsoDate(bStart) || !isIsoDate(bEnd)) return null;
  const start = aStart > bStart ? aStart : bStart;
  const end = aEnd < bEnd ? aEnd : bEnd;
  if (start > end) return null;
  return { start, end };
}

export function seasonClash(a: SeasonWindow, b: SeasonWindow): string | null {
  const hit = rangeOverlap(a.startDate, a.endDate, b.startDate, b.endDate);
  if (!hit) return null;
  const span = hit.start === hit.end ? formatMonthDay(hit.start) : `${formatMonthDay(hit.start)}–${formatMonthDay(hit.end)}`;
  return `${seasonLabel(a.season)} and ${seasonLabel(b.season)} overlap on ${span}.`;
}

export function seasonOverlaps(focus: SeasonWindow, others: SeasonWindow[]): string[] {
  const messages: string[] = [];
  for (const other of others) {
    if (other.season === focus.season && other.year === focus.year) continue;
    const message = seasonClash(focus, other);
    if (message) messages.push(message);
  }
  return messages;
}


