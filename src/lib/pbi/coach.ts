/** Create-coach fit math. Days come from the dates. Size packs only pick fields. */

import type { AdvanceMode } from "./rules";
import { eachIsoDate } from "./weekends.ts";

export const COACH_PATHS = ["small", "mid", "large", "custom"] as const;
export type CoachPath = (typeof COACH_PATHS)[number];

export function isCoachPath(value: unknown): value is CoachPath {
  return typeof value === "string" && (COACH_PATHS as readonly string[]).includes(value);
}

export function inclusiveDays(startDate: string, endDate: string): number {
  return eachIsoDate(startDate, endDate).length;
}

function clockMinutes(clock: string): number {
  const match = /^(\d{1,2}):(\d{2})/.exec(clock);
  if (!match) return 8 * 60;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Start slots on one day. Rain holds the last start open, so it is not a must-play slot. */
export function slotsOnDay(firstPitch: string, lastStart: string, slotMinutes: number, rain: boolean): number {
  const step = Math.max(15, slotMinutes);
  const last = clockMinutes(lastStart);
  let count = 0;
  for (let t = clockMinutes(firstPitch); t <= last; t += step) count += 1;
  if (rain && count > 1) count -= 1;
  return Math.max(0, count);
}

export function mustPlaySlots(input: {
  days: number;
  firstPitch: string;
  lastStart: string;
  lastDayLastStart: string;
  slotMinutes: number;
  rain: boolean;
}): number {
  const days = Math.max(0, input.days);
  if (days === 0) return 0;
  const early = slotsOnDay(input.firstPitch, input.lastStart, input.slotMinutes, input.rain);
  const last = slotsOnDay(input.firstPitch, input.lastDayLastStart, input.slotMinutes, input.rain);
  if (days === 1) return last;
  return early * (days - 1) + last;
}

/**
 * Biggest N whose must-play games fit the open slots.
 * Small is bracket only (N−1 games). Pool paths play 2 games per team plus a single-elim bracket.
 * Top-per-pool shrinks the bracket, so more teams fit than all-reseed.
 */
export function maxTeamsThatFit(input: {
  path: CoachPath;
  fields: number;
  slots: number;
  advance: AdvanceMode;
  advancePerPool: number;
}): number {
  const fields = Math.max(1, input.fields);
  const room = Math.max(0, input.slots) * fields;
  if (input.path === "small") return Math.max(2, Math.min(40, room + 1));
  const per = Math.min(4, Math.max(1, input.advancePerPool));
  let best = 2;
  for (let n = 3; n <= 40; n += 1) {
    const poolGames = n;
    const bracketTeams =
      input.advance === "top-per-pool" ? Math.max(2, Math.ceil(n / 6) * per) : n;
    const games = poolGames + Math.max(0, bracketTeams - 1);
    if (games <= room) best = n;
  }
  return best;
}

export function gamesForTeams(input: {
  path: CoachPath;
  teams: number;
  advance: AdvanceMode;
  advancePerPool: number;
}): number {
  const n = Math.max(2, input.teams);
  if (input.path === "small") return n - 1;
  const per = Math.min(4, Math.max(1, input.advancePerPool));
  const bracketTeams = input.advance === "top-per-pool" ? Math.max(2, Math.ceil(n / 6) * per) : n;
  return n + Math.max(0, bracketTeams - 1);
}
