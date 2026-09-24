import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { RulesFields } from "@/components/rules-fields";
import { WeekendSize } from "@/components/weekend-size";
import { initialSize, type SizeChoice } from "@/lib/pbi/weekend-size-choice";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { createWeekend, type Weekend } from "@/lib/pbi/api";
import { parseBracketRules, setDivisionCount, type BracketRules } from "@/lib/pbi/rules";
import { planClocks, sizeOptions } from "@/lib/pbi/weekend-plan";
import {
  AGE_GROUPS,
  DEFAULT_TOURNAMENT_TEAMS,
  defaultWeekendDates,
  formatWeekendRange,
  MAX_TOURNAMENT_TEAMS,
  parseWeekendInput,
  addDays,
  type AgeGroup,
} from "@/lib/pbi/weekends";

export const Route = createFileRoute("/weekends/")({
  validateSearch: (search: Record<string, unknown>): { add?: 1 } => {
    if (search.add === 1 || search.add === "1") return { add: 1 };
    return {};
  },
  component: WeekendsPage,
});

function WeekendsPage() {
  const { user, isPending, profile } = useAppSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const defaults = useMemo(() => defaultWeekendDates(), []);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("15U");
  const [maxTeams, setMaxTeams] = useState(String(DEFAULT_TOURNAMENT_TEAMS));
  const [size, setSize] = useState<SizeChoice>(() => initialSize(DEFAULT_TOURNAMENT_TEAMS));
  const [rules, setRules] = useState<BracketRules>(() => parseBracketRules({}, DEFAULT_TOURNAMENT_TEAMS));
  const [formError, setFormError] = useState<string | null>(null);
  const { add } = Route.useSearch();
  const adding = add === 1;

  useEffect(() => {
    const clocks = planClocks(size.rain, size.sunday);
    const used = sizeOptions(size.teams, size.days, size.rain).find(
      (option) => option.divisions === size.divisions && option.sunday === size.sunday,
    );
    setEndDate(addDays(startDate, size.days - 1));
    setMaxTeams(String(size.teams));
    setRules((current) => ({
      ...current,
      ...clocks,
      rainDelay: size.rain,
      eventDays: size.days,
      fieldCount: used?.fields ?? size.fields,
      divisions: setDivisionCount(current.divisions, size.divisions, size.teams),
    }));
  }, [size, startDate]);

  const createMut = useMutation({
    mutationFn: (input: ReturnType<typeof parseWeekendInput>) => createWeekend({ data: input }),
    onSuccess: (created) => {
      setName("");
      setAgeGroup("15U");
      setMaxTeams(String(DEFAULT_TOURNAMENT_TEAMS));
      setSize(initialSize(DEFAULT_TOURNAMENT_TEAMS));
      setRules(parseBracketRules({}, DEFAULT_TOURNAMENT_TEAMS));
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
  if (!adding) return <Navigate to="/" />;

  const parsedMax = Number.parseInt(maxTeams, 10);
  const rulesMax =
    Number.isInteger(parsedMax) && parsedMax >= 1 && parsedMax <= MAX_TOURNAMENT_TEAMS
      ? parsedMax
      : DEFAULT_TOURNAMENT_TEAMS;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    try {
      const parsed = parseWeekendInput({ name, startDate, endDate, ageGroups: [ageGroup], maxTeams, rules });
      createMut.mutate(parsed);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Check the form and try again.");
    }
  }

  const errorText =
    formError ??
    (createMut.error instanceof Error ? createMut.error.message : createMut.error ? "Could not save that tournament." : null);

  return (
    <AppShell homeRole={profile.homeRole}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-4xl font-bold uppercase">New tournament</h1>
        <Button
          type="button"
          variant="ghost"
          className="px-2 text-muted"
          onClick={() => void navigate({ to: "/" })}
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-lg border border-line bg-surface p-4">
        <div className="space-y-1.5">
          <Label htmlFor="weekend-name">Name</Label>
          <Input
            id="weekend-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="TWU 15U"
            autoComplete="off"
            maxLength={80}
          />
        </div>
        <WeekendSize value={size} onChange={setSize} />
        <div className="space-y-1.5">
          <Label htmlFor="weekend-start">Start date</Label>
          <Input
            id="weekend-start"
            name="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <p className="text-xs text-muted">
            {size.days} days, through {formatWeekendRange(endDate, endDate)}.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="weekend-age">Age group</Label>
          <select
            id="weekend-age"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
            className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"
          >
            {AGE_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">One age per tournament. Another age is a new tournament.</p>
        </div>

        <RulesFields rules={rules} setRules={setRules} maxTeams={rulesMax} hideDivisions />

        {errorText ? (
          <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {errorText}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={createMut.isPending}>
          {createMut.isPending ? "Saving…" : "Save tournament"}
        </Button>
      </form>
    </AppShell>
  );
}
