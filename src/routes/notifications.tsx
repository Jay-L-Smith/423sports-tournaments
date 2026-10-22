import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useRef, useState, type ReactNode, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { CoachDeniedCard } from "@/components/coach-denied";
import { FieldBand, HOME_FIELD_BACKDROP } from "@/components/field-band";
import { AdminInbox } from "@/components/homes";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { RedirectToSignIn } from "@/lib/auth/gates";
import {
  listMyCoachTeams,
  listMyTournamentResponses,
  listNotifications,
  listPendingRequests,
  listPendingTeams,
  markNotificationsRead,
  dismissNotification,
  reviewRequest,
  reviewNewCoach,
  reviewTeam,
  reviewTeamJoin,
  respondToTournament,
  type DirectoryUser,
  type NotificationItem,
  type PendingRequest,
  type PendingTeam,
} from "@/lib/pbi/api";
import { Button } from "@/components/ui/button";
import { coachTournamentBucket } from "@/lib/pbi/notices";

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const { user, isPending, profile } = useAppSession();
  const queryClient = useQueryClient();
  const isAdmin = profile?.homeRole === "admin";
  const notifQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => listNotifications(),
    enabled: Boolean(user && profile),
  });
  const isCoach = profile?.homeRole === "coach";
  const teamsQuery = useQuery({
    queryKey: ["my-teams", user?.id],
    queryFn: () => listMyCoachTeams(),
    enabled: Boolean(user && isCoach),
  });
  const responseQuery = useQuery({
    queryKey: ["tournament-responses", user?.id],
    queryFn: () => listMyTournamentResponses(),
    enabled: Boolean(user && isCoach),
  });
  const pendingQuery = useQuery({
    queryKey: ["pending-requests"],
    queryFn: () => listPendingRequests(),
    enabled: Boolean(isAdmin),
  });
  const pendingTeamsQuery = useQuery({
    queryKey: ["pending-teams"],
    queryFn: () => listPendingTeams(),
    enabled: Boolean(isAdmin),
  });

  const reviewCoach = useMutation({
    mutationFn: (input: { userId: string; action: "keep" | "remove" }) => reviewNewCoach({ data: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
      await queryClient.invalidateQueries({ queryKey: ["directory"] });
      await queryClient.invalidateQueries({ queryKey: ["coach-directory"] });
    },
  });
  const reviewMut = useMutation({
    mutationFn: (input: { id: number; action: "approve" | "deny" }) => reviewRequest({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["pending-requests"] });
      await queryClient.cancelQueries({ queryKey: ["directory"] });
      const previousPending = queryClient.getQueryData<PendingRequest[]>(["pending-requests"]);
      const previousDirectory = queryClient.getQueryData<DirectoryUser[]>(["directory"]);
      const target = previousPending?.find((req) => req.id === input.id);
      queryClient.setQueryData<PendingRequest[]>(
        ["pending-requests"],
        (current) => (current ?? []).filter((req) => req.id !== input.id),
      );
      if (target) {
        queryClient.setQueryData<DirectoryUser[]>(["directory"], (current) =>
          (current ?? []).map((row) =>
            row.userId === target.userId
              ? {
                  ...row,
                  homeRole: input.action === "approve" ? target.requestedRole : "parent",
                  requestStatus: input.action === "approve" ? "approved" : "denied",
                }
              : row,
          ),
        );
      }
      return { previousPending, previousDirectory };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previousPending) queryClient.setQueryData(["pending-requests"], ctx.previousPending);
      if (ctx?.previousDirectory) queryClient.setQueryData(["directory"], ctx.previousDirectory);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["directory"] });
    },
  });

  const reviewJoin = useMutation({
    mutationFn: (input: { id: number; action: "approve" | "deny" }) => reviewTeamJoin({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueriesData<NotificationItem[]>({ queryKey: ["notifications"] });
      queryClient.setQueriesData<NotificationItem[]>({ queryKey: ["notifications"] }, (current) =>
        (current ?? []).filter((item) => item.refKey !== `join-request-${input.id}`),
      );
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      for (const [key, data] of ctx?.previous ?? []) queryClient.setQueryData(key, data);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      await queryClient.invalidateQueries({ queryKey: ["my-schedule"] });
    },
  });
  const dismiss = useMutation({
    mutationFn: (id: number) => dismissNotification({ data: { id } }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueriesData<NotificationItem[]>({ queryKey: ["notifications"] });
      queryClient.setQueriesData<NotificationItem[]>({ queryKey: ["notifications"] }, (current) =>
        (current ?? []).filter((item) => item.id !== id),
      );
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      for (const [key, data] of ctx?.previous ?? []) queryClient.setQueryData(key, data);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const reviewTeamMut = useMutation({
    mutationFn: (input: { id: number; action: "approve" | "deny" }) => reviewTeam({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["pending-teams"] });
      const previous = queryClient.getQueryData<PendingTeam[]>(["pending-teams"]);
      queryClient.setQueryData<PendingTeam[]>(
        ["pending-teams"],
        (current) => (current ?? []).filter((team) => team.id !== input.id),
      );
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["pending-teams"], ctx.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["pending-teams"] });
      void queryClient.invalidateQueries({ queryKey: ["weekends"] });
    },
  });

  if (isPending) return <SessionSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile) return <Navigate to="/" />;

  const items = notifQuery.data ?? [];
  const groups = isCoach ? coachNoticeGroups(items) : noticeGroups(items);
  const pendingLabel =
    profile.requestStatus === "pending" && profile.homeRole !== "coach" && profile.homeRole !== "admin"
      ? `${profile.requestedRole === "admin" ? "Admin" : "Coach"} · waiting`
      : null;

  return (
    <AppShell homeRole={profile.homeRole} pendingLabel={pendingLabel}>
      <div data-tour={isCoach ? "notifications" : undefined} className="flex min-h-[calc(100dvh-11rem)] flex-col">
      <h1 className="font-display text-4xl font-bold uppercase">Notifications</h1>
      {!isCoach && profile.requestStatus === "pending" ? (
        <p className="mt-3 rounded-md bg-warn-bg px-4 py-3 text-sm font-medium">
          Your {profile.requestedRole === "admin" ? "Admin" : "Coach"} access is waiting for Admin
          approval.
        </p>
      ) : null}
      {!isCoach && profile.requestStatus === "approved" ? (
        <p className="mt-3 rounded-md bg-ok-bg px-4 py-3 text-sm font-medium">
          Your {profile.requestedRole === "admin" ? "Admin" : "Coach"} access was approved.
        </p>
      ) : null}
      {!isCoach && profile.requestStatus === "denied" && profile.requestedRole === "coach" ? (
        <div className="mt-3">
          <CoachDeniedCard profile={profile} />
        </div>
      ) : profile.requestStatus === "denied" ? (
        <p className="mt-3 rounded-md bg-warn-bg px-4 py-3 text-sm font-medium">
          Your {profile.requestedRole === "admin" ? "Admin" : "Coach"} access was denied. You still
          have Parent tools.
        </p>
      ) : null}

      {reviewMut.error || reviewTeamMut.error || reviewJoin.error ? (
        <p className="mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm">
          {reviewMut.error instanceof Error
            ? reviewMut.error.message
            : reviewTeamMut.error instanceof Error
              ? reviewTeamMut.error.message
              : reviewJoin.error instanceof Error
                ? reviewJoin.error.message
                : "Could not update that request."}
        </p>
      ) : null}

      {isAdmin ? (
        <AdminInbox
          pending={pendingQuery.data ?? []}
          pendingTeams={pendingTeamsQuery.data ?? []}
          busyId={reviewMut.isPending ? (reviewMut.variables?.id ?? null) : null}
          busyTeamId={reviewTeamMut.isPending ? (reviewTeamMut.variables?.id ?? null) : null}
          onReview={(id, action) => reviewMut.mutate({ id, action })}
          onReviewTeam={(id, action) => reviewTeamMut.mutate({ id, action })}
          canManageAdmins={Boolean(profile.canManageAdmins)}
        />
      ) : null}

      {groups.length === 0 && !isAdmin ? (
        <p className="mt-5 rounded-lg border border-line bg-surface px-4 py-5 text-sm text-muted">
          You’re all caught up.
        </p>
      ) : groups.length > 0 ? (
        <div className="mt-5 space-y-6">
          {groups.map((group) => (
            <NoticeFold
              key={group.label}
              label={group.label}
              count={group.items.filter((item) => !item.read).length}
              onOpen={() => {
                if (!user || group.label === "New tournaments" || group.label === "Available Tournaments" || group.label === "New coaches") return;
                const ids = group.items.filter((item) => !item.read).map((item) => item.id);
                if (ids.length === 0) return;
                queryClient.setQueryData<NotificationItem[]>(["notifications", user.id], (current) =>
                  (current ?? []).map((item) => (ids.includes(item.id) ? { ...item, read: true } : item)),
                );
                void markNotificationsRead({ data: { ids } });
              }}
            >
              {group.items.map((n) =>
                <SwipeCard key={n.id} onDismiss={() => dismiss.mutate(n.id)}>
                {group.label === "New tournaments" || group.label === "Available Tournaments" ? (
                  <AvailableTournament
                    item={n}
                    teams={teamsQuery.data ?? []}
                    choice={(responseQuery.data ?? []).find((row) => row.weekendId === n.weekendId)?.choice ?? null}
                  />
                ) : n.kind === "coach-signup" ? (
                  <CoachSignupNotice
                    item={n}
                    busy={reviewCoach.isPending}
                    onKeep={(userId) => reviewCoach.mutate({ userId, action: "keep" })}
                    onRemove={(userId) => reviewCoach.mutate({ userId, action: "remove" })}
                  />
                ) : n.kind === "assistant-join" ? (
                  <JoinRequestNotice
                    item={n}
                    busy={reviewJoin.isPending}
                    onAnswer={(id, action) => reviewJoin.mutate({ id, action })}
                  />
                ) : (
                  <article className="rounded-lg border border-line bg-surface px-4 py-4">
                    <p className="font-semibold">{n.title}</p>
                    <p className="mt-1 text-sm text-muted">{n.body}</p>
                  </article>
                )}
                </SwipeCard>,
              )}
            </NoticeFold>
          ))}
        </div>
      ) : null}
      {HOME_FIELD_BACKDROP ? null : <FieldBand src="/photos/field-celebrate.jpg" />}
      </div>
    </AppShell>
  );
}

