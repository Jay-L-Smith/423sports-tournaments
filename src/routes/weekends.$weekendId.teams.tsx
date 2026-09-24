import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WeekendAdminFrame } from "@/components/weekend-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearDemoTeams, fillDemoTeams, pullTeam, removeWeekendTeam, replaceTeamSlot, type WeekendDetail } from "@/lib/pbi/api";
import { AGE_GROUPS } from "@/lib/pbi/weekends";

export const Route = createFileRoute("/weekends/$weekendId/teams")({
  component: TournamentTeamsPage,
});

function TournamentTeamsPage() {
  const { weekendId } = Route.useParams();
  return (
    <WeekendAdminFrame weekendId={weekendId} backTo="hub">
      {(ctx) => <TeamsBody {...ctx} />}
    </WeekendAdminFrame>
  );
}

function TeamsBody({
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
  const fillAge = detail.ages.some((age) => age.ageGroup === "15U")
    ? "15U"
    : detail.ages[0]?.ageGroup;
  const fillMut = useMutation({
    mutationFn: () => fillDemoTeams({ data: { weekendId: id, ageGroup: fillAge ?? "15U" } }),
    onSuccess: (next) => {
      queryClient.setQueryData(["weekend", id], next);
      bump();
    },
  });
  const clearDemoMut = useMutation({
    mutationFn: () => clearDemoTeams({ data: { weekendId: id } }),
    onSuccess: (next) => {
      queryClient.setQueryData(["weekend", id], next);
      bump();
    },
  });
  const removeTeamMut = useMutation({
    mutationFn: (teamId: number) => removeWeekendTeam({ data: { id: teamId } }),
    onSuccess: (next) => {
      queryClient.setQueryData(["weekend", id], next);
      bump();
    },
  });
  const pullMut = useMutation({
    mutationFn: (teamId: number) => pullTeam({ data: { teamId } }),
    onSuccess: () => {
      bump();
      void queryClient.invalidateQueries({ queryKey: ["schedule", id] });
      void queryClient.invalidateQueries({ queryKey: ["weekend", id] });
    },
  });
  const replaceMut = useMutation({
    mutationFn: (input: { teamId: number; name: string }) => replaceTeamSlot({ data: input }),
    onSuccess: () => {
      setReplaceId(null);
      setReplaceName("");
      bump();
      void queryClient.invalidateQueries({ queryKey: ["schedule", id] });
      void queryClient.invalidateQueries({ queryKey: ["weekend", id] });
    },
  });
  const [confirmPull, setConfirmPull] = useState<number | null>(null);
  const [replaceId, setReplaceId] = useState<number | null>(null);
  const [replaceName, setReplaceName] = useState("");

  const error =
    fillMut.error || clearDemoMut.error || removeTeamMut.error || pullMut.error || replaceMut.error
      ? (fillMut.error || clearDemoMut.error || removeTeamMut.error || pullMut.error || replaceMut.error) instanceof Error
        ? (fillMut.error || clearDemoMut.error || removeTeamMut.error || pullMut.error || replaceMut.error)?.message
        : "Could not update those teams."
      : null;

  return (
    <>
      <h1 className="mt-3 font-display text-4xl font-bold uppercase">Teams in</h1>
      <p className="mt-1 text-sm text-muted">
        {detail.sheetLocked
          ? "The sheet is locked. Pull a club out and their remaining games are forfeits. A new club can take that same slot until first pitch."
          : `${detail.approvedCount}/${detail.maxTeams} in. Remove a club to shrink the bracket.`}
      </p>
      {detail.teamEntryClosed ? (
        <p className="mt-4 rounded-md bg-warn-bg px-3 py-2 text-sm">{detail.teamEntryClosed}</p>
      ) : null}

      <div className="mt-6 space-y-3">
        {fillAge && detail.approvedCount < detail.maxTeams && !detail.teamEntryClosed && !detail.sheetLocked ? (
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={fillMut.isPending}
            onClick={() => fillMut.mutate()}
          >
            {fillMut.isPending ? `Filling ${fillAge}…` : `Fill ${fillAge} with demo teams`}
          </Button>
        ) : null}
        {detail.teams.some((team) => team.isDemo) && !detail.sheetLocked ? (
          <Button type="button" variant="outline" className="w-full" disabled={clearDemoMut.isPending} onClick={() => clearDemoMut.mutate()}>
            {clearDemoMut.isPending ? "Clearing…" : "Clear demo teams"}
          </Button>
        ) : null}
        {error ? (
          <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {error}
          </p>
        ) : null}
        {detail.teams.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
            No clubs in yet. Fill 15U or approve a coach request.
          </p>
        ) : (
          AGE_GROUPS.filter((group) => detail.teams.some((team) => team.ageGroup === group)).map((group) => (
            <div key={group} className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">{group}</p>
              {detail.teams
                .filter((team) => team.ageGroup === group)
                .map((team) => (
                  <div key={team.id} className="space-y-2">
                  <article
                    className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold leading-tight">{team.name}</p>
                      {team.isDemo ? <p className="mt-1 text-xs text-muted">Demo</p> : null}
                    </div>
                    {detail.sheetLocked ? (
                      <div className="flex shrink-0 flex-col gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          className="px-2 text-muted"
                          disabled={pullMut.isPending}
                          onClick={() => {
                            if (confirmPull === team.id) pullMut.mutate(team.id);
                            else setConfirmPull(team.id);
                          }}
                        >
                          {confirmPull === team.id ? "Forfeit their games" : "Pulled out"}
                        </Button>
                        {detail.beforeFirstPitch ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="px-2 text-muted"
                            onClick={() => {
                              setReplaceId(replaceId === team.id ? null : team.id);
                              setReplaceName("");
                            }}
                          >
                            Replace
                          </Button>
                        ) : null}
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        className="shrink-0 px-2 text-muted"
                        disabled={removeTeamMut.isPending}
                        onClick={() => removeTeamMut.mutate(team.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </article>
                  {replaceId === team.id ? (
                    <form
                      className="flex gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        replaceMut.mutate({ teamId: team.id, name: replaceName });
                      }}
                    >
                      <Input
                        value={replaceName}
                        onChange={(event) => setReplaceName(event.target.value)}
                        placeholder="New club name"
                        aria-label={`Replace ${team.name}`}
                      />
                      <Button type="submit" disabled={replaceMut.isPending}>
                        {replaceMut.isPending ? "Saving…" : "Same slot"}
                      </Button>
                    </form>
                  ) : null}
                  </div>
                ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}
