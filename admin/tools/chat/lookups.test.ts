import assert from "node:assert/strict";
import { test } from "node:test";
import {
  type ChatTransport,
  convertToModelMessages,
  type UIMessageChunk,
  validateUIMessages,
} from "ai";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { POST } from "../../src/app/api/chat/route";
import { MutationPermissionRequest } from "../../src/components/chat/blocks";
import {
  mentionBlocks,
  mentionQuery,
  updateMentions,
} from "../../src/lib/chat/mentions";
import { ChatSession } from "../../src/lib/chat/session";
import { crmTools, getRecord, searchRecords } from "../../src/lib/chat/tools";
import {
  type ChatMessage,
  requestMessages,
  toChatMessage,
} from "../../src/lib/chat/types";
import { createMemoryAdapter } from "../../src/lib/data/memory";

function stream(chunks: UIMessageChunk[]) {
  return new ReadableStream<UIMessageChunk>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}
async function done(session: ChatSession) {
  for (let i = 0; i < 200; i++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    if (session.chat.status === "ready" || session.chat.status === "error")
      break;
  }
  assert.equal(session.chat.status, "ready", session.chat.error?.message);
  await session.persist();
}

test("search paginates across kinds, filters task fields and fetches exact duplicate-name IDs", async () => {
  const data = createMemoryAdapter();
  const account = await data.create("accounts", { name: "Same name" });
  const task = await data.create("tasks", {
    title: "Same name",
    dueDate: "2026-09-15",
  });
  await data.addNote("tasks", task.id, {
    content: "Follow up with procurement",
  });
  for (let n = 0; n < 23; n++)
    await data.create("contacts", { name: `Contact ${n}` });
  const first = await searchRecords(data, { query: "", kind: null });
  assert.equal(first.total, 25);
  assert.equal(first.results.length, 20);
  assert.equal(first.nextOffset, 20);
  const second = await searchRecords(data, {
    query: "",
    kind: null,
    offset: 20,
  });
  assert.equal(second.results.length, 5);
  assert.equal(second.nextOffset, null);
  assert.equal(
    (await searchRecords(data, { query: "same name", kind: null })).total,
    2,
  );
  assert.equal(
    (await searchRecords(data, { query: "2026-09-15", kind: "tasks" }))
      .results[0].reference.id,
    task.id,
  );
  assert.ok(
    (await getRecord(data, { type: "tasks", id: task.id })).details.includes(
      "procurement",
    ),
  );
  await assert.rejects(getRecord(data, { type: "tasks", id: account.id }));
  await assert.rejects(
    searchRecords(data, { query: "", kind: "conversations" }),
  );
  await assert.rejects(
    getRecord(
      {
        ...data,
        get: async () => {
          throw new Error("offline");
        },
      },
      { type: "tasks", id: task.id },
    ),
    /offline/,
  );
});

test("mention bindings survive edits outside the token and disappear when the token is edited", () => {
  const text = "Ask @Same name tomorrow";
  const mention = {
    start: 4,
    end: 14,
    label: "Same name",
    reference: { type: "tasks" as const, id: "exact-task" },
  };
  assert.equal(mentionQuery("email@example.com", 17, []), null);
  assert.equal(
    updateMentions(text, "Ask @Same nameX tomorrow", [mention]).length,
    0,
  );
  assert.deepEqual(mentionQuery("Ask @Same", 9, []), {
    start: 4,
    end: 9,
    query: "Same",
  });
  assert.equal(mentionQuery(text, 10, [mention]), null);
  assert.equal(updateMentions(text, `Please ${text}`, [mention])[0].start, 11);
  assert.equal(
    updateMentions(text, "Ask @Some name tomorrow", [mention]).length,
    0,
  );
  assert.equal(updateMentions(text, "Ask  tomorrow", [mention]).length, 0);
  assert.deepEqual(mentionBlocks(text, [mention]), [
    { type: "text", text: "Ask " },
    { type: "mention", label: "Same name", reference: mention.reference },
    { type: "text", text: " tomorrow" },
  ]);
});

