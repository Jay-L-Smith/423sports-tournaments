import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADVANCE_LABELS,
  ADVANCE_MODES,
  TIEBREAKER_LABELS,
  moveTiebreaker,
  setDivisionCount,
  type BracketRules,
} from "@/lib/pbi/rules";

function RuleInput(props: ComponentProps<typeof Input>) {
  return <Input enterKeyHint="done" {...props} />;
}

export function RulesFields({
  rules,
  setRules,
  maxTeams,
  hideDivisions = false,
  hideAdvance = false,
  focus,
}: {
  rules: BracketRules;
  setRules: (update: BracketRules | ((current: BracketRules) => BracketRules)) => void;
  maxTeams: number;
  hideDivisions?: boolean;
  hideAdvance?: boolean;
  focus?: "seeding" | "clocks";
}) {
  const cutTotal = rules.divisions.reduce((n, row) => n + row.size, 0);

  return (
    <>
      {hideAdvance || focus === "seeding" || focus === "clocks" ? null : (
      <Section title="Bracket / advance">
        <div className="space-y-1.5">
          <Label htmlFor="rule-advance">Who goes to the bracket</Label>
          <select
            id="rule-advance"
            value={rules.advance}
            onChange={(e) =>
              setRules((current) => ({ ...current, advance: e.target.value as BracketRules["advance"] }))
            }
            className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"
          >
            {ADVANCE_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {ADVANCE_LABELS[mode]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">
            All teams puts every team in one bracket, 1st vs last. Top from each pool sends only the top N out of every pool, so fewer bracket games and room for more teams.
          </p>
        </div>

        {rules.advance === "top-per-pool" ? (
          <Stepper
            id="rule-n"
            label="Advance per pool"
            value={rules.advancePerPool}
            min={1}
            max={4}
            onChange={(advancePerPool) => setRules((current) => ({ ...current, advancePerPool }))}
          />
        ) : null}
      </Section>
      )}

      {focus === "clocks" ? null : (
      <Section title="Seeding">
        <p className="text-sm font-semibold">Tiebreakers</p>
        <p className="text-xs text-muted">
          Default is win/loss, runs allowed, head-to-head, run differential, runs scored, then a coin. Tap ↑↓ to reorder. A pool forfeit counts as a win and a loss only — not runs.
        </p>
        <ol className="space-y-2">
          {rules.tiebreakers.map((item, index) => (
            <li
              key={item}
              className="flex min-h-12 items-center justify-between gap-2 rounded-md border border-line px-3"
            >
              <span className="text-sm font-semibold">
                {index + 1}. {TIEBREAKER_LABELS[item]}
              </span>
              <span className="flex gap-1">
                <button
                  type="button"
                  className="min-h-9 min-w-9 rounded-md border border-line text-sm font-bold disabled:opacity-40"
                  disabled={index === 0}
                  onClick={() =>
                    setRules((current) => ({
                      ...current,
                      tiebreakers: moveTiebreaker(current.tiebreakers, index, -1),
                    }))
                  }
                  aria-label={`Move ${TIEBREAKER_LABELS[item]} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="min-h-9 min-w-9 rounded-md border border-line text-sm font-bold disabled:opacity-40"
                  disabled={index === rules.tiebreakers.length - 1}
                  onClick={() =>
                    setRules((current) => ({
                      ...current,
                      tiebreakers: moveTiebreaker(current.tiebreakers, index, 1),
                    }))
                  }
                  aria-label={`Move ${TIEBREAKER_LABELS[item]} down`}
                >
                  ↓
                </button>
              </span>
            </li>
          ))}
        </ol>
      </Section>
      )}

      {focus === "seeding" ? null : (
      <Section title="Schedule clocks">
        <div className="grid grid-cols-2 gap-3">
          <ClockField
            id="rule-first-pitch"
            label="First pitch"
            value={rules.firstPitch}
            onChange={(firstPitch) => setRules((current) => ({ ...current, firstPitch }))}
          />
          <div className="space-y-1.5">
            <InfoNote label="Between games" text="Minutes from one first pitch to the next. This is the gap between games." />
            <MinuteInput
              id="rule-slot"
              value={rules.slotMinutes}
              onChange={(slotMinutes) => setRules((current) => ({ ...current, slotMinutes }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rule-time">In-game time limit (min)</Label>
            <MinuteInput
              id="rule-time"
              value={rules.timeLimitMinutes}
              onChange={(timeLimitMinutes) => setRules((current) => ({ ...current, timeLimitMinutes }))}
            />
          </div>
          <button
            type="button"
            aria-pressed={rules.championshipNoTimeLimit}
            onClick={() =>
              setRules((current) => ({
                ...current,
                championshipNoTimeLimit: !current.championshipNoTimeLimit,
              }))
            }
            className="mt-6 flex min-h-11 items-center justify-center rounded-md border border-line px-3 text-xs font-bold uppercase"
          >
            Title game {rules.championshipNoTimeLimit ? "no clock" : "on the clock"}
          </button>
          <ClockField
            id="rule-last-start"
            label="Last start, earlier days"
            value={rules.lastStart}
            onChange={(lastStart) => setRules((current) => ({ ...current, lastStart }))}
          />
          <ClockField
            id="rule-last-day"
            label="Last start, final day"
            value={rules.lastDayLastStart}
            onChange={(lastDayLastStart) => setRules((current) => ({ ...current, lastDayLastStart }))}
          />
        </div>
        <div className="space-y-1.5 pt-4">
          <InfoNote label="Mercy rule" text="Run gap that ends the game after that inning. On by default." />
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["mercyAfter3", "After 3"],
                ["mercyAfter4", "After 4"],
                ["mercyAfter5", "After 5"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={`rule-${key}`}>{label}</Label>
                <RuleInput
                  id={`rule-${key}`}
                  inputMode="numeric"
                  value={String(rules[key])}
                  onChange={(e) =>
                    setRules((current) => ({
                      ...current,
                      [key]: Number.parseInt(e.target.value, 10) || current[key],
                    }))
                  }
                  maxLength={2}
                />
              </div>
            ))}
          </div>
        </div>
      </Section>
      )}

      {hideDivisions || focus ? null : (
      <Section title="Divisions">
        <p className="text-xs text-muted">
          One Gold division is the default and covers every team. Extra cuts must add up to {maxTeams} teams.
        </p>
        <Stepper
          id="rule-div-count"
          label="Division count"
          value={rules.divisions.length}
          min={1}
          max={4}
          onChange={(count) =>
            setRules((current) => ({
              ...current,
              divisions: setDivisionCount(current.divisions, count, maxTeams),
            }))
          }
        />
        {rules.divisions.map((cut, index) => (
          <div key={`${cut.name}-${index}`} className="grid grid-cols-[1fr_5rem] gap-2">
            <RuleInput
              value={cut.name}
              onChange={(e) =>
                setRules((current) => ({
                  ...current,
                  divisions: current.divisions.map((row, i) =>
                    i === index ? { ...row, name: e.target.value } : row,
                  ),
                }))
              }
              maxLength={24}
            />
            <RuleInput
              inputMode="numeric"
              value={String(cut.size)}
              onChange={(e) =>
                setRules((current) => ({
                  ...current,
                  divisions: current.divisions.map((row, i) =>
                    i === index ? { ...row, size: Number.parseInt(e.target.value, 10) || 0 } : row,
                  ),
                }))
              }
              maxLength={2}
            />
          </div>
        ))}
        <p className="text-xs text-muted">
          Cuts add to {cutTotal} / {maxTeams}.
        </p>
      </Section>
      )}
    </>
  );
}

function MinuteInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number;
  onChange: (minutes: number) => void;
}) {
  const [text, setText] = useState(String(value));
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setText(String(value));
  }, [editing, value]);
  return (
    <RuleInput
      id={id}
      inputMode="numeric"
      maxLength={3}
      value={text}
      onFocus={() => setEditing(true)}
      onChange={(event) => {
        const next = event.target.value.replace(/\D/g, "").slice(0, 3);
        setText(next);
        if (next === "") return;
        const minutes = Number.parseInt(next, 10);
        if (Number.isInteger(minutes)) onChange(minutes);
      }}
      onBlur={() => {
        setEditing(false);
        const minutes = Number.parseInt(text, 10);
        if (!text || !Number.isInteger(minutes)) setText(String(value));
      }}
    />
  );
}

function InfoNote({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-semibold">{label}</p>
        <button
          type="button"
          aria-expanded={open}
          aria-label={`What ${label} means`}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-line text-[11px] font-bold text-muted"
        >
          i
        </button>
      </div>
      {open ? <p className="text-xs text-muted">{text}</p> : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-md border border-line bg-surface p-4">
      <legend className="px-1 font-display text-lg font-bold uppercase tracking-wide">{title}</legend>
      {children}
    </fieldset>
  );
}

function ToggleRow({
  pressed,
  onClick,
  title,
  hint,
}: {
  pressed: boolean;
  onClick: () => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="flex min-h-12 w-full items-center justify-between rounded-md border border-line bg-bg px-4 text-left"
    >
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">{hint}</span>
      </span>
      <span className="text-xs font-bold uppercase">{pressed ? "On" : "Off"}</span>
    </button>
  );
}

function Stepper({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="min-h-11 min-w-11 rounded-md border border-line text-lg font-bold"
          onClick={() => onChange(Math.max(min, value - step))}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <RuleInput
          id={id}
          inputMode="numeric"
          value={String(value)}
          onChange={(e) => {
            const raw = e.target.value.trim();
            if (raw === "") {
              onChange(min);
              return;
            }
            const n = Number.parseInt(raw, 10);
            if (!Number.isInteger(n)) return;
            onChange(Math.min(max, Math.max(min, n)));
          }}
          className="text-center"
        />
        <button
          type="button"
          className="min-h-11 min-w-11 rounded-md border border-line text-lg font-bold"
          onClick={() => onChange(Math.min(max, value + step))}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function ClockField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <RuleInput id={id} type="time" value={value} onChange={(e) => onChange(e.target.value || value)} />
    </div>
  );
}
