import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { PoolGrid, ScoreDialog, SiteBoard, GameEditProvider } from "@/components/bracket-board";
import { SheetZoom } from "@/components/sheet-zoom";
import { Button } from "@/components/ui/button";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { RedirectToSignIn } from "@/lib/auth/gates";
import {
  addFieldToGame,
  assignScorekeeper,
  getWeekendSchedule,
  listDirectory,
  markRainout,
  postGameScore,
  pullTeam,
  rebuildWeekendSchedule,
  replaceTeamSlot,
  revokeScorekeeper,
  setGameField,
  setSheetLock,
  setSundaySeedsLocked,
  swapPoolTeams,
  updateGameDetails,
  type ScheduleAge,
  type ScheduleGame,
} from "@/lib/pbi/api";

import { cn } from "@/lib/utils";
import { formatDayTab, parseDayPlan, type DayPlan } from "@/lib/pbi/weekends";
import {
  ALL_SITES,
  gamesAtSite,
  hasPlayInRound,
  liveBracketRound,
  ROUND_IDS,
  shortParkName,
  sitesOnDay,
  startBlocks,
  type RoundId,
  type SiteFilter,
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
  const [site, setSite] = useState<SiteFilter | null>(null);
  const [scoreGame, setScoreGame] = useState<ScheduleGame | null>(null);
  const [warnOpen, setWarnOpen] = useState(true);
  const [focusWarning, setFocusWarning] = useState<string | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [unlockArmed, setUnlockArmed] = useState(false);


  const scheduleQuery = useQuery({
    queryKey: ["schedule", id],
    queryFn: () => getWeekendSchedule({ data: { weekendId: id } }),
    enabled: Boolean(user && profile && Number.isInteger(id) && id > 0),
  });
  const directoryQuery = useQuery({
    queryKey: ["directory"],
    queryFn: () => listDirectory(),
    enabled: Boolean(user && profile?.homeRole === "admin"),
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
      setUnlockArmed(false);
      setCustomizeOpen(false);
    },
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
  const keepMut = useMutation({
    mutationFn: (input: { userId: string; scope: "weekend" | "field" | "field-day"; locationId?: number | null }) =>
      assignScorekeeper({ data: { weekendId: id, ...input } }),
    onSuccess: (data) => queryClient.setQueryData(["schedule", id], data),
  });
  const revokeMut = useMutation({
    mutationFn: (keeperId: number) => revokeScorekeeper({ data: { id: keeperId, weekendId: id } }),
    onSuccess: (data) => queryClient.setQueryData(["schedule", id], data),
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
  const sitesToday =
    schedule && activeAge && activeDay
      ? sitesOnDay(schedule.locations, activeAge.games, activeDay.date)
      : [];
  const activeSite: SiteFilter =
    site != null && site !== ALL_SITES && sitesToday.some((row) => row.id === site) ? site : ALL_SITES;
  const showAllSites = activeSite === ALL_SITES;
  const poolGamesToday =
    activeAge && activeDay
      ? activeAge.games.filter(
          (game) =>
            game.round === "pool" &&
            !game.isBye &&
            (game.startDate === activeDay.date || !game.startDate) &&
            (showAllSites || game.locationId === activeSite),
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
  const siteGames =
    activeAge && activeDay && !showAllSites
      ? gamesAtSite(activeAge.games, {
          date: activeDay.date,
          locationId: activeSite,
          onward: schedule?.weekend.rules.packDayFilter === false,
        })
      : [];
  const liveRound = activeDay ? liveBracketRound(siteGames, activeDay.date) : null;
  const activePark = showAllSites ? null : (sitesToday.find((row) => row.id === activeSite) ?? null);
  const fieldBusy = fieldMut.isPending || addFieldMut.isPending || swapMut.isPending;
  const fieldError =
    fieldMut.error instanceof Error
      ? fieldMut.error.message
      : addFieldMut.error instanceof Error
        ? addFieldMut.error.message
        : swapMut.error instanceof Error
          ? swapMut.error.message
          : null;

  const sheetTitle = !activeDay
    ? "Tournament bracket"
    : activePark
      ? `${formatDayTab(activeDay.date)} · ${activePark.name}`
      : showPools && !showTree
        ? `${formatDayTab(activeDay.date)} pool play`
        : showPools && showTree
          ? `${formatDayTab(activeDay.date)} · pool + bracket`
          : `${activeAge?.teamCount ?? ""}-team tournament bracket`.trim();

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
        {days.length > 0 ? (
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <label className="relative block">
              <select
                aria-label="Day"
                className="h-8 w-full appearance-none rounded-full border border-white/25 bg-white px-3 pr-8 text-xs font-bold uppercase tracking-wide text-[#1a1a1a]"
                value={activeDay?.date ?? ""}
                onChange={(event) => setDay(event.target.value)}
              >
                {days.map((row) => (
                  <option key={row.date} value={row.date}>
                    {formatDayTab(row.date)} · {row.kind === "pool" ? "Pool" : row.kind === "mixed" ? "Mixed" : "Bracket"}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#1a1a1a]">▾</span>
            </label>
            <label className="relative block">
              <select
                aria-label="Field"
                className="h-8 w-full appearance-none rounded-full border border-white/25 bg-white px-3 pr-8 text-xs font-bold uppercase tracking-wide text-[#1a1a1a]"
                value={showAllSites ? ALL_SITES : String(activeSite)}
                onChange={(event) => {
                  const value = event.target.value;
                  setSite(value === ALL_SITES ? ALL_SITES : Number(value));
                }}
              >
                <option value={ALL_SITES}>All Fields</option>
                {sitesToday.map((park) => (
                  <option key={park.id} value={park.id}>
                    {park.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#1a1a1a]">▾</span>
            </label>
          </div>
        ) : null}
      </header>

      {scheduleQuery.isPending ? (
        <p className="px-4 py-5 text-sm text-muted">Building the bracket…</p>
      ) : !schedule ? (
        <p className="mx-4 mt-4 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
          {scheduleQuery.error instanceof Error ? scheduleQuery.error.message : "Could not load that bracket."}
        </p>
      ) : !activeAge || (!activeAge.hasBracket && activeAge.teamCount < 2) ? (
        <p className="mx-4 mt-4 rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
          The bracket draws for the size you set. Open slots stay Team A, Team B, and so on until teams sign up.
          {activeAge ? ` ${activeAge.teamCount} in.` : ""}
        </p>
      ) : (
        <>
          {editable && activeAge && !schedule.weekend.sheetLocked && !schedule.weekend.bracketLocked && activeAge.seeds.some((seed) => seed.teamId == null) ? (
            <div className="mx-3 mt-3 rounded-lg border border-line bg-surface px-4 py-3">
              <p className="text-sm font-semibold">Open slots are still Team A, Team B, and so on.</p>
              <p className="mt-1 text-xs text-muted">
                {activeAge.teamCount} of {activeAge.seeds.length} slots have a team. Redraw before you lock the tournament and it uses only the teams that signed up.
              </p>
              <Button
                type="button"
                className="mt-3 w-full"
                disabled={rebuildMut.isPending}
                onClick={() => rebuildMut.mutate({ ageGroup: activeAge.ageGroup, mode: "fit" })}
              >
                {rebuildMut.isPending ? "Redrawing…" : "Redraw for signed-up teams"}
              </Button>
            </div>
          ) : null}
          <div className="shrink-0 border-b border-line px-3 py-2">
            {schedule.weekend.sheetLocked ? (
              <p className="mb-1 text-xs text-muted">
                Sheet is locked. A no-show forfeits that game. A club that pulls out forfeits the rest. A fill-in can take that same slot until first pitch.
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <h1 className="sheet-title min-w-0">{sheetTitle}</h1>
              {editable && activeAge ? (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    className="h-8 rounded-full border border-line bg-surface px-3 text-[11px] font-bold uppercase tracking-wide"
                    aria-expanded={customizeOpen}
                    onClick={() => setCustomizeOpen((open) => !open)}
                  >
                    Customize ▾
                  </button>
                  {customizeOpen ? (
                    <>
                      <button
                        type="button"
                        aria-label="Close customize"
                        className="fixed inset-0 z-10 cursor-default"
                        onClick={() => setCustomizeOpen(false)}
                      />
                      <div className="absolute right-0 z-20 mt-1 max-h-[70vh] w-72 overflow-auto rounded-md border border-line bg-bg p-1 shadow-lg">
                      {schedule.weekend.sheetLocked ? (
                        <button
                          type="button"
                          className="block w-full rounded px-2 py-2 text-left text-xs font-bold uppercase tracking-wide hover:bg-surface"
                          disabled={sheetLockMut.isPending}
                          onClick={() => {
                            if (!unlockArmed) {
                              setUnlockArmed(true);
                              return;
                            }
                            sheetLockMut.mutate("off");
                          }}
                        >
                          {unlockArmed ? "Unlock. Times and parks can move." : "Unlock the sheet"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="block w-full rounded px-2 py-2 text-left text-xs font-bold uppercase tracking-wide hover:bg-surface"
                          disabled={sheetLockMut.isPending}
                          onClick={() => sheetLockMut.mutate("on")}
                        >
                          Lock the sheet
                        </button>
                      )}
                      {!schedule.weekend.sheetLocked && !activeAge.hasBracket ? (
                        <button
                          type="button"
                          className="block w-full rounded px-2 py-2 text-left text-xs font-bold uppercase tracking-wide hover:bg-surface"
                          disabled={rebuildMut.isPending}
                          onClick={() => {
                            setCustomizeOpen(false);
                            rebuildMut.mutate({ ageGroup: activeAge.ageGroup, mode: "bracket" });
                          }}
                        >
                          {rebuildMut.isPending ? "Building…" : `Build bracket · ${activeAge.teamCount} teams`}
                        </button>
                      ) : null}
                      {!schedule.weekend.sheetLocked && activeAge.hasBracket ? (
                        <button
                          type="button"
                          className="block w-full rounded px-2 py-2 text-left text-xs font-bold uppercase tracking-wide hover:bg-surface"
                          disabled={rebuildMut.isPending}
                          onClick={() => {
                            setCustomizeOpen(false);
                            rebuildMut.mutate({ ageGroup: activeAge.ageGroup, mode: "repack" });
                          }}
                        >
                          {rebuildMut.isPending ? "Rebuilding…" : "Rebuild from rules"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="block w-full rounded px-2 py-2 text-left text-xs font-bold uppercase tracking-wide hover:bg-surface"
                        onClick={() => {
                          setCustomizeOpen(false);
                          const first = activeAge.games.find((g) => !g.isBye);
                          if (first) rainMut.mutate({ gameId: first.id, action: "mark" });
                        }}
                      >
                        Rainout
                      </button>
                      {poolOn && activeDay && (activeDay.kind === "mixed" || activeDay.kind === "bracket") ? (
                        <button
                          type="button"
                          className="block w-full rounded px-2 py-2 text-left text-xs font-bold uppercase tracking-wide hover:bg-surface"
                          disabled={lockMut.isPending}
                          onClick={() => {
                            setCustomizeOpen(false);
                            lockMut.mutate(!activeAge.sundaySeedsLocked);
                          }}
                        >
                          {activeAge.sundaySeedsLocked ? "Unlock bracket names" : "Lock pool seeds"}
                        </button>
                      ) : null}
                      <div className="mt-1 border-t border-line px-2 py-2">
                        <p className="text-[11px] font-bold uppercase tracking-wide">Scorekeepers</p>
                        <ul className="mt-1 space-y-2">
                          {schedule.locations.map((park) => {
                            const keepers = (schedule.scorekeepers ?? []).filter(
                              (row) => row.scope === "field" && row.locationId === park.id,
                            );
                            return (
                              <li key={park.id}>
                                <p className="text-[11px] font-semibold">{park.name}</p>
                                {keepers.map((row) => (
                                  <div key={row.id} className="mt-0.5 flex items-center justify-between gap-2 text-[11px]">
                                    <span className="min-w-0 truncate">{row.email || row.userId}</span>
                                    <button
                                      type="button"
                                      className="shrink-0 font-bold uppercase"
                                      onClick={() => revokeMut.mutate(row.id)}
                                    >
                                      Revoke
                                    </button>
                                  </div>
                                ))}
                                <select
                                  className="mt-1 h-8 w-full rounded-md border border-line bg-bg px-2 text-[11px]"
                                  defaultValue=""
                                  onChange={(event) => {
                                    const userId = event.target.value;
                                    if (userId) {
                                      keepMut.mutate({ userId, scope: "field", locationId: park.id });
                                    }
                                    event.target.value = "";
                                  }}
                                >
                                  <option value="">Assign…</option>
                                  {(directoryQuery.data ?? []).map((row) => (
                                    <option key={row.userId} value={row.userId}>
                                      {row.email}
                                    </option>
                                  ))}
                                </select>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
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
                          if (game?.locationId != null) setSite(game.locationId);
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
              resetKey={`${activeAge.ageGroup}-${activeDay?.date ?? "day"}-${activeSite}-${activeAge.teamCount}`}
            >
            <div className="px-3 py-2">
            <div className="mt-2 space-y-6">
              {activePark ? (
                siteGames.length > 0 ? (
                  <SiteBoard
                    games={siteGames}
                    parks={schedule.locations}
                    playIns={hasPlayInRound(activeAge.games)}
                    firstRound={firstPlayableRound(activeAge.games)}
                    asOfDate={activeDay.date}
                    liveRound={liveRound}
                    allGames={activeAge.games}
                    editable={editable}
                    busy={fieldBusy}
                    fieldError={fieldError}
                    onField={(gameId, locationId) => fieldMut.mutate({ gameId, locationId })}
                    onAddField={(gameId, name, address) => addFieldMut.mutate({ gameId, name, address })}
                    onSwap={(gameId, teamAId, teamBId) => swapMut.mutate({ gameId, teamAId, teamBId })}
                    onPostScore={(gameId, homeScore, awayScore, forfeit) =>
                      scoreMut.mutate({ gameId, homeScore, awayScore, forfeit })
                    }
                    onScore={(game) => setScoreGame(game)}
                    softFill={activeAge.softFill}
                    flaggedIds={flaggedIds}
                  />
                ) : (
                  <p className="text-sm text-muted">No games at this park this day.</p>
                )
              ) : null}
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
              {showTree && showAllSites ? (
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
