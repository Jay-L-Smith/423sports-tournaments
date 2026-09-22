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
  isAgeGroup,
  isTeamStatus,
  isoDateFromLocal,
  MAX_TOURNAMENT_TEAMS,
  parseAgeCaps,
  parseLocationInput,
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
  type AgeCapInput,
  type AgeGroup,
  type DayPlan,
  type TeamStatus,
} from "./weekends";
import { DEMO_PARKS, DEMO_TEAM_NAMES } from "./demo-teams";
import {
  DEFAULT_BRACKET_RULES,
  parseBracketRules,
  teamsNeededForBracket,
  type BracketRules,
} from "./rules";
import {
  buildGames,
  buildPools,
  formatKickoff,
  isGameRound,
  isRoundId,
  numberPlayableGames,
  packSchedule,
  POOL_ROUND,
  poolLabel,
  roundLabel,
  sundayTeamCount,
  swapSeeds,
  syncSeeds,
  type BuiltPoolGame,
  type GameRound,
  type RoundId,
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
  poolPlay: boolean;
  dayPlan: DayPlan[];
  sundaySeedsLocked: boolean;
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
  name: string;
  address: string;
};

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
};

export type ScheduleSeed = {
  seed: number;
  teamId: number | null;
  teamName: string | null;
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
};

