import assert from "node:assert/strict";
import { test } from "node:test";
import { pendingMutationCalls } from "../../src/lib/chat/permissions";
import type { ChatMessage } from "../../src/lib/chat/types";

test("only unresolved mutation requests replace the composer", () => {
  const messages: ChatMessage[] = [
    {
      id: "assistant",
      role: "assistant",
      parts: [
        {
          type: "data-block",
          data: {
            type: "confirmation",
            actionId: "legacy-action",
            text: "Stored proposal",
            records: [],
            status: "pending",
          },
        },
        {
          type: "tool-createRecord",
          toolCallId: "completed-create",
          state: "output-available",
          input: {
            type: "tasks",
            input: {
              title: "Already handled",
              status: "open",
              assignee: null,
              dueDate: null,
              relatedRecords: [],
            },
          },
          output: { status: "success", text: "Created", records: [] },
        },
        {
          type: "tool-updateRecord",
          toolCallId: "pending-update",
          state: "input-available",
          input: {
            type: "accounts",
            id: "account-1",
            input: { name: "Updated name" },
          },
        },
      ],
    },
  ];

  assert.deepEqual(pendingMutationCalls(messages), [
    {
      toolName: "updateRecord",
      toolCallId: "pending-update",
      input: {
        type: "accounts",
        id: "account-1",
        input: { name: "Updated name" },
      },
    },
  ]);
});

test("pending mutation requests retain transcript order", () => {
  const messages: ChatMessage[] = [
    {
      id: "assistant",
      role: "assistant",
      parts: [
        {
          type: "tool-createRecord",
          toolCallId: "first",
          state: "input-available",
          input: {
            type: "tasks",
            input: {
              title: "First",
              status: "open",
              assignee: null,
              dueDate: null,
              relatedRecords: [],
            },
          },
        },
        {
          type: "tool-createRecord",
          toolCallId: "second",
          state: "input-available",
          input: {
            type: "tasks",
            input: {
              title: "Second",
              status: "open",
              assignee: null,
              dueDate: null,
              relatedRecords: [],
            },
          },
        },
      ],
    },
  ];

  assert.deepEqual(
    pendingMutationCalls(messages).map((call) => call.toolCallId),
    ["first", "second"],
  );
});
