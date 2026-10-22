import assert from "node:assert/strict";
import test from "node:test";
import { coachSmsHref, coachTextBody, coachTextGroups, coachTextKind, coachReminderBody, coachOutreachBody, coachOutreachLabel, coachesForTournamentAges, messageAges, coachGroupSmsHref } from "./coach-text.ts";

test("the first batch of many weekends is one season text", () => {
  assert.equal(coachTextKind(12, false), "slate");
  assert.equal(coachTextKind(1, false), "first-one");
  assert.equal(coachTextKind(1, true), "added-one");
  assert.equal(coachTextKind(3, true), "added");
});

test("a season text has one link and does not list every weekend", () => {
  const body = coachTextBody({
    kind: "slate",
    season: "spring",
    year: 2027,
    events: [
      { id: 1, name: "Spring Opener", startDate: "2027-03-06", endDate: "2027-03-07" },
      { id: 2, name: "Spring Classic", startDate: "2027-03-27", endDate: "2027-03-28" },
    ],
    link: "https://423.example/interest?e=1,2",
  });
  assert.match(body, /New Spring 2027 weekends are on the schedule/);
  assert.match(body, /Mark each age on every weekend here:\nhttps:\/\/423\.example\/interest\?e=1,2$/);
  assert.match(body, /\n\nYou're invited\. Mark each age you're in for\.\n\n/);
  assert.equal(body.includes("Spring Opener"), false);
});

test("one new weekend after the slate names that weekend", () => {
  const body = coachTextBody({
    kind: "added-one",
    season: "spring",
    year: 2027,
    events: [{ id: 9, name: "Spring Classic", startDate: "2027-04-10", endDate: "2027-04-11" }],
    link: "https://423.example/interest?e=9",
  });
  assert.match(body, /^423Sports: We added Spring Classic,/);
  assert.match(body, /Saturday–Sunday/);
  assert.match(body, /Mark each age here:\nhttps:\/\/423\.example\/interest\?e=9$/);
});

test("a reminder text matches what the coach already picked", () => {
  const interested = coachReminderBody({
    choice: "interested",
    name: "Spring Opener",
    startDate: "2027-04-10",
    endDate: "2027-04-11",
    link: "https://423.example/interest?e=9",
  });
  assert.match(interested, /This is a reminder of the upcoming tournament/);
  assert.match(interested, /We are still gaining interest/);
  assert.equal(interested.includes("building the tournament"), false);
  assert.match(interested, /\n\nMark each age here:\nhttps:\/\/423\.example\/interest\?e=9$/);
  const maybe = coachReminderBody({
    choice: "maybe",
    name: "Spring Opener",
    startDate: "2027-04-10",
    endDate: "2027-04-11",
    link: "https://423.example/interest?e=9",
  });
  assert.equal(maybe.includes("not sure yet"), false);
  assert.match(maybe, /is on the schedule/);
  const passed = coachReminderBody({
    choice: "no",
    name: "Spring Opener",
    startDate: "2027-04-10",
    endDate: "2027-04-11",
    link: "https://423.example/interest?e=9",
  });
  assert.match(passed, /spots available/);
  assert.equal(passed.includes("building the tournament"), false);
});

