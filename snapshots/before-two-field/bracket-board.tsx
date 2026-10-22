import { createContext, Fragment, useContext, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FieldDialog } from "@/components/field-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScheduleAge, ScheduleGame, WeekendLocation } from "@/lib/pbi/api";
import { formatClock, formatKickoff, hasPlayInRound, isFutureSiteGame, isRoundId, layoutSiteBracket, nextKnockoutGame, ROUND_IDS, seedLabel, shortParkName, treeRoundLabel, type RoundId, type SiteBracketLayout } from "@/lib/pbi/bracket";
import { formatDayTab } from "@/lib/pbi/weekends";
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

function PoolCell({
  game,
  editable,
  flagged,
  numberOf,
  teamLabel,
  onOpen,
}: {
  game: ScheduleGame;
  editable: boolean;
  flagged: boolean;
  numberOf: (id: number | null) => number | null;
  teamLabel: (game: ScheduleGame, side: "home" | "away") => string;
  onOpen: () => void;
}) {
  const result = game.forfeit || game.noContest ? gameResultText(game) : null;
  const scored = !result && game.homeScore != null && game.awayScore != null;
  const homeRuns = game.homeScore ?? -1;
  const awayRuns = game.awayScore ?? -1;
  const homeLeads = scored && (game.forfeit === "away" || (game.forfeit !== "home" && homeRuns > awayRuns));
  const awayLeads = scored && (game.forfeit === "home" || (game.forfeit !== "away" && awayRuns > homeRuns));
  const sides = [
    { key: "home", no: numberOf(game.homeTeamId), name: teamLabel(game, "home"), score: game.homeScore, win: homeLeads },
    { key: "away", no: numberOf(game.awayTeamId), name: teamLabel(game, "away"), score: game.awayScore, win: awayLeads },
  ];
  return (
    <button
      type="button"
      disabled={!editable}
      onClick={onOpen}
      className={cn("pool-grid-cell disabled:cursor-default", flagged && "is-flagged")}
    >
      {sides.map((side) => (
        <span key={side.key} className="pool-grid-side">
          <span className="pool-grid-no">{side.no ?? "—"}</span>
          <span className={cn("pool-grid-name", scored && !side.win && "is-behind", side.win && "is-win")}>{side.name}</span>
          {scored ? <span className={cn("pool-grid-runs", side.win && "is-win")}>{side.score}</span> : null}
        </span>
      ))}
      {result ? <span className="block px-1 pb-1 text-[10px] font-bold uppercase">{result}</span> : null}
    </button>
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
            Forfeit remaining games
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
    if (sheet.locked && !window.confirm("The pool and bracket are locked. This only moves this one game. It does not rebuild the sheet. Save it anyway?")) {
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
        <Label htmlFor={`game-park-${game.id}`}>Field</Label>
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
  numbers,
  busy,
  error,
  onClose,
  onSwap,
  onScore,
}: {
  game: ScheduleGame;
  games: ScheduleGame[];
  numbers: Map<string, number>;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSwap: (gameId: number, teamAId: number, teamBId: number, scope: "game" | "all") => void;
  onScore?: (gameId: number, homeScore: number, awayScore: number, forfeit?: "home" | "away" | null, clear?: boolean) => void | Promise<unknown>;
}) {
  const [spot, setSpot] = useState<number | null>(null);
  const [trade, setTrade] = useState<number | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [homeScore, setHomeScore] = useState(game.homeScore != null ? String(game.homeScore) : "");
  const [awayScore, setAwayScore] = useState(game.awayScore != null ? String(game.awayScore) : "");
  const [forfeit, setForfeit] = useState<"home" | "away" | "">(
    game.forfeit === "home" || game.forfeit === "away" ? game.forfeit : "",
  );
  const [editing, setEditing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const gameEdit = useGameEdit();
  const n = numbers.get(`${game.round}:${game.slot}`);
  const scored = game.homeScore != null || game.awayScore != null || game.scoreLocked;
  const roster = poolRoster(games);
  const pools = new Set(roster.map((row) => row.pool));
  const numberOf = (id: number | null) => roster.find((row) => row.id === id)?.number ?? null;
  const homeNo = numberOf(game.homeTeamId);
  const awayNo = numberOf(game.awayTeamId);
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-scrim p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pool-game-title"
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {n != null ? `Game ${n}` : "Game"}
            </p>
            <h2 id="pool-game-title" className="font-display text-2xl font-bold uppercase leading-none">
              {game.homeName ?? "TBD"} vs {game.awayName ?? "TBD"}
            </h2>
          </div>
          <Button type="button" variant="ghost" className="px-2 text-muted" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted">
          {[game.startDate ? formatKickoff(game.startDate, game.startTime) : formatClock(game.startTime), game.locationName ? shortParkName(game.locationName) : "Field not set", game.roundLabel]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {editing ? (
          <GameDetailsForm game={game} onDone={() => setEditing(false)} />
        ) : (
        <>
        {scored ? (
          <p className="mt-3 text-center font-display text-3xl font-bold leading-none">
            {game.forfeit || game.noContest ? gameResultText(game) : `${game.homeScore ?? "–"} – ${game.awayScore ?? "–"}`}
          </p>
        ) : null}
        {onScore ? (
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (busy) return;
              const homeText = homeScore.trim();
              const awayText = awayScore.trim();
              const side = forfeit === "home" || forfeit === "away" ? forfeit : null;
              if (!side && (homeText === "" || awayText === "")) {
                setLocalError("Enter both scores.");
                return;
              }
              const home = Number.parseInt(side ? "0" : homeText, 10);
              const away = Number.parseInt(side ? "0" : awayText, 10);
              if (!side && (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0 || home > 99 || away > 99)) {
                setLocalError("Scores need to be whole numbers from 0 to 99.");
                return;
              }
              setLocalError(null);
              void Promise.resolve(onScore(game.id, home, away, side)).then(
                () => onClose(),
                () => setLocalError(null),
              );
            }}
          >
            <p className="text-sm font-semibold">{scored ? "Update score" : "Score"}</p>
            {scored ? <p className="text-xs text-muted">This score is already in. Saving replaces it.</p> : null}
            <div className="grid grid-cols-2 items-end gap-2">
              <div>
                <Label htmlFor="pool-score-home" className="mb-1 flex min-h-10 w-full items-end leading-5">
                  <span className="min-w-0">{game.homeName ?? "Home"}</span>
                </Label>
                <Input
                  id="pool-score-home"
                  inputMode="numeric"
                  value={homeScore}
                  onChange={(event) => setHomeScore(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="pool-score-away" className="mb-1 flex min-h-10 w-full items-end leading-5">
                  <span className="min-w-0">{game.awayName ?? "Away"}</span>
                </Label>
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
              <option value="home">{game.homeName ?? "Home"} no-show. This game only.</option>
              <option value="away">{game.awayName ?? "Away"} no-show. This game only.</option>
            </select>
            {localError || error ? (
              <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
                {localError ?? error}
              </p>
            ) : null}
            <Button
              type="submit"
              size="sm"
              className="w-full"
              disabled={busy}
              onMouseDown={(event) => event.preventDefault()}
            >
              {busy ? "Saving…" : scored ? "Update score" : "Save score"}
            </Button>
            {scored ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={busy}
                onClick={() => {
                  void Promise.resolve(onScore(game.id, 0, 0, null, true)).then(
                    () => onClose(),
                    () => undefined,
                  );
                }}
              >
                Clear score
              </Button>
            ) : null}
          </form>
        ) : null}
        {scored || gameEdit?.locked ? null : (
          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setSwapOpen(true);
                setSpot(null);
                setTrade(null);
              }}
            >
              Swap teams
            </Button>
          </div>
        )}
        {gameEdit ? (
          <Button type="button" variant="outline" size="sm" className="mt-2 w-full" onClick={() => setEditing(true)}>
            Change time or field
          </Button>
        ) : null}
        </>
        )}
        <TeamOutActions game={game} />
        {error ? (
          <p className="mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
    {swapOpen ? (
      <SwapTeamsPopup
        game={game}
        games={games}
        roster={roster}
        pools={pools}
        homeNo={homeNo}
        awayNo={awayNo}
        spot={spot}
        trade={trade}
        busy={busy}
        onSpot={setSpot}
        onTrade={setTrade}
        onClose={() => setSwapOpen(false)}
        onSwap={(scope) => {
          if (spot == null || trade == null) return;
          onSwap(game.id, spot, trade, scope);
          onClose();
        }}
      />
    ) : null}
    </>,
    document.body,
  );
}

function SwapTeamsPopup({
  game,
  games,
  roster,
  pools,
  homeNo,
  awayNo,
  spot,
  trade,
  busy,
  onSpot,
  onTrade,
  onClose,
  onSwap,
}: {
  game: ScheduleGame;
  games: ScheduleGame[];
  roster: { id: number; number: number; name: string; pool: number }[];
  pools: Set<number>;
  homeNo: number | null;
  awayNo: number | null;
  spot: number | null;
  trade: number | null;
  busy: boolean;
  onSpot: (id: number | null) => void;
  onTrade: (id: number | null) => void;
  onClose: () => void;
  onSwap: (scope: "game" | "all") => void;
}) {
  const moving = roster.find((row) => row.id === spot);
  const other = roster.find((row) => row.id === trade);
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-scrim p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Swap teams"
        className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-bg p-4 text-fg shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-display text-2xl font-bold uppercase">Swap teams</h2>
        {spot == null ? (
          <>
            <p className="mt-3 text-sm">Which team in this game is moving?</p>
            <div className="mt-3 space-y-2">
              {[
                { id: game.homeTeamId, name: game.homeName, no: homeNo },
                { id: game.awayTeamId, name: game.awayName, no: awayNo },
              ]
                .filter((side) => side.id != null)
                .map((side) => (
                  <button
                    key={side.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md border border-line bg-surface px-3 py-3 text-left"
                    onClick={() => onSpot(side.id)}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-primary-fg">{side.no ?? "?"}</span>
                    <span className="font-semibold">{side.name ?? "Team"}</span>
                  </button>
                ))}
            </div>
          </>
        ) : trade == null ? (
          <>
            <p className="mt-3 text-sm">Trade {moving?.name ?? "that team"} with who? Any field.</p>
            <div className="mt-3 space-y-2">
              {roster
                .filter((team) => team.id !== spot)
                .map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md border border-line bg-surface px-3 py-3 text-left"
                    onClick={() => onTrade(team.id)}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-primary-fg">{team.number}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{team.name}</span>
                      {pools.size > 1 ? <span className="block text-xs text-muted">Pool {String.fromCharCode(65 + team.pool)}</span> : null}
                    </span>
                  </button>
                ))}
            </div>
            <Button type="button" variant="ghost" className="mt-2 px-0 text-sm" onClick={() => onSpot(null)}>
              Back
            </Button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm">
              Swap the names for {moving?.name ?? "that team"} and {other?.name ?? "that team"}. Times and fields stay.
            </p>
            <Button type="button" className="mt-4 w-full" disabled={busy} onClick={() => onSwap("game")}>
              {busy ? "Saving…" : "This game"}
            </Button>
            <Button type="button" variant="outline" className="mt-2 w-full" disabled={busy} onClick={() => onSwap("all")}>
              All their games
            </Button>
            <Button type="button" variant="ghost" className="mt-2 w-full text-muted" onClick={() => onTrade(null)}>
              Back
            </Button>
          </>
        )}
        <Button type="button" variant="outline" className="mt-3 w-full" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>,
    document.body,
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
    if (softFill && feederSeed != null) return { seed: feederSeed, text: "TBD" };
    return { seed: null, text: "Winner of game" };
  }
  if (seed) return { seed, text: "TBD" };
  return { seed: null, text: "TBD" };
}

