import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { WeekendAdminFrame } from "@/components/weekend-admin";
import { Button } from "@/components/ui/button";
import { clearDemoTeams, fillDemoTeams, removeWeekendTeam, type WeekendDetail } from "@/lib/pbi/api";
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
  const fillMut = useMutation({
    mutationFn: () => fillDemoTeams({ data: { weekendId: id, ageGroup: "15U" } }),
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

  const error =
    fillMut.error || clearDemoMut.error || removeTeamMut.error
      ? (fillMut.error || clearDemoMut.error || removeTeamMut.error) instanceof Error
        ? (fillMut.error || clearDemoMut.error || removeTeamMut.error)?.message
        : "Could not update those teams."
      : null;

  return (
    <>
      <h1 className="mt-3 font-display text-4xl font-bold uppercase">Teams in</h1>
      <p className="mt-1 text-sm text-muted">
        {detail.approvedCount}/{detail.maxTeams} in. Remove a club to shrink the bracket.
      </p>

      <div className="mt-6 space-y-3">
        {detail.ages.some((age) => age.ageGroup === "15U") && detail.approvedCount < detail.maxTeams ? (
          <Button type="button" size="lg" className="w-full" disabled={fillMut.isPending} onClick={() => fillMut.mutate()}>
            {fillMut.isPending ? "Filling 15U…" : "Fill 15U with demo teams"}
          </Button>
        ) : null}
        {detail.teams.some((team) => team.isDemo) ? (
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
                  <article
                    key={team.id}
                    className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold leading-tight">{team.name}</p>
                      {team.isDemo ? <p className="mt-1 text-xs text-muted">Demo</p> : null}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="shrink-0 px-2 text-muted"
                      disabled={removeTeamMut.isPending}
                      onClick={() => removeTeamMut.mutate(team.id)}
                    >
                      Remove
                    </Button>
                  </article>
                ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}