export type WeekendSchedule = {
  weekend: Weekend;
  locations: WeekendLocation[];
  ages: ScheduleAge[];
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
function mapWeekend(row: any): Weekend {
	const plan = planFromRow(row);
	return {
		id: row.id,
		name: row.name,
		startDate: row.start_date,
		endDate: row.end_date,
		ageGroups: parseStoredAgeGroups(row.age_groups),
		locationCount: row.location_count ?? 0,
		maxTeams: row.max_teams ?? 40,
		approvedCount: row.approved_count ?? 0,
		poolPlay: hasPoolDays(plan),
		dayPlan: plan,
		sundaySeedsLocked: Boolean(row.sunday_seeds_locked),
		rules: parseBracketRules(row.bracket_rules)
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
        w.bracket_rules,
        (select count(*)::int from weekend_locations l where l.weekend_id = w.id) as location_count,
        (select count(*)::int from teams t where t.weekend_id = w.id and t.status = ${"approved"}) as approved_count
      from weekends w
      order by w.start_date asc, w.id asc
    `).map(mapWeekend);
});
export const createWeekend = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => parseWeekendInput(data)).handler(async ({ context, data }): Promise<Weekend> => {
	await requireAdmin(context.userId);
	const sql: any = await getSql();
	const created = (await sql`
      insert into weekends (name, start_date, end_date, age_groups, max_teams, pool_play, day_plan, created_by)
      values (
        ${data.name},
        ${data.startDate},
        ${data.endDate},
        ${JSON.stringify(data.ageGroups)},
        ${data.maxTeams},
        ${data.poolPlay},
        ${JSON.stringify(data.dayPlan)},
        ${context.userId}
      )
      returning id, name, start_date, end_date, age_groups, max_teams, pool_play, day_plan
    `)[0];
	if (!created) throw new Error("Could not save that tournament. Try again.");
	for (const ageGroup of data.ageGroups) await sql`
        insert into weekend_age_groups (weekend_id, age_group)
        values (${created.id}, ${ageGroup})
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
async function loadLocations(weekendId: any) {
	return (await ((await getSql()) as any)`
    select id, name, address
    from weekend_locations
    where weekend_id = ${weekendId}
    order by sort_order asc, id asc
  `).map((row: any) => ({
		id: row.id,
		name: row.name,
		address: row.address
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
	return {
		...weekend,
		locationCount: locations.length,
		ages,
		locations,
		teams
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
export const addWeekendLocation = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => parseLocationInput(data)).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
	await loadWeekendOrThrow(data.weekendId);
	const sql: any = await getSql();
	const sortOrder = (await sql`
      select coalesce(max(sort_order), -1) + 1 as next
      from weekend_locations
      where weekend_id = ${data.weekendId}
    `)[0]?.next ?? 0;
	await sql`
      insert into weekend_locations (weekend_id, name, address, sort_order)
      values (${data.weekendId}, ${data.name}, ${data.address}, ${sortOrder})
    `;
	await syncWeekendBracket(data.weekendId);
	return loadWeekendDetail(data.weekendId);
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
	await syncWeekendBracket(weekendId);
	return loadWeekendDetail(weekendId);
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
export const listOpenTournaments = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<OpenTournament[]> => {
	await requireCoach(context.userId);
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
        (select count(*)::int from teams t where t.weekend_id = w.id and t.status = ${"approved"}) as approved_count
      from weekends w
      where w.end_date >= ${isoDateFromLocal(/* @__PURE__ */ new Date())}
      order by w.start_date asc, w.id asc
    `;
	const list: OpenTournament[] = [];
	for (const row of rows) {
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
async function persistAgeBracket(weekend: Weekend, ageGroup: AgeGroup, teamIds: number[]): Promise<void> {
	const sql: any = await getSql();
	const minTeams = teamsNeededForBracket(weekend.rules, null);
	if (teamIds.length < minTeams) {
		await sql`delete from games where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
		await sql`delete from bracket_seeds where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
		return;
	}
	const existing = await sql`
    select seed, team_id from bracket_seeds
    where weekend_id = ${weekend.id} and age_group = ${ageGroup}
    order by seed asc
  `;
	const slots = syncSeeds(existing.map((row: any) => ({
		seed: row.seed,
		teamId: row.team_id
	})), teamIds);
	await sql`delete from bracket_seeds where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
	for (const slot of slots) await sql`
      insert into bracket_seeds (weekend_id, age_group, seed, team_id)
      values (${weekend.id}, ${ageGroup}, ${slot.seed}, ${slot.teamId})
    `;
	const prior = await sql`
    select round, slot, location_id, field_confirmed, home_team_id, away_team_id, home_seed, away_seed, pool_index
    from games
    where weekend_id = ${weekend.id} and age_group = ${ageGroup}
  `;
	const locations = await loadLocations(weekend.id);
	const confirmed = prior.filter((row: any) => row.field_confirmed && row.location_id != null && locations.some((loc: any) => loc.id === row.location_id)).flatMap((row: any) => isGameRound(row.round) && row.location_id != null ? [{
		round: row.round,
		slot: row.slot,
		locationId: row.location_id
	}] : []);
	const nSunday = sundayTeamCount(teamIds.length, weekend.poolPlay, weekend.rules.advance, weekend.rules.advancePerPool);
	const hideSundayNames = weekend.poolPlay && !weekend.sundaySeedsLocked;
	const treeSlots = nSunday === teamIds.length ? slots : syncSeeds([], slots.flatMap((row: any) => row.teamId != null && row.seed <= nSunday ? [row.teamId as number] : []));
	const built = buildGames(treeSlots);
	let poolGames: BuiltPoolGame[] = [];
	if (weekend.poolPlay) {
		const priorPool = prior.filter((row: any) => row.round === POOL_ROUND);
		const priorIds = new Set<number>();
		for (const row of priorPool) {
			if (row.home_team_id != null) priorIds.add(row.home_team_id);
			if (row.away_team_id != null) priorIds.add(row.away_team_id);
		}
		if (priorIds.size === teamIds.length && teamIds.every((id: any) => priorIds.has(id)) && priorPool.length > 0) poolGames = priorPool.slice().sort((a: any, b: any) => a.slot - b.slot).flatMap((row: any, index: any) => row.home_team_id != null && row.away_team_id != null ? [{
			round: POOL_ROUND,
			slot: index,
			poolIndex: row.pool_index ?? 0,
			homeTeamId: row.home_team_id,
			awayTeamId: row.away_team_id,
			homeSeed: row.home_seed,
			awaySeed: row.away_seed
		}] : []);
		else poolGames = buildPools(slots).flatMap((pool: any) => pool.games);
	}
	const packed = packSchedule({
		games: built,
		poolGames,
		locations,
		startDate: weekend.startDate,
		endDate: weekend.endDate,
		confirmed,
		dayPlan: weekend.dayPlan
	});
	await sql`delete from games where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
	for (const game of built) {
		const place = packed.find((row: any) => row.round === game.round && row.slot === game.slot);
		const priorRow = prior.find((row: any) => row.round === game.round && row.slot === game.slot);
		const locationId = place?.locationId ?? null;
		const fieldConfirmed = Boolean(priorRow?.field_confirmed && priorRow.location_id != null && priorRow.location_id === locationId);
		await sql`
      insert into games (
        weekend_id, age_group, round, slot,
        home_seed, away_seed, home_team_id, away_team_id,
        home_from_round, home_from_slot, away_from_round, away_from_slot,
        is_bye, location_id, field_confirmed, start_date, start_time, pool_index
      )
      values (
        ${weekend.id}, ${ageGroup}, ${game.round}, ${game.slot},
        ${game.homeSeed}, ${game.awaySeed}, ${hideSundayNames ? null : game.homeTeamId}, ${hideSundayNames ? null : game.awayTeamId},
        ${game.homeFromRound}, ${game.homeFromSlot}, ${game.awayFromRound}, ${game.awayFromSlot},
        ${game.isBye}, ${locationId}, ${fieldConfirmed}, ${place?.startDate ?? null}, ${place?.startTime ?? null},
        ${null}
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
        is_bye, location_id, field_confirmed, start_date, start_time, pool_index
      )
      values (
        ${weekend.id}, ${ageGroup}, ${game.round}, ${game.slot},
        ${game.homeSeed}, ${game.awaySeed}, ${game.homeTeamId}, ${game.awayTeamId},
        ${null}, ${null}, ${null}, ${null},
        ${false}, ${locationId}, ${fieldConfirmed}, ${place?.startDate ?? null}, ${place?.startTime ?? null},
        ${game.poolIndex}
      )
    `;
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
		poolIndex
	};
}
async function loadWeekendSchedule(weekendId: number): Promise<WeekendSchedule> {
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
    select age_group, seed, team_id from bracket_seeds
    where weekend_id = ${weekendId}
    order by seed asc
  `;
	const gameRows = await sql`
    select
      id, weekend_id, age_group, round, slot,
      home_seed, away_seed, home_team_id, away_team_id,
      home_from_round, home_from_slot, away_from_round, away_from_slot,
      is_bye, location_id, field_confirmed, start_date, start_time, pool_index
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
			teamName: row.team_id != null ? names.get(row.team_id) ?? null : null
		}));
		const games = gameRows.filter((row: any) => row.age_group === age).map((row: any) => mapScheduleGame(row, names, locations)).filter((row: any) => row != null);
		const numbers = numberPlayableGames(games);
		for (const game of games) game.gameNumber = numbers.get(`${game.round}:${game.slot}`) ?? null;
		ages.push({
			ageGroup: age,
			teamCount: teams.filter((row: any) => row.age_group === age).length,
			seeds,
			games,
			poolPlay: weekend.poolPlay,
			sundaySeedsLocked: weekend.sundaySeedsLocked,
			minTeams: teamsNeededForBracket(weekend.rules, null),
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
	return {
		weekend,
		locations,
		ages
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
	await sql`delete from roster_players where team_id = ${team.id}`;
	await sql`delete from teams where id = ${team.id}`;
	await syncWeekendBracket(team.weekend_id);
	return loadWeekendDetail(team.weekend_id);
});
export const clearDemoTeams = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(async ({ context, data }): Promise<WeekendDetail> => {
	await requireAdmin(context.userId);
	await loadWeekendOrThrow(data.weekendId);
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
	if (!weekend.ageGroups.includes(data.ageGroup)) throw new Error(`${data.ageGroup} isn’t on this tournament.`);
	const sql: any = await getSql();
	await sql`
      update weekend_age_groups
      set max_teams = ${40}
      where weekend_id = ${data.weekendId} and age_group = ${data.ageGroup}
        and (max_teams is null or max_teams < ${40})
    `;
	const locations = await loadLocations(data.weekendId);
	const havePark = new Set(locations.map((loc: any) => loc.name.toLowerCase()));
	let sort = locations.length;
	for (const park of DEMO_PARKS) {
		if (havePark.has(park.name.toLowerCase())) continue;
		await sql`
        insert into weekend_locations (weekend_id, name, address, sort_order)
        values (${data.weekendId}, ${park.name}, ${park.address}, ${sort})
      `;
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
