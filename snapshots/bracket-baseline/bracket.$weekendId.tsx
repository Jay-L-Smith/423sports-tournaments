import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { PoolGrid, ScoreDialog, SiteBoard, GameEditProvider } from "@/components/bracket-board";
import { SheetZoom } from "@/components/sheet-zoom";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { RedirectToSignIn } from "@/lib/auth/gates";
import {
  addFieldToGame,
  getWeekendSchedule,
  markRainout,
  postGameScore,
  pullTeam,
  pushPublicSheet,
  rebuildWeekendSchedule,
  replaceTeamSlot,
  setGameField,
  setSheetLock,
  setSundaySeedsLocked,
  swapPoolTeams,
  updateGameDetails,
  type ScheduleAge,
  type ScheduleGame,
} from "@/lib/pbi/api";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDayTab, parseDayPlan, type DayPlan } from "@/lib/pbi/weekends";
import {
  hasPlayInRound,
  liveBracketRound,
  ROUND_IDS,
  startBlocks,
  type RoundId,
} from "@/lib/pbi/bracket";

export const Route = createFileRoute("/bracket/$weekendId")({
  component: BracketPage,
});

function daysFor(
  weekend: { startDate: string; endDate: string; poolPlay: boolean; dayPlan?: DayPlan[] },
  games: { startDate: string | null }[] = [],
): DayPlan[] {
  const plan = parseDayPlan(weekend.dayPlan, weekend.startDate, weekend.endDate, weekend.poolPlay);
  const seen = new Set(plan.map((row) => row.date));
  const extra: DayPlan[] = [];
  for (const game of games) {
    if (!game.startDate || seen.has(game.startDate)) continue;
    if (game.startDate < weekend.startDate || game.startDate > weekend.endDate) continue;
    seen.add(game.startDate);
    extra.push({ date: game.startDate, kind: "bracket" });
  }
  return [...plan, ...extra].sort((a, b) => a.date.localeCompare(b.date));
}

function firstPlayableRound(games: ScheduleGame[]): RoundId | null {
  return ROUND_IDS.find((round) => games.some((game) => game.round === round)) ?? null;
}

