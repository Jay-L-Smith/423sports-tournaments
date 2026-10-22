import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { EventAgeChoices } from "@/components/event-age-interest";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { listMyEventInterest } from "@/lib/pbi/api";
import { formatTeamFee, formatWeekendRange } from "@/lib/pbi/weekends";

const RETURN_KEY = "pbi-return";

function eventSearch(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") return value.slice(0, 200);
  if (Array.isArray(value)) return value.map((item) => (typeof item === "number" || typeof item === "string" ? String(item) : "")).filter(Boolean).join(",").slice(0, 200);
  return "";
}

export const Route = createFileRoute("/interest")({
  validateSearch: (search: Record<string, unknown>) => ({
    e: eventSearch(search.e),
  }),
  component: InterestPage,
});

function InterestPage() {
  const search = Route.useSearch();
  const { user, isPending, profile } = useAppSession();
  const ids = search.e.split(",").map((part) => Number(part)).filter((id) => Number.isInteger(id) && id > 0);
  const interest = useQuery({
    queryKey: ["event-age-interest", search.e],
    queryFn: () => listMyEventInterest({ data: { weekendIds: ids } }),
    enabled: Boolean(user) && ids.length > 0,
  });

  useEffect(() => {
    if (isPending || user || !search.e) return;
    sessionStorage.setItem(RETURN_KEY, `/interest?e=${search.e}`);
  }, [isPending, user, search.e]);

  if (isPending) return <SessionSkeleton />;
  if (!user) return <Navigate to="/login" />;
  if (!profile) return <Navigate to="/" />;

  return (
    <AppShell homeRole={profile.homeRole}>
      <h1 className="font-display text-4xl font-bold uppercase">Your weekends</h1>
      {ids.length === 0 ? (
        <p className="mt-4 text-sm">That link is missing the weekend.</p>
      ) : interest.isPending ? (
        <p className="mt-4 text-sm text-muted">Loading…</p>
      ) : interest.error instanceof Error ? (
        <p className="mt-4 text-sm">{interest.error.message}</p>
      ) : interest.data && interest.data.events.length === 0 ? (
        <p className="mt-4 text-sm">That tournament is no longer on the schedule.</p>
      ) : (
        <div className="mt-4 space-y-6">
          {interest.data?.events.map((event) => (
            <section key={event.id} className="rounded-lg border border-line bg-surface p-3">
              <h2 className="font-display text-2xl font-bold uppercase leading-tight">{event.name}</h2>
              <p className="mt-1 text-sm text-muted">{formatWeekendRange(event.startDate, event.endDate)}</p>
              {event.teamFeeCents != null ? (
                <p className="mt-1 text-sm font-semibold">{formatTeamFee(event.teamFeeCents)} per team</p>
              ) : null}
              <EventAgeChoices event={event} ages={interest.data?.ages ?? []} />
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
