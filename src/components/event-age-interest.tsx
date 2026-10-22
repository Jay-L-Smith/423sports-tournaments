import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  listMyEventInterest,
  respondToEventAge,
  type EventAgeChoice,
  type MyEventInterest,
} from "@/lib/pbi/api";
import { teamCanPlay } from "@/lib/pbi/weekends";

export function EventAgeInterest({ weekendId, onSaved }: { weekendId: number; onSaved?: () => void }) {
  const query = useQuery({
    queryKey: ["event-age-interest", String(weekendId)],
    queryFn: () => listMyEventInterest({ data: { weekendIds: [weekendId] } }),
  });
  if (query.isPending) return <p className="mt-4 text-sm text-muted">Loading…</p>;
  if (query.error instanceof Error) return <p className="mt-4 text-sm">{query.error.message}</p>;
  const event = query.data?.events[0];
  if (!event) return <p className="mt-4 text-sm">That tournament is no longer on the schedule.</p>;
  return <EventAgeChoices event={event} ages={query.data?.ages ?? []} onSaved={onSaved} />;
}

export function EventAgeChoices({
  event,
  ages,
  onSaved,
}: {
  event: MyEventInterest["events"][number];
  ages: MyEventInterest["ages"];
  onSaved?: () => void;
}) {
  const queryClient = useQueryClient();
  const [asked, setAsked] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: (input: { ageGroup: string; choice: EventAgeChoice }) =>
      respondToEventAge({ data: { weekendId: event.id, ageGroup: input.ageGroup, choice: input.choice } }),
    onSuccess: async (result) => {
      if (result.requested) setAsked(result.reason ?? "the sheet is locked.");
      else {
        setAsked(null);
        onSaved?.();
      }
      await queryClient.invalidateQueries({ queryKey: ["event-age-interest"] });
      await queryClient.invalidateQueries({ queryKey: ["tournament-replies"] });
      await queryClient.invalidateQueries({ queryKey: ["tournament-responses"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["weekends"] });
      await queryClient.invalidateQueries({ queryKey: ["weekend"] });
      await queryClient.invalidateQueries({ queryKey: ["schedule"] });
      await queryClient.invalidateQueries({ queryKey: ["my-teams"] });
    },
  });
  const groups = event.ageGroups.length > 0 ? event.ageGroups : ages.map((age) => age.ageGroup);
  return (
    <div className="mt-4 space-y-3">
      {groups.map((ageGroup) => {
        const playing = ages.filter((age) => teamCanPlay(age.ageGroup, ageGroup));
        const mineLabel = playing
          .flatMap((age) =>
            age.teamNames.map((name) => (age.ageGroup === ageGroup ? name : `${name} (${age.ageGroup})`)),
          )
          .join(", ");
        const current = event.choices.find((choice) => choice.ageGroup === ageGroup)?.choice ?? null;
        const pending = save.isPending && save.variables?.ageGroup === ageGroup ? save.variables.choice : null;
        const selected = pending ?? current;
        return (
          <div key={ageGroup} className="space-y-2">
            <p className="text-sm font-semibold">
              {ageGroup}
              {mineLabel ? <span className="font-normal text-muted"> · {mineLabel}</span> : null}
            </p>
            {playing.length === 0 ? (
              <p className="text-sm text-muted">No team of yours plays this age. A team one year younger can play up, and an older team can play down.</p>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                className="w-full"
                disabled={save.isPending || playing.length === 0}
                onClick={() => {
                  if (selected !== "interested") save.mutate({ ageGroup, choice: "interested" });
                  else onSaved?.();
                }}
              >
                {pending === "interested" ? "Saving…" : "Register"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={save.isPending}
                onClick={() => {
                  if (selected !== "no") save.mutate({ ageGroup, choice: "no" });
                  else onSaved?.();
                }}
              >
                {pending === "no" ? "Saving…" : "Not interested"}
              </Button>
            </div>
          </div>
        );
      })}
      {asked ? (
        <p className="rounded-md bg-warn-bg px-3 py-2 text-sm">
          This tournament is locked because {asked} The director got a request to add your team.
        </p>
      ) : null}
      {save.error instanceof Error ? <p className="text-sm">{save.error.message}</p> : null}
    </div>
  );
}
