import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CoachDeniedCard } from "@/components/coach-denied";
import { AdminInbox } from "@/components/homes";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { RedirectToSignIn } from "@/lib/auth/gates";
import {
  listNotifications,
  listPendingRequests,
  listPendingTeams,
  markNotificationsRead,
  reviewRequest,
  reviewTeam,
  type DirectoryUser,
  type NotificationItem,
  type PendingRequest,
  type PendingTeam,
} from "@/lib/pbi/api";

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

  useEffect(() => {
    if (!user || !profile || !notifQuery.data?.some((n) => !n.read)) return;
    void markNotificationsRead().then(() => {
      queryClient.setQueryData<NotificationItem[]>(["notifications", user.id], (current) =>
        (current ?? []).map((item) => ({ ...item, read: true })),
      );
    });
  }, [user, profile, notifQuery.data, queryClient]);

  if (isPending) return <SessionSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile) return <Navigate to="/" />;

  const items = notifQuery.data ?? [];
  const pendingLabel =
    profile.requestStatus === "pending"
      ? `${profile.requestedRole === "admin" ? "Admin" : "Coach"} · waiting`
      : null;

  return (
    <AppShell homeRole={profile.homeRole} pendingLabel={pendingLabel}>
      <h1 className="font-display text-4xl font-bold uppercase">Notifications</h1>
      {profile.requestStatus === "pending" ? (
        <p className="mt-3 rounded-md bg-warn-bg px-4 py-3 text-sm font-medium">
          Your {profile.requestedRole === "admin" ? "Admin" : "Coach"} access is waiting for Admin
          approval.
        </p>
      ) : null}
      {profile.requestStatus === "approved" ? (
        <p className="mt-3 rounded-md bg-ok-bg px-4 py-3 text-sm font-medium">
          Your {profile.requestedRole === "admin" ? "Admin" : "Coach"} access was approved.
        </p>
      ) : null}
      {profile.requestStatus === "denied" && profile.requestedRole === "coach" ? (
        <div className="mt-3">
          <CoachDeniedCard profile={profile} />
        </div>
      ) : profile.requestStatus === "denied" ? (
        <p className="mt-3 rounded-md bg-warn-bg px-4 py-3 text-sm font-medium">
          Your {profile.requestedRole === "admin" ? "Admin" : "Coach"} access was denied. You still
          have Parent tools.
        </p>
      ) : null}

      {reviewMut.error || reviewTeamMut.error ? (
        <p className="mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm">
          {reviewMut.error instanceof Error
            ? reviewMut.error.message
            : reviewTeamMut.error instanceof Error
              ? reviewTeamMut.error.message
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
        />
      ) : null}

      <ul className="mt-5 space-y-3">
        {items.length === 0 ? (
          <li className="rounded-lg border border-line bg-surface px-4 py-5 text-sm text-muted">
            You’re all caught up. Game reminders will show up here later.
          </li>
        ) : (
          items.map((n) => (
            <li key={n.id} className="rounded-lg border border-line bg-surface px-4 py-4">
              <p className="font-semibold">{n.title}</p>
              <p className="mt-1 text-sm text-muted">{n.body}</p>
            </li>
          ))
        )}
      </ul>
    </AppShell>
  );
}
