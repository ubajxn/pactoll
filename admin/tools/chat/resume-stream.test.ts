import assert from "node:assert/strict";
import { test } from "node:test";
import {
  acknowledgeChatStream,
  beginChatStream,
  captureChatStream,
  resumeChatStream,
  stopChatStream,
} from "../../src/lib/chat/stream-store";

async function readAll(stream: ReadableStream<string>) {
  const reader = stream.getReader();
  let value = "";
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) return value;
    value += chunk.value;
  }
}

test("a detached reader can reconnect to the full server-owned stream", async () => {
  const conversationId = "resume-conversation";
  const responseId = "resume-response";
  const attempt = beginChatStream({
    conversationId,
    responseId,
    attemptId: "resume-attempt",
  });
  let writer!: ReadableStreamDefaultController<string>;
  const source = new ReadableStream<string>({
    start(controller) {
      writer = controller;
    },
  });
  const capturing = captureChatStream(attempt, source);

  writer.enqueue("data: first\n\n");
  const attached = resumeChatStream(conversationId);
  assert.ok(attached);
  const reader = attached.getReader();
  assert.equal((await reader.read()).value, "data: first\n\n");
  await reader.cancel();

  writer.enqueue("data: second\n\n");
  writer.close();
  await capturing;

  const resumed = resumeChatStream(conversationId);
  assert.ok(resumed);
  assert.equal(await readAll(resumed), "data: first\n\ndata: second\n\n");
  attempt.persistence = "saved";
  assert.equal(
    acknowledgeChatStream(conversationId, responseId, "resume-attempt"),
    "acknowledged",
  );
  assert.equal(resumeChatStream(conversationId), null);
});

test("explicit stop aborts the active resumed generation", () => {
  const conversationId = "stopped-conversation";
  const responseId = "stopped-response";
  const generation = beginChatStream({
    conversationId,
    responseId,
    attemptId: "stop-attempt",
  });
  assert.equal(generation.signal.aborted, false);
  assert.ok(resumeChatStream(conversationId));
  assert.equal(
    stopChatStream(conversationId, "stale-response", "stop-attempt"),
    false,
  );
  assert.equal(generation.signal.aborted, false);
  assert.equal(
    stopChatStream(conversationId, responseId, "stop-attempt"),
    true,
  );
  assert.equal(generation.signal.aborted, true);
  assert.ok(resumeChatStream(conversationId));
});

test("a delayed acknowledgement cannot clear a newer attempt", () => {
  const conversationId = "delayed-ack-conversation";
  const responseId = "stable-response";
  const old = beginChatStream({
    conversationId,
    responseId,
    attemptId: "delayed-old",
  });
  old.persistence = "saved";
  const current = beginChatStream({
    conversationId,
    responseId,
    attemptId: "delayed-current",
  });
  assert.equal(
    acknowledgeChatStream(conversationId, responseId, old.attemptId),
    "replaced",
  );
  assert.equal(current.signal.aborted, false);
  assert.ok(resumeChatStream(conversationId));
  current.persistence = "saved";
  assert.equal(
    acknowledgeChatStream(conversationId, responseId, current.attemptId),
    "acknowledged",
  );
});
