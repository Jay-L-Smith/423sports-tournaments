import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { WeekendAdminFrame } from "@/components/weekend-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MondayDateInput } from "@/components/monday-date-input";
import { setWeekendFlyer, updateWeekend, type WeekendAge, type WeekendDetail } from "@/lib/pbi/api";
import { compressFlyer } from "@/lib/pbi/flyer";
import {
  AGE_GROUPS,
  DEFAULT_AGE_MIN_TEAMS,
  defaultDayPlan,
  teamFeeInputValue,
  weekendSavePayload,
  type AgeGroup,
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
  readOnly,
}: {
  id: number;
  detail: WeekendDetail;
  queryClient: import("@tanstack/react-query").QueryClient;
  bump: () => void;
  readOnly: boolean;
}) {
  const [name, setName] = useState(detail.name);
  const [startDate, setStartDate] = useState(detail.startDate);
  const [endDate, setEndDate] = useState(detail.endDate);
  const [drafts, setDrafts] = useState<AgeDraft[]>(() => toDrafts(detail.ages, detail.maxTeams));
  const [teamFee, setTeamFee] = useState(() => teamFeeInputValue(detail.teamFeeCents));
  const [ageWarned, setAgeWarned] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [flyerError, setFlyerError] = useState<string | null>(null);
  const flyerInput = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setName(detail.name);
    setStartDate(detail.startDate);
    setEndDate(detail.endDate);
    setDrafts(toDrafts(detail.ages, detail.maxTeams));
    setTeamFee(teamFeeInputValue(detail.teamFeeCents));
    setAgeWarned(false);
  }, [detail]);

  const saveMut = useMutation({
    mutationFn: (input: ReturnType<typeof weekendSavePayload>) => updateWeekend({ data: input }),
    onSuccess: (next) => {
      setFormError(null);
      queryClient.setQueryData(["weekend", id], next);
      bump();
      void navigate({ to: "/weekends/$weekendId", params: { weekendId: String(id) } });
    },
  });

  function alignDates(nextStart: string, nextEnd: string) {
    setStartDate(nextStart);
    setEndDate(nextEnd);
  }

  function toggleAge(group: AgeGroup) {
    setFormError(null);
    setAgeWarned(false);
    setDrafts((current) => {
      const on = current.some((row) => row.ageGroup === group);
      if (on) return current.filter((row) => row.ageGroup !== group);
      const cap = String(detail.maxTeams);
      return [...current, { ageGroup: group, min: String(DEFAULT_AGE_MIN_TEAMS), max: cap }].sort(
        (a, b) => AGE_GROUPS.indexOf(a.ageGroup) - AGE_GROUPS.indexOf(b.ageGroup),
      );
    });
  }

  const flyerMut = useMutation({
    mutationFn: (flyer: string | null) => setWeekendFlyer({ data: { weekendId: id, flyer } }),
    onSuccess: (next) => {
      setFlyerError(null);
      queryClient.setQueryData(["weekend", id], next);
      void queryClient.invalidateQueries({ queryKey: ["weekends"] });
      bump();
    },
  });

  async function onFlyer(file: File | null) {
    setFlyerError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFlyerError("Use a JPG or PNG.");
      return;
    }
    try {
      const flyer = await compressFlyer(file);
      flyerMut.mutate(flyer);
    } catch (err) {
      setFlyerError(err instanceof Error ? err.message : "Could not use that picture.");
    }
  }

  function save(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const original = detail.ages.map((age) => age.ageGroup).join(", ");
    const next = drafts.map((row) => row.ageGroup).join(", ");
    if (original !== next && !ageWarned) {
      setAgeWarned(true);
      return;
    }
    const dayPlan: DayPlan[] = detail.poolPlay
      ? defaultDayPlan(startDate, endDate)
      : defaultDayPlan(startDate, endDate).map((row) => ({ ...row, kind: "bracket" as const }));
    try {
      saveMut.mutate(
        weekendSavePayload(detail, {
          name,
          startDate,
          endDate,
          maxTeams: detail.maxTeams,
          dayPlan,
          ages: drafts.map((row) => ({
            ageGroup: row.ageGroup,
            minTeams: row.min,
            maxTeams: row.max,
          })),
          teamFee,
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
      <h1 className="mt-3 font-display text-4xl font-bold uppercase">Details</h1>
      <p className="mt-1 text-sm text-muted">Name, dates, ages, fee, and the flyer.</p>
      <form noValidate onSubmit={save} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="weekend-name">Name</Label>
          <Input id="weekend-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" maxLength={80} disabled={readOnly} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="weekend-start">First day</Label>
            <MondayDateInput id="weekend-start" value={startDate} withWeekday onChange={(next) => alignDates(next, endDate && next && endDate < next ? next : endDate)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weekend-end">Last day</Label>
            <MondayDateInput id="weekend-end" value={endDate} min={startDate} withWeekday onChange={(next) => alignDates(startDate, next)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="weekend-fee">Team fee</Label>
          <Input id="weekend-fee" value={teamFee} onChange={(e) => setTeamFee(e.target.value)} placeholder="Leave blank if there's no fee" inputMode="decimal" autoComplete="off" disabled={readOnly} />
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Age groups</legend>
          <div className="grid grid-cols-4 gap-2">
            {AGE_GROUPS.map((group) => {
              const on = drafts.some((row) => row.ageGroup === group);
              const wide = group === "Underclass" || group === "Upperclass";
              return (
                <button
                  key={group}
                  type="button"
                  aria-pressed={on}
                  disabled={readOnly}
                  onClick={() => toggleAge(group)}
                  className={`min-h-11 rounded-md border px-1 font-semibold ${wide ? "text-[11px] leading-tight" : "text-sm"} ${on ? "border-primary bg-bg" : "border-line bg-bg text-muted"}`}
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
                  value={row.min}
                  disabled={readOnly}
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
                  value={row.max}
                  disabled={readOnly}
                  onChange={(e) => {
                    const max = e.target.value;
                    setDrafts((current) => current.map((item, i) => (i === index ? { ...item, max } : item)));
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Flyer</p>
          {detail.flyer ? <img src={detail.flyer} alt="" className="w-full rounded-md" /> : <p className="text-sm text-muted">No flyer yet.</p>}
          {readOnly ? null : (
            <>
              <input ref={flyerInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => void onFlyer(e.target.files?.[0] ?? null)} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" disabled={flyerMut.isPending} onClick={() => flyerInput.current?.click()}>
                  {flyerMut.isPending ? "Saving…" : detail.flyer ? "Change flyer" : "Add a flyer"}
                </Button>
                {detail.flyer ? (
                  <Button type="button" variant="outline" disabled={flyerMut.isPending} onClick={() => flyerMut.mutate(null)}>
                    Remove
                  </Button>
                ) : null}
              </div>
            </>
          )}
          {flyerError ? <p className="text-sm">{flyerError}</p> : null}
        </div>
        {ageWarned ? (
          <p className="rounded-md bg-warn-bg px-3 py-2 text-sm">
            This changes the age from {detail.ages.map((age) => age.ageGroup).join(", ") || "none"} to {drafts.map((row) => row.ageGroup).join(", ") || "none"}. Save again to keep it.
          </p>
        ) : null}
        {errorText ? (
          <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {errorText}
          </p>
        ) : null}
        {readOnly ? null : (
          <Button type="submit" className="w-full" disabled={saveMut.isPending}>
            {saveMut.isPending ? "Saving…" : "Save"}
          </Button>
        )}
      </form>
    </>
  );
}
