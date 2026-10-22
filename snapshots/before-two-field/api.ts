import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { formatPhoneInput } from "@/lib/utils";
import {
  coachResubmitState,
  denyCoachNotice,
  MAX_COACH_REQUESTS,
  parseCoachAccess,
} from "./coach-request";
import {
  isElevatedRole,
  isRole,
  isSeedAdminEmail,
  isSuperuserOwner,
  normalizeEmail,
  type RequestStatus,
  type Role,
} from "./roles";
import {
  AGE_GROUPS,
  DEFAULT_AGE_MIN_TEAMS,
  DEFAULT_TOURNAMENT_TEAMS,
  isAgeGroup,
  ageOneYounger,
  divisionForTeam,
  isTeamStatus,
  isoDateFromLocal,
  parseAgeCaps,
  parseLocationInput,
  parseParkFlags,
  emptyParkFlags,
  type ParkFlags,
  parsePlayerInput,
  parseJersey,
  parsePositiveInt,
  parseStoredAgeGroups,
  parseTeamRegister,
  parseTournamentMax,
  parseWeekendInput,
  parseWeekendUpdate,
  hasPoolDays,
  parseDayPlan,
  teamEntryClosed,
  pastDropCutoff,
  parseSheetLock,
  sheetIsLocked,
  lockReason,
  beforeFirstPitch,
  isSeason,
  seasonLabel,
  defaultSeasonWindow,
  seasonFromDate,
  defaultDayPlan,
  preferredSeasonYear,
  archiveIsDue,
  finalizeIsDue,
  formatMonthDay,
  FIRST_SEASON_YEAR,
  seasonSaturdays,
  announcedWeekendName,
  renameTournamentAge,
  nameWithAges,
  addDays,
  softDeadline,
  softDeadlineCopy,
  formatSeasonSpan,
  seasonOverlaps,
  type Season,
  type SeasonWindow,
  type SeasonSlot,
  type AgeCapInput,
  type AgeGroup,
  type DayPlan,
  type SheetLock,
  type TeamStatus,
  parentLinkOpen,
} from "./weekends";
import { coachTextKind, messageAges, type CoachTextKind } from "./coach-text";
import {
  POOL_REGEN_BLOCKED,
  hasBracketShell,
  hasPlayableBracket,
  parseBracketRules,
  teamsNeededForBracket,
  type BracketRules,
} from "./rules";
import {
  buildGames,
  bracketField,
  buildPools,
  collectScheduleWarnings,
  divisionSlotOffset,
  forfeitRemaining,
  formatKickoff,
  guaranteedPlaces,
  isGameRound,
  isRoundId,
  numberPlayableGames,
  placeOneOrTwoFields,
  packSchedule,
  poolStandings,
  proposeRainoutSlots,
  POOL_ROUND,
  restorePoolDraw,
  ROUND_IDS,
  poolLabel,
  roundLabel,
  sundayTeamCount,
  swapSeeds,
  applyPoolSlotSwap,
  applyPoolSideSwap,
  syncSeeds,
  type BuiltGame,
  type BuiltPoolGame,
  type GameRound,
  type PoolGameResult,
  type RainoutOption,
  type RoundId,
  type ScheduleWarning,
} from "./bracket";


export type Profile = {
  userId: string;
  email: string;
  requestedRole: Role;
  homeRole: Role;
  requestStatus: RequestStatus;
  coachRequestCount: number;
  resubmitsLeft: number;
  canResubmitCoach: boolean;
  coachAccessLocked: boolean;
  isSuperuser: boolean;
  canGrantSuperuser: boolean;
  canManageAdmins: boolean;
};

export type NotificationItem = {
  id: number;
  title: string;
  body: string;
  kind: string;
  read: boolean;
  createdAt: string;
  weekendId: number | null;
  refKey: string | null;
};

export type PendingRequest = {
  id: number;
  userId: string;
  email: string;
  requestedRole: "coach" | "admin";
  name: string | null;
  phone: string | null;
  club: string | null;
  teamName: string | null;
  teams: { name: string; ageGroup: string }[];
  reason: string | null;
  createdAt: string;
  attempt: number;
};

export type DirectoryUser = {
  userId: string;
  email: string;
  name: string | null;
  phone: string | null;
  requestedRole: Role;
  homeRole: Role;
  requestStatus: RequestStatus;
  isSuperuser: boolean;
  canManageAdmins: boolean;
};

export type DirectoryCoach = {
  userId: string;
  email: string;
  teamName: string | null;
  status: "approved" | "pending";
  teams: string[];
};

export type CoachInvite = {
  id: number;
  channel: "phone" | "email";
  destination: string;
  createdAt: string;
  accountEmail: string | null;
};

export type Weekend = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  ageGroups: AgeGroup[];
  locationCount: number;
  maxTeams: number;
  approvedCount: number;
  approvedByAge: Record<string, number>;
  hasBracket: boolean;
  poolPlay: boolean;
  dayPlan: DayPlan[];
  sundaySeedsLocked: boolean;
  bracketLocked: boolean;
  sheetLock: SheetLock;
  sheetLocked: boolean;
  lockReason: string | null;
  hasScoredGame: boolean;
  hasChampion: boolean;
  championAt: string | null;
  beforeFirstPitch: boolean;
  rules: BracketRules;
  publicDirty: boolean;
  publicPushedAt: string | null;
  dirtyAfterLock: boolean;
  lockoutChoice: "keep" | "smaller" | null;
  createdAt: string | null;
  lifecycle: "announced" | "live";
  season: Season | null;
  seasonYear: number | null;
  interestCount: number;
  interestedTeams: string[];
  needsStaff: boolean;
  teamFeeCents: number | null;
};

export type WeekendAge = {
  ageGroup: AgeGroup;
  minTeams: number | null;
  maxTeams: number | null;
  teamCount: number;
};

export type WeekendLocation = {
  id: number;
  parkId: number | null;
  name: string;
  address: string;
  isPrimary: boolean;
} & ParkFlags;

export type KnownPark = {
  id: number;
  name: string;
  address: string;
} & ParkFlags;

export type WeekendTeam = {
  id: number;
  name: string;
  ageGroup: AgeGroup;
  isDemo: boolean;
};

export type EntryRequest = {
  id: number;
  teamName: string;
  ageGroup: string;
  coachUserId: string;
  coachName: string;
};

export type WeekendDetail = Weekend & {
  ages: WeekendAge[];
  locations: WeekendLocation[];
  teams: WeekendTeam[];
  hasBracket: boolean;
  hasPoolGames: boolean;
  teamEntryClosed: string | null;
  placeConflict: boolean;
  staffHint: string;
  entryRequests: EntryRequest[];
};

export type OpenAge = {
  ageGroup: AgeGroup;
  minTeams: number | null;
  maxTeams: number | null;
  registered: number;
  open: boolean;
};

export type OpenTournament = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  maxTeams: number;
  approvedCount: number;
  ages: OpenAge[];
};

export type RosterPlayer = {
  id: number;
  name: string;
  jersey: number;
  ageGroup: AgeGroup;
};

export type RegisteredTeam = {
  id: number;
  name: string;
  ageGroup: AgeGroup;
  weekendId: number;
  tournamentName: string;
  startDate: string;
  endDate: string;
  status: TeamStatus;
  attendingConfirmed: boolean;
  playerCount: number;
  players: RosterPlayer[];
  locations: WeekendLocation[];
};

export type ScheduleGame = {
  id: number;
  ageGroup: AgeGroup;
  round: GameRound;
  roundLabel: string;
  slot: number;
  isBye: boolean;
  homeSeed: number | null;
  awaySeed: number | null;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeName: string | null;
  awayName: string | null;
  homeFromRound: RoundId | null;
  homeFromSlot: number | null;
  awayFromRound: RoundId | null;
  awayFromSlot: number | null;
  locationId: number | null;
  locationName: string | null;
  fieldConfirmed: boolean;
  startDate: string | null;
  startTime: string | null;
  when: string;
  gameNumber: number | null;
  poolIndex: number | null;
  homeScore: number | null;
  awayScore: number | null;
  forfeit: "home" | "away" | null;
  rainout: boolean;
  scoreLocked: boolean;
  noContest: boolean;
  divisionIndex: number;
};

export type ScheduleSeed = {
  seed: number;
  teamId: number | null;
  teamName: string | null;
  frozen: boolean;
  divisionIndex: number;
};

export type SchedulePool = {
  index: number;
  label: string;
  games: ScheduleGame[];
};

export type ScheduleAge = {
  ageGroup: AgeGroup;
  teamCount: number;
  seeds: ScheduleSeed[];
  games: ScheduleGame[];
  poolPlay: boolean;
  sundaySeedsLocked: boolean;
  pools: SchedulePool[];
  minTeams: number;
  softFill: boolean;
  warnings: ScheduleWarning[];
  hasBracket: boolean;
};

export type Scorekeeper = {
  id: number;
  weekendId: number;
  userId: string;
  email: string;
  scope: "weekend" | "field" | "field-day";
  locationId: number | null;
  onDate: string | null;
};

export type WeekendSchedule = {
  weekend: Weekend;
  locations: WeekendLocation[];
  ages: ScheduleAge[];
  scorekeepers: Scorekeeper[];
  awaitingPublish: boolean;
};

export type ListedGame = ScheduleGame & {

  weekendId: number;
  tournamentName: string;
};

export type PendingTeam = {
  id: number;
  name: string;
  ageGroup: AgeGroup;
  weekendId: number;
  tournamentName: string;
  coachEmail: string;
  createdAt: string;
};

type ProfileRow = {
  user_id: string;
  email: string;
  requested_role: Role;
  home_role: Role;
  request_status: RequestStatus;
};

type AuthUserRow = { id: string; email: string; name: string };

type WeekendRow = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  age_groups: unknown;
  location_count?: number;
  max_teams?: number;
  approved_count?: number;
  pool_play?: boolean;
  day_plan?: unknown;
  sunday_seeds_locked?: boolean;
  bracket_rules?: unknown;
};

function mapProfile(row: any, coachRequestCount: any = 0): Profile {
	const extra = coachResubmitState({
		requestedRole: row.requested_role,
		requestStatus: row.request_status,
		coachRequestCount
	});
	return {
		userId: row.user_id,
		email: row.email,
		requestedRole: row.requested_role,
		homeRole: row.home_role,
		requestStatus: row.request_status,
		coachRequestCount,
		resubmitsLeft: extra.resubmitsLeft,
		canResubmitCoach: extra.canResubmitCoach,
		coachAccessLocked: extra.coachAccessLocked,
		isSuperuser: Boolean(row.is_superuser),
		canGrantSuperuser: isSuperuserOwner(row.email),
		canManageAdmins: Boolean(row.is_superuser) || Boolean(row.can_manage_admins),
	};
}
function nameList(value: unknown): string[] {
	if (value == null) return [];
	try {
		const raw = typeof value === "string" ? JSON.parse(value) : value;
		if (!Array.isArray(raw)) return [];
		return raw.map((item) => String(item || "").trim()).filter(Boolean);
	} catch {
		return [];
	}
}
function countMap(value: unknown): Record<string, number> {
	const raw = typeof value === "string" ? JSON.parse(value) : value;
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
	const out: Record<string, number> = {};
	for (const [key, n] of Object.entries(raw as Record<string, unknown>)) {
		const num = typeof n === "number" ? n : Number(n);
		if (Number.isFinite(num)) out[key] = num;
	}
	return out;
}
function mapWeekend(row: any): Weekend {
	const plan = planFromRow(row);
	const startDate = asDateString(row.start_date) ?? "";
	const endDate = asDateString(row.end_date) ?? "";
	const rules = parseBracketRules(row.bracket_rules, row.max_teams ?? DEFAULT_TOURNAMENT_TEAMS);
	const sheetLock = parseSheetLock(row.sheet_lock);
	return {
		id: row.id,
		name: row.name,
		startDate,
		endDate,
		ageGroups: parseStoredAgeGroups(row.age_groups),
		locationCount: row.location_count ?? 0,
		maxTeams: row.max_teams ?? DEFAULT_TOURNAMENT_TEAMS,
		approvedCount: row.approved_count ?? 0,
		approvedByAge: countMap(row.approved_by_age),
		hasBracket: Boolean(row.has_bracket),
		poolPlay: hasPoolDays(plan),
		dayPlan: plan,
		sundaySeedsLocked: Boolean(row.sunday_seeds_locked),
		bracketLocked: Boolean(row.bracket_locked),
		sheetLock,
		sheetLocked: sheetIsLocked({
			lock: sheetLock,
			startDate,
			firstPitch: rules.firstPitch,
			scored: Boolean(row.has_scored_game),
		}),
		lockReason: lockReason({
			lock: sheetLock,
			startDate,
			firstPitch: rules.firstPitch,
			scored: Boolean(row.has_scored_game),
		}),
		hasScoredGame: Boolean(row.has_scored_game),
		hasChampion: Boolean(row.has_champion),
		championAt: row.has_champion && row.champion_at ? new Date(row.champion_at).toISOString() : null,
		beforeFirstPitch: beforeFirstPitch(startDate, rules.firstPitch),
		rules,
		publicDirty: row.public_dirty == null ? true : Boolean(row.public_dirty),
		publicPushedAt: row.public_pushed_at == null ? null : String(row.public_pushed_at),
		dirtyAfterLock: Boolean(row.dirty_after_lock),
		lockoutChoice: row.lockout_choice === "keep" || row.lockout_choice === "smaller" ? row.lockout_choice : null,
		createdAt: row.created_at == null ? null : row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
		lifecycle: row.lifecycle === "announced" ? "announced" : "live",
		teamFeeCents: row.team_fee_cents == null || row.team_fee_cents === "" ? null : Number(row.team_fee_cents),
		season: isSeason(row.season) ? row.season : null,
		seasonYear: row.season_year == null || row.season_year === "" ? null : Number(row.season_year),
		interestCount: Number(row.interest_count ?? 0),
		interestedTeams: nameList(row.interested_teams),
		needsStaff: row.needs_staff == null ? false : Boolean(row.needs_staff),
	};
}
function planFromRow(row: any): DayPlan[] {
	return parseDayPlan(row.day_plan, row.start_date, row.end_date, Boolean(row.pool_play));
}
async function loadAuthUser(userId: any) {
	return (await ((await getSql()) as any)`
    select id, email, name from "user" where id = ${userId} limit 1
  `)[0] ?? null;
}
async function countCoachRequests(userId: any) {
	return (await ((await getSql()) as any)`
    select count(*)::int as n
    from role_requests
    where user_id = ${userId} and requested_role = ${"coach"}
  `)[0]?.n ?? 0;
}
async function loadProfile(userId: string): Promise<Profile | null> {
	await ensureSuperuserColumn();
	const rows = await ((await getSql()) as any)`
    select user_id, email, requested_role, home_role, request_status, is_superuser, can_manage_admins
    from profiles
    where user_id = ${userId}
    limit 1
  `;
	if (!rows[0]) return null;
	return mapProfile(rows[0], await countCoachRequests(userId));
}
async function requireScheduleReader(userId: string) {
	const profile = await loadProfile(userId);
	if (!profile || (profile.homeRole !== "admin" && profile.homeRole !== "coach")) {
		throw new Error("You can’t view the schedule.");
	}
	return profile;
}
async function requireAdmin(userId: any) {
	const profile = await loadProfile(userId);
	if (!profile || profile.homeRole !== "admin") throw new Error("Only an Admin can do that.");
	return profile;
}
async function requireSuperuser(userId: string) {
	const profile = await requireAdmin(userId);
	if (!profile.isSuperuser) throw new Error("Only a superuser can do that.");
	return profile;
}

async function requireAdminManager(userId: string) {
	const profile = await requireAdmin(userId);
	if (!profile.canManageAdmins) throw new Error("You aren’t allowed to manage administrators.");
	return profile;
}

let superuserColumnReady: Promise<void> | null = null;
function ensureSuperuserColumn(): Promise<void> {
	if (!superuserColumnReady) {
		superuserColumnReady = (async () => {
			const sql: any = await getSql();
			await sql.query("alter table profiles add column if not exists is_superuser boolean not null default false");
			await sql.query("alter table profiles add column if not exists can_manage_admins boolean not null default false");
			await sql.query("alter table profiles add column if not exists view_as_coach_id text");
		})().catch((error) => {
			superuserColumnReady = null;
			throw error;
		});
	}
	return superuserColumnReady;
}
async function requireCoach(userId: any) {
	const profile = await loadProfile(userId);
	if (!profile || (profile.homeRole !== "coach" && !profile.isSuperuser)) {
		throw new Error("Only an approved Coach can do that.");
	}
	return profile;
}

async function applyViewAs(context: { userId: string }) {
	const profile = await loadProfile(context.userId);
	if (!profile?.isSuperuser) return;
	await ensureSuperuserColumn();
	const row = (await ((await getSql()) as any)`select view_as_coach_id from profiles where user_id = ${context.userId} limit 1`)[0];
	const target = row?.view_as_coach_id ? String(row.view_as_coach_id) : "";
	if (!target || target === context.userId) return;
	const coach = (await ((await getSql()) as any)`select user_id from profiles where user_id = ${target} and home_role = ${"coach"} limit 1`)[0];
	if (coach) context.userId = String(coach.user_id);
}

export const liveStamp = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<{ stamp: string }> => {
	const before = context.userId;
	const profile = await loadProfile(before);
	await applyViewAs(context);
	const coachView = profile?.homeRole === "coach" || context.userId !== before;
	const sql: any = await getSql();
	const row = coachView
		? (await sql`
      select md5(concat_ws('|'
        , coalesce((select string_agg(id::text || ':' || status || ':' || weekend_id::text, ',' order by id) from teams where coach_user_id = ${context.userId}), '')
        , coalesce((select string_agg(id::text || ':' || lifecycle || ':' || name, ',' order by id) from weekends), '')
        , coalesce((select string_agg(weekend_id::text || ':' || choice, ',' order by weekend_id) from tournament_responses where coach_user_id = ${context.userId}), '')
        , coalesce((select max(id) from notifications where user_id = ${context.userId}), 0)::text
      )) as stamp
    `)[0]
		: (await sql`
      select md5(concat_ws('|'
        , coalesce((select string_agg(id::text || ':' || status || ':' || weekend_id::text || ':' || coalesce(coach_user_id, ''), ',' order by id) from teams), '')
        , coalesce((select string_agg(id::text || ':' || lifecycle || ':' || name, ',' order by id) from weekends), '')
        , coalesce((select string_agg(coach_user_id || ':' || weekend_id::text || ':' || choice, ',' order by weekend_id, coach_user_id) from tournament_responses), '')
        , coalesce((select max(id) from notifications where user_id = ${before}), 0)::text
      )) as stamp
    `)[0];
	return { stamp: String(row?.stamp || "") };
});

async function actAsCoach(context: { userId: string }) {
	await requireCoach(context.userId);
	await applyViewAs(context);
}
async function adminCount() {
	return (await ((await getSql()) as any)`
    select count(*)::int as n from profiles where home_role = 'admin'
  `)[0]?.n ?? 0;
}
async function notifyAdmins(title: string, body: string, kind = "teams", refKey: string | null = null) {
	const sql: any = await getSql();
	const admins = await sql`select user_id from profiles where home_role = ${"admin"}`;
	for (const admin of admins) {
		await sql`
      insert into notifications (user_id, title, body, kind, ref_key)
      values (${admin.user_id}, ${title}, ${body}, ${kind}, ${refKey})
    `;
	}
}

async function insertNotification(userId: any, title: any, body: any, kind = "status", refKey: string | null = null) {
	const sql: any = await getSql();
	if (refKey) {
		const existing = (await sql`select id from notifications where user_id = ${userId} and ref_key = ${refKey} limit 1`)[0];
		if (existing) return;
	}
	await sql`
    insert into notifications (user_id, title, body, kind, ref_key)
    values (${userId}, ${title}, ${body}, ${kind}, ${refKey})
  `;
}
export const ensureBootAccounts = createServerFn({ method: "POST" }).handler(async () => {
	const { ensureSeedAdmin } = await import("./seed-admin");
	await ensureSeedAdmin();
	return { ok: true as const };
});
export const getMyProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<Profile | null> => {
	return loadProfile(context.userId);
});
async function acceptCoachInvite(sql: any, userId: string, inviteId: number | null) {
	if (!inviteId) return;
	const now = new Date().toISOString();
	await sql`
    update coach_invites
    set accepted_user_id = ${userId}, accepted_at = ${now}
    where id = ${inviteId} and accepted_user_id is null
  `;
}

function phoneLast10(value: string): string {
	const digits = value.replace(/\D/g, "");
	return digits.length >= 10 ? digits.slice(-10) : "";
}

async function ensureSignupColumns(): Promise<void> {
	const sql: any = await getSql();
	await sql.query("alter table profiles add column if not exists phone text");
	await sql.query("alter table profiles add column if not exists club text");
	await sql.query("alter table profiles add column if not exists admin_note text");
	try {
		await sql.query(`create unique index if not exists profiles_phone_last10_idx
      on profiles (right(regexp_replace(phone, '[^0-9]', '', 'g'), 10))
      where phone is not null and length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 10`);
	} catch {
		// The duplicate check still runs in code if this index cannot be built.
	}
	await sql.query(`create table if not exists coach_signup_teams (
    id serial primary key,
    user_id text not null,
    name text not null,
    age_group text not null
  )`);
	await sql.query(`create table if not exists coach_roster_players (
    id serial primary key,
    team_id integer not null references coach_signup_teams (id) on delete cascade,
    name text not null,
    jersey integer not null,
    birthday date,
    created_at timestamptz not null default now(),
    constraint coach_roster_jersey_ok check (jersey >= 0 and jersey <= 99)
  )`);
	await sql.query("create unique index if not exists coach_roster_team_jersey_idx on coach_roster_players (team_id, jersey)");
	await sql.query("alter table coach_roster_players add column if not exists birthday date");
}

export const checkSignupOpen = createServerFn({ method: "POST" }).validator((data: any): { email: string; phone: string } => {
	const email = normalizeEmail(String(data?.email ?? ""));
	const phone = String(data?.phone ?? "").trim();
	if (!email.includes("@")) throw new Error("Enter an email.");
	if (!phoneLast10(phone)) throw new Error("Enter a cell phone.");
	return { email, phone };
}).handler(async ({ data }) => {
	await ensureSignupColumns();
	const sql: any = await getSql();
	const emailTaken = (await sql`select id from "user" where lower(email) = ${data.email} limit 1`)[0];
	if (emailTaken) throw new Error("An account with that email already exists. Sign in instead.");
	const want = phoneLast10(data.phone);
	const phones = await sql`select phone from profiles where phone is not null`;
	if (phones.some((row: any) => phoneLast10(String(row.phone || "")) === want)) {
		throw new Error("An account with that phone number already exists. Sign in instead.");
	}
	return { ok: true as const };
});

function parseSignupTeams(value: unknown): { name: string; ageGroup: AgeGroup }[] | null {
	if (!Array.isArray(value)) return null;
	const teams = value.map((team) => {
		const name = String(team?.name ?? "").trim();
		const ageGroup = String(team?.ageGroup ?? "");
		if (!name) throw new Error("Enter a team name.");
		if (!isAgeGroup(ageGroup)) throw new Error("Pick an age from 8U to 17U.");
		return { name, ageGroup };
	});
	if (teams.length === 0) throw new Error("Add at least one team.");
	return teams;
}

export const completeOnboarding = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any): { role: Role; teamName: string | null; reason: string | null; inviteId: number | null; phone: string | null; club: string | null; teams: { name: string; ageGroup: AgeGroup }[]; name: string | null } => {
	if (!data || !isRole(data.role)) throw new Error("Pick a role to continue.");
	if (data.role === "parent" || data.role === "athlete") throw new Error("Create a Coach or Admin account.");
	const inviteId = Number.isInteger(data.inviteId) && data.inviteId > 0 ? data.inviteId : null;
	const rawPhone = String(data?.phone ?? "").trim();
	const phone = rawPhone ? rawPhone : null;
	if (phone && !phoneLast10(phone)) throw new Error("Enter a cell phone.");
	const clubRaw = String(data?.club ?? "").trim();
	const name = String(data?.name ?? "").trim();
	if (data.role === "admin" && !name) throw new Error("Enter your name.");
	if (data.role === "coach") {
		const teams = parseSignupTeams(data.teams);
		if (teams) {
			const teamName = teams.map((team) => `${team.name} · ${team.ageGroup}`).join(", ");
			return { role: data.role, teamName, reason: null, inviteId, phone, club: clubRaw || null, teams, name: name || null };
		}
		const access = parseCoachAccess(data);
		return { role: data.role, teamName: access.teamName, reason: access.reason, inviteId, phone, club: clubRaw || null, teams: [], name: name || null };
	}
	return { role: data.role, teamName: null, reason: null, inviteId, phone, club: null, teams: [], name: name || null };
}).handler(async ({ context, data }) => {
	const existing = await loadProfile(context.userId);
	if (existing) return existing;
	const authUser = await loadAuthUser(context.userId);
	const email = normalizeEmail(authUser?.email ?? "");
	const role = data.role;
	const seed = isSeedAdminEmail(email);
	const noAdminYet = await adminCount() === 0;
	let homeRole;
	let requestStatus;
	if (seed) {
		homeRole = "admin";
		requestStatus = "none";
	} else if (role === "parent" || role === "athlete") {
		homeRole = role;
		requestStatus = "none";
	} else if (role === "coach") {
		homeRole = "coach";
		requestStatus = "none";
	} else if (role === "admin" && noAdminYet) {
		homeRole = "admin";
		requestStatus = "none";
	} else {
		homeRole = "parent";
		requestStatus = "pending";
	}
	const sql: any = await getSql();
	await ensureSignupColumns();
	const want = data.phone ? phoneLast10(data.phone) : "";
	if (want) {
		const phones = await sql`select user_id, phone from profiles where phone is not null`;
		if (phones.some((row: any) => row.user_id !== context.userId && phoneLast10(String(row.phone || "")) === want)) {
			throw new Error("An account with that phone number already exists. Sign in instead.");
		}
	}
	await sql`
      insert into profiles (user_id, email, phone, club, requested_role, home_role, request_status)
      values (
        ${context.userId},
        ${email || `user-${context.userId}`},
        ${data.phone},
        ${data.club},
        ${seed ? "admin" : role},
        ${homeRole},
        ${requestStatus}
      )
    `;
	if (data.name) {
		await sql`update "user" set name = ${data.name} where id = ${context.userId}`;
	}
	if (role === "coach") {
		for (const team of data.teams) {
			await sql`
        insert into coach_signup_teams (user_id, name, age_group)
        values (${context.userId}, ${team.name}, ${team.ageGroup})
      `;
		}
		await acceptCoachInvite(sql, context.userId, data.inviteId);
	} else if (requestStatus === "pending" && isElevatedRole(role)) {
		await sql`
        insert into role_requests (user_id, email, requested_role, status, team_name, reason)
        values (
          ${context.userId},
          ${email || `user-${context.userId}`},
          ${role},
          ${"pending"},
          ${data.teamName},
          ${data.reason}
        )
      `;
		const label = role === "admin" ? "Admin" : "Coach";
		await insertNotification(context.userId, `${label} access pending`, `Your ${label} access is waiting for Admin approval. You can still use Parent tools in the meantime.`);
	} else if (homeRole === "admin") await insertNotification(context.userId, "Admin access is active", "You can approve coaches and other admins from your home screen.");
	const created = await loadProfile(context.userId);
	if (!created) throw new Error("Could not save your role. Try again.");
	return created;
});

/** First-time coach accounts used to sit in the admin inbox. They are coaches already, so close those requests. */
async function settleFirstCoachSignups(): Promise<void> {
	const sql: any = await getSql();
	const rows = await sql`
    select user_id from profiles
    where requested_role = ${"coach"} and home_role = ${"coach"} and request_status = ${"pending"}
  `;
	if (rows.length === 0) return;
	const now = new Date().toISOString();
	for (const row of rows) {
		const userId = String(row.user_id);
		await sql`
      update role_requests
      set status = ${"approved"}, reviewed_at = ${now}
      where user_id = ${userId} and requested_role = ${"coach"} and status = ${"pending"}
    `;
		await sql`
      update profiles
      set request_status = ${"none"}, updated_at = ${now}
      where user_id = ${userId}
    `;
		await sql`delete from notifications where ref_key = ${`coach-signup-${userId}`}`;
	}
}

export const listNotifications = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<NotificationItem[]> => {
	await settleFirstCoachSignups();
	await ensureFinalizeNotices(context.userId);
	await applyViewAs(context);
	const sql: any = await getSql();
	await pruneAvailableNotices(sql);
	const rows = await sql`
      select id, title, body, kind, read, created_at, ref_key
      from notifications
      where user_id = ${context.userId}
      order by created_at desc
      limit 50
    `;
	const live = new Set<number>((await sql`select id from weekends`).map((row: any) => Number(row.id)));
	return rows
		.map((r: any) => ({
			id: r.id,
			title: r.title,
			body: r.body,
			kind: r.kind,
			read: r.read,
			createdAt: r.created_at,
			weekendId: availableWeekendId(r, live),
			refKey: r.ref_key ? String(r.ref_key) : null,
		}))
		.filter((item: NotificationItem) => item.kind !== "available" || item.weekendId != null);
});

function availableWeekendId(row: any, live: Set<number>): number | null {
	const ref = String(row.ref_key || "");
	if (!ref.startsWith("available-")) return null;
	const id = Number(ref.slice("available-".length));
	return live.has(id) ? id : null;
}

async function pruneAvailableNotices(sql: any) {
	const live = await sql`select id, name from weekends`;
	const liveIds = new Set(live.map((row: any) => Number(row.id)));
	const byName = new Map<string, number[]>();
	for (const row of live) {
		const key = String(row.name || "").trim().toLowerCase();
		const list = byName.get(key) ?? [];
		list.push(Number(row.id));
		byName.set(key, list);
	}
	const notices = await sql`
    select id, user_id, title, body, kind, ref_key
    from notifications
    where kind = ${"available"}
       or lower(body) like ${"%if your team is interested%"}
  `;
	for (const notice of notices) {
		const ref = String(notice.ref_key || "");
		if (ref.startsWith("available-")) {
			const id = Number(ref.slice("available-".length));
			if (!liveIds.has(id)) await sql`delete from notifications where id = ${notice.id}`;
			continue;
		}
		const matches = byName.get(String(notice.title || "").trim().toLowerCase()) ?? [];
		if (matches.length !== 1) {
			await sql`delete from notifications where id = ${notice.id}`;
			continue;
		}
		const key = `available-${matches[0]}`;
		const taken = (await sql`select id from notifications where user_id = ${notice.user_id} and ref_key = ${key} limit 1`)[0];
		if (taken) await sql`delete from notifications where id = ${notice.id}`;
		else await sql`update notifications set kind = ${"available"}, ref_key = ${key} where id = ${notice.id}`;
	}
}
export const markNotificationsRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any): { ids: number[] } => {
	const ids = Array.isArray(data?.ids) ? data.ids.filter((id: unknown) => Number.isInteger(id) && (id as number) > 0) : [];
	return { ids };
}).handler(async ({ context, data }): Promise<{ ok: true }> => {
	await applyViewAs(context);
	const sql: any = await getSql();
	for (const id of data.ids) {
		await sql`update notifications set read = true where user_id = ${context.userId} and id = ${id} and read = false`;
	}
	return { ok: true };
});
export const listPendingRequests = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<PendingRequest[]> => {
	await requireAdmin(context.userId);
	await ensureSignupColumns();
	await settleFirstCoachSignups();
	const sql: any = await getSql();
	await sql`
    update profiles
    set home_role = ${"coach"}
    where requested_role = ${"coach"} and request_status = ${"pending"} and home_role <> ${"admin"}
  `;
	const rows = await sql`
      select
        rr.id,
        rr.user_id,
        rr.email,
        rr.requested_role,
        rr.team_name,
        rr.reason,
        rr.created_at,
        u.name as coach_name,
        p.phone,
        p.club,
        (
          select count(*)::int
          from role_requests r2
          where r2.user_id = rr.user_id
            and r2.requested_role = rr.requested_role
        ) as attempt
      from role_requests rr
      left join "user" u on u.id = rr.user_id
      left join profiles p on p.user_id = rr.user_id
      where rr.status = 'pending'
      order by rr.created_at asc
    `;
	const teams = await sql`select user_id, name, age_group from coach_signup_teams order by id asc`;
	const byUser = new Map<string, { name: string; ageGroup: string }[]>();
	for (const team of teams) {
		const list = byUser.get(team.user_id) ?? [];
		list.push({ name: String(team.name), ageGroup: String(team.age_group) });
		byUser.set(team.user_id, list);
	}
	return rows.map((r: any) => {
		const rawName = typeof r.coach_name === "string" ? r.coach_name.trim() : "";
		const generic = rawName.toLowerCase() === "coach" || rawName.toLowerCase() === "admin" || rawName.toLowerCase() === "parent" || rawName.toLowerCase() === "athlete";
		return {
			id: r.id,
			userId: r.user_id,
			email: r.email,
			requestedRole: r.requested_role,
			name: rawName && !generic ? rawName : null,
			phone: r.phone ? String(r.phone) : null,
			club: r.club ? String(r.club) : null,
			teamName: r.team_name,
			teams: byUser.get(r.user_id) ?? [],
			reason: r.reason,
			createdAt: r.created_at,
			attempt: r.attempt,
		};
	});
});
export const listDirectory = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<DirectoryUser[]> => {
	await requireAdmin(context.userId);
	await ensureSuperuserColumn();
	return (await ((await getSql()) as any)`
      select p.user_id, p.email, p.phone, u.name as person_name,
             (
               select dc.name from directory_coaches dc
               where dc.user_id = p.user_id or lower(dc.email) = lower(p.email)
               order by case when dc.user_id = p.user_id then 0 else 1 end, dc.id
               limit 1
             ) as directory_name,
             p.requested_role, p.home_role, p.request_status, p.is_superuser, p.can_manage_admins
      from profiles p
      left join "user" u on u.id = p.user_id
      order by p.created_at desc
    `).map((r: any) => ({
		userId: r.user_id,
		email: r.email,
		name: accountDisplayName(r.directory_name, r.person_name, r.email),
		phone: r.phone ? String(r.phone) : null,
		requestedRole: r.requested_role,
		homeRole: r.home_role,
		requestStatus: r.request_status,
		isSuperuser: Boolean(r.is_superuser),
		canManageAdmins: Boolean(r.is_superuser) || Boolean(r.can_manage_admins),
	}));
});

function accountDisplayName(directoryName: unknown, userName: unknown, email: unknown): string | null {
	const mail = typeof email === "string" ? email.trim().toLowerCase() : "";
	for (const value of [directoryName, userName]) {
		const name = personName(value);
		if (!name) continue;
		if (mail && name.toLowerCase() === mail) continue;
		return name;
	}
	return null;
}

function personName(value: unknown): string | null {
	const raw = typeof value === "string" ? value.trim() : "";
	if (!raw) return null;
	const generic = ["coach", "admin", "parent", "athlete", "user"].includes(raw.toLowerCase());
	return generic ? null : raw;
}

export const removeAdministrator = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const userId = String(data?.userId ?? "").trim();
	if (!userId) throw new Error("Missing administrator.");
	return { userId };
}).handler(async ({ context, data }) => {
	await requireAdminManager(context.userId);
	if (data.userId === context.userId) throw new Error("You can’t remove your own account.");
	await ensureSuperuserColumn();
	const sql: any = await getSql();
	const target = (await sql`
    select user_id, email, home_role from profiles where user_id = ${data.userId} limit 1
  `)[0];
	if (!target || target.home_role !== "admin") throw new Error("That administrator is already gone.");
	if (isSuperuserOwner(target.email)) throw new Error("That superuser can’t be removed.");
	await sql`
    update profiles
    set home_role = ${"parent"}, is_superuser = ${false}, can_manage_admins = ${false}, request_status = ${"denied"}
    where user_id = ${data.userId}
  `;
	await sql`
    update role_requests
    set status = ${"denied"}
    where user_id = ${data.userId} and requested_role = ${"admin"} and status = ${"approved"}
  `;
	return { ok: true as const };
});

export const setSuperuser = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const userId = String(data?.userId ?? "").trim();
	if (!userId) throw new Error("Missing administrator.");
	return { userId, grant: Boolean(data?.grant) };
}).handler(async ({ context, data }) => {
	const actor = await requireSuperuser(context.userId);
	if (!actor.canGrantSuperuser) throw new Error("Only the original superuser can grant that access.");
	if (data.userId === context.userId && !data.grant) throw new Error("You can’t remove your own superuser access.");
	await ensureSuperuserColumn();
	const sql: any = await getSql();
	const target = (await sql`
    select user_id, email, home_role from profiles where user_id = ${data.userId} limit 1
  `)[0];
	if (!target || target.home_role !== "admin") throw new Error("Only an administrator can manage other admins.");
	if (isSuperuserOwner(target.email)) throw new Error("That account already manages administrators.");
	await sql`update profiles set can_manage_admins = ${data.grant} where user_id = ${data.userId}`;
	return { ok: true as const };
});

export const updateAdminAccount = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const userId = String(data?.userId ?? "").trim();
	const name = String(data?.name ?? "").trim();
	const phone = String(data?.phone ?? "").trim();
	const email = normalizeEmail(String(data?.email ?? ""));
	const password = String(data?.password ?? "");
	if (!userId) throw new Error("Missing administrator.");
	if (!name) throw new Error("Enter a name.");
	if (!phoneLast10(phone)) throw new Error("Enter a cell phone.");
	if (!email.includes("@")) throw new Error("Enter an email.");
	if (password && password.length < 8) throw new Error("Password is too short. Use at least 8 characters.");
	return { userId, name, phone, email, password };
}).handler(async ({ context, data }): Promise<DirectoryUser> => {
	await requireAdminManager(context.userId);
	if (data.userId === context.userId) throw new Error("You can’t edit your own account here.");
	await ensureSuperuserColumn();
	const sql: any = await getSql();
	const target = (await sql`
    select user_id, email, home_role, is_superuser, can_manage_admins, phone
    from profiles where user_id = ${data.userId} limit 1
  `)[0];
	if (!target || target.home_role !== "admin") throw new Error("That administrator is already gone.");
	if (isSuperuserOwner(target.email)) throw new Error("That superuser can’t be edited.");
	const emailTaken = (await sql`select id from "user" where lower(email) = ${data.email} and id <> ${data.userId} limit 1`)[0];
	if (emailTaken) throw new Error("Another account already uses that email.");
	const want = phoneLast10(data.phone);
	const phones = await sql`select user_id, phone from profiles where phone is not null and user_id <> ${data.userId}`;
	if (phones.some((row: any) => phoneLast10(String(row.phone || "")) === want)) {
		throw new Error("Another account already uses that phone number.");
	}
	const now = new Date().toISOString();
	await sql`update "user" set name = ${data.name}, email = ${data.email}, "updatedAt" = ${now} where id = ${data.userId}`;
	await sql`update profiles set email = ${data.email}, phone = ${data.phone} where user_id = ${data.userId}`;
	if (data.password) {
		const { hashPassword } = await import("better-auth/crypto");
		const hash = await hashPassword(data.password);
		const account = (await sql`select id from "account" where "userId" = ${data.userId} and "providerId" = ${"credential"} limit 1`)[0];
		if (account) await sql`update "account" set password = ${hash}, "updatedAt" = ${now} where id = ${account.id}`;
	}
	return {
		userId: data.userId,
		email: data.email,
		name: data.name,
		phone: data.phone,
		requestedRole: "admin",
		homeRole: "admin",
		requestStatus: "approved",
		isSuperuser: Boolean(target.is_superuser),
		canManageAdmins: Boolean(target.is_superuser) || Boolean(target.can_manage_admins),
	};
});