/** Pool seed stays with the team after the play-in. Later games don't store it. */
function seatingSeed(game: ScheduleGame, side: "home" | "away", games: ScheduleGame[]): number | null {
  const own = side === "home" ? game.homeSeed : game.awaySeed;
  if (own != null) return own;
  const teamId = side === "home" ? game.homeTeamId : game.awayTeamId;
  if (teamId == null) return null;
  for (const row of games) {
    if (row.round === "pool") continue;
    if (row.homeTeamId === teamId && row.homeSeed != null) return row.homeSeed;
    if (row.awayTeamId === teamId && row.awaySeed != null) return row.awaySeed;
  }
  return null;
}

function finalWinner(
  game: ScheduleGame,
  numbers: Map<string, number>,
  feeders: ScheduleGame[],
  softFill?: boolean,
): { name: string; seed: number | null } | null {
  if (game.noContest || game.homeScore == null || game.awayScore == null) return null;
  const homeWin = game.forfeit === "away" || (game.forfeit !== "home" && game.homeScore > game.awayScore);
  const awayWin = game.forfeit === "home" || (game.forfeit !== "away" && game.awayScore > game.homeScore);
  if (!homeWin && !awayWin) return null;
  const copy = sideCopy(game, homeWin ? "home" : "away", numbers, feeders, Boolean(softFill));
  const name = copy.text && copy.text !== "TBD" && copy.text !== "Bye" && !copy.text.startsWith("Win ") && copy.text !== "Winner of game"
    ? copy.text
    : homeWin
      ? game.homeName
      : game.awayName;
  if (!name) return null;
  return { name, seed: copy.seed ?? seatingSeed(game, homeWin ? "home" : "away", feeders) };
}

