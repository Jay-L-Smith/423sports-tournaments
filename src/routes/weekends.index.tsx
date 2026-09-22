import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { createWeekend, listNotifications, listWeekends, type Weekend } from "@/lib/pbi/api";
import { cn } from "@/lib/utils";
import {
  AGE_GROUPS,
  defaultWeekendDates,
  formatAgeGroups,
  formatWeekendRange,
  isoDateFromLocal,
  MAX_TOURNAMENT_TEAMS,
  parseWeekendInput,
  type AgeGroup,
} from "@/lib/pbi/weekends";

export const Route = createFileRoute("/weekends/")({ component: WeekendsPage });

function WeekendsPage() {
  const { user, isPending, profile } = useAppSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const defaults = useMemo(() => defaultWeekendDates(), []);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([...AGE_GROUPS]);
  const [maxTeams, setMaxTeams] = useState(String(MAX_TOURNAMENT_TEAMS));
  const [formError, setFormError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const notifQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => listNotifications(),
    enabled: Boolean(user && profile),
  });
  const weekendsQuery = useQuery({
    queryKey: ["weekends"],
    queryFn: () => listWeekends(),
    enabled: Boolean(profile?.homeRole === "admin"),
  });

  const createMut = useMutation({
    mutationFn: (input: {
      name: string;
      startDate: string;
      endDate: string;
      ageGroups: AgeGroup[];
      maxTeams: number;
    }) => createWeekend({ data: input }),
    onSuccess: (created) => {
      setName("");
      setAgeGroups([...AGE_GROUPS]);
      setMaxTeams(String(MAX_TOURNAMENT_TEAMS));
      setFormError(null);
      const next = defaultWeekendDates();
      setStartDate(next.startDate);
      setEndDate(next.endDate);
      queryClient.setQueryData<Weekend[]>(["weekends"], (current) => {
        const nextList = [...(current ?? []).filter((row) => row.id !== created.id), created];
        nextList.sort((a, b) =>
          a.startDate === b.startDate ? a.id - b.id : a.startDate.localeCompare(b.startDate),
        );
        return nextList;
      });
      void queryClient.invalidateQueries({ queryKey: ["weekends"] });
      void navigate({ to: "/weekends/$weekendId", params: { weekendId: String(created.id) } });
    },
  });

  if (isPending) return <SessionSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile) return <Navigate to="/" />;
  if (profile.homeRole !== "admin") return <Navigate to="/" />;

  const unread = (notifQuery.data ?? []).filter((n) => !n.read).length;
  const weekends = weekendsQuery.data ?? [];
  const today = isoDateFromLocal(new Date());
  const upcoming = weekends.filter((w) => w.endDate >= today);
  const past = weekends.filter((w) => w.endDate < today);

  function toggleAge(group: AgeGroup) {
    setAgeGroups((current) =>
      current.includes(group) ? current.filter((g) => g !== group) : [...current, group],
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    try {
      const parsed = parseWeekendInput({ name, startDate, endDate, ageGroups, maxTeams });
      createMut.mutate(parsed);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Check the form and try again.");
    }
  }

  const errorText =
    formError ??
    (createMut.error instanceof Error ? createMut.error.message : createMut.error ? "Could not save that tournament." : null);

  return (
    <AppShell homeRole={profile.homeRole} unread={unread}>
      <h1 className="font-display text-4xl font-bold uppercase">Tournaments</h1>
      <p className="mt-2 text-sm text-muted">Tap a tournament to edit it, add an age, or open the bracket.</p>

      {!adding ? (
        <Button
          type="button"
          size="lg"
          className="mt-6 w-full"
          onClick={() => {
            setFormError(null);
            setAdding(true);
          }}
        >
          Add Tournament
        </Button>
      ) : (
      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-lg border border-line bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">New tournament</p>
          <Button
            type="button"
            variant="ghost"
            className="px-2 text-muted"
            onClick={() => {
              setAdding(false);
              setFormError(null);
            }}
          >
            Cancel
          </Button>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="weekend-name">Name</Label>
          <Input
            id="weekend-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="McMinn / TWU"
            autoComplete="off"
            maxLength={80}
          />
          <p className="text-xs text-muted">Official title, or just the fields if it has no name.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="weekend-start">First day</Label>
            <Input
              id="weekend-start"
              name="startDate"
              type="date"
              value={startDate}
              onChange={(e) => {
                const next = e.target.value;
                setStartDate(next);
                if (endDate && next && endDate < next) setEndDate(next);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weekend-end">Last day</Label>
            <Input
              id="weekend-end"
              name="endDate"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="weekend-max">Max teams</Label>
          <Input
            id="weekend-max"
            inputMode="numeric"
            value={maxTeams}
            onChange={(e) => setMaxTeams(e.target.value)}
            maxLength={2}
          />
          <p className="text-xs text-muted">Whole event, all ages. Default 40. Requests still wait for you.</p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-fg">Age groups</legend>
          <div className="grid grid-cols-4 gap-2">
            {AGE_GROUPS.map((group) => {
              const on = ageGroups.includes(group);
              return (
                <button
                  key={group}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleAge(group)}
                  className={cn(
                    "min-h-11 rounded-md border text-sm font-semibold",
                    on
                      ? "border-pine bg-pine text-pine-fg"
                      : "border-line bg-bg text-fg hover:bg-surface",
                  )}
                >
                  {group}
                </button>
              );
            })}
          </div>
        </fieldset>

        {errorText ? (
          <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {errorText}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={createMut.isPending}>
          {createMut.isPending ? "Saving…" : "Save tournament"}
        </Button>
      </form>
      )}

      <WeekendList title="Upcoming" items={upcoming} empty="No upcoming tournaments yet." />
      {past.length > 0 ? <WeekendList title="Past" items={past} empty="" /> : null}
    </AppShell>
  );
}

function WeekendList({
  title,
  items,
  empty,
}: {
  title: string;
  items: Weekend[];
  empty: string;
}) {
  return (
    <section className="mt-8 space-y-3">
      <h2 className="font-display text-2xl font-bold uppercase">{title}</h2>
      {items.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">{empty}</p>
      ) : (
        items.map((weekend) => (
          <Link
            key={weekend.id}
            to="/weekends/$weekendId"
            params={{ weekendId: String(weekend.id) }}
            className="block rounded-lg border border-line bg-surface px-4 py-4 transition-colors duration-150 hover:border-fg/25"
          >
            <h3 className="font-display text-2xl font-bold uppercase leading-none">{weekend.name}</h3>
            <p className="mt-2 text-sm font-medium">{formatWeekendRange(weekend.startDate, weekend.endDate)}</p>
            <p className="mt-1 text-sm text-muted">{formatAgeGroups(weekend.ageGroups)}</p>
            <p className="mt-1 text-sm text-muted">
              {weekend.approvedCount}/{weekend.maxTeams} in
            </p>
            <p className="mt-2 text-sm font-semibold text-primary">Open tournament</p>
          </Link>
        ))
      )}
    </section>
  );
}