export type ViewCoach = { userId: string; name: string; email: string; team: string };

export const listViewCoaches = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<{ viewingId: string | null; coaches: ViewCoach[] }> => {
	await requireSuperuser(context.userId);
	await ensureSuperuserColumn();
	await ensureSignupColumns();
	const sql: any = await getSql();
	const me = (await sql`select view_as_coach_id from profiles where user_id = ${context.userId} limit 1`)[0];
	const people = await sql`
    select p.user_id, p.email, u.name as coach_name
    from profiles p
    left join "user" u on u.id = p.user_id
    where p.home_role = ${"coach"}
    order by coalesce(u.name, p.email) asc
  `;
	const teams = await sql`select user_id, name, age_group from coach_signup_teams order by id asc`;
	const byUser = new Map<string, string[]>();
	for (const team of teams) {
		const list = byUser.get(String(team.user_id)) ?? [];
		list.push(`${team.name} ${team.age_group}`);
		byUser.set(String(team.user_id), list);
	}
	return {
		viewingId: me?.view_as_coach_id ? String(me.view_as_coach_id) : null,
		coaches: people.map((row: any) => ({
			userId: String(row.user_id),
			name: String(row.coach_name || row.email || "Coach"),
			email: String(row.email || ""),
			team: (byUser.get(String(row.user_id)) ?? []).join(", "),
		})),
	};
});

export const setViewCoach = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	userId: typeof data?.userId === "string" ? data.userId.trim() : "",
})).handler(async ({ context, data }) => {
	await requireSuperuser(context.userId);
	await ensureSuperuserColumn();
	const sql: any = await getSql();
	if (!data.userId) {
		await sql`update profiles set view_as_coach_id = null where user_id = ${context.userId}`;
		return { ok: true as const };
	}
	const coach = (await sql`select user_id from profiles where user_id = ${data.userId} and home_role = ${"coach"} limit 1`)[0];
	if (!coach) {
		await sql`update profiles set view_as_coach_id = null where user_id = ${context.userId}`;
		return { ok: true as const, missing: true as const };
	}
	await sql`update profiles set view_as_coach_id = ${data.userId} where user_id = ${context.userId}`;
	return { ok: true as const };
});

export type CoachRecord = {
  userId: string;
  name: string | null;
  email: string;
  phone: string | null;
  club: string | null;
  note: string;
  status: "approved" | "pending";
  teams: { id: number | null; name: string; ageGroup: string | null }[];
};

export const listCoachDirectory = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<CoachRecord[]> => {
	await requireAdmin(context.userId);
	await ensureSignupColumns();
	const sql: any = await getSql();
	const people = await sql`
    select p.user_id, p.email, p.phone, p.club, p.admin_note, p.home_role, u.name as coach_name
    from profiles p
    left join "user" u on u.id = p.user_id
    where p.home_role = ${"coach"}
    order by p.email asc
  `;
	const signupTeams = await sql`select id, user_id, name, age_group from coach_signup_teams order by id asc`;
	const byUser = new Map<string, { id: number | null; name: string; ageGroup: string | null }[]>();
	for (const team of signupTeams) {
		const list = byUser.get(team.user_id) ?? [];
		list.push({ id: Number(team.id), name: String(team.name), ageGroup: String(team.age_group) });
		byUser.set(team.user_id, list);
	}
	const missing = people.filter((row: any) => !(byUser.get(row.user_id)?.length));
	if (missing.length > 0) {
		const requests = await sql`
      select user_id, team_name
      from role_requests
      where requested_role = ${"coach"} and team_name is not null and btrim(team_name) <> ''
      order by created_at desc
    `;
		for (const row of requests) {
			if (byUser.get(row.user_id)?.length) continue;
			byUser.set(row.user_id, [{ id: null, name: String(row.team_name), ageGroup: null }]);
		}
	}
	return people
		.map((row: any) => {
			const rawName = typeof row.coach_name === "string" ? row.coach_name.trim() : "";
			const generic = ["coach", "admin", "parent", "athlete"].includes(rawName.toLowerCase());
			return {
				userId: row.user_id,
				name: rawName && !generic ? rawName : null,
				email: String(row.email),
				phone: row.phone ? String(row.phone) : null,
				club: row.club ? String(row.club) : null,
				note: row.admin_note ? String(row.admin_note) : "",
				status: "approved" as const,
				teams: byUser.get(row.user_id) ?? [],
			};
		})
		.sort((a: CoachRecord, b: CoachRecord) => (a.name || a.email).localeCompare(b.name || b.email));
});

function parseCoachEdit(data: any) {
	const userId = String(data?.userId ?? "").trim();
	const name = String(data?.name ?? "").trim();
	const phone = String(data?.phone ?? "").trim();
	const email = normalizeEmail(String(data?.email ?? ""));
	const club = String(data?.club ?? "").trim();
	const note = String(data?.note ?? "").trim();
	if (!userId) throw new Error("Missing coach.");
	if (!name) throw new Error("Enter the coach's name.");
	if (!phoneLast10(phone)) throw new Error("Enter a cell phone.");
	if (!email.includes("@")) throw new Error("Enter an email.");
	if (note.length > 1000) throw new Error("Keep the note under 1000 characters.");
	const teams = parseSignupTeams(data?.teams);
	if (!teams) throw new Error("Add at least one team.");
	return { userId, name, phone, email, club: club || null, note, teams };
}

export const updateCoachDirectory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(parseCoachEdit).handler(async ({ context, data }): Promise<CoachRecord> => {
	await requireAdmin(context.userId);
	await ensureSignupColumns();
	const sql: any = await getSql();
	const profile = (await sql`select user_id from profiles where user_id = ${data.userId} and home_role = ${"coach"} limit 1`)[0];
	if (!profile) throw new Error("That coach is no longer on the list.");
	const emailTaken = (await sql`select id from "user" where lower(email) = ${data.email} and id <> ${data.userId} limit 1`)[0];
	if (emailTaken) throw new Error("Another account already uses that email.");
	const want = phoneLast10(data.phone);
	const phones = await sql`select user_id, phone from profiles where phone is not null and user_id <> ${data.userId}`;
	if (phones.some((row: any) => phoneLast10(String(row.phone || "")) === want)) {
		throw new Error("Another account already uses that phone number.");
	}
	await sql`update "user" set name = ${data.name}, email = ${data.email} where id = ${data.userId}`;
	await sql`
    update profiles
    set email = ${data.email}, phone = ${data.phone}, club = ${data.club}, admin_note = ${data.note || null}
    where user_id = ${data.userId}
  `;
	await sql`delete from coach_signup_teams where user_id = ${data.userId}`;
	const savedTeams: { id: number | null; name: string; ageGroup: string }[] = [];
	for (const team of data.teams) {
		const inserted = await sql`
      insert into coach_signup_teams (user_id, name, age_group)
      values (${data.userId}, ${team.name}, ${team.ageGroup})
      returning id
    `;
		savedTeams.push({ id: inserted[0]?.id == null ? null : Number(inserted[0].id), name: team.name, ageGroup: team.ageGroup });
	}
	return {
		userId: data.userId,
		name: data.name,
		email: data.email,
		phone: data.phone,
		club: data.club,
		note: data.note,
		status: "approved",
		teams: savedTeams,
	};
});

export type MyCoachAccount = {
	name: string;
	phone: string;
	email: string;
	club: string;
	teams: { name: string; ageGroup: AgeGroup }[];
};

export const getMyCoachAccount = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<MyCoachAccount> => {
	const profile = await loadProfile(context.userId);
	if (!profile || profile.homeRole !== "coach") throw new Error("Only a coach can edit this account.");
	await ensureSignupColumns();
	const sql: any = await getSql();
	const row = (await sql`
    select u.name, p.email, p.phone, p.club
    from profiles p
    join "user" u on u.id = p.user_id
    where p.user_id = ${context.userId}
    limit 1
  `)[0];
	if (!row) throw new Error("That account is missing.");
	const teams = await sql`select name, age_group from coach_signup_teams where user_id = ${context.userId} order by id asc`;
	return {
		name: String(row.name || ""),
		phone: row.phone ? formatPhoneInput(String(row.phone)) : "",
		email: String(row.email || ""),
		club: row.club ? String(row.club) : "",
		teams: teams.map((team: any) => ({ name: String(team.name), ageGroup: String(team.age_group) as AgeGroup })),
	};
});

export const updateMyCoachAccount = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const name = String(data?.name ?? "").trim();
	const phone = formatPhoneInput(String(data?.phone ?? ""));
	const email = normalizeEmail(String(data?.email ?? ""));
	const club = String(data?.club ?? "").trim();
	const password = String(data?.password ?? "");
	if (!name) throw new Error("Enter your name.");
	if (!phoneLast10(phone)) throw new Error("Enter a cell phone.");
	if (!email.includes("@")) throw new Error("Enter an email.");
	if (password && password.length < 8) throw new Error("Password is too short. Use at least 8 characters.");
	const teams = parseSignupTeams(data?.teams);
	if (!teams) throw new Error("Add at least one team.");
	return { name, phone, email, club: club || null, password, teams };
}).handler(async ({ context, data }): Promise<{ ok: true }> => {
	const profile = await loadProfile(context.userId);
	if (!profile || profile.homeRole !== "coach") throw new Error("Only a coach can edit this account.");
	await ensureSignupColumns();
	const sql: any = await getSql();
	const emailTaken = (await sql`select id from "user" where lower(email) = ${data.email} and id <> ${context.userId} limit 1`)[0];
	if (emailTaken) throw new Error("Another account already uses that email.");
	const want = phoneLast10(data.phone);
	const phones = await sql`select user_id, phone from profiles where phone is not null and user_id <> ${context.userId}`;
	if (phones.some((row: any) => phoneLast10(String(row.phone || "")) === want)) {
		throw new Error("Another account already uses that phone number.");
	}
	const now = new Date().toISOString();
	await sql`update "user" set name = ${data.name}, email = ${data.email}, "updatedAt" = ${now} where id = ${context.userId}`;
	await sql`
    update profiles
    set email = ${data.email}, phone = ${data.phone}, club = ${data.club}
    where user_id = ${context.userId}
  `;
	const existing = await sql`select id from coach_signup_teams where user_id = ${context.userId} order by id asc`;
	for (let i = 0; i < data.teams.length; i += 1) {
		const team = data.teams[i];
		const row = existing[i];
		if (row) {
			await sql`update coach_signup_teams set name = ${team.name}, age_group = ${team.ageGroup} where id = ${row.id}`;
		} else {
			await sql`insert into coach_signup_teams (user_id, name, age_group) values (${context.userId}, ${team.name}, ${team.ageGroup})`;
		}
	}
	for (const row of existing.slice(data.teams.length)) {
		await sql`delete from coach_roster_players where team_id = ${row.id}`;
		await sql`delete from coach_signup_teams where id = ${row.id}`;
	}
	if (data.password) {
		const { hashPassword } = await import("better-auth/crypto");
		const hash = await hashPassword(data.password);
		const account = (await sql`select id from "account" where "userId" = ${context.userId} and "providerId" = ${"credential"} limit 1`)[0];
		if (account) {
			await sql`update "account" set password = ${hash}, "updatedAt" = ${now} where id = ${account.id}`;
		}
	}
	return { ok: true as const };
});

export const changeMyPassword = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const password = String(data?.password ?? "");
	if (password.length < 8) throw new Error("Password is too short. Use at least 8 characters.");
	return { password };
}).handler(async ({ context, data }): Promise<{ ok: true }> => {
	const profile = await loadProfile(context.userId);
	if (!profile || profile.homeRole !== "coach") throw new Error("Only a coach can change this password.");
	const sql: any = await getSql();
	const account = (await sql`select id from "account" where "userId" = ${context.userId} and "providerId" = ${"credential"} limit 1`)[0];
	if (!account) throw new Error("This account does not use a password.");
	const { hashPassword } = await import("better-auth/crypto");
	const hash = await hashPassword(data.password);
	await sql`update "account" set password = ${hash}, "updatedAt" = ${new Date().toISOString()} where id = ${account.id}`;
	return { ok: true as const };
});

export const addCoachDirectory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any): { name: string; phone: string; email: string; teamName: string; ageGroup: AgeGroup } => {
	const name = String(data?.name ?? "").trim();
	const phone = String(data?.phone ?? "").trim();
	const email = normalizeEmail(String(data?.email ?? ""));
	const teamName = String(data?.teamName ?? "").trim();
	const ageGroup = String(data?.ageGroup ?? "");
	if (!name) throw new Error("Enter the coach's name.");
	if (!phoneLast10(phone)) throw new Error("Enter a cell phone.");
	if (!email.includes("@")) throw new Error("Enter an email.");
	if (!teamName) throw new Error("Enter a team name.");
	if (!isAgeGroup(ageGroup)) throw new Error("Pick an age from 8U to 17U.");
	return { name, phone, email, teamName, ageGroup };
}).handler(async ({ context, data }): Promise<CoachRecord> => {
	await requireAdmin(context.userId);
	await ensureSignupColumns();
	const sql: any = await getSql();
	const emailTaken = (await sql`select id from "user" where lower(email) = ${data.email} limit 1`)[0];
	if (emailTaken) throw new Error("Another account already uses that email.");
	const want = phoneLast10(data.phone);
	const phones = await sql`select phone from profiles where phone is not null`;
	if (phones.some((row: any) => phoneLast10(String(row.phone || "")) === want)) {
		throw new Error("Another account already uses that phone number.");
	}
	const id = crypto.randomUUID();
	const now = new Date().toISOString();
	await sql`
    insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
    values (${id}, ${data.name}, ${data.email}, ${true}, ${now}, ${now})
  `;
	await sql`
    insert into profiles (user_id, email, phone, requested_role, home_role, request_status)
    values (${id}, ${data.email}, ${data.phone}, ${"coach"}, ${"coach"}, ${"none"})
  `;
	const inserted = await sql`
    insert into coach_signup_teams (user_id, name, age_group)
    values (${id}, ${data.teamName}, ${data.ageGroup})
    returning id
  `;
	return {
		userId: id,
		name: data.name,
		email: data.email,
		phone: data.phone,
		club: null,
		note: "",
		status: "approved",
		teams: [{ id: inserted[0]?.id == null ? null : Number(inserted[0].id), name: data.teamName, ageGroup: data.ageGroup }],
	};
});

export const removeCoachDirectory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const userId = String(data?.userId ?? "").trim();
	if (!userId) throw new Error("Missing coach.");
	return { userId };
}).handler(async ({ context, data }) => {
	await requireAdmin(context.userId);
	if (data.userId === context.userId) throw new Error("You can’t remove your own account here.");
	await ensureSignupColumns();
	const sql: any = await getSql();
	await sql`
    update profiles
    set home_role = ${"parent"}, request_status = ${"denied"}
    where user_id = ${data.userId} and home_role = ${"coach"}
  `;
	await sql`delete from coach_signup_teams where user_id = ${data.userId}`;
	await sql`
    update role_requests
    set status = ${"denied"}
    where user_id = ${data.userId} and requested_role = ${"coach"} and status = ${"approved"}
  `;
	return { ok: true as const };
});

function parseCoachInvite(data: any): { channel: "phone" | "email"; destination: string } {
	const channel = data?.channel === "phone" || data?.channel === "email" ? data.channel : null;
	const destination = String(data?.destination ?? "").trim();
	if (!channel) throw new Error("Choose text or email.");
	if (channel === "phone") {
		const digits = destination.replace(/\D/g, "");
		if (digits.length < 10) throw new Error("Enter a cell phone.");
		return { channel, destination };
	}
	const email = normalizeEmail(destination);
	if (!email.includes("@")) throw new Error("Enter an email.");
	return { channel, destination: email };
}

function mapCoachInvite(row: any): CoachInvite {
	return {
		id: row.id,
		channel: row.channel === "email" ? "email" : "phone",
		destination: String(row.destination),
		createdAt: new Date(row.created_at).toISOString(),
		accountEmail: row.account_email ? String(row.account_email) : null,
	};
}

export const listCoachInvites = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<CoachInvite[]> => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	const rows = await sql`
    select i.id, i.channel, i.destination, i.created_at, p.email as account_email
    from coach_invites i
    left join profiles p on p.user_id = i.accepted_user_id
    order by i.created_at desc
  `;
	return rows.map(mapCoachInvite);
});

export const createCoachInvite = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(parseCoachInvite).handler(async ({ context, data }): Promise<CoachInvite> => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	const created = (await sql`
    insert into coach_invites (channel, destination)
    values (${data.channel}, ${data.destination})
    returning id, channel, destination, created_at
  `)[0];
	if (!created) throw new Error("Could not save that invite.");
	return mapCoachInvite(created);
});
export const reviewRequest = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	if (!data || typeof data.id !== "number") throw new Error("Missing request.");
	if (data.action !== "approve" && data.action !== "deny") throw new Error("Choose Approve or Deny.");
	return data;
}).handler(async ({ context, data }) => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	const req = (await sql`
      select id, user_id, requested_role, status
      from role_requests
      where id = ${data.id}
      limit 1
    `)[0];
	if (!req || req.status !== "pending") throw new Error("That request is no longer pending.");
	if (req.user_id === context.userId) throw new Error("You can’t review your own request.");
	if (req.requested_role === "admin") {
		const actor = await loadProfile(context.userId);
		if (!actor?.canManageAdmins) throw new Error("Only someone allowed to manage admins can approve that.");
	}
	const now = (/* @__PURE__ */ new Date()).toISOString();
	if (data.action === "approve") {
		await sql`
        update role_requests
        set status = 'approved', reviewed_at = ${now}, reviewed_by = ${context.userId}
        where id = ${req.id}
      `;
		await sql`
        update profiles
        set home_role = ${req.requested_role},
            request_status = 'approved',
            updated_at = ${now}
        where user_id = ${req.user_id}
      `;
		const label = req.requested_role === "admin" ? "Admin" : "Coach";
		if (req.requested_role !== "coach") {
			await insertNotification(req.user_id, `${label} access approved`, `An Admin approved your ${label} access. Open home to use ${label} tools.`);
		}
		await sql`delete from notifications where ref_key = ${`coach-signup-${req.user_id}`}`;
	} else if (req.requested_role === "coach") {
		const coachId = String(req.user_id);
		await wipeUserAccount(sql, coachId);
		await sql`delete from notifications where ref_key = ${`coach-signup-${coachId}`}`;
	} else {
		await sql`
        update role_requests
        set status = 'denied', reviewed_at = ${now}, reviewed_by = ${context.userId}
        where id = ${req.id}
      `;
		await sql`
        update profiles
        set home_role = 'parent',
            request_status = 'denied',
            updated_at = ${now}
        where user_id = ${req.user_id}
      `;
		if (req.requested_role === "coach") {
			const notice = denyCoachNotice(await countCoachRequests(req.user_id));
			await insertNotification(req.user_id, notice.title, notice.body);
		} else await insertNotification(req.user_id, "Admin access denied", "An Admin denied Admin access. You can keep using Parent tools.");
	}
	return { ok: true };
});

export const reviewNewCoach = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const userId = String(data?.userId ?? "").trim();
	if (!userId) throw new Error("Missing coach.");
	if (data?.action !== "keep" && data?.action !== "remove") throw new Error("Choose keep or remove.");
	return { userId, action: data.action as "keep" | "remove" };
}).handler(async ({ context, data }) => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	const req = (await sql`
    select id from role_requests
    where user_id = ${data.userId} and requested_role = ${"coach"} and status = ${"pending"}
    order by id desc
    limit 1
  `)[0];
	if (!req) throw new Error("That coach was already reviewed.");
	const now = (/* @__PURE__ */ new Date()).toISOString();
	if (data.action === "keep") {
		await sql`
      update role_requests
      set status = 'approved', reviewed_at = ${now}, reviewed_by = ${context.userId}
      where id = ${req.id}
    `;
		await sql`
      update profiles
      set home_role = ${"coach"}, request_status = 'approved', updated_at = ${now}
      where user_id = ${data.userId}
    `;
	} else {
		await wipeUserAccount(sql, data.userId);
	}
	await sql`delete from notifications where ref_key = ${`coach-signup-${data.userId}`}`;
	return { ok: true as const };
});

export const resubmitCoachAccess = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => parseCoachAccess(data ?? {})).handler(async ({ context, data }) => {
	const profile = await loadProfile(context.userId);
	if (!profile) throw new Error("Finish creating your account first.");
	const sql: any = await getSql();
	if ((await sql`
      select id from role_requests
      where user_id = ${context.userId} and status = ${"pending"}
      limit 1
    `)[0]) throw new Error("Your Coach access is already waiting for Admin approval.");
	const count = await countCoachRequests(context.userId);
	const state = coachResubmitState({
		requestedRole: profile.requestedRole,
		requestStatus: profile.requestStatus,
		coachRequestCount: count
	});
	if (state.coachAccessLocked) throw new Error("Contact 423Sports Staff if you believe this was in error.");
	if (!state.canResubmitCoach) throw new Error("You can’t request Coach access from this account.");
	if (count >= 3) throw new Error("Contact 423Sports Staff if you believe this was in error.");
	const now = (/* @__PURE__ */ new Date()).toISOString();
	await sql`
      insert into role_requests (user_id, email, requested_role, status, team_name, reason)
      values (
        ${context.userId},
        ${profile.email},
        ${"coach"},
        ${"pending"},
        ${data.teamName},
        ${data.reason}
      )
    `;
	await sql`
      update profiles
      set requested_role = ${"coach"},
          home_role = ${"parent"},
          request_status = ${"pending"},
          updated_at = ${now}
      where user_id = ${context.userId}
    `;
	await insertNotification(context.userId, "Coach access pending", "Your Coach access is waiting for Admin approval. You can still use Parent tools in the meantime.");
	const next = await loadProfile(context.userId);
	if (!next) throw new Error("Could not send that request. Try again.");
	return next;
});
export const listWeekends = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<Weekend[]> => {
	await requireScheduleReader(context.userId);
	await ensureLiveOpsColumns();
	await pullTournamentsBackIntoEvents();
	await retireAnnouncedEvents();
	return (await ((await getSql()) as any)`
      select
        w.id,
        w.name,
        w.start_date,
        w.end_date,
        w.age_groups,
        w.max_teams,
        w.pool_play,
        w.day_plan,
        w.sunday_seeds_locked,
        w.bracket_locked,
        w.sheet_lock,
        w.bracket_rules,
        w.public_dirty,
        w.public_pushed_at,
        w.dirty_after_lock,
        w.lockout_choice,
        w.created_at,
        w.lifecycle,
        w.season,
        w.season_year,
        w.team_fee_cents,
        (select count(*)::int from weekend_locations l where l.weekend_id = w.id and l.name !~ '^Field [0-9]+ TBD$') as location_count,
        (select count(*)::int from teams t where t.weekend_id = w.id and t.status = ${"approved"}) as approved_count,
        (select count(*)::int from tournament_interest i where i.weekend_id = w.id) as interest_count,
        (
          select coalesce(json_agg(s.team_name), '[]'::json)
          from (
            select i.team_name
            from tournament_interest i
            where i.weekend_id = w.id
            order by i.id
          ) s
        ) as interested_teams,
        (
          select coalesce(json_object_agg(age_group, n), '{}'::json)
          from (
            select t.age_group, count(*)::int as n
            from teams t
            where t.weekend_id = w.id and t.status = ${"approved"}
            group by t.age_group
          ) counts
        ) as approved_by_age,
        exists (
          select 1 from games g
          where g.weekend_id = w.id and g.round <> ${"pool"} and g.is_bye = ${false}
        ) as has_bracket,
        exists (
          select 1 from games g
          where g.weekend_id = w.id
            and (g.home_score is not null or g.away_score is not null or g.forfeit is not null)
        ) as has_scored_game,
        (
          exists (
            select 1 from games g
            where g.weekend_id = w.id
              and g.round = ${"f"}
              and g.is_bye = ${false}
              and g.no_contest = ${false}
              and (
                g.forfeit is not null
                or (g.home_score is not null and g.away_score is not null and g.home_score <> g.away_score)
              )
          )
          and not exists (
            select 1 from games g
            where g.weekend_id = w.id
              and g.round = ${"f"}
              and g.is_bye = ${false}
              and g.no_contest = ${false}
              and g.forfeit is null
              and (g.home_score is null or g.away_score is null or g.home_score = g.away_score)
          )
        ) as has_champion,
        (
          (select count(*)::int from weekend_locations l where l.weekend_id = w.id) = 0
          or exists (
            select 1
            from weekend_locations l
            where l.weekend_id = w.id
              and (
                not exists (
                  select 1 from weekend_staff s
                  where s.location_id = l.id
                    and s.role = ${"gate"}
                    and (s.staff_id is not null or (coalesce(s.other_name, '') <> '' and coalesce(s.other_phone, '') <> ''))
                )
                or not exists (
                  select 1 from weekend_staff s
                  where s.location_id = l.id
                    and s.role = ${"scorekeeper"}
                    and (s.staff_id is not null or (coalesce(s.other_name, '') <> '' and coalesce(s.other_phone, '') <> ''))
                )
              )
          )
        ) as needs_staff
      from weekends w
      order by w.start_date asc, w.id asc
    `).map(mapWeekend);
});

export type SeasonCard = {
  season: Season;
  year: number;
  label: string;
  startDate: string;
  endDate: string;
  windowLabel: string;
  announcedCount: number;
  pastDeadline: boolean;
  deadlineCopy: string;
};

export type SeasonPlan = {
  season: Season;
  year: number;
  label: string;
  startDate: string;
  endDate: string;
  softDeadline: string;
  pastDeadline: boolean;
  deadlineCopy: string;
  announcedCount: number;
  overlaps: string[];
  weekends: SeasonSlot[];
  others: SeasonWindow[];
  warnings: string[];
  rollover: SeasonRollover;
};

export type SeasonRollover = {
  year: number;
  nextYear: number;
  fallEnd: string;
} | null;

export type SeasonBoard = {
  cards: SeasonCard[];
  rollover: SeasonRollover;
};

function dayText(value: unknown): string {
  if (value instanceof Date) return isoDateFromLocal(value);
  return String(value ?? "").slice(0, 10);
}

async function loadStoredWindows(): Promise<SeasonWindow[]> {
  const rows = await ((await getSql()) as any)`
    select season, season_year, start_date::text as start_date, end_date::text as end_date
    from season_windows
  `;
  const out: SeasonWindow[] = [];
  for (const row of rows) {
    if (!isSeason(row.season)) continue;
    const year = Number(row.season_year);
    const startDate = dayText(row.start_date);
    const endDate = dayText(row.end_date);
    if (!Number.isInteger(year)) continue;
    out.push({ season: row.season, year, startDate, endDate });
  }
  return out;
}

function windowFor(stored: SeasonWindow[], season: Season, year: number): SeasonWindow {
  return stored.find((row) => row.season === season && row.year === year) ?? defaultSeasonWindow(season, year);
}

async function loadPlanningYear(): Promise<number> {
  const sql: any = await getSql();
  await sql`
    insert into season_planning (id, planning_year)
    values (1, ${FIRST_SEASON_YEAR})
    on conflict (id) do nothing
  `;
  const row = (await sql`select planning_year from season_planning where id = 1`)[0];
  let year = Number(row?.planning_year);
  if (!Number.isInteger(year) || year < FIRST_SEASON_YEAR) year = FIRST_SEASON_YEAR;
  // The old start year was 2027. Stay on 2026 until two weeks after Fall ends.
  if (year === FIRST_SEASON_YEAR + 1) {
    const stored = await loadStoredWindows();
    const fall = windowFor(stored, "fall", FIRST_SEASON_YEAR);
    const today = isoDateFromLocal(new Date());
    if (!archiveIsDue(today, fall.endDate)) {
      await sql`update season_planning set planning_year = ${FIRST_SEASON_YEAR} where id = 1 and planning_year = ${year}`;
      year = FIRST_SEASON_YEAR;
    }
  }
  return year;
}

function rolloverFor(stored: SeasonWindow[], year: number, today: string): SeasonRollover {
  const fall = windowFor(stored, "fall", year);
  if (!archiveIsDue(today, fall.endDate)) return null;
  return { year, nextYear: year + 1, fallEnd: fall.endDate };
}

function neighborWindows(stored: SeasonWindow[], season: Season, year: number): SeasonWindow[] {
  const out: SeasonWindow[] = [];
  for (const y of [year - 1, year, year + 1]) {
    for (const name of ["spring", "summer", "fall"] as const) {
      if (name === season && y === year) continue;
      out.push(windowFor(stored, name, y));
    }
  }
  return out;
}

function parseSeasonRequest(data: any): { season: Season; year: number } {
  if (!isSeason(data?.season)) throw new Error("Pick Spring, Summer, or Fall.");
  const today = isoDateFromLocal(new Date());
  const fallback = preferredSeasonYear(data.season, today);
  const year = Number(data?.year);
  if (!Number.isInteger(year) || year < fallback - 1 || year > fallback + 2) return { season: data.season, year: fallback };
  return { season: data.season, year };
}

async function buildSeasonPlan(season: Season, year: number, warnings: string[] = []): Promise<SeasonPlan> {
  const sql: any = await getSql();
  const stored = await loadStoredWindows();
  const window = windowFor(stored, season, year);
  const others = neighborWindows(stored, season, year);
  const rows = await sql`
    select
      w.id,
      w.name,
      w.start_date::text as start_date,
      w.lifecycle,
      (select count(*)::int from teams t where t.weekend_id = w.id and t.status = ${"approved"}) as approved_count,
      exists (select 1 from games g where g.weekend_id = w.id) as has_games
    from weekends w
    where w.start_date >= ${window.startDate} and w.start_date <= ${window.endDate}
    order by w.start_date asc, w.id asc
  `;
  const byStart = new Map<string, any[]>();
  for (const row of rows) {
    const key = dayText(row.start_date);
    const list = byStart.get(key) ?? [];
    list.push(row);
    byStart.set(key, list);
  }
  const weekends: SeasonSlot[] = seasonSaturdays(window.startDate, window.endDate).map((slot) => {
    const hits = byStart.get(slot.startDate) ?? [];
    const announced = hits.find((row) => row.lifecycle === "announced");
    const live = hits.find((row) => row.lifecycle !== "announced");
    const row = announced ?? live ?? null;
    const approved = Number(row?.approved_count ?? 0);
    const hasGames = Boolean(row?.has_games);
    const blocked = Boolean(row) && (row.lifecycle !== "announced" || approved > 0 || hasGames);
    const name = announcedWeekendName(slot.startDate, slot.endDate);
    let blockReason: string | null = null;
    if (blocked && row?.lifecycle !== "announced") blockReason = `${name} is already a full tournament.`;
    else if (blocked) blockReason = `${name} has teams — open the tournament to cancel.`;
    return {
      startDate: slot.startDate,
      endDate: slot.endDate,
      name: row?.lifecycle === "announced" && row.name ? String(row.name) : name,
      weekendId: row ? Number(row.id) : null,
      selected: Boolean(row),
      blocked,
      blockReason,
    };
  });
  const selected = weekends.filter((slot) => slot.selected).map((slot) => slot.startDate);
  const deadline = softDeadline(window.startDate, selected[0] ?? null);
  const today = isoDateFromLocal(new Date());
  const announcedCount = weekends.filter((slot) => slot.selected && !slot.blockReason?.includes("full tournament")).length;
  return {
    season,
    year,
    label: seasonLabel(season),
    startDate: window.startDate,
    endDate: window.endDate,
    softDeadline: deadline,
    pastDeadline: today > deadline,
    deadlineCopy: softDeadlineCopy(season, deadline),
    announcedCount,
    overlaps: seasonOverlaps(window, others),
    weekends,
    others,
    warnings,
    rollover: rolloverFor(stored, year, today),
  };
}

export const listSeasonCards = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<SeasonBoard> => {
  const reader = await requireScheduleReader(context.userId);
  await ensureLiveOpsColumns();
  if (reader.homeRole === "admin") await ensureFinalizeNotices(context.userId);
  await retireAnnouncedEvents();
  const today = isoDateFromLocal(new Date());
  const stored = await loadStoredWindows();
  const year = await loadPlanningYear();
  const cards: SeasonCard[] = [];
  for (const season of ["spring", "summer", "fall"] as const) {
    const window = windowFor(stored, season, year);
    const countRow = (await ((await getSql()) as any)`
      select count(*)::int as n,
        min(start_date)::text as first_date
      from weekends
      where lifecycle <> ${"announced"} and season = ${season} and season_year = ${year}
    `)[0];
    const announcedCount = Number(countRow?.n ?? 0);
    const deadline = softDeadline(window.startDate, countRow?.first_date ? dayText(countRow.first_date) : null);
    cards.push({
      season,
      year,
      label: seasonLabel(season),
      startDate: window.startDate,
      endDate: window.endDate,
      windowLabel: formatSeasonSpan(window.startDate, window.endDate),
      announcedCount,
      pastDeadline: today > deadline && announcedCount === 0,
      deadlineCopy: softDeadlineCopy(season, deadline),
    });
  }
  return { cards, rollover: rolloverFor(stored, year, today) };
});

export const getSeasonPlan = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data: any) => parseSeasonRequest(data)).handler(async ({ context, data }): Promise<SeasonPlan> => {
  await requireScheduleReader(context.userId);
  await ensureLiveOpsColumns();
  const year = await loadPlanningYear();
  return buildSeasonPlan(data.season, year);
});

export const archivePlanningYear = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }): Promise<{ year: number }> => {
  await requireAdmin(context.userId);
  await ensureLiveOpsColumns();
  const year = await loadPlanningYear();
  const stored = await loadStoredWindows();
  const today = isoDateFromLocal(new Date());
  const fall = windowFor(stored, "fall", year);
  if (!archiveIsDue(today, fall.endDate)) throw new Error("Wait two weeks after Fall ends before you archive the year.");
  const next = year + 1;
  const sql: any = await getSql();
  await sql`update season_planning set planning_year = ${next} where id = 1 and planning_year = ${year}`;
  const now = await loadPlanningYear();
  if (now !== next) throw new Error("Could not archive that year. Try again.");
  return { year: now };
});

export const saveSeasonSchedule = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
  const seasonYear = parseSeasonRequest(data);
  const startDate = typeof data?.startDate === "string" ? data.startDate.slice(0, 10) : "";
  const endDate = typeof data?.endDate === "string" ? data.endDate.slice(0, 10) : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < startDate) {
    throw new Error("Pick a start and an end for this season.");
  }
  const saturdays = Array.isArray(data?.saturdays)
    ? data.saturdays.filter((value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value))
    : [];
  return { ...seasonYear, startDate, endDate, saturdays, notify: data?.notify !== false };
}).handler(async ({ context, data }): Promise<SeasonPlan> => {
  await requireAdmin(context.userId);
  await ensureLiveOpsColumns();
  const openYear = await loadPlanningYear();
  if (data.year !== openYear) throw new Error("That year is not open. Archive the current year first.");
  const sql: any = await getSql();
  await sql`
    insert into season_windows (season, season_year, start_date, end_date)
    values (${data.season}, ${data.year}, ${data.startDate}, ${data.endDate})
    on conflict (season, season_year)
    do update set start_date = ${data.startDate}, end_date = ${data.endDate}
  `;
  if (data.notify) {
    await notifySeasonCoaches(sql, data.season);
  }
  return buildSeasonPlan(data.season, data.year);
});

export const pushSeasonToCoaches = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => parseSeasonRequest(data)).handler(async ({ context, data }): Promise<{ ok: true }> => {
  await requireAdmin(context.userId);
  await ensureLiveOpsColumns();
  const sql: any = await getSql();
  await notifySeasonCoaches(sql, data.season);
  return { ok: true };
});

async function notifySeasonCoaches(sql: any, season: Season) {
  const coaches = await sql`select user_id from profiles where home_role = ${"coach"}`;
  const label = seasonLabel(season);
  for (const coach of coaches) {
    await insertNotification(coach.user_id, `${label} schedule updated`, `${label} schedule updated — open Schedule to see it.`);
  }
}

function reminderCopy(choice: string | null, name: string, when: string): string {
  const event = `${name}, ${when}`;
  if (choice === "interested") {
    return `This is a reminder of the upcoming tournament, ${event}. We are still gaining interest.`;
  }
  if (choice === "maybe") {
    return `This is a reminder of the upcoming tournament, ${event}. We are still gaining interest. You marked not sure yet.`;
  }
  if (choice === "no") {
    return `We still have several spots available for ${event} if you change your mind.`;
  }
  return `${name} is on the schedule for ${when}. Open Schedule if your team is interested.`;
}

type EventReminderCoach = {
  userId: string;
  name: string;
  phone: string | null;
  choice: "interested" | "maybe" | "no" | null;
  teams: { name: string; ageGroup: string | null }[];
};

function responseChoice(value: unknown): "interested" | "maybe" | "no" | null {
  return value === "interested" || value === "maybe" || value === "no" ? value : null;
}

async function eventReminderCoaches(sql: any, weekendId: number): Promise<EventReminderCoach[]> {
  const people = await textCoaches(sql);
  const responses = await sql`select coach_user_id, choice from tournament_responses where weekend_id = ${weekendId}`;
  const choiceOf = new Map<string, string>();
  for (const row of responses) choiceOf.set(String(row.coach_user_id), String(row.choice));
  return people.map((person) => ({
    ...person,
    choice: responseChoice(choiceOf.get(person.userId)),
  }));
}

