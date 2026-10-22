import { useMemo, useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MondayDateInput } from "@/components/monday-date-input";
import { RulesFields } from "@/components/rules-fields";
import { inclusiveDays, type CoachPath } from "@/lib/pbi/coach";
import {
  listWeekends,
} from "@/lib/pbi/api";
import {
  assessCapacity,
  bracketClockForFit,
  capacityReport,
  namedDivisions,
  type CapacityInput,
  type EventFormat,
} from "@/lib/pbi/capacity";
import { DEFAULT_BRACKET_RULES, type AdvanceMode, type BracketRules } from "@/lib/pbi/rules";
import {
  AGE_GROUPS,
  addDays,
  defaultDayPlan,
  defaultWeekendDates,
  eachIsoDate,
  formatTeamFee,
  parseTeamFee,
  type AgeGroup,
  type DayPlan,
} from "@/lib/pbi/weekends";
import { compressFlyer } from "@/lib/pbi/flyer";

function feeLine(raw: string): string {
  try {
    const cents = parseTeamFee(raw);
    return cents == null ? "No fee" : `${formatTeamFee(cents)} per team`;
  } catch {
    return "Check the fee";
  }
}
type Step = "name" | "dates" | "size" | "seeding" | "clocks" | "flyer" | "confirm";

const STEP_LABEL: Record<Step, string> = {
  name: "1 · Name",
  dates: "2 · Dates",
  size: "3 · Size",
  seeding: "4 · Seeding",
  clocks: "5 · Schedule",
  flyer: "6 · Flyer",
  confirm: "7 · Review",
};

const FINISH_LABEL: Record<Step, string> = {
  name: "1 · Name",
  dates: "2 · Dates",
  size: "2 · Size",
  seeding: "3 · Seeding",
  clocks: "4 · Schedule",
  flyer: "5 · Flyer",
  confirm: "6 · Review",
};

const TEAM_PATHS: { id: CoachPath; title: string; hint: string }[] = [
  { id: "small", title: "Small", hint: "3–12 teams" },
  { id: "mid", title: "Mid", hint: "13–24 teams" },
  { id: "large", title: "Large", hint: "25–36 teams" },
  { id: "custom", title: "Custom", hint: "Any team count" },
];

const TEAM_BAND: Record<Exclude<CoachPath, "custom">, { min: number; max: number; start: number }> = {
  small: { min: 3, max: 12, start: 8 },
  mid: { min: 13, max: 24, start: 16 },
  large: { min: 25, max: 36, start: 30 },
};

function fieldsThatHold(
  teamCount: number,
  dayCount: number,
  format: EventFormat,
  rain: boolean,
  advance: AdvanceMode,
  advancePerPool: number,
): number {
  for (let count = 1; count <= 12; count += 1) {
    const input = { teams: teamCount, fields: count, days: dayCount, format, rain, advance, advancePerPool };
    if (bracketClockForFit(input).late || assessCapacity(input).fit) return count;
  }
  return 12;
}

function Info({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="mt-1 block">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-8 items-center gap-1 text-xs font-bold uppercase text-muted"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-line text-[11px]">i</span>
        What this means
      </button>
      {open ? <span className="mt-1 block text-xs text-muted">{text}</span> : null}
    </span>
  );
}