function ChampionPlate({ winner }: { winner: { name: string; seed: number | null } | null }) {
  if (!winner) {
    return (
      <div className="bracket-champion">
        <p className="font-display text-base font-bold uppercase leading-tight">Tournament Champion</p>
      </div>
    );
  }
  return (
    <div className="bracket-champion is-crowned">
      <p className="bracket-champion-kicker">Tournament Champion</p>
      <p className="bracket-champion-name">
        {winner.seed != null ? <span className="bracket-champion-seed">{winner.seed}</span> : null}
        {winner.name}
      </p>
    </div>
  );
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
  const seed = holder.seed ?? seatingSeed(game, "home", feeders) ?? seatingSeed(game, "away", feeders);
  const waiting = holder.text === "Bye" || holder.text === "TBD";
  return (
    <article className="line-match">
      <div className="bracket-card">
        {waiting ? (
          <span className="bracket-card-meta">Bye</span>
        ) : (
          <span className="bracket-card-team is-win">
            {holder.seed != null || seed != null ? <span className="bracket-card-seed">{seed}</span> : null}
            <span className="bracket-card-name is-win">{holder.text}</span>
            <span className="bracket-card-bye">Bye</span>
          </span>
        )}
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
  hideStub,
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
  hideStub?: boolean;
}) {
  const home = sideCopy(game, "home", numbers, feeders, Boolean(softFill));
  const away = sideCopy(game, "away", numbers, feeders, Boolean(softFill));
  const homeSeed = seatingSeed(game, "home", feeders);
  const awaySeed = seatingSeed(game, "away", feeders);
  const place = game.locationName ? shortParkName(game.locationName) : "Field TBD";
  const clock = formatClock(game.startTime);
  const when = game.startDate ? formatKickoff(game.startDate, game.startTime) : clock;
  const gameTag = game.gameNumber != null ? `G${game.gameNumber}` : "";
  const scored = !game.noContest && game.homeScore != null && game.awayScore != null;
  const homeRuns = game.homeScore ?? 0;
  const awayRuns = game.awayScore ?? 0;
  const homeWin = scored && (game.forfeit === "away" || (game.forfeit !== "home" && homeRuns > awayRuns));
  const awayWin = scored && (game.forfeit === "home" || (game.forfeit !== "away" && awayRuns > homeRuns));
  const note = game.noContest ? "No contest" : game.forfeit ? "Forfeit" : null;
  const meta = [gameTag, when, place, note].filter(Boolean).join(" · ");

  return (
    <article className={cn("line-match", (future || ghost) && "is-future", ghost && "is-ghost", hideStub && "is-elbow-source")}>
      <button
        type="button"
        disabled={ghost || (!onScore && !canPickField)}
        onClick={() => (onScore ? onScore(game) : onField(game))}
        className="bracket-card disabled:cursor-default"
      >
        <span className={cn("bracket-card-team", homeWin && "is-win", scored && !homeWin && "is-lose")}>
          {homeSeed != null ? <span className="bracket-card-seed">{homeSeed}</span> : null}
          <span className={cn("bracket-card-name", scored && !homeWin && "is-behind", homeWin && "is-win")}>{home.text}</span>
          {scored ? (
            <span className={cn("bracket-card-runs", homeWin && "is-win", !homeWin && "is-behind")}>{game.homeScore}</span>
          ) : null}
        </span>
        <span className="bracket-card-meta">{meta}</span>
        <span className={cn("bracket-card-team", awayWin && "is-win", scored && !awayWin && "is-lose")}>
          {awaySeed != null ? <span className="bracket-card-seed">{awaySeed}</span> : null}
          <span className={cn("bracket-card-name", scored && !awayWin && "is-behind", awayWin && "is-win")}>{away.text}</span>
          {scored ? (
            <span className={cn("bracket-card-runs", awayWin && "is-win", !awayWin && "is-behind")}>{game.awayScore}</span>
          ) : null}
        </span>
      </button>
      {nextNote ? <p className="line-next">{nextNote}</p> : null}
    </article>
  );
}