export type ReminderTextList = {
  name: string;
  startDate: string;
  endDate: string;
  coaches: EventReminderCoach[];
};

export const openReminderTexts = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data: any) => ({
  weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
  includeNotInterested: data?.includeNotInterested === true,
})).handler(async ({ context, data }): Promise<ReminderTextList> => {
  await requireAdmin(context.userId);
  await ensureLiveOpsColumns();
  await ensureSignupColumns();
  const sql: any = await getSql();
  const weekend = (await sql`select id, name, age_groups, start_date::text as start_date, end_date::text as end_date from weekends where id = ${data.weekendId} limit 1`)[0];
  if (!weekend) throw new Error("That tournament is gone.");
  const coaches = (await eventReminderCoaches(sql, data.weekendId)).filter((coach) => data.includeNotInterested || coach.choice !== "no");
  return {
    name: nameWithAges(String(weekend.name || "A tournament"), parseStoredAgeGroups(weekend.age_groups)),
    startDate: String(weekend.start_date).slice(0, 10),
    endDate: String(weekend.end_date).slice(0, 10),
    coaches,
  };
});

export const promoteTournament = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
  weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
  includeNotInterested: data?.includeNotInterested === true,
})).handler(async ({ context, data }): Promise<{ sent: number; blocked: boolean; notInterested: { userId: string; name: string; teams: string[] }[] }> => {
  await requireAdmin(context.userId);
  await ensureLiveOpsColumns();
  await ensureSignupColumns();
  const sql: any = await getSql();
  const weekend = (await sql`select id, name, lifecycle, age_groups, start_date::text as start_date, end_date::text as end_date from weekends where id = ${data.weekendId} limit 1`)[0];
  if (!weekend) throw new Error("That tournament is gone.");
  const name = nameWithAges(String(weekend.name || "A tournament"), parseStoredAgeGroups(weekend.age_groups));
  const when = announcedWeekendName(String(weekend.start_date).slice(0, 10), String(weekend.end_date).slice(0, 10));
  const coaches = await eventReminderCoaches(sql, weekend.id);
  const notInterested = coaches
    .filter((coach) => coach.choice === "no")
    .map((coach) => ({
      userId: coach.userId,
      name: coach.name,
      teams: coach.teams.map((team) => (team.ageGroup ? `${team.name} · ${team.ageGroup}` : team.name)),
    }));
  if (notInterested.length > 0 && !data.includeNotInterested) {
    return { sent: 0, blocked: true, notInterested };
  }
  const refKey = `available-${weekend.id}`;
  for (const coach of coaches) {
    const body = reminderCopy(coach.choice, name, when);
    const existing = (await sql`select id from notifications where user_id = ${coach.userId} and ref_key = ${refKey} limit 1`)[0];
    if (existing) {
      await sql`update notifications set title = ${name}, body = ${body}, kind = ${"available"}, read = false where id = ${existing.id}`;
    } else {
      await sql`
        insert into notifications (user_id, title, body, kind, ref_key)
        values (${coach.userId}, ${name}, ${body}, ${"available"}, ${refKey})
      `;
    }
  }
  return { sent: coaches.length, blocked: false, notInterested: [] };
});

export const createWeekend = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const parsed = parseWeekendInput(data);
	let season = isSeason(data?.season) ? data.season : null;
	const year = Number(data?.year);
	let seasonYear = Number.isInteger(year) && year > 2000 && year < 2100 ? year : null;
	if (!season || seasonYear == null) {
		const inferred = seasonFromDate(parsed.startDate);
		if (inferred) {
			season = season ?? inferred.season;
			seasonYear = seasonYear ?? inferred.year;
		}
	}
	return { ...parsed, season, seasonYear };
}).handler(async ({ context, data }): Promise<Weekend> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const created = (await sql`
      insert into weekends (name, start_date, end_date, age_groups, max_teams, pool_play, day_plan, created_by, bracket_rules, season, season_year, team_fee_cents)
      values (
        ${data.name},
        ${data.startDate},
        ${data.endDate},
        ${JSON.stringify(data.ageGroups)},
        ${data.maxTeams},
        ${data.poolPlay},
        ${JSON.stringify(data.dayPlan)},
        ${context.userId},
        ${JSON.stringify(data.rules)},
        ${data.season},
        ${data.seasonYear},
        ${data.teamFeeCents}
      )
      returning id, name, start_date, end_date, age_groups, max_teams, pool_play, day_plan, bracket_rules, season, season_year, team_fee_cents
    `)[0];

	if (!created) throw new Error("Could not save that tournament. Try again.");
	const start = String(created.start_date).slice(0, 10);
	const events = await sql`
    select id, name from weekends
    where lifecycle = ${"announced"}
      and start_date <= ${start}
      and end_date >= ${start}
  `;
	const event = events.find((row: { name: string }) => String(created.name || "").startsWith(String(row.name || "").trim()));
	if (event) {
		const coaches = await sql`
      select coach_user_id from tournament_responses
      where weekend_id = ${event.id} and choice = ${"interested"}
    `;
		for (const coach of coaches) {
			await insertNotification(
				coach.coach_user_id,
				nameWithAges(String(created.name), data.ageGroups),
				`${nameWithAges(String(created.name), data.ageGroups)} was created for ${event.name}. Open Schedule to see it.`,
				"teams",
				`created-${created.id}-${coach.coach_user_id}`,
			);
		}
	}
	for (const ageGroup of data.ageGroups) await sql`
        insert into weekend_age_groups (weekend_id, age_group, min_teams, max_teams)
        values (${created.id}, ${ageGroup}, ${DEFAULT_AGE_MIN_TEAMS}, ${data.maxTeams})
        on conflict (weekend_id, age_group) do nothing
      `;
	const weekend = mapWeekend({
		...created,
		location_count: 0,
		approved_count: 0,
		public_dirty: true,
	});
	const locationCount = await writeCoachShell(weekend);
	return mapWeekend({
		...created,
		location_count: locationCount,
		approved_count: 0,
		public_dirty: true,
	});
});

export const announceTournament = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const name = typeof data?.name === "string" ? data.name.trim() : "";
	const startDate = typeof data?.startDate === "string" ? data.startDate.slice(0, 10) : "";
	const endDate = typeof data?.endDate === "string" ? data.endDate.slice(0, 10) : "";
	if (!name || name.length > 80) throw new Error("Name the tournament.");
	if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < startDate) {
		throw new Error("Check the dates.");
	}
	if (!isSeason(data?.season)) throw new Error("Pick a season.");
	const year = Number(data?.year);
	if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error("Pick a year.");
	return { name, startDate, endDate, season: data.season as Season, year, notify: data?.notify !== false };
}).handler(async ({ context, data }): Promise<Weekend> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const created = (await sql`
    insert into weekends (
      name, start_date, end_date, age_groups, max_teams, pool_play, day_plan, created_by, bracket_rules, lifecycle, season, season_year
    ) values (
      ${data.name},
      ${data.startDate},
      ${data.endDate},
      ${"[]"},
      ${40},
      ${false},
      ${"[]"},
      ${context.userId},
      ${"{}"},
      ${"announced"},
      ${data.season},
      ${data.year}
    )
    returning id, name, start_date, end_date, age_groups, max_teams, pool_play, day_plan, bracket_rules, lifecycle, season, season_year
  `)[0];
	if (!created) throw new Error("Could not save that tournament. Try again.");
	return mapWeekend({ ...created, location_count: 0, approved_count: 0, interest_count: 0, public_dirty: true });
});

export type CoachTextStatus = {
	unsent: number;
	unsentWeekendIds: number[];
	finishBatchId: number | null;
	finishLeft: number;
	finishWeekendIds: number[];
};

export type CoachTextBatchView = {
	batchId: number;
	kind: CoachTextKind;
	season: Season;
	year: number;
	events: { id: number; name: string; startDate: string; endDate: string; ageGroups?: string[] }[];
	coaches: {
		userId: string;
		name: string;
		phone: string | null;
		teams: { name: string; ageGroup: string | null }[];
		opened: boolean;
		registered: boolean;
	}[];
	linkPath: string;
};

function coachFacingName(raw: unknown, email: unknown): string {
	const name = typeof raw === "string" ? raw.trim() : "";
	const generic = ["coach", "admin", "parent", "athlete"].includes(name.toLowerCase());
	if (name && !generic) return name;
	const mail = typeof email === "string" ? email.trim() : "";
	return mail || "Coach";
}

function batchIdList(value: unknown): number[] {
	return [...new Set(String(value || "").split(",").map((part) => Number(part)).filter((id) => Number.isInteger(id) && id > 0))];
}

async function announcedInSeason(sql: any, season: Season, year: number): Promise<{ id: number; name: string; startDate: string; endDate: string; ageGroups: string[] }[]> {
	const rows = await sql`
    select id, name, start_date::text as start_date, end_date::text as end_date, age_groups, season, season_year
    from weekends
    where lifecycle <> ${"announced"}
    order by start_date asc, id asc
  `;
	const matched: { id: number; name: string; startDate: string; endDate: string; ageGroups: string[] }[] = [];
	for (const row of rows) {
		const startDate = String(row.start_date).slice(0, 10);
		const stored = isSeason(row.season) && Number(row.season_year) === year && row.season === season;
		const inferred = !isSeason(row.season) ? seasonFromDate(startDate) : null;
		const fits = stored || (inferred != null && inferred.season === season && inferred.year === year);
		if (!fits) continue;
		if (!stored && inferred) {
			await sql`
        update weekends set season = ${season}, season_year = ${year}
        where id = ${row.id} and season is null
      `;
		}
		matched.push({
			id: Number(row.id),
			name: String(row.name),
			startDate,
			endDate: String(row.end_date).slice(0, 10),
			ageGroups: parseStoredAgeGroups(row.age_groups),
		});
	}
	return matched;
}

async function textBatches(sql: any, season: Season, year: number): Promise<{ id: number; weekendIds: number[] }[]> {
	const rows = await sql`
    select id, weekend_ids from coach_text_batches
    where season = ${season} and season_year = ${year}
    order by id asc
  `;
	return rows.map((row: any) => ({ id: Number(row.id), weekendIds: batchIdList(row.weekend_ids) }));
}

async function textCoaches(sql: any): Promise<{ userId: string; name: string; phone: string | null; teams: { name: string; ageGroup: string | null }[] }[]> {
	await ensureSignupColumns();
	const people = await sql`
    select p.user_id, p.email, p.phone, u.name as coach_name
    from profiles p
    left join "user" u on u.id = p.user_id
    where p.home_role = ${"coach"}
  `;
	const signupTeams = await sql`select user_id, name, age_group from coach_signup_teams order by id asc`;
	const byUser = new Map<string, { name: string; ageGroup: string | null }[]>();
	for (const team of signupTeams) {
		const list = byUser.get(team.user_id) ?? [];
		list.push({ name: String(team.name), ageGroup: team.age_group ? String(team.age_group) : null });
		byUser.set(team.user_id, list);
	}
	return people.map((row: any) => ({
		userId: String(row.user_id),
		name: coachFacingName(row.coach_name, row.email),
		phone: row.phone ? String(row.phone) : null,
		teams: byUser.get(row.user_id) ?? [],
	}));
}

async function registeredOnEvery(sql: any, weekendIds: number[]): Promise<Set<string>> {
	if (weekendIds.length === 0) return new Set();
	const hits = new Map<string, Set<number>>();
	function mark(userId: unknown, weekendId: number) {
		const id = String(userId || "");
		if (!id) return;
		const set = hits.get(id) ?? new Set<number>();
		set.add(weekendId);
		hits.set(id, set);
	}
	for (const weekendId of weekendIds) {
		const responses = await sql`
      select coach_user_id from tournament_responses
      where weekend_id = ${weekendId} and choice = ${"interested"}
    `;
		for (const row of responses) mark(row.coach_user_id, weekendId);
		const ages = await sql`
      select coach_user_id from event_age_responses
      where weekend_id = ${weekendId} and choice = ${"interested"}
    `;
		for (const row of ages) mark(row.coach_user_id, weekendId);
		const roster = await sql`
      select coach_user_id from teams
      where weekend_id = ${weekendId} and status = ${"approved"}
    `;
		for (const row of roster) mark(row.coach_user_id, weekendId);
	}
	const ready = new Set<string>();
	for (const [userId, weekends] of hits) {
		if (weekendIds.every((id) => weekends.has(id))) ready.add(userId);
	}
	return ready;
}

async function batchView(sql: any, batchId: number, season: Season, year: number, hadPriorBatch: boolean): Promise<CoachTextBatchView> {
	const batch = (await sql`select id, weekend_ids from coach_text_batches where id = ${batchId} limit 1`)[0];
	if (!batch) throw new Error("That text list is gone.");
	const ids = batchIdList(batch.weekend_ids);
	const announced = await announcedInSeason(sql, season, year);
	const events = ids.map((id) => announced.find((event) => event.id === id)).filter((event): event is NonNullable<typeof event> => Boolean(event));
	const openedRows = await sql`select coach_user_id from coach_text_opens where batch_id = ${batchId}`;
	const opened = new Set(openedRows.map((row: any) => String(row.coach_user_id)));
	const registered = await registeredOnEvery(sql, ids);
	const coaches = (await textCoaches(sql)).map((coach: { userId: string; name: string; phone: string | null; teams: { name: string; ageGroup: string | null }[] }) => ({
		...coach,
		opened: opened.has(coach.userId),
		registered: registered.has(coach.userId),
	}));
	return {
		batchId,
		kind: coachTextKind(events.length, hadPriorBatch),
		season,
		year,
		events,
		coaches,
		linkPath: `/interest?e=${ids.join(",")}`,
	};
}

function parseSeasonYear(data: any): { season: Season; year: number } {
	if (!isSeason(data?.season)) throw new Error("Pick a season.");
	const year = Number(data?.year);
	if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error("Pick a year.");
	return { season: data.season, year };
}

export const coachTextStatus = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(parseSeasonYear).handler(async ({ context, data }): Promise<CoachTextStatus> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const announced = await announcedInSeason(sql, data.season, data.year);
	const batches = await textBatches(sql, data.season, data.year);
	const covered = new Set(batches.flatMap((batch) => batch.weekendIds));
	const uncovered = announced.filter((event) => !covered.has(event.id));
	const unsent = uncovered.length;
	const unsentWeekendIds = uncovered.map((event) => event.id);
	const coaches = await textCoaches(sql);
	const phoneIds = coaches.filter((coach) => phoneLast10(coach.phone || "")).map((coach) => coach.userId);
	let finishBatchId: number | null = null;
	let finishLeft = 0;
	let finishWeekendIds: number[] = [];
	for (const batch of batches) {
		const openedRows = await sql`select coach_user_id from coach_text_opens where batch_id = ${batch.id}`;
		const opened = new Set(openedRows.map((row: any) => String(row.coach_user_id)));
		const left = phoneIds.filter((id) => !opened.has(id)).length;
		if (left > 0) {
			finishBatchId = batch.id;
			finishLeft = left;
			finishWeekendIds = batch.weekendIds;
			break;
		}
	}
	return { unsent, unsentWeekendIds, finishBatchId, finishLeft, finishWeekendIds };
});

async function notifyCoachesAboutEvents(sql: any, events: { id: number; name: string; startDate: string; endDate: string; ageGroups?: string[] }[]) {
	if (events.length === 0) return;
	const coaches = await sql`select user_id from profiles where home_role = ${"coach"}`;
	for (const event of events) {
		const when = announcedWeekendName(event.startDate, event.endDate);
		const name = nameWithAges(event.name, event.ageGroups ?? []);
		for (const coach of coaches) {
			await insertNotification(
				coach.user_id,
				name,
				`${name} is on the schedule for ${when}. Open Schedule if your team is interested.`,
				"available",
				`available-${event.id}`,
			);
		}
	}
}

export const openCoachTexts = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const seasonYear = parseSeasonYear(data);
	const batchId = data?.batchId == null || data?.batchId === "" ? null : parsePositiveInt(data.batchId, "Missing text list.");
	const weekendId = data?.weekendId == null || data?.weekendId === "" ? null : parsePositiveInt(data.weekendId, "Missing event.");
	return { ...seasonYear, batchId, weekendId };
}).handler(async ({ context, data }): Promise<CoachTextBatchView> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const batches = await textBatches(sql, data.season, data.year);
	if (data.batchId != null) {
		const known = batches.find((batch) => batch.id === data.batchId);
		if (!known) throw new Error("That text list is gone.");
		const prior = batches.some((batch) => batch.id < known.id);
		return batchView(sql, known.id, data.season, data.year, prior);
	}
	const announced = await announcedInSeason(sql, data.season, data.year);
	const covered = new Set(batches.flatMap((batch) => batch.weekendIds));
	const unsent = announced.filter((event) => !covered.has(event.id));
	let chosen = unsent;
	if (data.weekendId != null) {
		const event = announced.find((item) => item.id === data.weekendId);
		if (!event) throw new Error("That event is gone.");
		const existing = batches.find((batch) => batch.weekendIds.includes(event.id));
		if (existing) {
			const prior = batches.some((batch) => batch.id < existing.id);
			return batchView(sql, existing.id, data.season, data.year, prior);
		}
		chosen = [event];
	}
	if (chosen.length === 0) {
		const latest = batches[batches.length - 1];
		if (!latest) throw new Error("Nothing to text yet.");
		return batchView(sql, latest.id, data.season, data.year, batches.length > 1);
	}
	const created = (await sql`
    insert into coach_text_batches (season, season_year, weekend_ids)
    values (${data.season}, ${data.year}, ${chosen.map((event) => event.id).join(",")})
    returning id
  `)[0];
	if (!created) throw new Error("Could not start that text. Try again.");
	await notifyCoachesAboutEvents(sql, chosen);
	return batchView(sql, Number(created.id), data.season, data.year, batches.length > 0);
});

export const markCoachTextOpened = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	batchId: parsePositiveInt(data?.batchId, "Missing text list."),
	coachUserId: String(data?.coachUserId ?? "").trim(),
})).handler(async ({ context, data }) => {
	await requireAdmin(context.userId);
	if (!data.coachUserId) throw new Error("Missing coach.");
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	await sql`
    insert into coach_text_opens (batch_id, coach_user_id)
    values (${data.batchId}, ${data.coachUserId})
    on conflict (batch_id, coach_user_id) do nothing
  `;
	return { ok: true as const };
});

export const updateAnnouncedEvent = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const weekendId = parsePositiveInt(data?.weekendId, "Missing event.");
	const name = typeof data?.name === "string" ? data.name.trim() : "";
	const startDate = typeof data?.startDate === "string" ? data.startDate.slice(0, 10) : "";
	const endDate = typeof data?.endDate === "string" ? data.endDate.slice(0, 10) : "";
	if (!name || name.length > 80) throw new Error("Name the event.");
	if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < startDate) {
		throw new Error("Check the dates.");
	}
	return { weekendId, name, startDate, endDate, matchTournaments: data?.matchTournaments === true };
}).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	const row = (await sql`
    select id, lifecycle, start_date::text as start_date, end_date::text as end_date
    from weekends where id = ${data.weekendId} limit 1
  `)[0];
	if (!row || row.lifecycle !== "announced") throw new Error("Open the tournament to change that name or those dates.");
	const oldStart = String(row.start_date).slice(0, 10);
	const oldEnd = String(row.end_date).slice(0, 10);
	const datesChanged = oldStart !== data.startDate || oldEnd !== data.endDate;
	const inside = datesChanged
		? await sql`
      select id, name, pool_play, start_date::text as start_date, end_date::text as end_date
      from weekends
      where id <> ${data.weekendId}
        and lifecycle <> ${"announced"}
        and start_date >= ${oldStart}
        and end_date <= ${oldEnd}
      order by name
    `
		: [];
	const shift = datesChanged ? Math.round((Date.parse(`${data.startDate}T00:00:00Z`) - Date.parse(`${oldStart}T00:00:00Z`)) / 86400000) : 0;
	const outside = inside.filter((item: { start_date: string; end_date: string }) => {
		const nextStart = addDays(String(item.start_date).slice(0, 10), shift);
		const nextEnd = addDays(String(item.end_date).slice(0, 10), shift);
		return nextStart < data.startDate || nextEnd > data.endDate || nextStart !== String(item.start_date).slice(0, 10) || nextEnd !== String(item.end_date).slice(0, 10);
	});
	if (outside.length > 0 && !data.matchTournaments) {
		const names = outside.map((item: { name: string }) => item.name).join(", ");
		throw new Error(`Those dates would leave ${names} outside this event.`);
	}
	for (const item of inside) {
		let nextStart = addDays(String(item.start_date).slice(0, 10), shift);
		let nextEnd = addDays(String(item.end_date).slice(0, 10), shift);
		if (nextStart < data.startDate) nextStart = data.startDate;
		if (nextEnd > data.endDate) nextEnd = data.endDate;
		if (nextEnd < nextStart) nextEnd = nextStart;
		const plan = defaultDayPlan(nextStart, nextEnd).map((day) =>
			item.pool_play === false ? { ...day, kind: "bracket" as const } : day,
		);
		await sql`
      update weekends
      set start_date = ${nextStart}, end_date = ${nextEnd}, day_plan = ${JSON.stringify(plan)}
      where id = ${item.id}
    `;
		await sql`
      update games
      set start_date = least(${nextEnd}::date, greatest(${nextStart}::date, start_date + ${shift}))
      where weekend_id = ${item.id} and start_date is not null
    `;
	}
	await sql`
    update weekends
    set name = ${data.name}, start_date = ${data.startDate}, end_date = ${data.endDate}
    where id = ${data.weekendId}
  `;
	return loadWeekendDetail(data.weekendId);
});

export const showInterest = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const teamName = typeof data?.teamName === "string" ? data.teamName.trim() : "";
	if (!teamName || teamName.length > 80) throw new Error("Name the team.");
	return { weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."), teamName };
}).handler(async ({ context, data }): Promise<{ id: number }> => {
	await actAsCoach(context);
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const weekend = (await sql`select id, lifecycle, end_date::text as end_date from weekends where id = ${data.weekendId} limit 1`)[0];
	if (!weekend || weekend.lifecycle !== "announced") throw new Error("That tournament is not taking interest yet.");
	if (String(weekend.end_date).slice(0, 10) < isoDateFromLocal(new Date())) throw new Error("That tournament is already over.");
	const existing = (await sql`
    select id from tournament_interest
    where weekend_id = ${data.weekendId}
      and coach_user_id = ${context.userId}
      and lower(btrim(team_name)) = lower(btrim(${data.teamName}))
    limit 1
  `)[0];
	if (existing) return { id: existing.id };
	const row = (await sql`
    insert into tournament_interest (weekend_id, coach_user_id, team_name)
    values (${data.weekendId}, ${context.userId}, ${data.teamName})
    returning id
  `)[0];
	if (!row) throw new Error("Could not save that. Try again.");
	return { id: row.id };
});

export const listMyInterest = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<{ id: number; weekendId: number; teamName: string }[]> => {
	await actAsCoach(context);
	await ensureLiveOpsColumns();
	const rows = await ((await getSql()) as any)`
    select id, weekend_id, team_name
    from tournament_interest
    where coach_user_id = ${context.userId}
    order by id asc
  `;
	return rows.map((row: any) => ({ id: row.id, weekendId: row.weekend_id, teamName: row.team_name }));
});

export const listMyCoachTeams = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<{ name: string; ageGroup: string | null }[]> => {
	await actAsCoach(context);
	await ensureSignupColumns();
	const sql: any = await getSql();
	const rows = await sql`select name, age_group from coach_signup_teams where user_id = ${context.userId} order by id asc`;
	if (rows.length > 0) {
		return rows.map((row: any) => ({ name: String(row.name), ageGroup: row.age_group ? String(row.age_group) : null }));
	}
	const request = (await sql`
    select team_name from role_requests
    where user_id = ${context.userId} and requested_role = ${"coach"} and team_name is not null and btrim(team_name) <> ''
    order by created_at desc
    limit 1
  `)[0];
	if (!request) return [];
	return [{ name: String(request.team_name), ageGroup: null }];
});

export const saveMyCoachTeams = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const teams = parseSignupTeams(data?.teams);
	if (!teams) throw new Error("Add at least one team.");
	return { teams };
}).handler(async ({ context, data }): Promise<{ name: string; ageGroup: string }[]> => {
	await actAsCoach(context);
	await ensureSignupColumns();
	const sql: any = await getSql();
	await sql`delete from coach_signup_teams where user_id = ${context.userId}`;
	for (const team of data.teams) {
		await sql`insert into coach_signup_teams (user_id, name, age_group) values (${context.userId}, ${team.name}, ${team.ageGroup})`;
	}
	return data.teams;
});

export type SquadPlayer = { id: number; name: string; jersey: number; birthday: string | null };

function mapSquadPlayer(row: any): SquadPlayer {
	const birthday = row.birthday ? String(row.birthday).slice(0, 10) : null;
	return { id: row.id, name: String(row.name), jersey: Number(row.jersey), birthday };
}

function parseBirthday(value: unknown): string {
	const raw = String(value ?? "").trim();
	if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error("Pick a birthday.");
	const [year, month, day] = raw.split("-").map(Number);
	const date = new Date(year, (month || 1) - 1, day || 1);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) throw new Error("Pick a birthday.");
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	if (date > today) throw new Error("Birthday can’t be in the future.");
	if (year < 2005) throw new Error("That birthday is too far back for a youth player.");
	return raw;
}
export type CoachSquad = { id: number; name: string; ageGroup: string; players: SquadPlayer[] };

async function ownedSquad(sql: any, userId: string, teamId: number) {
	const team = (await sql`select id, name, age_group from coach_signup_teams where id = ${teamId} and user_id = ${userId} limit 1`)[0];
	if (!team) throw new Error("That team is not yours.");
	return team;
}

export const listMySquads = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<CoachSquad[]> => {
	await actAsCoach(context);
	await ensureSignupColumns();
	const sql: any = await getSql();
	const teams = await sql`select id, name, age_group from coach_signup_teams where user_id = ${context.userId} order by id asc`;
	const players = await sql`
    select p.id, p.team_id, p.name, p.jersey, p.birthday
    from coach_roster_players p
    join coach_signup_teams t on t.id = p.team_id
    where t.user_id = ${context.userId}
    order by p.jersey asc, p.name asc
  `;
	const byTeam = new Map<number, SquadPlayer[]>();
	for (const row of players) {
		const list = byTeam.get(row.team_id) ?? [];
		list.push(mapSquadPlayer(row));
		byTeam.set(row.team_id, list);
	}
	return teams.map((team: any) => ({
		id: team.id,
		name: String(team.name),
		ageGroup: String(team.age_group),
		players: byTeam.get(team.id) ?? [],
	}));
});

function parseSquadInput(data: any): { name: string; ageGroup: AgeGroup } {
	const name = String(data?.name ?? "").trim();
	const ageGroup = String(data?.ageGroup ?? "");
	if (name.length < 2) throw new Error("Give the team a name.");
	if (name.length > 60) throw new Error("Keep the team name under 60 characters.");
	if (!isAgeGroup(ageGroup)) throw new Error("Pick an age from 8U to 17U.");
	return { name, ageGroup };
}

export const addMySquad = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(parseSquadInput).handler(async ({ context, data }): Promise<CoachSquad> => {
	await actAsCoach(context);
	await ensureSignupColumns();
	const sql: any = await getSql();
	const row = (await sql`
    insert into coach_signup_teams (user_id, name, age_group)
    values (${context.userId}, ${data.name}, ${data.ageGroup})
    returning id
  `)[0];
	return { id: row.id, name: data.name, ageGroup: data.ageGroup, players: [] };
});

export const updateMySquad = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	teamId: parsePositiveInt(data?.teamId, "Missing team."),
	...parseSquadInput(data),
})).handler(async ({ context, data }): Promise<CoachSquad> => {
	await actAsCoach(context);
	await ensureSignupColumns();
	const sql: any = await getSql();
	const before = await ownedSquad(sql, context.userId, data.teamId);
	await sql`update coach_signup_teams set name = ${data.name}, age_group = ${data.ageGroup} where id = ${data.teamId}`;
	if (String(before.age_group) !== data.ageGroup || String(before.name) !== data.name) {
		const ageNote = String(before.age_group) !== data.ageGroup ? ` Age changed from ${before.age_group} to ${data.ageGroup}.` : "";
		const nameNote = String(before.name) !== data.name ? ` Name changed from ${before.name} to ${data.name}.` : "";
		await notifyAdmins("Team changed", `${data.name}.${ageNote}${nameNote}`.replace("..", "."));
	}
	const players = await sql`select id, name, jersey, birthday from coach_roster_players where team_id = ${data.teamId} order by jersey asc, name asc`;
	return {
		id: data.teamId,
		name: data.name,
		ageGroup: data.ageGroup,
		players: players.map(mapSquadPlayer),
	};
});

export const removeMySquad = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	teamId: parsePositiveInt(data?.teamId, "Missing team."),
})).handler(async ({ context, data }) => {
	await actAsCoach(context);
	await ensureSignupColumns();
	const sql: any = await getSql();
	await ownedSquad(sql, context.userId, data.teamId);
	const count = (await sql`select count(*)::int as n from coach_signup_teams where user_id = ${context.userId}`)[0]?.n ?? 0;
	if (count <= 1) throw new Error("Keep at least one team.");
	await sql`delete from coach_signup_teams where id = ${data.teamId}`;
	return { ok: true as const };
});

export const addSquadPlayer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	teamId: parsePositiveInt(data?.teamId, "Missing team."),
	name: (() => {
		const name = String(data?.name ?? "").trim();
		if (name.length < 2) throw new Error("Give the player a name.");
		if (name.length > 60) throw new Error("Keep the player name under 60 characters.");
		return name;
	})(),
	jersey: parseJersey(data?.jersey),
	birthday: parseBirthday(data?.birthday),
})).handler(async ({ context, data }): Promise<SquadPlayer> => {
	await actAsCoach(context);
	await ensureSignupColumns();
	const sql: any = await getSql();
	await ownedSquad(sql, context.userId, data.teamId);
	try {
		const row = (await sql`
      insert into coach_roster_players (team_id, name, jersey, birthday)
      values (${data.teamId}, ${data.name}, ${data.jersey}, ${data.birthday})
      returning id
    `)[0];
		return { id: row.id, name: data.name, jersey: data.jersey, birthday: data.birthday };
	} catch (err) {
		const message = err instanceof Error ? err.message : "";
		if (message.toLowerCase().includes("unique") || message.toLowerCase().includes("duplicate")) {
			throw new Error("That jersey is already on this team.");
		}
		throw err;
	}
});

export const removeSquadPlayer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	playerId: parsePositiveInt(data?.playerId, "Missing player."),
})).handler(async ({ context, data }) => {
	await actAsCoach(context);
	await ensureSignupColumns();
	const sql: any = await getSql();
	const row = (await sql`
    delete from coach_roster_players p
    using coach_signup_teams t
    where p.id = ${data.playerId} and p.team_id = t.id and t.user_id = ${context.userId}
    returning p.id
  `)[0];
	if (!row) throw new Error("That player is not on your team.");
	return { ok: true as const };
});

export const listMyTournamentResponses = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<{ weekendId: number; choice: "interested" | "maybe" | "no" }[]> => {
	await actAsCoach(context);
	await ensureLiveOpsColumns();
	const rows = await ((await getSql()) as any)`
    select weekend_id, choice from tournament_responses where coach_user_id = ${context.userId}
  `;
	return rows
		.map((row: any) => ({
			weekendId: Number(row.weekend_id),
			choice: row.choice === "maybe" || row.choice === "no" ? row.choice : "interested",
		}))
		.filter((row: { choice: string }) => row.choice === "interested" || row.choice === "maybe" || row.choice === "no");
});

const LOST_PLACE: Record<string, string> = {
	f: "2nd",
	sf: "Tied for 3rd",
	qf: "Tied for 5th",
	r16: "Tied for 9th",
	r32: "Tied for 17th",
	r64: "Tied for 33rd",
};

function placeForTeam(teamId: number, games: any[]): string {
	const mine = games
		.filter((game) => Number(game.home_team_id) === teamId || Number(game.away_team_id) === teamId)
		.sort((a, b) => ROUND_IDS.indexOf(a.round) - ROUND_IDS.indexOf(b.round));
	if (mine.length === 0) return "Did not reach the bracket";
	for (const game of mine) {
		if (game.no_contest) continue;
		if (game.is_bye) continue;
		const winner = scoredWinner(
			game.home_team_id == null ? null : Number(game.home_team_id),
			game.away_team_id == null ? null : Number(game.away_team_id),
			game.home_score == null ? null : Number(game.home_score),
			game.away_score == null ? null : Number(game.away_score),
			game.forfeit,
		);
		if (winner == null) return "Results not posted";
		if (winner !== teamId) return LOST_PLACE[String(game.round)] ?? "Out";
		if (game.round === "f") return "1st";
	}
	return "Results not posted";
}

export const listMyOutcomes = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<{ weekendId: number; lines: string[] }[]> => {
	await actAsCoach(context);
	const sql: any = await getSql();
	const teams = await sql`
    select id, weekend_id, name, age_group
    from teams
    where coach_user_id = ${context.userId} and status = ${"approved"}
    order by age_group asc, id asc
  `;
	if (teams.length === 0) return [];
	const games = await sql`
    select g.id, g.weekend_id, g.round, g.home_team_id, g.away_team_id, g.home_score, g.away_score, g.forfeit, g.is_bye, g.no_contest
    from games g
    join teams t on t.weekend_id = g.weekend_id and (g.home_team_id = t.id or g.away_team_id = t.id)
    where t.coach_user_id = ${context.userId} and t.status = ${"approved"} and g.round <> ${"pool"}
  `;
	const byWeekend = new Map<number, any[]>();
	const seen = new Set<number>();
	for (const game of games) {
		if (seen.has(game.id)) continue;
		seen.add(game.id);
		const list = byWeekend.get(game.weekend_id) ?? [];
		list.push(game);
		byWeekend.set(game.weekend_id, list);
	}
	const lines = new Map<number, string[]>();
	for (const team of teams) {
		const place = placeForTeam(Number(team.id), byWeekend.get(team.weekend_id) ?? []);
		const list = lines.get(team.weekend_id) ?? [];
		list.push(`${team.name} · ${team.age_group} · ${place}`);
		lines.set(team.weekend_id, list);
	}
	return [...lines.entries()].map(([weekendId, teamLines]) => ({ weekendId, lines: teamLines }));
});

async function placeCoachOnTournament(sql: any, weekendId: number, userId: string, ageGroup: AgeGroup | null, join: boolean): Promise<{ requested: boolean; reason: string | null }> {
	const weekend = mapWeekend(await loadWeekendOrThrow(weekendId));
	const divisions = ageGroup ? [ageGroup] : weekend.ageGroups;
	const clubs = await sql`
    select id, name, age_group from coach_signup_teams
    where user_id = ${userId}
    order by id asc
  `;
	const matching = clubs.filter(
		(row: { age_group: string }) => divisionForTeam(String(row.age_group), divisions) != null,
	);
	if (join && matching.length === 0) throw new Error("No team in that age is on this account yet.");
	if (weekend.sheetLocked) {
		const reason = weekend.lockReason ?? "the sheet is locked.";
		if (!join) throw new Error(`This tournament is locked because ${reason} The director has to take your team off.`);
		const missing: { name: string; age: string }[] = [];
		for (const club of matching) {
			const name = String(club.name).trim();
			const existing = (await sql`
        select id from teams
        where weekend_id = ${weekendId}
          and status in (${"pending"}, ${"approved"})
          and coach_user_id = ${userId}
          and age_group = ${club.age_group}
          and lower(btrim(name)) = lower(${name})
        limit 1
      `)[0];
			if (!existing) missing.push({ name, age: String(club.age_group) });
		}
		if (missing.length === 0) return { requested: false, reason };
		let fresh = false;
		for (const club of missing) {
			const open = (await sql`
        select id from team_entry_requests
        where weekend_id = ${weekendId}
          and coach_user_id = ${userId}
          and age_group = ${club.age}
          and lower(btrim(team_name)) = lower(${club.name})
          and status = ${"pending"}
        limit 1
      `)[0];
			if (open) continue;
			fresh = true;
			await sql`
        insert into team_entry_requests (weekend_id, coach_user_id, team_name, age_group)
        values (${weekendId}, ${userId}, ${club.name}, ${club.age})
      `;
		}
		if (fresh) {
			const who = missing.map((club) => `${club.name} ${club.age}`).join(", ");
			await notifyAdmins("Team wants in", `${who} asked to join ${weekend.name}. It is locked because ${reason}`, "teams", null);
		}
		return { requested: true, reason };
	}
	if (join) {
		const approved = (await sql`
      select count(*)::int as n from teams where weekend_id = ${weekendId} and status = ${"approved"}
    `)[0];
		let count = Number(approved?.n ?? 0);
		for (const club of matching) {
			const name = String(club.name).trim();
			const existing = (await sql`
        select id from teams
        where weekend_id = ${weekendId}
          and status in (${"pending"}, ${"approved"})
          and coach_user_id = ${userId}
          and age_group = ${club.age_group}
          and lower(btrim(name)) = lower(${name})
        limit 1
      `)[0];
			if (existing) continue;
			await assertTeamEntryOpen(weekendId, weekend.startDate);
			if (count >= weekend.maxTeams) throw new Error(`This tournament is full (${weekend.maxTeams} teams).`);
			await sql`
        insert into teams (weekend_id, age_group, name, coach_user_id, status, is_demo)
        values (${weekendId}, ${club.age_group}, ${name}, ${userId}, ${"approved"}, ${false})
      `;
			count += 1;
			await insertNotification(userId, "You're in", `${name} is in ${weekend.name}.`, "teams", `in-${weekendId}-${club.id}`);
		}
	} else {
		for (const club of matching) {
			const name = String(club.name).trim();
			const row = (await sql`
        select id from teams
        where weekend_id = ${weekendId}
          and coach_user_id = ${userId}
          and age_group = ${club.age_group}
          and lower(btrim(name)) = lower(${name})
          and status = ${"approved"}
        limit 1
      `)[0];
			if (!row) continue;
			const scored = (await sql`
        select id from games
        where weekend_id = ${weekendId}
          and (home_team_id = ${row.id} or away_team_id = ${row.id})
          and (home_score is not null or away_score is not null or forfeit is not null)
        limit 1
      `)[0];
			if (scored) throw new Error(`${name} already has a score. The director has to take them off.`);
			await sql`delete from teams where id = ${row.id}`;
		}
	}
	await syncWeekendBracket(weekendId);
	return { requested: false, reason: null };
}

