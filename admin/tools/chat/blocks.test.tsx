import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ChatBlock,
  MutationPermissionRequest,
} from "../../src/components/chat/blocks";

test("chat results stay inline without result-sidebar controls", () => {
  const recordHtml = renderToStaticMarkup(
    <ChatBlock
      block={{
        type: "records",
        records: [{ type: "accounts", id: "account/one" }],
      }}
      names={{ "account/one": "Acme & Co" }}
    />,
  );
  assert.ok(recordHtml.includes('href="/accounts/account%2Fone"'));
  assert.ok(recordHtml.includes("Acme &amp; Co"));

  const tableHtml = renderToStaticMarkup(
    <ChatBlock
      block={{
        type: "table",
        columns: ["Account", "Value"],
        rows: [["Acme & Co", 42]],
      }}
    />,
  );
  assert.ok(tableHtml.includes("<table"));
  assert.ok(!tableHtml.includes("result panel"));

  const draftHtml = renderToStaticMarkup(
    <ChatBlock
      block={{ type: "draft", title: "Follow-up", content: "Hello there" }}
    />,
  );
  assert.ok(draftHtml.includes("Hello there"));
  assert.ok(!draftHtml.includes(">Expand<"));
});

test("approved chat mutation result links to its exact record", () => {
  const html = renderToStaticMarkup(
    <MutationPermissionRequest
      call={{
        toolName: "createRecord",
        toolCallId: "create-one",
        input: { type: "tasks", input: { title: "Follow up" } },
      }}
      state="output-available"
      output={{
        status: "success",
        text: "Created task Follow up.",
        records: [{ type: "tasks", id: "task-one" }],
      }}
      onApprove={async () => {}}
      onDeny={async () => {}}
    />,
  );
  assert.ok(html.includes('href="/tasks/task-one"'));
  assert.ok(html.includes("Created task Follow up."));
});
