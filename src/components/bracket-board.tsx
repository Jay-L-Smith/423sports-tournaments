import { createContext, Fragment, useContext, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FieldDialog } from "@/components/field-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScheduleAge, ScheduleGame, WeekendLocation } from "@/lib/pbi/api";
import { formatClock, hasPlayInRound, isFutureSiteGame, isRoundId, layoutSiteBracket, nextKnockoutGame, ROUND_IDS, seedLabel, shortParkName, treeRoundLabel, type RoundId, type SiteBracketLayout } from "@/lib/pbi/bracket";
import { formatDayTab, parseLocationInput } from "@/lib/pbi/weekends";
import { cn } from "@/lib/utils";

function teamSlots(games: ScheduleGame[], teamId: number) {
  return games
    .filter(
      (row) =>
        row.round === "pool" &&
        !row.isBye &&
        (row.homeTeamId === teamId || row.awayTeamId === teamId),
    )
    .slice()
    .sort(
      (a, b) =>
        (a.startDate ?? "").localeCompare(b.startDate ?? "") ||
        (a.startTime ?? "").localeCompare(b.startTime ?? "") ||
        a.slot - b.slot,
    );
}

function poolRoster(games: ScheduleGame[]) {
  const found = new Map<number, { name: string; seed: number; pool: number; field: string }>();
  for (const game of games) {
    if (game.round !== "pool") continue;
    for (const side of ["home", "away"] as const) {
      const id = side === "home" ? game.homeTeamId : game.awayTeamId;
      const name = side === "home" ? game.homeName : game.awayName;
      const seed = side === "home" ? game.homeSeed : game.awaySeed;
      if (id == null) continue;
      const prev = found.get(id);
      const nextSeed = seed ?? 99;
      if (!prev || nextSeed < prev.seed) {
        found.set(id, {
          name: name ?? "Team",
          seed: nextSeed,
          pool: game.poolIndex ?? 0,
          field: game.locationName ? shortParkName(game.locationName) : "",
        });
      }
    }
  }
  const rows = [...found.entries()].sort(
    (a, b) => a[1].pool - b[1].pool || a[1].seed - b[1].seed || a[0] - b[0],
  );
  const counts = new Map<number, number>();
  return rows.map(([id, row]) => {
    const number = (counts.get(row.pool) ?? 0) + 1;
    counts.set(row.pool, number);
    return { id, name: row.name, number, pool: row.pool, field: row.field };
  });
}

type GameEditValue = {
  parks: WeekendLocation[];
  days: { date: string; label: string }[];
  blocksFor: (date: string) => string[];
  busy: boolean;
  save: (input: { gameId: number; startDate: string; startTime: string; locationId: number | null }) => Promise<void>;
  locked: boolean;
  beforeFirstPitch: boolean;
  pullOut: (teamId: number) => Promise<void>;
  replaceTeam: (teamId: number, name: string) => Promise<void>;
};

const GameEditContext = createContext<GameEditValue | null>(null);

export function GameEditProvider({ value, children }: { value: GameEditValue | null; children: ReactNode }) {
  return <GameEditContext.Provider value={value}>{children}</GameEditContext.Provider>;
}

function useGameEdit() {
  return useContext(GameEditContext);
}

function gameResultText(game: {
  noContest?: boolean;
  forfeit?: "home" | "away" | null;
  homeScore: number | null;
  awayScore: number | null;
}): string | null {
  if (game.noContest) return "No contest";
  if (game.forfeit) return "Forfeit";
  if (game.homeScore != null && game.awayScore != null) return `${game.homeScore}-${game.awayScore}`;
  return null;
}