export const respondToTournament = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any): { weekendId: number; choice: "interested" | "maybe" | "no" } => {
	const choice = data?.choice === "interested" || data?.choice === "maybe" || data?.choice === "no" ? data.choice : null;
	if (!choice) throw new Error("Pick one.");
	return { weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."), choice };
}).handler(async ({ context, data }) => {
	await actAsCoach(context);
	await ensureLiveOpsColumns();
	await ensureSignupColumns();
	const sql: any = await getSql();
	const weekend = (await sql`select id, name, lifecycle from weekends where id = ${data.weekendId} limit 1`)[0];
	if (!weekend) throw new Error("That tournament is no longer on the schedule.");
	const prior = (await sql`
    select choice from tournament_responses
    where weekend_id = ${data.weekendId} and coach_user_id = ${context.userId}
    limit 1
  `)[0];
	const placed = await placeCoachOnTournament(sql, data.weekendId, context.userId, null, data.choice === "interested");
	if (placed.requested) return { choice: data.choice, requested: true as const, reason: placed.reason };
	await sql`
    insert into tournament_responses (weekend_id, coach_user_id, choice)
    values (${data.weekendId}, ${context.userId}, ${data.choice})
    on conflict (weekend_id, coach_user_id) do update set choice = ${data.choice}
  `;
	if (!prior || prior.choice !== data.choice) {
		const teams = await coachTeamLabels(sql, context.userId);
		const said = data.choice === "interested" ? "is in" : data.choice === "maybe" ? "is not sure yet about" : "said maybe next time for";
		const who = teams.length > 0 ? teams.join(", ") : "A coach";
		await notifyAdmins("Team interest", `${who} ${said} ${weekend.name}.`);
	}
	await sql`
    update notifications set read = true
    where user_id = ${context.userId} and ref_key = ${`available-${data.weekendId}`} and read = false
  `;
	return { choice: data.choice, requested: false as const, reason: null };
});

export type EventAgeChoice = "interested" | "maybe" | "no";

export type MyEventInterest = {
	ages: { ageGroup: string; teamNames: string[] }[];
	events: {
		id: number;
		name: string;
		startDate: string;
		endDate: string;
		teamFeeCents: number | null;
		choices: { ageGroup: string; choice: EventAgeChoice }[];
		ageGroups: string[];
	}[];
};

function parseEventIds(value: unknown): number[] {
	const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
	const ids = [...new Set(raw.map((item) => Number(item)).filter((id) => Number.isInteger(id) && id > 0))];
	if (ids.length === 0) throw new Error("That link is missing the weekend.");
	if (ids.length > 24) throw new Error("Too many weekends.");
	return ids;
}

export const listMyEventInterest = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data: any) => ({
	weekendIds: parseEventIds(data?.weekendIds),
})).handler(async ({ context, data }): Promise<MyEventInterest> => {
	await actAsCoach(context);
	await ensureLiveOpsColumns();
	await ensureSignupColumns();
	const sql: any = await getSql();
	const teams = await sql`select name, age_group from coach_signup_teams where user_id = ${context.userId} order by id asc`;
	const ages: { ageGroup: string; teamNames: string[] }[] = [];
	for (const team of teams) {
		const age = String(team.age_group || "");
		if (!isAgeGroup(age)) continue;
		const found = ages.find((item) => item.ageGroup === age);
		if (found) found.teamNames.push(String(team.name));
		else ages.push({ ageGroup: age, teamNames: [String(team.name)] });
	}
	ages.sort((a, b) => AGE_GROUPS.indexOf(a.ageGroup as AgeGroup) - AGE_GROUPS.indexOf(b.ageGroup as AgeGroup));
	const choiceRows = await sql`
    select weekend_id, age_group, choice from event_age_responses
    where coach_user_id = ${context.userId}
  `;
	const events: MyEventInterest["events"] = [];
	for (const id of data.weekendIds) {
		const row = (await sql`
      select id, name, age_groups, start_date::text as start_date, end_date::text as end_date, team_fee_cents
      from weekends where id = ${id} limit 1
    `)[0];
		if (!row) continue;
		const fee = row.team_fee_cents == null || row.team_fee_cents === "" ? null : Number(row.team_fee_cents);
		events.push({
			id: Number(row.id),
			name: String(row.name),
			startDate: String(row.start_date).slice(0, 10),
			endDate: String(row.end_date).slice(0, 10),
			teamFeeCents: Number.isFinite(fee) ? fee : null,
			ageGroups: parseStoredAgeGroups(row.age_groups),
			choices: choiceRows
				.filter((choice: any) => Number(choice.weekend_id) === id)
				.map((choice: any) => ({
					ageGroup: String(choice.age_group),
					choice: choice.choice === "maybe" || choice.choice === "no" ? choice.choice : "interested",
				})),
		});
	}
	return { ages, events };
});

export const respondToEventAge = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any): { weekendId: number; ageGroup: AgeGroup; choice: EventAgeChoice } => {
	const choice = data?.choice === "interested" || data?.choice === "maybe" || data?.choice === "no" ? data.choice : null;
	const ageGroup = String(data?.ageGroup ?? "");
	if (!choice) throw new Error("Pick one.");
	if (!isAgeGroup(ageGroup)) throw new Error("Pick an age.");
	return { weekendId: parsePositiveInt(data?.weekendId, "Missing event."), ageGroup, choice };
}).handler(async ({ context, data }) => {
	await actAsCoach(context);
	await ensureLiveOpsColumns();
	await ensureSignupColumns();
	const sql: any = await getSql();
	const weekend = (await sql`select id, name, lifecycle, age_groups from weekends where id = ${data.weekendId} limit 1`)[0];
	if (!weekend) throw new Error("That tournament is no longer on the schedule.");
	const onTournament = parseStoredAgeGroups(weekend.age_groups);
	if (onTournament.length > 0 && !onTournament.includes(data.ageGroup)) throw new Error("That age is not on this tournament.");
	const younger = ageOneYounger(data.ageGroup);
	const teams = younger
		? await sql`
    select name from coach_signup_teams
    where user_id = ${context.userId} and age_group in (${data.ageGroup}, ${younger})
    order by id asc
  `
		: await sql`
    select name from coach_signup_teams
    where user_id = ${context.userId} and age_group = ${data.ageGroup}
    order by id asc
  `;
	const coach = (await sql`select name from "user" where id = ${context.userId} limit 1`)[0];
	const coachName = String(coach?.name || "A coach").trim() || "A coach";
	const labels: string[] = teams.length > 0 ? teams.map((team: { name: string }) => String(team.name)) : [coachName];
	const prior = (await sql`
    select choice from event_age_responses
    where weekend_id = ${data.weekendId} and coach_user_id = ${context.userId} and age_group = ${data.ageGroup}
    limit 1
  `)[0];
	const placed = await placeCoachOnTournament(sql, data.weekendId, context.userId, data.ageGroup, data.choice === "interested");
	if (placed.requested) return { choice: data.choice, requested: true as const, reason: placed.reason };
	await sql`
    insert into event_age_responses (weekend_id, coach_user_id, age_group, choice)
    values (${data.weekendId}, ${context.userId}, ${data.ageGroup}, ${data.choice})
    on conflict (weekend_id, coach_user_id, age_group) do update set choice = ${data.choice}
  `;
	const picks = await sql`
    select choice from event_age_responses
    where weekend_id = ${data.weekendId} and coach_user_id = ${context.userId}
  `;
	const rollup = picks.some((row: any) => row.choice === "interested")
		? "interested"
		: picks.some((row: any) => row.choice === "maybe")
			? "maybe"
			: "no";
	await sql`
    insert into tournament_responses (weekend_id, coach_user_id, choice)
    values (${data.weekendId}, ${context.userId}, ${rollup})
    on conflict (weekend_id, coach_user_id) do update set choice = ${rollup}
  `;
	if (!prior || prior.choice !== data.choice) {
		const said = data.choice === "interested" ? "is in" : data.choice === "maybe" ? "is not sure yet about" : "said maybe next time for";
		const who = labels.join(", ");
		await notifyAdmins("Team interest", `${who} ${said} ${data.ageGroup} at ${weekend.name}.`);
	}
	await sql`
    update notifications set read = true
    where user_id = ${context.userId} and ref_key = ${`available-${data.weekendId}`} and read = false
  `;
	return { choice: data.choice, requested: false as const, reason: null };
});

export type TournamentReply = {
	userId: string;
	name: string;
	teams: string[];
};

export type ScheduledTeam = {
	userId: string;
	coach: string;
	team: string;
	age: string;
	tournament: string;
};

export const listTournamentReplies = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data: any) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
})).handler(async ({ context, data }): Promise<{ interested: TournamentReply[]; maybe: TournamentReply[]; no: TournamentReply[]; silent: TournamentReply[]; scheduled: ScheduledTeam[] }> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	await ensureSignupColumns();
	const sql: any = await getSql();
	const host = (await sql`
    select id, name, lifecycle, start_date::text as start_date, end_date::text as end_date
    from weekends where id = ${data.weekendId} limit 1
  `)[0];
	const eventName = String(host?.name || "").trim();
	const eventStart = host ? String(host.start_date).slice(0, 10) : "";
	const eventEnd = host ? String(host.end_date).slice(0, 10) : "";
	const rows = host?.lifecycle === "announced" && eventName
		? await sql`
      select distinct on (r.coach_user_id) r.coach_user_id, r.choice, u.name as coach_name
      from tournament_responses r
      left join "user" u on u.id = r.coach_user_id
      join weekends w on w.id = r.weekend_id
      where r.weekend_id = ${data.weekendId}
         or (
           w.lifecycle <> ${"announced"}
           and w.start_date >= ${eventStart}
           and w.start_date <= ${eventEnd}
           and w.name like ${`${eventName}%`}
         )
      order by r.coach_user_id, case r.choice when ${"interested"} then 0 when ${"maybe"} then 1 else 2 end
    `
		: await sql`
      select r.coach_user_id, r.choice, u.name as coach_name
      from tournament_responses r
      left join "user" u on u.id = r.coach_user_id
      where r.weekend_id = ${data.weekendId}
      order by r.created_at asc
    `;
	const signup = await sql`select user_id, name, age_group from coach_signup_teams order by id asc`;
	const signupTeams = new Map<string, string[]>();
	for (const row of signup) {
		const list = signupTeams.get(row.user_id) ?? [];
		list.push(row.age_group ? `${row.name} · ${row.age_group}` : String(row.name));
		signupTeams.set(row.user_id, list);
	}
	const coaches = await sql`
    select p.user_id, u.name as coach_name
    from profiles p
    left join "user" u on u.id = p.user_id
    where p.home_role = ${"coach"}
    order by u.name asc
  `;
	function replyFor(userId: string, coachName: unknown): TournamentReply {
		const rawName = typeof coachName === "string" ? coachName.trim() : "";
		const generic = ["coach", "admin", "parent", "athlete"].includes(rawName.toLowerCase());
		return {
			userId,
			name: rawName && !generic ? rawName : "Coach",
			teams: signupTeams.get(userId) ?? [],
		};
	}
	const interested: TournamentReply[] = [];
	const maybe: TournamentReply[] = [];
	const no: TournamentReply[] = [];
	const answered = new Set<string>();
	const ageRows = await sql`
      select r.coach_user_id, r.age_group, r.choice, u.name as coach_name
      from event_age_responses r
      left join "user" u on u.id = r.coach_user_id
      where r.weekend_id = ${data.weekendId}
    `;
	const ageByCoach = new Map<string, { age: string; choice: string; name: unknown }[]>();
	for (const row of ageRows) {
		const list = ageByCoach.get(String(row.coach_user_id)) ?? [];
		list.push({ age: String(row.age_group), choice: String(row.choice), name: row.coach_name });
		ageByCoach.set(String(row.coach_user_id), list);
	}
	for (const [userId, picks] of ageByCoach) {
		answered.add(userId);
		const reply = replyFor(userId, picks[0]?.name);
		function teamsFor(choice: string) {
			const ages = new Set(picks.filter((pick) => pick.choice === choice).map((pick) => pick.age));
			return reply.teams.filter((team) => ages.has(team.split(" · ").pop()?.trim() ?? ""));
		}
		const yes = teamsFor("interested");
		const mid = teamsFor("maybe");
		const passed = teamsFor("no");
		if (yes.length > 0) interested.push({ ...reply, teams: yes });
		if (mid.length > 0) maybe.push({ ...reply, teams: mid });
		if (passed.length > 0) no.push({ ...reply, teams: passed });
	}
	for (const row of rows) {
		if (answered.has(row.coach_user_id)) continue;
		answered.add(row.coach_user_id);
		const reply = replyFor(row.coach_user_id, row.coach_name);
		if (row.choice === "maybe") maybe.push(reply);
		else if (row.choice === "no") no.push(reply);
		else interested.push(reply);
	}
	const silent = coaches
		.filter((coach: any) => !answered.has(coach.user_id))
		.map((coach: any) => replyFor(coach.user_id, coach.coach_name));
	const event = (await sql`
    select start_date::text as start_date, end_date::text as end_date
    from weekends
    where id = ${data.weekendId}
    limit 1
  `)[0];
	const scheduled: ScheduledTeam[] = [];
	if (event) {
		const placed = await sql`
      select t.coach_user_id, t.name as team_name, t.age_group, w.name as tournament_name, u.name as coach_name
      from teams t
      join weekends w on w.id = t.weekend_id
      left join "user" u on u.id = t.coach_user_id
      where t.status in (${"pending"}, ${"approved"})
        and w.lifecycle <> ${"announced"}
        and w.start_date >= ${String(event.start_date).slice(0, 10)}
        and w.end_date <= ${String(event.end_date).slice(0, 10)}
        and w.id <> ${data.weekendId}
      order by t.age_group asc, t.name asc
    `;
		for (const row of placed) {
			const age = String(row.age_group ?? "");
			if (!age) continue;
			const rawName = typeof row.coach_name === "string" ? row.coach_name.trim() : "";
			const generic = ["coach", "admin", "parent", "athlete"].includes(rawName.toLowerCase());
			scheduled.push({
				userId: row.coach_user_id ? String(row.coach_user_id) : "",
				coach: rawName && !generic ? rawName : "Coach",
				team: String(row.team_name ?? "").trim(),
				age,
				tournament: String(row.tournament_name ?? "Tournament"),
			});
		}
	}
	return { interested, maybe, no, silent, scheduled };
});

export type TournamentRosterTeam = {
	name: string;
	ageGroup: string;
};

export const listTournamentRoster = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data: any) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
})).handler(async ({ context, data }): Promise<TournamentRosterTeam[]> => {
	await requireScheduleReader(context.userId);
	const rows = await ((await getSql()) as any)`
    select name, age_group
    from teams
    where weekend_id = ${data.weekendId} and status = ${"approved"} and is_demo = ${false}
    order by age_group asc, name asc
  `;
	return rows
		.filter((row: any) => isAgeGroup(row.age_group))
		.map((row: any) => ({ name: String(row.name ?? "").trim(), ageGroup: String(row.age_group) }))
		.filter((row: TournamentRosterTeam) => row.name.length > 0);
});

export type InterestedClub = {
	teamId: number;
	coachUserId: string;
	coachName: string;
	teamName: string;
	ageGroup: string;
};

export const listEventInterest = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data: any) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
})).handler(async ({ context, data }): Promise<InterestedClub[]> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	await ensureSignupColumns();
	const sql: any = await getSql();
	const weekend = (await sql`
    select id, name, lifecycle, start_date::text as start_date, end_date::text as end_date, age_groups
    from weekends where id = ${data.weekendId} limit 1
  `)[0];
	if (!weekend) return [];
	const start = String(weekend.start_date).slice(0, 10);
	const end = String(weekend.end_date).slice(0, 10);
	const event = weekend.lifecycle === "announced"
		? weekend
		: (await sql`
      select id, name, start_date::text as start_date, end_date::text as end_date from weekends
      where lifecycle = ${"announced"}
        and start_date <= ${start}
        and end_date >= ${end}
      order by (end_date - start_date) asc, id asc
      limit 1
    `)[0];
	if (!event) return [];
	const eventStart = String(event.start_date).slice(0, 10);
	const eventEnd = String(event.end_date).slice(0, 10);
	const eventName = String(event.name || "").trim();
	const rows = await sql`
    select t.id as team_id, t.user_id, t.name as team_name, t.age_group, u.name as coach_name
    from tournament_responses r
    join coach_signup_teams t on t.user_id = r.coach_user_id
    left join "user" u on u.id = r.coach_user_id
    join weekends w on w.id = r.weekend_id
    where r.choice = ${"interested"}
      and (
        r.weekend_id = ${event.id}
        or (
          ${eventName} <> ''
          and w.lifecycle <> ${"announced"}
          and w.start_date >= ${eventStart}
          and w.start_date <= ${eventEnd}
          and w.name like ${`${eventName}%`}
        )
      )
    order by t.name asc
  `;
	const agePicks = await sql`
    select coach_user_id, age_group, choice from event_age_responses
    where weekend_id = ${event.id}
  `;
	const ageUsers = new Set(agePicks.map((row: any) => String(row.coach_user_id)));
	const ageYes = new Set(
		agePicks.filter((row: any) => row.choice === "interested").map((row: any) => `${row.coach_user_id}|${row.age_group}`),
	);
	const taken = await sql`
    select t.coach_user_id, t.age_group, lower(btrim(t.name)) as name
    from teams t
    join weekends w on w.id = t.weekend_id
    where t.status in (${"pending"}, ${"approved"})
      and w.lifecycle <> ${"announced"}
      and w.start_date >= ${eventStart}
      and w.end_date <= ${eventEnd}
  `;
	const seen = new Set<number>();
	return rows
		.filter((row: any) => isAgeGroup(String(row.age_group)))
		.filter((row: any) => !ageUsers.has(String(row.user_id)) || ageYes.has(`${row.user_id}|${row.age_group}`))
		.filter((row: any) => !taken.some((team: any) => team.coach_user_id === row.user_id && team.age_group === row.age_group && team.name === String(row.team_name).trim().toLowerCase()))
		.filter((row: any) => {
			const id = Number(row.team_id);
			if (seen.has(id)) return false;
			seen.add(id);
			return true;
		})
		.map((row: any) => ({
			teamId: Number(row.team_id),
			coachUserId: String(row.user_id),
			coachName: typeof row.coach_name === "string" && row.coach_name.trim() ? row.coach_name.trim() : "Coach",
			teamName: String(row.team_name),
			ageGroup: String(row.age_group),
		}));
});

export type ClubCard = {
	teamName: string;
	ageGroup: string;
	coachName: string;
	email: string | null;
	phone: string | null;
	club: string | null;
	players: SquadPlayer[];
};

export const getClubCard = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data: any) => {
	const signupTeamId = data?.signupTeamId == null ? null : parsePositiveInt(data.signupTeamId, "Missing team.");
	const weekendTeamId = data?.weekendTeamId == null ? null : parsePositiveInt(data.weekendTeamId, "Missing team.");
	if ((signupTeamId == null) === (weekendTeamId == null)) throw new Error("Missing team.");
	return { signupTeamId, weekendTeamId };
}).handler(async ({ context, data }): Promise<ClubCard> => {
	await requireAdmin(context.userId);
	await ensureSignupColumns();
	const sql: any = await getSql();
	let userId = "";
	let teamName = "";
	let ageGroup = "";
	let signupId: number | null = data.signupTeamId;
	if (data.weekendTeamId != null) {
		const team = (await sql`
      select id, name, age_group, coach_user_id
      from teams where id = ${data.weekendTeamId} limit 1
    `)[0];
		if (!team) throw new Error("That team is gone.");
		teamName = String(team.name);
		ageGroup = String(team.age_group);
		userId = team.coach_user_id ? String(team.coach_user_id) : "";
		const signup = userId
			? (await sql`
          select id from coach_signup_teams
          where user_id = ${userId}
            and lower(btrim(name)) = lower(${teamName})
            and age_group = ${ageGroup}
          limit 1
        `)[0]
			: null;
		signupId = signup ? Number(signup.id) : null;
	} else if (signupId != null) {
		const team = (await sql`
      select id, user_id, name, age_group from coach_signup_teams where id = ${signupId} limit 1
    `)[0];
		if (!team) throw new Error("That team is gone.");
		userId = String(team.user_id);
		teamName = String(team.name);
		ageGroup = String(team.age_group);
	}
	const coach = userId
		? (await sql`
        select u.name as coach_name, u.email, p.phone, p.club
        from "user" u
        left join profiles p on p.user_id = u.id
        where u.id = ${userId}
        limit 1
      `)[0]
		: null;
	const players = signupId == null
		? []
		: await sql`
        select id, name, jersey, birthday
        from coach_roster_players
        where team_id = ${signupId}
        order by jersey asc, name asc
      `;
	const coachName = typeof coach?.coach_name === "string" && coach.coach_name.trim() ? coach.coach_name.trim() : "Coach";
	return {
		teamName,
		ageGroup,
		coachName,
		email: coach?.email ? String(coach.email) : null,
		phone: coach?.phone ? String(coach.phone) : null,
		club: coach?.club ? String(coach.club) : null,
		players: players.map(mapSquadPlayer),
	};
});

export const addInterestedClub = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
	teamId: parsePositiveInt(data?.teamId, "Missing team."),
	raiseAge: data?.raiseAge === true,
})).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	await ensureSignupColumns();
	let weekend = mapWeekend(await loadWeekendOrThrow(data.weekendId));
	if (weekend.lifecycle === "announced") throw new Error("Add teams on the tournament, not the event.");
	assertSheetOpen(weekend);
	await assertTeamEntryOpen(data.weekendId, weekend.startDate);
	const sql: any = await getSql();
	const club = (await sql`
    select id, user_id, name, age_group from coach_signup_teams where id = ${data.teamId} limit 1
  `)[0];
	if (!club) throw new Error("That team is gone.");
	if (!isAgeGroup(String(club.age_group))) throw new Error("That team has no age.");
	const event = (await sql`
    select id, name, start_date::text as start_date, end_date::text as end_date from weekends
    where lifecycle = ${"announced"}
      and start_date <= ${weekend.startDate}
      and end_date >= ${weekend.endDate}
    order by (end_date - start_date) asc, id asc
    limit 1
  `)[0];
	if (!event) throw new Error("No event is collecting interest for these dates.");
	const eventName = String(event.name || "").trim();
	const saidYes = (await sql`
    select 1
    from tournament_responses r
    join weekends w on w.id = r.weekend_id
    where r.coach_user_id = ${club.user_id}
      and r.choice = ${"interested"}
      and (
        r.weekend_id = ${event.id}
        or r.weekend_id = ${data.weekendId}
        or (
          ${eventName} <> ''
          and w.lifecycle <> ${"announced"}
          and w.start_date >= ${String(event.start_date).slice(0, 10)}
          and w.start_date <= ${String(event.end_date).slice(0, 10)}
          and w.name like ${`${eventName}%`}
        )
      )
    limit 1
  `)[0];
	if (!saidYes) throw new Error("That coach has not said they are interested.");
	const clubAge = String(club.age_group);
	const sameName = (await sql`
    select id, age_group from teams
    where weekend_id = ${data.weekendId}
      and status in (${"pending"}, ${"approved"})
      and coach_user_id = ${club.user_id}
      and lower(btrim(name)) = lower(${String(club.name).trim()})
    limit 1
  `)[0];
	if (sameName && String(sameName.age_group) === clubAge) throw new Error("That team is already on this tournament.");
	if (sameName) {
		await sql`update teams set age_group = ${clubAge} where id = ${sameName.id}`;
		await insertNotification(
			club.user_id,
			"You're in",
			`${String(club.name).trim()} is in ${weekend.name} as ${clubAge}.`,
			"teams",
			`age-${data.weekendId}-${sameName.id}-${clubAge}`,
		);
		await syncWeekendBracket(data.weekendId);
		return loadWeekendDetail(data.weekendId);
	}
	const duplicate = (await sql`
    select id from teams
    where weekend_id = ${data.weekendId}
      and status in (${"pending"}, ${"approved"})
      and coach_user_id = ${club.user_id}
      and age_group = ${club.age_group}
    limit 1
  `)[0];
	if (duplicate) throw new Error("That team is already on this tournament.");
	const approved = (await sql`
    select count(*)::int as n from teams where weekend_id = ${data.weekendId} and status = ${"approved"}
  `)[0];
	if ((approved?.n ?? 0) >= weekend.maxTeams) throw new Error(`This tournament is full (${weekend.maxTeams} teams).`);
	const fits = weekend.ageGroups.includes(clubAge as AgeGroup);
	if (data.raiseAge) {
		if (fits) throw new Error("That team already fits this tournament.");
		const current = Math.max(0, ...weekend.ageGroups.map((age) => Number.parseInt(age, 10) || 0));
		const next = Number.parseInt(clubAge, 10) || 0;
		if (next <= current) throw new Error("Only an older team can move this tournament up.");
		const from = weekend.ageGroups.length === 1 ? weekend.ageGroups[0] : null;
		const nextName = from ? renameTournamentAge(weekend.name, from, clubAge) : weekend.name;
		await sql`
      update weekends
      set name = ${nextName}, age_groups = ${JSON.stringify([clubAge])}
      where id = ${data.weekendId}
    `;
		if (from) {
			await sql`
        update weekend_age_groups set age_group = ${clubAge}
        where weekend_id = ${data.weekendId} and age_group = ${from}
      `;
			await sql`
        update games set age_group = ${clubAge}
        where weekend_id = ${data.weekendId} and age_group = ${from}
      `;
			await sql`
        update bracket_seeds set age_group = ${clubAge}
        where weekend_id = ${data.weekendId} and age_group = ${from}
      `;
		}
		weekend = mapWeekend(await loadWeekendOrThrow(data.weekendId));
	}
	await sql`
    insert into teams (weekend_id, age_group, name, coach_user_id, status, is_demo)
    values (${data.weekendId}, ${clubAge}, ${String(club.name).trim()}, ${club.user_id}, ${"approved"}, ${false})
  `;
	await insertNotification(
		club.user_id,
		"You're in",
		`${String(club.name).trim()} is in ${weekend.name}.`,
		"teams",
		`in-${data.weekendId}-${club.id}`,
	);
	await syncWeekendBracket(data.weekendId);
	return loadWeekendDetail(data.weekendId);
});

async function coachTeamLabels(sql: any, userId: string): Promise<string[]> {
	const rows = await sql`select name, age_group from coach_signup_teams where user_id = ${userId} order by id asc`;
	if (rows.length > 0) {
		return rows.map((row: any) => (row.age_group ? `${row.name} · ${row.age_group}` : String(row.name)));
	}
	const request = (await sql`
    select team_name from role_requests
    where user_id = ${userId} and requested_role = ${"coach"} and team_name is not null and btrim(team_name) <> ''
    order by created_at desc
    limit 1
  `)[0];
	return request ? [String(request.team_name)] : [];
}

export const listTournamentSignups = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data: any) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
})).handler(async ({ context, data }): Promise<{ id: string; name: string }[]> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const rows = await ((await getSql()) as any)`
    select 'interest-' || id::text as id, team_name as name, created_at
    from tournament_interest
    where weekend_id = ${data.weekendId}
    union all
    select 'team-' || id::text as id, name, created_at
    from teams
    where weekend_id = ${data.weekendId}
    order by created_at asc, name asc
  `;
	return rows.map((row: any) => ({ id: String(row.id), name: String(row.name) }));
});

export const finalizeWeekend = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const weekendId = parsePositiveInt(data?.weekendId, "Missing tournament.");
	const input = parseWeekendInput(data);
	return { weekendId, ...input };
}).handler(async ({ context, data }): Promise<Weekend> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const existing = (await sql`select id, lifecycle from weekends where id = ${data.weekendId} limit 1`)[0];
	if (!existing) throw new Error("That tournament is gone.");
	if (existing.lifecycle !== "announced") throw new Error("That tournament is already built.");
	await sql`
    update weekends
    set name = ${data.name},
        start_date = ${data.startDate},
        end_date = ${data.endDate},
        age_groups = ${JSON.stringify(data.ageGroups)},
        max_teams = ${data.maxTeams},
        pool_play = ${data.poolPlay},
        day_plan = ${JSON.stringify(data.dayPlan)},
        bracket_rules = ${JSON.stringify(data.rules)},
        lifecycle = ${"live"}
    where id = ${data.weekendId}
  `;
	for (const ageGroup of data.ageGroups) await sql`
    insert into weekend_age_groups (weekend_id, age_group, min_teams, max_teams)
    values (${data.weekendId}, ${ageGroup}, ${DEFAULT_AGE_MIN_TEAMS}, ${data.maxTeams})
    on conflict (weekend_id, age_group) do nothing
  `;
	const row = await loadWeekendOrThrow(data.weekendId);
	const weekend = mapWeekend(row);
	await writeCoachShell(weekend);
	return mapWeekend(await loadWeekendOrThrow(data.weekendId));
});

async function ensureFinalizeNotices(userId: string) {
	const profile = await loadProfile(userId);
	if (!profile || profile.homeRole !== "admin") return;
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const today = isoDateFromLocal(new Date());
	const rows = await sql`select id, name, start_date::text as start_date from weekends where lifecycle = ${"announced"}`;
	for (const row of rows) {
		const start = String(row.start_date).slice(0, 10);
		if (!finalizeIsDue(today, start)) continue;
		const countRow = (await sql`select count(*)::int as n from tournament_interest where weekend_id = ${row.id}`)[0];
		const n = Number(countRow?.n ?? 0);
		const interested = n === 0 ? "No teams have said they're interested yet" : n === 1 ? "1 team is interested" : `${n} teams are interested`;
		await insertNotification(
			userId,
			"Finish a tournament",
			`${row.name} starts ${formatMonthDay(start)}. ${interested}. Open the season and finish it.`,
			`finalize-${row.id}`,
			`finalize-${row.id}`,
		);
	}
}

async function eraseWeekend(sql: any, weekendId: number) {
	await sql`delete from score_audit where weekend_id = ${weekendId}`;
	await sql`delete from games where weekend_id = ${weekendId}`;
	await sql`delete from bracket_seeds where weekend_id = ${weekendId}`;
	await sql`delete from roster_players where team_id in (select id from teams where weekend_id = ${weekendId})`;
	await sql`delete from teams where weekend_id = ${weekendId}`;
	await sql`delete from weekend_scorekeepers where weekend_id = ${weekendId}`;
	await sql`delete from weekend_locations where weekend_id = ${weekendId}`;
	await sql`delete from weekend_age_groups where weekend_id = ${weekendId}`;
	await sql`delete from notifications where ref_key = ${`available-${weekendId}`} or ref_key = ${`finalize-${weekendId}`}`;
	await sql`delete from tournament_responses where weekend_id = ${weekendId}`;
	await sql`delete from tournament_interest where weekend_id = ${weekendId}`;
	await sql`delete from weekends where id = ${weekendId}`;
}

async function hostedTournamentIds(sql: any, event: { id: number; name: string; start_date: string; end_date: string }) {
	const start = String(event.start_date).slice(0, 10);
	const end = String(event.end_date).slice(0, 10);
	const name = String(event.name || "").trim();
	const rows = await sql`
    select id from weekends
    where id <> ${event.id}
      and lifecycle <> ${"announced"}
      and start_date >= ${start}
      and start_date <= ${end}
      and name like ${`${name}%`}
  `;
	return rows.map((row: { id: number }) => Number(row.id));
}

async function retireAnnouncedEvents() {
	const sql: any = await getSql();
	const events = await sql`
    select id, season, season_year, start_date::text as start_date, end_date::text as end_date
    from weekends where lifecycle = ${"announced"}
  `;
	for (const event of events) {
		const start = String(event.start_date).slice(0, 10);
		const end = String(event.end_date).slice(0, 10);
		const kids = await sql`
      select id, age_groups from weekends
      where id <> ${event.id}
        and lifecycle <> ${"announced"}
        and start_date >= ${start}
        and end_date <= ${end}
    `;
		if (kids.length === 0) {
			await sql`delete from event_age_responses where weekend_id = ${event.id}`;
			await eraseWeekend(sql, Number(event.id));
			continue;
		}
		const replies = await sql`
      select coach_user_id, age_group, choice from event_age_responses where weekend_id = ${event.id}
    `;
		const interest = await sql`
      select coach_user_id, team_name from tournament_interest where weekend_id = ${event.id}
    `;
		for (const kid of kids) {
			const ages = new Set(parseStoredAgeGroups(kid.age_groups));
			if (event.season && event.season_year != null) {
				await sql`
          update weekends
          set season = coalesce(season, ${event.season}),
              season_year = coalesce(season_year, ${event.season_year})
          where id = ${kid.id}
        `;
			}
			const coaches = new Set<string>();
			for (const reply of replies) {
				const age = String(reply.age_group);
				if (!ages.has(age as AgeGroup)) continue;
				coaches.add(String(reply.coach_user_id));
				await sql`
          insert into event_age_responses (weekend_id, coach_user_id, age_group, choice)
          values (${kid.id}, ${reply.coach_user_id}, ${age}, ${reply.choice})
          on conflict (weekend_id, coach_user_id, age_group) do nothing
        `;
			}
			for (const row of interest) {
				const teamAge = (await sql`
          select age_group from coach_signup_teams
          where user_id = ${row.coach_user_id} and lower(btrim(name)) = lower(btrim(${row.team_name}))
          limit 1
        `)[0];
				const age = teamAge ? String(teamAge.age_group) : "";
				const coachHit = replies.some(
					(reply: { coach_user_id: string; age_group: string }) =>
						String(reply.coach_user_id) === String(row.coach_user_id) && ages.has(String(reply.age_group) as AgeGroup),
				);
				if (age && !ages.has(age as AgeGroup)) continue;
				if (!age && !coachHit) continue;
				const existing = (await sql`
          select id from tournament_interest
          where weekend_id = ${kid.id}
            and coach_user_id = ${row.coach_user_id}
            and lower(btrim(team_name)) = lower(btrim(${row.team_name}))
          limit 1
        `)[0];
				if (!existing) {
					await sql`
            insert into tournament_interest (weekend_id, coach_user_id, team_name)
            values (${kid.id}, ${row.coach_user_id}, ${row.team_name})
          `;
				}
			}
			for (const coachId of coaches) {
				const picks = replies.filter(
					(reply: { coach_user_id: string; age_group: string; choice: string }) =>
						String(reply.coach_user_id) === coachId && ages.has(String(reply.age_group) as AgeGroup),
				);
				const rollup = picks.some((row: { choice: string }) => row.choice === "interested")
					? "interested"
					: picks.some((row: { choice: string }) => row.choice === "maybe")
						? "maybe"
						: "no";
				await sql`
          insert into tournament_responses (weekend_id, coach_user_id, choice)
          values (${kid.id}, ${coachId}, ${rollup})
          on conflict (weekend_id, coach_user_id) do nothing
        `;
			}
		}
		await sql`delete from event_age_responses where weekend_id = ${event.id}`;
		await eraseWeekend(sql, Number(event.id));
	}
}

export const deleteWeekend = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
	notify: data?.notify === true,
})).handler(async ({ context, data }): Promise<{ id: number }> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const weekend = (await sql`select id, name, lifecycle, start_date::text as start_date, end_date::text as end_date from weekends where id = ${data.weekendId} limit 1`)[0];
	if (!weekend) throw new Error("That tournament is already gone.");
	const coaches = await sql`
    select distinct coach_user_id from teams where weekend_id = ${data.weekendId}
  `;
	if (weekend.lifecycle === "announced") {
		const hosted = await hostedTournamentIds(sql, weekend);
		for (const id of hosted) await eraseWeekend(sql, id);
	}
	const name = String(weekend.name || "That tournament");
	const sameName = await sql`
    select id from weekends
    where id <> ${data.weekendId} and lower(btrim(name)) = lower(btrim(${name}))
    limit 1
  `;
	await eraseWeekend(sql, data.weekendId);
	if (!sameName[0]) {
		await sql`
      delete from notifications
      where lower(btrim(title)) = lower(btrim(${name}))
        and (kind = ${"available"} or lower(body) like ${"%if your team is interested%"})
    `;
	}
	if (data.notify) {
		const when = announcedWeekendName(String(weekend.start_date).slice(0, 10), String(weekend.end_date).slice(0, 10));
		const coachesOnApp = await sql`select user_id from profiles where home_role = ${"coach"}`;
		for (const coach of coachesOnApp) {
			await insertNotification(coach.user_id, "Weekend cancelled", `${name} (${when}) was cancelled.`);
		}
	} else {
		for (const coach of coaches) {
			if (!coach.coach_user_id) continue;
			await insertNotification(coach.coach_user_id, "Tournament removed", `${name} was taken off the schedule. Your team is no longer in it.`);
		}
	}
	return { id: data.weekendId };
});

