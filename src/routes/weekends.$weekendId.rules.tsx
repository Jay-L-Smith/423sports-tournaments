import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { RulesFields } from "@/components/rules-fields";
import { WeekendAdminFrame } from "@/components/weekend-admin";
import { Button } from "@/components/ui/button";
import { rebuildWeekendSchedule, updateWeekend, type WeekendDetail } from "@/lib/pbi/api";
import { DEFAULT_BRACKET_RULES, POOL_REGEN_BLOCKED, poolScheduleBlockReason, poolScheduleChecks, type BracketRules } from "@/lib/pbi/rules";

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
  const [dangerNote, setDangerNote] = useState<string | null>(null);

  useEffect(() => {
    setRules(detail.rules ?? DEFAULT_BRACKET_RULES);
  }, [detail]);

  const checks = poolScheduleChecks({
    ageGroups: detail.ages.map((age) => age.ageGroup),
    approvedByAge: Object.fromEntries(
      detail.ages.map((age) => [
        age.ageGroup,
        detail.teams.filter((team) => team.ageGroup === age.ageGroup).length,
      ]),
    ),
    locationCount: detail.locations.length,
    minTeams: (detail.rules ?? DEFAULT_BRACKET_RULES).minTeams,
    hasBracket: detail.hasBracket,
  });

  const saveMut = useMutation({
    mutationFn: (input: ReturnType<typeof weekendSavePayload>) => updateWeekend({ data: input }),
    onSuccess: (next) => {
      setFormError(null);
      queryClient.setQueryData(["weekend", id], next);
      bump();
    },
  });

  const regenMut = useMutation({
    mutationFn: async (mode: "pools" | "reset") => {
      const minTeams = (detail.rules ?? DEFAULT_BRACKET_RULES).minTeams;
      const allAges = detail.ages.map((age) => age.ageGroup);
      if (allAges.length === 0) throw new Error("Add an age group first.");
      if (mode === "pools") {
        const blocked = poolScheduleBlockReason(checks);
        if (blocked) throw new Error(blocked);
      }
      const ages =
        mode === "reset"
          ? allAges
          : allAges.filter(
              (ageGroup) => detail.teams.filter((team) => team.ageGroup === ageGroup).length >= minTeams,
            );
      let last = null;
      const errors: string[] = [];
      for (const ageGroup of ages) {
        try {
          last = await rebuildWeekendSchedule({ data: { weekendId: id, ageGroup, mode } });
        } catch (err) {
          errors.push(err instanceof Error ? err.message : `Could not build ${ageGroup}.`);
        }
      }
      if (!last) throw new Error(errors[0] ?? poolScheduleBlockReason(checks) ?? "Could not generate a schedule.");
      if (errors.length > 0) throw new Error(errors.join(" "));
      return last;
    },
    onSuccess: (next) => {
      setDangerNote(null);
      queryClient.setQueryData(["schedule", id], next);
      bump();
    },
    onError: (err) => {
      setDangerNote(err instanceof Error ? err.message : POOL_REGEN_BLOCKED);
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
      <h1 className="mt-3 font-display text-4xl font-bold uppercase">423Sports rules</h1>
      <p className="mt-1 text-sm text-muted">
        Edit who advances, pool games, and clocks.
      </p>

      <form noValidate onSubmit={save} className="mt-6 space-y-6 pb-24">
        <RulesFields rules={rules} setRules={setRules} maxTeams={detail.maxTeams} />

        <fieldset className="space-y-3 rounded-md border border-line bg-surface p-4">
          <legend className="px-1 font-display text-lg font-bold uppercase tracking-wide">Schedule</legend>
          <p className="text-xs text-muted">
            {detail.hasPoolGames
              ? "A pool sheet already exists. Regenerating rebuilds it from these rules."
              : "No pool sheet yet."}
          </p>
          {dangerNote ? (
            <p className="whitespace-pre-line rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
              {dangerNote}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={regenMut.isPending || !checks.ready}
            onClick={() => {
              setDangerNote(null);
              regenMut.mutate("pools");
            }}
          >
            {regenMut.isPending
              ? "Working…"
              : detail.hasPoolGames
                ? "Regenerate pool schedule"
                : "Generate pool schedule"}
          </Button>
          <Button
            type="button"
            variant="danger"
            className="w-full"
            disabled={regenMut.isPending || detail.ages.length === 0}
            onClick={() => {
              if (!window.confirm("This wipes pool games and the bracket, then rebuilds from these rules.")) {
                return;
              }
              setDangerNote(null);
              regenMut.mutate("reset");
            }}
          >
            Clear bracket and rebuild
          </Button>
        </fieldset>

        {errorText ? (
          <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {errorText}
          </p>
        ) : null}

        <div className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur">
          <Button type="submit" size="lg" className="w-full" disabled={saveMut.isPending}>
            {saveMut.isPending ? "Saving…" : "Save rules"}
          </Button>
        </div>
      </form>
    </>
  );
}