function SwipeCard({ children, onDismiss }: { children: ReactNode; onDismiss: () => void }) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef(0);
  const [drag, setDrag] = useState(0);
  function setX(value: number) {
    dragRef.current = value;
    setDrag(value);
  }
  function down(event: PointerEvent<HTMLDivElement>) {
    const target = event.target;
    if (target instanceof Element && target.closest("button, a, input, select, textarea")) return;
    start.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    if (dragRef.current === 0 && Math.abs(dx) < 10) return;
    if (dragRef.current === 0 && Math.abs(dy) > Math.abs(dx)) return;
    setX(Math.max(-180, Math.min(180, dx)));
  }
  function up(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const distance = dragRef.current;
    start.current = null;
    if (Math.abs(distance) > 72) {
      setX(distance < 0 ? -420 : 420);
      onDismiss();
      return;
    }
    setX(0);
  }
  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-[#1a1a1a] text-xs font-semibold uppercase tracking-wide text-white">
        <span className={`absolute inset-y-0 grid w-24 place-items-center ${drag < 0 ? "right-0" : "left-0"}`}>
          Dismiss
        </span>
      </div>
      <div
        style={{ transform: `translateX(${drag}px)`, transition: start.current ? "none" : "transform 160ms ease" }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="relative touch-pan-y bg-bg"
      >
        {children}
      </div>
    </div>
  );
}

