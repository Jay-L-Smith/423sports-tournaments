import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, House, Library, Share2, UserRound, Users, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BrandMark } from "@/components/brand";
import { EditAccountButton } from "@/components/coach-account-edit";
import { HOME_FIELD_BACKDROP, HOME_FIELD_PHOTO, NOTIFICATIONS_FIELD_PHOTO } from "@/components/field-band";
import { useAppSession } from "@/components/session-gate";
import { UserButton } from "@/lib/auth/gates";
import { getMyCoachAccount, listNotifications, listPendingRequests, listPendingTeams, listViewCoaches, liveStamp, setViewCoach, touchMyLogin } from "@/lib/pbi/api";
import { ROLE_COPY, type Role } from "@/lib/pbi/roles";
import { rememberCoach, rememberedCoach, setSuperuserView, type SuperView } from "@/lib/pbi/view-role";
import { openCoachTour } from "@/lib/coach-tour-flag";
import { coachTournamentBucket } from "@/lib/pbi/notices";
import { cn } from "@/lib/utils";

function useLiveSync(userId: string | undefined) {
  const queryClient = useQueryClient();
  const seen = useRef<string | null>(null);
  const stampQuery = useQuery({
    queryKey: ["live-stamp", userId],
    queryFn: () => liveStamp(),
    enabled: Boolean(userId),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
  useEffect(() => {
    seen.current = null;
  }, [userId]);
  useEffect(() => {
    if (!userId) return;
    const onShow = () => {
      if (document.visibilityState === "visible") void stampQuery.refetch();
    };
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, [userId, stampQuery]);
  useEffect(() => {
    const stamp = stampQuery.data?.stamp;
    if (!stamp) return;
    if (seen.current == null) {
      seen.current = stamp;
      return;
    }
    if (seen.current === stamp) return;
    seen.current = stamp;
    void queryClient.invalidateQueries({ queryKey: ["weekends"] });
    void queryClient.invalidateQueries({ queryKey: ["my-teams"] });
    void queryClient.invalidateQueries({ queryKey: ["my-schedule"] });
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    void queryClient.invalidateQueries({ queryKey: ["tournament-responses"] });
    void queryClient.invalidateQueries({ queryKey: ["tournament-replies"] });
    void queryClient.invalidateQueries({ queryKey: ["event-interest"] });
    void queryClient.invalidateQueries({ queryKey: ["weekend"] });
    void queryClient.invalidateQueries({ queryKey: ["schedule"] });
    void queryClient.invalidateQueries({ queryKey: ["tournament-roster"] });
  }, [stampQuery.data?.stamp, queryClient]);
}

function useLoginBeat(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    let stop = false;
    const beat = () => {
      if (stop) return;
      void touchMyLogin().catch(() => {});
    };
    beat();
    const timer = window.setInterval(beat, 60_000);
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
    enabled: Boolean(user && profile),
  });
  const pendingQuery = useQuery({
    queryKey: ["pending-requests"],
    queryFn: () => listPendingRequests(),
    enabled: Boolean(profile?.homeRole === "admin"),
  });
  const pendingTeamsQuery = useQuery({
    queryKey: ["pending-teams"],
    queryFn: () => listPendingTeams(),
    enabled: Boolean(profile?.homeRole === "admin"),
  });
  const notes = notifQuery.data ?? [];
  const visible = profile?.homeRole === "coach" ? notes.filter((item) => coachTournamentBucket(item)) : notes;
  const unread = visible.filter((item) => !item.read).length;
  const pending =
    profile?.homeRole === "admin"
      ? (pendingQuery.data?.length ?? 0) + (pendingTeamsQuery.data?.length ?? 0)
      : 0;
  return unread + pending;
}

export function StickyBack({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-0 z-20 -mx-4 -mt-5 bg-white px-4 py-2">
      {children}
    </div>
  );
}

export function AppShell({
  homeRole,
  pendingLabel,
  wide = false,
  back,
  banner,
  contained = false,
  children,
}: {
  homeRole: Role;
  pendingLabel?: string | null;
  wide?: boolean;
  back?: ReactNode;
  banner?: ReactNode;
  contained?: boolean;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const badge = useNavBadge();
  const { user, profile } = useAppSession();
  useLiveSync(user?.id);
  useLoginBeat(user?.id);
  const [accountOpen, setAccountOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const canShare = homeRole === "admin" || homeRole === "coach";
  useEffect(() => {
    const isField = (node: EventTarget | null): node is HTMLElement =>
      node instanceof HTMLElement && node.matches("input, textarea, select");
    const onFocus = (event: FocusEvent) => {
      if (!isField(event.target)) return;
      setTyping(true);
    };
    const onBlur = () => {
      window.setTimeout(() => {
        if (isField(document.activeElement)) return;
        setTyping(false);
      }, 0);
    };
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
    };
  }, []);
  const fieldPage = HOME_FIELD_BACKDROP && (pathname === "/" || pathname.startsWith("/notifications"));
  const fieldPhoto = pathname.startsWith("/notifications") ? NOTIFICATIONS_FIELD_PHOTO : HOME_FIELD_PHOTO;
  const items = [
    { to: "/", label: homeRole === "parent" ? "Home" : "Schedule", icon: House, match: (p: string) => p === "/" },
    {
      to: "/notifications",
      label: "Notifications",
      icon: Bell,
      match: (p: string) => p.startsWith("/notifications"),
      badge,
    },
    ...(homeRole === "admin"
      ? [
          {
            to: "/resources",
            label: "Resources",
            icon: Library,
            match: (p: string) => p.startsWith("/resources"),
          },
        ]
      : homeRole === "coach"
        ? [
            {
              to: "/teams",
              label: "My team",
              icon: Users,
              match: (p: string) => p.startsWith("/teams"),
            },
          ]
        : []),
  ] as const;

  return (
    <div className={cn("relative mx-auto flex h-dvh max-h-dvh flex-col overflow-hidden text-fg", wide ? "max-w-none" : "max-w-lg", fieldPage ? "bg-transparent" : "bg-white")}>
      {fieldPage ? <FieldBackdrop src={fieldPhoto} /> : null}
      <header className="z-10 shrink-0 bg-[#1c1c1c] text-white">
        <div className={cn("flex gap-3 px-3", banner ? "items-end pb-1 pt-2" : "items-center py-2.5")}>
          <BrandMark className="h-14 w-auto shrink-0" />
          <div className="ml-auto flex min-w-0 flex-1 flex-col items-end justify-center gap-0.5">
          <div className="flex shrink-0 items-center gap-2">
            {profile?.isSuperuser && homeRole === "coach" ? <CoachPeek /> : null}
            {profile?.coachPreview && !profile.isSuperuser && homeRole === "coach" ? (
              <span className="max-w-[6.5rem] truncate rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Test Coach
              </span>
            ) : null}
            {profile?.isSuperuser || profile?.coachPreview ? (
              <div className="flex rounded-full bg-white/10 p-0.5 text-[10px] font-bold uppercase tracking-wide">
                {(["admin", "coach"] as const).map((view) => {
                  const active = view === "coach" ? homeRole === "coach" : homeRole !== "coach";
                  return (
                    <button
                      key={view}
                      type="button"
                      onClick={() => void chooseSuperuserView(view, pathname, navigate, queryClient, Boolean(profile.coachPreview && !profile.isSuperuser))}
                      className={cn("rounded-full px-2 py-1", active ? "bg-white text-[#1c1c1c]" : "text-white/80")}
                    >
                      {view}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                {pendingLabel ?? ROLE_COPY[homeRole].label}
              </p>
            )}
            {canShare ? (
              <div data-tour={homeRole === "coach" ? "header-tools" : undefined} className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Share the app"
                onClick={() => setShareOpen(true)}
                className="grid h-8 w-8 place-items-center rounded-full text-white hover:bg-white/10"
              >
                <Share2 className="h-4 w-4" aria-hidden />
              </button>
            <button
              type="button"
              aria-label="Account"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen(true)}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full",
                accountOpen ? "bg-white text-[#1c1c1c]" : "text-white hover:bg-white/10",
              )}
            >
              <UserRound className="h-5 w-5" strokeWidth={2.25} />
            </button>
              </div>
            ) : (
            <button
              type="button"
              aria-label="Account"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen(true)}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full",
                accountOpen ? "bg-white text-[#1c1c1c]" : "text-white hover:bg-white/10",
              )}
            >
              <UserRound className="h-5 w-5" strokeWidth={2.25} />
            </button>
            )}
          </div>
          {banner ? <div className="w-full min-w-0 overflow-hidden">{banner}</div> : null}
          </div>
        </div>
      </header>
      {back ? (
        <div className="z-20 flex shrink-0 items-center gap-3 bg-white px-4 pt-1.5 pb-1">
          <div className="shrink-0">{back}</div>
        </div>
      ) : null}
      <main className={cn("relative z-[1] min-h-0 flex-1 overscroll-y-contain px-4 text-[#222] [overflow-anchor:none]", contained ? "flex flex-col overflow-hidden py-0" : "overflow-y-auto pb-6", !contained && (back ? "pt-1" : "py-5"), fieldPage ? "bg-transparent" : "bg-white")}>
        {children}
      </main>
      <nav
        data-tour={homeRole === "coach" ? "tab-bar" : undefined}
        className={cn(
          "z-10 shrink-0 border-t border-[#e5e5e5] bg-white pb-[env(safe-area-inset-bottom)]",
          typing && "hidden",
          wide && "landscape:hidden",
        )}
      >
        <div className={cn("mx-auto grid max-w-lg", items.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
          {items.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            const count = "badge" in item ? item.badge : 0;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                {item.label}
                {count ? (
                  <span className="absolute right-1/4 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-fg">
                    {count > 9 ? "9+" : count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
      {accountOpen ? (
        <AccountCard
          onClose={() => setAccountOpen(false)}
          email={profile?.email || user?.primaryEmail || "—"}
          canEdit={homeRole === "coach" && !profile?.isSuperuser && !profile?.coachPreview}
          onTour={
            profile?.isSuperuser
              ? () => {
                  setAccountOpen(false);
                  void chooseSuperuserView("coach", pathname, navigate, queryClient).then(() => openCoachTour());
                }
              : undefined
          }
          onLogins={
            profile?.isSuperuser
              ? () => {
                  setAccountOpen(false);
                  void navigate({ to: "/logins" });
                }
              : undefined
          }
        />
      ) : null}
      {shareOpen ? (
        <SharePick
          onClose={() => setShareOpen(false)}
          onPick={(role) => {
            setShareOpen(false);
            const sender = user?.displayName?.trim() || "a 423Sports director";
            shareInvite(role, sender);
          }}
        />
      ) : null}
    </div>
  );
}

async function chooseSuperuserView(
  view: SuperView,
  pathname: string,
  navigate: ReturnType<typeof useNavigate>,
  queryClient: ReturnType<typeof useQueryClient>,
  previewOnly = false,
) {
  try {
    if (view === "admin") await setViewCoach({ data: { userId: "" } });
    else if (previewOnly) await setViewCoach({ data: { userId: "test" } });
    else {
      const id = rememberedCoach();
      if (id) {
        const result = await setViewCoach({ data: { userId: id } });
        if ("missing" in result && result.missing) rememberCoach("");
      }
    }
  } catch (err) {
    if (previewOnly) {
      window.alert(err instanceof Error ? err.message : "Could not open Test Coach.");
      return;
    }
    rememberCoach("");
    try {
      await setViewCoach({ data: { userId: "" } });
    } catch {
      // Still switch the screen. They can pick a coach from the list.
    }
  }
  setSuperuserView(view);
  await queryClient.invalidateQueries();
  if (view === "admin" && pathname.startsWith("/teams")) void navigate({ to: "/" });
  if (view === "coach" && pathname.startsWith("/resources")) void navigate({ to: "/" });
}

function CoachPeek() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["view-coaches"], queryFn: () => listViewCoaches() });
  const coaches = query.data?.coaches ?? [];
  const viewing = coaches.find((coach) => coach.userId === query.data?.viewingId) ?? null;

  async function pick(userId: string) {
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

  const list = (
    <div className="max-h-[60vh] space-y-2 overflow-y-auto">
      {query.isPending ? <p className="text-sm text-muted">Loading coaches…</p> : null}
      {!query.isPending && coaches.length === 0 ? <p className="text-sm text-muted">No coaches yet.</p> : null}
      {coaches.map((coach) => (
        <button
          key={coach.userId}
          type="button"
          onClick={() => void pick(coach.userId)}
          className={cn(
            "block w-full rounded-md border px-3 py-2 text-left",
            coach.userId === viewing?.userId ? "border-primary bg-primary/5" : "border-line bg-white",
          )}
        >
          <span className="block font-semibold">{coach.name}</span>
          <span className="block text-xs text-muted">{coach.team || coach.email}</span>
        </button>
      ))}
      {error ? <p className="text-sm text-warn">{error}</p> : null}
    </div>
  );

  const chip = "max-w-[6.5rem] truncate rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={chip}>
        {viewing?.name ?? "Choose coach"}
      </button>
      {open ? <CoachPickCard onClose={() => setOpen(false)}>{list}</CoachPickCard> : null}
    </>
  );
}

function CoachPickCard({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-scrim p-4 pt-20" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Coaches"
        className="w-full max-w-sm rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold uppercase">Coaches</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-md text-muted">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

function shareInvite(role: "coach" | "admin", sender: string) {
  const link = `${window.location.origin}/join?role=${role}`;
  const who = role === "coach" ? "a coach" : "an administrator";
  const text = `You have been invited by ${sender} to 423Sports Tournaments as ${who}. Click the link to open the app and create an account. ${link}`;
  const body = encodeURIComponent(text);
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  window.location.href = ios ? `sms:&body=${body}` : `sms:?body=${body}`;
}

function SharePick({ onClose, onPick }: { onClose: () => void; onPick: (role: "coach" | "admin") => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-scrim p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Who are you inviting?"
        className="w-full max-w-sm rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold uppercase">Invite</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-md text-muted">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">Who are you inviting?</p>
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={() => onPick("coach")}
            className="flex min-h-12 w-full items-center rounded-lg border border-line bg-surface px-4 text-left font-display text-xl font-bold uppercase"
          >
            Coach
          </button>
          <button
            type="button"
            onClick={() => onPick("admin")}
            className="flex min-h-12 w-full items-center rounded-lg border border-line bg-surface px-4 text-left font-display text-xl font-bold uppercase"
          >
            Admin
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function FieldBackdrop({ src }: { src: string }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage: `linear-gradient(rgb(255 255 255 / 0.72), rgb(255 255 255 / 0.72)), url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />,
    document.body,
  );
}

function AccountCard({ onClose, email, canEdit, onTour, onLogins }: { onClose: () => void; email: string; canEdit: boolean; onTour?: () => void; onLogins?: () => void }) {
  const accountQuery = useQuery({
    queryKey: ["my-coach-account"],
    queryFn: () => getMyCoachAccount(),
    enabled: canEdit,
  });
  const account = accountQuery.data;
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-scrim p-4 pt-20" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Account"
        className="max-h-[80dvh] w-full max-w-sm overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold uppercase">Account</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-md text-muted">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {canEdit ? (
            accountQuery.isPending ? (
              <p className="text-sm text-muted">Loading your account…</p>
            ) : account ? (
              <>
                <AccountLine label="Name" value={account.name || "—"} />
                <AccountLine label="Cell phone" value={account.phone || "—"} />
                <AccountLine label="Email" value={account.email || email} />
                <AccountLine label="Organization" value={account.club || "—"} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Teams</p>
                  {account.teams.length === 0 ? (
                    <p className="mt-1 font-medium">—</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {account.teams.map((team) => (
                        <li key={`${team.name}-${team.ageGroup}`} className="font-medium">
                          {team.name} · {team.ageGroup}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <AccountLine label="Email" value={email} />
            )
          ) : (
            <AccountLine label="Email" value={email} />
          )}
          {canEdit ? <EditAccountButton /> : null}
          {onTour ? (
            <button type="button" onClick={onTour} className="w-full rounded-md border border-line px-3 py-2 text-sm font-semibold">
              First login tour
            </button>
          ) : null}
          {onLogins ? (
            <button type="button" onClick={onLogins} className="w-full rounded-md border border-line px-3 py-2 text-sm font-semibold">
              Login history
            </button>
          ) : null}
          <div className="border-t border-line pt-4">
            <UserButton />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function AccountLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
