import assert from "node:assert/strict";
import test from "node:test";
import { clientEmailIssue, plainAuthError } from "./auth-errors.ts";

test("seed admin email is treated as valid", () => {
  assert.equal(clientEmailIssue("PBI.Tournaments.Temp@gmail.com"), null);
  assert.equal(clientEmailIssue("  pbi.tournaments.temp@gmail.com  "), null);
});

test("wrong password is not reported as an invalid email", () => {
  assert.equal(
    plainAuthError({ message: "Invalid email or password" }),
    "Wrong email or password.",
  );
  assert.equal(
    plainAuthError({ code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid email or password" }),
    "Wrong email or password.",
  );
});

test("true invalid-email errors still map cleanly", () => {
  assert.equal(plainAuthError({ message: "Invalid email" }), "That email doesn’t look valid.");
});
