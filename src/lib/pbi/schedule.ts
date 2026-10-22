/**
 * Bracket clock.
 * Play-ins take the earliest slots. The winner stays for the next game,
 * back to back, on that field. Nobody sits through two games in between
 * when the day can hold that. A higher seed keeps the field when two halves merge.
 */

export type SchedGame = {
  round: string;
  slot: number;
  isBye: boolean;
  homeSeed: number | null;
  awaySeed: number | null;
  homeFromRound: string | null;
  homeFromSlot: number | null;
  awayFromRound: string | null;
  awayFromSlot: number | null;
};

export type FieldAssignment = {
  round: string;
  slot: number;
  fieldIndex: number;
  time: string;
  dayIndex: number;
};

function keyOf(round: string, slot: number): string {
  return `${round}:${slot}`;
}

function bestSeed(game: SchedGame, byKey: Map<string, SchedGame>, seen = new Set<string>()): number {
  const id = keyOf(game.round, game.slot);
  if (seen.has(id)) return 999;
  seen.add(id);
  const seeds: number[] = [];
  if (game.homeSeed != null) seeds.push(game.homeSeed);
  if (game.awaySeed != null) seeds.push(game.awaySeed);
  if (game.homeFromRound != null && game.homeFromSlot != null) {
    const feeder = byKey.get(keyOf(game.homeFromRound, game.homeFromSlot));
    if (feeder) seeds.push(bestSeed(feeder, byKey, seen));
  }
  if (game.awayFromRound != null && game.awayFromSlot != null) {
    const feeder = byKey.get(keyOf(game.awayFromRound, game.awayFromSlot));
    if (feeder) seeds.push(bestSeed(feeder, byKey, seen));
  }
  return seeds.length > 0 ? Math.min(...seeds) : 999;
}

type Node = {
  id: string;
  game: SchedGame;
  realFeeders: string[];
  /** First-round game. These occupy the earliest slots. */
  playIn: boolean;
  /** Winner of a play-in. Next slot, same field. */
  b2b: boolean;
};

type Spot = { index: number; field: number };

type Clock = {
  fields: number;
  starts: string[];
  span: number;
  nodes: Node[];
  byKey: Map<string, SchedGame>;
  homeField: Map<string, number>;
  roundsInOrder: string[];
};

function buildClock(games: SchedGame[], fieldCount: number, starts: string[], dayCount: number): Clock {
  const fields = Math.max(1, fieldCount);
  const byKey = new Map(games.map((game) => [keyOf(game.round, game.slot), game]));
  const roundsInOrder: string[] = [];
  for (const game of games) {
    if (!roundsInOrder.includes(game.round)) roundsInOrder.push(game.round);
  }
  const opening =
    games.find((game) => game.homeFromRound == null && game.awayFromRound == null)?.round ?? roundsInOrder[0] ?? "qf";
  const firstGames = games.filter((game) => game.round === opening).sort((a, b) => a.slot - b.slot);
  const chunk = Math.max(1, Math.ceil(firstGames.length / fields));
  const homeField = new Map<string, number>();
  firstGames.forEach((game, index) => {
    homeField.set(keyOf(game.round, game.slot), Math.min(fields - 1, Math.floor(index / chunk)));
  });

  function realFeeders(game: SchedGame): string[] {
    const ids: string[] = [];
    for (const [round, slot] of [
      [game.homeFromRound, game.homeFromSlot],
      [game.awayFromRound, game.awayFromSlot],
    ] as const) {
      if (round == null || slot == null) continue;
      const feeder = byKey.get(keyOf(round, slot));
      if (feeder && !feeder.isBye) ids.push(keyOf(feeder.round, feeder.slot));
    }
    return ids;
  }

  const playInIds = new Set(
    games
      .filter((game) => !game.isBye && game.homeFromRound == null && game.awayFromRound == null)
      .map((game) => keyOf(game.round, game.slot)),
  );
  const nodes: Node[] = games
    .filter((game) => !game.isBye)
    .map((game) => {
      const real = realFeeders(game);
      const id = keyOf(game.round, game.slot);
      return {
        id,
        game,
        realFeeders: real,
        playIn: playInIds.has(id),
        b2b: real.length === 1 && playInIds.has(real[0] ?? ""),
      };
    });
  return { fields, starts, span: Math.max(1, dayCount) * Math.max(1, starts.length), nodes, byKey, homeField, roundsInOrder };
}

