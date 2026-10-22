import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PoolGrid, ScoreDialog, SiteBoard, GameEditProvider, dayHeading } from "@/components/bracket-board";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SheetZoom } from "@/components/sheet-zoom";
import { SessionSkeleton, useAppSession } from "@/components/session-gate";
import { RedirectToSignIn } from "@/lib/auth/gates";
import {
  addFieldToGame,
  getLiveSheet,
  getWeekendSchedule,
  liveSheetStamp,
  markRainout,
  postGameScore,
  pullTeam,
  pushPublicSheet,
  recordShareBeat,
  recordShareOpen,
  replaceTeamSlot,
  setGameField,
  setSheetLock,
  resetEnteredSheet,
  setSundaySeedsLocked,
  shareLinkCount,
  swapPoolTeams,
  placePoolTeam,
  updateGameDetails,
  type ScheduleAge,
  type ScheduleGame,
  type WeekendSchedule,
} from "@/lib/pbi/api";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDayTab, formatWeekendRange, liveLinkOpen, parseDayPlan, type DayPlan } from "@/lib/pbi/weekends";
import { isSuperuserOwner } from "@/lib/pbi/roles";
import { TIEBREAKER_LABELS, type Tiebreaker } from "@/lib/pbi/rules";
import {
  hasPlayInRound,
  poolStandings,
  ROUND_IDS,
  startBlocks,
  type PoolGameResult,
  type RoundId,
} from "@/lib/pbi/bracket";

export const Route = createFileRoute("/bracket/$weekendId")({
  validateSearch: (search: Record<string, unknown>) => ({
    live: search.live === "1" || search.live === 1 || search.live === true,
    view: search.view === "pool" || search.view === "standings" || search.view === "bracket" ? search.view : undefined,
  }),
  component: BracketPage,
});

function BracketPage() {
  const { live } = Route.useSearch();
  if (live) return <LiveSheet />;
  return <DirectorBracket />;
}

function CoachBracketWait({
  name,
  startDate,
  endDate,
  ages,
  teamsIn,
  teamsNeeded,
}: {
  name: string;
  startDate: string;
  endDate: string;
  ages: string[];
  teamsIn: number;
  teamsNeeded: number;
}) {
  const ready = teamsIn >= teamsNeeded;
  return (
    <section className="mx-4 mt-6 overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
      <div className="bg-[#1c1c1c] px-4 py-5 text-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f5c518]">You're in</p>
        <h1 className="mt-2 font-display text-3xl font-bold uppercase leading-none">{name}</h1>
        <p className="mt-3 text-sm text-white/75">{formatWeekendRange(startDate, endDate)}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 pt-4">
        <div className="rounded-md bg-[#f6f1e4] px-3 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Age</p>
          <p className="mt-1 font-display text-2xl font-bold leading-none">{ages.length > 0 ? ages.join(" · ") : "Set"}</p>
        </div>
        <div className="rounded-md bg-[#f6f1e4] px-3 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Teams in</p>
          <p className="mt-1 font-display text-2xl font-bold leading-none">{teamsIn}</p>
        </div>
      </div>
      <p className="px-4 py-4 text-sm leading-relaxed">
        {ready
          ? "Enough teams are in. Pool play, standings, and the bracket will show on this page as soon as they are drawn."
          : `The bracket is drawn once ${teamsNeeded} teams are in, so every team has a real path through pool play. Your team is already on the list.`}
      </p>
    </section>
  );
}

function daysFor(
  weekend: { startDate: string; endDate: string; poolPlay: boolean; dayPlan?: DayPlan[] },
  games: { startDate: string | null }[] = [],
): DayPlan[] {
  const usedDates = new Set(games.map((game) => game.startDate).filter((date): date is string => Boolean(date)));
  const plan = parseDayPlan(weekend.dayPlan, weekend.startDate, weekend.endDate, weekend.poolPlay);
  const seen = new Set(plan.map((row) => row.date));
  const extra: DayPlan[] = [];
  for (const game of games) {
    if (!game.startDate || seen.has(game.startDate)) continue;
    if (game.startDate < weekend.startDate || game.startDate > weekend.endDate) continue;
    seen.add(game.startDate);
    extra.push({ date: game.startDate, kind: "bracket" });
  }
  const days = [...plan, ...extra].sort((a, b) => a.date.localeCompare(b.date));
  if (usedDates.size === 0) return days;
  const kept = days.filter((row) => usedDates.has(row.date));
  return kept.length > 0 ? kept : days;
}

