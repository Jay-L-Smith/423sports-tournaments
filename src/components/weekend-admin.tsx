import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Link, Navigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { getWeekend, listNotifications, type WeekendDetail } from "@/lib/pbi/api";

export type WeekendAdminCtx = {
  id: number;
  detail: WeekendDetail;
  unread: number;
  queryClient: QueryClient;
  bump: () => void;
};

export function bumpWeekend(queryClient: QueryClient, id: number) {
  void queryClient.invalidateQueries({ queryKey: ["weekend", id] });
  void queryClient.invalidateQueries({ queryKey: ["weekends"] });
  void queryClient.invalidateQueries({ queryKey: ["schedule", id] });
}

export function WeekendAdminFrame({
  weekendId,
  backTo,
  children,
}: {
  weekendId: string;
  backTo: "list" | "hub";
  children: (ctx: WeekendAdminCtx) => ReactNode;
}) {
  const id = Number.parseInt(weekendId, 10);
  const { user, isPending, profile } = useAppSession();
  const queryClient = useQueryClient();
  const notifQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => listNotifications(),
    enabled: Boolean(user && profile),
  });
  const detailQuery = useQuery({
    queryKey: ["weekend", id],
    queryFn: () => getWeekend({ data: { id } }),
    enabled: Boolean(profile?.homeRole === "admin" && Number.isInteger(id) && id > 0),
  });

  if (isPending) return <SessionSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile || profile.homeRole !== "admin") return <Navigate to="/" />;
  if (!Number.isInteger(id) || id < 1) return <Navigate to="/weekends" />;

  const unread = (notifQuery.data ?? []).filter((n) => !n.read).length;
  const detail = detailQuery.data;

  return (
    <AppShell homeRole={profile.homeRole} unread={unread}>
      {backTo === "list" ? (
        <Link to="/weekends" className="text-sm font-semibold text-primary">
          All tournaments
        </Link>
      ) : (
        <Link
          to="/weekends/$weekendId"
          params={{ weekendId: String(id) }}
          className="text-sm font-semibold text-primary"
        >
          ← {detail?.name ?? "Tournament"}
        </Link>
      )}

      {detailQuery.isPending ? (
        <p className="mt-6 text-sm text-muted">Loading this weekend…</p>
      ) : !detail ? (
        <p className="mt-6 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
          {detailQuery.error instanceof Error ? detailQuery.error.message : "Could not load that tournament."}
        </p>
      ) : (
        children({
          id,
          detail,
          unread,
          queryClient,
          bump: () => bumpWeekend(queryClient, id),
        })
      )}
    </AppShell>
  );
}

export function SectionLink({
  to,
  weekendId,
  title,
  hint,
}: {
  to: "/weekends/$weekendId/edit" | "/weekends/$weekendId/rules" | "/weekends/$weekendId/teams" | "/weekends/$weekendId/locations";
  weekendId: string;
  title: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      params={{ weekendId }}
      className="flex min-h-16 items-center gap-3 rounded-lg border border-line bg-surface px-4 py-4 text-left transition-colors duration-150 hover:border-primary"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-display text-2xl font-bold uppercase leading-none">{title}</span>
        <span className="mt-2 block text-sm text-muted">{hint}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden />
    </Link>
  );
}
