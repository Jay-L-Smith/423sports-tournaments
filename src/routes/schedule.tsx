import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { listSchedule } from "@/lib/pbi/api";
import { formatWeekendRange } from "@/lib/pbi/weekends";

export const Route = createFileRoute("/schedule")({
  component: SchedulePage,
});

function SchedulePage() {
  const { user, isPending, profile } = useAppSession();
  const scheduleQuery = useQuery({
    queryKey: ["my-schedule"],
    queryFn: () => listSchedule(),
    enabled: Boolean(user && profile),
  });

  if (isPending) return <SessionSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile) return <Navigate to="/" />;

  const items = scheduleQuery.data ?? [];

  return (
    <AppShell homeRole={profile.homeRole}>
      <h1 className="font-display text-4xl font-bold uppercase">Schedule</h1>
      <p className="mt-2 text-sm text-muted">Same games as the bracket, in time order.</p>

      {scheduleQuery.isPending ? (
        <p className="mt-6 text-sm text-muted">Loading games…</p>
      ) : items.length === 0 ? (
        <p className="mt-6 rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
          No games yet. Teams have to be in, then the bracket fills the calendar.
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {items.map((item) => (
            <section key={item.weekend.id} className="space-y-3">
              <div>
                <h2 className="font-display text-2xl font-bold uppercase leading-none">{item.weekend.name}</h2>
                <p className="mt-2 text-sm text-muted">
                  {formatWeekendRange(item.weekend.startDate, item.weekend.endDate)}
                </p>
                <Link
                  to="/bracket/$weekendId"
                  params={{ weekendId: String(item.weekend.id) }}
                  className="mt-3 flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-bold uppercase tracking-wide text-primary-fg"
                >
                  Open Bracket
                </Link>
              </div>
              {item.games.length === 0 ? (
                <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
                  No games on the clock yet.
                </p>
              ) : (
                item.games.map((game) => (
                  <article key={game.id} className="site-card">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {game.ageGroup} · {game.roundLabel}
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold uppercase leading-none">
                      {game.homeName ?? "TBD"} vs {game.awayName ?? "TBD"}
                    </p>
                    <p className="mt-2 text-sm font-medium">{game.when}</p>
                    <p className="mt-1 text-sm text-muted">{game.locationName ?? "Field TBD"}</p>
                  </article>
                ))
              )}
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
