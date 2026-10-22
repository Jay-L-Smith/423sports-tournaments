import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, r as QueryClientProvider, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { C as useRouter, S as useNavigate, _ as Outlet, b as Link, f as Scripts, g as createRouter, m as useRouterState, n as require_react_dom, p as HeadContent, v as createFileRoute, x as Navigate, y as createRootRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as getServerFnById, n as createServerFn, r as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { $ as formatAgeAvailability, Bt as parsePositiveInt, Cn as treeRoundLabel, Ct as layoutSiteBracket, Dt as namedDivisions, E as authMiddleware, F as coachOutreachLabel, Ft as parseDayPlan, G as defaultWeekendDates, Gt as parseTournamentMax, I as coachReminderBody, It as parseJersey, J as eachIsoDate, Kt as parseWeekendInput, Lt as parseLocationInput, M as capacityReport, Mt as parseAgeCaps, N as cn, O as bracketClockForFit, Ot as neededToFinish, P as coachOutreachBody, Pt as parseCoachAccess, Qt as preferredSeasonYear, R as coachSmsHref, Rt as parseParkFlags, St as isoDateFromLocal, T as assessCapacity, Tn as ensureDbReady, Tt as moveTiebreaker, U as defaultDayPlan, Ut as parseTeamFee, V as coachesForTournamentAges, W as defaultSeasonWindow, Wt as parseTeamRegister, X as fieldsNeeded, Y as emptyParkFlags, Zt as poolStandings, _t as isFutureSiteGame, a as isRole, an as seasonLabel, at as formatPhoneInput, b as TIEBREAKER_LABELS, bn as teamFeeInputValue, bt as isSeason, c as normalizeEmail, cn as seedLabel, ct as formatWeekdayLong, d as AGE_GROUPS, dn as shortParkName, et as formatAgeGroups, f as DEFAULT_BRACKET_RULES, ft as hasPlayInRound, g as PBI_STAFF_CONTACT, gt as isAgeGroup, h as PARK_AMENITIES, hn as suggestTournamentName, ht as inclusiveDays, in as seasonFromDate, it as formatMonthDay, kt as nextKnockoutGame, l as ADVANCE_LABELS, ln as setDivisionCount, lt as formatWeekendRange, m as FIRST_SEASON_YEAR, mn as startBlocks, nn as resubmitTriesCopy, nt as formatDayTab, ot as formatSeasonSpan, p as ELIMINATION_LABELS, qt as parseWeekendUpdate, rt as formatKickoff, s as isSuperuserOwner, st as formatTeamFee, t as ROLE_COPY, tt as formatClock, u as ADVANCE_MODES, wn as weekendSavePayload, wt as messageAges, x as addDays, xn as teamStatusLabel, y as ROUND_IDS, yt as isRoundId, z as coachTextGroups, zt as parsePlayerInput } from "./roles-Cea3BuXf.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { L as string, N as number, P as object, R as union, j as literal } from "../_libs/@better-auth/core+[...].mjs";
import { r as signOut, t as authClient } from "./client-Cc0v00BC.mjs";
import { i as hasGateSessionMarker, t as auth } from "./server-DOM6aJZW.mjs";
import { a as TriangleAlert, c as Plus, d as ClipboardCheck, f as ChevronRight, g as Bell, h as Check, i as UserRound, l as Library, m as ChevronDown, n as Users, o as Shield, p as ChevronLeft, r as User, s as Share2, t as X, u as House } from "../_libs/lucide-react.mjs";
import { a as keepPreviousData, t as QueryClient } from "../_libs/tanstack__query-core.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BMYev2Rn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = require_react_dom();
var KEY$2 = "pbi-chunk-reload";
function isStaleChunkError(error) {
	const message = error instanceof Error ? error.message : typeof error === "string" ? error : error && typeof error === "object" && "message" in error ? String(error.message ?? "") : "";
	return message.startsWith("Failed to fetch dynamically imported module") || message.startsWith("error loading dynamically imported module") || message.startsWith("Importing a module script failed") || message.includes("Failed to fetch dynamically imported module") || message.includes("reading 'component'");
}
function freshUrl() {
	const url = new URL(window.location.href);
	url.searchParams.set("__fresh", String(Date.now()));
	return url.toString();
}
/** Load the document again, skipping a cached copy from the last publish. */
function reloadForStaleChunk() {
	if (typeof window === "undefined") return false;
	try {
		if (sessionStorage.getItem(KEY$2) === "1") return false;
		sessionStorage.setItem(KEY$2, "1");
	} catch {
		return false;
	}
	window.location.replace(freshUrl());
	return true;
}
function forceFreshLoad() {
	if (typeof window === "undefined") return;
	try {
		sessionStorage.removeItem(KEY$2);
	} catch {}
	window.location.replace(freshUrl());
}
/** After the new page stays up, drop the one-time reload lock. */
function settleFreshLoad() {
	if (typeof window === "undefined") return;
	const url = new URL(window.location.href);
	if (url.searchParams.has("__fresh")) {
		url.searchParams.delete("__fresh");
		const next = url.pathname + url.search + url.hash;
		window.history.replaceState(window.history.state, "", next);
	}
	try {
		sessionStorage.removeItem(KEY$2);
	} catch {}
}
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	const stale = isStaleChunkError(error);
	const [reloading, setReloading] = (0, import_react.useState)(stale);
	(0, import_react.useEffect)(() => {
		if (!stale) return;
		if (!reloadForStaleChunk()) setReloading(false);
	}, [stale]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: reloading ? "Updating the app" : "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: reloading ? "A new version just went out. Reloading…" : errorMessage(error)
			}),
			reloading ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-2 text-sm font-semibold underline",
				onClick: () => forceFreshLoad(),
				children: "Reload"
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const session = authClient.useSession();
	useRecoverStuckSession(session.isPending, session.refetch);
	const user = session.data?.user;
	return {
		user: user ? {
			id: user.id,
			displayName: user.name ?? null,
			primaryEmail: user.email ?? null,
			profileImageUrl: user.image ?? null,
			isDevFallback: false
		} : null,
		isPending: session.isPending && !session.data
	};
}
/** A cancelled session request can leave `isPending` true forever. Retry once. */
function useRecoverStuckSession(isPending, refetch) {
	const refetchRef = (0, import_react.useRef)(refetch);
	refetchRef.current = refetch;
	(0, import_react.useEffect)(() => {
		if (!isPending) return;
		const timer = window.setTimeout(() => {
			refetchRef.current();
		}, 2500);
		return () => window.clearTimeout(timer);
	}, [isPending]);
}
/**
* Convenience view of `useCurrentUserState().user` for display (e.g.
* `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
* for redirects/guards use `useCurrentUserState()` and check `isPending`.
*/
function useCurrentUser() {
	return useCurrentUserState().user;
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var liveStamp = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("6bce1cf6e6e21bca25b6bb4e798670989f77d2c9b9f2d62139dc174fa2ce7c6a"));
var ensureBootAccounts = createServerFn({ method: "POST" }).handler(createSsrRpc("1db8ede3c53e04de01e6a61715a7c85a2c378a0a7d5601f91202436b386ad835"));
var getMyProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("b925f0e2b34e446bf4c14040540dd70328764040e7c6397652cb747277e342b3"));
function phoneLast10(value) {
	const digits = value.replace(/\D/g, "");
	return digits.length >= 10 ? digits.slice(-10) : "";
}
var checkSignupOpen = createServerFn({ method: "POST" }).validator((data) => {
	const email = normalizeEmail(String(data?.email ?? ""));
	const phone = String(data?.phone ?? "").trim();
	if (!email.includes("@")) throw new Error("Enter an email.");
	if (!phoneLast10(phone)) throw new Error("Enter a cell phone.");
	return {
		email,
		phone
	};
}).handler(createSsrRpc("c0da0bec8958a7a3806cfc87bbb93ae4af008666d0543ca060fd63cea7c4b9b2"));
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
}).handler(createSsrRpc("7830391c1ecebebbf200675a5f7a5aaf35b7038915a2a1488a27f7ceb8faca15"));
var listNotifications = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("17c50c75817be392e01cffba584b1521a273c2894dbe9cd3f96d3ce91fcf6c9e"));
var markNotificationsRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	return { ids: Array.isArray(data?.ids) ? data.ids.filter((id) => Number.isInteger(id) && id > 0) : [] };
}).handler(createSsrRpc("f65bbfc1a3b34188257fa6bbecc61b2ec8f97545d8ff4bf099f4495f84c0f13e"));
var listPendingRequests = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("41df0f6bbd32d2b4206f75c0830e7234358c66f5e9f35c1709666b64695fdd55"));
var listDirectory = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("e0bd595604a0d1693da5a4c316cf0186a21033a2d79abc2796fed421ea1064e8"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const userId = String(data?.userId ?? "").trim();
	if (!userId) throw new Error("Missing administrator.");
	return { userId };
}).handler(createSsrRpc("d71336413b36c59707a847994e92bc8107d569450b92fd9729e8815b53c9976f"));
var setSuperuser = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const userId = String(data?.userId ?? "").trim();
	if (!userId) throw new Error("Missing administrator.");
	return {
		userId,
		grant: Boolean(data?.grant)
	};
}).handler(createSsrRpc("f9e7dbad43a34a0f065d5deb2d8ac372648c80d2499669b52f5f00fb7cdc6e8d"));
var listViewCoaches = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("79a895d8234a7c38179e51ab98042e959311f77ef7aa94c2c7776dd65e0c5221"));
var setViewCoach = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ userId: typeof data?.userId === "string" ? data.userId.trim() : "" })).handler(createSsrRpc("805a03b43c7488409173f1fb54174c9c489bf1436698d987ca7366a729ac94ad"));
var listCoachDirectory = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("061dc92b4c1140745de8badf1c908220e4823c7db74eaf7911b311dc2adf273c"));
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
var updateCoachDirectory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(parseCoachEdit).handler(createSsrRpc("a369cc00b3080d7456f8b11a510f71bdda2a7a3fb91a0dbfd5561f89404676c5"));
var getMyCoachAccount = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("fad8b4dbea9298583ebe61c39d95b491efd7a64843d00c97d1b36adb1a247421"));
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
}).handler(createSsrRpc("9f9556d7246c141bfff5d236cfbfe671f5802664bcdc3c7f42bd627c0eb88fec"));
var changeMyPassword = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const password = String(data?.password ?? "");
	if (password.length < 8) throw new Error("Password is too short. Use at least 8 characters.");
	return { password };
}).handler(createSsrRpc("76218d6253caeb618d82968d75d0cb8cc8ffcd387f8e4b9be049cbecd0deda8c"));
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
}).handler(createSsrRpc("899f5abfd9f7f3066b99cbbe53f4e9cf0688179db1eafdfa3c1c15c8b64f9ede"));
var removeCoachDirectory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const userId = String(data?.userId ?? "").trim();
	if (!userId) throw new Error("Missing coach.");
	return { userId };
}).handler(createSsrRpc("3228271748bfc6d9362a16783345ced83e70869a6d9547596293f23bb44c0844"));
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
var listCoachInvites = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("b4ccd1da253283c74829a8567b2610141d08d994a4cc03e4868e5de3559f5629"));
var createCoachInvite = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(parseCoachInvite).handler(createSsrRpc("c2abb4a2c0bff04f2557eac42166414efda8bd1ebe76e6fbe8046e8da5f3e5de"));
var reviewRequest = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	if (!data || typeof data.id !== "number") throw new Error("Missing request.");
	if (data.action !== "approve" && data.action !== "deny") throw new Error("Choose Approve or Deny.");
	return data;
}).handler(createSsrRpc("a05a7009406408fc5484c7d1b65acc22606231294b7465a9387b5b2d9a691d59"));
var reviewNewCoach = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const userId = String(data?.userId ?? "").trim();
	if (!userId) throw new Error("Missing coach.");
	if (data?.action !== "keep" && data?.action !== "remove") throw new Error("Choose keep or remove.");
	return {
		userId,
		action: data.action
	};
}).handler(createSsrRpc("50229f9186de129833534cce7bef46c81d36e1d32f971268495180593684ea05"));
var resubmitCoachAccess = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => parseCoachAccess(data ?? {})).handler(createSsrRpc("41c1ab095d2d8843b24ea9ef959334dd1c0aba6c8a4e8254e5ae70e56d5ed9dc"));
var listWeekends = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("816957ecb3065744a2bd9b65aab290763b47e2aea31cc552e57ee165ae3c4eb6"));
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
var listSeasonCards = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("6d1bf9024dafe50c2bbeb22c6956e49d08ff8da81ab5ffa9d9d6b6a0539498b3"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => parseSeasonRequest(data)).handler(createSsrRpc("973a296f458a4c721d72bce83f7660a1deff719c217ef395332ea60bae452e0c"));
var archivePlanningYear = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("fcdefe219b8b6f8f1f72703f052c695eb82a73f07f8a3ae55e716cad48ef6d90"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
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
}).handler(createSsrRpc("f2cb395bda3a11a9d58dcf182a3e61dca214de816ddfdd69bf65e13485506468"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => parseSeasonRequest(data)).handler(createSsrRpc("17bb6db641cf23329b1d89638026e22600027a83a3cce6fe9039a3e7381a2fa3"));
var openReminderTexts = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
	includeNotInterested: data?.includeNotInterested === true
})).handler(createSsrRpc("324c55ac575ba2f54eaac9c28b2b1f4922b1dd0a9cfa46e2bdfb9d33ba306047"));
var promoteTournament = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
	includeNotInterested: data?.includeNotInterested === true
})).handler(createSsrRpc("9ea8317e4fb33582b32f8d7548daf34dc81b42814218de4cbe41a28b4e180df0"));
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
}).handler(createSsrRpc("9ca669b6da636b62343881ed5465381b1938c745ccea8d76edece5491bab4832"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
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
}).handler(createSsrRpc("ec846b4691675baec265cd5a4c49630d2e516588cba1b46fb2bfbba011875a34"));
function parseSeasonYear(data) {
	if (!isSeason(data?.season)) throw new Error("Pick a season.");
	const year = Number(data?.year);
	if (!Number.isInteger(year) || year < 2e3 || year > 2100) throw new Error("Pick a year.");
	return {
		season: data.season,
		year
	};
}
var coachTextStatus = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(parseSeasonYear).handler(createSsrRpc("b3e5874957ef257b3bd46a7f5b9518f0ff4c235c32cb2ddabe943f50c484caf0"));
var openCoachTexts = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const seasonYear = parseSeasonYear(data);
	const batchId = data?.batchId == null || data?.batchId === "" ? null : parsePositiveInt(data.batchId, "Missing text list.");
	const weekendId = data?.weekendId == null || data?.weekendId === "" ? null : parsePositiveInt(data.weekendId, "Missing event.");
	return {
		...seasonYear,
		batchId,
		weekendId
	};
}).handler(createSsrRpc("210f02ffb86235e9e0cde301e43cdf36888917d7ef605069b15ca569272b5844"));
var markCoachTextOpened = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	batchId: parsePositiveInt(data?.batchId, "Missing text list."),
	coachUserId: String(data?.coachUserId ?? "").trim()
})).handler(createSsrRpc("b4fd0ad5040ddd1a5f904ab9f069b3b7a7b1009a10fa1f3c4d6cf414cf8b72b9"));
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
}).handler(createSsrRpc("a45b82bd012b880ab87e4b3f8d2f4d9b9e8b091eaa0edc9f21fb77db256201c2"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const teamName = typeof data?.teamName === "string" ? data.teamName.trim() : "";
	if (!teamName || teamName.length > 80) throw new Error("Name the team.");
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		teamName
	};
}).handler(createSsrRpc("4c80de3015dd0bb9e58e23b52d14f66219bc793543834b8bcab68b7dd3dc5db5"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("ae18c82cbf1997f571f7279f62246b4279edbff83501e54152eed69e7f7cd07a"));
var listMyCoachTeams = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("38068aa53c2ca8a1bab64cf426f27f414765c095284a353c114cec357267ccf0"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const teams = parseSignupTeams(data?.teams);
	if (!teams) throw new Error("Add at least one team.");
	return { teams };
}).handler(createSsrRpc("c3dfe2eeb698d10b20a19e65ebf58190333948858d2c11ba6abf371d1cfe3fc6"));
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
var listMySquads = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("c71e788c70e94e137efa8552a979f0800eebebe40cfbd99e03f0d9abea961674"));
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
var addMySquad = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(parseSquadInput).handler(createSsrRpc("fcf1ff0b79b0da47ed798adf8f5a590dd50facdd10b0f5b35c9fe58d86419c08"));
var updateMySquad = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	teamId: parsePositiveInt(data?.teamId, "Missing team."),
	...parseSquadInput(data)
})).handler(createSsrRpc("7ec9bb60bdec9b50eb77e16e4a7e9cbbdcbbe154d22a6b61d36dd10b573a2ff8"));
var removeMySquad = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ teamId: parsePositiveInt(data?.teamId, "Missing team.") })).handler(createSsrRpc("acc9b2afcc1dc3cd1e1f3ede73385a54821409061ca6ff20f660bcfb608c083c"));
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
})).handler(createSsrRpc("3c9f69bfb0fc676a57216172b132844decf8097604a822b774706d7409f807d4"));
var removeSquadPlayer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ playerId: parsePositiveInt(data?.playerId, "Missing player.") })).handler(createSsrRpc("e1188c6346083ff86dd99d616345d0ac6f7ace1f8df70f64b7c2dede9cd6de1a"));
var listMyTournamentResponses = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("00367dc1665a29d0ef2907255e9674339ab0b5fbecefee025d80fd101bdc8a0d"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("f4881a0e033fc021a831dcc3bd9f018c8af4c5622ca34e3957fefa80267e197a"));
var respondToTournament = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const choice = data?.choice === "interested" || data?.choice === "maybe" || data?.choice === "no" ? data.choice : null;
	if (!choice) throw new Error("Pick one.");
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		choice
	};
}).handler(createSsrRpc("90e6c47f40cc218175fd08d79a1ae799f01b8203ef4da844dbc3f74b19872313"));
function parseEventIds(value) {
	const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
	const ids = [...new Set(raw.map((item) => Number(item)).filter((id) => Number.isInteger(id) && id > 0))];
	if (ids.length === 0) throw new Error("That link is missing the weekend.");
	if (ids.length > 24) throw new Error("Too many weekends.");
	return ids;
}
var listMyEventInterest = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ weekendIds: parseEventIds(data?.weekendIds) })).handler(createSsrRpc("7dc68423b5e2534e3278f492c5562c25c656f6653dcc45958de9ad9f151b79a4"));
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
}).handler(createSsrRpc("2dc6e8d19fa6456022784a2caafbb5f39ca6aef58f440b39be5c4b773ce21ca6"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(createSsrRpc("def56b5c0aa14824278ae3a1b2cc9b32ca97bc7d18a24975c8c36e606e111085"));
var listTournamentRoster = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(createSsrRpc("65505f6fdd3e07caad19ecf7a7d348156a98a0d26ab9f5c3c09852525d7fec16"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(createSsrRpc("3af794743fb98b8d797494c34aa2d70de9b4e2639b1a318280755eb62f2e16a7"));
var getClubCard = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => {
	const signupTeamId = data?.signupTeamId == null ? null : parsePositiveInt(data.signupTeamId, "Missing team.");
	const weekendTeamId = data?.weekendTeamId == null ? null : parsePositiveInt(data.weekendTeamId, "Missing team.");
	if (signupTeamId == null === (weekendTeamId == null)) throw new Error("Missing team.");
	return {
		signupTeamId,
		weekendTeamId
	};
}).handler(createSsrRpc("67897cf5b32d67017e66d56dfa5e79a784ec0a1e097480ebe7bf63be33e48a87"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
	teamId: parsePositiveInt(data?.teamId, "Missing team."),
	raiseAge: data?.raiseAge === true
})).handler(createSsrRpc("f7178a20a0f09415758ac7c4c6942186433e4fe3ef5c7a6df4ba1eb982d9ada0"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(createSsrRpc("3952dae26abe6803696e0de6ef2524cc5dd8af9505661facea897d70d39b2331"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		...parseWeekendInput(data)
	};
}).handler(createSsrRpc("35346909d2989e18b219c9bb36538fb3fd4e1555ffe30e22896ca1335c300ef3"));
var deleteWeekend = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
	notify: data?.notify === true
})).handler(createSsrRpc("5654e303adcc581306047b5725806f4bada386ab5420a377fecf0c44089a4eec"));
var getWeekend = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ id: parsePositiveInt(data?.id, "Missing tournament.") })).handler(createSsrRpc("1ef4a99717b6eb5c7472eebfe2bbcd1207e14347a2299d64292dffeb410e39a0"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
	maxTeams: parseTournamentMax(data?.maxTeams)
})).handler(createSsrRpc("1ced62784ab3de6855e5775021c194baaf81289ce7dfb9f2625115e02bbf1b9a"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => parseAgeCaps(data)).handler(createSsrRpc("dbff345bfff61d17611f7db11538c685695d5b461859036ff504c8e9947a275d"));
var updateWeekend = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => parseWeekendUpdate(data)).handler(createSsrRpc("e01f3d701dbc5bf73f68f8e2b8c1025bb0650080f5c55a693ffd48ce38387828"));
var listKnownParks = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("3493e72526e11937acae5a30d2a514a9fad1550df5e44b7322b9e1814082bb8f"));
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
}).handler(createSsrRpc("46ccd1d634e5a90f26c5d19d7e089ca68e744ab713b19fc35e21731d7f614f4f"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => {
	const startDate = typeof data?.startDate === "string" ? data.startDate : "";
	const endDate = typeof data?.endDate === "string" ? data.endDate : "";
	if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) throw new Error("Pick the tournament dates first.");
	return {
		startDate,
		endDate
	};
}).handler(createSsrRpc("c569768ccf33796c978d75dd2af7b3dad713576abe4f1724631802a2a98a34ba"));
var addWeekendLocation = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	...parseLocationInput(data),
	...parseParkFlags(data)
})).handler(createSsrRpc("8b3078f2a855cbce4ddc3f4574a4d066b3e85468a814430d4d5c7ba2332ea6e8"));
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
}).handler(createSsrRpc("961a5448697328b4e19787bc1bada5de9ea0dc05b6973347c23294f135a7bab6"));
var removeKnownPark = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ id: parsePositiveInt(data?.id, "Missing park.") })).handler(createSsrRpc("8d76e2418ff9ff36ae129b9578cd677b1bd1911c20c6648112a0a3a6f316e344"));
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
}).handler(createSsrRpc("9132a01d59476a8b2352fad1e5d93a9083509f9a3d9152a4e1c627f2c0cfb1dc"));
var removeWeekendLocation = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ id: parsePositiveInt(data?.id, "Missing park.") })).handler(createSsrRpc("d255f7739c2d7c39bafef180d9ee6cefb2ecc86d9bffcea0f2cbbafe9462b266"));
var setPrimaryPark = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ id: parsePositiveInt(data?.id, "Missing park.") })).handler(createSsrRpc("a726fabb4fed38cc3c918f662ef8a682525b8dbc0ef199b3c5614514306cf7fb"));
var listOpenTournaments = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("2afdaaf302b57e6c1439eb0bc4c91edb911c26ce7b3038292c5365d5802cdefa"));
var listMyTeams = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("59e94e501b5f5bed107e42d843c401d78ce1e77d99f59df1efa269a8bfe67d1f"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ teamId: parsePositiveInt(data?.teamId, "Missing team.") })).handler(createSsrRpc("86faeea63aad207762d93d4d60e992418a9b08c490d8a51e00b66a25a3c2fc16"));
var getMyTeam = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ id: parsePositiveInt(data?.id, "Missing team.") })).handler(createSsrRpc("f2ab8c511c0aa155d6260d4fd245d65bc907e3b10332abd5960a74515cc557e4"));
var registerTeam = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => parseTeamRegister(data)).handler(createSsrRpc("900792c54ed1a86d5f3dcef69bc705815f6e8698e59d5602bc02ad67a5274097"));
var listPendingTeams = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("5bf9f2dfaea4228fc5b119e1c9b2e71ca887319e558db98c45e76eb522240fed"));
var reviewTeam = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const id = parsePositiveInt(data?.id, "Missing team.");
	if (data?.action !== "approve" && data?.action !== "deny") throw new Error("Approve or deny that team.");
	return {
		id,
		action: data.action
	};
}).handler(createSsrRpc("bae827de7ea5de9df1ce54c5db698a9588da27f199c873a4c0a7cb4c268bf44d"));
var addPlayer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => parsePlayerInput(data)).handler(createSsrRpc("8fae08c88a5242a83b68a4d228d7de3d5116dd5fcf3cf1d1e1f533f582fa1848"));
var removePlayer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	teamId: parsePositiveInt(data?.teamId, "Missing team."),
	playerId: parsePositiveInt(data?.playerId, "Missing player.")
})).handler(createSsrRpc("6cb1a17d26f27bc36b16f96f2b6557fb31718d34d3d5b69e5193e31927384399"));
var eraseAccount = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const userId = String(data?.userId ?? "").trim();
	if (!userId) throw new Error("Missing account.");
	return { userId };
}).handler(createSsrRpc("1858d1945dd0aab0d97f5973628b8b0aae859ccb8b9c9953e3a33492a4905242"));
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
var listStaff = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("069124682be67e228a49daa97969776e947b50cbbdca194d72c18e5f3abac579"));
var saveStaffMember = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const name = typeof data?.name === "string" ? data.name.trim() : "";
	if (!name) throw new Error("Enter a name.");
	const phone = formatPhoneInput(typeof data?.phone === "string" ? data.phone : "");
	if (staffDigits(phone).length !== 10) throw new Error("Enter a phone number.");
	return {
		name: name.slice(0, 80),
		phone
	};
}).handler(createSsrRpc("58b933e1f5675bade19137bf0e347e02b200c90d0862deaba01a3a4b632e331d"));
var removeStaffMember = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ id: parsePositiveInt(data?.id, "Missing staff.") })).handler(createSsrRpc("b7f5a9df1777aed17e133854305e251d6b7ae518c7027ab1990fe65179045f6e"));
var listWeekendStaff = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(createSsrRpc("70185612908f9d452b1d0275e27f2dd7e981301c823e09d060f4a52845ccc23e"));
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
}).handler(createSsrRpc("9ffb3bf928213b1d533aa119527223e056ea654b5f3bd8c48a6b808d14360a78"));
var getWeekendSchedule = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((data) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(createSsrRpc("3907ddd970345ca1909b831ad660d4a121ec2484d7569337327936ee6340752d"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("57a128c852dd8ac00e0a1a36d7e0f88942aaac53308e395b34b3d60113aa79e0"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	if (typeof data?.ageGroup !== "string" || !isAgeGroup(data.ageGroup)) throw new Error("Pick an age group.");
	return {
		weekendId: parsePositiveInt(data.weekendId, "Missing tournament."),
		ageGroup: data.ageGroup,
		seedA: parsePositiveInt(data.seedA, "Pick a team."),
		seedB: parsePositiveInt(data.seedB, "Pick a team.")
	};
}).handler(createSsrRpc("10a69ea8816baeea443045f5f8264237f41de5239261e6703d6fa741e430cbda"));
var swapPoolTeams = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	return {
		gameId: parsePositiveInt(data?.gameId, "Pick a pool game."),
		teamAId: parsePositiveInt(data?.teamAId, "Pick the first team."),
		teamBId: parsePositiveInt(data?.teamBId, "Pick the second team.")
	};
}).handler(createSsrRpc("84a893b9cbda583a21e6886359e0950deddef5208ba5ca796928baf8824d3513"));
var setGameField = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	gameId: parsePositiveInt(data?.gameId, "Missing game."),
	locationId: data?.locationId == null ? null : parsePositiveInt(data.locationId, "Pick a field.")
})).handler(createSsrRpc("84646b48985b76711fe03d318f546283afde7fc64ad0358abdd30c25b45a588d"));
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
}).handler(createSsrRpc("f5c6a2407fd503be9eb82fb7261cba272f20c4665f7d564cca6af28b01715dc1"));
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
}).handler(createSsrRpc("36e9a414061701a4f457d0cdc71c15a6128cbd8a89ca7682b5f93265c36b181e"));
var removeWeekendTeam = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ id: parsePositiveInt(data?.id, "Missing team.") })).handler(createSsrRpc("172db8939df0e6e8e2c6092c76f9c8d5edcfbe0bb10cc0cbe4a27de1ca0b5a48"));
var clearDemoTeams = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(createSsrRpc("501f0dc41bdfc1fda73229db959b056b3007f698992a564c807f15fd899989b9"));
var setSundaySeedsLocked = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
	locked: Boolean(data?.locked)
})).handler(createSsrRpc("797b8f79106f9e7228411a43d8fa1871e8a0e5da5e24e3c96a19a2cf2c77b764"));
var setSheetLock = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const lock = data?.lock === "on" || data?.lock === "off" ? data.lock : null;
	if (!lock) throw new Error("Pick lock or unlock.");
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		lock
	};
}).handler(createSsrRpc("c8a2481caa9038e92c1c56d77d3a30fbccaf1e1b46a50b7a50468b233d34924d"));
var pullTeam = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ teamId: parsePositiveInt(data?.teamId, "Pick a team.") })).handler(createSsrRpc("29a99e41351a5d91d713136a48e7be8dfc213506e17a2b2e5d713e6fdb948e0f"));
var replaceTeamSlot = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const name = typeof data?.name === "string" ? data.name.trim() : "";
	if (name.length < 2) throw new Error("Give the new club a name.");
	if (name.length > 60) throw new Error("Keep the team name under 60 characters.");
	return {
		teamId: parsePositiveInt(data?.teamId, "Pick the club that dropped."),
		name
	};
}).handler(createSsrRpc("e52282550bfc8df8b1b4d350edfa4300edc5d24507a585fc50b580130f5440da"));
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
}).handler(createSsrRpc("d44c96b9b6b4c437db483aa236bdaa66f7b17b13e1ae42a7edb32e685ad04957"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const scope = data?.scope === "field" || data?.scope === "field-day" ? data.scope : "weekend";
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		userId: typeof data?.userId === "string" ? data.userId : "",
		scope,
		locationId: data?.locationId == null ? null : parsePositiveInt(data.locationId, "Pick a field."),
		onDate: typeof data?.onDate === "string" ? data.onDate : null
	};
}).handler(createSsrRpc("f6bb8490456a53bf967d961aaa99b96c3587157d98a5640ae7886af8fa1cc310"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	id: parsePositiveInt(data?.id, "Pick a scorekeeper."),
	weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.")
})).handler(createSsrRpc("0deae1f2c458ea489b68f37f11cc75a0986b2b3bc9cd965fc22b16cbe5802e4f"));
var markRainout = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({
	gameId: parsePositiveInt(data?.gameId, "Pick a game."),
	action: typeof data?.action === "string" ? data.action : "mark",
	date: typeof data?.date === "string" ? data.date : null,
	time: typeof data?.time === "string" ? data.time : null,
	locationId: data?.locationId == null ? null : parsePositiveInt(data.locationId, "Pick a field.")
})).handler(createSsrRpc("c36e91fc3b9ce072abbaf77187c1f75cf774ede12b541e54528a526fb391d80f"));
var pushPublicSheet = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => ({ weekendId: parsePositiveInt(data?.weekendId, "Missing tournament.") })).handler(createSsrRpc("f99a0012480d01e1f44e882bd6f2710c257770afd4e95c36d7e1259f58552b34"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const choice = data?.choice === "smaller" ? "smaller" : data?.choice === "keep" ? "keep" : null;
	if (!choice) throw new Error("Keep this sheet or rebuild it smaller.");
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		choice
	};
}).handler(createSsrRpc("2bbee7ebcf5b4966969c5ac81b0f57ceaadddfa9781e005add406a3522ba876b"));
var resolveSeedConflict = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	const action = data?.action === "reseed" ? "reseed" : data?.action === "keep" ? "keep" : null;
	if (!action) throw new Error("Keep the original seeds or reseed.");
	return {
		weekendId: parsePositiveInt(data?.weekendId, "Missing tournament."),
		action,
		confirm: Boolean(data?.confirm)
	};
}).handler(createSsrRpc("25ded4d732dfb5403a4bd85bde1b6bd56d65e3ecfdb306c3e2243b977447978f"));
var touchMyLogin = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("700b76e3545a94ed12143f7498c8c11d2cb9d4123b05b9db882e56867cc594ff"));
var endMyLogin = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("f047f2623f9441b0b546ea4a76ddf8bd5c497bcaea162141f25ab1f15cc0a90a"));
var listLoginHistory = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("af82e53ba4d1af1a39b5fc8998e840dcdf6aed3ff411f452ff089685145e6a1c"));
var KEY$1 = "pbi-super-view";
var listeners = /* @__PURE__ */ new Set();
var current$1 = "admin";
var booted = false;
function storedView() {
	if (typeof window === "undefined") return "admin";
	return window.localStorage.getItem(KEY$1) === "coach" ? "coach" : "admin";
}
function superuserView() {
	if (typeof window === "undefined") return "admin";
	current$1 = storedView();
	return current$1;
}
function setSuperuserView(view) {
	if (typeof window === "undefined") return;
	current$1 = view;
	booted = true;
	window.localStorage.setItem(KEY$1, view);
	for (const listener of listeners) listener();
}
var COACH_KEY = "pbi-view-coach";
function rememberedCoach() {
	if (typeof window === "undefined") return "";
	return window.localStorage.getItem(COACH_KEY) || "";
}
function rememberCoach(userId) {
	if (typeof window === "undefined") return;
	if (userId) window.localStorage.setItem(COACH_KEY, userId);
	else window.localStorage.removeItem(COACH_KEY);
}
function useSuperuserView() {
	const [view, setView] = (0, import_react.useState)(() => superuserView());
	const [ready, setReady] = (0, import_react.useState)(booted);
	(0, import_react.useEffect)(() => {
		booted = true;
		const sync = () => setView(superuserView());
		sync();
		setReady(true);
		listeners.add(sync);
		return () => {
			listeners.delete(sync);
		};
	}, []);
	return {
		view,
		ready
	};
}
function SessionSkeleton() {
	const [slow, setSlow] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const timer = window.setTimeout(() => setSlow(true), 4e3);
		return () => window.clearTimeout(timer);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-dvh max-w-lg flex-col bg-bg px-4 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-2xl font-bold uppercase tracking-wide",
				children: "423Sports"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted",
				children: "Tournaments"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Loading your home…"
			}),
			slow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-4 text-left text-sm font-semibold underline",
				onClick: () => window.location.reload(),
				children: "Still loading. Tap to reload."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-8 h-10 w-3/4 animate-pulse rounded-md bg-line" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-6 h-20 animate-pulse rounded-lg bg-line" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-3 h-20 animate-pulse rounded-lg bg-line" })
		]
	});
}
function useAppSession() {
	const { user, isPending: sessionPending } = useCurrentUserState();
	const profileQuery = useQuery({
		queryKey: ["profile", user?.id],
		queryFn: () => getMyProfile(),
		enabled: Boolean(user),
		retry: false
	});
	const { view, ready } = useSuperuserView();
	const loaded = profileQuery.data ?? null;
	const profile = loaded?.isSuperuser && view === "coach" ? {
		...loaded,
		homeRole: "coach"
	} : loaded;
	return {
		user,
		isPending: sessionPending && !user || Boolean(user) && profile == null && profileQuery.isFetching && !profileQuery.isError || Boolean(loaded?.isSuperuser) && !ready,
		profile,
		profileError: profileQuery.error,
		refetchProfile: profileQuery.refetch
	};
}
var OPEN = "pbi-coach-tour-open";
var DONE = "pbi-coach-tour-done";
function storageKey(userId) {
	return `pbi-coach-tour:${userId}`;
}
function coachTourFinished(userId) {
	if (!userId || typeof window === "undefined") return true;
	return window.localStorage.getItem(storageKey(userId)) === "done";
}
function markCoachTourFinished(userId) {
	window.localStorage.setItem(storageKey(userId), "done");
	window.dispatchEvent(new Event(DONE));
}
function openCoachTour() {
	window.dispatchEvent(new Event(OPEN));
}
function onCoachTourOpen(handler) {
	window.addEventListener(OPEN, handler);
	return () => window.removeEventListener(OPEN, handler);
}
var STEPS = [
	{
		title: "Tournaments",
		body: "A tournament is on the calendar with its dates and ages. Tap it and choose Register, Not sure yet, or Maybe next time. Register puts your team on that tournament. The director can take you off.",
		path: "/"
	},
	{
		title: "Seasons",
		body: "Spring, Summer, and Fall change the calendar. The season you tap is the one on the screen.",
		target: "seasons",
		path: "/"
	},
	{
		title: "The calendar",
		body: "Yellow days are tournaments. Blue means your team is attending. Clay is already past. Swipe sideways, or use the arrows, to change months. Tap a day to see what is on it.",
		target: "calendar",
		path: "/"
	},
	{
		title: "Tournament cards",
		body: "Each card under the calendar is a tournament in that month. Tap it and choose Register, Not sure yet, or Maybe next time for each age. You can change that later.",
		target: "events",
		path: "/"
	},
	{
		title: "The counts",
		body: "These four numbers are yours for the year. Tap one to open the list. Available is tournaments you are not in. Going is tournaments your team has been added to. Live is one of yours, from 48 hours before first pitch until it ends. Attended is how many you have played.",
		target: "counts",
		path: "/"
	},
	{
		title: "Notifications",
		body: "New tournaments and changes land here. Open Available Tournaments and pick Register, Not sure yet, or Maybe next time. It stays unread until you choose. A change notice means something on a tournament moved.",
		target: "notifications",
		path: "/notifications"
	},
	{
		title: "My team",
		body: "Your team name and age are on this card. Tap them to edit. Add players underneath. A check next to a birthday means they make the age cutoff. An X means they are too old for that age.",
		target: "my-team",
		path: "/teams"
	},
	{
		title: "Account and sharing",
		body: "The person icon opens your account. Update your name, phone, email, club, and teams there, or change your password. The share icon sends this app to another coach.",
		target: "header-tools",
		path: "/"
	},
	{
		title: "The bottom bar",
		body: "Schedule is this calendar. Notifications is where new tournaments show up. My team is your roster. That is the whole coach view.",
		target: "tab-bar",
		path: "/"
	}
];
function finishTour(userId) {
	markCoachTourFinished(userId);
}
function CoachTour() {
	const { user, profile } = useAppSession();
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const [open, setOpen] = (0, import_react.useState)(false);
	const [replay, setReplay] = (0, import_react.useState)(false);
	const [step, setStep] = (0, import_react.useState)(0);
	const [snap, setSnap] = (0, import_react.useState)(null);
	const current = STEPS[step];
	const coachScreen = profile?.homeRole === "coach" && Boolean(user);
	const autoCoach = coachScreen && !profile?.isSuperuser;
	(0, import_react.useEffect)(() => onCoachTourOpen(() => {
		setStep(0);
		setReplay(true);
		setOpen(true);
	}), []);
	(0, import_react.useEffect)(() => {
		if (!autoCoach || !user || replay) return;
		if (coachTourFinished(user.id)) return;
		setOpen(true);
	}, [
		autoCoach,
		user,
		replay
	]);
	(0, import_react.useEffect)(() => {
		if (!open || !current?.path || pathname === current.path) return;
		navigate({ to: current.path });
	}, [
		open,
		current?.path,
		pathname,
		navigate
	]);
	(0, import_react.useEffect)(() => {
		if (!open || !current?.target) {
			setSnap(null);
			return;
		}
		let cancel = false;
		const grab = () => {
			const el = document.querySelector(`[data-tour="${current.target}"]`);
			if (!el || cancel) return false;
			el.scrollIntoView({
				block: "center",
				inline: "nearest"
			});
			const rect = el.getBoundingClientRect();
			if (rect.width < 2 || rect.height < 2) return false;
			const maxW = Math.max(160, window.innerWidth - 40);
			const maxH = Math.max(120, Math.round(window.innerHeight * .4));
			const fit = Math.min(maxW / rect.width, maxH / rect.height);
			const zoomCap = rect.width < 180 ? 2 : 1.06;
			const scale = Math.min(fit, zoomCap);
			const html = el.outerHTML.replace(/\bfixed\b/g, "relative").replace(/\binset-x-0\b/g, "").replace(/\bbottom-0\b/g, "");
			setSnap({
				html,
				width: rect.width,
				height: rect.height,
				scale
			});
			return true;
		};
		const first = window.setTimeout(grab, 80);
		const second = window.setTimeout(grab, 450);
		return () => {
			cancel = true;
			window.clearTimeout(first);
			window.clearTimeout(second);
		};
	}, [
		open,
		current?.target,
		pathname,
		step,
		profile?.homeRole
	]);
	if (!open || !coachScreen || !user || !current || typeof document === "undefined") return null;
	function close(done) {
		if (!user) return;
		if (done && !profile?.isSuperuser) finishTour(user.id);
		setReplay(false);
		setOpen(false);
		if (pathname !== "/") navigate({ to: "/" });
	}
	const last = step === STEPS.length - 1;
	const welcome = step === 0;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-[100] flex flex-col bg-black/60",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `flex w-full flex-1 items-start justify-center overflow-hidden px-5 ${welcome ? "" : "pt-14"}`,
			children: snap && !welcome ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative max-w-full",
				style: {
					width: snap.width * snap.scale,
					height: snap.height * snap.scale
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `pointer-events-none absolute left-0 top-0 origin-top-left overflow-hidden rounded-lg shadow-2xl ring-4 ring-white ${current.target === "header-tools" ? "bg-[#1c1c1c] p-2" : "bg-white"}`,
					style: {
						width: snap.width,
						transform: `scale(${snap.scale})`
					},
					dangerouslySetInnerHTML: { __html: snap.html }
				})
			}) : null
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `px-4 pb-6 ${welcome ? "absolute inset-x-0 top-1/2 -translate-y-1/2" : ""}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mx-auto max-w-md rounded-2xl bg-white px-4 py-4 text-[#1c1c1c] shadow-2xl",
				children: [
					snap && !welcome ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute -top-2 left-10 h-4 w-4 rotate-45 bg-white",
						"aria-hidden": true
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.16em] text-[#1c1c1c]/45",
						children: [
							step + 1,
							" of ",
							STEPS.length
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-2xl font-bold uppercase leading-none",
						children: current.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 whitespace-pre-line text-sm leading-relaxed",
						children: current.body
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex items-center gap-2",
						children: [
							step > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setStep((value) => value - 1),
								className: "rounded-full px-3 py-2 text-sm font-semibold text-[#1c1c1c]/70",
								children: "Back"
							}) : null,
							!last ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => close(true),
								className: "rounded-full px-3 py-2 text-sm font-semibold text-[#1c1c1c]/70",
								children: "Skip"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => last ? close(true) : setStep((value) => value + 1),
								className: "ml-auto rounded-full bg-[#1c1c1c] px-5 py-2 text-sm font-semibold text-white",
								children: last ? "Done" : "Next"
							})
						]
					})
				]
			})
		})]
	}), document.body);
}
var buttonVariants = cva("inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold uppercase tracking-[0.08em] transition-[color,background-color,border-color,box-shadow,transform] duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]", {
	variants: {
		variant: {
			default: "rounded-full bg-primary text-primary-fg shadow-none hover:bg-primary/90",
			pine: "rounded-full bg-primary text-primary-fg shadow-none hover:bg-primary/90",
			outline: "rounded-full border border-line bg-white text-fg hover:bg-fg/5",
			ghost: "text-fg hover:bg-fg/5",
			danger: "rounded-full border border-line bg-white text-fg hover:bg-warn-bg"
		},
		size: {
			default: "min-h-11",
			lg: "min-h-14 px-7 text-base",
			sm: "min-h-9 px-3 text-xs"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
var NEVER_KEY = "pbi-hide-homescreen-prompt";
var LATER_KEY = "pbi-homescreen-later";
function phoneKind() {
	if (typeof navigator === "undefined") return null;
	const ua = navigator.userAgent;
	const iPad = /iPad/.test(ua) || /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
	if (/iPhone|iPod/.test(ua) || iPad) return "ios";
	if (/Android/i.test(ua)) return "android";
	return null;
}
function fromHomeScreen() {
	const nav = navigator;
	return window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches || nav.standalone === true;
}
function inAppBrowser() {
	return /Instagram|FBAN|FBAV|FB_IAB|Line\/|Twitter|Snapchat|TikTok/i.test(navigator.userAgent);
}
function installEvent() {
	return window.__pbiInstall ?? null;
}
if (typeof window !== "undefined") window.addEventListener("beforeinstallprompt", (event) => {
	event.preventDefault();
	window.__pbiInstall = event;
	window.dispatchEvent(new Event("pbi-install-ready"));
});
function HomeScreenPrompt() {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [kind, setKind] = (0, import_react.useState)(null);
	const [canInstall, setCanInstall] = (0, import_react.useState)(false);
	const [trapped, setTrapped] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const phone = phoneKind();
		if (!phone || fromHomeScreen()) return;
		if (window.localStorage.getItem(NEVER_KEY) === "1") return;
		if (window.sessionStorage.getItem(LATER_KEY) === "1") return;
		setKind(phone);
		setTrapped(inAppBrowser());
		setCanInstall(Boolean(installEvent()));
		setOpen(true);
		const onReady = () => setCanInstall(true);
		window.addEventListener("pbi-install-ready", onReady);
		return () => window.removeEventListener("pbi-install-ready", onReady);
	}, []);
	function later() {
		window.sessionStorage.setItem(LATER_KEY, "1");
		setOpen(false);
	}
	function never() {
		window.localStorage.setItem(NEVER_KEY, "1");
		setOpen(false);
	}
	async function install() {
		const event = installEvent();
		if (!event) return;
		await event.prompt();
		window.__pbiInstall = void 0;
		setCanInstall(false);
		later();
	}
	if (!open || kind == null || typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[70] flex items-end justify-center bg-scrim p-4 sm:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": "Add to Home Screen",
			className: "w-full max-w-sm rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-bold uppercase",
					children: "Add to Home Screen"
				}),
				trapped ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: kind === "ios" ? "This browser can’t save the app. Open the link in Safari, then follow the steps below." : "This browser can’t save the app. Open the link in Chrome, then add it to your Home Screen."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Save it so it opens like an app next time."
				}),
				kind === "android" && canInstall ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					className: "mt-4 w-full",
					onClick: () => void install(),
					children: "Add to Home Screen"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-4 list-decimal space-y-2 pl-5 text-sm",
					children: kind === "ios" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Tap the Share button at the bottom of Safari." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Tap Add to Home Screen." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Tap Add." })
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Tap the menu in Chrome." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Tap Install app, or Add to Home screen." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Confirm." })
					] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						className: "w-full",
						onClick: later,
						children: "Not now"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						className: "w-full text-muted",
						onClick: never,
						children: "Don't ask again"
					})]
				})
			]
		})
	}), document.body);
}
var current = "";
var previous = "";
function noteHref(href) {
	if (typeof window === "undefined" || !href || href === current) return;
	previous = current;
	current = href;
}
function isInsideTournament(href) {
	const path = pathOf(href);
	return path.startsWith("/weekends") || path.startsWith("/bracket");
}
/** Remember the screen that opened this event. A tournament opened from the event does not replace it. */
function rememberOrigin(id) {
	const key = `pbi-back:${id}`;
	const from = previous;
	if (!from || isInsideTournament(from)) return;
	try {
		sessionStorage.setItem(key, from);
	} catch {}
}
function originBack(id, fallback = "/") {
	rememberOrigin(id);
	try {
		const saved = sessionStorage.getItem(`pbi-back:${id}`);
		if (saved && !isInsideTournament(saved)) return saved;
	} catch {}
	return fallback;
}
function pathOf(href) {
	return href.split("?")[0].replace(/\/$/, "") || "/";
}
function openedFromHere(href, id) {
	const path = pathOf(href);
	return !href || path === "/weekends" || path === `/weekends/${id}` || path.startsWith(`/weekends/${id}/`) || path === `/bracket/${id}`;
}
/** The screen that opened this tournament. Menus opened from the tournament do not move it. */
function lockedBack(id, fallback) {
	const key = `pbi-back:${id}`;
	const from = previous;
	if (!openedFromHere(from, id)) {
		try {
			sessionStorage.setItem(key, from);
		} catch {}
		return from;
	}
	try {
		const saved = sessionStorage.getItem(key);
		if (saved && !openedFromHere(saved, id)) return saved;
	} catch {}
	return fallback;
}
var styles_default = "/assets/styles-B5CkzL7e.css";
var APP_NAME = "423Sports Tournaments";
var Route$22 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#1c1c1c"
			},
			{
				name: "description",
				content: "Travel-ball tournament tools for parents, athletes, coaches, and directors."
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Oxygen:wght@400;700&display=swap"
			}
		]
	}),
	component: Root
});
function getQueryClient() {
	const g = globalThis;
	g.__pbiQueryClient__ ??= new QueryClient({ defaultOptions: { queries: {
		staleTime: 15e3,
		refetchOnWindowFocus: false,
		placeholderData: keepPreviousData
	} } });
	return g.__pbiQueryClient__;
}
function Root() {
	noteHref(useRouterState({ select: (state) => state.location.href }));
	const [queryClient] = (0, import_react.useState)(getQueryClient);
	(0, import_react.useEffect)(() => {
		const timer = window.setTimeout(settleFreshLoad, 2500);
		return () => window.clearTimeout(timer);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
				client: queryClient,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeScreenPrompt, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachTour, {})
				]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	});
}
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("h-12 w-full rounded-md border border-line bg-surface px-3 text-base text-fg", "placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary", className),
		...props
	});
}
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: cn("text-sm font-semibold text-fg", className),
		...props
	});
}
function CoachAccessPrompt({ teamName, busy, title = "Coach access", subtitle = "An Admin reviews this before Coach tools turn on. Parent tools still work while you wait.", submitLabel = "Continue", error, phone, email, password, onTeamName, onPhone, onEmail, onPassword, onContinue, onBack }) {
	const [localError, setLocalError] = (0, import_react.useState)(null);
	const account = onPhone != null && onEmail != null && onPassword != null;
	const shown = localError || error;
	function onSubmit(event) {
		event.preventDefault();
		try {
			const parsed = parseCoachAccess({ teamName });
			setLocalError(null);
			onContinue({ teamName: parsed.teamName });
		} catch (err) {
			setLocalError(err instanceof Error ? err.message : "Check your answers and try again.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit,
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl font-bold uppercase tracking-wide",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: subtitle
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "coach-team",
					children: "What team do you coach?"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "coach-team",
					value: teamName,
					onChange: (e) => onTeamName(e.target.value),
					placeholder: "Tellico 16U",
					autoComplete: "organization",
					maxLength: 80
				})]
			}),
			account ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "coach-phone",
						children: "Cell phone"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "coach-phone",
						type: "tel",
						inputMode: "tel",
						autoComplete: "tel",
						value: formatPhoneInput(phone ?? ""),
						placeholder: "(555) 555-0100",
						onChange: (e) => onPhone(formatPhoneInput(e.target.value))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "coach-email",
						children: "Email"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "coach-email",
						type: "text",
						inputMode: "email",
						autoCapitalize: "none",
						autoCorrect: "off",
						autoComplete: "username",
						value: email,
						onChange: (e) => onEmail(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "coach-password",
							children: "Password"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "coach-password",
							type: "password",
							autoComplete: "new-password",
							value: password,
							onChange: (e) => onPassword(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "At least 8 characters."
						})
					]
				})
			] }) : null,
			shown ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md bg-warn-bg px-3 py-2 text-sm font-medium",
				role: "alert",
				children: shown
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				size: "lg",
				className: "w-full",
				disabled: busy,
				children: busy ? "Saving…" : submitLabel
			}),
			onBack ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "ghost",
				className: "w-full",
				onClick: onBack,
				children: "Back"
			}) : null
		]
	});
}
var KEY = "pbi-coach-notices";
function armCoachNotices() {
	if (typeof window === "undefined") return;
	window.sessionStorage.setItem(KEY, "1");
}
function coachNoticesArmed() {
	if (typeof window === "undefined") return false;
	return window.sessionStorage.getItem(KEY) === "1";
}
function clearCoachNotices() {
	if (typeof window === "undefined") return;
	window.sessionStorage.removeItem(KEY);
}
/** Coach notifications are only new tournaments, or a change to one. */
function coachTournamentBucket(item) {
	const title = item.title.toLowerCase();
	const body = item.body.toLowerCase();
	const kind = item.kind.toLowerCase();
	if (kind === "available" || body.includes("if your team is interested")) return "new";
	if (kind === "teams" || title.includes("you're in") || title.includes("team not accepted") || title.includes("waiting for approval") || title.includes("schedule") || title.includes("cancelled") || title.includes("canceled") || title.includes("taken off") || title.includes("removed") || title.includes("weather") || title.includes("rain") || body.includes("rainout")) return "change";
	return null;
}
function CoachLoginNotices() {
	const { user } = useAppSession();
	const queryClient = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const armed = coachNoticesArmed();
	const notifQuery = useQuery({
		queryKey: ["notifications", user?.id],
		queryFn: () => listNotifications(),
		enabled: Boolean(user && armed)
	});
	const teamsQuery = useQuery({
		queryKey: ["my-teams", user?.id],
		queryFn: () => listMyCoachTeams(),
		enabled: Boolean(user && armed)
	});
	const fresh = (notifQuery.data ?? []).filter((item) => !item.read && coachTournamentBucket(item));
	const [tourDone, setTourDone] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setTourDone(coachTourFinished(user?.id));
		const onDone = () => setTourDone(true);
		window.addEventListener("pbi-coach-tour-done", onDone);
		return () => window.removeEventListener("pbi-coach-tour-done", onDone);
	}, [user?.id]);
	(0, import_react.useEffect)(() => {
		if (!tourDone || !armed || !notifQuery.isSuccess) return;
		if (fresh.length === 0) {
			clearCoachNotices();
			setOpen(false);
			return;
		}
		setOpen(true);
	}, [
		tourDone,
		armed,
		notifQuery.isSuccess,
		fresh.length
	]);
	function close() {
		const seen = fresh.filter((item) => coachTournamentBucket(item) === "change").map((item) => item.id);
		clearCoachNotices();
		setOpen(false);
		if (seen.length === 0 || !user) return;
		queryClient.setQueryData(["notifications", user.id], (current) => (current ?? []).map((item) => seen.includes(item.id) ? {
			...item,
			read: true
		} : item));
		markNotificationsRead({ data: { ids: seen } });
	}
	if (!open || typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[80] flex items-center justify-center bg-scrim p-4",
		onClick: close,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": "New notifications",
			className: "max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
			onClick: (event) => event.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl font-bold uppercase",
						children: "New notifications"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Close",
						onClick: close,
						className: "grid h-11 w-11 place-items-center rounded-md text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							className: "h-5 w-5",
							"aria-hidden": true
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-3",
					children: fresh.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-lg border border-line bg-surface px-3 py-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: item.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: item.body
							}),
							coachTournamentBucket(item) === "new" && item.weekendId != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoticeChoices, {
								weekendId: item.weekendId,
								hasTeam: (teamsQuery.data ?? []).length > 0
							}) : null
						]
					}, item.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					className: "mt-4 w-full",
					onClick: close,
					children: "Got it"
				})
			]
		})
	}), document.body);
}
function NoticeChoices({ weekendId, hasTeam }) {
	const queryClient = useQueryClient();
	const save = useMutation({
		mutationFn: (choice) => respondToTournament({ data: {
			weekendId,
			choice
		} }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["notifications"] });
			await queryClient.invalidateQueries({ queryKey: ["tournament-responses"] });
			await queryClient.invalidateQueries({ queryKey: ["my-interest"] });
			await queryClient.invalidateQueries({ queryKey: ["weekends"] });
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 space-y-2",
		children: [[
			{
				choice: "interested",
				label: "Register"
			},
			{
				choice: "maybe",
				label: "Not sure yet"
			},
			{
				choice: "no",
				label: "Maybe next time"
			}
		].map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			type: "button",
			variant: "outline",
			className: "w-full",
			disabled: save.isPending || option.choice === "interested" && !hasTeam,
			onClick: () => save.mutate(option.choice),
			children: save.isPending && save.variables === option.choice ? "Saving…" : option.label
		}, option.choice)), save.error instanceof Error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm",
			children: save.error.message
		}) : null]
	});
}
function BrandMark({ className = "h-14 w-auto" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: "/logo.png",
		alt: "423Sports",
		className: cn("object-contain", className)
	});
}
function BrandLockup({ subtitle, compact }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "inline-flex max-w-full rounded-md bg-[#111111] px-3 py-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandMark, { className: compact ? "h-12 w-auto" : "mx-auto block h-auto w-full max-w-sm" })
		}), subtitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted",
			children: subtitle
		}) : null]
	});
}
var HOME_FIELD_PHOTO = "/photos/field-diamond.jpg";
var NOTIFICATIONS_FIELD_PHOTO = "/photos/field-celebrate.jpg";
/** Faded field photo for leftover white space. Original pictures, not copied from another site. */
function FieldBand({ src }) {
	if (src === "/photos/field-diamond.jpg") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-hidden": true,
		className: "pointer-events-none mt-6 min-h-48 flex-1 rounded-lg",
		style: {
			backgroundImage: `linear-gradient(to bottom, #ffffff 0%, rgb(255 255 255 / 0.72) 16%, rgb(255 255 255 / 0.08) 46%), url(${src})`,
			backgroundSize: "cover",
			backgroundPosition: "center"
		}
	});
}
function HomeAction({ title, hint, muted, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("site-card flex w-full flex-col items-start gap-1 text-left", muted ? "opacity-70" : "transition-colors duration-150 hover:border-primary"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-display text-2xl font-bold uppercase leading-none",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm text-muted",
				children: hint
			}),
			children
		]
	});
}
function CoachDeniedCard({ profile }) {
	const queryClient = useQueryClient();
	const [asking, setAsking] = (0, import_react.useState)(false);
	const [teamName, setTeamName] = (0, import_react.useState)("");
	const mut = useMutation({
		mutationFn: (input) => resubmitCoachAccess({ data: input }),
		onSuccess: (next) => {
			queryClient.setQueryData(["profile", profile.userId], next);
			queryClient.invalidateQueries({ queryKey: ["notifications", profile.userId] });
			queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
			setAsking(false);
		}
	});
	if (profile.coachAccessLocked) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md bg-warn-bg px-4 py-3 text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-xl font-bold uppercase",
			children: "Coach access denied"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-1 text-sm font-medium",
			children: ["You still have Parent tools. ", PBI_STAFF_CONTACT]
		})]
	});
	if (!profile.canResubmitCoach) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-md bg-warn-bg px-4 py-3 text-sm font-medium text-fg",
		children: "Coach access was denied. You still have Parent tools."
	});
	if (asking) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-line bg-surface p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachAccessPrompt, {
			teamName,
			busy: mut.isPending,
			title: "Request again",
			subtitle: "If this was denied by mistake, tell us the team. An Admin will review it again.",
			submitLabel: "Submit request",
			onTeamName: setTeamName,
			onContinue: (access) => mut.mutate(access),
			onBack: () => {
				if (mut.isPending) return;
				setAsking(false);
			}
		}), mut.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm",
			role: "alert",
			children: mut.error instanceof Error ? mut.error.message : "Could not send that request."
		}) : null]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3 rounded-md bg-warn-bg px-4 py-3 text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-xl font-bold uppercase",
			children: "Coach access denied"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-1 text-sm font-medium",
			children: [
				"If this was a mistake, ",
				resubmitTriesCopy(profile.resubmitsLeft).replace(/^Y/, "y"),
				" You still have Parent tools."
			]
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			type: "button",
			variant: "pine",
			className: "w-full",
			onClick: () => setAsking(true),
			children: "Request Coach access again"
		})]
	});
}
var OPTIONS = [
	{
		choice: "interested",
		label: "Register"
	},
	{
		choice: "maybe",
		label: "Not sure yet"
	},
	{
		choice: "no",
		label: "Maybe next time"
	}
];
function EventAgeInterest({ weekendId, onSaved }) {
	const query = useQuery({
		queryKey: ["event-age-interest", String(weekendId)],
		queryFn: () => listMyEventInterest({ data: { weekendIds: [weekendId] } })
	});
	if (query.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-4 text-sm text-muted",
		children: "Loading…"
	});
	if (query.error instanceof Error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-4 text-sm",
		children: query.error.message
	});
	const event = query.data?.events[0];
	if (!event) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-4 text-sm",
		children: "That tournament is no longer on the schedule."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventAgeChoices, {
		event,
		ages: query.data?.ages ?? [],
		onSaved
	});
}
function EventAgeChoices({ event, ages, onSaved }) {
	const queryClient = useQueryClient();
	const save = useMutation({
		mutationFn: (input) => respondToEventAge({ data: {
			weekendId: event.id,
			ageGroup: input.ageGroup,
			choice: input.choice
		} }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["event-age-interest"] });
			await queryClient.invalidateQueries({ queryKey: ["tournament-replies"] });
			await queryClient.invalidateQueries({ queryKey: ["tournament-responses"] });
			await queryClient.invalidateQueries({ queryKey: ["notifications"] });
			await queryClient.invalidateQueries({ queryKey: ["weekends"] });
			await queryClient.invalidateQueries({ queryKey: ["weekend"] });
			await queryClient.invalidateQueries({ queryKey: ["schedule"] });
			await queryClient.invalidateQueries({ queryKey: ["my-teams"] });
		}
	});
	const groups = event.ageGroups.length > 0 ? event.ageGroups : ages.map((age) => age.ageGroup);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm",
				children: "Register puts your team on this tournament. The director can take you off."
			}),
			groups.map((ageGroup) => {
				const mine = ages.find((age) => age.ageGroup === ageGroup);
				const current = event.choices.find((choice) => choice.ageGroup === ageGroup)?.choice ?? null;
				const selected = (save.isPending && save.variables?.ageGroup === ageGroup ? save.variables.choice : null) ?? current;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm font-semibold",
						children: [ageGroup, mine && mine.teamNames.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-normal text-muted",
							children: [" · ", mine.teamNames.join(", ")]
						}) : null]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-2",
						children: OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: selected === option.choice ? "default" : "outline",
							className: "w-full",
							disabled: save.isPending,
							onClick: () => {
								if (selected !== option.choice) save.mutate({
									ageGroup,
									choice: option.choice
								});
								onSaved?.();
							},
							children: option.label
						}, option.choice))
					})]
				}, ageGroup);
			}),
			save.error instanceof Error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm",
				children: save.error.message
			}) : null
		]
	});
}
function firstPitchMs(weekend) {
	const [y, m, d] = weekend.startDate.split("-").map(Number);
	const [hh, mm] = (weekend.rules.firstPitch || "08:00").split(":").map(Number);
	return new Date(y || 0, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0).getTime();
}
function tournamentEnded(weekend, now) {
	const [y, m, d] = weekend.endDate.split("-").map(Number);
	return now.getTime() > new Date(y || 0, (m || 1) - 1, d || 1, 23, 59, 59, 999).getTime();
}
function StatusBanner({ profile }) {
	if (profile.requestStatus === "pending") {
		const label = profile.requestedRole === "admin" ? "Admin" : "Coach";
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/notifications",
			className: "block rounded-md bg-warn-bg px-4 py-3 text-fg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "block font-display text-xl font-bold uppercase",
				children: [label, " access pending"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "mt-1 block text-sm font-medium",
				children: [
					"An Admin still has to approve ",
					label,
					" tools. You can use Parent tools until then. Tap for status."
				]
			})]
		});
	}
	if (profile.requestStatus === "denied" && profile.requestedRole === "coach") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachDeniedCard, { profile });
	if (profile.requestStatus === "denied") {
		const label = profile.requestedRole === "admin" ? "Admin" : "Coach";
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/notifications",
			className: "block rounded-md bg-warn-bg px-4 py-3 text-sm font-medium text-fg",
			children: [label, " access was denied. You still have Parent tools. See Notifications."]
		});
	}
	return null;
}
function ParentLayout({ profile, greeting }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl font-bold uppercase",
				children: greeting
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBanner, { profile }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeAction, {
				title: "My athletes",
				hint: "Coming soon — add the kids you follow.",
				muted: true
			})
		]
	});
}
function ParentHome({ profile }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParentLayout, {
		profile,
		greeting: "Parent home"
	});
}
function AthleteHome() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-4xl font-bold uppercase",
			children: "Athlete home"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeAction, {
			title: "My team",
			hint: "Coming soon — roster and coaches.",
			muted: true
		})]
	});
}
function CoachHome() {
	const seasonsQuery = useQuery({
		queryKey: ["season-cards"],
		queryFn: () => listSeasonCards()
	});
	const weekendsQuery = useQuery({
		queryKey: ["weekends"],
		queryFn: () => listWeekends()
	});
	const teamsQuery = useQuery({
		queryKey: ["my-teams"],
		queryFn: () => listMyTeams()
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminCalendarHome, {
		weekends: weekendsQuery.data ?? [],
		seasons: seasonsQuery.data?.cards ?? [],
		rollover: null,
		readOnly: true,
		teams: teamsQuery.data ?? []
	});
}
function fallbackSeasonCards() {
	return [
		"spring",
		"summer",
		"fall"
	].map((season) => {
		const year = FIRST_SEASON_YEAR;
		const window = defaultSeasonWindow(season, year);
		return {
			season,
			year,
			label: seasonLabel(season),
			startDate: window.startDate,
			endDate: window.endDate,
			windowLabel: formatSeasonSpan(window.startDate, window.endDate),
			announcedCount: 0,
			pastDeadline: false,
			deadlineCopy: ""
		};
	});
}
function inSeasonWindow(weekend, start, end) {
	return Boolean(start && end) && weekend.startDate <= end && weekend.endDate >= start;
}
function ArchiveYearPrompt({ rollover }) {
	const queryClient = useQueryClient();
	const [sure, setSure] = (0, import_react.useState)(false);
	const archive = useMutation({
		mutationFn: () => archivePlanningYear(),
		onSuccess: async () => {
			setSure(false);
			await queryClient.invalidateQueries({ queryKey: ["season-cards"] });
			await queryClient.invalidateQueries({ queryKey: ["season-plan"] });
			await queryClient.invalidateQueries({ queryKey: ["weekends"] });
		}
	});
	if (!rollover) return null;
	const error = archive.error instanceof Error ? archive.error.message : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3 rounded-lg border border-line bg-warn-bg px-3 py-3",
		role: "status",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm font-semibold",
				children: [
					"Fall ended ",
					formatMonthDay(rollover.fallEnd),
					". Archive ",
					rollover.year,
					" and open ",
					rollover.nextYear,
					"?"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					rollover.year,
					" stays saved. It comes off these calendars. ",
					rollover.nextYear,
					" starts empty."
				]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm",
				children: error
			}) : null,
			sure ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					disabled: archive.isPending,
					onClick: () => archive.mutate(),
					children: archive.isPending ? "Archiving…" : `Yes, archive ${rollover.year}`
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "outline",
					disabled: archive.isPending,
					onClick: () => setSure(false),
					children: "Not yet"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				onClick: () => setSure(true),
				children: ["Archive ", rollover.year]
			})
		]
	});
}
var HOME_WEEKDAYS = [
	"S",
	"M",
	"T",
	"W",
	"T",
	"F",
	"S"
];
function AdminHome({ weekends, seasons, rollover }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminCalendarHome, {
		weekends,
		seasons,
		rollover
	});
}
function AdminCalendarHome({ weekends, seasons, rollover, readOnly = false, teams = [] }) {
	const cards = [...seasons.length > 0 ? seasons : fallbackSeasonCards()].sort((a, b) => a.startDate.localeCompare(b.startDate));
	const today = isoDateFromLocal(/* @__PURE__ */ new Date());
	const open = cards.find((card) => today >= card.startDate && today <= card.endDate) ?? cards[0];
	const [seasonKey, setSeasonKey] = (0, import_react.useState)(open ? `${open.season}-${open.year}` : "");
	const [focusMonth, setFocusMonth] = (0, import_react.useState)(null);
	const card = cards.find((item) => `${item.season}-${item.year}` === seasonKey) ?? cards[0];
	const seasonIndex = card ? cards.findIndex((item) => item.season === card.season && item.year === card.year) : -1;
	function openSeason(item, month) {
		setSeasonKey(`${item.season}-${item.year}`);
		setFocusMonth(month);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-[calc(100dvh-11rem)] flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-4xl font-bold uppercase leading-none",
						children: "Schedule"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SeasonDashboard, {
						weekends,
						cards,
						layout: "grid",
						readOnly,
						teams
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"data-tour": readOnly ? "seasons" : void 0,
					className: "grid grid-cols-3 gap-1",
					children: cards.map((item) => {
						const on = card?.season === item.season && card.year === item.year;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => openSeason(item, null),
							className: `rounded-full px-1 py-0.5 text-center text-sm font-bold uppercase ${on ? "bg-fg text-bg" : "text-muted"}`,
							children: item.label
						}, `${item.season}-${item.year}`);
					})
				}),
				readOnly ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArchiveYearPrompt, { rollover }),
				card ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeMonth, {
					startDate: card.startDate,
					endDate: card.endDate,
					weekends,
					season: card.season,
					year: card.year,
					initialMonth: focusMonth,
					readOnly,
					teams,
					canPrev: seasonIndex > 0,
					canNext: seasonIndex >= 0 && seasonIndex < cards.length - 1,
					onEdge: (dir) => {
						const next = cards[seasonIndex + dir];
						if (!next) return;
						openSeason(next, dir > 0 ? next.startDate.slice(0, 7) : next.endDate.slice(0, 7));
					}
				}, `${card.season}-${card.year}-${focusMonth ?? "open"}`) : null
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldBand, { src: "/photos/field-diamond.jpg" })]
	});
}
function HomeMonth({ startDate, endDate, weekends, season, year, initialMonth, readOnly = false, teams = [], canPrev, canNext, onEdge }) {
	const navigate = useNavigate();
	const today = isoDateFromLocal(/* @__PURE__ */ new Date());
	const [monthKey, setMonthKey] = (0, import_react.useState)(() => initialMonth ?? (today >= startDate && today <= endDate ? today : startDate).slice(0, 7));
	const [picked, setPicked] = (0, import_react.useState)(null);
	const [eventPopup, setEventPopup] = (0, import_react.useState)(null);
	const [cardName, setCardName] = (0, import_react.useState)("");
	const [cardStart, setCardStart] = (0, import_react.useState)("");
	const [cardEnd, setCardEnd] = (0, import_react.useState)("");
	const months = homeMonths(startDate, endDate);
	const visible = months.find((month) => homeMonthKey(month) === monthKey) ?? months[0] ?? null;
	const cells = visible ? homeMonthCells(visible.year, visible.month) : [];
	const monthIndex = visible ? months.findIndex((month) => homeMonthKey(month) === homeMonthKey(visible)) : -1;
	const scheduled = weekends.filter((weekend) => weekend.startDate <= endDate && weekend.endDate >= startDate).sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id);
	const swipe = (0, import_react.useRef)(null);
	const swiped = (0, import_react.useRef)(false);
	const monthKeyVisible = visible ? homeMonthKey(visible) : "";
	const monthEvents = scheduled.filter((weekend) => weekend.lifecycle !== "announced" && weekend.startDate.slice(0, 7) <= monthKeyVisible && weekend.endDate.slice(0, 7) >= monthKeyVisible);
	const shown = picked ? monthEvents.filter((weekend) => weekend.startDate <= picked && weekend.endDate >= picked) : monthEvents;
	const monthName = visible ? new Date(visible.year, visible.month - 1, 1).toLocaleDateString("en-US", { month: "long" }) : "this month";
	(0, import_react.useEffect)(() => {
		if (!picked) return;
		const yearKey = String(year);
		const thisYear = weekends.filter((weekend) => weekend.seasonYear === year || weekend.startDate.startsWith(yearKey));
		const inSeason = thisYear.filter((weekend) => weekend.season === season);
		setCardName(suggestTournamentName(season, year, thisYear.map((weekend) => weekend.name), inSeason.length));
		setCardStart(picked);
		setCardEnd(addDays(picked, 1));
	}, [
		picked,
		season,
		year,
		weekends
	]);
	function openCreate() {
		navigate({
			to: "/weekends",
			search: {
				add: 1,
				name: cardName.trim(),
				start: cardStart,
				end: cardEnd,
				season,
				year
			}
		});
	}
	function stepMonth(dir) {
		const following = months[monthIndex + dir];
		if (!following) {
			onEdge(dir);
			return;
		}
		setMonthKey(homeMonthKey(following));
		setPicked(null);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			visible ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				"data-tour": readOnly ? "calendar" : void 0,
				className: "space-y-2 touch-pan-y",
				onPointerDown: (event) => {
					if (event.pointerType === "mouse" && event.button !== 0) return;
					swipe.current = {
						x: event.clientX,
						y: event.clientY
					};
				},
				onPointerUp: (event) => {
					const start = swipe.current;
					swipe.current = null;
					if (!start) return;
					const dx = event.clientX - start.x;
					const dy = event.clientY - start.y;
					if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
					swiped.current = true;
					stepMonth(dx < 0 ? 1 : -1);
				},
				onPointerCancel: () => {
					swipe.current = null;
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Previous month",
								disabled: monthIndex <= 0 && !canPrev,
								onClick: () => stepMonth(-1),
								className: "grid h-11 w-11 shrink-0 place-items-center rounded-full text-fg disabled:text-muted/40",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
									className: "h-6 w-6",
									"aria-hidden": true
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "min-w-0 flex-1 text-center font-display text-2xl font-bold uppercase leading-none",
								children: new Date(visible.year, visible.month - 1, 1).toLocaleDateString("en-US", {
									month: "long",
									year: "numeric"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Next month",
								disabled: (monthIndex < 0 || monthIndex >= months.length - 1) && !canNext,
								onClick: () => stepMonth(1),
								className: "grid h-11 w-11 shrink-0 place-items-center rounded-full text-fg disabled:text-muted/40",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
									className: "h-6 w-6",
									"aria-hidden": true
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase text-muted",
						children: HOME_WEEKDAYS.map((label, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }, `${label}-${index}`))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-[17.75rem] grid-cols-7 grid-rows-6 gap-1",
						children: cells.map((cell) => {
							const inside = cell.inMonth && cell.iso >= startDate && cell.iso <= endDate;
							const tone = cell.inMonth ? homeDayTone(cell.iso, scheduled, today, readOnly, teams) : null;
							const isPicked = cell.iso === picked;
							const fill = tone === "past" ? "bg-[#c45c38] text-white" : tone === "final" || tone === "attending" ? "bg-pine text-pine-fg" : tone === "posted" || tone === "event" ? "bg-[#f5c518] text-[#1c1c1c]" : isPicked ? "bg-surface text-fg" : inside ? "bg-surface text-fg" : "text-muted";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: !cell.inMonth,
								"aria-hidden": !cell.inMonth,
								"aria-pressed": isPicked,
								onClick: () => {
									if (swiped.current) {
										swiped.current = false;
										return;
									}
									if (picked === cell.iso) {
										setPicked(null);
										return;
									}
									setPicked(cell.iso);
								},
								className: `flex h-full min-h-11 items-center justify-center rounded-md text-sm font-semibold ${fill} ${!cell.inMonth ? "invisible" : isPicked ? "ring-2 ring-[#1c1c1c]" : ""}`,
								children: Number(cell.iso.slice(8, 10))
							}, cell.iso);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs font-semibold text-muted",
						children: readOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "h-3 w-3 rounded-sm bg-[#f5c518]",
									"aria-hidden": true
								}), "Tournaments"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "h-3 w-3 rounded-sm bg-pine",
									"aria-hidden": true
								}), "Attending"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "h-3 w-3 rounded-sm bg-[#c45c38]",
									"aria-hidden": true
								}), "Past"]
							})
						] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "h-3 w-3 rounded-sm bg-[#f5c518]",
									"aria-hidden": true
								}), "Scheduled"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "h-3 w-3 rounded-sm bg-pine",
									"aria-hidden": true
								}), "Teams in"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "h-3 w-3 rounded-sm bg-[#c45c38]",
									"aria-hidden": true
								}), "Past"]
							})
						] })
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "This season has no months yet."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				"data-tour": readOnly ? "events" : void 0,
				className: "space-y-3",
				children: [shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-lg border border-dashed border-line bg-surface px-4 py-4 text-sm text-muted",
					children: picked ? readOnly ? "Nothing scheduled this day." : "Nothing this day yet." : readOnly ? `Nothing in ${monthName} yet.` : `Nothing in ${monthName} yet. Tap a day to add one.`
				}) : shown.map((event) => {
					const wash = readOnly ? coachTournamentWash(event, teams, today) : "";
					const ages = event.ageGroups.length > 0 ? formatAgeGroups(event.ageGroups) : "";
					const interest = event.approvedCount === 0 ? "No teams in yet" : event.approvedCount === 1 ? "1 in" : `${event.approvedCount} in`;
					const fee = event.teamFeeCents != null ? `${formatTeamFee(event.teamFeeCents)} per team` : "";
					const heading = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl font-bold uppercase leading-tight",
							children: event.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: `mt-1 text-sm ${wash ? "opacity-80" : "text-muted"}`,
							children: formatWeekendRange(event.startDate, event.endDate)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm font-semibold",
							children: [
								ages,
								interest,
								fee
							].filter(Boolean).join(" · ")
						})
					] });
					return readOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							if (teams.some((team) => team.weekendId === event.id && team.status === "approved")) {
								navigate({
									to: "/weekends/$weekendId",
									params: { weekendId: String(event.id) }
								});
								return;
							}
							setEventPopup(event);
						},
						className: `block w-full space-y-1 rounded-lg px-3 py-3 text-left ${wash}`,
						children: heading
					}, event.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/weekends/$weekendId",
						params: { weekendId: String(event.id) },
						className: "block rounded-xl border border-white/80 bg-white/45 px-3 py-3 shadow-[0_8px_18px_rgba(28,28,28,0.12)] backdrop-blur-[2px]",
						children: heading
					}, event.id);
				}), !readOnly && picked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					className: "w-full",
					disabled: !cardName.trim() || !cardStart || cardEnd < cardStart,
					onClick: openCreate,
					children: shown.length === 0 ? "Add a tournament" : "Add another tournament"
				}) : null]
			}),
			eventPopup ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachEventDialog, {
				event: eventPopup,
				onClose: () => setEventPopup(null)
			}) : null
		]
	});
}
function CoachEventDialog({ event, onClose }) {
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[80] flex items-center justify-center bg-scrim p-4",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": event.name,
			className: "max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
			onClick: (click) => click.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl font-bold uppercase leading-tight",
							children: event.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: formatWeekendRange(event.startDate, event.endDate)
						}),
						event.teamFeeCents != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm font-semibold",
							children: [formatTeamFee(event.teamFeeCents), " per team"]
						}) : null
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						className: "px-2 text-muted",
						onClick: onClose,
						children: "Close"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RegisteredTeams, { weekendId: event.id }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventAgeInterest, {
					weekendId: event.id,
					onSaved: onClose
				})
			]
		})
	}), document.body);
}
function RegisteredTeams({ weekendId }) {
	const query = useQuery({
		queryKey: ["tournament-roster", weekendId],
		queryFn: () => listTournamentRoster({ data: { weekendId } })
	});
	const teams = query.data ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs font-bold uppercase tracking-wide text-muted",
			children: "Teams registered"
		}), query.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted",
			children: "Loading teams…"
		}) : query.error instanceof Error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm",
			children: query.error.message
		}) : teams.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted",
			children: "No teams in yet."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-2 space-y-2",
			children: teams.map((team) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-lg border border-line bg-surface px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-semibold leading-tight",
					children: team.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 text-xs text-muted",
					children: team.ageGroup
				})]
			}, `${team.ageGroup}-${team.name}`))
		})]
	});
}
function coachTournamentWash(weekend, teams, today) {
	if (weekend.endDate < today) return "bg-[#c45c38] text-white";
	if (teams.some((team) => team.status === "approved" && team.weekendId === weekend.id)) return "bg-pine text-pine-fg";
	return "bg-[#f5c518] text-[#1c1c1c]";
}
function homeMonths(start, end) {
	if (end < start || start.length < 7 || end.length < 7) return [];
	const out = [];
	let y = Number(start.slice(0, 4));
	let m = Number(start.slice(5, 7));
	const ye = Number(end.slice(0, 4));
	const me = Number(end.slice(5, 7));
	let guard = 0;
	while ((y < ye || y === ye && m <= me) && guard < 18) {
		out.push({
			year: y,
			month: m
		});
		m += 1;
		if (m > 12) {
			m = 1;
			y += 1;
		}
		guard += 1;
	}
	return out;
}
function homeMonthKey(month) {
	return `${month.year}-${String(month.month).padStart(2, "0")}`;
}
function homeMonthCells(year, month) {
	const pad = new Date(year, month - 1, 1).getDay();
	const count = new Date(year, month, 0).getDate();
	const cells = [];
	for (let i = 0; i < pad; i += 1) cells.push({
		iso: isoDateFromLocal(new Date(year, month - 1, 1 - (pad - i))),
		inMonth: false
	});
	for (let day = 1; day <= count; day += 1) cells.push({
		iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
		inMonth: true
	});
	while (cells.length < 42) cells.push({
		iso: addDays(cells[cells.length - 1].iso, 1),
		inMonth: false
	});
	return cells;
}
function homeDayTone(iso, weekends, today, coach = false, teams = []) {
	const covering = weekends.filter((weekend) => iso >= weekend.startDate && iso <= weekend.endDate);
	const attending = teams.some((team) => team.status === "approved" && iso >= team.startDate && iso <= team.endDate);
	if (covering.length === 0 && !attending) return null;
	if (iso < today) return "past";
	if (coach) {
		if (attending) return "attending";
		if (covering.some((weekend) => weekend.lifecycle !== "announced")) return "event";
		return null;
	}
	if (covering.some((weekend) => weekend.lifecycle !== "announced" && weekend.approvedCount > 0)) return "final";
	if (covering.some((weekend) => weekend.lifecycle !== "announced")) return "posted";
	return null;
}
function CoachCountsDialog({ group, kind, weekends, teams, onClose }) {
	if (typeof document === "undefined") return null;
	const blurb = kind === "available" ? "Tournaments you are not in." : kind === "going" ? "Tournaments your team has been added to." : kind === "live" ? "Yours, from 48 hours before first pitch until it ends." : "Tournaments your team has played.";
	const empty = kind === "available" ? "No open tournaments outside the ones you're already in." : kind === "going" ? "No upcoming tournaments yet." : kind === "live" ? "Nothing of yours is on right now." : "No tournaments attended yet.";
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[80] flex items-center justify-center bg-scrim p-4",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": group,
			className: "max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
			onClick: (event) => event.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl font-bold uppercase",
						children: group
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						className: "px-2 text-muted",
						onClick: onClose,
						children: "Close"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: blurb
				}),
				weekends.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted",
					children: empty
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-2",
					children: weekends.map((weekend) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: kind === "available" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-line bg-surface px-3 py-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: weekend.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: formatWeekendRange(weekend.startDate, weekend.endDate)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RegisteredTeams, { weekendId: weekend.id }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventAgeInterest, { weekendId: weekend.id })
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachTournamentRow, {
						weekend,
						teams
					}) }, weekend.id))
				})
			]
		})
	}), document.body);
}
function CoachTournamentRow({ weekend, teams }) {
	const mine = teams.filter((team) => team.weekendId === weekend.id && team.status === "approved");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/weekends/$weekendId",
		params: { weekendId: String(weekend.id) },
		className: "block rounded-lg border border-line bg-surface px-3 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block font-semibold",
				children: weekend.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-1 block text-sm text-muted",
				children: formatWeekendRange(weekend.startDate, weekend.endDate)
			}),
			mine.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-1 block text-sm font-semibold",
				children: mine.map((team) => `${team.name} · ${team.ageGroup}`).join(" · ")
			}) : null
		]
	});
}
function coachIsIn(weekendId, teams) {
	return teams.some((team) => team.weekendId === weekendId && team.status === "approved");
}
function coachCountGroups(weekends, cards, teams, now) {
	const inSeasons = weekends.filter((weekend) => cards.some((card) => inSeasonWindow(weekend, card.startDate, card.endDate)));
	const nowMs = now.getTime();
	const lead = 1728e5;
	const mine = inSeasons.filter((weekend) => weekend.lifecycle !== "announced" && coachIsIn(weekend.id, teams));
	const byStart = (a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id;
	return {
		available: inSeasons.filter((weekend) => weekend.lifecycle !== "announced" && !tournamentEnded(weekend, now) && !coachIsIn(weekend.id, teams)).sort(byStart),
		going: mine.filter((weekend) => !tournamentEnded(weekend, now) && nowMs < firstPitchMs(weekend) - lead).sort(byStart),
		live: mine.filter((weekend) => !tournamentEnded(weekend, now) && nowMs >= firstPitchMs(weekend) - lead).sort(byStart),
		attended: mine.filter((weekend) => tournamentEnded(weekend, now)).sort(byStart)
	};
}
function SeasonDashboard({ weekends, cards, layout = "row", readOnly = false, teams = [] }) {
	const [openGroup, setOpenGroup] = (0, import_react.useState)(null);
	const now = /* @__PURE__ */ new Date();
	const tournaments = weekends.filter((weekend) => cards.some((card) => inSeasonWindow(weekend, card.startDate, card.endDate))).sort((a, b) => a.startDate.localeCompare(b.startDate)).filter((weekend) => weekend.lifecycle !== "announced");
	const nowMs = now.getTime();
	const lead = 432e6;
	const complete = tournaments.filter((weekend) => tournamentEnded(weekend, now));
	const open = tournaments.filter((weekend) => !tournamentEnded(weekend, now));
	const needsWork = open.filter((weekend) => neededToFinish(weekend).length > 0);
	const ready = open.filter((weekend) => neededToFinish(weekend).length === 0 && nowMs < firstPitchMs(weekend) - lead);
	const active = open.filter((weekend) => neededToFinish(weekend).length === 0 && nowMs >= firstPitchMs(weekend) - lead);
	const coach = readOnly ? coachCountGroups(weekends, cards, teams, now) : null;
	const tiles = coach ? [
		{
			label: "Available",
			kind: "available",
			weekends: coach.available,
			wash: "bg-[#fff6d8]"
		},
		{
			label: "Going",
			kind: "going",
			weekends: coach.going,
			wash: "bg-[#e8f3fc]"
		},
		{
			label: "Live",
			kind: "live",
			weekends: coach.live,
			wash: "bg-surface"
		},
		{
			label: "Attended",
			kind: "attended",
			weekends: coach.attended,
			wash: "bg-[#f3f3f3]"
		}
	] : [
		{
			label: "Needs work",
			kind: null,
			weekends: needsWork,
			wash: "bg-[#fff6d8]"
		},
		{
			label: "Ready",
			kind: null,
			weekends: ready,
			wash: "bg-[#e8f3fc]"
		},
		{
			label: "Active",
			kind: null,
			weekends: active,
			wash: "bg-surface"
		},
		{
			label: "Complete",
			kind: null,
			weekends: complete,
			wash: "bg-[#f3f3f3]"
		}
	];
	const selected = tiles.find((tile) => tile.label === openGroup) ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-tour": readOnly ? "counts" : void 0,
		className: `overflow-hidden rounded-lg border border-line ${layout === "grid" ? "w-[8.75rem] shrink-0" : ""}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: layout === "grid" ? "grid grid-cols-2" : "grid grid-cols-4",
			children: tiles.map((tile, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setOpenGroup(tile.label),
				className: `${layout === "grid" ? "px-1 py-1" : "px-1.5 py-2"} text-center ${tile.wash} ${layout === "grid" ? `${index % 2 === 0 ? "border-r border-line" : ""} ${index < 2 ? "border-b border-line" : ""}` : index < tiles.length - 1 ? "border-r border-line" : ""}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: `font-display font-bold leading-none ${layout === "grid" ? "text-sm" : "text-lg"}`,
					children: tile.weekends.length
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: `font-bold uppercase leading-tight tracking-wide text-muted ${layout === "grid" ? "mt-0.5 text-[8px]" : "mt-0.5 text-[10px]"}`,
					children: tile.label
				})]
			}, tile.label))
		})
	}), selected?.kind ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachCountsDialog, {
		group: selected.label,
		kind: selected.kind,
		weekends: selected.weekends,
		teams,
		onClose: () => setOpenGroup(null)
	}) : selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminCountDialog, {
		group: selected.label,
		weekends: selected.weekends,
		onClose: () => setOpenGroup(null)
	}) : null] });
}
function AdminCountDialog({ group, weekends, readOnly = false, onClose }) {
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[80] flex items-center justify-center bg-scrim p-4",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": group,
			className: "max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
			onClick: (event) => event.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-bold uppercase",
					children: group
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					className: "px-2 text-muted",
					onClick: onClose,
					children: "Close"
				})]
			}), weekends.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm text-muted",
				children: "None in this group."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2",
				children: weekends.map((weekend) => {
					const body = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block font-semibold",
							children: weekend.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 block text-sm text-muted",
							children: formatWeekendRange(weekend.startDate, weekend.endDate)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `mt-1 block text-sm font-semibold ${weekend.lifecycle === "announced" || neededToFinish(weekend).length > 0 ? "text-[#c9a227]" : ""}`,
							children: weekend.lifecycle === "announced" ? "Not finalized" : neededToFinish(weekend).length > 0 ? neededToFinish(weekend).join(" · ") : weekend.approvedCount > 0 ? `Finalized · ${weekend.approvedCount === 1 ? "1 team" : `${weekend.approvedCount} teams`}` : "Finalized"
						})
					] });
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: readOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "block rounded-lg border border-line bg-surface px-3 py-3",
						children: body
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/weekends/$weekendId",
						params: { weekendId: String(weekend.id) },
						className: "block rounded-lg border border-line bg-surface px-3 py-3",
						children: body
					}) }, weekend.id);
				})
			})]
		})
	}), document.body);
}
function Fold({ title, count, children }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => setOpen((value) => !value),
		className: "flex w-full items-center justify-between gap-3 text-left",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-2xl font-bold uppercase",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-7 min-w-7 place-items-center rounded-full bg-fg px-2 text-sm font-bold text-white",
				children: count
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
				className: `h-5 w-5 text-muted ${open ? "rotate-180" : ""}`,
				"aria-hidden": true
			})]
		})]
	}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-3 space-y-3",
		children
	}) : null] });
}
function AdminInbox({ pending, pendingTeams, busyId, busyTeamId, onReview, onReviewTeam, canManageAdmins = false }) {
	const applications = pending.filter((req) => req.requestedRole === "coach");
	const otherRequests = pending.filter((req) => req.requestedRole !== "coach");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-5 space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Fold, {
			title: "New coach accounts",
			count: applications.length + pendingTeams.length,
			children: [
				applications.length === 0 && pendingTeams.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted",
					children: "No new coach accounts. A new coach shows up here until you keep them or remove the account."
				}) : null,
				applications.map((req) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3 rounded-lg border border-line bg-surface p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: req.name || req.email
						}),
						req.name ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm",
							children: req.email
						}) : null,
						req.phone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm",
							children: formatPhoneInput(req.phone)
						}) : null,
						req.club ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: "Club:"
								}),
								" ",
								req.club
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm",
							children: "This coach can already use the app. Keep their access, or remove the account."
						}),
						req.teams.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-2 space-y-1",
							children: req.teams.map((team, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: "Team:"
									}),
									" ",
									team.name,
									" · ",
									team.ageGroup
								]
							}, `${team.name}-${team.ageGroup}-${index}`))
						}) : req.teamName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: "Team:"
								}),
								" ",
								req.teamName
							]
						}) : null
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "pine",
							disabled: busyId === req.id,
							onClick: () => onReview(req.id, "approve"),
							children: "Keep access"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							disabled: busyId === req.id,
							onClick: () => onReview(req.id, "deny"),
							children: "Remove account"
						})]
					})]
				}, req.id)),
				pendingTeams.map((team) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3 rounded-lg border border-line bg-surface p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl font-bold uppercase leading-none",
							children: team.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm font-medium",
							children: [
								team.ageGroup,
								" · ",
								team.tournamentName
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: team.coachEmail
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "pine",
							disabled: busyTeamId === team.id,
							onClick: () => onReviewTeam(team.id, "approve"),
							children: "Approve"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							disabled: busyTeamId === team.id,
							onClick: () => onReviewTeam(team.id, "deny"),
							children: "Deny"
						})]
					})]
				}, team.id))
			]
		}), otherRequests.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fold, {
			title: "Admin access",
			count: otherRequests.length,
			children: otherRequests.map((req) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3 rounded-lg border border-line bg-surface p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold",
						children: req.name || req.email
					}),
					req.name ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm",
						children: req.email
					}) : null,
					req.phone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm",
						children: formatPhoneInput(req.phone)
					}) : null,
					req.club ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: "Club:"
							}),
							" ",
							req.club
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							"Wants ",
							ROLE_COPY[req.requestedRole].label,
							" access",
							req.requestedRole === "coach" && req.attempt > 1 ? ` · request ${req.attempt} of 3` : ""
						]
					}),
					req.teams.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 space-y-1",
						children: req.teams.map((team, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: "Team:"
								}),
								" ",
								team.name,
								" · ",
								team.ageGroup
							]
						}, `${team.name}-${team.ageGroup}-${index}`))
					}) : req.teamName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: "Team:"
							}),
							" ",
							req.teamName
						]
					}) : null,
					req.reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: "Why:"
							}),
							" ",
							req.reason
						]
					}) : null
				] }), canManageAdmins ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "pine",
						disabled: busyId === req.id,
						onClick: () => onReview(req.id, "approve"),
						children: "Approve"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						disabled: busyId === req.id,
						onClick: () => onReview(req.id, "deny"),
						children: "Deny"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Only an administrator allowed to manage admins can approve this."
				})]
			}, req.id))
		}) : null]
	});
}
function PendingAsParentHome({ profile }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParentLayout, {
		profile,
		greeting: "You're in"
	});
}
var ICONS = {
	parent: Users,
	athlete: User,
	coach: ClipboardCheck,
	admin: Shield
};
function RolePicker({ onPick, title = "What is your role?", subtitle = "Pick one. You can sign in after." }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-md space-y-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl font-bold uppercase tracking-wide",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted",
				children: subtitle
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3",
			children: ["coach", "admin"].map((role) => {
				const Icon = ICONS[role];
				const copy = ROLE_COPY[role];
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onPick(role),
					className: cn("flex min-h-16 items-center gap-4 rounded-lg border border-line bg-surface px-4 py-4 text-left", "transition-colors duration-150 hover:border-primary hover:bg-primary/5"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-12 w-12 shrink-0 place-items-center rounded-md border-2 border-primary bg-bg text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
							className: "h-6 w-6",
							strokeWidth: 2
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block font-display text-2xl font-bold uppercase leading-none",
							children: copy.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 block text-sm text-muted",
							children: copy.blurb
						})]
					})]
				}, role);
			})
		})]
	});
}
function CoachSignupForm({ name, phone, email, club, password, teams, busy, error, onName, onPhone, onEmail, onClub, onPassword, onTeams, onSubmit, submitLabel = "Create account", busyLabel = "Creating account…", passwordHint = "At least 8 characters.", showPassword = true }) {
	function onForm(event) {
		event.preventDefault();
		onSubmit();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: onForm,
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl font-bold uppercase tracking-wide",
				children: "Coach account"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block space-y-1 text-sm font-semibold",
				children: ["Name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: name,
					onChange: (event) => onName(event.target.value),
					autoComplete: "name",
					placeholder: "Alex Rivera"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block space-y-1 text-sm font-semibold",
				children: ["Cell phone", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: formatPhoneInput(phone),
					onChange: (event) => onPhone(formatPhoneInput(event.target.value)),
					inputMode: "tel",
					autoComplete: "tel",
					placeholder: "(555) 555-0100"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block space-y-1 text-sm font-semibold",
				children: ["Email", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: email,
					onChange: (event) => onEmail(event.target.value),
					inputMode: "email",
					autoCapitalize: "none",
					autoCorrect: "off",
					autoComplete: "email",
					placeholder: "name@email.com"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block space-y-1 text-sm font-semibold",
				children: ["Club", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: club,
					onChange: (event) => onClub(event.target.value),
					placeholder: "Optional"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold",
						children: "Teams"
					}),
					teams.map((team, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-[1fr_5.5rem] gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: team.name,
							"aria-label": "Team name",
							placeholder: "Team name",
							onChange: (event) => onTeams(teams.map((row, i) => i === index ? {
								...row,
								name: event.target.value
							} : row))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							"aria-label": "Age",
							value: team.ageGroup,
							onChange: (event) => onTeams(teams.map((row, i) => i === index ? {
								...row,
								ageGroup: event.target.value
							} : row)),
							className: "h-11 rounded-md border border-line bg-bg px-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Age"
							}), AGE_GROUPS.map((age) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: age,
								children: age
							}, age))]
						})]
					}, index)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						className: "w-full",
						onClick: () => onTeams([...teams, {
							name: "",
							ageGroup: ""
						}]),
						children: "Add another team"
					})
				]
			}),
			showPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block space-y-1 text-sm font-semibold",
				children: [
					"Password",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "password",
						value: password,
						onChange: (event) => onPassword(event.target.value),
						autoComplete: "new-password"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-xs font-normal text-muted",
						children: passwordHint
					})
				]
			}) : null,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md bg-warn-bg px-3 py-2 text-sm font-medium",
				role: "alert",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				size: "lg",
				className: "w-full",
				disabled: busy,
				children: busy ? busyLabel : submitLabel
			})
		]
	});
}
function errorBlob(error) {
	if (!error) return "";
	if (typeof error === "string") return error;
	if (typeof error === "object") {
		const o = error;
		return [
			o.message,
			o.code,
			o.statusText
		].filter((part) => part != null && part !== "").join(" ");
	}
	return String(error);
}
function plainAuthError(error) {
	const text = errorBlob(error).toLowerCase();
	if (!text) return "Something went wrong. Try again.";
	if (text.includes("phone") && text.includes("already")) return "An account with that phone number already exists. Sign in instead.";
	if (text.includes("already exists") || text.includes("user already")) return "An account with that email already exists. Sign in instead.";
	if (text.includes("password") && (text.includes("short") || text.includes("least") || text.includes("weak"))) return "Password is too short. Use at least 8 characters.";
	if (text.includes("invalid email or password") || text.includes("invalid_email_or_password") || text.includes("invalid credentials") || text.includes("invalid password") || text.includes("user not found")) return "Wrong email or password.";
	if (text.includes("invalid email") || text.includes("email is invalid") || text.includes("invalid_email")) return "That email doesn’t look valid.";
	return errorBlob(error);
}
function clientPasswordIssue(password) {
	if (password.length < 8) return "Password is too short. Use at least 8 characters.";
	return null;
}
function clientEmailIssue(email) {
	const v = email.trim();
	if (!v) return "That email doesn’t look valid.";
	const at = v.indexOf("@");
	if (at < 1 || at !== v.lastIndexOf("@")) return "That email doesn’t look valid.";
	const domain = v.slice(at + 1);
	if (!domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) return "That email doesn’t look valid.";
	return null;
}
function EditAccountButton() {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [passwordOpen, setPasswordOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			type: "button",
			variant: "outline",
			className: "w-full",
			onClick: () => setOpen(true),
			children: "Edit account"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			type: "button",
			variant: "outline",
			className: "w-full",
			onClick: () => setPasswordOpen(true),
			children: "Change password"
		}),
		open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditAccountCard, { onClose: () => setOpen(false) }) : null,
		passwordOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChangePasswordCard, { onClose: () => setPasswordOpen(false) }) : null
	] });
}
function EditAccountCard({ onClose }) {
	const queryClient = useQueryClient();
	const accountQuery = useQuery({
		queryKey: ["my-coach-account"],
		queryFn: () => getMyCoachAccount()
	});
	const account = accountQuery.data;
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[90] flex items-center justify-center bg-scrim p-4",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": "Edit account",
			className: "max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
			onClick: (event) => event.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-4 flex items-center justify-end",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Close",
					onClick: onClose,
					className: "grid h-11 w-11 place-items-center rounded-md text-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
						className: "h-5 w-5",
						"aria-hidden": true
					})
				})
			}), accountQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Loading your account…"
			}) : accountQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
				role: "alert",
				children: accountQuery.error instanceof Error ? accountQuery.error.message : "Could not load your account."
			}) : account ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditAccountForm, {
				account,
				onSaved: async () => {
					await queryClient.invalidateQueries({ queryKey: ["my-coach-account"] });
					await queryClient.invalidateQueries({ queryKey: ["profile"] });
					await queryClient.invalidateQueries({ queryKey: ["my-squads"] });
					await queryClient.invalidateQueries({ queryKey: ["my-teams"] });
					onClose();
				}
			}) : null]
		})
	}), document.body);
}
function EditAccountForm({ account, onSaved }) {
	const [name, setName] = (0, import_react.useState)(account.name);
	const [phone, setPhone] = (0, import_react.useState)(account.phone);
	const [email, setEmail] = (0, import_react.useState)(account.email);
	const [club, setClub] = (0, import_react.useState)(account.club);
	const [teams, setTeams] = (0, import_react.useState)(account.teams.length > 0 ? account.teams.map((team) => ({
		name: team.name,
		ageGroup: team.ageGroup
	})) : [{
		name: "",
		ageGroup: ""
	}]);
	const [error, setError] = (0, import_react.useState)(null);
	const save = useMutation({
		mutationFn: () => updateMyCoachAccount({ data: {
			name,
			phone,
			email,
			club,
			teams
		} }),
		onSuccess: () => onSaved()
	});
	function submit() {
		if (!name.trim()) {
			setError("Enter your name.");
			return;
		}
		if (teams.some((team) => !team.name.trim() || !team.ageGroup)) {
			setError("Enter a team name and an age.");
			return;
		}
		const emailIssue = clientEmailIssue(email);
		if (emailIssue) {
			setError(emailIssue);
			return;
		}
		if (phone.replace(/\D/g, "").length < 10) {
			setError("Enter a cell phone.");
			return;
		}
		setError(null);
		save.mutate();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachSignupForm, {
		name,
		phone,
		email,
		club,
		password: "",
		teams,
		busy: save.isPending,
		error: error || (save.error instanceof Error ? save.error.message : null),
		onName: setName,
		onPhone: setPhone,
		onEmail: setEmail,
		onClub: setClub,
		onPassword: () => void 0,
		onTeams: setTeams,
		onSubmit: submit,
		submitLabel: "Update account",
		busyLabel: "Updating account…",
		showPassword: false
	});
}
function ChangePasswordCard({ onClose }) {
	const [password, setPassword] = (0, import_react.useState)("");
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const save = useMutation({
		mutationFn: () => changeMyPassword({ data: { password } }),
		onSuccess: () => onClose()
	});
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[90] flex items-center justify-center bg-scrim p-4",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": "Change password",
			className: "w-full max-w-md rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
			onClick: (event) => event.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-bold uppercase",
					children: "Change password"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Close",
					onClick: onClose,
					className: "grid h-11 w-11 place-items-center rounded-md text-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
						className: "h-5 w-5",
						"aria-hidden": true
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 space-y-3",
				onSubmit: (event) => {
					event.preventDefault();
					const issue = clientPasswordIssue(password);
					if (issue) {
						setError(issue);
						return;
					}
					if (password !== confirm) {
						setError("Those passwords don’t match.");
						return;
					}
					setError(null);
					save.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block space-y-1 text-sm font-semibold",
						children: [
							"New password",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "password",
								value: password,
								onChange: (event) => setPassword(event.target.value),
								autoComplete: "new-password"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-xs font-normal text-muted",
								children: "At least 8 characters."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block space-y-1 text-sm font-semibold",
						children: ["Confirm password", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "password",
							value: confirm,
							onChange: (event) => setConfirm(event.target.value),
							autoComplete: "new-password"
						})]
					}),
					error || save.error instanceof Error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
						role: "alert",
						children: error || (save.error instanceof Error ? save.error.message : "")
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						disabled: save.isPending,
						children: save.isPending ? "Saving…" : "Update password"
					})
				]
			})]
		})
	}), document.body);
}
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* With auth on, visitors are signed out until they authenticate — in the sandbox
* live preview too, which does real sign-in. The shared dev user appears only
* when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to });
}
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const gateSession = (0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center gap-2",
		children: !gateSession && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			disabled: signingOut,
			onClick: () => {
				setSigningOut(true);
				endMyLogin().catch(() => void 0).then(() => signOut()).catch(() => setSigningOut(false));
			},
			className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
			children: signingOut ? "Signing out…" : "Sign out"
		})
	});
}
function useLiveSync(userId) {
	const queryClient = useQueryClient();
	const seen = (0, import_react.useRef)(null);
	const stampQuery = useQuery({
		queryKey: ["live-stamp", userId],
		queryFn: () => liveStamp(),
		enabled: Boolean(userId),
		refetchInterval: 1e4,
		refetchIntervalInBackground: false,
		staleTime: 0
	});
	(0, import_react.useEffect)(() => {
		seen.current = null;
	}, [userId]);
	(0, import_react.useEffect)(() => {
		const stamp = stampQuery.data?.stamp;
		if (!stamp) return;
		if (seen.current == null) {
			seen.current = stamp;
			return;
		}
		if (seen.current === stamp) return;
		seen.current = stamp;
		queryClient.invalidateQueries({ queryKey: ["weekends"] });
		queryClient.invalidateQueries({ queryKey: ["my-teams"] });
		queryClient.invalidateQueries({ queryKey: ["notifications"] });
		queryClient.invalidateQueries({ queryKey: ["tournament-responses"] });
		queryClient.invalidateQueries({ queryKey: ["tournament-replies"] });
		queryClient.invalidateQueries({ queryKey: ["event-interest"] });
		queryClient.invalidateQueries({ queryKey: ["weekend"] });
		queryClient.invalidateQueries({ queryKey: ["schedule"] });
	}, [stampQuery.data?.stamp, queryClient]);
}
function useLoginBeat(userId) {
	(0, import_react.useEffect)(() => {
		if (!userId) return;
		let stop = false;
		const beat = () => {
			if (stop) return;
			touchMyLogin().catch(() => {});
		};
		beat();
		const timer = window.setInterval(beat, 6e4);
		return () => {
			stop = true;
			window.clearInterval(timer);
		};
	}, [userId]);
}
function useNavBadge() {
	const { user, profile } = useAppSession();
	const notifQuery = useQuery({
		queryKey: ["notifications", user?.id],
		queryFn: () => listNotifications(),
		enabled: Boolean(user && profile)
	});
	const pendingQuery = useQuery({
		queryKey: ["pending-requests"],
		queryFn: () => listPendingRequests(),
		enabled: Boolean(profile?.homeRole === "admin")
	});
	const pendingTeamsQuery = useQuery({
		queryKey: ["pending-teams"],
		queryFn: () => listPendingTeams(),
		enabled: Boolean(profile?.homeRole === "admin")
	});
	const notes = notifQuery.data ?? [];
	return (profile?.homeRole === "coach" ? notes.filter((item) => coachTournamentBucket(item)) : notes).filter((item) => !item.read).length + (profile?.homeRole === "admin" ? (pendingQuery.data?.length ?? 0) + (pendingTeamsQuery.data?.length ?? 0) : 0);
}
function StickyBack({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "sticky top-[4.75rem] z-20 -mx-4 -mt-5 bg-white px-4 py-2",
		children
	});
}
function AppShell({ homeRole, pendingLabel, wide = false, children }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const badge = useNavBadge();
	const { user, profile } = useAppSession();
	useLiveSync(user?.id);
	useLoginBeat(user?.id);
	const [accountOpen, setAccountOpen] = (0, import_react.useState)(false);
	const [shareOpen, setShareOpen] = (0, import_react.useState)(false);
	const canShare = homeRole === "admin" || homeRole === "coach";
	const fieldPage = pathname === "/" || pathname.startsWith("/notifications");
	const fieldPhoto = pathname.startsWith("/notifications") ? NOTIFICATIONS_FIELD_PHOTO : HOME_FIELD_PHOTO;
	const items = [
		{
			to: "/",
			label: homeRole === "parent" ? "Home" : "Schedule",
			icon: House,
			match: (p) => p === "/"
		},
		{
			to: "/notifications",
			label: "Notifications",
			icon: Bell,
			match: (p) => p.startsWith("/notifications"),
			badge
		},
		...homeRole === "admin" ? [{
			to: "/resources",
			label: "Resources",
			icon: Library,
			match: (p) => p.startsWith("/resources")
		}] : homeRole === "coach" ? [{
			to: "/teams",
			label: "My team",
			icon: Users,
			match: (p) => p.startsWith("/teams")
		}] : []
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("relative mx-auto flex min-h-dvh flex-col text-fg", wide ? "max-w-none" : "max-w-lg", fieldPage ? "bg-transparent" : "bg-white"),
		children: [
			fieldPage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldBackdrop, { src: fieldPhoto }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-10 bg-[#1c1c1c] px-3 py-2.5 text-white",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandMark, { className: "h-14 w-auto" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex shrink-0 items-center gap-2",
						children: [
							profile?.isSuperuser && homeRole === "coach" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachPeek, {}) : null,
							profile?.isSuperuser ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex rounded-full bg-white/10 p-0.5 text-[10px] font-bold uppercase tracking-wide",
								children: ["admin", "coach"].map((view) => {
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => void chooseSuperuserView(view, pathname, navigate, queryClient),
										className: cn("rounded-full px-2 py-1", (view === "coach" ? homeRole === "coach" : homeRole !== "coach") ? "bg-white text-[#1c1c1c]" : "text-white/80"),
										children: view
									}, view);
								})
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80",
								children: pendingLabel ?? ROLE_COPY[homeRole].label
							}),
							canShare ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								"data-tour": homeRole === "coach" ? "header-tools" : void 0,
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": "Share the app",
									onClick: () => setShareOpen(true),
									className: "grid h-8 w-8 place-items-center rounded-full text-white hover:bg-white/10",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, {
										className: "h-4 w-4",
										"aria-hidden": true
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": "Account",
									"aria-expanded": accountOpen,
									onClick: () => setAccountOpen(true),
									className: cn("grid h-8 w-8 place-items-center rounded-full", accountOpen ? "bg-white text-[#1c1c1c]" : "text-white hover:bg-white/10"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
										className: "h-5 w-5",
										strokeWidth: 2.25
									})
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Account",
								"aria-expanded": accountOpen,
								onClick: () => setAccountOpen(true),
								className: cn("grid h-8 w-8 place-items-center rounded-full", accountOpen ? "bg-white text-[#1c1c1c]" : "text-white hover:bg-white/10"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
									className: "h-5 w-5",
									strokeWidth: 2.25
								})
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: cn("relative z-[1] flex-1 px-4 py-5 text-[#222]", fieldPage ? "bg-transparent" : "bg-white", wide ? "pb-24 landscape:pb-3" : "pb-24"),
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				"data-tour": homeRole === "coach" ? "tab-bar" : void 0,
				className: cn("fixed inset-x-0 bottom-0 z-10 border-t border-[#e5e5e5] bg-white", wide && "landscape:hidden"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("mx-auto grid max-w-lg", items.length === 3 ? "grid-cols-3" : "grid-cols-2"),
					children: items.map((item) => {
						const active = item.match(pathname);
						const Icon = item.icon;
						const count = "badge" in item ? item.badge : 0;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							className: cn("relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold", active ? "text-primary" : "text-muted"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
									className: "h-5 w-5",
									strokeWidth: active ? 2.4 : 2
								}),
								item.label,
								count ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute right-1/4 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-fg",
									children: count > 9 ? "9+" : count
								}) : null
							]
						}, item.to);
					})
				})
			}),
			accountOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountCard, {
				onClose: () => setAccountOpen(false),
				email: profile?.email || user?.primaryEmail || "—",
				canEdit: homeRole === "coach" && !profile?.isSuperuser,
				onTour: profile?.isSuperuser ? () => {
					setAccountOpen(false);
					chooseSuperuserView("coach", pathname, navigate, queryClient).then(() => openCoachTour());
				} : void 0,
				onLogins: profile?.isSuperuser ? () => {
					setAccountOpen(false);
					navigate({ to: "/logins" });
				} : void 0
			}) : null,
			shareOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SharePick, {
				onClose: () => setShareOpen(false),
				onPick: (role) => {
					setShareOpen(false);
					shareInvite(role, user?.displayName?.trim() || "a 423Sports director");
				}
			}) : null
		]
	});
}
async function chooseSuperuserView(view, pathname, navigate, queryClient) {
	try {
		if (view === "admin") await setViewCoach({ data: { userId: "" } });
		else {
			const id = rememberedCoach();
			if (id) {
				const result = await setViewCoach({ data: { userId: id } });
				if ("missing" in result && result.missing) rememberCoach("");
			}
		}
	} catch {
		rememberCoach("");
		try {
			await setViewCoach({ data: { userId: "" } });
		} catch {}
	}
	setSuperuserView(view);
	await queryClient.invalidateQueries();
	if (view === "admin" && pathname.startsWith("/teams")) navigate({ to: "/" });
	if (view === "coach" && pathname.startsWith("/resources")) navigate({ to: "/" });
}
function CoachPeek() {
	const queryClient = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const query = useQuery({
		queryKey: ["view-coaches"],
		queryFn: () => listViewCoaches()
	});
	const coaches = query.data?.coaches ?? [];
	const viewing = coaches.find((coach) => coach.userId === query.data?.viewingId) ?? null;
	async function pick(userId) {
		setError(null);
		try {
			rememberCoach(userId);
			await setViewCoach({ data: { userId } });
			await queryClient.invalidateQueries();
			setOpen(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not switch coaches.");
		}
	}
	const list = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-h-[60vh] space-y-2 overflow-y-auto",
		children: [
			query.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Loading coaches…"
			}) : null,
			!query.isPending && coaches.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No coaches yet."
			}) : null,
			coaches.map((coach) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => void pick(coach.userId),
				className: cn("block w-full rounded-md border px-3 py-2 text-left", coach.userId === viewing?.userId ? "border-primary bg-primary/5" : "border-line bg-white"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block font-semibold",
					children: coach.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-xs text-muted",
					children: coach.team || coach.email
				})]
			}, coach.userId)),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-warn",
				children: error
			}) : null
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: () => setOpen(true),
		className: "max-w-[6.5rem] truncate rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white",
		children: viewing?.name ?? "Choose coach"
	}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachPickCard, {
		onClose: () => setOpen(false),
		children: list
	}) : null] });
}
function CoachPickCard({ onClose, children }) {
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[80] flex items-start justify-center bg-scrim p-4 pt-20",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": "Coaches",
			className: "w-full max-w-sm rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
			onClick: (event) => event.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-bold uppercase",
					children: "Coaches"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Close",
					onClick: onClose,
					className: "grid h-11 w-11 place-items-center rounded-md text-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
						className: "h-5 w-5",
						"aria-hidden": true
					})
				})]
			}), children]
		})
	}), document.body);
}
function shareInvite(role, sender) {
	const link = `${window.location.origin}/join?role=${role}`;
	const text = `You have been invited by ${sender} to 423Sports Tournaments as ${role === "coach" ? "a coach" : "an administrator"}. Click the link to open the app and create an account. ${link}`;
	const body = encodeURIComponent(text);
	const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
	window.location.href = ios ? `sms:&body=${body}` : `sms:?body=${body}`;
}
function SharePick({ onClose, onPick }) {
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[80] flex items-center justify-center bg-scrim p-4",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": "Who are you inviting?",
			className: "w-full max-w-sm rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
			onClick: (event) => event.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl font-bold uppercase",
						children: "Invite"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Close",
						onClick: onClose,
						className: "grid h-11 w-11 place-items-center rounded-md text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							className: "h-5 w-5",
							"aria-hidden": true
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Who are you inviting?"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onPick("coach"),
						className: "flex min-h-12 w-full items-center rounded-lg border border-line bg-surface px-4 text-left font-display text-xl font-bold uppercase",
						children: "Coach"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onPick("admin"),
						className: "flex min-h-12 w-full items-center rounded-lg border border-line bg-surface px-4 text-left font-display text-xl font-bold uppercase",
						children: "Admin"
					})]
				})
			]
		})
	}), document.body);
}
function FieldBackdrop({ src }) {
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-hidden": true,
		className: "pointer-events-none fixed inset-0 z-0",
		style: {
			backgroundImage: `linear-gradient(rgb(255 255 255 / 0.72), rgb(255 255 255 / 0.72)), url(${src})`,
			backgroundSize: "cover",
			backgroundPosition: "center"
		}
	}), document.body);
}
function AccountCard({ onClose, email, canEdit, onTour, onLogins }) {
	const accountQuery = useQuery({
		queryKey: ["my-coach-account"],
		queryFn: () => getMyCoachAccount(),
		enabled: canEdit
	});
	const account = accountQuery.data;
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[80] flex items-start justify-center bg-scrim p-4 pt-20",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": "Account",
			className: "max-h-[80dvh] w-full max-w-sm overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
			onClick: (event) => event.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-bold uppercase",
					children: "Account"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Close",
					onClick: onClose,
					className: "grid h-11 w-11 place-items-center rounded-md text-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
						className: "h-5 w-5",
						"aria-hidden": true
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-4",
				children: [
					canEdit ? accountQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Loading your account…"
					}) : account ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountLine, {
							label: "Name",
							value: account.name || "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountLine, {
							label: "Cell phone",
							value: account.phone || "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountLine, {
							label: "Email",
							value: account.email || email
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountLine, {
							label: "Club",
							value: account.club || "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold uppercase tracking-wide text-muted",
							children: "Teams"
						}), account.teams.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-medium",
							children: "—"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-1 space-y-1",
							children: account.teams.map((team) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "font-medium",
								children: [
									team.name,
									" · ",
									team.ageGroup
								]
							}, `${team.name}-${team.ageGroup}`))
						})] })
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountLine, {
						label: "Email",
						value: email
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountLine, {
						label: "Email",
						value: email
					}),
					canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditAccountButton, {}) : null,
					onTour ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onTour,
						className: "w-full rounded-md border border-line px-3 py-2 text-sm font-semibold",
						children: "First login tour"
					}) : null,
					onLogins ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onLogins,
						className: "w-full rounded-md border border-line px-3 py-2 text-sm font-semibold",
						children: "Login history"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "border-t border-line pt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
					})
				]
			})]
		})
	}), document.body);
}
function AccountLine({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs font-semibold uppercase tracking-wide text-muted",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-1 font-medium",
		children: value
	})] });
}
var Route$21 = createFileRoute("/")({ component: Home });
function Home() {
	const { user, isPending, profile, refetchProfile } = useAppSession();
	const navigate = useNavigate();
	const [onboardError, setOnboardError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [coachAsk, setCoachAsk] = (0, import_react.useState)(false);
	const [teamName, setTeamName] = (0, import_react.useState)("");
	const seasonsQuery = useQuery({
		queryKey: ["season-cards"],
		queryFn: () => listSeasonCards(),
		enabled: Boolean(profile?.homeRole === "admin")
	});
	const weekendsQuery = useQuery({
		queryKey: ["weekends"],
		queryFn: () => listWeekends(),
		enabled: Boolean(profile?.homeRole === "admin")
	});
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionSkeleton, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (!profile) {
		async function finish(role, access) {
			setBusy(true);
			setOnboardError(null);
			try {
				await completeOnboarding({ data: {
					role,
					teamName: access?.teamName
				} });
				await refetchProfile();
			} catch (err) {
				setOnboardError(err instanceof Error ? err.message : "Could not save your role.");
				setBusy(false);
			}
		}
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto flex min-h-dvh max-w-md flex-col px-4 py-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-8",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLockup, { subtitle: "One more step" })
				}),
				busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionSkeleton, {}) : coachAsk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachAccessPrompt, {
					teamName,
					onTeamName: setTeamName,
					onContinue: (access) => void finish("coach", access),
					onBack: () => setCoachAsk(false)
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RolePicker, {
					title: "What is your role?",
					subtitle: "This sets the home screen you see.",
					onPick: (role) => {
						if (role === "coach") {
							setCoachAsk(true);
							return;
						}
						finish(role);
					}
				}),
				onboardError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 rounded-md bg-warn-bg px-3 py-2 text-sm",
					role: "alert",
					children: onboardError
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					className: "mt-6",
					onClick: () => void navigate({ to: "/login" }),
					children: "Use a different account"
				})
			]
		});
	}
	const pendingLabel = profile.requestStatus === "pending" && profile.homeRole !== "coach" && profile.homeRole !== "admin" ? `${profile.requestedRole === "admin" ? "Admin" : "Coach"} · waiting` : null;
	let body;
	if (profile.homeRole === "admin") body = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminHome, {
		weekends: weekendsQuery.data ?? [],
		seasons: seasonsQuery.data?.cards ?? [],
		rollover: seasonsQuery.data?.rollover ?? null
	});
	else if (profile.homeRole === "coach") body = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachHome, {}), profile.isSuperuser ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachLoginNotices, {})] });
	else if (profile.homeRole === "athlete") body = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AthleteHome, {});
	else if (profile.requestStatus === "pending") body = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PendingAsParentHome, { profile });
	else body = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParentHome, { profile });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		homeRole: profile.homeRole,
		pendingLabel,
		children: body
	});
}
var RETURN_KEY = "pbi-return";
function eventSearch(value) {
	if (typeof value === "number" && Number.isFinite(value)) return String(value);
	if (typeof value === "string") return value.slice(0, 200);
	if (Array.isArray(value)) return value.map((item) => typeof item === "number" || typeof item === "string" ? String(item) : "").filter(Boolean).join(",").slice(0, 200);
	return "";
}
var Route$20 = createFileRoute("/interest")({
	validateSearch: (search) => ({ e: eventSearch(search.e) }),
	component: InterestPage
});
function InterestPage() {
	const search = Route$20.useSearch();
	const { user, isPending, profile } = useAppSession();
	const ids = search.e.split(",").map((part) => Number(part)).filter((id) => Number.isInteger(id) && id > 0);
	const interest = useQuery({
		queryKey: ["event-age-interest", search.e],
		queryFn: () => listMyEventInterest({ data: { weekendIds: ids } }),
		enabled: Boolean(user) && ids.length > 0
	});
	(0, import_react.useEffect)(() => {
		if (isPending || user || !search.e) return;
		sessionStorage.setItem(RETURN_KEY, `/interest?e=${search.e}`);
	}, [
		isPending,
		user,
		search.e
	]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionSkeleton, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/login" });
	if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		homeRole: profile.homeRole,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-4xl font-bold uppercase",
			children: "Your weekends"
		}), ids.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm",
			children: "That link is missing the weekend."
		}) : interest.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm text-muted",
			children: "Loading…"
		}) : interest.error instanceof Error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm",
			children: interest.error.message
		}) : interest.data && interest.data.events.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm",
			children: "That tournament is no longer on the schedule."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 space-y-6",
			children: interest.data?.events.map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-lg border border-line bg-surface p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl font-bold uppercase leading-tight",
						children: event.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: formatWeekendRange(event.startDate, event.endDate)
					}),
					event.teamFeeCents != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm font-semibold",
						children: [formatTeamFee(event.teamFeeCents), " per team"]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventAgeChoices, {
						event,
						ages: interest.data?.ages ?? []
					})
				]
			}, event.id))
		})]
	});
}
/** Same key the auth client uses for live-preview bearer tokens. */
var BEARER_KEY = "grok-auth.bearer-token";
function decodeToken(value) {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}
function asToken(value) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	return decodeToken(trimmed);
}
function tokenFromPayload(payload) {
	if (!payload || typeof payload !== "object") return null;
	const rec = payload;
	return asToken(rec.token) ?? asToken(rec.session?.token) ?? asToken(rec.data?.token) ?? asToken(rec.data?.session?.token);
}
/**
* Prefer the signed `set-auth-token` header (cookie value with HMAC) over the
* unsigned JSON `token` field. Either works with the bearer plugin, but the
* header matches what the OAuth popup stores.
*/
function extractSessionToken(payload, headerToken) {
	const header = asToken(headerToken);
	const body = tokenFromPayload(payload);
	if (header?.includes(".")) return header;
	if (body?.includes(".")) return body;
	return header ?? body;
}
/**
* Email sign-up/sign-in returns a session token. In the live preview iframe
* cookies are partitioned, so we stash the token the same way OAuth popup does.
*/
function rememberSessionToken(payload, headerToken) {
	const token = extractSessionToken(payload, headerToken);
	if (!token) throw new Error("Could not stay signed in. Try again.");
	if (typeof window === "undefined") return token;
	try {
		window.sessionStorage.setItem(BEARER_KEY, token);
		if (window.sessionStorage.getItem("grok-auth.bearer-token") !== token) throw new Error("This browser blocked keeping you signed in. Try again.");
	} catch (err) {
		if (err instanceof Error && err.message.startsWith("This browser blocked")) throw err;
		throw new Error("This browser blocked keeping you signed in. Try again.");
	}
	return token;
}
/** Full load so Better Auth's session store boots with the bearer already saved. */
function enterApp() {
	if (typeof window === "undefined") return;
	const next = sessionStorage.getItem("pbi-return");
	sessionStorage.removeItem("pbi-return");
	if (next && next.startsWith("/interest?e=")) {
		window.location.replace(next);
		return;
	}
	window.location.replace("/");
}
function captureAuthResponse(ctx) {
	rememberSessionToken(ctx.data, ctx.response.headers.get("set-auth-token"));
}
async function confirmSession() {
	const session = await authClient.getSession();
	if (session.error || !session.data?.user) throw new Error("Could not stay signed in. Try again.");
}
function throwIfError(result) {
	if (result.error) throw new Error(plainAuthError(result.error));
}
async function signInWithEmail(email, password) {
	let captured = false;
	const result = await authClient.signIn.email({
		email,
		password,
		fetchOptions: { onSuccess(ctx) {
			captureAuthResponse(ctx);
			captured = true;
		} }
	});
	throwIfError(result);
	if (!captured) rememberSessionToken(result.data);
	await confirmSession();
}
async function signUpWithEmail(email, password, name) {
	let captured = false;
	const result = await authClient.signUp.email({
		email,
		password,
		name,
		fetchOptions: { onSuccess(ctx) {
			captureAuthResponse(ctx);
			captured = true;
		} }
	});
	throwIfError(result);
	if (!captured) rememberSessionToken(result.data);
	await confirmSession();
}
var Route$19 = createFileRoute("/join")({
	validateSearch: (search) => ({
		role: typeof search.role === "string" ? search.role : void 0,
		invite: typeof search.invite === "number" ? search.invite : typeof search.invite === "string" && /^\d+$/.test(search.invite) ? Number(search.invite) : void 0
	}),
	component: Join
});
function Join() {
	const navigate = useNavigate();
	const { user, isPending, profile } = useAppSession();
	const { role: roleParam, invite: inviteParam } = Route$19.useSearch();
	const chosenRole = roleParam === "coach" || roleParam === "admin" ? roleParam : null;
	const [email, setEmail] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [club, setClub] = (0, import_react.useState)("");
	const [teams, setTeams] = (0, import_react.useState)([{
		name: "",
		ageGroup: ""
	}]);
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function handleCreate() {
		if (!chosenRole || busy) return;
		if (chosenRole === "coach" && !name.trim()) {
			setError("Enter your name.");
			return;
		}
		if (chosenRole === "coach" && teams.some((team) => !team.name.trim() || !team.ageGroup)) {
			setError("Enter a team name and an age.");
			return;
		}
		const emailIssue = clientEmailIssue(email);
		if (emailIssue) {
			setError(emailIssue);
			return;
		}
		if (phone.replace(/\D/g, "").length < 10) {
			setError("Enter a cell phone.");
			return;
		}
		const passIssue = clientPasswordIssue(password);
		if (passIssue) {
			setError(passIssue);
			return;
		}
		setBusy(true);
		setError(null);
		const normalized = email.trim().toLowerCase();
		try {
			await checkSignupOpen({ data: {
				email: normalized,
				phone
			} });
			await signUpWithEmail(normalized, password, chosenRole === "coach" ? name.trim() : ROLE_COPY[chosenRole].label);
			await completeOnboarding({ data: {
				role: chosenRole,
				teams: chosenRole === "coach" ? teams : void 0,
				club: chosenRole === "coach" ? club : void 0,
				inviteId: chosenRole === "coach" ? inviteParam : void 0,
				phone
			} });
			enterApp();
		} catch (err) {
			setError(plainAuthError(err));
			setBusy(false);
		}
	}
	if (isPending && !busy) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionSkeleton, {});
	if (user && profile && !busy) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	if (!chosenRole) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-white px-4 py-10 text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLockup, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RolePicker, {
				title: "What is your role?",
				subtitle: "Pick one to create an account.",
				onPick: (role) => {
					navigate({
						to: "/join",
						search: {
							role,
							invite: inviteParam
						}
					});
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-8 text-center text-sm text-muted",
				children: [
					"Already have an account?",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/login",
						className: "font-semibold text-primary",
						children: "Sign in"
					})
				]
			})
		]
	});
	const copy = ROLE_COPY[chosenRole];
	if (chosenRole === "coach") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-white px-4 py-10 text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLockup, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachSignupForm, {
				name,
				phone,
				email,
				club,
				password,
				teams,
				busy,
				error,
				onName: setName,
				onPhone: setPhone,
				onEmail: setEmail,
				onClub: setClub,
				onPassword: setPassword,
				onTeams: setTeams,
				onSubmit: () => void handleCreate()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-center text-sm text-muted",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/join",
					search: { role: void 0 },
					className: "font-semibold text-primary",
					children: "Change role"
				})
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLockup, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-sm text-muted",
					children: [
						"Create a ",
						copy.label,
						" account"
					]
				})]
			}),
			chosenRole === "admin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mb-4 rounded-md bg-warn-bg px-3 py-2 text-sm",
				children: [copy.label, " tools stay off until an Admin approves. You’ll use Parent tools until then."]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				noValidate: true,
				onSubmit: (e) => {
					e.preventDefault();
					e.stopPropagation();
					handleCreate();
				},
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "phone",
							children: "Cell phone"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "phone",
							type: "tel",
							inputMode: "tel",
							autoComplete: "tel",
							value: formatPhoneInput(phone),
							onChange: (e) => setPhone(formatPhoneInput(e.target.value)),
							placeholder: "(555) 555-0100"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "email",
							children: "Email"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "email",
							type: "text",
							inputMode: "email",
							autoCapitalize: "none",
							autoCorrect: "off",
							autoComplete: "username",
							value: email,
							onChange: (e) => setEmail(e.target.value),
							placeholder: "name@email.com"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "password",
								children: "Password"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "password",
								type: "password",
								autoComplete: "new-password",
								value: password,
								onChange: (e) => setPassword(e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: "At least 8 characters."
							})
						]
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-md bg-warn-bg px-3 py-2 text-sm font-medium",
						role: "alert",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						size: "lg",
						disabled: busy,
						children: busy ? "Creating account…" : "Create account"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-6 text-center text-sm text-muted",
				children: [
					"Already have an account?",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/login",
						className: "font-semibold text-primary",
						children: "Sign in"
					}),
					" · ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/join",
						search: { role: void 0 },
						className: "font-semibold text-primary",
						children: "Change role"
					})
				]
			})
		]
	});
}
var Route$18 = createFileRoute("/login")({ component: Login });
function Login() {
	const { user, isPending } = useCurrentUserState();
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function handleSignIn() {
		if (busy) return;
		const emailIssue = clientEmailIssue(email);
		if (emailIssue) {
			setError(emailIssue);
			return;
		}
		const passIssue = clientPasswordIssue(password);
		if (passIssue) {
			setError(passIssue);
			return;
		}
		setBusy(true);
		setError(null);
		try {
			await ensureBootAccounts();
			await signInWithEmail(email.trim().toLowerCase(), password);
			armCoachNotices();
			enterApp();
		} catch (err) {
			setError(plainAuthError(err));
			setBusy(false);
		}
	}
	if (isPending && !busy) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionSkeleton, {});
	if (user && !busy) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "site-splash mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/logo.png",
					alt: "423Sports",
					className: "mx-auto block w-full max-w-[19rem]"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 text-sm text-white/60",
					children: "Email and password"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				noValidate: true,
				onSubmit: (e) => {
					e.preventDefault();
					e.stopPropagation();
					handleSignIn();
				},
				className: "space-y-4 [&_label]:text-white",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "email",
							children: "Email"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "email",
							type: "text",
							inputMode: "email",
							autoCapitalize: "none",
							autoCorrect: "off",
							autoComplete: "username",
							value: email,
							onChange: (e) => setEmail(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "password",
							children: "Password"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "password",
							type: "password",
							autoComplete: "current-password",
							value: password,
							onChange: (e) => setPassword(e.target.value)
						})]
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-md border border-[#6b5420] bg-[#ffe08a] px-3 py-2 text-sm font-semibold text-[#1a1a1a]",
						role: "alert",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "site-cta w-full",
						size: "lg",
						disabled: busy,
						children: busy ? "Signing in…" : "Sign in"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-6 text-center text-sm text-white/70",
				children: [
					"New here?",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/join",
						className: "font-semibold text-white",
						children: "Create an account"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-center text-xs text-white/50",
				children: "The director Admin account is already set up. Sign in — don’t create it again."
			})
		]
	});
}
var Route$17 = createFileRoute("/logins")({ component: LoginHistoryPage });
function LoginHistoryPage() {
	const { user, isPending, profile } = useAppSession();
	const allowed = Boolean(profile?.isSuperuser);
	const history = useQuery({
		queryKey: ["login-history"],
		queryFn: () => listLoginHistory(),
		enabled: allowed,
		refetchInterval: 3e4
	});
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionSkeleton, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (!profile || !allowed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		homeRole: profile?.homeRole ?? "admin",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Only the superuser can see login history."
		})
	});
	const rows = history.data ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		homeRole: profile.homeRole,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StickyBack, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "text-sm font-semibold text-muted",
				children: "← Account"
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl font-bold uppercase leading-none",
				children: "Login history"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Who signed in, and how long they stayed."
			}),
			history.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-sm text-muted",
				children: "Loading…"
			}) : null,
			history.error instanceof Error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-sm",
				children: history.error.message
			}) : null,
			!history.isPending && rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 rounded-lg border border-dashed border-line bg-surface px-4 py-4 text-sm text-muted",
				children: "No sign-ins yet."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-5 space-y-2",
				children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-lg border border-line bg-surface px-3 py-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VisitRow, { row })
				}, row.id))
			})
		]
	});
}
function VisitRow({ row }) {
	const started = new Date(row.startedAt);
	const when = Number.isNaN(started.getTime()) ? "" : started.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block font-semibold",
			children: row.name
		}),
		row.email && row.email !== row.name ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-0.5 block text-sm text-muted",
			children: row.email
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "mt-1 block text-sm",
			children: [
				row.role,
				" · ",
				when
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-1 block text-sm font-semibold",
			children: row.stillIn ? `Still in · ${stayLabel(row.minutes)}` : stayLabel(row.minutes)
		})
	] });
}
function stayLabel(minutes) {
	if (minutes < 1) return "Less than a minute";
	if (minutes < 60) return minutes === 1 ? "1 minute" : `${minutes} minutes`;
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	const hourLabel = hours === 1 ? "1 hour" : `${hours} hours`;
	if (rest === 0) return hourLabel;
	return `${hourLabel} ${rest === 1 ? "1 minute" : `${rest} minutes`}`;
}
var Route$16 = createFileRoute("/notifications")({ component: NotificationsPage });
function NotificationsPage() {
	const { user, isPending, profile } = useAppSession();
	const queryClient = useQueryClient();
	const isAdmin = profile?.homeRole === "admin";
	const notifQuery = useQuery({
		queryKey: ["notifications", user?.id],
		queryFn: () => listNotifications(),
		enabled: Boolean(user && profile)
	});
	const isCoach = profile?.homeRole === "coach";
	const teamsQuery = useQuery({
		queryKey: ["my-teams", user?.id],
		queryFn: () => listMyCoachTeams(),
		enabled: Boolean(user && isCoach)
	});
	const responseQuery = useQuery({
		queryKey: ["tournament-responses", user?.id],
		queryFn: () => listMyTournamentResponses(),
		enabled: Boolean(user && isCoach)
	});
	const pendingQuery = useQuery({
		queryKey: ["pending-requests"],
		queryFn: () => listPendingRequests(),
		enabled: Boolean(isAdmin)
	});
	const pendingTeamsQuery = useQuery({
		queryKey: ["pending-teams"],
		queryFn: () => listPendingTeams(),
		enabled: Boolean(isAdmin)
	});
	const reviewCoach = useMutation({
		mutationFn: (input) => reviewNewCoach({ data: input }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["notifications"] });
			await queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
			await queryClient.invalidateQueries({ queryKey: ["directory"] });
			await queryClient.invalidateQueries({ queryKey: ["coach-directory"] });
		}
	});
	const reviewMut = useMutation({
		mutationFn: (input) => reviewRequest({ data: input }),
		onMutate: async (input) => {
			await queryClient.cancelQueries({ queryKey: ["pending-requests"] });
			await queryClient.cancelQueries({ queryKey: ["directory"] });
			const previousPending = queryClient.getQueryData(["pending-requests"]);
			const previousDirectory = queryClient.getQueryData(["directory"]);
			const target = previousPending?.find((req) => req.id === input.id);
			queryClient.setQueryData(["pending-requests"], (current) => (current ?? []).filter((req) => req.id !== input.id));
			if (target) queryClient.setQueryData(["directory"], (current) => (current ?? []).map((row) => row.userId === target.userId ? {
				...row,
				homeRole: input.action === "approve" ? target.requestedRole : "parent",
				requestStatus: input.action === "approve" ? "approved" : "denied"
			} : row));
			return {
				previousPending,
				previousDirectory
			};
		},
		onError: (_err, _input, ctx) => {
			if (ctx?.previousPending) queryClient.setQueryData(["pending-requests"], ctx.previousPending);
			if (ctx?.previousDirectory) queryClient.setQueryData(["directory"], ctx.previousDirectory);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
			queryClient.invalidateQueries({ queryKey: ["directory"] });
		}
	});
	const reviewTeamMut = useMutation({
		mutationFn: (input) => reviewTeam({ data: input }),
		onMutate: async (input) => {
			await queryClient.cancelQueries({ queryKey: ["pending-teams"] });
			const previous = queryClient.getQueryData(["pending-teams"]);
			queryClient.setQueryData(["pending-teams"], (current) => (current ?? []).filter((team) => team.id !== input.id));
			return { previous };
		},
		onError: (_err, _input, ctx) => {
			if (ctx?.previous) queryClient.setQueryData(["pending-teams"], ctx.previous);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["pending-teams"] });
			queryClient.invalidateQueries({ queryKey: ["weekends"] });
		}
	});
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionSkeleton, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	const items = notifQuery.data ?? [];
	const groups = isCoach ? coachNoticeGroups(items) : noticeGroups(items);
	const pendingLabel = profile.requestStatus === "pending" && profile.homeRole !== "coach" && profile.homeRole !== "admin" ? `${profile.requestedRole === "admin" ? "Admin" : "Coach"} · waiting` : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		homeRole: profile.homeRole,
		pendingLabel,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			"data-tour": isCoach ? "notifications" : void 0,
			className: "flex min-h-[calc(100dvh-11rem)] flex-col",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl font-bold uppercase",
					children: "Notifications"
				}),
				!isCoach && profile.requestStatus === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 rounded-md bg-warn-bg px-4 py-3 text-sm font-medium",
					children: [
						"Your ",
						profile.requestedRole === "admin" ? "Admin" : "Coach",
						" access is waiting for Admin approval."
					]
				}) : null,
				!isCoach && profile.requestStatus === "approved" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 rounded-md bg-ok-bg px-4 py-3 text-sm font-medium",
					children: [
						"Your ",
						profile.requestedRole === "admin" ? "Admin" : "Coach",
						" access was approved."
					]
				}) : null,
				!isCoach && profile.requestStatus === "denied" && profile.requestedRole === "coach" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachDeniedCard, { profile })
				}) : profile.requestStatus === "denied" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 rounded-md bg-warn-bg px-4 py-3 text-sm font-medium",
					children: [
						"Your ",
						profile.requestedRole === "admin" ? "Admin" : "Coach",
						" access was denied. You still have Parent tools."
					]
				}) : null,
				reviewMut.error || reviewTeamMut.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm",
					children: reviewMut.error instanceof Error ? reviewMut.error.message : reviewTeamMut.error instanceof Error ? reviewTeamMut.error.message : "Could not update that request."
				}) : null,
				isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminInbox, {
					pending: pendingQuery.data ?? [],
					pendingTeams: pendingTeamsQuery.data ?? [],
					busyId: reviewMut.isPending ? reviewMut.variables?.id ?? null : null,
					busyTeamId: reviewTeamMut.isPending ? reviewTeamMut.variables?.id ?? null : null,
					onReview: (id, action) => reviewMut.mutate({
						id,
						action
					}),
					onReviewTeam: (id, action) => reviewTeamMut.mutate({
						id,
						action
					}),
					canManageAdmins: Boolean(profile.canManageAdmins)
				}) : null,
				groups.length === 0 && !isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-5 rounded-lg border border-line bg-surface px-4 py-5 text-sm text-muted",
					children: "You’re all caught up."
				}) : groups.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 space-y-6",
					children: groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoticeFold, {
						label: group.label,
						count: group.items.filter((item) => !item.read).length,
						onOpen: () => {
							if (!user || group.label === "New tournaments" || group.label === "Available Tournaments" || group.label === "New coaches") return;
							const ids = group.items.filter((item) => !item.read).map((item) => item.id);
							if (ids.length === 0) return;
							queryClient.setQueryData(["notifications", user.id], (current) => (current ?? []).map((item) => ids.includes(item.id) ? {
								...item,
								read: true
							} : item));
							markNotificationsRead({ data: { ids } });
						},
						children: group.items.map((n) => group.label === "New tournaments" || group.label === "Available Tournaments" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvailableTournament, {
							item: n,
							teams: teamsQuery.data ?? [],
							choice: (responseQuery.data ?? []).find((row) => row.weekendId === n.weekendId)?.choice ?? null
						}, n.id) : n.kind === "coach-signup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachSignupNotice, {
							item: n,
							busy: reviewCoach.isPending,
							onKeep: (userId) => reviewCoach.mutate({
								userId,
								action: "keep"
							}),
							onRemove: (userId) => reviewCoach.mutate({
								userId,
								action: "remove"
							})
						}, n.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-lg border border-line bg-surface px-4 py-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: n.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: n.body
							})]
						}, n.id))
					}, group.label))
				}) : null,
				null
			]
		})
	});
}
function NoticeFold({ label, count, onOpen, children }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => setOpen((value) => {
			if (!value) onOpen();
			return !value;
		}),
		className: "flex w-full items-center justify-between gap-3 text-left",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-2xl font-bold uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-7 min-w-7 place-items-center rounded-full bg-fg px-2 text-sm font-bold text-white",
				children: count
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
				className: `h-5 w-5 text-muted ${open ? "rotate-180" : ""}`,
				"aria-hidden": true
			})]
		})]
	}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-3 space-y-3",
		children
	}) : null] });
}
function AvailableTournament({ item, teams, choice }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [picked, setPicked] = (0, import_react.useState)(null);
	const [noteOpen, setNoteOpen] = (0, import_react.useState)(false);
	const [confirm, setConfirm] = (0, import_react.useState)(null);
	const save = useMutation({
		mutationFn: (next) => respondToTournament({ data: {
			weekendId: item.weekendId ?? 0,
			choice: next
		} }),
		onSuccess: async (result) => {
			setPicked(result.choice);
			setConfirm(null);
			setOpen(false);
			if (result.choice === "interested") setNoteOpen(true);
			await queryClient.invalidateQueries({ queryKey: ["notifications"] });
			await queryClient.invalidateQueries({ queryKey: ["tournament-responses"] });
			await queryClient.invalidateQueries({ queryKey: ["my-interest"] });
			await queryClient.invalidateQueries({ queryKey: ["weekends"] });
			await queryClient.invalidateQueries({ queryKey: ["my-schedule"] });
		}
	});
	const pending = save.isPending ? save.variables : null;
	const current = picked ?? choice;
	const selected = pending ?? current;
	const options = [
		{
			choice: "interested",
			label: "Register"
		},
		{
			choice: "maybe",
			label: "Not sure yet"
		},
		{
			choice: "no",
			label: "Maybe next time"
		}
	];
	const choices = options.filter((option) => option.choice !== current);
	function choose(next) {
		if (current && next !== current) {
			setConfirm(next);
			return;
		}
		save.mutate(next);
	}
	const selectedLabel = options.find((option) => option.choice === selected)?.label ?? "Undecided";
	const expanded = open;
	const undecided = selected == null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: `rounded-lg border border-line px-4 py-4 ${undecided ? "bg-[#f5c518] text-[#1c1c1c]" : "bg-surface"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setOpen((value) => !value),
				className: "flex w-full items-center justify-between gap-3 text-left",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block font-semibold",
						children: item.title
					}), !expanded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-2 block text-sm font-bold uppercase tracking-wide",
						children: selectedLabel
					}) : null]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
					className: `h-5 w-5 shrink-0 ${expanded ? "rotate-180" : ""} ${undecided ? "text-[#1c1c1c]" : "text-muted"}`,
					"aria-hidden": true
				})]
			}),
			expanded ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: `mt-1 text-sm ${undecided ? "text-[#1c1c1c]/80" : "text-muted"}`,
					children: item.body
				}),
				item.weekendId == null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm",
					children: "That tournament is no longer on the schedule."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 space-y-2",
					children: choices.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						className: "w-full",
						variant: "outline",
						disabled: save.isPending || item.weekendId == null || option.choice === "interested" && teams.length === 0,
						onClick: () => choose(option.choice),
						children: pending === option.choice ? "Saving…" : option.label
					}, option.choice))
				}),
				save.error instanceof Error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm",
					children: save.error.message
				}) : null
			] }) : null,
			noteOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InterestNote, { onClose: () => setNoteOpen(false) }) : null,
			confirm ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-[80] flex items-end justify-center bg-scrim p-4 sm:items-center",
				onClick: () => setConfirm(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-modal": "true",
					"aria-label": "Change your answer",
					className: "w-full max-w-md rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
					onClick: (event) => event.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl font-bold uppercase",
							children: "Are you sure?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm",
							children: [
								"You already marked ",
								options.find((option) => option.choice === current)?.label,
								". Change it to",
								" ",
								options.find((option) => option.choice === confirm)?.label,
								"?"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							className: "mt-4 w-full",
							disabled: save.isPending,
							onClick: () => save.mutate(confirm),
							children: save.isPending ? "Saving…" : "Yes, change it"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							className: "mt-2 w-full",
							disabled: save.isPending,
							onClick: () => setConfirm(null),
							children: "Cancel"
						})
					]
				})
			}) : null
		]
	});
}
function InterestNote({ onClose }) {
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[80] flex items-end justify-center bg-scrim p-4 sm:items-center",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": "Registered",
			className: "w-full max-w-md rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
			onClick: (event) => event.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-bold uppercase",
					children: "Registered"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm",
					children: "Your team is on this tournament. The director can take you off."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					className: "mt-4 w-full",
					onClick: onClose,
					children: "Got it"
				})
			]
		})
	}), document.body);
}
function CoachSignupNotice({ item, busy, onKeep, onRemove }) {
	const userId = item.refKey?.startsWith("coach-signup-") ? item.refKey.slice(13) : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "space-y-3 rounded-lg border border-line bg-surface px-4 py-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-semibold",
			children: item.title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm",
			children: item.body
		})] }), userId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-2 gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "pine",
				disabled: busy,
				onClick: () => onKeep(userId),
				children: "Keep access"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "outline",
				disabled: busy,
				onClick: () => onRemove(userId),
				children: "Remove account"
			})]
		}) : null]
	});
}
function coachNoticeGroups(items) {
	return [{
		bucket: "new",
		label: "New tournaments"
	}, {
		bucket: "change",
		label: "Tournament changes"
	}].map((group) => ({
		label: group.label,
		items: items.filter((item) => coachTournamentBucket(item) === group.bucket)
	})).filter((group) => group.items.length > 0);
}
function noticeGroup(item) {
	const title = item.title.toLowerCase();
	const body = item.body.toLowerCase();
	const kind = item.kind.toLowerCase();
	if (kind === "coach-signup" || title.includes("new coach account")) return "New coaches";
	if (kind === "available" || body.includes("if your team is interested")) return "Available Tournaments";
	if (kind.startsWith("finalize") || title.includes("finish a tournament")) return "To finalize";
	if (title.includes("schedule") || title.includes("taken off") || title.includes("on the schedule")) return "Schedule";
	if (title.includes("team") || title.includes("you're in")) return "Teams";
	if (title.includes("weather") || title.includes("rain") || title.includes("lockout") || title.includes("seed")) return "Game day";
	if (title.includes("access")) return "Access";
	return "Updates";
}
function noticeGroups(items) {
	return [
		"New coaches",
		"Available Tournaments",
		"To finalize",
		"Schedule",
		"Teams",
		"Game day",
		"Access",
		"Updates"
	].map((label) => ({
		label,
		items: items.filter((item) => noticeGroup(item) === label)
	})).filter((group) => group.items.length > 0);
}
function parkFeeLine(flags) {
	if (!flags.entranceFee) return "";
	const price = flags.entrancePrice ? `$${flags.entrancePrice}` : "Entrance fee";
	if (!flags.ageDiscount) return price === "Entrance fee" ? price : `Gate ${price}`;
	const ages = flags.discountAges.join(", ");
	const discount = flags.discountPrice ? `$${flags.discountPrice}` : "discount";
	return ages ? `Gate ${price} · ${ages} ${discount}` : `Gate ${price} · age discount ${discount}`;
}
function parkSummary(flags) {
	const on = PARK_AMENITIES.filter(([key]) => flags[key]).map(([, label]) => label);
	return [parkFeeLine(flags), ...on].filter(Boolean).join(" · ");
}
function ParkOptions({ idPrefix, flags, onChange }) {
	function toggleAmenity(key) {
		onChange({
			...flags,
			[key]: !flags[key]
		});
	}
	function toggleAge(age) {
		const discountAges = flags.discountAges.includes(age) ? flags.discountAges.filter((row) => row !== age) : [...flags.discountAges, age];
		onChange({
			...flags,
			discountAges
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-semibold",
				children: "At this park"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-2",
				children: PARK_AMENITIES.map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-pressed": flags[key],
					onClick: () => toggleAmenity(key),
					className: flags[key] ? "h-11 rounded-md bg-primary px-2 text-sm font-bold text-primary-fg" : "h-11 rounded-md border border-line bg-bg px-2 text-sm font-semibold",
					children: label
				}, key))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				"aria-pressed": flags.entranceFee,
				onClick: () => onChange({
					...flags,
					entranceFee: !flags.entranceFee
				}),
				className: flags.entranceFee ? "flex h-11 w-full items-center justify-between rounded-md bg-primary px-3 text-sm font-bold text-primary-fg" : "flex h-11 w-full items-center justify-between rounded-md border border-line bg-bg px-3 text-sm font-semibold",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Entrance fee" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-bold uppercase",
					children: flags.entranceFee ? "Yes" : "No"
				})]
			}),
			flags.entranceFee ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 rounded-md border border-line bg-bg p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: `gate-${idPrefix}`,
							children: "Gate price"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: `gate-${idPrefix}`,
							inputMode: "decimal",
							value: flags.entrancePrice,
							onChange: (event) => onChange({
								...flags,
								entrancePrice: event.target.value
							}),
							placeholder: "8",
							maxLength: 6
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						"aria-pressed": flags.ageDiscount,
						onClick: () => onChange({
							...flags,
							ageDiscount: !flags.ageDiscount
						}),
						className: flags.ageDiscount ? "flex h-11 w-full items-center justify-between rounded-md bg-primary px-3 text-sm font-bold text-primary-fg" : "flex h-11 w-full items-center justify-between rounded-md border border-line bg-surface px-3 text-sm font-semibold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Discount for certain ages" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-bold uppercase",
							children: flags.ageDiscount ? "Yes" : "No"
						})]
					}),
					flags.ageDiscount ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-5 gap-1.5",
							children: AGE_GROUPS.map((age) => {
								const on = flags.discountAges.includes(age);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": on,
									onClick: () => toggleAge(age),
									className: on ? "h-9 rounded-md bg-primary text-xs font-bold text-primary-fg" : "h-9 rounded-md border border-line bg-surface text-xs font-semibold",
									children: age
								}, age);
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: `discount-${idPrefix}`,
								children: "Those ages pay"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: `discount-${idPrefix}`,
								inputMode: "decimal",
								value: flags.discountPrice,
								onChange: (event) => onChange({
									...flags,
									discountPrice: event.target.value
								}),
								placeholder: "5",
								maxLength: 6
							})]
						})]
					}) : null
				]
			}) : null
		]
	});
}
function ParkSaveChoice({ busy, onTournamentOnly, onUpdateResource }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Save these details for this tournament only, or update the saved park too?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				className: "w-full",
				disabled: busy,
				onClick: onTournamentOnly,
				children: "This tournament only"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "outline",
				className: "w-full",
				disabled: busy,
				onClick: onUpdateResource,
				children: "Update the saved park"
			})
		]
	});
}
var Route$15 = createFileRoute("/resources")({ component: ResourcesPage });
function flagsFrom$1(park) {
	return {
		chairs: park.chairs,
		canopies: park.canopies,
		concessions: park.concessions,
		restrooms: park.restrooms,
		lights: park.lights,
		bleachers: park.bleachers,
		entranceFee: park.entranceFee,
		entrancePrice: park.entrancePrice,
		ageDiscount: park.ageDiscount,
		discountAges: park.discountAges,
		discountPrice: park.discountPrice
	};
}
function ResourcesPage() {
	const { user, isPending, profile } = useAppSession();
	const queryClient = useQueryClient();
	const parksQuery = useQuery({
		queryKey: ["known-parks"],
		queryFn: () => listKnownParks(),
		enabled: Boolean(profile?.homeRole === "admin")
	});
	const usersQuery = useQuery({
		queryKey: ["directory"],
		queryFn: () => listDirectory(),
		enabled: Boolean(profile?.homeRole === "admin")
	});
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [addingField, setAddingField] = (0, import_react.useState)(false);
	const [open, setOpen] = (0, import_react.useState)(null);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionSkeleton, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (!profile || profile.homeRole !== "admin") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	const parks = parksQuery.data ?? [];
	const admins = (usersQuery.data ?? []).filter((person) => person.homeRole === "admin");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		homeRole: profile.homeRole,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-[calc(100dvh-11rem)] flex-col",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl font-bold uppercase",
					children: "Resources"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid grid-cols-2 gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResourceButton, {
							label: "Coaches",
							onClick: () => setOpen("coaches")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResourceButton, {
							label: "Staff",
							onClick: () => setOpen("staff")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResourceButton, {
							label: "Accounts",
							onClick: () => setOpen("accounts")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResourceButton, {
							label: "Fields",
							onClick: () => setOpen("fields")
						})
					]
				}),
				open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ResourceSheet, {
					title: sheetTitle(open),
					onClose: () => {
						setOpen(null);
						setEditingId(null);
						setAddingField(false);
					},
					children: [
						open === "coaches" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachInvites, {}) : null,
						open === "staff" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaffDirectory, {}) : null,
						open === "accounts" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountDirectory, {
							people: admins,
							pending: usersQuery.isPending,
							canManage: Boolean(profile.canManageAdmins),
							canGrant: Boolean(profile.canGrantSuperuser),
							selfId: profile.userId
						}) : null,
						open === "fields" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									className: "h-10 px-4 text-sm",
									onClick: () => setAddingField(true),
									children: "Add field"
								}),
								parksQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: "Loading fields…"
								}) : parksQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: "Could not load fields. Close this and open it again."
								}) : parks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: "No fields saved yet."
								}) : parks.map((park) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParkCard, {
									park,
									editing: editingId === park.id,
									onEdit: () => setEditingId(park.id),
									onCancel: () => setEditingId(null),
									onSaved: (next) => {
										queryClient.setQueryData(["known-parks"], (current) => (current ?? []).map((row) => row.id === next.id ? next : row));
										setEditingId(null);
									},
									onRemoved: (parkId) => {
										queryClient.setQueryData(["known-parks"], (current) => (current ?? []).filter((row) => row.id !== parkId));
										setEditingId(null);
									}
								}, park.id)),
								addingField ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldForm, {
									onClose: () => setAddingField(false),
									onSaved: (park) => {
										queryClient.setQueryData(["known-parks"], (current) => {
											const rows = current ?? [];
											return rows.some((row) => row.id === park.id) ? rows.map((row) => row.id === park.id ? park : row) : [...rows, park].sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
										});
										setAddingField(false);
									}
								}) : null
							]
						}) : null
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldBand, { src: "/photos/field-dugout.jpg" })
			]
		})
	});
}
function FieldForm({ onClose, onSaved }) {
	const [name, setName] = (0, import_react.useState)("");
	const [address, setAddress] = (0, import_react.useState)("");
	const [flags, setFlags] = (0, import_react.useState)(() => emptyParkFlags());
	const [formError, setFormError] = (0, import_react.useState)(null);
	const save = useMutation({
		mutationFn: () => addKnownPark({ data: {
			name,
			address,
			...flags
		} }),
		onSuccess: (park) => onSaved(park)
	});
	const error = formError ?? (save.error instanceof Error ? save.error.message : save.error ? "Could not save that field." : null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NestedSheet, {
		title: "Add field",
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "space-y-3",
			onSubmit: (event) => {
				event.preventDefault();
				setFormError(null);
				try {
					parseLocationInput({
						weekendId: 1,
						name,
						address
					});
					save.mutate();
				} catch (err) {
					setFormError(err instanceof Error ? err.message : "Check the field and try again.");
				}
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["Name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: name,
						onChange: (event) => setName(event.target.value),
						maxLength: 80,
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["Address", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: address,
						onChange: (event) => setAddress(event.target.value),
						maxLength: 160,
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParkOptions, {
					idPrefix: "add-field",
					flags,
					onChange: setFlags
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
					role: "alert",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "w-full",
					disabled: save.isPending,
					children: save.isPending ? "Saving…" : "Save field"
				})
			]
		})
	});
}
function sheetTitle(open) {
	if (open === "coaches") return "Coaches";
	if (open === "staff") return "Staff";
	if (open === "accounts") return "Accounts";
	return "Fields";
}
function ResourceButton({ label, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: "flex min-h-24 items-center justify-center rounded-lg border border-line bg-surface px-3 text-center font-display text-xl font-bold uppercase leading-none",
		children: label
	});
}
function byName(a, b) {
	return a.localeCompare(b, void 0, { sensitivity: "base" });
}
function AccountDirectory({ people, pending, canManage, canGrant, selfId }) {
	const queryClient = useQueryClient();
	const coachesQuery = useQuery({
		queryKey: ["coach-directory"],
		queryFn: () => listCoachDirectory()
	});
	const [confirmRemove, setConfirmRemove] = (0, import_react.useState)(null);
	const [confirmCoach, setConfirmCoach] = (0, import_react.useState)(null);
	const [confirmGrant, setConfirmGrant] = (0, import_react.useState)(null);
	const erase = useMutation({
		mutationFn: (userId) => eraseAccount({ data: { userId } }),
		onSuccess: async () => {
			setConfirmRemove(null);
			setConfirmCoach(null);
			await queryClient.invalidateQueries({ queryKey: ["directory"] });
			await queryClient.invalidateQueries({ queryKey: ["coach-directory"] });
			await queryClient.invalidateQueries({ queryKey: ["weekends"] });
		}
	});
	const grant = useMutation({
		mutationFn: (input) => setSuperuser({ data: input }),
		onSuccess: async () => {
			setConfirmGrant(null);
			await queryClient.invalidateQueries({ queryKey: ["directory"] });
		}
	});
	const admins = [...people].sort((a, b) => byName(a.name || a.email, b.name || b.email));
	const coaches = [...coachesQuery.data ?? []].sort((a, b) => byName(a.name || a.email, b.name || b.email));
	if (pending || coachesQuery.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Loading accounts…"
	});
	const error = erase.error instanceof Error && erase.error.message || grant.error instanceof Error && grant.error.message || null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [
			!canManage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Only an administrator you allow can add or remove other administrators."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display text-xl font-bold uppercase",
					children: "Administrators"
				}), admins.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "No administrators yet."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface",
					children: admins.map((person) => {
						const mine = person.userId === selfId;
						const owner = isSuperuserOwner(person.email);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "px-4 py-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "truncate font-medium",
												children: person.name || person.email
											}),
											person.name ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "truncate text-sm text-muted",
												children: person.email
											}) : null,
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs font-bold uppercase tracking-wide text-muted",
												children: [owner ? "Superuser" : person.canManageAdmins ? "Can manage admins" : "Administrator", mine ? " · You" : ""]
											})
										]
									}), canManage && !mine && !owner && confirmRemove !== person.userId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "ghost",
										className: "px-2 text-muted",
										onClick: () => setConfirmRemove(person.userId),
										children: "Delete"
									}) : null]
								}),
								confirmRemove === person.userId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm",
										children: [
											"Delete ",
											person.email,
											" completely? Their login is removed and cannot be restored."
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											className: "flex-1",
											disabled: erase.isPending,
											onClick: () => erase.mutate(person.userId),
											children: erase.isPending ? "Deleting…" : "Delete account"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											className: "flex-1",
											onClick: () => setConfirmRemove(null),
											children: "Cancel"
										})]
									})]
								}) : null,
								canGrant && !mine && !owner ? confirmGrant === person.userId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm",
										children: person.canManageAdmins ? `Stop ${person.email} from adding or removing administrators? They stay an administrator.` : `Let ${person.email} add and remove other administrators? They still can’t give that power to anyone else.`
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											className: "flex-1",
											disabled: grant.isPending,
											onClick: () => grant.mutate({
												userId: person.userId,
												grant: !person.canManageAdmins
											}),
											children: grant.isPending ? "Saving…" : person.canManageAdmins ? "Stop managing admins" : "Allow managing admins"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											className: "flex-1",
											onClick: () => setConfirmGrant(null),
											children: "Cancel"
										})]
									})]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									className: "mt-3 w-full",
									onClick: () => setConfirmGrant(person.userId),
									children: person.canManageAdmins ? "Stop managing admins" : "Allow managing admins"
								}) : null
							]
						}, person.userId);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display text-xl font-bold uppercase",
					children: "Coaches"
				}), coaches.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "No coaches yet."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface",
					children: coaches.map((coach) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate font-medium",
										children: coach.name || coach.email
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-sm text-muted",
										children: coach.email
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs font-bold uppercase tracking-wide text-muted",
										children: ["Coach", coach.teams.length > 0 ? ` · ${coach.teams.map((team) => `${team.name} ${team.ageGroup ?? ""}`.trim()).join(", ")}` : ""]
									})
								]
							}), confirmCoach !== coach.userId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								className: "px-2 text-muted",
								onClick: () => setConfirmCoach(coach.userId),
								children: "Delete"
							}) : null]
						}), confirmCoach === coach.userId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm",
								children: [
									"Delete ",
									coach.name || coach.email,
									" completely? Their login, team, and roster are removed and cannot be restored."
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									className: "flex-1",
									disabled: erase.isPending,
									onClick: () => erase.mutate(coach.userId),
									children: erase.isPending ? "Deleting…" : "Delete account"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									className: "flex-1",
									onClick: () => setConfirmCoach(null),
									children: "Cancel"
								})]
							})]
						}) : null]
					}, coach.userId))
				})]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
				role: "alert",
				children: error
			}) : null
		]
	});
}
function ResourceSheet({ title, onClose, children }) {
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[80] flex items-end justify-center bg-scrim sm:items-center",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": title,
			className: "max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-lg border border-line bg-bg p-4 text-fg shadow-lg sm:rounded-lg",
			onClick: (event) => event.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-3xl font-bold uppercase",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Close",
					onClick: onClose,
					className: "grid h-11 w-11 place-items-center rounded-md text-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
						className: "h-5 w-5",
						"aria-hidden": true
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children
			})]
		})
	}), document.body);
}
function StaffDirectory() {
	const queryClient = useQueryClient();
	const staffQuery = useQuery({
		queryKey: ["staff"],
		queryFn: () => listStaff()
	});
	const [adding, setAdding] = (0, import_react.useState)(false);
	const [confirmId, setConfirmId] = (0, import_react.useState)(null);
	const remove = useMutation({
		mutationFn: (id) => removeStaffMember({ data: { id } }),
		onSuccess: async () => {
			setConfirmId(null);
			await queryClient.invalidateQueries({ queryKey: ["staff"] });
		}
	});
	const people = staffQuery.data ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				className: "h-10 px-4 text-sm",
				onClick: () => setAdding(true),
				children: "Add staff"
			}),
			staffQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Loading staff…"
			}) : staffQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Could not load staff. Close this and open it again."
			}) : people.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No staff saved yet."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface",
				children: people.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate font-medium",
								children: person.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-sm text-muted",
								children: person.phone
							})]
						}), confirmId === person.id ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							className: "px-2 text-muted",
							onClick: () => setConfirmId(person.id),
							children: "Delete"
						})]
					}), confirmId === person.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm",
							children: [
								"Delete ",
								person.name,
								" from staff? This cannot be undone."
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								className: "flex-1",
								disabled: remove.isPending,
								onClick: () => remove.mutate(person.id),
								children: remove.isPending ? "Deleting…" : "Delete staff"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								className: "flex-1",
								onClick: () => setConfirmId(null),
								children: "Cancel"
							})]
						})]
					}) : null]
				}, person.id))
			}),
			adding ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaffForm, {
				onClose: () => setAdding(false),
				onSaved: async () => {
					setAdding(false);
					await queryClient.invalidateQueries({ queryKey: ["staff"] });
				}
			}) : null
		]
	});
}
function StaffForm({ onClose, onSaved }) {
	const [name, setName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const save = useMutation({
		mutationFn: () => saveStaffMember({ data: {
			name,
			phone
		} }),
		onSuccess: () => onSaved()
	});
	const error = save.error instanceof Error ? save.error.message : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NestedSheet, {
		title: "Add staff",
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "space-y-3",
			onSubmit: (event) => {
				event.preventDefault();
				save.mutate();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["Name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: name,
						onChange: (event) => setName(event.target.value),
						maxLength: 80,
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["Phone", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: phone,
						onChange: (event) => setPhone(formatPhoneInput(event.target.value)),
						placeholder: "(555) 555-0100",
						inputMode: "tel",
						maxLength: 14,
						required: true
					})]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
					role: "alert",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "w-full",
					disabled: save.isPending,
					children: save.isPending ? "Saving…" : "Save staff"
				})
			]
		})
	});
}
function inviteHref(invite) {
	const body = `423Sports Tournaments. Create your coach account here: ${`${window.location.origin}/join?role=coach&invite=${invite.id}`}`;
	if (invite.channel === "email") return `mailto:${invite.destination}?subject=${encodeURIComponent("423Sports coach account")}&body=${encodeURIComponent(body)}`;
	const digits = invite.destination.replace(/\D/g, "");
	return `sms:${digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith("1") ? `+${digits}` : digits}?&body=${encodeURIComponent(body)}`;
}
function CoachInvites() {
	const queryClient = useQueryClient();
	const coachesQuery = useQuery({
		queryKey: ["coach-directory"],
		queryFn: () => listCoachDirectory()
	});
	const [inviteOpen, setInviteOpen] = (0, import_react.useState)(false);
	const [adding, setAdding] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [confirmId, setConfirmId] = (0, import_react.useState)(null);
	const remove = useMutation({
		mutationFn: (userId) => removeCoachDirectory({ data: { userId } }),
		onSuccess: (_result, userId) => {
			queryClient.setQueryData(["coach-directory"], (current) => (current ?? []).filter((row) => row.userId !== userId));
			setConfirmId(null);
		}
	});
	const coaches = coachesQuery.data ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					className: "h-10 flex-1 px-4 text-sm",
					onClick: () => setAdding(true),
					children: "Add coach"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "outline",
					className: "h-10 flex-1 px-4 text-sm",
					onClick: () => setInviteOpen(true),
					children: "Invite"
				})]
			}),
			coachesQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Loading coaches…"
			}) : coaches.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No coaches yet."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				children: coaches.map((coach) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-lg border border-line bg-surface px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setEditing(coach),
							className: "min-w-0 flex-1 text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: coach.name || coach.email
							}), coach.teams.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "No team yet"
							}) : coach.teams.map((team, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm",
								children: [team.name, team.ageGroup ? ` · ${team.ageGroup}` : ""]
							}, `${team.name}-${index}`))]
						}), confirmId === coach.userId ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							className: "px-2 text-muted",
							onClick: () => setConfirmId(coach.userId),
							children: "Delete"
						})]
					}), confirmId === coach.userId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm",
								children: [
									"Delete ",
									coach.name || coach.email,
									"? This takes them off the coach list."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									className: "flex-1",
									disabled: remove.isPending,
									onClick: () => remove.mutate(coach.userId),
									children: remove.isPending ? "Deleting…" : "Delete coach"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									className: "flex-1",
									onClick: () => setConfirmId(null),
									children: "Cancel"
								})]
							}),
							remove.error instanceof Error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
								role: "alert",
								children: remove.error.message
							}) : null
						]
					}) : null]
				}, coach.userId))
			}),
			adding ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddCoachForm, {
				onClose: () => setAdding(false),
				onSaved: (coach) => {
					queryClient.setQueryData(["coach-directory"], (current) => [...(current ?? []).filter((row) => row.userId !== coach.userId), coach].sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email)));
					setAdding(false);
				}
			}) : null,
			inviteOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InviteForm, {
				onClose: () => setInviteOpen(false),
				onSent: (invite) => {
					queryClient.setQueryData(["coach-invites"], (current) => [invite, ...(current ?? []).filter((row) => row.id !== invite.id)]);
				}
			}) : null,
			editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachEditForm, {
				coach: editing,
				onClose: () => setEditing(null),
				onSaved: (next) => {
					queryClient.setQueryData(["coach-directory"], (current) => (current ?? []).map((row) => row.userId === next.userId ? next : row));
					setEditing(null);
				},
				onRemoved: (userId) => {
					queryClient.setQueryData(["coach-directory"], (current) => (current ?? []).filter((row) => row.userId !== userId));
					setEditing(null);
				}
			}) : null
		]
	});
}
function AddCoachForm({ onClose, onSaved }) {
	const [name, setName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [teamName, setTeamName] = (0, import_react.useState)("");
	const [ageGroup, setAgeGroup] = (0, import_react.useState)("");
	const save = useMutation({
		mutationFn: () => addCoachDirectory({ data: {
			name,
			phone,
			email,
			teamName,
			ageGroup
		} }),
		onSuccess: (coach) => onSaved(coach)
	});
	const error = save.error instanceof Error ? save.error.message : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NestedSheet, {
		title: "Add coach",
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "space-y-3",
			onSubmit: (event) => {
				event.preventDefault();
				save.mutate();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["Coach name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: name,
						onChange: (event) => setName(event.target.value),
						autoComplete: "name",
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["Phone", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: phone,
						onChange: (event) => setPhone(formatPhoneInput(event.target.value)),
						placeholder: "(555) 555-0100",
						inputMode: "tel",
						autoComplete: "tel",
						maxLength: 14,
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["Email", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: email,
						onChange: (event) => setEmail(event.target.value),
						placeholder: "name@email.com",
						inputMode: "email",
						autoComplete: "email",
						autoCapitalize: "none",
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["Team name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: teamName,
						onChange: (event) => setTeamName(event.target.value),
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["Age bracket", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: ageGroup,
						onChange: (event) => setAgeGroup(event.target.value),
						required: true,
						className: "h-11 w-full rounded-md border border-line bg-bg px-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "Pick an age"
						}), AGE_GROUPS.map((age) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: age,
							children: age
						}, age))]
					})]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
					role: "alert",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "w-full",
					disabled: save.isPending,
					children: save.isPending ? "Saving…" : "Save coach"
				})
			]
		})
	});
}
function InviteForm({ onClose, onSent }) {
	const invitesQuery = useQuery({
		queryKey: ["coach-invites"],
		queryFn: () => listCoachInvites()
	});
	const [phone, setPhone] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const send = useMutation({
		mutationFn: (input) => createCoachInvite({ data: input }),
		onSuccess: (invite) => {
			if (invite.channel === "phone") setPhone("");
			else setEmail("");
			onSent(invite);
			window.location.href = inviteHref(invite);
		}
	});
	const error = send.error instanceof Error ? send.error.message : null;
	const invites = invitesQuery.data ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NestedSheet, {
		title: "Invite a coach",
		onClose,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-3",
				onSubmit: (event) => {
					event.preventDefault();
					send.mutate({
						channel: "phone",
						destination: phone
					});
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["Cell phone", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: formatPhoneInput(phone),
						onChange: (event) => setPhone(formatPhoneInput(event.target.value)),
						inputMode: "tel",
						autoComplete: "tel",
						placeholder: "(555) 555-0100"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "w-full",
					disabled: send.isPending,
					children: "Text an invite"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 space-y-3",
				onSubmit: (event) => {
					event.preventDefault();
					send.mutate({
						channel: "email",
						destination: email
					});
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["Email", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: email,
						onChange: (event) => setEmail(event.target.value),
						inputMode: "email",
						autoComplete: "email",
						placeholder: "name@email.com"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					variant: "outline",
					className: "w-full",
					disabled: send.isPending,
					children: "Email an invite"
				})]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm",
				role: "alert",
				children: error
			}) : null,
			invites.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2",
				children: invites.map((invite) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-lg border border-line bg-surface px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate font-medium",
						children: invite.destination
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs font-bold uppercase tracking-wide text-muted",
						children: [
							invite.channel === "phone" ? "Text" : "Email",
							" · ",
							invite.accountEmail ? "Account created" : "No account yet"
						]
					})]
				}, invite.id))
			}) : null
		]
	});
}
function CoachEditForm({ coach, onClose, onSaved, onRemoved }) {
	const [name, setName] = (0, import_react.useState)(coach.name ?? "");
	const [phone, setPhone] = (0, import_react.useState)(coach.phone ?? "");
	const [email, setEmail] = (0, import_react.useState)(coach.email);
	const [club, setClub] = (0, import_react.useState)(coach.club ?? "");
	const [note, setNote] = (0, import_react.useState)(coach.note);
	const [teams, setTeams] = (0, import_react.useState)(coach.teams.length > 0 ? coach.teams.map((team) => ({
		name: team.name,
		ageGroup: team.ageGroup ?? ""
	})) : [{
		name: "",
		ageGroup: ""
	}]);
	const [confirmRemove, setConfirmRemove] = (0, import_react.useState)(false);
	const save = useMutation({
		mutationFn: () => updateCoachDirectory({ data: {
			userId: coach.userId,
			name,
			phone,
			email,
			club,
			note,
			teams
		} }),
		onSuccess: (next) => onSaved(next)
	});
	const remove = useMutation({
		mutationFn: () => removeCoachDirectory({ data: { userId: coach.userId } }),
		onSuccess: () => onRemoved(coach.userId)
	});
	const error = save.error instanceof Error ? save.error.message : remove.error instanceof Error ? remove.error.message : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NestedSheet, {
		title: coach.name || "Coach",
		onClose,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "space-y-3",
			onSubmit: (event) => {
				event.preventDefault();
				save.mutate();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["Name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: name,
						onChange: (event) => setName(event.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["Cell phone", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: formatPhoneInput(phone),
						onChange: (event) => setPhone(formatPhoneInput(event.target.value)),
						inputMode: "tel"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["Email", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: email,
						onChange: (event) => setEmail(event.target.value),
						inputMode: "email",
						autoCapitalize: "none"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["Club", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: club,
						onChange: (event) => setClub(event.target.value),
						placeholder: "Optional"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold",
							children: "Teams"
						}),
						teams.map((team, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-[1fr_5.5rem] gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: team.name,
								"aria-label": "Team name",
								placeholder: "Team name",
								onChange: (event) => setTeams(teams.map((row, i) => i === index ? {
									...row,
									name: event.target.value
								} : row))
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								"aria-label": "Age",
								value: team.ageGroup,
								onChange: (event) => setTeams(teams.map((row, i) => i === index ? {
									...row,
									ageGroup: event.target.value
								} : row)),
								className: "h-11 rounded-md border border-line bg-bg px-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Age"
								}), AGE_GROUPS.map((age) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: age,
									children: age
								}, age))]
							})]
						}, index)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							className: "w-full",
							onClick: () => setTeams([...teams, {
								name: "",
								ageGroup: ""
							}]),
							children: "Add another team"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: [
						"Private note",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: note,
							onChange: (event) => setNote(event.target.value),
							maxLength: 1e3,
							rows: 3,
							placeholder: "Only you can see this. Example: ejected for arguing a call.",
							className: "min-h-20 w-full rounded-md border border-line bg-surface px-3 py-3 text-base text-fg placeholder:text-muted"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-xs font-normal text-muted",
							children: "Only an admin can see this. The coach never can."
						})
					]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
					role: "alert",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "w-full",
					disabled: save.isPending,
					children: save.isPending ? "Saving…" : "Save"
				})
			]
		}), confirmRemove ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 space-y-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm",
					children: "This takes coach access away and removes them from this list."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "outline",
					className: "w-full",
					disabled: remove.isPending,
					onClick: () => remove.mutate(),
					children: remove.isPending ? "Removing…" : "Remove coach"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					className: "w-full",
					onClick: () => setConfirmRemove(false),
					children: "Cancel"
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			type: "button",
			variant: "ghost",
			className: "mt-3 w-full text-muted",
			onClick: () => setConfirmRemove(true),
			children: "Remove coach"
		})]
	});
}
function NestedSheet({ title, onClose, children }) {
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[90] flex items-end justify-center bg-scrim sm:items-center",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": title,
			className: "max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-lg border border-line bg-bg p-4 text-fg shadow-lg sm:rounded-lg",
			onClick: (event) => event.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-3xl font-bold uppercase",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Close",
					onClick: onClose,
					className: "grid h-11 w-11 place-items-center rounded-md text-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
						className: "h-5 w-5",
						"aria-hidden": true
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children
			})]
		})
	}), document.body);
}
function ParkCard({ park, editing, onEdit, onCancel, onSaved, onRemoved }) {
	const [name, setName] = (0, import_react.useState)(park.name);
	const [address, setAddress] = (0, import_react.useState)(park.address);
	const [flags, setFlags] = (0, import_react.useState)(() => flagsFrom$1(park));
	const [formError, setFormError] = (0, import_react.useState)(null);
	const [confirmRemove, setConfirmRemove] = (0, import_react.useState)(false);
	const saveMut = useMutation({
		mutationFn: () => updateKnownPark({ data: {
			id: park.id,
			name,
			address,
			...flags
		} }),
		onSuccess: (next) => {
			setFormError(null);
			onSaved(next);
		}
	});
	const removeMut = useMutation({
		mutationFn: () => removeKnownPark({ data: { id: park.id } }),
		onSuccess: () => onRemoved(park.id)
	});
	const summary = parkSummary(park);
	const errorText = formError ?? (saveMut.error instanceof Error ? saveMut.error.message : saveMut.error ? "Could not save that park." : null) ?? (removeMut.error instanceof Error ? removeMut.error.message : removeMut.error ? "Could not remove that park." : null);
	function save() {
		setFormError(null);
		try {
			parseLocationInput({
				weekendId: 1,
				name,
				address
			});
			saveMut.mutate();
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "Check the park and try again.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		className: "rounded-lg border border-line bg-surface px-4 py-4",
		children: editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: `resource-name-${park.id}`,
						children: "Name"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: `resource-name-${park.id}`,
						value: name,
						onChange: (event) => setName(event.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: `resource-address-${park.id}`,
						children: "Address"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: `resource-address-${park.id}`,
						value: address,
						onChange: (event) => setAddress(event.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParkOptions, {
					idPrefix: `resource-${park.id}`,
					flags,
					onChange: setFlags
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "This updates the saved park. Tournaments already using it stay as they are."
				}),
				errorText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
					role: "alert",
					children: errorText
				}) : null,
				confirmRemove ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm",
						children: "Delete this park for good? This cannot be undone. Tournaments already using it stay as they are."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							onClick: () => setConfirmRemove(false),
							children: "Keep it"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "danger",
							disabled: removeMut.isPending,
							onClick: () => removeMut.mutate(),
							children: removeMut.isPending ? "Deleting…" : "Delete park"
						})]
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-3 gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							size: "sm",
							className: "px-2",
							onClick: onCancel,
							children: "Cancel"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "danger",
							size: "sm",
							className: "px-2",
							onClick: () => setConfirmRemove(true),
							children: "Delete park"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							size: "sm",
							className: "px-2",
							disabled: saveMut.isPending,
							onClick: save,
							children: saveMut.isPending ? "Saving…" : "Save"
						})
					]
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl font-bold uppercase leading-none",
				children: park.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm",
				children: park.address
			}),
			summary ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs font-semibold uppercase tracking-wide text-muted",
				children: summary
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "outline",
				className: "mt-3",
				onClick: () => {
					setName(park.name);
					setAddress(park.address);
					setFlags(flagsFrom$1(park));
					setFormError(null);
					onEdit();
				},
				children: "Edit"
			})
		] })
	});
}
var Route$14 = createFileRoute("/teams")({ component: TeamsLayout });
function TeamsLayout() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {});
}
var Route$13 = createFileRoute("/weekends")({ component: WeekendsLayout });
function WeekendsLayout() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {});
}
function FieldDialog({ parks, currentId, onPick, onAdd, onClose, busy, error }) {
	const [adding, setAdding] = (0, import_react.useState)(false);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [name, setName] = (0, import_react.useState)("");
	const [address, setAddress] = (0, import_react.useState)("");
	const [flags, setFlags] = (0, import_react.useState)(null);
	const [formError, setFormError] = (0, import_react.useState)(null);
	const queryClient = useQueryClient();
	const editMut = useMutation({
		mutationFn: (saveToResource) => {
			if (editingId == null || !flags) throw new Error("Pick a park to edit.");
			return updateWeekendLocation({ data: {
				id: editingId,
				name,
				address,
				saveToResource,
				...flags
			} });
		},
		onSuccess: (next) => {
			setFormError(null);
			setEditingId(null);
			queryClient.setQueryData(["weekend", next.id], next);
			queryClient.invalidateQueries({ queryKey: ["schedule", next.id] });
			queryClient.invalidateQueries({ queryKey: ["known-parks"] });
			queryClient.invalidateQueries({ queryKey: ["weekends"] });
		}
	});
	function startEdit(park) {
		setAdding(false);
		setFormError(null);
		setEditingId(park.id);
		setName(park.name);
		setAddress(park.address);
		setFlags({
			chairs: park.chairs,
			canopies: park.canopies,
			concessions: park.concessions,
			restrooms: park.restrooms,
			lights: park.lights,
			bleachers: park.bleachers,
			entranceFee: park.entranceFee,
			entrancePrice: park.entrancePrice,
			ageDiscount: park.ageDiscount,
			discountAges: park.discountAges,
			discountPrice: park.discountPrice
		});
	}
	function saveEdit(saveToResource) {
		setFormError(null);
		try {
			parseLocationInput({
				weekendId: 1,
				name,
				address
			});
			editMut.mutate(saveToResource);
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "Check the park and try again.");
		}
	}
	function submitAdd(event) {
		event.preventDefault();
		setFormError(null);
		try {
			const parsed = parseLocationInput({
				weekendId: 1,
				name,
				address
			});
			onAdd({
				name: parsed.name,
				address: parsed.address
			});
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "Check the park and try again.");
		}
	}
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[80] flex items-end justify-center bg-scrim p-4 sm:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "field-dialog-title",
			className: "w-full max-w-md rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						id: "field-dialog-title",
						className: "font-display text-2xl font-bold uppercase",
						children: "Field"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						className: "px-2 text-muted",
						onClick: onClose,
						children: "Close"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Suggested for you. Confirm it or pick another park."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 space-y-2",
					children: parks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
						children: "No parks yet. Add one below."
					}) : parks.map((park) => editingId === park.id && flags ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 rounded-md border border-line bg-surface p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: `game-park-name-${park.id}`,
									children: "Name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: `game-park-name-${park.id}`,
									value: name,
									onChange: (event) => setName(event.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: `game-park-address-${park.id}`,
									children: "Address"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: `game-park-address-${park.id}`,
									value: address,
									onChange: (event) => setAddress(event.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParkOptions, {
								idPrefix: `game-${park.id}`,
								flags,
								onChange: setFlags
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParkSaveChoice, {
								busy: editMut.isPending,
								onTournamentOnly: () => saveEdit(false),
								onUpdateResource: () => saveEdit(true)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								className: "w-full text-muted",
								onClick: () => setEditingId(null),
								children: "Cancel"
							})
						]
					}, park.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-stretch gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: busy,
							onClick: () => onPick(park.id),
							className: park.id === currentId ? "min-w-0 flex-1 rounded-md border border-primary bg-primary/15 px-4 py-3 text-left" : "min-w-0 flex-1 rounded-md border border-line bg-surface px-4 py-3 text-left hover:border-fg/40",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-xl font-bold uppercase leading-none",
								children: park.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: park.address
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							className: "shrink-0",
							onClick: () => startEdit(park),
							children: "Edit"
						})]
					}, park.id))
				}),
				adding ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					noValidate: true,
					onSubmit: submitAdd,
					className: "mt-4 space-y-3 rounded-md border border-line bg-surface p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "new-park-name",
								children: "Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "new-park-name",
								value: name,
								onChange: (e) => setName(e.target.value),
								placeholder: "McMinn County HS"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "new-park-address",
								children: "Address"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "new-park-address",
								value: address,
								onChange: (e) => setAddress(e.target.value),
								placeholder: "2215 Congress Parkway, Athens, TN"
							})]
						}),
						formError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
							role: "alert",
							children: formError
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							size: "lg",
							className: "w-full",
							disabled: busy,
							children: busy ? "Saving…" : "Add field"
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "outline",
					className: "mt-4 w-full",
					onClick: () => {
						setEditingId(null);
						setName("");
						setAddress("");
						setFormError(null);
						setAdding(true);
					},
					children: "Add field"
				}),
				formError || editMut.error || error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm",
					role: "alert",
					children: formError ?? (editMut.error instanceof Error ? editMut.error.message : error ?? "Could not save that park.")
				}) : null
			]
		})
	}), document.body);
}
function teamSlots(games, teamId) {
	return games.filter((row) => row.round === "pool" && !row.isBye && (row.homeTeamId === teamId || row.awayTeamId === teamId)).slice().sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? "") || (a.startTime ?? "").localeCompare(b.startTime ?? "") || a.slot - b.slot);
}
function poolRoster(games) {
	const found = /* @__PURE__ */ new Map();
	for (const game of games) {
		if (game.round !== "pool") continue;
		for (const side of ["home", "away"]) {
			const id = side === "home" ? game.homeTeamId : game.awayTeamId;
			const name = side === "home" ? game.homeName : game.awayName;
			const seed = side === "home" ? game.homeSeed : game.awaySeed;
			if (id == null) continue;
			const prev = found.get(id);
			const nextSeed = seed ?? 99;
			if (!prev || nextSeed < prev.seed) found.set(id, {
				name: name ?? "Team",
				seed: nextSeed,
				pool: game.poolIndex ?? 0,
				field: game.locationName ? shortParkName(game.locationName) : ""
			});
		}
	}
	const rows = [...found.entries()].sort((a, b) => a[1].pool - b[1].pool || a[1].seed - b[1].seed || a[0] - b[0]);
	const counts = /* @__PURE__ */ new Map();
	return rows.map(([id, row]) => {
		const number = (counts.get(row.pool) ?? 0) + 1;
		counts.set(row.pool, number);
		return {
			id,
			name: row.name,
			number,
			pool: row.pool,
			field: row.field
		};
	});
}
var GameEditContext = (0, import_react.createContext)(null);
function GameEditProvider({ value, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameEditContext.Provider, {
		value,
		children
	});
}
function useGameEdit() {
	return (0, import_react.useContext)(GameEditContext);
}
function gameResultText(game) {
	if (game.noContest) return "No contest";
	if (game.forfeit) return "Forfeit";
	if (game.homeScore != null && game.awayScore != null) return `${game.homeScore}-${game.awayScore}`;
	return null;
}
function TeamOutActions({ game }) {
	const edit = useGameEdit();
	const [mode, setMode] = (0, import_react.useState)("closed");
	const [teamId, setTeamId] = (0, import_react.useState)(game.homeTeamId ?? game.awayTeamId);
	const [name, setName] = (0, import_react.useState)("");
	const [localError, setLocalError] = (0, import_react.useState)(null);
	if (!edit?.locked) return null;
	const sides = [game.homeTeamId != null ? {
		id: game.homeTeamId,
		name: game.homeName ?? "Home"
	} : null, game.awayTeamId != null ? {
		id: game.awayTeamId,
		name: game.awayName ?? "Away"
	} : null].filter((side) => side != null);
	if (sides.length === 0) return null;
	const open = !game.noContest && !game.forfeit && (game.homeScore == null || game.awayScore == null);
	async function runPull() {
		if (teamId == null) return;
		setLocalError(null);
		try {
			await edit.pullOut(teamId);
			setMode("closed");
		} catch (err) {
			setLocalError(err instanceof Error ? err.message : "Could not forfeit those games.");
		}
	}
	async function runReplace(event) {
		event.preventDefault();
		if (teamId == null) return;
		setLocalError(null);
		try {
			await edit.replaceTeam(teamId, name);
			setMode("closed");
			setName("");
		} catch (err) {
			setLocalError(err instanceof Error ? err.message : "Could not replace that club.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 space-y-2 border-t border-line pt-3",
		children: [
			mode === "closed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "outline",
				className: "w-full",
				onClick: () => setMode("pull"),
				children: "Pulled out"
			}), edit.beforeFirstPitch && open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "outline",
				className: "w-full",
				onClick: () => setMode("replace"),
				children: "Replace in these games"
			}) : null] }) : null,
			mode === "pull" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Forfeit every remaining game. The sheet stays put."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: teamId ?? "",
						onChange: (event) => setTeamId(Number.parseInt(event.target.value, 10)),
						className: "h-11 w-full rounded-md border border-line bg-bg px-3 text-sm",
						children: sides.map((side) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: side.id,
							children: side.name
						}, side.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						className: "w-full",
						disabled: edit.busy,
						onClick: () => void runPull(),
						children: edit.busy ? "Saving…" : "Forfeit their remaining games"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						className: "w-full text-muted",
						onClick: () => setMode("closed"),
						children: "Back"
					})
				]
			}) : null,
			mode === "replace" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				noValidate: true,
				onSubmit: (event) => void runReplace(event),
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Same seed, same times, same parks. The new club takes this slot."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: teamId ?? "",
						onChange: (event) => setTeamId(Number.parseInt(event.target.value, 10)),
						className: "h-11 w-full rounded-md border border-line bg-bg px-3 text-sm",
						children: sides.map((side) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: side.id,
							children: [side.name, " drops"]
						}, side.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: `replace-name-${game.id}`,
						children: "New club"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: `replace-name-${game.id}`,
						value: name,
						onChange: (event) => setName(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						disabled: edit.busy,
						children: edit.busy ? "Saving…" : "Put them in this slot"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						className: "w-full text-muted",
						onClick: () => setMode("closed"),
						children: "Back"
					})
				]
			}) : null,
			localError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
				role: "alert",
				children: localError
			}) : null
		]
	});
}
function GameDetailsForm({ game, onDone }) {
	const edit = useGameEdit();
	const firstDate = game.startDate ?? edit?.days[0]?.date ?? "";
	const firstBlocks = edit?.blocksFor(firstDate) ?? [];
	const clock = (game.startTime ?? "").slice(0, 5);
	const [date, setDate] = (0, import_react.useState)(firstDate);
	const [timeChoice, setTimeChoice] = (0, import_react.useState)(clock && firstBlocks.includes(clock) ? clock : clock ? "other" : firstBlocks[0] ?? "other");
	const [customTime, setCustomTime] = (0, import_react.useState)(clock || firstBlocks[0] || "08:00");
	const [locationId, setLocationId] = (0, import_react.useState)(game.locationId != null ? String(game.locationId) : "");
	const [localError, setLocalError] = (0, import_react.useState)(null);
	if (!edit) return null;
	const sheet = edit;
	const blocks = sheet.blocksFor(date);
	const dayOptions = !date || sheet.days.some((row) => row.date === date) ? sheet.days : [{
		date,
		label: formatDayTab(date)
	}, ...sheet.days];
	function changeDate(next) {
		setDate(next);
		const nextBlocks = sheet.blocksFor(next);
		setTimeChoice((prev) => {
			if (prev === "other") return "other";
			if (nextBlocks.includes(prev)) return prev;
			return nextBlocks[0] ?? "other";
		});
	}
	async function submit(event) {
		event.preventDefault();
		setLocalError(null);
		const startTime = (timeChoice === "other" ? customTime : timeChoice).slice(0, 5);
		if (!date) {
			setLocalError("Pick a day on this tournament.");
			return;
		}
		if (!/^\d{2}:\d{2}$/.test(startTime)) {
			setLocalError("Pick a start time.");
			return;
		}
		try {
			await sheet.save({
				gameId: game.id,
				startDate: date,
				startTime,
				locationId: locationId === "" ? null : Number.parseInt(locationId, 10)
			});
			onDone();
		} catch (err) {
			setLocalError(err instanceof Error ? err.message : "Could not update that game.");
		}
	}
	const shownError = localError;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		noValidate: true,
		onSubmit: submit,
		className: "mt-3 space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Move this game only. The rest of the sheet stays put."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: `game-day-${game.id}`,
					children: "Day"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					id: `game-day-${game.id}`,
					value: date,
					onChange: (event) => changeDate(event.target.value),
					className: "h-11 w-full rounded-md border border-line bg-bg px-3 text-sm",
					children: dayOptions.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: row.date,
						children: row.label
					}, row.date))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: `game-time-${game.id}`,
						children: "Start"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						id: `game-time-${game.id}`,
						value: timeChoice === "other" || blocks.includes(timeChoice) ? timeChoice : "other",
						onChange: (event) => setTimeChoice(event.target.value),
						className: "h-11 w-full rounded-md border border-line bg-bg px-3 text-sm",
						children: [blocks.map((time) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: time,
							children: formatClock(time)
						}, time)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "other",
							children: "Other time"
						})]
					}),
					timeChoice === "other" || !blocks.includes(timeChoice) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: `game-custom-time-${game.id}`,
						type: "time",
						value: customTime,
						onChange: (event) => {
							setCustomTime(event.target.value);
							setTimeChoice("other");
						}
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Starts stay two hours apart unless this game has to move."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: `game-park-${game.id}`,
					children: "Field"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					id: `game-park-${game.id}`,
					value: locationId,
					onChange: (event) => setLocationId(event.target.value),
					className: "h-11 w-full rounded-md border border-line bg-bg px-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "Field TBD"
					}), sheet.parks.map((park) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: park.id,
						children: park.name
					}, park.id))]
				})]
			}),
			shownError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
				role: "alert",
				children: shownError
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				className: "w-full",
				disabled: sheet.busy,
				children: sheet.busy ? "Saving…" : "Save game"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "ghost",
				className: "w-full text-muted",
				onClick: onDone,
				children: "Back to score"
			})
		]
	});
}
function PoolGameDialog({ game, games, numbers, busy, error, onClose, onSwap, onScore }) {
	const [spot, setSpot] = (0, import_react.useState)(null);
	const [swapOpen, setSwapOpen] = (0, import_react.useState)(false);
	const [homeScore, setHomeScore] = (0, import_react.useState)(game.homeScore != null ? String(game.homeScore) : "");
	const [awayScore, setAwayScore] = (0, import_react.useState)(game.awayScore != null ? String(game.awayScore) : "");
	const [forfeit, setForfeit] = (0, import_react.useState)(game.forfeit === "home" || game.forfeit === "away" ? game.forfeit : "");
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [localError, setLocalError] = (0, import_react.useState)(null);
	const gameEdit = useGameEdit();
	const n = numbers.get(`${game.round}:${game.slot}`);
	const scored = game.homeScore != null || game.awayScore != null || game.scoreLocked;
	const roster = poolRoster(games);
	const pools = new Set(roster.map((row) => row.pool));
	const numberOf = (id) => roster.find((row) => row.id === id)?.number ?? null;
	const homeNo = numberOf(game.homeTeamId);
	const awayNo = numberOf(game.awayTeamId);
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[80] flex items-end justify-center bg-scrim p-4 sm:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "pool-game-title",
			className: "max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold uppercase tracking-wide text-muted",
							children: n != null ? `Game ${n}` : "Game"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							id: "pool-game-title",
							className: "font-display text-2xl font-bold uppercase leading-none",
							children: [
								game.homeName ?? "TBD",
								" vs ",
								game.awayName ?? "TBD"
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						className: "px-2 text-muted",
						onClick: onClose,
						children: "Close"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: [
						game.startDate ? formatKickoff(game.startDate, game.startTime) : formatClock(game.startTime),
						game.locationName ? shortParkName(game.locationName) : "Field not set",
						game.roundLabel
					].filter(Boolean).join(" · ")
				}),
				editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameDetailsForm, {
					game,
					onDone: () => setEditing(false)
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					scored ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-center font-display text-3xl font-bold leading-none",
						children: game.forfeit || game.noContest ? gameResultText(game) : `${game.homeScore ?? "–"} – ${game.awayScore ?? "–"}`
					}) : null,
					onScore ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-3 space-y-2",
						onSubmit: (event) => {
							event.preventDefault();
							if (busy) return;
							const homeText = homeScore.trim();
							const awayText = awayScore.trim();
							const side = forfeit === "home" || forfeit === "away" ? forfeit : null;
							if (!side && (homeText === "" || awayText === "")) {
								setLocalError("Enter both scores.");
								return;
							}
							const home = Number.parseInt(side ? "0" : homeText, 10);
							const away = Number.parseInt(side ? "0" : awayText, 10);
							if (!side && (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0 || home > 99 || away > 99)) {
								setLocalError("Scores need to be whole numbers from 0 to 99.");
								return;
							}
							setLocalError(null);
							Promise.resolve(onScore(game.id, home, away, side)).then(() => onClose(), () => setLocalError(null));
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: scored ? "Update score" : "Score"
							}),
							scored ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: "This score is already in. Saving replaces it."
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 items-end gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "pool-score-home",
									className: "mb-1 flex min-h-10 w-full items-end leading-5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "min-w-0",
										children: game.homeName ?? "Home"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "pool-score-home",
									inputMode: "numeric",
									value: homeScore,
									onChange: (event) => setHomeScore(event.target.value)
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "pool-score-away",
									className: "mb-1 flex min-h-10 w-full items-end leading-5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "min-w-0",
										children: game.awayName ?? "Away"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "pool-score-away",
									inputMode: "numeric",
									value: awayScore,
									onChange: (event) => setAwayScore(event.target.value)
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: forfeit,
								onChange: (event) => setForfeit(event.target.value === "home" || event.target.value === "away" ? event.target.value : ""),
								className: "h-11 w-full rounded-md border border-line bg-bg px-3 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "They played"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
										value: "home",
										children: [game.homeName ?? "Home", " no-show. This game only."]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
										value: "away",
										children: [game.awayName ?? "Away", " no-show. This game only."]
									})
								]
							}),
							localError || error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
								role: "alert",
								children: localError ?? error
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								size: "sm",
								className: "w-full",
								disabled: busy,
								onMouseDown: (event) => event.preventDefault(),
								children: busy ? "Saving…" : scored ? "Update score" : "Save score"
							}),
							scored ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								size: "sm",
								className: "w-full",
								disabled: busy,
								onClick: () => {
									Promise.resolve(onScore(game.id, 0, 0, null, true)).then(() => onClose(), () => void 0);
								},
								children: "Clear score"
							}) : null
						]
					}) : null,
					scored || gameEdit?.locked ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							size: "sm",
							className: "w-full",
							onClick: () => {
								setSwapOpen((open) => !open);
								setSpot(null);
							},
							children: swapOpen ? "Hide teams" : "Swap teams"
						}), swapOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: spot == null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "Which team in this game is moving?"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 space-y-1",
								children: [{
									id: game.homeTeamId,
									name: game.homeName,
									no: homeNo
								}, {
									id: game.awayTeamId,
									name: game.awayName,
									no: awayNo
								}].filter((side) => side.id != null).map((side) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									disabled: busy,
									onClick: () => setSpot(side.id),
									className: "flex w-full items-center gap-3 rounded-md border border-line bg-surface px-3 py-2 text-left text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-primary-fg",
										children: side.no ?? "?"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold",
										children: side.name ?? "Team"
									})]
								}, side.id))
							})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-muted",
									children: [
										"Trade ",
										roster.find((row) => row.id === spot)?.name ?? "that team",
										" with one team. The game stays at this time and field. Times below are where that team already plays."
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "ghost",
									className: "mt-1 px-0 text-sm",
									onClick: () => setSpot(null),
									children: "Pick the other team in this game"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 space-y-1",
									children: roster.filter((team) => team.id !== spot).map((team) => {
										const slots = teamSlots(games, team.id);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											disabled: busy,
											onClick: () => {
												onSwap(game.id, spot, team.id);
												onClose();
											},
											className: "flex w-full items-start gap-3 rounded-md border border-line bg-surface px-3 py-2 text-left text-sm hover:border-fg/40",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-primary-fg",
												children: team.number
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "min-w-0",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "block font-semibold",
														children: team.name
													}),
													pools.size > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "block text-xs text-muted",
														children: ["Pool ", String.fromCharCode(65 + team.pool)]
													}) : null,
													slots.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "block text-xs text-muted",
														children: [
															"Already plays ",
															formatClock(row.startTime),
															row.locationName ? ` at ${shortParkName(row.locationName)}` : ""
														]
													}, row.id))
												]
											})]
										}, team.id);
									})
								})
							] })
						}) : null]
					}),
					gameEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						className: "mt-2 w-full",
						onClick: () => setEditing(true),
						children: "Change time or field"
					}) : null
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamOutActions, { game }),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm",
					role: "alert",
					children: error
				}) : null
			]
		})
	}), document.body);
}
function numbersFor(games) {
	const map = /* @__PURE__ */ new Map();
	for (const game of games) if (game.gameNumber != null) map.set(`${game.round}:${game.slot}`, game.gameNumber);
	return map;
}
function sideCopy(game, side, numbers, feeders = [], softFill = false) {
	const name = side === "home" ? game.homeName : game.awayName;
	const seed = side === "home" ? game.homeSeed : game.awaySeed;
	const fromRound = side === "home" ? game.homeFromRound : game.awayFromRound;
	const fromSlot = side === "home" ? game.homeFromSlot : game.awayFromSlot;
	if (name) return {
		seed,
		text: name
	};
	if (fromRound != null && fromSlot != null) {
		const feeder = feeders.find((row) => row.round === fromRound && row.slot === fromSlot);
		if (feeder?.isBye) {
			const sourceRound = feeder.homeFromRound ?? feeder.awayFromRound;
			const sourceSlot = feeder.homeFromSlot ?? feeder.awayFromSlot;
			if (sourceRound != null && sourceSlot != null) {
				const n = numbers.get(`${sourceRound}:${sourceSlot}`);
				if (n) return {
					seed: null,
					text: `Win G${n}`
				};
			}
			const byeName = feeder.homeName ?? feeder.awayName;
			const byeSeed = feeder.homeSeed ?? feeder.awaySeed ?? null;
			if (byeName) return {
				seed: byeSeed,
				text: byeName
			};
			if (byeSeed != null) return {
				seed: byeSeed,
				text: seedLabel(byeSeed)
			};
			return {
				seed: null,
				text: "Bye"
			};
		}
		const n = numbers.get(`${fromRound}:${fromSlot}`);
		if (n) return {
			seed: null,
			text: `Win G${n}`
		};
		if (feeder?.homeName ?? feeder?.awayName) return {
			seed: null,
			text: `Winner of game`
		};
		const feederSeed = feeder?.homeSeed ?? feeder?.awaySeed ?? null;
		if (softFill && feederSeed != null) return {
			seed: feederSeed,
			text: "TBD"
		};
		return {
			seed: null,
			text: "Winner of game"
		};
	}
	if (seed) return {
		seed,
		text: "TBD"
	};
	return {
		seed: null,
		text: "TBD"
	};
}
function finalWinner(game, numbers, feeders, softFill) {
	if (game.noContest || game.homeScore == null || game.awayScore == null) return null;
	const homeWin = game.forfeit === "away" || game.forfeit !== "home" && game.homeScore > game.awayScore;
	const awayWin = game.forfeit === "home" || game.forfeit !== "away" && game.awayScore > game.homeScore;
	if (!homeWin && !awayWin) return null;
	const copy = sideCopy(game, homeWin ? "home" : "away", numbers, feeders, Boolean(softFill));
	const name = copy.text && copy.text !== "TBD" && copy.text !== "Bye" && !copy.text.startsWith("Win ") && copy.text !== "Winner of game" ? copy.text : homeWin ? game.homeName : game.awayName;
	if (!name) return null;
	return {
		name,
		seed: copy.seed
	};
}
function ChampionPlate({ winner }) {
	if (!winner) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "bracket-champion",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-base font-bold uppercase leading-tight",
			children: "Tournament Champion"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bracket-champion is-crowned",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "bracket-champion-kicker",
			children: "Tournament Champion"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "bracket-champion-name",
			children: [winner.seed != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "bracket-champion-seed",
				children: winner.seed
			}) : null, winner.name]
		})]
	});
}
function ByeCard({ game, numbers, feeders, softFill }) {
	const holder = sideCopy(game, "home", numbers, feeders, Boolean(softFill));
	const waiting = holder.text === "Bye" || holder.text === "TBD";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		className: "line-match",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "bracket-card",
			children: waiting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "bracket-card-meta",
				children: "Bye"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "bracket-card-team is-win",
				children: [
					holder.seed != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "bracket-card-seed",
						children: holder.seed
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "bracket-card-name is-win",
						children: holder.text
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "bracket-card-bye",
						children: "Bye"
					})
				]
			})
		})
	});
}
function LineMatch({ game, numbers, canPickField, future, ghost, feeders, nextNote, onField, onScore, softFill, hideStub }) {
	const home = sideCopy(game, "home", numbers, feeders, Boolean(softFill));
	const away = sideCopy(game, "away", numbers, feeders, Boolean(softFill));
	const place = game.locationName ? shortParkName(game.locationName) : "Field TBD";
	const clock = formatClock(game.startTime);
	const when = game.startDate ? formatKickoff(game.startDate, game.startTime) : clock;
	const gameTag = game.gameNumber != null ? `G${game.gameNumber}` : "";
	const scored = !game.noContest && game.homeScore != null && game.awayScore != null;
	const homeRuns = game.homeScore ?? 0;
	const awayRuns = game.awayScore ?? 0;
	const homeWin = scored && (game.forfeit === "away" || game.forfeit !== "home" && homeRuns > awayRuns);
	const awayWin = scored && (game.forfeit === "home" || game.forfeit !== "away" && awayRuns > homeRuns);
	const meta = [
		gameTag,
		when,
		place,
		game.noContest ? "No contest" : game.forfeit ? "Forfeit" : null
	].filter(Boolean).join(" · ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: cn("line-match", (future || ghost) && "is-future", ghost && "is-ghost", hideStub && "is-elbow-source"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			disabled: ghost || !onScore && !canPickField,
			onClick: () => onScore ? onScore(game) : onField(game),
			className: "bracket-card disabled:cursor-default",
			onPointerDown: (event) => event.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: cn("bracket-card-team", homeWin && "is-win", scored && !homeWin && "is-lose"),
					children: [
						home.seed != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "bracket-card-seed",
							children: home.seed
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("bracket-card-name", scored && !homeWin && "is-behind", homeWin && "is-win"),
							children: home.text
						}),
						scored ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("bracket-card-runs", homeWin && "is-win", !homeWin && "is-behind"),
							children: game.homeScore
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "bracket-card-meta",
					children: meta
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: cn("bracket-card-team", awayWin && "is-win", scored && !awayWin && "is-lose"),
					children: [
						away.seed != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "bracket-card-seed",
							children: away.seed
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("bracket-card-name", scored && !awayWin && "is-behind", awayWin && "is-win"),
							children: away.text
						}),
						scored ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("bracket-card-runs", awayWin && "is-win", !awayWin && "is-behind"),
							children: game.awayScore
						}) : null
					]
				})
			]
		}), nextNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "line-next",
			children: nextNote
		}) : null]
	});
}
function joinPath(ats, cardAt) {
	const y = (n) => Math.round(n * 1e3) / 10;
	const mid = 50;
	if (ats.length >= 2) return `M -6 ${y(ats[0])} H ${mid} V ${y(ats[ats.length - 1])} H -6 M ${mid} ${y(cardAt)} H 106`;
	if (ats.length === 1 && Math.abs(ats[0] - cardAt) > .04) return `M -6 ${y(ats[0])} H ${mid} V ${y(cardAt)} H 106`;
	return `M -6 ${y(cardAt)} H 106`;
}
function LineJoinColumn({ slots, rows }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "line-join-col",
		style: { gridTemplateRows: rows },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "line-join-spacer",
			"aria-hidden": true
		}), slots.map((slot, index) => {
			const ats = (slot.armAts ?? []).slice().sort((a, b) => a - b);
			const cardAt = slot.cardAt ?? .5;
			if (slot.arms <= 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "line-join-cell",
				style: { gridRow: `${slot.rowStart + 1} / span ${slot.rowSpan}` }
			}, `${slot.rowStart}-${index}`);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "line-join-cell",
				style: { gridRow: `${slot.rowStart + 1} / span ${slot.rowSpan}` },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
					className: "line-join-svg",
					viewBox: "0 0 100 100",
					preserveAspectRatio: "none",
					"aria-hidden": true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: joinPath(ats, cardAt),
						fill: "none",
						stroke: "currentColor",
						strokeWidth: "1",
						vectorEffect: "non-scaling-stroke"
					})
				})
			}, `${slot.rowStart}-${index}`);
		})]
	});
}
function weekdayShort(iso) {
	if (!iso) return "";
	const [y, m, d] = iso.split("-").map(Number);
	if (y == null || m == null || d == null) return "";
	return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" });
}
function winnerPlaysNote(game, allGames, onSheet) {
	const next = nextKnockoutGame(game, allGames);
	if (!next || next.isBye) return null;
	if (onSheet.has(`${next.round}:${next.slot}`)) return null;
	return [
		"Winner",
		next.when || [weekdayShort(next.startDate), formatClock(next.startTime)].filter(Boolean).join(" · "),
		next.locationName ? shortParkName(next.locationName) : ""
	].filter(Boolean).join(" · ");
}
function PoolGrid({ games, rosterGames, parks, editable, onField, onAddField, onSwap, onScore, fieldError, busy, softFill, flaggedIds }) {
	const [editGame, setEditGame] = (0, import_react.useState)(null);
	const flagged = new Set(flaggedIds ?? []);
	const numbers = numbersFor(games);
	const playable = games.filter((game) => game.round === "pool" && !game.isBye && (game.homeTeamId != null || game.awayTeamId != null)).slice().sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? "") || (a.locationName ?? "").localeCompare(b.locationName ?? "") || a.slot - b.slot);
	if (playable.length === 0) return null;
	const dated = [...new Set(playable.map((game) => game.startDate).filter((date) => Boolean(date)))].length > 0;
	const times = [...new Set(playable.map((game) => game.startTime).filter((row) => Boolean(row)))].sort();
	const rowKeys = dated ? [...new Set(playable.filter((game) => game.startDate && game.startTime).map((game) => `${game.startDate}|${game.startTime}`))].sort() : times;
	const usedIds = [...new Set(playable.map((game) => game.locationId).filter((id) => id != null))];
	const cols = parks.filter((park) => usedIds.includes(park.id));
	const fields = cols.length > 0 ? cols : parks;
	const byCell = /* @__PURE__ */ new Map();
	for (const game of playable) {
		if (game.locationId == null || !game.startTime) continue;
		byCell.set(`${game.locationId}|${dated ? game.startDate : ""}|${game.startTime}`, game);
	}
	const roster = poolRoster(rosterGames ?? games);
	function numberOf(id) {
		return roster.find((row) => row.id === id)?.number ?? null;
	}
	function teamLabel(game, side) {
		const name = side === "home" ? game.homeName : game.awayName;
		if (name) return name;
		return "TBD";
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pool-sheet mb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: editable ? "Tap a game to score it. With more than two fields, swipe sideways. Team numbers still trade slots." : "Pool games at this park."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("pool-grid-wrap mt-4", fields.length > 2 && "is-wide", dated && "is-dated"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "pool-grid",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pool-grid-time",
						children: "Time"
					}), fields.map((park) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: shortParkName(park.name) }, park.id))] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rowKeys.map((key) => {
						const [rowDate, rowTime] = dated ? key.split("|") : ["", key];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
							className: "pool-grid-time",
							children: [rowDate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-[10px] font-semibold leading-none",
								children: formatDayTab(rowDate)
							}) : null, formatClock(rowTime)]
						}), fields.map((park) => {
							const game = byCell.get(`${park.id}|${dated ? rowDate : ""}|${rowTime}`);
							if (!game) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "pool-grid-empty",
								children: "—"
							}, park.id);
							const result = game.forfeit || game.noContest ? gameResultText(game) : null;
							const scored = !result && game.homeScore != null && game.awayScore != null;
							const homeRuns = game.homeScore ?? -1;
							const awayRuns = game.awayScore ?? -1;
							const homeLeads = scored && (game.forfeit === "away" || game.forfeit !== "home" && homeRuns > awayRuns);
							const awayLeads = scored && (game.forfeit === "home" || game.forfeit !== "away" && awayRuns > homeRuns);
							const sides = [{
								key: "home",
								no: numberOf(game.homeTeamId),
								name: teamLabel(game, "home"),
								score: game.homeScore,
								win: homeLeads
							}, {
								key: "away",
								no: numberOf(game.awayTeamId),
								name: teamLabel(game, "away"),
								score: game.awayScore,
								win: awayLeads
							}];
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								disabled: !editable,
								onPointerDown: (event) => event.stopPropagation(),
								onClick: () => setEditGame(game),
								className: cn("pool-grid-cell disabled:cursor-default", flagged.has(game.id) && "is-flagged"),
								children: [sides.map((side) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "pool-grid-side",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "pool-grid-no",
											children: side.no ?? "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("pool-grid-name", scored && !side.win && "is-behind", side.win && "is-win"),
											children: side.name
										}),
										scored ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("pool-grid-runs", side.win && "is-win"),
											children: side.score
										}) : null
									]
								}, side.key)), result ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block px-1 pb-1 text-[10px] font-bold uppercase",
									children: result
								}) : null]
							}) }, park.id);
						})] }, key);
					}) })]
				})
			}),
			editGame && (onSwap || onScore) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PoolGameDialog, {
				game: games.find((row) => row.id === editGame.id) ?? games.find((row) => row.round === editGame.round && row.slot === editGame.slot && row.homeTeamId === editGame.homeTeamId && row.awayTeamId === editGame.awayTeamId) ?? editGame,
				games: rosterGames ?? games,
				numbers,
				busy,
				error: fieldError,
				onClose: () => setEditGame(null),
				onSwap: onSwap ?? (() => void 0),
				onScore
			}) : editGame ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldDialog, {
				parks,
				currentId: editGame.locationId,
				busy,
				error: fieldError,
				onClose: () => setEditGame(null),
				onPick: (locationId) => {
					onField(editGame.id, locationId);
					setEditGame(null);
				},
				onAdd: ({ name, address }) => {
					onAddField(editGame.id, name, address);
					setEditGame(null);
				}
			}) : null
		]
	});
}
function LineBracketTree({ layout, numbers, editable, asOfDate, liveRound, allGames, playIns, firstRound, showChampion, onField, onScore, softFill }) {
	if (layout.rounds.length === 0) return null;
	const rows = `1.75rem repeat(${Math.max(layout.rowCount, 1)}, 7.15rem)`;
	const lastRound = layout.rounds[layout.rounds.length - 1];
	const hasChampion = showChampion && lastRound?.round === "f" && lastRound.slots.some((slot) => slot.game != null && !slot.ghost && !slot.game.isBye);
	const finalSlot = hasChampion ? lastRound?.slots.find((slot) => slot.game != null && !slot.ghost && !slot.game.isBye) ?? null : null;
	const onSheet = new Set(layout.rounds.flatMap((section) => section.slots.flatMap((slot) => slot.game ? [`${slot.game.round}:${slot.game.slot}`] : [])));
	const futureOpts = {
		date: asOfDate,
		liveRound
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "line-bracket mt-6",
		children: [layout.rounds.map((section, index) => {
			const next = layout.rounds[index + 1];
			const isLast = !next;
			const playable = section.slots.filter((slot) => slot.game && !slot.game.isBye);
			const roundFuture = playable.length > 0 && playable.every((slot) => slot.game != null && isFutureSiteGame(slot.game, futureOpts));
			const roundId = section.round;
			const title = !isRoundId(roundId) ? isLast ? "Finals" : `Round ${index + 1}` : roundId === "f" ? "Finals" : treeRoundLabel(roundId, firstRound ?? roundId, playIns);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: cn("line-round", roundFuture && "is-future"),
					style: { gridTemplateRows: rows },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "bracket-round-title",
						children: title
					}), section.slots.map((slot, slotIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "line-slot",
						style: {
							gridRow: `${slot.rowStart + 1} / span ${slot.rowSpan}`,
							["--card-at"]: String(slot.cardAt ?? .5)
						},
						children: slot.game == null || playIns && firstRound != null && section.round === firstRound && slot.game.isBye ? null : slot.game.isBye ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ByeCard, {
							game: slot.game,
							numbers,
							feeders: allGames,
							softFill
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineMatch, {
							game: slot.game,
							numbers,
							canPickField: editable && !slot.ghost,
							future: isFutureSiteGame(slot.game, futureOpts),
							ghost: slot.ghost,
							feeders: allGames,
							nextNote: isLast && !slot.ghost ? winnerPlaysNote(slot.game, allGames, onSheet) : null,
							onField,
							onScore,
							softFill,
							hideStub: Boolean(playIns && firstRound != null && slot.game.round === firstRound && allGames.some((row) => {
								if (!(row.homeFromRound === slot.game?.round && row.homeFromSlot === slot.game.slot || row.awayFromRound === slot.game?.round && row.awayFromSlot === slot.game.slot) || !slot.game) return false;
								const other = row.homeFromRound === slot.game.round && row.homeFromSlot === slot.game.slot ? allGames.find((game) => game.round === row.awayFromRound && game.slot === row.awayFromSlot) : allGames.find((game) => game.round === row.homeFromRound && game.slot === row.homeFromSlot);
								return Boolean(other?.isBye);
							}))
						})
					}, slot.game ? `${slot.game.round}-${slot.game.slot}-${slot.game.id ?? "x"}` : `empty-${section.round}-${slotIndex}`))]
				}),
				next ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineJoinColumn, {
					slots: next.slots,
					rows
				}) : null,
				isLast && hasChampion && finalSlot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineJoinColumn, {
					slots: [{
						rowStart: finalSlot.rowStart,
						rowSpan: finalSlot.rowSpan,
						arms: 1,
						armSpans: [],
						cardAt: finalSlot.cardAt
					}],
					rows
				}) : null
			] }, section.round);
		}), hasChampion && finalSlot ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "line-round",
			style: { gridTemplateRows: rows },
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "bracket-round-title",
				children: "Champion"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "line-slot",
				style: {
					gridRow: `${finalSlot.rowStart + 1} / span ${finalSlot.rowSpan}`,
					["--card-at"]: String(finalSlot.cardAt ?? .5)
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChampionPlate, { winner: finalSlot.game ? finalWinner(finalSlot.game, numbers, allGames, softFill) : null })
			})]
		}) : null]
	});
}
function SiteBoard({ games, parks, playIns, firstRound, asOfDate, liveRound, allGames, editable, onField, onAddField, fieldError, busy, softFill, flaggedIds, onSwap, onScore, onPostScore }) {
	const [fieldGame, setFieldGame] = (0, import_react.useState)(null);
	const numbers = numbersFor(allGames.length > 0 ? allGames : games);
	const poolGames = games.filter((game) => game.round === "pool" && !game.isBye);
	const layout = layoutSiteBracket(games, allGames);
	const hasKnockoutTree = layout.rounds.length > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "site-sheet mb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: poolGames.length > 0 && hasKnockoutTree ? "Pool play is the block schedule. Bracket games join into this park’s last game today." : hasKnockoutTree ? "Names sit on a line. Two games join into one, left to right, down to the championship." : null
			}),
			poolGames.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PoolGrid, {
				games: poolGames,
				rosterGames: allGames.filter((game) => game.round === "pool"),
				parks,
				editable,
				busy,
				fieldError,
				onField,
				onAddField,
				softFill,
				flaggedIds,
				onSwap,
				onScore: onPostScore
			}) : null,
			hasKnockoutTree ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineBracketTree, {
				layout,
				numbers,
				editable,
				asOfDate,
				liveRound,
				allGames,
				playIns,
				firstRound,
				showChampion: true,
				onField: setFieldGame,
				onScore,
				softFill
			}) : null,
			fieldGame ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldDialog, {
				parks,
				currentId: fieldGame.locationId,
				busy,
				error: fieldError,
				onClose: () => setFieldGame(null),
				onPick: (locationId) => {
					onField(fieldGame.id, locationId);
					setFieldGame(null);
				},
				onAdd: ({ name, address }) => {
					onAddField(fieldGame.id, name, address);
					setFieldGame(null);
				}
			}) : null
		]
	});
}
function ScoreDialog({ games, busy, error, onClose, onSave }) {
	const playable = games.filter((game) => !game.isBye && (game.homeTeamId != null || game.awayTeamId != null || game.round !== "pool"));
	const [gameId, setGameId] = (0, import_react.useState)(playable[0]?.id ?? 0);
	const current = playable.find((game) => game.id === gameId) ?? playable[0] ?? null;
	const [home, setHome] = (0, import_react.useState)(current?.homeScore != null ? String(current.homeScore) : "");
	const [away, setAway] = (0, import_react.useState)(current?.awayScore != null ? String(current.awayScore) : "");
	const [forfeit, setForfeit] = (0, import_react.useState)("");
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [formError, setFormError] = (0, import_react.useState)(null);
	const gameEdit = useGameEdit();
	function pick(id) {
		const game = playable.find((row) => row.id === id);
		setGameId(id);
		setHome(game?.homeScore != null ? String(game.homeScore) : "");
		setAway(game?.awayScore != null ? String(game.awayScore) : "");
		setForfeit(game?.forfeit === "home" || game?.forfeit === "away" ? game.forfeit : "");
	}
	function submit(event) {
		event.preventDefault();
		if (!current || busy) return;
		const side = forfeit === "home" || forfeit === "away" ? forfeit : null;
		const homeText = home.trim();
		const awayText = away.trim();
		if (!side && (homeText === "" || awayText === "")) {
			setFormError("Enter both scores.");
			return;
		}
		const homeN = Number.parseInt(side ? "0" : homeText, 10);
		const awayN = Number.parseInt(side ? "0" : awayText, 10);
		if (!side && (!Number.isInteger(homeN) || !Number.isInteger(awayN) || homeN < 0 || awayN < 0 || homeN > 99 || awayN > 99)) {
			setFormError("Scores need to be whole numbers from 0 to 99.");
			return;
		}
		setFormError(null);
		onSave(current.id, homeN, awayN, side);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-scrim p-4 sm:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "score-dialog-title",
			className: "w-full max-w-md rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					id: "score-dialog-title",
					className: "font-display text-2xl font-bold uppercase",
					children: editing ? "Edit game" : "Post score"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					className: "px-2 text-muted",
					onClick: onClose,
					children: "Close"
				})]
			}), playable.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: "No games ready for a score yet."
			}) : editing && current && gameEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameDetailsForm, {
				game: current,
				onDone: () => setEditing(false)
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				noValidate: true,
				onSubmit: submit,
				className: "mt-3 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Game" }),
							playable.length === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm font-semibold",
								children: [
									current?.gameNumber != null ? `G${current.gameNumber} · ` : "",
									current?.homeName ?? "TBD",
									" vs ",
									current?.awayName ?? "TBD"
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								id: "score-game",
								value: String(current?.id ?? ""),
								onChange: (e) => pick(Number.parseInt(e.target.value, 10)),
								className: "h-11 w-full rounded-md border border-line bg-bg px-3 text-sm",
								children: playable.map((game) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: game.id,
									children: [
										game.gameNumber != null ? `G${game.gameNumber} · ` : "",
										game.homeName ?? "TBD",
										" vs ",
										game.awayName ?? "TBD"
									]
								}, game.id))
							}),
							current?.when ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted",
								children: [current.when, current.locationName ? ` · ${current.locationName}` : ""]
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 items-end gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "score-home",
							className: "mb-1 flex min-h-10 w-full items-end leading-5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0",
								children: current?.homeName ?? "Home"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "score-home",
							inputMode: "numeric",
							value: home,
							onChange: (e) => setHome(e.target.value)
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "score-away",
							className: "mb-1 flex min-h-10 w-full items-end leading-5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0",
								children: current?.awayName ?? "Away"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "score-away",
							inputMode: "numeric",
							value: away,
							onChange: (e) => setAway(e.target.value)
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "score-forfeit",
							children: "No-show"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							id: "score-forfeit",
							value: forfeit,
							onChange: (e) => setForfeit(e.target.value === "home" || e.target.value === "away" ? e.target.value : ""),
							className: "h-11 w-full rounded-md border border-line bg-bg px-3 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "They played"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: "home",
									children: [current?.homeName ?? "Home", " no-show. This game only."]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: "away",
									children: [current?.awayName ?? "Away", " no-show. This game only."]
								})
							]
						})]
					}),
					formError || error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
						role: "alert",
						children: formError ?? error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						disabled: busy || !current,
						onMouseDown: (event) => event.preventDefault(),
						children: busy ? "Saving…" : current?.homeScore != null || current?.awayScore != null ? "Update score" : "Save score"
					}),
					current && (current.homeScore != null || current.awayScore != null || current.forfeit || current.noContest) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						className: "w-full",
						disabled: busy,
						onClick: () => onSave(current.id, 0, 0, null, true),
						children: "Clear score"
					}) : null,
					gameEdit && current ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						className: "w-full",
						onClick: () => setEditing(true),
						children: "Edit time or park"
					}) : null
				]
			}), current ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamOutActions, { game: current }) : null] })]
		})
	});
}
var MIN_SCALE = .04;
var MAX_SCALE = 2.8;
function clamp(n, lo, hi) {
	return Math.min(hi, Math.max(lo, n));
}
function SheetZoom({ children, className, resetKey }) {
	const viewportRef = (0, import_react.useRef)(null);
	const contentRef = (0, import_react.useRef)(null);
	const [scale, setScale] = (0, import_react.useState)(1);
	const [tx, setTx] = (0, import_react.useState)(0);
	const [ty, setTy] = (0, import_react.useState)(0);
	const fitRef = (0, import_react.useRef)(true);
	const drag = (0, import_react.useRef)(null);
	const pinch = (0, import_react.useRef)(null);
	const pointers = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	const measure = (0, import_react.useCallback)(() => {
		const el = contentRef.current;
		if (!el) return {
			sw: 1,
			sh: 1
		};
		const child = el.firstElementChild;
		return {
			sw: Math.max(el.scrollWidth, el.offsetWidth, child?.scrollWidth ?? 0, child?.offsetWidth ?? 0, 1),
			sh: Math.max(el.scrollHeight, el.offsetHeight, child?.scrollHeight ?? 0, child?.offsetHeight ?? 0, 1)
		};
	}, []);
	const clampPan = (0, import_react.useCallback)((nextTx, nextTy, nextScale) => {
		const vp = viewportRef.current;
		const { sw, sh } = measure();
		if (!vp) return {
			tx: nextTx,
			ty: nextTy
		};
		const pad = 10;
		const vw = vp.clientWidth;
		const vh = vp.clientHeight;
		const cw = sw * nextScale;
		const ch = sh * nextScale;
		const maxTx = pad;
		const minTx = cw + 20 <= vw ? Math.max((vw - cw) / 2, pad) : vw - cw - pad;
		const maxTy = pad;
		const minTy = ch + 20 <= vh ? pad : vh - ch - pad;
		return {
			tx: clamp(nextTx, Math.min(minTx, maxTx), Math.max(minTx, maxTx)),
			ty: clamp(nextTy, Math.min(minTy, maxTy), Math.max(minTy, maxTy))
		};
	}, [measure]);
	const fit = (0, import_react.useCallback)(() => {
		const vp = viewportRef.current;
		const el = contentRef.current;
		if (!vp || !el) return;
		const { sw, sh } = measure();
		const pad = 10;
		const vw = Math.max(vp.clientWidth - 20, 1);
		const vh = Math.max(vp.clientHeight - 20, 1);
		const landscape = window.matchMedia("(orientation: landscape)").matches;
		const pool = el.querySelector(".pool-sheet");
		const round = el.querySelector(".line-round");
		let next = clamp(vw / (pool && pool.offsetWidth > 80 ? pool.offsetWidth : round && round.offsetWidth > 80 ? round.offsetWidth + 16 : Math.min(sw, vw)), MIN_SCALE, 1);
		if (landscape) next = clamp(Math.min(next, vh / Math.max(pool?.offsetHeight || sh, 1)), MIN_SCALE, 1);
		if (next > .92) next = 1;
		const originX = Math.max((vp.clientWidth - sw * next) / 2, pad);
		const pan = clampPan(originX, pad, next);
		setScale(next);
		setTx(pan.tx);
		setTy(pan.ty);
		fitRef.current = true;
	}, [clampPan, measure]);
	(0, import_react.useEffect)(() => {
		fitRef.current = true;
		let frames = 0;
		let raf = 0;
		const tick = () => {
			fit();
			frames += 1;
			if (frames < 4) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		const extra = window.setTimeout(fit, 180);
		const mq = window.matchMedia("(orientation: landscape)");
		const onOrient = () => {
			fitRef.current = true;
			fit();
		};
		mq.addEventListener("change", onOrient);
		return () => {
			cancelAnimationFrame(raf);
			window.clearTimeout(extra);
			mq.removeEventListener("change", onOrient);
		};
	}, [fit, resetKey]);
	(0, import_react.useEffect)(() => {
		const vp = viewportRef.current;
		const el = contentRef.current;
		if (!vp || !el) return;
		const ro = new ResizeObserver(() => {
			if (fitRef.current) fit();
		});
		ro.observe(vp);
		ro.observe(el);
		if (el.firstElementChild) ro.observe(el.firstElementChild);
		return () => ro.disconnect();
	}, [fit, resetKey]);
	function zoomBy(factor, cx, cy) {
		const vp = viewportRef.current;
		if (!vp) return;
		fitRef.current = false;
		const rect = vp.getBoundingClientRect();
		const px = cx == null ? rect.width / 2 : cx - rect.left;
		const py = cy == null ? rect.height / 2 : cy - rect.top;
		setScale((current) => {
			const next = clamp(current * factor, MIN_SCALE, MAX_SCALE);
			const ratio = next / current;
			const pan = clampPan(px - (px - tx) * ratio, py - (py - ty) * ratio, next);
			setTx(pan.tx);
			setTy(pan.ty);
			return next;
		});
	}
	function onPointerDown(event) {
		const hit = event.target;
		if (hit?.closest("input, select, textarea, [role='dialog']")) return;
		const tap = hit?.closest("button, a");
		if (tap) event.preventDefault();
		pointers.current.set(event.pointerId, {
			x: event.clientX,
			y: event.clientY
		});
		if (pointers.current.size === 1) {
			drag.current = {
				id: event.pointerId,
				x: event.clientX,
				y: event.clientY,
				tx,
				ty,
				moved: false,
				tap
			};
			event.currentTarget.setPointerCapture(event.pointerId);
		} else if (pointers.current.size === 2) {
			const pts = [...pointers.current.values()];
			const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
			const vp = viewportRef.current?.getBoundingClientRect();
			pinch.current = {
				dist: Math.max(dist, 1),
				scale,
				tx,
				ty,
				cx: vp ? (pts[0].x + pts[1].x) / 2 - vp.left : 0,
				cy: vp ? (pts[0].y + pts[1].y) / 2 - vp.top : 0
			};
			drag.current = null;
		}
	}
	function onPointerMove(event) {
		if (pointers.current.has(event.pointerId)) pointers.current.set(event.pointerId, {
			x: event.clientX,
			y: event.clientY
		});
		if (pinch.current && pointers.current.size >= 2) {
			const pts = [...pointers.current.values()];
			const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
			const next = clamp(pinch.current.scale * (dist / pinch.current.dist), MIN_SCALE, MAX_SCALE);
			const ratio = next / pinch.current.scale;
			fitRef.current = false;
			setScale(next);
			const pan = clampPan(pinch.current.cx - (pinch.current.cx - pinch.current.tx) * ratio, pinch.current.cy - (pinch.current.cy - pinch.current.ty) * ratio, next);
			setTx(pan.tx);
			setTy(pan.ty);
			return;
		}
		const d = drag.current;
		if (!d || event.pointerId !== d.id) return;
		const dx = event.clientX - d.x;
		const dy = event.clientY - d.y;
		if (!d.moved && Math.hypot(dx, dy) < 8) return;
		d.moved = true;
		fitRef.current = false;
		const pan = clampPan(d.tx + dx, d.ty + dy, scale);
		setTx(pan.tx);
		setTy(pan.ty);
	}
	function onPointerUp(event) {
		const d = drag.current;
		if (d?.id === event.pointerId && !d.moved && d.tap) d.tap.click();
		pointers.current.delete(event.pointerId);
		if (drag.current?.id === event.pointerId) drag.current = null;
		if (pointers.current.size < 2) pinch.current = null;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex min-h-0 flex-1 flex-col", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: viewportRef,
			className: "sheet-zoom-view",
			onPointerDown,
			onPointerMove,
			onPointerUp,
			onPointerCancel: onPointerUp,
			onWheel: (event) => {
				if (!event.ctrlKey && !event.metaKey) {
					event.preventDefault();
					fitRef.current = false;
					const pan = clampPan(tx - event.deltaX, ty - event.deltaY, scale);
					setTx(pan.tx);
					setTy(pan.ty);
					return;
				}
				event.preventDefault();
				zoomBy(event.deltaY < 0 ? 1.12 : 1 / 1.12, event.clientX, event.clientY);
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: contentRef,
				className: "sheet-zoom-inner",
				style: { transform: scale === 1 ? `translate(${Math.round(tx)}px, ${Math.round(ty)}px)` : `translate(${tx}px, ${ty}px) scale(${scale})` },
				children
			})
		})
	});
}
var Route$12 = createFileRoute("/bracket/$weekendId")({ component: BracketPage });
function CoachBracketWait({ name, startDate, endDate, ages, teamsIn, teamsNeeded }) {
	const ready = teamsIn >= teamsNeeded;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-4 mt-6 overflow-hidden rounded-lg border border-line bg-surface shadow-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-[#1c1c1c] px-4 py-5 text-white",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.2em] text-[#f5c518]",
						children: "You're in"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-3xl font-bold uppercase leading-none",
						children: name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-white/75",
						children: formatWeekendRange(startDate, endDate)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 px-4 pt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-md bg-[#f6f1e4] px-3 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-bold uppercase tracking-wide text-muted",
						children: "Age"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-display text-2xl font-bold leading-none",
						children: ages.length > 0 ? ages.join(" · ") : "Set"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-md bg-[#f6f1e4] px-3 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-bold uppercase tracking-wide text-muted",
						children: "Teams in"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-display text-2xl font-bold leading-none",
						children: teamsIn
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-4 py-4 text-sm leading-relaxed",
				children: ready ? "Enough teams are in. Pool play, standings, and the bracket will show on this page as soon as they are drawn." : `The bracket is drawn once ${teamsNeeded} teams are in, so every club has a real path through pool play. Your team is already on the list.`
			})
		]
	});
}
function daysFor(weekend, games = []) {
	const usedDates = new Set(games.map((game) => game.startDate).filter((date) => Boolean(date)));
	const plan = parseDayPlan(weekend.dayPlan, weekend.startDate, weekend.endDate, weekend.poolPlay);
	const seen = new Set(plan.map((row) => row.date));
	const extra = [];
	for (const game of games) {
		if (!game.startDate || seen.has(game.startDate)) continue;
		if (game.startDate < weekend.startDate || game.startDate > weekend.endDate) continue;
		seen.add(game.startDate);
		extra.push({
			date: game.startDate,
			kind: "bracket"
		});
	}
	const days = [...plan, ...extra].sort((a, b) => a.date.localeCompare(b.date));
	if (usedDates.size === 0) return days;
	const kept = days.filter((row) => usedDates.has(row.date));
	return kept.length > 0 ? kept : days;
}
function firstPlayableRound(games) {
	return ROUND_IDS.find((round) => games.some((game) => game.round === round)) ?? null;
}
function standingColumns(tiebreakers) {
	const columns = [];
	for (const key of tiebreakers) if (key === "record") columns.push({
		key: "wins",
		label: "W"
	}, {
		key: "losses",
		label: "L"
	});
	else if (key === "runs-scored") columns.push({
		key: "rs",
		label: "RF"
	});
	else if (key === "run-diff") columns.push({
		key: "rd",
		label: "RD"
	});
	else if (key === "runs-allowed") columns.push({
		key: "ra",
		label: "RA"
	});
	return columns;
}
function standingValue(row, key) {
	if (key !== "rd") return String(row[key]);
	if (row.rd > 0) return `+${row.rd}`;
	return String(row.rd);
}
function poolResults(games) {
	return games.flatMap((game) => game.homeTeamId != null && game.awayTeamId != null ? [{
		homeTeamId: game.homeTeamId,
		awayTeamId: game.awayTeamId,
		homeScore: game.homeScore,
		awayScore: game.awayScore,
		forfeit: game.forfeit
	}] : []);
}
function StandingsTable({ age, tiebreakers, seedOnePlaysLast }) {
	const poolGames = age.games.filter((game) => game.round === "pool" && !game.isBye);
	const names = /* @__PURE__ */ new Map();
	const teamIds = [];
	for (const seed of [...age.seeds].sort((a, b) => a.seed - b.seed)) {
		if (seed.teamId == null || teamIds.includes(seed.teamId)) continue;
		teamIds.push(seed.teamId);
		if (seed.teamName) names.set(seed.teamId, seed.teamName);
	}
	for (const game of poolGames) {
		const sides = [[game.homeTeamId, game.homeName], [game.awayTeamId, game.awayName]];
		for (const [id, name] of sides) {
			if (id == null) continue;
			if (!teamIds.includes(id)) teamIds.push(id);
			if (name) names.set(id, name);
		}
	}
	const rows = poolStandings(teamIds, poolResults(poolGames), tiebreakers);
	const columns = standingColumns(tiebreakers);
	const done = poolGames.length > 0 && poolGames.every((game) => game.homeScore != null && game.awayScore != null || game.forfeit || game.noContest);
	const [rulesOpen, setRulesOpen] = (0, import_react.useState)(false);
	const rules = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: done ? "Pool is finished. This order is the bracket seed." : "This order is not locked yet. It becomes the bracket seed when every pool game has a score."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "mt-3 list-decimal space-y-1 pl-5 text-sm",
			children: tiebreakers.map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: TIEBREAKER_LABELS[key] }, key))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-muted",
			children: seedOnePlaysLast ? "In the bracket, seed 1 plays the last seed and seed 2 plays the next. The better seed is home." : "In the bracket, seeds play in order. The better seed is home."
		})
	] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => setRulesOpen(true),
			className: "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold normal-case tracking-normal text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex h-3.5 w-3.5 items-center justify-center rounded-full border border-current text-[9px] font-bold leading-none",
				children: "i"
			}), "Seeding rules"]
		}),
		rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm text-muted",
			children: "No teams in pool play yet."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm text-muted",
			children: done ? "Seed order after pool play." : "Seeds lock when every pool game has a score."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "mt-4 w-full border-collapse text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-b border-line text-left text-[10px] font-bold uppercase tracking-wide text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "py-2 pr-3",
						children: "Seed"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "py-2 pr-3",
						children: "Team"
					}),
					columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "min-w-11 py-2 pl-4 text-right tabular-nums",
						children: column.label
					}, column.key))
				]
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-b border-line",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-2 pr-3 font-bold",
						children: row.place
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-2 pr-3 font-semibold",
						children: names.get(row.teamId) ?? "Team"
					}),
					columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-2 pl-4 text-right tabular-nums",
						children: standingValue(row, column.key)
					}, column.key))
				]
			}, row.teamId)) })]
		})] }),
		rulesOpen && typeof document !== "undefined" ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-[80] flex items-center justify-center bg-scrim p-4",
			onClick: () => setRulesOpen(false),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				role: "dialog",
				"aria-modal": "true",
				"aria-labelledby": "seeding-rules-title",
				className: "max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
				onClick: (event) => event.stopPropagation(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						id: "seeding-rules-title",
						className: "font-display text-2xl font-bold uppercase",
						children: "Seeding rules"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						className: "px-2 text-muted",
						onClick: () => setRulesOpen(false),
						children: "Close"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3",
					children: rules
				})]
			})
		}), document.body) : null
	] });
}
function BracketPage() {
	const { weekendId } = Route$12.useParams();
	const id = Number.parseInt(weekendId, 10);
	const { user, isPending, profile } = useAppSession();
	const queryClient = useQueryClient();
	const [ageGroup, setAgeGroup] = (0, import_react.useState)(null);
	const [view, setView] = (0, import_react.useState)(null);
	const [scoreGame, setScoreGame] = (0, import_react.useState)(null);
	const [warnOpen, setWarnOpen] = (0, import_react.useState)(true);
	const [focusWarning, setFocusWarning] = (0, import_react.useState)(null);
	const scheduleQuery = useQuery({
		queryKey: ["schedule", id],
		queryFn: () => getWeekendSchedule({ data: { weekendId: id } }),
		enabled: Boolean(user && profile && Number.isInteger(id) && id > 0)
	});
	const fieldMut = useMutation({
		mutationFn: (input) => setGameField({ data: input }),
		onSuccess: (data) => queryClient.setQueryData(["schedule", id], data)
	});
	const addFieldMut = useMutation({
		mutationFn: (input) => addFieldToGame({ data: input }),
		onSuccess: (data) => {
			queryClient.setQueryData(["schedule", id], data);
			queryClient.invalidateQueries({ queryKey: ["weekend", id] });
			queryClient.invalidateQueries({ queryKey: ["weekends"] });
		}
	});
	const swapMut = useMutation({
		mutationFn: (input) => swapPoolTeams({ data: input }),
		onSuccess: (data) => queryClient.setQueryData(["schedule", id], data)
	});
	const lockMut = useMutation({
		mutationFn: (locked) => setSundaySeedsLocked({ data: {
			weekendId: id,
			locked
		} }),
		onSuccess: (data) => queryClient.setQueryData(["schedule", id], data)
	});
	const scoreMut = useMutation({
		mutationFn: (input) => postGameScore({ data: input }),
		onSuccess: (data) => {
			queryClient.setQueryData(["schedule", id], data);
			setScoreGame(null);
		}
	});
	const sheetLockMut = useMutation({
		mutationFn: (lock) => setSheetLock({ data: {
			weekendId: id,
			lock
		} }),
		onSuccess: (data) => {
			queryClient.setQueryData(["schedule", id], data);
		}
	});
	const pushMut = useMutation({
		mutationFn: () => pushPublicSheet({ data: { weekendId: id } }),
		onSuccess: (data) => queryClient.setQueryData(["schedule", id], data)
	});
	const pullMut = useMutation({
		mutationFn: (teamId) => pullTeam({ data: { teamId } }),
		onSuccess: (data) => {
			queryClient.setQueryData(["schedule", id], data);
			setScoreGame(null);
		}
	});
	const replaceMut = useMutation({
		mutationFn: (input) => replaceTeamSlot({ data: input }),
		onSuccess: (data) => {
			queryClient.setQueryData(["schedule", id], data);
			setScoreGame(null);
		}
	});
	const editMut = useMutation({
		mutationFn: (input) => updateGameDetails({ data: input }),
		onSuccess: (data) => {
			queryClient.setQueryData(["schedule", id], data);
			setScoreGame((current) => {
				if (!current) return current;
				return data.ages.flatMap((age) => age.games).find((game) => game.id === current.id) ?? current;
			});
		}
	});
	const rainMut = useMutation({
		mutationFn: (input) => markRainout({ data: input }),
		onSuccess: (data) => {
			queryClient.setQueryData(["schedule", id], data);
		}
	});
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionSkeleton, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	if (!Number.isInteger(id) || id < 1) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	const schedule = scheduleQuery.data;
	const editable = profile.homeRole === "admin";
	const ages = schedule?.ages ?? [];
	const activeAge = ages.find((age) => age.ageGroup === ageGroup) ?? ages.find((age) => age.teamCount >= age.minTeams) ?? ages[0] ?? null;
	const flaggedIds = activeAge ? [...new Set(activeAge.warnings.filter((row) => focusWarning == null || row.id === focusWarning).flatMap((row) => row.gameIds ?? (row.gameId != null ? [row.gameId] : [])))] : [];
	const poolOn = Boolean(activeAge?.poolPlay);
	const poolGames = activeAge ? activeAge.games.filter((game) => game.round === "pool" && !game.isBye) : [];
	const bracketGames = activeAge ? activeAge.games.filter((game) => game.round !== "pool") : [];
	const poolDone = poolGames.length > 0 && poolGames.every((game) => game.homeScore != null && game.awayScore != null || game.forfeit || game.noContest);
	const activeView = !poolOn ? "bracket" : view ?? (poolDone ? "bracket" : "pool");
	const sheetDate = schedule?.weekend.endDate ?? "";
	const days = schedule ? daysFor(schedule.weekend, schedule.ages.flatMap((age) => age.games)) : [];
	const fieldBusy = fieldMut.isPending || addFieldMut.isPending || swapMut.isPending || scoreMut.isPending;
	const fieldError = fieldMut.error instanceof Error ? fieldMut.error.message : addFieldMut.error instanceof Error ? addFieldMut.error.message : swapMut.error instanceof Error ? swapMut.error.message : null;
	const gameEdit = editable && schedule ? {
		parks: schedule.locations,
		days: days.map((row) => ({
			date: row.date,
			label: formatDayTab(row.date)
		})),
		blocksFor: (date) => startBlocks(date, schedule.weekend.dayPlan.map((row) => row.date), schedule.weekend.rules),
		busy: editMut.isPending || pullMut.isPending || replaceMut.isPending,
		save: async (input) => {
			await editMut.mutateAsync(input);
		},
		locked: schedule.weekend.sheetLocked,
		beforeFirstPitch: schedule.weekend.beforeFirstPitch,
		pullOut: async (teamId) => {
			await pullMut.mutateAsync(teamId);
		},
		replaceTeam: async (teamId, name) => {
			await replaceMut.mutateAsync({
				teamId,
				name
			});
		}
	} : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameEditProvider, {
		value: gameEdit,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet flex min-h-dvh flex-col bg-bg text-fg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
					className: "sticky top-0 z-10 bg-[#1c1c1c] px-3 py-2 text-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/weekends/$weekendId",
							params: { weekendId: String(id) },
							className: "shrink-0 text-xs font-semibold text-white underline-offset-4 hover:underline",
							children: ["← ", schedule?.weekend.name ?? "Tournament"]
						}), ages.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "ml-auto flex flex-wrap justify-end gap-1",
							children: ages.map((age) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setAgeGroup(age.ageGroup),
								className: cn("sheet-chip", (activeAge?.ageGroup ?? "") === age.ageGroup && "sheet-chip-on"),
								children: age.ageGroup
							}, age.ageGroup))
						}) : activeAge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ml-auto text-[10px] font-bold uppercase tracking-wide text-white/70",
							children: activeAge.ageGroup
						}) : null]
					})
				}),
				scheduleQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-4 py-5 text-sm text-muted",
					children: "Building the bracket…"
				}) : !schedule ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mx-4 mt-4 rounded-md bg-warn-bg px-3 py-2 text-sm",
					role: "alert",
					children: scheduleQuery.error instanceof Error ? scheduleQuery.error.message : "Could not load that bracket."
				}) : schedule.weekend.lifecycle === "announced" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mx-4 mt-4 rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted",
					children: "Dates only. Brackets aren’t built for this weekend yet."
				}) : !activeAge || !activeAge.hasBracket && activeAge.teamCount < 2 ? editable ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mx-4 mt-4 rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted",
					children: ["The bracket is the size you set. Open slots stay TBD until a team is approved.", activeAge ? ` ${activeAge.teamCount} in.` : ""]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachBracketWait, {
					name: schedule.weekend.name,
					startDate: schedule.weekend.startDate,
					endDate: schedule.weekend.endDate,
					ages: schedule.weekend.ageGroups,
					teamsIn: activeAge?.teamCount ?? schedule.weekend.approvedCount,
					teamsNeeded: Math.max(schedule.weekend.rules?.minTeams ?? 3, 3)
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					!editable && schedule.awaitingPublish ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mx-4 mt-4 rounded-lg border border-line bg-surface px-4 py-4 text-sm",
						children: "This sheet isn’t published yet."
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "shrink-0 border-b border-line px-3 py-2",
						children: [
							schedule.weekend.sheetLocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-2 text-xs text-muted",
								children: "Sheet is locked. A no-show forfeits that game. A club that pulls out forfeits the rest. A fill-in can take that same slot until first pitch."
							}) : null,
							poolOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-3 gap-1.5",
								role: "tablist",
								"aria-label": "Sheet",
								children: [
									["pool", "Pool Play"],
									["standings", "Standings"],
									["bracket", "Bracket"]
								].map(([key, label]) => {
									const on = activeView === key;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										role: "tab",
										"aria-selected": on,
										onClick: () => setView(key),
										className: cn("flex min-h-12 items-center justify-center rounded-lg border px-1 text-center font-display text-sm font-bold uppercase tracking-wide", on ? "border-ink bg-ink text-primary-fg" : "border-line bg-bg text-fg"),
										children: label
									}, key);
								})
							}) : null,
							editable && schedule.weekend.publicPushedAt && (schedule.weekend.publicDirty || schedule.weekend.dirtyAfterLock) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								className: "mt-2 w-full",
								disabled: pushMut.isPending,
								onClick: () => pushMut.mutate(),
								children: pushMut.isPending ? "Pushing…" : "Push to parents"
							}), pushMut.error instanceof Error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm",
								role: "alert",
								children: pushMut.error.message
							}) : null] }) : null,
							activeAge && warnOpen && activeAge.warnings.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 rounded-md border border-line bg-warn-bg px-3 py-2 text-sm",
								role: "status",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-semibold",
										children: [activeAge.warnings.length, " schedule notes"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "text-xs font-bold uppercase",
										onClick: () => setWarnOpen(false),
										children: "Hide"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-1 space-y-1",
									children: activeAge.warnings.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: cn("text-left text-xs underline-offset-2 hover:underline", focusWarning === row.id && "font-semibold"),
										onClick: () => {
											setFocusWarning(row.id);
											const game = activeAge.games.find((g) => g.id === row.gameId || row.gameIds?.includes(g.id));
											if (game?.round === "pool") setView("pool");
											else if (game) setView("bracket");
										},
										children: row.text
									}) }, row.id))
								})]
							}) : null,
							fieldError || lockMut.error || scoreMut.error || rainMut.error || sheetLockMut.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm",
								role: "alert",
								children: fieldError ?? (sheetLockMut.error instanceof Error ? sheetLockMut.error.message : lockMut.error instanceof Error ? lockMut.error.message : scoreMut.error instanceof Error ? scoreMut.error.message : rainMut.error instanceof Error ? rainMut.error.message : "Could not update that bracket.")
							}) : null
						]
					}),
					activeView === "bracket" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetZoom, {
						resetKey: `${activeAge.ageGroup}-bracket-${activeAge.teamCount}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-3 py-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteBoard, {
								games: bracketGames,
								parks: schedule.locations,
								playIns: hasPlayInRound(activeAge.games),
								firstRound: firstPlayableRound(activeAge.games),
								asOfDate: sheetDate,
								liveRound: ROUND_IDS.slice().reverse().find((round) => bracketGames.some((game) => game.round === round)) ?? null,
								allGames: activeAge.games,
								editable,
								busy: fieldBusy,
								fieldError,
								onField: (gameId, locationId) => fieldMut.mutate({
									gameId,
									locationId
								}),
								onAddField: (gameId, name, address) => addFieldMut.mutate({
									gameId,
									name,
									address
								}),
								onScore: (game) => setScoreGame(game),
								softFill: activeAge.softFill,
								flaggedIds
							})
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-h-0 flex-1 overflow-auto px-3 py-2",
						children: activeView === "standings" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StandingsTable, {
							age: activeAge,
							tiebreakers: schedule.weekend.rules.tiebreakers,
							seedOnePlaysLast: schedule.weekend.rules.packSeed1vsLast
						}) : poolGames.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PoolGrid, {
							games: poolGames,
							rosterGames: poolGames,
							parks: schedule.locations,
							editable,
							busy: fieldBusy,
							fieldError: fieldError ?? (scoreMut.error instanceof Error ? scoreMut.error.message : null),
							onField: (gameId, locationId) => fieldMut.mutate({
								gameId,
								locationId
							}),
							onAddField: (gameId, name, address) => addFieldMut.mutate({
								gameId,
								name,
								address
							}),
							onSwap: (gameId, teamAId, teamBId) => swapMut.mutate({
								gameId,
								teamAId,
								teamBId
							}),
							onScore: (gameId, homeScore, awayScore, forfeit, clear) => scoreMut.mutateAsync({
								gameId,
								homeScore,
								awayScore,
								forfeit,
								clear
							}),
							softFill: activeAge.softFill,
							flaggedIds
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "No pool games yet."
						})
					})
				] }),
				scoreGame && activeAge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreDialog, {
					games: [scoreGame],
					busy: scoreMut.isPending,
					error: scoreMut.error instanceof Error ? scoreMut.error.message : null,
					onClose: () => setScoreGame(null),
					onSave: (gameId, homeScore, awayScore, forfeit, clear) => scoreMut.mutate({
						gameId,
						homeScore,
						awayScore,
						forfeit,
						clear
					})
				}) : null
			]
		})
	});
}
var WEEKDAYS = [
	"S",
	"M",
	"T",
	"W",
	"T",
	"F",
	"S"
];
function parseIso(iso) {
	const [y, m, d] = iso.split("-").map(Number);
	if (!y || !m || !d) return null;
	return new Date(y, m - 1, d);
}
function formatUs(iso) {
	const dt = parseIso(iso);
	if (!dt) return "";
	return dt.toLocaleDateString("en-US", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric"
	});
}
function monthCells(year, month) {
	const pad = new Date(year, month - 1, 1).getDay();
	const count = new Date(year, month, 0).getDate();
	const cells = [];
	for (let i = 0; i < pad; i += 1) cells.push({
		iso: isoDateFromLocal(new Date(year, month - 1, 1 - (pad - i))),
		inMonth: false
	});
	for (let day = 1; day <= count; day += 1) cells.push({
		iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
		inMonth: true
	});
	const last = parseIso(cells[cells.length - 1]?.iso ?? "");
	while (cells.length < 42 && last) {
		last.setDate(last.getDate() + 1);
		cells.push({
			iso: isoDateFromLocal(last),
			inMonth: false
		});
	}
	return cells;
}
function MondayDateInput({ id, value, min, onChange, className, withWeekday = false }) {
	const autoId = (0, import_react.useId)();
	const buttonRef = (0, import_react.useRef)(null);
	const popRef = (0, import_react.useRef)(null);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [box, setBox] = (0, import_react.useState)(null);
	const initial = parseIso(value) ?? /* @__PURE__ */ new Date();
	const [cursor, setCursor] = (0, import_react.useState)({
		year: initial.getFullYear(),
		month: initial.getMonth() + 1
	});
	function place() {
		const rect = buttonRef.current?.getBoundingClientRect();
		if (!rect) return;
		const margin = 12;
		const width = Math.min(Math.max(rect.width, 280), window.innerWidth - 24);
		let left = rect.left + width > window.innerWidth - margin ? rect.right - width : rect.left;
		left = Math.max(margin, Math.min(left, window.innerWidth - margin - width));
		setBox({
			top: rect.bottom + 4,
			left,
			width
		});
	}
	function toggle() {
		const next = !open;
		if (next) {
			const shown = parseIso(value) ?? /* @__PURE__ */ new Date();
			setCursor({
				year: shown.getFullYear(),
				month: shown.getMonth() + 1
			});
			place();
		}
		setOpen(next);
	}
	(0, import_react.useEffect)(() => {
		if (!open) return;
		function onPointer(event) {
			const target = event.target;
			if (buttonRef.current?.contains(target) || popRef.current?.contains(target)) return;
			setOpen(false);
		}
		function onKey(event) {
			if (event.key === "Escape") setOpen(false);
		}
		document.addEventListener("pointerdown", onPointer);
		document.addEventListener("keydown", onKey);
		window.addEventListener("resize", place);
		return () => {
			document.removeEventListener("pointerdown", onPointer);
			document.removeEventListener("keydown", onKey);
			window.removeEventListener("resize", place);
		};
	}, [open]);
	const cells = monthCells(cursor.year, cursor.month);
	const title = new Date(cursor.year, cursor.month - 1, 1).toLocaleDateString("en-US", {
		month: "long",
		year: "numeric"
	});
	function shift(delta) {
		const dt = new Date(cursor.year, cursor.month - 1 + delta, 1);
		setCursor({
			year: dt.getFullYear(),
			month: dt.getMonth() + 1
		});
	}
	const pop = open && box && typeof document !== "undefined" ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: popRef,
		role: "dialog",
		"aria-label": title,
		className: "fixed z-[90] rounded-lg border border-line bg-bg p-3 text-fg shadow-lg",
		style: {
			top: box.top,
			left: box.left,
			width: box.width
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex items-center justify-between gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Previous month",
						onClick: () => shift(-1),
						className: "grid h-11 w-11 place-items-center rounded-md border border-line",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
							className: "h-4 w-4",
							"aria-hidden": true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold",
						children: title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Next month",
						onClick: () => shift(1),
						className: "grid h-11 w-11 place-items-center rounded-md border border-line",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "h-4 w-4",
							"aria-hidden": true
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase text-muted",
				children: WEEKDAYS.map((label, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }, `${label}-${index}`))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 grid grid-cols-7 gap-1",
				children: cells.map((cell) => {
					const disabled = Boolean(min && cell.iso < min);
					const selected = cell.iso === value;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled,
						"aria-pressed": selected,
						onClick: () => {
							onChange(cell.iso);
							setOpen(false);
						},
						className: cn("flex h-9 items-center justify-center rounded-md text-sm font-semibold", disabled && "cursor-not-allowed opacity-30", selected ? "bg-pine text-pine-fg" : cell.inMonth ? "bg-surface text-fg" : "text-muted"),
						children: Number(cell.iso.slice(8, 10))
					}, cell.iso);
				})
			})
		]
	}), document.body) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		ref: buttonRef,
		id: id ?? autoId,
		type: "button",
		"aria-haspopup": "dialog",
		"aria-expanded": open,
		onClick: toggle,
		className: cn("flex w-full flex-col justify-center rounded-md border border-line bg-surface px-3 text-left text-base text-fg", withWeekday ? "min-h-14 py-1.5" : "h-12", !value && "text-muted", className),
		children: value && withWeekday ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "leading-tight",
			children: formatUs(value)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs font-semibold leading-tight text-muted",
			children: formatWeekdayLong(value)
		})] }) : value ? formatUs(value) : "Select a date"
	}), pop] });
}
var Route$11 = createFileRoute("/teams/")({ component: MyTeamsPage });
function meetsCutoff(birthday, ageGroup) {
	const limit = Number.parseInt(ageGroup, 10);
	const [year, month, day] = birthday.split("-").map(Number);
	if (!limit || !year || !month || !day) return false;
	let age = FIRST_SEASON_YEAR - year;
	if (month > 4 || month === 4 && day > 30) age -= 1;
	return age >= 4 && age <= limit;
}
function formatBirthday(iso) {
	const [year, month, day] = iso.split("-").map(Number);
	if (!year || !month || !day) return iso;
	return new Date(year, month - 1, day).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric"
	});
}
function MyTeamsPage() {
	const { user, isPending, profile } = useAppSession();
	const queryClient = useQueryClient();
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [adding, setAdding] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)("");
	const [age, setAge] = (0, import_react.useState)("");
	const [playerTeamId, setPlayerTeamId] = (0, import_react.useState)(null);
	const [playerName, setPlayerName] = (0, import_react.useState)("");
	const [jersey, setJersey] = (0, import_react.useState)("");
	const [birthday, setBirthday] = (0, import_react.useState)("");
	const squadsQuery = useQuery({
		queryKey: ["my-squads"],
		queryFn: () => listMySquads(),
		enabled: Boolean(profile?.homeRole === "coach")
	});
	function refresh() {
		return queryClient.invalidateQueries({ queryKey: ["my-squads"] });
	}
	const saveTeam = useMutation({
		mutationFn: (input) => input.teamId ? updateMySquad({ data: input }) : addMySquad({ data: {
			name: input.name,
			ageGroup: input.ageGroup
		} }),
		onSuccess: async () => {
			setEditingId(null);
			setAdding(false);
			setName("");
			setAge("");
			await refresh();
			await queryClient.invalidateQueries({ queryKey: ["my-teams", "signup"] });
		}
	});
	const removeTeam = useMutation({
		mutationFn: (teamId) => removeMySquad({ data: { teamId } }),
		onSuccess: async () => {
			setEditingId(null);
			await refresh();
			await queryClient.invalidateQueries({ queryKey: ["my-teams", "signup"] });
		}
	});
	const addPlayer = useMutation({
		mutationFn: (input) => addSquadPlayer({ data: input }),
		onSuccess: async () => {
			setPlayerName("");
			setJersey("");
			setBirthday("");
			setPlayerTeamId(null);
			await refresh();
		}
	});
	const dropPlayer = useMutation({
		mutationFn: (playerId) => removeSquadPlayer({ data: { playerId } }),
		onSuccess: () => refresh()
	});
	if (isPending || !profile) {
		if (!isPending && !user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
		if (!isPending && !profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
			homeRole: "coach",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl font-bold uppercase",
				children: "My team"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Loading your teams…"
			})]
		});
	}
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (profile.homeRole !== "coach") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	const squads = squadsQuery.data ?? [];
	const error = saveTeam.error instanceof Error && saveTeam.error.message || removeTeam.error instanceof Error && removeTeam.error.message || addPlayer.error instanceof Error && addPlayer.error.message || dropPlayer.error instanceof Error && dropPlayer.error.message || squadsQuery.error instanceof Error && squadsQuery.error.message || null;
	function openEdit(team) {
		setAdding(false);
		setEditingId(team.id);
		setName(team.name);
		setAge(team.ageGroup);
		saveTeam.reset();
		removeTeam.reset();
	}
	function openAdd() {
		setEditingId(null);
		setAdding(true);
		setName("");
		setAge("");
		saveTeam.reset();
	}
	function onSaveTeam(event) {
		event.preventDefault();
		if (!age) return;
		saveTeam.mutate({
			teamId: editingId ?? void 0,
			name,
			ageGroup: age
		});
	}
	function onAddPlayer(event, teamId) {
		event.preventDefault();
		addPlayer.mutate({
			teamId,
			name: playerName,
			jersey,
			birthday
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		homeRole: profile.homeRole,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			"data-tour": "my-team",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl font-bold uppercase",
					children: "My team"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Tap a team to change the name or age. Add players under it."
				}),
				squadsQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 text-sm text-muted",
					children: "Loading your teams…"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 space-y-4",
					children: [
						squads.length === 0 && !adding ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted",
							children: "No team yet."
						}) : null,
						squads.map((team) => {
							const editing = editingId === team.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "rounded-lg border border-line bg-surface px-4 py-4",
								children: [editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									onSubmit: onSaveTeam,
									className: "space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: name,
											"aria-label": "Team name",
											placeholder: "Team name",
											onChange: (event) => setName(event.target.value)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											"aria-label": "Age",
											value: age,
											onChange: (event) => setAge(event.target.value),
											className: "h-11 w-full rounded-md border border-line bg-bg px-2 text-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: "Age"
											}), AGE_GROUPS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: option,
												children: option
											}, option))]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "submit",
												className: "flex-1",
												disabled: saveTeam.isPending || !age,
												children: saveTeam.isPending ? "Saving…" : "Save"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												variant: "outline",
												className: "flex-1",
												onClick: () => setEditingId(null),
												children: "Cancel"
											})]
										}),
										squads.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "ghost",
											className: "w-full text-muted",
											disabled: removeTeam.isPending,
											onClick: () => removeTeam.mutate(team.id),
											children: "Remove team"
										}) : null
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => openEdit(team),
									className: "min-w-0 flex-1 text-left",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block font-display text-2xl font-bold uppercase leading-none",
										children: team.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-1 block text-sm font-semibold",
										children: team.ageGroup
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 border-t border-line pt-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-sm font-bold uppercase tracking-wide",
											children: "Players"
										}),
										team.players.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-sm text-muted",
											children: "No players yet."
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
											className: "mt-2 space-y-1",
											children: team.players.map((player) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
												className: "grid grid-cols-3 items-center text-sm",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "min-w-0",
														children: [
															"#",
															player.jersey,
															" ",
															player.name
														]
													}),
													player.birthday ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "inline-flex items-center justify-self-center gap-1 text-muted",
														children: [formatBirthday(player.birthday), meetsCutoff(player.birthday, team.ageGroup) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
															className: "h-4 w-4 text-green-700",
															"aria-label": "Meets the April 30 cutoff"
														}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
															className: "h-4 w-4 text-red-600",
															"aria-label": "Does not meet the April 30 cutoff"
														})]
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														className: "justify-self-end text-muted",
														onClick: () => dropPlayer.mutate(player.id),
														children: "Remove"
													})
												]
											}, player.id))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											className: "mt-3 w-full",
											onClick: () => {
												setPlayerTeamId(team.id);
												setPlayerName("");
												setJersey("");
												setBirthday("");
												addPlayer.reset();
											},
											children: "Add player"
										})
									]
								})]
							}, team.id);
						}),
						adding ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: onSaveTeam,
							className: "space-y-3 rounded-lg border border-line bg-surface px-4 py-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: name,
									"aria-label": "Team name",
									placeholder: "Team name",
									onChange: (event) => setName(event.target.value)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									"aria-label": "Age",
									value: age,
									onChange: (event) => setAge(event.target.value),
									className: "h-11 w-full rounded-md border border-line bg-bg px-2 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "Age"
									}), AGE_GROUPS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: option,
										children: option
									}, option))]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "submit",
										className: "flex-1",
										disabled: saveTeam.isPending || !age,
										children: saveTeam.isPending ? "Saving…" : "Save team"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "outline",
										className: "flex-1",
										onClick: () => setAdding(false),
										children: "Cancel"
									})]
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							className: "w-full",
							onClick: openAdd,
							children: "Add a team"
						}),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
							role: "alert",
							children: error
						}) : null
					]
				})
			]
		}), playerTeamId != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddPlayerCard, {
			teamName: squads.find((team) => team.id === playerTeamId)?.name ?? "Team",
			name: playerName,
			jersey,
			birthday,
			pending: addPlayer.isPending,
			error: addPlayer.error instanceof Error ? addPlayer.error.message : null,
			onName: setPlayerName,
			onJersey: setJersey,
			onBirthday: setBirthday,
			onClose: () => setPlayerTeamId(null),
			onSubmit: (event) => onAddPlayer(event, playerTeamId)
		}) : null]
	});
}
function AddPlayerCard({ teamName, name, jersey, birthday, pending, error, onName, onJersey, onBirthday, onClose, onSubmit }) {
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[80] flex items-center justify-center bg-scrim p-4",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": `Add a player to ${teamName}`,
			onSubmit,
			onClick: (event) => event.stopPropagation(),
			className: "w-full max-w-sm space-y-3 rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl font-bold uppercase",
						children: "Add player"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: teamName
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Close",
						onClick: onClose,
						className: "grid h-11 w-11 place-items-center rounded-md text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							className: "h-5 w-5",
							"aria-hidden": true
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: name,
					"aria-label": "Player name",
					placeholder: "Player name",
					onChange: (event) => onName(event.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: jersey,
					"aria-label": "Jersey",
					inputMode: "numeric",
					placeholder: "Jersey",
					maxLength: 2,
					onChange: (event) => onJersey(event.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["Birthday", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MondayDateInput, {
						id: "add-player-birthday",
						value: birthday,
						onChange: onBirthday,
						className: "h-11 bg-bg text-sm font-normal"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "w-full",
					disabled: pending || !birthday,
					children: pending ? "Adding…" : "Add player"
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
					role: "alert",
					children: error
				}) : null
			]
		})
	}), document.body);
}
var Route$10 = createFileRoute("/teams/$teamId")({ component: TeamDetailPage });
function TeamDetailPage() {
	const { teamId } = Route$10.useParams();
	const id = Number.parseInt(teamId, 10);
	const { user, isPending, profile } = useAppSession();
	const queryClient = useQueryClient();
	const [adding, setAdding] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)("");
	const [jersey, setJersey] = (0, import_react.useState)("");
	const [formError, setFormError] = (0, import_react.useState)(null);
	const teamQuery = useQuery({
		queryKey: ["my-team", id],
		queryFn: () => getMyTeam({ data: { id } }),
		enabled: Boolean(profile?.homeRole === "coach" && Number.isInteger(id) && id > 0)
	});
	const addMut = useMutation({
		mutationFn: (input) => addPlayer({ data: input }),
		onSuccess: (team) => {
			setName("");
			setJersey("");
			setFormError(null);
			setAdding(false);
			queryClient.setQueryData(["my-team", team.id], team);
			queryClient.setQueryData(["my-teams"], (current) => (current ?? []).map((row) => row.id === team.id ? team : row));
		}
	});
	const removeMut = useMutation({
		mutationFn: (input) => removePlayer({ data: input }),
		onMutate: async (input) => {
			await queryClient.cancelQueries({ queryKey: ["my-team", input.teamId] });
			const previous = queryClient.getQueryData(["my-team", input.teamId]);
			if (previous) {
				const players = previous.players.filter((p) => p.id !== input.playerId);
				queryClient.setQueryData(["my-team", input.teamId], {
					...previous,
					players,
					playerCount: players.length
				});
			}
			return { previous };
		},
		onError: (_err, input, ctx) => {
			if (ctx?.previous) queryClient.setQueryData(["my-team", input.teamId], ctx.previous);
		},
		onSuccess: (team) => {
			queryClient.setQueryData(["my-team", team.id], team);
			queryClient.setQueryData(["my-teams"], (current) => (current ?? []).map((row) => row.id === team.id ? team : row));
		}
	});
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionSkeleton, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	if (profile.homeRole !== "coach") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	if (!Number.isInteger(id) || id < 1) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/teams" });
	const team = teamQuery.data;
	const errorText = formError ?? (addMut.error instanceof Error ? addMut.error.message : addMut.error ? "Could not add that player." : removeMut.error instanceof Error ? removeMut.error.message : null);
	function onAdd(event) {
		event.preventDefault();
		setFormError(null);
		try {
			addMut.mutate(parsePlayerInput({
				teamId: id,
				name,
				jersey
			}));
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "Check the form and try again.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		homeRole: profile.homeRole,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/teams",
			className: "text-sm font-semibold text-primary",
			children: "My team"
		}), teamQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-6 text-sm text-muted",
			children: "Loading your team…"
		}) : !team ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-6 rounded-md bg-warn-bg px-3 py-2 text-sm",
			role: "alert",
			children: teamQuery.error instanceof Error ? teamQuery.error.message : "Could not load that team."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-3 font-display text-4xl font-bold uppercase",
				children: team.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm font-medium",
				children: [
					team.ageGroup,
					" · ",
					team.tournamentName
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: formatWeekendRange(team.startDate, team.endDate)
			}),
			team.status === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 rounded-md bg-warn-bg px-4 py-3 text-sm font-medium",
				children: "Waiting for Admin approval. You are not in this tournament yet. You can still build the roster."
			}) : team.status === "denied" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 rounded-md bg-warn-bg px-4 py-3 text-sm font-medium",
				children: "An Admin did not take this team. Request a different tournament if you still want a spot."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm font-semibold text-primary",
				children: teamStatusLabel(team.status)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl font-bold uppercase",
						children: "Roster"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: team.playerCount === 0 ? `No players yet. They play ${team.ageGroup}.` : `${team.playerCount} player${team.playerCount === 1 ? "" : "s"} · ${team.ageGroup}`
					}),
					adding ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						noValidate: true,
						onSubmit: onAdd,
						className: "space-y-4 rounded-lg border border-line bg-surface p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "player-name",
									children: "Player name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "player-name",
									value: name,
									onChange: (e) => setName(e.target.value),
									placeholder: "Cade Smith",
									autoComplete: "off",
									maxLength: 60
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "player-jersey",
									children: "Jersey"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "player-jersey",
									value: jersey,
									onChange: (e) => setJersey(e.target.value),
									inputMode: "numeric",
									placeholder: "12",
									autoComplete: "off",
									maxLength: 2
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: [
									"Age group is ",
									team.ageGroup,
									" for this team."
								]
							}),
							errorText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
								role: "alert",
								children: errorText
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									size: "lg",
									disabled: addMut.isPending,
									children: addMut.isPending ? "Saving…" : "Add player"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									size: "lg",
									onClick: () => {
										setAdding(false);
										setFormError(null);
									},
									children: "Cancel"
								})]
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						size: "lg",
						className: "w-full",
						onClick: () => setAdding(true),
						children: "Add player"
					}),
					team.players.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted",
						children: "Add the kids who will play this weekend."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface",
						children: team.players.map((player) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-3 px-4 py-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-11 w-11 shrink-0 place-items-center rounded-md border-2 border-primary font-display text-lg font-bold text-primary",
									children: player.jersey
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block truncate font-medium",
										children: player.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs uppercase tracking-wide text-muted",
										children: player.ageGroup
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									size: "sm",
									disabled: removeMut.isPending,
									onClick: () => removeMut.mutate({
										teamId: team.id,
										playerId: player.id
									}),
									children: "Remove"
								})
							]
						}, player.id))
					}),
					!adding && errorText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
						role: "alert",
						children: errorText
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-bold uppercase",
					children: "Parks"
				}), team.locations.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted",
					children: "Parks for this tournament haven’t been added yet."
				}) : team.locations.map((location) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-lg border border-line bg-surface px-4 py-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-2xl font-bold uppercase leading-none",
						children: location.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm",
						children: location.address
					})]
				}, location.id))]
			})
		] })]
	});
}
var Route$9 = createFileRoute("/teams/new")({ component: RegisterTeamPage });
function RegisterTeamPage() {
	const { user, isPending, profile } = useAppSession();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [weekendId, setWeekendId] = (0, import_react.useState)(null);
	const [ageGroup, setAgeGroup] = (0, import_react.useState)(null);
	const [name, setName] = (0, import_react.useState)("");
	const [formError, setFormError] = (0, import_react.useState)(null);
	const openQuery = useQuery({
		queryKey: ["open-tournaments"],
		queryFn: () => listOpenTournaments(),
		enabled: Boolean(profile?.homeRole === "coach")
	});
	const registerMut = useMutation({
		mutationFn: (input) => registerTeam({ data: input }),
		onSuccess: (team) => {
			queryClient.setQueryData(["my-team", team.id], team);
			queryClient.setQueryData(["my-teams"], (current) => {
				return [team, ...(current ?? []).filter((row) => row.id !== team.id)];
			});
			queryClient.invalidateQueries({ queryKey: ["my-teams"] });
			queryClient.invalidateQueries({ queryKey: ["open-tournaments"] });
			navigate({
				to: "/teams/$teamId",
				params: { teamId: String(team.id) }
			});
		}
	});
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionSkeleton, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	if (profile.homeRole !== "coach") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	const tournaments = openQuery.data ?? [];
	const selected = tournaments.find((item) => item.id === weekendId) ?? null;
	const errorText = formError ?? (registerMut.error instanceof Error ? registerMut.error.message : registerMut.error ? "Could not register that team." : null);
	function pickTournament(item) {
		setWeekendId(item.id);
		setAgeGroup(null);
		setFormError(null);
	}
	function pickAge(age) {
		setAgeGroup(age.ageGroup);
		setFormError(null);
	}
	function onSubmit(event) {
		event.preventDefault();
		setFormError(null);
		try {
			const parsed = parseTeamRegister({
				weekendId,
				ageGroup,
				name
			});
			registerMut.mutate(parsed);
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "Check the form and try again.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		homeRole: profile.homeRole,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/teams",
				className: "text-sm font-semibold text-primary",
				children: "My team"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-3 font-display text-4xl font-bold uppercase",
				children: "Request a team"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Pick a tournament and age. An Admin still has to take you — a request is not a spot."
			}),
			openQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-sm text-muted",
				children: "Loading tournaments…"
			}) : tournaments.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted",
				children: "No tournaments are open to register yet."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 space-y-3",
				children: tournaments.map((item) => {
					const on = item.id === weekendId;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => pickTournament(item),
						className: cn("w-full rounded-lg border px-4 py-4 text-left transition-colors duration-150", on ? "border-pine bg-pine/10" : "border-line bg-surface hover:border-fg/25"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-2xl font-bold uppercase leading-none",
								children: item.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm font-medium",
								children: formatWeekendRange(item.startDate, item.endDate)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-sm text-muted",
								children: [
									item.approvedCount,
									"/",
									item.maxTeams,
									" in",
									item.ages.length > 0 ? ` · ${item.ages.map((age) => `${age.ageGroup} ${formatAgeAvailability(age.registered, age.maxTeams, age.open)}`).join(" · ")}` : ""
								]
							})
						]
					}, item.id);
				})
			}),
			selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit,
				className: "mt-8 space-y-4 rounded-lg border border-line bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold",
						children: selected.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
							className: "text-sm font-semibold text-fg",
							children: "Age"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-4 gap-2",
							children: selected.ages.map((age) => {
								const on = ageGroup === age.ageGroup;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": on,
									onClick: () => pickAge(age),
									className: cn("min-h-11 rounded-md border text-sm font-semibold", on ? "border-pine bg-pine text-pine-fg" : "border-line bg-bg text-fg hover:bg-surface"),
									children: age.ageGroup
								}, age.ageGroup);
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "team-name",
							children: "Team name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "team-name",
							value: name,
							onChange: (e) => setName(e.target.value),
							placeholder: "Tellico 15U",
							autoComplete: "off",
							maxLength: 60
						})]
					}),
					errorText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
						role: "alert",
						children: errorText
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						size: "lg",
						className: "w-full",
						disabled: registerMut.isPending,
						children: registerMut.isPending ? "Sending…" : "Submit for approval"
					})
				]
			}) : null
		]
	});
}
function RulesFields({ rules, setRules, maxTeams, hideDivisions = false, hideAdvance = false, focus }) {
	const cutTotal = rules.divisions.reduce((n, row) => n + row.size, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		hideAdvance || focus === "seeding" || focus === "clocks" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
			title: "Bracket / advance",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "rule-advance",
						children: "Who goes to the bracket"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						id: "rule-advance",
						value: rules.advance,
						onChange: (e) => setRules((current) => ({
							...current,
							advance: e.target.value
						})),
						className: "h-11 w-full rounded-md border border-line bg-bg px-3 text-sm",
						children: ADVANCE_MODES.map((mode) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: mode,
							children: ADVANCE_LABELS[mode]
						}, mode))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "All teams puts every team in one bracket, 1st vs last. Top from each pool sends only the top N out of every pool, so fewer bracket games and room for more teams."
					})
				]
			}), rules.advance === "top-per-pool" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stepper, {
				id: "rule-n",
				label: "Advance per pool",
				value: rules.advancePerPool,
				min: 1,
				max: 4,
				onChange: (advancePerPool) => setRules((current) => ({
					...current,
					advancePerPool
				}))
			}) : null]
		}),
		focus === "clocks" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
			title: "Seeding",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold",
					children: "Tiebreakers"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "Default is win/loss, runs scored, run differential, head-to-head, runs allowed, then a coin. Tap ↑↓ to reorder. A pool forfeit counts as a win and a loss only — not runs."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "space-y-2",
					children: rules.tiebreakers.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex min-h-12 items-center justify-between gap-2 rounded-md border border-line px-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-sm font-semibold",
							children: [
								index + 1,
								". ",
								TIEBREAKER_LABELS[item]
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "min-h-9 min-w-9 rounded-md border border-line text-sm font-bold disabled:opacity-40",
								disabled: index === 0,
								onClick: () => setRules((current) => ({
									...current,
									tiebreakers: moveTiebreaker(current.tiebreakers, index, -1)
								})),
								"aria-label": `Move ${TIEBREAKER_LABELS[item]} up`,
								children: "↑"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "min-h-9 min-w-9 rounded-md border border-line text-sm font-bold disabled:opacity-40",
								disabled: index === rules.tiebreakers.length - 1,
								onClick: () => setRules((current) => ({
									...current,
									tiebreakers: moveTiebreaker(current.tiebreakers, index, 1)
								})),
								"aria-label": `Move ${TIEBREAKER_LABELS[item]} down`,
								children: "↓"
							})]
						})]
					}, item))
				})
			]
		}),
		focus === "seeding" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
			title: "Schedule clocks",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClockField, {
						id: "rule-first-pitch",
						label: "First pitch",
						value: rules.firstPitch,
						onChange: (firstPitch) => setRules((current) => ({
							...current,
							firstPitch
						}))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoNote, {
							label: "Start block (min)",
							text: "How many minutes between first pitches. New tournaments start at 105."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "rule-slot",
							inputMode: "numeric",
							value: String(rules.slotMinutes),
							onChange: (e) => setRules((current) => ({
								...current,
								slotMinutes: Number.parseInt(e.target.value, 10) || 105
							})),
							maxLength: 3
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "rule-time",
							children: "In-game time limit (min)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "rule-time",
							inputMode: "numeric",
							value: String(rules.timeLimitMinutes),
							onChange: (e) => setRules((current) => ({
								...current,
								timeLimitMinutes: Number.parseInt(e.target.value, 10) || 105
							})),
							maxLength: 3
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						"aria-pressed": rules.championshipNoTimeLimit,
						onClick: () => setRules((current) => ({
							...current,
							championshipNoTimeLimit: !current.championshipNoTimeLimit
						})),
						className: "mt-6 flex min-h-11 items-center justify-center rounded-md border border-line px-3 text-xs font-bold uppercase",
						children: ["Title game ", rules.championshipNoTimeLimit ? "no clock" : "on the clock"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClockField, {
						id: "rule-last-start",
						label: "Last start, earlier days",
						value: rules.lastStart,
						onChange: (lastStart) => setRules((current) => ({
							...current,
							lastStart
						}))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClockField, {
						id: "rule-last-day",
						label: "Last start, final day",
						value: rules.lastDayLastStart,
						onChange: (lastDayLastStart) => setRules((current) => ({
							...current,
							lastDayLastStart
						}))
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5 pt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoNote, {
					label: "Mercy rule",
					text: "Run gap that ends the game after that inning. On by default."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-3 gap-2",
					children: [
						["mercyAfter3", "After 3"],
						["mercyAfter4", "After 4"],
						["mercyAfter5", "After 5"]
					].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: `rule-${key}`,
							children: label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: `rule-${key}`,
							inputMode: "numeric",
							value: String(rules[key]),
							onChange: (e) => setRules((current) => ({
								...current,
								[key]: Number.parseInt(e.target.value, 10) || current[key]
							})),
							maxLength: 2
						})]
					}, key))
				})]
			})]
		}),
		hideDivisions || focus ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
			title: "Divisions",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted",
					children: [
						"One Gold division is the default and covers every team. Extra cuts must add up to ",
						maxTeams,
						" teams."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stepper, {
					id: "rule-div-count",
					label: "Division count",
					value: rules.divisions.length,
					min: 1,
					max: 4,
					onChange: (count) => setRules((current) => ({
						...current,
						divisions: setDivisionCount(current.divisions, count, maxTeams)
					}))
				}),
				rules.divisions.map((cut, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-[1fr_5rem] gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: cut.name,
						onChange: (e) => setRules((current) => ({
							...current,
							divisions: current.divisions.map((row, i) => i === index ? {
								...row,
								name: e.target.value
							} : row)
						})),
						maxLength: 24
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						inputMode: "numeric",
						value: String(cut.size),
						onChange: (e) => setRules((current) => ({
							...current,
							divisions: current.divisions.map((row, i) => i === index ? {
								...row,
								size: Number.parseInt(e.target.value, 10) || 0
							} : row)
						})),
						maxLength: 2
					})]
				}, `${cut.name}-${index}`)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted",
					children: [
						"Cuts add to ",
						cutTotal,
						" / ",
						maxTeams,
						"."
					]
				})
			]
		})
	] });
}
function InfoNote({ label, text }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-1.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-semibold",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-expanded": open,
				"aria-label": `What ${label} means`,
				onClick: () => setOpen((value) => !value),
				className: "inline-flex h-5 w-5 items-center justify-center rounded-full border border-line text-[11px] font-bold text-muted",
				children: "i"
			})]
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted",
			children: text
		}) : null]
	});
}
function Section({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
		className: "space-y-3 rounded-md border border-line bg-surface p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
			className: "px-1 font-display text-lg font-bold uppercase tracking-wide",
			children: title
		}), children]
	});
}
function Stepper({ id, label, value, min, max, step = 1, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor: id,
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 min-w-11 rounded-md border border-line text-lg font-bold",
					onClick: () => onChange(Math.max(min, value - step)),
					"aria-label": `Decrease ${label}`,
					children: "−"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id,
					inputMode: "numeric",
					value: String(value),
					onChange: (e) => {
						const raw = e.target.value.trim();
						if (raw === "") {
							onChange(min);
							return;
						}
						const n = Number.parseInt(raw, 10);
						if (!Number.isInteger(n)) return;
						onChange(Math.min(max, Math.max(min, n)));
					},
					className: "text-center"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 min-w-11 rounded-md border border-line text-lg font-bold",
					onClick: () => onChange(Math.min(max, value + step)),
					"aria-label": `Increase ${label}`,
					children: "+"
				})
			]
		})]
	});
}
function ClockField({ id, label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor: id,
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			id,
			type: "time",
			value,
			onChange: (e) => onChange(e.target.value || value)
		})]
	});
}
function feeLine(raw) {
	try {
		const cents = parseTeamFee(raw);
		return cents == null ? "No fee" : `${formatTeamFee(cents)} per team`;
	} catch {
		return "Check the fee";
	}
}
var STEP_LABEL = {
	name: "1 · Name",
	dates: "2 · Dates",
	size: "3 · Size",
	seeding: "4 · Seeding",
	clocks: "5 · Schedule",
	confirm: "6 · Review"
};
var FINISH_LABEL = {
	name: "1 · Name",
	dates: "2 · Dates",
	size: "2 · Size",
	seeding: "3 · Seeding",
	clocks: "4 · Schedule",
	confirm: "5 · Review"
};
var TEAM_PATHS = [
	{
		id: "small",
		title: "Small",
		hint: "3–12 teams"
	},
	{
		id: "mid",
		title: "Mid",
		hint: "13–24 teams"
	},
	{
		id: "large",
		title: "Large",
		hint: "25–36 teams"
	},
	{
		id: "custom",
		title: "Custom",
		hint: "Any team count"
	}
];
var TEAM_BAND = {
	small: {
		min: 3,
		max: 12,
		start: 8
	},
	mid: {
		min: 13,
		max: 24,
		start: 16
	},
	large: {
		min: 25,
		max: 36,
		start: 30
	}
};
function fieldsThatHold(teamCount, dayCount, format, rain, advance, advancePerPool) {
	for (let count = 1; count <= 12; count += 1) {
		const input = {
			teams: teamCount,
			fields: count,
			days: dayCount,
			format,
			rain,
			advance,
			advancePerPool
		};
		if (bracketClockForFit(input).late || assessCapacity(input).fit) return count;
	}
	return 12;
}
function Info({ text }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "mt-1 block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			"aria-expanded": open,
			onClick: () => setOpen((value) => !value),
			className: "inline-flex min-h-8 items-center gap-1 text-xs font-bold uppercase text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "inline-flex h-5 w-5 items-center justify-center rounded-full border border-line text-[11px]",
				children: "i"
			}), "What this means"]
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-1 block text-xs text-muted",
			children: text
		}) : null]
	});
}
function CreateCoach({ busy, error, onCreate, initialStart, initialEnd, initialName, initialAge, interestCount = 0, finish = false }) {
	const defaults = (0, import_react.useMemo)(() => defaultWeekendDates(), []);
	const [step, setStep] = (0, import_react.useState)("name");
	const eventName = (initialName ?? "").trim();
	const [ages, setAges] = (0, import_react.useState)(initialAge ? [initialAge] : []);
	const [customName, setCustomName] = (0, import_react.useState)(null);
	const name = customName ?? eventName;
	const [teamFee, setTeamFee] = (0, import_react.useState)("");
	const [startDate, setStartDate] = (0, import_react.useState)(initialStart && initialStart.length === 10 ? initialStart : defaults.startDate);
	const [endDate, setEndDate] = (0, import_react.useState)(initialEnd && initialEnd.length === 10 ? initialEnd : defaults.endDate);
	const [path, setPath] = (0, import_react.useState)("small");
	const rain = true;
	const [advance, setAdvance] = (0, import_react.useState)("all-reseed");
	const [advancePerPool, setAdvancePerPool] = (0, import_react.useState)(2);
	const [format, setFormat] = (0, import_react.useState)("pool-then-bracket");
	const [formatTouched, setFormatTouched] = (0, import_react.useState)(false);
	const [rules, setRules] = (0, import_react.useState)({
		...DEFAULT_BRACKET_RULES,
		rainDelay: true
	});
	const [localError, setLocalError] = (0, import_react.useState)(null);
	const [soonSize, setSoonSize] = (0, import_react.useState)(null);
	const weekendsQuery = useQuery({
		queryKey: ["weekends"],
		queryFn: () => listWeekends()
	});
	const year = startDate.slice(0, 4);
	const sameName = (weekendsQuery.data ?? []).filter((weekend) => {
		if (weekend.lifecycle === "announced") return false;
		return year.length === 4 && weekend.startDate.slice(0, 4) === year && weekend.name.trim().toLowerCase() === name.trim().toLowerCase() && name.trim().length >= 2;
	});
	const nameWarning = sameName.length === 0 ? null : sameName.length === 1 ? `${year} already has a tournament named ${sameName[0]?.name}. Coaches can mix them up.` : `${year} already has ${sameName.length} tournaments with that name. Coaches can mix them up.`;
	const days = inclusiveDays(startDate, endDate);
	const pool = format === "pool-then-bracket";
	const bandMax = path === "custom" ? 40 : TEAM_BAND[path].max;
	const fieldCount = fieldsThatHold(bandMax, days, format, rain, advance, advancePerPool);
	const clockInput = {
		teams: bandMax,
		fields: fieldCount,
		days: Math.max(1, days),
		format,
		rain,
		advance,
		advancePerPool
	};
	const clock = bracketClockForFit(clockInput);
	const fitReport = capacityReport({
		...clockInput,
		...clock
	});
	const chosen = Math.min(bandMax, Math.max(3, fitReport.maxTeams));
	const fits = fitReport.fit || path === "custom";
	const dayPlan = pool ? defaultDayPlan(startDate, endDate) : eachIsoDate(startDate, endDate).map((date) => ({
		date,
		kind: "bracket"
	}));
	const sizeTitle = TEAM_PATHS.find((row) => row.id === path)?.title ?? "";
	function nextFromName() {
		if (ages.length === 0) {
			setLocalError("Pick at least one age.");
			return;
		}
		if (name.trim().length < 2) {
			setLocalError("Give the tournament a name.");
			return;
		}
		try {
			parseTeamFee(teamFee);
		} catch (err) {
			setLocalError(err instanceof Error ? err.message : "Team fee needs to be a dollar amount.");
			return;
		}
		setLocalError(null);
		setStep(finish ? "size" : "dates");
	}
	function nextFromDates() {
		if (days < 1) {
			setLocalError("Pick a first day and a last day.");
			return;
		}
		if (!formatTouched) setFormat(days <= 1 ? "bracket-only" : "pool-then-bracket");
		setLocalError(null);
		setStep("size");
	}
	function pickPath(next) {
		if (next !== "small") {
			setSoonSize(TEAM_PATHS.find((row) => row.id === next)?.title ?? "That size");
			return;
		}
		setPath(next);
	}
	function openRules() {
		setRules((current) => ({
			...current,
			advance,
			advancePerPool,
			rainDelay: true
		}));
		setLocalError(null);
		setStep("seeding");
	}
	function review() {
		if (path !== "custom" && !fits) {
			setLocalError(fitReport.reasons[0] ?? "That lineup does not fit this window.");
			return;
		}
		setLocalError(null);
		setStep("confirm");
	}
	function submit(event) {
		event.preventDefault();
		if (step !== "confirm") return;
		if (ages.length === 0) return;
		const built = {
			...rules,
			advance: rules.advance,
			advancePerPool: rules.advancePerPool,
			rainDelay: true,
			divisions: namedDivisions(chosen),
			poolGamesPerTeam: pool ? 2 : 0,
			bracketLastMustPlay: clock.bracketLastMustPlay,
			bracketRainDelay: clock.bracketRainDelay,
			eventDays: days >= 3 ? 3 : 2,
			fieldCount: path === "small" ? 0 : fieldCount,
			coachPath: path,
			dropCutoffDays: 3
		};
		onCreate({
			name: name.trim().slice(0, 80),
			startDate,
			endDate,
			ageGroups: ages,
			maxTeams: chosen,
			dayPlan,
			poolPlay: pool,
			rules: built,
			teamFee,
			parks: [],
			staff: []
		});
	}
	const shownError = localError ?? error;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: submit,
		className: "mt-6 space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-bold uppercase tracking-wide text-muted",
				children: (finish ? FINISH_LABEL : STEP_LABEL)[step]
			}),
			interestCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: interestCount === 1 ? "1 team is interested so far. Pool and bracket follow who is in." : `${interestCount} teams are interested so far. Pool and bracket follow who is in.`
			}) : null,
			step === "name" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-4 rounded-lg border border-line bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "coach-name",
								children: "Tournament name"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "coach-name",
								value: name,
								onChange: (e) => setCustomName(e.target.value),
								placeholder: eventName || "Tournament name",
								maxLength: 80,
								autoComplete: "off"
							}),
							nameWarning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-[#c9a227]",
								children: nameWarning
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "coach-fee",
								children: "Team fee"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "coach-fee",
								value: teamFee,
								onChange: (e) => setTeamFee(e.target.value),
								placeholder: "Leave blank if there's no fee",
								inputMode: "decimal",
								autoComplete: "off"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: "What each team pays to play. You can change it later."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold",
							children: "Ages"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2",
							children: AGE_GROUPS.map((age) => {
								const on = ages.includes(age);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": on,
									onClick: () => {
										setAges((current) => current.includes(age) ? current.filter((item) => item !== age) : [...current, age]);
									},
									className: `min-h-11 rounded-md border px-3 text-sm font-semibold ${on ? "border-primary bg-bg" : "border-line bg-bg text-muted"}`,
									children: age
								}, age);
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						size: "lg",
						className: "w-full",
						onClick: nextFromName,
						children: "Next"
					})
				]
			}) : null,
			step === "dates" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-4 rounded-lg border border-line bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "coach-start",
							children: "First day"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MondayDateInput, {
							id: "coach-start",
							value: startDate,
							withWeekday: true,
							onChange: (next) => {
								const length = Math.max(1, inclusiveDays(startDate, endDate));
								setStartDate(next);
								if (next) setEndDate(addDays(next, length - 1));
							}
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "coach-end",
								children: "Last day"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MondayDateInput, {
								id: "coach-end",
								value: endDate,
								min: startDate,
								withWeekday: true,
								onChange: setEndDate
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { text: "First day is pool. Last day is bracket. That used to mean Saturday and Sunday, but the days can be anything — Wednesday is fine." })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm font-semibold",
						children: [
							days > 0 ? `${days} day${days === 1 ? "" : "s"}` : "Pick both dates",
							" · through ",
							endDate
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							className: "flex-1",
							onClick: () => setStep("name"),
							children: "Back"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							className: "flex-1",
							onClick: nextFromDates,
							children: "Next"
						})]
					})
				]
			}) : null,
			step === "size" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-4 rounded-lg border border-line bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 text-xs font-bold uppercase tracking-wide text-muted",
						children: "Size"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-2 gap-2",
						children: TEAM_PATHS.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							"aria-pressed": path === row.id,
							onClick: () => pickPath(row.id),
							className: `min-h-16 rounded-md border px-3 py-2 text-left ${path === row.id ? "border-primary bg-bg" : "border-line bg-bg"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-sm font-bold",
								children: row.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 block text-xs text-muted",
								children: row.hint
							})]
						}, row.id))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 text-xs font-bold uppercase tracking-wide text-muted",
						children: "Format"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-1 rounded-md bg-bg p-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": format === "pool-then-bracket",
							onClick: () => {
								setFormat("pool-then-bracket");
								setFormatTouched(true);
							},
							className: `min-h-11 rounded-md px-2 text-sm font-bold ${format === "pool-then-bracket" ? "bg-primary text-primary-fg" : "text-muted"}`,
							children: "Pool + Bracket"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": format === "bracket-only",
							onClick: () => {
								setFormat("bracket-only");
								setFormatTouched(true);
							},
							className: `min-h-11 rounded-md px-2 text-sm font-bold ${format === "bracket-only" ? "bg-primary text-primary-fg" : "text-muted"}`,
							children: "Bracket only"
						})]
					})] }),
					format === "pool-then-bracket" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "coach-advance",
								children: "Who goes to the bracket"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								id: "coach-advance",
								value: advance,
								onChange: (e) => setAdvance(e.target.value),
								className: "h-11 w-full rounded-md border border-line bg-bg px-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "all-reseed",
									children: "All teams"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "top-per-pool",
									children: "Top from each pool"
								})]
							}),
							advance === "top-per-pool" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "coach-per",
									children: "Advance per pool"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "coach-per",
									inputMode: "numeric",
									value: String(advancePerPool),
									onChange: (e) => setAdvancePerPool(Math.min(4, Math.max(1, Number.parseInt(e.target.value, 10) || 2)))
								})]
							}) : null
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							className: "flex-1",
							onClick: () => setStep(finish ? "name" : "dates"),
							children: "Back"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							className: "flex-1",
							onClick: openRules,
							children: "Next"
						})]
					})
				]
			}) : null,
			step === "seeding" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-4 rounded-lg border border-line bg-surface p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RulesFields, {
					rules,
					setRules,
					maxTeams: chosen,
					hideAdvance: true,
					hideDivisions: true,
					focus: "seeding"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						className: "flex-1",
						onClick: () => setStep("size"),
						children: "Back"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						className: "flex-1",
						onClick: () => setStep("clocks"),
						children: "Next"
					})]
				})]
			}) : null,
			step === "clocks" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-4 rounded-lg border border-line bg-surface p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RulesFields, {
					rules,
					setRules,
					maxTeams: chosen,
					hideAdvance: true,
					hideDivisions: true,
					focus: "clocks"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						className: "flex-1",
						onClick: () => setStep("seeding"),
						children: "Back"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						className: "flex-1",
						onClick: review,
						children: "Next"
					})]
				})]
			}) : null,
			step === "confirm" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-4 rounded-lg border border-line bg-surface p-4",
				"aria-label": "Confirm tournament",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs font-bold uppercase tracking-wide text-muted",
						children: [
							sizeTitle,
							" · ",
							pool ? "Pool + Bracket" : "Bracket only"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-display text-4xl font-bold uppercase leading-none",
						children: ["Up to ", chosen]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold",
						children: "Games follow the teams that are in. 7 or fewer teams use 1 field. 8 to 12 use 2."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "space-y-2 border-t border-line pt-3 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "Name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "text-right font-semibold",
									children: name
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "Ages"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "text-right font-semibold",
									children: ages.join(", ")
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "Dates"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
									className: "text-right font-semibold",
									children: [
										days,
										" day",
										days === 1 ? "" : "s",
										" · ",
										startDate,
										" to ",
										endDate
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "Team fee"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "text-right font-semibold",
									children: feeLine(teamFee)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "Rain buffer"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-semibold",
									children: clock.late ? "8:00 on the bracket day" : "On"
								})]
							})
						]
					}),
					nameWarning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-[#c9a227]",
						children: nameWarning
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: [fitReport.divisions.length <= 1 ? "One division." : `Knockout splits ${fitReport.divisions.join(" + ")}.`, path === "custom" && !fits ? " Custom does not fit this window. You can still create it." : ""]
					}),
					shownError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
						role: "alert",
						children: shownError
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							className: "flex-1",
							onClick: () => setStep("clocks"),
							children: "Back"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							className: "flex-1",
							disabled: busy,
							children: busy ? "Saving…" : "Create"
						})]
					})
				]
			}) : null,
			(step === "name" || step === "dates" || step === "size" || step === "seeding" || step === "clocks") && shownError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
				role: "alert",
				children: shownError
			}) : null,
			soonSize && typeof document !== "undefined" ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-[80] flex items-center justify-center bg-scrim p-4",
				onClick: () => setSoonSize(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-modal": "true",
					"aria-label": `${soonSize} is not ready`,
					className: "w-full max-w-sm rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
					onClick: (event) => event.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl font-bold uppercase",
							children: soonSize
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm",
							children: [
								"We're still working on ",
								soonSize,
								". Small is ready now."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							className: "mt-4 w-full",
							onClick: () => setSoonSize(null),
							children: "OK"
						})
					]
				})
			}), document.body) : null
		]
	});
}
var Route$8 = createFileRoute("/weekends/")({
	validateSearch: (search) => {
		const out = {};
		if (search.add === 1 || search.add === "1") out.add = 1;
		if (typeof search.start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(search.start)) out.start = search.start;
		if (typeof search.end === "string" && /^\d{4}-\d{2}-\d{2}$/.test(search.end)) out.end = search.end;
		if (typeof search.name === "string" && search.name.trim()) out.name = search.name.trim().slice(0, 80);
		if (typeof search.age === "string" && isAgeGroup(search.age)) out.age = search.age;
		const teams = Number(search.teams);
		if (Number.isInteger(teams) && teams >= 3 && teams <= 40) out.teams = teams;
		if (isSeason(search.season)) out.season = search.season;
		const year = Number(search.year);
		if (Number.isInteger(year) && year > 2e3 && year < 2100) out.year = year;
		const announce = Number(search.announce);
		if (Number.isInteger(announce) && announce > 0) out.announce = announce;
		return out;
	},
	component: WeekendsPage
});
function WeekendsPage() {
	const { user, isPending, profile } = useAppSession();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const router = useRouter();
	const { add, start, end, name, age, teams, season, year, announce } = Route$8.useSearch();
	const adding = add === 1;
	const sourceQuery = useQuery({
		queryKey: ["weekends"],
		queryFn: () => listWeekends(),
		enabled: Boolean(user && adding && announce)
	});
	const source = sourceQuery.data?.find((row) => row.id === announce) ?? null;
	const createMut = useMutation({
		mutationFn: async (input) => {
			const created = await createWeekend({ data: {
				...parseWeekendInput(input),
				teamFee: input.teamFee ?? null,
				season,
				year
			} });
			let locations = [];
			for (const park of input.parks) locations = (await addWeekendLocation({ data: {
				weekendId: created.id,
				name: park.name,
				address: park.address,
				...emptyParkFlags()
			} })).locations;
			const slots = locations.flatMap((location, index) => {
				const row = input.staff[index];
				if (!row) return [];
				return ["gate", "scorekeeper"].flatMap((role) => {
					const slot = row[role];
					if (!(slot.staffId != null || Boolean(slot.otherName) && (slot.otherPhone ?? "").replace(/\D/g, "").length === 10)) return [];
					return [{
						locationId: location.id,
						role,
						staffId: slot.staffId,
						otherName: slot.otherName,
						otherPhone: slot.otherPhone
					}];
				});
			});
			if (slots.length > 0) await saveWeekendStaff({ data: {
				weekendId: created.id,
				slots
			} });
			return created;
		},
		onSuccess: (created) => {
			queryClient.setQueryData(["weekends"], (current) => {
				const nextList = [...(current ?? []).filter((row) => row.id !== created.id), created];
				nextList.sort((a, b) => a.startDate === b.startDate ? a.id - b.id : a.startDate.localeCompare(b.startDate));
				return nextList;
			});
			queryClient.invalidateQueries({ queryKey: ["weekends"] });
			navigate({
				to: "/weekends/$weekendId",
				params: { weekendId: String(created.id) }
			});
		}
	});
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionSkeleton, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	if (profile.homeRole !== "admin") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	if (!adding) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	const pendingMut = createMut;
	const errorText = pendingMut.error instanceof Error ? pendingMut.error.message : pendingMut.error ? "Could not save that tournament." : null;
	const finishing = Boolean(announce);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		homeRole: profile.homeRole,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl font-bold uppercase",
					children: "Create tournament"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					className: "px-2 text-muted",
					onClick: () => {
						if (announce) {
							router.history.back();
							return;
						}
						navigate({ to: "/" });
					},
					children: "Cancel"
				})]
			}),
			finishing && sourceQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-sm text-muted",
				children: "Loading that tournament…"
			}) : null,
			finishing && sourceQuery.isSuccess && (!source || source.lifecycle !== "announced") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 rounded-md bg-warn-bg px-3 py-2 text-sm",
				children: "That tournament is already built, or it’s gone."
			}) : null,
			!finishing || source && source.lifecycle === "announced" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreateCoach, {
				busy: pendingMut.isPending,
				error: errorText,
				finish: finishing,
				interestCount: finishing ? source?.interestCount ?? 0 : teams ?? 0,
				initialName: finishing ? source?.name : name,
				initialAge: age,
				initialStart: source?.startDate ?? start,
				initialEnd: source?.endDate ?? end ?? (start ? addDays(start, 1) : void 0),
				onCreate: (input) => {
					createMut.mutate({
						name: input.name,
						startDate: input.startDate,
						endDate: input.endDate,
						ageGroups: input.ageGroups,
						maxTeams: input.maxTeams,
						poolPlay: input.poolPlay,
						dayPlan: input.dayPlan,
						rules: input.rules,
						teamFee: input.teamFee,
						parks: input.parks,
						staff: input.staff
					});
				}
			}) : null
		]
	});
}
var Route$7 = createFileRoute("/weekends/$weekendId")({ component: TournamentLayout });
function TournamentLayout() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {});
}
async function handle(request) {
	await ensureDbReady();
	return auth.handler(request);
}
var Route$6 = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: ({ request }) => handle(request),
	POST: ({ request }) => handle(request)
} } });
function bumpWeekend(queryClient, id) {
	queryClient.invalidateQueries({ queryKey: ["weekend", id] });
	queryClient.invalidateQueries({ queryKey: ["weekends"] });
	queryClient.invalidateQueries({ queryKey: ["schedule", id] });
}
function parentEvent(detail, weekends) {
	return weekends.filter((event) => {
		if (event.lifecycle !== "announced" || event.id === detail.id) return false;
		const name = event.name.trim();
		return Boolean(name) && detail.startDate >= event.startDate && detail.startDate <= event.endDate && detail.name.startsWith(name);
	}).sort((a, b) => b.name.length - a.name.length || a.id - b.id)[0] ?? null;
}
function WeekendAdminFrame({ weekendId, backTo, adminOnly = false, children }) {
	const id = Number.parseInt(weekendId, 10);
	const { user, isPending, profile } = useAppSession();
	const queryClient = useQueryClient();
	const router = useRouter();
	const isAdmin = profile?.homeRole === "admin";
	const isCoach = profile?.homeRole === "coach";
	const allowed = adminOnly ? Boolean(isAdmin) : Boolean(isAdmin || isCoach);
	const validId = Number.isInteger(id) && id > 0;
	const detailQuery = useQuery({
		queryKey: ["weekend", id],
		queryFn: () => getWeekend({ data: { id } }),
		enabled: Boolean(allowed && validId)
	});
	const weekendsQuery = useQuery({
		queryKey: ["weekends"],
		queryFn: () => listWeekends(),
		enabled: Boolean(isAdmin)
	});
	const detail = detailQuery.data;
	(0, import_react.useEffect)(() => {
		if (detail?.lifecycle === "announced") rememberOrigin(id);
	}, [detail?.lifecycle, id]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionSkeleton, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (!profile || !allowed) {
		if (isCoach && adminOnly && validId) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
			to: "/weekends/$weekendId",
			params: { weekendId: String(id) }
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	}
	if (!validId) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		homeRole: profile.homeRole,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StickyBack, { children: backTo === "list" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => {
				if (!isAdmin) {
					router.history.push("/");
					return;
				}
				const fallback = "/";
				if (detail?.lifecycle === "announced") {
					router.history.push(originBack(id, "/"));
					return;
				}
				const event = detail ? parentEvent(detail, weekendsQuery.data ?? []) : null;
				if (event) {
					router.history.push(`/weekends/${event.id}`);
					return;
				}
				router.history.push(lockedBack(id, fallback));
			},
			className: "text-sm font-semibold text-primary",
			children: "Back"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/weekends/$weekendId",
			params: { weekendId: String(id) },
			className: "text-sm font-semibold text-primary",
			children: ["← ", detail?.name ?? "Tournament"]
		}) }), detailQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-6 text-sm text-muted",
			children: "Loading this weekend…"
		}) : !detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-6 rounded-md bg-warn-bg px-3 py-2 text-sm",
			role: "alert",
			children: detailQuery.error instanceof Error ? detailQuery.error.message : "Could not load that tournament."
		}) : children({
			id,
			detail,
			queryClient,
			bump: () => bumpWeekend(queryClient, id),
			readOnly: !isAdmin
		})]
	});
}
function SectionLink({ to, weekendId, title, hint, hintClassName }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		params: { weekendId },
		className: "flex min-h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-left transition-colors duration-150 hover:border-primary",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0 flex-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-sm font-bold uppercase tracking-wide leading-tight",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: `mt-0.5 block truncate text-xs ${hintClassName ?? "text-muted"}`,
				children: hint
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
			className: "h-4 w-4 shrink-0 text-muted",
			"aria-hidden": true
		})]
	});
}
var batchLoads = /* @__PURE__ */ new Map();
function useAskIfSent() {
	const pending = (0, import_react.useRef)(null);
	const left = (0, import_react.useRef)(false);
	const [ask, setAsk] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		function showIfBack() {
			if (document.visibilityState === "hidden" || !left.current || !pending.current) return;
			setAsk(pending.current);
			pending.current = null;
			left.current = false;
		}
		function onVisibility() {
			if (document.visibilityState === "hidden" && pending.current) left.current = true;
			else showIfBack();
		}
		document.addEventListener("visibilitychange", onVisibility);
		window.addEventListener("focus", showIfBack);
		return () => {
			document.removeEventListener("visibilitychange", onVisibility);
			window.removeEventListener("focus", showIfBack);
		};
	}, []);
	function expectReturn(person) {
		pending.current = person;
		left.current = false;
		setAsk(null);
		window.setTimeout(() => {
			if (pending.current?.userId !== person.userId || document.visibilityState !== "visible" || left.current) return;
			setAsk(person);
			pending.current = null;
		}, 700);
	}
	return {
		ask,
		expectReturn,
		dismiss: () => setAsk(null)
	};
}
function SentAsk({ name, onYes, onNo }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md bg-warn-bg px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm font-semibold",
			children: [
				"Did you send the text to ",
				name,
				"?"
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "outline",
				className: "flex-1",
				onClick: onNo,
				children: "Not yet"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				className: "flex-1",
				onClick: onYes,
				children: "Sent"
			})]
		})]
	});
}
function loadCoachTextBatch(season, year, batchId, weekendId) {
	const key = `${season}-${year}-${batchId ?? "new"}-${weekendId ?? "all"}`;
	const existing = batchLoads.get(key);
	if (existing) return existing;
	const promise = openCoachTexts({ data: {
		season,
		year,
		batchId,
		weekendId
	} }).finally(() => {
		batchLoads.delete(key);
	});
	batchLoads.set(key, promise);
	return promise;
}
function EventFinishText({ season, year, weekendId, onOpen, className, inline = false, noteOnly = false, force = false }) {
	const data = useQuery({
		queryKey: [
			"coach-text",
			season,
			year
		],
		queryFn: () => coachTextStatus({ data: {
			season,
			year
		} })
	}).data;
	const unsent = Boolean(data?.unsentWeekendIds.includes(weekendId));
	if (inline && force) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		type: "button",
		variant: "outline",
		size: "sm",
		className: `shrink-0 ${className ?? ""}`,
		onClick: () => onOpen(null),
		children: "Message coaches"
	});
	if (!data || !unsent) return null;
	if (inline) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		type: "button",
		variant: "outline",
		size: "sm",
		className: `shrink-0 ${className ?? ""}`,
		onClick: () => onOpen(null),
		children: "Message coaches"
	});
	if (noteOnly) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: className ? `text-sm ${className}` : "text-sm",
		children: "This weekend hasn't been texted."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: className ? `space-y-2 ${className}` : "space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm",
			children: "This weekend hasn't been texted."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			type: "button",
			className: "w-full",
			onClick: () => onOpen(null),
			children: "Message coaches"
		})]
	});
}
function CoachTextSheet({ season, year, batchId, weekendId = null, onClose }) {
	const queryClient = useQueryClient();
	const [view, setView] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const sentAsk = useAskIfSent();
	(0, import_react.useEffect)(() => {
		let cancel = false;
		loadCoachTextBatch(season, year, batchId, weekendId).then((next) => {
			if (!cancel) setView(next);
		}).catch((err) => {
			if (!cancel) setError(err instanceof Error ? err.message : "Could not open that list.");
		});
		return () => {
			cancel = true;
		};
	}, [
		season,
		year,
		batchId,
		weekendId
	]);
	function close() {
		queryClient.invalidateQueries({ queryKey: [
			"coach-text",
			season,
			year
		] });
		onClose();
	}
	if (typeof document === "undefined") return null;
	const focused = weekendId != null ? view?.events.find((event) => event.id === weekendId) : void 0;
	const events = focused ? [focused] : view?.events ?? [];
	const link = view ? focused ? `${window.location.origin}/interest?e=${focused.id}` : `${window.location.origin}${view.linkPath}` : "";
	const tournamentAges = [...new Set(events.flatMap((event) => event.ageGroups ?? []))];
	const ages = messageAges(tournamentAges);
	const groups = view ? coachTextGroups(coachesForTournamentAges(view.coaches, tournamentAges)) : [];
	function noteFor(coach) {
		return coachOutreachBody({
			kind: coach.registered ? "registered" : "invite",
			events,
			link
		});
	}
	function textCoach(coach) {
		if (!view) return;
		const href = coachSmsHref(coach.phone || "", noteFor(coach));
		if (!href) return;
		sentAsk.expectReturn({
			userId: coach.userId,
			name: coach.name
		});
		window.location.href = href;
	}
	function confirmSent() {
		if (!view || !sentAsk.ask) return;
		const userId = sentAsk.ask.userId;
		setView({
			...view,
			coaches: view.coaches.map((row) => row.userId === userId ? {
				...row,
				opened: true
			} : row)
		});
		markCoachTextOpened({ data: {
			batchId: view.batchId,
			coachUserId: userId
		} });
		sentAsk.dismiss();
	}
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[80] flex items-end justify-center bg-scrim sm:items-center",
		onClick: close,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": "Message coaches",
			className: "flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-lg border border-line bg-bg text-fg shadow-lg sm:rounded-lg",
			onClick: (event) => event.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3 border-b border-line px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-bold uppercase leading-tight",
					children: "Message coaches"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					className: "px-2 text-muted",
					onClick: close,
					children: "Close"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4 overflow-y-auto px-4 py-3",
				children: [
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
						children: error
					}) : null,
					!view && !error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Loading coaches…"
					}) : null,
					view ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						sentAsk.ask ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SentAsk, {
							name: sentAsk.ask.name,
							onYes: confirmSent,
							onNo: sentAsk.dismiss
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm",
							children: "Tap Text, then Send in Messages. The note matches that coach."
						}),
						groups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: ages.length === 0 ? "This tournament has no age yet." : ages.length === 1 ? `No ${ages[0]} coaches on the app yet.` : `No ${ages.slice(0, -1).join(", ")} or ${ages[ages.length - 1]} coaches on the app yet.`
						}) : null,
						groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-display text-lg font-bold uppercase",
								children: group.age
							}), group.coaches.map((coach) => {
								const teams = coach.teams.filter((team) => group.age === "No age" ? !team.ageGroup : team.ageGroup === group.age);
								const href = coachSmsHref(coach.phone || "", noteFor(coach));
								const status = coachOutreachLabel(coach.registered ? "registered" : "invite");
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "truncate text-sm font-semibold",
												children: coach.name
											}),
											teams.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "truncate text-xs text-muted",
												children: teams.map((team) => team.name).join(", ")
											}) : null,
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "truncate text-xs font-semibold",
												children: status
											})
										]
									}), href ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										size: "sm",
										variant: coach.opened ? "outline" : "default",
										className: "shrink-0 px-3",
										onClick: () => textCoach(coach),
										children: coach.opened ? "Sent" : "Text"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 text-xs font-semibold text-muted",
										children: "No cell number"
									})]
								}, `${group.age}-${coach.userId}`);
							})]
						}, group.age))
					] }) : null
				]
			})]
		})
	}), document.body);
}
function reminderChoiceLabel(choice) {
	if (choice === "interested") return "Registered";
	if (choice === "maybe") return "Not sure yet";
	if (choice === "no") return "Maybe next time";
	return "No response";
}
function ReminderTextSheet({ weekendId, includeNotInterested, onClose }) {
	const [view, setView] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [opened, setOpened] = (0, import_react.useState)([]);
	const sentAsk = useAskIfSent();
	(0, import_react.useEffect)(() => {
		let cancel = false;
		openReminderTexts({ data: {
			weekendId,
			includeNotInterested
		} }).then((next) => {
			if (!cancel) setView(next);
		}).catch((err) => {
			if (!cancel) setError(err instanceof Error ? err.message : "Could not open that list.");
		});
		return () => {
			cancel = true;
		};
	}, [weekendId, includeNotInterested]);
	if (typeof document === "undefined") return null;
	const link = view ? `${window.location.origin}/interest?e=${weekendId}` : "";
	const people = (view?.coaches ?? []).map((coach) => ({
		userId: coach.userId,
		name: coach.name,
		phone: coach.phone,
		teams: coach.teams,
		opened: opened.includes(coach.userId)
	}));
	const groups = coachTextGroups(people);
	const choiceOf = new Map((view?.coaches ?? []).map((coach) => [coach.userId, coach.choice]));
	function textCoach(coach) {
		if (!view) return;
		const body = coachReminderBody({
			choice: choiceOf.get(coach.userId) ?? null,
			name: view.name,
			startDate: view.startDate,
			endDate: view.endDate,
			link
		});
		const href = coachSmsHref(coach.phone || "", body);
		if (!href) return;
		sentAsk.expectReturn({
			userId: coach.userId,
			name: coach.name
		});
		window.location.href = href;
	}
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[80] flex items-end justify-center bg-scrim sm:items-center",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": "Remind coaches",
			className: "flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-lg border border-line bg-bg text-fg shadow-lg sm:rounded-lg",
			onClick: (event) => event.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3 border-b border-line px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-bold uppercase leading-tight",
					children: "Remind coaches"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					className: "px-2 text-muted",
					onClick: onClose,
					children: "Close"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4 overflow-y-auto px-4 py-3",
				children: [
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
						children: error
					}) : null,
					!view && !error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Loading coaches…"
					}) : null,
					view ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						sentAsk.ask ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SentAsk, {
							name: sentAsk.ask.name,
							onNo: sentAsk.dismiss,
							onYes: () => {
								const userId = sentAsk.ask?.userId;
								if (userId) setOpened((current) => current.includes(userId) ? current : [...current, userId]);
								sentAsk.dismiss();
							}
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm",
							children: "The note matches what each coach already picked. Tap Text, then Send in Messages."
						}),
						groups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "No coaches on the app yet."
						}) : null,
						groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-display text-lg font-bold uppercase",
								children: group.age
							}), group.coaches.map((coach) => {
								const teams = coach.teams.filter((team) => group.age === "No age" ? !team.ageGroup : team.ageGroup === group.age);
								const body = coachReminderBody({
									choice: choiceOf.get(coach.userId) ?? null,
									name: view.name,
									startDate: view.startDate,
									endDate: view.endDate,
									link
								});
								const href = coachSmsHref(coach.phone || "", body);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "truncate text-sm font-semibold",
											children: coach.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "truncate text-xs text-muted",
											children: [reminderChoiceLabel(choiceOf.get(coach.userId) ?? null), teams.length > 0 ? ` · ${teams.map((team) => team.name).join(", ")}` : ""]
										})]
									}), href ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										size: "sm",
										variant: coach.opened ? "outline" : "default",
										className: "shrink-0 px-3",
										onClick: () => textCoach(coach),
										children: coach.opened ? "Sent" : "Text"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 text-xs font-semibold text-muted",
										children: "No cell number"
									})]
								}, `${group.age}-${coach.userId}`);
							})]
						}, group.age))
					] }) : null
				]
			})]
		})
	}), document.body);
}
function EventEditForm({ detail, hosted, onClose }) {
	const queryClient = useQueryClient();
	const [name, setName] = (0, import_react.useState)(detail.name);
	const [startDate, setStartDate] = (0, import_react.useState)(detail.startDate);
	const [endDate, setEndDate] = (0, import_react.useState)(detail.endDate);
	const [formError, setFormError] = (0, import_react.useState)(null);
	const [matchAsk, setMatchAsk] = (0, import_react.useState)(false);
	const outside = hosted.filter((item) => item.startDate < startDate || item.endDate > endDate);
	const save = useMutation({
		mutationFn: (matchTournaments) => updateAnnouncedEvent({ data: {
			weekendId: detail.id,
			name: name.trim(),
			startDate,
			endDate,
			matchTournaments
		} }),
		onSuccess: async () => {
			bumpWeekend(queryClient, detail.id);
			await queryClient.invalidateQueries({ queryKey: ["schedule"] });
			await queryClient.invalidateQueries({ queryKey: ["season-cards"] });
			await queryClient.invalidateQueries({ queryKey: ["season-plan"] });
			onClose();
		}
	});
	function submit(event) {
		event.preventDefault();
		setFormError(null);
		if (outside.length > 0) {
			setMatchAsk(true);
			return;
		}
		setMatchAsk(false);
		save.mutate(false);
	}
	const errorText = formError ?? (save.error instanceof Error ? save.error.message : save.error ? "Could not save that event." : null);
	const matchNames = outside.map((item) => item.name).join(", ");
	const matchDays = startDate === endDate ? formatWeekdayLong(startDate) : `${formatWeekdayLong(startDate)}–${formatWeekdayLong(endDate)}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		noValidate: true,
		onSubmit: submit,
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block space-y-1 text-sm font-semibold",
				children: ["Name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: name,
					onChange: (event) => setName(event.target.value),
					maxLength: 80,
					autoComplete: "off"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["First day", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MondayDateInput, {
						value: startDate,
						withWeekday: true,
						onChange: (next) => {
							setMatchAsk(false);
							setStartDate(next);
							if (endDate && next && endDate < next) setEndDate(next);
						}
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1 text-sm font-semibold",
					children: ["Last day", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MondayDateInput, {
						value: endDate,
						min: startDate,
						withWeekday: true,
						onChange: (next) => {
							setMatchAsk(false);
							setEndDate(next);
						}
					})]
				})]
			}),
			matchAsk && outside.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						matchNames,
						" would fall outside these dates. Change ",
						outside.length === 1 ? "that tournament" : "those tournaments",
						" to ",
						matchDays,
						" so ",
						outside.length === 1 ? "it matches" : "they match",
						" this event?"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-muted",
						children: "Games on a day that no longer fits move onto the new first or last day."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-col gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							disabled: save.isPending,
							onClick: () => save.mutate(true),
							children: save.isPending ? "Saving…" : "Change the tournament dates"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							disabled: save.isPending,
							onClick: () => setMatchAsk(false),
							children: "Leave the tournament dates"
						})]
					})
				]
			}) : null,
			errorText && !matchAsk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
				role: "alert",
				children: errorText
			}) : null,
			matchAsk ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				className: "w-full",
				disabled: save.isPending || !name.trim() || !startDate || endDate < startDate,
				children: save.isPending ? "Saving…" : "Save"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "ghost",
				className: "w-full",
				disabled: save.isPending,
				onClick: onClose,
				children: "Cancel"
			})
		]
	});
}
function ageBreakdown(counts) {
	const known = AGE_GROUPS.filter((age) => (counts?.[age] ?? 0) > 0).map((age) => ({
		age,
		n: counts?.[age] ?? 0
	}));
	const rest = Object.entries(counts ?? {}).filter(([age, count]) => count > 0 && !AGE_GROUPS.includes(age)).map(([age, n]) => ({
		age,
		n
	}));
	return [...known, ...rest];
}
function fieldsTheBracketNeeds(teams) {
	if (teams <= 0) return 1;
	return fieldsNeeded(teams);
}
function fieldHint(teams, saved) {
	const need = fieldsTheBracketNeeds(teams);
	const short = need - saved;
	if (saved === 0) return short === 1 ? "Add 1 field" : `Add ${need} fields`;
	if (short === 1) return "Add 1 field";
	if (short > 1) return `Add ${short} fields`;
	if (saved > need) return `Uses ${need} of ${saved}`;
	return need === 1 ? "1 field" : `${need} fields`;
}
function fieldCountTone(teams, saved) {
	const need = fieldsTheBracketNeeds(teams);
	if (saved === 0) return "text-[#c0392b]";
	if (saved === need) return "text-[#1f7a45]";
	return "text-[#c9a227]";
}
function staffHintTone(hint) {
	if (hint === "Staff set") return "text-[#1f7a45]";
	if (hint === "Add a field first" || hint === "Needs staff") return "text-[#c0392b]";
}
function teamCountTone(count) {
	if (count >= 12) return "text-[#1f7a45]";
	if (count >= 3) return "text-[#c9a227]";
	return "text-[#c0392b]";
}
var Route$5 = createFileRoute("/weekends/$weekendId/")({ component: TournamentHubPage });
function TournamentHubPage() {
	const { weekendId } = Route$5.useParams();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const id = Number.parseInt(weekendId, 10);
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(false);
	const [deleteStep, setDeleteStep] = (0, import_react.useState)(null);
	const [editingEvent, setEditingEvent] = (0, import_react.useState)(false);
	const [coachText, setCoachText] = (0, import_react.useState)(null);
	const [remindHold, setRemindHold] = (0, import_react.useState)(null);
	const [remindTexts, setRemindTexts] = (0, import_react.useState)(null);
	const seedMut = useMutation({
		mutationFn: (input) => resolveSeedConflict({ data: {
			weekendId: id,
			...input
		} }),
		onSuccess: () => bumpWeekend(queryClient, id)
	});
	const deleteMut = useMutation({
		mutationFn: (notify) => deleteWeekend({ data: {
			weekendId: id,
			notify
		} }),
		onSuccess: async () => {
			await navigate({ to: "/" });
			await queryClient.invalidateQueries({ queryKey: ["weekends"] });
			await queryClient.invalidateQueries({ queryKey: ["season-cards"] });
			await queryClient.invalidateQueries({ queryKey: ["season-plan"] });
			await queryClient.invalidateQueries({ queryKey: ["my-schedule"] });
			await queryClient.invalidateQueries({ queryKey: ["my-teams"] });
		}
	});
	const promoteMut = useMutation({
		mutationFn: (includeNotInterested) => promoteTournament({ data: {
			weekendId: id,
			includeNotInterested
		} }),
		onSuccess: async (result, includeNotInterested) => {
			if (result.blocked) {
				setRemindHold(result.notInterested);
				return;
			}
			setRemindHold(null);
			setRemindTexts(includeNotInterested);
			await queryClient.invalidateQueries({ queryKey: ["notifications"] });
		}
	});
	const weekendsQuery = useQuery({
		queryKey: ["weekends"],
		queryFn: () => listWeekends()
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeekendAdminFrame, {
		weekendId,
		backTo: "list",
		children: ({ detail, readOnly }) => {
			const announced = detail.lifecycle === "announced";
			const textSeason = detail.season && detail.seasonYear ? {
				season: detail.season,
				year: detail.seasonYear
			} : seasonFromDate(detail.startDate);
			const error = seedMut.error instanceof Error && seedMut.error.message || deleteMut.error instanceof Error && deleteMut.error.message || promoteMut.error instanceof Error && promoteMut.error.message || null;
			const hosted = (weekendsQuery.data ?? []).filter((weekend) => weekend.id !== detail.id && weekend.lifecycle !== "announced" && weekend.startDate >= detail.startDate && weekend.endDate <= detail.endDate).sort((a, b) => a.name.localeCompare(b.name));
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-[calc(100dvh-11rem)] flex-col",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3",
						children: announced && editingEvent && !readOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventEditForm, {
							detail,
							hosted,
							onClose: () => setEditingEvent(false)
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "font-display text-4xl font-bold uppercase",
									children: detail.name
								}), announced && !readOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									size: "sm",
									className: "shrink-0",
									onClick: () => setEditingEvent(true),
									children: "Edit"
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: formatWeekendRange(detail.startDate, detail.endDate)
								}), detail.teamFeeCents != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm font-semibold",
									children: [formatTeamFee(detail.teamFeeCents), " per team"]
								}) : null]
							}),
							textSeason && !readOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventFinishText, {
									season: textSeason.season,
									year: textSeason.year,
									weekendId: detail.id,
									noteOnly: true,
									onOpen: (batchId) => setCoachText({
										batchId,
										weekendId: detail.id
									})
								})
							}) : null
						] })
					}),
					!announced ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "min-w-0 text-sm text-muted",
							children: [
								formatAgeGroups(detail.ageGroups) || "No ages yet",
								" · ",
								detail.approvedCount,
								"/",
								detail.maxTeams,
								" in"
							]
						}), textSeason && !readOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventFinishText, {
							season: textSeason.season,
							year: textSeason.year,
							weekendId: detail.id,
							inline: true,
							force: true,
							onOpen: (batchId) => setCoachText({
								batchId,
								weekendId: detail.id
							})
						}) : null]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 space-y-5",
						children: [!readOnly && remindHold ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-md bg-warn-bg p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold",
									children: remindHold.length === 1 ? "1 coach said maybe next time." : `${remindHold.length} coaches said maybe next time.`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-2 space-y-1",
									children: remindHold.map((coach) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "text-sm",
										children: [coach.name, coach.teams.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-muted",
											children: [" · ", coach.teams.join(", ")]
										}) : null]
									}, coach.userId))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm",
									children: "Sending anyway texts them that spots are still open if they change their mind, and puts that note in the app."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "outline",
										className: "flex-1",
										disabled: promoteMut.isPending,
										onClick: () => setRemindHold(null),
										children: "Don't send"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										className: "flex-1",
										disabled: promoteMut.isPending,
										onClick: () => promoteMut.mutate(true),
										children: promoteMut.isPending ? "Sending…" : "Send anyway"
									})]
								})
							]
						}) : !readOnly && promoteMut.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: promoteMut.data.sent === 0 ? "No coaches on the app yet." : "Reminder is in the app. Send each text from the list."
						}) : null, !readOnly && announced ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-baseline gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-xl font-bold uppercase",
									children: "Tournaments"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/weekends",
									search: {
										add: 1,
										announce: detail.id
									},
									className: "text-sm font-medium text-[#2f89e6]",
									children: hosted.length === 0 ? "Create a Tournament" : "Create another Tournament"
								})]
							}), hosted.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "No tournaments for these dates yet."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: hosted.length > 1 ? "grid grid-cols-2 gap-2" : "space-y-2",
								children: hosted.map((weekend) => {
									const ages = ageBreakdown(weekend.approvedByAge);
									const needs = neededToFinish(weekend);
									const teams = weekend.approvedCount === 1 ? "1 team" : `${weekend.approvedCount} teams`;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/weekends/$weekendId",
										params: { weekendId: String(weekend.id) },
										className: "block h-full rounded-lg border border-line bg-surface px-2.5 py-2.5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "block text-sm font-semibold leading-tight",
												children: weekend.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-1 block text-xs text-muted",
												children: teams
											}),
											ages.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-1.5 flex flex-wrap gap-1",
												children: ages.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "rounded bg-sheet-surface px-1.5 py-0.5 text-[11px] font-semibold",
													children: [
														item.age,
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-muted",
															children: item.n
														})
													]
												}, item.age))
											}) : null,
											needs.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-1.5 block text-[11px] font-semibold leading-tight text-[#c9a227]",
												children: needs.join(" · ")
											}) : null
										]
									}) }, weekend.id);
								})
							})]
						}) : null]
					}),
					!readOnly && detail.placeConflict ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 rounded-md border border-line bg-surface p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: "A pool score can move a frozen seed."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted",
								children: "Keep the original seeds, or reseed. Reseed asks again if bracket games already have a result."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									className: "flex-1",
									disabled: seedMut.isPending,
									onClick: () => seedMut.mutate({ action: "keep" }),
									children: "Keep original"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									className: "flex-1",
									disabled: seedMut.isPending,
									onClick: () => seedMut.mutate({
										action: "reseed",
										confirm: seedMut.error instanceof Error && seedMut.error.message.includes("Confirm")
									}),
									children: seedMut.error instanceof Error && seedMut.error.message.includes("Confirm") ? "Reseed anyway" : "Reseed"
								})]
							})
						]
					}) : null,
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm",
						role: "alert",
						children: error
					}) : null,
					announced ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/bracket/$weekendId",
						params: { weekendId: String(detail.id) },
						"aria-label": readOnly || detail.hasPoolGames || detail.hasBracket ? "Open bracket" : "Build bracket",
						className: "mt-4 flex min-h-0 flex-1 items-center justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex h-[88%] w-full items-center justify-center rounded-lg border border-line bg-[#f2f2f2] p-3 shadow-[0_10px_28px_rgba(0,0,0,0.22)]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BracketPicture, {})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: announced ? "" : "mt-4 shrink-0",
						children: [announced ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "grid w-full grid-cols-2 gap-2",
							"aria-label": "Tournament sections",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLink, {
									to: "/weekends/$weekendId/edit",
									weekendId,
									title: "Details",
									hint: detail.teamFeeCents == null ? "Name, dates, age, fee" : `${formatTeamFee(detail.teamFeeCents)} per team`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLink, {
									to: "/weekends/$weekendId/rules",
									weekendId,
									title: "Rules",
									hint: `${ELIMINATION_LABELS[detail.rules.elimination]} · ${ADVANCE_LABELS[detail.rules.advance]}`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLink, {
									to: "/weekends/$weekendId/teams",
									weekendId,
									title: "Teams",
									hint: detail.approvedCount === 0 ? "No teams yet" : `${detail.approvedCount}/${detail.maxTeams} in`,
									hintClassName: teamCountTone(detail.approvedCount)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLink, {
									to: "/weekends/$weekendId/locations",
									weekendId,
									title: "Fields",
									hint: fieldHint(detail.approvedCount, detail.locations.length),
									hintClassName: fieldCountTone(detail.approvedCount, detail.locations.length)
								}),
								!readOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLink, {
									to: "/weekends/$weekendId/staff",
									weekendId,
									title: "Staff",
									hint: detail.staffHint,
									hintClassName: staffHintTone(detail.staffHint)
								}) : null
							]
						}), readOnly ? null : announced ? deleteStep === "sure" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 rounded-md bg-warn-bg p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold",
									children: "Delete this event?"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-sm text-muted",
									children: [
										"This takes ",
										detail.name,
										" off the schedule. This can’t be undone."
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "outline",
										className: "flex-1",
										onClick: () => setDeleteStep(null),
										children: "Keep it"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "danger",
										className: "flex-1",
										onClick: () => setDeleteStep("notice"),
										children: "Yes, delete it"
									})]
								})
							]
						}) : deleteStep === "notice" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 rounded-md bg-warn-bg p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: "Send every coach a notice that this weekend was cancelled?"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-col gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "danger",
									disabled: deleteMut.isPending,
									onClick: () => deleteMut.mutate(true),
									children: deleteMut.isPending ? "Deleting…" : "Send notice"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									disabled: deleteMut.isPending,
									onClick: () => deleteMut.mutate(false),
									children: "Delete without a notice"
								})]
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							className: "mt-4 w-full text-muted",
							onClick: () => setDeleteStep("sure"),
							children: "Delete event"
						}) : confirmDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 rounded-md bg-warn-bg p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold",
									children: announced ? `Take ${detail.name} off the schedule?` : `Delete ${detail.name}?`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: announced ? "Nothing else is built yet. This can’t be undone." : "Teams, the bracket, and scores for this weekend come off the board. This can’t be undone."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "outline",
										className: "flex-1",
										disabled: deleteMut.isPending,
										onClick: () => setConfirmDelete(false),
										children: "Keep it"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "danger",
										className: "flex-1",
										disabled: deleteMut.isPending,
										onClick: () => deleteMut.mutate(false),
										children: deleteMut.isPending ? "Deleting…" : "Delete"
									})]
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							className: "mt-4 w-full text-muted",
							onClick: () => setConfirmDelete(true),
							children: "Delete tournament"
						})]
					}),
					!readOnly && coachText && textSeason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachTextSheet, {
						season: textSeason.season,
						year: textSeason.year,
						batchId: coachText.batchId,
						weekendId: coachText.weekendId,
						onClose: () => setCoachText(null)
					}) : null,
					!readOnly && remindTexts != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReminderTextSheet, {
						weekendId: detail.id,
						includeNotInterested: remindTexts,
						onClose: () => setRemindTexts(null)
					}) : null
				]
			});
		}
	});
}
function BracketPicture() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: "/bracket-sheet.jpg",
		alt: "",
		className: "max-h-full w-full object-contain"
	});
}
var Route$4 = createFileRoute("/weekends/$weekendId/edit")({ component: TournamentEditPage });
function toDrafts(ages, weekendMax) {
	return ages.map((age) => ({
		ageGroup: age.ageGroup,
		min: String(age.minTeams ?? 3),
		max: String(age.maxTeams ?? weekendMax)
	}));
}
function TournamentEditPage() {
	const { weekendId } = Route$4.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeekendAdminFrame, {
		weekendId,
		backTo: "hub",
		children: (ctx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditForm, { ...ctx })
	});
}
function EditForm({ id, detail, queryClient, bump, readOnly }) {
	const [name, setName] = (0, import_react.useState)(detail.name);
	const [startDate, setStartDate] = (0, import_react.useState)(detail.startDate);
	const [endDate, setEndDate] = (0, import_react.useState)(detail.endDate);
	const [drafts, setDrafts] = (0, import_react.useState)(() => toDrafts(detail.ages, detail.maxTeams));
	const [teamFee, setTeamFee] = (0, import_react.useState)(() => teamFeeInputValue(detail.teamFeeCents));
	const [ageWarned, setAgeWarned] = (0, import_react.useState)(false);
	const [formError, setFormError] = (0, import_react.useState)(null);
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		setName(detail.name);
		setStartDate(detail.startDate);
		setEndDate(detail.endDate);
		setDrafts(toDrafts(detail.ages, detail.maxTeams));
		setTeamFee(teamFeeInputValue(detail.teamFeeCents));
		setAgeWarned(false);
	}, [detail]);
	const lockedAges = new Set(detail.ages.filter((age) => age.teamCount > 0).map((age) => age.ageGroup));
	const saveMut = useMutation({
		mutationFn: (input) => updateWeekend({ data: input }),
		onSuccess: (next) => {
			setFormError(null);
			queryClient.setQueryData(["weekend", id], next);
			bump();
			navigate({
				to: "/weekends/$weekendId",
				params: { weekendId: String(id) }
			});
		}
	});
	function alignDates(nextStart, nextEnd) {
		setStartDate(nextStart);
		setEndDate(nextEnd);
	}
	function toggleAge(group) {
		setFormError(null);
		setAgeWarned(false);
		setDrafts((current) => {
			if (current.some((row) => row.ageGroup === group)) {
				if (lockedAges.has(group)) {
					setFormError(`Can’t drop ${group} while a team is on it.`);
					return current;
				}
				return current.filter((row) => row.ageGroup !== group);
			}
			const cap = String(detail.maxTeams);
			return [...current, {
				ageGroup: group,
				min: String(3),
				max: cap
			}].sort((a, b) => AGE_GROUPS.indexOf(a.ageGroup) - AGE_GROUPS.indexOf(b.ageGroup));
		});
	}
	function save(event) {
		event.preventDefault();
		setFormError(null);
		if (detail.ages.map((age) => age.ageGroup).join(", ") !== drafts.map((row) => row.ageGroup).join(", ") && !ageWarned) {
			setAgeWarned(true);
			return;
		}
		const dayPlan = detail.poolPlay ? defaultDayPlan(startDate, endDate) : defaultDayPlan(startDate, endDate).map((row) => ({
			...row,
			kind: "bracket"
		}));
		try {
			saveMut.mutate(weekendSavePayload(detail, {
				name,
				startDate,
				endDate,
				maxTeams: detail.maxTeams,
				dayPlan,
				ages: drafts.map((row) => ({
					ageGroup: row.ageGroup,
					minTeams: row.min,
					maxTeams: row.max
				})),
				teamFee
			}));
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "Check the form and try again.");
		}
	}
	const errorText = formError ?? (saveMut.error instanceof Error ? saveMut.error.message : saveMut.error ? "Could not save that tournament." : null);
	return readOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
		className: "mt-3 font-display text-4xl font-bold uppercase",
		children: "Details"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
		className: "mt-6 space-y-3 text-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
				className: "text-muted",
				children: "Name"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
				className: "font-semibold",
				children: detail.name
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
				className: "text-muted",
				children: "Dates"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
				className: "font-semibold",
				children: formatWeekendRange(detail.startDate, detail.endDate)
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
				className: "text-muted",
				children: "Team fee"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
				className: "font-semibold",
				children: detail.teamFeeCents == null ? "No fee set" : `${formatTeamFee(detail.teamFeeCents)} per team`
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
				className: "text-muted",
				children: "Ages"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
				className: "font-semibold",
				children: formatAgeGroups(detail.ageGroups) || "No ages yet"
			})] })
		]
	})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-3 font-display text-4xl font-bold uppercase",
			children: "Edit tournament"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted",
			children: "Name, dates, age, and what each team pays."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			noValidate: true,
			onSubmit: save,
			className: "mt-6 space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "weekend-name",
						children: "Name"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "weekend-name",
						value: name,
						onChange: (e) => setName(e.target.value),
						autoComplete: "off",
						maxLength: 80
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "weekend-fee",
							children: "Team fee"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "weekend-fee",
							value: teamFee,
							onChange: (e) => setTeamFee(e.target.value),
							placeholder: "Leave blank if there's no fee",
							inputMode: "decimal",
							autoComplete: "off"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "Dollars per team. Clear it if this tournament is free."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "weekend-start",
							children: "First day"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MondayDateInput, {
							id: "weekend-start",
							value: startDate,
							withWeekday: true,
							onChange: (next) => {
								alignDates(next, endDate && next && endDate < next ? next : endDate);
							}
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "weekend-end",
							children: "Last day"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MondayDateInput, {
							id: "weekend-end",
							value: endDate,
							min: startDate || void 0,
							withWeekday: true,
							onChange: (next) => alignDates(startDate, next)
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
							className: "text-sm font-semibold text-fg",
							children: "Age groups"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "Tap to add an age. Ages with a team stay on."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-4 gap-2",
							children: AGE_GROUPS.map((group) => {
								const on = drafts.some((row) => row.ageGroup === group);
								const locked = lockedAges.has(group);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": on,
									onClick: () => toggleAge(group),
									className: cn("min-h-11 rounded-md border text-sm font-semibold", on ? "border-pine bg-pine text-pine-fg" : "border-line bg-bg text-fg hover:bg-surface", locked ? "cursor-default" : ""),
									children: group
								}, group);
							})
						})
					]
				}),
				ageWarned ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
					children: [
						"This changes the age from ",
						detail.ages.map((age) => age.ageGroup).join(", ") || "none",
						" to ",
						drafts.map((row) => row.ageGroup).join(", ") || "none",
						". Save again to keep it."
					]
				}) : null,
				errorText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
					role: "alert",
					children: errorText
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					size: "lg",
					className: "w-full",
					disabled: saveMut.isPending,
					children: saveMut.isPending ? "Saving…" : "Save"
				})
			]
		})
	] });
}
var Route$3 = createFileRoute("/weekends/$weekendId/locations")({ component: TournamentLocationsPage });
function TournamentLocationsPage() {
	const { weekendId } = Route$3.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeekendAdminFrame, {
		weekendId,
		backTo: "hub",
		children: (ctx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocationsBody, { ...ctx })
	});
}
function newDraft() {
	return {
		key: `${Date.now()}-${Math.random()}`,
		parkId: "",
		name: "",
		address: "",
		flags: emptyParkFlags()
	};
}
function parkKey(name, address) {
	return `${name.trim().toLowerCase()}|${address.trim().toLowerCase()}`;
}
function LocationsBody({ id, detail, queryClient, bump, readOnly }) {
	const navigate = useNavigate();
	const required = detail.approvedCount >= 8 ? 2 : 1;
	const [extra, setExtra] = (0, import_react.useState)(0);
	const requiredSlots = Math.max(0, required - detail.locations.length);
	const needed = requiredSlots + extra;
	const [drafts, setDrafts] = (0, import_react.useState)(() => Array.from({ length: needed }, newDraft));
	const [errorKey, setErrorKey] = (0, import_react.useState)(null);
	const [errorText, setErrorText] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setDrafts((current) => {
			if (current.length >= needed) return current;
			return [...current, ...Array.from({ length: needed - current.length }, newDraft)];
		});
	}, [needed]);
	const knownQuery = useQuery({
		queryKey: ["known-parks"],
		queryFn: () => listKnownParks(),
		enabled: !readOnly
	});
	const addParkMut = useMutation({
		mutationFn: (input) => addWeekendLocation({ data: {
			weekendId: id,
			name: input.name,
			address: input.address,
			...input.flags
		} }),
		onSuccess: (next, input) => {
			setDrafts((current) => current.filter((draft) => draft.key !== input.draftKey));
			setExtra((count) => detail.locations.length + 1 > required ? Math.max(0, count - 1) : count);
			setErrorKey(null);
			setErrorText(null);
			queryClient.setQueryData(["weekend", id], next);
			queryClient.invalidateQueries({ queryKey: ["known-parks"] });
			bump();
			navigate({
				to: "/weekends/$weekendId",
				params: { weekendId: String(id) }
			});
		}
	});
	const primaryMut = useMutation({
		mutationFn: (locationId) => setPrimaryPark({ data: { id: locationId } }),
		onSuccess: (next) => {
			queryClient.setQueryData(["weekend", id], next);
			bump();
		}
	});
	const removeParkMut = useMutation({
		mutationFn: (locationId) => removeWeekendLocation({ data: { id: locationId } }),
		onSuccess: (next) => {
			queryClient.setQueryData(["weekend", id], next);
			bump();
		}
	});
	const used = new Set(detail.locations.map((location) => parkKey(location.name, location.address)));
	const known = (knownQuery.data ?? []).filter((park) => !used.has(parkKey(park.name, park.address)));
	function updateDraft(key, patch) {
		setDrafts((current) => current.map((draft) => draft.key === key ? {
			...draft,
			...patch
		} : draft));
	}
	function pickKnown(draft, parkId) {
		const park = known.find((row) => String(row.id) === parkId);
		if (!park) {
			updateDraft(draft.key, { parkId: "" });
			return;
		}
		updateDraft(draft.key, {
			parkId,
			name: park.name,
			address: park.address,
			flags: {
				chairs: park.chairs,
				canopies: park.canopies,
				concessions: park.concessions,
				restrooms: park.restrooms,
				lights: park.lights,
				bleachers: park.bleachers,
				entranceFee: park.entranceFee,
				entrancePrice: park.entrancePrice,
				ageDiscount: park.ageDiscount,
				discountAges: park.discountAges,
				discountPrice: park.discountPrice
			}
		});
	}
	function saveDraft(event, draft) {
		event.preventDefault();
		setErrorKey(draft.key);
		setErrorText(null);
		try {
			const parsed = parseLocationInput({
				weekendId: id,
				name: draft.name,
				address: draft.address
			});
			addParkMut.mutate({
				draftKey: draft.key,
				name: parsed.name,
				address: parsed.address,
				flags: draft.flags
			});
		} catch (err) {
			setErrorText(err instanceof Error ? err.message : "Check the park and try again.");
		}
	}
	const saveError = errorText ?? (addParkMut.error instanceof Error ? addParkMut.error.message : addParkMut.error ? "Could not add that park." : null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-3 font-display text-4xl font-bold uppercase",
			children: "Locations"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted",
			children: readOnly ? detail.locations.length === 0 ? "No parks yet." : "Parks for this tournament." : required > 1 ? `${detail.approvedCount} teams need 2 parks. A second park is required from 8 teams up.` : "7 or fewer teams use 1 park. Name and address are required."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 space-y-3",
			children: [
				readOnly ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-end",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						className: "h-11 w-11 min-h-11 px-0",
						"aria-label": "Add another park",
						onClick: () => setExtra((count) => count + 1),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							className: "h-5 w-5",
							"aria-hidden": true
						})
					})
				}),
				readOnly && detail.locations.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted",
					children: "No parks yet."
				}) : null,
				detail.locations.map((location, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SavedPark, {
					location,
					index,
					readOnly,
					busyPrimary: primaryMut.isPending,
					busyRemove: removeParkMut.isPending,
					onPrimary: () => primaryMut.mutate(location.id),
					onRemove: () => removeParkMut.mutate(location.id),
					onSaved: (next) => {
						queryClient.setQueryData(["weekend", id], next);
						queryClient.invalidateQueries({ queryKey: ["known-parks"] });
						bump();
						navigate({
							to: "/weekends/$weekendId",
							params: { weekendId: String(id) }
						});
					}
				}, location.id)),
				readOnly ? null : drafts.map((draft, index) => {
					const taken = new Set(drafts.filter((row) => row.key !== draft.key && row.parkId).map((row) => row.parkId));
					const options = known.filter((park) => !taken.has(String(park.id)) || String(park.id) === draft.parkId);
					const pending = addParkMut.isPending && addParkMut.variables?.draftKey === draft.key;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: (event) => saveDraft(event, draft),
						className: "space-y-3 rounded-lg border border-dashed border-line bg-surface p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-baseline gap-x-3 gap-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-display text-2xl font-bold uppercase leading-none",
									children: ["Park ", detail.locations.length + index + 1]
								}), detail.locations.length + index + 1 === 2 && index < requiredSlots ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm font-semibold text-[#c9a227]",
									children: [
										"Second park required for ",
										detail.approvedCount,
										" teams"
									]
								}) : detail.locations.length + index + 1 === 2 && required < 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm font-semibold text-muted",
									children: [
										detail.approvedCount,
										" ",
										detail.approvedCount === 1 ? "team does" : "teams do",
										" not require a second park"
									]
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: `saved-${draft.key}`,
										children: "Previously added parks"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										id: `saved-${draft.key}`,
										value: draft.parkId,
										onChange: (event) => pickKnown(draft, event.target.value),
										className: "h-12 w-full rounded-md border border-line bg-surface px-3 text-base text-fg",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: knownQuery.isPending ? "Loading saved parks…" : options.length === 0 ? "No saved parks yet" : "Choose a saved park"
										}), options.map((park) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: park.id,
											children: park.name
										}, park.id))]
									}),
									knownQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted",
										children: "Saved parks could not be loaded. You can still type a new one."
									}) : null
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: `name-${draft.key}`,
									children: "Name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: `name-${draft.key}`,
									value: draft.name,
									onChange: (event) => updateDraft(draft.key, {
										name: event.target.value,
										parkId: ""
									}),
									placeholder: "McMinn County HS",
									autoComplete: "off",
									maxLength: 80,
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: `address-${draft.key}`,
									children: "Address"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: `address-${draft.key}`,
									value: draft.address,
									onChange: (event) => updateDraft(draft.key, {
										address: event.target.value,
										parkId: ""
									}),
									placeholder: "2215 Congress Parkway, Athens, TN",
									autoComplete: "street-address",
									maxLength: 160,
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParkOptions, {
								idPrefix: draft.key,
								flags: draft.flags,
								onChange: (flags) => updateDraft(draft.key, { flags })
							}),
							errorKey === draft.key && saveError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
								role: "alert",
								children: saveError
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [index >= requiredSlots ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									className: "flex-1",
									disabled: pending,
									onClick: () => {
										setDrafts((current) => current.filter((row) => row.key !== draft.key));
										setExtra((count) => Math.max(0, count - 1));
										if (errorKey === draft.key) {
											setErrorKey(null);
											setErrorText(null);
										}
									},
									children: "Cancel"
								}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									className: index >= requiredSlots ? "flex-1" : "w-full",
									disabled: pending,
									children: pending ? "Adding…" : "Save park"
								})]
							})
						]
					}, draft.key);
				})
			]
		})
	] });
}
function flagsFrom(location) {
	return {
		chairs: location.chairs,
		canopies: location.canopies,
		concessions: location.concessions,
		restrooms: location.restrooms,
		lights: location.lights,
		bleachers: location.bleachers,
		entranceFee: location.entranceFee,
		entrancePrice: location.entrancePrice,
		ageDiscount: location.ageDiscount,
		discountAges: location.discountAges,
		discountPrice: location.discountPrice
	};
}
function SavedPark({ location, index, readOnly, busyPrimary, busyRemove, onPrimary, onRemove, onSaved }) {
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)(location.name);
	const [address, setAddress] = (0, import_react.useState)(location.address);
	const [flags, setFlags] = (0, import_react.useState)(() => flagsFrom(location));
	const [formError, setFormError] = (0, import_react.useState)(null);
	const saveMut = useMutation({
		mutationFn: (saveToResource) => updateWeekendLocation({ data: {
			id: location.id,
			name,
			address,
			saveToResource,
			...flags
		} }),
		onSuccess: (next) => {
			setFormError(null);
			setEditing(false);
			onSaved(next);
		}
	});
	const summary = parkSummary(location);
	const errorText = formError ?? (saveMut.error instanceof Error ? saveMut.error.message : saveMut.error ? "Could not save that park." : null);
	function save(saveToResource) {
		setFormError(null);
		try {
			const parsed = parseLocationInput({
				weekendId: 1,
				name,
				address
			});
			setName(parsed.name);
			setAddress(parsed.address);
			saveMut.mutate(saveToResource);
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "Check the park and try again.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-lg border border-line bg-surface px-4 py-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-xs font-bold uppercase tracking-wide text-muted",
			children: ["Park ", index + 1]
		}), editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 space-y-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: `edit-name-${location.id}`,
						children: "Name"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: `edit-name-${location.id}`,
						value: name,
						onChange: (event) => setName(event.target.value),
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: `edit-address-${location.id}`,
						children: "Address"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: `edit-address-${location.id}`,
						value: address,
						onChange: (event) => setAddress(event.target.value),
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParkOptions, {
					idPrefix: `edit-${location.id}`,
					flags,
					onChange: setFlags
				}),
				errorText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
					role: "alert",
					children: errorText
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParkSaveChoice, {
					busy: saveMut.isPending,
					onTournamentOnly: () => save(false),
					onUpdateResource: () => save(true)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					className: "w-full text-muted",
					onClick: () => setEditing(false),
					children: "Cancel"
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-1 font-display text-2xl font-bold uppercase leading-none",
				children: location.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm",
				children: location.address
			}),
			summary ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs font-semibold uppercase tracking-wide text-muted",
				children: summary
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-wrap items-center gap-2",
				children: readOnly ? location.isPrimary ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold",
					children: "Primary park"
				}) : null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-pressed": location.isPrimary,
						disabled: busyPrimary,
						onClick: onPrimary,
						className: location.isPrimary ? "min-h-11 rounded-md border border-pine bg-pine px-3 text-sm font-semibold text-pine-fg" : "min-h-11 rounded-md border border-line bg-bg px-3 text-sm font-semibold",
						children: location.isPrimary ? "Primary park" : "Make primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						onClick: () => {
							setName(location.name);
							setAddress(location.address);
							setFlags(flagsFrom(location));
							setFormError(null);
							setEditing(true);
						},
						children: "Edit"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						className: "px-0 text-muted",
						disabled: busyRemove,
						onClick: onRemove,
						children: "Remove"
					})
				] })
			})
		] })]
	});
}
var Route$2 = createFileRoute("/weekends/$weekendId/rules")({ component: BracketRulesPage });
function BracketRulesPage() {
	const { weekendId } = Route$2.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeekendAdminFrame, {
		weekendId,
		backTo: "hub",
		children: (ctx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RulesForm, { ...ctx })
	});
}
function RulesForm({ id, detail, queryClient, bump, readOnly }) {
	const navigate = useNavigate();
	const [rules, setRules] = (0, import_react.useState)(detail.rules ?? DEFAULT_BRACKET_RULES);
	const [formError, setFormError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setRules(detail.rules ?? DEFAULT_BRACKET_RULES);
	}, [detail]);
	const saveMut = useMutation({
		mutationFn: (input) => updateWeekend({ data: input }),
		onSuccess: (next) => {
			setFormError(null);
			queryClient.setQueryData(["weekend", id], next);
			bump();
			navigate({
				to: "/weekends/$weekendId",
				params: { weekendId: String(id) }
			});
		}
	});
	function save(event) {
		event.preventDefault();
		setFormError(null);
		try {
			saveMut.mutate(weekendSavePayload(detail, { rules }));
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "Check the rules and try again.");
		}
	}
	const errorText = formError ?? (saveMut.error instanceof Error ? saveMut.error.message : saveMut.error ? "Could not save those rules." : null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-3 font-display text-4xl font-bold uppercase",
			children: "Rules"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted",
			children: readOnly ? "Who advances, pool games, and clocks." : "Edit who advances, pool games, and clocks."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			noValidate: true,
			onSubmit: save,
			className: "mt-6 space-y-6 pb-24",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("fieldset", {
					disabled: readOnly,
					className: "space-y-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RulesFields, {
						rules,
						setRules,
						maxTeams: detail.maxTeams
					})
				}),
				errorText && !readOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
					role: "alert",
					children: errorText
				}) : null,
				readOnly ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sticky bottom-0 z-10 -mx-4 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						size: "lg",
						className: "w-full",
						disabled: saveMut.isPending,
						children: saveMut.isPending ? "Saving…" : "Save rules"
					})
				})
			]
		})
	] });
}
var Route$1 = createFileRoute("/weekends/$weekendId/staff")({ component: TournamentStaffPage });
var ROLES = [{
	role: "gate",
	label: "Gate attendant"
}, {
	role: "scorekeeper",
	label: "Scorekeeper"
}];
function TournamentStaffPage() {
	const { weekendId } = Route$1.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeekendAdminFrame, {
		weekendId,
		backTo: "hub",
		adminOnly: true,
		children: (ctx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaffBody, {
			id: ctx.id,
			detail: ctx.detail
		})
	});
}
function choiceFrom(slot) {
	if (!slot) return {
		pick: "",
		otherName: "",
		otherPhone: ""
	};
	if (slot.staffId) return {
		pick: `staff:${slot.staffId}`,
		otherName: "",
		otherPhone: ""
	};
	if (slot.otherName || slot.otherPhone) return {
		pick: "other",
		otherName: slot.otherName ?? "",
		otherPhone: slot.otherPhone ?? ""
	};
	return {
		pick: "",
		otherName: "",
		otherPhone: ""
	};
}
function slotsFrom(detail, choices) {
	return detail.locations.flatMap((location) => ROLES.map(({ role }) => {
		const choice = choices[`${location.id}:${role}`] ?? {
			pick: "",
			otherName: "",
			otherPhone: ""
		};
		const parsed = choice.pick.startsWith("staff:") ? Number(choice.pick.slice(6)) : null;
		const staffId = parsed != null && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
		return {
			locationId: location.id,
			role,
			staffId,
			otherName: choice.pick === "other" ? choice.otherName.trim() : null,
			otherPhone: choice.pick === "other" ? choice.otherPhone : null
		};
	}));
}
function StaffBody({ id, detail }) {
	const queryClient = useQueryClient();
	const staffQuery = useQuery({
		queryKey: ["staff"],
		queryFn: () => listStaff()
	});
	const assignedQuery = useQuery({
		queryKey: ["weekend-staff", id],
		queryFn: () => listWeekendStaff({ data: { weekendId: id } })
	});
	const [choices, setChoices] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [warning, setWarning] = (0, import_react.useState)(null);
	const members = staffQuery.data ?? [];
	const current = choices ?? Object.fromEntries(detail.locations.flatMap((location) => ROLES.map(({ role }) => {
		const slot = (assignedQuery.data ?? []).find((row) => row.locationId === location.id && row.role === role);
		return [`${location.id}:${role}`, choiceFrom(slot)];
	})));
	const draft = slotsFrom(detail, current);
	const liveWarning = staffCrossFieldWarning(draft, members);
	const save = useMutation({
		mutationFn: () => saveWeekendStaff({ data: {
			weekendId: id,
			slots: draft
		} }),
		onSuccess: async (result) => {
			setError(null);
			setWarning(result.warning);
			queryClient.setQueryData(["weekend", id], result.detail);
			await queryClient.invalidateQueries({ queryKey: ["weekend-staff", id] });
			bumpWeekend(queryClient, id);
		},
		onError: (err) => setError(err instanceof Error ? err.message : "Could not save staff.")
	});
	function setChoice(key, patch) {
		setChoices({
			...current,
			[key]: {
				...current[key],
				...patch
			}
		});
		setWarning(null);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-3 font-display text-4xl font-bold uppercase",
			children: "Staff"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted",
			children: "Each field needs a gate attendant and a scorekeeper. One person can do both on the same field."
		}),
		detail.locations.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-6 rounded-lg border border-dashed border-line bg-surface px-4 py-4 text-sm text-muted",
			children: "Add a field first."
		}) : staffQuery.isPending || assignedQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-6 text-sm text-muted",
			children: "Loading staff…"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-6 space-y-4",
			onSubmit: (event) => {
				event.preventDefault();
				setError(null);
				save.mutate();
			},
			children: [
				detail.locations.map((location, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-3 rounded-lg border border-line bg-surface p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl font-bold uppercase leading-none",
						children: location.name || `Field ${index + 1}`
					}), ROLES.map(({ role, label }) => {
						const key = `${location.id}:${role}`;
						const choice = current[key] ?? {
							pick: "",
							otherName: "",
							otherPhone: ""
						};
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: key,
									children: label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									id: key,
									value: choice.pick,
									onChange: (event) => setChoice(key, { pick: event.target.value }),
									className: "h-12 w-full rounded-md border border-line bg-surface px-3 text-base text-fg",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "Choose staff"
										}),
										members.map((member) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: `staff:${member.id}`,
											children: member.name
										}, member.id)),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "other",
											children: "Other"
										})
									]
								}),
								choice.pick === "other" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-2 sm:grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: choice.otherName,
										onChange: (event) => setChoice(key, { otherName: event.target.value }),
										placeholder: "Name",
										"aria-label": `${label} name`,
										maxLength: 80,
										required: true
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: choice.otherPhone,
										onChange: (event) => setChoice(key, { otherPhone: formatPhoneInput(event.target.value) }),
										placeholder: "(555) 555-0100",
										"aria-label": `${label} phone`,
										inputMode: "tel",
										maxLength: 14,
										required: true
									})]
								}) : null
							]
						}, role);
					})]
				}, location.id)),
				liveWarning || warning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md bg-warn-bg px-3 py-2 text-sm font-semibold",
					role: "status",
					children: liveWarning ?? warning
				}) : null,
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md bg-warn-bg px-3 py-2 text-sm",
					role: "alert",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "w-full",
					disabled: save.isPending,
					children: save.isPending ? "Saving…" : "Save staff"
				})
			]
		})
	] });
}
var Route = createFileRoute("/weekends/$weekendId/teams")({ component: TournamentTeamsPage });
function TournamentTeamsPage() {
	const { weekendId } = Route.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeekendAdminFrame, {
		weekendId,
		backTo: "hub",
		children: (ctx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamsBody, { ...ctx })
	});
}
function TeamsBody({ id, detail, queryClient, bump, readOnly }) {
	const clearDemoMut = useMutation({
		mutationFn: () => clearDemoTeams({ data: { weekendId: id } }),
		onSuccess: (next) => {
			queryClient.setQueryData(["weekend", id], next);
			bump();
		}
	});
	const removeTeamMut = useMutation({
		mutationFn: (teamId) => removeWeekendTeam({ data: { id: teamId } }),
		onSuccess: (next) => {
			queryClient.setQueryData(["weekend", id], next);
			bump();
		}
	});
	const pullMut = useMutation({
		mutationFn: (teamId) => pullTeam({ data: { teamId } }),
		onSuccess: () => {
			bump();
			queryClient.invalidateQueries({ queryKey: ["schedule", id] });
			queryClient.invalidateQueries({ queryKey: ["weekend", id] });
		}
	});
	const replaceMut = useMutation({
		mutationFn: (input) => replaceTeamSlot({ data: input }),
		onSuccess: () => {
			setReplaceId(null);
			setReplaceName("");
			bump();
			queryClient.invalidateQueries({ queryKey: ["schedule", id] });
			queryClient.invalidateQueries({ queryKey: ["weekend", id] });
		}
	});
	const [confirmPull, setConfirmPull] = (0, import_react.useState)(null);
	const [replaceId, setReplaceId] = (0, import_react.useState)(null);
	const [replaceName, setReplaceName] = (0, import_react.useState)("");
	const [cardTeam, setCardTeam] = (0, import_react.useState)(null);
	const error = clearDemoMut.error || removeTeamMut.error || pullMut.error || replaceMut.error ? (clearDemoMut.error || removeTeamMut.error || pullMut.error || replaceMut.error) instanceof Error ? (clearDemoMut.error || removeTeamMut.error || pullMut.error || replaceMut.error)?.message : "Could not update those teams." : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-bold uppercase leading-none",
				children: "Tournament teams"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted",
			children: readOnly ? `${detail.approvedCount}/${detail.maxTeams} in.` : detail.sheetLocked ? "The sheet is locked. Pull a club out and their remaining games are forfeits. A new club can take that same slot until first pitch." : `${detail.approvedCount}/${detail.maxTeams} in. Remove a club to shrink the bracket.`
		}),
		!readOnly && detail.teamEntryClosed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 rounded-md bg-warn-bg px-3 py-2 text-sm",
			children: detail.teamEntryClosed
		}) : null,
		error && !readOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 rounded-md bg-warn-bg px-3 py-2 text-sm",
			role: "alert",
			children: error
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 space-y-3",
			children: [detail.teams.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted",
				children: "No teams in yet."
			}) : detail.teams.map((team) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3",
					children: [readOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1 text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate font-semibold leading-tight",
							children: team.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-muted",
							children: [team.ageGroup, team.isDemo ? " · Demo" : ""]
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "min-w-0 flex-1 text-left",
						onClick: () => setCardTeam({
							signupTeamId: null,
							weekendTeamId: team.id
						}),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate font-semibold leading-tight",
							children: team.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-muted",
							children: [team.ageGroup, team.isDemo ? " · Demo" : ""]
						})]
					}), readOnly ? null : detail.sheetLocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 flex-col gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							className: "px-2 text-muted",
							disabled: pullMut.isPending,
							onClick: () => {
								if (confirmPull === team.id) pullMut.mutate(team.id);
								else setConfirmPull(team.id);
							},
							children: confirmPull === team.id ? "Forfeit their games" : "Pulled out"
						}), detail.beforeFirstPitch ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							className: "px-2 text-muted",
							onClick: () => {
								setReplaceId(replaceId === team.id ? null : team.id);
								setReplaceName("");
							},
							children: "Replace"
						}) : null]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "ghost",
						className: "shrink-0 px-2 text-muted",
						disabled: removeTeamMut.isPending,
						onClick: () => removeTeamMut.mutate(team.id),
						children: "Remove"
					})]
				}), !readOnly && replaceId === team.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "flex gap-2",
					onSubmit: (event) => {
						event.preventDefault();
						replaceMut.mutate({
							teamId: team.id,
							name: replaceName
						});
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: replaceName,
						onChange: (event) => setReplaceName(event.target.value),
						placeholder: "New club name",
						"aria-label": `Replace ${team.name}`
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: replaceMut.isPending,
						children: replaceMut.isPending ? "Saving…" : "Same slot"
					})]
				}) : null]
			}, team.id)), !readOnly && detail.teams.some((team) => team.isDemo) && !detail.sheetLocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "outline",
				className: "w-full",
				disabled: clearDemoMut.isPending,
				onClick: () => clearDemoMut.mutate(),
				children: clearDemoMut.isPending ? "Clearing…" : "Clear demo teams"
			}) : null]
		}),
		!readOnly && cardTeam ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClubCardDialog, {
			target: cardTeam,
			onClose: () => setCardTeam(null)
		}) : null
	] });
}
function ClubCardDialog({ target, onClose }) {
	const cardQuery = useQuery({
		queryKey: [
			"club-card",
			target.signupTeamId,
			target.weekendTeamId
		],
		queryFn: () => getClubCard({ data: target })
	});
	if (typeof document === "undefined") return null;
	const card = cardQuery.data;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[90] flex items-center justify-center bg-scrim p-4",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": card?.teamName ?? "Team",
			className: "max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg",
			onClick: (event) => event.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-bold uppercase",
					children: card?.teamName ?? "Team"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					className: "px-2 text-muted",
					onClick: onClose,
					children: "Close"
				})]
			}), cardQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm text-muted",
				children: "Loading…"
			}) : cardQuery.error instanceof Error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 rounded-md bg-warn-bg px-3 py-2 text-sm",
				children: cardQuery.error.message
			}) : card ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "mt-4 space-y-2 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted",
								children: "Age"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "font-semibold",
								children: card.ageGroup
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted",
								children: "Coach"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "font-semibold",
								children: card.coachName
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted",
								children: "Phone"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "font-semibold",
								children: card.phone || "—"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted",
								children: "Email"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "truncate font-semibold",
								children: card.email || "—"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted",
								children: "Club"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "font-semibold",
								children: card.club || "—"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mt-5 text-xs font-bold uppercase tracking-wide text-muted",
					children: "Roster"
				}),
				card.players.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "No players yet."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 space-y-1",
					children: card.players.map((player) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-baseline justify-between gap-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "min-w-0 truncate font-semibold",
							children: player.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "shrink-0 text-muted",
							children: [
								"#",
								player.jersey,
								player.birthday ? ` · ${player.birthday}` : ""
							]
						})]
					}, player.id))
				})
			] }) : null]
		})
	}), document.body);
}
var IndexRoute = Route$21.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$22
});
var InterestRoute = Route$20.update({
	id: "/interest",
	path: "/interest",
	getParentRoute: () => Route$22
});
var JoinRoute = Route$19.update({
	id: "/join",
	path: "/join",
	getParentRoute: () => Route$22
});
var LoginRoute = Route$18.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$22
});
var LoginsRoute = Route$17.update({
	id: "/logins",
	path: "/logins",
	getParentRoute: () => Route$22
});
var NotificationsRoute = Route$16.update({
	id: "/notifications",
	path: "/notifications",
	getParentRoute: () => Route$22
});
var ResourcesRoute = Route$15.update({
	id: "/resources",
	path: "/resources",
	getParentRoute: () => Route$22
});
var TeamsRoute = Route$14.update({
	id: "/teams",
	path: "/teams",
	getParentRoute: () => Route$22
});
var WeekendsRoute = Route$13.update({
	id: "/weekends",
	path: "/weekends",
	getParentRoute: () => Route$22
});
var BracketWeekendIdRoute = Route$12.update({
	id: "/bracket/$weekendId",
	path: "/bracket/$weekendId",
	getParentRoute: () => Route$22
});
var TeamsIndexRoute = Route$11.update({
	id: "/",
	path: "/",
	getParentRoute: () => TeamsRoute
});
var TeamsTeamIdRoute = Route$10.update({
	id: "/$teamId",
	path: "/$teamId",
	getParentRoute: () => TeamsRoute
});
var TeamsNewRoute = Route$9.update({
	id: "/new",
	path: "/new",
	getParentRoute: () => TeamsRoute
});
var WeekendsIndexRoute = Route$8.update({
	id: "/",
	path: "/",
	getParentRoute: () => WeekendsRoute
});
var WeekendsWeekendIdRoute = Route$7.update({
	id: "/$weekendId",
	path: "/$weekendId",
	getParentRoute: () => WeekendsRoute
});
var ApiAuthSplatRoute = Route$6.update({
	id: "/api/auth/$",
	path: "/api/auth/$",
	getParentRoute: () => Route$22
});
var WeekendsWeekendIdIndexRoute = Route$5.update({
	id: "/",
	path: "/",
	getParentRoute: () => WeekendsWeekendIdRoute
});
var WeekendsWeekendIdEditRoute = Route$4.update({
	id: "/edit",
	path: "/edit",
	getParentRoute: () => WeekendsWeekendIdRoute
});
var WeekendsWeekendIdLocationsRoute = Route$3.update({
	id: "/locations",
	path: "/locations",
	getParentRoute: () => WeekendsWeekendIdRoute
});
var WeekendsWeekendIdRulesRoute = Route$2.update({
	id: "/rules",
	path: "/rules",
	getParentRoute: () => WeekendsWeekendIdRoute
});
var WeekendsWeekendIdStaffRoute = Route$1.update({
	id: "/staff",
	path: "/staff",
	getParentRoute: () => WeekendsWeekendIdRoute
});
var WeekendsWeekendIdTeamsRoute = Route.update({
	id: "/teams",
	path: "/teams",
	getParentRoute: () => WeekendsWeekendIdRoute
});
var TeamsRouteChildren = {
	TeamsTeamIdRoute,
	TeamsNewRoute,
	TeamsIndexRoute
};
var TeamsRouteWithChildren = TeamsRoute._addFileChildren(TeamsRouteChildren);
var WeekendsWeekendIdRouteChildren = {
	WeekendsWeekendIdEditRoute,
	WeekendsWeekendIdLocationsRoute,
	WeekendsWeekendIdRulesRoute,
	WeekendsWeekendIdStaffRoute,
	WeekendsWeekendIdTeamsRoute,
	WeekendsWeekendIdIndexRoute
};
var WeekendsRouteChildren = {
	WeekendsWeekendIdRoute: WeekendsWeekendIdRoute._addFileChildren(WeekendsWeekendIdRouteChildren),
	WeekendsIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	InterestRoute,
	JoinRoute,
	LoginRoute,
	LoginsRoute,
	NotificationsRoute,
	ResourcesRoute,
	TeamsRoute: TeamsRouteWithChildren,
	WeekendsRoute: WeekendsRoute._addFileChildren(WeekendsRouteChildren),
	BracketWeekendIdRoute,
	ApiAuthSplatRoute
};
var routeTree = Route$22._addFileChildren(rootRouteChildren)._addFileTypes();
if (typeof window !== "undefined") {
	const recover = (error) => {
		if (!isStaleChunkError(error)) return;
		reloadForStaleChunk();
	};
	window.addEventListener("unhandledrejection", (event) => recover(event.reason));
	window.addEventListener("error", (event) => recover(event.error ?? event.message));
}
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { getRouter };
