import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Link, Navigate, useRouter } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { getWeekend, listWeekends, type Weekend, type WeekendDetail } from "@/lib/pbi/api";
import { lockedBack, rememberOrigin, originBack } from "@/lib/screen-back";

export type WeekendAdminCtx = {
  id: number;
  detail: WeekendDetail;
  queryClient: QueryClient;
  bump: () => void;
  readOnly: boolean;
};

export function bumpWeekend(queryClient: QueryClient, id: number) {
  void queryClient.invalidateQueries({ queryKey: ["weekend", id] });
  void queryClient.invalidateQueries({ queryKey: ["weekends"] });
  void queryClient.invalidateQueries({ queryKey: ["schedule", id] });
}

function parentEvent(detail: WeekendDetail, weekends: Weekend[]) {
  return (
    weekends
      .filter((event) => {
        if (event.lifecycle !== "announced" || event.id === detail.id) return false;
        const name = event.name.trim();
        return Boolean(name) && detail.startDate >= event.startDate && detail.startDate <= event.endDate && detail.name.startsWith(name);
      })
      .sort((a, b) => b.name.length - a.name.length || a.id - b.id)[0] ?? null
  );
}

function lockBannerText(detail: WeekendDetail, isAdmin: boolean): string {
  const why = `Locked because ${detail.lockReason}`;
  if (!isAdmin || detail.entryRequests.length === 0) return why;
  const count = detail.entryRequests.length;
  return `${why} ${count === 1 ? "1 team asked" : `${count} teams asked`} to get in.`;
}

function LockTicker({ text }: { text: string }) {
  const line = `${text}     ·     `;
  return (
    <div className="overflow-hidden text-[10px] font-semibold leading-4 text-[#f3d27a]" aria-live="polite">
      <div className="lock-ticker flex w-max">
        <span className="whitespace-nowrap px-3">{line}</span>
        <span className="whitespace-nowrap px-3" aria-hidden>{line}</span>
      </div>
    </div>
  );
}

export function WeekendAdminFrame({
  weekendId,
  backTo,
  adminOnly = false,
  hideBack = false,
  contained = false,
  children,
}: {
  weekendId: string;
  backTo: "list" | "hub";
  adminOnly?: boolean;
  hideBack?: boolean;
  contained?: boolean;
  children: (ctx: WeekendAdminCtx & { goBack: () => void }) => ReactNode;
}) {
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
    enabled: Boolean(allowed && validId),
  });
  const weekendsQuery = useQuery({
    queryKey: ["weekends"],
    queryFn: () => listWeekends(),
    enabled: Boolean(isAdmin),
  });
  const detail = detailQuery.data;
  function goBack() {
    if (!isAdmin) {
      router.history.push("/");
      return;
    }
    if (detail?.lifecycle === "announced") {
      router.history.push(originBack(id, "/"));
      return;
    }
    const event = detail ? parentEvent(detail, weekendsQuery.data ?? []) : null;
    if (event) {
      router.history.push(`/weekends/${event.id}`);
      return;
    }
    router.history.push(lockedBack(id, "/"));
  }
  useEffect(() => {
    if (detail?.lifecycle === "announced") rememberOrigin(id);
  }, [detail?.lifecycle, id]);

  if (isPending) return <SessionSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile || !allowed) {
    if (isCoach && adminOnly && validId) {
      return <Navigate to="/weekends/$weekendId" params={{ weekendId: String(id) }} />;
    }
    return <Navigate to="/" />;
  }
  if (!validId) return <Navigate to="/" />;

  return (
    <AppShell
      homeRole={profile.homeRole}
      back={
        hideBack ? undefined : backTo === "list" ? (
          <button type="button" onClick={goBack} className="text-sm font-semibold text-primary">
            Back
          </button>
        ) : (
          <Link
            to="/weekends/$weekendId"
            params={{ weekendId: String(id) }}
            className="text-sm font-semibold text-primary"
          >
            ← {detail?.name ?? "Tournament"}
          </Link>
        )
      }
      banner={isAdmin && detail?.lockReason ? <LockTicker text={lockBannerText(detail, true)} /> : null}
      contained={contained}
    >
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
          queryClient,
          bump: () => bumpWeekend(queryClient, id),
          readOnly: !isAdmin,
          goBack,
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
  hintClassName,
}: {
  to: "/weekends/$weekendId/edit" | "/weekends/$weekendId/rules" | "/weekends/$weekendId/teams" | "/weekends/$weekendId/locations" | "/weekends/$weekendId/staff" | "/weekends/$weekendId/eligibility";
  weekendId: string;
  title: string;
  hint: string;
  hintClassName?: string;
}) {
  return (
    <Link
      to={to}
      params={{ weekendId }}
      className="hub-tile flex items-center gap-2 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-extrabold uppercase leading-tight text-[#1a1a1a]">{title}</span>
        <span className={`mt-0.5 block truncate text-[13px] leading-tight ${hintClassName ?? "text-[#8a8a8a]"}`}>{hint}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#c4c4c4]" strokeWidth={2.25} aria-hidden />
    </Link>
  );
}
