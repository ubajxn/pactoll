import assert from "node:assert/strict";
import { test } from "node:test";
import {
  type ChatTransport,
  readUIMessageStream,
  type UIMessageChunk,
} from "ai";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatMarkdown } from "../../src/components/chat/blocks";
import { persistGeneratedResponse } from "../../src/lib/chat/server-persistence";
import { ChatSession } from "../../src/lib/chat/session";
import {
  acknowledgeChatStream,
  beginChatStream,
  captureChatStream,
  getChatStream,
  replayPrefix,
  resumeChatStream,
  setChatStreamPersistence,
  stopChatStream,
} from "../../src/lib/chat/stream-store";
import { executeMutation } from "../../src/lib/chat/tools";
import type { ChatMessage } from "../../src/lib/chat/types";
import { DataError } from "../../src/lib/data/contracts";
import { createMemoryAdapter } from "../../src/lib/data/memory";

async function readAll(stream: ReadableStream<string>) {
  const reader = stream.getReader();
  let value = "";
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) return value;
    value += chunk.value;
  }
}

function uiStream(chunks: UIMessageChunk[]) {
  return new ReadableStream<UIMessageChunk>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

async function waitUntil(check: () => boolean) {
  for (let index = 0; index < 200; index++) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error("Timed out waiting for chat state");
}

async function within<T>(promise: Promise<T>, label: string) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out: ${label}`)), 2000),
    ),
  ]);
}

test("an obsolete capture cannot append to or finalize its replacement", async () => {
  const conversationId = "replacement-conversation";
  const responseId = "stable-assistant";
  const oldAttempt = beginChatStream({
    conversationId,
    responseId,
    attemptId: "old-attempt",
  });
  let oldSource!: ReadableStreamDefaultController<string>;
  const oldCapture = captureChatStream(
    oldAttempt,
    new ReadableStream({
      start(controller) {
        oldSource = controller;
      },
    }),
  );

  const replacementAttempt = beginChatStream({
    conversationId,
    responseId,
    attemptId: "replacement-attempt",
  });
  let replacementSource!: ReadableStreamDefaultController<string>;
  const replacementCapture = captureChatStream(
    replacementAttempt,
    new ReadableStream({
      start(controller) {
        replacementSource = controller;
      },
    }),
  );

  oldSource.enqueue("data: obsolete\n\n");
  oldSource.close();
  await oldCapture;
  replacementSource.enqueue("data: current\n\n");

  const resumed = resumeChatStream(conversationId);
  assert.ok(resumed);
  replacementSource.close();
  await replacementCapture;
  assert.equal(await readAll(resumed), "data: current\n\n");
});

test("SDK replay reconstructs prior text and tools before continuation text", async () => {
  const prior = {
    id: "stable-answer",
    role: "assistant",
    metadata: { startedAt: "2026-09-20T10:00:00.000Z" },
    parts: [
      { type: "text", text: "Earlier step." },
      { type: "step-start" },
      {
        type: "tool-searchRecords",
        toolCallId: "lookup-1",
        state: "output-available",
        input: { query: "Acme", kind: "accounts", offset: 0 },
        output: { total: 0, nextOffset: null, results: [] },
      },
    ],
  } as ChatMessage;
  const prefix = replayPrefix(prior, "continuation-attempt").map(
    (line) => JSON.parse(line.slice(6)) as UIMessageChunk,
  );
  const continuation: UIMessageChunk[] = [
    {
      type: "start",
      messageId: "stable-answer",
      messageMetadata: { attemptId: "continuation-attempt" },
    },
    { type: "start-step" },
    { type: "text-start", id: "later" },
    { type: "text-delta", id: "later", delta: "Later step." },
    { type: "text-end", id: "later" },
    { type: "finish", finishReason: "stop" },
  ];
  let latest: ChatMessage | undefined;
  for await (const message of readUIMessageStream<ChatMessage>({
    stream: new ReadableStream({
      start(controller) {
        for (const chunk of [...prefix, ...continuation])
          controller.enqueue(chunk);
        controller.close();
      },
    }),
  }))
    latest = message;
  assert.equal(latest?.id, "stable-answer");
  assert.deepEqual(
    latest?.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text),
    ["Earlier step.", "Later step."],
  );
  assert.equal(
    latest?.parts.find((part) => part.type === "tool-searchRecords")?.state,
    "output-available",
  );
});

test("ChatSession reconnects through the registry during and after a multi-step response", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({
    title: "Registry replay",
  });
  const account = await data.create("accounts", { name: "Replay account" });
  const savedFetch = globalThis.fetch;
  let posts = 0;
  let reconnects = 0;
  let currentAttempt = "";
  let currentResponse = "";
  let releaseContinuation!: () => void;
  const continuationReleased = new Promise<void>((resolve) => {
    releaseContinuation = resolve;
  });
  let continuationStarted!: () => void;
  const didStartContinuation = new Promise<void>((resolve) => {
    continuationStarted = resolve;
  });
  const encodedResponse = (stream: ReadableStream<string>) =>
    new Response(stream.pipeThrough(new TextEncoderStream()), {
      headers: {
        "content-type": "text/event-stream",
        "x-vercel-ai-ui-message-stream": "v1",
      },
    });
  const line = (chunk: UIMessageChunk) => `data: ${JSON.stringify(chunk)}\n\n`;
  globalThis.fetch = (async (url, init) => {
    const path = String(url);
    if (path === "/api/chat") {
      posts++;
      const body = JSON.parse(String(init?.body)) as {
        responseId: string;
        attemptId: string;
        expectedAttemptId?: string;
        mode: "append" | "replace";
        messages: ChatMessage[];
      };
      const generation = await data.beginAssistantGeneration(conversation.id, {
        responseId: body.responseId,
        attemptId: body.attemptId,
        expectedAttemptId: body.expectedAttemptId,
        mode: body.mode,
      });
      currentAttempt = body.attemptId;
      currentResponse = body.responseId;
      const entry = beginChatStream({
        conversationId: conversation.id,
        responseId: body.responseId,
        attemptId: body.attemptId,
        prefix:
          body.mode === "append"
            ? replayPrefix(body.messages.at(-1), body.attemptId)
            : [],
      });
      let controller!: ReadableStreamDefaultController<string>;
      const source = new ReadableStream<string>({
        start(value) {
          controller = value;
        },
      });
      const [client, captured] = source.tee();
      void captureChatStream(entry, captured);
      const metadata = {
        responseId: body.responseId,
        attemptId: body.attemptId,
        generation: generation.generation,
        startedAt: "2026-09-20T12:00:00.000Z",
      };
      if (posts === 1) {
        for (const chunk of [
          {
            type: "start",
            messageId: body.responseId,
            messageMetadata: metadata,
          },
          { type: "start-step" },
          { type: "text-start", id: "earlier" },
          { type: "text-delta", id: "earlier", delta: "Earlier step." },
          { type: "text-end", id: "earlier" },
          {
            type: "tool-input-available",
            toolCallId: "registry-lookup",
            toolName: "getRecord",
            input: { type: "accounts", id: account.id },
          },
          { type: "finish-step" },
          { type: "finish", finishReason: "tool-calls" },
        ] as UIMessageChunk[])
          controller.enqueue(line(chunk));
        await data.saveAssistantGeneration(conversation.id, body.responseId, {
          attemptId: body.attemptId,
          generation: generation.generation,
          revision: 1,
          blocks: [{ type: "text", text: "Earlier step." }],
          status: "partial",
        });
        setChatStreamPersistence(
          entry,
          {
            response: {
              id: body.responseId,
              role: "assistant",
              metadata,
              parts: [{ type: "text", text: "Earlier step." }],
            },
            outcome: { status: "completed" },
            finishReason: "tool-calls",
            generation: generation.generation,
          },
          { saved: true },
        );
        controller.close();
      } else {
        for (const chunk of [
          {
            type: "start",
            messageId: body.responseId,
            messageMetadata: metadata,
          },
          { type: "start-step" },
          { type: "text-start", id: "later" },
          { type: "text-delta", id: "later", delta: "Later " },
        ] as UIMessageChunk[])
          controller.enqueue(line(chunk));
        continuationStarted();
        void continuationReleased.then(async () => {
          controller.enqueue(
            line({ type: "text-delta", id: "later", delta: "step." }),
          );
          controller.enqueue(line({ type: "text-end", id: "later" }));
          controller.enqueue(line({ type: "finish-step" }));
          controller.enqueue(line({ type: "finish", finishReason: "stop" }));
          await data.saveAssistantGeneration(conversation.id, body.responseId, {
            attemptId: body.attemptId,
            generation: generation.generation,
            revision: 1,
            blocks: [
              { type: "text", text: "Earlier step." },
              { type: "text", text: "Later step." },
            ],
            status: "final",
          });
          setChatStreamPersistence(
            entry,
            {
              response: {
                id: body.responseId,
                role: "assistant",
                metadata,
                parts: [
                  { type: "text", text: "Earlier step." },
                  { type: "text", text: "Later step." },
                ],
              },
              outcome: { status: "completed" },
              finishReason: "stop",
              generation: generation.generation,
            },
            { saved: true },
          );
          controller.close();
        });
      }
      return encodedResponse(client);
    }
    if (path.endsWith("/stream") && (!init?.method || init.method === "GET")) {
      reconnects++;
      const stream = resumeChatStream(conversation.id);
      return stream
        ? encodedResponse(stream)
        : new Response(null, { status: 204 });
    }
    if (path.endsWith("/stream") && init?.method === "DELETE")
      return new Response(null, { status: 204 });
    throw new Error(`Unexpected fixture request: ${path}`);
  }) as typeof fetch;
  try {
    const first = new ChatSession(conversation, data, []);
    await first.send("Run the replay lookup");
    await within(didStartContinuation, "continuation start");
    const partial = await data.listMessages(conversation.id);
    assert.equal(partial.at(-1)?.status, "partial");

    const during = new ChatSession(conversation, data, partial);
    const reconnecting = during.resume();
    await waitUntil(() =>
      Boolean(
        during.chat.messages
          .at(-1)
          ?.parts.some(
            (part) => part.type === "text" && part.text === "Later ",
          ),
      ),
    );
    releaseContinuation();
    await reconnecting;
    await waitUntil(() => first.chat.status === "ready");

    const completed = await data.listMessages(conversation.id);
    assert.equal(completed.at(-1)?.status, "final");
    const after = new ChatSession(conversation, data, completed);
    await after.resume();
    const assistant = after.chat.messages.filter(
      (message) => message.role === "assistant",
    );
    assert.equal(assistant.length, 1);
    assert.equal(assistant[0].id, completed.at(-1)?.id);
    assert.deepEqual(
      assistant[0].parts
        .filter((part) => part.type === "text")
        .map((part) => part.text),
      ["Earlier step.", "Later step."],
    );
    assert.equal(
      assistant[0].parts.filter((part) => part.type === "tool-getRecord")
        .length,
      1,
    );
    assert.equal(
      after.chat.messages.filter((message) => message.role === "user").length,
      1,
    );
    assert.equal(
      (await data.listMessages(conversation.id)).filter(
        (message) => message.role === "user",
      ).length,
      1,
    );
    assert.equal(posts, 2);
    assert.equal(reconnects, 2);
  } finally {
    globalThis.fetch = savedFetch;
    acknowledgeChatStream(conversation.id, currentResponse, currentAttempt);
  }
});

test("generation revisions reject stale checkpoints and allow explicit replacement", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({ title: "Ordering" });
  const first = await data.beginAssistantGeneration(conversation.id, {
    responseId: "answer",
    attemptId: "attempt-one",
    mode: "replace",
  });
  await assert.rejects(
    data.appendMessage(conversation.id, {
      id: "answer",
      role: "assistant",
      blocks: [{ type: "text", text: "Old append" }],
      status: "partial",
    }),
    (error: unknown) => error instanceof DataError && error.code === "conflict",
  );
  await data.saveAssistantGeneration(conversation.id, "answer", {
    attemptId: first.attemptId,
    generation: first.generation,
    revision: 1,
    blocks: [{ type: "text", text: "Complete answer" }],
    status: "final",
  });
  await assert.rejects(
    data.updateMessage(conversation.id, "answer", {
      blocks: [{ type: "text", text: "Old browser checkpoint" }],
      status: "partial",
    }),
    (error: unknown) => error instanceof DataError && error.code === "conflict",
  );
  await assert.rejects(
    data.saveAssistantGeneration(conversation.id, "answer", {
      attemptId: first.attemptId,
      generation: first.generation,
      revision: 2,
      blocks: [{ type: "text", text: "Partial" }],
      status: "partial",
    }),
    (error: unknown) => error instanceof DataError && error.code === "conflict",
  );
  const replacement = await data.beginAssistantGeneration(conversation.id, {
    responseId: "answer",
    attemptId: "attempt-two",
    expectedAttemptId: first.attemptId,
    mode: "replace",
  });
  await data.saveAssistantGeneration(conversation.id, "answer", {
    attemptId: replacement.attemptId,
    generation: replacement.generation,
    revision: 1,
    blocks: [{ type: "text", text: "Regenerated answer" }],
    status: "final",
  });
  await assert.rejects(
    data.updateMessage(conversation.id, "answer", {
      blocks: [{ type: "text", text: "Checkpoint from prior regeneration" }],
      status: "partial",
    }),
    (error: unknown) => error instanceof DataError && error.code === "conflict",
  );
  await assert.rejects(
    data.saveAssistantGeneration(conversation.id, "answer", {
      attemptId: first.attemptId,
      generation: first.generation,
      revision: 3,
      blocks: [{ type: "text", text: "Late old completion" }],
      status: "final",
    }),
    (error: unknown) => error instanceof DataError && error.code === "conflict",
  );
  assert.deepEqual((await data.listMessages(conversation.id))[0].blocks, [
    { type: "text", text: "Regenerated answer" },
  ]);
});

test("failed regeneration keeps its stable response ID and confirmed predecessor", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({ title: "Stable retry" });
  const prompt = await data.appendMessage(conversation.id, {
    id: "stable-retry-prompt",
    role: "user",
    blocks: [{ type: "text", text: "Answer this" }],
  });
  const original = await data.beginAssistantGeneration(conversation.id, {
    responseId: "stable-retry-answer",
    attemptId: "stable-retry-original",
    mode: "replace",
  });
  await data.saveAssistantGeneration(conversation.id, original.responseId, {
    attemptId: original.attemptId,
    generation: original.generation,
    revision: 1,
    blocks: [{ type: "text", text: "Original answer" }],
    status: "final",
  });
  const requests: Array<{
    responseId: string;
    attemptId: string;
    expectedAttemptId?: string;
  }> = [];
  let successfulGenerations = 0;
  const savedFetch = globalThis.fetch;
  globalThis.fetch = (async (url, init) => {
    if (String(url).endsWith("/stream"))
      return new Response(null, { status: 204 });
    if (String(url).endsWith("/stop")) return Response.json({ stopped: false });
    const body = JSON.parse(String(init?.body));
    requests.push(body);
    if (requests.length === 1)
      throw new TypeError("Injected network failure before server acceptance");
    const generation = await data.beginAssistantGeneration(conversation.id, {
      responseId: body.responseId,
      attemptId: body.attemptId,
      expectedAttemptId: body.expectedAttemptId,
      mode: body.mode,
    });
    successfulGenerations++;
    await data.saveAssistantGeneration(conversation.id, generation.responseId, {
      attemptId: generation.attemptId,
      generation: generation.generation,
      revision: 1,
      blocks: [{ type: "text", text: "Replacement answer" }],
      status: "final",
    });
    return new Response(
      `${[
        {
          type: "start",
          messageId: generation.responseId,
          messageMetadata: {
            responseId: generation.responseId,
            attemptId: generation.attemptId,
            generation: generation.generation,
          },
        },
        { type: "text-start", id: "stable-replacement" },
        {
          type: "text-delta",
          id: "stable-replacement",
          delta: "Replacement answer",
        },
        { type: "text-end", id: "stable-replacement" },
        { type: "finish", finishReason: "stop" },
      ]
        .map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`)
        .join("")}data: [DONE]\n\n`,
      {
        headers: {
          "content-type": "text/event-stream",
          "x-vercel-ai-ui-message-stream": "v1",
        },
      },
    );
  }) as typeof fetch;
  const session = new ChatSession(
    conversation,
    data,
    await data.listMessages(conversation.id),
  );
  try {
    await session.retry();
    await session.retry();
    await session.persist();
    assert.equal(requests.length, 2);
    assert.deepEqual(
      requests.map(({ responseId, expectedAttemptId }) => ({
        responseId,
        expectedAttemptId,
      })),
      [
        {
          responseId: original.responseId,
          expectedAttemptId: original.attemptId,
        },
        {
          responseId: original.responseId,
          expectedAttemptId: original.attemptId,
        },
      ],
    );
    assert.equal(successfulGenerations, 1);
    const stored = await data.listMessages(conversation.id);
    assert.deepEqual(
      stored
        .filter((message) => message.role === "user")
        .map((message) => message.id),
      [prompt.id],
    );
    assert.deepEqual(
      stored
        .filter((message) => message.role === "assistant")
        .map((message) => ({ id: message.id, blocks: message.blocks })),
      [
        {
          id: original.responseId,
          blocks: [{ type: "text", text: "Replacement answer" }],
        },
      ],
    );
    await assert.rejects(
      data.saveAssistantGeneration(conversation.id, original.responseId, {
        attemptId: original.attemptId,
        generation: original.generation,
        revision: 2,
        blocks: [{ type: "text", text: "Delayed old completion" }],
        status: "final",
      }),
      (error: unknown) =>
        error instanceof DataError && error.code === "conflict",
    );
    assert.deepEqual(
      (await data.listMessages(conversation.id)).at(-1)?.blocks,
      [{ type: "text", text: "Replacement answer" }],
    );
  } finally {
    globalThis.fetch = savedFetch;
  }
});