test("an invite and a registration confirm are different notes", () => {
  const events = [{ id: 4, name: "Fall Opener 2026", startDate: "2026-10-10", endDate: "2026-10-11", ageGroups: ["16U"] }];
  const link = "https://423.example/interest?e=4";
  assert.equal(coachOutreachLabel("invite"), "Invite to Tournament");
  assert.equal(coachOutreachLabel("registered"), "Confirm Registered");
  const invite = coachOutreachBody({ kind: "invite", events, link });
  const confirmed = coachOutreachBody({ kind: "registered", events, link });
  assert.match(invite, /You're invited to Fall Opener 2026 16U,/);
  assert.match(invite, /\n\nRegister here:\nhttps:\/\/423\.example\/interest\?e=4$/);
  assert.match(confirmed, /You're registered for Fall Opener 2026 16U,/);
  assert.match(confirmed, /\n\nOpen tournament details here:\nhttps:\/\/423\.example\/interest\?e=4$/);
  assert.equal(invite.includes(confirmed.split("\n")[0] ?? "x"), false);
  assert.equal(invite.includes("venmo.com"), false);
  const paid = coachOutreachBody({
    kind: "registered",
    events: [{ ...events[0], teamFeeCents: 65000 }],
    link,
    teamNames: ["Test Team"],
  });
  assert.match(paid, /Tournament fee: \$650\n\nCash or check at team check-in\n\nor Venmo:\nhttps:\/\/venmo\.com\/sports423\?txn=pay&amount=650&note=Fall\+Opener\+2026\+Test\+Team$/);
  const reminded = coachReminderBody({
    choice: "interested",
    name: "175 Fall Brawl 15U",
    noteName: "175 Fall Brawl",
    startDate: "2026-10-31",
    endDate: "2026-11-01",
    link: "https://423.example/interest?e=12",
    feeCents: 65000,
    teamNames: ["Test Team"],
  });
  assert.match(reminded, /Pay \$650 here:\nhttps:\/\/venmo\.com\/sports423\?txn=pay&amount=650&note=175\+Fall\+Brawl\+Test\+Team$/);
  const declined = coachReminderBody({
    choice: "no",
    name: "175 Fall Brawl",
    startDate: "2026-10-31",
    endDate: "2026-11-01",
    link: "https://423.example/interest?e=12",
    feeCents: 65000,
    teamNames: ["Test Team"],
  });
  assert.equal(declined.includes("venmo.com"), false);
});

test("a tournament text lists every coach, and the screen filters the age", () => {
  assert.deepEqual(messageAges(["16U"]), ["15U", "16U"]);
  assert.deepEqual(messageAges(["8U"]), ["8U"]);
  assert.deepEqual(messageAges(["14U", "16U"]), ["13U", "14U", "15U", "16U"]);
  const coaches = coachesForTournamentAges(
    [
      { userId: "a", name: "Alex", phone: "8655550101", opened: false, teams: [{ name: "Flight", ageGroup: "16U" }] },
      { userId: "b", name: "Blake", phone: "8655550100", opened: false, teams: [{ name: "Dawgs", ageGroup: "15U" }] },
      { userId: "c", name: "Casey", phone: "8655550102", opened: false, teams: [{ name: "Reds", ageGroup: "12U" }, { name: "Reds", ageGroup: "16U" }] },
      { userId: "d", name: "Drew", phone: "8655550103", opened: false, teams: [{ name: "Blues", ageGroup: "10U" }] },
    ],
    ["16U"],
  );
  assert.deepEqual(coaches.map((coach) => coach.name), ["Alex", "Blake", "Casey", "Drew"]);
  assert.deepEqual(
    coaches.find((coach) => coach.userId === "c")?.teams.map((team) => team.ageGroup),
    ["12U", "16U"],
  );
});

test("an underclass tournament lists every coach, not only underclass teams", () => {
  const coaches = coachesForTournamentAges(
    [
      { userId: "a", name: "Alex", phone: "8655550101", opened: false, teams: [{ name: "Flight", ageGroup: "16U" }] },
      { userId: "b", name: "Blake", phone: "8655550100", opened: false, teams: [{ name: "Dawgs", ageGroup: "9U" }] },
    ],
    ["Underclass"],
  );
  assert.deepEqual(coaches.map((coach) => coach.name), ["Alex", "Blake"]);
});

test("coaches are grouped by age, then name", () => {
  const groups = coachTextGroups([
    {
      userId: "b",
      name: "Blake",
      phone: "8655550100",
      opened: false,
      teams: [{ name: "Dawgs", ageGroup: "12U" }],
    },
    {
      userId: "a",
      name: "Alex",
      phone: "8655550101",
      opened: false,
      teams: [
        { name: "Flight", ageGroup: "10U" },
        { name: "Flight", ageGroup: "12U" },
      ],
    },
  ]);
  assert.deepEqual(
    groups.map((group) => [group.age, group.coaches.map((coach) => coach.name)]),
    [
      ["10U", ["Alex"]],
      ["12U", ["Alex", "Blake"]],
    ],
  );
});

test("one tournament text names the age when the title does not", () => {
  const body = coachTextBody({
    kind: "first-one",
    season: "spring",
    year: 2026,
    events: [{ id: 4, name: "Spring Classic 2026", startDate: "2026-04-11", endDate: "2026-04-12", ageGroups: ["16U"] }],
    link: "https://423.example/interest?e=4",
  });
  assert.match(body, /We're putting Spring Classic 2026 16U on the schedule/);
  const already = coachTextBody({
    kind: "added-one",
    season: "spring",
    year: 2026,
    events: [{ id: 5, name: "Spring Classic 16U", startDate: "2026-04-11", endDate: "2026-04-12", ageGroups: ["16U"] }],
    link: "https://423.example/interest?e=5",
  });
  assert.match(already, /We added Spring Classic 16U,/);
  assert.equal(already.includes("16U 16U"), false);
});

test("a group text opens every coach on one thread", () => {
  const android = coachGroupSmsHref(["8655550101", "8655550102"], "423Sports: You are registered.");
  assert.equal(android, "sms:+18655550101;+18655550102?body=423Sports%3A%20You%20are%20registered.");
  const iphone = coachGroupSmsHref(["8655550101", "8655550102"], "Hi", true);
  assert.equal(iphone, "sms:/open?addresses=8655550101,8655550102&body=Hi");
  assert.equal(coachGroupSmsHref(["nope"], "Hi"), null);
});

test("a text opens that coach's number with the note filled in", () => {
  const href = coachSmsHref("(865) 555-0100", "Hello");
  assert.equal(href, "sms:+18655550100?&body=Hello");
  assert.equal(coachSmsHref("nope", "Hello"), null);
});
