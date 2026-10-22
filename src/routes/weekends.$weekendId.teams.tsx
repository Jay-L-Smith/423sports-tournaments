import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { createPortal } from "react-dom";
import { WeekendAdminFrame } from "@/components/weekend-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearDemoTeams, getClubCard, pullTeam, removeWeekendTeam, replaceTeamSlot, addWeekendTeam, addTestTeam, declineEntryRequest, listWeekendAddOptions, type WeekendDetail } from "@/lib/pbi/api";
import { type AgeGroup } from "@/lib/pbi/weekends";
import { AgeFilter, ageListRank, showsEveryAge } from "@/components/age-filter";

export const Route = createFileRoute("/weekends/$weekendId/teams")({
  component: TournamentTeamsPage,
});

function TournamentTeamsPage() {
  const { weekendId } = Route.useParams();
  return (
    <WeekendAdminFrame weekendId={weekendId} backTo="hub" contained>
      {(ctx) => <TeamsBody {...ctx} />}
    </WeekendAdminFrame>
  );
}

function TeamsBody({
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
  const clearDemoMut = useMutation({
    mutationFn: () => clearDemoTeams({ data: { weekendId: id } }),
    onSuccess: (next) => {
      queryClient.setQueryData(["weekend", id], next);
      bump();
    },
  });
  const addTestMut = useMutation({
    mutationFn: (confirm: boolean) => addTestTeam({ data: { weekendId: id, confirm } }),
    onSuccess: (next) => {
      queryClient.setQueryData(["weekend", id], next);
      bump();
    },
  });
  const removeTeamMut = useMutation({
    mutationFn: (input: { id: number; fields?: 1 | 2 }) => removeWeekendTeam({ data: input }),
    onSuccess: (next) => {
      queryClient.setQueryData(["weekend", id], next);
      void queryClient.invalidateQueries({ queryKey: ["schedule", id] });
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
  const [cardTeam, setCardTeam] = useState<{ signupTeamId: number | null; weekendTeamId: number | null } | null>(null);
  const [adding, setAdding] = useState(false);
  const [fieldAsk, setFieldAsk] = useState<{ teamId: number; left: number } | null>(null);
  const [lockAsk, setLockAsk] = useState<"add" | "remove" | "test" | null>(null);
  const decide = useMutation({
    mutationFn: (requestId: number) => declineEntryRequest({ data: { id: requestId } }),
    onSuccess: (next) => {
      queryClient.setQueryData(["weekend", id], next);
      bump();
    },
  });
  const addRequest = useMutation({
    mutationFn: (request: WeekendDetail["entryRequests"][number]) =>
      addWeekendTeam({
        data: {
          weekendId: id,
          coachUserId: request.coachUserId,
          name: request.teamName,
          ageGroup: request.ageGroup as AgeGroup,
          confirm: true,
        },
      }),
    onSuccess: (next) => {
      queryClient.setQueryData(["weekend", id], next);
      bump();
    },
  });

  const error =
    clearDemoMut.error || removeTeamMut.error || pullMut.error || replaceMut.error || addTestMut.error
      ? (clearDemoMut.error || removeTeamMut.error || pullMut.error || replaceMut.error || addTestMut.error) instanceof Error
        ? (clearDemoMut.error || removeTeamMut.error || pullMut.error || replaceMut.error || addTestMut.error)?.message
        : "Could not update those teams."
      : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 pb-3">
        <h1 className="font-display text-3xl font-bold uppercase leading-none">Tournament teams</h1>
        <p className="mt-1 text-sm text-muted">
          {readOnly || detail.sheetLocked
            ? `${detail.approvedCount}/${detail.maxTeams} in.`
            : `${detail.approvedCount}/${detail.maxTeams} in. Remove a team to shrink the bracket.`}
        </p>
        {error && !readOnly ? (
          <p className="mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4">
        {detail.teams.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
            No teams in yet.
          </p>
        ) : (
          detail.teams.map((team) => (
            <div key={team.id} className="space-y-2">
              <article className="rounded-lg border border-line bg-surface px-4 py-3">
                {readOnly ? (
                  <div className="min-w-0 text-left">
                    <p className="truncate font-semibold leading-tight">{team.name}</p>
                    <p className="mt-1 text-xs text-muted">{team.ageGroup}{team.isDemo ? " · Test" : ""}</p>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="min-w-0 w-full text-left"
                      onClick={() => setCardTeam({ signupTeamId: null, weekendTeamId: team.id })}
                    >
                      <p className="truncate font-semibold leading-tight">{team.name}</p>
                    </button>
                    <div className="mt-1 flex items-center">
                      <button
                        type="button"
                        className="shrink-0 text-xs leading-none text-muted"
                        onClick={() => setCardTeam({ signupTeamId: null, weekendTeamId: team.id })}
                      >
                        {team.ageGroup}{team.isDemo ? " · Test" : ""}
                      </button>
                      {detail.sheetLocked ? (
                        <div className="ml-2 grid min-w-0 flex-1 grid-cols-3">
                          <button
                            type="button"
                            className="text-center text-[11px] font-bold uppercase leading-none tracking-wide text-muted"
                            disabled={pullMut.isPending}
                            onClick={() => {
                              if (confirmPull === team.id) pullMut.mutate(team.id);
                              else setConfirmPull(team.id);
                            }}
                          >
                            {confirmPull === team.id ? "Yes, forfeit" : "Forfeit rest"}
                          </button>
                          {detail.beforeFirstPitch ? (
                            <button
                              type="button"
                              className="text-center text-[11px] font-bold uppercase leading-none tracking-wide text-muted"
                              onClick={() => {
                                setReplaceId(replaceId === team.id ? null : team.id);
                                setReplaceName("");
                              }}
                            >
                              Replace
                            </button>
                          ) : (
                            <span />
                          )}
                          <button type="button" className="text-center text-[11px] font-bold uppercase leading-none tracking-wide text-muted" onClick={() => setLockAsk("remove")}>
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="ml-auto text-[11px] font-bold uppercase leading-none tracking-wide text-muted"
                          disabled={removeTeamMut.isPending}
                          onClick={() => {
                            const left = detail.teams.length - 1;
                            if ((detail.poolFields ?? 0) >= 2 && left >= 6 && left <= 7) {
                              setFieldAsk({ teamId: team.id, left });
                              return;
                            }
                            removeTeamMut.mutate({ id: team.id });
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </>
                )}
              </article>
              {!readOnly && replaceId === team.id ? (
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
                    placeholder="New team name"
                    aria-label={`Replace ${team.name}`}
                  />
                  <Button type="submit" disabled={replaceMut.isPending}>
                    {replaceMut.isPending ? "Saving…" : "Same slot"}
                  </Button>
                </form>
              ) : null}
            </div>
          ))
        )}
        {!readOnly && detail.teams.some((team) => team.isDemo) && !detail.sheetLocked ? (
          <Button type="button" variant="outline" className="w-full" disabled={clearDemoMut.isPending} onClick={() => clearDemoMut.mutate()}>
            {clearDemoMut.isPending ? "Clearing…" : "Clear test teams"}
          </Button>
        ) : null}
        {!readOnly && detail.approvedCount < detail.maxTeams ? (
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={() => (detail.sheetLocked ? setLockAsk("add") : setAdding(true))}>
              Add a team
            </Button>
            <Button type="button" variant="outline" disabled={addTestMut.isPending} onClick={() => (detail.sheetLocked ? setLockAsk("test") : addTestMut.mutate(false))}>
              {addTestMut.isPending ? "Adding…" : "Add test team"}
            </Button>
          </div>
        ) : null}
        {!readOnly && detail.entryRequests.length > 0 ? (
          <div className="space-y-2">
            <h2 className="font-display text-xl font-bold uppercase">Asked to get in</h2>
            {addRequest.error instanceof Error ? <p className="rounded-md bg-warn-bg px-3 py-2 text-sm">{addRequest.error.message}</p> : null}
            {decide.error instanceof Error ? <p className="rounded-md bg-warn-bg px-3 py-2 text-sm">{decide.error.message}</p> : null}
            {detail.entryRequests.map((request) => (
              <article key={request.id} className="rounded-lg border border-line bg-surface px-4 py-3">
                <p className="font-semibold">{request.teamName}</p>
                <p className="text-sm text-muted">{request.ageGroup} · {request.coachName}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      setLockAsk(null);
                      setAdding(false);
                      addRequest.mutate(request);
                    }}
                  >
                    Add them
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" disabled={decide.isPending} onClick={() => decide.mutate(request.id)}>
                    Not now
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
      {!readOnly && cardTeam ? <ClubCardDialog target={cardTeam} onClose={() => setCardTeam(null)} /> : null}
      {!readOnly && adding ? (
        <AddTeamDialog
          weekendId={id}
          confirm={detail.sheetLocked}
          onClose={() => setAdding(false)}
          onAdded={(next) => {
            queryClient.setQueryData(["weekend", id], next);
            setAdding(false);
            bump();
          }}
        />
      ) : null}
      {fieldAsk && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[120] flex items-end justify-center bg-scrim p-4" onClick={() => setFieldAsk(null)}>
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Fields"
                className="w-full max-w-md rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
                onClick={(event) => event.stopPropagation()}
              >
                <p className="text-sm">
                  {fieldAsk.left} teams can fit on one field. Rebuild the pool as one field, or keep both?
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const teamId = fieldAsk.teamId;
                      setFieldAsk(null);
                      removeTeamMut.mutate({ id: teamId, fields: 1 });
                    }}
                  >
                    One field
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      const teamId = fieldAsk.teamId;
                      setFieldAsk(null);
                      removeTeamMut.mutate({ id: teamId, fields: 2 });
                    }}
                  >
                    Keep both
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
      {lockAsk ? (
        <LockNotice
          reason={detail.lockReason ?? "the sheet is locked."}
          mode={lockAsk === "remove" ? "remove" : "add"}
          onClose={() => setLockAsk(null)}
          onAdd={
            lockAsk === "add"
              ? () => { setLockAsk(null); setAdding(true); }
              : lockAsk === "test"
                ? () => { setLockAsk(null); addTestMut.mutate(true); }
                : undefined
          }
        />
      ) : null}
    </div>
  );
}

function AddTeamDialog({
  weekendId,
  confirm = false,
  onClose,
  onAdded,
}: {
  weekendId: number;
  confirm?: boolean;
  onClose: () => void;
  onAdded: (detail: WeekendDetail) => void;
}) {
  const options = useQuery({
    queryKey: ["weekend-add", weekendId],
    queryFn: () => listWeekendAddOptions({ data: { weekendId } }),
  });
  const add = useMutation({
    mutationFn: (input: { teamId?: number; coachUserId?: string; name?: string; ageGroup?: AgeGroup }) =>
      addWeekendTeam({ data: { weekendId, confirm, ...input } }),
    onSuccess: (next) => onAdded(next),
  });
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [query, setQuery] = useState("");
  const [ageFilter, setAgeFilter] = useState("All");
  const [coachUserId, setCoachUserId] = useState("");
  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">("");
  if (typeof document === "undefined") return null;
  const needle = query.trim().toLowerCase();
  const teams = (options.data?.teams ?? [])
    .filter((team) => {
      if (!needle) return true;
      return `${team.name} ${team.ageGroup} ${team.coachName}`.toLowerCase().includes(needle);
    })
    .filter((team) => showsEveryAge(ageFilter) || team.ageGroup === ageFilter)
    .sort((a, b) => {
      if (!showsEveryAge(ageFilter)) return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      return ageListRank(a.ageGroup) - ageListRank(b.ageGroup) || a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  const ages = options.data?.ages ?? [];
  const coaches = options.data?.coaches ?? [];
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-scrim p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add a team"
        className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold uppercase">Add a team</h2>
          <Button type="button" variant="ghost" className="px-2 text-muted" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button type="button" variant={mode === "existing" ? "default" : "outline"} onClick={() => setMode("existing")}>
            Existing team
          </Button>
          <Button type="button" variant={mode === "new" ? "default" : "outline"} onClick={() => setMode("new")}>
            New team
          </Button>
        </div>
        {options.isPending ? (
          <p className="mt-4 text-sm text-muted">Loading…</p>
        ) : options.error instanceof Error ? (
          <p className="mt-4 rounded-md bg-warn-bg px-3 py-2 text-sm">{options.error.message}</p>
        ) : mode === "existing" ? (
          <div className="mt-4 space-y-3">
            <AgeFilter value={ageFilter} onChange={setAgeFilter} />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teams" aria-label="Search teams" />
            {teams.length === 0 ? (
              <p className="text-sm text-muted">{needle ? "No team matches that." : "No other teams yet. Create one instead."}</p>
            ) : (
              <ul className="space-y-2">
                {teams.map((team) => (
                  <li key={team.id}>
                    <button
                      type="button"
                      disabled={add.isPending}
                      onClick={() => add.mutate({ teamId: team.id })}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{team.name}</span>
                        <span className="mt-0.5 block text-xs text-muted">{team.ageGroup} · {team.coachName}</span>
                      </span>
                      <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-muted">Add</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!ageGroup) return;
              add.mutate({ coachUserId, name, ageGroup });
            }}
          >
            <label className="block space-y-1 text-sm font-semibold">
              Coach
              <select
                aria-label="Coach"
                value={coachUserId}
                onChange={(event) => setCoachUserId(event.target.value)}
                className="h-11 w-full rounded-md border border-line bg-bg px-2 text-sm font-normal"
              >
                <option value="">Pick a coach</option>
                {coaches.map((coach) => (
                  <option key={coach.userId} value={coach.userId}>
                    {coach.name}
                  </option>
                ))}
              </select>
            </label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Team name" aria-label="Team name" />
            <label className="block space-y-1 text-sm font-semibold">
              Age
              <select
                aria-label="Age"
                value={ageGroup}
                onChange={(event) => setAgeGroup(event.target.value as AgeGroup | "")}
                className="h-11 w-full rounded-md border border-line bg-bg px-2 text-sm font-normal"
              >
                <option value="">Age</option>
                {ages.map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" className="w-full" disabled={add.isPending || !coachUserId || name.trim().length < 2 || !ageGroup}>
              {add.isPending ? "Adding…" : "Add team"}
            </Button>
          </form>
        )}
        {add.error instanceof Error ? <p className="mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm">{add.error.message}</p> : null}
      </div>
    </div>,
    document.body,
  );
}

function LockNotice({
  reason,
  mode,
  onClose,
  onAdd,
}: {
  reason: string;
  mode: "add" | "remove";
  onClose: () => void;
  onAdd?: () => void;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-scrim p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tournament is locked"
        className="w-full max-w-md rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-display text-2xl font-bold uppercase">Tournament is locked</h2>
        <p className="mt-3 text-sm">
          This tournament is locked because {reason}{" "}
          {mode === "add"
            ? "The team can be added, but the pool and bracket will not move until you unlock it. You can also place them in an open slot by hand."
            : "The sheet will not change while it is locked. Unlock it to redraw the pool, or forfeit them if a game has already been scored."}
        </p>
        {onAdd ? (
          <Button type="button" className="mt-4 w-full" onClick={onAdd}>
            Add anyway
          </Button>
        ) : null}
        <Button type="button" variant="outline" className="mt-2 w-full" onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>,
    document.body,
  );
}

function ClubCardDialog({
  target,
  onClose,
}: {
  target: { signupTeamId: number | null; weekendTeamId: number | null };
  onClose: () => void;
}) {
  const cardQuery = useQuery({
    queryKey: ["club-card", target.signupTeamId, target.weekendTeamId],
    queryFn: () => getClubCard({ data: target }),
  });
  if (typeof document === "undefined") return null;
  const card = cardQuery.data;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-scrim p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={card?.teamName ?? "Team"}
        className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold uppercase">{card?.teamName ?? "Team"}</h2>
          <Button type="button" variant="ghost" className="px-2 text-muted" onClick={onClose}>
            Close
          </Button>
        </div>
        {cardQuery.isPending ? (
          <p className="mt-4 text-sm text-muted">Loading…</p>
        ) : cardQuery.error instanceof Error ? (
          <p className="mt-4 rounded-md bg-warn-bg px-3 py-2 text-sm">{cardQuery.error.message}</p>
        ) : card ? (
          <>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted">Age</dt><dd className="font-semibold">{card.ageGroup}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Coach</dt><dd className="font-semibold">{card.coachName}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Phone</dt><dd className="font-semibold">{card.phone || "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Email</dt><dd className="truncate font-semibold">{card.email || "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Organization</dt><dd className="font-semibold">{card.club || "—"}</dd></div>
            </dl>
            <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-muted">Roster</h3>
            {card.players.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No players yet.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {card.players.map((player) => (
                  <li key={player.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-semibold">{player.name}</span>
                    <span className="shrink-0 text-muted">#{player.jersey}{player.gradYear ? ` · ${player.gradYear}` : ""}{player.birthday ? ` · ${player.birthday}` : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