async function writeCoachShell(weekend: Weekend): Promise<number> {
	if (weekend.lifecycle === "announced") return 0;
	if (weekend.rules.coachPath === "custom") return 0;
	const sql: any = await getSql();
	await ensureLiveOpsColumns();
	const already = (await sql`select id from games where weekend_id = ${weekend.id} limit 1`)[0];
	if (already) return 0;
	const fieldCount = weekend.rules.fieldCount > 0 ? weekend.rules.fieldCount : 0;
	const haveLocs = await sql`select id from weekend_locations where weekend_id = ${weekend.id} order by sort_order asc, id asc`;
	const locations: { id: number }[] = [];
	if (haveLocs.length === 0) {
		for (let i = 1; i <= fieldCount; i += 1) {
			const row = (await sql`
        insert into weekend_locations (weekend_id, name, address, sort_order, is_primary)
        values (${weekend.id}, ${`Field ${i}`}, ${"Name this park on Locations"}, ${i}, ${i === 1})
        returning id
      `)[0];
			if (row?.id) locations.push({ id: row.id });
		}
	} else {
		for (const row of haveLocs) locations.push({ id: row.id });
	}
	const age = weekend.ageGroups.find((group) => isAgeGroup(group));
	if (!age) return locations.length;
	const n = Math.max(2, weekend.maxTeams);
	const shellId = (seed: number) => 1_000_000 + seed;
	const poolSlots = Array.from({ length: n }, (_, i) => ({ seed: i + 1, teamId: shellId(i + 1), open: true }));
	const poolGames = weekend.poolPlay
		? buildPools(poolSlots, weekend.rules.poolGamesPerTeam).flatMap((pool) => pool.games)
		: [];
	const bracketN = weekend.poolPlay
		? Math.max(2, sundayTeamCount(n, true, weekend.rules.advance, weekend.rules.advancePerPool))
		: n;
	const games = buildGames(bracketField(bracketN, (seed) => shellId(seed)), { firstVsLast: weekend.rules.packSeed1vsLast });
	const packed = packSchedule({
		games,
		poolGames,
		locations,
		startDate: weekend.startDate,
		endDate: weekend.endDate,
		confirmed: [],
		dayPlan: weekend.dayPlan,
		rules: weekend.rules,
		teamCount: n,
	});
	for (let seed = 1; seed <= n; seed += 1) {
		await sql`
      insert into bracket_seeds (weekend_id, age_group, seed, team_id, frozen, division_index)
      values (${weekend.id}, ${age}, ${seed}, ${null}, ${false}, ${0})
      on conflict (weekend_id, age_group, seed) do nothing
    `;
	}
	for (const game of games) {
		const place = packed.find((row) => row.round === game.round && row.slot === game.slot);
		await sql`
      insert into games (
        weekend_id, age_group, round, slot,
        home_seed, away_seed, home_team_id, away_team_id,
        home_from_round, home_from_slot, away_from_round, away_from_slot,
        is_bye, location_id, field_confirmed, start_date, start_time, pool_index,
        division_index
      )
      values (
        ${weekend.id}, ${age}, ${game.round}, ${game.slot},
        ${game.homeSeed}, ${game.awaySeed}, ${null}, ${null},
        ${game.homeFromRound}, ${game.homeFromSlot}, ${game.awayFromRound}, ${game.awayFromSlot},
        ${game.isBye}, ${place?.locationId ?? null}, ${false}, ${place?.startDate ?? null}, ${place?.startTime ?? null},
        ${null}, ${0}
      )
    `;
	}
	for (const game of poolGames) {
		const place = packed.find((row) => row.round === game.round && row.slot === game.slot);
		await sql`
      insert into games (
        weekend_id, age_group, round, slot,
        home_seed, away_seed, home_team_id, away_team_id,
        home_from_round, home_from_slot, away_from_round, away_from_slot,
        is_bye, location_id, field_confirmed, start_date, start_time, pool_index,
        division_index
      )
      values (
        ${weekend.id}, ${age}, ${game.round}, ${game.slot},
        ${game.homeSeed}, ${game.awaySeed}, ${null}, ${null},
        ${null}, ${null}, ${null}, ${null},
        ${false}, ${place?.locationId ?? null}, ${false}, ${place?.startDate ?? null}, ${place?.startTime ?? null},
        ${game.poolIndex}, ${0}
      )
    `;
	}
	return locations.length;
}

function mapAgeRow(row: any) {
	if (!isAgeGroup(row.age_group)) return null;
	return {
		ageGroup: row.age_group,
		minTeams: row.min_teams,
		maxTeams: row.max_teams,
		teamCount: row.team_count ?? 0
	};
}
async function loadWeekendOrThrow(id: any): Promise<any> {
	await ensureLiveOpsColumns();
	const row = (await ((await getSql()) as any)`
    select
      w.id,
      w.name,
      w.start_date,
      w.end_date,
      w.age_groups,
      w.max_teams,
      w.pool_play,
      w.day_plan,
      w.sunday_seeds_locked,
      w.bracket_locked,
      w.sheet_lock,
      w.bracket_rules,
      w.public_dirty,
      w.public_pushed_at,
      w.dirty_after_lock,
      w.public_sheet,
      w.lockout_choice,
      w.created_by,
      w.created_at,
      w.lockout_notified,
      w.lifecycle,
      w.season,
      w.season_year,
      w.team_fee_cents,
      (select count(*)::int from weekend_locations l where l.weekend_id = w.id and l.name !~ '^Field [0-9]+ TBD$') as location_count,
      (select count(*)::int from teams t where t.weekend_id = w.id and t.status = ${"approved"}) as approved_count,
      (select count(*)::int from tournament_interest i where i.weekend_id = w.id) as interest_count,
      exists (
        select 1 from games g
        where g.weekend_id = w.id
          and (g.home_score is not null or g.away_score is not null or g.forfeit is not null)
      ) as has_scored_game,
      (
        exists (
          select 1 from games g
          where g.weekend_id = w.id
            and g.round = ${"f"}
            and g.is_bye = ${false}
            and g.no_contest = ${false}
            and (
              g.forfeit is not null
              or (g.home_score is not null and g.away_score is not null and g.home_score <> g.away_score)
            )
        )
        and not exists (
          select 1 from games g
          where g.weekend_id = w.id
            and g.round = ${"f"}
            and g.is_bye = ${false}
            and g.no_contest = ${false}
            and g.forfeit is null
            and (g.home_score is null or g.away_score is null or g.home_score = g.away_score)
        )
      ) as has_champion,
      (
        select max(a.created_at)
        from score_audit a
        join games g on g.id = a.game_id
        where a.weekend_id = w.id and g.round = ${"f"}
      ) as champion_at
    from weekends w
    where w.id = ${id}
    limit 1
  `)[0];
	if (!row) throw new Error("That tournament is gone.");
	return row;
}
async function loadAges(weekendId: any, fallback: any) {
	const sql: any = await getSql();
	let mapped = (await sql`
    select
      a.age_group,
      a.min_teams,
      a.max_teams,
      (select count(*)::int from teams t
        where t.weekend_id = a.weekend_id and t.age_group = a.age_group) as team_count
    from weekend_age_groups a
    where a.weekend_id = ${weekendId}
  `).map(mapAgeRow).filter((row: any) => row != null);
	if (mapped.length === 0 && fallback.length > 0) {
		for (const ageGroup of fallback) await sql`
        insert into weekend_age_groups (weekend_id, age_group)
        values (${weekendId}, ${ageGroup})
        on conflict (weekend_id, age_group) do nothing
      `;
		mapped = fallback.map((ageGroup: any) => ({
			ageGroup,
			minTeams: null,
			maxTeams: null,
			teamCount: 0
		}));
	}
	mapped.sort((a: any, b: any) => AGE_GROUPS.indexOf(a.ageGroup) - AGE_GROUPS.indexOf(b.ageGroup));
	return mapped;
}
function storedAges(value: unknown): AgeGroup[] {
	let list: unknown = value;
	if (typeof value === "string") {
		try {
			list = JSON.parse(value);
		} catch {
			list = [];
		}
	}
	if (!Array.isArray(list)) return [];
	return AGE_GROUPS.filter((age) => list.includes(age));
}
function mapFlags(row: any): ParkFlags {
	const entranceFee = Boolean(row.entrance_fee);
	const ageDiscount = entranceFee && Boolean(row.age_discount);
	return {
		chairs: Boolean(row.chairs_allowed),
		canopies: Boolean(row.canopies),
		concessions: Boolean(row.concessions),
		restrooms: Boolean(row.restrooms),
		lights: Boolean(row.lights),
		bleachers: Boolean(row.bleachers),
		entranceFee,
		entrancePrice: row.entrance_price == null ? "" : String(row.entrance_price),
		ageDiscount,
		discountAges: ageDiscount ? storedAges(row.discount_ages) : [],
		discountPrice: ageDiscount && row.discount_price != null ? String(row.discount_price) : "",
	};
}
async function loadLocations(weekendId: any) {
	await ensureLiveOpsColumns();
	return (await ((await getSql()) as any)`
    select id, park_id, name, address, is_primary, entrance_fee, entrance_price, age_discount, discount_ages, discount_price, chairs_allowed, canopies, concessions, restrooms, lights, bleachers
    from weekend_locations
    where weekend_id = ${weekendId}
    order by is_primary desc, sort_order asc, id asc
  `).map((row: any) => ({
		id: row.id,
		parkId: row.park_id == null ? null : Number(row.park_id),
		name: row.name,
		address: row.address,
		isPrimary: Boolean(row.is_primary),
		...mapFlags(row),
	}));
}
async function loadWeekendTeams(weekendId: any) {
	const rows = await ((await getSql()) as any)`
    select id, name, age_group, is_demo
    from teams
    where weekend_id = ${weekendId} and status = ${"approved"}
    order by age_group asc, name asc, id asc
  `;
	const list: WeekendTeam[] = [];
	for (const row of rows) {
		if (!isAgeGroup(row.age_group)) continue;
		list.push({
			id: row.id,
			name: row.name,
			ageGroup: row.age_group,
			isDemo: Boolean(row.is_demo)
		});
	}
	return list;
}
async function loadWeekendDetail(id: number): Promise<WeekendDetail> {
	const weekend = mapWeekend(await loadWeekendOrThrow(id));
	const [ages, allLocations, teams] = await Promise.all([
		loadAges(weekend.id, weekend.ageGroups),
		loadLocations(weekend.id),
		loadWeekendTeams(weekend.id)
	]);
	const locations = allLocations.filter((location: { name?: string }) => !/^Field \d+ TBD$/i.test(String(location.name ?? "")));
	return {
		...weekend,
		locationCount: locations.length,
		ages,
		locations,
		teams,
		hasBracket: (
			await ((await getSql()) as any)`
        select 1 as ok from games
        where weekend_id = ${id} and round <> ${"pool"} and is_bye = ${false}
        limit 1
      `
		).length > 0,
		hasPoolGames: (
			await ((await getSql()) as any)`
        select 1 as ok from games
        where weekend_id = ${id} and round = ${"pool"}
        limit 1
      `
		).length > 0,
		teamEntryClosed: teamEntryClosed({
			startDate: weekend.startDate,
			firstPitch: weekend.rules.firstPitch,
			scored: weekend.hasScoredGame,
		}),
		placeConflict: (
			await ((await getSql()) as any)`
        select 1 as ok from games
        where weekend_id = ${id} and place_conflict = ${true}
        limit 1
      `
		).length > 0,
		staffHint: await staffHintFor(id, locations.map((location: { id: number }) => location.id)),
		entryRequests: await loadEntryRequests(id),
	};
}
async function loadEntryRequests(weekendId: number): Promise<EntryRequest[]> {
	await ensureLiveOpsColumns();
	const rows = await ((await getSql()) as any)`
    select r.id, r.team_name, r.age_group, r.coach_user_id, u.name as coach_name
    from team_entry_requests r
    left join "user" u on u.id = r.coach_user_id
    where r.weekend_id = ${weekendId} and r.status = ${"pending"}
    order by r.id asc
  `;
	return rows.map((row: any) => ({
		id: Number(row.id),
		teamName: String(row.team_name),
		ageGroup: String(row.age_group),
		coachUserId: String(row.coach_user_id),
		coachName: String(row.coach_name || "Coach").trim() || "Coach",
	}));
}

export const getWeekend = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data: any) => ({ id: parsePositiveInt(data?.id, "Missing tournament.") })).handler(async ({ context, data }): Promise<WeekendDetail> => {
	const profile = await loadProfile(context.userId);
	if (profile?.homeRole === "admin") return loadWeekendDetail(data.id);
	const acting = { userId: context.userId };
	await actAsCoach(acting);
	const onIt = (await ((await getSql()) as any)`
    select 1 as ok from teams
    where weekend_id = ${data.id} and coach_user_id = ${acting.userId} and status = ${"approved"}
    limit 1
  `)[0];
	if (!onIt) throw new Error("You're not on this tournament.");
	return loadWeekendDetail(data.id);
});
export const saveWeekendCap = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
	maxTeams: parseTournamentMax(data?.maxTeams)
})).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
	await loadWeekendOrThrow(data.weekendId);
	await ((await getSql()) as any)`
      update weekends
      set max_teams = ${data.maxTeams}
      where id = ${data.weekendId}
    `;
	return loadWeekendDetail(data.weekendId);
});
export const saveWeekendAges = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => parseAgeCaps(data)).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
	await loadWeekendOrThrow(data.weekendId);
	const sql: any = await getSql();
	const existing = await sql`
      select age_group from weekend_age_groups where weekend_id = ${data.weekendId}
    `;
	const allowed = new Set(existing.map((row: any) => row.age_group));
	if (allowed.size === 0) throw new Error("This tournament has no ages yet.");
	for (const age of data.ages) {
		if (!allowed.has(age.ageGroup)) throw new Error(`${age.ageGroup} isn’t on this tournament.`);
		await sql`
        update weekend_age_groups
        set min_teams = ${age.minTeams}, max_teams = ${age.maxTeams}
        where weekend_id = ${data.weekendId} and age_group = ${age.ageGroup}
      `;
	}
	return loadWeekendDetail(data.weekendId);
});
export const updateWeekend = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => parseWeekendUpdate(data)).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const prior = mapWeekend(await loadWeekendOrThrow(data.weekendId));
	const sql: any = await getSql();
	const used = await sql`
      select distinct age_group from teams where weekend_id = ${data.weekendId}
    `;
	const priorAges = new Set(prior.ageGroups);
	const nextAges = new Set(data.ages.map((age: any) => age.ageGroup));
	for (const row of used) {
		if (!isAgeGroup(row.age_group)) continue;
		if (!priorAges.has(row.age_group)) continue;
		if (!nextAges.has(row.age_group)) throw new Error(`Can’t drop ${row.age_group} while a team is on it.`);
	}
	const lockSunday = data.poolPlay ? (data.poolPlay === prior.poolPlay ? prior.sundaySeedsLocked : false) : prior.sundaySeedsLocked;
	await sql`
      update weekends
      set
        name = ${data.name},
        start_date = ${data.startDate},
        end_date = ${data.endDate},
        max_teams = ${data.maxTeams},
        age_groups = ${JSON.stringify(data.ageGroups)},
        pool_play = ${data.poolPlay},
        day_plan = ${JSON.stringify(data.dayPlan)},
        bracket_rules = ${JSON.stringify(data.rules)},
        sunday_seeds_locked = ${lockSunday},
        team_fee_cents = ${data.teamFeeCents}
      where id = ${data.weekendId}
    `;
	const existing = await sql`
      select age_group from weekend_age_groups where weekend_id = ${data.weekendId}
    `;
	const have = new Set(existing.map((row: any) => row.age_group));
	for (const age of data.ages) if (have.has(age.ageGroup)) await sql`
          update weekend_age_groups
          set min_teams = ${age.minTeams}, max_teams = ${age.maxTeams}
          where weekend_id = ${data.weekendId} and age_group = ${age.ageGroup}
        `;
	else await sql`
          insert into weekend_age_groups (weekend_id, age_group, min_teams, max_teams)
          values (${data.weekendId}, ${age.ageGroup}, ${age.minTeams}, ${age.maxTeams})
        `;
	for (const row of existing) {
		if (nextAges.has(row.age_group)) continue;
		await sql`
        delete from weekend_age_groups
        where weekend_id = ${data.weekendId} and age_group = ${row.age_group}
      `;
		await sql`
        delete from games
        where weekend_id = ${data.weekendId} and age_group = ${row.age_group}
      `;
		await sql`
        delete from bracket_seeds
        where weekend_id = ${data.weekendId} and age_group = ${row.age_group}
      `;
	}
	await syncWeekendBracket(data.weekendId);
	return loadWeekendDetail(data.weekendId);
});
async function upsertPark(sql: any, name: string, address: string, flags: ParkFlags, updateFlags: boolean): Promise<number> {
	const existing = (await sql`
    select id from parks
    where lower(btrim(name)) = lower(${name}) and lower(btrim(address)) = lower(${address})
    limit 1
  `)[0];
	if (existing) {
		if (updateFlags) await sql`
      update parks
      set entrance_fee = ${flags.entranceFee},
          entrance_price = ${flags.entrancePrice},
          age_discount = ${flags.ageDiscount},
          discount_ages = ${JSON.stringify(flags.discountAges)},
          discount_price = ${flags.discountPrice},
          chairs_allowed = ${flags.chairs},
          canopies = ${flags.canopies},
          concessions = ${flags.concessions},
          restrooms = ${flags.restrooms},
          lights = ${flags.lights},
          bleachers = ${flags.bleachers}
      where id = ${existing.id}
    `;
		return existing.id;
	}
	const created = (await sql`
    insert into parks (
      name, address, entrance_fee, entrance_price, age_discount, discount_ages, discount_price,
      chairs_allowed, canopies, concessions, restrooms, lights, bleachers
    )
    values (
      ${name},
      ${address},
      ${flags.entranceFee},
      ${flags.entrancePrice},
      ${flags.ageDiscount},
      ${JSON.stringify(flags.discountAges)},
      ${flags.discountPrice},
      ${flags.chairs},
      ${flags.canopies},
      ${flags.concessions},
      ${flags.restrooms},
      ${flags.lights},
      ${flags.bleachers}
    )
    returning id
  `)[0];
	if (!created) throw new Error("Could not save that park.");
	return created.id;
}
export const listKnownParks = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<KnownPark[]> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	return (await ((await getSql()) as any)`
    select id, name, address, entrance_fee, entrance_price, age_discount, discount_ages, discount_price, chairs_allowed, canopies, concessions, restrooms, lights, bleachers
    from parks
    where name !~ '^Field [0-9]+ TBD$'
    order by name asc, id asc
  `).map((row: any) => ({
		id: row.id,
		name: row.name,
		address: row.address,
		...mapFlags(row),
	}));
});

export const addKnownPark = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const parsed = parseLocationInput({ weekendId: 1, name: data?.name, address: data?.address });
	return { name: parsed.name, address: parsed.address, ...parseParkFlags(data) };
}).handler(async ({ context, data }): Promise<KnownPark> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const flags = parseParkFlags(data);
	const id = await upsertPark(await getSql(), data.name, data.address, flags, true);
	return { id, name: data.name, address: data.address, ...flags };
});

export const listParkBookings = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data: any) => {
	const startDate = typeof data?.startDate === "string" ? data.startDate : "";
	const endDate = typeof data?.endDate === "string" ? data.endDate : "";
	if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
		throw new Error("Pick the tournament dates first.");
	}
	return { startDate, endDate };
}).handler(async ({ context, data }): Promise<{ tournament: string; parkId: number | null; name: string; address: string }[]> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const rows = await ((await getSql()) as any)`
    select w.name as tournament, l.park_id, l.name, l.address
    from weekend_locations l
    join weekends w on w.id = l.weekend_id
    where w.start_date::text <= ${data.endDate}
      and w.end_date::text >= ${data.startDate}
    order by w.name asc, l.name asc
  `;
	return rows.map((row: any) => ({
		tournament: String(row.tournament),
		parkId: row.park_id == null ? null : Number(row.park_id),
		name: String(row.name ?? ""),
		address: String(row.address ?? ""),
	}));
});
export const addWeekendLocation = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	...parseLocationInput(data),
	...parseParkFlags(data),
})).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
	await loadWeekendOrThrow(data.weekendId);
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const flags = parseParkFlags(data);
	const duplicate = (await sql`
    select id from weekend_locations
    where weekend_id = ${data.weekendId}
      and lower(btrim(name)) = lower(${data.name})
      and lower(btrim(address)) = lower(${data.address})
    limit 1
  `)[0];
	if (duplicate) throw new Error("That park is already on this tournament.");
	const sortOrder = (await sql`
      select coalesce(max(sort_order), -1) + 1 as next
      from weekend_locations
      where weekend_id = ${data.weekendId}
    `)[0]?.next ?? 0;
	const existing = await sql`
      select count(*)::int as n from weekend_locations where weekend_id = ${data.weekendId}
    `;
	const primary = (existing[0]?.n ?? 0) === 0;
	const parkId = await upsertPark(sql, data.name, data.address, flags, true);
	await sql`
      insert into weekend_locations (
        weekend_id, name, address, sort_order, is_primary, park_id,
        entrance_fee, entrance_price, age_discount, discount_ages, discount_price,
        chairs_allowed, canopies, concessions, restrooms, lights, bleachers
      )
      values (
        ${data.weekendId}, ${data.name}, ${data.address}, ${sortOrder}, ${primary}, ${parkId},
        ${flags.entranceFee}, ${flags.entrancePrice}, ${flags.ageDiscount}, ${JSON.stringify(flags.discountAges)}, ${flags.discountPrice},
        ${flags.chairs}, ${flags.canopies}, ${flags.concessions},
        ${flags.restrooms}, ${flags.lights}, ${flags.bleachers}
      )
    `;
	await syncWeekendBracket(data.weekendId);
	return loadWeekendDetail(data.weekendId);
});

const PARK_FLAG_SET = (flags: ParkFlags) => ({
	entranceFee: flags.entranceFee,
	entrancePrice: flags.entrancePrice,
	ageDiscount: flags.ageDiscount,
	discountAges: JSON.stringify(flags.discountAges),
	discountPrice: flags.discountPrice,
	chairs: flags.chairs,
	canopies: flags.canopies,
	concessions: flags.concessions,
	restrooms: flags.restrooms,
	lights: flags.lights,
	bleachers: flags.bleachers,
});

async function writeParkRow(sql: any, id: number, name: string, address: string, flags: ParkFlags) {
	const clash = (await sql`
    select id from parks
    where id <> ${id}
      and lower(btrim(name)) = lower(${name})
      and lower(btrim(address)) = lower(${address})
    limit 1
  `)[0];
	if (clash) throw new Error("Another saved park already uses that name and address.");
	const saved = PARK_FLAG_SET(flags);
	await sql`
    update parks
    set name = ${name},
        address = ${address},
        entrance_fee = ${saved.entranceFee},
        entrance_price = ${saved.entrancePrice},
        age_discount = ${saved.ageDiscount},
        discount_ages = ${saved.discountAges},
        discount_price = ${saved.discountPrice},
        chairs_allowed = ${saved.chairs},
        canopies = ${saved.canopies},
        concessions = ${saved.concessions},
        restrooms = ${saved.restrooms},
        lights = ${saved.lights},
        bleachers = ${saved.bleachers}
    where id = ${id}
  `;
}

export const updateKnownPark = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const parsed = parseLocationInput({ weekendId: 1, name: data?.name, address: data?.address });
	return {
		id: parsePositiveInt(data?.id, "Missing park."),
		name: parsed.name,
		address: parsed.address,
		...parseParkFlags(data),
	};
}).handler(async ({ context, data }): Promise<KnownPark> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const flags = parseParkFlags(data);
	const existing = (await sql`select id from parks where id = ${data.id} limit 1`)[0];
	if (!existing) throw new Error("That saved park is gone.");
	await writeParkRow(sql, data.id, data.name, data.address, flags);
	return { id: data.id, name: data.name, address: data.address, ...flags };
});

export const removeKnownPark = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	id: parsePositiveInt(data?.id, "Missing park."),
})).handler(async ({ context, data }): Promise<{ id: number }> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const existing = (await sql`select id from parks where id = ${data.id} limit 1`)[0];
	if (!existing) throw new Error("That saved park is gone.");
	await sql`update weekend_locations set park_id = ${null} where park_id = ${data.id}`;
	await sql`delete from parks where id = ${data.id}`;
	return { id: data.id };
});

export const updateWeekendLocation = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const parsed = parseLocationInput({ weekendId: 1, name: data?.name, address: data?.address });
	return {
		id: parsePositiveInt(data?.id, "Missing park."),
		name: parsed.name,
		address: parsed.address,
		saveToResource: data?.saveToResource === true,
		knownParkId: Number.isInteger(Number(data?.knownParkId)) && Number(data.knownParkId) > 0 ? Number(data.knownParkId) : null,
		...parseParkFlags(data),
	};
}).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const row = (await sql`
    select id, weekend_id, park_id from weekend_locations where id = ${data.id} limit 1
  `)[0];
	if (!row) throw new Error("That park is already gone.");
	await loadWeekendOrThrow(row.weekend_id);
	const flags = parseParkFlags(data);
	const duplicate = (await sql`
    select id from weekend_locations
    where weekend_id = ${row.weekend_id}
      and id <> ${data.id}
      and lower(btrim(name)) = lower(${data.name})
      and lower(btrim(address)) = lower(${data.address})
    limit 1
  `)[0];
	if (duplicate) throw new Error("That park is already on this tournament.");
	let parkId = row.park_id == null ? null : Number(row.park_id);
	if (data.knownParkId) {
		const chosen = (await sql`select id from parks where id = ${data.knownParkId} limit 1`)[0];
		if (!chosen) throw new Error("That saved park is gone.");
		if (data.saveToResource) await writeParkRow(sql, data.knownParkId, data.name, data.address, flags);
		parkId = data.knownParkId;
	} else if (data.saveToResource) {
		if (parkId) {
			const still = (await sql`select id from parks where id = ${parkId} limit 1`)[0];
			if (still) await writeParkRow(sql, parkId, data.name, data.address, flags);
			else parkId = await upsertPark(sql, data.name, data.address, flags, true);
		} else {
			parkId = await upsertPark(sql, data.name, data.address, flags, true);
		}
	} else if (parkId) {
		const linked = (await sql`select name, address from parks where id = ${parkId} limit 1`)[0];
		const same =
			linked &&
			String(linked.name).trim().toLowerCase() === data.name.toLowerCase() &&
			String(linked.address).trim().toLowerCase() === data.address.toLowerCase();
		if (!same) parkId = null;
	}
	const saved = PARK_FLAG_SET(flags);
	await sql`
    update weekend_locations
    set name = ${data.name},
        address = ${data.address},
        park_id = ${parkId},
        entrance_fee = ${saved.entranceFee},
        entrance_price = ${saved.entrancePrice},
        age_discount = ${saved.ageDiscount},
        discount_ages = ${saved.discountAges},
        discount_price = ${saved.discountPrice},
        chairs_allowed = ${saved.chairs},
        canopies = ${saved.canopies},
        concessions = ${saved.concessions},
        restrooms = ${saved.restrooms},
        lights = ${saved.lights},
        bleachers = ${saved.bleachers}
    where id = ${data.id}
  `;
	return loadWeekendDetail(row.weekend_id);
});

export const removeWeekendLocation = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({ id: parsePositiveInt(data?.id, "Missing park.") })).handler(async ({ context, data }) => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	const weekendId = (await sql`
      select weekend_id from weekend_locations where id = ${data.id} limit 1
    `)[0]?.weekend_id;
	if (!weekendId) throw new Error("That park is already gone.");
	await loadWeekendOrThrow(weekendId);
	await sql`delete from weekend_locations where id = ${data.id}`;
	await sql`
      update games
      set location_id = null, field_confirmed = false
      where location_id = ${data.id}
    `;
	const still = await sql`
      select id from weekend_locations
      where weekend_id = ${weekendId} and is_primary = true
      limit 1
    `;
	if (!still[0]) {
		const next = await sql`
        select id from weekend_locations
        where weekend_id = ${weekendId}
        order by sort_order asc, id asc
        limit 1
      `;
		if (next[0]) await sql`update weekend_locations set is_primary = true where id = ${next[0].id}`;
	}
	await syncWeekendBracket(weekendId);
	return loadWeekendDetail(weekendId);
});

export const setPrimaryPark = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	id: parsePositiveInt(data?.id, "Missing park."),
})).handler(async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const row = (await sql`
      select weekend_id from weekend_locations where id = ${data.id} limit 1
    `)[0];
	if (!row) throw new Error("That park is already gone.");
	await loadWeekendOrThrow(row.weekend_id);
	await sql`update weekend_locations set is_primary = false where weekend_id = ${row.weekend_id}`;
	await sql`update weekend_locations set is_primary = true where id = ${data.id}`;
	await syncWeekendBracket(row.weekend_id);
	return loadWeekendDetail(row.weekend_id);
});

async function loadAgeCounts(weekendId: any) {
	const rows = await ((await getSql()) as any)`
    select age_group, count(*)::int as n
    from teams
    where weekend_id = ${weekendId} and status = ${"approved"}
    group by age_group
  `;
	return new Map(rows.map((row: any) => [row.age_group, row.n]));
}
async function toOpenAges(weekendId: any, fallback: any) {
	const ages = await loadAges(weekendId, fallback);
	const counts = await loadAgeCounts(weekendId);
	return ages.map((age: any) => {
		const registered = counts.get(age.ageGroup) ?? 0;
		const open = age.maxTeams == null || registered < age.maxTeams;
		return {
			ageGroup: age.ageGroup,
			minTeams: age.minTeams,
			maxTeams: age.maxTeams,
			registered,
			open
		};
	});
}
function mapRegisteredTeam(row: any, locations: any, players: any) {
	if (!isAgeGroup(row.age_group)) throw new Error("That team has a bad age group.");
	const status = isTeamStatus(row.status) ? row.status : "pending";
	return {
		id: row.id,
		name: row.name,
		ageGroup: row.age_group,
		weekendId: row.weekend_id,
		tournamentName: row.tournament_name,
		startDate: row.start_date,
		endDate: row.end_date,
		status,
		attendingConfirmed: Boolean(row.attending_confirmed),
		playerCount: players.length,
		players,
		locations
	};
}
async function loadRoster(teamId: any) {
	return (await ((await getSql()) as any)`
    select id, name, jersey, age_group
    from roster_players
    where team_id = ${teamId}
    order by jersey asc, name asc
  `).map((row: any) => {
		if (!isAgeGroup(row.age_group)) throw new Error("That player has a bad age group.");
		return {
			id: row.id,
			name: row.name,
			jersey: row.jersey,
			ageGroup: row.age_group
		};
	});
}
async function loadOwnedTeam(userId: any, teamId: any) {
	await ensureAttendanceColumn();
	const row = (await ((await getSql()) as any)`
    select
      t.id,
      t.name,
      t.age_group,
      t.weekend_id,
      t.status,
      t.attending_confirmed,
      w.name as tournament_name,
      w.start_date,
      w.end_date
    from teams t
    join weekends w on w.id = t.weekend_id
    where t.id = ${teamId} and t.coach_user_id = ${userId}
    limit 1
  `)[0];
	if (!row) throw new Error("That team isn’t yours.");
	const [locations, players] = await Promise.all([loadLocations(row.weekend_id), loadRoster(row.id)]);
	return mapRegisteredTeam(row, locations, players);
}
function isDuplicateKey(err: any) {
	const msg = err instanceof Error ? err.message : String(err);
	return /unique|duplicate key|23505/i.test(msg);
}

async function weekendHasScoredGame(weekendId: number): Promise<boolean> {
	const row = (await ((await getSql()) as any)`
    select 1 as ok from games
    where weekend_id = ${weekendId}
      and (home_score is not null or away_score is not null or forfeit is not null)
    limit 1
  `)[0];
	return Boolean(row);
}

async function assertTeamEntryOpen(weekendId: number, startDate: string): Promise<void> {
	const weekend = mapWeekend(await loadWeekendOrThrow(weekendId));
	const reason = teamEntryClosed({
		startDate: weekend.startDate || startDate,
		firstPitch: weekend.rules.firstPitch,
		scored: weekend.hasScoredGame,
	});
	if (reason) throw new Error(reason);
}
export const listOpenTournaments = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<OpenTournament[]> => {
	await actAsCoach(context);
	const today = isoDateFromLocal(new Date());
	const rows = await ((await getSql()) as any)`
      select
        w.id,
        w.name,
        w.start_date,
        w.end_date,
        w.age_groups,
        w.max_teams,
        w.pool_play,
        w.day_plan,
        w.bracket_rules,
        (select count(*)::int from weekend_locations l where l.weekend_id = w.id and l.name !~ '^Field [0-9]+ TBD$') as location_count,
        (select count(*)::int from teams t where t.weekend_id = w.id and t.status = ${"approved"}) as approved_count,
        exists (
          select 1 from games g
          where g.weekend_id = w.id
            and (g.home_score is not null or g.away_score is not null or g.forfeit is not null)
        ) as has_scored_game
      from weekends w
      where w.start_date > ${today}
      order by w.start_date asc, w.id asc
    `;
	const list: OpenTournament[] = [];
	for (const row of rows) {
		const weekend = mapWeekend(row);
		if (teamEntryClosed({ startDate: weekend.startDate, firstPitch: weekend.rules.firstPitch, scored: weekend.hasScoredGame })) continue;
		const ages = await toOpenAges(weekend.id, weekend.ageGroups);
		list.push({
			id: weekend.id,
			name: weekend.name,
			startDate: weekend.startDate,
			endDate: weekend.endDate,
			maxTeams: weekend.maxTeams,
			approvedCount: weekend.approvedCount,
			ages
		});
	}
	return list;
});
let attendanceColumnReady: Promise<void> | null = null;
function ensureAttendanceColumn() {
	if (!attendanceColumnReady) {
		attendanceColumnReady = ((async () => {
			await ((await getSql()) as any).query("alter table teams add column if not exists attending_confirmed boolean not null default false");
		})()).catch((error) => {
			attendanceColumnReady = null;
			throw error;
		});
	}
	return attendanceColumnReady;
}

export const listMyTeams = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<RegisteredTeam[]> => {
	await actAsCoach(context);
	await ensureAttendanceColumn();
	const rows = await ((await getSql()) as any)`
      select
        t.id,
        t.name,
        t.age_group,
        t.weekend_id,
        t.status,
        t.attending_confirmed,
        w.name as tournament_name,
        w.start_date,
        w.end_date
      from teams t
      join weekends w on w.id = t.weekend_id
      where t.coach_user_id = ${context.userId}
      order by w.start_date asc, t.id desc
    `;
	const result = [];
	for (const row of rows) {
		const [locations, players] = await Promise.all([loadLocations(row.weekend_id), loadRoster(row.id)]);
		result.push(mapRegisteredTeam(row, locations, players));
	}
	return result;
});

export const confirmAttendance = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	teamId: parsePositiveInt(data?.teamId, "Missing team."),
})).handler(async ({ context, data }) => {
	await actAsCoach(context);
	await ensureAttendanceColumn();
	const row = (await ((await getSql()) as any)`
    update teams
    set attending_confirmed = true
    where id = ${data.teamId} and coach_user_id = ${context.userId} and status = ${"approved"}
    returning id
  `)[0];
	if (!row) throw new Error("That team is not in this tournament yet.");
	return { ok: true as const };
});

export const getMyTeam = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data: any) => ({ id: parsePositiveInt(data?.id, "Missing team.") })).handler(async ({ context, data }): Promise<RegisteredTeam> => {
	await actAsCoach(context);
	return loadOwnedTeam(context.userId, data.id);
});
export const registerTeam = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => parseTeamRegister(data)).handler(async ({ context, data }): Promise<RegisteredTeam> => {
	await actAsCoach(context);
	const weekend = mapWeekend(await loadWeekendOrThrow(data.weekendId));
	const today = isoDateFromLocal(/* @__PURE__ */ new Date());
	if (weekend.endDate < today) throw new Error("That tournament is already over.");
	await assertTeamEntryOpen(weekend.id, weekend.startDate);
	if (!(await toOpenAges(weekend.id, weekend.ageGroups)).find((item: any) => item.ageGroup === data.ageGroup)) throw new Error(`${data.ageGroup} isn’t on this tournament.`);
	const sql: any = await getSql();
	if ((await sql`
      select id from teams
      where coach_user_id = ${context.userId}
        and weekend_id = ${data.weekendId}
        and age_group = ${data.ageGroup}
        and status in (${"pending"}, ${"approved"})
      limit 1
    `)[0]) throw new Error("You already have a team in that age for this tournament.");
	const row = (await sql`
      insert into teams (weekend_id, age_group, name, coach_user_id, status)
      values (${data.weekendId}, ${data.ageGroup}, ${data.name}, ${context.userId}, ${"pending"})
      returning id, name, age_group, weekend_id
    `)[0];
	if (!row) throw new Error("Could not send that request. Try again.");
	await insertNotification(context.userId, "Team waiting for approval", `${data.name} (${data.ageGroup}) is waiting for an Admin to take you into ${weekend.name}. A request is not a spot.`);
	return loadOwnedTeam(context.userId, row.id);
});
export const listPendingTeams = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<PendingTeam[]> => {
	await requireAdmin(context.userId);
	const rows = await ((await getSql()) as any)`
      select
        t.id,
        t.name,
        t.age_group,
        t.weekend_id,
        w.name as tournament_name,
        p.email as coach_email,
        t.created_at
      from teams t
      join weekends w on w.id = t.weekend_id
      join profiles p on p.user_id = t.coach_user_id
      where t.status = ${"pending"}
      order by t.created_at asc, t.id asc
    `;
	const list: PendingTeam[] = [];
	for (const row of rows) {
		if (!isAgeGroup(row.age_group)) continue;
		list.push({
			id: row.id,
			name: row.name,
			ageGroup: row.age_group,
			weekendId: row.weekend_id,
			tournamentName: row.tournament_name,
			coachEmail: row.coach_email,
			createdAt: row.created_at
		});
	}
	return list;
});
export const reviewTeam = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const id = parsePositiveInt(data?.id, "Missing team.");
	if (data?.action !== "approve" && data?.action !== "deny") throw new Error("Approve or deny that team.");
	return {
		id,
		action: data.action
	};
}).handler(async ({ context, data }) => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	const team = (await sql`
      select
        t.id,
        t.name,
        t.age_group,
        t.weekend_id,
        t.status,
        t.coach_user_id,
        w.name as tournament_name,
        w.start_date,
        w.max_teams
      from teams t
      join weekends w on w.id = t.weekend_id
      where t.id = ${data.id}
      limit 1
    `)[0];
	if (!team) throw new Error("That team is gone.");
	if (team.status !== "pending") throw new Error("That request was already handled.");
	if (data.action === "approve") {
		const approved = await sql`
        select count(*)::int as n
        from teams
        where weekend_id = ${team.weekend_id} and status = ${"approved"}
      `;
		const cap = team.max_teams || 40;
		if ((approved[0]?.n ?? 0) >= cap) throw new Error(`This tournament is full (${cap} teams).`);
		await assertTeamEntryOpen(team.weekend_id, asDateString(team.start_date) ?? "");
		const age = (await toOpenAges(team.weekend_id, [])).find((item: any) => item.ageGroup === team.age_group);
		if (age && !age.open) throw new Error(`${team.age_group} is already at its cap.`);
		await sql`update teams set status = ${"approved"} where id = ${team.id}`;
		await insertNotification(team.coach_user_id, "You're in", `${team.name} is in ${team.tournament_name} (${team.age_group}).`);
	} else {
		await sql`update teams set status = ${"denied"} where id = ${team.id}`;
		await insertNotification(team.coach_user_id, "Team not accepted", `${team.name} was not taken into ${team.tournament_name}. You can request a different tournament.`);
	}
	await syncWeekendBracket(team.weekend_id);
	return {
		id: team.id,
		action: data.action
	};
});
export const addPlayer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => parsePlayerInput(data)).handler(async ({ context, data }): Promise<RegisteredTeam> => {
	await actAsCoach(context);
	const team = await loadOwnedTeam(context.userId, data.teamId);
	const sql: any = await getSql();
	try {
		await sql`
        insert into roster_players (team_id, name, jersey, age_group)
        values (${team.id}, ${data.name}, ${data.jersey}, ${team.ageGroup})
      `;
	} catch (err) {
		if (isDuplicateKey(err)) throw new Error("That jersey is already on this roster.");
		throw err;
	}
	return loadOwnedTeam(context.userId, team.id);
});
export const removePlayer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	teamId: parsePositiveInt(data?.teamId, "Missing team."),
	playerId: parsePositiveInt(data?.playerId, "Missing player.")
})).handler(async ({ context, data }): Promise<RegisteredTeam> => {
	await actAsCoach(context);
	await loadOwnedTeam(context.userId, data.teamId);
	if (!(await ((await getSql()) as any)`
      delete from roster_players
      where id = ${data.playerId}
        and team_id = ${data.teamId}
      returning id
    `)[0]) throw new Error("That player isn’t on this roster.");
	return loadOwnedTeam(context.userId, data.teamId);
});
function scoredWinner(homeTeamId: number | null, awayTeamId: number | null, homeScore: number | null, awayScore: number | null, forfeit?: string | null): number | null {
	if (forfeit === "home") return awayTeamId;
	if (forfeit === "away") return homeTeamId;
	if (homeScore == null || awayScore == null) return null;
	if (homeScore > awayScore) return homeTeamId;
	if (awayScore > homeScore) return awayTeamId;
	return null;
}