function rowsFrom(clock: Clock, placed: Map<string, Spot>): FieldAssignment[] {
  const out: FieldAssignment[] = [];
  for (const node of clock.nodes) {
    const spot = placed.get(node.id);
    if (!spot) continue;
    const time = clock.starts[spot.index % clock.starts.length] ?? clock.starts[0] ?? "";
    out.push({
      round: node.game.round,
      slot: node.game.slot,
      fieldIndex: spot.field,
      time,
      dayIndex: Math.floor(spot.index / clock.starts.length),
    });
  }
  return out;
}

function fieldOrder(clock: Clock, node: Node, placed: Map<string, Spot>, strictB2B: boolean): number[] {
  if (strictB2B && node.b2b) {
    const feeder = node.realFeeders[0];
    const field = feeder != null ? placed.get(feeder)?.field : undefined;
    return field == null ? [] : [field];
  }
  const side = (which: "home" | "away"): number | null => {
    const round = which === "home" ? node.game.homeFromRound : node.game.awayFromRound;
    const slot = which === "home" ? node.game.homeFromSlot : node.game.awayFromSlot;
    if (round == null || slot == null) return null;
    const id = keyOf(round, slot);
    return placed.get(id)?.field ?? clock.homeField.get(id) ?? null;
  };
  const seedOf = (which: "home" | "away"): number => {
    const round = which === "home" ? node.game.homeFromRound : node.game.awayFromRound;
    const slot = which === "home" ? node.game.homeFromSlot : node.game.awayFromSlot;
    if (round != null && slot != null) {
      const feeder = clock.byKey.get(keyOf(round, slot));
      if (feeder) return bestSeed(feeder, clock.byKey);
    }
    const seed = which === "home" ? node.game.homeSeed : node.game.awaySeed;
    return seed ?? 999;
  };
  const left = side("home");
  const right = side("away");
  const order: number[] = [];
  const push = (field: number | null) => {
    if (field == null || field < 0 || field >= clock.fields || order.includes(field)) return;
    order.push(field);
  };
  if (left == null && right == null) push(clock.homeField.get(node.id) ?? 0);
  else if (left == null) push(right);
  else if (right == null || left === right) push(left);
  else if (seedOf("home") <= seedOf("away")) {
    push(left);
    push(right);
  } else {
    push(right);
    push(left);
  }
  for (let field = 0; field < clock.fields; field += 1) push(field);
  return order;
}

/**
 * One division across `dayCount` days.
 * Play-ins go first. A play-in winner stays on that field for the next slot.
 * A later game starts within one sit of each real feeder when that fits.
 */
export function assignBracketDay(
  games: SchedGame[],
  fieldCount: number,
  starts: string[],
  dayCount = 1,
): FieldAssignment[] {
  if (starts.length === 0) return [];
  const clock = buildClock(games, fieldCount, starts, dayCount);
  for (let gap = 2; gap <= clock.span; gap += 1) {
    const hit = search(clock, gap, true);
    if (hit) return hit;
  }
  return search(clock, clock.span, false) ?? greedy(clock);
}

