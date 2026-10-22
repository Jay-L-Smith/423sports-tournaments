import { n as createServerFn, r as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { $t as proposeRainoutSlots, A as buildGames, At as numberPlayableGames, B as coachTextKind, Bt as parsePositiveInt, C as applyPoolSlotSwap, D as beforeFirstPitch, Dn as getSql, E as authMiddleware, Et as nameWithAges, Ft as parseDayPlan, Gt as parseTournamentMax, H as collectScheduleWarnings, Ht as parseStoredAgeGroups, It as parseJersey, Jt as pastDropCutoff, K as denyCoachNotice, Kt as parseWeekendInput, L as coachResubmitState, Lt as parseLocationInput, Mt as parseAgeCaps, Nt as parseBracketRules, Pt as parseCoachAccess, Q as forfeitRemaining, Qt as preferredSeasonYear, Rt as parseParkFlags, S as announcedWeekendName, Sn as teamsNeededForBracket, St as isoDateFromLocal, U as defaultDayPlan, Vt as parseSheetLock, W as defaultSeasonWindow, Wt as parseTeamRegister, Xt as poolLabel, Y as emptyParkFlags, Yt as placeOneOrTwoFields, Z as finalizeIsDue, Zt as poolStandings, _ as POOL_REGEN_BLOCKED, _n as swapSeeds, a as isRole, an as seasonLabel, at as formatPhoneInput, bt as isSeason, c as normalizeEmail, d as AGE_GROUPS, dt as hasBracketShell, en as renameTournamentAge, fn as softDeadline, gn as sundayTeamCount, gt as isAgeGroup, i as isElevatedRole, in as seasonFromDate, it as formatMonthDay, j as buildPools, jt as packSchedule, k as bracketField, m as FIRST_SEASON_YEAR, mt as hasPoolDays, o as isSeedAdminEmail, on as seasonOverlaps, ot as formatSeasonSpan, pn as softDeadlineCopy, pt as hasPlayableBracket, q as divisionSlotOffset, qt as parseWeekendUpdate, rn as roundLabel, rt as formatKickoff, s as isSuperuserOwner, sn as seasonSaturdays, tn as restorePoolDraw, un as sheetIsLocked, ut as guaranteedPlaces, v as POOL_ROUND, vn as syncSeeds, vt as isGameRound, w as archiveIsDue, x as addDays, xt as isTeamStatus, y as ROUND_IDS, yn as teamEntryClosed, yt as isRoundId, zt as parsePlayerInput } from "./roles-Cea3BuXf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-CRcrN9hp.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function mapProfile(row, coachRequestCount = 0) {
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
		canManageAdmins: Boolean(row.is_superuser) || Boolean(row.can_manage_admins)
	};
}
function nameList(value) {
	if (value == null) return [];
	try {
		const raw = typeof value === "string" ? JSON.parse(value) : value;
		if (!Array.isArray(raw)) return [];
		return raw.map((item) => String(item || "").trim()).filter(Boolean);
	} catch {
		return [];
	}
}
function countMap(value) {
	const raw = typeof value === "string" ? JSON.parse(value) : value;
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
	const out = {};
	for (const [key, n] of Object.entries(raw)) {
		const num = typeof n === "number" ? n : Number(n);
		if (Number.isFinite(num)) out[key] = num;
	}
	return out;
}
function mapWeekend(row) {
	const plan = planFromRow(row);
	const startDate = asDateString(row.start_date) ?? "";
	const endDate = asDateString(row.end_date) ?? "";
	const rules = parseBracketRules(row.bracket_rules, row.max_teams ?? 10);
	const sheetLock = parseSheetLock(row.sheet_lock);
	return {
		id: row.id,
		name: row.name,
		startDate,
		endDate,
		ageGroups: parseStoredAgeGroups(row.age_groups),
		locationCount: row.location_count ?? 0,
		maxTeams: row.max_teams ?? 10,
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
			firstPitch: rules.firstPitch
		}),
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
		needsStaff: row.needs_staff == null ? false : Boolean(row.needs_staff)
	};
}
function planFromRow(row) {
	return parseDayPlan(row.day_plan, row.start_date, row.end_date, Boolean(row.pool_play));
}
async function loadAuthUser(userId) {
	return (await (await getSql())`
    select id, email, name from "user" where id = ${userId} limit 1
  `)[0] ?? null;
}
async function countCoachRequests(userId) {
	return (await (await getSql())`
    select count(*)::int as n
    from role_requests
    where user_id = ${userId} and requested_role = ${"coach"}
  `)[0]?.n ?? 0;
}
async function loadProfile(userId) {
	await ensureSuperuserColumn();
	const rows = await (await getSql())`
    select user_id, email, requested_role, home_role, request_status, is_superuser, can_manage_admins
    from profiles
    where user_id = ${userId}
    limit 1
  `;
	if (!rows[0]) return null;
	return mapProfile(rows[0], await countCoachRequests(userId));
}
async function requireScheduleReader(userId) {
	const profile = await loadProfile(userId);
	if (!profile || profile.homeRole !== "admin" && profile.homeRole !== "coach") throw new Error("You can’t view the schedule.");
	return profile;
}
async function requireAdmin(userId) {
	const profile = await loadProfile(userId);
	if (!profile || profile.homeRole !== "admin") throw new Error("Only an Admin can do that.");
	return profile;
}
async function requireSuperuser(userId) {
	const profile = await requireAdmin(userId);
	if (!profile.isSuperuser) throw new Error("Only a superuser can do that.");
	return profile;
}
async function requireAdminManager(userId) {
	const profile = await requireAdmin(userId);
	if (!profile.canManageAdmins) throw new Error("You aren’t allowed to manage administrators.");
	return profile;
}
var superuserColumnReady = null;
function ensureSuperuserColumn() {
	if (!superuserColumnReady) superuserColumnReady = (async () => {
		const sql = await getSql();
		await sql.query("alter table profiles add column if not exists is_superuser boolean not null default false");
		await sql.query("alter table profiles add column if not exists can_manage_admins boolean not null default false");
		await sql.query("alter table profiles add column if not exists view_as_coach_id text");
	})().catch((error) => {
		superuserColumnReady = null;
		throw error;
	});
	return superuserColumnReady;
}
async function requireCoach(userId) {
	const profile = await loadProfile(userId);
	if (!profile || profile.homeRole !== "coach" && !profile.isSuperuser) throw new Error("Only an approved Coach can do that.");
	return profile;
}
async function applyViewAs(context) {
	if (!(await loadProfile(context.userId))?.isSuperuser) return;
	await ensureSuperuserColumn();
	const row = (await (await getSql())`select view_as_coach_id from profiles where user_id = ${context.userId} limit 1`)[0];
	const target = row?.view_as_coach_id ? String(row.view_as_coach_id) : "";
	if (!target || target === context.userId) return;
	const coach = (await (await getSql())`select user_id from profiles where user_id = ${target} and home_role = ${"coach"} limit 1`)[0];
	if (coach) context.userId = String(coach.user_id);
}
var liveStamp_createServerFn_handler = createServerRpc({
	id: "6bce1cf6e6e21bca25b6bb4e798670989f77d2c9b9f2d62139dc174fa2ce7c6a",
	name: "liveStamp",
	filename: "src/lib/pbi/api.ts"
}, (opts) => liveStamp.__executeServer(opts));
var liveStamp = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(liveStamp_createServerFn_handler, async ({ context }) => {
	const before = context.userId;
	const profile = await loadProfile(before);
	await applyViewAs(context);
	const coachView = profile?.homeRole === "coach" || context.userId !== before;
	const sql = await getSql();
	const row = coachView ? (await sql`
      select md5(concat_ws('|'
        , coalesce((select string_agg(id::text || ':' || status || ':' || weekend_id::text, ',' order by id) from teams where coach_user_id = ${context.userId}), '')
        , coalesce((select string_agg(id::text || ':' || lifecycle || ':' || name, ',' order by id) from weekends), '')
        , coalesce((select string_agg(weekend_id::text || ':' || choice, ',' order by weekend_id) from tournament_responses where coach_user_id = ${context.userId}), '')
        , coalesce((select max(id) from notifications where user_id = ${context.userId}), 0)::text
      )) as stamp
    `)[0] : (await sql`
      select md5(concat_ws('|'
        , coalesce((select string_agg(id::text || ':' || status || ':' || weekend_id::text || ':' || coalesce(coach_user_id, ''), ',' order by id) from teams), '')
        , coalesce((select string_agg(id::text || ':' || lifecycle || ':' || name, ',' order by id) from weekends), '')
        , coalesce((select string_agg(coach_user_id || ':' || weekend_id::text || ':' || choice, ',' order by weekend_id, coach_user_id) from tournament_responses), '')
        , coalesce((select max(id) from notifications where user_id = ${before}), 0)::text
      )) as stamp
    `)[0];
	return { stamp: String(row?.stamp || "") };
});
async function actAsCoach(context) {
	await requireCoach(context.userId);
	await applyViewAs(context);
}
async function adminCount() {
	return (await (await getSql())`
    select count(*)::int as n from profiles where home_role = 'admin'
  `)[0]?.n ?? 0;
}
async function notifyAdmins(title, body, kind = "teams", refKey = null) {
	const sql = await getSql();
	const admins = await sql`select user_id from profiles where home_role = ${"admin"}`;
	for (const admin of admins) await sql`
      insert into notifications (user_id, title, body, kind, ref_key)
      values (${admin.user_id}, ${title}, ${body}, ${kind}, ${refKey})
    `;
}
async function insertNotification(userId, title, body, kind = "status", refKey = null) {
	const sql = await getSql();
	if (refKey) {
		if ((await sql`select id from notifications where user_id = ${userId} and ref_key = ${refKey} limit 1`)[0]) return;
	}
	await sql`
    insert into notifications (user_id, title, body, kind, ref_key)
    values (${userId}, ${title}, ${body}, ${kind}, ${refKey})
  `;
}
var ensureBootAccounts_createServerFn_handler = createServerRpc({
	id: "1db8ede3c53e04de01e6a61715a7c85a2c378a0a7d5601f91202436b386ad835",
	name: "ensureBootAccounts",
	filename: "src/lib/pbi/api.ts"
}, (opts) => ensureBootAccounts.__executeServer(opts));
var ensureBootAccounts = createServerFn({ method: "POST" }).handler(ensureBootAccounts_createServerFn_handler, async () => {
	const { ensureSeedAdmin } = await import("./seed-admin-DdHkrd-M.mjs");
	await ensureSeedAdmin();
	return { ok: true };
});
var getMyProfile_createServerFn_handler = createServerRpc({
	id: "b925f0e2b34e446bf4c14040540dd70328764040e7c6397652cb747277e342b3",
	name: "getMyProfile",
	filename: "src/lib/pbi/api.ts"
}, (opts) => getMyProfile.__executeServer(opts));
var getMyProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMyProfile_createServerFn_handler, async ({ context }) => {
	return loadProfile(context.userId);
});
async function acceptCoachInvite(sql, userId, inviteId) {
	if (!inviteId) return;
	await sql`
    update coach_invites
    set accepted_user_id = ${userId}, accepted_at = ${(/* @__PURE__ */ new Date()).toISOString()}
    where id = ${inviteId} and accepted_user_id is null
  `;
}
function phoneLast10(value) {
	const digits = value.replace(/\D/g, "");
	return digits.length >= 10 ? digits.slice(-10) : "";
}
async function ensureSignupColumns() {
	const sql = await getSql();
	await sql.query("alter table profiles add column if not exists phone text");
	await sql.query("alter table profiles add column if not exists club text");
	await sql.query("alter table profiles add column if not exists admin_note text");
	try {
		await sql.query(`create unique index if not exists profiles_phone_last10_idx
      on profiles (right(regexp_replace(phone, '[^0-9]', '', 'g'), 10))
      where phone is not null and length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 10`);
	} catch {}
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
var checkSignupOpen_createServerFn_handler = createServerRpc({
	id: "c0da0bec8958a7a3806cfc87bbb93ae4af008666d0543ca060fd63cea7c4b9b2",
	name: "checkSignupOpen",
	filename: "src/lib/pbi/api.ts"
}, (opts) => checkSignupOpen.__executeServer(opts));
var checkSignupOpen = createServerFn({ method: "POST" }).validator((data) => {
	const email = normalizeEmail(String(data?.email ?? ""));
	const phone = String(data?.phone ?? "").trim();
	if (!email.includes("@")) throw new Error("Enter an email.");
	if (!phoneLast10(phone)) throw new Error("Enter a cell phone.");
	return {
		email,
		phone
	};
}).handler(checkSignupOpen_createServerFn_handler, async ({ data }) => {
	await ensureSignupColumns();
	const sql = await getSql();
	if ((await sql`select id from "user" where lower(email) = ${data.email} limit 1`)[0]) throw new Error("An account with that email already exists. Sign in instead.");
	const want = phoneLast10(data.phone);
	if ((await sql`select phone from profiles where phone is not null`).some((row) => phoneLast10(String(row.phone || "")) === want)) throw new Error("An account with that phone number already exists. Sign in instead.");
	return { ok: true };
});
function parseSignupTeams(value) {
	if (!Array.isArray(value)) return null;
	const teams = value.map((team) => {
		const name = String(team?.name ?? "").trim();
		const ageGroup = String(team?.ageGroup ?? "");
		if (!name) throw new Error("Enter a team name.");
		if (!isAgeGroup(ageGroup)) throw new Error("Pick an age from 8U to 17U.");
		return {
			name,
			ageGroup
		};
	});
	if (teams.length === 0) throw new Error("Add at least one team.");
	return teams;
}
var completeOnboarding_createServerFn_handler = createServerRpc({
	id: "7830391c1ecebebbf200675a5f7a5aaf35b7038915a2a1488a27f7ceb8faca15",
	name: "completeOnboarding",
	filename: "src/lib/pbi/api.ts"
}, (opts) => completeOnboarding.__executeServer(opts));
var completeOnboarding = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	if (!data || !isRole(data.role)) throw new Error("Pick a role to continue.");
	if (data.role === "parent" || data.role === "athlete") throw new Error("Create a Coach or Admin account.");
	const inviteId = Number.isInteger(data.inviteId) && data.inviteId > 0 ? data.inviteId : null;
	const rawPhone = String(data?.phone ?? "").trim();
	const phone = rawPhone ? rawPhone : null;
	if (phone && !phoneLast10(phone)) throw new Error("Enter a cell phone.");
	const clubRaw = String(data?.club ?? "").trim();
	if (data.role === "coach") {
		const teams = parseSignupTeams(data.teams);
		if (teams) {
			const teamName = teams.map((team) => `${team.name} · ${team.ageGroup}`).join(", ");
			return {
				role: data.role,
				teamName,
				reason: null,
				inviteId,
				phone,
				club: clubRaw || null,
				teams
			};
		}
		const access = parseCoachAccess(data);
		return {
			role: data.role,
			teamName: access.teamName,
			reason: access.reason,
			inviteId,
			phone,
			club: clubRaw || null,
			teams: []
		};
	}
	return {
		role: data.role,
		teamName: null,
		reason: null,
		inviteId,
		phone,
		club: null,
		teams: []
	};
}).handler(completeOnboarding_createServerFn_handler, async ({ context, data }) => {
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
		requestStatus = "pending";
	} else if (role === "admin" && noAdminYet) {
		homeRole = "admin";
		requestStatus = "none";
	} else {
		homeRole = "parent";
		requestStatus = "pending";
	}
	const sql = await getSql();
	await ensureSignupColumns();
	const want = data.phone ? phoneLast10(data.phone) : "";
	if (want) {
		if ((await sql`select user_id, phone from profiles where phone is not null`).some((row) => row.user_id !== context.userId && phoneLast10(String(row.phone || "")) === want)) throw new Error("An account with that phone number already exists. Sign in instead.");
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
	if (role === "coach") {
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
		const teamLine = data.teamName ? ` Team: ${data.teamName}.` : "";
		await notifyAdmins("New coach account", `${email || "A new coach"} created an account and can use the app.${teamLine} Keep their access or remove the account.`, "coach-signup", `coach-signup-${context.userId}`);
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
	if (role === "coach") {
		for (const team of data.teams) await sql`
        insert into coach_signup_teams (user_id, name, age_group)
        values (${context.userId}, ${team.name}, ${team.ageGroup})
      `;
		await acceptCoachInvite(sql, context.userId, data.inviteId);
	}
	return created;
});
var listNotifications_createServerFn_handler = createServerRpc({
	id: "17c50c75817be392e01cffba584b1521a273c2894dbe9cd3f96d3ce91fcf6c9e",
	name: "listNotifications",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listNotifications.__executeServer(opts));
var listNotifications = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listNotifications_createServerFn_handler, async ({ context }) => {
	await ensureFinalizeNotices(context.userId);
	await applyViewAs(context);
	const sql = await getSql();
	await pruneAvailableNotices(sql);
	const rows = await sql`
      select id, title, body, kind, read, created_at, ref_key
      from notifications
      where user_id = ${context.userId}
      order by created_at desc
      limit 50
    `;
	const live = new Set((await sql`select id from weekends`).map((row) => Number(row.id)));
	return rows.map((r) => ({
		id: r.id,
		title: r.title,
		body: r.body,
		kind: r.kind,
		read: r.read,
		createdAt: r.created_at,
		weekendId: availableWeekendId(r, live),
		refKey: r.ref_key ? String(r.ref_key) : null
	})).filter((item) => item.kind !== "available" || item.weekendId != null);
});
function availableWeekendId(row, live) {
	const ref = String(row.ref_key || "");
	if (!ref.startsWith("available-")) return null;
	const id = Number(ref.slice(10));
	return live.has(id) ? id : null;
}
async function pruneAvailableNotices(sql) {
	const live = await sql`select id, name from weekends`;
	const liveIds = new Set(live.map((row) => Number(row.id)));
	const byName = /* @__PURE__ */ new Map();
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
			const id = Number(ref.slice(10));
			if (!liveIds.has(id)) await sql`delete from notifications where id = ${notice.id}`;
			continue;
		}
		const matches = byName.get(String(notice.title || "").trim().toLowerCase()) ?? [];
		if (matches.length !== 1) {
			await sql`delete from notifications where id = ${notice.id}`;
			continue;
		}
		const key = `available-${matches[0]}`;
		if ((await sql`select id from notifications where user_id = ${notice.user_id} and ref_key = ${key} limit 1`)[0]) await sql`delete from notifications where id = ${notice.id}`;
		else await sql`update notifications set kind = ${"available"}, ref_key = ${key} where id = ${notice.id}`;
	}
}
var markNotificationsRead_createServerFn_handler = createServerRpc({
	id: "f65bbfc1a3b34188257fa6bbecc61b2ec8f97545d8ff4bf099f4495f84c0f13e",
	name: "markNotificationsRead",
	filename: "src/lib/pbi/api.ts"
}, (opts) => markNotificationsRead.__executeServer(opts));
var markNotificationsRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	return { ids: Array.isArray(data?.ids) ? data.ids.filter((id) => Number.isInteger(id) && id > 0) : [] };
}).handler(markNotificationsRead_createServerFn_handler, async ({ context, data }) => {
	await applyViewAs(context);
	const sql = await getSql();
	for (const id of data.ids) await sql`update notifications set read = true where user_id = ${context.userId} and id = ${id} and read = false`;
	return { ok: true };
});
var listPendingRequests_createServerFn_handler = createServerRpc({
	id: "41df0f6bbd32d2b4206f75c0830e7234358c66f5e9f35c1709666b64695fdd55",
	name: "listPendingRequests",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listPendingRequests.__executeServer(opts));
var listPendingRequests = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listPendingRequests_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	await ensureSignupColumns();
	const sql = await getSql();
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
	const byUser = /* @__PURE__ */ new Map();
	for (const team of teams) {
		const list = byUser.get(team.user_id) ?? [];
		list.push({
			name: String(team.name),
			ageGroup: String(team.age_group)
		});
		byUser.set(team.user_id, list);
	}
	return rows.map((r) => {
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
			attempt: r.attempt
		};
	});
});
var listDirectory_createServerFn_handler = createServerRpc({
	id: "e0bd595604a0d1693da5a4c316cf0186a21033a2d79abc2796fed421ea1064e8",
	name: "listDirectory",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listDirectory.__executeServer(opts));
var listDirectory = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listDirectory_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	await ensureSuperuserColumn();
	return (await (await getSql())`
      select p.user_id, p.email, u.name as person_name, p.requested_role, p.home_role, p.request_status, p.is_superuser, p.can_manage_admins
      from profiles p
      left join "user" u on u.id = p.user_id
      order by p.created_at desc
    `).map((r) => ({
		userId: r.user_id,
		email: r.email,
		name: personName(r.person_name),
		requestedRole: r.requested_role,
		homeRole: r.home_role,
		requestStatus: r.request_status,
		isSuperuser: Boolean(r.is_superuser),
		canManageAdmins: Boolean(r.is_superuser) || Boolean(r.can_manage_admins)
	}));
});
function personName(value) {
	const raw = typeof value === "string" ? value.trim() : "";
	if (!raw) return null;
	return [
		"coach",
		"admin",
		"parent",
		"athlete",
		"user"
	].includes(raw.toLowerCase()) ? null : raw;
}
var removeAdministrator_createServerFn_handler = createServerRpc({
	id: "d71336413b36c59707a847994e92bc8107d569450b92fd9729e8815b53c9976f",
	name: "removeAdministrator",
	filename: "src/lib/pbi/api.ts"
}, (opts) => removeAdministrator.__executeServer(opts));
var removeAdministrator = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const userId = String(data?.userId ?? "").trim();
	if (!userId) throw new Error("Missing administrator.");
	return { userId };
}).handler(removeAdministrator_createServerFn_handler, async ({ context, data }) => {
	await requireAdminManager(context.userId);
	if (data.userId === context.userId) throw new Error("You can’t remove your own account.");
	await ensureSuperuserColumn();
	const sql = await getSql();
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
	return { ok: true };
});
var setSuperuser_createServerFn_handler = createServerRpc({
	id: "f9e7dbad43a34a0f065d5deb2d8ac372648c80d2499669b52f5f00fb7cdc6e8d",
	name: "setSuperuser",
	filename: "src/lib/pbi/api.ts"
}, (opts) => setSuperuser.__executeServer(opts));
var setSuperuser = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const userId = String(data?.userId ?? "").trim();
	if (!userId) throw new Error("Missing administrator.");
	return {
		userId,
		grant: Boolean(data?.grant)
	};
}).handler(setSuperuser_createServerFn_handler, async ({ context, data }) => {
	if (!(await requireSuperuser(context.userId)).canGrantSuperuser) throw new Error("Only the original superuser can grant that access.");
	if (data.userId === context.userId && !data.grant) throw new Error("You can’t remove your own superuser access.");
	await ensureSuperuserColumn();
	const sql = await getSql();
	const target = (await sql`
    select user_id, email, home_role from profiles where user_id = ${data.userId} limit 1
  `)[0];
	if (!target || target.home_role !== "admin") throw new Error("Only an administrator can manage other admins.");
	if (isSuperuserOwner(target.email)) throw new Error("That account already manages administrators.");
	await sql`update profiles set can_manage_admins = ${data.grant} where user_id = ${data.userId}`;
	return { ok: true };
});
var listViewCoaches_createServerFn_handler = createServerRpc({
	id: "79a895d8234a7c38179e51ab98042e959311f77ef7aa94c2c7776dd65e0c5221",
	name: "listViewCoaches",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listViewCoaches.__executeServer(opts));
var listViewCoaches = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listViewCoaches_createServerFn_handler, async ({ context }) => {
	await requireSuperuser(context.userId);
	await ensureSuperuserColumn();
	await ensureSignupColumns();
	const sql = await getSql();
	const me = (await sql`select view_as_coach_id from profiles where user_id = ${context.userId} limit 1`)[0];
	const people = await sql`
    select p.user_id, p.email, u.name as coach_name
    from profiles p
    left join "user" u on u.id = p.user_id
    where p.home_role = ${"coach"}
    order by coalesce(u.name, p.email) asc
  `;
	const teams = await sql`select user_id, name, age_group from coach_signup_teams order by id asc`;
	const byUser = /* @__PURE__ */ new Map();
	for (const team of teams) {
		const list = byUser.get(String(team.user_id)) ?? [];
		list.push(`${team.name} ${team.age_group}`);
		byUser.set(String(team.user_id), list);
	}
	return {
		viewingId: me?.view_as_coach_id ? String(me.view_as_coach_id) : null,
		coaches: people.map((row) => ({
			userId: String(row.user_id),
			name: String(row.coach_name || row.email || "Coach"),
			email: String(row.email || ""),
			team: (byUser.get(String(row.user_id)) ?? []).join(", ")
		}))
	};
});
var setViewCoach_createServerFn_handler = createServerRpc({
	id: "805a03b43c7488409173f1fb54174c9c489bf1436698d987ca7366a729ac94ad",
	name: "setViewCoach",
	filename: "src/lib/pbi/api.ts"
}, (opts) => setViewCoach.__executeServer(opts));
var setViewCoach = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ userId: typeof data?.userId === "string" ? data.userId.trim() : "" })).handler(setViewCoach_createServerFn_handler, async ({ context, data }) => {
	await requireSuperuser(context.userId);
	await ensureSuperuserColumn();
	const sql = await getSql();
	if (!data.userId) {
		await sql`update profiles set view_as_coach_id = null where user_id = ${context.userId}`;
		return { ok: true };
	}
	if (!(await sql`select user_id from profiles where user_id = ${data.userId} and home_role = ${"coach"} limit 1`)[0]) {
		await sql`update profiles set view_as_coach_id = null where user_id = ${context.userId}`;
		return {
			ok: true,
			missing: true
		};
	}
	await sql`update profiles set view_as_coach_id = ${data.userId} where user_id = ${context.userId}`;
	return { ok: true };
});
var listCoachDirectory_createServerFn_handler = createServerRpc({
	id: "061dc92b4c1140745de8badf1c908220e4823c7db74eaf7911b311dc2adf273c",
	name: "listCoachDirectory",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listCoachDirectory.__executeServer(opts));
var listCoachDirectory = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listCoachDirectory_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	await ensureSignupColumns();
	const sql = await getSql();
	const people = await sql`
    select p.user_id, p.email, p.phone, p.club, p.admin_note, p.home_role, u.name as coach_name
    from profiles p
    left join "user" u on u.id = p.user_id
    where p.home_role = ${"coach"}
    order by p.email asc
  `;
	const signupTeams = await sql`select user_id, name, age_group from coach_signup_teams order by id asc`;
	const byUser = /* @__PURE__ */ new Map();
	for (const team of signupTeams) {
		const list = byUser.get(team.user_id) ?? [];
		list.push({
			name: String(team.name),
			ageGroup: String(team.age_group)
		});
		byUser.set(team.user_id, list);
	}
	if (people.filter((row) => !byUser.get(row.user_id)?.length).length > 0) {
		const requests = await sql`
      select user_id, team_name
      from role_requests
      where requested_role = ${"coach"} and team_name is not null and btrim(team_name) <> ''
      order by created_at desc
    `;
		for (const row of requests) {
			if (byUser.get(row.user_id)?.length) continue;
			byUser.set(row.user_id, [{
				name: String(row.team_name),
				ageGroup: null
			}]);
		}
	}
	return people.map((row) => {
		const rawName = typeof row.coach_name === "string" ? row.coach_name.trim() : "";
		const generic = [
			"coach",
			"admin",
			"parent",
			"athlete"
		].includes(rawName.toLowerCase());
		return {
			userId: row.user_id,
			name: rawName && !generic ? rawName : null,
			email: String(row.email),
			phone: row.phone ? String(row.phone) : null,
			club: row.club ? String(row.club) : null,
			note: row.admin_note ? String(row.admin_note) : "",
			status: "approved",
			teams: byUser.get(row.user_id) ?? []
		};
	}).sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
});
function parseCoachEdit(data) {
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
	if (note.length > 1e3) throw new Error("Keep the note under 1000 characters.");
	const teams = parseSignupTeams(data?.teams);
	if (!teams) throw new Error("Add at least one team.");
	return {
		userId,
		name,
		phone,
		email,
		club: club || null,
		note,
		teams
	};
}
var updateCoachDirectory_createServerFn_handler = createServerRpc({
	id: "a369cc00b3080d7456f8b11a510f71bdda2a7a3fb91a0dbfd5561f89404676c5",
	name: "updateCoachDirectory",
	filename: "src/lib/pbi/api.ts"
}, (opts) => updateCoachDirectory.__executeServer(opts));
var updateCoachDirectory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(parseCoachEdit).handler(updateCoachDirectory_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureSignupColumns();
	const sql = await getSql();
	if (!(await sql`select user_id from profiles where user_id = ${data.userId} and home_role = ${"coach"} limit 1`)[0]) throw new Error("That coach is no longer on the list.");
	if ((await sql`select id from "user" where lower(email) = ${data.email} and id <> ${data.userId} limit 1`)[0]) throw new Error("Another account already uses that email.");
	const want = phoneLast10(data.phone);
	if ((await sql`select user_id, phone from profiles where phone is not null and user_id <> ${data.userId}`).some((row) => phoneLast10(String(row.phone || "")) === want)) throw new Error("Another account already uses that phone number.");
	await sql`update "user" set name = ${data.name}, email = ${data.email} where id = ${data.userId}`;
	await sql`
    update profiles
    set email = ${data.email}, phone = ${data.phone}, club = ${data.club}, admin_note = ${data.note || null}
    where user_id = ${data.userId}
  `;
	await sql`delete from coach_signup_teams where user_id = ${data.userId}`;
	for (const team of data.teams) await sql`insert into coach_signup_teams (user_id, name, age_group) values (${data.userId}, ${team.name}, ${team.ageGroup})`;
	return {
		userId: data.userId,
		name: data.name,
		email: data.email,
		phone: data.phone,
		club: data.club,
		note: data.note,
		status: "approved",
		teams: data.teams
	};
});
var getMyCoachAccount_createServerFn_handler = createServerRpc({
	id: "fad8b4dbea9298583ebe61c39d95b491efd7a64843d00c97d1b36adb1a247421",
	name: "getMyCoachAccount",
	filename: "src/lib/pbi/api.ts"
}, (opts) => getMyCoachAccount.__executeServer(opts));
var getMyCoachAccount = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMyCoachAccount_createServerFn_handler, async ({ context }) => {
	const profile = await loadProfile(context.userId);
	if (!profile || profile.homeRole !== "coach") throw new Error("Only a coach can edit this account.");
	await ensureSignupColumns();
	const sql = await getSql();
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
		teams: teams.map((team) => ({
			name: String(team.name),
			ageGroup: String(team.age_group)
		}))
	};
});
var updateMyCoachAccount_createServerFn_handler = createServerRpc({
	id: "9f9556d7246c141bfff5d236cfbfe671f5802664bcdc3c7f42bd627c0eb88fec",
	name: "updateMyCoachAccount",
	filename: "src/lib/pbi/api.ts"
}, (opts) => updateMyCoachAccount.__executeServer(opts));
var updateMyCoachAccount = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
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
	return {
		name,
		phone,
		email,
		club: club || null,
		password,
		teams
	};
}).handler(updateMyCoachAccount_createServerFn_handler, async ({ context, data }) => {
	const profile = await loadProfile(context.userId);
	if (!profile || profile.homeRole !== "coach") throw new Error("Only a coach can edit this account.");
	await ensureSignupColumns();
	const sql = await getSql();
	if ((await sql`select id from "user" where lower(email) = ${data.email} and id <> ${context.userId} limit 1`)[0]) throw new Error("Another account already uses that email.");
	const want = phoneLast10(data.phone);
	if ((await sql`select user_id, phone from profiles where phone is not null and user_id <> ${context.userId}`).some((row) => phoneLast10(String(row.phone || "")) === want)) throw new Error("Another account already uses that phone number.");
	const now = (/* @__PURE__ */ new Date()).toISOString();
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
		if (row) await sql`update coach_signup_teams set name = ${team.name}, age_group = ${team.ageGroup} where id = ${row.id}`;
		else await sql`insert into coach_signup_teams (user_id, name, age_group) values (${context.userId}, ${team.name}, ${team.ageGroup})`;
	}
	for (const row of existing.slice(data.teams.length)) {
		await sql`delete from coach_roster_players where team_id = ${row.id}`;
		await sql`delete from coach_signup_teams where id = ${row.id}`;
	}
	if (data.password) {
		const { hashPassword } = await import("./crypto-DT26Ia2u.mjs").then((n) => n.t).then((n) => n.t);
		const hash = await hashPassword(data.password);
		const account = (await sql`select id from "account" where "userId" = ${context.userId} and "providerId" = ${"credential"} limit 1`)[0];
		if (account) await sql`update "account" set password = ${hash}, "updatedAt" = ${now} where id = ${account.id}`;
	}
	return { ok: true };
});
var changeMyPassword_createServerFn_handler = createServerRpc({
	id: "76218d6253caeb618d82968d75d0cb8cc8ffcd387f8e4b9be049cbecd0deda8c",
	name: "changeMyPassword",
	filename: "src/lib/pbi/api.ts"
}, (opts) => changeMyPassword.__executeServer(opts));
var changeMyPassword = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const password = String(data?.password ?? "");
	if (password.length < 8) throw new Error("Password is too short. Use at least 8 characters.");
	return { password };
}).handler(changeMyPassword_createServerFn_handler, async ({ context, data }) => {
	const profile = await loadProfile(context.userId);
	if (!profile || profile.homeRole !== "coach") throw new Error("Only a coach can change this password.");
	const sql = await getSql();
	const account = (await sql`select id from "account" where "userId" = ${context.userId} and "providerId" = ${"credential"} limit 1`)[0];
	if (!account) throw new Error("This account does not use a password.");
	const { hashPassword } = await import("./crypto-DT26Ia2u.mjs").then((n) => n.t).then((n) => n.t);
	await sql`update "account" set password = ${await hashPassword(data.password)}, "updatedAt" = ${(/* @__PURE__ */ new Date()).toISOString()} where id = ${account.id}`;
	return { ok: true };
});
var addCoachDirectory_createServerFn_handler = createServerRpc({
	id: "899f5abfd9f7f3066b99cbbe53f4e9cf0688179db1eafdfa3c1c15c8b64f9ede",
	name: "addCoachDirectory",
	filename: "src/lib/pbi/api.ts"
}, (opts) => addCoachDirectory.__executeServer(opts));
var addCoachDirectory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
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
	return {
		name,
		phone,
		email,
		teamName,
		ageGroup
	};
}).handler(addCoachDirectory_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureSignupColumns();
	const sql = await getSql();
	if ((await sql`select id from "user" where lower(email) = ${data.email} limit 1`)[0]) throw new Error("Another account already uses that email.");
	const want = phoneLast10(data.phone);
	if ((await sql`select phone from profiles where phone is not null`).some((row) => phoneLast10(String(row.phone || "")) === want)) throw new Error("Another account already uses that phone number.");
	const id = crypto.randomUUID();
	const now = (/* @__PURE__ */ new Date()).toISOString();
	await sql`
    insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
    values (${id}, ${data.name}, ${data.email}, ${true}, ${now}, ${now})
  `;
	await sql`
    insert into profiles (user_id, email, phone, requested_role, home_role, request_status)
    values (${id}, ${data.email}, ${data.phone}, ${"coach"}, ${"coach"}, ${"none"})
  `;
	await sql`insert into coach_signup_teams (user_id, name, age_group) values (${id}, ${data.teamName}, ${data.ageGroup})`;
	return {
		userId: id,
		name: data.name,
		email: data.email,
		phone: data.phone,
		club: null,
		note: "",
		status: "approved",
		teams: [{
			name: data.teamName,
			ageGroup: data.ageGroup
		}]
	};
});
var removeCoachDirectory_createServerFn_handler = createServerRpc({
	id: "3228271748bfc6d9362a16783345ced83e70869a6d9547596293f23bb44c0844",
	name: "removeCoachDirectory",
	filename: "src/lib/pbi/api.ts"
}, (opts) => removeCoachDirectory.__executeServer(opts));
var removeCoachDirectory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const userId = String(data?.userId ?? "").trim();
	if (!userId) throw new Error("Missing coach.");
	return { userId };
}).handler(removeCoachDirectory_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	if (data.userId === context.userId) throw new Error("You can’t remove your own account here.");
	await ensureSignupColumns();
	const sql = await getSql();
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
	return { ok: true };
});
function parseCoachInvite(data) {
	const channel = data?.channel === "phone" || data?.channel === "email" ? data.channel : null;
	const destination = String(data?.destination ?? "").trim();
	if (!channel) throw new Error("Choose text or email.");
	if (channel === "phone") {
		if (destination.replace(/\D/g, "").length < 10) throw new Error("Enter a cell phone.");
		return {
			channel,
			destination
		};
	}
	const email = normalizeEmail(destination);
	if (!email.includes("@")) throw new Error("Enter an email.");
	return {
		channel,
		destination: email
	};
}
function mapCoachInvite(row) {
	return {
		id: row.id,
		channel: row.channel === "email" ? "email" : "phone",
		destination: String(row.destination),
		createdAt: new Date(row.created_at).toISOString(),
		accountEmail: row.account_email ? String(row.account_email) : null
	};
}
var listCoachInvites_createServerFn_handler = createServerRpc({
	id: "b4ccd1da253283c74829a8567b2610141d08d994a4cc03e4868e5de3559f5629",
	name: "listCoachInvites",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listCoachInvites.__executeServer(opts));
var listCoachInvites = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listCoachInvites_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	return (await (await getSql())`
    select i.id, i.channel, i.destination, i.created_at, p.email as account_email
    from coach_invites i
    left join profiles p on p.user_id = i.accepted_user_id
    order by i.created_at desc
  `).map(mapCoachInvite);
});
var createCoachInvite_createServerFn_handler = createServerRpc({
	id: "c2abb4a2c0bff04f2557eac42166414efda8bd1ebe76e6fbe8046e8da5f3e5de",
	name: "createCoachInvite",
	filename: "src/lib/pbi/api.ts"
}, (opts) => createCoachInvite.__executeServer(opts));
var createCoachInvite = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(parseCoachInvite).handler(createCoachInvite_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const created = (await (await getSql())`
    insert into coach_invites (channel, destination)
    values (${data.channel}, ${data.destination})
    returning id, channel, destination, created_at
  `)[0];
	if (!created) throw new Error("Could not save that invite.");
	return mapCoachInvite(created);
});
var reviewRequest_createServerFn_handler = createServerRpc({
	id: "a05a7009406408fc5484c7d1b65acc22606231294b7465a9387b5b2d9a691d59",
	name: "reviewRequest",
	filename: "src/lib/pbi/api.ts"
}, (opts) => reviewRequest.__executeServer(opts));
var reviewRequest = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	if (!data || typeof data.id !== "number") throw new Error("Missing request.");
	if (data.action !== "approve" && data.action !== "deny") throw new Error("Choose Approve or Deny.");
	return data;
}).handler(reviewRequest_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const sql = await getSql();
	const req = (await sql`
      select id, user_id, requested_role, status
      from role_requests
      where id = ${data.id}
      limit 1
    `)[0];
	if (!req || req.status !== "pending") throw new Error("That request is no longer pending.");
	if (req.user_id === context.userId) throw new Error("You can’t review your own request.");
	if (req.requested_role === "admin") {
		if (!(await loadProfile(context.userId))?.canManageAdmins) throw new Error("Only someone allowed to manage admins can approve that.");
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
		if (req.requested_role !== "coach") await insertNotification(req.user_id, `${label} access approved`, `An Admin approved your ${label} access. Open home to use ${label} tools.`);
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
var reviewNewCoach_createServerFn_handler = createServerRpc({
	id: "50229f9186de129833534cce7bef46c81d36e1d32f971268495180593684ea05",
	name: "reviewNewCoach",
	filename: "src/lib/pbi/api.ts"
}, (opts) => reviewNewCoach.__executeServer(opts));
var reviewNewCoach = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const userId = String(data?.userId ?? "").trim();
	if (!userId) throw new Error("Missing coach.");
	if (data?.action !== "keep" && data?.action !== "remove") throw new Error("Choose keep or remove.");
	return {
		userId,
		action: data.action
	};
}).handler(reviewNewCoach_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const sql = await getSql();
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
	} else await wipeUserAccount(sql, data.userId);
	await sql`delete from notifications where ref_key = ${`coach-signup-${data.userId}`}`;
	return { ok: true };
});
var resubmitCoachAccess_createServerFn_handler = createServerRpc({
	id: "41c1ab095d2d8843b24ea9ef959334dd1c0aba6c8a4e8254e5ae70e56d5ed9dc",
	name: "resubmitCoachAccess",
	filename: "src/lib/pbi/api.ts"
}, (opts) => resubmitCoachAccess.__executeServer(opts));
var resubmitCoachAccess = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => parseCoachAccess(data ?? {})).handler(resubmitCoachAccess_createServerFn_handler, async ({ context, data }) => {
	const profile = await loadProfile(context.userId);
	if (!profile) throw new Error("Finish creating your account first.");
	const sql = await getSql();
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
var listWeekends_createServerFn_handler = createServerRpc({
	id: "816957ecb3065744a2bd9b65aab290763b47e2aea31cc552e57ee165ae3c4eb6",
	name: "listWeekends",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listWeekends.__executeServer(opts));
var listWeekends = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listWeekends_createServerFn_handler, async ({ context }) => {
	await requireScheduleReader(context.userId);
	await ensureLiveOpsColumns();
	await pullTournamentsBackIntoEvents();
	await retireAnnouncedEvents();
	return (await (await getSql())`
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
function dayText(value) {
	if (value instanceof Date) return isoDateFromLocal(value);
	return String(value ?? "").slice(0, 10);
}
async function loadStoredWindows() {
	const rows = await (await getSql())`
    select season, season_year, start_date::text as start_date, end_date::text as end_date
    from season_windows
  `;
	const out = [];
	for (const row of rows) {
		if (!isSeason(row.season)) continue;
		const year = Number(row.season_year);
		const startDate = dayText(row.start_date);
		const endDate = dayText(row.end_date);
		if (!Number.isInteger(year)) continue;
		out.push({
			season: row.season,
			year,
			startDate,
			endDate
		});
	}
	return out;
}
function windowFor(stored, season, year) {
	return stored.find((row) => row.season === season && row.year === year) ?? defaultSeasonWindow(season, year);
}
async function loadPlanningYear() {
	const sql = await getSql();
	await sql`
    insert into season_planning (id, planning_year)
    values (1, ${FIRST_SEASON_YEAR})
    on conflict (id) do nothing
  `;
	const row = (await sql`select planning_year from season_planning where id = 1`)[0];
	let year = Number(row?.planning_year);
	if (!Number.isInteger(year) || year < 2026) year = FIRST_SEASON_YEAR;
	if (year === 2027) {
		const fall = windowFor(await loadStoredWindows(), "fall", FIRST_SEASON_YEAR);
		const today = isoDateFromLocal(/* @__PURE__ */ new Date());
		if (!archiveIsDue(today, fall.endDate)) {
			await sql`update season_planning set planning_year = ${FIRST_SEASON_YEAR} where id = 1 and planning_year = ${year}`;
			year = FIRST_SEASON_YEAR;
		}
	}
	return year;
}
function rolloverFor(stored, year, today) {
	const fall = windowFor(stored, "fall", year);
	if (!archiveIsDue(today, fall.endDate)) return null;
	return {
		year,
		nextYear: year + 1,
		fallEnd: fall.endDate
	};
}
function neighborWindows(stored, season, year) {
	const out = [];
	for (const y of [
		year - 1,
		year,
		year + 1
	]) for (const name of [
		"spring",
		"summer",
		"fall"
	]) {
		if (name === season && y === year) continue;
		out.push(windowFor(stored, name, y));
	}
	return out;
}
function parseSeasonRequest(data) {
	if (!isSeason(data?.season)) throw new Error("Pick Spring, Summer, or Fall.");
	const today = isoDateFromLocal(/* @__PURE__ */ new Date());
	const fallback = preferredSeasonYear(data.season, today);
	const year = Number(data?.year);
	if (!Number.isInteger(year) || year < fallback - 1 || year > fallback + 2) return {
		season: data.season,
		year: fallback
	};
	return {
		season: data.season,
		year
	};
}
async function buildSeasonPlan(season, year, warnings = []) {
	const sql = await getSql();
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
	const byStart = /* @__PURE__ */ new Map();
	for (const row of rows) {
		const key = dayText(row.start_date);
		const list = byStart.get(key) ?? [];
		list.push(row);
		byStart.set(key, list);
	}
	const weekends = seasonSaturdays(window.startDate, window.endDate).map((slot) => {
		const hits = byStart.get(slot.startDate) ?? [];
		const announced = hits.find((row) => row.lifecycle === "announced");
		const live = hits.find((row) => row.lifecycle !== "announced");
		const row = announced ?? live ?? null;
		const approved = Number(row?.approved_count ?? 0);
		const hasGames = Boolean(row?.has_games);
		const blocked = Boolean(row) && (row.lifecycle !== "announced" || approved > 0 || hasGames);
		const name = announcedWeekendName(slot.startDate, slot.endDate);
		let blockReason = null;
		if (blocked && row?.lifecycle !== "announced") blockReason = `${name} is already a full tournament.`;
		else if (blocked) blockReason = `${name} has teams — open the tournament to cancel.`;
		return {
			startDate: slot.startDate,
			endDate: slot.endDate,
			name: row?.lifecycle === "announced" && row.name ? String(row.name) : name,
			weekendId: row ? Number(row.id) : null,
			selected: Boolean(row),
			blocked,
			blockReason
		};
	});
	const selected = weekends.filter((slot) => slot.selected).map((slot) => slot.startDate);
	const deadline = softDeadline(window.startDate, selected[0] ?? null);
	const today = isoDateFromLocal(/* @__PURE__ */ new Date());
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
		rollover: rolloverFor(stored, year, today)
	};
}
var listSeasonCards_createServerFn_handler = createServerRpc({
	id: "6d1bf9024dafe50c2bbeb22c6956e49d08ff8da81ab5ffa9d9d6b6a0539498b3",
	name: "listSeasonCards",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listSeasonCards.__executeServer(opts));
var listSeasonCards = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listSeasonCards_createServerFn_handler, async ({ context }) => {
	const reader = await requireScheduleReader(context.userId);
	await ensureLiveOpsColumns();
	if (reader.homeRole === "admin") await ensureFinalizeNotices(context.userId);
	await retireAnnouncedEvents();
	const today = isoDateFromLocal(/* @__PURE__ */ new Date());
	const stored = await loadStoredWindows();
	const year = await loadPlanningYear();
	const cards = [];
	for (const season of [
		"spring",
		"summer",
		"fall"
	]) {
		const window = windowFor(stored, season, year);
		const countRow = (await (await getSql())`
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
			deadlineCopy: softDeadlineCopy(season, deadline)
		});
	}
	return {
		cards,
		rollover: rolloverFor(stored, year, today)
	};
});
var getSeasonPlan_createServerFn_handler = createServerRpc({
	id: "973a296f458a4c721d72bce83f7660a1deff719c217ef395332ea60bae452e0c",
	name: "getSeasonPlan",
	filename: "src/lib/pbi/api.ts"
}, (opts) => getSeasonPlan.__executeServer(opts));
var getSeasonPlan = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => parseSeasonRequest(data)).handler(getSeasonPlan_createServerFn_handler, async ({ context, data }) => {
	await requireScheduleReader(context.userId);
	await ensureLiveOpsColumns();
	const year = await loadPlanningYear();
	return buildSeasonPlan(data.season, year);
});
var archivePlanningYear_createServerFn_handler = createServerRpc({
	id: "fcdefe219b8b6f8f1f72703f052c695eb82a73f07f8a3ae55e716cad48ef6d90",
	name: "archivePlanningYear",
	filename: "src/lib/pbi/api.ts"
}, (opts) => archivePlanningYear.__executeServer(opts));
var archivePlanningYear = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(archivePlanningYear_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const year = await loadPlanningYear();
	const stored = await loadStoredWindows();
	const today = isoDateFromLocal(/* @__PURE__ */ new Date());
	const fall = windowFor(stored, "fall", year);
	if (!archiveIsDue(today, fall.endDate)) throw new Error("Wait two weeks after Fall ends before you archive the year.");
	const next = year + 1;
	await (await getSql())`update season_planning set planning_year = ${next} where id = 1 and planning_year = ${year}`;
	const now = await loadPlanningYear();
	if (now !== next) throw new Error("Could not archive that year. Try again.");
	return { year: now };
});
var saveSeasonSchedule_createServerFn_handler = createServerRpc({
	id: "f2cb395bda3a11a9d58dcf182a3e61dca214de816ddfdd69bf65e13485506468",
	name: "saveSeasonSchedule",
	filename: "src/lib/pbi/api.ts"
}, (opts) => saveSeasonSchedule.__executeServer(opts));
var saveSeasonSchedule = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const seasonYear = parseSeasonRequest(data);
	const startDate = typeof data?.startDate === "string" ? data.startDate.slice(0, 10) : "";
	const endDate = typeof data?.endDate === "string" ? data.endDate.slice(0, 10) : "";
	if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < startDate) throw new Error("Pick a start and an end for this season.");
	const saturdays = Array.isArray(data?.saturdays) ? data.saturdays.filter((value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) : [];
	return {
		...seasonYear,
		startDate,
		endDate,
		saturdays,
		notify: data?.notify !== false
	};
}).handler(saveSeasonSchedule_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const openYear = await loadPlanningYear();
	if (data.year !== openYear) throw new Error("That year is not open. Archive the current year first.");
	const sql = await getSql();
	await sql`
    insert into season_windows (season, season_year, start_date, end_date)
    values (${data.season}, ${data.year}, ${data.startDate}, ${data.endDate})
    on conflict (season, season_year)
    do update set start_date = ${data.startDate}, end_date = ${data.endDate}
  `;
	if (data.notify) await notifySeasonCoaches(sql, data.season);
	return buildSeasonPlan(data.season, data.year);
});
var pushSeasonToCoaches_createServerFn_handler = createServerRpc({
	id: "17bb6db641cf23329b1d89638026e22600027a83a3cce6fe9039a3e7381a2fa3",
	name: "pushSeasonToCoaches",
	filename: "src/lib/pbi/api.ts"
}, (opts) => pushSeasonToCoaches.__executeServer(opts));
var pushSeasonToCoaches = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => parseSeasonRequest(data)).handler(pushSeasonToCoaches_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	await notifySeasonCoaches(await getSql(), data.season);
	return { ok: true };
});
async function notifySeasonCoaches(sql, season) {
	const coaches = await sql`select user_id from profiles where home_role = ${"coach"}`;
	const label = seasonLabel(season);
	for (const coach of coaches) await insertNotification(coach.user_id, `${label} schedule updated`, `${label} schedule updated — open Schedule to see it.`);
}
function reminderCopy(choice, name, when) {
	const event = `${name}, ${when}`;
	if (choice === "interested") return `This is a reminder of the upcoming tournament, ${event}. We are still gaining interest.`;
	if (choice === "maybe") return `This is a reminder of the upcoming tournament, ${event}. We are still gaining interest. You marked not sure yet.`;
	if (choice === "no") return `We still have several spots available for ${event} if you change your mind.`;
	return `${name} is on the schedule for ${when}. Open Schedule if your team is interested.`;
}
function responseChoice(value) {
	return value === "interested" || value === "maybe" || value === "no" ? value : null;
}
async function eventReminderCoaches(sql, weekendId) {
	const people = await textCoaches(sql);
	const responses = await sql`select coach_user_id, choice from tournament_responses where weekend_id = ${weekendId}`;
	const choiceOf = /* @__PURE__ */ new Map();
	for (const row of responses) choiceOf.set(String(row.coach_user_id), String(row.choice));
	return people.map((person) => ({
		...person,
		choice: responseChoice(choiceOf.get(person.userId))
	}));
}
var openReminderTexts_createServerFn_handler = createServerRpc({
	id: "324c55ac575ba2f54eaac9c28b2b1f4922b1dd0a9cfa46e2bdfb9d33ba306047",
	name: "openReminderTexts",
	filename: "src/lib/pbi/api.ts"
}, (opts) => openReminderTexts.__executeServer(opts));
var openReminderTexts = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
	includeNotInterested: data?.includeNotInterested === true
})).handler(openReminderTexts_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	await ensureSignupColumns();
	const sql = await getSql();
	const weekend = (await sql`select id, name, age_groups, start_date::text as start_date, end_date::text as end_date from weekends where id = ${data.weekendId} limit 1`)[0];
	if (!weekend) throw new Error("That tournament is gone.");
	const coaches = (await eventReminderCoaches(sql, data.weekendId)).filter((coach) => data.includeNotInterested || coach.choice !== "no");
	return {
		name: nameWithAges(String(weekend.name || "A tournament"), parseStoredAgeGroups(weekend.age_groups)),
		startDate: String(weekend.start_date).slice(0, 10),
		endDate: String(weekend.end_date).slice(0, 10),
		coaches
	};
});
var promoteTournament_createServerFn_handler = createServerRpc({
	id: "9ea8317e4fb33582b32f8d7548daf34dc81b42814218de4cbe41a28b4e180df0",
	name: "promoteTournament",
	filename: "src/lib/pbi/api.ts"
}, (opts) => promoteTournament.__executeServer(opts));
var promoteTournament = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
	includeNotInterested: data?.includeNotInterested === true
})).handler(promoteTournament_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	await ensureSignupColumns();
	const sql = await getSql();
	const weekend = (await sql`select id, name, lifecycle, age_groups, start_date::text as start_date, end_date::text as end_date from weekends where id = ${data.weekendId} limit 1`)[0];
	if (!weekend) throw new Error("That tournament is gone.");
	const name = nameWithAges(String(weekend.name || "A tournament"), parseStoredAgeGroups(weekend.age_groups));
	const when = announcedWeekendName(String(weekend.start_date).slice(0, 10), String(weekend.end_date).slice(0, 10));
	const coaches = await eventReminderCoaches(sql, weekend.id);
	const notInterested = coaches.filter((coach) => coach.choice === "no").map((coach) => ({
		userId: coach.userId,
		name: coach.name,
		teams: coach.teams.map((team) => team.ageGroup ? `${team.name} · ${team.ageGroup}` : team.name)
	}));
	if (notInterested.length > 0 && !data.includeNotInterested) return {
		sent: 0,
		blocked: true,
		notInterested
	};
	const refKey = `available-${weekend.id}`;
	for (const coach of coaches) {
		const body = reminderCopy(coach.choice, name, when);
		const existing = (await sql`select id from notifications where user_id = ${coach.userId} and ref_key = ${refKey} limit 1`)[0];
		if (existing) await sql`update notifications set title = ${name}, body = ${body}, kind = ${"available"}, read = false where id = ${existing.id}`;
		else await sql`
        insert into notifications (user_id, title, body, kind, ref_key)
        values (${coach.userId}, ${name}, ${body}, ${"available"}, ${refKey})
      `;
	}
	return {
		sent: coaches.length,
		blocked: false,
		notInterested: []
	};
});
var createWeekend_createServerFn_handler = createServerRpc({
	id: "9ca669b6da636b62343881ed5465381b1938c745ccea8d76edece5491bab4832",
	name: "createWeekend",
	filename: "src/lib/pbi/api.ts"
}, (opts) => createWeekend.__executeServer(opts));
var createWeekend = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const parsed = parseWeekendInput(data);
	let season = isSeason(data?.season) ? data.season : null;
	const year = Number(data?.year);
	let seasonYear = Number.isInteger(year) && year > 2e3 && year < 2100 ? year : null;
	if (!season || seasonYear == null) {
		const inferred = seasonFromDate(parsed.startDate);
		if (inferred) {
			season = season ?? inferred.season;
			seasonYear = seasonYear ?? inferred.year;
		}
	}
	return {
		...parsed,
		season,
		seasonYear
	};
}).handler(createWeekend_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql = await getSql();
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
	const event = (await sql`
    select id, name from weekends
    where lifecycle = ${"announced"}
      and start_date <= ${start}
      and end_date >= ${start}
  `).find((row) => String(created.name || "").startsWith(String(row.name || "").trim()));
	if (event) {
		const coaches = await sql`
      select coach_user_id from tournament_responses
      where weekend_id = ${event.id} and choice = ${"interested"}
    `;
		for (const coach of coaches) await insertNotification(coach.coach_user_id, nameWithAges(String(created.name), data.ageGroups), `${nameWithAges(String(created.name), data.ageGroups)} was created for ${event.name}. Open Schedule to see it.`, "teams", `created-${created.id}-${coach.coach_user_id}`);
	}
	for (const ageGroup of data.ageGroups) await sql`
        insert into weekend_age_groups (weekend_id, age_group, min_teams, max_teams)
        values (${created.id}, ${ageGroup}, ${3}, ${data.maxTeams})
        on conflict (weekend_id, age_group) do nothing
      `;
	const locationCount = await writeCoachShell(mapWeekend({
		...created,
		location_count: 0,
		approved_count: 0,
		public_dirty: true
	}));
	return mapWeekend({
		...created,
		location_count: locationCount,
		approved_count: 0,
		public_dirty: true
	});
});
var announceTournament_createServerFn_handler = createServerRpc({
	id: "ec846b4691675baec265cd5a4c49630d2e516588cba1b46fb2bfbba011875a34",
	name: "announceTournament",
	filename: "src/lib/pbi/api.ts"
}, (opts) => announceTournament.__executeServer(opts));
var announceTournament = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const name = typeof data?.name === "string" ? data.name.trim() : "";
	const startDate = typeof data?.startDate === "string" ? data.startDate.slice(0, 10) : "";
	const endDate = typeof data?.endDate === "string" ? data.endDate.slice(0, 10) : "";
	if (!name || name.length > 80) throw new Error("Name the tournament.");
	if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < startDate) throw new Error("Check the dates.");
	if (!isSeason(data?.season)) throw new Error("Pick a season.");
	const year = Number(data?.year);
	if (!Number.isInteger(year) || year < 2e3 || year > 2100) throw new Error("Pick a year.");
	return {
		name,
		startDate,
		endDate,
		season: data.season,
		year,
		notify: data?.notify !== false
	};
}).handler(announceTournament_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const created = (await (await getSql())`
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
	return mapWeekend({
		...created,
		location_count: 0,
		approved_count: 0,
		interest_count: 0,
		public_dirty: true
	});
});
function coachFacingName(raw, email) {
	const name = typeof raw === "string" ? raw.trim() : "";
	const generic = [
		"coach",
		"admin",
		"parent",
		"athlete"
	].includes(name.toLowerCase());
	if (name && !generic) return name;
	return (typeof email === "string" ? email.trim() : "") || "Coach";
}
function batchIdList(value) {
	return [...new Set(String(value || "").split(",").map((part) => Number(part)).filter((id) => Number.isInteger(id) && id > 0))];
}
async function announcedInSeason(sql, season, year) {
	const rows = await sql`
    select id, name, start_date::text as start_date, end_date::text as end_date, age_groups, season, season_year
    from weekends
    where lifecycle <> ${"announced"}
    order by start_date asc, id asc
  `;
	const matched = [];
	for (const row of rows) {
		const startDate = String(row.start_date).slice(0, 10);
		const stored = isSeason(row.season) && Number(row.season_year) === year && row.season === season;
		const inferred = !isSeason(row.season) ? seasonFromDate(startDate) : null;
		if (!(stored || inferred != null && inferred.season === season && inferred.year === year)) continue;
		if (!stored && inferred) await sql`
        update weekends set season = ${season}, season_year = ${year}
        where id = ${row.id} and season is null
      `;
		matched.push({
			id: Number(row.id),
			name: String(row.name),
			startDate,
			endDate: String(row.end_date).slice(0, 10),
			ageGroups: parseStoredAgeGroups(row.age_groups)
		});
	}
	return matched;
}
async function textBatches(sql, season, year) {
	return (await sql`
    select id, weekend_ids from coach_text_batches
    where season = ${season} and season_year = ${year}
    order by id asc
  `).map((row) => ({
		id: Number(row.id),
		weekendIds: batchIdList(row.weekend_ids)
	}));
}
async function textCoaches(sql) {
	await ensureSignupColumns();
	const people = await sql`
    select p.user_id, p.email, p.phone, u.name as coach_name
    from profiles p
    left join "user" u on u.id = p.user_id
    where p.home_role = ${"coach"}
  `;
	const signupTeams = await sql`select user_id, name, age_group from coach_signup_teams order by id asc`;
	const byUser = /* @__PURE__ */ new Map();
	for (const team of signupTeams) {
		const list = byUser.get(team.user_id) ?? [];
		list.push({
			name: String(team.name),
			ageGroup: team.age_group ? String(team.age_group) : null
		});
		byUser.set(team.user_id, list);
	}
	return people.map((row) => ({
		userId: String(row.user_id),
		name: coachFacingName(row.coach_name, row.email),
		phone: row.phone ? String(row.phone) : null,
		teams: byUser.get(row.user_id) ?? []
	}));
}
async function registeredOnEvery(sql, weekendIds) {
	if (weekendIds.length === 0) return /* @__PURE__ */ new Set();
	const hits = /* @__PURE__ */ new Map();
	function mark(userId, weekendId) {
		const id = String(userId || "");
		if (!id) return;
		const set = hits.get(id) ?? /* @__PURE__ */ new Set();
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
	const ready = /* @__PURE__ */ new Set();
	for (const [userId, weekends] of hits) if (weekendIds.every((id) => weekends.has(id))) ready.add(userId);
	return ready;
}
async function batchView(sql, batchId, season, year, hadPriorBatch) {
	const batch = (await sql`select id, weekend_ids from coach_text_batches where id = ${batchId} limit 1`)[0];
	if (!batch) throw new Error("That text list is gone.");
	const ids = batchIdList(batch.weekend_ids);
	const announced = await announcedInSeason(sql, season, year);
	const events = ids.map((id) => announced.find((event) => event.id === id)).filter((event) => Boolean(event));
	const openedRows = await sql`select coach_user_id from coach_text_opens where batch_id = ${batchId}`;
	const opened = new Set(openedRows.map((row) => String(row.coach_user_id)));
	const registered = await registeredOnEvery(sql, ids);
	const coaches = (await textCoaches(sql)).map((coach) => ({
		...coach,
		opened: opened.has(coach.userId),
		registered: registered.has(coach.userId)
	}));
	return {
		batchId,
		kind: coachTextKind(events.length, hadPriorBatch),
		season,
		year,
		events,
		coaches,
		linkPath: `/interest?e=${ids.join(",")}`
	};
}
function parseSeasonYear(data) {
	if (!isSeason(data?.season)) throw new Error("Pick a season.");
	const year = Number(data?.year);
	if (!Number.isInteger(year) || year < 2e3 || year > 2100) throw new Error("Pick a year.");
	return {
		season: data.season,
		year
	};
}
var coachTextStatus_createServerFn_handler = createServerRpc({
	id: "b3e5874957ef257b3bd46a7f5b9518f0ff4c235c32cb2ddabe943f50c484caf0",
	name: "coachTextStatus",
	filename: "src/lib/pbi/api.ts"
}, (opts) => coachTextStatus.__executeServer(opts));
var coachTextStatus = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(parseSeasonYear).handler(coachTextStatus_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql = await getSql();
	const announced = await announcedInSeason(sql, data.season, data.year);
	const batches = await textBatches(sql, data.season, data.year);
	const covered = new Set(batches.flatMap((batch) => batch.weekendIds));
	const uncovered = announced.filter((event) => !covered.has(event.id));
	const unsent = uncovered.length;
	const unsentWeekendIds = uncovered.map((event) => event.id);
	const phoneIds = (await textCoaches(sql)).filter((coach) => phoneLast10(coach.phone || "")).map((coach) => coach.userId);
	let finishBatchId = null;
	let finishLeft = 0;
	let finishWeekendIds = [];
	for (const batch of batches) {
		const openedRows = await sql`select coach_user_id from coach_text_opens where batch_id = ${batch.id}`;
		const opened = new Set(openedRows.map((row) => String(row.coach_user_id)));
		const left = phoneIds.filter((id) => !opened.has(id)).length;
		if (left > 0) {
			finishBatchId = batch.id;
			finishLeft = left;
			finishWeekendIds = batch.weekendIds;
			break;
		}
	}
	return {
		unsent,
		unsentWeekendIds,
		finishBatchId,
		finishLeft,
		finishWeekendIds
	};
});
async function notifyCoachesAboutEvents(sql, events) {
	if (events.length === 0) return;
	const coaches = await sql`select user_id from profiles where home_role = ${"coach"}`;
	for (const event of events) {
		const when = announcedWeekendName(event.startDate, event.endDate);
		const name = nameWithAges(event.name, event.ageGroups ?? []);
		for (const coach of coaches) await insertNotification(coach.user_id, name, `${name} is on the schedule for ${when}. Open Schedule if your team is interested.`, "available", `available-${event.id}`);
	}
}
var openCoachTexts_createServerFn_handler = createServerRpc({
	id: "210f02ffb86235e9e0cde301e43cdf36888917d7ef605069b15ca569272b5844",
	name: "openCoachTexts",
	filename: "src/lib/pbi/api.ts"
}, (opts) => openCoachTexts.__executeServer(opts));
var openCoachTexts = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const seasonYear = parseSeasonYear(data);
	const batchId = data?.batchId == null || data?.batchId === "" ? null : parsePositiveInt(data.batchId, "Missing text list.");
	const weekendId = data?.weekendId == null || data?.weekendId === "" ? null : parsePositiveInt(data.weekendId, "Missing event.");
	return {
		...seasonYear,
		batchId,
		weekendId
	};
}).handler(openCoachTexts_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql = await getSql();
	const batches = await textBatches(sql, data.season, data.year);
	if (data.batchId != null) {
		const known = batches.find((batch) => batch.id === data.batchId);
		if (!known) throw new Error("That text list is gone.");
		const prior = batches.some((batch) => batch.id < known.id);
		return batchView(sql, known.id, data.season, data.year, prior);
	}
	const announced = await announcedInSeason(sql, data.season, data.year);
	const covered = new Set(batches.flatMap((batch) => batch.weekendIds));
	let chosen = announced.filter((event) => !covered.has(event.id));
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
var markCoachTextOpened_createServerFn_handler = createServerRpc({
	id: "b4fd0ad5040ddd1a5f904ab9f069b3b7a7b1009a10fa1f3c4d6cf414cf8b72b9",
	name: "markCoachTextOpened",
	filename: "src/lib/pbi/api.ts"
}, (opts) => markCoachTextOpened.__executeServer(opts));
var markCoachTextOpened = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	batchId: parsePositiveInt(data?.batchId, "Missing text list."),
	coachUserId: String(data?.coachUserId ?? "").trim()
})).handler(markCoachTextOpened_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	if (!data.coachUserId) throw new Error("Missing coach.");
	await ensureLiveOpsColumns();
	await (await getSql())`
    insert into coach_text_opens (batch_id, coach_user_id)
    values (${data.batchId}, ${data.coachUserId})
    on conflict (batch_id, coach_user_id) do nothing
  `;
	return { ok: true };
});
var updateAnnouncedEvent_createServerFn_handler = createServerRpc({
	id: "a45b82bd012b880ab87e4b3f8d2f4d9b9e8b091eaa0edc9f21fb77db256201c2",
	name: "updateAnnouncedEvent",
	filename: "src/lib/pbi/api.ts"
}, (opts) => updateAnnouncedEvent.__executeServer(opts));
var updateAnnouncedEvent = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const weekendId = parsePositiveInt(data?.weekendId, "Missing event.");
	const name = typeof data?.name === "string" ? data.name.trim() : "";
	const startDate = typeof data?.startDate === "string" ? data.startDate.slice(0, 10) : "";
	const endDate = typeof data?.endDate === "string" ? data.endDate.slice(0, 10) : "";
	if (!name || name.length > 80) throw new Error("Name the event.");
	if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < startDate) throw new Error("Check the dates.");
	return {
		weekendId,
		name,
		startDate,
		endDate,
		matchTournaments: data?.matchTournaments === true
	};
}).handler(updateAnnouncedEvent_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const sql = await getSql();
	const row = (await sql`
    select id, lifecycle, start_date::text as start_date, end_date::text as end_date
    from weekends where id = ${data.weekendId} limit 1
  `)[0];
	if (!row || row.lifecycle !== "announced") throw new Error("Open the tournament to change that name or those dates.");
	const oldStart = String(row.start_date).slice(0, 10);
	const oldEnd = String(row.end_date).slice(0, 10);
	const datesChanged = oldStart !== data.startDate || oldEnd !== data.endDate;
	const inside = datesChanged ? await sql`
      select id, name, pool_play, start_date::text as start_date, end_date::text as end_date
      from weekends
      where id <> ${data.weekendId}
        and lifecycle <> ${"announced"}
        and start_date >= ${oldStart}
        and end_date <= ${oldEnd}
      order by name
    ` : [];
	const shift = datesChanged ? Math.round((Date.parse(`${data.startDate}T00:00:00Z`) - Date.parse(`${oldStart}T00:00:00Z`)) / 864e5) : 0;
	const outside = inside.filter((item) => {
		const nextStart = addDays(String(item.start_date).slice(0, 10), shift);
		const nextEnd = addDays(String(item.end_date).slice(0, 10), shift);
		return nextStart < data.startDate || nextEnd > data.endDate || nextStart !== String(item.start_date).slice(0, 10) || nextEnd !== String(item.end_date).slice(0, 10);
	});
	if (outside.length > 0 && !data.matchTournaments) {
		const names = outside.map((item) => item.name).join(", ");
		throw new Error(`Those dates would leave ${names} outside this event.`);
	}
	for (const item of inside) {
		let nextStart = addDays(String(item.start_date).slice(0, 10), shift);
		let nextEnd = addDays(String(item.end_date).slice(0, 10), shift);
		if (nextStart < data.startDate) nextStart = data.startDate;
		if (nextEnd > data.endDate) nextEnd = data.endDate;
		if (nextEnd < nextStart) nextEnd = nextStart;
		const plan = defaultDayPlan(nextStart, nextEnd).map((day) => item.pool_play === false ? {
			...day,
			kind: "bracket"
		} : day);
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
var showInterest_createServerFn_handler = createServerRpc({
	id: "4c80de3015dd0bb9e58e23b52d14f66219bc793543834b8bcab68b7dd3dc5db5",
	name: "showInterest",
	filename: "src/lib/pbi/api.ts"
}, (opts) => showInterest.__executeServer(opts));
var showInterest = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const teamName = typeof data?.teamName === "string" ? data.teamName.trim() : "";
	if (!teamName || teamName.length > 80) throw new Error("Name the team.");
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		teamName
	};
}).handler(showInterest_createServerFn_handler, async ({ context, data }) => {
	await actAsCoach(context);
	await ensureLiveOpsColumns();
	const sql = await getSql();
	const weekend = (await sql`select id, lifecycle, end_date::text as end_date from weekends where id = ${data.weekendId} limit 1`)[0];
	if (!weekend || weekend.lifecycle !== "announced") throw new Error("That tournament is not taking interest yet.");
	if (String(weekend.end_date).slice(0, 10) < isoDateFromLocal(/* @__PURE__ */ new Date())) throw new Error("That tournament is already over.");
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
var listMyInterest_createServerFn_handler = createServerRpc({
	id: "ae18c82cbf1997f571f7279f62246b4279edbff83501e54152eed69e7f7cd07a",
	name: "listMyInterest",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listMyInterest.__executeServer(opts));
var listMyInterest = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listMyInterest_createServerFn_handler, async ({ context }) => {
	await actAsCoach(context);
	await ensureLiveOpsColumns();
	return (await (await getSql())`
    select id, weekend_id, team_name
    from tournament_interest
    where coach_user_id = ${context.userId}
    order by id asc
  `).map((row) => ({
		id: row.id,
		weekendId: row.weekend_id,
		teamName: row.team_name
	}));
});
var listMyCoachTeams_createServerFn_handler = createServerRpc({
	id: "38068aa53c2ca8a1bab64cf426f27f414765c095284a353c114cec357267ccf0",
	name: "listMyCoachTeams",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listMyCoachTeams.__executeServer(opts));
var listMyCoachTeams = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listMyCoachTeams_createServerFn_handler, async ({ context }) => {
	await actAsCoach(context);
	await ensureSignupColumns();
	const sql = await getSql();
	const rows = await sql`select name, age_group from coach_signup_teams where user_id = ${context.userId} order by id asc`;
	if (rows.length > 0) return rows.map((row) => ({
		name: String(row.name),
		ageGroup: row.age_group ? String(row.age_group) : null
	}));
	const request = (await sql`
    select team_name from role_requests
    where user_id = ${context.userId} and requested_role = ${"coach"} and team_name is not null and btrim(team_name) <> ''
    order by created_at desc
    limit 1
  `)[0];
	if (!request) return [];
	return [{
		name: String(request.team_name),
		ageGroup: null
	}];
});
var saveMyCoachTeams_createServerFn_handler = createServerRpc({
	id: "c3dfe2eeb698d10b20a19e65ebf58190333948858d2c11ba6abf371d1cfe3fc6",
	name: "saveMyCoachTeams",
	filename: "src/lib/pbi/api.ts"
}, (opts) => saveMyCoachTeams.__executeServer(opts));
var saveMyCoachTeams = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const teams = parseSignupTeams(data?.teams);
	if (!teams) throw new Error("Add at least one team.");
	return { teams };
}).handler(saveMyCoachTeams_createServerFn_handler, async ({ context, data }) => {
	await actAsCoach(context);
	await ensureSignupColumns();
	const sql = await getSql();
	await sql`delete from coach_signup_teams where user_id = ${context.userId}`;
	for (const team of data.teams) await sql`insert into coach_signup_teams (user_id, name, age_group) values (${context.userId}, ${team.name}, ${team.ageGroup})`;
	return data.teams;
});
function mapSquadPlayer(row) {
	const birthday = row.birthday ? String(row.birthday).slice(0, 10) : null;
	return {
		id: row.id,
		name: String(row.name),
		jersey: Number(row.jersey),
		birthday
	};
}
function parseBirthday(value) {
	const raw = String(value ?? "").trim();
	if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error("Pick a birthday.");
	const [year, month, day] = raw.split("-").map(Number);
	const date = new Date(year, (month || 1) - 1, day || 1);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) throw new Error("Pick a birthday.");
	const today = /* @__PURE__ */ new Date();
	today.setHours(0, 0, 0, 0);
	if (date > today) throw new Error("Birthday can’t be in the future.");
	if (year < 2005) throw new Error("That birthday is too far back for a youth player.");
	return raw;
}
async function ownedSquad(sql, userId, teamId) {
	const team = (await sql`select id, name, age_group from coach_signup_teams where id = ${teamId} and user_id = ${userId} limit 1`)[0];
	if (!team) throw new Error("That team is not yours.");
	return team;
}
var listMySquads_createServerFn_handler = createServerRpc({
	id: "c71e788c70e94e137efa8552a979f0800eebebe40cfbd99e03f0d9abea961674",
	name: "listMySquads",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listMySquads.__executeServer(opts));
var listMySquads = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listMySquads_createServerFn_handler, async ({ context }) => {
	await actAsCoach(context);
	await ensureSignupColumns();
	const sql = await getSql();
	const teams = await sql`select id, name, age_group from coach_signup_teams where user_id = ${context.userId} order by id asc`;
	const players = await sql`
    select p.id, p.team_id, p.name, p.jersey, p.birthday
    from coach_roster_players p
    join coach_signup_teams t on t.id = p.team_id
    where t.user_id = ${context.userId}
    order by p.jersey asc, p.name asc
  `;
	const byTeam = /* @__PURE__ */ new Map();
	for (const row of players) {
		const list = byTeam.get(row.team_id) ?? [];
		list.push(mapSquadPlayer(row));
		byTeam.set(row.team_id, list);
	}
	return teams.map((team) => ({
		id: team.id,
		name: String(team.name),
		ageGroup: String(team.age_group),
		players: byTeam.get(team.id) ?? []
	}));
});
function parseSquadInput(data) {
	const name = String(data?.name ?? "").trim();
	const ageGroup = String(data?.ageGroup ?? "");
	if (name.length < 2) throw new Error("Give the team a name.");
	if (name.length > 60) throw new Error("Keep the team name under 60 characters.");
	if (!isAgeGroup(ageGroup)) throw new Error("Pick an age from 8U to 17U.");
	return {
		name,
		ageGroup
	};
}
var addMySquad_createServerFn_handler = createServerRpc({
	id: "fcf1ff0b79b0da47ed798adf8f5a590dd50facdd10b0f5b35c9fe58d86419c08",
	name: "addMySquad",
	filename: "src/lib/pbi/api.ts"
}, (opts) => addMySquad.__executeServer(opts));
var addMySquad = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(parseSquadInput).handler(addMySquad_createServerFn_handler, async ({ context, data }) => {
	await actAsCoach(context);
	await ensureSignupColumns();
	return {
		id: (await (await getSql())`
    insert into coach_signup_teams (user_id, name, age_group)
    values (${context.userId}, ${data.name}, ${data.ageGroup})
    returning id
  `)[0].id,
		name: data.name,
		ageGroup: data.ageGroup,
		players: []
	};
});
var updateMySquad_createServerFn_handler = createServerRpc({
	id: "7ec9bb60bdec9b50eb77e16e4a7e9cbbdcbbe154d22a6b61d36dd10b573a2ff8",
	name: "updateMySquad",
	filename: "src/lib/pbi/api.ts"
}, (opts) => updateMySquad.__executeServer(opts));
var updateMySquad = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	teamId: parsePositiveInt(data?.teamId, "Missing team."),
	...parseSquadInput(data)
})).handler(updateMySquad_createServerFn_handler, async ({ context, data }) => {
	await actAsCoach(context);
	await ensureSignupColumns();
	const sql = await getSql();
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
		players: players.map(mapSquadPlayer)
	};
});
var removeMySquad_createServerFn_handler = createServerRpc({
	id: "acc9b2afcc1dc3cd1e1f3ede73385a54821409061ca6ff20f660bcfb608c083c",
	name: "removeMySquad",
	filename: "src/lib/pbi/api.ts"
}, (opts) => removeMySquad.__executeServer(opts));
var removeMySquad = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ teamId: parsePositiveInt(data?.teamId, "Missing team.") })).handler(removeMySquad_createServerFn_handler, async ({ context, data }) => {
	await actAsCoach(context);
	await ensureSignupColumns();
	const sql = await getSql();
	await ownedSquad(sql, context.userId, data.teamId);
	if (((await sql`select count(*)::int as n from coach_signup_teams where user_id = ${context.userId}`)[0]?.n ?? 0) <= 1) throw new Error("Keep at least one team.");
	await sql`delete from coach_signup_teams where id = ${data.teamId}`;
	return { ok: true };
});
var addSquadPlayer_createServerFn_handler = createServerRpc({
	id: "3c9f69bfb0fc676a57216172b132844decf8097604a822b774706d7409f807d4",
	name: "addSquadPlayer",
	filename: "src/lib/pbi/api.ts"
}, (opts) => addSquadPlayer.__executeServer(opts));
var addSquadPlayer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	teamId: parsePositiveInt(data?.teamId, "Missing team."),
	name: (() => {
		const name = String(data?.name ?? "").trim();
		if (name.length < 2) throw new Error("Give the player a name.");
		if (name.length > 60) throw new Error("Keep the player name under 60 characters.");
		return name;
	})(),
	jersey: parseJersey(data?.jersey),
	birthday: parseBirthday(data?.birthday)
})).handler(addSquadPlayer_createServerFn_handler, async ({ context, data }) => {
	await actAsCoach(context);
	await ensureSignupColumns();
	const sql = await getSql();
	await ownedSquad(sql, context.userId, data.teamId);
	try {
		return {
			id: (await sql`
      insert into coach_roster_players (team_id, name, jersey, birthday)
      values (${data.teamId}, ${data.name}, ${data.jersey}, ${data.birthday})
      returning id
    `)[0].id,
			name: data.name,
			jersey: data.jersey,
			birthday: data.birthday
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : "";
		if (message.toLowerCase().includes("unique") || message.toLowerCase().includes("duplicate")) throw new Error("That jersey is already on this team.");
		throw err;
	}
});
var removeSquadPlayer_createServerFn_handler = createServerRpc({
	id: "e1188c6346083ff86dd99d616345d0ac6f7ace1f8df70f64b7c2dede9cd6de1a",
	name: "removeSquadPlayer",
	filename: "src/lib/pbi/api.ts"
}, (opts) => removeSquadPlayer.__executeServer(opts));
var removeSquadPlayer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ playerId: parsePositiveInt(data?.playerId, "Missing player.") })).handler(removeSquadPlayer_createServerFn_handler, async ({ context, data }) => {
	await actAsCoach(context);
	await ensureSignupColumns();
	if (!(await (await getSql())`
    delete from coach_roster_players p
    using coach_signup_teams t
    where p.id = ${data.playerId} and p.team_id = t.id and t.user_id = ${context.userId}
    returning p.id
  `)[0]) throw new Error("That player is not on your team.");
	return { ok: true };
});
var listMyTournamentResponses_createServerFn_handler = createServerRpc({
	id: "00367dc1665a29d0ef2907255e9674339ab0b5fbecefee025d80fd101bdc8a0d",
	name: "listMyTournamentResponses",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listMyTournamentResponses.__executeServer(opts));
var listMyTournamentResponses = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listMyTournamentResponses_createServerFn_handler, async ({ context }) => {
	await actAsCoach(context);
	await ensureLiveOpsColumns();
	return (await (await getSql())`
    select weekend_id, choice from tournament_responses where coach_user_id = ${context.userId}
  `).map((row) => ({
		weekendId: Number(row.weekend_id),
		choice: row.choice === "maybe" || row.choice === "no" ? row.choice : "interested"
	})).filter((row) => row.choice === "interested" || row.choice === "maybe" || row.choice === "no");
});
var LOST_PLACE = {
	f: "2nd",
	sf: "Tied for 3rd",
	qf: "Tied for 5th",
	r16: "Tied for 9th",
	r32: "Tied for 17th",
	r64: "Tied for 33rd"
};
function placeForTeam(teamId, games) {
	const mine = games.filter((game) => Number(game.home_team_id) === teamId || Number(game.away_team_id) === teamId).sort((a, b) => ROUND_IDS.indexOf(a.round) - ROUND_IDS.indexOf(b.round));
	if (mine.length === 0) return "Did not reach the bracket";
	for (const game of mine) {
		if (game.no_contest) continue;
		if (game.is_bye) continue;
		const winner = scoredWinner(game.home_team_id == null ? null : Number(game.home_team_id), game.away_team_id == null ? null : Number(game.away_team_id), game.home_score == null ? null : Number(game.home_score), game.away_score == null ? null : Number(game.away_score), game.forfeit);
		if (winner == null) return "Results not posted";
		if (winner !== teamId) return LOST_PLACE[String(game.round)] ?? "Out";
		if (game.round === "f") return "1st";
	}
	return "Results not posted";
}
var listMyOutcomes_createServerFn_handler = createServerRpc({
	id: "f4881a0e033fc021a831dcc3bd9f018c8af4c5622ca34e3957fefa80267e197a",
	name: "listMyOutcomes",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listMyOutcomes.__executeServer(opts));
var listMyOutcomes = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listMyOutcomes_createServerFn_handler, async ({ context }) => {
	await actAsCoach(context);
	const sql = await getSql();
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
	const byWeekend = /* @__PURE__ */ new Map();
	const seen = /* @__PURE__ */ new Set();
	for (const game of games) {
		if (seen.has(game.id)) continue;
		seen.add(game.id);
		const list = byWeekend.get(game.weekend_id) ?? [];
		list.push(game);
		byWeekend.set(game.weekend_id, list);
	}
	const lines = /* @__PURE__ */ new Map();
	for (const team of teams) {
		const place = placeForTeam(Number(team.id), byWeekend.get(team.weekend_id) ?? []);
		const list = lines.get(team.weekend_id) ?? [];
		list.push(`${team.name} · ${team.age_group} · ${place}`);
		lines.set(team.weekend_id, list);
	}
	return [...lines.entries()].map(([weekendId, teamLines]) => ({
		weekendId,
		lines: teamLines
	}));
});
async function placeCoachOnTournament(sql, weekendId, userId, ageGroup, join) {
	const weekend = mapWeekend(await loadWeekendOrThrow(weekendId));
	const ages = ageGroup ? [ageGroup] : weekend.ageGroups;
	const matching = (await sql`
    select id, name, age_group from coach_signup_teams
    where user_id = ${userId}
    order by id asc
  `).filter((row) => isAgeGroup(String(row.age_group)) && ages.includes(String(row.age_group)));
	if (join && matching.length === 0) throw new Error("No team in that age is on this account yet.");
	if (weekend.sheetLocked) {
		if (!join) throw new Error("The sheet is locked. The director has to take your team off.");
		const missing = [];
		for (const club of matching) {
			const name = String(club.name).trim();
			if (!(await sql`
        select id from teams
        where weekend_id = ${weekendId}
          and status in (${"pending"}, ${"approved"})
          and coach_user_id = ${userId}
          and age_group = ${club.age_group}
          and lower(btrim(name)) = lower(${name})
        limit 1
      `)[0]) missing.push(name);
		}
		if (missing.length > 0) throw new Error("The sheet is locked. The director has to add your team.");
		return;
	}
	if (join) {
		const approved = (await sql`
      select count(*)::int as n from teams where weekend_id = ${weekendId} and status = ${"approved"}
    `)[0];
		let count = Number(approved?.n ?? 0);
		for (const club of matching) {
			const name = String(club.name).trim();
			if ((await sql`
        select id from teams
        where weekend_id = ${weekendId}
          and status in (${"pending"}, ${"approved"})
          and coach_user_id = ${userId}
          and age_group = ${club.age_group}
          and lower(btrim(name)) = lower(${name})
        limit 1
      `)[0]) continue;
			if (count >= weekend.maxTeams) throw new Error(`This tournament is full (${weekend.maxTeams} teams).`);
			await sql`
        insert into teams (weekend_id, age_group, name, coach_user_id, status, is_demo)
        values (${weekendId}, ${club.age_group}, ${name}, ${userId}, ${"approved"}, ${false})
      `;
			count += 1;
			await insertNotification(userId, "You're in", `${name} is in ${weekend.name}.`, "teams", `in-${weekendId}-${club.id}`);
		}
	} else for (const club of matching) {
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
		if ((await sql`
        select id from games
        where weekend_id = ${weekendId}
          and (home_team_id = ${row.id} or away_team_id = ${row.id})
          and (home_score is not null or away_score is not null or forfeit is not null)
        limit 1
      `)[0]) throw new Error(`${name} already has a score. The director has to take them off.`);
		await sql`delete from teams where id = ${row.id}`;
	}
	await syncWeekendBracket(weekendId);
}
var respondToTournament_createServerFn_handler = createServerRpc({
	id: "90e6c47f40cc218175fd08d79a1ae799f01b8203ef4da844dbc3f74b19872313",
	name: "respondToTournament",
	filename: "src/lib/pbi/api.ts"
}, (opts) => respondToTournament.__executeServer(opts));
var respondToTournament = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const choice = data?.choice === "interested" || data?.choice === "maybe" || data?.choice === "no" ? data.choice : null;
	if (!choice) throw new Error("Pick one.");
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		choice
	};
}).handler(respondToTournament_createServerFn_handler, async ({ context, data }) => {
	await actAsCoach(context);
	await ensureLiveOpsColumns();
	await ensureSignupColumns();
	const sql = await getSql();
	const weekend = (await sql`select id, name, lifecycle from weekends where id = ${data.weekendId} limit 1`)[0];
	if (!weekend) throw new Error("That tournament is no longer on the schedule.");
	const prior = (await sql`
    select choice from tournament_responses
    where weekend_id = ${data.weekendId} and coach_user_id = ${context.userId}
    limit 1
  `)[0];
	await placeCoachOnTournament(sql, data.weekendId, context.userId, null, data.choice === "interested");
	await sql`
    insert into tournament_responses (weekend_id, coach_user_id, choice)
    values (${data.weekendId}, ${context.userId}, ${data.choice})
    on conflict (weekend_id, coach_user_id) do update set choice = ${data.choice}
  `;
	if (!prior || prior.choice !== data.choice) {
		const teams = await coachTeamLabels(sql, context.userId);
		const said = data.choice === "interested" ? "is in" : data.choice === "maybe" ? "is not sure yet about" : "said maybe next time for";
		await notifyAdmins("Team interest", `${teams.length > 0 ? teams.join(", ") : "A coach"} ${said} ${weekend.name}.`);
	}
	await sql`
    update notifications set read = true
    where user_id = ${context.userId} and ref_key = ${`available-${data.weekendId}`} and read = false
  `;
	return { choice: data.choice };
});
function parseEventIds(value) {
	const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
	const ids = [...new Set(raw.map((item) => Number(item)).filter((id) => Number.isInteger(id) && id > 0))];
	if (ids.length === 0) throw new Error("That link is missing the weekend.");
	if (ids.length > 24) throw new Error("Too many weekends.");
	return ids;
}
var listMyEventInterest_createServerFn_handler = createServerRpc({
	id: "7dc68423b5e2534e3278f492c5562c25c656f6653dcc45958de9ad9f151b79a4",
	name: "listMyEventInterest",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listMyEventInterest.__executeServer(opts));
var listMyEventInterest = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ weekendIds: parseEventIds(data?.weekendIds) })).handler(listMyEventInterest_createServerFn_handler, async ({ context, data }) => {
	await actAsCoach(context);
	await ensureLiveOpsColumns();
	await ensureSignupColumns();
	const sql = await getSql();
	const teams = await sql`select name, age_group from coach_signup_teams where user_id = ${context.userId} order by id asc`;
	const ages = [];
	for (const team of teams) {
		const age = String(team.age_group || "");
		if (!isAgeGroup(age)) continue;
		const found = ages.find((item) => item.ageGroup === age);
		if (found) found.teamNames.push(String(team.name));
		else ages.push({
			ageGroup: age,
			teamNames: [String(team.name)]
		});
	}
	ages.sort((a, b) => AGE_GROUPS.indexOf(a.ageGroup) - AGE_GROUPS.indexOf(b.ageGroup));
	const choiceRows = await sql`
    select weekend_id, age_group, choice from event_age_responses
    where coach_user_id = ${context.userId}
  `;
	const events = [];
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
			choices: choiceRows.filter((choice) => Number(choice.weekend_id) === id).map((choice) => ({
				ageGroup: String(choice.age_group),
				choice: choice.choice === "maybe" || choice.choice === "no" ? choice.choice : "interested"
			}))
		});
	}
	return {
		ages,
		events
	};
});
var respondToEventAge_createServerFn_handler = createServerRpc({
	id: "2dc6e8d19fa6456022784a2caafbb5f39ca6aef58f440b39be5c4b773ce21ca6",
	name: "respondToEventAge",
	filename: "src/lib/pbi/api.ts"
}, (opts) => respondToEventAge.__executeServer(opts));
var respondToEventAge = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const choice = data?.choice === "interested" || data?.choice === "maybe" || data?.choice === "no" ? data.choice : null;
	const ageGroup = String(data?.ageGroup ?? "");
	if (!choice) throw new Error("Pick one.");
	if (!isAgeGroup(ageGroup)) throw new Error("Pick an age.");
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing event."),
		ageGroup,
		choice
	};
}).handler(respondToEventAge_createServerFn_handler, async ({ context, data }) => {
	await actAsCoach(context);
	await ensureLiveOpsColumns();
	await ensureSignupColumns();
	const sql = await getSql();
	const weekend = (await sql`select id, name, lifecycle, age_groups from weekends where id = ${data.weekendId} limit 1`)[0];
	if (!weekend) throw new Error("That tournament is no longer on the schedule.");
	const onTournament = parseStoredAgeGroups(weekend.age_groups);
	if (onTournament.length > 0 && !onTournament.includes(data.ageGroup)) throw new Error("That age is not on this tournament.");
	const teams = await sql`
    select name from coach_signup_teams
    where user_id = ${context.userId} and age_group = ${data.ageGroup}
    order by id asc
  `;
	const coach = (await sql`select name from "user" where id = ${context.userId} limit 1`)[0];
	const coachName = String(coach?.name || "A coach").trim() || "A coach";
	const labels = teams.length > 0 ? teams.map((team) => String(team.name)) : [coachName];
	const prior = (await sql`
    select choice from event_age_responses
    where weekend_id = ${data.weekendId} and coach_user_id = ${context.userId} and age_group = ${data.ageGroup}
    limit 1
  `)[0];
	await placeCoachOnTournament(sql, data.weekendId, context.userId, data.ageGroup, data.choice === "interested");
	await sql`
    insert into event_age_responses (weekend_id, coach_user_id, age_group, choice)
    values (${data.weekendId}, ${context.userId}, ${data.ageGroup}, ${data.choice})
    on conflict (weekend_id, coach_user_id, age_group) do update set choice = ${data.choice}
  `;
	const picks = await sql`
    select choice from event_age_responses
    where weekend_id = ${data.weekendId} and coach_user_id = ${context.userId}
  `;
	const rollup = picks.some((row) => row.choice === "interested") ? "interested" : picks.some((row) => row.choice === "maybe") ? "maybe" : "no";
	await sql`
    insert into tournament_responses (weekend_id, coach_user_id, choice)
    values (${data.weekendId}, ${context.userId}, ${rollup})
    on conflict (weekend_id, coach_user_id) do update set choice = ${rollup}
  `;
	if (!prior || prior.choice !== data.choice) {
		const said = data.choice === "interested" ? "is in" : data.choice === "maybe" ? "is not sure yet about" : "said maybe next time for";
		await notifyAdmins("Team interest", `${labels.join(", ")} ${said} ${data.ageGroup} at ${weekend.name}.`);
	}
	await sql`
    update notifications set read = true
    where user_id = ${context.userId} and ref_key = ${`available-${data.weekendId}`} and read = false
  `;
	return { choice: data.choice };
});
var listTournamentReplies_createServerFn_handler = createServerRpc({
	id: "def56b5c0aa14824278ae3a1b2cc9b32ca97bc7d18a24975c8c36e606e111085",
	name: "listTournamentReplies",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listTournamentReplies.__executeServer(opts));
var listTournamentReplies = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(listTournamentReplies_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	await ensureSignupColumns();
	const sql = await getSql();
	const host = (await sql`
    select id, name, lifecycle, start_date::text as start_date, end_date::text as end_date
    from weekends where id = ${data.weekendId} limit 1
  `)[0];
	const eventName = String(host?.name || "").trim();
	const eventStart = host ? String(host.start_date).slice(0, 10) : "";
	const eventEnd = host ? String(host.end_date).slice(0, 10) : "";
	const rows = host?.lifecycle === "announced" && eventName ? await sql`
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
    ` : await sql`
      select r.coach_user_id, r.choice, u.name as coach_name
      from tournament_responses r
      left join "user" u on u.id = r.coach_user_id
      where r.weekend_id = ${data.weekendId}
      order by r.created_at asc
    `;
	const signup = await sql`select user_id, name, age_group from coach_signup_teams order by id asc`;
	const signupTeams = /* @__PURE__ */ new Map();
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
	function replyFor(userId, coachName) {
		const rawName = typeof coachName === "string" ? coachName.trim() : "";
		const generic = [
			"coach",
			"admin",
			"parent",
			"athlete"
		].includes(rawName.toLowerCase());
		return {
			userId,
			name: rawName && !generic ? rawName : "Coach",
			teams: signupTeams.get(userId) ?? []
		};
	}
	const interested = [];
	const maybe = [];
	const no = [];
	const answered = /* @__PURE__ */ new Set();
	const ageRows = await sql`
      select r.coach_user_id, r.age_group, r.choice, u.name as coach_name
      from event_age_responses r
      left join "user" u on u.id = r.coach_user_id
      where r.weekend_id = ${data.weekendId}
    `;
	const ageByCoach = /* @__PURE__ */ new Map();
	for (const row of ageRows) {
		const list = ageByCoach.get(String(row.coach_user_id)) ?? [];
		list.push({
			age: String(row.age_group),
			choice: String(row.choice),
			name: row.coach_name
		});
		ageByCoach.set(String(row.coach_user_id), list);
	}
	for (const [userId, picks] of ageByCoach) {
		answered.add(userId);
		const reply = replyFor(userId, picks[0]?.name);
		function teamsFor(choice) {
			const ages = new Set(picks.filter((pick) => pick.choice === choice).map((pick) => pick.age));
			return reply.teams.filter((team) => ages.has(team.split(" · ").pop()?.trim() ?? ""));
		}
		const yes = teamsFor("interested");
		const mid = teamsFor("maybe");
		const passed = teamsFor("no");
		if (yes.length > 0) interested.push({
			...reply,
			teams: yes
		});
		if (mid.length > 0) maybe.push({
			...reply,
			teams: mid
		});
		if (passed.length > 0) no.push({
			...reply,
			teams: passed
		});
	}
	for (const row of rows) {
		if (answered.has(row.coach_user_id)) continue;
		answered.add(row.coach_user_id);
		const reply = replyFor(row.coach_user_id, row.coach_name);
		if (row.choice === "maybe") maybe.push(reply);
		else if (row.choice === "no") no.push(reply);
		else interested.push(reply);
	}
	const silent = coaches.filter((coach) => !answered.has(coach.user_id)).map((coach) => replyFor(coach.user_id, coach.coach_name));
	const event = (await sql`
    select start_date::text as start_date, end_date::text as end_date
    from weekends
    where id = ${data.weekendId}
    limit 1
  `)[0];
	const scheduled = [];
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
			const generic = [
				"coach",
				"admin",
				"parent",
				"athlete"
			].includes(rawName.toLowerCase());
			scheduled.push({
				userId: row.coach_user_id ? String(row.coach_user_id) : "",
				coach: rawName && !generic ? rawName : "Coach",
				team: String(row.team_name ?? "").trim(),
				age,
				tournament: String(row.tournament_name ?? "Tournament")
			});
		}
	}
	return {
		interested,
		maybe,
		no,
		silent,
		scheduled
	};
});
var listTournamentRoster_createServerFn_handler = createServerRpc({
	id: "65505f6fdd3e07caad19ecf7a7d348156a98a0d26ab9f5c3c09852525d7fec16",
	name: "listTournamentRoster",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listTournamentRoster.__executeServer(opts));
var listTournamentRoster = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(listTournamentRoster_createServerFn_handler, async ({ context, data }) => {
	await requireScheduleReader(context.userId);
	return (await (await getSql())`
    select name, age_group
    from teams
    where weekend_id = ${data.weekendId} and status = ${"approved"} and is_demo = ${false}
    order by age_group asc, name asc
  `).filter((row) => isAgeGroup(row.age_group)).map((row) => ({
		name: String(row.name ?? "").trim(),
		ageGroup: String(row.age_group)
	})).filter((row) => row.name.length > 0);
});
var listEventInterest_createServerFn_handler = createServerRpc({
	id: "3af794743fb98b8d797494c34aa2d70de9b4e2639b1a318280755eb62f2e16a7",
	name: "listEventInterest",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listEventInterest.__executeServer(opts));
var listEventInterest = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(listEventInterest_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	await ensureSignupColumns();
	const sql = await getSql();
	const weekend = (await sql`
    select id, name, lifecycle, start_date::text as start_date, end_date::text as end_date, age_groups
    from weekends where id = ${data.weekendId} limit 1
  `)[0];
	if (!weekend) return [];
	const start = String(weekend.start_date).slice(0, 10);
	const end = String(weekend.end_date).slice(0, 10);
	const event = weekend.lifecycle === "announced" ? weekend : (await sql`
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
	const ageUsers = new Set(agePicks.map((row) => String(row.coach_user_id)));
	const ageYes = new Set(agePicks.filter((row) => row.choice === "interested").map((row) => `${row.coach_user_id}|${row.age_group}`));
	const taken = await sql`
    select t.coach_user_id, t.age_group, lower(btrim(t.name)) as name
    from teams t
    join weekends w on w.id = t.weekend_id
    where t.status in (${"pending"}, ${"approved"})
      and w.lifecycle <> ${"announced"}
      and w.start_date >= ${eventStart}
      and w.end_date <= ${eventEnd}
  `;
	const seen = /* @__PURE__ */ new Set();
	return rows.filter((row) => isAgeGroup(String(row.age_group))).filter((row) => !ageUsers.has(String(row.user_id)) || ageYes.has(`${row.user_id}|${row.age_group}`)).filter((row) => !taken.some((team) => team.coach_user_id === row.user_id && team.age_group === row.age_group && team.name === String(row.team_name).trim().toLowerCase())).filter((row) => {
		const id = Number(row.team_id);
		if (seen.has(id)) return false;
		seen.add(id);
		return true;
	}).map((row) => ({
		teamId: Number(row.team_id),
		coachUserId: String(row.user_id),
		coachName: typeof row.coach_name === "string" && row.coach_name.trim() ? row.coach_name.trim() : "Coach",
		teamName: String(row.team_name),
		ageGroup: String(row.age_group)
	}));
});
var getClubCard_createServerFn_handler = createServerRpc({
	id: "67897cf5b32d67017e66d56dfa5e79a784ec0a1e097480ebe7bf63be33e48a87",
	name: "getClubCard",
	filename: "src/lib/pbi/api.ts"
}, (opts) => getClubCard.__executeServer(opts));
var getClubCard = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => {
	const signupTeamId = data?.signupTeamId == null ? null : parsePositiveInt(data.signupTeamId, "Missing team.");
	const weekendTeamId = data?.weekendTeamId == null ? null : parsePositiveInt(data.weekendTeamId, "Missing team.");
	if (signupTeamId == null === (weekendTeamId == null)) throw new Error("Missing team.");
	return {
		signupTeamId,
		weekendTeamId
	};
}).handler(getClubCard_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureSignupColumns();
	const sql = await getSql();
	let userId = "";
	let teamName = "";
	let ageGroup = "";
	let signupId = data.signupTeamId;
	if (data.weekendTeamId != null) {
		const team = (await sql`
      select id, name, age_group, coach_user_id
      from teams where id = ${data.weekendTeamId} limit 1
    `)[0];
		if (!team) throw new Error("That team is gone.");
		teamName = String(team.name);
		ageGroup = String(team.age_group);
		userId = team.coach_user_id ? String(team.coach_user_id) : "";
		const signup = userId ? (await sql`
          select id from coach_signup_teams
          where user_id = ${userId}
            and lower(btrim(name)) = lower(${teamName})
            and age_group = ${ageGroup}
          limit 1
        `)[0] : null;
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
	const coach = userId ? (await sql`
        select u.name as coach_name, u.email, p.phone, p.club
        from "user" u
        left join profiles p on p.user_id = u.id
        where u.id = ${userId}
        limit 1
      `)[0] : null;
	const players = signupId == null ? [] : await sql`
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
		players: players.map(mapSquadPlayer)
	};
});
var addInterestedClub_createServerFn_handler = createServerRpc({
	id: "f7178a20a0f09415758ac7c4c6942186433e4fe3ef5c7a6df4ba1eb982d9ada0",
	name: "addInterestedClub",
	filename: "src/lib/pbi/api.ts"
}, (opts) => addInterestedClub.__executeServer(opts));
var addInterestedClub = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
	teamId: parsePositiveInt(data?.teamId, "Missing team."),
	raiseAge: data?.raiseAge === true
})).handler(addInterestedClub_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	await ensureSignupColumns();
	let weekend = mapWeekend(await loadWeekendOrThrow(data.weekendId));
	if (weekend.lifecycle === "announced") throw new Error("Add teams on the tournament, not the event.");
	assertSheetOpen(weekend);
	const closed = teamEntryClosed({
		startDate: weekend.startDate,
		today: isoDateFromLocal(/* @__PURE__ */ new Date()),
		scored: false,
		days: weekend.rules.dropCutoffDays
	});
	if (closed) throw new Error(closed);
	const sql = await getSql();
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
	if (!(await sql`
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
  `)[0]) throw new Error("That coach has not said they are interested.");
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
		await insertNotification(club.user_id, "You're in", `${String(club.name).trim()} is in ${weekend.name} as ${clubAge}.`, "teams", `age-${data.weekendId}-${sameName.id}-${clubAge}`);
		await syncWeekendBracket(data.weekendId);
		return loadWeekendDetail(data.weekendId);
	}
	if ((await sql`
    select id from teams
    where weekend_id = ${data.weekendId}
      and status in (${"pending"}, ${"approved"})
      and coach_user_id = ${club.user_id}
      and age_group = ${club.age_group}
    limit 1
  `)[0]) throw new Error("That team is already on this tournament.");
	if (((await sql`
    select count(*)::int as n from teams where weekend_id = ${data.weekendId} and status = ${"approved"}
  `)[0]?.n ?? 0) >= weekend.maxTeams) throw new Error(`This tournament is full (${weekend.maxTeams} teams).`);
	const fits = weekend.ageGroups.includes(clubAge);
	if (data.raiseAge) {
		if (fits) throw new Error("That team already fits this tournament.");
		const current = Math.max(0, ...weekend.ageGroups.map((age) => Number.parseInt(age, 10) || 0));
		if ((Number.parseInt(clubAge, 10) || 0) <= current) throw new Error("Only an older team can move this tournament up.");
		const from = weekend.ageGroups.length === 1 ? weekend.ageGroups[0] : null;
		await sql`
      update weekends
      set name = ${from ? renameTournamentAge(weekend.name, from, clubAge) : weekend.name}, age_groups = ${JSON.stringify([clubAge])}
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
	await insertNotification(club.user_id, "You're in", `${String(club.name).trim()} is in ${weekend.name}.`, "teams", `in-${data.weekendId}-${club.id}`);
	await syncWeekendBracket(data.weekendId);
	return loadWeekendDetail(data.weekendId);
});
async function coachTeamLabels(sql, userId) {
	const rows = await sql`select name, age_group from coach_signup_teams where user_id = ${userId} order by id asc`;
	if (rows.length > 0) return rows.map((row) => row.age_group ? `${row.name} · ${row.age_group}` : String(row.name));
	const request = (await sql`
    select team_name from role_requests
    where user_id = ${userId} and requested_role = ${"coach"} and team_name is not null and btrim(team_name) <> ''
    order by created_at desc
    limit 1
  `)[0];
	return request ? [String(request.team_name)] : [];
}
var listTournamentSignups_createServerFn_handler = createServerRpc({
	id: "3952dae26abe6803696e0de6ef2524cc5dd8af9505661facea897d70d39b2331",
	name: "listTournamentSignups",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listTournamentSignups.__executeServer(opts));
var listTournamentSignups = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(listTournamentSignups_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	return (await (await getSql())`
    select 'interest-' || id::text as id, team_name as name, created_at
    from tournament_interest
    where weekend_id = ${data.weekendId}
    union all
    select 'team-' || id::text as id, name, created_at
    from teams
    where weekend_id = ${data.weekendId}
    order by created_at asc, name asc
  `).map((row) => ({
		id: String(row.id),
		name: String(row.name)
	}));
});
var finalizeWeekend_createServerFn_handler = createServerRpc({
	id: "35346909d2989e18b219c9bb36538fb3fd4e1555ffe30e22896ca1335c300ef3",
	name: "finalizeWeekend",
	filename: "src/lib/pbi/api.ts"
}, (opts) => finalizeWeekend.__executeServer(opts));
var finalizeWeekend = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		...parseWeekendInput(data)
	};
}).handler(finalizeWeekend_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql = await getSql();
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
    values (${data.weekendId}, ${ageGroup}, ${3}, ${data.maxTeams})
    on conflict (weekend_id, age_group) do nothing
  `;
	await writeCoachShell(mapWeekend(await loadWeekendOrThrow(data.weekendId)));
	return mapWeekend(await loadWeekendOrThrow(data.weekendId));
});
async function ensureFinalizeNotices(userId) {
	const profile = await loadProfile(userId);
	if (!profile || profile.homeRole !== "admin") return;
	await ensureLiveOpsColumns();
	const sql = await getSql();
	const today = isoDateFromLocal(/* @__PURE__ */ new Date());
	const rows = await sql`select id, name, start_date::text as start_date from weekends where lifecycle = ${"announced"}`;
	for (const row of rows) {
		const start = String(row.start_date).slice(0, 10);
		if (!finalizeIsDue(today, start)) continue;
		const countRow = (await sql`select count(*)::int as n from tournament_interest where weekend_id = ${row.id}`)[0];
		const n = Number(countRow?.n ?? 0);
		const interested = n === 0 ? "No teams have said they're interested yet" : n === 1 ? "1 team is interested" : `${n} teams are interested`;
		await insertNotification(userId, "Finish a tournament", `${row.name} starts ${formatMonthDay(start)}. ${interested}. Open the season and finish it.`, `finalize-${row.id}`, `finalize-${row.id}`);
	}
}
async function eraseWeekend(sql, weekendId) {
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
async function hostedTournamentIds(sql, event) {
	const start = String(event.start_date).slice(0, 10);
	const end = String(event.end_date).slice(0, 10);
	const name = String(event.name || "").trim();
	return (await sql`
    select id from weekends
    where id <> ${event.id}
      and lifecycle <> ${"announced"}
      and start_date >= ${start}
      and start_date <= ${end}
      and name like ${`${name}%`}
  `).map((row) => Number(row.id));
}
async function retireAnnouncedEvents() {
	const sql = await getSql();
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
			if (event.season && event.season_year != null) await sql`
          update weekends
          set season = coalesce(season, ${event.season}),
              season_year = coalesce(season_year, ${event.season_year})
          where id = ${kid.id}
        `;
			const coaches = /* @__PURE__ */ new Set();
			for (const reply of replies) {
				const age = String(reply.age_group);
				if (!ages.has(age)) continue;
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
				const coachHit = replies.some((reply) => String(reply.coach_user_id) === String(row.coach_user_id) && ages.has(String(reply.age_group)));
				if (age && !ages.has(age)) continue;
				if (!age && !coachHit) continue;
				if (!(await sql`
          select id from tournament_interest
          where weekend_id = ${kid.id}
            and coach_user_id = ${row.coach_user_id}
            and lower(btrim(team_name)) = lower(btrim(${row.team_name}))
          limit 1
        `)[0]) await sql`
            insert into tournament_interest (weekend_id, coach_user_id, team_name)
            values (${kid.id}, ${row.coach_user_id}, ${row.team_name})
          `;
			}
			for (const coachId of coaches) {
				const picks = replies.filter((reply) => String(reply.coach_user_id) === coachId && ages.has(String(reply.age_group)));
				const rollup = picks.some((row) => row.choice === "interested") ? "interested" : picks.some((row) => row.choice === "maybe") ? "maybe" : "no";
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
var deleteWeekend_createServerFn_handler = createServerRpc({
	id: "5654e303adcc581306047b5725806f4bada386ab5420a377fecf0c44089a4eec",
	name: "deleteWeekend",
	filename: "src/lib/pbi/api.ts"
}, (opts) => deleteWeekend.__executeServer(opts));
var deleteWeekend = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
	notify: data?.notify === true
})).handler(deleteWeekend_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql = await getSql();
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
	if (!sameName[0]) await sql`
      delete from notifications
      where lower(btrim(title)) = lower(btrim(${name}))
        and (kind = ${"available"} or lower(body) like ${"%if your team is interested%"})
    `;
	if (data.notify) {
		const when = announcedWeekendName(String(weekend.start_date).slice(0, 10), String(weekend.end_date).slice(0, 10));
		const coachesOnApp = await sql`select user_id from profiles where home_role = ${"coach"}`;
		for (const coach of coachesOnApp) await insertNotification(coach.user_id, "Weekend cancelled", `${name} (${when}) was cancelled.`);
	} else for (const coach of coaches) {
		if (!coach.coach_user_id) continue;
		await insertNotification(coach.coach_user_id, "Tournament removed", `${name} was taken off the schedule. Your team is no longer in it.`);
	}
	return { id: data.weekendId };
});
async function writeCoachShell(weekend) {
	if (weekend.lifecycle === "announced") return 0;
	if (weekend.rules.coachPath === "custom") return 0;
	const sql = await getSql();
	await ensureLiveOpsColumns();
	if ((await sql`select id from games where weekend_id = ${weekend.id} limit 1`)[0]) return 0;
	const fieldCount = weekend.rules.fieldCount > 0 ? weekend.rules.fieldCount : 0;
	const haveLocs = await sql`select id from weekend_locations where weekend_id = ${weekend.id} order by sort_order asc, id asc`;
	const locations = [];
	if (haveLocs.length === 0) for (let i = 1; i <= fieldCount; i += 1) {
		const row = (await sql`
        insert into weekend_locations (weekend_id, name, address, sort_order, is_primary)
        values (${weekend.id}, ${`Field ${i}`}, ${"Name this park on Locations"}, ${i}, ${i === 1})
        returning id
      `)[0];
		if (row?.id) locations.push({ id: row.id });
	}
	else for (const row of haveLocs) locations.push({ id: row.id });
	const age = weekend.ageGroups.find((group) => isAgeGroup(group));
	if (!age) return locations.length;
	const n = Math.max(2, weekend.maxTeams);
	const shellId = (seed) => 1e6 + seed;
	const poolSlots = Array.from({ length: n }, (_, i) => ({
		seed: i + 1,
		teamId: shellId(i + 1),
		open: true
	}));
	const poolGames = weekend.poolPlay ? buildPools(poolSlots, weekend.rules.poolGamesPerTeam).flatMap((pool) => pool.games) : [];
	const bracketN = weekend.poolPlay ? Math.max(2, sundayTeamCount(n, true, weekend.rules.advance, weekend.rules.advancePerPool)) : n;
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
		teamCount: n
	});
	for (let seed = 1; seed <= n; seed += 1) await sql`
      insert into bracket_seeds (weekend_id, age_group, seed, team_id, frozen, division_index)
      values (${weekend.id}, ${age}, ${seed}, ${null}, ${false}, ${0})
      on conflict (weekend_id, age_group, seed) do nothing
    `;
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
function mapAgeRow(row) {
	if (!isAgeGroup(row.age_group)) return null;
	return {
		ageGroup: row.age_group,
		minTeams: row.min_teams,
		maxTeams: row.max_teams,
		teamCount: row.team_count ?? 0
	};
}
async function loadWeekendOrThrow(id) {
	await ensureLiveOpsColumns();
	const row = (await (await getSql())`
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
      (select count(*)::int from tournament_interest i where i.weekend_id = w.id) as interest_count
    from weekends w
    where w.id = ${id}
    limit 1
  `)[0];
	if (!row) throw new Error("That tournament is gone.");
	return row;
}
async function loadAges(weekendId, fallback) {
	const sql = await getSql();
	let mapped = (await sql`
    select
      a.age_group,
      a.min_teams,
      a.max_teams,
      (select count(*)::int from teams t
        where t.weekend_id = a.weekend_id and t.age_group = a.age_group) as team_count
    from weekend_age_groups a
    where a.weekend_id = ${weekendId}
  `).map(mapAgeRow).filter((row) => row != null);
	if (mapped.length === 0 && fallback.length > 0) {
		for (const ageGroup of fallback) await sql`
        insert into weekend_age_groups (weekend_id, age_group)
        values (${weekendId}, ${ageGroup})
        on conflict (weekend_id, age_group) do nothing
      `;
		mapped = fallback.map((ageGroup) => ({
			ageGroup,
			minTeams: null,
			maxTeams: null,
			teamCount: 0
		}));
	}
	mapped.sort((a, b) => AGE_GROUPS.indexOf(a.ageGroup) - AGE_GROUPS.indexOf(b.ageGroup));
	return mapped;
}
function storedAges(value) {
	let list = value;
	if (typeof value === "string") try {
		list = JSON.parse(value);
	} catch {
		list = [];
	}
	if (!Array.isArray(list)) return [];
	return AGE_GROUPS.filter((age) => list.includes(age));
}
function mapFlags(row) {
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
		discountPrice: ageDiscount && row.discount_price != null ? String(row.discount_price) : ""
	};
}
async function loadLocations(weekendId) {
	await ensureLiveOpsColumns();
	return (await (await getSql())`
    select id, park_id, name, address, is_primary, entrance_fee, entrance_price, age_discount, discount_ages, discount_price, chairs_allowed, canopies, concessions, restrooms, lights, bleachers
    from weekend_locations
    where weekend_id = ${weekendId}
    order by is_primary desc, sort_order asc, id asc
  `).map((row) => ({
		id: row.id,
		parkId: row.park_id == null ? null : Number(row.park_id),
		name: row.name,
		address: row.address,
		isPrimary: Boolean(row.is_primary),
		...mapFlags(row)
	}));
}
async function loadWeekendTeams(weekendId) {
	const rows = await (await getSql())`
    select id, name, age_group, is_demo
    from teams
    where weekend_id = ${weekendId} and status = ${"approved"}
    order by age_group asc, name asc, id asc
  `;
	const list = [];
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
async function loadWeekendDetail(id) {
	const weekend = mapWeekend(await loadWeekendOrThrow(id));
	const [ages, allLocations, teams] = await Promise.all([
		loadAges(weekend.id, weekend.ageGroups),
		loadLocations(weekend.id),
		loadWeekendTeams(weekend.id)
	]);
	const locations = allLocations.filter((location) => !/^Field \d+ TBD$/i.test(String(location.name ?? "")));
	return {
		...weekend,
		locationCount: locations.length,
		ages,
		locations,
		teams,
		hasBracket: (await (await getSql())`
        select 1 as ok from games
        where weekend_id = ${id} and round <> ${"pool"} and is_bye = ${false}
        limit 1
      `).length > 0,
		hasPoolGames: (await (await getSql())`
        select 1 as ok from games
        where weekend_id = ${id} and round = ${"pool"}
        limit 1
      `).length > 0,
		teamEntryClosed: teamEntryClosed({
			startDate: weekend.startDate,
			today: isoDateFromLocal(/* @__PURE__ */ new Date()),
			scored: false,
			days: weekend.rules.dropCutoffDays
		}),
		placeConflict: (await (await getSql())`
        select 1 as ok from games
        where weekend_id = ${id} and place_conflict = ${true}
        limit 1
      `).length > 0,
		staffHint: await staffHintFor(id, locations.map((location) => location.id))
	};
}
var getWeekend_createServerFn_handler = createServerRpc({
	id: "1ef4a99717b6eb5c7472eebfe2bbcd1207e14347a2299d64292dffeb410e39a0",
	name: "getWeekend",
	filename: "src/lib/pbi/api.ts"
}, (opts) => getWeekend.__executeServer(opts));
var getWeekend = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ id: parsePositiveInt(data?.id, "Missing tournament.") })).handler(getWeekend_createServerFn_handler, async ({ context, data }) => {
	if ((await loadProfile(context.userId))?.homeRole === "admin") return loadWeekendDetail(data.id);
	const acting = { userId: context.userId };
	await actAsCoach(acting);
	if (!(await (await getSql())`
    select 1 as ok from teams
    where weekend_id = ${data.id} and coach_user_id = ${acting.userId} and status = ${"approved"}
    limit 1
  `)[0]) throw new Error("You're not on this tournament.");
	return loadWeekendDetail(data.id);
});
var saveWeekendCap_createServerFn_handler = createServerRpc({
	id: "1ced62784ab3de6855e5775021c194baaf81289ce7dfb9f2625115e02bbf1b9a",
	name: "saveWeekendCap",
	filename: "src/lib/pbi/api.ts"
}, (opts) => saveWeekendCap.__executeServer(opts));
var saveWeekendCap = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
	maxTeams: parseTournamentMax(data?.maxTeams)
})).handler(saveWeekendCap_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await loadWeekendOrThrow(data.weekendId);
	await (await getSql())`
      update weekends
      set max_teams = ${data.maxTeams}
      where id = ${data.weekendId}
    `;
	return loadWeekendDetail(data.weekendId);
});
var saveWeekendAges_createServerFn_handler = createServerRpc({
	id: "dbff345bfff61d17611f7db11538c685695d5b461859036ff504c8e9947a275d",
	name: "saveWeekendAges",
	filename: "src/lib/pbi/api.ts"
}, (opts) => saveWeekendAges.__executeServer(opts));
var saveWeekendAges = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => parseAgeCaps(data)).handler(saveWeekendAges_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await loadWeekendOrThrow(data.weekendId);
	const sql = await getSql();
	const existing = await sql`
      select age_group from weekend_age_groups where weekend_id = ${data.weekendId}
    `;
	const allowed = new Set(existing.map((row) => row.age_group));
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
var updateWeekend_createServerFn_handler = createServerRpc({
	id: "e01f3d701dbc5bf73f68f8e2b8c1025bb0650080f5c55a693ffd48ce38387828",
	name: "updateWeekend",
	filename: "src/lib/pbi/api.ts"
}, (opts) => updateWeekend.__executeServer(opts));
var updateWeekend = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => parseWeekendUpdate(data)).handler(updateWeekend_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const prior = mapWeekend(await loadWeekendOrThrow(data.weekendId));
	const sql = await getSql();
	const used = await sql`
      select distinct age_group from teams where weekend_id = ${data.weekendId}
    `;
	const priorAges = new Set(prior.ageGroups);
	const nextAges = new Set(data.ages.map((age) => age.ageGroup));
	for (const row of used) {
		if (!isAgeGroup(row.age_group)) continue;
		if (!priorAges.has(row.age_group)) continue;
		if (!nextAges.has(row.age_group)) throw new Error(`Can’t drop ${row.age_group} while a team is on it.`);
	}
	const lockSunday = data.poolPlay ? data.poolPlay === prior.poolPlay ? prior.sundaySeedsLocked : false : prior.sundaySeedsLocked;
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
	const have = new Set(existing.map((row) => row.age_group));
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
async function upsertPark(sql, name, address, flags, updateFlags) {
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
var listKnownParks_createServerFn_handler = createServerRpc({
	id: "3493e72526e11937acae5a30d2a514a9fad1550df5e44b7322b9e1814082bb8f",
	name: "listKnownParks",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listKnownParks.__executeServer(opts));
var listKnownParks = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listKnownParks_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	return (await (await getSql())`
    select id, name, address, entrance_fee, entrance_price, age_discount, discount_ages, discount_price, chairs_allowed, canopies, concessions, restrooms, lights, bleachers
    from parks
    where name !~ '^Field [0-9]+ TBD$'
    order by name asc, id asc
  `).map((row) => ({
		id: row.id,
		name: row.name,
		address: row.address,
		...mapFlags(row)
	}));
});
var addKnownPark_createServerFn_handler = createServerRpc({
	id: "46ccd1d634e5a90f26c5d19d7e089ca68e744ab713b19fc35e21731d7f614f4f",
	name: "addKnownPark",
	filename: "src/lib/pbi/api.ts"
}, (opts) => addKnownPark.__executeServer(opts));
var addKnownPark = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const parsed = parseLocationInput({
		weekendId: 1,
		name: data?.name,
		address: data?.address
	});
	return {
		name: parsed.name,
		address: parsed.address,
		...parseParkFlags(data)
	};
}).handler(addKnownPark_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const flags = parseParkFlags(data);
	return {
		id: await upsertPark(await getSql(), data.name, data.address, flags, true),
		name: data.name,
		address: data.address,
		...flags
	};
});
var listParkBookings_createServerFn_handler = createServerRpc({
	id: "c569768ccf33796c978d75dd2af7b3dad713576abe4f1724631802a2a98a34ba",
	name: "listParkBookings",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listParkBookings.__executeServer(opts));
var listParkBookings = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => {
	const startDate = typeof data?.startDate === "string" ? data.startDate : "";
	const endDate = typeof data?.endDate === "string" ? data.endDate : "";
	if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) throw new Error("Pick the tournament dates first.");
	return {
		startDate,
		endDate
	};
}).handler(listParkBookings_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	return (await (await getSql())`
    select w.name as tournament, l.park_id, l.name, l.address
    from weekend_locations l
    join weekends w on w.id = l.weekend_id
    where w.start_date::text <= ${data.endDate}
      and w.end_date::text >= ${data.startDate}
    order by w.name asc, l.name asc
  `).map((row) => ({
		tournament: String(row.tournament),
		parkId: row.park_id == null ? null : Number(row.park_id),
		name: String(row.name ?? ""),
		address: String(row.address ?? "")
	}));
});
var addWeekendLocation_createServerFn_handler = createServerRpc({
	id: "8b3078f2a855cbce4ddc3f4574a4d066b3e85468a814430d4d5c7ba2332ea6e8",
	name: "addWeekendLocation",
	filename: "src/lib/pbi/api.ts"
}, (opts) => addWeekendLocation.__executeServer(opts));
var addWeekendLocation = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	...parseLocationInput(data),
	...parseParkFlags(data)
})).handler(addWeekendLocation_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await loadWeekendOrThrow(data.weekendId);
	await ensureLiveOpsColumns();
	const sql = await getSql();
	const flags = parseParkFlags(data);
	if ((await sql`
    select id from weekend_locations
    where weekend_id = ${data.weekendId}
      and lower(btrim(name)) = lower(${data.name})
      and lower(btrim(address)) = lower(${data.address})
    limit 1
  `)[0]) throw new Error("That park is already on this tournament.");
	const sortOrder = (await sql`
      select coalesce(max(sort_order), -1) + 1 as next
      from weekend_locations
      where weekend_id = ${data.weekendId}
    `)[0]?.next ?? 0;
	const primary = ((await sql`
      select count(*)::int as n from weekend_locations where weekend_id = ${data.weekendId}
    `)[0]?.n ?? 0) === 0;
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
var PARK_FLAG_SET = (flags) => ({
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
	bleachers: flags.bleachers
});
async function writeParkRow(sql, id, name, address, flags) {
	if ((await sql`
    select id from parks
    where id <> ${id}
      and lower(btrim(name)) = lower(${name})
      and lower(btrim(address)) = lower(${address})
    limit 1
  `)[0]) throw new Error("Another saved park already uses that name and address.");
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
var updateKnownPark_createServerFn_handler = createServerRpc({
	id: "961a5448697328b4e19787bc1bada5de9ea0dc05b6973347c23294f135a7bab6",
	name: "updateKnownPark",
	filename: "src/lib/pbi/api.ts"
}, (opts) => updateKnownPark.__executeServer(opts));
var updateKnownPark = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const parsed = parseLocationInput({
		weekendId: 1,
		name: data?.name,
		address: data?.address
	});
	return {
		id: parsePositiveInt(data?.id, "Missing park."),
		name: parsed.name,
		address: parsed.address,
		...parseParkFlags(data)
	};
}).handler(updateKnownPark_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql = await getSql();
	const flags = parseParkFlags(data);
	if (!(await sql`select id from parks where id = ${data.id} limit 1`)[0]) throw new Error("That saved park is gone.");
	await writeParkRow(sql, data.id, data.name, data.address, flags);
	return {
		id: data.id,
		name: data.name,
		address: data.address,
		...flags
	};
});
var removeKnownPark_createServerFn_handler = createServerRpc({
	id: "8d76e2418ff9ff36ae129b9578cd677b1bd1911c20c6648112a0a3a6f316e344",
	name: "removeKnownPark",
	filename: "src/lib/pbi/api.ts"
}, (opts) => removeKnownPark.__executeServer(opts));
var removeKnownPark = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ id: parsePositiveInt(data?.id, "Missing park.") })).handler(removeKnownPark_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql = await getSql();
	if (!(await sql`select id from parks where id = ${data.id} limit 1`)[0]) throw new Error("That saved park is gone.");
	await sql`update weekend_locations set park_id = ${null} where park_id = ${data.id}`;
	await sql`delete from parks where id = ${data.id}`;
	return { id: data.id };
});
var updateWeekendLocation_createServerFn_handler = createServerRpc({
	id: "9132a01d59476a8b2352fad1e5d93a9083509f9a3d9152a4e1c627f2c0cfb1dc",
	name: "updateWeekendLocation",
	filename: "src/lib/pbi/api.ts"
}, (opts) => updateWeekendLocation.__executeServer(opts));
var updateWeekendLocation = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const parsed = parseLocationInput({
		weekendId: 1,
		name: data?.name,
		address: data?.address
	});
	return {
		id: parsePositiveInt(data?.id, "Missing park."),
		name: parsed.name,
		address: parsed.address,
		saveToResource: data?.saveToResource === true,
		...parseParkFlags(data)
	};
}).handler(updateWeekendLocation_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql = await getSql();
	const row = (await sql`
    select id, weekend_id, park_id from weekend_locations where id = ${data.id} limit 1
  `)[0];
	if (!row) throw new Error("That park is already gone.");
	await loadWeekendOrThrow(row.weekend_id);
	const flags = parseParkFlags(data);
	if ((await sql`
    select id from weekend_locations
    where weekend_id = ${row.weekend_id}
      and id <> ${data.id}
      and lower(btrim(name)) = lower(${data.name})
      and lower(btrim(address)) = lower(${data.address})
    limit 1
  `)[0]) throw new Error("That park is already on this tournament.");
	let parkId = row.park_id == null ? null : Number(row.park_id);
	if (data.saveToResource) {
		if (parkId) {
			if ((await sql`select id from parks where id = ${parkId} limit 1`)[0]) await writeParkRow(sql, parkId, data.name, data.address, flags);
			else parkId = await upsertPark(sql, data.name, data.address, flags, true);
		} else parkId = await upsertPark(sql, data.name, data.address, flags, true);
	} else if (parkId) {
		const linked = (await sql`select name, address from parks where id = ${parkId} limit 1`)[0];
		if (!(linked && String(linked.name).trim().toLowerCase() === data.name.toLowerCase() && String(linked.address).trim().toLowerCase() === data.address.toLowerCase())) parkId = null;
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
var removeWeekendLocation_createServerFn_handler = createServerRpc({
	id: "d255f7739c2d7c39bafef180d9ee6cefb2ecc86d9bffcea0f2cbbafe9462b266",
	name: "removeWeekendLocation",
	filename: "src/lib/pbi/api.ts"
}, (opts) => removeWeekendLocation.__executeServer(opts));
var removeWeekendLocation = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ id: parsePositiveInt(data?.id, "Missing park.") })).handler(removeWeekendLocation_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const sql = await getSql();
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
	if (!(await sql`
      select id from weekend_locations
      where weekend_id = ${weekendId} and is_primary = true
      limit 1
    `)[0]) {
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
var setPrimaryPark_createServerFn_handler = createServerRpc({
	id: "a726fabb4fed38cc3c918f662ef8a682525b8dbc0ef199b3c5614514306cf7fb",
	name: "setPrimaryPark",
	filename: "src/lib/pbi/api.ts"
}, (opts) => setPrimaryPark.__executeServer(opts));
var setPrimaryPark = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ id: parsePositiveInt(data?.id, "Missing park.") })).handler(setPrimaryPark_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql = await getSql();
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
async function loadAgeCounts(weekendId) {
	const rows = await (await getSql())`
    select age_group, count(*)::int as n
    from teams
    where weekend_id = ${weekendId} and status = ${"approved"}
    group by age_group
  `;
	return new Map(rows.map((row) => [row.age_group, row.n]));
}
async function toOpenAges(weekendId, fallback) {
	const ages = await loadAges(weekendId, fallback);
	const counts = await loadAgeCounts(weekendId);
	return ages.map((age) => {
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
function mapRegisteredTeam(row, locations, players) {
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
async function loadRoster(teamId) {
	return (await (await getSql())`
    select id, name, jersey, age_group
    from roster_players
    where team_id = ${teamId}
    order by jersey asc, name asc
  `).map((row) => {
		if (!isAgeGroup(row.age_group)) throw new Error("That player has a bad age group.");
		return {
			id: row.id,
			name: row.name,
			jersey: row.jersey,
			ageGroup: row.age_group
		};
	});
}
async function loadOwnedTeam(userId, teamId) {
	await ensureAttendanceColumn();
	const row = (await (await getSql())`
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
function isDuplicateKey(err) {
	const msg = err instanceof Error ? err.message : String(err);
	return /unique|duplicate key|23505/i.test(msg);
}
async function weekendHasScoredGame(weekendId) {
	const row = (await (await getSql())`
    select 1 as ok from games
    where weekend_id = ${weekendId}
      and (home_score is not null or away_score is not null or forfeit is not null)
    limit 1
  `)[0];
	return Boolean(row);
}
async function assertTeamEntryOpen(weekendId, startDate) {
	const weekend = mapWeekend(await loadWeekendOrThrow(weekendId));
	const reason = teamEntryClosed({
		startDate: weekend.startDate || startDate,
		today: isoDateFromLocal(/* @__PURE__ */ new Date()),
		scored: await weekendHasScoredGame(weekendId),
		days: weekend.rules.dropCutoffDays
	});
	if (reason) throw new Error(reason);
}
var listOpenTournaments_createServerFn_handler = createServerRpc({
	id: "2afdaaf302b57e6c1439eb0bc4c91edb911c26ce7b3038292c5365d5802cdefa",
	name: "listOpenTournaments",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listOpenTournaments.__executeServer(opts));
var listOpenTournaments = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listOpenTournaments_createServerFn_handler, async ({ context }) => {
	await actAsCoach(context);
	const today = isoDateFromLocal(/* @__PURE__ */ new Date());
	const rows = await (await getSql())`
      select
        w.id,
        w.name,
        w.start_date,
        w.end_date,
        w.age_groups,
        w.max_teams,
        w.pool_play,
        w.day_plan,
        (select count(*)::int from weekend_locations l where l.weekend_id = w.id and l.name !~ '^Field [0-9]+ TBD$') as location_count,
        (select count(*)::int from teams t where t.weekend_id = w.id and t.status = ${"approved"}) as approved_count,
        (select count(*)::int from games g
          where g.weekend_id = w.id
            and (g.home_score is not null or g.away_score is not null or g.forfeit is not null)
        ) as scored_count
      from weekends w
      where w.start_date > ${today}
      order by w.start_date asc, w.id asc
    `;
	const list = [];
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
var attendanceColumnReady = null;
function ensureAttendanceColumn() {
	if (!attendanceColumnReady) attendanceColumnReady = (async () => {
		await (await getSql()).query("alter table teams add column if not exists attending_confirmed boolean not null default false");
	})().catch((error) => {
		attendanceColumnReady = null;
		throw error;
	});
	return attendanceColumnReady;
}
var listMyTeams_createServerFn_handler = createServerRpc({
	id: "59e94e501b5f5bed107e42d843c401d78ce1e77d99f59df1efa269a8bfe67d1f",
	name: "listMyTeams",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listMyTeams.__executeServer(opts));
var listMyTeams = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listMyTeams_createServerFn_handler, async ({ context }) => {
	await actAsCoach(context);
	await ensureAttendanceColumn();
	const rows = await (await getSql())`
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
var confirmAttendance_createServerFn_handler = createServerRpc({
	id: "86faeea63aad207762d93d4d60e992418a9b08c490d8a51e00b66a25a3c2fc16",
	name: "confirmAttendance",
	filename: "src/lib/pbi/api.ts"
}, (opts) => confirmAttendance.__executeServer(opts));
var confirmAttendance = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ teamId: parsePositiveInt(data?.teamId, "Missing team.") })).handler(confirmAttendance_createServerFn_handler, async ({ context, data }) => {
	await actAsCoach(context);
	await ensureAttendanceColumn();
	if (!(await (await getSql())`
    update teams
    set attending_confirmed = true
    where id = ${data.teamId} and coach_user_id = ${context.userId} and status = ${"approved"}
    returning id
  `)[0]) throw new Error("That team is not in this tournament yet.");
	return { ok: true };
});
var getMyTeam_createServerFn_handler = createServerRpc({
	id: "f2ab8c511c0aa155d6260d4fd245d65bc907e3b10332abd5960a74515cc557e4",
	name: "getMyTeam",
	filename: "src/lib/pbi/api.ts"
}, (opts) => getMyTeam.__executeServer(opts));
var getMyTeam = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ id: parsePositiveInt(data?.id, "Missing team.") })).handler(getMyTeam_createServerFn_handler, async ({ context, data }) => {
	await actAsCoach(context);
	return loadOwnedTeam(context.userId, data.id);
});
var registerTeam_createServerFn_handler = createServerRpc({
	id: "900792c54ed1a86d5f3dcef69bc705815f6e8698e59d5602bc02ad67a5274097",
	name: "registerTeam",
	filename: "src/lib/pbi/api.ts"
}, (opts) => registerTeam.__executeServer(opts));
var registerTeam = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => parseTeamRegister(data)).handler(registerTeam_createServerFn_handler, async ({ context, data }) => {
	await actAsCoach(context);
	const weekend = mapWeekend(await loadWeekendOrThrow(data.weekendId));
	const today = isoDateFromLocal(/* @__PURE__ */ new Date());
	if (weekend.endDate < today) throw new Error("That tournament is already over.");
	await assertTeamEntryOpen(weekend.id, weekend.startDate);
	if (!(await toOpenAges(weekend.id, weekend.ageGroups)).find((item) => item.ageGroup === data.ageGroup)) throw new Error(`${data.ageGroup} isn’t on this tournament.`);
	const sql = await getSql();
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
var listPendingTeams_createServerFn_handler = createServerRpc({
	id: "5bf9f2dfaea4228fc5b119e1c9b2e71ca887319e558db98c45e76eb522240fed",
	name: "listPendingTeams",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listPendingTeams.__executeServer(opts));
var listPendingTeams = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listPendingTeams_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	const rows = await (await getSql())`
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
	const list = [];
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
var reviewTeam_createServerFn_handler = createServerRpc({
	id: "bae827de7ea5de9df1ce54c5db698a9588da27f199c873a4c0a7cb4c268bf44d",
	name: "reviewTeam",
	filename: "src/lib/pbi/api.ts"
}, (opts) => reviewTeam.__executeServer(opts));
var reviewTeam = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const id = parsePositiveInt(data?.id, "Missing team.");
	if (data?.action !== "approve" && data?.action !== "deny") throw new Error("Approve or deny that team.");
	return {
		id,
		action: data.action
	};
}).handler(reviewTeam_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const sql = await getSql();
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
		const age = (await toOpenAges(team.weekend_id, [])).find((item) => item.ageGroup === team.age_group);
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
var addPlayer_createServerFn_handler = createServerRpc({
	id: "8fae08c88a5242a83b68a4d228d7de3d5116dd5fcf3cf1d1e1f533f582fa1848",
	name: "addPlayer",
	filename: "src/lib/pbi/api.ts"
}, (opts) => addPlayer.__executeServer(opts));
var addPlayer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => parsePlayerInput(data)).handler(addPlayer_createServerFn_handler, async ({ context, data }) => {
	await actAsCoach(context);
	const team = await loadOwnedTeam(context.userId, data.teamId);
	const sql = await getSql();
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
var removePlayer_createServerFn_handler = createServerRpc({
	id: "6cb1a17d26f27bc36b16f96f2b6557fb31718d34d3d5b69e5193e31927384399",
	name: "removePlayer",
	filename: "src/lib/pbi/api.ts"
}, (opts) => removePlayer.__executeServer(opts));
var removePlayer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	teamId: parsePositiveInt(data?.teamId, "Missing team."),
	playerId: parsePositiveInt(data?.playerId, "Missing player.")
})).handler(removePlayer_createServerFn_handler, async ({ context, data }) => {
	await actAsCoach(context);
	await loadOwnedTeam(context.userId, data.teamId);
	if (!(await (await getSql())`
      delete from roster_players
      where id = ${data.playerId}
        and team_id = ${data.teamId}
      returning id
    `)[0]) throw new Error("That player isn’t on this roster.");
	return loadOwnedTeam(context.userId, data.teamId);
});
function scoredWinner(homeTeamId, awayTeamId, homeScore, awayScore, forfeit) {
	if (forfeit === "home") return awayTeamId;
	if (forfeit === "away") return homeTeamId;
	if (homeScore == null || awayScore == null) return null;
	if (homeScore > awayScore) return homeTeamId;
	if (awayScore > homeScore) return awayTeamId;
	return null;
}
async function applyWinnerAdvance(weekendId, ageGroup) {
	const sql = await getSql();
	const rows = await sql`
    select id, round, slot, home_team_id, away_team_id, home_from_round, home_from_slot, away_from_round, away_from_slot, home_score, away_score, is_bye, forfeit, no_contest
    from games
    where weekend_id = ${weekendId} and age_group = ${ageGroup}
  `;
	const byKey = new Map(rows.map((row) => [`${row.round}:${row.slot}`, row]));
	for (let pass = 0; pass < 2; pass += 1) for (const row of rows) {
		if (row.round === "pool") continue;
		let homeId = row.home_team_id;
		let awayId = row.away_team_id;
		const take = (feeder, current) => {
			if (!feeder) return current;
			if (feeder.is_bye) return feeder.home_team_id ?? feeder.away_team_id ?? current;
			if (feeder.no_contest) {
				if (current != null && (current === feeder.home_team_id || current === feeder.away_team_id)) return null;
				return current;
			}
			return scoredWinner(feeder.home_team_id, feeder.away_team_id, feeder.home_score, feeder.away_score, feeder.forfeit);
		};
		if (row.home_from_round != null && row.home_from_slot != null) homeId = take(byKey.get(`${row.home_from_round}:${row.home_from_slot}`), homeId);
		if (row.away_from_round != null && row.away_from_slot != null) awayId = take(byKey.get(`${row.away_from_round}:${row.away_from_slot}`), awayId);
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
async function removeDemoCoaches(sql) {
	await sql.query("alter table profiles add column if not exists is_temp boolean not null default false");
	const rows = await sql`
    select user_id from profiles
    where is_temp = true or user_id like ${"temp-coach-%"}
  `;
	const ids = [...new Set(rows.map((row) => String(row.user_id)))];
	if (ids.length === 0) return;
	for (const userId of ids) await wipeUserAccount(sql, String(userId));
}
async function wipeUserAccount(sql, userId) {
	const teams = await sql`select id from teams where coach_user_id = ${userId}`;
	for (const team of teams) {
		await sql`delete from roster_players where team_id = ${team.id}`;
		await sql`update games set home_team_id = null where home_team_id = ${team.id}`;
		await sql`update games set away_team_id = null where away_team_id = ${team.id}`;
		await sql`update bracket_seeds set team_id = null where team_id = ${team.id}`;
		await sql`delete from teams where id = ${team.id}`;
	}
	const squads = await sql`select id from coach_signup_teams where user_id = ${userId}`;
	for (const squad of squads) await sql`delete from coach_roster_players where team_id = ${squad.id}`;
	await sql`delete from coach_signup_teams where user_id = ${userId}`;
	await sql`delete from tournament_responses where coach_user_id = ${userId}`;
	await sql`delete from tournament_interest where coach_user_id = ${userId}`;
	try {
		await sql`delete from event_age_responses where coach_user_id = ${userId}`;
	} catch {}
	try {
		await sql`delete from coach_text_opens where coach_user_id = ${userId}`;
	} catch {}
	await sql`delete from notifications where user_id = ${userId}`;
	await sql`delete from role_requests where user_id = ${userId}`;
	try {
		await sql`delete from weekend_scorekeepers where user_id = ${userId}`;
	} catch {}
	try {
		await sql`delete from score_audit where user_id = ${userId}`;
	} catch {}
	try {
		await sql`update coach_invites set accepted_user_id = null where accepted_user_id = ${userId}`;
	} catch {}
	try {
		await sql`update profiles set view_as_coach_id = null where view_as_coach_id = ${userId}`;
	} catch {}
	await sql`delete from profiles where user_id = ${userId}`;
	try {
		await sql`delete from "session" where "userId" = ${userId}`;
	} catch {}
	try {
		await sql`delete from "account" where "userId" = ${userId}`;
	} catch {}
	try {
		await sql`delete from "user" where id = ${userId}`;
	} catch {}
}
var eraseAccount_createServerFn_handler = createServerRpc({
	id: "1858d1945dd0aab0d97f5973628b8b0aae859ccb8b9c9953e3a33492a4905242",
	name: "eraseAccount",
	filename: "src/lib/pbi/api.ts"
}, (opts) => eraseAccount.__executeServer(opts));
var eraseAccount = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const userId = String(data?.userId ?? "").trim();
	if (!userId) throw new Error("Missing account.");
	return { userId };
}).handler(eraseAccount_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	if (data.userId === context.userId) throw new Error("You can’t delete your own account.");
	await ensureSuperuserColumn();
	const sql = await getSql();
	const target = (await sql`select user_id, email, home_role from profiles where user_id = ${data.userId} limit 1`)[0];
	if (!target) throw new Error("That account is already gone.");
	if (isSuperuserOwner(target.email)) throw new Error("That superuser can’t be removed.");
	if (target.home_role === "admin") await requireAdminManager(context.userId);
	await wipeUserAccount(sql, data.userId);
	return { ok: true };
});
var liveOpsReady = null;
async function ensureLiveOpsColumns() {
	if (!liveOpsReady) liveOpsReady = applyLiveOpsColumns().catch((error) => {
		liveOpsReady = null;
		throw error;
	});
	return liveOpsReady;
}
async function applyLiveOpsColumns() {
	const sql = await getSql();
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
	for (const column of [
		"parking",
		"entrance_fee",
		"chairs_allowed",
		"concessions",
		"restrooms",
		"lights",
		"bleachers"
	]) await sql.query(`alter table weekend_locations add column if not exists ${column} boolean not null default false`);
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
	} catch {}
}
function staffDigits(phone) {
	let digits = phone.replace(/\D/g, "");
	if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
	return digits;
}
function staffPersonKey(slot, members) {
	if (slot.staffId) return `id:${slot.staffId}`;
	const digits = staffDigits(slot.otherPhone ?? "");
	if (digits.length !== 10) return null;
	const match = members.find((member) => staffDigits(member.phone) === digits);
	return match ? `id:${match.id}` : `phone:${digits}`;
}
function staffCrossFieldWarning(slots, members) {
	const fields = /* @__PURE__ */ new Map();
	for (const slot of slots) {
		const key = staffPersonKey(slot, members);
		if (!key) continue;
		const set = fields.get(key) ?? /* @__PURE__ */ new Set();
		set.add(slot.locationId);
		fields.set(key, set);
	}
	return [...fields.values()].some((set) => set.size > 1) ? "Same person on 2 fields" : null;
}
async function staffHintFor(weekendId, locationIds) {
	if (locationIds.length === 0) return "Add a field first";
	await ensureLiveOpsColumns();
	const sql = await getSql();
	const members = (await sql`select id, name, phone from staff_members order by name asc`).map((row) => ({
		id: Number(row.id),
		name: String(row.name),
		phone: String(row.phone)
	}));
	const slots = (await sql`
    select location_id, role, staff_id, other_name, other_phone
    from weekend_staff
    where weekend_id = ${weekendId}
  `).map((row) => ({
		locationId: Number(row.location_id),
		role: row.role === "scorekeeper" ? "scorekeeper" : "gate",
		staffId: row.staff_id == null ? null : Number(row.staff_id),
		otherName: row.other_name ? String(row.other_name) : null,
		otherPhone: row.other_phone ? String(row.other_phone) : null
	}));
	if (!locationIds.flatMap((locationId) => ["gate", "scorekeeper"].map((role) => ({
		locationId,
		role
	}))).every((need) => {
		const slot = slots.find((row) => row.locationId === need.locationId && row.role === need.role);
		return Boolean(slot && staffPersonKey(slot, members));
	})) return "Needs staff";
	return staffCrossFieldWarning(slots, members) ?? "Staff set";
}
var listStaff_createServerFn_handler = createServerRpc({
	id: "069124682be67e228a49daa97969776e947b50cbbdca194d72c18e5f3abac579",
	name: "listStaff",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listStaff.__executeServer(opts));
var listStaff = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listStaff_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	return (await (await getSql())`select id, name, phone from staff_members order by name asc, id asc`).map((row) => ({
		id: Number(row.id),
		name: String(row.name),
		phone: formatPhoneInput(String(row.phone))
	}));
});
var saveStaffMember_createServerFn_handler = createServerRpc({
	id: "58b933e1f5675bade19137bf0e347e02b200c90d0862deaba01a3a4b632e331d",
	name: "saveStaffMember",
	filename: "src/lib/pbi/api.ts"
}, (opts) => saveStaffMember.__executeServer(opts));
var saveStaffMember = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const name = typeof data?.name === "string" ? data.name.trim() : "";
	if (!name) throw new Error("Enter a name.");
	const phone = formatPhoneInput(typeof data?.phone === "string" ? data.phone : "");
	if (staffDigits(phone).length !== 10) throw new Error("Enter a phone number.");
	return {
		name: name.slice(0, 80),
		phone
	};
}).handler(saveStaffMember_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql = await getSql();
	if ((await sql`select id from staff_members where phone = ${data.phone} limit 1`)[0]) throw new Error("That phone is already on staff.");
	const row = (await sql`
    insert into staff_members (name, phone)
    values (${data.name}, ${data.phone})
    returning id, name, phone
  `)[0];
	return {
		id: Number(row.id),
		name: String(row.name),
		phone: String(row.phone)
	};
});
var removeStaffMember_createServerFn_handler = createServerRpc({
	id: "b7f5a9df1777aed17e133854305e251d6b7ae518c7027ab1990fe65179045f6e",
	name: "removeStaffMember",
	filename: "src/lib/pbi/api.ts"
}, (opts) => removeStaffMember.__executeServer(opts));
var removeStaffMember = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ id: parsePositiveInt(data?.id, "Missing staff.") })).handler(removeStaffMember_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	await (await getSql())`delete from staff_members where id = ${data.id}`;
	return { id: data.id };
});
var listWeekendStaff_createServerFn_handler = createServerRpc({
	id: "70185612908f9d452b1d0275e27f2dd7e981301c823e09d060f4a52845ccc23e",
	name: "listWeekendStaff",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listWeekendStaff.__executeServer(opts));
var listWeekendStaff = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(listWeekendStaff_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	return (await (await getSql())`
    select location_id, role, staff_id, other_name, other_phone
    from weekend_staff
    where weekend_id = ${data.weekendId}
    order by location_id asc, role asc
  `).map((row) => ({
		locationId: Number(row.location_id),
		role: row.role === "scorekeeper" ? "scorekeeper" : "gate",
		staffId: row.staff_id == null ? null : Number(row.staff_id),
		otherName: row.other_name ? String(row.other_name) : null,
		otherPhone: row.other_phone ? formatPhoneInput(String(row.other_phone)) : null
	}));
});
var saveWeekendStaff_createServerFn_handler = createServerRpc({
	id: "9ffb3bf928213b1d533aa119527223e056ea654b5f3bd8c48a6b808d14360a78",
	name: "saveWeekendStaff",
	filename: "src/lib/pbi/api.ts"
}, (opts) => saveWeekendStaff.__executeServer(opts));
var saveWeekendStaff = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const weekendId = parsePositiveInt(data?.weekendId, "Missing tournament.");
	if (!Array.isArray(data?.slots)) throw new Error("Pick staff for every field.");
	const slots = [];
	for (const slot of data.slots) {
		const role = slot?.role === "scorekeeper" ? "scorekeeper" : slot?.role === "gate" ? "gate" : null;
		if (!role) throw new Error("Pick a position.");
		const staffId = slot?.staffId == null || slot.staffId === "" ? null : parsePositiveInt(slot.staffId, "Pick a staff member.");
		const otherName = typeof slot?.otherName === "string" ? slot.otherName.trim().slice(0, 80) : "";
		const otherPhone = formatPhoneInput(typeof slot?.otherPhone === "string" ? slot.otherPhone : "");
		if (staffId == null && !otherName && staffDigits(otherPhone).length === 0) continue;
		if (staffId == null && (!otherName || staffDigits(otherPhone).length !== 10)) throw new Error("Other staff need a name and phone number.");
		slots.push({
			locationId: parsePositiveInt(slot?.locationId, "Missing field."),
			role,
			staffId,
			otherName: staffId == null ? otherName : null,
			otherPhone: staffId == null ? otherPhone : null
		});
	}
	return {
		weekendId,
		slots
	};
}).handler(saveWeekendStaff_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await ensureLiveOpsColumns();
	const sql = await getSql();
	const locationIds = (await sql`select id from weekend_locations where weekend_id = ${data.weekendId}`).map((row) => Number(row.id));
	if (locationIds.length === 0) throw new Error("Add a field before assigning staff.");
	const members = (await sql`select id, name, phone from staff_members`).map((row) => ({
		id: Number(row.id),
		name: String(row.name),
		phone: String(row.phone)
	}));
	for (const slot of data.slots) {
		if (slot.staffId != null && !members.some((member) => member.id === slot.staffId)) throw new Error("That staff member is gone.");
		if (!locationIds.includes(slot.locationId)) throw new Error("That field is not on this tournament.");
	}
	await sql`delete from weekend_staff where weekend_id = ${data.weekendId}`;
	for (const slot of data.slots) await sql`
      insert into weekend_staff (weekend_id, location_id, role, staff_id, other_name, other_phone)
      values (${data.weekendId}, ${slot.locationId}, ${slot.role}, ${slot.staffId}, ${slot.otherName}, ${slot.otherPhone})
    `;
	return {
		detail: await loadWeekendDetail(data.weekendId),
		warning: staffCrossFieldWarning(data.slots, members)
	};
});
async function paintSeedOnOpenGames(weekendId, ageGroup, seed, teamId) {
	const sql = await getSql();
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
async function restoreOpenPoolTeams(weekendId, ageGroup) {
	const sql = await getSql();
	const games = (await sql`
    select id, home_seed, away_seed, home_team_id, away_team_id, home_score, away_score, forfeit, no_contest, pool_index
    from games
    where weekend_id = ${weekendId} and age_group = ${ageGroup} and round = ${POOL_ROUND} and is_bye = ${false}
  `).map((row) => ({
		id: Number(row.id),
		homeSeed: row.home_seed == null ? null : Number(row.home_seed),
		awaySeed: row.away_seed == null ? null : Number(row.away_seed),
		homeTeamId: row.home_team_id == null ? null : Number(row.home_team_id),
		awayTeamId: row.away_team_id == null ? null : Number(row.away_team_id),
		locked: Boolean(row.forfeit) || Boolean(row.no_contest) || row.home_score != null && row.away_score != null,
		poolIndex: row.pool_index == null ? 0 : Number(row.pool_index)
	}));
	const next = restorePoolDraw(games);
	for (let i = 0; i < next.length; i += 1) {
		const before = games[i];
		const after = next[i];
		if (!before || !after) continue;
		if (before.homeTeamId === after.homeTeamId && before.awayTeamId === after.awayTeamId && before.homeSeed === after.homeSeed && before.awaySeed === after.awaySeed) continue;
		await sql`
      update games
      set home_team_id = ${after.homeTeamId}, away_team_id = ${after.awayTeamId},
          home_seed = ${after.homeSeed}, away_seed = ${after.awaySeed}
      where id = ${after.id} and home_score is null and away_score is null and forfeit is null and no_contest = ${false}
    `;
	}
}
async function fillOpenSeeds(weekend, ageGroup, teamIds) {
	if (weekend.rules.coachPath === "custom") return;
	const sql = await getSql();
	const seeds = await sql`
    select seed, team_id, frozen from bracket_seeds
    where weekend_id = ${weekend.id} and age_group = ${ageGroup}
    order by seed asc
  `;
	if (seeds.length === 0) return;
	const approved = new Set(teamIds);
	const seated = /* @__PURE__ */ new Set();
	for (const row of seeds) if (row.team_id != null && approved.has(row.team_id)) seated.add(row.team_id);
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
function clockSlots(firstPitch, lastStart, slotMinutes) {
	const [sh, sm] = firstPitch.split(":").map(Number);
	const [eh, em] = lastStart.split(":").map(Number);
	const start = (sh || 0) * 60 + (sm || 0);
	const end = (eh || 0) * 60 + (em || 0);
	const step = Math.max(15, slotMinutes || 120);
	const slots = [];
	for (let minute = start; minute <= end; minute += step) slots.push(`${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`);
	return slots;
}
async function fitEnteredSheet(weekend, ageGroup, teamIds) {
	if (weekend.lifecycle === "announced" || weekend.sheetLocked || weekend.rules.coachPath === "custom") return;
	const sql = await getSql();
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
	const priorIds = seated.map((row) => Number(row.team_id));
	const sameTeams = priorIds.length === idsIn.length && priorIds.every((id) => idsIn.includes(id));
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
		const checkSlots = idsIn.map((teamId, index) => ({
			seed: index + 1,
			teamId,
			open: true
		}));
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
			const bare = (await sql`
        select count(*)::int as n from games
        where weekend_id = ${weekend.id} and age_group = ${ageGroup} and is_bye = ${false} and location_id is null
      `)[0];
			if (Number(bare?.n ?? 0) === 0) return;
		}
	}
	const ids = [...priorIds.filter((id) => idsIn.includes(id)), ...idsIn.filter((id) => !priorIds.includes(id))];
	if (!(seated.length === ids.length && seated.every((row, index) => Number(row.seed) === index + 1 && Number(row.team_id) === ids[index]))) {
		await sql`delete from bracket_seeds where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
		for (let index = 0; index < ids.length; index += 1) await sql`
        insert into bracket_seeds (weekend_id, age_group, seed, team_id, frozen, division_index)
        values (${weekend.id}, ${ageGroup}, ${index + 1}, ${ids[index]}, ${false}, ${0})
      `;
	}
	const slots = ids.map((teamId, index) => ({
		seed: index + 1,
		teamId,
		open: true
	}));
	const poolGames = buildPools(slots).flatMap((pool) => pool.games);
	const bracketGames = buildGames(slots, { firstVsLast: weekend.rules.packSeed1vsLast });
	const playable = [...poolGames.map((game) => ({
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
		poolIndex: game.poolIndex
	})), ...bracketGames.filter((game) => !game.isBye).map((game) => ({
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
		poolIndex: null
	}))];
	const byes = bracketGames.filter((game) => game.isBye);
	const dates = (weekend.dayPlan.length > 0 ? weekend.dayPlan : [{
		date: weekend.startDate,
		kind: "pool"
	}]).map((day) => day.date);
	const times = clockSlots(weekend.rules.firstPitch || "08:00", weekend.rules.lastStart || "20:00", weekend.rules.slotMinutes || 120);
	if (times.length === 0 || dates.length === 0) return;
	const poolPlayable = playable.filter((game) => game.round === "pool");
	const bracketPlayable = playable.filter((game) => game.round !== "pool");
	const dated = placeOneOrTwoFields(poolPlayable, bracketPlayable, dates[0], times);
	const realParks = locations.filter((loc) => !/^Field \d+ TBD$/i.test(String(loc.name ?? "")));
	let fields = realParks;
	if (realParks.length === 0) {
		const kept = [];
		for (let index = 1; index <= dated.fields; index += 1) {
			const name = `Field ${index} TBD`;
			const have = locations.find((loc) => String(loc.name) === name);
			if (have) {
				kept.push({
					id: have.id,
					name
				});
				continue;
			}
			const row = (await sql`
        insert into weekend_locations (weekend_id, name, address, sort_order, is_primary)
        values (${weekend.id}, ${name}, ${"TBD"}, ${index}, ${index === 1})
        returning id
      `)[0];
			if (row?.id) kept.push({
				id: Number(row.id),
				name
			});
		}
		fields = kept;
	} else if (dated.fields > 1 && realParks.length === 1) {
		const name = realParks[0]?.name ? `${realParks[0].name} 2` : "Field 2";
		const row = (await sql`
      insert into weekend_locations (weekend_id, name, address, sort_order, is_primary)
      values (${weekend.id}, ${name}, ${realParks[0]?.address ?? ""}, ${locations.length + 1}, ${false})
      returning id
    `)[0];
		if (row?.id) fields = [...realParks, {
			id: Number(row.id),
			name
		}];
	}
	const fieldId = (index) => fields[index]?.id ?? null;
	const placed = [...poolPlayable.map((game, index) => ({
		...game,
		date: dated.pool[index].date,
		time: dated.pool[index].time,
		locationId: fieldId(dated.pool[index].field)
	})), ...bracketPlayable.map((game, index) => ({
		...game,
		date: dated.bracket[index].date,
		time: dated.bracket[index].time,
		locationId: fieldId(dated.bracket[index].field)
	}))];
	const scoredNow = (await sql`
    select count(*)::int as n from games
    where weekend_id = ${weekend.id} and age_group = ${ageGroup}
      and is_bye = ${false}
      and (home_score is not null or away_score is not null or forfeit is not null or no_contest = ${true})
  `)[0];
	if (Number(scoredNow?.n ?? 0) > 0) return;
	await sql`delete from games where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
	if (realParks.length > 0) await sql`delete from weekend_locations where weekend_id = ${weekend.id} and name ~ ${"^Field [0-9]+ TBD$"}`;
	else if (dated.fields < 2) await sql`delete from weekend_locations where weekend_id = ${weekend.id} and name = ${"Field 2 TBD"}`;
	for (const game of placed) await sql`
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
	for (const game of byes) await sql`
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
async function fillGuaranteedSeeds(weekend, ageGroup, teamIds) {
	const sql = await getSql();
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
	const results = poolRows.flatMap((row) => row.home_team_id != null && row.away_team_id != null ? [{
		homeTeamId: row.home_team_id,
		awayTeamId: row.away_team_id,
		homeScore: row.home_score == null ? null : Number(row.home_score),
		awayScore: row.away_score == null ? null : Number(row.away_score),
		forfeit: row.forfeit === "home" || row.forfeit === "away" ? row.forfeit : null
	}] : []);
	const placed = poolRows.length > 0 && poolRows.every((row) => row.forfeit || row.no_contest || row.home_score != null && row.away_score != null) ? new Map(poolStandings(teamIds, results, weekend.rules.tiebreakers).map((row) => [row.teamId, row.place])) : guaranteedPlaces(teamIds, results, weekend.rules.tiebreakers, weekend.rules.poolTies);
	const byPlace = /* @__PURE__ */ new Map();
	for (const [teamId, place] of placed) byPlace.set(place, teamId);
	if (!weekend.sundaySeedsLocked) for (const row of seeds) {
		const earnedId = byPlace.get(Number(row.seed));
		if (!row.frozen) continue;
		if (earnedId != null && Number(row.team_id) === earnedId) continue;
		await sql`
        update bracket_seeds set frozen = ${false}
        where weekend_id = ${weekend.id} and age_group = ${ageGroup} and seed = ${row.seed}
      `;
		row.frozen = false;
	}
	for (const [place, teamId] of byPlace) {
		const row = seeds.find((seed) => Number(seed.seed) === place);
		if (!row) continue;
		if (row.frozen && row.team_id != null && Number(row.team_id) !== teamId) continue;
		await sql`
      update bracket_seeds set team_id = ${teamId}, frozen = ${true}
      where weekend_id = ${weekend.id} and age_group = ${ageGroup} and seed = ${place}
    `;
		await paintSeedOnOpenGames(weekend.id, ageGroup, place, teamId);
	}
}
async function flagSeedConflict(weekend, ageGroup, gameId) {
	const sql = await getSql();
	const frozen = (await sql`
    select seed, team_id, frozen from bracket_seeds
    where weekend_id = ${weekend.id} and age_group = ${ageGroup}
  `).filter((row) => row.frozen && row.team_id != null);
	if (frozen.length === 0) return;
	const teamIds = await approvedTeamIds(weekend.id, ageGroup);
	const results = (await sql`
    select home_team_id, away_team_id, home_score, away_score, forfeit
    from games
    where weekend_id = ${weekend.id} and age_group = ${ageGroup} and round = ${"pool"} and is_bye = ${false}
  `).flatMap((row) => row.home_team_id != null && row.away_team_id != null ? [{
		homeTeamId: row.home_team_id,
		awayTeamId: row.away_team_id,
		homeScore: row.home_score == null ? null : Number(row.home_score),
		awayScore: row.away_score == null ? null : Number(row.away_score),
		forfeit: row.forfeit === "home" || row.forfeit === "away" ? row.forfeit : null
	}] : []);
	const placed = guaranteedPlaces(teamIds, results, weekend.rules.tiebreakers, weekend.rules.poolTies);
	let conflict = false;
	for (const row of frozen) {
		const place = placed.get(row.team_id);
		if (place != null && place !== row.seed) conflict = true;
	}
	if (!conflict) return;
	await sql`update games set place_conflict = ${true} where id = ${gameId}`;
	const owner = (await sql`select created_by from weekends where id = ${weekend.id}`)[0];
	if (owner?.created_by) await insertNotification(owner.created_by, "Score changes a seed", `${weekend.name}: a pool score can move a frozen seed. Keep the original or reseed.`);
}
async function markSheetDirty(weekendId) {
	await ensureLiveOpsColumns();
	const sql = await getSql();
	const row = (await sql`
    select start_date, sheet_lock, bracket_rules, public_pushed_at
    from weekends where id = ${weekendId}
  `)[0];
	const start = asDateString(row?.start_date) ?? "";
	const rules = parseBracketRules(row?.bracket_rules);
	if (Boolean(row?.public_pushed_at) && (sheetIsLocked({
		lock: parseSheetLock(row?.sheet_lock),
		startDate: start,
		firstPitch: rules.firstPitch
	}) || pastDropCutoff(start, isoDateFromLocal(/* @__PURE__ */ new Date()), rules.dropCutoffDays))) {
		await sql`update weekends set public_dirty = ${true}, dirty_after_lock = ${true} where id = ${weekendId}`;
		return;
	}
	await sql`update weekends set public_dirty = ${true} where id = ${weekendId}`;
}
async function writeSeedNamesInPlace(weekend, ageGroup, teamIds) {
	await fillGuaranteedSeeds(weekend, ageGroup, teamIds);
}
async function persistAgeBracket(weekend, ageGroup, teamIds, opts = {}) {
	if (weekend.lifecycle === "announced") return;
	const sql = await getSql();
	await ensureLiveOpsColumns();
	if (weekend.sheetLocked && !opts.rebuildPools && !opts.buildBracket && !opts.reset && !opts.fitToSignedUp) {
		if (weekend.sundaySeedsLocked) await writeSeedNamesInPlace(weekend, ageGroup, teamIds);
		await applyWinnerAdvance(weekend.id, ageGroup);
		return;
	}
	const explicit = Boolean(opts.rebuildPools || opts.buildBracket || opts.reset);
	const locations = await loadLocations(weekend.id);
	const plannedCuts = weekend.rules.divisions.length > 0 ? weekend.rules.divisions : [{
		name: "Gold",
		size: Math.max(teamIds.length, weekend.maxTeams)
	}];
	const plannedTotal = plannedCuts.reduce((sum, cut) => sum + cut.size, 0);
	const fit = Boolean(opts.fitToSignedUp || weekend.bracketLocked);
	if (teamIds.length < 2 && (fit || plannedTotal < 2)) {
		if (opts.reset) {
			await sql`delete from games where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
			await sql`delete from bracket_seeds where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
		}
		return;
	}
	if (explicit && locations.length === 0) throw new Error("Add at least one park before generating a schedule.");
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
	if (opts.rebuildPools && hasPlayableBracket(prior.map((row) => ({
		round: row.round,
		isBye: Boolean(row.is_bye)
	})))) throw new Error(POOL_REGEN_BLOCKED);
	const unfreeze = Boolean(opts.reset || opts.buildBracket);
	const frozenMap = /* @__PURE__ */ new Map();
	if (!unfreeze) {
		for (const row of existing) if (row.frozen && row.team_id != null) frozenMap.set(row.seed, row.team_id);
	}
	const slots = syncSeeds(existing.map((row) => ({
		seed: row.seed,
		teamId: frozenMap.get(row.seed) ?? row.team_id
	})), teamIds);
	const confirmed = prior.filter((row) => row.field_confirmed && row.location_id != null && locations.some((loc) => loc.id === row.location_id)).flatMap((row) => isGameRound(row.round) && row.location_id != null ? [{
		round: row.round,
		slot: row.slot,
		locationId: row.location_id
	}] : []);
	let poolGames = [];
	if (weekend.poolPlay && teamIds.length >= 2) {
		const priorPool = prior.filter((row) => row.round === POOL_ROUND);
		const priorIds = /* @__PURE__ */ new Set();
		for (const row of priorPool) {
			if (row.home_team_id != null) priorIds.add(row.home_team_id);
			if (row.away_team_id != null) priorIds.add(row.away_team_id);
		}
		const hasScores = priorPool.some((row) => row.home_score != null || row.away_score != null || row.forfeit);
		const sameN = priorIds.size === teamIds.length && teamIds.every((id) => priorIds.has(id)) && priorPool.length > 0;
		if (!opts.rebuildPools && (sameN || hasScores && priorPool.length > 0)) poolGames = priorPool.slice().sort((a, b) => a.slot - b.slot).flatMap((row, index) => row.home_team_id != null && row.away_team_id != null ? [{
			round: POOL_ROUND,
			slot: index,
			poolIndex: row.pool_index ?? 0,
			homeTeamId: row.home_team_id,
			awayTeamId: row.away_team_id,
			homeSeed: row.home_seed,
			awaySeed: row.away_seed
		}] : []);
		else poolGames = buildPools(slots, weekend.rules.poolGamesPerTeam).flatMap((pool) => pool.games);
		const approvedIds = new Set(teamIds);
		poolGames = poolGames.filter((game) => approvedIds.has(game.homeTeamId) && approvedIds.has(game.awayTeamId));
	}
	const results = poolGames.map((game) => {
		const priorRow = prior.find((row) => row.round === "pool" && row.home_team_id === game.homeTeamId && row.away_team_id === game.awayTeamId);
		return {
			homeTeamId: game.homeTeamId,
			awayTeamId: game.awayTeamId,
			homeScore: priorRow?.home_score == null ? null : Number(priorRow.home_score),
			awayScore: priorRow?.away_score == null ? null : Number(priorRow.away_score),
			forfeit: priorRow?.forfeit === "home" || priorRow?.forfeit === "away" ? priorRow.forfeit : null
		};
	});
	const locked = guaranteedPlaces(teamIds, results, weekend.rules.tiebreakers, weekend.rules.poolTies);
	const standings = poolStandings(teamIds, results, weekend.rules.tiebreakers);
	const fillByPlace = /* @__PURE__ */ new Map();
	for (const [teamId, place] of locked) fillByPlace.set(place, teamId);
	const approved = new Set(teamIds);
	function teamForSeed(seed) {
		const frozen = frozenMap.get(seed);
		if (frozen != null && approved.has(frozen)) return frozen;
		const filled = fillByPlace.get(seed);
		if (filled != null && approved.has(filled)) return filled;
		return null;
	}
	const keepKnockout = hasBracketShell(prior.map((row) => ({ round: row.round }))) || Boolean(opts.buildBracket) || poolGames.length > 0 || plannedTotal >= 2;
	const cuts = plannedCuts;
	const ranked = standings.map((row) => row.teamId);
	const built = [];
	const seedRows = [];
	if (keepKnockout) {
		let remaining = ranked.length > 0 ? ranked.slice() : teamIds.slice();
		for (let di = 0; di < cuts.length; di += 1) {
			const cut = cuts[di];
			const signedUp = Math.min(cut.size, remaining.length);
			const count = fit ? cuts.length > 1 ? signedUp : sundayTeamCount(teamIds.length, weekend.poolPlay, weekend.rules.advance, weekend.rules.advancePerPool) : cut.size;
			if (count < 2) continue;
			const offset = divisionSlotOffset(di);
			remaining.splice(0, count);
			const divSlots = bracketField(count, (seed) => {
				const placed = teamForSeed(seed + (di === 0 ? 0 : offset));
				return placed != null && approved.has(placed) ? placed : null;
			});
			const games = buildGames(divSlots, { firstVsLast: weekend.rules.packSeed1vsLast });
			for (const game of games) built.push({
				...game,
				slot: game.slot + offset,
				homeFromSlot: game.homeFromSlot != null ? game.homeFromSlot + offset : null,
				awayFromSlot: game.awayFromSlot != null ? game.awayFromSlot + offset : null,
				divisionIndex: di
			});
			for (const slot of divSlots) {
				const globalSeed = slot.seed + offset;
				seedRows.push({
					seed: globalSeed,
					teamId: slot.teamId,
					frozen: frozenMap.has(globalSeed) || slot.teamId != null && locked.get(slot.teamId) != null,
					divisionIndex: di
				});
			}
		}
	}
	await sql`delete from bracket_seeds where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
	const seedsToWrite = seedRows.length > 0 ? seedRows : slots.map((slot) => ({
		seed: slot.seed,
		teamId: slot.teamId,
		frozen: frozenMap.has(slot.seed),
		divisionIndex: 0
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
		teamCount: teamIds.length
	});
	await sql`delete from games where weekend_id = ${weekend.id} and age_group = ${ageGroup}`;
	for (const game of built) {
		const place = packed.find((row) => row.round === game.round && row.slot === game.slot);
		const priorRow = prior.find((row) => row.round === game.round && row.slot === game.slot);
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
		const place = packed.find((row) => row.round === game.round && row.slot === game.slot);
		const priorRow = prior.find((row) => row.round === "pool" && row.home_team_id === game.homeTeamId && row.away_team_id === game.awayTeamId);
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
function assertSheetOpen(weekend) {
	if (weekend.sheetLocked) throw new Error("The sheet is locked. Forfeit a game, or replace that club in the same slot.");
}
async function pullTournamentsBackIntoEvents() {
	const sql = await getSql();
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
async function syncWeekendBracket(weekendId) {
	await pullTournamentsBackIntoEvents();
	const weekend = mapWeekend(await loadWeekendOrThrow(weekendId));
	const sql = await getSql();
	const teams = await sql`
    select id, age_group from teams
    where weekend_id = ${weekendId} and status = ${"approved"}
    order by id asc
  `;
	const sole = weekend.ageGroups.length === 1 ? weekend.ageGroups[0] : null;
	if (sole) {
		if (((await sql`
      select count(*)::int as n from bracket_seeds where weekend_id = ${weekendId} and age_group = ${sole}
    `)[0]?.n ?? 0) > 0) {
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
	const ages = new Set(sole ? [sole] : weekend.ageGroups);
	if (!sole) {
		for (const row of teams) ages.add(row.age_group);
		for (const row of leftover) ages.add(row.age_group);
	}
	for (const age of ages) {
		if (!isAgeGroup(age)) continue;
		const teamIds = sole ? teams.map((row) => Number(row.id)) : teams.filter((row) => row.age_group === age).map((row) => Number(row.id));
		if (((await sql`
      select count(*)::int as n from bracket_seeds
      where weekend_id = ${weekendId} and age_group = ${age}
    `)[0]?.n ?? 0) > 0) {
			await fillGuaranteedSeeds(weekend, age, teamIds);
			await fillOpenSeeds(weekend, age, teamIds);
			await applyWinnerAdvance(weekendId, age);
		}
		await restoreOpenPoolTeams(weekendId, age);
		await fitEnteredSheet(weekend, age, teamIds);
	}
}
function blankUnearnedBracketNames(games, seeds, poolPlay, seedsLocked) {
	if (!poolPlay || seedsLocked) return;
	const frozen = new Set(seeds.filter((row) => row.frozen).map((row) => row.seed));
	const byKey = new Map(games.map((game) => [`${game.round}:${game.slot}`, game]));
	const earned = (game, side) => {
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
		return feeder.homeScore != null && feeder.awayScore != null || feeder.forfeit != null;
	};
	for (const game of games) {
		if (game.round === "pool") continue;
		if (game.homeScore != null && game.awayScore != null || game.forfeit != null) continue;
		if (!earned(game, "home")) game.homeName = null;
		if (!earned(game, "away")) game.awayName = null;
	}
}
function asDateString(value) {
	if (value == null) return null;
	if (typeof value === "string") return value.slice(0, 10);
	return isoDateFromLocal(value);
}
function mapScheduleGame(row, teamNames, locations) {
	if (!isAgeGroup(row.age_group) || !isGameRound(row.round)) return null;
	const homeFromRound = row.home_from_round && isRoundId(row.home_from_round) ? row.home_from_round : null;
	const awayFromRound = row.away_from_round && isRoundId(row.away_from_round) ? row.away_from_round : null;
	const startDate = asDateString(row.start_date);
	const location = locations.find((loc) => loc.id === row.location_id) ?? null;
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
		divisionIndex: Number(row.division_index ?? 0)
	};
}
async function loadWeekendSchedule(weekendId) {
	await ensureLiveOpsColumns();
	await syncWeekendBracket(weekendId);
	const weekend = mapWeekend(await loadWeekendOrThrow(weekendId));
	const locations = await loadLocations(weekendId);
	const sql = await getSql();
	const teams = await sql`
    select id, name, age_group from teams
    where weekend_id = ${weekendId} and status = ${"approved"}
  `;
	const names = new Map(teams.map((row) => [row.id, row.name]));
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
	const ageSet = new Set(weekend.ageGroups);
	if (!sole) {
		for (const row of teams) ageSet.add(row.age_group);
		for (const row of seedRows) ageSet.add(row.age_group);
	}
	const ages = [];
	for (const age of AGE_GROUPS) {
		if (!ageSet.has(age)) continue;
		const seeds = seedRows.filter((row) => row.age_group === age).map((row) => ({
			seed: row.seed,
			teamId: row.team_id,
			teamName: row.team_id != null ? names.get(row.team_id) ?? null : null,
			frozen: Boolean(row.frozen),
			divisionIndex: Number(row.division_index ?? 0)
		}));
		const games = gameRows.filter((row) => row.age_group === age).map((row) => mapScheduleGame(row, names, locations)).filter((row) => row != null);
		const numbers = numberPlayableGames(games);
		for (const game of games) game.gameNumber = numbers.get(`${game.round}:${game.slot}`) ?? null;
		if (weekend.poolPlay && !weekend.sundaySeedsLocked) {
			for (const seed of seeds) if (!seed.frozen) seed.teamName = null;
			blankUnearnedBracketNames(games, seeds, true, false);
		}
		const teamIdsForAge = sole ? teams.map((row) => row.id) : teams.filter((row) => row.age_group === age).map((row) => row.id);
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
				poolGames: games.filter((game) => game.round === "pool"),
				teamIds: teamIdsForAge,
				poolGamesPerTeam: weekend.rules.poolGamesPerTeam,
				teamNames: Object.fromEntries(teamIdsForAge.map((id) => [id, names.get(id) ?? `Team ${id}`])),
				locationNames: Object.fromEntries(locations.map((loc) => [loc.id, loc.name]))
			}),
			pools: (() => {
				const grouped = /* @__PURE__ */ new Map();
				for (const game of games) {
					if (game.round !== "pool") continue;
					const index = game.poolIndex ?? 0;
					const list = grouped.get(index) ?? [];
					list.push(game);
					grouped.set(index, list);
				}
				return [...grouped.entries()].sort((a, b) => a[0] - b[0]).map(([index, poolGames]) => ({
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
		ages,
		scorekeepers: (await sql`
    select id, weekend_id, user_id, email, scope, location_id, on_date
    from weekend_scorekeepers
    where weekend_id = ${weekendId}
    order by created_at asc
  `).map((row) => ({
			id: row.id,
			weekendId: row.weekend_id,
			userId: row.user_id,
			email: row.email,
			scope: row.scope,
			locationId: row.location_id,
			onDate: row.on_date ? asDateString(row.on_date) : null
		})),
		awaitingPublish: false
	};
}
async function loadPublicSchedule(weekendId) {
	const row = await loadWeekendOrThrow(weekendId);
	const weekend = mapWeekend(row);
	if (typeof row.public_sheet === "string" && row.public_sheet.length > 2) try {
		const parsed = JSON.parse(row.public_sheet);
		if (parsed && parsed.weekend && Array.isArray(parsed.ages)) return {
			...parsed,
			awaitingPublish: false,
			weekend: {
				...parsed.weekend,
				publicDirty: false
			}
		};
	} catch {}
	return {
		weekend,
		locations: [],
		ages: [],
		scorekeepers: [],
		awaitingPublish: true
	};
}
async function isLiveScorer(userId, weekendId) {
	await ensureLiveOpsColumns();
	const sql = await getSql();
	const row = (await sql`select end_date::text as end_date from weekends where id = ${weekendId}`)[0];
	const end = asDateString(row?.end_date);
	if (end && isoDateFromLocal(/* @__PURE__ */ new Date()) > end) return false;
	const hit = (await sql`
    select id from weekend_scorekeepers
    where weekend_id = ${weekendId} and user_id = ${userId}
    limit 1
  `)[0];
	return Boolean(hit);
}
async function coachHasApprovedTeam(userId, weekendId) {
	const row = (await (await getSql())`
    select id from teams
    where weekend_id = ${weekendId} and coach_user_id = ${userId} and status = ${"approved"}
    limit 1
  `)[0];
	return Boolean(row);
}
var getWeekendSchedule_createServerFn_handler = createServerRpc({
	id: "3907ddd970345ca1909b831ad660d4a121ec2484d7569337327936ee6340752d",
	name: "getWeekendSchedule",
	filename: "src/lib/pbi/api.ts"
}, (opts) => getWeekendSchedule.__executeServer(opts));
var getWeekendSchedule = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(getWeekendSchedule_createServerFn_handler, async ({ context, data }) => {
	const profile = await loadProfile(context.userId);
	if (!profile) throw new Error("Finish setting up your account.");
	if (profile.homeRole === "admin" || await isLiveScorer(context.userId, data.weekendId) || await coachHasApprovedTeam(context.userId, data.weekendId)) return loadWeekendSchedule(data.weekendId);
	return loadPublicSchedule(data.weekendId);
});
var listSchedule_createServerFn_handler = createServerRpc({
	id: "57a128c852dd8ac00e0a1a36d7e0f88942aaac53308e395b34b3d60113aa79e0",
	name: "listSchedule",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listSchedule.__executeServer(opts));
var listSchedule = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listSchedule_createServerFn_handler, async ({ context }) => {
	const profile = await loadProfile(context.userId);
	if (!profile) throw new Error("Finish setting up your account.");
	await ensureLiveOpsColumns();
	const sql = await getSql();
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
	const myIds = new Set(mine.map((row) => row.id));
	const list = [];
	for (const row of weekends) {
		if (row.lifecycle === "announced") {
			list.push({
				weekend: mapWeekend({
					...row,
					has_bracket: false
				}),
				games: []
			});
			continue;
		}
		const schedule = profile.homeRole === "admin" ? await loadWeekendSchedule(row.id) : await loadPublicSchedule(row.id);
		const games = schedule.ages.flatMap((age) => age.games).filter((game) => {
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
var swapBracketSeeds_createServerFn_handler = createServerRpc({
	id: "10a69ea8816baeea443045f5f8264237f41de5239261e6703d6fa741e430cbda",
	name: "swapBracketSeeds",
	filename: "src/lib/pbi/api.ts"
}, (opts) => swapBracketSeeds.__executeServer(opts));
var swapBracketSeeds = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	if (typeof data?.ageGroup !== "string" || !isAgeGroup(data.ageGroup)) throw new Error("Pick an age group.");
	return {
		weekendId: parsePositiveInt(data.weekendId, "Missing tournament."),
		ageGroup: data.ageGroup,
		seedA: parsePositiveInt(data.seedA, "Pick a team."),
		seedB: parsePositiveInt(data.seedB, "Pick a team.")
	};
}).handler(swapBracketSeeds_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	assertSheetOpen(mapWeekend(await loadWeekendOrThrow(data.weekendId)));
	const sql = await getSql();
	const rows = await sql`
      select seed, team_id from bracket_seeds
      where weekend_id = ${data.weekendId} and age_group = ${data.ageGroup}
    `;
	if (rows.length === 0) throw new Error("That bracket isn’t ready yet.");
	const next = swapSeeds(rows.map((row) => ({
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
var swapPoolTeams_createServerFn_handler = createServerRpc({
	id: "84a893b9cbda583a21e6886359e0950deddef5208ba5ca796928baf8824d3513",
	name: "swapPoolTeams",
	filename: "src/lib/pbi/api.ts"
}, (opts) => swapPoolTeams.__executeServer(opts));
var swapPoolTeams = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	return {
		gameId: parsePositiveInt(data?.gameId, "Pick a pool game."),
		teamAId: parsePositiveInt(data?.teamAId, "Pick the first team."),
		teamBId: parsePositiveInt(data?.teamBId, "Pick the second team.")
	};
}).handler(swapPoolTeams_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	if (data.teamAId === data.teamBId) throw new Error("Pick two different teams.");
	const sql = await getSql();
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
		if (!(row.home_team_id === data.teamAId || row.away_team_id === data.teamAId || row.home_team_id === data.teamBId || row.away_team_id === data.teamBId)) continue;
		if (row.score_locked || row.home_score != null || row.away_score != null || row.forfeit) throw new Error("Can't swap a team that already has a score.");
	}
	const next = applyPoolSlotSwap(rows.map((row) => ({
		id: row.id,
		homeTeamId: row.home_team_id,
		awayTeamId: row.away_team_id,
		homeSeed: row.home_seed,
		awaySeed: row.away_seed,
		poolIndex: row.pool_index
	})), data.teamAId, data.teamBId);
	for (const row of next) {
		const prior = rows.find((item) => item.id === row.id);
		if (!prior || prior.home_team_id === row.homeTeamId && prior.away_team_id === row.awayTeamId && prior.home_seed === row.homeSeed && prior.away_seed === row.awaySeed) continue;
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
var setGameField_createServerFn_handler = createServerRpc({
	id: "84646b48985b76711fe03d318f546283afde7fc64ad0358abdd30c25b45a588d",
	name: "setGameField",
	filename: "src/lib/pbi/api.ts"
}, (opts) => setGameField.__executeServer(opts));
var setGameField = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	gameId: parsePositiveInt(data?.gameId, "Missing game."),
	locationId: data?.locationId == null ? null : parsePositiveInt(data.locationId, "Pick a field.")
})).handler(setGameField_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const sql = await getSql();
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
var updateGameDetails_createServerFn_handler = createServerRpc({
	id: "f5c6a2407fd503be9eb82fb7261cba272f20c4665f7d564cca6af28b01715dc1",
	name: "updateGameDetails",
	filename: "src/lib/pbi/api.ts"
}, (opts) => updateGameDetails.__executeServer(opts));
var updateGameDetails = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
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
		locationId: data?.locationId == null || data?.locationId === "" ? null : parsePositiveInt(data.locationId, "Pick a field.")
	};
}).handler(updateGameDetails_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const sql = await getSql();
	const game = (await sql`
      select id, weekend_id from games where id = ${data.gameId} limit 1
    `)[0];
	if (!game) throw new Error("That game is gone.");
	const weekend = mapWeekend(await loadWeekendOrThrow(game.weekend_id));
	if (data.startDate < weekend.startDate || data.startDate > weekend.endDate) throw new Error("That day isn’t on this tournament.");
	if (data.locationId != null) {
		if (!(await sql`
        select id from weekend_locations
        where id = ${data.locationId} and weekend_id = ${game.weekend_id}
        limit 1
      `)[0]) throw new Error("That park isn’t on this tournament.");
		if ((await sql`
        select id from games
        where weekend_id = ${game.weekend_id}
          and id <> ${data.gameId}
          and is_bye = false
          and location_id = ${data.locationId}
          and start_date = ${data.startDate}
          and (start_time = ${data.startTime} or start_time = ${`${data.startTime}:00`})
        limit 1
      `)[0]) throw new Error("Another game is already on that field at that time.");
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
var addFieldToGame_createServerFn_handler = createServerRpc({
	id: "36e9a414061701a4f457d0cdc71c15a6128cbd8a89ca7682b5f93265c36b181e",
	name: "addFieldToGame",
	filename: "src/lib/pbi/api.ts"
}, (opts) => addFieldToGame.__executeServer(opts));
var addFieldToGame = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
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
}).handler(addFieldToGame_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const sql = await getSql();
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
var removeWeekendTeam_createServerFn_handler = createServerRpc({
	id: "172db8939df0e6e8e2c6092c76f9c8d5edcfbe0bb10cc0cbe4a27de1ca0b5a48",
	name: "removeWeekendTeam",
	filename: "src/lib/pbi/api.ts"
}, (opts) => removeWeekendTeam.__executeServer(opts));
var removeWeekendTeam = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ id: parsePositiveInt(data?.id, "Missing team.") })).handler(removeWeekendTeam_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const sql = await getSql();
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
var clearDemoTeams_createServerFn_handler = createServerRpc({
	id: "501f0dc41bdfc1fda73229db959b056b3007f698992a564c807f15fd899989b9",
	name: "clearDemoTeams",
	filename: "src/lib/pbi/api.ts"
}, (opts) => clearDemoTeams.__executeServer(opts));
var clearDemoTeams = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(clearDemoTeams_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	assertSheetOpen(mapWeekend(await loadWeekendOrThrow(data.weekendId)));
	const sql = await getSql();
	const demos = await sql`
      select id from teams where weekend_id = ${data.weekendId} and is_demo = true
    `;
	for (const row of demos) await sql`delete from roster_players where team_id = ${row.id}`;
	await sql`delete from teams where weekend_id = ${data.weekendId} and is_demo = true`;
	await syncWeekendBracket(data.weekendId);
	return loadWeekendDetail(data.weekendId);
});
var setSundaySeedsLocked_createServerFn_handler = createServerRpc({
	id: "797b8f79106f9e7228411a43d8fa1871e8a0e5da5e24e3c96a19a2cf2c77b764",
	name: "setSundaySeedsLocked",
	filename: "src/lib/pbi/api.ts"
}, (opts) => setSundaySeedsLocked.__executeServer(opts));
var setSundaySeedsLocked = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
	locked: Boolean(data?.locked)
})).handler(setSundaySeedsLocked_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await loadWeekendOrThrow(data.weekendId);
	await (await getSql())`
      update weekends set sunday_seeds_locked = ${data.locked} where id = ${data.weekendId}
    `;
	await syncWeekendBracket(data.weekendId);
	return loadWeekendSchedule(data.weekendId);
});
var setSheetLock_createServerFn_handler = createServerRpc({
	id: "c8a2481caa9038e92c1c56d77d3a30fbccaf1e1b46a50b7a50468b233d34924d",
	name: "setSheetLock",
	filename: "src/lib/pbi/api.ts"
}, (opts) => setSheetLock.__executeServer(opts));
var setSheetLock = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const lock = data?.lock === "on" || data?.lock === "off" ? data.lock : null;
	if (!lock) throw new Error("Pick lock or unlock.");
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		lock
	};
}).handler(setSheetLock_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await loadWeekendOrThrow(data.weekendId);
	const sql = await getSql();
	await ensureLiveOpsColumns();
	await sql`update weekends set sheet_lock = ${data.lock} where id = ${data.weekendId}`;
	return loadWeekendSchedule(data.weekendId);
});
var pullTeam_createServerFn_handler = createServerRpc({
	id: "29a99e41351a5d91d713136a48e7be8dfc213506e17a2b2e5d713e6fdb948e0f",
	name: "pullTeam",
	filename: "src/lib/pbi/api.ts"
}, (opts) => pullTeam.__executeServer(opts));
var pullTeam = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ teamId: parsePositiveInt(data?.teamId, "Pick a team.") })).handler(pullTeam_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const sql = await getSql();
	const team = (await sql`
    select id, weekend_id, age_group, status from teams where id = ${data.teamId} limit 1
  `)[0];
	if (!team || team.status !== "approved") throw new Error("That club isn’t on the sheet.");
	if (!isAgeGroup(team.age_group)) throw new Error("That club has a bad age group.");
	if (!mapWeekend(await loadWeekendOrThrow(team.weekend_id)).sheetLocked) throw new Error("Lock the sheet first. Removing a club before the lock redraws the bracket.");
	const games = await sql`
    select id, home_team_id, away_team_id, home_score, away_score, forfeit, no_contest, is_bye
    from games
    where weekend_id = ${team.weekend_id}
      and (home_team_id = ${team.id} or away_team_id = ${team.id})
  `;
	const patches = forfeitRemaining(games.map((row) => ({
		id: row.id,
		isBye: Boolean(row.is_bye),
		homeTeamId: row.home_team_id,
		awayTeamId: row.away_team_id,
		homeScore: row.home_score == null ? null : Number(row.home_score),
		awayScore: row.away_score == null ? null : Number(row.away_score),
		forfeit: row.forfeit === "home" || row.forfeit === "away" ? row.forfeit : null,
		noContest: Boolean(row.no_contest)
	})), team.id);
	if (patches.length === 0) throw new Error("That club has no remaining games to forfeit.");
	for (const patch of patches) if (patch.kind === "no-contest") await sql`
        update games
        set no_contest = ${true}, forfeit = ${null}, home_score = ${null}, away_score = ${null}
        where id = ${patch.id}
      `;
	else await sql`
        update games
        set forfeit = ${patch.side}, home_score = ${0}, away_score = ${0}, no_contest = ${false}
        where id = ${patch.id}
      `;
	await applyWinnerAdvance(team.weekend_id, team.age_group);
	return loadWeekendSchedule(team.weekend_id);
});
var replaceTeamSlot_createServerFn_handler = createServerRpc({
	id: "e52282550bfc8df8b1b4d350edfa4300edc5d24507a585fc50b580130f5440da",
	name: "replaceTeamSlot",
	filename: "src/lib/pbi/api.ts"
}, (opts) => replaceTeamSlot.__executeServer(opts));
var replaceTeamSlot = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const name = typeof data?.name === "string" ? data.name.trim() : "";
	if (name.length < 2) throw new Error("Give the new club a name.");
	if (name.length > 60) throw new Error("Keep the team name under 60 characters.");
	return {
		teamId: parsePositiveInt(data?.teamId, "Pick the club that dropped."),
		name
	};
}).handler(replaceTeamSlot_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const sql = await getSql();
	const team = (await sql`
    select id, weekend_id, age_group, name, status from teams where id = ${data.teamId} limit 1
  `)[0];
	if (!team || team.status !== "approved") throw new Error("That club isn’t on the sheet.");
	if (!isAgeGroup(team.age_group)) throw new Error("That club has a bad age group.");
	const weekend = mapWeekend(await loadWeekendOrThrow(team.weekend_id));
	if (!weekend.sheetLocked) throw new Error("Lock the sheet first so the fill-in stays in the same games.");
	if (!weekend.beforeFirstPitch) throw new Error("First pitch has already been thrown. Forfeit the remaining games.");
	if ((await sql`
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
  `)[0]) throw new Error("That club already has a result. Forfeit the rest instead of replacing them.");
	if ((await sql`
    select id from teams
    where weekend_id = ${team.weekend_id}
      and age_group = ${team.age_group}
      and status in (${"pending"}, ${"approved"})
      and lower(btrim(name)) = ${data.name.toLowerCase()}
    limit 1
  `)[0]) throw new Error("That club is already on this tournament.");
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
async function approvedTeamIds(weekendId, ageGroup) {
	return (await (await getSql())`
    select id from teams
    where weekend_id = ${weekendId} and age_group = ${ageGroup} and status = ${"approved"}
    order by id asc
  `).map((row) => row.id);
}
async function clearScoresAfterUnplayed(weekendId, ageGroup) {
	const sql = await getSql();
	for (let pass = 0; pass < 6; pass += 1) {
		const rows = await sql`
      select id, round, slot, home_from_round, home_from_slot, away_from_round, away_from_slot,
             home_team_id, away_team_id, home_score, away_score, is_bye, forfeit, no_contest
      from games
      where weekend_id = ${weekendId} and age_group = ${ageGroup}
    `;
		const byKey = new Map(rows.map((row) => [`${row.round}:${row.slot}`, row]));
		let cleared = false;
		for (const row of rows) {
			if (row.round === "pool" || row.is_bye) continue;
			if (row.home_score == null && row.away_score == null && !row.forfeit && !row.no_contest) continue;
			if (![byKey.get(`${row.home_from_round}:${row.home_from_slot}`), byKey.get(`${row.away_from_round}:${row.away_from_slot}`)].some((feeder) => {
				if (!feeder || feeder.is_bye || feeder.no_contest) return false;
				return scoredWinner(feeder.home_team_id, feeder.away_team_id, feeder.home_score, feeder.away_score, feeder.forfeit) == null;
			})) continue;
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
var postGameScore_createServerFn_handler = createServerRpc({
	id: "d44c96b9b6b4c437db483aa236bdaa66f7b17b13e1ae42a7edb32e685ad04957",
	name: "postGameScore",
	filename: "src/lib/pbi/api.ts"
}, (opts) => postGameScore.__executeServer(opts));
var postGameScore = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const gameId = parsePositiveInt(data?.gameId, "Pick a game.");
	if (data?.clear === true) return {
		gameId,
		homeScore: 0,
		awayScore: 0,
		forfeit: null,
		lock: false,
		clear: true
	};
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
		forfeit,
		lock: Boolean(data?.lock),
		clear: false
	};
}).handler(postGameScore_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const row = (await sql`
    select id, weekend_id, age_group, round, home_team_id, away_team_id, is_bye, location_id, start_date, score_locked
    from games where id = ${data.gameId}
  `)[0];
	if (!row) throw new Error("That game isn’t on the sheet.");
	if (row.is_bye) throw new Error("Bye games don’t take a score.");
	const profile = await loadProfile(context.userId);
	if (!profile) throw new Error("Finish setting up your account.");
	const isAdmin = profile.homeRole === "admin";
	if (!isAdmin && !await canScoreGame(context.userId, row)) throw new Error("Only Admin or the assigned scorekeeper can post this score.");
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
	if (row.round !== "pool" && !data.forfeit && data.homeScore === data.awayScore) throw new Error("Bracket games play until there’s a winner.");
	const weekend = mapWeekend(await loadWeekendOrThrow(row.weekend_id));
	if (row.round === "pool" && !data.forfeit && data.homeScore === data.awayScore && !weekend.rules.poolTies) throw new Error("Ties are off for pool play on this weekend.");
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
		if (row.round === "pool") await flagSeedConflict(weekend, row.age_group, row.id);
	}
	await markSheetDirty(row.weekend_id);
	return loadWeekendSchedule(row.weekend_id);
});
async function canScoreGame(userId, game) {
	const sql = await getSql();
	const rows = await sql`
    select scope, location_id, on_date from weekend_scorekeepers
    where weekend_id = ${game.weekend_id} and user_id = ${userId}
  `;
	const date = asDateString(game.start_date);
	const endRow = (await sql`select end_date::text as end_date from weekends where id = ${game.weekend_id}`)[0];
	const end = asDateString(endRow?.end_date);
	if (end && isoDateFromLocal(/* @__PURE__ */ new Date()) > end) return false;
	return rows.some((row) => {
		if (row.scope === "weekend") return true;
		if (row.scope === "field") return row.location_id === game.location_id;
		if (row.scope === "field-day") return row.location_id === game.location_id && asDateString(row.on_date) === date;
		return false;
	});
}
var assignScorekeeper_createServerFn_handler = createServerRpc({
	id: "f6bb8490456a53bf967d961aaa99b96c3587157d98a5640ae7886af8fa1cc310",
	name: "assignScorekeeper",
	filename: "src/lib/pbi/api.ts"
}, (opts) => assignScorekeeper.__executeServer(opts));
var assignScorekeeper = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const scope = data?.scope === "field" || data?.scope === "field-day" ? data.scope : "weekend";
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		userId: typeof data?.userId === "string" ? data.userId : "",
		scope,
		locationId: data?.locationId == null ? null : parsePositiveInt(data.locationId, "Pick a field."),
		onDate: typeof data?.onDate === "string" ? data.onDate : null
	};
}).handler(assignScorekeeper_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	if (!data.userId) throw new Error("Pick someone to keep score.");
	const sql = await getSql();
	const user = await loadAuthUser(data.userId);
	await sql`
    insert into weekend_scorekeepers (weekend_id, user_id, email, scope, location_id, on_date)
    values (${data.weekendId}, ${data.userId}, ${user?.email ?? ""}, ${data.scope}, ${data.locationId}, ${data.onDate})
  `;
	return loadWeekendSchedule(data.weekendId);
});
var revokeScorekeeper_createServerFn_handler = createServerRpc({
	id: "0deae1f2c458ea489b68f37f11cc75a0986b2b3bc9cd965fc22b16cbe5802e4f",
	name: "revokeScorekeeper",
	filename: "src/lib/pbi/api.ts"
}, (opts) => revokeScorekeeper.__executeServer(opts));
var revokeScorekeeper = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	id: parsePositiveInt(data?.id, "Pick a scorekeeper."),
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.")
})).handler(revokeScorekeeper_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await (await getSql())`delete from weekend_scorekeepers where id = ${data.id} and weekend_id = ${data.weekendId}`;
	return loadWeekendSchedule(data.weekendId);
});
var markRainout_createServerFn_handler = createServerRpc({
	id: "c36e91fc3b9ce072abbaf77187c1f75cf774ede12b541e54528a526fb391d80f",
	name: "markRainout",
	filename: "src/lib/pbi/api.ts"
}, (opts) => markRainout.__executeServer(opts));
var markRainout = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	gameId: parsePositiveInt(data?.gameId, "Pick a game."),
	action: typeof data?.action === "string" ? data.action : "mark",
	date: typeof data?.date === "string" ? data.date : null,
	time: typeof data?.time === "string" ? data.time : null,
	locationId: data?.locationId == null ? null : parsePositiveInt(data.locationId, "Pick a field.")
})).handler(markRainout_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const sql = await getSql();
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
    `).map((g) => ({
			locationId: g.location_id,
			date: asDateString(g.start_date) ?? "",
			time: g.start_time
		}));
		const options = proposeRainoutSlots({
			occupied,
			locationId: row.location_id,
			locations: await loadLocations(row.weekend_id),
			dates: weekend.dayPlan.map((d) => d.date),
			rules: weekend.rules
		});
		const coaches = await sql`
      select distinct t.coach_user_id as user_id
      from teams t
      where t.id in (${row.home_team_id}, ${row.away_team_id}) and t.coach_user_id is not null
    `;
		for (const coach of coaches) await insertNotification(coach.user_id, "Weather delay", `${weekend.name}: a game was marked rainout. Admin is placing it.`);
		await markSheetDirty(row.weekend_id);
		return {
			...await loadWeekendSchedule(row.weekend_id),
			rainoutOptions: options
		};
	}
	if (data.action === "slot" && data.date && data.time && data.locationId != null) await sql`
      update games
      set start_date = ${data.date}, start_time = ${data.time}, location_id = ${data.locationId}, rainout = ${false}
      where id = ${data.gameId}
    `;
	else if (data.action === "forfeit") await sql`update games set forfeit = ${"home"}, rainout = ${false} where id = ${data.gameId}`;
	else if (data.action === "no-contest") await sql`update games set no_contest = ${true}, rainout = ${false} where id = ${data.gameId}`;
	else if (data.action === "weather-tbd") await sql`update games set start_date = ${null}, start_time = ${null}, rainout = ${true} where id = ${data.gameId}`;
	await markSheetDirty(row.weekend_id);
	return loadWeekendSchedule(row.weekend_id);
});
var pushPublicSheet_createServerFn_handler = createServerRpc({
	id: "f99a0012480d01e1f44e882bd6f2710c257770afd4e95c36d7e1259f58552b34",
	name: "pushPublicSheet",
	filename: "src/lib/pbi/api.ts"
}, (opts) => pushPublicSheet.__executeServer(opts));
var pushPublicSheet = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(pushPublicSheet_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const schedule = await loadWeekendSchedule(data.weekendId);
	const sql = await getSql();
	const stamped = {
		...schedule,
		awaitingPublish: false,
		weekend: {
			...schedule.weekend,
			publicDirty: false,
			dirtyAfterLock: false
		}
	};
	await sql`
    update weekends
    set public_sheet = ${JSON.stringify(stamped)}, public_pushed_at = ${(/* @__PURE__ */ new Date()).toISOString()}, public_dirty = ${false}, dirty_after_lock = ${false}
    where id = ${data.weekendId}
  `;
	return loadWeekendSchedule(data.weekendId);
});
var resolveLockout_createServerFn_handler = createServerRpc({
	id: "2bbee7ebcf5b4966969c5ac81b0f57ceaadddfa9781e005add406a3522ba876b",
	name: "resolveLockout",
	filename: "src/lib/pbi/api.ts"
}, (opts) => resolveLockout.__executeServer(opts));
var resolveLockout = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const choice = data?.choice === "smaller" ? "smaller" : data?.choice === "keep" ? "keep" : null;
	if (!choice) throw new Error("Keep this sheet or rebuild it smaller.");
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		choice
	};
}).handler(resolveLockout_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const weekend = mapWeekend(await loadWeekendOrThrow(data.weekendId));
	const sql = await getSql();
	if (data.choice === "smaller") {
		if (weekend.approvedCount < 3) throw new Error("Need at least 3 teams before the sheet can shrink.");
		const ages = weekend.ageGroups.filter((age) => isAgeGroup(age));
		for (const age of ages) await persistAgeBracket(weekend, age, await approvedTeamIds(data.weekendId, age), {
			buildBracket: true,
			reset: true,
			fitToSignedUp: true,
			rebuildPools: weekend.poolPlay
		});
		await markSheetDirty(data.weekendId);
	}
	await sql`update weekends set lockout_choice = ${data.choice} where id = ${data.weekendId}`;
	return loadWeekendDetail(data.weekendId);
});
var resolveSeedConflict_createServerFn_handler = createServerRpc({
	id: "25ded4d732dfb5403a4bd85bde1b6bd56d65e3ecfdb306c3e2243b977447978f",
	name: "resolveSeedConflict",
	filename: "src/lib/pbi/api.ts"
}, (opts) => resolveSeedConflict.__executeServer(opts));
var resolveSeedConflict = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const action = data?.action === "reseed" ? "reseed" : data?.action === "keep" ? "keep" : null;
	if (!action) throw new Error("Keep the original seeds or reseed.");
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		action,
		confirm: Boolean(data?.confirm)
	};
}).handler(resolveSeedConflict_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const weekend = mapWeekend(await loadWeekendOrThrow(data.weekendId));
	const sql = await getSql();
	if (data.action === "keep") {
		await sql`update games set place_conflict = ${false} where weekend_id = ${data.weekendId}`;
		return loadWeekendDetail(data.weekendId);
	}
	if ((await sql`
    select id from games
    where weekend_id = ${data.weekendId} and round <> ${"pool"}
      and (home_score is not null or away_score is not null or forfeit is not null)
    limit 1
  `)[0] && !data.confirm) throw new Error("Reseed would move teams on bracket games that already have a result. Confirm to reseed anyway.");
	await sql`update bracket_seeds set frozen = ${false} where weekend_id = ${data.weekendId}`;
	for (const age of weekend.ageGroups) {
		if (!isAgeGroup(age)) continue;
		await fillGuaranteedSeeds(weekend, age, await approvedTeamIds(data.weekendId, age));
	}
	await sql`update games set place_conflict = ${false} where weekend_id = ${data.weekendId}`;
	await markSheetDirty(data.weekendId);
	return loadWeekendDetail(data.weekendId);
});
var LOGIN_GAP_MS = 6e5;
var loginVisitsReady = null;
function ensureLoginVisits() {
	if (!loginVisitsReady) loginVisitsReady = (async () => {
		await (await getSql()).query(`create table if not exists login_visits (
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
	return loginVisitsReady;
}
async function openLoginVisit(userId) {
	await ensureLoginVisits();
	const sql = await getSql();
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
var touchMyLogin_createServerFn_handler = createServerRpc({
	id: "700b76e3545a94ed12143f7498c8c11d2cb9d4123b05b9db882e56867cc594ff",
	name: "touchMyLogin",
	filename: "src/lib/pbi/api.ts"
}, (opts) => touchMyLogin.__executeServer(opts));
var touchMyLogin = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(touchMyLogin_createServerFn_handler, async ({ context }) => {
	await openLoginVisit(context.userId);
	return { ok: true };
});
var endMyLogin_createServerFn_handler = createServerRpc({
	id: "f047f2623f9441b0b546ea4a76ddf8bd5c497bcaea162141f25ab1f15cc0a90a",
	name: "endMyLogin",
	filename: "src/lib/pbi/api.ts"
}, (opts) => endMyLogin.__executeServer(opts));
var endMyLogin = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(endMyLogin_createServerFn_handler, async ({ context }) => {
	await ensureLoginVisits();
	await (await getSql())`
    update login_visits
    set ended_at = now(), last_seen_at = now()
    where user_id = ${context.userId} and ended_at is null
  `;
	return { ok: true };
});
var listLoginHistory_createServerFn_handler = createServerRpc({
	id: "af82e53ba4d1af1a39b5fc8998e840dcdf6aed3ff411f452ff089685145e6a1c",
	name: "listLoginHistory",
	filename: "src/lib/pbi/api.ts"
}, (opts) => listLoginHistory.__executeServer(opts));
var listLoginHistory = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listLoginHistory_createServerFn_handler, async ({ context }) => {
	await requireSuperuser(context.userId);
	await ensureLoginVisits();
	const sql = await getSql();
	if (((await sql`select count(*)::int as n from login_visits`)[0]?.n ?? 0) === 0) await sql`
      insert into login_visits (user_id, started_at, last_seen_at, ended_at)
      select s."userId", s."createdAt", s."updatedAt",
        case when s."expiresAt" > now() then null else s."updatedAt" end
      from "session" s
    `;
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
	return rows.map((row) => {
		const started = new Date(row.started_at);
		const last = new Date(row.last_seen_at);
		const ended = row.ended_at ? new Date(row.ended_at) : null;
		const startMs = started.getTime();
		const lastMs = last.getTime();
		const stillIn = !ended && Number.isFinite(lastMs) && now - lastMs < 18e4;
		const endMs = ended ? ended.getTime() : stillIn ? now : lastMs;
		const minutes = Number.isFinite(startMs) && Number.isFinite(endMs) ? Math.max(0, Math.round((endMs - startMs) / 6e4)) : 0;
		const email = String(row.profile_email || row.user_email || "").trim();
		const role = row.is_superuser ? "Superuser" : row.home_role === "admin" ? "Admin" : row.home_role === "coach" ? "Coach" : row.home_role === "athlete" ? "Athlete" : row.home_role === "parent" ? "Parent" : "Account";
		return {
			id: Number(row.id),
			name: personName(row.person_name) || email || "Account",
			email,
			role,
			startedAt: Number.isFinite(startMs) ? started.toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
			endedAt: ended && Number.isFinite(ended.getTime()) ? ended.toISOString() : null,
			stillIn,
			minutes
		};
	});
});
//#endregion
export { addCoachDirectory_createServerFn_handler, addFieldToGame_createServerFn_handler, addInterestedClub_createServerFn_handler, addKnownPark_createServerFn_handler, addMySquad_createServerFn_handler, addPlayer_createServerFn_handler, addSquadPlayer_createServerFn_handler, addWeekendLocation_createServerFn_handler, announceTournament_createServerFn_handler, archivePlanningYear_createServerFn_handler, assignScorekeeper_createServerFn_handler, changeMyPassword_createServerFn_handler, checkSignupOpen_createServerFn_handler, clearDemoTeams_createServerFn_handler, coachTextStatus_createServerFn_handler, completeOnboarding_createServerFn_handler, confirmAttendance_createServerFn_handler, createCoachInvite_createServerFn_handler, createWeekend_createServerFn_handler, deleteWeekend_createServerFn_handler, endMyLogin_createServerFn_handler, ensureBootAccounts_createServerFn_handler, eraseAccount_createServerFn_handler, finalizeWeekend_createServerFn_handler, getClubCard_createServerFn_handler, getMyCoachAccount_createServerFn_handler, getMyProfile_createServerFn_handler, getMyTeam_createServerFn_handler, getSeasonPlan_createServerFn_handler, getWeekendSchedule_createServerFn_handler, getWeekend_createServerFn_handler, listCoachDirectory_createServerFn_handler, listCoachInvites_createServerFn_handler, listDirectory_createServerFn_handler, listEventInterest_createServerFn_handler, listKnownParks_createServerFn_handler, listLoginHistory_createServerFn_handler, listMyCoachTeams_createServerFn_handler, listMyEventInterest_createServerFn_handler, listMyInterest_createServerFn_handler, listMyOutcomes_createServerFn_handler, listMySquads_createServerFn_handler, listMyTeams_createServerFn_handler, listMyTournamentResponses_createServerFn_handler, listNotifications_createServerFn_handler, listOpenTournaments_createServerFn_handler, listParkBookings_createServerFn_handler, listPendingRequests_createServerFn_handler, listPendingTeams_createServerFn_handler, listSchedule_createServerFn_handler, listSeasonCards_createServerFn_handler, listStaff_createServerFn_handler, listTournamentReplies_createServerFn_handler, listTournamentRoster_createServerFn_handler, listTournamentSignups_createServerFn_handler, listViewCoaches_createServerFn_handler, listWeekendStaff_createServerFn_handler, listWeekends_createServerFn_handler, liveStamp_createServerFn_handler, markCoachTextOpened_createServerFn_handler, markNotificationsRead_createServerFn_handler, markRainout_createServerFn_handler, openCoachTexts_createServerFn_handler, openReminderTexts_createServerFn_handler, postGameScore_createServerFn_handler, promoteTournament_createServerFn_handler, pullTeam_createServerFn_handler, pushPublicSheet_createServerFn_handler, pushSeasonToCoaches_createServerFn_handler, registerTeam_createServerFn_handler, removeAdministrator_createServerFn_handler, removeCoachDirectory_createServerFn_handler, removeKnownPark_createServerFn_handler, removeMySquad_createServerFn_handler, removePlayer_createServerFn_handler, removeSquadPlayer_createServerFn_handler, removeStaffMember_createServerFn_handler, removeWeekendLocation_createServerFn_handler, removeWeekendTeam_createServerFn_handler, replaceTeamSlot_createServerFn_handler, resolveLockout_createServerFn_handler, resolveSeedConflict_createServerFn_handler, respondToEventAge_createServerFn_handler, respondToTournament_createServerFn_handler, resubmitCoachAccess_createServerFn_handler, reviewNewCoach_createServerFn_handler, reviewRequest_createServerFn_handler, reviewTeam_createServerFn_handler, revokeScorekeeper_createServerFn_handler, saveMyCoachTeams_createServerFn_handler, saveSeasonSchedule_createServerFn_handler, saveStaffMember_createServerFn_handler, saveWeekendAges_createServerFn_handler, saveWeekendCap_createServerFn_handler, saveWeekendStaff_createServerFn_handler, setGameField_createServerFn_handler, setPrimaryPark_createServerFn_handler, setSheetLock_createServerFn_handler, setSundaySeedsLocked_createServerFn_handler, setSuperuser_createServerFn_handler, setViewCoach_createServerFn_handler, showInterest_createServerFn_handler, swapBracketSeeds_createServerFn_handler, swapPoolTeams_createServerFn_handler, touchMyLogin_createServerFn_handler, updateAnnouncedEvent_createServerFn_handler, updateCoachDirectory_createServerFn_handler, updateGameDetails_createServerFn_handler, updateKnownPark_createServerFn_handler, updateMyCoachAccount_createServerFn_handler, updateMySquad_createServerFn_handler, updateWeekendLocation_createServerFn_handler, updateWeekend_createServerFn_handler };
