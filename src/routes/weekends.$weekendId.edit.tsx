import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { WeekendAdminFrame } from "@/components/weekend-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateWeekend, type WeekendAge } from "@/lib/pbi/api";
import { cn } from "@/lib/utils";
import {
  AGE_GROUPS,
  DAY_KINDS,
  DEFAULT_AGE_MIN_TEAMS,
  DEFAULT_TOURNAMENT_TEAMS,
  dayKindLabel,
  formatDayTab,
  parseDayPlan,
  weekendSavePayload,
  type AgeGroup,
  type DayKind,
  type DayPlan,
} from "@/lib/pbi/weekends";

export const Route = createFileRoute("/weekends/$weekendId/edit")({
  component: TournamentEditPage,
});

type AgeDraft = { ageGroup: AgeGroup; min: string; max: string };

function toDrafts(ages: WeekendAge[], weekendMax: number): AgeDraft[] {
  return ages.map((age) => ({
    ageGroup: age.ageGroup,
    min: String(age.minTeams ?? DEFAULT_AGE_MIN_TEAMS),
    max: String(age.maxTeams ?? weekendMax),
  }));
}

function planFromDetail(detail: import("@/lib/pbi/api").WeekendDetail): DayPlan[] {
  return parseDayPlan(detail.dayPlan, detail.startDate, detail.endDate, detail.poolPlay);
}

function TournamentEditPage() {
  const { weekendId } = Route.useParams();

  return (
    <WeekendAdminFrame weekendId={weekendId} backTo="hub">
      {(ctx) => <EditForm {...ctx} />}
    </WeekendAdminFrame>
  );
}

