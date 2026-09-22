import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CoachDeniedCard } from "@/components/coach-denied";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { listNotifications, markNotificationsRead, type NotificationItem } from "@/lib/pbi/api";

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const { user, isPending, profile } = useAppSession();
  const queryClient = useQueryClient();
  const notifQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => listNotifications(),
    enabled: Boolean(user && profile),
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
  const unread = items.filter((n) => !n.read).length;
  const pendingLabel =
    profile.requestStatus === "pending"
      ? `${profile.requestedRole === "admin" ? "Admin" : "Coach"} · waiting`
      : null;

  return (
    <AppShell homeRole={profile.homeRole} pendingLabel={pendingLabel} unread={unread}>
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