function BracketPage() {
  const { weekendId } = Route.useParams();
  const id = Number.parseInt(weekendId, 10);
  const { user, isPending, profile } = useAppSession();
  const queryClient = useQueryClient();
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [scoreGame, setScoreGame] = useState<ScheduleGame | null>(null);
  const [warnOpen, setWarnOpen] = useState(true);
  const [focusWarning, setFocusWarning] = useState<string | null>(null);


  const scheduleQuery = useQuery({
    queryKey: ["schedule", id],
    queryFn: () => getWeekendSchedule({ data: { weekendId: id } }),
    enabled: Boolean(user && profile && Number.isInteger(id) && id > 0),
  });


  const fieldMut = useMutation({
    mutationFn: (input: { gameId: number; locationId: number | null }) => setGameField({ data: input }),
    onSuccess: (data) => queryClient.setQueryData(["schedule", id], data),
  });
  const addFieldMut = useMutation({
    mutationFn: (input: { gameId: number; name: string; address: string }) => addFieldToGame({ data: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(["schedule", id], data);
      void queryClient.invalidateQueries({ queryKey: ["weekend", id] });
      void queryClient.invalidateQueries({ queryKey: ["weekends"] });
    },
  });
  const swapMut = useMutation({
    mutationFn: (input: { gameId: number; teamAId: number; teamBId: number }) =>
      swapPoolTeams({
        data: input,
      }),
    onSuccess: (data) => queryClient.setQueryData(["schedule", id], data),
  });
  const lockMut = useMutation({
    mutationFn: (locked: boolean) => setSundaySeedsLocked({ data: { weekendId: id, locked } }),
    onSuccess: (data) => queryClient.setQueryData(["schedule", id], data),
  });
  const rebuildMut = useMutation({
    mutationFn: (input: { ageGroup: ScheduleAge["ageGroup"]; mode: "repack" | "pools" | "bracket" | "fit" }) =>
      rebuildWeekendSchedule({ data: { weekendId: id, ageGroup: input.ageGroup, mode: input.mode } }),
    onSuccess: (data) => queryClient.setQueryData(["schedule", id], data),
  });
  const scoreMut = useMutation({
    mutationFn: (input: { gameId: number; homeScore: number; awayScore: number; forfeit?: "home" | "away" | null }) =>
      postGameScore({ data: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(["schedule", id], data);
      setScoreGame(null);
    },
  });
  const sheetLockMut = useMutation({
    mutationFn: (lock: "on" | "off") => setSheetLock({ data: { weekendId: id, lock } }),
    onSuccess: (data) => {
      queryClient.setQueryData(["schedule", id], data);
    },
  });
  const pushMut = useMutation({
    mutationFn: () => pushPublicSheet({ data: { weekendId: id } }),
    onSuccess: (data) => queryClient.setQueryData(["schedule", id], data),
  });
  const pullMut = useMutation({
    mutationFn: (teamId: number) => pullTeam({ data: { teamId } }),
    onSuccess: (data) => {
      queryClient.setQueryData(["schedule", id], data);
      setScoreGame(null);
    },
  });
  const replaceMut = useMutation({
    mutationFn: (input: { teamId: number; name: string }) => replaceTeamSlot({ data: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(["schedule", id], data);
      setScoreGame(null);
    },
  });
  const editMut = useMutation({
    mutationFn: (input: { gameId: number; startDate: string; startTime: string; locationId: number | null }) =>
      updateGameDetails({ data: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(["schedule", id], data);
      setScoreGame((current) => {
        if (!current) return current;
        const next = data.ages.flatMap((age) => age.games).find((game) => game.id === current.id);
        return next ?? current;
      });
    },
  });
  const rainMut = useMutation({
    mutationFn: (input: { gameId: number; action: string; date?: string | null; time?: string | null; locationId?: number | null }) =>
      markRainout({ data: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(["schedule", id], data);
    },
  });


  if (isPending) return <SessionSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile) return <Navigate to="/" />;
  if (!Number.isInteger(id) || id < 1) return <Navigate to="/" />;

  const schedule = scheduleQuery.data;
  const editable = profile.homeRole === "admin";
  const ages = schedule?.ages ?? [];
  const activeAge =
    ages.find((age) => age.ageGroup === ageGroup) ??
    ages.find((age) => age.teamCount >= age.minTeams) ??
    ages[0] ??
    null;
  const flaggedIds = activeAge
    ? [
        ...new Set(
          activeAge.warnings
            .filter((row) => focusWarning == null || row.id === focusWarning)
            .flatMap((row) => row.gameIds ?? (row.gameId != null ? [row.gameId] : [])),
        ),
      ]
    : [];
  const poolOn = Boolean(activeAge?.poolPlay);
  const days = schedule ? daysFor(schedule.weekend, schedule.ages.flatMap((age) => age.games)) : [];
  const activeDay = days.find((row) => row.date === day) ?? days[0] ?? null;
  const poolGamesToday =
    activeAge && activeDay
      ? activeAge.games.filter(
          (game) =>
            game.round === "pool" &&
            !game.isBye &&
            (game.startDate === activeDay.date || !game.startDate),
        )
      : [];
  const bracketGamesToday =
    activeAge && activeDay
      ? activeAge.games.filter(
          (game) => game.round !== "pool" && !game.isBye && game.startDate === activeDay.date,
        )
      : [];
  const showPools = Boolean(
    activeDay && poolOn && (activeDay.kind === "pool" || activeDay.kind === "mixed" || poolGamesToday.length > 0),
  );
  const showTree = Boolean(
    activeDay && (activeDay.kind === "bracket" || activeDay.kind === "mixed" || bracketGamesToday.length > 0),
  );
  const fieldBusy = fieldMut.isPending || addFieldMut.isPending || swapMut.isPending;
  const fieldError =
    fieldMut.error instanceof Error
      ? fieldMut.error.message
      : addFieldMut.error instanceof Error
        ? addFieldMut.error.message
        : swapMut.error instanceof Error
          ? swapMut.error.message
          : null;

  const gameEdit =
    editable && schedule
      ? {
          parks: schedule.locations,
          days: days.map((row) => ({ date: row.date, label: formatDayTab(row.date) })),
          blocksFor: (date: string) =>
            startBlocks(
              date,
              schedule.weekend.dayPlan.map((row) => row.date),
              schedule.weekend.rules,
            ),
          busy: editMut.isPending || pullMut.isPending || replaceMut.isPending,
          save: async (input: { gameId: number; startDate: string; startTime: string; locationId: number | null }) => {
            await editMut.mutateAsync(input);
          },
          locked: schedule.weekend.sheetLocked,
          beforeFirstPitch: schedule.weekend.beforeFirstPitch,
          pullOut: async (teamId: number) => {
            await pullMut.mutateAsync(teamId);
          },
          replaceTeam: async (teamId: number, name: string) => {
            await replaceMut.mutateAsync({ teamId, name });
          },
        }
      : null;

  return (
    <GameEditProvider value={gameEdit}>
    <div className="sheet flex min-h-dvh flex-col bg-bg text-fg">
      <header className="sticky top-0 z-10 bg-[#1c1c1c] px-3 py-2 text-white">
        <div className="flex items-center gap-2">
          {profile.homeRole === "admin" ? (
            <Link
              to="/weekends/$weekendId"
              params={{ weekendId: String(id) }}
              className="shrink-0 text-xs font-semibold text-white underline-offset-4 hover:underline"
            >
              ← {schedule?.weekend.name ?? "Tournament"}
            </Link>
          ) : (
            <Link to="/schedule" className="shrink-0 text-xs font-semibold text-white underline-offset-4 hover:underline">
              ← Schedule
            </Link>
          )}
          {ages.length > 1 ? (
            <div className="ml-auto flex flex-wrap justify-end gap-1">
              {ages.map((age) => (
                <button
                  key={age.ageGroup}
                  type="button"
                  onClick={() => setAgeGroup(age.ageGroup)}
                  className={cn(
                    "sheet-chip",
                    (activeAge?.ageGroup ?? "") === age.ageGroup && "sheet-chip-on",
                  )}
                >
                  {age.ageGroup}
                </button>
              ))}
            </div>
          ) : activeAge ? (
            <p className="ml-auto text-[10px] font-bold uppercase tracking-wide text-white/70">{activeAge.ageGroup}</p>
          ) : null}
        </div>
      </header>

      {scheduleQuery.isPending ? (
        <p className="px-4 py-5 text-sm text-muted">Building the bracket…</p>
      ) : !schedule ? (
        <p className="mx-4 mt-4 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
          {scheduleQuery.error instanceof Error ? scheduleQuery.error.message : "Could not load that bracket."}
        </p>
      ) : schedule.weekend.lifecycle === "announced" ? (
        <p className="mx-4 mt-4 rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
          Dates only. Brackets aren’t built for this weekend yet.
        </p>
      ) : !activeAge || (!activeAge.hasBracket && activeAge.teamCount < 2) ? (
        <p className="mx-4 mt-4 rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
          The bracket is the size you set. Open slots stay TBD until a team is approved.
          {activeAge ? ` ${activeAge.teamCount} in.` : ""}
        </p>
      ) : (
        <>
          {!editable && schedule.awaitingPublish ? (
            <p className="mx-4 mt-4 rounded-lg border border-line bg-surface px-4 py-4 text-sm">
              This sheet isn’t published yet.
            </p>
          ) : null}
            <div className="shrink-0 border-b border-line px-3 py-2">
            {schedule.weekend.sheetLocked ? (
              <p className="mb-2 text-xs text-muted">
                Sheet is locked. A no-show forfeits that game. A club that pulls out forfeits the rest. A fill-in can take that same slot until first pitch.
              </p>
            ) : null}
            {days.length > 0 ? (
              <div
                className="grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
                role="tablist"
                aria-label="Days"
              >
                {days.map((row) => {
                  const on = activeDay?.date === row.date;
                  const [weekday, dateLabel] = formatDayTab(row.date).split(" · ");
                  const kind = row.kind === "pool" ? "Pool" : row.kind === "mixed" ? "Mixed" : "Bracket";
                  return (
                    <button
                      key={row.date}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setDay(row.date)}
                      className={cn(
                        "flex min-h-12 flex-col items-center justify-center rounded-lg border px-1 py-1.5 text-center",
                        on ? "border-ink bg-ink text-primary-fg" : "border-line bg-bg text-fg",
                      )}
                    >
                      <span className="font-display text-base font-bold uppercase leading-none tracking-wide">{weekday}</span>
                      <span className={cn("mt-1 text-xs leading-none", on ? "text-primary-fg/80" : "text-muted")}>
                        {dateLabel} · {kind}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
            {editable && schedule.weekend.publicPushedAt && (schedule.weekend.publicDirty || schedule.weekend.dirtyAfterLock) ? (
              <>
                <Button type="button" className="mt-2 w-full" disabled={pushMut.isPending} onClick={() => pushMut.mutate()}>
                  {pushMut.isPending ? "Pushing…" : "Push to parents"}
                </Button>
                {pushMut.error instanceof Error ? (
                  <p className="mt-2 text-sm" role="alert">{pushMut.error.message}</p>
                ) : null}
              </>
            ) : null}
            {activeAge && warnOpen && activeAge.warnings.length > 0 ? (
              <div className="mt-2 rounded-md border border-line bg-warn-bg px-3 py-2 text-sm" role="status">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{activeAge.warnings.length} schedule notes</p>
                  <button type="button" className="text-xs font-bold uppercase" onClick={() => setWarnOpen(false)}>
                    Hide
                  </button>
                </div>
                <ul className="mt-1 space-y-1">
                  {activeAge.warnings.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        className={cn(
                          "text-left text-xs underline-offset-2 hover:underline",
                          focusWarning === row.id && "font-semibold",
                        )}
                        onClick={() => {
                          setFocusWarning(row.id);
                          const game = activeAge.games.find((g) => g.id === row.gameId || row.gameIds?.includes(g.id));
                          if (game?.startDate) setDay(game.startDate);
                        }}
                      >
                        {row.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {fieldError || lockMut.error || rebuildMut.error || scoreMut.error || rainMut.error || sheetLockMut.error ? (
              <p className="mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
                {fieldError ??
                  (sheetLockMut.error instanceof Error
                    ? sheetLockMut.error.message
                    : lockMut.error instanceof Error
                    ? lockMut.error.message
                    : rebuildMut.error instanceof Error
                      ? rebuildMut.error.message
                      : scoreMut.error instanceof Error
                        ? scoreMut.error.message
                        : rainMut.error instanceof Error
                          ? rainMut.error.message
                          : "Could not update that bracket.")}
              </p>
            ) : null}
          </div>
            {showTree ? (
            <SheetZoom
              resetKey={`${activeAge.ageGroup}-${activeDay?.date ?? "day"}-${activeAge.teamCount}`}
            >
            <div className="px-3 py-2">
            <div className="mt-2 space-y-6">
              {showPools ? (
                poolGamesToday.length > 0 ? (
                  <PoolGrid
                    games={poolGamesToday}
                    rosterGames={activeAge.games.filter((game) => game.round === "pool")}
                    parks={schedule.locations}
                    editable={editable}
                    busy={fieldBusy}
                    fieldError={fieldError}
                    onField={(gameId, locationId) => fieldMut.mutate({ gameId, locationId })}
                    onAddField={(gameId, name, address) => addFieldMut.mutate({ gameId, name, address })}
                    onSwap={(gameId, teamAId, teamBId) => swapMut.mutate({ gameId, teamAId, teamBId })}
                    onScore={(gameId, homeScore, awayScore, forfeit) =>
                      scoreMut.mutate({ gameId, homeScore, awayScore, forfeit })
                    }
                    softFill={activeAge.softFill}
                    flaggedIds={flaggedIds}
                  />
                ) : (
                  <p className="text-sm text-muted">No pool games this day — they fit on another day.</p>
                )
              ) : null}
              {showTree ? (
                <SiteBoard
                  games={bracketGamesToday}
                  parks={schedule.locations}
                  playIns={hasPlayInRound(activeAge.games)}
                  firstRound={firstPlayableRound(activeAge.games)}
                  asOfDate={activeDay.date}
                  liveRound={liveBracketRound(
                    activeAge.games.filter((game) => game.round !== "pool"),
                    activeDay.date,
                  )}
                  allGames={activeAge.games}
                  editable={editable}
                  busy={fieldBusy}
                  fieldError={fieldError}
                  onField={(gameId, locationId) => fieldMut.mutate({ gameId, locationId })}
                  onAddField={(gameId, name, address) => addFieldMut.mutate({ gameId, name, address })}
                  onScore={(game) => setScoreGame(game)}
                  softFill={activeAge.softFill}
                  flaggedIds={flaggedIds}
                />
              ) : null}
            </div>
            </div>
        </SheetZoom>
            ) : (
            <div className="min-h-0 flex-1 overflow-auto px-3 py-2">
            <div className="mt-2 space-y-6">
              {showPools ? (
                poolGamesToday.length > 0 ? (
                  <PoolGrid
                    games={poolGamesToday}
                    rosterGames={activeAge.games.filter((game) => game.round === "pool")}
                    parks={schedule.locations}
                    editable={editable}
                    busy={fieldBusy}
                    fieldError={fieldError}
                    onField={(gameId, locationId) => fieldMut.mutate({ gameId, locationId })}
                    onAddField={(gameId, name, address) => addFieldMut.mutate({ gameId, name, address })}
                    onSwap={(gameId, teamAId, teamBId) => swapMut.mutate({ gameId, teamAId, teamBId })}
                    onScore={(gameId, homeScore, awayScore, forfeit) =>
                      scoreMut.mutate({ gameId, homeScore, awayScore, forfeit })
                    }
                    softFill={activeAge.softFill}
                    flaggedIds={flaggedIds}
                  />
                ) : (
                  <p className="text-sm text-muted">No pool games this day — they fit on another day.</p>
                )
              ) : (
                <p className="text-sm text-muted">No games this day.</p>
              )}
            </div>
            </div>
            )}
        </>
      )}
      {scoreGame && activeAge ? (
        <ScoreDialog
          games={[scoreGame]}
          busy={scoreMut.isPending}
          error={scoreMut.error instanceof Error ? scoreMut.error.message : null}
          onClose={() => setScoreGame(null)}
          onSave={(gameId, homeScore, awayScore, forfeit) =>
            scoreMut.mutate({ gameId, homeScore, awayScore, forfeit })
          }
        />
      ) : null}
    </div>
    </GameEditProvider>
  );
}