function TeamOutActions({ game }: { game: ScheduleGame }) {
  const edit = useGameEdit();
  const [mode, setMode] = useState<"closed" | "pull" | "replace">("closed");
  const [teamId, setTeamId] = useState<number | null>(game.homeTeamId ?? game.awayTeamId);
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  if (!edit?.locked) return null;
  const sides = [
    game.homeTeamId != null ? { id: game.homeTeamId, name: game.homeName ?? "Home" } : null,
    game.awayTeamId != null ? { id: game.awayTeamId, name: game.awayName ?? "Away" } : null,
  ].filter((side): side is { id: number; name: string } => side != null);
  if (sides.length === 0) return null;
  const open = !game.noContest && !game.forfeit && (game.homeScore == null || game.awayScore == null);

  async function runPull() {
    if (teamId == null) return;
    setLocalError(null);
    try {
      await edit!.pullOut(teamId);
      setMode("closed");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not forfeit those games.");
    }
  }

  async function runReplace(event: FormEvent) {
    event.preventDefault();
    if (teamId == null) return;
    setLocalError(null);
    try {
      await edit!.replaceTeam(teamId, name);
      setMode("closed");
      setName("");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not replace that club.");
    }
  }

  return (
    <div className="mt-3 space-y-2 border-t border-line pt-3">
      {mode === "closed" ? (
        <>
          <Button type="button" variant="outline" className="w-full" onClick={() => setMode("pull")}>
            Pulled out
          </Button>
          {edit.beforeFirstPitch && open ? (
            <Button type="button" variant="outline" className="w-full" onClick={() => setMode("replace")}>
              Replace in these games
            </Button>
          ) : null}
        </>
      ) : null}
      {mode === "pull" ? (
        <div className="space-y-2">
          <p className="text-sm text-muted">Forfeit every remaining game. The sheet stays put.</p>
          <select
            value={teamId ?? ""}
            onChange={(event) => setTeamId(Number.parseInt(event.target.value, 10))}
            className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"
          >
            {sides.map((side) => (
              <option key={side.id} value={side.id}>
                {side.name}
              </option>
            ))}
          </select>
          <Button type="button" className="w-full" disabled={edit.busy} onClick={() => void runPull()}>
            {edit.busy ? "Saving…" : "Forfeit their remaining games"}
          </Button>
          <Button type="button" variant="ghost" className="w-full text-muted" onClick={() => setMode("closed")}>
            Back
          </Button>
        </div>
      ) : null}
      {mode === "replace" ? (
        <form noValidate onSubmit={(event) => void runReplace(event)} className="space-y-2">
          <p className="text-sm text-muted">Same seed, same times, same parks. The new club takes this slot.</p>
          <select
            value={teamId ?? ""}
            onChange={(event) => setTeamId(Number.parseInt(event.target.value, 10))}
            className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"
          >
            {sides.map((side) => (
              <option key={side.id} value={side.id}>
                {side.name} drops
              </option>
            ))}
          </select>
          <Label htmlFor={`replace-name-${game.id}`}>New club</Label>
          <Input id={`replace-name-${game.id}`} value={name} onChange={(event) => setName(event.target.value)} />
          <Button type="submit" className="w-full" disabled={edit.busy}>
            {edit.busy ? "Saving…" : "Put them in this slot"}
          </Button>
          <Button type="button" variant="ghost" className="w-full text-muted" onClick={() => setMode("closed")}>
            Back
          </Button>
        </form>
      ) : null}
      {localError ? (
        <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}

function GameDetailsForm({ game, onDone }: { game: ScheduleGame; onDone: () => void }) {
  const edit = useGameEdit();
  const firstDate = game.startDate ?? edit?.days[0]?.date ?? "";
  const firstBlocks = edit?.blocksFor(firstDate) ?? [];
  const clock = (game.startTime ?? "").slice(0, 5);
  const [date, setDate] = useState(firstDate);
  const [timeChoice, setTimeChoice] = useState(
    clock && firstBlocks.includes(clock) ? clock : clock ? "other" : (firstBlocks[0] ?? "other"),
  );
  const [customTime, setCustomTime] = useState(clock || firstBlocks[0] || "08:00");
  const [locationId, setLocationId] = useState(game.locationId != null ? String(game.locationId) : "");
  const [localError, setLocalError] = useState<string | null>(null);
  if (!edit) return null;
  const sheet = edit;
  const blocks = sheet.blocksFor(date);
  const dayOptions =
    !date || sheet.days.some((row) => row.date === date)
      ? sheet.days
      : [{ date, label: formatDayTab(date) }, ...sheet.days];

  function changeDate(next: string) {
    setDate(next);
    const nextBlocks = sheet.blocksFor(next);
    setTimeChoice((prev) => {
      if (prev === "other") return "other";
      if (nextBlocks.includes(prev)) return prev;
      return nextBlocks[0] ?? "other";
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLocalError(null);
    const startTime = (timeChoice === "other" ? customTime : timeChoice).slice(0, 5);
    if (!date) {
      setLocalError("Pick a day on this tournament.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      setLocalError("Pick a start time.");
      return;
    }
    try {
      await sheet.save({
        gameId: game.id,
        startDate: date,
        startTime,
        locationId: locationId === "" ? null : Number.parseInt(locationId, 10),
      });
      onDone();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not update that game.");
    }
  }

  const shownError = localError;
  return (
    <form noValidate onSubmit={submit} className="mt-3 space-y-3">
      <p className="text-sm text-muted">Move this game only. The rest of the sheet stays put.</p>
      <div className="space-y-1.5">
        <Label htmlFor={`game-day-${game.id}`}>Day</Label>
        <select
          id={`game-day-${game.id}`}
          value={date}
          onChange={(event) => changeDate(event.target.value)}
          className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"
        >
          {dayOptions.map((row) => (
            <option key={row.date} value={row.date}>
              {row.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`game-time-${game.id}`}>Start</Label>
        <select
          id={`game-time-${game.id}`}
          value={timeChoice === "other" || blocks.includes(timeChoice) ? timeChoice : "other"}
          onChange={(event) => setTimeChoice(event.target.value)}
          className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"
        >
          {blocks.map((time) => (
            <option key={time} value={time}>
              {formatClock(time)}
            </option>
          ))}
          <option value="other">Other time</option>
        </select>
        {timeChoice === "other" || !blocks.includes(timeChoice) ? (
          <Input
            id={`game-custom-time-${game.id}`}
            type="time"
            value={customTime}
            onChange={(event) => {
              setCustomTime(event.target.value);
              setTimeChoice("other");
            }}
          />
        ) : (
          <p className="text-xs text-muted">Starts stay two hours apart unless this game has to move.</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`game-park-${game.id}`}>Park</Label>
        <select
          id={`game-park-${game.id}`}
          value={locationId}
          onChange={(event) => setLocationId(event.target.value)}
          className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"
        >
          <option value="">Field TBD</option>
          {sheet.parks.map((park) => (
            <option key={park.id} value={park.id}>
              {park.name}
            </option>
          ))}
        </select>
      </div>
      {shownError ? (
        <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
          {shownError}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={sheet.busy}>
        {sheet.busy ? "Saving…" : "Save game"}
      </Button>
      <Button type="button" variant="ghost" className="w-full text-muted" onClick={onDone}>
        Back to score
      </Button>
    </form>
  );
}

function PoolGameDialog({
  game,
  games,
  parks,
  numbers,
  busy,
  error,
  onClose,
  onSwap,
  onScore,
  onPickField,
  onAddField,
}: {
  game: ScheduleGame;
  games: ScheduleGame[];
  parks: WeekendLocation[];
  numbers: Map<string, number>;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSwap: (gameId: number, teamAId: number, teamBId: number) => void;
  onScore?: (gameId: number, homeScore: number, awayScore: number, forfeit?: "home" | "away" | null) => void;
  onPickField: (locationId: number | null) => void;
  onAddField: (input: { name: string; address: string }) => void;
}) {
  const [spot, setSpot] = useState<number | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [homeScore, setHomeScore] = useState(game.homeScore != null ? String(game.homeScore) : "");
  const [awayScore, setAwayScore] = useState(game.awayScore != null ? String(game.awayScore) : "");
  const [forfeit, setForfeit] = useState<"home" | "away" | "">(
    game.forfeit === "home" || game.forfeit === "away" ? game.forfeit : "",
  );
  const [overrideStep, setOverrideStep] = useState<"locked" | "confirm" | "edit">("locked");
  const [editing, setEditing] = useState(false);
  const gameEdit = useGameEdit();
  const n = numbers.get(`${game.round}:${game.slot}`);
  const scored = game.homeScore != null || game.awayScore != null || game.scoreLocked;
  const roster = poolRoster(games);
  const pools = new Set(roster.map((row) => row.pool));
  const numberOf = (id: number | null) => roster.find((row) => row.id === id)?.number ?? null;
  const homeNo = numberOf(game.homeTeamId);
  const awayNo = numberOf(game.awayTeamId);
  const homeRuns = game.homeScore ?? -1;
  const awayRuns = game.awayScore ?? -1;
  const homeLeads = scored && (game.forfeit === "away" || (game.forfeit !== "home" && homeRuns > awayRuns));
  const awayLeads = scored && (game.forfeit === "home" || (game.forfeit !== "away" && awayRuns > homeRuns));
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-scrim p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pool-game-title"
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="pool-game-title" className="font-display text-2xl font-bold uppercase">
            {n != null ? `G${n}` : "Game"}
          </h2>
          <Button type="button" variant="ghost" className="px-2 text-muted" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="text-xs text-muted">
          {formatClock(game.startTime)}
          {game.locationName ? ` · ${shortParkName(game.locationName)}` : ""}
          {game.roundLabel ? ` · ${game.roundLabel}` : ""}
        </p>
        {editing ? (
          <GameDetailsForm game={game} onDone={() => setEditing(false)} />
        ) : (
        <>
        {gameEdit ? (
          <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => setEditing(true)}>
            Edit time or park
          </Button>
        ) : null}
        {scored ? (
          <div className="mt-3 overflow-hidden rounded-md border border-line">
            {(
              [
                { side: "home", no: homeNo, name: game.homeName, score: game.homeScore, win: homeLeads },
                { side: "away", no: awayNo, name: game.awayName, score: game.awayScore, win: awayLeads },
              ] as const
            ).map((side) => (
              <div key={side.side} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0">
                <span className="w-5 shrink-0 text-center text-xs font-bold text-muted">{side.no ?? "—"}</span>
                <span className={cn("min-w-0 flex-1 truncate text-sm", side.win ? "font-bold" : "text-muted")}>
                  {side.name ?? "TBD"}
                </span>
                <span className={cn("font-display text-2xl leading-none", side.win ? "font-bold" : "text-muted")}>
                  {game.forfeit || game.noContest ? gameResultText(game) : (side.score ?? "–")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-md border border-line">
            {(
              [
                { side: "home", no: homeNo, name: game.homeName },
                { side: "away", no: awayNo, name: game.awayName },
              ] as const
            ).map((side) => (
              <div key={side.side} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0">
                <span className="w-5 shrink-0 text-center text-xs font-bold text-muted">{side.no ?? "—"}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{side.name ?? "TBD"}</span>
              </div>
            ))}
          </div>
        )}
        {onScore && !scored ? (
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              onScore(
                game.id,
                Number.parseInt(homeScore || "0", 10),
                Number.parseInt(awayScore || "0", 10),
                forfeit === "home" || forfeit === "away" ? forfeit : null,
              );
              onClose();
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wide">Score this game</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="pool-score-home">{game.homeName ?? "Home"}</Label>
                <Input
                  id="pool-score-home"
                  inputMode="numeric"
                  value={homeScore}
                  onChange={(event) => setHomeScore(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="pool-score-away">{game.awayName ?? "Away"}</Label>
                <Input
                  id="pool-score-away"
                  inputMode="numeric"
                  value={awayScore}
                  onChange={(event) => setAwayScore(event.target.value)}
                />
              </div>
            </div>
            <select
              value={forfeit}
              onChange={(event) =>
                setForfeit(event.target.value === "home" || event.target.value === "away" ? event.target.value : "")
              }
              className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"
            >
              <option value="">They played</option>
              <option value="away">{game.homeName ?? "Home"} no-show. This game only.</option>
              <option value="home">{game.awayName ?? "Away"} no-show. This game only.</option>
            </select>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Saving…" : "Save score"}
            </Button>
          </form>
        ) : null}
        {scored ? (
          <div className="mt-2">
            {onScore && overrideStep === "locked" ? (
              <button
                type="button"
                className="text-[11px] font-semibold uppercase tracking-wide text-muted underline-offset-2 hover:underline"
                onClick={() => setOverrideStep("confirm")}
              >
                Override score
              </button>
            ) : null}
            {onScore && overrideStep === "confirm" ? (
              <div className="rounded-md bg-surface px-2 py-2">
                <p className="text-xs text-muted">Override this score?</p>
                <div className="mt-1.5 flex gap-3">
                  <button type="button" className="text-xs font-bold uppercase" onClick={() => setOverrideStep("locked")}>
                    No
                  </button>
                  <button type="button" className="text-xs font-bold uppercase" onClick={() => setOverrideStep("edit")}>
                    Yes
                  </button>
                </div>
              </div>
            ) : null}
            {onScore && overrideStep === "edit" ? (
              <form
                className="mt-2 space-y-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  onScore(
                    game.id,
                    Number.parseInt(homeScore || "0", 10),
                    Number.parseInt(awayScore || "0", 10),
                    forfeit === "home" || forfeit === "away" ? forfeit : null,
                  );
                  onClose();
                }}
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="pool-score-home">{game.homeName ?? "Home"}</Label>
                    <Input
                      id="pool-score-home"
                      inputMode="numeric"
                      value={homeScore}
                      onChange={(event) => setHomeScore(event.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pool-score-away">{game.awayName ?? "Away"}</Label>
                    <Input
                      id="pool-score-away"
                      inputMode="numeric"
                      value={awayScore}
                      onChange={(event) => setAwayScore(event.target.value)}
                    />
                  </div>
                </div>
                <select
                  value={forfeit}
                  onChange={(event) =>
                    setForfeit(event.target.value === "home" || event.target.value === "away" ? event.target.value : "")
                  }
                  className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"
                >
                  <option value="">They played</option>
                  <option value="away">{game.homeName ?? "Home"} no-show. This game only.</option>
                  <option value="home">{game.awayName ?? "Away"} no-show. This game only.</option>
                </select>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Saving…" : "Save override"}
                </Button>
              </form>
            ) : null}
          </div>
        ) : null}
        {scored || gameEdit?.locked ? null : (
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setSwapOpen((open) => !open);
                setSpot(null);
              }}
            >
              {swapOpen ? "Hide teams" : "Swap teams"}
            </Button>
            {swapOpen ? (
              <div className="mt-3">
                {spot == null ? (
                  <>
                    <p className="text-sm text-muted">Pick which team in this game is moving.</p>
                    <div className="mt-2 space-y-1">
                      {[
                        { id: game.homeTeamId, name: game.homeName, no: homeNo },
                        { id: game.awayTeamId, name: game.awayName, no: awayNo },
                      ]
                        .filter((side) => side.id != null)
                        .map((side) => (
                          <button
                            key={side.id}
                            type="button"
                            disabled={busy}
                            onClick={() => setSpot(side.id)}
                            className="flex w-full items-center gap-3 rounded-md border border-line bg-surface px-3 py-2 text-left text-sm"
                          >
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1c1c1c] text-sm font-bold text-white">
                              {side.no ?? "?"}
                            </span>
                            <span className="font-semibold">{side.name ?? "Team"}</span>
                          </button>
                        ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted">
                      Swap {roster.find((row) => row.id === spot)?.name ?? "that team"} with one team. The card shows
                      the times and fields they play.
                    </p>
                    <Button type="button" variant="ghost" className="mt-1 px-0 text-sm" onClick={() => setSpot(null)}>
                      Pick the other team in this game
                    </Button>
                    <div className="mt-2 space-y-1">
                      {roster
                        .filter((team) => team.id !== spot)
                        .map((team) => {
                          const slots = teamSlots(games, team.id);
                          return (
                            <button
                              key={team.id}
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                onSwap(game.id, spot, team.id);
                                onClose();
                              }}
                              className="flex w-full items-start gap-3 rounded-md border border-line bg-surface px-3 py-2 text-left text-sm hover:border-fg/40"
                            >
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1c1c1c] text-sm font-bold text-white">
                                {team.number}
                              </span>
                              <span className="min-w-0">
                                <span className="block font-semibold">{team.name}</span>
                                {pools.size > 1 ? (
                                  <span className="block text-xs text-muted">
                                    Pool {String.fromCharCode(65 + team.pool)}
                                  </span>
                                ) : null}
                                {slots.map((row) => (
                                  <span key={row.id} className="block text-xs text-muted">
                                    {formatClock(row.startTime)}
                                    {row.locationName ? ` · ${shortParkName(row.locationName)}` : ""}
                                  </span>
                                ))}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        )}
        {scored ? null : (
          <>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-wide">Field</p>
            <div className="mt-1 space-y-1">
              {parks.map((park) => (
                <button
                  key={park.id}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    onPickField(park.id);
                    onClose();
                  }}
                  className={
                    park.id === game.locationId
                      ? "w-full rounded-md border border-primary bg-primary/15 px-3 py-2 text-left text-sm"
                      : "w-full rounded-md border border-line bg-surface px-3 py-2 text-left text-sm hover:border-fg/40"
                  }
                >
                  {park.name}
                </button>
              ))}
            </div>
            <FieldAdd parksBusy={busy} onAdd={onAddField} />
          </>
        )}
        </>
        )}
        <TeamOutActions game={game} />
        {error ? (
          <p className="mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function FieldAdd({
  parksBusy,
  onAdd,
}: {
  parksBusy: boolean;
  onAdd: (input: { name: string; address: string }) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  if (!adding) {
    return (
      <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => setAdding(true)}>
        Add field
      </Button>
    );
  }
  return (
    <form
      noValidate
      className="mt-3 space-y-2 rounded-md border border-line bg-surface p-3"
      onSubmit={(event) => {
        event.preventDefault();
        setFormError(null);
        try {
          const parsed = parseLocationInput({ weekendId: 1, name, address });
          onAdd({ name: parsed.name, address: parsed.address });
        } catch (err) {
          setFormError(err instanceof Error ? err.message : "Check the park and try again.");
        }
      }}
    >
      <Label htmlFor="pool-new-park">Name</Label>
      <Input id="pool-new-park" value={name} onChange={(e) => setName(e.target.value)} />
      <Label htmlFor="pool-new-addr">Address</Label>
      <Input id="pool-new-addr" value={address} onChange={(e) => setAddress(e.target.value)} />
      {formError ? (
        <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
          {formError}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={parksBusy}>
        {parksBusy ? "Saving…" : "Add field"}
      </Button>
    </form>
  );
}

function numbersFor(games: ScheduleGame[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const game of games) {
    if (game.gameNumber != null) map.set(`${game.round}:${game.slot}`, game.gameNumber);
  }
  return map;
}

function sideCopy(
  game: ScheduleGame,
  side: "home" | "away",
  numbers: Map<string, number>,
  feeders: ScheduleGame[] = [],
  softFill = false,
): { seed: number | null; text: string } {
  const name = side === "home" ? game.homeName : game.awayName;
  const seed = side === "home" ? game.homeSeed : game.awaySeed;
  const fromRound = side === "home" ? game.homeFromRound : game.awayFromRound;
  const fromSlot = side === "home" ? game.homeFromSlot : game.awayFromSlot;
  if (name) return { seed, text: name };
  if (fromRound != null && fromSlot != null) {
    const feeder = feeders.find((row) => row.round === fromRound && row.slot === fromSlot);
    if (feeder?.isBye) {
      const sourceRound = feeder.homeFromRound ?? feeder.awayFromRound;
      const sourceSlot = feeder.homeFromSlot ?? feeder.awayFromSlot;
      if (sourceRound != null && sourceSlot != null) {
        const n = numbers.get(`${sourceRound}:${sourceSlot}`);
        if (n) return { seed: null, text: `Win G${n}` };
      }
      const byeName = feeder.homeName ?? feeder.awayName;
      const byeSeed = feeder.homeSeed ?? feeder.awaySeed ?? null;
      if (byeName) return { seed: byeSeed, text: byeName };
      if (byeSeed != null) return { seed: byeSeed, text: seedLabel(byeSeed) };
      return { seed: null, text: "Bye" };
    }
    const n = numbers.get(`${fromRound}:${fromSlot}`);
    if (n) return { seed: null, text: `Win G${n}` };
    const feederName = feeder?.homeName ?? feeder?.awayName;
    if (feederName) return { seed: null, text: `Winner of game` };
    const feederSeed = feeder?.homeSeed ?? feeder?.awaySeed ?? null;
    if (softFill && feederSeed != null) return { seed: feederSeed, text: `${seedLabel(feederSeed)} · pool place` };
    return { seed: null, text: "Winner of game" };
  }
  if (seed) return { seed: null, text: seedLabel(seed) };
  return { seed: null, text: "TBD" };
}

function SeedRow({
  seed,
  text,
  selected,
  editable,
  onPick,
  onDrop,
}: {
  seed: number | null;
  text: string;
  selected: boolean;
  editable: boolean;
  onPick: (seed: number) => void;
  onDrop: (from: number, to: number) => void;
}) {
  const canMove = editable && seed != null;
  return (
    <button
      type="button"
      draggable={canMove}
      onDragStart={(event) => {
        if (seed == null) return;
        event.dataTransfer.setData("text/seed", String(seed));
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(event) => {
        if (canMove) event.preventDefault();
      }}
      onDrop={(event) => {
        if (!canMove || seed == null) return;
        event.preventDefault();
        const from = Number.parseInt(event.dataTransfer.getData("text/seed"), 10);
        if (Number.isInteger(from) && from > 0) onDrop(from, seed);
      }}
      onClick={() => {
        if (canMove && seed != null) onPick(seed);
      }}
      className={cn("bracket-seed", selected && "is-selected", canMove ? "cursor-grab active:cursor-grabbing" : "cursor-default")}
    >
      <span className="bracket-seed-num">{seed ?? ""}</span>
      <span className="bracket-seed-name truncate text-sm font-semibold">{text}</span>
    </button>
  );
}

function ByeSlot({
  game,
  selectedSeed,
  editable,
  onPick,
  onDrop,
}: {
  game: ScheduleGame;
  selectedSeed: number | null;
  editable: boolean;
  onPick: (seed: number) => void;
  onDrop: (from: number, to: number) => void;
}) {
  const seed =
    game.homeTeamId != null
      ? game.homeSeed
      : game.awayTeamId != null
        ? game.awaySeed
        : (game.homeSeed ?? game.awaySeed);
  const name = game.homeName ?? game.awayName;
  const selected = seed != null && selectedSeed === seed;
  return (
    <button
      type="button"
      draggable={editable && seed != null}
      onDragStart={(event) => {
        if (seed == null) return;
        event.dataTransfer.setData("text/seed", String(seed));
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(event) => {
        if (editable && seed != null) event.preventDefault();
      }}
      onDrop={(event) => {
        if (!editable || seed == null) return;
        event.preventDefault();
        const from = Number.parseInt(event.dataTransfer.getData("text/seed"), 10);
        if (Number.isInteger(from) && from > 0) onDrop(from, seed);
      }}
      onClick={() => {
        if (editable && seed != null) onPick(seed);
      }}
      className={cn(
        "bracket-bye",
        selected && "is-selected",
        editable ? "cursor-grab active:cursor-grabbing" : "cursor-default",
      )}
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">[Bye]</p>
      {name ? <p className="mt-1 truncate text-xs font-semibold text-muted">{name}</p> : null}
      {!name && seed != null ? (
        <p className="mt-1 text-xs font-semibold text-muted">{seedLabel(seed)} after pool play</p>
      ) : null}
    </button>
  );
}

function MatchCard({
  game,
  numbers,
  editable,
  canPickField,
  selectedSeed,
  onPickSeed,
  onDropSeed,
  onField,
  future,
  feeders,
  softFill,
}: {
  game: ScheduleGame;
  numbers: Map<string, number>;
  editable: boolean;
  canPickField?: boolean;
  selectedSeed: number | null;
  onPickSeed: (seed: number) => void;
  onDropSeed: (from: number, to: number) => void;
  onField: (game: ScheduleGame) => void;
  future?: boolean;
  feeders?: ScheduleGame[];
  softFill?: boolean;
}) {
  const home = sideCopy(game, "home", numbers, feeders, Boolean(softFill));
  const away = sideCopy(game, "away", numbers, feeders, Boolean(softFill));
  const field = game.locationName ?? "Pick a field";
  const clock = future ? game.when || formatClock(game.startTime) : formatClock(game.startTime);
  const gameTag = game.gameNumber != null ? `Game ${game.gameNumber}` : "Game";
  const pickField = canPickField ?? editable;

  return (
    <article className={cn("bracket-match", future && "is-future")}>
      <div className="bracket-match-body overflow-hidden rounded-sm border">
        <SeedRow
          seed={home.seed}
          text={home.text}
          selected={home.seed != null && selectedSeed === home.seed}
          editable={editable}
          onPick={onPickSeed}
          onDrop={onDropSeed}
        />
        <SeedRow
          seed={away.seed}
          text={away.text}
          selected={away.seed != null && selectedSeed === away.seed}
          editable={editable}
          onPick={onPickSeed}
          onDrop={onDropSeed}
        />
      </div>
      <button
        type="button"
        disabled={!pickField}
        onClick={() => onField(game)}
        className="bracket-meta disabled:cursor-default"
      >
        <span className="text-xs font-bold uppercase tracking-wide">{gameTag}</span>
        <span className="bracket-meta-field text-xs font-semibold">
          {field}
          {editable && game.locationName && !game.fieldConfirmed ? " · suggested" : ""}
        </span>
        <span className="bracket-meta-time text-xs">
          {clock}
          {gameResultText(game) ? ` · ${gameResultText(game)}` : ""}
        </span>
      </button>
    </article>
  );
}

function StraightJoin() {
  return (
    <div className="bracket-straight">
      <span />
    </div>
  );
}

function Joins({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className="bracket-joins">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bracket-join">
          <div className="bracket-join-fork">
            <div className="bracket-join-top" />
            <div className="bracket-join-bottom" />
          </div>
          <div className="bracket-join-arm">
            <span />
          </div>
        </div>
      ))}
    </div>
  );
}

function LineTeam({ seed, text }: { seed: number | null; text: string }) {
  return (
    <div className="line-team">
      <span className="line-team-seed">{seed ?? ""}</span>
      <span className="line-team-name truncate">{text}</span>
    </div>
  );
}

function ByeCard({
  game,
  numbers,
  feeders,
  softFill,
}: {
  game: ScheduleGame;
  numbers: Map<string, number>;
  feeders: ScheduleGame[];
  softFill?: boolean;
}) {
  const holder = sideCopy(game, "home", numbers, feeders, Boolean(softFill));
  const waiting = holder.text === "Bye" || holder.text === "TBD";
  return (
    <article className="line-match">
      <div className="bracket-card">
        {waiting ? null : (
          <span className="bracket-card-team">
            {holder.seed != null ? <span className="bracket-card-seed">{holder.seed}</span> : null}
            <span className="bracket-card-name">{holder.text}</span>
          </span>
        )}
        <span className="bracket-card-meta">Bye</span>
      </div>
    </article>
  );
}

function LineMatch({
  game,
  numbers,
  canPickField,
  future,
  ghost,
  feeders,
  nextNote,
  onField,
  onScore,
  softFill,
}: {
  game: ScheduleGame;
  numbers: Map<string, number>;
  canPickField: boolean;
  future?: boolean;
  ghost?: boolean;
  feeders: ScheduleGame[];
  nextNote: string | null;
  onField: (game: ScheduleGame) => void;
  onScore?: (game: ScheduleGame) => void;
  softFill?: boolean;
}) {
  const home = sideCopy(game, "home", numbers, feeders, Boolean(softFill));
  const away = sideCopy(game, "away", numbers, feeders, Boolean(softFill));
  const place = game.locationName ? shortParkName(game.locationName) : "Field TBD";
  const clock = formatClock(game.startTime);
  const gameTag = game.gameNumber != null ? `G${game.gameNumber}` : "";
  const scored = !game.noContest && game.homeScore != null && game.awayScore != null;
  const homeRuns = game.homeScore ?? 0;
  const awayRuns = game.awayScore ?? 0;
  const homeWin = scored && (game.forfeit === "away" || (game.forfeit !== "home" && homeRuns > awayRuns));
  const awayWin = scored && (game.forfeit === "home" || (game.forfeit !== "away" && awayRuns > homeRuns));
  const note = game.noContest ? "No contest" : game.forfeit ? "Forfeit" : null;
  const meta = [gameTag, clock, place, note].filter(Boolean).join(" · ");

  return (
    <article className={cn("line-match", (future || ghost) && "is-future", ghost && "is-ghost")}>
      <button
        type="button"
        disabled={ghost || (!onScore && !canPickField)}
        onClick={() => (onScore ? onScore(game) : onField(game))}
        className="bracket-card disabled:cursor-default"
      >
        <span className="bracket-card-team">
          {home.seed != null ? <span className="bracket-card-seed">{home.seed}</span> : null}
          <span className={cn("bracket-card-name", scored && !homeWin && "is-behind", homeWin && "is-win")}>{home.text}</span>
          {scored ? (
            <span className={cn("bracket-card-runs", homeWin && "is-win", !homeWin && "is-behind")}>{game.homeScore}</span>
          ) : null}
        </span>
        <span className="bracket-card-team">
          {away.seed != null ? <span className="bracket-card-seed">{away.seed}</span> : null}
          <span className={cn("bracket-card-name", scored && !awayWin && "is-behind", awayWin && "is-win")}>{away.text}</span>
          {scored ? (
            <span className={cn("bracket-card-runs", awayWin && "is-win", !awayWin && "is-behind")}>{game.awayScore}</span>
          ) : null}
        </span>
        <span className="bracket-card-meta">{meta}</span>
      </button>
      {nextNote ? <p className="line-next">{nextNote}</p> : null}
    </article>
  );
}

function LineJoinColumn({
  slots,
  rows,
}: {
  slots: { rowStart: number; rowSpan: number; arms: number; armSpans: number[]; cardAt?: number; armAts?: number[] }[];
  rows: string;
}) {
  return (
    <div className="line-join-col" style={{ gridTemplateRows: rows }}>
      <div className="line-join-spacer" aria-hidden />
      {slots.map((slot, index) => {
        const ats = (slot.armAts ?? []).slice().sort((a, b) => a - b);
        const cardAt = slot.cardAt ?? 0.5;
        return (
          <div
            key={`${slot.rowStart}-${index}`}
            className="line-join-cell"
            style={{ gridRow: `${slot.rowStart + 1} / span ${slot.rowSpan}` }}
          >
            {slot.arms >= 2 && ats.length >= 2 ? (
              <div
                className="line-fork"
                style={{
                  ["--a" as string]: String(ats[0]),
                  ["--b" as string]: String(ats[ats.length - 1]),
                  ["--at" as string]: String(cardAt),
                }}
              >
                <span className="line-fork-a" />
                <span className="line-fork-b" />
                <span className="line-fork-stem" />
                <span className="line-fork-out" />
              </div>
            ) : (
              <span className="line-join-arm" style={{ top: `${cardAt * 100}%` }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function weekdayShort(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (y == null || m == null || d == null) return "";
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" });
}

function winnerPlaysNote(
  game: ScheduleGame,
  allGames: ScheduleGame[],
  onSheet: Set<string>,
): string | null {
  const next = nextKnockoutGame(game, allGames);
  if (!next || next.isBye) return null;
  if (onSheet.has(`${next.round}:${next.slot}`)) return null;
  const time = next.when || [weekdayShort(next.startDate), formatClock(next.startTime)].filter(Boolean).join(" · ");
  const park = next.locationName ? shortParkName(next.locationName) : "";
  return ["Winner", time, park].filter(Boolean).join(" · ");
}

export function BracketBoard({
  age,
  parks,
  editable,
  onSwap,
  onField,
  onAddField,
  fieldError,
  busy,
}: {
  age: ScheduleAge;
  parks: WeekendLocation[];
  editable: boolean;
  onSwap: (seedA: number, seedB: number) => void;
  onField: (gameId: number, locationId: number | null) => void;
  onAddField: (gameId: number, name: string, address: string) => void;
  fieldError: string | null;
  busy: boolean;
}) {
  const [selectedSeed, setSelectedSeed] = useState<number | null>(null);
  const [fieldGame, setFieldGame] = useState<ScheduleGame | null>(null);
  const numbers = numbersFor(age.games);
  const rounds = ROUND_IDS.filter((round) => age.games.some((game) => game.round === round));
  const first = rounds[0];
  const playIns = hasPlayInRound(age.games);

  const canMoveSeeds = editable && (!age.poolPlay || age.sundaySeedsLocked);
  function pickSeed(seed: number) {
    if (!canMoveSeeds) return;
    if (selectedSeed == null || selectedSeed === seed) {
      setSelectedSeed(selectedSeed === seed ? null : seed);
      return;
    }
    onSwap(selectedSeed, seed);
    setSelectedSeed(null);
  }

  return (
    <div>
      {editable ? (
        <p className="mb-3 text-sm text-muted">
          {age.poolPlay && !age.sundaySeedsLocked
            ? "Bracket names wait on pool play. 1st plays last — names fill in when pool standings are locked."
            : "Drag a club onto another seed, or tap one then the other. Tap the field under a game to pick a park."}
        </p>
      ) : (
        <p className="mb-3 text-sm text-muted landscape:hidden">Turn the phone sideways to see the full tree.</p>
      )}
      <div className="px-1 pb-4">
        <div className="bracket-tree">
          {rounds.map((round, index) => {
            const games = age.games.filter((game) => game.round === round).sort((a, b) => a.slot - b.slot);
            const nextCount = rounds[index + 1]
              ? age.games.filter((game) => game.round === rounds[index + 1]).length
              : 0;
            return (
              <div key={round} className="flex">
                <section className="bracket-round">
                  <h3 className="bracket-round-title">{treeRoundLabel(round, first ?? round, playIns)}</h3>
                  <div className="bracket-slots">
                    {games.map((game) => (
                      <div key={game.id} className="bracket-slot">
                        {game.isBye ? (
                          <ByeSlot
                            game={game}
                            selectedSeed={selectedSeed}
                            editable={canMoveSeeds}
                            onPick={pickSeed}
                            onDrop={(from, to) => onSwap(from, to)}
                          />
                        ) : (
                          <MatchCard
                            game={game}
                            numbers={numbers}
                            editable={canMoveSeeds}
                            canPickField={editable}
                            selectedSeed={selectedSeed}
                            feeders={age.games}
                            onPickSeed={pickSeed}
                            onDropSeed={(from, to) => onSwap(from, to)}
                            onField={setFieldGame}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
                {nextCount > 0 ? <Joins count={nextCount} /> : <StraightJoin />}
              </div>
            );
          })}
          <section className="bracket-round">
            <h3 className="bracket-round-title">Champion</h3>
            <div className="bracket-slots">
              <div className="bracket-slot">
                <div className="bracket-champion">
                  <p className="font-display text-base font-bold uppercase leading-tight">Tournament Champion</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {fieldGame ? (
        <FieldDialog
          parks={parks}
          currentId={fieldGame.locationId}
          busy={busy}
          error={fieldError}
          onClose={() => setFieldGame(null)}
          onPick={(locationId) => {
            onField(fieldGame.id, locationId);
            setFieldGame(null);
          }}
          onAdd={({ name, address }) => {
            onAddField(fieldGame.id, name, address);
            setFieldGame(null);
          }}
        />
      ) : null}
    </div>
  );
}

export function PoolGrid({
  games,
  rosterGames,
  parks,
  editable,
  onField,
  onAddField,
  onSwap,
  onScore,
  fieldError,
  busy,
  softFill,
  flaggedIds,
}: {
  games: ScheduleGame[];
  rosterGames?: ScheduleGame[];
  parks: WeekendLocation[];
  editable: boolean;
  onField: (gameId: number, locationId: number | null) => void;
  onAddField: (gameId: number, name: string, address: string) => void;
  onSwap?: (gameId: number, teamAId: number, teamBId: number) => void;
  onScore?: (gameId: number, homeScore: number, awayScore: number, forfeit?: "home" | "away" | null) => void;
  fieldError: string | null;
  busy: boolean;
  softFill?: boolean;
  flaggedIds?: number[];
}) {
  const [editGame, setEditGame] = useState<ScheduleGame | null>(null);
  const flagged = new Set(flaggedIds ?? []);
  const numbers = numbersFor(games);
  const playable = games
    .filter((game) => game.round === "pool" && !game.isBye)
    .slice()
    .sort(
      (a, b) =>
        (a.startTime ?? "").localeCompare(b.startTime ?? "") ||
        (a.locationName ?? "").localeCompare(b.locationName ?? "") ||
        a.slot - b.slot,
    );
  if (playable.length === 0) return null;
  const times = [...new Set(playable.map((game) => game.startTime).filter((row): row is string => Boolean(row)))].sort();
  const usedIds = [...new Set(playable.map((game) => game.locationId).filter((id): id is number => id != null))];
  const cols = parks.filter((park) => usedIds.includes(park.id));
  const fields = cols.length > 0 ? cols : parks;
  const byCell = new Map<string, ScheduleGame>();
  for (const game of playable) {
    if (game.locationId == null || !game.startTime) continue;
    byCell.set(`${game.locationId}|${game.startTime}`, game);
  }

  const roster = poolRoster(rosterGames ?? games);
  function numberOf(id: number | null) {
    return roster.find((row) => row.id === id)?.number ?? null;
  }
  function teamLabel(game: ScheduleGame, side: "home" | "away") {
    const name = side === "home" ? game.homeName : game.awayName;
    const seed = side === "home" ? game.homeSeed : game.awaySeed;
    if (name) return name;
    if (softFill && seed) return `${seedLabel(seed)} · pool place`;
    return "TBD";
  }

  return (
    <div className="pool-sheet mb-8">
      <p className="text-sm text-muted">
        {editable ? "Tap a game to score it. With more than two fields, swipe sideways. Team numbers still trade slots." : "Pool games at this park."}
      </p>
      <div className={cn("pool-grid-wrap mt-4", fields.length > 2 && "is-wide")}>
        <table className="pool-grid">
          <thead>
            <tr>
              <th className="pool-grid-time">Time</th>
              {fields.map((park) => (
                <th key={park.id}>{shortParkName(park.name)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {times.map((time) => (
              <tr key={time}>
                <th className="pool-grid-time">{formatClock(time)}</th>
                {fields.map((park) => {
                  const game = byCell.get(`${park.id}|${time}`);
                  if (!game) {
                    return (
                      <td key={park.id} className="pool-grid-empty">
                        —
                      </td>
                    );
                  }
                  const result = game.forfeit || game.noContest ? gameResultText(game) : null;
                  const scored = !result && game.homeScore != null && game.awayScore != null;
                  const homeRuns = game.homeScore ?? -1;
                  const awayRuns = game.awayScore ?? -1;
                  const homeLeads = scored && (game.forfeit === "away" || (game.forfeit !== "home" && homeRuns > awayRuns));
                  const awayLeads = scored && (game.forfeit === "home" || (game.forfeit !== "away" && awayRuns > homeRuns));
                  const sides = [
                    {
                      key: "home",
                      no: numberOf(game.homeTeamId),
                      name: teamLabel(game, "home"),
                      score: game.homeScore,
                      win: homeLeads,
                    },
                    {
                      key: "away",
                      no: numberOf(game.awayTeamId),
                      name: teamLabel(game, "away"),
                      score: game.awayScore,
                      win: awayLeads,
                    },
                  ];
                  return (
                    <td key={park.id}>
                      <button
                        type="button"
                        disabled={!editable}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => setEditGame(game)}
                        className={cn("pool-grid-cell disabled:cursor-default", flagged.has(game.id) && "is-flagged")}
                      >
                        {sides.map((side) => (
                          <span key={side.key} className="pool-grid-side">
                            <span className="pool-grid-no">{side.no ?? "—"}</span>
                            <span className={cn("pool-grid-name", scored && !side.win && "is-behind", side.win && "is-win")}>
                              {side.name}
                            </span>
                            {scored ? (
                              <span className={cn("pool-grid-runs", side.win && "is-win")}>{side.score}</span>
                            ) : null}
                          </span>
                        ))}
                        {result ? <span className="block px-1 pb-1 text-[10px] font-bold uppercase">{result}</span> : null}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editGame && (onSwap || onScore) ? (
        <PoolGameDialog
          game={games.find((row) => row.id === editGame.id) ?? editGame}
          games={rosterGames ?? games}
          parks={parks}
          numbers={numbers}
          busy={busy}
          error={fieldError}
          onClose={() => setEditGame(null)}
          onSwap={onSwap ?? (() => undefined)}
          onScore={onScore}
          onPickField={(locationId) => onField(editGame.id, locationId)}
          onAddField={(input) => onAddField(editGame.id, input.name, input.address)}
        />
      ) : editGame ? (
        <FieldDialog
          parks={parks}
          currentId={editGame.locationId}
          busy={busy}
          error={fieldError}
          onClose={() => setEditGame(null)}
          onPick={(locationId) => {
            onField(editGame.id, locationId);
            setEditGame(null);
          }}
          onAdd={({ name, address }) => {
            onAddField(editGame.id, name, address);
            setEditGame(null);
          }}
        />
      ) : null}
    </div>
  );
}

function LineBracketTree({
  layout,
  numbers,
  editable,
  asOfDate,
  liveRound,
  allGames,
  playIns,
  firstRound,
  showChampion,
  onField,
  onScore,
  softFill,
}: {
  layout: SiteBracketLayout<ScheduleGame>;
  numbers: Map<string, number>;
  editable: boolean;
  asOfDate: string;
  liveRound: string | null;
  allGames: ScheduleGame[];
  playIns: boolean;
  firstRound: RoundId | null;
  showChampion: boolean;
  onField: (game: ScheduleGame) => void;
  onScore?: (game: ScheduleGame) => void;
  softFill?: boolean;
}) {
  if (layout.rounds.length === 0) return null;
  const rowCount = Math.max(layout.rowCount, 1);
  const rows = `1.75rem repeat(${rowCount}, 7.15rem)`;
  const lastRound = layout.rounds[layout.rounds.length - 1];
  const hasChampion =
    showChampion &&
    lastRound?.round === "f" &&
    lastRound.slots.some((slot) => slot.game != null && !slot.ghost && !slot.game.isBye);
  const finalSlot = hasChampion
    ? (lastRound?.slots.find((slot) => slot.game != null && !slot.ghost && !slot.game.isBye) ?? null)
    : null;
  const onSheet = new Set(
    layout.rounds.flatMap((section) =>
      section.slots.flatMap((slot) => (slot.game ? [`${slot.game.round}:${slot.game.slot}`] : [])),
    ),
  );
  const futureOpts = { date: asOfDate, liveRound };

  return (
    <div className="line-bracket mt-6">
      {layout.rounds.map((section, index) => {
        const next = layout.rounds[index + 1];
        const isLast = !next;
        const playable = section.slots.filter((slot) => slot.game && !slot.game.isBye);
        const roundFuture =
          playable.length > 0 && playable.every((slot) => slot.game != null && isFutureSiteGame(slot.game, futureOpts));
        const roundId = section.round;
        const title = !isRoundId(roundId)
          ? isLast
            ? "Finals"
            : `Round ${index + 1}`
          : roundId === "f"
            ? "Finals"
            : treeRoundLabel(roundId, firstRound ?? roundId, playIns);
        return (
          <Fragment key={section.round}>
            <section className={cn("line-round", roundFuture && "is-future")} style={{ gridTemplateRows: rows }}>
              <h3 className="bracket-round-title">{title}</h3>
              {section.slots.map((slot, slotIndex) => (
                <div
                  key={
                    slot.game
                      ? `${slot.game.round}-${slot.game.slot}-${slot.game.id ?? "x"}`
                      : `empty-${section.round}-${slotIndex}`
                  }
                  className="line-slot"
                  style={{
                    gridRow: `${slot.rowStart + 1} / span ${slot.rowSpan}`,
                    ["--card-at" as string]: String(slot.cardAt ?? 0.5),
                  }}
                >
                  {slot.game == null ? null : slot.game.isBye ? (
                    <ByeCard game={slot.game} numbers={numbers} feeders={allGames} softFill={softFill} />
                  ) : (
                    <LineMatch
                      game={slot.game}
                      numbers={numbers}
                      canPickField={editable && !slot.ghost}
                      future={isFutureSiteGame(slot.game, futureOpts)}
                      ghost={slot.ghost}
                      feeders={allGames}
                      nextNote={isLast && !slot.ghost ? winnerPlaysNote(slot.game, allGames, onSheet) : null}
                      onField={onField}
                      onScore={onScore}
                      softFill={softFill}
                    />
                  )}
                </div>
              ))}
            </section>
            {next ? <LineJoinColumn slots={next.slots} rows={rows} /> : null}
            {isLast && hasChampion && finalSlot ? (
              <LineJoinColumn
                slots={[{ rowStart: finalSlot.rowStart, rowSpan: finalSlot.rowSpan, arms: 1, armSpans: [], cardAt: finalSlot.cardAt }]}
                rows={rows}
              />
            ) : null}
          </Fragment>
        );
      })}
      {hasChampion && finalSlot ? (
        <section className="line-round" style={{ gridTemplateRows: rows }}>
          <h3 className="bracket-round-title">Champion</h3>
          <div className="line-slot" style={{ gridRow: `${finalSlot.rowStart + 1} / span ${finalSlot.rowSpan}` }}>
            <div className="bracket-champion">
              <p className="font-display text-base font-bold uppercase leading-tight">Tournament Champion</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function SiteBoard({
  games,
  parks,
  playIns,
  firstRound,
  asOfDate,
  liveRound,
  allGames,
  editable,
  onField,
  onAddField,
  fieldError,
  busy,
  softFill,
  flaggedIds,
  onSwap,
  onScore,
  onPostScore,
}: {
  games: ScheduleGame[];
  parks: WeekendLocation[];
  playIns: boolean;
  firstRound: RoundId | null;
  asOfDate: string;
  liveRound: string | null;
  allGames: ScheduleGame[];
  editable: boolean;
  onField: (gameId: number, locationId: number | null) => void;
  onAddField: (gameId: number, name: string, address: string) => void;
  fieldError: string | null;
  busy: boolean;
  softFill?: boolean;
  flaggedIds?: number[];
  onSwap?: (gameId: number, teamAId: number, teamBId: number) => void;
  onScore?: (game: ScheduleGame) => void;
  onPostScore?: (gameId: number, homeScore: number, awayScore: number, forfeit?: "home" | "away" | null) => void;
}) {
  const [fieldGame, setFieldGame] = useState<ScheduleGame | null>(null);
  const numbers = numbersFor(allGames.length > 0 ? allGames : games);
  const poolGames = games.filter((game) => game.round === "pool" && !game.isBye);
  const layout = layoutSiteBracket(games, allGames);
  const hasKnockoutTree = layout.rounds.length > 0;

  return (
    <div className="site-sheet mb-8">
      <p className="text-sm text-muted">
        {poolGames.length > 0 && hasKnockoutTree
          ? "Pool play is the block schedule. Bracket games join into this park’s last game today."
          : hasKnockoutTree
            ? "Names sit on a line. Two games join into one, left to right, down to the championship."
            : null}
      </p>
      {poolGames.length > 0 ? (
        <PoolGrid
          games={poolGames}
          rosterGames={allGames.filter((game) => game.round === "pool")}
          parks={parks}
          editable={editable}
          busy={busy}
          fieldError={fieldError}
          onField={onField}
          onAddField={onAddField}
          softFill={softFill}
          flaggedIds={flaggedIds}
          onSwap={onSwap}
          onScore={onPostScore}
        />
      ) : null}
      {hasKnockoutTree ? (
        <LineBracketTree
          layout={layout}
          numbers={numbers}
          editable={editable}
          asOfDate={asOfDate}
          liveRound={liveRound}
          allGames={allGames}
          playIns={playIns}
          firstRound={firstRound}
          showChampion
          onField={setFieldGame}
          onScore={onScore}
          softFill={softFill}
        />
      ) : null}
      {fieldGame ? (
        <FieldDialog
          parks={parks}
          currentId={fieldGame.locationId}
          busy={busy}
          error={fieldError}
          onClose={() => setFieldGame(null)}
          onPick={(locationId) => {
            onField(fieldGame.id, locationId);
            setFieldGame(null);
          }}
          onAdd={({ name, address }) => {
            onAddField(fieldGame.id, name, address);
            setFieldGame(null);
          }}
        />
      ) : null}
    </div>
  );
}

export function CalendarList({ games }: { games: ScheduleGame[] }) {
  const playable = games.filter((game) => !game.isBye);
  const groups = new Map<string, ScheduleGame[]>();
  for (const game of playable) {
    const key = game.startDate ?? "tbd";
    const list = groups.get(key) ?? [];
    list.push(game);
    groups.set(key, list);
  }
  const days = [...groups.entries()];
  if (days.length === 0) {
    return <p className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-muted">No games on the clock yet.</p>;
  }
  return (
    <div className="space-y-6">
      {days.map(([day, list]) => (
        <section key={day} className="space-y-3">
          <h3 className="font-display text-2xl font-bold uppercase">
            {list[0]?.when.split(" · ")[0] ?? "TBD"}
          </h3>
          {list
            .slice()
            .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""))
            .map((game) => (
              <article key={game.id} className="rounded-lg border border-line bg-surface px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {game.gameNumber != null ? `Game ${game.gameNumber}` : game.roundLabel}
                </p>
                <p className="mt-1 font-display text-2xl font-bold uppercase leading-none">
                  {game.homeName ?? (game.homeSeed ? seedLabel(game.homeSeed) : "TBD")} vs{" "}
                  {game.awayName ?? (game.awaySeed ? seedLabel(game.awaySeed) : "TBD")}
                </p>
                <p className="mt-2 text-sm font-medium">{game.when}</p>
                <p className="mt-1 text-sm text-muted">
                  {game.locationName ?? "Field TBD"}
                  {game.fieldConfirmed ? "" : game.locationName ? " · suggested" : ""}
                </p>
              </article>
            ))}
        </section>
      ))}
    </div>
  );
}

export type { RoundId };

export function ScoreDialog({
  games,
  busy,
  error,
  onClose,
  onSave,
}: {
  games: ScheduleGame[];
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (gameId: number, homeScore: number, awayScore: number, forfeit?: "home" | "away" | null) => void;
}) {
  const playable = games.filter((game) => !game.isBye && (game.homeTeamId != null || game.awayTeamId != null || game.round !== "pool"));
  const [gameId, setGameId] = useState<number>(playable[0]?.id ?? 0);
  const current = playable.find((game) => game.id === gameId) ?? playable[0] ?? null;
  const [home, setHome] = useState(current?.homeScore != null ? String(current.homeScore) : "");
  const [away, setAway] = useState(current?.awayScore != null ? String(current.awayScore) : "");
  const [forfeit, setForfeit] = useState<"home" | "away" | "">("");
  const [editing, setEditing] = useState(false);
  const gameEdit = useGameEdit();

  function pick(id: number) {
    const game = playable.find((row) => row.id === id);
    setGameId(id);
    setHome(game?.homeScore != null ? String(game.homeScore) : "");
    setAway(game?.awayScore != null ? String(game.awayScore) : "");
    setForfeit(game?.forfeit === "home" || game?.forfeit === "away" ? game.forfeit : "");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!current) return;
    onSave(
      current.id,
      Number.parseInt(home || "0", 10),
      Number.parseInt(away || "0", 10),
      forfeit === "home" || forfeit === "away" ? forfeit : null,
    );
  }


  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-scrim p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="score-dialog-title"
        className="w-full max-w-md rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="score-dialog-title" className="font-display text-2xl font-bold uppercase">
            {editing ? "Edit game" : "Post score"}
          </h2>
          <Button type="button" variant="ghost" className="px-2 text-muted" onClick={onClose}>
            Close
          </Button>
        </div>
        {playable.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No games ready for a score yet.</p>
        ) : editing && current && gameEdit ? (
          <GameDetailsForm game={current} onDone={() => setEditing(false)} />
        ) : (
          <>
          <form noValidate onSubmit={submit} className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label>Game</Label>
              {playable.length === 1 ? (
                <p className="text-sm font-semibold">
                  {current?.gameNumber != null ? `G${current.gameNumber} · ` : ""}
                  {current?.homeName ?? "TBD"} vs {current?.awayName ?? "TBD"}
                </p>
              ) : (
              <select
                id="score-game"
                value={String(current?.id ?? "")}
                onChange={(e) => pick(Number.parseInt(e.target.value, 10))}
                className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"
              >
                {playable.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.gameNumber != null ? `G${game.gameNumber} · ` : ""}
                    {game.homeName ?? "TBD"} vs {game.awayName ?? "TBD"}
                  </option>
                ))}
              </select>
              )}
              {current?.when ? <p className="text-xs text-muted">{current.when}{current.locationName ? ` · ${current.locationName}` : ""}</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="score-home">{current?.homeName ?? "Home"}</Label>
                <Input id="score-home" inputMode="numeric" value={home} onChange={(e) => setHome(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="score-away">{current?.awayName ?? "Away"}</Label>
                <Input id="score-away" inputMode="numeric" value={away} onChange={(e) => setAway(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="score-forfeit">No-show</Label>
              <select
                id="score-forfeit"
                value={forfeit}
                onChange={(e) => setForfeit(e.target.value === "home" || e.target.value === "away" ? e.target.value : "")}
                className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"
              >
                <option value="">They played</option>
                <option value="home">{current?.homeName ?? "Home"} no-show. This game only.</option>
                <option value="away">{current?.awayName ?? "Away"} no-show. This game only.</option>
              </select>
            </div>
            {error ? (

              <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={busy || !current}>
              {busy ? "Saving…" : "Save score"}
            </Button>
            {gameEdit && current ? (
              <Button type="button" variant="outline" className="w-full" onClick={() => setEditing(true)}>
                Edit time or park
              </Button>
            ) : null}
          </form>
          {current ? <TeamOutActions game={current} /> : null}
          </>
        )}
      </div>
    </div>
  );
}
