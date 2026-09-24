import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
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
  normalizeEmail,
  type RequestStatus,
  type Role,
} from "./roles";
import {
  AGE_GROUPS,
  DEFAULT_AGE_MIN_TEAMS,
  DEFAULT_TOURNAMENT_TEAMS,
  isAgeGroup,
  isTeamStatus,
  isoDateFromLocal,
  parseAgeCaps,
  parseLocationInput,
  parseParkFlags,
  emptyParkFlags,
  type ParkFlags,
  parsePlayerInput,
  parsePositiveInt,
  parseStoredAgeGroups,
  parseTeamRegister,
  parseTournamentMax,
  parseWeekendInput,
  parseWeekendUpdate,
  defaultDayPlan,
  hasPoolDays,
  parseDayPlan,
  teamEntryClosed,
  parseSheetLock,
  sheetIsLocked,
  beforeFirstPitch,
  type AgeCapInput,
  type AgeGroup,
  type DayPlan,
  type SheetLock,
  type TeamStatus,
} from "./weekends";
import { DEMO_PARKS, DEMO_TEAM_NAMES } from "./demo-teams";
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
  fieldsNeeded,
  fillerName,
  divisionSlotOffset,
  forfeitRemaining,
  formatKickoff,
  guaranteedPlaces,
  isGameRound,
  isRoundId,
  numberPlayableGames,
  packSchedule,
  poolStandings,
  proposeRainoutSlots,
  POOL_ROUND,
  poolLabel,
  roundLabel,
  sundayTeamCount,
  swapSeeds,
  applyPoolSlotSwap,
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
};

export type NotificationItem = {
  id: number;
  title: string;
  body: string;
  kind: string;
  read: boolean;
  createdAt: string;
};

export type PendingRequest = {
  id: number;
  userId: string;
  email: string;
  requestedRole: "coach" | "admin";
  teamName: string | null;
  reason: string | null;
  createdAt: string;
  attempt: number;
};

