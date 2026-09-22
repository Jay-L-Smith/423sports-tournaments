import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { PoolGrid, SiteBoard } from "@/components/bracket-board";
import { SheetZoom } from "@/components/sheet-zoom";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { RedirectToSignIn } from "@/lib/auth/gates";
import {
  addFieldToGame,
  getWeekendSchedule,
  setGameField,
  setSundaySeedsLocked,
  type ScheduleAge,
  type ScheduleGame,
} from "@/lib/pbi/api";
import { cn } from "@/lib/utils";
import { formatDayTab, parseDayPlan, type DayPlan } from "@/lib/pbi/weekends";
import {
  ALL_SITES,
  gamesAtSite,
  liveBracketRound,
  ROUND_IDS,
  shortParkName,
  sitesOnDay,
  type RoundId,
  type SiteFilter,
} from "@/lib/pbi/bracket";

export const Route = createFileRoute("/bracket/$weekendId")({
  component: BracketPage,
});

function daysFor(weekend: { startDate: string; endDate: string; poolPlay: boolean; dayPlan?: DayPlan[] }): DayPlan[] {
  return parseDayPlan(weekend.dayPlan, weekend.startDate, weekend.endDate, weekend.poolPlay);
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
  const lockMut = useMutation({
    mutationFn: (locked: boolean) => setSundaySeedsLocked({ data: { weekendId: id, locked } }),
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
  const need = activeAge?.minTeams ?? 3;
  const poolOn = Boolean(activeAge?.poolPlay);
  const days = schedule ? daysFor(schedule.weekend) : [];
  const activeDay = days.find((row) => row.date === day) ?? days[0] ?? null;
  const sitesToday =
    schedule && activeAge && activeDay
      ? sitesOnDay(schedule.locations, activeAge.games, activeDay.date)
      : [];
  const activeSite: SiteFilter =
    site === ALL_SITES
      ? ALL_SITES
      : site != null && sitesToday.some((row) => row.id === site)
        ? site
        : activeDay?.kind === "pool" || activeDay?.kind === "mixed"
          ? ALL_SITES
          : (sitesToday[0]?.id ?? ALL_SITES);
  const showAllSites = activeSite === ALL_SITES;
  const showPools = Boolean(
    showAllSites && activeDay && (activeDay.kind === "pool" || activeDay.kind === "mixed") && poolOn,
  );
  const showTree = Boolean(showAllSites && activeDay && (activeDay.kind === "bracket" || activeDay.kind === "mixed"));
  const poolGamesToday =
    activeAge && activeDay
      ? activeAge.games.filter(
          (game) => game.round === "pool" && !game.isBye && (game.startDate === activeDay.date || !game.startDate),
        )
      : [];
  const siteGames =
    activeAge && activeDay && !showAllSites
      ? gamesAtSite(activeAge.games, { date: activeDay.date, locationId: activeSite })
      : [];
  const liveRound = activeDay ? liveBracketRound(siteGames, activeDay.date) : null;
  const activePark = showAllSites ? null : (sitesToday.find((row) => row.id === activeSite) ?? null);
  const fieldBusy = fieldMut.isPending || addFieldMut.isPending;
  const fieldError =
    fieldMut.error instanceof Error
      ? fieldMut.error.message
      : addFieldMut.error instanceof Error
        ? addFieldMut.error.message
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

  return (
    <div className="sheet flex min-h-dvh flex-col bg-bg text-fg">
      <header className="sticky top-0 z-10 border-b border-line bg-bg px-3 py-2">
        <div className="flex items-center gap-2">
          {profile.homeRole === "admin" ? (
            <Link
              to="/weekends/$weekendId"
              params={{ weekendId: String(id) }}
              className="shrink-0 text-xs font-semibold text-fg underline-offset-4 hover:underline"
            >
              ← {schedule?.weekend.name ?? "Tournament"}
            </Link>
          ) : (
            <Link to="/schedule" className="shrink-0 text-xs font-semibold text-fg underline-offset-4 hover:underline">
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
            <p className="ml-auto text-[10px] font-bold uppercase tracking-wide text-muted">{activeAge.ageGroup}</p>
          ) : null}
        </div>
        {days.length > 1 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {days.map((row) => (
              <button
                key={row.date}
                type="button"
                onClick={() => setDay(row.date)}
                className={cn("sheet-chip", (activeDay?.date ?? "") === row.date && "sheet-chip-on")}
              >
                {formatDayTab(row.date)}
                <span className="opacity-70"> · {row.kind === "pool" ? "Pool" : row.kind === "mixed" ? "Mixed" : "Bracket"}</span>
              </button>
            ))}
          </div>
        ) : null}
        {sitesToday.length > 1 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {sitesToday.map((park) => (
              <button
                key={park.id}
                type="button"
                onClick={() => setSite(park.id)}
                className={cn("sheet-chip", activeSite === park.id && "sheet-chip-on")}
              >
                {shortParkName(park.name)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSite(ALL_SITES)}
              className={cn("sheet-chip", showAllSites && "sheet-chip-on")}
            >
              All parks
            </button>
          </div>
        ) : null}
      </header>

      {scheduleQuery.isPending ? (
        <p className="px-4 py-5 text-sm text-muted">Building the bracket…</p>
      ) : !schedule ? (
        <p className="mx-4 mt-4 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
          {scheduleQuery.error instanceof Error ? scheduleQuery.error.message : "Could not load that bracket."}
        </p>
      ) : !activeAge || activeAge.teamCount < need ? (
        <p className="mx-4 mt-4 rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
          Need {need} approved teams in this age for a bracket. {activeAge ? `${activeAge.teamCount} in.` : ""}
        </p>
      ) : (
        <SheetZoom
          resetKey={`${activeAge.ageGroup}-${activeDay?.date ?? "day"}-${activeSite}-${activeAge.teamCount}`}
        >
          <div className="px-3 py-2">
            <h1 className="sheet-title">{sheetTitle}</h1>
            {fieldMut.error || addFieldMut.error || lockMut.error ? (
              <p className="mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
                {(fieldMut.error || addFieldMut.error || lockMut.error) instanceof Error
                  ? (fieldMut.error || addFieldMut.error || lockMut.error)?.message
                  : "Could not update that bracket."}
              </p>
            ) : null}
            {poolOn && editable && activeDay && (activeDay.kind === "mixed" || activeDay.kind === "bracket") ? (
              <button
                type="button"
                className="mt-2 min-h-8 rounded-md border border-line bg-surface px-3 text-[11px] font-bold uppercase tracking-wide"
                disabled={lockMut.isPending}
                onClick={() => lockMut.mutate(!activeAge.sundaySeedsLocked)}
              >
                {activeAge.sundaySeedsLocked ? "Unlock bracket names" : "Lock pool seeds onto the bracket"}
              </button>
            ) : null}

            <div className="mt-2 space-y-6">
              {activePark ? (
                siteGames.length > 0 ? (
                  <SiteBoard
                    games={siteGames}
                    parks={schedule.locations}
                    playIns={activeAge.games.some(
                      (game) => game.round === firstPlayableRound(activeAge.games) && game.isBye,
                    )}
                    firstRound={firstPlayableRound(activeAge.games)}
                    asOfDate={activeDay.date}
                    liveRound={liveRound}
                    allGames={activeAge.games}
                    editable={editable}
                    busy={fieldBusy}
                    fieldError={fieldError}
                    onField={(gameId, locationId) => fieldMut.mutate({ gameId, locationId })}
                    onAddField={(gameId, name, address) => addFieldMut.mutate({ gameId, name, address })}
                  />
                ) : (
                  <p className="text-sm text-muted">No games at this park this day.</p>
                )
              ) : null}
              {showPools ? (
                poolGamesToday.length > 0 ? (
                  <PoolGrid
                    games={poolGamesToday}
                    parks={schedule.locations}
                    editable={editable}
                    busy={fieldBusy}
                    fieldError={fieldError}
                    onField={(gameId, locationId) => fieldMut.mutate({ gameId, locationId })}
                    onAddField={(gameId, name, address) => addFieldMut.mutate({ gameId, name, address })}
                  />
                ) : (
                  <p className="text-sm text-muted">No pool games this day — they fit on another day.</p>
                )
              ) : null}
              {showTree
                ? sitesToday.map((park) => {
                    const parkGames = gamesAtSite(activeAge.games, {
                      date: activeDay.date,
                      locationId: park.id,
                    });
                    const knockout = parkGames.filter((game) => game.round !== "pool");
                    if (knockout.length === 0) return null;
                    return (
                      <div key={park.id}>
                        <h2 className="sheet-title mb-2">{shortParkName(park.name)}</h2>
                        <SiteBoard
                          games={knockout}
                          parks={schedule.locations}
                          playIns={activeAge.games.some(
                            (game) => game.round === firstPlayableRound(activeAge.games) && game.isBye,
                          )}
                          firstRound={firstPlayableRound(activeAge.games)}
                          asOfDate={activeDay.date}
                          liveRound={liveBracketRound(knockout, activeDay.date)}
                          allGames={activeAge.games}
                          editable={editable}
                          busy={fieldBusy}
                          fieldError={fieldError}
                          onField={(gameId, locationId) => fieldMut.mutate({ gameId, locationId })}
                          onAddField={(gameId, name, address) => addFieldMut.mutate({ gameId, name, address })}
                        />
                      </div>
                    );
                  })
                : null}
            </div>
          </div>
        </SheetZoom>
      )}
    </div>
  );
}
