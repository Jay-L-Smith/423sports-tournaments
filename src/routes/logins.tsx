import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StickyBack } from "@/components/shell";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { listLoginHistory, usageMetrics, type LoginVisit, type UsageMetrics } from "@/lib/pbi/api";

export const Route = createFileRoute("/logins")({ component: LoginHistoryPage });

function LoginHistoryPage() {
  const { user, isPending, profile } = useAppSession();
  const allowed = Boolean(profile?.isSuperuser);
  const history = useQuery({
    queryKey: ["login-history"],
    queryFn: () => listLoginHistory(),
    enabled: allowed,
    refetchInterval: 30_000,
  });
  const usage = useQuery({
    queryKey: ["usage-metrics"],
    queryFn: () => usageMetrics(),
    enabled: allowed,
  });

  if (isPending) return <SessionSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile || !allowed) {
    return (
      <AppShell homeRole={profile?.homeRole ?? "admin"}>
        <p className="text-sm text-muted">Only the superuser can see login history.</p>
      </AppShell>
    );
  }

  const rows = history.data ?? [];
  return (
    <AppShell homeRole={profile.homeRole}>
      <StickyBack>
        <Link to="/" className="text-sm font-semibold text-muted">
          ← Account
        </Link>
      </StickyBack>
      <h1 className="font-display text-4xl font-bold uppercase leading-none">Login history</h1>
      <p className="mt-2 text-sm text-muted">Who signed in, and how long they stayed.</p>
      <UsageBlock metrics={usage.data} pending={usage.isPending} error={usage.error} />
      {history.isPending ? <p className="mt-6 text-sm text-muted">Loading…</p> : null}
      {history.error instanceof Error ? <p className="mt-6 text-sm">{history.error.message}</p> : null}
      {!history.isPending && rows.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line bg-surface px-4 py-4 text-sm text-muted">No sign-ins yet.</p>
      ) : (
        <div className="mt-5 space-y-5">
          {daySections(groupByDay(rows)).map((section) => (
            <section key={section.day}>
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted">{section.label}</h2>
              <ul className="mt-2 space-y-2">
                {section.cards.map((card) => (
                  <li key={card.key} className="rounded-lg border border-line bg-surface px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="block font-semibold">{card.name}</span>
                        {card.email && card.email !== card.name ? <span className="mt-0.5 block truncate text-sm text-muted">{card.email}</span> : null}
                        <span className="mt-1 block text-sm">{card.role}</span>
                      </div>
                      <span className="shrink-0 text-right text-sm font-semibold">
                        {stayLabel(card.totalMinutes)}
                        {card.stillIn ? <span className="mt-0.5 block text-xs font-semibold text-muted">Still in</span> : null}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1 border-t border-line pt-2">
                      {card.visits.map((visit) => {
                        const started = new Date(visit.startedAt);
                        const when = Number.isNaN(started.getTime())
                          ? ""
                          : started.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                        return (
                          <li key={visit.id} className="text-sm">
                            {when}
                            {" · "}
                            {visit.stillIn ? `Still in · ${stayLabel(visit.minutes)}` : stayLabel(visit.minutes)}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function UsageBlock({ metrics, pending, error }: { metrics: UsageMetrics | undefined; pending: boolean; error: unknown }) {
  const rows = metrics
    ? [
        ["Coaches in", metrics.coachesIn.week, metrics.coachesIn.all],
        ["Admins in", metrics.adminsIn.week, metrics.adminsIn.all],
        ["Live link people", metrics.liveLinks.week, metrics.liveLinks.all],
        ["Live link opens", metrics.liveOpens.week, metrics.liveOpens.all],
        ["Avg live link visit", stayLabel(metrics.liveMinutes.week), stayLabel(metrics.liveMinutes.all)],
        ["Navigate", metrics.navigatePeople.week, metrics.navigatePeople.all],
        ["Navigate taps", metrics.navigateTaps.week, metrics.navigateTaps.all],
        ["Teams registered", metrics.teams.week, metrics.teams.all],
        ["Players added", metrics.players.week, metrics.players.all],
        ["Avg coach visit", stayLabel(metrics.coachMinutes.week), stayLabel(metrics.coachMinutes.all)],
        ["Avg visit", stayLabel(metrics.visitMinutes.week), stayLabel(metrics.visitMinutes.all)],
      ]
    : [];
  return (
    <section className="mt-6">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted">Usage</h2>
      {pending ? <p className="mt-2 text-sm text-muted">Loading…</p> : null}
      {error instanceof Error ? <p className="mt-2 text-sm">{error.message}</p> : null}
      {metrics ? (
        <div className="mt-2 overflow-hidden rounded-lg border border-line bg-surface">
          <div className="grid grid-cols-[1fr_4.75rem_4.75rem] gap-2 border-b border-line px-3 py-2 text-[10px] font-bold uppercase text-muted">
            <span />
            <span className="text-right">7 days</span>
            <span className="text-right">All time</span>
          </div>
          {rows.map(([label, week, all]) => (
            <div key={String(label)} className="grid grid-cols-[1fr_4.75rem_4.75rem] gap-2 border-b border-line px-3 py-2 text-sm last:border-b-0">
              <span>{label}</span>
              <span className="text-right font-semibold">{week}</span>
              <span className="text-right font-semibold">{all}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function groupByDay(rows: LoginVisit[]) {
  const cards: {
    key: string;
    name: string;
    email: string;
    role: string;
    day: string;
    dayLabel: string;
    totalMinutes: number;
    stillIn: boolean;
    visits: LoginVisit[];
  }[] = [];
  const index = new Map<string, number>();
  for (const row of rows) {
    const started = new Date(row.startedAt);
    const known = !Number.isNaN(started.getTime());
    const day = known ? `${started.getFullYear()}-${started.getMonth()}-${started.getDate()}` : "unknown";
    const key = `${row.email || row.name}|${day}`;
    const at = index.get(key);
    if (at == null) {
      index.set(key, cards.length);
      cards.push({
        key,
        day,
        name: row.name,
        email: row.email,
        role: row.role,
        dayLabel: known ? dayHeading(started) : "Unknown day",
        totalMinutes: row.minutes,
        stillIn: row.stillIn,
        visits: [row],
      });
      continue;
    }
    const card = cards[at]!;
    card.visits.push(row);
    card.totalMinutes += row.minutes;
    if (row.stillIn) card.stillIn = true;
  }
  return cards;
}

function daySections(cards: ReturnType<typeof groupByDay>) {
  const sections: { day: string; label: string; cards: typeof cards }[] = [];
  for (const card of cards) {
    const last = sections[sections.length - 1];
    if (!last || last.day !== card.day) sections.push({ day: card.day, label: card.dayLabel, cards: [card] });
    else last.cards.push(card);
  }
  return sections;
}

function dayHeading(date: Date) {
  const start = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diff = Math.round((start(new Date()) - start(date)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function stayLabel(minutes: number) {
  if (minutes < 1) return "Less than a minute";
  if (minutes < 60) return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourLabel = hours === 1 ? "1 hour" : `${hours} hours`;
  if (rest === 0) return hourLabel;
  return `${hourLabel} ${rest === 1 ? "1 minute" : `${rest} minutes`}`;
}
