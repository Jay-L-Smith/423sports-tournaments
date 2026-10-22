import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useAppSession } from "@/components/session-gate";
import { AppShell } from "@/components/shell";
import { MondayDateInput } from "@/components/monday-date-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { addMySquad, addSquadPlayer, listMySquads, removeMySquad, removeSquadPlayer, requestTeamJoin, searchJoinableTeams, updateMySquad, type CoachSquad, type JoinableTeam } from "@/lib/pbi/api";
import { AGE_GROUPS, baseballAgeYear, isoDateFromLocal, playerMeetsAge, type AgeGroup } from "@/lib/pbi/weekends";

export const Route = createFileRoute("/teams/")({ component: MyTeamsPage });

function ageOneOlder(ageGroup: string): AgeGroup | null {
  const index = AGE_GROUPS.indexOf(ageGroup as AgeGroup);
  if (index < 0 || index >= AGE_GROUPS.length - 1) return null;
  return AGE_GROUPS[index + 1];
}

function birthdayMark(birthday: string, ageGroup: string): "ok" | "up" | "over" {
  const ageYear = baseballAgeYear(isoDateFromLocal(new Date()));
  if (playerMeetsAge(birthday, ageGroup, ageYear)) return "ok";
  const older = ageOneOlder(ageGroup);
  if (older && playerMeetsAge(birthday, older, ageYear)) return "up";
  return "over";
}
function formatBirthday(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function MyTeamsPage() {
  const { user, isPending, profile } = useAppSession();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [addDoor, setAddDoor] = useState<"ask" | "join" | "create">("ask");
  const [joinQuery, setJoinQuery] = useState("");
  const [joinHits, setJoinHits] = useState<JoinableTeam[]>([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState<AgeGroup | "">("");
  const [playerTeamId, setPlayerTeamId] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [jersey, setJersey] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gradYear, setGradYear] = useState("");

  const squadsQuery = useQuery({
    queryKey: ["my-squads"],
    queryFn: () => listMySquads(),
    enabled: Boolean(profile?.homeRole === "coach"),
  });

  function refresh() {
    return queryClient.invalidateQueries({ queryKey: ["my-squads"] });
  }

  const saveTeam = useMutation({
    mutationFn: (input: { teamId?: number; name: string; ageGroup: AgeGroup; confirmDifferent?: boolean }) =>
      input.teamId
        ? updateMySquad({ data: input as { teamId: number; name: string; ageGroup: AgeGroup } })
        : addMySquad({ data: { name: input.name, ageGroup: input.ageGroup, confirmDifferent: input.confirmDifferent === true } }),
    onSuccess: async () => {
      setEditingId(null);
      setAdding(false);
      setName("");
      setAge("");
      await refresh();
      await queryClient.invalidateQueries({ queryKey: ["my-teams", "signup"] });
    },
  });
  const joinTeam = useMutation({
    mutationFn: (signupTeamId: number) => requestTeamJoin({ data: { signupTeamId } }),
    onSuccess: async () => {
      setAdding(false);
      setJoinQuery("");
      setJoinHits([]);
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  useEffect(() => {
    if (!adding || addDoor !== "join" || joinQuery.trim().length < 2) {
      setJoinHits([]);
      return;
    }
    let stop = false;
    const timer = setTimeout(() => {
      void searchJoinableTeams({ data: { query: joinQuery.trim() } })
        .then((hits) => {
          if (!stop) setJoinHits(hits);
        })
        .catch(() => {
          if (!stop) setJoinHits([]);
        });
    }, 250);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [adding, addDoor, joinQuery]);
  const removeTeam = useMutation({
    mutationFn: (teamId: number) => removeMySquad({ data: { teamId } }),
    onSuccess: async () => {
      setEditingId(null);
      await refresh();
      await queryClient.invalidateQueries({ queryKey: ["my-teams", "signup"] });
    },
  });
  const addPlayer = useMutation({
    mutationFn: (input: { teamId: number; name: string; jersey: string; birthday: string; gradYear: string }) => addSquadPlayer({ data: input }),
    onSuccess: async () => {
      setPlayerName("");
      setJersey("");
      setBirthday("");
      setGradYear("");
      setPlayerTeamId(null);
      await refresh();
    },
  });
  const dropPlayer = useMutation({
    mutationFn: (playerId: number) => removeSquadPlayer({ data: { playerId } }),
    onSuccess: () => refresh(),
  });

  if (isPending || !profile) {
    if (!isPending && !user) return <RedirectToSignIn />;
    if (!isPending && !profile) return <Navigate to="/" />;
    return (
      <AppShell homeRole="coach">
        <h1 className="font-display text-4xl font-bold uppercase">My team</h1>
        <p className="mt-2 text-sm text-muted">Loading your teams…</p>
      </AppShell>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (profile.homeRole !== "coach") return <Navigate to="/" />;

  const squads = squadsQuery.data ?? [];
  const error =
    (saveTeam.error instanceof Error && !saveTeam.error.message.includes("already on here") && saveTeam.error.message) ||
    (joinTeam.error instanceof Error && joinTeam.error.message) ||
    (removeTeam.error instanceof Error && removeTeam.error.message) ||
    (addPlayer.error instanceof Error && addPlayer.error.message) ||
    (dropPlayer.error instanceof Error && dropPlayer.error.message) ||
    (squadsQuery.error instanceof Error && squadsQuery.error.message) ||
    null;

  function openEdit(team: CoachSquad) {
    setAdding(false);
    setEditingId(team.id);
    setName(team.name);
    setAge(team.ageGroup as AgeGroup);
    saveTeam.reset();
    removeTeam.reset();
  }

  function openAdd() {
    setEditingId(null);
    setAdding(true);
    setAddDoor("ask");
    setName("");
    setAge("");
    setJoinQuery("");
    saveTeam.reset();
    joinTeam.reset();
  }

  function onSaveTeam(event: FormEvent, confirmDifferent = false) {
    event.preventDefault();
    if (!age) return;
    saveTeam.mutate({ teamId: editingId ?? undefined, name, ageGroup: age, confirmDifferent });
  }

  function onAddPlayer(event: FormEvent, teamId: number) {
    event.preventDefault();
    addPlayer.mutate({ teamId, name: playerName, jersey, birthday, gradYear });
  }

  return (
    <AppShell homeRole={profile.homeRole}>
      <div data-tour="my-team">
      <h1 className="font-display text-4xl font-bold uppercase">My team</h1>
      <p className="mt-2 text-sm text-muted">Tap a team to change the name or age. Add players under it.</p>

      {squadsQuery.isPending ? (
        <p className="mt-6 text-sm text-muted">Loading your teams…</p>
      ) : (
        <div className="mt-6 space-y-4">
          {squads.length === 0 && !adding ? (
            <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">No team yet.</p>
          ) : null}
          {squads.map((team) => {
            const editing = editingId === team.id;
            return (
              <article key={team.id} className="rounded-lg border border-line bg-surface px-4 py-4">
                {editing ? (
                  <form onSubmit={onSaveTeam} className="space-y-3">
                    <Input value={name} aria-label="Team name" placeholder="Team name" onChange={(event) => setName(event.target.value)} />
                    <select
                      aria-label="Age"
                      value={age}
                      onChange={(event) => setAge(event.target.value as AgeGroup | "")}
                      className="h-11 w-full rounded-md border border-line bg-bg px-2 text-sm"
                    >
                      <option value="">Age</option>
                      {AGE_GROUPS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1" disabled={saveTeam.isPending || !age}>
                        {saveTeam.isPending ? "Saving…" : "Save"}
                      </Button>
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                    {squads.length > 1 ? (
                      <Button type="button" variant="ghost" className="w-full text-muted" disabled={removeTeam.isPending} onClick={() => removeTeam.mutate(team.id)}>
                        Remove team
                      </Button>
                    ) : null}
                  </form>
                ) : (
                  <button type="button" onClick={() => openEdit(team)} className="min-w-0 flex-1 text-left">
                    <span className="block font-display text-2xl font-bold uppercase leading-none">{team.name}</span>
                    <span className="mt-1 block text-sm font-semibold">{team.ageGroup}</span>
                  </button>
                )}

                <div className="mt-4 border-t border-line pt-3">
                  <h2 className="text-sm font-bold uppercase tracking-wide">Players</h2>
                  {team.players.length === 0 ? (
                    <p className="mt-2 text-sm text-muted">No players yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {team.players.map((player) => {
                        const mark = player.birthday ? birthdayMark(player.birthday, team.ageGroup) : null;
                        const playsUp = ageOneOlder(team.ageGroup);
                        return (
                        <li key={player.id} className="grid grid-cols-3 items-center text-sm">
                          <span className="min-w-0">#{player.jersey} {player.name}{player.gradYear ? ` · ${player.gradYear}` : ""}</span>
                          {player.birthday ? (
                            <span className="inline-flex items-center justify-self-center gap-1 text-muted">
                              {formatBirthday(player.birthday)}
                              {mark === "over" ? (
                                <X className="h-4 w-4 text-red-600" aria-label="Too old for this age, even playing up one year" />
                              ) : mark === "up" ? (
                                <span className="text-xs font-semibold text-fg">Plays {playsUp}</span>
                              ) : (
                                <Check className="h-4 w-4 text-green-700" aria-label="Meets the April 30 cutoff" />
                              )}
                            </span>
                          ) : (
                            <span />
                          )}
                          <button type="button" className="justify-self-end text-muted" onClick={() => dropPlayer.mutate(player.id)}>
                            Remove
                          </button>
                        </li>
                        );
                      })}
                    </ul>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => {
                      setPlayerTeamId(team.id);
                      setPlayerName("");
                      setJersey("");
                      setBirthday("");
                      addPlayer.reset();
                    }}
                  >
                    Add player
                  </Button>
                </div>
              </article>
            );
          })}

          {adding ? (
            <div className="space-y-3 rounded-lg border border-line bg-surface px-4 py-4">
              {addDoor === "ask" && editingId == null ? (
                <>
                  <Button type="button" className="w-full" onClick={() => setAddDoor("join")}>
                    My team is already on here
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={() => setAddDoor("create")}>
                    I’m setting this team up
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setAdding(false)}>
                    Cancel
                  </Button>
                </>
              ) : null}
              {addDoor === "join" && editingId == null ? (
                <>
                  <Input value={joinQuery} aria-label="Search team" placeholder="Team name" onChange={(event) => setJoinQuery(event.target.value)} />
                  {joinHits.length === 0 ? (
                    <p className="text-sm text-muted">Type the team name. A missed letter still finds it.</p>
                  ) : (
                    joinHits.map((team) => (
                      <button
                        key={team.id}
                        type="button"
                        className="block w-full rounded-md border border-line px-3 py-2 text-left"
                        disabled={joinTeam.isPending}
                        onClick={() => joinTeam.mutate(team.id)}
                      >
                        <span className="font-semibold">{team.name} · {team.ageGroup}</span>
                        <span className="mt-0.5 block text-sm text-muted">{team.coachName}</span>
                      </button>
                    ))
                  )}
                  <Button type="button" variant="outline" className="w-full" onClick={() => setAddDoor("ask")}>
                    Back
                  </Button>
                </>
              ) : null}
              {addDoor === "create" || editingId != null ? (
            <form onSubmit={onSaveTeam} className="space-y-3">
              <Input value={name} aria-label="Team name" placeholder="Team name" onChange={(event) => setName(event.target.value)} />
              <select
                aria-label="Age"
                value={age}
                onChange={(event) => setAge(event.target.value as AgeGroup | "")}
                className="h-11 w-full rounded-md border border-line bg-bg px-2 text-sm"
              >
                <option value="">Age</option>
                {AGE_GROUPS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={saveTeam.isPending || !age}>
                  {saveTeam.isPending ? "Saving…" : "Save team"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setAdding(false); setEditingId(null); }}>
                  Cancel
                </Button>
              </div>
              {saveTeam.error instanceof Error && saveTeam.error.message.includes("already on here") ? (
                <div className="space-y-2">
                  <Button type="button" className="w-full" onClick={() => { setAddDoor("join"); setJoinQuery(name); }}>
                    Join that team
                  </Button>
                  <Button type="button" variant="outline" className="w-full" disabled={saveTeam.isPending} onClick={(event) => onSaveTeam(event, true)}>
                    This is a different team
                  </Button>
                </div>
              ) : null}
            </form>
              ) : null}
            </div>
          ) : (
            <Button type="button" variant="outline" className="w-full" onClick={openAdd}>
              Add a team
            </Button>
          )}

          {error ? (
            <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )}
      </div>
      {playerTeamId != null ? (
        <AddPlayerCard
          teamName={squads.find((team) => team.id === playerTeamId)?.name ?? "Team"}
          classAge={["Underclass", "Upperclass"].includes(squads.find((team) => team.id === playerTeamId)?.ageGroup ?? "")}
          name={playerName}
          jersey={jersey}
          birthday={birthday}
          gradYear={gradYear}
          pending={addPlayer.isPending}
          error={addPlayer.error instanceof Error ? addPlayer.error.message : null}
          onName={setPlayerName}
          onJersey={setJersey}
          onBirthday={setBirthday}
          onGradYear={setGradYear}
          onClose={() => setPlayerTeamId(null)}
          onSubmit={(event) => onAddPlayer(event, playerTeamId)}
        />
      ) : null}
    </AppShell>
  );
}

function AddPlayerCard({
  teamName,
  classAge,
  name,
  jersey,
  birthday,
  gradYear,
  pending,
  error,
  onName,
  onJersey,
  onBirthday,
  onGradYear,
  onClose,
  onSubmit,
}: {
  teamName: string;
  classAge: boolean;
  name: string;
  jersey: string;
  birthday: string;
  gradYear: string;
  pending: boolean;
  error: string | null;
  onName: (value: string) => void;
  onJersey: (value: string) => void;
  onBirthday: (value: string) => void;
  onGradYear: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  if (typeof document === "undefined") return null;
  const ready = classAge ? /^\d{4}$/.test(gradYear) : Boolean(birthday);
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-scrim p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label={`Add a player to ${teamName}`}
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm space-y-3 rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase">Add player</h2>
            <p className="text-sm text-muted">{teamName}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-md text-muted">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <Input value={name} aria-label="Player name" placeholder="Player name" onChange={(event) => onName(event.target.value)} />
        <Input value={jersey} aria-label="Jersey" inputMode="numeric" placeholder="Jersey" maxLength={2} onChange={(event) => onJersey(event.target.value)} />
        {classAge ? null : (
          <label className="block space-y-1 text-sm font-semibold">
            Birthday
            <MondayDateInput id="add-player-birthday" birthday value={birthday} onChange={onBirthday} className="h-11 bg-bg text-sm font-normal" />
          </label>
        )}
        <label className="block space-y-1 text-sm font-semibold">
          Grad year
          <Input
            value={gradYear}
            aria-label="Grad year"
            inputMode="numeric"
            placeholder="2030"
            maxLength={4}
            onChange={(event) => onGradYear(event.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </label>
        <Button type="submit" className="w-full" disabled={pending || !ready}>
          {pending ? "Adding…" : "Add player"}
        </Button>
        {error ? (
          <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>,
    document.body,
  );
}