function search(clock: Clock, maxGap: number, strictB2B: boolean): FieldAssignment[] | null {
  const placed = new Map<string, Spot>();
  const taken = new Set<string>();
  let visits = 0;

  function windowOf(node: Node): { min: number; max: number } | "wait" | "dead" {
    let min = 0;
    let max = clock.span - 1;
    for (const feederId of node.realFeeders) {
      const feeder = placed.get(feederId);
      if (!feeder) return "wait";
      min = Math.max(min, feeder.index + 1);
      max = Math.min(max, feeder.index + maxGap);
    }
    if (strictB2B && node.b2b) max = Math.min(max, min);
    if (min > max || min >= clock.span) return "dead";
    return { min, max: Math.min(max, clock.span - 1) };
  }

  function rank(node: Node, width: number): number {
    const tie = clock.roundsInOrder.indexOf(node.game.round) * 0.01 + node.game.slot * 0.0001;
    if (strictB2B && node.b2b) return tie;
    if (node.playIn) return 10 + tie;
    if (node.realFeeders.length > 0) return 20 + width + tie;
    return 30 + width + tie;
  }

  function dfs(): boolean {
    visits += 1;
    if (visits > 250000) return false;
    const unplaced = clock.nodes.length - placed.size;
    if (unplaced === 0) return true;
    if (clock.span * clock.fields - taken.size < unplaced) return false;
    let pick: Node | null = null;
    let pickRank = Number.POSITIVE_INFINITY;
    let pickSpan: { min: number; max: number } | null = null;
    for (const node of clock.nodes) {
      if (placed.has(node.id)) continue;
      const span = windowOf(node);
      if (span === "wait") continue;
      if (span === "dead") return false;
      const fields = fieldOrder(clock, node, placed, strictB2B);
      let open = false;
      for (let index = span.min; index <= span.max && !open; index += 1) {
        open = fields.some((field) => !taken.has(`${field}|${index}`));
      }
      if (!open) return false;
      const score = rank(node, span.max - span.min);
      if (score < pickRank) {
        pickRank = score;
        pick = node;
        pickSpan = span;
      }
    }
    if (!pick || !pickSpan) return false;
    const fields = fieldOrder(clock, pick, placed, strictB2B);
    for (let index = pickSpan.min; index <= pickSpan.max; index += 1) {
      for (const field of fields) {
        const stamp = `${field}|${index}`;
        if (taken.has(stamp)) continue;
        placed.set(pick.id, { index, field });
        taken.add(stamp);
        if (dfs()) return true;
        taken.delete(stamp);
        placed.delete(pick.id);
      }
    }
    return false;
  }

  if (!dfs() || placed.size !== clock.nodes.length) return null;
  return rowsFrom(clock, placed);
}

/** Feeder order, play-ins then their back-to-back game. Used when the rest rule cannot fit. */
function greedy(clock: Clock): FieldAssignment[] {
  const placed = new Map<string, Spot>();
  const taken = new Set<string>();
  const pending = new Set(clock.nodes.map((node) => node.id));
  while (pending.size > 0) {
    const ready = clock.nodes.filter(
      (node) => pending.has(node.id) && node.realFeeders.every((id) => placed.has(id)),
    );
    if (ready.length === 0) break;
    ready.sort((a, b) => {
      const score = (node: Node) => {
        if (node.b2b) return 0;
        if (node.playIn) return 1;
        if (node.realFeeders.length > 0) return 2;
        return 3;
      };
      return score(a) - score(b) || a.game.slot - b.game.slot;
    });
    const node = ready[0];
    if (!node) break;
    let min = 0;
    for (const id of node.realFeeders) min = Math.max(min, (placed.get(id)?.index ?? -1) + 1);
    const fields = fieldOrder(clock, node, placed, node.b2b);
    let spot: Spot | null = null;
    for (let index = min; index < clock.span && !spot; index += 1) {
      for (const field of fields) {
        if (!taken.has(`${field}|${index}`)) {
          spot = { index, field };
          break;
        }
      }
    }
    pending.delete(node.id);
    if (!spot) continue;
    placed.set(node.id, spot);
    taken.add(`${spot.field}|${spot.index}`);
  }
  return rowsFrom(clock, placed);
}