async function applyWinnerAdvance(weekendId: number, ageGroup: AgeGroup): Promise<void> {
	const sql: any = await getSql();
	const rows = await sql`
    select id, round, slot, home_team_id, away_team_id, home_from_round, home_from_slot, away_from_round, away_from_slot, home_score, away_score, is_bye, forfeit, no_contest
    from games
    where weekend_id = ${weekendId} and age_group = ${ageGroup}
  `;
	const byKey = new Map<string, any>(rows.map((row: any) => [`${row.round}:${row.slot}`, row]));
	for (let pass = 0; pass < 2; pass += 1) {
		for (const row of rows) {
			if (row.round === POOL_ROUND) continue;
			let homeId = row.home_team_id;
			let awayId = row.away_team_id;
			const take = (feeder: any, current: number | null): number | null => {
				if (!feeder) return current;
				if (feeder.is_bye) return feeder.home_team_id ?? feeder.away_team_id ?? current;
				if (feeder.no_contest) {
					if (current != null && (current === feeder.home_team_id || current === feeder.away_team_id)) return null;
					return current;
				}
				return scoredWinner(feeder.home_team_id, feeder.away_team_id, feeder.home_score, feeder.away_score, feeder.forfeit);
			};
			if (row.home_from_round != null && row.home_from_slot != null) {
				homeId = take(byKey.get(`${row.home_from_round}:${row.home_from_slot}`), homeId);
			}
			if (row.away_from_round != null && row.away_from_slot != null) {
				awayId = take(byKey.get(`${row.away_from_round}:${row.away_from_slot}`), awayId);
			}
			if (homeId !== row.home_team_id || awayId !== row.away_team_id) {
				await sql`
        update games
        set home_team_id = ${homeId}, away_team_id = ${awayId}
        where id = ${row.id}
      `;
				row.home_team_id = homeId;
				row.away_team_id = awayId;
			}
		}
	}
}

async function removeDemoCoaches(sql: any) {
	await sql.query("alter table profiles add column if not exists is_temp boolean not null default false");
	const rows = await sql`
    select user_id from profiles
    where is_temp = true or user_id like ${"temp-coach-%"}
  `;
	const ids = [...new Set(rows.map((row: any) => String(row.user_id)))];
	if (ids.length === 0) return;
	for (const userId of ids) await wipeUserAccount(sql, String(userId));
}

async function wipeUserAccount(sql: any, userId: string) {
	const teams = await sql`select id from teams where coach_user_id = ${userId}`;
	for (const team of teams) {
		await sql`delete from roster_players where team_id = ${team.id}`;
		await sql`update games set home_team_id = null where home_team_id = ${team.id}`;
		await sql`update games set away_team_id = null where away_team_id = ${team.id}`;
		await sql`update bracket_seeds set team_id = null where team_id = ${team.id}`;
		await sql`delete from teams where id = ${team.id}`;
	}
	const squads = await sql`select id from coach_signup_teams where user_id = ${userId}`;
	for (const squad of squads) {
		await sql`delete from coach_roster_players where team_id = ${squad.id}`;
	}
	await sql`delete from coach_signup_teams where user_id = ${userId}`;
	await sql`delete from tournament_responses where coach_user_id = ${userId}`;
	await sql`delete from tournament_interest where coach_user_id = ${userId}`;
	try { await sql`delete from event_age_responses where coach_user_id = ${userId}`; } catch { /* age replies are optional */ }
	try { await sql`delete from coach_text_opens where coach_user_id = ${userId}`; } catch { /* text opens are optional */ }
	await sql`delete from notifications where user_id = ${userId}`;
	await sql`delete from role_requests where user_id = ${userId}`;
	try { await sql`delete from weekend_scorekeepers where user_id = ${userId}`; } catch { /* table may be missing */ }
	try { await sql`delete from score_audit where user_id = ${userId}`; } catch { /* audit is optional */ }
	try { await sql`update coach_invites set accepted_user_id = null where accepted_user_id = ${userId}`; } catch { /* invites are optional */ }
	try { await sql`update profiles set view_as_coach_id = null where view_as_coach_id = ${userId}`; } catch { /* column is optional */ }
	await sql`delete from profiles where user_id = ${userId}`;
	try { await sql`delete from "session" where "userId" = ${userId}`; } catch { /* no session */ }
	try { await sql`delete from "account" where "userId" = ${userId}`; } catch { /* no login */ }
	try { await sql`delete from "user" where id = ${userId}`; } catch { /* profile is already gone */ }
}

export const eraseAccount = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const userId = String(data?.userId ?? "").trim();
	if (!userId) throw new Error("Missing account.");
	return { userId };
}).handler(async ({ context, data }) => {
	await requireAdmin(context.userId);
	if (data.userId === context.userId) throw new Error("You can’t delete your own account.");
	await ensureSuperuserColumn();
	const sql: any = await getSql();
	const target = (await sql`select user_id, email, home_role from profiles where user_id = ${data.userId} limit 1`)[0];
	if (!target) throw new Error("That account is already gone.");
	if (isSuperuserOwner(target.email)) throw new Error("That superuser can’t be removed.");
	if (target.home_role === "admin") await requireAdminManager(context.userId);
	await wipeUserAccount(sql, data.userId);
	return { ok: true as const };
});

let liveOpsReady: Promise<void> | null = null;
async function ensureLiveOpsColumns(): Promise<void> {
	if (!liveOpsReady) {
		liveOpsReady = applyLiveOpsColumns().catch((error) => {
			liveOpsReady = null;
			throw error;
		});
	}
	return liveOpsReady;
}
async function applyLiveOpsColumns(): Promise<void> {
	const sql: any = await getSql();
	await sql.query("alter table weekends add column if not exists sheet_lock text not null default 'auto'");
	await sql.query("alter table weekends add column if not exists public_sheet text");
	await sql.query("alter table weekends add column if not exists public_pushed_at timestamptz");
	await sql.query("alter table weekends add column if not exists public_dirty boolean not null default true");
	await sql.query("alter table weekends add column if not exists dirty_after_lock boolean not null default false");
	await sql.query("alter table weekends add column if not exists lockout_notified boolean not null default false");
	await sql.query("alter table weekends add column if not exists lockout_choice text");
	await sql.query("alter table weekends add column if not exists team_fee_cents integer");
	await sql.query("alter table games add column if not exists place_conflict boolean not null default false");
	await sql.query("alter table games add column if not exists forfeit text");
	await sql.query("alter table games add column if not exists rainout boolean not null default false");
	await sql.query("alter table games add column if not exists score_locked boolean not null default false");
	await sql.query("alter table games add column if not exists no_contest boolean not null default false");
	await sql.query(`create table if not exists team_entry_requests (
    id serial primary key,
    weekend_id integer not null,
    coach_user_id text not null,
    team_name text not null,
    age_group text not null,
    status text not null default 'pending',
    created_at timestamptz not null default now()
  )`);
	await sql.query("alter table games add column if not exists division_index integer not null default 0");
	await sql.query("alter table bracket_seeds add column if not exists frozen boolean not null default false");
	await sql.query("alter table bracket_seeds add column if not exists division_index integer not null default 0");
	await sql.query(`create table if not exists weekend_scorekeepers (
    id serial primary key,
    weekend_id integer not null,
    user_id text not null,
    email text not null default '',
    scope text not null,
    location_id integer,
    on_date date,
    created_at timestamptz not null default now()
  )`);
	await sql.query(`create table if not exists score_audit (
    id serial primary key,
    game_id integer not null,
    weekend_id integer not null,
    user_id text not null,
    home_score integer,
    away_score integer,
    note text,
    created_at timestamptz not null default now()
  )`);
	await sql.query("alter table weekend_locations add column if not exists is_primary boolean not null default false");
	await sql.query("alter table weekends add column if not exists bracket_locked boolean not null default false");
	await sql.query(`create table if not exists parks (
    id serial primary key,
    name text not null,
    address text not null,
    parking boolean not null default false,
    entrance_fee boolean not null default false,
    chairs_allowed boolean not null default false,
    concessions boolean not null default false,
    restrooms boolean not null default false,
    lights boolean not null default false,
    bleachers boolean not null default false,
    created_at timestamptz not null default now()
  )`);
	await sql.query("create unique index if not exists parks_identity_idx on parks (lower(btrim(name)), lower(btrim(address)))");
	await sql.query(`delete from parks where name ~ '^Field [0-9]+ TBD$'`);
	for (const column of ["parking", "entrance_fee", "chairs_allowed", "concessions", "restrooms", "lights", "bleachers"]) {
		await sql.query(`alter table weekend_locations add column if not exists ${column} boolean not null default false`);
	}
	await sql.query("alter table weekend_locations add column if not exists park_id integer");
	for (const table of ["parks", "weekend_locations"]) {
		await sql.query(`alter table ${table} add column if not exists canopies boolean not null default false`);
		await sql.query(`alter table ${table} add column if not exists entrance_price text not null default ''`);
		await sql.query(`alter table ${table} add column if not exists age_discount boolean not null default false`);
		await sql.query(`alter table ${table} add column if not exists discount_ages text not null default '[]'`);
		await sql.query(`alter table ${table} add column if not exists discount_price text not null default ''`);
	}
	await sql.query(`insert into parks (name, address)
    select distinct on (lower(btrim(name)), lower(btrim(address))) name, address
    from weekend_locations
    where name !~ '^Field [0-9]+ TBD$'
      and not exists (
      select 1 from parks p
      where lower(btrim(p.name)) = lower(btrim(weekend_locations.name))
        and lower(btrim(p.address)) = lower(btrim(weekend_locations.address))
    )
    order by lower(btrim(name)), lower(btrim(address)), id`);
	await sql.query("alter table weekends add column if not exists lifecycle text not null default 'live'");
	await sql.query("alter table weekends add column if not exists season text");
	await sql.query("alter table weekends add column if not exists season_year integer");
	await sql.query(`create table if not exists season_windows (
    season text not null,
    season_year integer not null,
    start_date date not null,
    end_date date not null,
    primary key (season, season_year)
  )`);
	await sql.query(`create table if not exists season_planning (
    id integer primary key check (id = 1),
    planning_year integer not null
  )`);
	await sql.query(`insert into season_planning (id, planning_year) values (1, 2026) on conflict (id) do nothing`);
	await sql.query(`create table if not exists tournament_interest (
    id serial primary key,
    weekend_id integer not null references weekends (id) on delete cascade,
    coach_user_id text not null,
    team_name text not null,
    created_at timestamptz not null default now()
  )`);
	await sql.query("create unique index if not exists tournament_interest_team_idx on tournament_interest (weekend_id, coach_user_id, lower(btrim(team_name)))");
	await sql.query(`create table if not exists tournament_responses (
    id serial primary key,
    weekend_id integer not null references weekends (id) on delete cascade,
    coach_user_id text not null,
    choice text not null,
    created_at timestamptz not null default now()
  )`);
	await sql.query("create unique index if not exists tournament_responses_coach_idx on tournament_responses (weekend_id, coach_user_id)");
	await sql.query(`create table if not exists event_age_responses (
    id serial primary key,
    weekend_id integer not null references weekends (id) on delete cascade,
    coach_user_id text not null,
    age_group text not null,
    choice text not null,
    created_at timestamptz not null default now()
  )`);
	await sql.query("create unique index if not exists event_age_responses_idx on event_age_responses (weekend_id, coach_user_id, age_group)");
	await sql.query(`create table if not exists coach_text_batches (
    id serial primary key,
    season text not null,
    season_year integer not null,
    weekend_ids text not null,
    created_at timestamptz not null default now()
  )`);
	await sql.query(`create table if not exists coach_text_opens (
    batch_id integer not null references coach_text_batches (id) on delete cascade,
    coach_user_id text not null,
    opened_at timestamptz not null default now(),
    primary key (batch_id, coach_user_id)
  )`);
	await sql.query("alter table notifications add column if not exists ref_key text");
	await sql.query("create unique index if not exists notifications_user_ref_idx on notifications (user_id, ref_key) where ref_key is not null");
	await sql.query(`create table if not exists staff_members (
    id serial primary key,
    name text not null,
    phone text not null,
    created_at timestamptz not null default now()
  )`);
	await sql.query("create unique index if not exists staff_members_phone_idx on staff_members (phone)");
	await sql.query(`create table if not exists weekend_staff (
    id serial primary key,
    weekend_id integer not null references weekends (id) on delete cascade,
    location_id integer not null,
    role text not null,
    staff_id integer references staff_members (id) on delete set null,
    other_name text,
    other_phone text
  )`);
	await sql.query("create unique index if not exists weekend_staff_slot_idx on weekend_staff (weekend_id, location_id, role)");
	try {
		await removeDemoCoaches(sql);
	} catch {
		/* leftover demo rows should not block staff or the rest of the app */
	}
}

export type StaffMember = {
	id: number;
	name: string;
	phone: string;
};

export type StaffRole = "gate" | "scorekeeper";

export type WeekendStaffSlot = {
	locationId: number;
	role: StaffRole;
	staffId: number | null;
	otherName: string | null;
	otherPhone: string | null;
};

function staffDigits(phone: string): string {
	let digits = phone.replace(/\D/g, "");
	if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
	return digits;
}

export function staffPersonKey(
	slot: { staffId: number | null; otherPhone: string | null },
	members: StaffMember[],
): string | null {
	if (slot.staffId) return `id:${slot.staffId}`;
	const digits = staffDigits(slot.otherPhone ?? "");
	if (digits.length !== 10) return null;
	const match = members.find((member) => staffDigits(member.phone) === digits);
	return match ? `id:${match.id}` : `phone:${digits}`;
}

export function staffCrossFieldWarning(slots: WeekendStaffSlot[], members: StaffMember[]): string | null {
	const fields = new Map<string, Set<number>>();
	for (const slot of slots) {
		const key = staffPersonKey(slot, members);
		if (!key) continue;
		const set = fields.get(key) ?? new Set<number>();
		set.add(slot.locationId);
		fields.set(key, set);
	}
	return [...fields.values()].some((set) => set.size > 1) ? "Same person on 2 fields" : null;
}

async function staffHintFor(weekendId: number, locationIds: number[]): Promise<string> {
	if (locationIds.length === 0) return "Add a field first";
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const members = (await sql`select id, name, phone from staff_members order by name asc`).map((row: any) => ({
		id: Number(row.id),
		name: String(row.name),
		phone: String(row.phone),
	}));
	const rows = await sql`
    select location_id, role, staff_id, other_name, other_phone
    from weekend_staff
    where weekend_id = ${weekendId}
  `;
	const slots: WeekendStaffSlot[] = rows.map((row: any) => ({
		locationId: Number(row.location_id),
		role: row.role === "scorekeeper" ? "scorekeeper" : "gate",
		staffId: row.staff_id == null ? null : Number(row.staff_id),
		otherName: row.other_name ? String(row.other_name) : null,
		otherPhone: row.other_phone ? String(row.other_phone) : null,
	}));
	const needed = locationIds.flatMap((locationId) => (["gate", "scorekeeper"] as const).map((role) => ({ locationId, role })));
	const filled = needed.every((need) => {
		const slot = slots.find((row) => row.locationId === need.locationId && row.role === need.role);
		return Boolean(slot && staffPersonKey(slot, members));
	});
	if (!filled) return "Needs staff";
	return staffCrossFieldWarning(slots, members) ?? "Staff set";
}

export const listStaff = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<StaffMember[]> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const rows = await ((await getSql()) as any)`select id, name, phone from staff_members order by name asc, id asc`;
	return rows.map((row: any) => ({ id: Number(row.id), name: String(row.name), phone: formatPhoneInput(String(row.phone)) }));
});

export type StaffPick = {
	key: string;
	name: string;
	phone: string;
};

export const listStaffPicks = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<StaffPick[]> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const staff = await sql`select id, name, phone from staff_members order by name asc, id asc`;
	const admins = await sql`
    select p.user_id, p.phone, p.email, u.name as person_name
    from profiles p
    left join "user" u on u.id = p.user_id
    where p.home_role = ${"admin"}
    order by u.name asc
  `;
	const picks: StaffPick[] = staff.map((row: any) => ({
		key: `staff:${Number(row.id)}`,
		name: String(row.name).trim(),
		phone: formatPhoneInput(String(row.phone || "")),
	}));
	const phones = new Set(picks.map((pick) => staffDigits(pick.phone)).filter((digits) => digits.length === 10));
	for (const row of admins) {
		const phone = formatPhoneInput(String(row.phone || ""));
		const digits = staffDigits(phone);
		if (digits.length === 10 && phones.has(digits)) continue;
		const named = personName(row.person_name);
		picks.push({
			key: `admin:${String(row.user_id)}`,
			name: named || String(row.email || "Admin"),
			phone,
		});
		if (digits.length === 10) phones.add(digits);
	}
	return picks.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.key.localeCompare(b.key));
});

export const saveStaffMember = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const name = typeof data?.name === "string" ? data.name.trim() : "";
	if (!name) throw new Error("Enter a name.");
	const phone = formatPhoneInput(typeof data?.phone === "string" ? data.phone : "");
	if (staffDigits(phone).length !== 10) throw new Error("Enter a phone number.");
	return { name: name.slice(0, 80), phone };
}).handler(async ({ context, data }): Promise<StaffMember> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const taken = (await sql`select id from staff_members where phone = ${data.phone} limit 1`)[0];
	if (taken) throw new Error("That phone is already on staff.");
	const row = (await sql`
    insert into staff_members (name, phone)
    values (${data.name}, ${data.phone})
    returning id, name, phone
  `)[0];
	return { id: Number(row.id), name: String(row.name), phone: String(row.phone) };
});

export const removeStaffMember = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	id: parsePositiveInt(data?.id, "Missing staff."),
})).handler(async ({ context, data }): Promise<{ id: number }> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	await ((await getSql()) as any)`delete from staff_members where id = ${data.id}`;
	return { id: data.id };
});

export const listWeekendStaff = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data: any) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
})).handler(async ({ context, data }): Promise<WeekendStaffSlot[]> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const rows = await ((await getSql()) as any)`
    select location_id, role, staff_id, other_name, other_phone
    from weekend_staff
    where weekend_id = ${data.weekendId}
    order by location_id asc, role asc
  `;
	return rows.map((row: any) => ({
		locationId: Number(row.location_id),
		role: row.role === "scorekeeper" ? "scorekeeper" : "gate",
		staffId: row.staff_id == null ? null : Number(row.staff_id),
		otherName: row.other_name ? String(row.other_name) : null,
		otherPhone: row.other_phone ? formatPhoneInput(String(row.other_phone)) : null,
	}));
});

export const saveWeekendStaff = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const weekendId = parsePositiveInt(data?.weekendId, "Missing tournament.");
	if (!Array.isArray(data?.slots)) throw new Error("Pick staff for every field.");
	const slots: WeekendStaffSlot[] = [];
	for (const slot of data.slots) {
		const role = slot?.role === "scorekeeper" ? "scorekeeper" : slot?.role === "gate" ? "gate" : null;
		if (!role) throw new Error("Pick a position.");
		const staffId = slot?.staffId == null || slot.staffId === "" ? null : parsePositiveInt(slot.staffId, "Pick a staff member.");
		const otherName = typeof slot?.otherName === "string" ? slot.otherName.trim().slice(0, 80) : "";
		const otherPhone = formatPhoneInput(typeof slot?.otherPhone === "string" ? slot.otherPhone : "");
		const blank = staffId == null && !otherName && staffDigits(otherPhone).length === 0;
		if (blank) continue;
		if (staffId == null && (!otherName || staffDigits(otherPhone).length !== 10)) {
			throw new Error("Other staff need a name and phone number.");
		}
		slots.push({
			locationId: parsePositiveInt(slot?.locationId, "Missing field."),
			role,
			staffId,
			otherName: staffId == null ? otherName : null,
			otherPhone: staffId == null ? otherPhone : null,
		});
	}
	return { weekendId, slots };
}).handler(async ({ context, data }): Promise<{ detail: WeekendDetail; warning: string | null }> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const locations = await sql`select id from weekend_locations where weekend_id = ${data.weekendId}`;
	const locationIds = locations.map((row: any) => Number(row.id));
	if (locationIds.length === 0) throw new Error("Add a field before assigning staff.");
	const members = (await sql`select id, name, phone from staff_members`).map((row: any) => ({
		id: Number(row.id),
		name: String(row.name),
		phone: String(row.phone),
	}));
	for (const slot of data.slots) {
		if (slot.staffId != null && !members.some((member: StaffMember) => member.id === slot.staffId)) {
			throw new Error("That staff member is gone.");
		}
		if (!locationIds.includes(slot.locationId)) throw new Error("That field is not on this tournament.");
	}
	await sql`delete from weekend_staff where weekend_id = ${data.weekendId}`;
	for (const slot of data.slots) {
		await sql`
      insert into weekend_staff (weekend_id, location_id, role, staff_id, other_name, other_phone)
      values (${data.weekendId}, ${slot.locationId}, ${slot.role}, ${slot.staffId}, ${slot.otherName}, ${slot.otherPhone})
    `;
	}
	return {
		detail: await loadWeekendDetail(data.weekendId),
		warning: staffCrossFieldWarning(data.slots, members),
	};
});

async function paintSeedOnOpenGames(weekendId: number, ageGroup: AgeGroup, seed: number, teamId: number | null): Promise<void> {
	const sql: any = await getSql();
	await sql`
    update games set home_team_id = ${teamId}
    where weekend_id = ${weekendId} and age_group = ${ageGroup}
      and home_seed = ${seed} and home_from_round is null
      and round <> ${POOL_ROUND}
      and home_score is null and forfeit is null and no_contest = ${false}
  `;
	await sql`
    update games set away_team_id = ${teamId}
    where weekend_id = ${weekendId} and age_group = ${ageGroup}
      and away_seed = ${seed} and away_from_round is null
      and round <> ${POOL_ROUND}
      and away_score is null and forfeit is null and no_contest = ${false}
  `;
}

async function restoreOpenPoolTeams(_weekendId: number, _ageGroup: AgeGroup): Promise<void> {
	return;
}

async function fillOpenSeeds(weekend: Weekend, ageGroup: AgeGroup, teamIds: number[]): Promise<void> {
	if (weekend.rules.coachPath === "custom") return;
	const sql: any = await getSql();
	const seeds = await sql`
    select seed, team_id, frozen from bracket_seeds
    where weekend_id = ${weekend.id} and age_group = ${ageGroup}
    order by seed asc
  `;
	if (seeds.length === 0) return;
	const approved = new Set<number>(teamIds);
	const seated = new Set<number>();
	for (const row of seeds) {
		if (row.team_id != null && approved.has(row.team_id)) seated.add(row.team_id);
	}
	const incoming = teamIds.filter((id) => !seated.has(id));
	let cursor = 0;
	for (const row of seeds) {
		let teamId = row.team_id != null && approved.has(row.team_id) ? Number(row.team_id) : null;
		if (row.frozen && teamId != null) {
			await paintSeedOnOpenGames(weekend.id, ageGroup, row.seed, teamId);
			continue;
		}
		if (teamId == null) {
			teamId = incoming[cursor] ?? null;
			if (teamId == null) {
				if (row.team_id != null) {
					await sql`
            update bracket_seeds set team_id = ${null}, frozen = ${false}
            where weekend_id = ${weekend.id} and age_group = ${ageGroup} and seed = ${row.seed}
          `;
					await paintSeedOnOpenGames(weekend.id, ageGroup, row.seed, null);
				}
				continue;
			}
			cursor += 1;
			await sql`
        update bracket_seeds set team_id = ${teamId}
        where weekend_id = ${weekend.id} and age_group = ${ageGroup} and seed = ${row.seed}
      `;
		}
		await paintSeedOnOpenGames(weekend.id, ageGroup, row.seed, teamId);
	}
}

function clockSlots(firstPitch: string, lastStart: string, slotMinutes: number): string[] {
	const [sh, sm] = firstPitch.split(":").map(Number);
	const [eh, em] = lastStart.split(":").map(Number);
	const start = (sh || 0) * 60 + (sm || 0);
	const end = (eh || 0) * 60 + (em || 0);
	const step = Math.max(15, slotMinutes || 120);
	const slots: string[] = [];
	for (let minute = start; minute <= end; minute += step) {
		slots.push(`${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`);
	}
	return slots;
}