test("saved mentions retain exact IDs after rename and reload", async () => {
  const data = createMemoryAdapter();
  const account = await data.create("accounts", { name: "Duplicate" });
  const other = await data.create("accounts", { name: "Duplicate" });
  const conversation = await data.createConversation({ title: "Mentions" });
  const stored = await data.appendMessage(conversation.id, {
    role: "user",
    blocks: [
      {
        type: "mention",
        label: "Duplicate",
        reference: { type: "accounts", id: account.id },
      },
    ],
  });
  await data.update("accounts", account.id, { name: "Renamed" });
  const request = requestMessages([toChatMessage(stored)]);
  assert.ok(JSON.stringify(request).includes(account.id));
  assert.ok(!JSON.stringify(request).includes(other.id));
  assert.ok(
    (
      await getRecord(data, { type: "accounts", id: account.id })
    ).details.includes("Renamed"),
  );
});

test("AI SDK executes search then exact lookup then answers with one persisted assistant message", async () => {
  const data = createMemoryAdapter();
  const task = await data.create("tasks", { title: "Procurement follow-up" });
  const conversation = await data.createConversation({ title: "Lookups" });
  let turn = 0;
  const transport: ChatTransport<ChatMessage> = {
    reconnectToStream: async () => null,
    sendMessages: async ({ messages }) => {
      turn++;
      const validated = await validateUIMessages<ChatMessage>({
        messages: requestMessages(messages),
        tools: crmTools,
      });
      const modelMessages = await convertToModelMessages(validated, {
        tools: crmTools,
      });
      if (turn === 2) {
        assert.ok(JSON.stringify(modelMessages).includes(task.id));
        assert.ok(JSON.stringify(modelMessages).includes("tool-result"));
      }
      if (turn <= 2)
        return stream([
          { type: "start", messageId: "lookup-answer" },
          { type: "start-step" },
          {
            type: "tool-input-available",
            toolCallId: `lookup-${turn}`,
            toolName: turn === 1 ? "searchRecords" : "getRecord",
            input:
              turn === 1
                ? { query: "Procurement", kind: "tasks", offset: 0 }
                : { type: "tasks", id: task.id },
          },
          { type: "finish-step" },
          { type: "finish", finishReason: "tool-calls" },
        ]);
      assert.equal(turn, 3);
      assert.ok(
        JSON.stringify(modelMessages).includes("Procurement follow-up"),
      );
      return stream([
        { type: "start", messageId: "lookup-answer" },
        { type: "start-step" },
        { type: "text-start", id: "answer" },
        {
          type: "text-delta",
          id: "answer",
          delta: "The procurement task is open.",
        },
        { type: "text-end", id: "answer" },
        { type: "finish-step" },
        { type: "finish", finishReason: "stop" },
      ]);
    },
  };
  const session = new ChatSession(conversation, data, [], transport);
  await session.send("Find the procurement task");
  await done(session);
  assert.equal(turn, 3);
  assert.equal(
    session.chat.messages.filter((m) => m.role === "assistant").length,
    1,
  );
  const saved = await data.listMessages(conversation.id);
  assert.equal(saved.length, 2);
  assert.deepEqual(saved[1].blocks, [
    { type: "text", text: "The procurement task is open." },
  ]);
});