function EditForm({
  id,
  detail,
  queryClient,
  bump,
}: {
  id: number;
  detail: import("@/lib/pbi/api").WeekendDetail;
  queryClient: import("@tanstack/react-query").QueryClient;
  bump: () => void;
}) {
  const [name, setName] = useState(detail.name);
  const [startDate, setStartDate] = useState(detail.startDate);
  const [endDate, setEndDate] = useState(detail.endDate);
  const [capDraft, setCapDraft] = useState(String(detail.maxTeams));
  const [drafts, setDrafts] = useState<AgeDraft[]>(() => toDrafts(detail.ages, detail.maxTeams));
  const [dayPlan, setDayPlan] = useState<DayPlan[]>(() => planFromDetail(detail));
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setName(detail.name);
    setStartDate(detail.startDate);
    setEndDate(detail.endDate);
    setCapDraft(String(detail.maxTeams));
    setDrafts(toDrafts(detail.ages, detail.maxTeams));
    setDayPlan(planFromDetail(detail));
  }, [detail]);

  const lockedAges = new Set(detail.ages.filter((age) => age.teamCount > 0).map((age) => age.ageGroup));

  const saveMut = useMutation({
    mutationFn: (input: ReturnType<typeof weekendSavePayload>) => updateWeekend({ data: input }),
    onSuccess: (next) => {
      setFormError(null);
      queryClient.setQueryData(["weekend", id], next);
      bump();
    },
  });

  function alignDates(nextStart: string, nextEnd: string) {
    setStartDate(nextStart);
    setEndDate(nextEnd);
    if (nextStart && nextEnd) {
      setDayPlan((current) => parseDayPlan(current, nextStart, nextEnd, true));
    }
  }

  function setKind(date: string, kind: DayKind) {
    setDayPlan((current) => current.map((row) => (row.date === date ? { ...row, kind } : row)));
  }

  function toggleAge(group: AgeGroup) {
    setFormError(null);
    setDrafts((current) => {
      const on = current.some((row) => row.ageGroup === group);
      if (on) {
        if (lockedAges.has(group)) {
          setFormError(`Can’t drop ${group} while a team is on it.`);
          return current;
        }
        return current.filter((row) => row.ageGroup !== group);
      }
      const cap = capDraft.trim() || String(detail.maxTeams);
      return [...current, { ageGroup: group, min: String(DEFAULT_AGE_MIN_TEAMS), max: cap }].sort(
        (a, b) => AGE_GROUPS.indexOf(a.ageGroup) - AGE_GROUPS.indexOf(b.ageGroup),
      );
    });
  }

  function save(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    try {
      saveMut.mutate(
        weekendSavePayload(detail, {
          name,
          startDate,
          endDate,
          maxTeams: capDraft,
          dayPlan,
          ages: drafts.map((row) => ({
            ageGroup: row.ageGroup,
            minTeams: row.min,
            maxTeams: row.max,
          })),
        }),
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Check the form and try again.");
    }
  }

  const errorText =
    formError ??
    (saveMut.error instanceof Error ? saveMut.error.message : saveMut.error ? "Could not save that tournament." : null);

  return (
    <>
      <h1 className="mt-3 font-display text-4xl font-bold uppercase">Edit tournament</h1>
      <p className="mt-1 text-sm text-muted">Name, dates, ages, and what each day is for.</p>
      <Link
        to="/weekends/$weekendId/rules"
        params={{ weekendId: String(id) }}
        className="mt-4 flex min-h-12 items-center justify-center rounded-md border-2 border-fg px-4 text-sm font-bold uppercase tracking-wide"
      >
        Edit rules
      </Link>
      <p className="mt-1 text-xs text-muted">
        Bracket, pool games, clocks, pack options, and Gold/Silver cuts live on Rules.
      </p>


      <form noValidate onSubmit={save} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="weekend-name">Name</Label>
          <Input
            id="weekend-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
            maxLength={80}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="weekend-start">First day</Label>
            <Input
              id="weekend-start"
              type="date"
              value={startDate}
              onChange={(e) => {
                const next = e.target.value;
                const end = endDate && next && endDate < next ? next : endDate;
                alignDates(next, end);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weekend-end">Last day</Label>
            <Input
              id="weekend-end"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => alignDates(startDate, e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="weekend-cap">Max teams</Label>
          <Input
            id="weekend-cap"
            inputMode="numeric"
            value={capDraft}
            onChange={(e) => setCapDraft(e.target.value)}
            maxLength={2}
          />
          <p className="text-xs text-muted">Whole event, all ages. Default {DEFAULT_TOURNAMENT_TEAMS}.</p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-fg">Each day</legend>
          <p className="text-xs text-muted">
            Pool, bracket, or both on the same day. Three-day and week-long events usually mix on a middle day.
          </p>
          {dayPlan.map((row) => (
            <div key={row.date} className="rounded-md border border-line bg-surface p-3">
              <p className="text-sm font-semibold">{formatDayTab(row.date)}</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {DAY_KINDS.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={row.kind === kind}
                    onClick={() => setKind(row.date, kind)}
                    className={cn(
                      "min-h-11 rounded-md border text-xs font-bold uppercase tracking-wide",
                      row.kind === kind ? "border-pine bg-pine text-pine-fg" : "border-line bg-bg text-fg",
                    )}
                  >
                    {kind === "pool" ? "Pool" : kind === "mixed" ? "Mixed" : "Bracket"}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">{dayKindLabel(row.kind)}</p>
            </div>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-fg">Age groups</legend>
          <p className="text-xs text-muted">Tap to add an age. Ages with a team stay on.</p>
          <div className="grid grid-cols-4 gap-2">
            {AGE_GROUPS.map((group) => {
              const on = drafts.some((row) => row.ageGroup === group);
              const locked = lockedAges.has(group);
              return (
                <button
                  key={group}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleAge(group)}
                  className={cn(
                    "min-h-11 rounded-md border text-sm font-semibold",
                    on ? "border-pine bg-pine text-pine-fg" : "border-line bg-bg text-fg hover:bg-surface",
                    locked ? "cursor-default" : "",
                  )}
                >
                  {group}
                </button>
              );
            })}
          </div>
        </fieldset>

        {drafts.map((row, index) => (
          <div key={row.ageGroup} className="rounded-md border border-line bg-surface p-3">
            <p className="font-display text-xl font-bold uppercase leading-none">{row.ageGroup}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`min-${row.ageGroup}`}>Min teams</Label>
                <Input
                  id={`min-${row.ageGroup}`}
                  inputMode="numeric"
                  placeholder={String(DEFAULT_AGE_MIN_TEAMS)}
                  value={row.min}
                  onChange={(e) => {
                    const min = e.target.value;
                    setDrafts((current) => current.map((item, i) => (i === index ? { ...item, min } : item)));
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`max-${row.ageGroup}`}>Max teams</Label>
                <Input
                  id={`max-${row.ageGroup}`}
                  inputMode="numeric"
                  placeholder={capDraft || String(DEFAULT_TOURNAMENT_TEAMS)}
                  value={row.max}
                  onChange={(e) => {
                    const max = e.target.value;
                    setDrafts((current) => current.map((item, i) => (i === index ? { ...item, max } : item)));
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        {errorText ? (
          <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {errorText}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={saveMut.isPending}>
          {saveMut.isPending ? "Saving…" : "Save"}
        </Button>
      </form>
    </>
  );
}