async function fitEnteredSheet(weekend: Weekend, ageGroup: AgeGroup, teamIds: number[]): Promise<void> {
	if (weekend.lifecycle === "announced" || weekend.sheetLocked || weekend.rules.coachPath === "custom") return;
	const sql: any = await getSql();
	const idsIn = [...new Set(teamIds.map((id) => Number(id)))];
	if (idsIn.length < 3) {
		const seeds = (await sql`
      select count(*)::int as n from bracket_seeds
      where weekend_id = ${weekend.id} and age_group = ${ageGroup}
    `)[0];
		const games = (await sql`
      select count(*)::int as n from games
      where weekend_id = ${weekend.id} and age_group = ${ageGroup}
    `)[0];
		if (Number(seeds?.n ?? 0) >= weekend.maxTeams && Number(games?.n ?? 0) > 0) return;
		await sql`delete from games where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
		await sql`delete from bracket_seeds where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
		await writeCoachShell(weekend);
		return;
	}
	const locations = await loadLocations(weekend.id);
	const seated = await sql`
    select seed, team_id from bracket_seeds
    where weekend_id = ${weekend.id} and age_group = ${ageGroup} and team_id is not null
    order by seed asc
  `;
	const priorIds = seated.map((row: any) => Number(row.team_id));
	const sameTeams = priorIds.length === idsIn.length && priorIds.every((id: number) => idsIn.includes(id));
	const existing = await sql`
    select id from games
    where weekend_id = ${weekend.id} and age_group = ${ageGroup}
    limit 1
  `;
	if (existing.length > 0) {
		const scored = (await sql`
      select count(*)::int as n from games
      where weekend_id = ${weekend.id} and age_group = ${ageGroup}
        and is_bye = ${false}
        and (home_score is not null or away_score is not null or forfeit is not null or no_contest = ${true})
    `)[0];
		if (Number(scored?.n ?? 0) > 0) return;
	}
	if (sameTeams && existing.length > 0) {
		const checkSlots = idsIn.map((teamId, index) => ({ seed: index + 1, teamId, open: true as const }));
		const expectedPool = buildPools(checkSlots).flatMap((pool) => pool.games).length;
		const expectedBracket = buildGames(checkSlots, { firstVsLast: weekend.rules.packSeed1vsLast }).filter((game) => !game.isBye).length;
		const counts = (await sql`
      select
        count(*) filter (where round = ${"pool"} and is_bye = ${false})::int as pool,
        count(*) filter (where round <> ${"pool"} and is_bye = ${false})::int as bracket
      from games
      where weekend_id = ${weekend.id} and age_group = ${ageGroup}
    `)[0];
		if (Number(counts?.pool ?? 0) === expectedPool && Number(counts?.bracket ?? 0) === expectedBracket) {
			const broken = (await sql`
        select count(*)::int as n from games g
        where weekend_id = ${weekend.id} and age_group = ${ageGroup} and is_bye = ${false}
          and (
            start_time is null or start_date is null or location_id is null
            or exists (
              select 1 from games o
              where o.weekend_id = g.weekend_id and o.age_group = g.age_group and o.id <> g.id
                and o.is_bye = ${false}
                and o.location_id = g.location_id
                and o.start_date = g.start_date
                and o.start_time = g.start_time
            )
          )
      `)[0];
			if (Number(broken?.n ?? 0) === 0) return;
		}
	}
	const ids = [...priorIds.filter((id: number) => idsIn.includes(id)), ...idsIn.filter((id) => !priorIds.includes(id))];
	const packedSeeds =
		seated.length === ids.length &&
		seated.every((row: any, index: number) => Number(row.seed) === index + 1 && Number(row.team_id) === ids[index]);
	if (!packedSeeds) {
		await sql`delete from bracket_seeds where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
		for (let index = 0; index < ids.length; index += 1) {
			await sql`
        insert into bracket_seeds (weekend_id, age_group, seed, team_id, frozen, division_index)
        values (${weekend.id}, ${ageGroup}, ${index + 1}, ${ids[index]}, ${false}, ${0})
      `;
		}
	}
	const slots = ids.map((teamId, index) => ({ seed: index + 1, teamId, open: true as const }));
	const poolGames = buildPools(slots).flatMap((pool) => pool.games);
	const bracketGames = buildGames(slots, { firstVsLast: weekend.rules.packSeed1vsLast });
	const playable: { round: string; slot: number; homeSeed: number | null; awaySeed: number | null; homeTeamId: number | null; awayTeamId: number | null; homeFromRound: string | null; homeFromSlot: number | null; awayFromRound: string | null; awayFromSlot: number | null; isBye: boolean; poolIndex: number | null }[] = [
		...poolGames.map((game) => ({
			round: game.round,
			slot: game.slot,
			homeSeed: game.homeSeed,
			awaySeed: game.awaySeed,
			homeTeamId: game.homeTeamId,
			awayTeamId: game.awayTeamId,
			homeFromRound: null,
			homeFromSlot: null,
			awayFromRound: null,
			awayFromSlot: null,
			isBye: false,
			poolIndex: game.poolIndex,
		})),
		...bracketGames.filter((game) => !game.isBye).map((game) => ({
			round: game.round,
			slot: game.slot,
			homeSeed: game.homeSeed,
			awaySeed: game.awaySeed,
			homeTeamId: game.homeTeamId,
			awayTeamId: game.awayTeamId,
			homeFromRound: game.homeFromRound,
			homeFromSlot: game.homeFromSlot,
			awayFromRound: game.awayFromRound,
			awayFromSlot: game.awayFromSlot,
			isBye: false,
			poolIndex: null,
		})),
	];
	const byes = bracketGames.filter((game) => game.isBye);
	const dates = (weekend.dayPlan.length > 0 ? weekend.dayPlan : [{ date: weekend.startDate, kind: "pool" as const }]).map((day) => day.date);
	const times = clockSlots(weekend.rules.firstPitch || "08:00", weekend.rules.lastStart || "20:00", weekend.rules.slotMinutes || 120);
	if (times.length === 0 || dates.length === 0) return;
	const poolPlayable = playable.filter((game) => game.round === "pool");
	const bracketPlayable = playable.filter((game) => game.round !== "pool");
	const dated = placeOneOrTwoFields(poolPlayable, bracketPlayable, dates[0]!, times);
	const realParks = locations.filter((loc: { name?: string }) => !/^Field \d+ TBD$/i.test(String(loc.name ?? "")));
	let fields = realParks;
	if (realParks.length === 0) {
		const kept: { id: number; name: string }[] = [];
		for (let index = 1; index <= dated.fields; index += 1) {
			const name = `Field ${index} TBD`;
			const have = locations.find((loc: { id: number; name?: string }) => String(loc.name) === name);
			if (have) {
				kept.push({ id: have.id, name });
				continue;
			}
			const row = (await sql`
        insert into weekend_locations (weekend_id, name, address, sort_order, is_primary)
        values (${weekend.id}, ${name}, ${"TBD"}, ${index}, ${index === 1})
        returning id
      `)[0];
			if (row?.id) kept.push({ id: Number(row.id), name });
		}
		fields = kept;
	} else if (dated.fields > 1 && realParks.length === 1) {
		const name = realParks[0]?.name ? `${realParks[0].name} 2` : "Field 2";
		const row = (await sql`
      insert into weekend_locations (weekend_id, name, address, sort_order, is_primary)
      values (${weekend.id}, ${name}, ${realParks[0]?.address ?? ""}, ${locations.length + 1}, ${false})
      returning id
    `)[0];
		if (row?.id) fields = [...realParks, { id: Number(row.id), name }];
	}
	const fieldId = (index: number) => fields[index]?.id ?? null;
	const placed = [
		...poolPlayable.map((game, index) => ({ ...game, date: dated.pool[index]!.date, time: dated.pool[index]!.time, locationId: fieldId(dated.pool[index]!.field) })),
		...bracketPlayable.map((game, index) => ({ ...game, date: dated.bracket[index]!.date, time: dated.bracket[index]!.time, locationId: fieldId(dated.bracket[index]!.field) })),
	];
	const scoredNow = (await sql`
    select count(*)::int as n from games
    where weekend_id = ${weekend.id} and age_group = ${ageGroup}
      and is_bye = ${false}
      and (home_score is not null or away_score is not null or forfeit is not null or no_contest = ${true})
  `)[0];
	if (Number(scoredNow?.n ?? 0) > 0) return;
	await sql`delete from games where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
	if (realParks.length > 0) {
		await sql`delete from weekend_locations where weekend_id = ${weekend.id} and name ~ ${"^Field [0-9]+ TBD$"}`;
	} else if (dated.fields < 2) {
		await sql`delete from weekend_locations where weekend_id = ${weekend.id} and name = ${"Field 2 TBD"}`;
	}
	for (const game of placed) {
		await sql`
      insert into games (
        weekend_id, age_group, round, slot,
        home_seed, away_seed, home_team_id, away_team_id,
        home_from_round, home_from_slot, away_from_round, away_from_slot,
        is_bye, location_id, field_confirmed, start_date, start_time, pool_index, division_index
      )
      values (
        ${weekend.id}, ${ageGroup}, ${game.round}, ${game.slot},
        ${game.homeSeed}, ${game.awaySeed}, ${game.homeTeamId}, ${game.awayTeamId},
        ${game.homeFromRound}, ${game.homeFromSlot}, ${game.awayFromRound}, ${game.awayFromSlot},
        ${false}, ${game.locationId}, ${false}, ${game.date}, ${game.time},
        ${game.poolIndex}, ${0}
      )
    `;
	}
	for (const game of byes) {
		await sql`
      insert into games (
        weekend_id, age_group, round, slot,
        home_seed, away_seed, home_team_id, away_team_id,
        home_from_round, home_from_slot, away_from_round, away_from_slot,
        is_bye, location_id, field_confirmed, start_date, start_time, pool_index, division_index
      )
      values (
        ${weekend.id}, ${ageGroup}, ${game.round}, ${game.slot},
        ${game.homeSeed}, ${game.awaySeed}, ${game.homeTeamId}, ${game.awayTeamId},
        ${game.homeFromRound}, ${game.homeFromSlot}, ${game.awayFromRound}, ${game.awayFromSlot},
        ${true}, ${null}, ${false}, ${null}, ${null},
        ${null}, ${0}
      )
    `;
	}
}

async function fillGuaranteedSeeds(weekend: Weekend, ageGroup: AgeGroup, teamIds: number[]): Promise<void> {
	const sql: any = await getSql();
	const seeds = await sql`
    select seed, team_id, frozen from bracket_seeds
    where weekend_id = ${weekend.id} and age_group = ${ageGroup}
    order by seed asc
  `;
	if (seeds.length === 0) return;
	const poolRows = await sql`
    select home_team_id, away_team_id, home_score, away_score, forfeit
    from games
    where weekend_id = ${weekend.id} and age_group = ${ageGroup} and round = ${"pool"} and is_bye = ${false}
  `;
	const results: PoolGameResult[] = poolRows.flatMap((row: any) =>
		row.home_team_id != null && row.away_team_id != null
			? [{
				homeTeamId: row.home_team_id,
				awayTeamId: row.away_team_id,
				homeScore: row.home_score == null ? null : Number(row.home_score),
				awayScore: row.away_score == null ? null : Number(row.away_score),
				forfeit: row.forfeit === "home" || row.forfeit === "away" ? row.forfeit : null,
			}]
			: [],
	);
	const placed = poolRows.length > 0 && poolRows.every((row: any) => row.forfeit || row.no_contest || (row.home_score != null && row.away_score != null))
		? new Map(poolStandings(teamIds, results, weekend.rules.tiebreakers).map((row) => [row.teamId, row.place]))
		: guaranteedPlaces(teamIds, results, weekend.rules.tiebreakers, weekend.rules.poolTies);
	const byPlace = new Map<number, number>();
	for (const [teamId, place] of placed) byPlace.set(place, teamId);
	if (!weekend.sundaySeedsLocked) {
		for (const row of seeds) {
			const earnedId = byPlace.get(Number(row.seed));
			if (!row.frozen) continue;
			if (earnedId != null && Number(row.team_id) === earnedId) continue;
			await sql`
        update bracket_seeds set frozen = ${false}
        where weekend_id = ${weekend.id} and age_group = ${ageGroup} and seed = ${row.seed}
      `;
			row.frozen = false;
		}
	}
	for (const [place, teamId] of byPlace) {
		const row = seeds.find((seed: any) => Number(seed.seed) === place);
		if (!row) continue;
		if (row.frozen && row.team_id != null && Number(row.team_id) !== teamId) continue;
		await sql`
      update bracket_seeds set team_id = ${teamId}, frozen = ${true}
      where weekend_id = ${weekend.id} and age_group = ${ageGroup} and seed = ${place}
    `;
		await paintSeedOnOpenGames(weekend.id, ageGroup, place, teamId);
	}
}

async function flagSeedConflict(weekend: Weekend, ageGroup: AgeGroup, gameId: number): Promise<void> {
	const sql: any = await getSql();
	const seeds = await sql`
    select seed, team_id, frozen from bracket_seeds
    where weekend_id = ${weekend.id} and age_group = ${ageGroup}
  `;
	const frozen = seeds.filter((row: any) => row.frozen && row.team_id != null);
	if (frozen.length === 0) return;
	const teamIds = await approvedTeamIds(weekend.id, ageGroup);
	const poolRows = await sql`
    select home_team_id, away_team_id, home_score, away_score, forfeit
    from games
    where weekend_id = ${weekend.id} and age_group = ${ageGroup} and round = ${"pool"} and is_bye = ${false}
  `;
	const results: PoolGameResult[] = poolRows.flatMap((row: any) =>
		row.home_team_id != null && row.away_team_id != null
			? [{
				homeTeamId: row.home_team_id,
				awayTeamId: row.away_team_id,
				homeScore: row.home_score == null ? null : Number(row.home_score),
				awayScore: row.away_score == null ? null : Number(row.away_score),
				forfeit: row.forfeit === "home" || row.forfeit === "away" ? row.forfeit : null,
			}]
			: [],
	);
	const placed = guaranteedPlaces(teamIds, results, weekend.rules.tiebreakers, weekend.rules.poolTies);
	let conflict = false;
	for (const row of frozen) {
		const place = placed.get(row.team_id);
		if (place != null && place !== row.seed) conflict = true;
	}
	if (!conflict) return;
	await sql`update games set place_conflict = ${true} where id = ${gameId}`;
	const owner = (await sql`select created_by from weekends where id = ${weekend.id}`)[0];
	if (owner?.created_by) {
		await insertNotification(owner.created_by, "Score changes a seed", `${weekend.name}: a pool score can move a frozen seed. Keep the original or reseed.`);
	}
}

async function markSheetDirty(weekendId: number): Promise<void> {
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const row = (await sql`
    select start_date, sheet_lock, bracket_rules, public_pushed_at
    from weekends where id = ${weekendId}
  `)[0];
	const start = asDateString(row?.start_date) ?? "";
	const rules = parseBracketRules(row?.bracket_rules);
	const scored = (await sql`
    select 1 as ok from games
    where weekend_id = ${weekendId}
      and (home_score is not null or away_score is not null or forfeit is not null)
    limit 1
  `)[0];
	const locked =
		Boolean(row?.public_pushed_at) &&
		(sheetIsLocked({
			lock: parseSheetLock(row?.sheet_lock),
			startDate: start,
			firstPitch: rules.firstPitch,
			scored: Boolean(scored),
		}) ||
			pastDropCutoff(start, isoDateFromLocal(new Date()), rules.dropCutoffDays));
	if (locked) {
		await sql`update weekends set public_dirty = ${true}, dirty_after_lock = ${true} where id = ${weekendId}`;
		return;
	}
	await sql`update weekends set public_dirty = ${true} where id = ${weekendId}`;
}

async function writeSeedNamesInPlace(weekend: Weekend, ageGroup: AgeGroup, teamIds: number[]): Promise<void> {
	await fillGuaranteedSeeds(weekend, ageGroup, teamIds);
}

async function persistAgeBracket(

	weekend: Weekend,
	ageGroup: AgeGroup,
	teamIds: number[],
	opts: { rebuildPools?: boolean; buildBracket?: boolean; reset?: boolean; fitToSignedUp?: boolean } = {},
): Promise<void> {
	if (weekend.lifecycle === "announced") return;
	const sql: any = await getSql();
	await ensureLiveOpsColumns();
	if (
		weekend.sheetLocked &&
		!opts.rebuildPools &&
		!opts.buildBracket &&
		!opts.reset &&
		!opts.fitToSignedUp
	) {
		if (weekend.sundaySeedsLocked) await writeSeedNamesInPlace(weekend, ageGroup, teamIds);
		await applyWinnerAdvance(weekend.id, ageGroup);
		return;
	}
	const explicit = Boolean(opts.rebuildPools || opts.buildBracket || opts.reset);
	const locations = await loadLocations(weekend.id);
	const plannedCuts =
		weekend.rules.divisions.length > 0
			? weekend.rules.divisions
			: [{ name: "Gold", size: Math.max(teamIds.length, weekend.maxTeams) }];
	const plannedTotal = plannedCuts.reduce((sum, cut) => sum + cut.size, 0);
	const fit = Boolean(opts.fitToSignedUp || weekend.bracketLocked);

	if (teamIds.length < 2 && (fit || plannedTotal < 2)) {
		if (opts.reset) {
			await sql`delete from games where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
			await sql`delete from bracket_seeds where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
		}
		return;
	}
	if (explicit && locations.length === 0) {
		throw new Error("Add at least one park before generating a schedule.");
	}
	const existing = await sql`
    select seed, team_id, frozen, division_index from bracket_seeds
    where weekend_id = ${weekend.id} and age_group = ${ageGroup}
    order by seed asc
  `;
	const prior = await sql`
    select round, slot, location_id, field_confirmed, home_team_id, away_team_id, home_seed, away_seed, pool_index, is_bye, home_score, away_score, forfeit, rainout, score_locked, no_contest, division_index
    from games
    where weekend_id = ${weekend.id} and age_group = ${ageGroup}
  `;
	if (opts.rebuildPools && hasPlayableBracket(prior.map((row: any) => ({ round: row.round, isBye: Boolean(row.is_bye) })))) {
		throw new Error(POOL_REGEN_BLOCKED);
	}
	const unfreeze = Boolean(opts.reset || opts.buildBracket);
	const frozenMap = new Map<number, number | null>();
	if (!unfreeze) {
		for (const row of existing) {
			if (row.frozen && row.team_id != null) frozenMap.set(row.seed, row.team_id);
		}
	}
	const slots = syncSeeds(existing.map((row: any) => ({
		seed: row.seed,
		teamId: frozenMap.get(row.seed) ?? row.team_id
	})), teamIds);

	const confirmed = prior.filter((row: any) => row.field_confirmed && row.location_id != null && locations.some((loc: any) => loc.id === row.location_id)).flatMap((row: any) => isGameRound(row.round) && row.location_id != null ? [{
		round: row.round,
		slot: row.slot,
		locationId: row.location_id
	}] : []);

	let poolGames: BuiltPoolGame[] = [];
	if (weekend.poolPlay && teamIds.length >= 2) {
		const priorPool = prior.filter((row: any) => row.round === POOL_ROUND);
		const priorIds = new Set<number>();
		for (const row of priorPool) {
			if (row.home_team_id != null) priorIds.add(row.home_team_id);
			if (row.away_team_id != null) priorIds.add(row.away_team_id);
		}
		const hasScores = priorPool.some((row: any) => row.home_score != null || row.away_score != null || row.forfeit);
		const sameN = priorIds.size === teamIds.length && teamIds.every((id: any) => priorIds.has(id)) && priorPool.length > 0;
		if (!opts.rebuildPools && (sameN || (hasScores && priorPool.length > 0))) {
			poolGames = priorPool.slice().sort((a: any, b: any) => a.slot - b.slot).flatMap((row: any, index: any) => row.home_team_id != null && row.away_team_id != null ? [{
				round: POOL_ROUND,
				slot: index,
				poolIndex: row.pool_index ?? 0,
				homeTeamId: row.home_team_id,
				awayTeamId: row.away_team_id,
				homeSeed: row.home_seed,
				awaySeed: row.away_seed
			}] : []);
		} else {
			poolGames = buildPools(slots, weekend.rules.poolGamesPerTeam).flatMap((pool: any) => pool.games);
		}
		const approvedIds = new Set<number>(teamIds);
		poolGames = poolGames.filter((game) => approvedIds.has(game.homeTeamId) && approvedIds.has(game.awayTeamId));
	}

	const results: PoolGameResult[] = poolGames.map((game) => {
		const priorRow = prior.find((row: any) => row.round === "pool" && row.home_team_id === game.homeTeamId && row.away_team_id === game.awayTeamId);
		return {
			homeTeamId: game.homeTeamId,
			awayTeamId: game.awayTeamId,
			homeScore: priorRow?.home_score == null ? null : Number(priorRow.home_score),
			awayScore: priorRow?.away_score == null ? null : Number(priorRow.away_score),
			forfeit: priorRow?.forfeit === "home" || priorRow?.forfeit === "away" ? priorRow.forfeit : null,
		};
	});
	const locked = guaranteedPlaces(teamIds, results, weekend.rules.tiebreakers, weekend.rules.poolTies);
	const standings = poolStandings(teamIds, results, weekend.rules.tiebreakers);
	const fillByPlace = new Map<number, number>();
	for (const [teamId, place] of locked) fillByPlace.set(place, teamId);

	const approved = new Set<number>(teamIds);
	function teamForSeed(seed: number): number | null {
		const frozen = frozenMap.get(seed);
		if (frozen != null && approved.has(frozen)) return frozen;
		const filled = fillByPlace.get(seed);
		if (filled != null && approved.has(filled)) return filled;
		return null;
	}

	const keepKnockout = hasBracketShell(prior.map((row: any) => ({ round: row.round }))) || Boolean(opts.buildBracket) || poolGames.length > 0 || plannedTotal >= 2;
	const cuts = plannedCuts;
	const ranked = standings.map((row) => row.teamId);
	const built: (BuiltGame & { divisionIndex: number })[] = [];
	const seedRows: { seed: number; teamId: number | null; frozen: boolean; divisionIndex: number }[] = [];
	if (keepKnockout) {
		let remaining = ranked.length > 0 ? ranked.slice() : teamIds.slice();
		for (let di = 0; di < cuts.length; di += 1) {
			const cut = cuts[di]!;
			const signedUp = Math.min(cut.size, remaining.length);
			const count = fit
				? cuts.length > 1
					? signedUp
					: sundayTeamCount(teamIds.length, weekend.poolPlay, weekend.rules.advance, weekend.rules.advancePerPool)
				: cut.size;
			if (count < 2) continue;
			const offset = divisionSlotOffset(di);
			remaining.splice(0, count);
			const divSlots = bracketField(count, (seed) => {
				const placed = teamForSeed(seed + (di === 0 ? 0 : offset));
				return placed != null && approved.has(placed) ? placed : null;
			});

			const games = buildGames(divSlots, { firstVsLast: weekend.rules.packSeed1vsLast });
			for (const game of games) {
				built.push({
					...game,
					slot: game.slot + offset,
					homeFromSlot: game.homeFromSlot != null ? game.homeFromSlot + offset : null,
					awayFromSlot: game.awayFromSlot != null ? game.awayFromSlot + offset : null,
					divisionIndex: di,
				});
			}
			for (const slot of divSlots) {
				const globalSeed = slot.seed + offset;
				seedRows.push({
					seed: globalSeed,
					teamId: slot.teamId,
					frozen: frozenMap.has(globalSeed) || (slot.teamId != null && locked.get(slot.teamId) != null),
					divisionIndex: di,
				});
			}
		}
	}

	await sql`delete from bracket_seeds where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
	const seedsToWrite = seedRows.length > 0 ? seedRows : slots.map((slot) => ({
		seed: slot.seed,
		teamId: slot.teamId,
		frozen: frozenMap.has(slot.seed),
		divisionIndex: 0,
	}));
	for (const slot of seedsToWrite) await sql`
      insert into bracket_seeds (weekend_id, age_group, seed, team_id, frozen, division_index)
      values (${weekend.id}, ${ageGroup}, ${slot.seed}, ${slot.teamId}, ${slot.frozen}, ${slot.divisionIndex})
    `;

	const packed = packSchedule({
		games: built,
		poolGames,
		locations,
		startDate: weekend.startDate,
		endDate: weekend.endDate,
		confirmed,
		dayPlan: weekend.dayPlan,
		rules: weekend.rules,
		teamCount: teamIds.length,
	});
	await sql`delete from games where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
	for (const game of built) {
		const place = packed.find((row: any) => row.round === game.round && row.slot === game.slot);
		const priorRow = prior.find((row: any) => row.round === game.round && row.slot === game.slot);
		const locationId = place?.locationId ?? null;
		const fieldConfirmed = Boolean(priorRow?.field_confirmed && priorRow.location_id != null && priorRow.location_id === locationId);
		const homeTeamId = game.homeTeamId;
		const awayTeamId = game.awayTeamId;
		await sql`
      insert into games (
        weekend_id, age_group, round, slot,
        home_seed, away_seed, home_team_id, away_team_id,
        home_from_round, home_from_slot, away_from_round, away_from_slot,
        is_bye, location_id, field_confirmed, start_date, start_time, pool_index,
        home_score, away_score, forfeit, rainout, score_locked, no_contest, division_index
      )
      values (
        ${weekend.id}, ${ageGroup}, ${game.round}, ${game.slot},
        ${game.homeSeed}, ${game.awaySeed}, ${homeTeamId}, ${awayTeamId},
        ${game.homeFromRound}, ${game.homeFromSlot}, ${game.awayFromRound}, ${game.awayFromSlot},
        ${game.isBye}, ${locationId}, ${fieldConfirmed}, ${place?.startDate ?? null}, ${place?.startTime ?? null},
        ${null}, ${priorRow?.home_score ?? null}, ${priorRow?.away_score ?? null},
        ${priorRow?.forfeit ?? null}, ${Boolean(priorRow?.rainout)}, ${Boolean(priorRow?.score_locked)}, ${Boolean(priorRow?.no_contest)}, ${game.divisionIndex}
      )
    `;
	}
	for (const game of poolGames) {
		const place = packed.find((row: any) => row.round === game.round && row.slot === game.slot);
		const priorRow = prior.find((row: any) => row.round === "pool" && row.home_team_id === game.homeTeamId && row.away_team_id === game.awayTeamId);
		const locationId = place?.locationId ?? null;
		const fieldConfirmed = Boolean(priorRow?.field_confirmed && priorRow.location_id != null && priorRow.location_id === locationId);
		await sql`
      insert into games (
        weekend_id, age_group, round, slot,
        home_seed, away_seed, home_team_id, away_team_id,
        home_from_round, home_from_slot, away_from_round, away_from_slot,
        is_bye, location_id, field_confirmed, start_date, start_time, pool_index,
        home_score, away_score, forfeit, rainout, score_locked, no_contest, division_index
      )
      values (
        ${weekend.id}, ${ageGroup}, ${game.round}, ${game.slot},
        ${game.homeSeed}, ${game.awaySeed}, ${game.homeTeamId}, ${game.awayTeamId},
        ${null}, ${null}, ${null}, ${null},
        ${false}, ${locationId}, ${fieldConfirmed}, ${place?.startDate ?? null}, ${place?.startTime ?? null},
        ${game.poolIndex}, ${priorRow?.home_score ?? null}, ${priorRow?.away_score ?? null},
        ${priorRow?.forfeit ?? null}, ${Boolean(priorRow?.rainout)}, ${Boolean(priorRow?.score_locked)}, ${Boolean(priorRow?.no_contest)}, ${0}
      )
    `;
	}
	await applyWinnerAdvance(weekend.id, ageGroup);
}

function assertSheetOpen(weekend: Weekend): void {
	if (weekend.sheetLocked) {
		throw new Error(`This tournament is locked because ${weekend.lockReason ?? "the sheet is locked."} Adding or removing a team changes the bracket.`);
	}
}

async function pullTournamentsBackIntoEvents(): Promise<void> {
	const sql: any = await getSql();
	const rows = await sql`
    select distinct on (t.id)
      t.id,
      t.start_date::text as start_date,
      e.end_date::text as event_end
    from weekends t
    join weekends e
      on e.lifecycle = ${"announced"}
     and e.start_date = t.start_date
     and t.name like e.name || '%'
    where t.lifecycle <> ${"announced"}
      and t.end_date > e.end_date
    order by t.id, length(e.name) desc
  `;
	for (const row of rows) {
		const start = String(row.start_date).slice(0, 10);
		const end = String(row.event_end).slice(0, 10);
		await sql`
      update weekends
      set end_date = ${end}, day_plan = ${JSON.stringify(defaultDayPlan(start, end))}
      where id = ${row.id}
    `;
	}
}

async function seatRealParks(sql: any, weekendId: number) {
	const locations = await sql`
    select id, name, sort_order, is_primary
    from weekend_locations
    where weekend_id = ${weekendId}
    order by is_primary desc, sort_order asc, id asc
  `;
	const real = locations.filter((loc: { name?: string }) => !/^Field \d+ TBD$/i.test(String(loc.name ?? "")));
	const placeholders = locations
		.filter((loc: { name?: string }) => /^Field \d+ TBD$/i.test(String(loc.name ?? "")))
		.sort((a: { name?: string }, b: { name?: string }) => {
			const na = Number(String(a.name).match(/\d+/)?.[0] ?? 0);
			const nb = Number(String(b.name).match(/\d+/)?.[0] ?? 0);
			return na - nb;
		});
	const count = Math.min(real.length, placeholders.length);
	for (let index = 0; index < count; index += 1) {
		const nextId = Number(real[index].id);
		const oldId = Number(placeholders[index].id);
		await sql`
      update games
      set location_id = ${nextId}, field_confirmed = true
      where location_id = ${oldId}
    `;
		await sql`
      update weekend_staff ws
      set location_id = ${nextId}
      where ws.location_id = ${oldId}
        and not exists (
          select 1 from weekend_staff other
          where other.weekend_id = ws.weekend_id
            and other.location_id = ${nextId}
            and other.role = ws.role
        )
    `;
		await sql`delete from weekend_staff where location_id = ${oldId}`;
		try {
			await sql`update weekend_scorekeepers set location_id = ${nextId} where location_id = ${oldId}`;
		} catch {
			/* scorekeeper rows are optional */
		}
	}
	if (count > 0) {
		await sql`
      delete from weekend_locations
      where weekend_id = ${weekendId}
        and name ~ ${"^Field [0-9]+ TBD$"}
        and not exists (select 1 from games g where g.location_id = weekend_locations.id)
    `;
	}
}

async function syncWeekendBracket(weekendId: number): Promise<void> {
	await pullTournamentsBackIntoEvents();
	const weekend = mapWeekend(await loadWeekendOrThrow(weekendId));
	const sql: any = await getSql();
	await seatRealParks(sql, weekendId);
	const teams = await sql`
    select id, age_group from teams
    where weekend_id = ${weekendId} and status = ${"approved"}
    order by id asc
  `;
	const sole = weekend.ageGroups.length === 1 ? weekend.ageGroups[0] : null;
	if (sole) {
		const onDivision = (await sql`
      select count(*)::int as n from bracket_seeds where weekend_id = ${weekendId} and age_group = ${sole}
    `)[0];
		if ((onDivision?.n ?? 0) > 0) {
			await sql`delete from games where weekend_id = ${weekendId} and age_group <> ${sole}`;
			await sql`delete from bracket_seeds where weekend_id = ${weekendId} and age_group <> ${sole}`;
		} else {
			await sql`update games set age_group = ${sole} where weekend_id = ${weekendId} and age_group <> ${sole}`;
			await sql`update bracket_seeds set age_group = ${sole} where weekend_id = ${weekendId} and age_group <> ${sole}`;
		}
		await sql`delete from weekend_age_groups where weekend_id = ${weekendId} and age_group <> ${sole}`;
	}
	const leftover = await sql`
    select distinct age_group from bracket_seeds where weekend_id = ${weekendId}
  `;
	const ages = new Set<string>(sole ? [sole] : weekend.ageGroups);
	if (!sole) {
		for (const row of teams) {
			const seated = divisionForTeam(String(row.age_group), weekend.ageGroups);
			ages.add(seated ?? String(row.age_group));
		}
		for (const row of leftover) ages.add(row.age_group);
	}
	for (const age of ages) {
		if (!isAgeGroup(age)) continue;
		const teamIds = teams
			.filter((row: any) =>
				sole
					? true
					: (divisionForTeam(String(row.age_group), weekend.ageGroups) ?? String(row.age_group)) === age,
			)
			.map((row: any) => Number(row.id));
		const seeds = await sql`
      select count(*)::int as n from bracket_seeds
      where weekend_id = ${weekendId} and age_group = ${age}
    `;
		if ((seeds[0]?.n ?? 0) > 0) {
			await fillGuaranteedSeeds(weekend, age, teamIds);
			await fillOpenSeeds(weekend, age, teamIds);
			await applyWinnerAdvance(weekendId, age);
		}
		await restoreOpenPoolTeams(weekendId, age);
		await fitEnteredSheet(weekend, age, teamIds);
	}
}
function blankUnearnedBracketNames(games: ScheduleGame[], seeds: { seed: number; frozen: boolean }[], poolPlay: boolean, seedsLocked: boolean) {
	if (!poolPlay || seedsLocked) return;
	const frozen = new Set(seeds.filter((row) => row.frozen).map((row) => row.seed));
	const byKey = new Map(games.map((game) => [`${game.round}:${game.slot}`, game]));
	const earned = (game: ScheduleGame, side: "home" | "away"): boolean => {
		const fromRound = side === "home" ? game.homeFromRound : game.awayFromRound;
		const fromSlot = side === "home" ? game.homeFromSlot : game.awayFromSlot;
		const seed = side === "home" ? game.homeSeed : game.awaySeed;
		if (fromRound == null || fromSlot == null) return seed != null && frozen.has(seed);
		const feeder = byKey.get(`${fromRound}:${fromSlot}`);
		if (!feeder) return false;
		if (feeder.isBye) {
			const byeSeed = feeder.homeSeed ?? feeder.awaySeed;
			return byeSeed != null && frozen.has(byeSeed);
		}
		return (feeder.homeScore != null && feeder.awayScore != null) || feeder.forfeit != null;
	};
	for (const game of games) {
		if (game.round === "pool") continue;
		const played = (game.homeScore != null && game.awayScore != null) || game.forfeit != null;
		if (played) continue;
		if (!earned(game, "home")) game.homeName = null;
		if (!earned(game, "away")) game.awayName = null;
	}
}

function asDateString(value: any) {
	if (value == null) return null;
	if (typeof value === "string") return value.slice(0, 10);
	return isoDateFromLocal(value);
}
function mapScheduleGame(row: any, teamNames: any, locations: any) {
	if (!isAgeGroup(row.age_group) || !isGameRound(row.round)) return null;
	const homeFromRound = row.home_from_round && isRoundId(row.home_from_round) ? row.home_from_round : null;
	const awayFromRound = row.away_from_round && isRoundId(row.away_from_round) ? row.away_from_round : null;
	const startDate = asDateString(row.start_date);
	const location = locations.find((loc: any) => loc.id === row.location_id) ?? null;
	const poolIndex = row.round === "pool" ? row.pool_index ?? 0 : null;
	return {
		id: row.id,
		ageGroup: row.age_group,
		round: row.round,
		roundLabel: poolIndex != null ? poolLabel(poolIndex) : roundLabel(row.round),
		slot: row.slot,
		isBye: row.is_bye,
		homeSeed: row.home_seed,
		awaySeed: row.away_seed,
		homeTeamId: row.home_team_id,
		awayTeamId: row.away_team_id,
		homeName: row.home_team_id != null ? teamNames.get(row.home_team_id) ?? null : null,
		awayName: row.away_team_id != null ? teamNames.get(row.away_team_id) ?? null : null,
		homeFromRound,
		homeFromSlot: row.home_from_slot,
		awayFromRound,
		awayFromSlot: row.away_from_slot,
		locationId: row.location_id,
		locationName: location?.name ?? null,
		fieldConfirmed: row.field_confirmed,
		startDate,
		startTime: row.start_time,
		when: formatKickoff(startDate, row.start_time),
		gameNumber: null,
		poolIndex,
		homeScore: row.home_score == null ? null : Number(row.home_score),
		awayScore: row.away_score == null ? null : Number(row.away_score),
		forfeit: row.forfeit === "home" || row.forfeit === "away" ? row.forfeit : null,
		rainout: Boolean(row.rainout),
		scoreLocked: Boolean(row.score_locked),
		noContest: Boolean(row.no_contest),
		divisionIndex: Number(row.division_index ?? 0),
	};
}

async function loadWeekendSchedule(weekendId: number): Promise<WeekendSchedule> {
	await ensureLiveOpsColumns();
	await syncWeekendBracket(weekendId);

	const weekend = mapWeekend(await loadWeekendOrThrow(weekendId));
	const locations = await loadLocations(weekendId);
	const sql: any = await getSql();
	const teams = await sql`
    select id, name, age_group from teams
    where weekend_id = ${weekendId} and status = ${"approved"}
  `;
	const names = new Map(teams.map((row: any) => [row.id, row.name]));
	const seedRows = await sql`
    select age_group, seed, team_id, frozen, division_index from bracket_seeds
    where weekend_id = ${weekendId}
    order by seed asc
  `;
	const gameRows = await sql`
    select
      id, weekend_id, age_group, round, slot,
      home_seed, away_seed, home_team_id, away_team_id,
      home_from_round, home_from_slot, away_from_round, away_from_slot,
      is_bye, location_id, field_confirmed, start_date, start_time, pool_index, home_score, away_score,
      forfeit, rainout, score_locked, no_contest, division_index
    from games
    where weekend_id = ${weekendId}
    order by
      case round
        when ${"pool"} then 0
        when ${"r64"} then 1
        when ${"r32"} then 2
        when ${"r16"} then 3
        when ${"qf"} then 4
        when ${"sf"} then 5
        when ${"f"} then 6
        else 7
      end,
      slot asc
  `;

	const sole = weekend.ageGroups.length === 1 ? weekend.ageGroups[0] : null;
	const ageSet = new Set<string>(weekend.ageGroups);
	if (!sole) {
		for (const row of teams) {
			const seated = divisionForTeam(String(row.age_group), weekend.ageGroups);
			ageSet.add(seated ?? String(row.age_group));
		}
		for (const row of seedRows) ageSet.add(row.age_group);
	}
	const ages: ScheduleAge[] = [];
	for (const age of AGE_GROUPS) {
		if (!ageSet.has(age)) continue;
		const seeds = seedRows.filter((row: any) => row.age_group === age).map((row: any) => ({
			seed: row.seed,
			teamId: row.team_id,
			teamName: row.team_id != null ? names.get(row.team_id) ?? null : null,
			frozen: Boolean(row.frozen),
			divisionIndex: Number(row.division_index ?? 0),
		}));
		const games = gameRows.filter((row: any) => row.age_group === age).map((row: any) => mapScheduleGame(row, names, locations)).filter((row: any) => row != null);
		const numbers = numberPlayableGames(games);
		for (const game of games) game.gameNumber = numbers.get(`${game.round}:${game.slot}`) ?? null;
		if (weekend.poolPlay && !weekend.sundaySeedsLocked) {
			for (const seed of seeds) {
				if (!seed.frozen) seed.teamName = null;
			}
			blankUnearnedBracketNames(games, seeds, true, false);
		}
		const teamIdsForAge = teams
			.filter((row: any) =>
				sole
					? true
					: (divisionForTeam(String(row.age_group), weekend.ageGroups) ?? String(row.age_group)) === age,
			)
			.map((row: any) => row.id);
		ages.push({
			ageGroup: age,
			teamCount: teamIdsForAge.length,
			seeds,
			games,
			poolPlay: weekend.poolPlay,
			sundaySeedsLocked: weekend.sundaySeedsLocked,
			minTeams: teamsNeededForBracket(weekend.rules, null),
			softFill: weekend.rules.softFill,
			hasBracket: hasBracketShell(games),
			warnings: collectScheduleWarnings({
				poolGames: games.filter((game: any) => game.round === "pool"),
				teamIds: teamIdsForAge,
				poolGamesPerTeam: weekend.rules.poolGamesPerTeam,
				teamNames: Object.fromEntries(teamIdsForAge.map((id: number) => [id, names.get(id) ?? `Team ${id}`])),
				locationNames: Object.fromEntries(locations.map((loc: { id: number; name: string }) => [loc.id, loc.name])),
			}),
			pools: (() => {
				const grouped = new Map<number, ScheduleGame[]>();
				for (const game of games) {
					if (game.round !== "pool") continue;
					const index = game.poolIndex ?? 0;
					const list = grouped.get(index) ?? [];
					list.push(game);
					grouped.set(index, list);
				}
				return [...grouped.entries()].sort((a: any, b: any) => a[0] - b[0]).map(([index, poolGames]: [number, ScheduleGame[]]) => ({
					index,
					label: poolLabel(index),
					games: poolGames
				}));
			})()
		});
	}
	const keepers = await sql`
    select id, weekend_id, user_id, email, scope, location_id, on_date
    from weekend_scorekeepers
    where weekend_id = ${weekendId}
    order by created_at asc
  `;
	return {
		weekend,
		locations,
		ages,
		scorekeepers: keepers.map((row: any) => ({
			id: row.id,
			weekendId: row.weekend_id,
			userId: row.user_id,
			email: row.email,
			scope: row.scope,
			locationId: row.location_id,
			onDate: row.on_date ? asDateString(row.on_date) : null,
		})),
		awaitingPublish: false,
	};
}

async function loadPublicSchedule(weekendId: number): Promise<WeekendSchedule> {
	const row = await loadWeekendOrThrow(weekendId);
	const weekend = mapWeekend(row);
	if (typeof row.public_sheet === "string" && row.public_sheet.length > 2) {
		try {
			const parsed = JSON.parse(row.public_sheet);
			if (parsed && parsed.weekend && Array.isArray(parsed.ages)) {
				return { ...parsed, awaitingPublish: false, weekend: { ...parsed.weekend, publicDirty: false } };
			}
		} catch {
			/* fall through */
		}
	}
	return { weekend, locations: [], ages: [], scorekeepers: [], awaitingPublish: true };
}

async function isLiveScorer(userId: string, weekendId: number): Promise<boolean> {
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const row = (await sql`select end_date::text as end_date from weekends where id = ${weekendId}`)[0];
	const end = asDateString(row?.end_date);
	if (end && isoDateFromLocal(new Date()) > end) return false;
	const hit = (await sql`
    select id from weekend_scorekeepers
    where weekend_id = ${weekendId} and user_id = ${userId}
    limit 1
  `)[0];
	return Boolean(hit);
}

async function coachHasApprovedTeam(userId: string, weekendId: number): Promise<boolean> {
	const sql: any = await getSql();
	const row = (await sql`
    select id from teams
    where weekend_id = ${weekendId} and coach_user_id = ${userId} and status = ${"approved"}
    limit 1
  `)[0];
	return Boolean(row);
}

export const getWeekendSchedule = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data: any) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(async ({ context, data }): Promise<WeekendSchedule> => {
	const profile = await loadProfile(context.userId);
	if (!profile) throw new Error("Finish setting up your account.");
	if (profile.homeRole === "admin" || await isLiveScorer(context.userId, data.weekendId) || await coachHasApprovedTeam(context.userId, data.weekendId)) {
		return loadWeekendSchedule(data.weekendId);
	}
	if (profile.homeRole === "coach") {
		const weekend = mapWeekend(await loadWeekendOrThrow(data.weekendId));
		if (weekend.sheetLocked) return loadWeekendSchedule(data.weekendId);
	}
	return loadPublicSchedule(data.weekendId);
});

export const getLiveSheet = createServerFn({ method: "GET" }).validator((data: any) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
})).handler(async ({ data }): Promise<{ status: "open"; schedule: WeekendSchedule } | { status: "closed" | "over"; name: string }> => {
	const row = await loadWeekendOrThrow(data.weekendId);
	const weekend = mapWeekend(row);
	const championAt = weekend.championAt ? new Date(weekend.championAt) : null;
	if (!parentLinkOpen({ locked: weekend.sheetLocked, endDate: weekend.endDate, championAt })) {
		const over = weekend.sheetLocked;
		return { status: over ? "over" : "closed", name: weekend.name };
	}
	const schedule = await loadWeekendSchedule(data.weekendId);
	return {
		status: "open",
		schedule: {
			...schedule,
			scorekeepers: [],
			ages: schedule.ages.map((age) => ({ ...age, warnings: [] })),
		},
	};
});
export const listSchedule = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<{ weekend: Weekend; games: ScheduleGame[] }[]> => {
	const profile = await loadProfile(context.userId);
	if (!profile) throw new Error("Finish setting up your account.");
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const weekends = await sql`
      select
        w.id, w.name, w.start_date, w.end_date, w.age_groups, w.max_teams, w.pool_play, w.day_plan, w.sunday_seeds_locked, w.bracket_rules,
        w.lifecycle, w.season, w.season_year,
        (select count(*)::int from weekend_locations l where l.weekend_id = w.id and l.name !~ '^Field [0-9]+ TBD$') as location_count,
        (select count(*)::int from teams t where t.weekend_id = w.id and t.status = ${"approved"}) as approved_count,
        (select count(*)::int from tournament_interest i where i.weekend_id = w.id) as interest_count
      from weekends w
      where w.end_date >= ${isoDateFromLocal(/* @__PURE__ */ new Date())}
      order by w.start_date asc, w.id asc
    `;
	const mine = profile.homeRole === "coach" ? await sql`
            select id from teams where coach_user_id = ${context.userId} and status = ${"approved"}
          ` : [];
	const myIds = new Set(mine.map((row: any) => row.id));
	const list: { weekend: Weekend; games: ScheduleGame[] }[] = [];
	for (const row of weekends) {
		if (row.lifecycle === "announced") {
			list.push({ weekend: mapWeekend({ ...row, has_bracket: false }), games: [] });
			continue;
		}
		const schedule = profile.homeRole === "admin" ? await loadWeekendSchedule(row.id) : await loadPublicSchedule(row.id);
		const games = schedule.ages.flatMap((age: any) => age.games).filter((game: any) => {
			if (game.isBye) return false;
			if (profile.homeRole === "admin") return true;
			if (profile.homeRole === "coach") return game.homeTeamId != null && myIds.has(game.homeTeamId) || game.awayTeamId != null && myIds.has(game.awayTeamId);
			return true;
		});
		if (games.length === 0 && profile.homeRole !== "admin") continue;
		list.push({
			weekend: schedule.weekend,
			games
		});
	}
	return list;
});
export const swapBracketSeeds = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	if (typeof data?.ageGroup !== "string" || !isAgeGroup(data.ageGroup)) throw new Error("Pick an age group.");
	return {
		weekendId: parsePositiveInt(data.weekendId, "Missing tournament."),
		ageGroup: data.ageGroup,
		seedA: parsePositiveInt(data.seedA, "Pick a team."),
		seedB: parsePositiveInt(data.seedB, "Pick a team."),
		confirm: data?.confirm === true,
	};
}).handler(async ({ context, data }): Promise<WeekendSchedule> => {
	await requireAdmin(context.userId);
	const weekend = mapWeekend(await loadWeekendOrThrow(data.weekendId));
	if (weekend.sheetLocked && !data.confirm) {
		throw new Error("The sheet is locked. Moving seeds changes who plays who. Confirm to move them.");
	}
	const sql: any = await getSql();
	const rows = await sql`
      select seed, team_id from bracket_seeds
      where weekend_id = ${data.weekendId} and age_group = ${data.ageGroup}
    `;
	if (rows.length === 0) throw new Error("That bracket isn’t ready yet.");
	const next = swapSeeds(rows.map((row: any) => ({
		seed: row.seed,
		teamId: row.team_id
	})), data.seedA, data.seedB);
	for (const slot of next) {
		await sql`
        update bracket_seeds
        set team_id = ${slot.teamId}
        where weekend_id = ${data.weekendId} and age_group = ${data.ageGroup} and seed = ${slot.seed}
      `;
		await paintSeedOnOpenGames(data.weekendId, data.ageGroup, slot.seed, slot.teamId);
	}
	await markSheetDirty(data.weekendId);
	return loadWeekendSchedule(data.weekendId);
});
export const swapPoolTeams = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	return {
		gameId: parsePositiveInt(data?.gameId, "Pick a pool game."),
		teamAId: parsePositiveInt(data?.teamAId, "Pick the first team."),
		teamBId: parsePositiveInt(data?.teamBId, "Pick the second team."),
		confirm: data?.confirm === true,
		scope: data?.scope === "game" ? "game" as const : "all" as const,
	};
}).handler(async ({ context, data }): Promise<WeekendSchedule> => {
	await requireAdmin(context.userId);
	if (data.teamAId === data.teamBId) throw new Error("Pick two different teams.");
	const sql: any = await getSql();
	const game = (await sql`
      select id, weekend_id, age_group, round, pool_index
      from games where id = ${data.gameId} limit 1
    `)[0];
	if (!game || game.round !== "pool") throw new Error("Only pool games can swap teams.");
	const weekend = mapWeekend(await loadWeekendOrThrow(game.weekend_id));
	if (weekend.sheetLocked && !data.confirm) {
		throw new Error("The sheet is locked. Moving these teams changes who plays who. Confirm to move them.");
	}
	const rows = await sql`
      select id, home_team_id, away_team_id, home_seed, away_seed, pool_index,
             home_score, away_score, forfeit, score_locked
      from games
      where weekend_id = ${game.weekend_id} and age_group = ${game.age_group} and round = ${"pool"}
    `;
	if (data.scope === "game") {
		const current = rows.find((row: any) => row.id === data.gameId);
		if (!current) throw new Error("That game is gone.");
		const sideA = current.home_team_id === data.teamAId ? "home" : current.away_team_id === data.teamAId ? "away" : null;
		if (!sideA) throw new Error("That team is not in this game.");
		const other = rows.find(
			(row: any) => row.id !== data.gameId && (row.home_team_id === data.teamBId || row.away_team_id === data.teamBId),
		);
		if (!other) throw new Error("That team has no other pool game.");
		for (const row of [current, other]) {
			if (row.score_locked || row.home_score != null || row.away_score != null || row.forfeit) {
				throw new Error("Can't swap a team that already has a score.");
			}
		}
		const sideB = other.home_team_id === data.teamBId ? "home" : "away";
		const currentHome = sideA === "home" ? data.teamBId : current.home_team_id;
		const currentAway = sideA === "away" ? data.teamBId : current.away_team_id;
		const otherHome = sideB === "home" ? data.teamAId : other.home_team_id;
		const otherAway = sideB === "away" ? data.teamAId : other.away_team_id;
		if (currentHome === currentAway || otherHome === otherAway) throw new Error("A team cannot play itself.");
		await sql`update games set home_team_id = ${currentHome}, away_team_id = ${currentAway} where id = ${current.id}`;
		await sql`update games set home_team_id = ${otherHome}, away_team_id = ${otherAway} where id = ${other.id}`;
		return loadWeekendSchedule(game.weekend_id);
	}
	for (const row of rows) {
		const involved = row.home_team_id === data.teamAId || row.away_team_id === data.teamAId || row.home_team_id === data.teamBId || row.away_team_id === data.teamBId;
		if (!involved) continue;
		if (row.score_locked || row.home_score != null || row.away_score != null || row.forfeit) {
			throw new Error("Can't swap a team that already has a score.");
		}
	}
	for (const row of rows) {
		let home = row.home_team_id;
		let away = row.away_team_id;
		if (home === data.teamAId) home = data.teamBId;
		else if (home === data.teamBId) home = data.teamAId;
		if (away === data.teamAId) away = data.teamBId;
		else if (away === data.teamBId) away = data.teamAId;
		if (home === row.home_team_id && away === row.away_team_id) continue;
		if (home != null && home === away) throw new Error("A team cannot play itself.");
		await sql`update games set home_team_id = ${home}, away_team_id = ${away} where id = ${row.id}`;
	}
	return loadWeekendSchedule(game.weekend_id);
});