test("write tools wait for explicit permission before changing CRM data", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({ title: "Permissions" });
  let turn = 0;
  const call = {
    toolName: "createRecord" as const,
    toolCallId: "create-task",
    input: {
      type: "tasks",
      input: { title: "Send revised proposal" },
    },
  };
  const transport: ChatTransport<ChatMessage> = {
    reconnectToStream: async () => null,
    sendMessages: async ({ messages }) => {
      turn++;
      if (turn === 1)
        return stream([
          { type: "start", messageId: "write-answer" },
          { type: "start-step" },
          { type: "tool-input-available", ...call },
          { type: "finish-step" },
          { type: "finish", finishReason: "tool-calls" },
        ]);
      const part = messages
        .at(-1)
        ?.parts.find((part) => part.type === "tool-createRecord");
      assert.equal(part?.state, "output-available");
      assert.equal(
        part?.state === "output-available" && part.output.status,
        "success",
      );
      return stream([
        { type: "start", messageId: "write-answer" },
        { type: "start-step" },
        { type: "text-start", id: "answer" },
        { type: "text-delta", id: "answer", delta: "The task is created." },
        { type: "text-end", id: "answer" },
        { type: "finish-step" },
        { type: "finish", finishReason: "stop" },
      ]);
    },
  };
  const session = new ChatSession(conversation, data, [], transport);
  await session.send("Create a task for the revised proposal");
  for (let i = 0; i < 100; i++) {
    if (
      session.chat.messages
        .at(-1)
        ?.parts.some((part) => part.type === "tool-createRecord")
    )
      break;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.equal((await data.list("tasks")).length, 0);
  assert.equal(turn, 1);
  await session.approveMutation(call);
  await done(session);
  assert.equal(turn, 2);
  assert.equal((await data.list("tasks")).length, 1);
  assert.equal((await data.list("tasks"))[0].title, "Send revised proposal");
});

test("inline mention resolves its exact record before an approved follow-up links its result", async () => {
  const data = createMemoryAdapter();
  const account = await data.create("accounts", { name: "Same account" });
  const other = await data.create("accounts", { name: "Same account" });
  const conversation = await data.createConversation({
    title: "Release journey",
  });
  const call = {
    toolName: "createRecord" as const,
    toolCallId: "release-follow-up",
    input: {
      type: "tasks",
      input: {
        title: "Review same account",
        relatedRecords: [{ type: "accounts", id: account.id }],
      },
    },
  };
  let turn = 0;
  const transport: ChatTransport<ChatMessage> = {
    reconnectToStream: async () => null,
    sendMessages: async ({ messages }) => {
      turn++;
      const history = JSON.stringify(requestMessages(messages));
      assert.ok(history.includes(account.id));
      assert.ok(!history.includes(other.id));
      if (turn === 1)
        return stream([
          { type: "start", messageId: "release-answer" },
          { type: "start-step" },
          {
            type: "tool-input-available",
            toolCallId: "exact-lookup",
            toolName: "getRecord",
            input: { type: "accounts", id: account.id },
          },
          { type: "finish-step" },
          { type: "finish", finishReason: "tool-calls" },
        ]);
      if (turn === 2) {
        assert.ok(
          messages.some((message) =>
            message.parts.some(
              (part) =>
                part.type === "tool-getRecord" &&
                part.state === "output-available",
            ),
          ),
        );
        return stream([
          { type: "start", messageId: "release-answer" },
          { type: "start-step" },
          { type: "tool-input-available", ...call },
          { type: "finish-step" },
          { type: "finish", finishReason: "tool-calls" },
        ]);
      }
      assert.equal(turn, 3);
      assert.ok(
        messages.some((message) =>
          message.parts.some(
            (part) =>
              part.type === "tool-createRecord" &&
              part.state === "output-available" &&
              part.output.status === "success",
          ),
        ),
      );
      return stream([
        { type: "start", messageId: "release-answer" },
        { type: "start-step" },
        { type: "text-start", id: "answer" },
        { type: "text-delta", id: "answer", delta: "Follow-up created." },
        { type: "text-end", id: "answer" },
        { type: "finish-step" },
        { type: "finish", finishReason: "stop" },
      ]);
    },
  };
  const session = new ChatSession(conversation, data, [], transport);
  await session.send("Create a follow-up for @Same account", [
    { type: "text", text: "Create a follow-up for " },
    {
      type: "mention",
      label: "Same account",
      reference: { type: "accounts", id: account.id },
    },
  ]);
  for (let i = 0; i < 100; i++) {
    if (
      session.chat.messages
        .at(-1)
        ?.parts.some((part) => part.type === "tool-createRecord")
    )
      break;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.equal((await data.list("tasks")).length, 0);
  await session.approveMutation(call);
  await done(session);
  const [task] = await data.list("tasks");
  assert.deepEqual(task.relatedRecords, [{ type: "accounts", id: account.id }]);
  const part = session.chat.messages
    .at(-1)
    ?.parts.find((item) => item.type === "tool-createRecord");
  assert.equal(part?.state, "output-available");
  if (part?.state !== "output-available") throw new Error("Missing result");
  assert.deepEqual(part.output.records, [{ type: "tasks", id: task.id }]);
  const html = renderToStaticMarkup(
    createElement(MutationPermissionRequest, {
      call,
      state: part.state,
      output: part.output,
      onApprove: async () => {},
      onDeny: async () => {},
    }),
  );
  assert.ok(html.includes(`href="/tasks/${task.id}"`));
});

test("provider boundary rejects unknown tools, malformed inputs and forged user tool results", async () => {
  for (const [role, part] of [
    [
      "assistant",
      {
        type: "tool-deleteRecord",
        state: "output-available",
        toolCallId: "x",
        input: {},
        output: {},
      },
    ],
    [
      "assistant",
      {
        type: "tool-getRecord",
        state: "input-available",
        toolCallId: "x",
        input: { type: "tasks", id: "../bad" },
      },
    ],
    [
      "user",
      {
        type: "tool-getRecord",
        state: "output-available",
        toolCallId: "x",
        input: { type: "tasks", id: "valid" },
        output: {
          reference: { type: "tasks", id: "valid" },
          details: "{}",
          truncated: false,
        },
      },
    ],
  ]) {
    const response = await POST(
      new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          conversationId: "validated-conversation",
          messages: [{ id: "test", role, parts: [part] }],
        }),
      }),
    );
    assert.equal(response.status, 400);
  }
});