export function CreateCoach({
  busy,
  error,
  onCreate,
  initialStart,
  initialEnd,
  initialName,
  initialAge,
  interestCount = 0,
  finish = false,
}: {
  busy: boolean;
  error: string | null;
  initialStart?: string;
  initialEnd?: string;
  initialName?: string;
  initialAge?: AgeGroup;
  interestCount?: number;
  finish?: boolean;
  onCreate: (input: {
    name: string;
    startDate: string;
    endDate: string;
    ageGroups: AgeGroup[];
    maxTeams: number;
    dayPlan: DayPlan[];
    poolPlay: boolean;
    rules: BracketRules;
    teamFee: string;
    parks: { name: string; address: string }[];
    staff: { gate: { staffId: number | null; otherName: string | null; otherPhone: string | null }; scorekeeper: { staffId: number | null; otherName: string | null; otherPhone: string | null } }[];
    flyer: string | null;
  }) => void;
}) {
  const defaults = useMemo(() => defaultWeekendDates(), []);
  const [step, setStep] = useState<Step>("name");
  const eventName = (initialName ?? "").trim();
  const [ages, setAges] = useState<AgeGroup[]>(initialAge ? [initialAge] : []);
  const [customName, setCustomName] = useState<string | null>(null);
  const name = customName ?? eventName;
  const [teamFee, setTeamFee] = useState("");
  const [startDate, setStartDate] = useState(initialStart && initialStart.length === 10 ? initialStart : defaults.startDate);
  const [endDate, setEndDate] = useState(initialEnd && initialEnd.length === 10 ? initialEnd : defaults.endDate);
  const [path, setPath] = useState<CoachPath>("small");
  const rain = true;
  const [advance, setAdvance] = useState<AdvanceMode>("all-reseed");
  const [advancePerPool, setAdvancePerPool] = useState(2);
  const [format, setFormat] = useState<EventFormat>("pool-then-bracket");
  const [formatTouched, setFormatTouched] = useState(false);
  const [rules, setRules] = useState<BracketRules>({ ...DEFAULT_BRACKET_RULES, rainDelay: true });
  const [localError, setLocalError] = useState<string | null>(null);
  const [soonSize, setSoonSize] = useState<string | null>(null);
  const [flyer, setFlyer] = useState<string | null>(null);
  const [flyerError, setFlyerError] = useState<string | null>(null);
  const [flyerBusy, setFlyerBusy] = useState(false);
  const flyerInput = useRef<HTMLInputElement>(null);
  const weekendsQuery = useQuery({ queryKey: ["weekends"], queryFn: () => listWeekends() });
  const year = startDate.slice(0, 4);
  const sameName = (weekendsQuery.data ?? []).filter((weekend) => {
    if (weekend.lifecycle === "announced") return false;
    return year.length === 4 && weekend.startDate.slice(0, 4) === year && weekend.name.trim().toLowerCase() === name.trim().toLowerCase() && name.trim().length >= 2;
  });
  const nameWarning = sameName.length === 0
    ? null
    : sameName.length === 1
      ? `${year} already has a tournament named ${sameName[0]?.name}. Coaches can mix them up.`
      : `${year} already has ${sameName.length} tournaments with that name. Coaches can mix them up.`;

  const days = inclusiveDays(startDate, endDate);
  const pool = format === "pool-then-bracket";
  const bandMax = path === "custom" ? 40 : TEAM_BAND[path].max;
  const fieldCount = fieldsThatHold(bandMax, days, format, rain, advance, advancePerPool);
  const clockInput: CapacityInput = {
    teams: bandMax,
    fields: fieldCount,
    days: Math.max(1, days),
    format,
    rain,
    advance,
    advancePerPool,
  };
  const clock = bracketClockForFit(clockInput);
  const fitReport = capacityReport({ ...clockInput, ...clock });
  const ceiling = Math.min(bandMax, Math.max(3, fitReport.maxTeams));
  const chosen = ceiling;
  const fits = fitReport.fit || path === "custom";
  const dayPlan = pool ? defaultDayPlan(startDate, endDate) : eachIsoDate(startDate, endDate).map((date) => ({ date, kind: "bracket" as const }));
  const sizeTitle = TEAM_PATHS.find((row) => row.id === path)?.title ?? "";

  function nextFromName() {
    if (ages.length === 0) {
      setLocalError("Pick at least one age.");
      return;
    }
    if (name.trim().length < 2) {
      setLocalError("Give the tournament a name.");
      return;
    }
    try {
      parseTeamFee(teamFee);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Team fee needs to be a dollar amount.");
      return;
    }
    setLocalError(null);
    setStep(finish ? "size" : "dates");
  }

  function nextFromDates() {
    if (days < 1) {
      setLocalError("Pick a first day and a last day.");
      return;
    }
    if (!formatTouched) setFormat(days <= 1 ? "bracket-only" : "pool-then-bracket");
    setLocalError(null);
    setStep("size");
  }

  function pickPath(next: CoachPath) {
    if (next !== "small") {
      setSoonSize(TEAM_PATHS.find((row) => row.id === next)?.title ?? "That size");
      return;
    }
    setPath(next);
  }

  function openRules() {
    setRules((current) => ({ ...current, advance, advancePerPool, rainDelay: true }));
    setLocalError(null);
    setStep("seeding");
  }

  function review() {
    if (path !== "custom" && !fits) {
      setLocalError(fitReport.reasons[0] ?? "That lineup does not fit this window.");
      return;
    }
    setLocalError(null);
    setStep("flyer");
  }

  async function onFlyer(file: File | null) {
    setFlyerError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFlyerError("Use a JPG or PNG.");
      return;
    }
    setFlyerBusy(true);
    try {
      setFlyer(await compressFlyer(file));
    } catch (err) {
      setFlyerError(err instanceof Error ? err.message : "Could not use that picture.");
    } finally {
      setFlyerBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (step !== "confirm") return;
    if (ages.length === 0) return;
    const built: BracketRules = {
      ...rules,
      advance: rules.advance,
      advancePerPool: rules.advancePerPool,
      rainDelay: true,
      divisions: namedDivisions(chosen),
      poolGamesPerTeam: pool ? 2 : 0,
      bracketLastMustPlay: clock.bracketLastMustPlay,
      bracketRainDelay: clock.bracketRainDelay,
      eventDays: days >= 3 ? 3 : 2,
      fieldCount: path === "small" ? 0 : fieldCount,
      coachPath: path,
      dropCutoffDays: 3,
    };
    onCreate({
      name: name.trim().slice(0, 80),
      startDate,
      endDate,
      ageGroups: ages,
      maxTeams: chosen,
      dayPlan,
      poolPlay: pool,
      rules: built,
      teamFee,
      parks: [],
      staff: [],
      flyer,
    });
  }

  const shownError = localError ?? error;

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">
        {(finish ? FINISH_LABEL : STEP_LABEL)[step]}
      </p>

      {interestCount > 0 ? (
        <p className="text-sm text-muted">
          {interestCount === 1
            ? "1 team is interested so far. Pool and bracket follow who is in."
            : `${interestCount} teams are interested so far. Pool and bracket follow who is in.`}
        </p>
      ) : null}

      {step === "name" ? (
        <section className="space-y-4 rounded-lg border border-line bg-surface p-4">
          <div className="space-y-1.5">
            <Label htmlFor="coach-name">Tournament name</Label>
            <Input
              id="coach-name"
              value={name}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={eventName || "Tournament name"}
              maxLength={80}
              autoComplete="off"
            />
            {nameWarning ? <p className="text-sm text-[#c9a227]">{nameWarning}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coach-fee">Team fee</Label>
            <Input
              id="coach-fee"
              value={teamFee}
              onChange={(e) => setTeamFee(e.target.value)}
              placeholder="Leave blank if there's no fee"
              inputMode="decimal"
              autoComplete="off"
            />
            <p className="text-xs text-muted">What each team pays to play. You can change it later.</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold">Ages</p>
            <div className="flex flex-wrap gap-2">
              {AGE_GROUPS.map((age) => {
                const on = ages.includes(age);
                return (
                  <button
                    key={age}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setAges((current) => (current.includes(age) ? current.filter((item) => item !== age) : [...current, age]));
                    }}
                    className={`min-h-11 rounded-md border px-3 text-sm font-semibold ${on ? "border-primary bg-bg" : "border-line bg-bg text-muted"}`}
                  >
                    {age}
                  </button>
                );
              })}
            </div>
          </div>
          <Button type="button" size="lg" className="w-full" onClick={nextFromName}>Next</Button>
        </section>
      ) : null}

      {step === "dates" ? (
        <section className="space-y-4 rounded-lg border border-line bg-surface p-4">
          <div className="space-y-1.5">
            <Label htmlFor="coach-start">First day</Label>
            <MondayDateInput
              id="coach-start"
              value={startDate}
              withWeekday
              onChange={(next) => {
                const length = Math.max(1, inclusiveDays(startDate, endDate));
                setStartDate(next);
                if (next) setEndDate(addDays(next, length - 1));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coach-end">Last day</Label>
            <MondayDateInput id="coach-end" value={endDate} min={startDate} withWeekday onChange={setEndDate} />
            <Info text="First day is pool. Last day is bracket. That used to mean Saturday and Sunday, but the days can be anything — Wednesday is fine." />
          </div>
          <p className="text-sm font-semibold">{days > 0 ? `${days} day${days === 1 ? "" : "s"}` : "Pick both dates"} · through {endDate}</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("name")}>Back</Button>
            <Button type="button" className="flex-1" onClick={nextFromDates}>Next</Button>
          </div>
        </section>
      ) : null}

      {step === "size" ? (
        <section className="space-y-4 rounded-lg border border-line bg-surface p-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Size</p>
            <div className="grid grid-cols-2 gap-2">
              {TEAM_PATHS.map((row) => (
                <button key={row.id} type="button" aria-pressed={path === row.id} onClick={() => pickPath(row.id)} className={`min-h-16 rounded-md border px-3 py-2 text-left ${path === row.id ? "border-primary bg-bg" : "border-line bg-bg"}`}>
                  <span className="block text-sm font-bold">{row.title}</span>
                  <span className="mt-1 block text-xs text-muted">{row.hint}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Format</p>
            <div className="grid grid-cols-2 gap-1 rounded-md bg-bg p-1">
              <button type="button" aria-pressed={format === "pool-then-bracket"} onClick={() => { setFormat("pool-then-bracket"); setFormatTouched(true); }} className={`min-h-11 rounded-md px-2 text-sm font-bold ${format === "pool-then-bracket" ? "bg-primary text-primary-fg" : "text-muted"}`}>Pool + Bracket</button>
              <button type="button" aria-pressed={format === "bracket-only"} onClick={() => { setFormat("bracket-only"); setFormatTouched(true); }} className={`min-h-11 rounded-md px-2 text-sm font-bold ${format === "bracket-only" ? "bg-primary text-primary-fg" : "text-muted"}`}>Bracket only</button>
            </div>
          </div>
          {format === "pool-then-bracket" ? (
            <div className="space-y-2">
              <Label htmlFor="coach-advance">Who goes to the bracket</Label>
              <select id="coach-advance" value={advance} onChange={(e) => setAdvance(e.target.value as AdvanceMode)} className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm">
                <option value="all-reseed">All teams</option>
                <option value="top-per-pool">Top from each pool</option>
              </select>
              {advance === "top-per-pool" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="coach-per">Advance per pool</Label>
                  <Input id="coach-per" inputMode="numeric" value={String(advancePerPool)} onChange={(e) => setAdvancePerPool(Math.min(4, Math.max(1, Number.parseInt(e.target.value, 10) || 2)))} />
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(finish ? "name" : "dates")}>Back</Button>
            <Button type="button" className="flex-1" onClick={openRules}>Next</Button>
          </div>
        </section>
      ) : null}

      {step === "seeding" ? (
        <section className="space-y-4 rounded-lg border border-line bg-surface p-4">
          <RulesFields rules={rules} setRules={setRules} maxTeams={chosen} hideAdvance hideDivisions focus="seeding" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("size")}>Back</Button>
            <Button type="button" className="flex-1" onClick={() => setStep("clocks")}>Next</Button>
          </div>
        </section>
      ) : null}

      {step === "clocks" ? (
        <section className="space-y-4 rounded-lg border border-line bg-surface p-4">
          <RulesFields rules={rules} setRules={setRules} maxTeams={chosen} hideAdvance hideDivisions focus="clocks" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("seeding")}>Back</Button>
            <Button type="button" className="flex-1" onClick={review}>Next</Button>
          </div>
        </section>
      ) : null}

      {step === "flyer" ? (
        <section className="space-y-4 rounded-lg border border-line bg-surface p-4">
          <p className="text-sm text-muted">The picture coaches see on the schedule. You can skip this and add it later.</p>
          {flyer ? <img src={flyer} alt="" className="w-full rounded-md" /> : null}
          <input
            ref={flyerInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              void onFlyer(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" className="w-full" disabled={flyerBusy} onClick={() => flyerInput.current?.click()}>
            {flyerBusy ? "Reading…" : flyer ? "Change flyer" : "Add a flyer"}
          </Button>
          {flyer ? (
            <button type="button" className="text-sm font-semibold text-muted" onClick={() => setFlyer(null)}>
              Remove
            </button>
          ) : null}
          {flyerError ? <p className="text-sm">{flyerError}</p> : null}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("clocks")}>Back</Button>
            <Button type="button" className="flex-1" disabled={flyerBusy} onClick={() => setStep("confirm")}>Next</Button>
          </div>
        </section>
      ) : null}

      {step === "confirm" ? (
        <section className="space-y-4 rounded-lg border border-line bg-surface p-4" aria-label="Confirm tournament">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            {sizeTitle}
            {" · "}
            {pool ? "Pool + Bracket" : "Bracket only"}
          </p>
          <p className="font-display text-4xl font-bold uppercase leading-none">Up to {chosen}</p>
          <p className="text-sm font-semibold">Games follow the teams that are in. 7 or fewer teams use 1 field. 8 to 12 use 2.</p>
          <dl className="space-y-2 border-t border-line pt-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Name</dt>
              <dd className="text-right font-semibold">{name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Ages</dt>
              <dd className="text-right font-semibold">{ages.join(", ")}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Dates</dt>
              <dd className="text-right font-semibold">{days} day{days === 1 ? "" : "s"} · {startDate} to {endDate}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Team fee</dt>
              <dd className="text-right font-semibold">{feeLine(teamFee)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Flyer</dt>
              <dd className="text-right font-semibold">{flyer ? "Added" : "None"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Rain buffer</dt>
              <dd className="font-semibold">{clock.late ? "8:00 on the bracket day" : rain ? "On" : "Off"}</dd>
            </div>
          </dl>
          {nameWarning ? <p className="text-sm text-[#c9a227]">{nameWarning}</p> : null}
          <p className="text-xs text-muted">
            {fitReport.divisions.length <= 1
              ? "One division."
              : `Knockout splits ${fitReport.divisions.join(" + ")}.`}
            {path === "custom" && !fits ? " Custom does not fit this window. You can still create it." : ""}
          </p>
          {shownError ? <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">{shownError}</p> : null}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("flyer")}>Back</Button>
            <Button type="submit" className="flex-1" disabled={busy}>{busy ? "Saving…" : "Create"}</Button>
          </div>
        </section>
      ) : null}

      {(step === "name" || step === "dates" || step === "size" || step === "seeding" || step === "clocks" || step === "flyer") && shownError ? <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">{shownError}</p> : null}
      {soonSize && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-scrim p-4" onClick={() => setSoonSize(null)}>
              <div
                role="dialog"
                aria-modal="true"
                aria-label={`${soonSize} is not ready`}
                className="w-full max-w-sm rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 className="font-display text-2xl font-bold uppercase">{soonSize}</h2>
                <p className="mt-2 text-sm">We're still working on {soonSize}. Small is ready now.</p>
                <Button type="button" className="mt-4 w-full" onClick={() => setSoonSize(null)}>
                  OK
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </form>
  );
}
