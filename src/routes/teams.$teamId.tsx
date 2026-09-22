import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RedirectToSignIn } from "@/lib/auth/gates";
import {
  addPlayer,
  getMyTeam,
  listNotifications,
  removePlayer,
  type RegisteredTeam,
} from "@/lib/pbi/api";
import { formatWeekendRange, parsePlayerInput, teamStatusLabel } from "@/lib/pbi/weekends";

export const Route = createFileRoute("/teams/$teamId")({ component: TeamDetailPage });

function TeamDetailPage() {
  const { teamId } = Route.useParams();
  const id = Number.parseInt(teamId, 10);
  const { user, isPending, profile } = useAppSession();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const notifQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => listNotifications(),
    enabled: Boolean(user && profile),
  });
  const teamQuery = useQuery({
    queryKey: ["my-team", id],
    queryFn: () => getMyTeam({ data: { id } }),
    enabled: Boolean(profile?.homeRole === "coach" && Number.isInteger(id) && id > 0),
  });

  const addMut = useMutation({
    mutationFn: (input: ReturnType<typeof parsePlayerInput>) => addPlayer({ data: input }),
    onSuccess: (team) => {
      setName("");
      setJersey("");
      setFormError(null);
      setAdding(false);
      queryClient.setQueryData(["my-team", team.id], team);
      queryClient.setQueryData<RegisteredTeam[]>(["my-teams"], (current) =>
        (current ?? []).map((row) => (row.id === team.id ? team : row)),
      );
    },
  });

  const removeMut = useMutation({
    mutationFn: (input: { teamId: number; playerId: number }) => removePlayer({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["my-team", input.teamId] });
      const previous = queryClient.getQueryData<RegisteredTeam>(["my-team", input.teamId]);
      if (previous) {
        const players = previous.players.filter((p) => p.id !== input.playerId);
        queryClient.setQueryData<RegisteredTeam>(["my-team", input.teamId], {
          ...previous,
          players,
          playerCount: players.length,
        });
      }
      return { previous };
    },
    onError: (_err, input, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["my-team", input.teamId], ctx.previous);
    },
    onSuccess: (team) => {
      queryClient.setQueryData(["my-team", team.id], team);
      queryClient.setQueryData<RegisteredTeam[]>(["my-teams"], (current) =>
        (current ?? []).map((row) => (row.id === team.id ? team : row)),
      );
    },
  });

  if (isPending) return <SessionSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile) return <Navigate to="/" />;
  if (profile.homeRole !== "coach") return <Navigate to="/" />;
  if (!Number.isInteger(id) || id < 1) return <Navigate to="/teams" />;

  const unread = (notifQuery.data ?? []).filter((n) => !n.read).length;
  const team = teamQuery.data;
  const errorText =
    formError ??
    (addMut.error instanceof Error
      ? addMut.error.message
      : addMut.error
        ? "Could not add that player."
        : removeMut.error instanceof Error
          ? removeMut.error.message
          : null);

  function onAdd(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    try {
      addMut.mutate(parsePlayerInput({ teamId: id, name, jersey }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Check the form and try again.");
    }
  }

  return (
    <AppShell homeRole={profile.homeRole} unread={unread}>
      <Link to="/teams" className="text-sm font-semibold text-primary">
        My team
      </Link>

      {teamQuery.isPending ? (
        <p className="mt-6 text-sm text-muted">Loading your team…</p>
      ) : !team ? (
        <p className="mt-6 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
          {teamQuery.error instanceof Error ? teamQuery.error.message : "Could not load that team."}
        </p>
      ) : (
        <>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase">{team.name}</h1>
          <p className="mt-2 text-sm font-medium">
            {team.ageGroup} · {team.tournamentName}
          </p>
          <p className="mt-1 text-sm text-muted">{formatWeekendRange(team.startDate, team.endDate)}</p>
          {team.status === "pending" ? (
            <p className="mt-4 rounded-md bg-warn-bg px-4 py-3 text-sm font-medium">
              Waiting for Admin approval. You are not in this tournament yet. You can still build the roster.
            </p>
          ) : team.status === "denied" ? (
            <p className="mt-4 rounded-md bg-warn-bg px-4 py-3 text-sm font-medium">
              An Admin did not take this team. Request a different tournament if you still want a spot.
            </p>
          ) : (
            <p className="mt-3 text-sm font-semibold text-primary">{teamStatusLabel(team.status)}</p>
          )}

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-2xl font-bold uppercase">Roster</h2>
            <p className="text-sm text-muted">
              {team.playerCount === 0
                ? `No players yet. They play ${team.ageGroup}.`
                : `${team.playerCount} player${team.playerCount === 1 ? "" : "s"} · ${team.ageGroup}`}
            </p>

            {adding ? (
              <form noValidate onSubmit={onAdd} className="space-y-4 rounded-lg border border-line bg-surface p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="player-name">Player name</Label>
                  <Input
                    id="player-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Cade Smith"
                    autoComplete="off"
                    maxLength={60}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="player-jersey">Jersey</Label>
                  <Input
                    id="player-jersey"
                    value={jersey}
                    onChange={(e) => setJersey(e.target.value)}
                    inputMode="numeric"
                    placeholder="12"
                    autoComplete="off"
                    maxLength={2}
                  />
                </div>
                <p className="text-sm text-muted">Age group is {team.ageGroup} for this team.</p>
                {errorText ? (
                  <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
                    {errorText}
                  </p>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <Button type="submit" size="lg" disabled={addMut.isPending}>
                    {addMut.isPending ? "Saving…" : "Add player"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setAdding(false);
                      setFormError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button type="button" size="lg" className="w-full" onClick={() => setAdding(true)}>
                Add player
              </Button>
            )}

            {team.players.length === 0 ? (
              <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
                Add the kids who will play this weekend.
              </p>
            ) : (
              <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
                {team.players.map((player) => (
                  <li key={player.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border-2 border-primary font-display text-lg font-bold text-primary">
                      {player.jersey}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{player.name}</span>
                      <span className="text-xs uppercase tracking-wide text-muted">{player.ageGroup}</span>
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={removeMut.isPending}
                      onClick={() => removeMut.mutate({ teamId: team.id, playerId: player.id })}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {!adding && errorText ? (
              <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
                {errorText}
              </p>
            ) : null}
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-2xl font-bold uppercase">Parks</h2>
            {team.locations.length === 0 ? (
              <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
                Parks for this tournament haven’t been added yet.
              </p>
            ) : (
              team.locations.map((location) => (
                <article key={location.id} className="rounded-lg border border-line bg-surface px-4 py-4">
                  <h3 className="font-display text-2xl font-bold uppercase leading-none">{location.name}</h3>
                  <p className="mt-2 text-sm">{location.address}</p>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