test("an early-stopped regeneration restores its answer and remains retryable", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({
    title: "Canceled regeneration",
  });
  const prompt = await data.appendMessage(conversation.id, {
    id: "retry-prompt",
    role: "user",
    blocks: [{ type: "text", text: "Answer this" }],
  });
  const original = await data.beginAssistantGeneration(conversation.id, {
    responseId: "original-answer",
    attemptId: "original-attempt",
    mode: "replace",
  });
  await data.saveAssistantGeneration(conversation.id, original.responseId, {
    attemptId: original.attemptId,
    generation: original.generation,
    revision: 1,
    blocks: [{ type: "text", text: "Original answer" }],
    status: "final",
  });

  const savedFetch = globalThis.fetch;
  const savedSetInterval = globalThis.setInterval;
  const savedClearInterval = globalThis.clearInterval;
  const activeIntervals = new Set<ReturnType<typeof setInterval>>();
  const requests: Array<{
    responseId: string;
    attemptId: string;
    expectedAttemptId?: string;
    mode: "append" | "replace";
  }> = [];
  let stopBody: { responseId: string; attemptId: string } | undefined;
  globalThis.setInterval = ((
    ...args: Parameters<typeof globalThis.setInterval>
  ) => {
    const timer = savedSetInterval(...args);
    activeIntervals.add(timer);
    return timer;
  }) as typeof globalThis.setInterval;
  globalThis.clearInterval = ((
    ...args: Parameters<typeof globalThis.clearInterval>
  ) => {
    const [timer] = args;
    if (timer !== undefined)
      activeIntervals.delete(timer as ReturnType<typeof setInterval>);
    return savedClearInterval(...args);
  }) as typeof globalThis.clearInterval;
  globalThis.fetch = (async (url, init) => {
    const path = String(url);
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    if (path === "/api/chat") {
      requests.push(body);
      if (requests.length === 1)
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Injected early stop", "AbortError")),
            { once: true },
          );
        });
      const generation = await data.beginAssistantGeneration(conversation.id, {
        responseId: body.responseId,
        attemptId: body.attemptId,
        expectedAttemptId: body.expectedAttemptId,
        mode: body.mode,
      });
      await data.saveAssistantGeneration(
        conversation.id,
        generation.responseId,
        {
          attemptId: generation.attemptId,
          generation: generation.generation,
          revision: 1,
          blocks: [{ type: "text", text: "Replacement answer" }],
          status: "final",
        },
      );
      const chunks: UIMessageChunk[] = [
        {
          type: "start",
          messageId: generation.responseId,
          messageMetadata: {
            responseId: generation.responseId,
            attemptId: generation.attemptId,
            generation: generation.generation,
          },
        },
        { type: "text-start", id: "replacement" },
        {
          type: "text-delta",
          id: "replacement",
          delta: "Replacement answer",
        },
        { type: "text-end", id: "replacement" },
        { type: "finish", finishReason: "stop" },
      ];
      return new Response(
        `${chunks
          .map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`)
          .join("")}data: [DONE]\n\n`,
        {
          headers: {
            "content-type": "text/event-stream",
            "x-vercel-ai-ui-message-stream": "v1",
          },
        },
      );
    }
    if (path.endsWith("/stop")) {
      stopBody = body;
      return Response.json({ stopped: false });
    }
    if (path.endsWith("/stream")) return new Response(null, { status: 204 });
    throw new Error(`Unexpected early-stop request: ${path}`);
  }) as typeof fetch;

  const session = new ChatSession(
    conversation,
    data,
    await data.listMessages(conversation.id),
  );
  try {
    const firstRetry = session.retry();
    await waitUntil(() => requests.length === 1);
    await session.stop();
    await firstRetry;

    assert.deepEqual(
      session.chat.messages.map((message) => message.id),
      [prompt.id, original.responseId],
    );
    assert.deepEqual(session.chat.messages.at(-1)?.parts, [
      { type: "text", text: "Original answer" },
    ]);
    assert.deepEqual(
      (await data.listMessages(conversation.id)).at(-1)?.blocks,
      [{ type: "text", text: "Original answer" }],
    );
    assert.deepEqual(stopBody, {
      responseId: original.responseId,
      attemptId: requests[0].attemptId,
    });
    assert.equal(activeIntervals.size, 0);

    await session.retry();
    await session.persist();

    assert.equal(requests.length, 2);
    assert.deepEqual(
      requests.map(({ responseId, expectedAttemptId, mode }) => ({
        responseId,
        expectedAttemptId,
        mode,
      })),
      [
        {
          responseId: original.responseId,
          expectedAttemptId: original.attemptId,
          mode: "replace",
        },
        {
          responseId: original.responseId,
          expectedAttemptId: original.attemptId,
          mode: "replace",
        },
      ],
    );
    assert.deepEqual(
      session.chat.messages.map((message) => ({
        id: message.id,
        role: message.role,
      })),
      [
        { id: prompt.id, role: "user" },
        { id: original.responseId, role: "assistant" },
      ],
    );
    const stored = await data.listMessages(conversation.id);
    assert.deepEqual(
      stored.map((message) => ({
        id: message.id,
        role: message.role,
        blocks: message.blocks,
      })),
      [
        {
          id: prompt.id,
          role: "user",
          blocks: [{ type: "text", text: "Answer this" }],
        },
        {
          id: original.responseId,
          role: "assistant",
          blocks: [{ type: "text", text: "Replacement answer" }],
        },
      ],
    );
    assert.equal(activeIntervals.size, 0);
  } finally {
    for (const timer of activeIntervals) savedClearInterval(timer);
    globalThis.fetch = savedFetch;
    globalThis.setInterval = savedSetInterval;
    globalThis.clearInterval = savedClearInterval;
  }
});

test("a pre-callback retry failure clears checkpointing", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({
    title: "Rejected retry",
  });
  await data.appendMessage(conversation.id, {
    role: "user",
    blocks: [{ type: "text", text: "Answer this" }],
  });
  const original = await data.beginAssistantGeneration(conversation.id, {
    responseId: "rejected-retry-answer",
    attemptId: "rejected-retry-attempt",
    mode: "replace",
  });
  await data.saveAssistantGeneration(conversation.id, original.responseId, {
    attemptId: original.attemptId,
    generation: original.generation,
    revision: 1,
    blocks: [{ type: "text", text: "Saved answer" }],
    status: "final",
  });

  const savedSetInterval = globalThis.setInterval;
  const savedClearInterval = globalThis.clearInterval;
  const activeIntervals = new Set<ReturnType<typeof setInterval>>();
  globalThis.setInterval = ((
    ...args: Parameters<typeof globalThis.setInterval>
  ) => {
    const timer = savedSetInterval(...args);
    activeIntervals.add(timer);
    return timer;
  }) as typeof globalThis.setInterval;
  globalThis.clearInterval = ((
    ...args: Parameters<typeof globalThis.clearInterval>
  ) => {
    const [timer] = args;
    if (timer !== undefined)
      activeIntervals.delete(timer as ReturnType<typeof setInterval>);
    return savedClearInterval(...args);
  }) as typeof globalThis.clearInterval;
  const session = new ChatSession(
    conversation,
    data,
    await data.listMessages(conversation.id),
  );
  session.chat.regenerate = async () => {
    throw new Error("Injected pre-callback failure");
  };
  try {
    await assert.rejects(session.retry(), /Injected pre-callback failure/);
    assert.equal(activeIntervals.size, 0);
  } finally {
    for (const timer of activeIntervals) savedClearInterval(timer);
    globalThis.setInterval = savedSetInterval;
    globalThis.clearInterval = savedClearInterval;
  }
});

test("ambiguous regeneration acceptance reconnects instead of replacing again", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({
    title: "Ambiguous retry",
  });
  await data.appendMessage(conversation.id, {
    id: "ambiguous-prompt",
    role: "user",
    blocks: [{ type: "text", text: "Answer this" }],
  });
  const original = await data.beginAssistantGeneration(conversation.id, {
    responseId: "ambiguous-answer",
    attemptId: "ambiguous-original",
    mode: "replace",
  });
  await data.saveAssistantGeneration(conversation.id, original.responseId, {
    attemptId: original.attemptId,
    generation: original.generation,
    revision: 1,
    blocks: [{ type: "text", text: "Original answer" }],
    status: "final",
  });
  const savedFetch = globalThis.fetch;
  let posts = 0;
  let reconnects = 0;
  let acceptedAttempt = "";
  globalThis.fetch = (async (url, init) => {
    const path = String(url);
    if (path === "/api/chat") {
      posts++;
      const body = JSON.parse(String(init?.body));
      const generation = await data.beginAssistantGeneration(conversation.id, {
        responseId: body.responseId,
        attemptId: body.attemptId,
        expectedAttemptId: body.expectedAttemptId,
        mode: body.mode,
      });
      acceptedAttempt = generation.attemptId;
      await data.saveAssistantGeneration(
        conversation.id,
        generation.responseId,
        {
          attemptId: generation.attemptId,
          generation: generation.generation,
          revision: 1,
          blocks: [{ type: "text", text: "Recovered replacement" }],
          status: "final",
        },
      );
      const metadata = {
        responseId: generation.responseId,
        attemptId: generation.attemptId,
        generation: generation.generation,
      };
      const entry = beginChatStream({
        conversationId: conversation.id,
        responseId: generation.responseId,
        attemptId: generation.attemptId,
        prefix: [
          `data: ${JSON.stringify({ type: "start", messageId: generation.responseId, messageMetadata: metadata })}\n\n`,
          `data: ${JSON.stringify({ type: "text-start", id: "ambiguous-text" })}\n\n`,
          `data: ${JSON.stringify({ type: "text-delta", id: "ambiguous-text", delta: "Recovered replacement" })}\n\n`,
          `data: ${JSON.stringify({ type: "text-end", id: "ambiguous-text" })}\n\n`,
          `data: ${JSON.stringify({ type: "finish", finishReason: "stop" })}\n\n`,
        ],
      });
      entry.done = true;
      setChatStreamPersistence(
        entry,
        {
          response: {
            id: generation.responseId,
            role: "assistant",
            metadata,
            parts: [{ type: "text", text: "Recovered replacement" }],
          },
          outcome: { status: "completed" },
          finishReason: "stop",
          generation: generation.generation,
        },
        { saved: true },
      );
      throw new TypeError("Injected network failure after server acceptance");
    }
    if (path.endsWith("/stream") && (!init?.method || init.method === "GET")) {
      reconnects++;
      const stream = resumeChatStream(conversation.id);
      return stream
        ? new Response(stream.pipeThrough(new TextEncoderStream()), {
            headers: {
              "content-type": "text/event-stream",
              "x-vercel-ai-ui-message-stream": "v1",
            },
          })
        : new Response(null, { status: 204 });
    }
    if (path.endsWith("/stream") && init?.method === "DELETE") {
      const body = JSON.parse(String(init.body));
      acknowledgeChatStream(conversation.id, body.responseId, body.attemptId);
      return new Response(null, { status: 204 });
    }
    return Response.json({ stopped: false });
  }) as typeof fetch;
  const session = new ChatSession(
    conversation,
    data,
    await data.listMessages(conversation.id),
  );
  try {
    await session.retry();
    await session.retry();
    await session.persist();
    assert.equal(posts, 1);
    assert.equal(reconnects, 1);
    assert.equal(
      session.chat.messages.at(-1)?.metadata?.attemptId,
      acceptedAttempt,
    );
    assert.deepEqual(
      (await data.listMessages(conversation.id))
        .filter((message) => message.role === "assistant")
        .map((message) => ({ id: message.id, blocks: message.blocks })),
      [
        {
          id: original.responseId,
          blocks: [{ type: "text", text: "Recovered replacement" }],
        },
      ],
    );
  } finally {
    globalThis.fetch = savedFetch;
    const remaining = getChatStream(conversation.id);
    if (remaining) {
      remaining.persistence = "saved";
      acknowledgeChatStream(
        conversation.id,
        remaining.responseId,
        remaining.attemptId,
      );
    }
  }
});

test("an ambiguous initial send reconnects its one logical response", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({
    title: "Ambiguous initial send",
  });
  const savedFetch = globalThis.fetch;
  const requests: Array<{ responseId: string; attemptId: string }> = [];
  globalThis.fetch = (async (url, init) => {
    const path = String(url);
    if (path === "/api/chat") {
      const body = JSON.parse(String(init?.body));
      requests.push(body);
      const generation = await data.beginAssistantGeneration(conversation.id, {
        responseId: body.responseId,
        attemptId: body.attemptId,
        expectedAttemptId: body.expectedAttemptId,
        mode: body.mode,
      });
      await data.saveAssistantGeneration(
        conversation.id,
        generation.responseId,
        {
          attemptId: generation.attemptId,
          generation: generation.generation,
          revision: 1,
          blocks: [{ type: "text", text: "Recovered first answer" }],
          status: "final",
        },
      );
      const metadata = {
        responseId: generation.responseId,
        attemptId: generation.attemptId,
        generation: generation.generation,
      };
      const entry = beginChatStream({
        conversationId: conversation.id,
        responseId: generation.responseId,
        attemptId: generation.attemptId,
        prefix: [
          `data: ${JSON.stringify({ type: "start", messageId: generation.responseId, messageMetadata: metadata })}\n\n`,
          `data: ${JSON.stringify({ type: "text-start", id: "initial-text" })}\n\n`,
          `data: ${JSON.stringify({ type: "text-delta", id: "initial-text", delta: "Recovered first answer" })}\n\n`,
          `data: ${JSON.stringify({ type: "text-end", id: "initial-text" })}\n\n`,
          `data: ${JSON.stringify({ type: "finish", finishReason: "stop" })}\n\n`,
        ],
      });
      entry.done = true;
      setChatStreamPersistence(
        entry,
        {
          response: {
            id: generation.responseId,
            role: "assistant",
            metadata,
            parts: [{ type: "text", text: "Recovered first answer" }],
          },
          outcome: { status: "completed" },
          finishReason: "stop",
          generation: generation.generation,
        },
        { saved: true },
      );
      throw new TypeError("Injected lost initial-send response");
    }
    if (path.endsWith("/stream") && (!init?.method || init.method === "GET")) {
      const stream = resumeChatStream(conversation.id);
      return stream
        ? new Response(stream.pipeThrough(new TextEncoderStream()), {
            headers: {
              "content-type": "text/event-stream",
              "x-vercel-ai-ui-message-stream": "v1",
            },
          })
        : new Response(null, { status: 204 });
    }
    if (path.endsWith("/stream") && init?.method === "DELETE") {
      const body = JSON.parse(String(init.body));
      acknowledgeChatStream(conversation.id, body.responseId, body.attemptId);
      return new Response(null, { status: 204 });
    }
    return Response.json({ stopped: false });
  }) as typeof fetch;
  const session = new ChatSession(conversation, data, []);
  try {
    await session.send("Answer this once");
    await waitUntil(() => session.chat.status === "error");
    await session.retry();
    await session.persist();
    assert.equal(requests.length, 1);
    const stored = await data.listMessages(conversation.id);
    assert.equal(stored.filter((message) => message.role === "user").length, 1);
    assert.deepEqual(
      stored
        .filter((message) => message.role === "assistant")
        .map((message) => ({ id: message.id, blocks: message.blocks })),
      [
        {
          id: requests[0].responseId,
          blocks: [{ type: "text", text: "Recovered first answer" }],
        },
      ],
    );
  } finally {
    globalThis.fetch = savedFetch;
    const remaining = getChatStream(conversation.id);
    if (remaining) {
      remaining.persistence = "saved";
      acknowledgeChatStream(
        conversation.id,
        remaining.responseId,
        remaining.attemptId,
      );
    }
  }
});

test("detached persistence retries transient errors and retains permanent failures", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({ title: "Recovery" });
  const generation = await data.beginAssistantGeneration(conversation.id, {
    responseId: "answer",
    attemptId: "persistence-attempt",
    mode: "replace",
  });
  const snapshot = {
    response: {
      id: "answer",
      role: "assistant" as const,
      parts: [{ type: "text" as const, text: "Retained result" }],
    },
    outcome: { status: "completed" as const },
    finishReason: "stop",
    attemptId: generation.attemptId,
    generation: generation.generation,
  };
  let failures = 2;
  const transient = {
    ...data,
    saveAssistantGeneration: async (
      ...args: Parameters<typeof data.saveAssistantGeneration>
    ) => {
      if (failures-- > 0) throw new DataError("unavailable", "offline");
      return data.saveAssistantGeneration(...args);
    },
  };
  assert.deepEqual(
    await persistGeneratedResponse(transient, conversation.id, snapshot),
    { saved: true },
  );
  assert.equal(failures, -1);

  const next = await data.beginAssistantGeneration(conversation.id, {
    responseId: "answer",
    attemptId: "permanent-attempt",
    expectedAttemptId: generation.attemptId,
    mode: "replace",
  });
  const retrySnapshot = {
    ...snapshot,
    response: {
      ...snapshot.response,
      parts: [{ type: "text" as const, text: "Recovered later" }],
    },
    attemptId: next.attemptId,
    generation: next.generation,
  };
  const denied = {
    ...data,
    saveAssistantGeneration: async () => {
      throw new DataError("forbidden", "revoked");
    },
  };
  assert.equal(
    (await persistGeneratedResponse(denied, conversation.id, retrySnapshot))
      .saved,
    false,
  );
  assert.deepEqual(
    await persistGeneratedResponse(data, conversation.id, retrySnapshot),
    { saved: true },
  );
  assert.deepEqual((await data.listMessages(conversation.id))[0].blocks, [
    { type: "text", text: "Recovered later" },
  ]);
});

test("a returning session keeps a failed server result visible until retrySave succeeds", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({
    title: "Failed result",
  });
  const user = await data.appendMessage(conversation.id, {
    id: "recovery-prompt",
    role: "user",
    blocks: [{ type: "text", text: "Recover this" }],
  });
  const generation = await data.beginAssistantGeneration(conversation.id, {
    responseId: "recovery-answer",
    attemptId: "recovery-attempt",
    mode: "replace",
  });
  const metadata = {
    responseId: generation.responseId,
    attemptId: generation.attemptId,
    generation: generation.generation,
  };
  const entry = beginChatStream({
    conversationId: conversation.id,
    responseId: generation.responseId,
    attemptId: generation.attemptId,
    prefix: [
      `data: ${JSON.stringify({ type: "start", messageId: generation.responseId, messageMetadata: metadata })}\n\n`,
      `data: ${JSON.stringify({ type: "text-start", id: "recovered" })}\n\n`,
      `data: ${JSON.stringify({ type: "text-delta", id: "recovered", delta: "Unsaved result" })}\n\n`,
      `data: ${JSON.stringify({ type: "text-end", id: "recovered" })}\n\n`,
      `data: ${JSON.stringify({ type: "finish", finishReason: "stop" })}\n\n`,
    ],
  });
  entry.done = true;
  setChatStreamPersistence(
    entry,
    {
      response: {
        id: generation.responseId,
        role: "assistant",
        metadata,
        parts: [{ type: "text", text: "Unsaved result" }],
      },
      outcome: { status: "completed" },
      finishReason: "stop",
      generation: generation.generation,
    },
    { saved: false, error: "Injected save failure" },
  );
  const savedFetch = globalThis.fetch;
  globalThis.fetch = (async (url, init) => {
    const path = String(url);
    if (path.endsWith("/stream") && (!init?.method || init.method === "GET")) {
      const stream = resumeChatStream(conversation.id);
      return stream
        ? new Response(stream.pipeThrough(new TextEncoderStream()), {
            headers: {
              "content-type": "text/event-stream",
              "x-vercel-ai-ui-message-stream": "v1",
            },
          })
        : new Response(null, { status: 204 });
    }
    const body = JSON.parse(String(init?.body)) as {
      responseId: string;
      attemptId: string;
    };
    if (init?.method === "DELETE") {
      const outcome = acknowledgeChatStream(
        conversation.id,
        body.responseId,
        body.attemptId,
      );
      return outcome === "acknowledged"
        ? new Response(null, { status: 204 })
        : Response.json(
            {
              outcome,
              message: getChatStream(conversation.id)?.persistenceError,
            },
            { status: 409 },
          );
    }
    if (init?.method === "PATCH") {
      const current = getChatStream(conversation.id);
      assert.ok(current?.persistenceSnapshot);
      const result = await persistGeneratedResponse(data, conversation.id, {
        ...current.persistenceSnapshot,
        attemptId: current.attemptId,
      });
      setChatStreamPersistence(current, current.persistenceSnapshot, result);
      return Response.json(result, { status: result.saved ? 200 : 409 });
    }
    throw new Error(`Unexpected recovery request: ${path}`);
  }) as typeof fetch;
  try {
    const session = new ChatSession(conversation, data, [user]);
    await session.resume();
    await waitUntil(() => Boolean(session.saveError));
    assert.match(session.saveError ?? "", /Injected save failure/);
    await session.persist();
    assert.match(session.saveError ?? "", /Injected save failure/);
    await session.retrySave();
    assert.equal(session.saveError, null);
    assert.equal(getChatStream(conversation.id), undefined);
    assert.deepEqual(
      (await data.listMessages(conversation.id)).at(-1)?.blocks,
      [{ type: "text", text: "Unsaved result" }],
    );
  } finally {
    globalThis.fetch = savedFetch;
    const remaining = getChatStream(conversation.id);
    if (remaining) {
      remaining.persistence = "saved";
      acknowledgeChatStream(
        conversation.id,
        remaining.responseId,
        remaining.attemptId,
      );
    }
  }
});

test("overlapping approvals share one durable mutation and retain pending state", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({ title: "Approval" });
  let releaseMutation!: () => void;
  const mutationReleased = new Promise<void>((resolve) => {
    releaseMutation = resolve;
  });
  let mutationCalls = 0;
  const adapter = {
    ...data,
    applyChatMutation: async (
      ...args: Parameters<typeof data.applyChatMutation>
    ) => {
      mutationCalls++;
      await mutationReleased;
      return data.applyChatMutation(...args);
    },
  };
  let turn = 0;
  const transport: ChatTransport<ChatMessage> = {
    reconnectToStream: async () => null,
    sendMessages: async () => {
      turn++;
      if (turn === 1)
        return uiStream([
          { type: "start", messageId: "approval-answer" },
          { type: "start-step" },
          {
            type: "tool-input-available",
            toolName: "createRecord",
            toolCallId: "create-once",
            input: { type: "tasks", input: { title: "Create once" } },
          },
          { type: "finish-step" },
          { type: "finish", finishReason: "tool-calls" },
        ]);
      return uiStream([
        { type: "start", messageId: "approval-answer" },
        { type: "start-step" },
        { type: "text-start", id: "done" },
        { type: "text-delta", id: "done", delta: "Created once." },
        { type: "text-end", id: "done" },
        { type: "finish-step" },
        { type: "finish", finishReason: "stop" },
      ]);
    },
  };
  const session = new ChatSession(conversation, adapter, [], transport);
  await session.send("Create the task");
  await waitUntil(() =>
    Boolean(
      session.chat.messages
        .at(-1)
        ?.parts.some((part) => part.type === "tool-createRecord"),
    ),
  );
  const call = {
    toolName: "createRecord" as const,
    toolCallId: "create-once",
    input: { type: "tasks", input: { title: "Create once" } },
  };
  const first = session.approveMutation(call);
  const duplicate = session.approveMutation(call);
  assert.equal(first, duplicate);
  assert.equal(session.getMutationState(call.toolCallId), "pending");
  assert.equal(mutationCalls, 1);
  releaseMutation();
  await Promise.all([first, duplicate]);
  await waitUntil(() => session.chat.status === "ready");
  assert.equal(session.getMutationState(call.toolCallId), "completed");
  assert.equal((await data.list("tasks")).length, 1);
});

test("Stop before continuation metadata aborts the newly dispatched registry attempt", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({ title: "Early stop" });
  await data.appendMessage(conversation.id, {
    role: "user",
    blocks: [{ type: "text", text: "Create an account" }],
  });
  const old = await data.beginAssistantGeneration(conversation.id, {
    responseId: "early-stop-answer",
    attemptId: "early-stop-old",
    mode: "replace",
  });
  await data.saveAssistantGeneration(conversation.id, old.responseId, {
    attemptId: old.attemptId,
    generation: old.generation,
    revision: 1,
    status: "final",
    blocks: [
      {
        type: "mutation_proposal",
        toolName: "createRecord",
        toolCallId: "early-stop-proposal",
        input: { type: "accounts", input: { name: "Early stop account" } },
        state: "pending",
      },
    ],
  });
  const savedFetch = globalThis.fetch;
  let started!: () => void;
  const didStart = new Promise<void>((resolve) => {
    started = resolve;
  });
  let active: ReturnType<typeof beginChatStream> | undefined;
  let stopBody: { responseId: string; attemptId: string } | undefined;
  let responseController:
    | ReadableStreamDefaultController<Uint8Array>
    | undefined;
  globalThis.fetch = (async (url, init) => {
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    if (String(url) === "/api/chat") {
      await data.beginAssistantGeneration(conversation.id, {
        responseId: body.responseId,
        attemptId: body.attemptId,
        expectedAttemptId: body.expectedAttemptId,
        mode: body.mode,
      });
      active = beginChatStream({
        conversationId: conversation.id,
        responseId: body.responseId,
        attemptId: body.attemptId,
      });
      started();
      return new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            responseController = controller;
          },
        }),
        {
          headers: {
            "content-type": "text/event-stream",
            "x-vercel-ai-ui-message-stream": "v1",
          },
        },
      );
    }
    if (String(url).endsWith("/stop")) {
      stopBody = body;
      const stopped = stopChatStream(
        conversation.id,
        body.responseId,
        body.attemptId,
      );
      responseController?.close();
      return Response.json({ stopped }, { status: stopped ? 200 : 409 });
    }
    return new Response(null, { status: 204 });
  }) as typeof fetch;
  const session = new ChatSession(
    conversation,
    data,
    await data.listMessages(conversation.id),
  );
  try {
    const approval = session.approveMutation({
      toolName: "createRecord",
      toolCallId: "early-stop-proposal",
      input: { type: "accounts", input: { name: "Early stop account" } },
    });
    await within(didStart, "early continuation dispatch");
    await session.stop();
    await approval;
    assert.equal(stopBody?.responseId, active?.responseId);
    assert.equal(stopBody?.attemptId, active?.attemptId);
    assert.equal(active?.signal.aborted, true);
  } finally {
    globalThis.fetch = savedFetch;
    if (active) {
      active.persistence = "saved";
      acknowledgeChatStream(
        conversation.id,
        active.responseId,
        active.attemptId,
      );
    }
  }
});

test("a committed mutation with a lost acknowledgement is recovered after reload", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({
    title: "Lost approval",
  });
  let turn = 0;
  const transport: ChatTransport<ChatMessage> = {
    reconnectToStream: async () => null,
    sendMessages: async () => {
      if (++turn === 1)
        return uiStream([
          { type: "start", messageId: "lost-approval-answer" },
          { type: "start-step" },
          {
            type: "tool-input-available",
            toolName: "createRecord",
            toolCallId: "lost-approval",
            input: { type: "tasks", input: { title: "Only once" } },
          },
          { type: "finish", finishReason: "tool-calls" },
        ]);
      return uiStream([
        { type: "start", messageId: "lost-approval-answer" },
        { type: "start-step" },
        { type: "text-start", id: "confirmed" },
        { type: "text-delta", id: "confirmed", delta: "Confirmed." },
        { type: "text-end", id: "confirmed" },
        { type: "finish", finishReason: "stop" },
      ]);
    },
  };
  let loseResponse = true;
  const uncertain = {
    ...data,
    applyChatMutation: async (
      ...args: Parameters<typeof data.applyChatMutation>
    ) => {
      const result = await data.applyChatMutation(...args);
      if (loseResponse) {
        loseResponse = false;
        throw new DataError("unavailable", "response lost");
      }
      return result;
    },
  };
  const call = {
    toolName: "createRecord" as const,
    toolCallId: "lost-approval",
    input: { type: "tasks", input: { title: "Only once" } },
  };
  const original = new ChatSession(conversation, uncertain, [], transport);
  await original.send("Create it");
  await waitUntil(() =>
    Boolean(
      original.chat.messages
        .at(-1)
        ?.parts.some((part) => part.type === "tool-createRecord"),
    ),
  );
  await within(original.approveMutation(call), "lost acknowledgement");
  assert.equal(original.getMutationState(call.toolCallId), "idle");
  assert.equal((await data.list("tasks")).length, 1);
  await original.persist();

  const reloaded = new ChatSession(
    conversation,
    data,
    await data.listMessages(conversation.id),
    transport,
  );
  assert.equal(
    reloaded.chat.messages
      .at(-1)
      ?.parts.find((part) => part.type === "tool-createRecord")?.state,
    "input-available",
  );
  await within(reloaded.approveMutation(call), "reloaded acknowledgement");
  await waitUntil(() => reloaded.chat.status === "ready");
  assert.equal((await data.list("tasks")).length, 1);
});

test("denied and failed proposals never mutate CRM data", async () => {
  const data = createMemoryAdapter();
  async function proposal(title: string, toolCallId: string, adapter = data) {
    const conversation = await data.createConversation({ title });
    let turn = 0;
    const transport: ChatTransport<ChatMessage> = {
      reconnectToStream: async () => null,
      sendMessages: async () => {
        if (++turn === 1)
          return uiStream([
            { type: "start", messageId: `${toolCallId}-answer` },
            { type: "start-step" },
            {
              type: "tool-input-available",
              toolName: "createRecord",
              toolCallId,
              input: { type: "tasks", input: { title } },
            },
            { type: "finish", finishReason: "tool-calls" },
          ]);
        return uiStream([
          { type: "start", messageId: `${toolCallId}-answer` },
          { type: "start-step" },
          { type: "text-start", id: `${toolCallId}-text` },
          { type: "text-delta", id: `${toolCallId}-text`, delta: "Done." },
          { type: "text-end", id: `${toolCallId}-text` },
          { type: "finish", finishReason: "stop" },
        ]);
      },
    };
    const session = new ChatSession(conversation, adapter, [], transport);
    await session.send(title);
    await waitUntil(() =>
      Boolean(
        session.chat.messages
          .at(-1)
          ?.parts.some((part) => part.type === "tool-createRecord"),
      ),
    );
    return session;
  }
  const denied = await proposal("Deny this", "deny-call");
  await within(
    denied.denyMutation({
      toolName: "createRecord",
      toolCallId: "deny-call",
      input: { type: "tasks", input: { title: "Deny this" } },
    }),
    "deny decision",
  );
  await waitUntil(() => denied.chat.status === "ready");
  assert.equal((await data.list("tasks")).length, 0);

  const failed = await proposal("Fail this", "failed-call", {
    ...data,
    applyChatMutation: async () => {
      throw new DataError("validation", "Rejected change");
    },
  });
  await within(
    failed.approveMutation({
      toolName: "createRecord",
      toolCallId: "failed-call",
      input: { type: "tasks", input: { title: "Fail this" } },
    }),
    "failed decision",
  );
  await waitUntil(() => failed.chat.status === "ready");
  assert.equal(
    failed.chat.messages
      .at(-1)
      ?.parts.find((part) => part.type === "tool-createRecord")?.state,
    "output-error",
  );
  assert.equal((await data.list("tasks")).length, 0);
});

test("a failed prompt save retries the same message before one generation", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({ title: "Prompt retry" });
  let fail = true;
  let generations = 0;
  let attemptedId = "";
  let sentId = "";
  const adapter = {
    ...data,
    appendMessage: async (...args: Parameters<typeof data.appendMessage>) => {
      attemptedId ||= args[1].id ?? "";
      if (fail) throw new DataError("unavailable", "offline");
      return data.appendMessage(...args);
    },
  };
  const transport: ChatTransport<ChatMessage> = {
    reconnectToStream: async () => null,
    sendMessages: async ({ messages }) => {
      generations++;
      sentId = messages.at(-1)?.id ?? "";
      return uiStream([
        { type: "start", messageId: "reply" },
        { type: "text-start", id: "reply-text" },
        { type: "text-delta", id: "reply-text", delta: "Saved." },
        { type: "text-end", id: "reply-text" },
        { type: "finish", finishReason: "stop" },
      ]);
    },
  };
  const session = new ChatSession(conversation, adapter, [], transport);
  await assert.rejects(session.send("Keep this exact prompt"));
  assert.equal(generations, 0);
  fail = false;
  await session.retrySave();
  await session.send("Keep this exact prompt");
  await waitUntil(() => session.chat.status === "ready");
  const stored = await data.listMessages(conversation.id);
  assert.equal(stored.filter((message) => message.role === "user").length, 1);
  assert.equal(stored[0].id, attemptedId);
  assert.equal(sentId, attemptedId);
  assert.equal(generations, 1);
});

test("editing after a pre-commit prompt failure sends only the edited message", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({
    title: "Edited prompt",
  });
  let fail = true;
  let originalId = "";
  let sentMessages: ChatMessage[] = [];
  let generations = 0;
  const session = new ChatSession(
    conversation,
    {
      ...data,
      appendMessage: async (...args: Parameters<typeof data.appendMessage>) => {
        originalId ||= args[1].id ?? "";
        if (fail) throw new DataError("unavailable", "offline");
        return data.appendMessage(...args);
      },
    },
    [],
    {
      reconnectToStream: async () => null,
      sendMessages: async ({ messages }) => {
        generations++;
        sentMessages = structuredClone(messages);
        return uiStream([]);
      },
    },
  );
  await assert.rejects(session.send("Original failed prompt"));
  fail = false;
  await session.send("Edited prompt");
  await waitUntil(() => session.chat.status === "ready");
  const users = (await data.listMessages(conversation.id)).filter(
    (message) => message.role === "user",
  );
  assert.equal(users.length, 1);
  assert.notEqual(users[0].id, originalId);
  assert.deepEqual(users[0].blocks, [{ type: "text", text: "Edited prompt" }]);
  assert.deepEqual(sentMessages.at(-1)?.parts, [
    { type: "text", text: "Edited prompt" },
  ]);
  assert.equal(generations, 1);
});

test("lost prompt acknowledgements retain exact IDs for retry and edited history", async () => {
  async function scenario(edited: boolean) {
    const data = createMemoryAdapter();
    const conversation = await data.createConversation({
      title: edited ? "Edited lost ack" : "Same lost ack",
    });
    let lose = true;
    let committedId = "";
    let generations = 0;
    let sentMessages: ChatMessage[] = [];
    const adapter = {
      ...data,
      appendMessage: async (...args: Parameters<typeof data.appendMessage>) => {
        const result = await data.appendMessage(...args);
        committedId ||= result.id;
        if (lose) {
          lose = false;
          throw new DataError("unavailable", "acknowledgement lost");
        }
        return result;
      },
    };
    const session = new ChatSession(conversation, adapter, [], {
      reconnectToStream: async () => null,
      sendMessages: async ({ messages }) => {
        generations++;
        sentMessages = structuredClone(messages);
        return uiStream([]);
      },
    });
    await assert.rejects(session.send("Original prompt"));
    assert.equal(generations, 0);
    if (edited) await session.send("Edited prompt");
    else {
      await session.retrySave();
      await session.send("Original prompt");
    }
    await waitUntil(() => session.chat.status === "ready");
    return {
      committedId,
      generations,
      sentMessages,
      users: (await data.listMessages(conversation.id)).filter(
        (message) => message.role === "user",
      ),
    };
  }

  const retried = await scenario(false);
  assert.equal(retried.users.length, 1);
  assert.equal(retried.users[0].id, retried.committedId);
  assert.equal(retried.sentMessages.at(-1)?.id, retried.committedId);
  assert.equal(retried.generations, 1);

  const edited = await scenario(true);
  assert.equal(edited.users.length, 2);
  assert.equal(edited.users[0].id, edited.committedId);
  assert.notEqual(edited.users[1].id, edited.committedId);
  assert.deepEqual(
    edited.users.map((message) => message.blocks),
    [
      [{ type: "text", text: "Original prompt" }],
      [{ type: "text", text: "Edited prompt" }],
    ],
  );
  assert.deepEqual(
    edited.sentMessages
      .filter((message) => message.role === "user")
      .map((message) => message.id),
    edited.users.map((message) => message.id),
  );
  assert.equal(edited.generations, 1);
});

test("maximum-length names produce bounded truthful mutation results", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({ title: "Long names" });
  const name = "x".repeat(1000);
  const created = await executeMutation(data, conversation.id, {
    toolName: "createRecord",
    toolCallId: "long-create",
    input: { type: "accounts", input: { name } },
  });
  assert.equal(created.status, "success");
  assert.ok(created.text.length <= 1000);
  const updated = await executeMutation(data, conversation.id, {
    toolName: "updateRecord",
    toolCallId: "long-update",
    input: { type: "accounts", id: created.records[0].id, input: { name } },
  });
  assert.equal(updated.status, "success");
  assert.ok(updated.text.length <= 1000);
  assert.equal((await data.list("accounts")).length, 1);
});

test("Markdown images render as non-loading links while useful Markdown remains", () => {
  const html = renderToStaticMarkup(
    React.createElement(ChatMarkdown, {
      text: "![private](https://tracker.example/pixel.png)\n\n[link](https://example.test)\n\n`code`\n\n| A |\n| - |\n| B |",
    }),
  );
  assert.ok(!html.includes("<img"));
  assert.ok(!html.includes("<source"));
  assert.ok(!html.includes('rel="preload"'));
  assert.ok(html.includes("[Image: private]"));
  assert.ok(html.includes("<code>code</code>"));
  assert.ok(html.includes("<table>"));
});

test("mutation proposal storage rejects malformed states and roundtrips valid states", async () => {
  const data = createMemoryAdapter();
  const conversation = await data.createConversation({ title: "Proposals" });
  for (const [id, block] of [
    [
      "bad-approved",
      {
        type: "mutation_proposal",
        toolName: "createRecord",
        toolCallId: "bad-approved",
        input: { type: "accounts", input: { name: "Missing output" } },
        state: "approved",
      },
    ],
    [
      "bad-denied",
      {
        type: "mutation_proposal",
        toolName: "createRecord",
        toolCallId: "bad-denied",
        input: { type: "accounts", input: { name: "Missing denial" } },
        state: "denied",
      },
    ],
    [
      "bad-input",
      {
        type: "mutation_proposal",
        toolName: "createRecord",
        toolCallId: "bad-input",
        input: {},
        state: "pending",
      },
    ],
  ] as const)
    await assert.rejects(
      data.appendMessage(conversation.id, {
        id,
        role: "assistant",
        blocks: [block],
      }),
      (error: unknown) =>
        error instanceof DataError && error.code === "validation",
    );

  const input = { type: "accounts", input: { name: "Valid account" } };
  const success = { status: "success" as const, text: "Created.", records: [] };
  const denied = {
    status: "permission_denied" as const,
    text: "Denied.",
    records: [],
  };
  for (const [id, block] of [
    [
      "valid-pending",
      {
        type: "mutation_proposal" as const,
        toolName: "createRecord" as const,
        toolCallId: "valid-pending",
        input,
        state: "pending" as const,
      },
    ],
    [
      "valid-approved",
      {
        type: "mutation_proposal" as const,
        toolName: "createRecord" as const,
        toolCallId: "valid-approved",
        input,
        state: "approved" as const,
        output: success,
      },
    ],
    [
      "valid-denied",
      {
        type: "mutation_proposal" as const,
        toolName: "createRecord" as const,
        toolCallId: "valid-denied",
        input,
        state: "denied" as const,
        output: denied,
      },
    ],
    [
      "valid-failed",
      {
        type: "mutation_proposal" as const,
        toolName: "createRecord" as const,
        toolCallId: "valid-failed",
        input,
        state: "failed" as const,
        errorText: "Rejected.",
      },
    ],
  ] as const)
    await data.appendMessage(conversation.id, {
      id,
      role: "assistant",
      blocks: [block],
    });
  const session = new ChatSession(
    conversation,
    data,
    await data.listMessages(conversation.id),
    {
      reconnectToStream: async () => null,
      sendMessages: async () => uiStream([]),
    },
  );
  assert.deepEqual(
    session.chat.messages.map((message) => {
      const part = message.parts[0];
      return part && "state" in part ? part.state : undefined;
    }),
    ["input-available", "output-available", "output-available", "output-error"],
  );
});
