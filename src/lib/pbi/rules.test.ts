import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_BRACKET_RULES,
  MIN_BRACKET_TEAMS,
  parseBracketRules,
  teamsNeededForBracket,
} from "./rules.ts";

test("empty rules fall back to travel-ball defaults", () => {
  const rules = parseBracketRules({});
  assert.equal(rules.minTeams, 3);
  assert.equal(rules.advance, "all-reseed");
  assert.equal(rules.elimination, "single");
  assert.equal(rules.tiebreakers[0], "record");
  assert.equal(rules.homePool, "coin-flip");
  assert.equal(rules.homeBracket, "higher-seed");
});

test("min teams to draw a bracket cannot go below 3", () => {
  assert.equal(parseBracketRules({ minTeams: 1 }).minTeams, MIN_BRACKET_TEAMS);
  assert.equal(parseBracketRules({ minTeams: "4" }).minTeams, 4);
  assert.equal(teamsNeededForBracket(DEFAULT_BRACKET_RULES, null), 3);
  assert.equal(teamsNeededForBracket(DEFAULT_BRACKET_RULES, 5), 5);
});
