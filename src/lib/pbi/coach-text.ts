import { AGE_GROUPS, ageOneYounger, formatWeekendRange, formatWeekdayLong, isAgeGroup, nameWithAges, seasonLabel, type AgeGroup, type Season } from "./weekends.ts";

export type CoachTextKind = "first-one" | "slate" | "added-one" | "added";

export type CoachTextEvent = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  ageGroups?: string[];
  teamFeeCents?: number | null;
};

export type CoachTextPerson = {
  userId: string;
  name: string;
  phone: string | null;
  teams: { name: string; ageGroup: string | null }[];
  opened: boolean;
  registered?: boolean;
};

export function coachTextKind(eventCount: number, hadPriorBatch: boolean): CoachTextKind {
  if (eventCount <= 1) return hadPriorBatch ? "added-one" : "first-one";
  return hadPriorBatch ? "added" : "slate";
}

function whenLabel(event: CoachTextEvent): string {
  const days =
    event.startDate === event.endDate
      ? formatWeekdayLong(event.startDate)
      : `${formatWeekdayLong(event.startDate)}–${formatWeekdayLong(event.endDate)}`;
  return `${days}, ${formatWeekendRange(event.startDate, event.endDate)}`;
}

function facingName(event: CoachTextEvent): string {
  return nameWithAges(event.name, event.ageGroups ?? []);
}

export type CoachOutreach = "invite" | "registered";

export function coachOutreachLabel(kind: CoachOutreach): string {
  return kind === "registered" ? "Confirm Registered" : "Invite to Tournament";
}

const VENMO_USER = "sports423";

