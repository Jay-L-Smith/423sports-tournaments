import assert from "node:assert/strict";
import test from "node:test";
import { extractSessionToken } from "./capture-session.ts";

test("reads unsigned token from the JSON body", () => {
  assert.equal(extractSessionToken({ token: "abc123", user: { id: "1" } }), "abc123");
});

test("reads nested session.token", () => {
  assert.equal(extractSessionToken({ session: { token: "nested" } }), "nested");
});

test("prefers signed set-auth-token header over unsigned body token", () => {
  assert.equal(
    extractSessionToken({ token: "unsigned" }, "unsigned.signature=="),
    "unsigned.signature==",
  );
});

test("decodes a percent-encoded header token", () => {
  assert.equal(
    extractSessionToken(null, "abc.sig%2Bplus%3D"),
    "abc.sig+plus=",
  );
});

test("returns null when nothing is present", () => {
  assert.equal(extractSessionToken({ user: { id: "1" } }), null);
  assert.equal(extractSessionToken(null, "  "), null);
});
