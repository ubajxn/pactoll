import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  elapsedSeconds,
  ResponseActivity,
} from "../../src/components/chat/reasoning";
import { isActivityPart, responseActivity } from "../../src/lib/chat/activity";
import type { ChatMessage } from "../../src/lib/chat/types";

const message: ChatMessage = {
  id: "multi-step",
  role: "assistant",
  parts: [
    { type: "reasoning", text: "First reasoning step", state: "done" },
    {
      type: "tool-searchRecords",
      toolCallId: "search",
      state: "output-available",
      input: { query: "Cedar", kind: null, offset: 0 },
      output: { total: 1, nextOffset: null, results: [] },
    },
    { type: "step-start" },
    { type: "reasoning", text: "Second reasoning step", state: "done" },
    {
      type: "tool-getRecord",
      toolCallId: "read",
      state: "input-available",
      input: { type: "accounts", id: "cedar" },
    },
    { type: "text", text: "Final answer" },
  ],
};

test("stream start metadata preserves elapsed time across a refresh", () => {
  assert.equal(
    elapsedSeconds(
      "2026-09-16T10:00:00.000Z",
      Date.parse("2026-09-16T10:00:17.400Z"),
    ),
    17,
  );
  assert.equal(elapsedSeconds(undefined), null);
  assert.equal(elapsedSeconds("invalid"), null);
});

test("multiple reasoning and lookup steps share one disclosure", () => {
  const html = renderToStaticMarkup(
    <ResponseActivity message={message} active />,
  );
  assert.equal((html.match(/<summary/g) ?? []).length, 1);
  assert.equal((html.match(/Working/g) ?? []).length, 1);
  assert.ok(html.includes("First reasoning step"));
  assert.ok(html.includes("Second reasoning step"));
  assert.ok(html.includes("Found 1 matching record<"));
  assert.ok(!html.includes("text-xs"));
  assert.ok(!html.includes("Final answer"));
  assert.equal(message.parts.filter(isActivityPart).length, 4);
});

test("unfinished tools are stopped, never successful after cancellation", () => {
  const entries = responseActivity(message.parts, false);
  assert.equal(entries.at(-1)?.state, "stopped");
  assert.equal(entries.at(-1)?.text, "Record lookup stopped");
  const html = renderToStaticMarkup(
    <ResponseActivity message={message} active={false} />,
  );
  assert.ok(html.includes("Stopped"));
  assert.ok(!html.includes('data-streaming="true"'));
  assert.ok(!html.includes("Worked for"));
});

test("lookup failures remain discoverable in the collapsed header", () => {
  const failed: ChatMessage = {
    ...message,
    parts: [
      {
        type: "tool-getRecord",
        toolCallId: "read",
        state: "output-error",
        input: { type: "accounts", id: "missing" },
        errorText: "Record unavailable",
      },
    ],
  };
  const html = renderToStaticMarkup(
    <ResponseActivity message={failed} active={false} />,
  );
  assert.ok(
    html.slice(0, html.indexOf("</summary>")).includes("Lookup failed"),
  );
  assert.ok(html.includes("Record unavailable"));
});

test("Thinking appears only before content and no duration is fabricated for history", () => {
  const empty: ChatMessage = { id: "empty", role: "assistant", parts: [] };
  assert.ok(
    renderToStaticMarkup(<ResponseActivity message={empty} active />).includes(
      "Thinking…",
    ),
  );
  assert.equal(
    renderToStaticMarkup(<ResponseActivity message={empty} active={false} />),
    "",
  );
  const finished = { ...empty, parts: message.parts.slice(0, 2) };
  const html = renderToStaticMarkup(
    <ResponseActivity message={finished} active={false} />,
  );
  assert.ok(html.includes("Worked"));
  assert.ok(!html.includes(" for "));
});