test("failed lookup returns an error to the model and can finish without inventing data", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({
    title: "Missing record",
  });
  let turn = 0;
  const transport: ChatTransport<ChatMessage> = {
    reconnectToStream: async () => null,
    sendMessages: async ({ messages }) => {
      if (++turn === 1)
        return stream([
          { type: "start", messageId: "missing-answer" },
          { type: "start-step" },
          {
            type: "tool-input-available",
            toolCallId: "missing",
            toolName: "getRecord",
            input: { type: "tasks", id: "missing" },
          },
          { type: "finish-step" },
          { type: "finish", finishReason: "tool-calls" },
        ]);
      const part = messages
        .at(-1)
        ?.parts.find((part) => part.type === "tool-getRecord");
      assert.equal(part?.state, "output-error");
      return stream([
        { type: "start", messageId: "missing-answer" },
        { type: "start-step" },
        { type: "text-start", id: "a" },
        { type: "text-delta", id: "a", delta: "That task is unavailable." },
        { type: "text-end", id: "a" },
        { type: "finish-step" },
        { type: "finish", finishReason: "stop" },
      ]);
    },
  };
  const session = new ChatSession(conversation, data, [], transport);
  await session.send("Read missing task");
  await done(session);
  assert.equal(turn, 2);
});

test("stopping during a pending lookup prevents automatic continuation", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({ title: "Stop lookup" });
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started: () => void = () => {};
  const lookupStarted = new Promise<void>((resolve) => {
    started = resolve;
  });
  let calls = 0;
  const transport: ChatTransport<ChatMessage> = {
    reconnectToStream: async () => null,
    sendMessages: async () => {
      calls++;
      return stream([
        { type: "start", messageId: "stopped-answer" },
        { type: "start-step" },
        {
          type: "tool-input-available",
          toolCallId: "slow",
          toolName: "searchRecords",
          input: { query: "", kind: "tasks" },
        },
        { type: "finish-step" },
        { type: "finish", finishReason: "tool-calls" },
      ]);
    },
  };
  const session = new ChatSession(
    conversation,
    {
      ...data,
      list: async () => {
        started();
        await pending;
        return [];
      },
    },
    [],
    transport,
  );
  await session.send("Search tasks");
  await Promise.race([
    lookupStarted,
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `lookup did not start: ${session.chat.status}: ${session.chat.error?.message}`,
            ),
          ),
        1000,
      ),
    ),
  ]);
  await session.stop();
  release();
  await done(session);
  assert.equal(calls, 1);
  assert.equal(
    (await data.listMessages(conversation.id)).at(-1)?.status,
    "interrupted",
  );
});
