import { Fragment, useState, type CSSProperties } from "react";
import { FieldDialog } from "@/components/field-dialog";
import type { ScheduleAge, ScheduleGame, WeekendLocation } from "@/lib/pbi/api";
import { formatClock, isFutureSiteGame, isRoundId, layoutSiteBracket, nextKnockoutGame, ROUND_IDS, seedLabel, shortParkName, treeRoundLabel, type RoundId, type SiteBracketLayout } from "@/lib/pbi/bracket";
import { cn } from "@/lib/utils";

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
): { seed: number | null; text: string } {
  const name = side === "home" ? game.homeName : game.awayName;
  const seed = side === "home" ? game.homeSeed : game.awaySeed;
  const fromRound = side === "home" ? game.homeFromRound : game.awayFromRound;
  const fromSlot = side === "home" ? game.homeFromSlot : game.awayFromSlot;
  if (name) return { seed, text: name };
  if (fromRound != null && fromSlot != null) {
    const n = numbers.get(`${fromRound}:${fromSlot}`);
    if (n) return { seed: null, text: `Win G${n}` };
    const feeder = feeders.find((row) => row.round === fromRound && row.slot === fromSlot);
    const feederSeed = feeder?.homeSeed ?? feeder?.awaySeed ?? null;
    if (feederSeed != null) return { seed: feederSeed, text: `${seedLabel(feederSeed)} after pool play` };
    return { seed: null, text: "Winner" };
  }
  if (seed) return { seed, text: `${seedLabel(seed)} after pool play` };
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
}) {
  const home = sideCopy(game, "home", numbers, feeders);
  const away = sideCopy(game, "away", numbers, feeders);
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
        <span className="bracket-meta-time text-xs">{clock}</span>
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

function LineMatch({
  game,
  numbers,
  canPickField,
  future,
  ghost,
  feeders,
  nextNote,
  fork,
  armSpans,
  onField,
}: {
  game: ScheduleGame;
  numbers: Map<string, number>;
  canPickField: boolean;
  future?: boolean;
  ghost?: boolean;
  feeders: ScheduleGame[];
  nextNote: string | null;
  fork: boolean;
  armSpans: number[];
  onField: (game: ScheduleGame) => void;
}) {
  const home = sideCopy(game, "home", numbers, feeders);
  const away = sideCopy(game, "away", numbers, feeders);
  const field = game.locationName ?? "Pick a field";
  const clock = future || ghost ? game.when || formatClock(game.startTime) : formatClock(game.startTime);
  const gameTag = game.gameNumber != null ? `G${game.gameNumber}` : "";
  const top = armSpans[0] ?? 1;
  const bot = armSpans[1] ?? 1;
  const meta = [gameTag, clock].filter(Boolean).join(" · ");

  return (
    <article
      className={cn("line-match", (future || ghost) && "is-future", ghost && "is-ghost", fork ? "is-fork" : "is-single")}
    >
      <div
        className="line-match-body"
        style={fork ? ({ ["--arm-top"]: top, ["--arm-bot"]: bot } as CSSProperties) : undefined}
      >
        {fork ? (
          <>
            <div className="line-arm" style={{ flex: top }}>
              <LineTeam seed={home.seed} text={home.text} />
            </div>
            <div className="line-arm" style={{ flex: bot }}>
              <LineTeam seed={away.seed} text={away.text} />
            </div>
          </>
        ) : (
          <>
            <div className="line-match-pad" />
            <LineTeam seed={home.seed} text={home.text} />
            <div className="line-match-gap" />
            <LineTeam seed={away.seed} text={away.text} />
            <div className="line-match-pad" />
          </>
        )}
      </div>
      <button
        type="button"
        disabled={!canPickField || ghost}
        onClick={() => onField(game)}
        className="line-meta disabled:cursor-default"
        title={field}
      >
        {meta}
      </button>
      {nextNote ? <p className="line-next">{nextNote}</p> : null}
    </article>
  );
}

function LineJoinColumn({
  slots,
  rowCount,
}: {
  slots: { rowStart: number; rowSpan: number; arms: number; armSpans: number[] }[];
  rowCount: number;
}) {
  return (
    <div
      className="line-join-col"
      style={{ gridTemplateRows: `auto repeat(${Math.max(rowCount, 1)}, minmax(7.75rem, 1fr))` }}
    >
      <div className="line-join-spacer" aria-hidden />
      {slots.map((slot, index) => (
        <div
          key={`${slot.rowStart}-${index}`}
          className="line-join-cell"
          style={{ gridRow: `${slot.rowStart + 1} / span ${slot.rowSpan}` }}
        >
          {slot.arms >= 2 ? (
            <div
              className="line-fork"
              style={{ gridTemplateRows: `${slot.armSpans[0] ?? 1}fr ${slot.armSpans[1] ?? 1}fr` }}
            >
              <div className="line-fork-top" />
              <div className="line-fork-bottom" />
              <span className="line-fork-out" />
            </div>
          ) : (
            <span className="line-join-arm" />
          )}
        </div>
      ))}
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
  const playIns = age.games.some((game) => game.round === first && game.isBye);

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
  parks,
  editable,
  onField,
  onAddField,
  fieldError,
  busy,
}: {
  games: ScheduleGame[];
  parks: WeekendLocation[];
  editable: boolean;
  onField: (gameId: number, locationId: number | null) => void;
  onAddField: (gameId: number, name: string, address: string) => void;
  fieldError: string | null;
  busy: boolean;
}) {
  const [fieldGame, setFieldGame] = useState<ScheduleGame | null>(null);
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

  return (
    <div className="pool-sheet mb-8">
      <p className="text-sm text-muted">
        Suggested block — two games each, back to back at one park so families are not sitting around.
        {editable ? " Tap a cell to move a game." : ""}
      </p>
      <div className="pool-grid-wrap mt-4">
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
                  const n = numbers.get(`${game.round}:${game.slot}`);
                  return (
                    <td key={park.id}>
                      <button
                        type="button"
                        disabled={!editable}
                        onClick={() => setFieldGame(game)}
                        className="pool-grid-cell disabled:cursor-default"
                      >
                        <span className="pool-grid-meta">
                          {[n != null ? `G${n}` : null, game.roundLabel].filter(Boolean).join(" · ")}
                        </span>
                        <span className="pool-grid-match">
                          {game.homeName ?? "TBD"} vs {game.awayName ?? "TBD"}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
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
}) {
  if (layout.rounds.length === 0) return null;
  const rowCount = Math.max(layout.rowCount, 1);
  const rows = `auto repeat(${rowCount}, minmax(7.75rem, 1fr))`;
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
        const title =
          section.label ??
          (isRoundId(section.round)
            ? treeRoundLabel(section.round, firstRound ?? section.round, playIns)
            : section.round);
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
                  style={{ gridRow: `${slot.rowStart + 1} / span ${slot.rowSpan}` }}
                >
                  {slot.game == null ? (
                    <article className="line-match is-ghost is-single">
                      <div className="line-match-body">
                        <div className="line-match-pad" />
                        <LineTeam seed={null} text="" />
                        <div className="line-match-pad" />
                      </div>
                    </article>
                  ) : slot.game.isBye ? (
                    <article className="line-match is-ghost is-single">
                      <div className="line-match-body">
                        <div className="line-match-pad" />
                        <LineTeam
                          seed={slot.game.homeSeed ?? slot.game.awaySeed}
                          text={
                            slot.game.homeName ??
                            slot.game.awayName ??
                            (slot.game.homeSeed ?? slot.game.awaySeed
                              ? `${seedLabel((slot.game.homeSeed ?? slot.game.awaySeed)!)} after pool play`
                              : "Bye")
                          }
                        />
                        <div className="line-match-pad" />
                      </div>
                    </article>
                  ) : (
                    <LineMatch
                      game={slot.game}
                      numbers={numbers}
                      canPickField={editable && !slot.ghost}
                      future={isFutureSiteGame(slot.game, futureOpts)}
                      ghost={slot.ghost}
                      feeders={allGames}
                      fork={slot.arms >= 2}
                      armSpans={slot.armSpans}
                      nextNote={isLast && !slot.ghost ? winnerPlaysNote(slot.game, allGames, onSheet) : null}
                      onField={onField}
                    />
                  )}
                </div>
              ))}
            </section>
            {next ? <LineJoinColumn slots={next.slots} rowCount={rowCount} /> : null}
            {isLast && hasChampion && finalSlot ? (
              <LineJoinColumn
                slots={[{ rowStart: finalSlot.rowStart, rowSpan: finalSlot.rowSpan, arms: 1, armSpans: [] }]}
                rowCount={rowCount}
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
            ? "Names sit on a line. Two games join into one, left to right, into this park’s last game today."
            : null}
      </p>
      {poolGames.length > 0 ? (
        <PoolGrid
          games={poolGames}
          parks={parks}
          editable={editable}
          busy={busy}
          fieldError={fieldError}
          onField={onField}
          onAddField={onAddField}
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
                  {game.homeName ?? "TBD"} vs {game.awayName ?? "TBD"}
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