export const setGameField = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	gameId: parsePositiveInt(data?.gameId, "Missing game."),
	locationId: data?.locationId == null ? null : parsePositiveInt(data.locationId, "Pick a field.")
})).handler(async ({ context, data }): Promise<WeekendSchedule> => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	const game = (await sql`
      select id, weekend_id from games where id = ${data.gameId} limit 1
    `)[0];
	if (!game) throw new Error("That game is gone.");
	if (data.locationId != null) {
		if (!(await sql`
        select id from weekend_locations
        where id = ${data.locationId} and weekend_id = ${game.weekend_id}
        limit 1
      `)[0]) throw new Error("That park isn’t on this tournament.");
	}
	await sql`
      update games
      set location_id = ${data.locationId}, field_confirmed = ${data.locationId != null}
      where id = ${data.gameId}
    `;
	return loadWeekendSchedule(game.weekend_id);
});

export const updateGameDetails = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const startDate = typeof data?.startDate === "string" ? data.startDate : "";
	const startTime = typeof data?.startTime === "string" ? data.startTime.slice(0, 5) : "";
	if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error("Pick a day on this tournament.");
	if (!/^\d{2}:\d{2}$/.test(startTime)) throw new Error("Pick a start time.");
	const [hour, minute] = startTime.split(":").map(Number);
	if (hour > 23 || minute > 59) throw new Error("Pick a start time.");
	return {
		gameId: parsePositiveInt(data?.gameId, "Missing game."),
		startDate,
		startTime,
		locationId: data?.locationId == null || data?.locationId === "" ? null : parsePositiveInt(data.locationId, "Pick a field."),
	};
}).handler(async ({ context, data }): Promise<WeekendSchedule> => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	const game = (await sql`
      select id, weekend_id from games where id = ${data.gameId} limit 1
    `)[0];
	if (!game) throw new Error("That game is gone.");
	const weekend = mapWeekend(await loadWeekendOrThrow(game.weekend_id));
	if (data.startDate < weekend.startDate || data.startDate > weekend.endDate) {
		throw new Error("That day isn’t on this tournament.");
	}
	if (data.locationId != null) {
		if (!(await sql`
        select id from weekend_locations
        where id = ${data.locationId} and weekend_id = ${game.weekend_id}
        limit 1
      `)[0]) throw new Error("That park isn’t on this tournament.");
		const clash = (await sql`
        select id from games
        where weekend_id = ${game.weekend_id}
          and id <> ${data.gameId}
          and is_bye = false
          and location_id = ${data.locationId}
          and start_date = ${data.startDate}
          and (start_time = ${data.startTime} or start_time = ${`${data.startTime}:00`})
        limit 1
      `)[0];
		if (clash) throw new Error("Another game is already on that field at that time.");
	}
	await sql`
      update games
      set start_date = ${data.startDate},
          start_time = ${data.startTime},
          location_id = ${data.locationId},
          field_confirmed = ${data.locationId != null}
      where id = ${data.gameId}
    `;
	return loadWeekendSchedule(game.weekend_id);
});

export const addFieldToGame = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const gameId = parsePositiveInt(data?.gameId, "Missing game.");
	const parsed = parseLocationInput({
		weekendId: 1,
		name: data?.name,
		address: data?.address
	});
	return {
		gameId,
		name: parsed.name,
		address: parsed.address
	};
}).handler(async ({ context, data }): Promise<WeekendSchedule> => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	const game = (await sql`
      select id, weekend_id from games where id = ${data.gameId} limit 1
    `)[0];
	if (!game) throw new Error("That game is gone.");
	const orderRows = await sql`
      select coalesce(max(sort_order), -1) + 1 as next
      from weekend_locations
      where weekend_id = ${game.weekend_id}
    `;
	const locationId = (await sql`
      insert into weekend_locations (weekend_id, name, address, sort_order)
      values (${game.weekend_id}, ${data.name}, ${data.address}, ${orderRows[0]?.next ?? 0})
      returning id
    `)[0]?.id;
	if (!locationId) throw new Error("Could not add that park.");
	await upsertPark(sql, data.name, data.address, emptyParkFlags(), false);
	await sql`
      update games
      set location_id = ${locationId}, field_confirmed = true
      where id = ${data.gameId}
    `;
	await syncWeekendBracket(game.weekend_id);
	return loadWeekendSchedule(game.weekend_id);
});
export type WeekendAddOptions = {
	ages: AgeGroup[];
	coaches: { userId: string; name: string }[];
	teams: { id: number; name: string; ageGroup: string; coachUserId: string; coachName: string }[];
};

export const listWeekendAddOptions = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data: any) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
})).handler(async ({ context, data }): Promise<WeekendAddOptions> => {
	await requireAdmin(context.userId);
	await ensureSignupColumns();
	const weekend = mapWeekend(await loadWeekendOrThrow(data.weekendId));
	const ages = messageAges(weekend.ageGroups);
	const sql: any = await getSql();
	const onIt = await sql`
    select coach_user_id, lower(btrim(name)) as name, age_group
    from teams
    where weekend_id = ${data.weekendId} and status in (${"pending"}, ${"approved"})
  `;
	const taken = new Set(onIt.map((row: any) => `${row.coach_user_id}|${row.name}|${row.age_group}`));
	const rows = await sql`
    select t.id, t.user_id, t.name, t.age_group, u.name as coach_name
    from coach_signup_teams t
    join profiles p on p.user_id = t.user_id and p.home_role = ${"coach"}
    left join "user" u on u.id = t.user_id
    order by t.name asc
  `;
	const teams = rows
		.filter((row: any) => {
			const age = String(row.age_group);
			if (divisionForTeam(age, weekend.ageGroups) == null) return false;
			const key = `${row.user_id}|${String(row.name).trim().toLowerCase()}|${age}`;
			return !taken.has(key);
		})
		.map((row: any) => ({
			id: Number(row.id),
			name: String(row.name).trim(),
			ageGroup: String(row.age_group),
			coachUserId: String(row.user_id),
			coachName: String(row.coach_name || "Coach").trim() || "Coach",
		}))
		.sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
	const people = await sql`
    select p.user_id, u.name as coach_name, p.email
    from profiles p
    left join "user" u on u.id = p.user_id
    where p.home_role = ${"coach"}
    order by u.name asc
  `;
	const coaches = people
		.map((row: any) => {
			const raw = String(row.coach_name || "").trim();
			const generic = ["coach", "admin", "parent", "athlete"].includes(raw.toLowerCase());
			return { userId: String(row.user_id), name: raw && !generic ? raw : String(row.email || "Coach") };
		})
		.sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
	return { ages, coaches, teams };
});

export const addWeekendTeam = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const weekendId = parsePositiveInt(data?.weekendId, "Missing tournament.");
	const confirm = Boolean(data?.confirm);
	const teamId = data?.teamId == null || data?.teamId === "" ? null : parsePositiveInt(data.teamId, "Pick a team.");
	if (teamId != null) return { weekendId, teamId, coachUserId: null as string | null, name: null as string | null, ageGroup: null as AgeGroup | null, confirm };
	const coachUserId = String(data?.coachUserId ?? "").trim();
	const name = String(data?.name ?? "").trim();
	const ageGroup = String(data?.ageGroup ?? "");
	if (!coachUserId) throw new Error("Pick a coach.");
	if (name.length < 2) throw new Error("Give the team a name.");
	if (name.length > 60) throw new Error("Keep the team name under 60 characters.");
	if (!isAgeGroup(ageGroup)) throw new Error("Pick an age.");
	return { weekendId, teamId, coachUserId, name, ageGroup, confirm };
}).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	await ensureSignupColumns();
	const weekend = mapWeekend(await loadWeekendOrThrow(data.weekendId));
	if (weekend.sheetLocked && !data.confirm) {
		throw new Error(`This tournament is locked because ${weekend.lockReason ?? "the sheet is locked."} Adding a team changes the bracket.`);
	}
	if (!weekend.sheetLocked) await assertTeamEntryOpen(data.weekendId, weekend.startDate);
	const sql: any = await getSql();
	let coachUserId = data.coachUserId;
	let name = data.name;
	let ageGroup = data.ageGroup;
	let signupId = data.teamId;
	if (signupId != null) {
		const club = (await sql`
      select id, user_id, name, age_group from coach_signup_teams where id = ${signupId} limit 1
    `)[0];
		if (!club) throw new Error("That team is gone.");
		if (!isAgeGroup(String(club.age_group))) throw new Error("That team has no age.");
		coachUserId = String(club.user_id);
		name = String(club.name).trim();
		ageGroup = String(club.age_group) as AgeGroup;
	}
	if (!coachUserId || !name || !ageGroup) throw new Error("Pick a team.");
	if (divisionForTeam(ageGroup, weekend.ageGroups) == null) {
		throw new Error(`A ${ageGroup} team can’t play this tournament. They can play their own age, or one year up.`);
	}
	const coach = (await sql`select user_id from profiles where user_id = ${coachUserId} and home_role = ${"coach"} limit 1`)[0];
	if (!coach) throw new Error("That coach is no longer on the list.");
	if (signupId == null) {
		const existing = (await sql`
      select id from coach_signup_teams
      where user_id = ${coachUserId} and age_group = ${ageGroup} and lower(btrim(name)) = lower(${name})
      limit 1
    `)[0];
		if (existing) signupId = Number(existing.id);
		else {
			const created = (await sql`
        insert into coach_signup_teams (user_id, name, age_group)
        values (${coachUserId}, ${name}, ${ageGroup})
        returning id
      `)[0];
			signupId = Number(created?.id);
		}
	}
	const duplicate = (await sql`
    select id from teams
    where weekend_id = ${data.weekendId}
      and status in (${"pending"}, ${"approved"})
      and coach_user_id = ${coachUserId}
      and age_group = ${ageGroup}
      and lower(btrim(name)) = lower(${name})
    limit 1
  `)[0];
	if (duplicate) throw new Error("That team is already on this tournament.");
	const approved = (await sql`
    select count(*)::int as n from teams where weekend_id = ${data.weekendId} and status = ${"approved"}
  `)[0];
	if ((approved?.n ?? 0) >= weekend.maxTeams) throw new Error(`This tournament is full (${weekend.maxTeams} teams).`);
	await sql`
    insert into teams (weekend_id, age_group, name, coach_user_id, status, is_demo)
    values (${data.weekendId}, ${ageGroup}, ${name}, ${coachUserId}, ${"approved"}, ${false})
  `;
	const division = divisionForTeam(ageGroup, weekend.ageGroups) ?? ageGroup;
	await sql`
    insert into event_age_responses (weekend_id, coach_user_id, age_group, choice)
    values (${data.weekendId}, ${coachUserId}, ${division}, ${"interested"})
    on conflict (weekend_id, coach_user_id, age_group) do update set choice = ${"interested"}
  `;
	await sql`
    insert into tournament_responses (weekend_id, coach_user_id, choice)
    values (${data.weekendId}, ${coachUserId}, ${"interested"})
    on conflict (weekend_id, coach_user_id) do update set choice = ${"interested"}
  `;
	await insertNotification(coachUserId, "You're in", `${name} is in ${weekend.name}.`, "teams", `in-${data.weekendId}-add-${signupId}`);
	await sql`
    update team_entry_requests
    set status = ${"added"}
    where weekend_id = ${data.weekendId}
      and coach_user_id = ${coachUserId}
      and age_group = ${ageGroup}
      and lower(btrim(team_name)) = lower(${name})
      and status = ${"pending"}
  `;
	await syncWeekendBracket(data.weekendId);
	return loadWeekendDetail(data.weekendId);
});

export const removeWeekendTeam = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({ id: parsePositiveInt(data?.id, "Missing team.") })).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	const team = (await sql`
      select id, weekend_id from teams where id = ${data.id} limit 1
    `)[0];
	if (!team) throw new Error("That team is already gone.");
	const weekend = mapWeekend(await loadWeekendOrThrow(team.weekend_id));
	if (weekend.sheetLocked) {
		throw new Error(`This tournament is locked because ${weekend.lockReason ?? "the sheet is locked."} Removing a team changes the bracket. Forfeit the rest of their games instead.`);
	}
	await sql`delete from roster_players where team_id = ${team.id}`;
	await sql`delete from teams where id = ${team.id}`;
	await syncWeekendBracket(team.weekend_id);
	return loadWeekendDetail(team.weekend_id);
});

export const declineEntryRequest = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	id: parsePositiveInt(data?.id, "Missing request."),
})).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql: any = await getSql();
	const row = (await sql`
    select id, weekend_id, coach_user_id, team_name, age_group
    from team_entry_requests
    where id = ${data.id} and status = ${"pending"}
    limit 1
  `)[0];
	if (!row) throw new Error("That request is already gone.");
	await sql`update team_entry_requests set status = ${"declined"} where id = ${row.id}`;
	const weekend = mapWeekend(await loadWeekendOrThrow(row.weekend_id));
	await insertNotification(
		row.coach_user_id,
		"Not added",
		`${row.team_name} was not added to ${weekend.name}. It is locked because ${weekend.lockReason ?? "the sheet is locked."}`,
		"teams",
		`entry-no-${row.id}`,
	);
	return loadWeekendDetail(row.weekend_id);
});

export const clearDemoTeams = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
	assertSheetOpen(mapWeekend(await loadWeekendOrThrow(data.weekendId)));
	const sql: any = await getSql();
	const demos = await sql`
      select id from teams where weekend_id = ${data.weekendId} and is_demo = true
    `;
	for (const row of demos) await sql`delete from roster_players where team_id = ${row.id}`;
	await sql`delete from teams where weekend_id = ${data.weekendId} and is_demo = true`;
	await syncWeekendBracket(data.weekendId);
	return loadWeekendDetail(data.weekendId);
});
export const setSundaySeedsLocked = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
	locked: Boolean(data?.locked),
})).handler(async ({ context, data }): Promise<WeekendSchedule> => {
	await requireAdmin(context.userId);
	await loadWeekendOrThrow(data.weekendId);
	const sql: any = await getSql();
	await sql`
      update weekends set sunday_seeds_locked = ${data.locked} where id = ${data.weekendId}
    `;
	await syncWeekendBracket(data.weekendId);
	return loadWeekendSchedule(data.weekendId);
});

export const setSheetLock = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const lock = data?.lock === "on" || data?.lock === "off" ? data.lock : null;
	if (!lock) throw new Error("Pick lock or unlock.");
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		lock: lock as "on" | "off",
	};
}).handler(async ({ context, data }): Promise<WeekendSchedule> => {
	await requireAdmin(context.userId);
	await loadWeekendOrThrow(data.weekendId);
	const sql: any = await getSql();
	await ensureLiveOpsColumns();
	await sql`update weekends set sheet_lock = ${data.lock} where id = ${data.weekendId}`;
	return loadWeekendSchedule(data.weekendId);
});

export const pullTeam = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	teamId: parsePositiveInt(data?.teamId, "Pick a team."),
})).handler(async ({ context, data }): Promise<WeekendSchedule> => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	const team = (await sql`
    select id, weekend_id, age_group, status from teams where id = ${data.teamId} limit 1
  `)[0];
	if (!team || team.status !== "approved") throw new Error("That club isn’t on the sheet.");
	if (!isAgeGroup(team.age_group)) throw new Error("That club has a bad age group.");
	const weekend = mapWeekend(await loadWeekendOrThrow(team.weekend_id));
	if (!weekend.sheetLocked) throw new Error("Lock the sheet first. Removing a club before the lock redraws the bracket.");
	const games = await sql`
    select id, home_team_id, away_team_id, home_score, away_score, forfeit, no_contest, is_bye
    from games
    where weekend_id = ${team.weekend_id}
      and (home_team_id = ${team.id} or away_team_id = ${team.id})
  `;
	const patches = forfeitRemaining(games.map((row: any) => ({
		id: row.id,
		isBye: Boolean(row.is_bye),
		homeTeamId: row.home_team_id,
		awayTeamId: row.away_team_id,
		homeScore: row.home_score == null ? null : Number(row.home_score),
		awayScore: row.away_score == null ? null : Number(row.away_score),
		forfeit: row.forfeit === "home" || row.forfeit === "away" ? row.forfeit : null,
		noContest: Boolean(row.no_contest),
	})), team.id);
	if (patches.length === 0) throw new Error("That club has no remaining games to forfeit.");
	for (const patch of patches) {
		if (patch.kind === "no-contest") {
			await sql`
        update games
        set no_contest = ${true}, forfeit = ${null}, home_score = ${null}, away_score = ${null}
        where id = ${patch.id}
      `;
		} else {
			await sql`
        update games
        set forfeit = ${patch.side}, home_score = ${0}, away_score = ${0}, no_contest = ${false}
        where id = ${patch.id}
      `;
		}
	}
	await applyWinnerAdvance(team.weekend_id, team.age_group);
	return loadWeekendSchedule(team.weekend_id);
});

export const replaceTeamSlot = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const name = typeof data?.name === "string" ? data.name.trim() : "";
	if (name.length < 2) throw new Error("Give the new club a name.");
	if (name.length > 60) throw new Error("Keep the team name under 60 characters.");
	return {
		teamId: parsePositiveInt(data?.teamId, "Pick the club that dropped."),
		name,
	};
}).handler(async ({ context, data }): Promise<WeekendSchedule> => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	const team = (await sql`
    select id, weekend_id, age_group, name, status from teams where id = ${data.teamId} limit 1
  `)[0];
	if (!team || team.status !== "approved") throw new Error("That club isn’t on the sheet.");
	if (!isAgeGroup(team.age_group)) throw new Error("That club has a bad age group.");
	const weekend = mapWeekend(await loadWeekendOrThrow(team.weekend_id));
	if (!weekend.sheetLocked) throw new Error("Lock the sheet first so the fill-in stays in the same games.");
	if (!weekend.beforeFirstPitch) throw new Error("First pitch has already been thrown. Forfeit the remaining games.");
	const played = (await sql`
    select id from games
    where weekend_id = ${team.weekend_id}
      and is_bye = ${false}
      and (home_team_id = ${team.id} or away_team_id = ${team.id})
      and (
        no_contest = ${true}
        or forfeit is not null
        or (home_score is not null and away_score is not null and forfeit is null)
      )
    limit 1
  `)[0];
	if (played) throw new Error("That club already has a result. Forfeit the rest instead of replacing them.");
	const taken = (await sql`
    select id from teams
    where weekend_id = ${team.weekend_id}
      and age_group = ${team.age_group}
      and status in (${"pending"}, ${"approved"})
      and lower(btrim(name)) = ${data.name.toLowerCase()}
    limit 1
  `)[0];
	if (taken) throw new Error("That club is already on this tournament.");
	const created = (await sql`
    insert into teams (weekend_id, age_group, name, coach_user_id, status, is_demo)
    values (${team.weekend_id}, ${team.age_group}, ${data.name}, ${context.userId}, ${"approved"}, ${false})
    returning id
  `)[0];
	if (!created?.id) throw new Error("Could not add that club.");
	await sql`update games set home_team_id = ${created.id} where home_team_id = ${team.id}`;
	await sql`update games set away_team_id = ${created.id} where away_team_id = ${team.id}`;
	await sql`
    update bracket_seeds
    set team_id = ${created.id}, frozen = ${true}
    where weekend_id = ${team.weekend_id} and team_id = ${team.id}
  `;
	await sql`update teams set status = ${"denied"} where id = ${team.id}`;
	return loadWeekendSchedule(team.weekend_id);
});

async function approvedTeamIds(weekendId: number, ageGroup: AgeGroup): Promise<number[]> {
	const sql: any = await getSql();
	const weekend = (await sql`select age_groups from weekends where id = ${weekendId} limit 1`)[0];
	const ages = parseStoredAgeGroups(weekend?.age_groups);
	const sole = ages.length === 1 && ages[0] === ageGroup;
	const rows = await sql`
    select id, age_group from teams
    where weekend_id = ${weekendId} and status = ${"approved"}
    order by id asc
  `;
	return rows
		.filter((row: any) => {
			const age = String(row.age_group);
			if (!isAgeGroup(age)) return false;
			if (sole) return true;
			if (age === ageGroup) return true;
			return divisionForTeam(age, ages) === ageGroup;
		})
		.map((row: any) => Number(row.id));
}

async function clearScoresAfterUnplayed(weekendId: number, ageGroup: AgeGroup): Promise<void> {
	const sql: any = await getSql();
	for (let pass = 0; pass < 6; pass += 1) {
		const rows = await sql`
      select id, round, slot, home_from_round, home_from_slot, away_from_round, away_from_slot,
             home_team_id, away_team_id, home_score, away_score, is_bye, forfeit, no_contest
      from games
      where weekend_id = ${weekendId} and age_group = ${ageGroup}
    `;
		const byKey = new Map<string, any>(rows.map((row: any) => [`${row.round}:${row.slot}`, row]));
		let cleared = false;
		for (const row of rows) {
			if (row.round === POOL_ROUND || row.is_bye) continue;
			if (row.home_score == null && row.away_score == null && !row.forfeit && !row.no_contest) continue;
			const feeders = [byKey.get(`${row.home_from_round}:${row.home_from_slot}`), byKey.get(`${row.away_from_round}:${row.away_from_slot}`)];
			const waiting = feeders.some((feeder) => {
				if (!feeder || feeder.is_bye || feeder.no_contest) return false;
				return scoredWinner(feeder.home_team_id, feeder.away_team_id, feeder.home_score, feeder.away_score, feeder.forfeit) == null;
			});
			if (!waiting) continue;
			await sql`
        update games
        set home_score = ${null}, away_score = ${null}, forfeit = ${null}, no_contest = ${false}, score_locked = ${false}
        where id = ${row.id}
      `;
			cleared = true;
		}
		if (!cleared) return;
	}
}

export const postGameScore = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const gameId = parsePositiveInt(data?.gameId, "Pick a game.");
	if (data?.clear === true) {
		return { gameId, homeScore: 0, awayScore: 0, forfeit: null as "home" | "away" | null, lock: false, clear: true };
	}
	const forfeit = data?.forfeit === "home" || data?.forfeit === "away" ? data.forfeit : null;
	const homeScore = forfeit ? 0 : Number.parseInt(String(data?.homeScore ?? ""), 10);
	const awayScore = forfeit ? 0 : Number.parseInt(String(data?.awayScore ?? ""), 10);
	if (!forfeit) {
		if (!Number.isInteger(homeScore) || homeScore < 0 || homeScore > 99) throw new Error("Home score looks off.");
		if (!Number.isInteger(awayScore) || awayScore < 0 || awayScore > 99) throw new Error("Away score looks off.");
	}
	return {
		gameId,
		homeScore,
		awayScore,
		forfeit: forfeit as "home" | "away" | null,
		lock: Boolean(data?.lock),
		clear: false,
	};
}).handler(async ({ context, data }): Promise<WeekendSchedule> => {
	const sql: any = await getSql();
	const row = (await sql`
    select id, weekend_id, age_group, round, home_team_id, away_team_id, is_bye, location_id, start_date, score_locked
    from games where id = ${data.gameId}
  `)[0];
	if (!row) throw new Error("That game isn’t on the sheet.");
	if (row.is_bye) throw new Error("Bye games don’t take a score.");
	const profile = await loadProfile(context.userId);
	if (!profile) throw new Error("Finish setting up your account.");
	const isAdmin = profile.homeRole === "admin";
	if (!isAdmin && !(await canScoreGame(context.userId, row))) {
		throw new Error("Only Admin or the assigned scorekeeper can post this score.");
	}
	if (row.score_locked && !isAdmin) throw new Error("Admin locked this score.");
	if (data.clear) {
		await sql`
      update games
      set home_score = ${null}, away_score = ${null}, forfeit = ${null}, no_contest = ${false}, score_locked = ${false}
      where id = ${data.gameId}
    `;
		await sql`
      insert into score_audit (game_id, weekend_id, user_id, home_score, away_score, note)
      values (${data.gameId}, ${row.weekend_id}, ${context.userId}, ${null}, ${null}, ${"cleared"})
    `;
		if (isAgeGroup(row.age_group)) {
			await clearScoresAfterUnplayed(row.weekend_id, row.age_group);
			const weekend = mapWeekend(await loadWeekendOrThrow(row.weekend_id));
			await applyWinnerAdvance(row.weekend_id, row.age_group);
			const teamIds = await approvedTeamIds(row.weekend_id, row.age_group);
			await fillGuaranteedSeeds(weekend, row.age_group, teamIds);
		}
		await markSheetDirty(row.weekend_id);
		return loadWeekendSchedule(row.weekend_id);
	}
	if (row.round !== POOL_ROUND && !data.forfeit && data.homeScore === data.awayScore) {
		throw new Error("Bracket games play until there’s a winner.");
	}
	const weekend = mapWeekend(await loadWeekendOrThrow(row.weekend_id));
	if (row.round === POOL_ROUND && !data.forfeit && data.homeScore === data.awayScore && !weekend.rules.poolTies) {
		throw new Error("Ties are off for pool play on this weekend.");
	}
	await sql`
    update games
    set home_score = ${data.homeScore}, away_score = ${data.awayScore},
        forfeit = ${data.forfeit},
        score_locked = ${isAdmin && data.lock ? true : row.score_locked}
    where id = ${data.gameId}
  `;
	await sql`
    insert into score_audit (game_id, weekend_id, user_id, home_score, away_score, note)
    values (${data.gameId}, ${row.weekend_id}, ${context.userId}, ${data.homeScore}, ${data.awayScore}, ${data.forfeit ? `forfeit:${data.forfeit}` : "score"})
  `;
	if (isAgeGroup(row.age_group)) {
		await applyWinnerAdvance(row.weekend_id, row.age_group);
		const teamIds = await approvedTeamIds(row.weekend_id, row.age_group);
		await fillGuaranteedSeeds(weekend, row.age_group, teamIds);
		if (row.round === POOL_ROUND) await flagSeedConflict(weekend, row.age_group, row.id);
	}
	await markSheetDirty(row.weekend_id);
	return loadWeekendSchedule(row.weekend_id);
});

async function canScoreGame(userId: string, game: { weekend_id: number; location_id: number | null; start_date: unknown }): Promise<boolean> {
	const sql: any = await getSql();
	const rows = await sql`
    select scope, location_id, on_date from weekend_scorekeepers
    where weekend_id = ${game.weekend_id} and user_id = ${userId}
  `;
	const date = asDateString(game.start_date);
	const endRow = (await sql`select end_date::text as end_date from weekends where id = ${game.weekend_id}`)[0];
	const end = asDateString(endRow?.end_date);
	if (end && isoDateFromLocal(new Date()) > end) return false;
	return rows.some((row: any) => {
		if (row.scope === "weekend") return true;
		if (row.scope === "field") return row.location_id === game.location_id;
		if (row.scope === "field-day") return row.location_id === game.location_id && asDateString(row.on_date) === date;
		return false;
	});
}

export const assignScorekeeper = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const scope = data?.scope === "field" || data?.scope === "field-day" ? data.scope : "weekend";
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		userId: typeof data?.userId === "string" ? data.userId : "",
		scope: scope as "weekend" | "field" | "field-day",
		locationId: data?.locationId == null ? null : parsePositiveInt(data.locationId, "Pick a field."),
		onDate: typeof data?.onDate === "string" ? data.onDate : null,
	};
}).handler(async ({ context, data }): Promise<WeekendSchedule> => {
	await requireAdmin(context.userId);
	if (!data.userId) throw new Error("Pick someone to keep score.");
	const sql: any = await getSql();
	const user = await loadAuthUser(data.userId);
	await sql`
    insert into weekend_scorekeepers (weekend_id, user_id, email, scope, location_id, on_date)
    values (${data.weekendId}, ${data.userId}, ${user?.email ?? ""}, ${data.scope}, ${data.locationId}, ${data.onDate})
  `;
	return loadWeekendSchedule(data.weekendId);
});

export const revokeScorekeeper = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	id: parsePositiveInt(data?.id, "Pick a scorekeeper."),
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
})).handler(async ({ context, data }): Promise<WeekendSchedule> => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	await sql`delete from weekend_scorekeepers where id = ${data.id} and weekend_id = ${data.weekendId}`;
	return loadWeekendSchedule(data.weekendId);
});

export const markRainout = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	gameId: parsePositiveInt(data?.gameId, "Pick a game."),
	action: typeof data?.action === "string" ? data.action : "mark",
	date: typeof data?.date === "string" ? data.date : null,
	time: typeof data?.time === "string" ? data.time : null,
	locationId: data?.locationId == null ? null : parsePositiveInt(data.locationId, "Pick a field."),
})).handler(async ({ context, data }): Promise<WeekendSchedule & { rainoutOptions?: RainoutOption[] }> => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	const row = (await sql`
    select id, weekend_id, age_group, location_id, start_date, start_time, home_team_id, away_team_id
    from games where id = ${data.gameId}
  `)[0];
	if (!row) throw new Error("That game isn’t on the sheet.");
	const weekend = mapWeekend(await loadWeekendOrThrow(row.weekend_id));
	if (data.action === "mark") {
		await sql`update games set rainout = ${true} where id = ${data.gameId}`;
		const occupied = (await sql`
      select location_id, start_date, start_time from games
      where weekend_id = ${row.weekend_id} and start_date is not null and start_time is not null and id <> ${data.gameId}
    `).map((g: any) => ({
			locationId: g.location_id,
			date: asDateString(g.start_date) ?? "",
			time: g.start_time,
		}));
		const options = proposeRainoutSlots({
			occupied,
			locationId: row.location_id,
			locations: await loadLocations(row.weekend_id),
			dates: weekend.dayPlan.map((d) => d.date),
			rules: weekend.rules,
		});
		const coaches = await sql`
      select distinct t.coach_user_id as user_id
      from teams t
      where t.id in (${row.home_team_id}, ${row.away_team_id}) and t.coach_user_id is not null
    `;
		for (const coach of coaches) {
			await insertNotification(coach.user_id, "Weather delay", `${weekend.name}: a game was marked rainout. Admin is placing it.`);
		}
		await markSheetDirty(row.weekend_id);
		const schedule = await loadWeekendSchedule(row.weekend_id);
		return { ...schedule, rainoutOptions: options };
	}
	if (data.action === "slot" && data.date && data.time && data.locationId != null) {
		await sql`
      update games
      set start_date = ${data.date}, start_time = ${data.time}, location_id = ${data.locationId}, rainout = ${false}
      where id = ${data.gameId}
    `;
	} else if (data.action === "forfeit") {
		await sql`update games set forfeit = ${"home"}, rainout = ${false} where id = ${data.gameId}`;
	} else if (data.action === "no-contest") {
		await sql`update games set no_contest = ${true}, rainout = ${false} where id = ${data.gameId}`;
	} else if (data.action === "weather-tbd") {
		await sql`update games set start_date = ${null}, start_time = ${null}, rainout = ${true} where id = ${data.gameId}`;
	}
	await markSheetDirty(row.weekend_id);
	return loadWeekendSchedule(row.weekend_id);
});

export const pushPublicSheet = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
})).handler(async ({ context, data }): Promise<WeekendSchedule> => {
	await requireAdmin(context.userId);
	const schedule = await loadWeekendSchedule(data.weekendId);
	const sql: any = await getSql();
	const stamped = { ...schedule, awaitingPublish: false, weekend: { ...schedule.weekend, publicDirty: false, dirtyAfterLock: false } };
	await sql`
    update weekends
    set public_sheet = ${JSON.stringify(stamped)}, public_pushed_at = ${new Date().toISOString()}, public_dirty = ${false}, dirty_after_lock = ${false}
    where id = ${data.weekendId}
  `;
	return loadWeekendSchedule(data.weekendId);
});

export const resolveLockout = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const choice = data?.choice === "smaller" ? "smaller" : data?.choice === "keep" ? "keep" : null;
	if (!choice) throw new Error("Keep this sheet or rebuild it smaller.");
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		choice: choice as "keep" | "smaller",
	};
}).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
	const weekend = mapWeekend(await loadWeekendOrThrow(data.weekendId));
	const sql: any = await getSql();
	if (data.choice === "smaller") {
		if (weekend.approvedCount < 3) throw new Error("Need at least 3 teams before the sheet can shrink.");
		const ages = weekend.ageGroups.filter((age) => isAgeGroup(age));
		for (const age of ages) {
			const teamIds = await approvedTeamIds(data.weekendId, age);
			await persistAgeBracket(weekend, age, teamIds, { buildBracket: true, reset: true, fitToSignedUp: true, rebuildPools: weekend.poolPlay });
		}
		await markSheetDirty(data.weekendId);
	}
	await sql`update weekends set lockout_choice = ${data.choice} where id = ${data.weekendId}`;
	return loadWeekendDetail(data.weekendId);
});

export const resolveSeedConflict = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const action = data?.action === "reseed" ? "reseed" : data?.action === "keep" ? "keep" : null;
	if (!action) throw new Error("Keep the original seeds or reseed.");
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		action: action as "keep" | "reseed",
		confirm: Boolean(data?.confirm),
	};
}).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
	const weekend = mapWeekend(await loadWeekendOrThrow(data.weekendId));
	const sql: any = await getSql();
	if (data.action === "keep") {
		await sql`update games set place_conflict = ${false} where weekend_id = ${data.weekendId}`;
		return loadWeekendDetail(data.weekendId);
	}
	const scored = await sql`
    select id from games
    where weekend_id = ${data.weekendId} and round <> ${"pool"}
      and (home_score is not null or away_score is not null or forfeit is not null)
    limit 1
  `;
	if (scored[0] && !data.confirm) {
		throw new Error("Reseed would move teams on bracket games that already have a result. Confirm to reseed anyway.");
	}
	await sql`update bracket_seeds set frozen = ${false} where weekend_id = ${data.weekendId}`;
	for (const age of weekend.ageGroups) {
		if (!isAgeGroup(age)) continue;
		const teamIds = await approvedTeamIds(data.weekendId, age);
		await fillGuaranteedSeeds(weekend, age, teamIds);
	}
	await sql`update games set place_conflict = ${false} where weekend_id = ${data.weekendId}`;
	await markSheetDirty(data.weekendId);
	return loadWeekendDetail(data.weekendId);
});

const LOGIN_GAP_MS = 10 * 60 * 1000;

let loginVisitsReady: Promise<void> | null = null;
function ensureLoginVisits(): Promise<void> {
	if (!loginVisitsReady) {
		loginVisitsReady = (async () => {
			const sql: any = await getSql();
			await sql.query(`create table if not exists login_visits (
        id bigserial primary key,
        user_id text not null,
        started_at timestamptz not null default now(),
        last_seen_at timestamptz not null default now(),
        ended_at timestamptz
      )`);
		})().catch((error) => {
			loginVisitsReady = null;
			throw error;
		});
	}
	return loginVisitsReady;
}

async function openLoginVisit(userId: string) {
	await ensureLoginVisits();
	const sql: any = await getSql();
	const open = (await sql`
    select id, last_seen_at from login_visits
    where user_id = ${userId} and ended_at is null
    order by id desc
    limit 1
  `)[0];
	if (!open) {
		await sql`insert into login_visits (user_id) values (${userId})`;
		return;
	}
	const last = new Date(open.last_seen_at).getTime();
	if (Number.isFinite(last) && Date.now() - last > LOGIN_GAP_MS) {
		await sql`update login_visits set ended_at = last_seen_at where id = ${open.id}`;
		await sql`insert into login_visits (user_id) values (${userId})`;
		return;
	}
	await sql`update login_visits set last_seen_at = now() where id = ${open.id}`;
}

export const touchMyLogin = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	await openLoginVisit(context.userId);
	return { ok: true as const };
});

export const endMyLogin = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	await ensureLoginVisits();
	const sql: any = await getSql();
	await sql`
    update login_visits
    set ended_at = now(), last_seen_at = now()
    where user_id = ${context.userId} and ended_at is null
  `;
	return { ok: true as const };
});

export type LoginVisit = {
	id: number;
	name: string;
	email: string;
	role: string;
	startedAt: string;
	endedAt: string | null;
	stillIn: boolean;
	minutes: number;
};

export const listLoginHistory = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<LoginVisit[]> => {
	await requireSuperuser(context.userId);
	await ensureLoginVisits();
	const sql: any = await getSql();
	const count = (await sql`select count(*)::int as n from login_visits`)[0];
	if ((count?.n ?? 0) === 0) {
		await sql`
      insert into login_visits (user_id, started_at, last_seen_at, ended_at)
      select s."userId", s."createdAt", s."updatedAt",
        case when s."expiresAt" > now() then null else s."updatedAt" end
      from "session" s
    `;
	}
	const rows = await sql`
    select
      v.id,
      v.started_at,
      v.last_seen_at,
      v.ended_at,
      u.name as person_name,
      u.email as user_email,
      p.email as profile_email,
      p.home_role,
      p.is_superuser
    from login_visits v
    left join "user" u on u.id = v.user_id
    left join profiles p on p.user_id = v.user_id
    where coalesce(p.is_superuser, false) = false
    order by v.started_at desc
    limit 300
  `;
	const now = Date.now();
	return rows.map((row: any) => {
		const started = new Date(row.started_at);
		const last = new Date(row.last_seen_at);
		const ended = row.ended_at ? new Date(row.ended_at) : null;
		const startMs = started.getTime();
		const lastMs = last.getTime();
		const stillIn = !ended && Number.isFinite(lastMs) && now - lastMs < 3 * 60 * 1000;
		const endMs = ended ? ended.getTime() : stillIn ? now : lastMs;
		const minutes = Number.isFinite(startMs) && Number.isFinite(endMs) ? Math.max(0, Math.round((endMs - startMs) / 60000)) : 0;
		const email = String(row.profile_email || row.user_email || "").trim();
		const role = row.is_superuser ? "Superuser" : row.home_role === "admin" ? "Admin" : row.home_role === "coach" ? "Coach" : row.home_role === "athlete" ? "Athlete" : row.home_role === "parent" ? "Parent" : "Account";
		return {
			id: Number(row.id),
			name: personName(row.person_name) || email || "Account",
			email,
			role,
			startedAt: Number.isFinite(startMs) ? started.toISOString() : new Date().toISOString(),
			endedAt: ended && Number.isFinite(ended.getTime()) ? ended.toISOString() : null,
			stillIn,
			minutes,
		};
	});
});
