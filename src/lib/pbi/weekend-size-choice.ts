import {
  bestSize,
  breakOption,
  divisionsOnFields,
  type PlanDays,
  type SundayLast,
} from "./weekend-plan";

export type SizeChoice = {
  rain: boolean;
  days: PlanDays;
  teams: number;
  fields: number;
  divisions: number;
  sunday: SundayLast;
  driver: "teams" | "fields";
};

export function initialSize(teams = 10): SizeChoice {
  const best = bestSize(teams, 2, true) ?? { divisions: 1, fields: 2, sunday: "4:00" as const };
  return {
    rain: true,
    days: 2,
    teams,
    fields: best.fields,
    divisions: best.divisions,
    sunday: best.sunday,
    driver: "teams",
  };
}

export function settle(current: SizeChoice, patch: Partial<SizeChoice> & { driver?: "teams" | "fields" }): SizeChoice {
  const rain = patch.rain ?? current.rain;
  const days = patch.days ?? current.days;
  const driver = patch.driver ?? current.driver;
  if (driver === "teams") {
    const teams = patch.teams ?? current.teams;
    const best = bestSize(teams, days, rain);
    if (!best) return { ...current, rain, days, teams };
    return {
      rain,
      days,
      teams,
      fields: best.fields,
      divisions: best.divisions,
      sunday: best.sunday,
      driver: "teams",
    };
  }
  const fields = patch.fields ?? current.fields;
  const teams = patch.teams ?? current.teams;
  const fit = divisionsOnFields(teams, fields, days, rain);
  if (fit != null) {
    return { rain, days, teams, fields, divisions: fit, sunday: rain ? "4:00" : "6:00", driver: "fields" };
  }
  const broken = breakOption(teams, fields, days, rain);
  if (broken) {
    return {
      rain,
      days,
      teams,
      fields,
      divisions: broken.divisions,
      sunday: broken.sunday,
      driver: "fields",
    };
  }
  return { rain, days, teams, fields, divisions: 1, sunday: "8:00", driver: "fields" };
}