function payAmountLabel(cents: number): string {
  const dollars = cents / 100;
  if (Number.isInteger(dollars)) return `$${dollars.toLocaleString("en-US")}`;
  return dollars.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function payNote(tournament: string, teamNames: readonly string[]): string {
  const teams = teamNames.map((name) => name.trim()).filter(Boolean);
  return [tournament.trim(), ...teams]
    .filter(Boolean)
    .join(" ")
    .replace(/[’']/g, "")
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function venmoPayUrl(amountCents: number, note: string): string {
  const dollars = amountCents / 100;
  const amount = Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2);
  const encoded = encodeURIComponent(note).replace(/%20/g, "+");
  return `https://venmo.com/${VENMO_USER}?txn=pay&amount=${amount}&note=${encoded}`;
}

function venmoLines(feeCents: number | null | undefined, note: string): string[] {
  if (feeCents == null || !Number.isFinite(feeCents) || feeCents <= 0) return [];
  return ["", `Pay ${payAmountLabel(feeCents)} here:`, venmoPayUrl(feeCents, note)];
}

/** The note for one coach. Invite if they are not on the tournament yet. Confirm if they already registered. */
export function coachOutreachBody(input: {
  kind: CoachOutreach;
  events: CoachTextEvent[];
  link: string;
  teamNames?: string[];
}): string {
  const event = input.events[0];
  const name = event ? facingName(event) : "a tournament";
  const when = event ? whenLabel(event) : "";
  const titled = when ? `${name}, ${when}` : name;
  if (input.events.length > 1) {
    if (input.kind === "registered") {
      return ["423Sports: You're registered for these tournaments.", "", "Open tournament details here:", input.link].join("\n");
    }
    return [`423Sports: You're invited to ${input.events.length} tournaments.`, "", "Register here:", input.link].join("\n");
  }
  if (input.kind === "registered") {
    const lines = [
      `423Sports: You're registered for ${titled}.`,
      "",
      "Open tournament details here:",
      input.link,
    ];
    const fee = event?.teamFeeCents;
    if (fee != null && Number.isFinite(fee) && fee > 0) {
      const note = payNote(event?.name ?? name, input.teamNames ?? []);
      lines.push(
        "",
        `Tournament fee: ${payAmountLabel(fee)}`,
        "",
        "Cash or check at team check-in",
        "",
        "or Venmo:",
        venmoPayUrl(fee, note),
      );
    }
    return lines.join("\n");
  }
  return [`423Sports: You're invited to ${titled}.`, "", "Register here:", input.link].join("\n");
}

/** The note that lands in the director's text app. One link, never a list of weekends. */
export function coachTextBody(input: {
  kind: CoachTextKind;
  season: Season;
  year: number;
  events: CoachTextEvent[];
  link: string;
}): string {
  const event = input.events[0];
  const close = input.kind === "slate" ? "Mark each age on every weekend here:" : "Mark each age here:";
  if (input.kind === "slate") {
    return textNote(`423Sports: New ${seasonLabel(input.season)} ${input.year} weekends are on the schedule.`, close, input.link);
  }
  if (input.kind === "added") {
    const count = input.events.length;
    return textNote(`423Sports: We added ${count} weekends.`, close, input.link);
  }
  const name = event ? facingName(event) : "a weekend";
  const when = event ? whenLabel(event) : "";
  if (input.kind === "added-one") {
    return textNote(`423Sports: We added ${name}, ${when}.`, close, input.link);
  }
  return textNote(`423Sports: We're putting ${name} on the schedule, ${when}.`, close, input.link);
}

function textNote(lead: string, close: string, link: string): string {
  return [lead, "", "You're invited. Mark each age you're in for.", "", close, link].join("\n");
}

/** Reminder that lands in Messages. Registered coaches also get the pay link. */
export function coachReminderBody(input: {
  choice: "interested" | "maybe" | "no" | null;
  name: string;
  startDate: string;
  endDate: string;
  link: string;
  feeCents?: number | null;
  teamNames?: string[];
  noteName?: string;
}): string {
  const when = whenLabel({ id: 0, name: input.name, startDate: input.startDate, endDate: input.endDate });
  const event = `${input.name}, ${when}`;
  if (input.choice === "no") {
    return [`423Sports: We still have several spots available for ${event} if you change your mind.`, "", "Mark each age here:", input.link].join("\n");
  }
  if (input.choice === "interested") {
    const note = payNote(input.noteName ?? input.name, input.teamNames ?? []);
    return [
      `423Sports: This is a reminder of the upcoming tournament, ${event}.`,
      "",
      "We are still gaining interest.",
      "",
      "Mark each age here:",
      input.link,
      ...venmoLines(input.feeCents, note),
    ].join("\n");
  }
  return [
    `423Sports: This is a reminder that ${event} is on the schedule.`,
    "",
    "We are still gaining interest.",
    "",
    "Mark each age here:",
    input.link,
  ].join("\n");
}

export function coachTextCover(events: CoachTextEvent[]): string {
  if (events.length <= 1) {
    const event = events[0];
    return event
      ? `One text about ${facingName(event)}. Tap Text, then Send in Messages.`
      : "Tap Text, then Send in Messages.";
  }
  const names = events.map((event) => facingName(event)).join(", ");
  return `One text covers ${events.length} weekends that haven't been texted yet: ${names}. Tap Text, then Send in Messages.`;
}

export function coachSmsHref(phone: string, body: string): string | null {
  const number = smsNumber(phone);
  if (!number) return null;
  return `sms:${number}?&body=${encodeURIComponent(body)}`;
}

function smsNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/** One Messages thread for every number. iPhones need the addresses form. */
export function coachGroupSmsHref(phones: string[], body: string, ios = false): string | null {
  const numbers = phones.map(smsNumber).filter((number): number is string => Boolean(number));
  if (numbers.length === 0) return null;
  const encoded = encodeURIComponent(body);
  if (numbers.length === 1) return `sms:${numbers[0]}?&body=${encoded}`;
  if (ios) {
    const addresses = numbers.map((number) => number.replace(/^\+1/, "")).join(",");
    return `sms:/open?addresses=${addresses}&body=${encoded}`;
  }
  return `sms:${numbers.join(";")}?body=${encoded}`;
}

/** Open Messages. A new tab never hands off to the text app on Android. */
export function openSms(href: string) {
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (ios && standalone) {
    const link = document.createElement("a");
    link.href = href;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }
  window.location.href = href;
}

export function registrationGroupBody(event: CoachTextEvent, link: string): string {
  return coachOutreachBody({ kind: "registered", events: [event], link, teamNames: [] });
}

export function inviteGroupBody(event: CoachTextEvent, link: string): string {
  return coachOutreachBody({ kind: "invite", events: [event], link });
}

export function scheduleGroupBody(event: CoachTextEvent, link: string): string {
  const when = whenLabel(event);
  const titled = when ? `${facingName(event)}, ${when}` : facingName(event);
  return [`423Sports: The schedule is up for ${titled}.`, "", "Games and fields:", link].join("\n");
}

export function afterGroupBody(event: CoachTextEvent): string {
  const when = whenLabel(event);
  return `423Sports: Thanks for playing ${facingName(event)}${when ? `, ${when}` : ""}.`;
}

/** Ages that belong on a tournament text: the tournament age, plus the age just under it. */
export function messageAges(tournamentAges: string[]): AgeGroup[] {
  const allowed = new Set<AgeGroup>();
  for (const age of tournamentAges) {
    if (!isAgeGroup(age)) continue;
    allowed.add(age);
    const younger = ageOneYounger(age);
    if (younger) allowed.add(younger);
  }
  return AGE_GROUPS.filter((age) => allowed.has(age));
}

/** Every coach with a team. Age is filtered on the screen, not here. */
export function coachesForTournamentAges(coaches: CoachTextPerson[], _tournamentAges: string[]): CoachTextPerson[] {
  return coaches.filter((coach) => coach.teams.length > 0);
}

export function coachTextGroups(coaches: CoachTextPerson[]): { age: string; coaches: CoachTextPerson[] }[] {
  const buckets = new Map<string, CoachTextPerson[]>();
  for (const coach of coaches) {
    const ages = [...new Set(coach.teams.map((team) => team.ageGroup).filter((age): age is string => isAgeGroup(age ?? "")))];
    const keys = ages.length > 0 ? ages : ["No age"];
    for (const age of keys) {
      const list = buckets.get(age) ?? [];
      list.push(coach);
      buckets.set(age, list);
    }
  }
  const order = [...AGE_GROUPS, "No age"];
  return order
    .filter((age) => buckets.has(age))
    .map((age) => ({
      age,
      coaches: (buckets.get(age) ?? [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    }));
}
