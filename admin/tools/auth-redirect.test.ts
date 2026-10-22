import assert from "node:assert/strict";
import { test } from "node:test";
import { safeReturnTo } from "../src/lib/auth/redirect";

test("login returns to records, queries and invitations on the same site", () => {
  for (const path of ["/accounts/record-id", "/tasks?view=mine", "/invite/id"])
    assert.equal(safeReturnTo(path), path);
});

test("login cannot redirect offsite, into API routes or authentication loops", () => {
  for (const input of [
    undefined,
    ["/home", "/accounts"],
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\nevil.example/../api/session",
    "/api",
    "/api/auth/sign-out",
    "/onboarding?next=/onboarding",
    "/login",
  ])
    assert.equal(safeReturnTo(input), "/home");
});