function joinPath(ats: number[], cardAt: number): string {
  const y = (n: number) => Math.round(n * 1000) / 10;
  const mid = 50;
  if (ats.length >= 2) {
    const top = y(ats[0]!);
    const bot = y(ats[ats.length - 1]!);
    const out = y(cardAt);
    return `M -6 ${top} H ${mid} V ${bot} H -6 M ${mid} ${out} H 106`;
  }
  if (ats.length === 1 && Math.abs(ats[0]! - cardAt) > 0.04) {
    const inn = y(ats[0]!);
    const out = y(cardAt);
    return `M -6 ${inn} H ${mid} V ${out} H 106`;
  }
  return `M -6 ${y(cardAt)} H 106`;
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
        if (slot.arms <= 0) {
          return <div key={`${slot.rowStart}-${index}`} className="line-join-cell" style={{ gridRow: `${slot.rowStart + 1} / span ${slot.rowSpan}` }} />;
        }
        return (
          <div
            key={`${slot.rowStart}-${index}`}
            className="line-join-cell"
            style={{ gridRow: `${slot.rowStart + 1} / span ${slot.rowSpan}` }}
          >
            <svg className="line-join-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <path d={joinPath(ats, cardAt)} fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>
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
                <ChampionPlate winner={null} />
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
  quiet = false,
  maps = true,
}: {
  games: ScheduleGame[];
  rosterGames?: ScheduleGame[];
  parks: WeekendLocation[];
  editable: boolean;
  onField: (gameId: number, locationId: number | null) => void;
  onAddField: (gameId: number, name: string, address: string) => void;
  onSwap?: (gameId: number, teamAId: number, teamBId: number, scope: "game" | "all") => void;
  onScore?: (gameId: number, homeScore: number, awayScore: number, forfeit?: "home" | "away" | null, clear?: boolean) => void | Promise<unknown>;
  fieldError: string | null;
  busy: boolean;
  softFill?: boolean;
  flaggedIds?: number[];
  quiet?: boolean;
  maps?: boolean;
}) {
  const [editGame, setEditGame] = useState<ScheduleGame | null>(null);
  const flagged = new Set(flaggedIds ?? []);
  const numbers = numbersFor(games);
  const playable = games
    .filter((game) => game.round === "pool" && !game.isBye && (game.homeTeamId != null || game.awayTeamId != null))
    .slice()
    .sort(
      (a, b) =>
        (a.startTime ?? "").localeCompare(b.startTime ?? "") ||
        (a.locationName ?? "").localeCompare(b.locationName ?? "") ||
        a.slot - b.slot,
    );
  if (playable.length === 0) return null;
  const dates = [...new Set(playable.map((game) => game.startDate).filter((date): date is string => Boolean(date)))];
  const dated = dates.length > 0;
  const times = [...new Set(playable.map((game) => game.startTime).filter((row): row is string => Boolean(row)))].sort();
  const rowKeys = dated
    ? [...new Set(playable.filter((game) => game.startDate && game.startTime).map((game) => `${game.startDate}|${game.startTime}`))].sort()
    : times;
  const usedIds = [...new Set(playable.map((game) => game.locationId).filter((id): id is number => id != null))];
  const cols = parks.filter((park) => usedIds.includes(park.id));
  const fields = cols.length > 0 ? cols : parks;
  const byCell = new Map<string, ScheduleGame[]>();
  const unscheduled: ScheduleGame[] = [];
  for (const game of playable) {
    if (game.locationId == null || !game.startTime || (dated && !game.startDate)) {
      unscheduled.push(game);
      continue;
    }
    const key = `${game.locationId}|${dated ? game.startDate : ""}|${game.startTime}`;
    const list = byCell.get(key) ?? [];
    list.push(game);
    byCell.set(key, list);
  }

  const roster = poolRoster(rosterGames ?? games);
  function numberOf(id: number | null) {
    return roster.find((row) => row.id === id)?.number ?? null;
  }
  function teamLabel(game: ScheduleGame, side: "home" | "away") {
    const name = side === "home" ? game.homeName : game.awayName;
    if (name) return name;
    return "TBD";
  }

  return (
    <div className="pool-sheet mb-8">
      {editable || quiet ? null : <p className="text-sm text-muted">Pool games at this park.</p>}
      <div className={cn("pool-grid-wrap mt-4", fields.length > 2 && "is-wide", dated && "is-dated")}>
        <table className="pool-grid">
          <thead>
            <tr>
              <th className="pool-grid-time">Time</th>
              {fields.map((park) => {
                const address = park.address.trim();
                const placeholder = /^Field \d+ TBD$/i.test(park.name.trim());
                const navigate = maps && address.length > 0 && !placeholder;
                return (
                  <th key={park.id}>
                    <span className="block">{shortParkName(park.name)}</span>
                    {navigate ? (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 block text-[10px] font-bold normal-case tracking-normal text-primary underline"
                      >
                        Navigate
                      </a>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rowKeys.map((key) => {
              const [rowDate, rowTime] = dated ? key.split("|") : ["", key];
              return (
              <tr key={key}>
                <th className="pool-grid-time">
                  {rowDate ? <span className="block text-[10px] font-semibold leading-none">{formatDayTab(rowDate)}</span> : null}
                  {formatClock(rowTime)}
                </th>
                {fields.map((park) => {
                  const gamesHere = byCell.get(`${park.id}|${dated ? rowDate : ""}|${rowTime}`) ?? [];
                  if (gamesHere.length === 0) {
                    return (
                      <td key={park.id} className="pool-grid-empty">
                        —
                      </td>
                    );
                  }
                  return (
                    <td key={park.id} className="align-top">
                      <div className="flex flex-col gap-2">
                        {gamesHere.map((game) => (
                          <PoolCell
                            key={game.id}
                            game={game}
                            editable={editable}
                            flagged={flagged.has(game.id)}
                            numberOf={numberOf}
                            teamLabel={teamLabel}
                            onOpen={() => setEditGame(game)}
                          />
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
              );
            })}
            {unscheduled.map((game) => {
              const parkId = game.locationId ?? fields[0]?.id ?? null;
              return (
                <tr key={`open-${game.id}`}>
                  <th className="pool-grid-time">Not set</th>
                  {fields.map((park) =>
                    park.id === parkId ? (
                      <td key={park.id} className="align-top">
                        <PoolCell
                          game={game}
                          editable={editable}
                          flagged={flagged.has(game.id)}
                          numberOf={numberOf}
                          teamLabel={teamLabel}
                          onOpen={() => setEditGame(game)}
                        />
                      </td>
                    ) : (
                      <td key={park.id} className="pool-grid-empty">
                        —
                      </td>
                    ),
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {editGame && (onSwap || onScore) ? (
        <PoolGameDialog
          game={
            games.find((row) => row.id === editGame.id) ??
            games.find(
              (row) =>
                row.round === editGame.round &&
                row.slot === editGame.slot &&
                row.homeTeamId === editGame.homeTeamId &&
                row.awayTeamId === editGame.awayTeamId,
            ) ??
            editGame
          }
          games={rosterGames ?? games}
          numbers={numbers}
          busy={busy}
          error={fieldError}
          onClose={() => setEditGame(null)}
          onSwap={onSwap ?? (() => undefined)}
          onScore={onScore}
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
                  {slot.game == null || (playIns && firstRound != null && section.round === firstRound && slot.game.isBye) ? null : slot.game.isBye ? (
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
                      hideStub={Boolean(
                        playIns &&
                          firstRound != null &&
                          slot.game.round === firstRound &&
                          allGames.some((row) => {
                            const feeds =
                              (row.homeFromRound === slot.game?.round && row.homeFromSlot === slot.game.slot) ||
                              (row.awayFromRound === slot.game?.round && row.awayFromSlot === slot.game.slot);
                            if (!feeds || !slot.game) return false;
                            const other =
                              row.homeFromRound === slot.game.round && row.homeFromSlot === slot.game.slot
                                ? allGames.find((game) => game.round === row.awayFromRound && game.slot === row.awayFromSlot)
                                : allGames.find((game) => game.round === row.homeFromRound && game.slot === row.homeFromSlot);
                            return Boolean(other?.isBye);
                          }),
                      )}
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
          <div
            className="line-slot"
            style={{
              gridRow: `${finalSlot.rowStart + 1} / span ${finalSlot.rowSpan}`,
              ["--card-at" as string]: String(finalSlot.cardAt ?? 0.5),
            }}
          >
            <ChampionPlate
              winner={finalSlot.game ? finalWinner(finalSlot.game, numbers, allGames, softFill) : null}
            />
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
  onSwap?: (gameId: number, teamAId: number, teamBId: number, scope: "game" | "all") => void;
  onScore?: (game: ScheduleGame) => void;
  onPostScore?: (gameId: number, homeScore: number, awayScore: number, forfeit?: "home" | "away" | null, clear?: boolean) => void;
}) {
  const [fieldGame, setFieldGame] = useState<ScheduleGame | null>(null);
  const numbers = numbersFor(allGames.length > 0 ? allGames : games);
  const poolGames = games.filter((game) => game.round === "pool" && !game.isBye);
  const layout = layoutSiteBracket(games, allGames);
  const hasKnockoutTree = layout.rounds.length > 0;

  return (
    <div className="site-sheet mb-8">
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
  onSave: (gameId: number, homeScore: number, awayScore: number, forfeit?: "home" | "away" | null, clear?: boolean) => void;
}) {
  const playable = games.filter((game) => !game.isBye && (game.homeTeamId != null || game.awayTeamId != null || game.round !== "pool"));
  const [gameId, setGameId] = useState<number>(playable[0]?.id ?? 0);
  const current = playable.find((game) => game.id === gameId) ?? playable[0] ?? null;
  const [home, setHome] = useState(current?.homeScore != null ? String(current.homeScore) : "");
  const [away, setAway] = useState(current?.awayScore != null ? String(current.awayScore) : "");
  const [forfeit, setForfeit] = useState<"home" | "away" | "">("");
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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
    if (!current || busy) return;
    const side = forfeit === "home" || forfeit === "away" ? forfeit : null;
    const homeText = home.trim();
    const awayText = away.trim();
    if (!side && (homeText === "" || awayText === "")) {
      setFormError("Enter both scores.");
      return;
    }
    const homeN = Number.parseInt(side ? "0" : homeText, 10);
    const awayN = Number.parseInt(side ? "0" : awayText, 10);
    if (!side && (!Number.isInteger(homeN) || !Number.isInteger(awayN) || homeN < 0 || awayN < 0 || homeN > 99 || awayN > 99)) {
      setFormError("Scores need to be whole numbers from 0 to 99.");
      return;
    }
    setFormError(null);
    const alreadyIn = current.homeScore != null || current.awayScore != null || current.forfeit || current.noContest;
    if (alreadyIn && gameEdit?.locked && !window.confirm("This score is already in. Changing it can move the standings and who goes on. Save it anyway?")) {
      return;
    }
    onSave(current.id, homeN, awayN, side);
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
            <div className="grid grid-cols-2 items-end gap-3">
              <div>
                <Label htmlFor="score-home" className="mb-1 flex min-h-10 w-full items-end leading-5">
                  <span className="min-w-0">{current?.homeName ?? "Home"}</span>
                </Label>
                <Input id="score-home" inputMode="numeric" value={home} onChange={(e) => setHome(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="score-away" className="mb-1 flex min-h-10 w-full items-end leading-5">
                  <span className="min-w-0">{current?.awayName ?? "Away"}</span>
                </Label>
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
            {formError || error ? (
              <p className="rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
                {formError ?? error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={busy || !current} onMouseDown={(event) => event.preventDefault()}>
              {busy ? "Saving…" : current?.homeScore != null || current?.awayScore != null ? "Update score" : "Save score"}
            </Button>
            {current && (current.homeScore != null || current.awayScore != null || current.forfeit || current.noContest) ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={busy}
                onClick={() => {
                  if (gameEdit?.locked && !window.confirm("Clearing this score can move the standings and who goes on. Clear it anyway?")) return;
                  onSave(current.id, 0, 0, null, true);
                }}
              >
                Clear score
              </Button>
            ) : null}
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