function firstPlayableRound(games: ScheduleGame[]): RoundId | null {
  return ROUND_IDS.find((round) => games.some((game) => game.round === round)) ?? null;
}

type SheetView = "standings" | "pool" | "bracket";

type StandingKey = "wins" | "losses" | "ties" | "rs" | "rd" | "ra";

function standingColumns(tiebreakers: Tiebreaker[]): { key: StandingKey; label: string }[] {
  const columns: { key: StandingKey; label: string }[] = [];
  for (const key of tiebreakers) {
    if (key === "record") columns.push({ key: "wins", label: "W" }, { key: "losses", label: "L" }, { key: "ties", label: "T" });
    else if (key === "runs-scored") columns.push({ key: "rs", label: "RS" });
    else if (key === "run-diff") columns.push({ key: "rd", label: "RD" });
    else if (key === "runs-allowed") columns.push({ key: "ra", label: "RA" });
  }
  return columns;
}

function standingValue(row: { wins: number; losses: number; ties: number; rs: number; rd: number; ra: number }, key: StandingKey) {
  if (key !== "rd") return String(row[key]);
  if (row.rd > 0) return `+${row.rd}`;
  return String(row.rd);
}

function poolResults(games: ScheduleGame[]): PoolGameResult[] {
  return games.flatMap((game) =>
    game.homeTeamId != null && game.awayTeamId != null
      ? [{
          homeTeamId: game.homeTeamId,
          awayTeamId: game.awayTeamId,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          forfeit: game.forfeit,
        }]
      : [],
  );
}

function NoPinch() {
  useEffect(() => {
    const block = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };
    document.addEventListener("touchmove", block, { passive: false });
    return () => document.removeEventListener("touchmove", block);
  }, []);
  return null;
}

