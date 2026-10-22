import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createChat } from "@shadcn/helpers/ai-sdk";
import { POST } from "../../src/app/api/chat/route";
import { chatRequestSchema } from "../../src/lib/chat/request";
import { ChatSession } from "../../src/lib/chat/session";
import { type ChatMessage, toChatMessage } from "../../src/lib/chat/types";
import { createMemoryAdapter } from "../../src/lib/data/memory";

async function settle(session: ChatSession) {
  for (let i = 0; i < 500; i++) {
    if (session.chat.status === "ready" || session.chat.status === "error")
      break;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  await session.persist();
}

describe("chat lifecycle", () => {
  test("a lost append response can be retried without duplicating the saved message", async () => {
    const data = createMemoryAdapter();
    const conversation = await data.createConversation({
      title: "Lost response",
    });
    let first = true;
    const adapter = {
      ...data,
      appendMessage: async (...args: Parameters<typeof data.appendMessage>) => {
        const result = await data.appendMessage(...args);
        if (first) {
          first = false;
          throw new Error("Response lost after commit");
        }
        return result;
      },
    };
    const session = new ChatSession(conversation, adapter, []);
    session.chat.messages = [
      {
        id: "lost-response",
        role: "user",
        parts: [{ type: "text", text: "Save once" }],
      },
    ];
    await session.persist();
    assert.ok(session.saveError);
    await session.persist();
    assert.equal(session.saveError, null);
    assert.equal((await data.listMessages(conversation.id)).length, 1);
  });
  test("streams through the injected AI SDK transport and saves ordered messages", async () => {
    const data = createMemoryAdapter();
    const conversation = await data.createConversation({ title: "Test" });
    const script = createChat<ChatMessage>()
      .user("Hello")
      .assistant("A deterministic reply.");
    const session = new ChatSession(conversation, data, [], script.transport());
    await session.send("Hello");
    await settle(session);
    const stored = await data.listMessages(conversation.id);
    assert.deepEqual(
      stored.map((m) => m.role),
      ["user", "assistant"],
    );
    assert.deepEqual(stored[1].blocks, [
      { type: "text", text: "A deterministic reply." },
    ]);
    assert.equal(stored[1].status, "final");
    await session.persist();
    assert.equal((await data.listMessages(conversation.id)).length, 2);
  });
  test("stop keeps an interrupted response and never invents a completed answer", async () => {
    const data = createMemoryAdapter();
    const conversation = await data.createConversation({ title: "Stop test" });
    const script = createChat<ChatMessage>()
      .user("Start")
      .assistant(({ writer }) => {
        writer.text("one two three four five six seven eight nine ten", {
          delayMs: 150,
        });
      });
    const session = new ChatSession(conversation, data, [], script.transport());
    await session.send("Start");
    await new Promise((resolve) => setTimeout(resolve, 250));
    await session.chat.stop();
    await settle(session);
    const stored = await data.listMessages(conversation.id);
    assert.equal(stored.at(-1)?.status, "interrupted");
    assert.ok(!JSON.stringify(stored.at(-1)?.blocks).includes("nine ten"));
  });
  test("queued partial checkpoints cannot overwrite a final response", async () => {
    const data = createMemoryAdapter();
    const conversation = await data.createConversation({
      title: "Checkpoints",
    });
    const session = new ChatSession(conversation, data, []);
    const message: ChatMessage = {
      id: "assistant-checkpoint",
      role: "assistant",
      parts: [{ type: "text", text: "Part" }],
    };
    const partial = session.persist([message], true);
    message.parts = [{ type: "text", text: "Complete response" }];
    const final = session.persist([message]);
    await Promise.all([partial, final]);
    const stored = await data.listMessages(conversation.id);
    assert.equal(stored.length, 1);
    assert.equal(stored[0].status, "final");
    assert.deepEqual(stored[0].blocks, [
      { type: "text", text: "Complete response" },
    ]);
    assert.deepEqual(toChatMessage(stored[0]).parts[0], message.parts[0]);
  });
  test("save failures remain visible and retry recovers without duplicates", async () => {
    const data = createMemoryAdapter();
    const conversation = await data.createConversation({ title: "Failure" });
    let fail = true;
    const adapter = {
      ...data,
      appendMessage: async (...args: Parameters<typeof data.appendMessage>) => {
        if (fail) throw new Error("offline");
        return data.appendMessage(...args);
      },
    };
    const session = new ChatSession(conversation, adapter, []);
    session.chat.messages = [
      {
        id: "failed-message",
        role: "user",
        parts: [{ type: "text", text: "Keep this" }],
      },
    ];
    await session.persist();
    assert.ok(session.saveError?.includes("could not be saved"));
    fail = false;
    await session.persist();
    assert.equal(session.saveError, null);
    assert.equal((await data.listMessages(conversation.id)).length, 1);
  });
});

describe("provider request boundary", () => {
  test("requires a conversation ID so generation can check ownership", () => {
    assert.equal(
      chatRequestSchema.safeParse({
        responseId: "legacy-response",
        messages: [
          {
            id: "legacy-message",
            role: "user",
            parts: [{ type: "text", text: "Hello" }],
          },
        ],
      }).success,
      false,
    );
    assert.equal(
      chatRequestSchema.safeParse({
        conversationId: "current-conversation",
        responseId: "current-response",
        attemptId: "current-attempt",
        mode: "replace",
        startedAt: "2026-09-16T10:00:00.000Z",
        messages: [
          {
            id: "current-message",
            role: "user",
            parts: [{ type: "text", text: "Hello" }],
          },
        ],
      }).success,
      true,
    );
  });
  test("checks the browser origin against Host despite Next.js URL normalization", async () => {
    for (const host of ["127.0.0.1:3000", "localhost:3000", "[::1]:3000"]) {
      for (const [origin, status] of [
        [`http://${host}`, 400],
        ["https://other.example", 403],
        ["http://127.0.0.1:3001", 403],
        [`https://${host}`, 403],
        ["null", 403],
      ] as const) {
        const response = await POST(
          new Request("http://localhost:3000/api/chat", {
            method: "POST",
            headers: { host, origin },
            body: "{}",
          }),
        );
        // An invalid body reaches validation only after the origin check passes.
        assert.equal(response.status, status, `${host}: ${origin}`);
      }
    }
  });

  test("rejects invalid messages and cross-origin requests before model calls", async () => {
    assert.equal(
      (
        await POST(
          new Request("http://localhost:3000/api/chat", {
            method: "POST",
            body: "{}",
          }),
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await POST(
          new Request("http://localhost:3000/api/chat", {
            method: "POST",
            headers: { origin: "https://other.example" },
            body: "{}",
          }),
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await POST(
          new Request("http://localhost:3000/api/chat", {
            method: "POST",
            body: JSON.stringify({
              messages: [
                {
                  id: "legacy-context",
                  role: "user",
                  parts: [{ type: "text", text: "Hello" }],
                },
              ],
              context: [],
            }),
          }),
        )
      ).status,
      400,
    );
  });
  test("disabled generation returns an honest unavailable state", async () => {
    const previous = process.env.AI_ENABLED;
    process.env.AI_ENABLED = "false";
    try {
      const response = await POST(
        new Request("http://localhost:3000/api/chat", {
          method: "POST",
          body: "{}",
        }),
      );
      assert.equal(response.status, 503);
      assert.ok((await response.text()).includes("disabled"));
    } finally {
      if (previous === undefined) delete process.env.AI_ENABLED;
      else process.env.AI_ENABLED = previous;
    }
  });
});
