import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { WeekendAdminFrame } from "@/components/weekend-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateWeekend, type WeekendDetail } from "@/lib/pbi/api";
import {
  ADVANCE_LABELS,
  ADVANCE_MODES,
  DEFAULT_BRACKET_RULES,
  ELIMINATION_LABELS,
  ELIMINATION_MODES,
  TIEBREAKER_LABELS,
  type BracketRules,
} from "@/lib/pbi/rules";
import { weekendSavePayload } from "@/lib/pbi/weekends";

export const Route = createFileRoute("/weekends/$weekendId/rules")({
  component: BracketRulesPage,
});

function BracketRulesPage() {
  const { weekendId } = Route.useParams();
  return (
    <WeekendAdminFrame weekendId={weekendId} backTo="hub">
      {(ctx) => <RulesForm {...ctx} />}
    </WeekendAdminFrame>
  );
}

function RulesForm({
  id,
  detail,
  queryClient,
  bump,
}: {
  id: number;
  detail: WeekendDetail;
  queryClient: import("@tanstack/react-query").QueryClient;
  bump: () => void;
}) {
  const [rules, setRules] = useState<BracketRules>(detail.rules ?? DEFAULT_BRACKET_RULES);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setRules(detail.rules ?? DEFAULT_BRACKET_RULES);
  }, [detail]);

  const saveMut = useMutation({
    mutationFn: (input: ReturnType<typeof weekendSavePayload>) => updateWeekend({ data: input }),
    onSuccess: (next) => {
      setFormError(null);
      queryClient.setQueryData(["weekend", id], next);
      bump();
    },
  });

  function save(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    try {
      saveMut.mutate(weekendSavePayload(detail, { rules }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Check the rules and try again.");
    }
  }

  const errorText =
    formError ??
    (saveMut.error instanceof Error ? saveMut.error.message : saveMut.error ? "Could not save those rules." : null);

  return (
    <>
      <h1 className="mt-3 font-display text-4xl font-bold uppercase">Bracket rules</h1>
      <p className="mt-1 text-sm text-muted">Travel-ball weekend defaults. Change anything for this event.</p>

      <form noValidate onSubmit={save} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="rule-min">Min teams for a bracket</Label>
          <Input
            id="rule-min"
            inputMode="numeric"
            value={String(rules.minTeams)}
            onChange={(e) =>
              setRules((current) => ({ ...current, minTeams: Number.parseInt(e.target.value, 10) || 3 }))
            }
            maxLength={1}
          />
          <p className="text-xs text-muted">Won’t draw an age until this many clubs are in. Floor is three.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rule-elim">Elimination</Label>
          <select
            id="rule-elim"
            value={rules.elimination}
            onChange={(e) =>
              setRules((current) => ({
                ...current,
                elimination: e.target.value as BracketRules["elimination"],
              }))
            }
            className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"
          >
            {ELIMINATION_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {ELIMINATION_LABELS[mode]}
              </option>
            ))}
          </select>
          {rules.elimination === "double" ? (
            <p className="text-xs text-muted">Saved. The bracket still draws single-elim until the losers bracket ships.</p>
          ) : null}
        </div>

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
        </div>

        {rules.advance === "top-per-pool" ? (
          <div className="space-y-1.5">
            <Label htmlFor="rule-n">Advance per pool</Label>
            <Input
              id="rule-n"
              inputMode="numeric"
              value={String(rules.advancePerPool)}
              onChange={(e) =>
                setRules((current) => ({
                  ...current,
                  advancePerPool: Number.parseInt(e.target.value, 10) || 2,
                }))
              }
              maxLength={1}
            />
          </div>
        ) : null}

        <ToggleRow
          pressed={rules.consolation}
          onClick={() => setRules((current) => ({ ...current, consolation: !current.consolation }))}
          title="Consolation games"
          hint="Extra games for clubs that don’t make the championship tree."
        />
        <ToggleRow
          pressed={rules.poolTies}
          onClick={() => setRules((current) => ({ ...current, poolTies: !current.poolTies }))}
          title="Ties in pool play"
          hint="Pool games can end tied. Bracket games play until there’s a winner."
        />

        <p className="text-xs text-muted">
          Home: coin flip in pool play, higher seed in the bracket. Byes: highest seeds. Tiebreakers:{" "}
          {rules.tiebreakers.map((item) => TIEBREAKER_LABELS[item]).join(" → ")}.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="rule-time">Time limit (min)</Label>
            <Input
              id="rule-time"
              inputMode="numeric"
              value={String(rules.timeLimitMinutes)}
              onChange={(e) =>
                setRules((current) => ({
                  ...current,
                  timeLimitMinutes: Number.parseInt(e.target.value, 10) || 120,
                }))
              }
              maxLength={3}
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
        </div>

        <ToggleRow
          pressed={rules.mercy}
          onClick={() => setRules((current) => ({ ...current, mercy: !current.mercy }))}
          title="Mercy rule"
          hint="Run-rule after innings. Default 15 / 10 / 8."
        />
        {rules.mercy ? (
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
                <Input
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
        ) : null}

        {errorText ? (
          <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {errorText}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={saveMut.isPending}>
          {saveMut.isPending ? "Saving…" : "Save rules"}
        </Button>
      </form>
    </>
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
      className="flex min-h-12 w-full items-center justify-between rounded-md border border-line px-4 text-left"
    >
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">{hint}</span>
      </span>
      <span className="text-xs font-bold uppercase">{pressed ? "On" : "Off"}</span>
    </button>
  );
}