function StandingsTable({
  age,
  tiebreakers,
  seedOnePlaysLast,
}: {
  age: ScheduleAge;
  tiebreakers: Tiebreaker[];
  seedOnePlaysLast: boolean;
}) {
  const poolGames = age.games.filter((game) => game.round === "pool" && !game.isBye);
  const names = new Map<number, string>();
  const teamIds: number[] = [];
  for (const seed of [...age.seeds].sort((a, b) => a.seed - b.seed)) {
    if (seed.teamId == null || teamIds.includes(seed.teamId)) continue;
    teamIds.push(seed.teamId);
    if (seed.teamName) names.set(seed.teamId, seed.teamName);
  }
  for (const game of poolGames) {
    const sides = [
      [game.homeTeamId, game.homeName],
      [game.awayTeamId, game.awayName],
    ] as const;
    for (const [id, name] of sides) {
      if (id == null) continue;
      if (!teamIds.includes(id)) teamIds.push(id);
      if (name) names.set(id, name);
    }
  }
  const rows = poolStandings(teamIds, poolResults(poolGames), tiebreakers);
  const columns = standingColumns(tiebreakers);
  const playable = poolGames.filter((game) => game.homeTeamId != null && game.awayTeamId != null);
  const done = playable.length > 0 && playable.every((game) => (game.homeScore != null && game.awayScore != null) || game.forfeit || game.noContest);
  const [rulesOpen, setRulesOpen] = useState(false);
  const rules = (
    <>
      <p className="text-sm text-muted">
        {done
          ? "Pool is finished. This order is the bracket seed."
          : "This order is not locked yet. It becomes the bracket seed when every pool game has a score."}
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
        {tiebreakers.map((key) => (
          <li key={key}>{TIEBREAKER_LABELS[key]}</li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-muted">
        {seedOnePlaysLast
          ? "In the bracket, seed 1 plays the last seed and seed 2 plays the next. The better seed is home."
          : "In the bracket, seeds play in order. The better seed is home."}
      </p>
    </>
  );
  return (
    <div>
      <button
        type="button"
        onClick={() => setRulesOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold normal-case tracking-normal text-muted"
      >
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-current text-[9px] font-bold leading-none">i</span>
        Seeding rules
      </button>
      {rows.length === 0 ? <p className="mt-4 text-sm text-muted">No teams in pool play yet.</p> : (
      <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[22rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[10px] font-bold uppercase tracking-wide text-muted">
            <th className="py-2 pr-2">Seed</th>
            <th className="py-2 pr-2">Team</th>
            {columns.map((column) => (
              <th key={column.key} className="px-1.5 py-2 text-right tabular-nums">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.teamId} className="border-b border-line">
              <td className="py-2 pr-2 font-bold">{row.place}</td>
              <td className="max-w-[9rem] truncate py-2 pr-2 font-semibold">{names.get(row.teamId) ?? "Team"}</td>
              {columns.map((column) => (
                <td key={column.key} className="px-1.5 py-2 text-right tabular-nums">{standingValue(row, column.key)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      )}
      {rulesOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-scrim p-4" onClick={() => setRulesOpen(false)}>
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="seeding-rules-title"
                className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 id="seeding-rules-title" className="font-display text-2xl font-bold uppercase">Seeding rules</h2>
                  <Button type="button" variant="ghost" className="px-2 text-muted" onClick={() => setRulesOpen(false)}>
                    Close
                  </Button>
                </div>
                <div className="mt-3">{rules}</div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function DirectorBracket() {
  const { weekendId } = Route.useParams();
  const id = Number.parseInt(weekendId, 10);
  const { user, isPending, profile } = useAppSession();
  const queryClient = useQueryClient();
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [view, setView] = useState<SheetView | null>(null);
  const [scoreGame, setScoreGame] = useState<ScheduleGame | null>(null);
  const [warnOpen, setWarnOpen] = useState(false);
  const [focusWarning, setFocusWarning] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareWait, setShareWait] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ask, setAsk] = useState<{ text: string; yes: () => void } | null>(null);


  const scheduleQuery = useQuery({
    queryKey: ["schedule", id],
    queryFn: () => getWeekendSchedule({ data: { weekendId: id } }),
    enabled: Boolean(user && profile && Number.isInteger(id) && id > 0),
  });
  const seeShareCount = Boolean(profile && profile.homeRole === "admin" && isSuperuserOwner(profile.email));
  const shareCountQuery = useQuery({
    queryKey: ["share-count", id],
    queryFn: () => shareLinkCount({ data: { weekendId: id } }),
    enabled: seeShareCount && Number.isInteger(id) && id > 0,
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
    mutationFn: (input: { gameId: number; otherGameId?: number; teamAId: number; teamBId: number; scope: "game" | "all"; confirm?: boolean }) =>
      swapPoolTeams({
        data: input,
      }),
    onSuccess: (data) => queryClient.setQueryData(["schedule", id], data),
  });
  const placeMut = useMutation({
    mutationFn: (input: { gameId: number; teamId: number; locationId: number | null; startDate: string; startTime: string; intoGameId?: number; confirm?: boolean }) =>
      placePoolTeam({ data: input }),
    onSuccess: (data) => queryClient.setQueryData(["schedule", id], data),
  });
  const lockMut = useMutation({
    mutationFn: (locked: boolean) => setSundaySeedsLocked({ data: { weekendId: id, locked } }),
    onSuccess: (data) => queryClient.setQueryData(["schedule", id], data),
  });
  const scoreMut = useMutation({
    mutationFn: (input: { gameId: number; homeScore: number; awayScore: number; forfeit?: "home" | "away" | null; clear?: boolean; called?: boolean }) =>
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
  const resetMut = useMutation({
    mutationFn: () => resetEnteredSheet({ data: { weekendId: id } }),
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
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: ["schedule", id] });
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
  const flaggedIds =
    editable && activeAge
      ? [
          ...new Set(
            activeAge.warnings
              .filter((row) => focusWarning == null || row.id === focusWarning)
              .flatMap((row) => row.gameIds ?? (row.gameId != null ? [row.gameId] : [])),
          ),
        ]
      : [];
  const poolOn = Boolean(activeAge?.poolPlay);
  const poolGames = activeAge ? activeAge.games.filter((game) => game.round === "pool" && !game.isBye) : [];
  const bracketGames = activeAge ? activeAge.games.filter((game) => game.round !== "pool") : [];
  const activeView: SheetView = !poolOn ? "bracket" : (view ?? "pool");
  const sheetDate = schedule?.weekend.endDate ?? "";
  const poolDates = [...new Set(poolGames.map((game) => game.startDate).filter((date): date is string => Boolean(date)))].sort();
  const sheetDayLabel = poolDates.length === 1 ? dayHeading(poolDates[0]!) : "";
  const days = schedule ? daysFor(schedule.weekend, schedule.ages.flatMap((age) => age.games)) : [];
  const fieldBusy = fieldMut.isPending || addFieldMut.isPending || swapMut.isPending || placeMut.isPending || scoreMut.isPending;
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

  const sheetActions = !schedule ? null : (
    <>
      {editable && !schedule.weekend.sheetLocked ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={resetMut.isPending}
          onClick={() =>
            setAsk({
              text: "Reset this sheet to the default? Each pool goes back on its own field. Saturday stays pool. Sunday stays the bracket. Hand-moved times on this sheet go back.",
              yes: () => resetMut.mutate(),
            })
          }
        >
          {resetMut.isPending ? "Resetting…" : "Reset sheet"}
        </Button>
      ) : null}
      {editable && !schedule.weekend.sheetLocked ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={sheetLockMut.isPending}
          onClick={() =>
            setAsk({
              text: "Lock this tournament so you can share the live sheet with coaches and parents?",
              yes: () => sheetLockMut.mutate("on"),
            })
          }
        >
          {sheetLockMut.isPending ? "Locking…" : "Lock to share"}
        </Button>
      ) : null}
      {editable && schedule.weekend.sheetLocked ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={sheetLockMut.isPending}
            onClick={() => {
              setAsk({
                text: "Unlock this tournament? The live link turns off until you lock it again.",
                yes: () => sheetLockMut.mutate("off"),
              });
            }}
          >
            {sheetLockMut.isPending ? "Unlocking…" : "Unlock"}
          </Button>
          {liveLinkOpen({
            locked: true,
            closesAt: schedule.weekend.liveLinksCloseAt ? new Date(schedule.weekend.liveLinksCloseAt) : null,
          }) ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setCopied(false);
                setShareOpen(true);
              }}
            >
              Share
            </Button>
          ) : null}
        </>
      ) : null}
      {!editable && (!schedule.weekend.sheetLocked || liveLinkOpen({
        locked: true,
        closesAt: schedule.weekend.liveLinksCloseAt ? new Date(schedule.weekend.liveLinksCloseAt) : null,
      })) ? (
        <Button
          type="button"
          size="sm"
          onClick={() => {
            if (!schedule.weekend.sheetLocked) {
              setShareWait(true);
              return;
            }
            setCopied(false);
            setShareOpen(true);
          }}
        >
          Share
        </Button>
      ) : null}
      {editable && schedule.weekend.publicPushedAt && (schedule.weekend.publicDirty || schedule.weekend.dirtyAfterLock) ? (
        <Button type="button" size="sm" disabled={pushMut.isPending} onClick={() => pushMut.mutate()}>
          {pushMut.isPending ? "Pushing…" : "Push to parents"}
        </Button>
      ) : null}
    </>
  );

  return (
    <GameEditProvider value={gameEdit}>
    <div className="sheet flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-bg text-fg">
      <header className="sheet-top sticky top-0 z-10 bg-[#1c1c1c] px-3 py-2 text-white">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 text-[11px] font-semibold leading-snug">
            <Link
              to="/weekends/$weekendId"
              params={{ weekendId: String(id) }}
              className="underline-offset-4 hover:underline"
            >
              ← {schedule?.weekend.name ?? "Tournament"}
            </Link>
            {ages.length <= 1 && activeAge ? <span> {activeAge.ageGroup}</span> : null}
            {sheetDayLabel ? <span className="font-normal text-white/70"> – {sheetDayLabel}</span> : null}
          </p>
          {ages.length > 1 ? (
            <div className="flex shrink-0 flex-wrap justify-end gap-1">
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
          ) : null}
          {sheetActions ? <div className="sheet-banner-actions flex shrink-0 items-center gap-1.5">{sheetActions}</div> : null}
        </div>
      </header>
      {seeShareCount && shareCountQuery.data ? (
        <p className="bg-[#1c1c1c] px-3 pb-1.5 text-[11px] text-white/70">
          {shareCountQuery.data.count === 1
            ? "1 person opened the share link"
            : `${shareCountQuery.data.count} people opened the share link`}
        </p>
      ) : null}

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
      ) : !editable && !schedule.weekend.sheetLocked ? (
        <p className="mx-4 mt-4 rounded-lg border border-line bg-surface px-4 py-4 text-sm">
          Pool play, standings, and the bracket will show once this tournament is locked.
        </p>
      ) : !activeAge || (!activeAge.hasBracket && activeAge.teamCount < 2) ? (
        editable ? (
          <p className="mx-4 mt-4 rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">
            The bracket is the size you set. Open slots stay TBD until a team is approved.
            {activeAge ? ` ${activeAge.teamCount} in.` : ""}
          </p>
        ) : (
          <CoachBracketWait
            name={schedule.weekend.name}
            startDate={schedule.weekend.startDate}
            endDate={schedule.weekend.endDate}
            ages={schedule.weekend.ageGroups}
            teamsIn={activeAge?.teamCount ?? schedule.weekend.approvedCount}
            teamsNeeded={Math.max(schedule.weekend.rules?.minTeams ?? 3, 3)}
          />
        )
      ) : (
        <>
          {!editable && schedule.awaitingPublish ? (
            <p className="mx-4 mt-4 rounded-lg border border-line bg-surface px-4 py-4 text-sm">
              This sheet isn’t published yet.
            </p>
          ) : null}
            <div className="sheet-tabs shrink-0 border-b border-line bg-bg px-3 pt-2">
            {poolOn ? (
              <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label="Sheet">
                {([
                  ["pool", "Pool Play"],
                  ["standings", "Standings"],
                  ["bracket", "Bracket"],
                ] as const).map(([key, label]) => {
                  const on = activeView === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setView(key)}
                      className={cn(
                        "flex min-h-12 items-center justify-center rounded-lg border px-1 text-center font-display text-sm font-bold uppercase tracking-wide",
                        on ? "border-ink bg-ink text-primary-fg" : "border-line bg-bg text-fg",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {pushMut.error instanceof Error ? (
              <p className="mt-2 text-sm" role="alert">{pushMut.error.message}</p>
            ) : null}
            {fieldError || lockMut.error || scoreMut.error || rainMut.error || sheetLockMut.error || resetMut.error || placeMut.error ? (
              <p className="mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
                {fieldError ??
                  (sheetLockMut.error instanceof Error
                    ? sheetLockMut.error.message
                    : resetMut.error instanceof Error
                      ? resetMut.error.message
                    : lockMut.error instanceof Error
                    ? lockMut.error.message
                    : scoreMut.error instanceof Error
                        ? scoreMut.error.message
                        : rainMut.error instanceof Error
                          ? rainMut.error.message
                          : placeMut.error instanceof Error
                            ? placeMut.error.message
                            : "Could not update that bracket.")}
              </p>
            ) : null}
          </div>
            {activeView === "bracket" ? (
            <SheetZoom resetKey={`${activeAge.ageGroup}-bracket-${activeAge.teamCount}`}>
            <div className="px-3 py-2">
                <SiteBoard
                  games={bracketGames}
                  parks={schedule.locations}
                  playIns={hasPlayInRound(activeAge.games)}
                  firstRound={firstPlayableRound(activeAge.games)}
                  asOfDate={sheetDate}
                  liveRound={ROUND_IDS.slice().reverse().find((round) => bracketGames.some((game) => game.round === round)) ?? null}
                  allGames={activeAge.games}
                  weekendId={id}
                  editable={editable}
                  busy={fieldBusy}
                  fieldError={fieldError}
                  onField={(gameId, locationId) => {
                    if (schedule.weekend.sheetLocked) {
                      setAsk({
                        text: "The pool and bracket are locked. This only moves this one game. It does not rebuild the sheet. Change the field anyway?",
                        yes: () => fieldMut.mutate({ gameId, locationId }),
                      });
                      return;
                    }
                    fieldMut.mutate({ gameId, locationId });
                  }}
                  onAddField={(gameId, name, address) => addFieldMut.mutate({ gameId, name, address })}
                  onScore={(game) => setScoreGame(game)}
                  softFill={activeAge.softFill}
                  flaggedIds={flaggedIds}
                />
            </div>
            </SheetZoom>
            ) : (
            <div className="min-h-0 flex-1 overflow-auto overscroll-y-contain px-3 pb-2">
              <NoPinch />
              {activeView === "standings" ? (
                <StandingsTable
                  age={activeAge}
                  tiebreakers={schedule.weekend.rules.tiebreakers}
                  seedOnePlaysLast={schedule.weekend.rules.packSeed1vsLast}
                />
              ) : poolGames.length > 0 ? (
                <PoolGrid
                  games={poolGames}
                  rosterGames={poolGames}
                  parks={schedule.locations}
                  editable={editable}
                  dayBar={false}
                  busy={fieldBusy}
                  fieldError={fieldError ?? (scoreMut.error instanceof Error ? scoreMut.error.message : null)}
                  onField={(gameId, locationId) => {
                    if (schedule.weekend.sheetLocked) {
                      setAsk({
                        text: "The pool and bracket are locked. This only moves this one game. It does not rebuild the sheet. Change the field anyway?",
                        yes: () => fieldMut.mutate({ gameId, locationId }),
                      });
                      return;
                    }
                    fieldMut.mutate({ gameId, locationId });
                  }}
                  onAddField={(gameId, name, address) => addFieldMut.mutate({ gameId, name, address })}
                  onPlace={(input) => {
                    if (schedule.weekend.sheetLocked) {
                      setAsk({
                        text: "The pool and bracket are locked. Moving this team changes who plays who. Put them in that slot anyway?",
                        yes: () => placeMut.mutate({ ...input, confirm: true }),
                      });
                      return;
                    }
                    placeMut.mutate(input);
                  }}
                  onSwap={(gameId, teamAId, teamBId, scope, otherGameId) => {
                    if (schedule.weekend.sheetLocked) {
                      setAsk({
                        text: "The pool and bracket are locked. Moving these teams changes who plays who. Scores already posted stay on that game. Move them anyway?",
                        yes: () => swapMut.mutate({ gameId, otherGameId, teamAId, teamBId, scope, confirm: true }),
                      });
                      return;
                    }
                    swapMut.mutate({ gameId, otherGameId, teamAId, teamBId, scope, confirm: schedule.weekend.sheetLocked });
                  }}
                  onScore={(gameId, homeScore, awayScore, forfeit, clear, called) =>
                    scoreMut.mutateAsync({ gameId, homeScore, awayScore, forfeit, clear, called })
                  }
                  softFill={activeAge.softFill}
                  flaggedIds={flaggedIds}
                  weekendId={id}
                />
              ) : (
                <p className="text-sm text-muted">No pool games yet.</p>
              )}
            </div>
            )}
            {editable && activeAge && activeAge.warnings.length > 0 ? (
              <div className="mx-3 mt-3 rounded-md border border-line bg-warn-bg px-3 py-2 text-sm" role="status">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 text-left"
                  onClick={() => setWarnOpen((open) => !open)}
                >
                  <span className="font-semibold">{activeAge.warnings.length} schedule notes</span>
                  <span className="text-xs font-bold uppercase">{warnOpen ? "Hide" : "Show"}</span>
                </button>
                {warnOpen ? (
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
                          if (game?.round === "pool") setView("pool");
                          else if (game) setView("bracket");
                        }}
                      >
                        {row.text}
                      </button>
                    </li>
                  ))}
                </ul>
                ) : null}
              </div>
            ) : null}
        </>
      )}
      {shareWait ? (
        <ConfirmDialog
          okOnly
          text="This tournament will be shareable as soon as it is locked by an admin."
          onNo={() => setShareWait(false)}
          onYes={() => setShareWait(false)}
        />
      ) : null}
      {ask ? (
        <ConfirmDialog
          text={ask.text}
          onNo={() => setAsk(null)}
          onYes={() => {
            const yes = ask.yes;
            setAsk(null);
            yes();
          }}
        />
      ) : null}
      {scoreGame && activeAge ? (
        <ScoreDialog
          games={[scoreGame]}
          busy={scoreMut.isPending}
          error={scoreMut.error instanceof Error ? scoreMut.error.message : null}
          onClose={() => setScoreGame(null)}
          onSave={(gameId, homeScore, awayScore, forfeit, clear) =>
            scoreMut.mutate({ gameId, homeScore, awayScore, forfeit, clear })
          }
        />
      ) : null}
      {shareOpen && schedule ? (
        <ShareLive
          name={schedule.weekend.name}
          url={liveSheetUrl(id, activeView)}
          copied={copied}
          onCopied={() => setCopied(true)}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </div>
    </GameEditProvider>
  );
}

function liveSheetUrl(id: number, view: SheetView) {
  const path = `/bracket/${id}?live=1&view=${view}`;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

function ShareLive({
  name,
  url,
  copied,
  onCopied,
  onClose,
}: {
  name: string;
  url: string;
  copied: boolean;
  onCopied: () => void;
  onClose: () => void;
}) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    onCopied();
  }
  function text() {
    const body = `${name}\n${url}`;
    window.location.href = `sms:?body=${encodeURIComponent(body)}`;
  }
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-scrim p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share the live sheet"
        className="w-full max-w-sm rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-display text-2xl font-bold uppercase">Live sheet</h2>
        <p className="mt-2 text-sm text-muted">Anyone with this link can open it and pass it on.</p>
        <Button type="button" className="mt-4 w-full" onClick={text}>
          Text link
        </Button>
        <Button type="button" variant="outline" className="mt-2 w-full" onClick={() => void copy()}>
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
    </div>,
    document.body,
  );
}

function shareViewerKey(): string | null {
  if (typeof window === "undefined") return null;
  const storageKey = "423-share-viewer";
  try {
    const existing = window.localStorage.getItem(storageKey);
    if (existing) return existing;
    const next = window.crypto.randomUUID();
    window.localStorage.setItem(storageKey, next);
    return next;
  } catch {
    return null;
  }
}

function LiveSheet() {
  const { weekendId } = Route.useParams();
  const { view: sharedView } = Route.useSearch();
  const id = Number.parseInt(weekendId, 10);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [view, setView] = useState<SheetView | null>(sharedView ?? null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const seenStamp = useRef<string | null>(null);
  const stampQuery = useQuery({
    queryKey: ["live-sheet-stamp", id],
    queryFn: () => liveSheetStamp({ data: { weekendId: id } }),
    enabled: Number.isInteger(id) && id > 0,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
  const sheetQuery = useQuery({
    queryKey: ["live-sheet", id],
    queryFn: () => getLiveSheet({ data: { weekendId: id } }),
    enabled: Number.isInteger(id) && id > 0,
  });
  useEffect(() => {
    const onShow = () => {
      if (document.visibilityState === "visible") void stampQuery.refetch();
    };
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, [stampQuery]);
  useEffect(() => {
    const stamp = stampQuery.data?.stamp;
    if (!stamp) return;
    if (seenStamp.current == null) {
      seenStamp.current = stamp;
      return;
    }
    if (seenStamp.current === stamp) return;
    seenStamp.current = stamp;
    void sheetQuery.refetch();
  }, [stampQuery.data?.stamp, sheetQuery]);
  const payload = sheetQuery.data;
  const schedule: WeekendSchedule | null = payload?.status === "open" ? payload.schedule : null;
  const ages = schedule?.ages ?? [];
  const activeAge =
    ages.find((age) => age.ageGroup === ageGroup) ??
    ages.find((age) => age.teamCount >= age.minTeams) ??
    ages[0] ??
    null;
  const poolOn = Boolean(activeAge?.poolPlay);
  const poolGames = activeAge ? activeAge.games.filter((game) => game.round === "pool" && !game.isBye) : [];
  const bracketGames = activeAge ? activeAge.games.filter((game) => game.round !== "pool") : [];
  const activeView: SheetView = !poolOn ? "bracket" : (view ?? "pool");
  const name = payload && payload.status !== "open" ? payload.name : schedule?.weekend.name ?? "Tournament";

  useEffect(() => {
    if (payload?.status !== "open" || !Number.isInteger(id) || id < 1) return;
    const viewerKey = shareViewerKey();
    if (!viewerKey) return;
    let sessionId = 0;
    let last = Date.now();
    let stopped = false;
    void recordShareOpen({ data: { weekendId: id, viewerKey } })
      .then((result) => {
        if (!stopped) sessionId = result.sessionId;
      })
      .catch(() => undefined);
    function flush() {
      if (!sessionId) return;
      const now = Date.now();
      const seconds = Math.round((now - last) / 1000);
      last = now;
      if (seconds < 1) return;
      void recordShareBeat({ data: { sessionId, seconds } }).catch(() => undefined);
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") flush();
      else last = Date.now();
    }
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") flush();
      else last = Date.now();
    }, 20000);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      flush();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [payload?.status, id]);

  return (
    <div className="sheet flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-bg text-fg">
      <header className="sticky top-0 z-10 bg-[#1c1c1c] px-3 py-2 text-white">
        <div className="flex items-center gap-2">
          <p className="min-w-0 truncate text-sm font-semibold">{name}</p>
          {ages.length > 1 ? (
            <div className="ml-auto flex flex-wrap justify-end gap-1">
              {ages.map((age) => (
                <button
                  key={age.ageGroup}
                  type="button"
                  onClick={() => setAgeGroup(age.ageGroup)}
                  className={cn("sheet-chip", (activeAge?.ageGroup ?? "") === age.ageGroup && "sheet-chip-on")}
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
      {sheetQuery.isPending ? (
        <p className="px-4 py-5 text-sm text-muted">Loading the sheet…</p>
      ) : !payload ? (
        <p className="mx-4 mt-4 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
          {sheetQuery.error instanceof Error ? sheetQuery.error.message : "Could not open that sheet."}
        </p>
      ) : payload.status !== "open" || !schedule || !activeAge ? (
        <p className="mx-4 mt-6 text-sm">
          {payload.status === "over"
            ? `Live links for ${payload.year ?? "that year"} are closed.`
            : "This sheet isn’t public yet."}
        </p>
      ) : (
        <>
          <div className="shrink-0 border-b border-line px-3 py-2">
            {poolOn ? (
              <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label="Sheet">
                {([
                  ["pool", "Pool Play"],
                  ["standings", "Standings"],
                  ["bracket", "Bracket"],
                ] as const).map(([key, label]) => {
                  const on = activeView === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setView(key)}
                      className={cn(
                        "flex min-h-12 items-center justify-center rounded-lg border px-1 text-center font-display text-sm font-bold uppercase tracking-wide",
                        on ? "border-ink bg-ink text-primary-fg" : "border-line bg-bg text-fg",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setCopied(false);
                  setShareOpen(true);
                }}
              >
                Share
              </Button>
            </div>
          </div>
          {activeView === "bracket" ? (
            <SheetZoom resetKey={`${activeAge.ageGroup}-live`}>
              <div className="px-3 py-2">
                <SiteBoard
                  games={bracketGames}
                  parks={schedule.locations}
                  playIns={hasPlayInRound(activeAge.games)}
                  firstRound={firstPlayableRound(activeAge.games)}
                  asOfDate={schedule.weekend.endDate}
                  liveRound={ROUND_IDS.slice().reverse().find((round) => bracketGames.some((game) => game.round === round)) ?? null}
                  allGames={activeAge.games}
                  weekendId={id}
                  editable={false}
                  busy={false}
                  fieldError={null}
                  onField={() => undefined}
                  onAddField={() => undefined}
                  softFill={activeAge.softFill}
                />
              </div>
            </SheetZoom>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto overscroll-y-contain px-3 pb-2">
              <NoPinch />
              {activeView === "standings" ? (
                <StandingsTable
                  age={activeAge}
                  tiebreakers={schedule.weekend.rules.tiebreakers}
                  seedOnePlaysLast={schedule.weekend.rules.packSeed1vsLast}
                />
              ) : (
                <PoolGrid
                  games={poolGames}
                  rosterGames={poolGames}
                  parks={schedule.locations}
                  editable={false}
                  quiet
                  maps
                  busy={false}
                  fieldError={null}
                  onField={() => undefined}
                  onAddField={() => undefined}
                  softFill={activeAge.softFill}
                  weekendId={id}
                />
              )}
            </div>
          )}
        </>
      )}
      {shareOpen && schedule ? (
        <ShareLive
          name={schedule.weekend.name}
          url={liveSheetUrl(id, activeView)}
          copied={copied}
          onCopied={() => setCopied(true)}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </div>
  );
}
