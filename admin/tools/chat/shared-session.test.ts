import assert from "node:assert/strict";
import { test } from "node:test";
import { ChatSession } from "../../src/lib/chat/session";
import type { MutationToolCall } from "../../src/lib/chat/tools";
import { createMemoryAdapter } from "../../src/lib/data/memory";

test("shared sessions never generate, persist, stop or approve actions and can refresh saved messages", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({ title: "Shared" });
  const viewer = { ...conversation, access: "viewer" as const };
  let calls = 0;
  const session = new ChatSession(
    viewer,
    {
      ...data,
      getConversation: async () => viewer,
      appendMessage: async () => {
        calls++;
        throw new Error("Unexpected write");
      },
      updateMessage: async () => {
        calls++;
        throw new Error("Unexpected write");
      },
      create: async () => {
        calls++;
        throw new Error("Unexpected write");
      },
    },
    [],
    {
      sendMessages: async () => {
        calls++;
        throw new Error("Unexpected generation");
      },
      reconnectToStream: async () => {
        calls++;
        throw new Error("Unexpected stream");
      },
    },
  );
  const mutation: MutationToolCall = {
    toolName: "createRecord",
    toolCallId: "mutation",
    input: { kind: "accounts", values: { name: "Do not create" } },
  };
  for (const operation of [
    () => session.send("Do not send"),
    () => session.retry(),
    () => session.persist(),
    () => session.stop(),
    () => session.approveMutation(mutation),
    () => session.denyMutation(mutation),
  ])
    await assert.rejects(operation, { code: "forbidden" });
  await session.resume();
  assert.equal(calls, 0);
  await data.appendMessage(conversation.id, {
    role: "assistant",
    blocks: [{ type: "text", text: "Owner update" }],
  });
  await session.refresh();
  assert.equal(session.chat.messages.length, 1);
  assert.equal(calls, 0);
});
