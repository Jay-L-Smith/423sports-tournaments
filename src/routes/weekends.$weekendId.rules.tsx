import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { RulesFields } from "@/components/rules-fields";
import { WeekendAdminFrame } from "@/components/weekend-admin";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { updateWeekend, type WeekendDetail } from "@/lib/pbi/api";
import { DEFAULT_BRACKET_RULES, type BracketRules } from "@/lib/pbi/rules";

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
  readOnly,
}: {
  id: number;
  detail: WeekendDetail;
  queryClient: import("@tanstack/react-query").QueryClient;
  bump: () => void;
  readOnly: boolean;
}) {
  const navigate = useNavigate();
  const [rules, setRules] = useState<BracketRules>(detail.rules ?? DEFAULT_BRACKET_RULES);
  const [formError, setFormError] = useState<string | null>(null);
  const [ask, setAsk] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    setRules(detail.rules ?? DEFAULT_BRACKET_RULES);
  }, [detail]);

  useEffect(() => {
    const field = (node: EventTarget | null) =>
      node instanceof HTMLElement && node.matches("input, textarea, select");
    const onFocus = (event: FocusEvent) => {
      if (field(event.target)) setTyping(true);
    };
    const onBlur = () => {
      window.setTimeout(() => setTyping(field(document.activeElement)), 0);
    };
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
    };
  }, []);

  const saveMut = useMutation({
    mutationFn: (input: ReturnType<typeof weekendSavePayload>) => updateWeekend({ data: input }),
    onSuccess: (next) => {
      setFormError(null);
      queryClient.setQueryData(["weekend", id], next);
      bump();
      void navigate({ to: "/weekends/$weekendId", params: { weekendId: String(id) } });
    },
  });

  function save(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const blockChanged = rules.slotMinutes !== detail.rules.slotMinutes;
    const pitchChanged = rules.firstPitch !== detail.rules.firstPitch;
    if (blockChanged) {
      const locked = detail.sheetLocked ? " The sheet is locked." : "";
      const tight =
        rules.slotMinutes < rules.timeLimitMinutes
          ? " The block is shorter than the in-game time limit, so the next pitch can be scheduled before the game in front of it is over."
          : "";
      const pitch = pitchChanged ? ` First pitch also moves from ${detail.rules.firstPitch} to ${rules.firstPitch}.` : "";
      setAsk(
        `Change the time between games from ${detail.rules.slotMinutes} minutes to ${rules.slotMinutes}? Every remaining start time moves. Games already scored stay put.${pitch}${locked}${tight}`,
      );
      return;
    }
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
      <h1 className="mt-3 font-display text-4xl font-bold uppercase">Rules</h1>
      <p className="mt-1 text-sm text-muted">
        {readOnly ? "Who advances, pool games, and clocks." : "Edit who advances, pool games, and clocks."}
      </p>

      <form
        noValidate
        onSubmit={save}
        className="mt-6 space-y-6"
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          const target = event.target;
          if (!(target instanceof HTMLInputElement)) return;
          event.preventDefault();
          target.blur();
        }}
      >
        <fieldset disabled={readOnly} className="space-y-6">
          <RulesFields rules={rules} setRules={setRules} maxTeams={detail.maxTeams} />
        </fieldset>

        {errorText && !readOnly ? (
          <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {errorText}
          </p>
        ) : null}

        {readOnly ? null : <div className="h-20" aria-hidden />}
        {readOnly || typing ? null : (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 mx-auto w-full max-w-lg bg-white px-4 py-3">
          <Button type="submit" size="lg" className="w-full" disabled={saveMut.isPending}>
            {saveMut.isPending ? "Saving…" : "Save rules"}
          </Button>
        </div>
        )}
      </form>
      {ask ? (
        <ConfirmDialog
          text={ask}
          onNo={() => setAsk(null)}
          onYes={() => {
            setAsk(null);
            try {
              saveMut.mutate(weekendSavePayload(detail, { rules }));
            } catch (err) {
              setFormError(err instanceof Error ? err.message : "Check the rules and try again.");
            }
          }}
        />
      ) : null}
    </>
  );
}