function NoticeFold({
  label,
  count,
  onOpen,
  children,
}: {
  label: string;
  count: number;
  onOpen: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button
        type="button"
        onClick={() =>
          setOpen((value) => {
            if (!value) onOpen();
            return !value;
          })
        }
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <h2 className="font-display text-2xl font-bold uppercase">{label}</h2>
        <span className="flex items-center gap-2">
          <span className="grid h-7 min-w-7 place-items-center rounded-full bg-fg px-2 text-sm font-bold text-white">{count}</span>
          <ChevronDown className={`h-5 w-5 text-muted ${open ? "rotate-180" : ""}`} aria-hidden />
        </span>
      </button>
      {open ? <div className="mt-3 space-y-3">{children}</div> : null}
    </section>
  );
}

function AvailableTournament({
  item,
  teams,
  choice,
}: {
  item: NotificationItem;
  teams: { name: string; ageGroup: string | null }[];
  choice: "interested" | "maybe" | "no" | null;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<"interested" | "maybe" | "no" | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [asked, setAsked] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"interested" | "maybe" | "no" | null>(null);
  const save = useMutation({
    mutationFn: (next: "interested" | "maybe" | "no") => respondToTournament({ data: { weekendId: item.weekendId ?? 0, choice: next } }),
    onSuccess: async (result) => {
      setConfirm(null);
      setOpen(false);
      if (result.requested) {
        setAsked(result.reason ?? "the sheet is locked.");
        setNoteOpen(true);
      } else {
        setAsked(null);
        setPicked(result.choice);
        if (result.choice === "interested") setNoteOpen(true);
      }
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["tournament-responses"] });
      await queryClient.invalidateQueries({ queryKey: ["my-interest"] });
      await queryClient.invalidateQueries({ queryKey: ["weekends"] });
      await queryClient.invalidateQueries({ queryKey: ["my-schedule"] });
    },
  });
  const pending = save.isPending ? save.variables : null;
  const current = picked ?? choice;
  const selected = pending ?? current;
  const options = [
    { choice: "interested" as const, label: "Register" },
    { choice: "no" as const, label: "Not interested" },
  ];
  const choices = options.filter((option) => option.choice !== current);
  function choose(next: "interested" | "maybe" | "no") {
    if (current && next !== current) {
      setConfirm(next);
      return;
    }
    save.mutate(next);
  }
  const selectedLabel = selected === "maybe" ? "Not sure yet" : options.find((option) => option.choice === selected)?.label ?? "Undecided";
  const expanded = open;
  const undecided = selected == null;
  return (
    <article className={`rounded-lg border border-line px-4 py-4 ${undecided ? "bg-[#f5c518] text-[#1c1c1c]" : "bg-surface"}`}>
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="min-w-0">
          <span className="block font-semibold">{item.title}</span>
          {!expanded ? <span className="mt-2 block text-sm font-bold uppercase tracking-wide">{selectedLabel}</span> : null}
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 ${expanded ? "rotate-180" : ""} ${undecided ? "text-[#1c1c1c]" : "text-muted"}`} aria-hidden />
      </button>
      {expanded ? (
        <>
          <p className={`mt-1 text-sm ${undecided ? "text-[#1c1c1c]/80" : "text-muted"}`}>{item.body}</p>
          {item.weekendId == null ? (
            <p className="mt-3 text-sm">That tournament is no longer on the schedule.</p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {choices.map((option) => (
                <Button
                  key={option.choice}
                  type="button"
                  className="w-full"
                  variant={option.choice === "interested" ? "default" : "outline"}
                  disabled={save.isPending || item.weekendId == null || (option.choice === "interested" && teams.length === 0)}
                  onClick={() => choose(option.choice)}
                >
                  {pending === option.choice ? "Saving…" : option.label}
                </Button>
              ))}
            </div>
          )}
          {save.error instanceof Error ? <p className="mt-2 text-sm">{save.error.message}</p> : null}
        </>
      ) : null}
      {noteOpen ? <InterestNote asked={asked} onClose={() => { setNoteOpen(false); setAsked(null); }} /> : null}
      {confirm ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-scrim p-4 sm:items-center" onClick={() => setConfirm(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Change your answer"
            className="w-full max-w-md rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="font-display text-2xl font-bold uppercase">Are you sure?</h2>
            <p className="mt-3 text-sm">
              You already marked {options.find((option) => option.choice === current)?.label}. Change it to{" "}
              {options.find((option) => option.choice === confirm)?.label}?
            </p>
            <Button type="button" className="mt-4 w-full" disabled={save.isPending} onClick={() => save.mutate(confirm)}>
              {save.isPending ? "Saving…" : "Yes, change it"}
            </Button>
            <Button type="button" variant="outline" className="mt-2 w-full" disabled={save.isPending} onClick={() => setConfirm(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function InterestNote({ asked, onClose }: { asked: string | null; onClose: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-scrim p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={asked ? "Request sent" : "Registered"}
        className="w-full max-w-md rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-display text-2xl font-bold uppercase">{asked ? "Request sent" : "Registered"}</h2>
        <p className="mt-3 text-sm">
          {asked
            ? `This tournament is locked because ${asked} The director got a request to add your team.`
            : "Your team is on this tournament. The director can take you off."}
        </p>
        <Button type="button" className="mt-4 w-full" onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>,
    document.body,
  );
}

function CoachSignupNotice({
  item,
  busy,
  onKeep,
  onRemove,
}: {
  item: NotificationItem;
  busy: boolean;
  onKeep: (userId: string) => void;
  onRemove: (userId: string) => void;
}) {
  const userId = item.refKey?.startsWith("coach-signup-") ? item.refKey.slice("coach-signup-".length) : "";
  return (
    <article className="space-y-3 rounded-lg border border-line bg-surface px-4 py-4">
      <div>
        <p className="font-semibold">{item.title}</p>
        <p className="mt-1 text-sm">{item.body}</p>
      </div>
      {userId ? (
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="pine" disabled={busy} onClick={() => onKeep(userId)}>
            Keep access
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => onRemove(userId)}>
            Remove account
          </Button>
        </div>
      ) : null}
    </article>
  );
}

function JoinRequestNotice({
  item,
  busy,
  onAnswer,
}: {
  item: NotificationItem;
  busy: boolean;
  onAnswer: (id: number, action: "approve" | "deny") => void;
}) {
  const id = Number(String(item.refKey || "").replace("join-request-", ""));
  return (
    <article className="space-y-3 rounded-lg border border-line bg-surface px-4 py-4">
      <div>
        <p className="font-semibold">{item.title}</p>
        <p className="mt-1 text-sm">{item.body}</p>
      </div>
      {Number.isInteger(id) && id > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" disabled={busy} onClick={() => onAnswer(id, "approve")}>
            Add as assistant
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => onAnswer(id, "deny")}>
            Not now
          </Button>
        </div>
      ) : null}
      <p className="text-xs text-muted">The head coach stays the head coach.</p>
    </article>
  );
}

function coachNoticeGroups(items: NotificationItem[]) {
  const order = [
    { bucket: "assistant" as const, label: "Team" },
    { bucket: "new" as const, label: "New tournaments" },
    { bucket: "change" as const, label: "Tournament changes" },
  ];
  return order
    .map((group) => ({
      label: group.label,
      items: items.filter((item) => coachTournamentBucket(item) === group.bucket),
    }))
    .filter((group) => group.items.length > 0);
}

function noticeGroup(item: NotificationItem): string {
  const title = item.title.toLowerCase();
  const body = item.body.toLowerCase();
  const kind = item.kind.toLowerCase();
  if (kind === "assistant" || kind === "assistant-join") return "Teams";
  if (kind === "available" || body.includes("if your team is interested")) return "Available Tournaments";
  if (kind.startsWith("finalize") || title.includes("finish a tournament")) return "To finalize";
  if (title.includes("schedule") || title.includes("taken off") || title.includes("on the schedule")) return "Schedule";
  if (title.includes("team") || title.includes("you're in")) return "Teams";
  if (title.includes("weather") || title.includes("rain") || title.includes("lockout") || title.includes("seed")) return "Game day";
  if (title.includes("access")) return "Access";
  return "Updates";
}

function noticeGroups(items: NotificationItem[]) {
  const order = ["New coaches", "Available Tournaments", "To finalize", "Schedule", "Teams", "Game day", "Access", "Updates"];
  return order
    .map((label) => ({ label, items: items.filter((item) => noticeGroup(item) === label) }))
    .filter((group) => group.items.length > 0);
}
