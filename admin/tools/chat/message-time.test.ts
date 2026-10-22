import assert from "node:assert/strict";
import { test } from "node:test";
import { formatMessageTime } from "../../src/lib/chat/message-time";

const now = new Date(2026, 8, 16, 18, 0);

test("message times use time, weekday, and full-date tiers", () => {
  assert.equal(
    formatMessageTime(new Date(2026, 8, 16, 9, 5).toISOString(), now, "en-GB"),
    "09:05",
  );
  assert.equal(
    formatMessageTime(new Date(2026, 8, 13, 9, 5).toISOString(), now, "en-GB"),
    "Sunday 09:05",
  );
  assert.equal(
    formatMessageTime(new Date(2026, 8, 8, 9, 5).toISOString(), now, "en-GB"),
    "8 Sep 2026 09:05",
  );
});

test("invalid message times render no label", () => {
  assert.equal(formatMessageTime("not-a-date", now, "en-GB"), "");
});