export type DirectoryUser = {
  userId: string;
  email: string;
  requestedRole: Role;
  homeRole: Role;
  requestStatus: RequestStatus;
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
  beforeFirstPitch: boolean;
  rules: BracketRules;
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

export type WeekendDetail = Weekend & {
  ages: WeekendAge[];
  locations: WeekendLocation[];
  teams: WeekendTeam[];
  hasBracket: boolean;
  hasPoolGames: boolean;
  teamEntryClosed: string | null;
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
		coachAccessLocked: extra.coachAccessLocked
	};
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
	const startDate = typeof row.start_date === "string" ? row.start_date.slice(0, 10) : isoDateFromLocal(new Date(row.start_date));
	const rules = parseBracketRules(row.bracket_rules, row.max_teams ?? DEFAULT_TOURNAMENT_TEAMS);
	const sheetLock = parseSheetLock(row.sheet_lock);
	return {
		id: row.id,
		name: row.name,
		startDate: row.start_date,
		endDate: row.end_date,
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
		sheetLocked: sheetIsLocked({ lock: sheetLock, startDate, firstPitch: rules.firstPitch }),
		beforeFirstPitch: beforeFirstPitch(startDate, rules.firstPitch),
		rules,

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
	const rows = await ((await getSql()) as any)`
    select user_id, email, requested_role, home_role, request_status
    from profiles
    where user_id = ${userId}
    limit 1
  `;
	if (!rows[0]) return null;
	return mapProfile(rows[0], await countCoachRequests(userId));
}
async function requireAdmin(userId: any) {
	const profile = await loadProfile(userId);
	if (!profile || profile.homeRole !== "admin") throw new Error("Only an Admin can do that.");
	return profile;
}
async function requireCoach(userId: any) {
	const profile = await loadProfile(userId);
	if (!profile || profile.homeRole !== "coach") throw new Error("Only an approved Coach can do that.");
	return profile;
}
async function adminCount() {
	return (await ((await getSql()) as any)`
    select count(*)::int as n from profiles where home_role = 'admin'
  `)[0]?.n ?? 0;
}
async function insertNotification(userId: any, title: any, body: any) {
	await ((await getSql()) as any)`
    insert into notifications (user_id, title, body, kind)
    values (${userId}, ${title}, ${body}, ${"status"})
  `;
}
export const getMyProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<Profile | null> => {
	return loadProfile(context.userId);
});
export const completeOnboarding = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any): { role: Role; teamName: string | null; reason: string | null } => {
	if (!data || !isRole(data.role)) throw new Error("Pick a role to continue.");
	if (data.role === "coach") {
		const access = parseCoachAccess(data);
		return {
			role: data.role,
			teamName: access.teamName,
			reason: access.reason
		};
	}
	return {
		role: data.role,
		teamName: null,
		reason: null
	};
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
	} else if (role === "admin" && noAdminYet) {
		homeRole = "admin";
		requestStatus = "none";
	} else {
		homeRole = "parent";
		requestStatus = "pending";
	}
	const sql: any = await getSql();
	await sql`
      insert into profiles (user_id, email, requested_role, home_role, request_status)
      values (
        ${context.userId},
        ${email || `user-${context.userId}`},
        ${seed ? "admin" : role},
        ${homeRole},
        ${requestStatus}
      )
    `;
	if (requestStatus === "pending" && isElevatedRole(role)) {
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
export const listNotifications = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<NotificationItem[]> => {
	return (await ((await getSql()) as any)`
      select id, title, body, kind, read, created_at
      from notifications
      where user_id = ${context.userId}
      order by created_at desc
      limit 50
    `).map((r: any) => ({
		id: r.id,
		title: r.title,
		body: r.body,
		kind: r.kind,
		read: r.read,
		createdAt: r.created_at
	}));
});
export const markNotificationsRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }): Promise<{ ok: true }> => {
	await ((await getSql()) as any)`
      update notifications set read = true
      where user_id = ${context.userId} and read = false
    `;
	return { ok: true };
});
export const listPendingRequests = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<PendingRequest[]> => {
	await requireAdmin(context.userId);
	return (await ((await getSql()) as any)`
      select
        id,
        user_id,
        email,
        requested_role,
        team_name,
        reason,
        created_at,
        (
          select count(*)::int
          from role_requests r2
          where r2.user_id = role_requests.user_id
            and r2.requested_role = role_requests.requested_role
        ) as attempt
      from role_requests
      where status = 'pending'
      order by created_at asc
    `).map((r: any) => ({
		id: r.id,
		userId: r.user_id,
		email: r.email,
		requestedRole: r.requested_role,
		teamName: r.team_name,
		reason: r.reason,
		createdAt: r.created_at,
		attempt: r.attempt
	}));
});
export const listDirectory = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<DirectoryUser[]> => {
	await requireAdmin(context.userId);
	return (await ((await getSql()) as any)`
      select user_id, email, requested_role, home_role, request_status
      from profiles
      order by created_at desc
    `).map((r: any) => ({
		userId: r.user_id,
		email: r.email,
		requestedRole: r.requested_role,
		homeRole: r.home_role,
		requestStatus: r.request_status
	}));
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
		await insertNotification(req.user_id, `${label} access approved`, `An Admin approved your ${label} access. Open home to use ${label} tools.`);
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
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
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
        (select count(*)::int from weekend_locations l where l.weekend_id = w.id) as location_count,
        (select count(*)::int from teams t where t.weekend_id = w.id and t.status = ${"approved"}) as approved_count,
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
        ) as has_bracket
      from weekends w
      order by w.start_date asc, w.id asc
    `).map(mapWeekend);
});
export const createWeekend = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => parseWeekendInput(data)).handler(async ({ context, data }): Promise<Weekend> => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	const created = (await sql`
      insert into weekends (name, start_date, end_date, age_groups, max_teams, pool_play, day_plan, created_by, bracket_rules)
      values (
        ${data.name},
        ${data.startDate},
        ${data.endDate},
        ${JSON.stringify(data.ageGroups)},
        ${data.maxTeams},
        ${data.poolPlay},
        ${JSON.stringify(data.dayPlan)},
        ${context.userId},
        ${JSON.stringify(data.rules)}
      )
      returning id, name, start_date, end_date, age_groups, max_teams, pool_play, day_plan, bracket_rules
    `)[0];

	if (!created) throw new Error("Could not save that tournament. Try again.");
	for (const ageGroup of data.ageGroups) await sql`
        insert into weekend_age_groups (weekend_id, age_group, min_teams, max_teams)
        values (${created.id}, ${ageGroup}, ${DEFAULT_AGE_MIN_TEAMS}, ${data.maxTeams})
        on conflict (weekend_id, age_group) do nothing
      `;
	return mapWeekend({
		...created,
		location_count: 0,
		approved_count: 0
	});
});
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
      (select count(*)::int from weekend_locations l where l.weekend_id = w.id) as location_count,
      (select count(*)::int from teams t where t.weekend_id = w.id and t.status = ${"approved"}) as approved_count
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
	const [ages, locations, teams] = await Promise.all([
		loadAges(weekend.id, weekend.ageGroups),
		loadLocations(weekend.id),
		loadWeekendTeams(weekend.id)
	]);
	const scored = await weekendHasScoredGame(id);
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
			today: isoDateFromLocal(new Date()),
			scored,
		}),
	};
}
export const getWeekend = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data: any) => ({ id: parsePositiveInt(data?.id, "Missing tournament.") })).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
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
	const prior = mapWeekend(await loadWeekendOrThrow(data.weekendId));
	const sql: any = await getSql();
	const used = await sql`
      select distinct age_group from teams where weekend_id = ${data.weekendId}
    `;
	const nextAges = new Set(data.ages.map((age: any) => age.ageGroup));
	for (const row of used) {
		if (!isAgeGroup(row.age_group)) continue;
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
        sunday_seeds_locked = ${lockSunday}
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
    order by name asc, id asc
  `).map((row: any) => ({
		id: row.id,
		name: row.name,
		address: row.address,
		...mapFlags(row),
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

export const updateWeekendLocation = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const parsed = parseLocationInput({ weekendId: 1, name: data?.name, address: data?.address });
	return {
		id: parsePositiveInt(data?.id, "Missing park."),
		name: parsed.name,
		address: parsed.address,
		saveToResource: data?.saveToResource === true,
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
	if (data.saveToResource) {
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
	const row = (await ((await getSql()) as any)`
    select
      t.id,
      t.name,
      t.age_group,
      t.weekend_id,
      t.status,
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
	const reason = teamEntryClosed({
		startDate,
		today: isoDateFromLocal(new Date()),
		scored: await weekendHasScoredGame(weekendId),
	});
	if (reason) throw new Error(reason);
}
export const listOpenTournaments = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<OpenTournament[]> => {
	await requireCoach(context.userId);
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
        (select count(*)::int from weekend_locations l where l.weekend_id = w.id) as location_count,
        (select count(*)::int from teams t where t.weekend_id = w.id and t.status = ${"approved"}) as approved_count,
        (select count(*)::int from games g
          where g.weekend_id = w.id
            and (g.home_score is not null or g.away_score is not null or g.forfeit is not null)
        ) as scored_count
      from weekends w
      where w.start_date > ${today}
      order by w.start_date asc, w.id asc
    `;
	const list: OpenTournament[] = [];
	for (const row of rows) {
		if ((row.scored_count ?? 0) > 0) continue;
		const weekend = mapWeekend(row);
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
export const listMyTeams = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<RegisteredTeam[]> => {
	await requireCoach(context.userId);
	const rows = await ((await getSql()) as any)`
      select
        t.id,
        t.name,
        t.age_group,
        t.weekend_id,
        t.status,
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
export const getMyTeam = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data: any) => ({ id: parsePositiveInt(data?.id, "Missing team.") })).handler(async ({ context, data }): Promise<RegisteredTeam> => {
	await requireCoach(context.userId);
	return loadOwnedTeam(context.userId, data.id);
});
export const registerTeam = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => parseTeamRegister(data)).handler(async ({ context, data }): Promise<RegisteredTeam> => {
	await requireCoach(context.userId);
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
	await requireCoach(context.userId);
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
	await requireCoach(context.userId);
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
				if (feeder.no_contest) {
					if (current != null && (current === feeder.home_team_id || current === feeder.away_team_id)) return null;
					return current;
				}
				const winner = feeder.is_bye
					? (feeder.home_team_id ?? feeder.away_team_id)
					: scoredWinner(feeder.home_team_id, feeder.away_team_id, feeder.home_score, feeder.away_score, feeder.forfeit);
				return winner != null ? winner : current;
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
	await sql.query("alter table games add column if not exists forfeit text");
	await sql.query("alter table games add column if not exists rainout boolean not null default false");
	await sql.query("alter table games add column if not exists score_locked boolean not null default false");
	await sql.query("alter table games add column if not exists no_contest boolean not null default false");
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
    where not exists (
      select 1 from parks p
      where lower(btrim(p.name)) = lower(btrim(weekend_locations.name))
        and lower(btrim(p.address)) = lower(btrim(weekend_locations.address))
    )
    order by lower(btrim(name)), lower(btrim(address)), id`);
}

async function writeSeedNamesInPlace(weekend: Weekend, ageGroup: AgeGroup, teamIds: number[]): Promise<void> {
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
	const placed = guaranteedPlaces(teamIds, results, weekend.rules.tiebreakers, weekend.rules.poolTies);
	const standings = poolStandings(teamIds, results, weekend.rules.tiebreakers);
	const fillByPlace = new Map<number, number>();
	for (const [teamId, place] of placed) fillByPlace.set(place, teamId);
	for (const row of standings) {
		if (!fillByPlace.has(row.place)) fillByPlace.set(row.place, row.teamId);
	}
	const approved = new Set<number>(teamIds);
	const frozen = new Map<number, number>();
	for (const row of seeds) {
		if (row.frozen && row.team_id != null && approved.has(row.team_id)) frozen.set(row.seed, row.team_id);
	}
	const used = new Set<number>(frozen.values());
	const nextTeam = new Map<number, number>();
	for (const row of seeds) {
		const held = frozen.get(row.seed);
		if (held != null) {
			nextTeam.set(row.seed, held);
			continue;
		}
		const filled = fillByPlace.get(row.seed) ?? null;
		if (filled != null && approved.has(filled) && !used.has(filled)) {
			nextTeam.set(row.seed, filled);
			used.add(filled);
		}
	}
	for (const [seed, teamId] of nextTeam) {
		await sql`
      update bracket_seeds
      set team_id = ${teamId}
      where weekend_id = ${weekend.id} and age_group = ${ageGroup} and seed = ${seed}
    `;
	}
	const games = await sql`
    select id, home_seed, away_seed, home_from_round, away_from_round, forfeit, no_contest, home_score, away_score
    from games
    where weekend_id = ${weekend.id} and age_group = ${ageGroup} and round <> ${"pool"}
  `;
	for (const game of games) {
		if (game.forfeit || game.no_contest || (game.home_score != null && game.away_score != null)) continue;
		const homeId = game.home_from_round == null && game.home_seed != null ? nextTeam.get(game.home_seed) ?? null : null;
		const awayId = game.away_from_round == null && game.away_seed != null ? nextTeam.get(game.away_seed) ?? null : null;
		if (game.home_from_round == null && homeId != null) {
			await sql`update games set home_team_id = ${homeId} where id = ${game.id}`;
		}
		if (game.away_from_round == null && awayId != null) {
			await sql`update games set away_team_id = ${awayId} where id = ${game.id}`;
		}
	}
}

async function persistAgeBracket(

	weekend: Weekend,
	ageGroup: AgeGroup,
	teamIds: number[],
	opts: { rebuildPools?: boolean; buildBracket?: boolean; reset?: boolean; fitToSignedUp?: boolean } = {},
): Promise<void> {
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
	if (weekend.sundaySeedsLocked || weekend.rules.softFill) {
		for (const row of standings) {
			if (!fillByPlace.has(row.place)) fillByPlace.set(row.place, row.teamId);
		}
	}

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
			const divTeams = remaining.splice(0, count);
			const divSlots = bracketField(count, (seed) => {
				const placed = teamForSeed(seed + (di === 0 ? 0 : offset)) ??
					((weekend.sundaySeedsLocked || weekend.rules.softFill) ? divTeams[seed - 1] ?? null : null);
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
		throw new Error("The sheet is locked. Forfeit a game, or replace that club in the same slot.");
	}
}

async function syncWeekendBracket(weekendId: number): Promise<void> {
	const weekend = mapWeekend(await loadWeekendOrThrow(weekendId));
	const sql: any = await getSql();
	const teams = await sql`
    select id, age_group from teams
    where weekend_id = ${weekendId} and status = ${"approved"}
    order by id asc
  `;
	const leftover = await sql`
    select distinct age_group from bracket_seeds where weekend_id = ${weekendId}
  `;
	const ages = new Set(weekend.ageGroups);
	for (const row of teams) ages.add(row.age_group);
	for (const row of leftover) ages.add(row.age_group);
	for (const age of ages) {
		if (!isAgeGroup(age)) continue;
		await persistAgeBracket(weekend, age, teams.filter((row: any) => row.age_group === age).map((row: any) => row.id));
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
		homeName:
			row.home_team_id != null
				? teamNames.get(row.home_team_id) ?? null
				: row.home_from_round || row.home_seed == null
					? null
					: fillerName(row.home_seed),
		awayName:
			row.away_team_id != null
				? teamNames.get(row.away_team_id) ?? null
				: row.away_from_round || row.away_seed == null
					? null
					: fillerName(row.away_seed),
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

	const ageSet = new Set(weekend.ageGroups);
	for (const row of teams) ageSet.add(row.age_group);
	for (const row of seedRows) ageSet.add(row.age_group);
	const ages: ScheduleAge[] = [];
	for (const age of AGE_GROUPS) {
		if (!ageSet.has(age)) continue;
		const seeds = seedRows.filter((row: any) => row.age_group === age).map((row: any) => ({
			seed: row.seed,
			teamId: row.team_id,
			teamName: row.team_id != null ? names.get(row.team_id) ?? null : fillerName(row.seed),
			frozen: Boolean(row.frozen),
			divisionIndex: Number(row.division_index ?? 0),
		}));
		const games = gameRows.filter((row: any) => row.age_group === age).map((row: any) => mapScheduleGame(row, names, locations)).filter((row: any) => row != null);
		const numbers = numberPlayableGames(games);
		for (const game of games) game.gameNumber = numbers.get(`${game.round}:${game.slot}`) ?? null;
		const teamIdsForAge = teams.filter((row: any) => row.age_group === age).map((row: any) => row.id);
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
	};
}

export const getWeekendSchedule = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data: any) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(async ({ context, data }): Promise<WeekendSchedule> => {
	if (!await loadProfile(context.userId)) throw new Error("Finish setting up your account.");
	return loadWeekendSchedule(data.weekendId);
});
export const listSchedule = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<{ weekend: Weekend; games: ScheduleGame[] }[]> => {
	const profile = await loadProfile(context.userId);
	if (!profile) throw new Error("Finish setting up your account.");
	const sql: any = await getSql();
	const weekends = await sql`
      select
        w.id, w.name, w.start_date, w.end_date, w.age_groups, w.max_teams, w.pool_play, w.day_plan, w.sunday_seeds_locked, w.bracket_rules,
        (select count(*)::int from weekend_locations l where l.weekend_id = w.id) as location_count,
        (select count(*)::int from teams t where t.weekend_id = w.id and t.status = ${"approved"}) as approved_count
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
		const schedule = await loadWeekendSchedule(row.id);
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
		seedB: parsePositiveInt(data.seedB, "Pick a team.")
	};
}).handler(async ({ context, data }): Promise<WeekendSchedule> => {
	await requireAdmin(context.userId);
	assertSheetOpen(mapWeekend(await loadWeekendOrThrow(data.weekendId)));
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
	for (const slot of next) await sql`
        update bracket_seeds
        set team_id = ${slot.teamId}
        where weekend_id = ${data.weekendId} and age_group = ${data.ageGroup} and seed = ${slot.seed}
      `;
	await persistAgeBracket(mapWeekend(await loadWeekendOrThrow(data.weekendId)), data.ageGroup, next.flatMap((slot: any) => slot.teamId != null ? [slot.teamId] : []));
	return loadWeekendSchedule(data.weekendId);
});
export const swapPoolTeams = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	return {
		gameId: parsePositiveInt(data?.gameId, "Pick a pool game."),
		teamAId: parsePositiveInt(data?.teamAId, "Pick the first team."),
		teamBId: parsePositiveInt(data?.teamBId, "Pick the second team."),
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
	assertSheetOpen(mapWeekend(await loadWeekendOrThrow(game.weekend_id)));
	const rows = await sql`
      select id, home_team_id, away_team_id, home_seed, away_seed, pool_index,
             home_score, away_score, forfeit, score_locked
      from games
      where weekend_id = ${game.weekend_id} and age_group = ${game.age_group} and round = ${"pool"}
    `;
	for (const row of rows) {
		const involved = row.home_team_id === data.teamAId || row.away_team_id === data.teamAId || row.home_team_id === data.teamBId || row.away_team_id === data.teamBId;
		if (!involved) continue;
		if (row.score_locked || row.home_score != null || row.away_score != null || row.forfeit) {
			throw new Error("Can't swap a team that already has a score.");
		}
	}
	const next = applyPoolSlotSwap(
		rows.map((row: any) => ({
			id: row.id,
			homeTeamId: row.home_team_id,
			awayTeamId: row.away_team_id,
			homeSeed: row.home_seed,
			awaySeed: row.away_seed,
			poolIndex: row.pool_index,
		})),
		data.teamAId,
		data.teamBId,
	);
	for (const row of next) {
		const prior = rows.find((item: any) => item.id === row.id);
		if (
			!prior ||
			(prior.home_team_id === row.homeTeamId &&
				prior.away_team_id === row.awayTeamId &&
				prior.home_seed === row.homeSeed &&
				prior.away_seed === row.awaySeed)
		) {
			continue;
		}
		await sql`
        update games
        set home_team_id = ${row.homeTeamId},
            away_team_id = ${row.awayTeamId},
            home_seed = ${row.homeSeed},
            away_seed = ${row.awaySeed}
        where id = ${row.id}
      `;
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
export const removeWeekendTeam = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({ id: parsePositiveInt(data?.id, "Missing team.") })).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	const team = (await sql`
      select id, weekend_id from teams where id = ${data.id} limit 1
    `)[0];
	if (!team) throw new Error("That team is already gone.");
	assertSheetOpen(mapWeekend(await loadWeekendOrThrow(team.weekend_id)));
	await sql`delete from roster_players where team_id = ${team.id}`;
	await sql`delete from teams where id = ${team.id}`;
	await syncWeekendBracket(team.weekend_id);
	return loadWeekendDetail(team.weekend_id);
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
export const fillDemoTeams = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	if (typeof data?.ageGroup !== "string" || !isAgeGroup(data.ageGroup)) throw new Error("Pick an age group.");
	return {
		weekendId: parsePositiveInt(data.weekendId, "Missing tournament."),
		ageGroup: data.ageGroup
	};
}).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
	const weekend = mapWeekend(await loadWeekendOrThrow(data.weekendId));
	assertSheetOpen(weekend);
	await assertTeamEntryOpen(weekend.id, weekend.startDate);
	if (!weekend.ageGroups.includes(data.ageGroup)) throw new Error(`${data.ageGroup} isn’t on this tournament.`);
	const sql: any = await getSql();
	const locations = await loadLocations(data.weekendId);
	const havePark = new Set(locations.map((loc: any) => loc.name.toLowerCase()));
	const parkCount = weekend.rules.fieldCount > 0 ? weekend.rules.fieldCount : fieldsNeeded(weekend.maxTeams);
	let have = locations.length;
	let sort = locations.length;
	for (const park of DEMO_PARKS) {
		if (have >= parkCount) break;
		if (havePark.has(park.name.toLowerCase())) continue;
		const primary = locations.every((loc: { isPrimary: boolean }) => !loc.isPrimary) && have === locations.length;
		await sql`
        insert into weekend_locations (weekend_id, name, address, sort_order, is_primary)
        values (${data.weekendId}, ${park.name}, ${park.address}, ${sort}, ${primary})
      `;
		have += 1;
		sort += 1;
	}
	const existing = await sql`
      select name from teams
      where weekend_id = ${data.weekendId} and age_group = ${data.ageGroup}
        and status in (${"pending"}, ${"approved"})
    `;
	const usedNames = new Set(existing.map((row: any) => row.name.trim().toLowerCase()));
	const approved = await sql`
      select count(*)::int as n
      from teams
      where weekend_id = ${data.weekendId} and status = ${"approved"}
    `;
	const room = Math.max(0, weekend.maxTeams - (approved[0]?.n ?? 0));
	let added = 0;
	for (const name of DEMO_TEAM_NAMES) {
		if (added >= room) break;
		if (usedNames.has(name.toLowerCase())) continue;
		await sql`
        insert into teams (weekend_id, age_group, name, coach_user_id, status, is_demo)
        values (${data.weekendId}, ${data.ageGroup}, ${name}, ${context.userId}, ${"approved"}, ${true})
      `;
		usedNames.add(name.toLowerCase());
		added += 1;
	}
	const filledPlan = hasPoolDays(weekend.dayPlan) ? weekend.dayPlan : defaultDayPlan(weekend.startDate, weekend.endDate);
	await sql`
      update weekends set pool_play = true, sunday_seeds_locked = false, day_plan = ${JSON.stringify(filledPlan)} where id = ${data.weekendId}
    `;
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
	const rows = await sql`
    select id from teams
    where weekend_id = ${weekendId} and age_group = ${ageGroup} and status = ${"approved"}
    order by id asc
  `;
	return rows.map((row: any) => row.id);
}

export const rebuildWeekendSchedule = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	if (typeof data?.ageGroup !== "string" || !isAgeGroup(data.ageGroup)) throw new Error("Pick an age group.");
	const mode = data?.mode === "pools" || data?.mode === "reset" || data?.mode === "bracket" || data?.mode === "fit" ? data.mode : "repack";
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		ageGroup: data.ageGroup as AgeGroup,
		mode: mode as "repack" | "pools" | "reset" | "bracket" | "fit",
	};
}).handler(async ({ context, data }): Promise<WeekendSchedule> => {
	await requireAdmin(context.userId);
	const weekend = mapWeekend(await loadWeekendOrThrow(data.weekendId));
	assertSheetOpen(weekend);
	const teamIds = await approvedTeamIds(data.weekendId, data.ageGroup);
	if (data.mode === "fit") {
		const sql: any = await getSql();
		await ensureLiveOpsColumns();
		await sql`update weekends set bracket_locked = true where id = ${data.weekendId}`;
		weekend.bracketLocked = true;
		await persistAgeBracket(weekend, data.ageGroup, teamIds, { buildBracket: true, reset: true, fitToSignedUp: true });
	} else if (data.mode === "reset") {
		const sql: any = await getSql();
		await sql`delete from games where weekend_id = ${data.weekendId} and age_group = ${data.ageGroup}`;
		await sql`delete from bracket_seeds where weekend_id = ${data.weekendId} and age_group = ${data.ageGroup}`;
		await persistAgeBracket(weekend, data.ageGroup, teamIds, { rebuildPools: true, buildBracket: true, reset: true });
	} else if (data.mode === "bracket") {
		await persistAgeBracket(weekend, data.ageGroup, teamIds, { buildBracket: true });
	} else {
		await persistAgeBracket(weekend, data.ageGroup, teamIds, { rebuildPools: data.mode === "pools" });
	}
	return loadWeekendSchedule(data.weekendId);
});


export const postGameScore = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => {
	const forfeit = data?.forfeit === "home" || data?.forfeit === "away" ? data.forfeit : null;
	const homeScore = forfeit ? 0 : Number.parseInt(String(data?.homeScore ?? ""), 10);
	const awayScore = forfeit ? 0 : Number.parseInt(String(data?.awayScore ?? ""), 10);
	if (!forfeit) {
		if (!Number.isInteger(homeScore) || homeScore < 0 || homeScore > 99) throw new Error("Home score looks off.");
		if (!Number.isInteger(awayScore) || awayScore < 0 || awayScore > 99) throw new Error("Away score looks off.");
	}
	return {
		gameId: parsePositiveInt(data?.gameId, "Pick a game."),
		homeScore,
		awayScore,
		forfeit: forfeit as "home" | "away" | null,
		lock: Boolean(data?.lock),
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
		if (row.round !== POOL_ROUND) await applyWinnerAdvance(row.weekend_id, row.age_group);
		const teamIds = await approvedTeamIds(row.weekend_id, row.age_group);
		await persistAgeBracket(weekend, row.age_group, teamIds);
	}
	return loadWeekendSchedule(row.weekend_id);
});

async function canScoreGame(userId: string, game: { weekend_id: number; location_id: number | null; start_date: unknown }): Promise<boolean> {
	const sql: any = await getSql();
	const rows = await sql`
    select scope, location_id, on_date from weekend_scorekeepers
    where weekend_id = ${game.weekend_id} and user_id = ${userId}
  `;
	const date = asDateString(game.start_date);
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
	return loadWeekendSchedule(row.weekend_id);
});
