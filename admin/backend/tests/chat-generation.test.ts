import { afterEach, beforeEach, expect, test } from "bun:test";
import {
  DELETE as acknowledgeResponse,
  GET as replayResponse,
  PATCH as retryResponse,
} from "../../src/app/api/chat/[id]/stream/route";
import { POST as generateResponse } from "../../src/app/api/chat/route";
import { ChatSession } from "../../src/lib/chat/session";
import {
  acknowledgeChatStream,
  beginChatStream,
  failChatStream,
  getChatStream,
  setChatStreamPersistence,
} from "../../src/lib/chat/stream-store";
import { type TestApp, testApp } from "./helpers";

let app: TestApp;
beforeEach(async () => {
  app = await testApp();
});
afterEach(async () => {
  await app.close();
});

test("assistant generations atomically reject stale writes and allow regeneration", async () => {
  const owner = await app.login("generation-owner@example.test");
  await app.workspace(owner);
  const conversation = await owner.api.createConversation({
    title: "Ordering",
  });
  const first = await owner.api.beginAssistantGeneration(conversation.id, {
    responseId: "stable-answer",
    attemptId: "attempt-one",
    mode: "replace",
  });
  await expect(
    owner.api.appendMessage(conversation.id, {
      id: first.responseId,
      role: "assistant",
      blocks: [{ type: "text", text: "Old append" }],
      status: "partial",
    }),
  ).rejects.toMatchObject({ code: "conflict" });
  await owner.api.saveAssistantGeneration(conversation.id, first.responseId, {
    attemptId: first.attemptId,
    generation: first.generation,
    revision: 1,
    blocks: [{ type: "text", text: "Complete answer" }],
    status: "final",
  });
  await expect(
    owner.api.updateMessage(conversation.id, first.responseId, {
      blocks: [{ type: "text", text: "Old browser checkpoint" }],
      status: "partial",
    }),
  ).rejects.toMatchObject({ code: "conflict" });
  await expect(
    owner.api.saveAssistantGeneration(conversation.id, first.responseId, {
      attemptId: first.attemptId,
      generation: first.generation,
      revision: 2,
      blocks: [{ type: "text", text: "Late partial" }],
      status: "partial",
    }),
  ).rejects.toMatchObject({ code: "conflict" });

  const replacement = await owner.api.beginAssistantGeneration(
    conversation.id,
    {
      responseId: first.responseId,
      attemptId: "attempt-two",
      expectedAttemptId: first.attemptId,
      mode: "replace",
    },
  );
  await owner.api.saveAssistantGeneration(
    conversation.id,
    replacement.responseId,
    {
      attemptId: replacement.attemptId,
      generation: replacement.generation,
      revision: 1,
      blocks: [{ type: "text", text: "Regenerated answer" }],
      status: "final",
    },
  );
  await expect(
    owner.api.updateMessage(conversation.id, replacement.responseId, {
      blocks: [{ type: "text", text: "Checkpoint from old regeneration" }],
      status: "partial",
    }),
  ).rejects.toMatchObject({ code: "conflict" });
  await expect(
    owner.api.saveAssistantGeneration(conversation.id, first.responseId, {
      attemptId: first.attemptId,
      generation: first.generation,
      revision: 3,
      blocks: [{ type: "text", text: "Obsolete completion" }],
      status: "final",
    }),
  ).rejects.toMatchObject({ code: "conflict" });
  expect((await owner.api.listMessages(conversation.id))[0].blocks).toEqual([
    { type: "text", text: "Regenerated answer" },
  ]);
});

test("approved chat mutations are exactly once and payload-bound", async () => {
  const owner = await app.login("mutation-owner@example.test");
  await app.workspace(owner);
  const conversation = await owner.api.createConversation({
    title: "Approval",
  });
  const request = {
    idempotencyKey: "tool-call-1",
    mutation: {
      operation: "create" as const,
      type: "tasks" as const,
      input: { title: "Follow up once" },
    },
  };
  const [first, duplicate] = await Promise.all([
    owner.api.applyChatMutation(conversation.id, request),
    owner.api.applyChatMutation(conversation.id, request),
  ]);
  expect(duplicate).toEqual(first);
  expect(await owner.api.list("tasks")).toHaveLength(1);
  await expect(
    owner.api.applyChatMutation(conversation.id, {
      ...request,
      mutation: {
        operation: "create",
        type: "tasks",
        input: { title: "Different payload" },
      },
    }),
  ).rejects.toMatchObject({ code: "conflict" });
  expect(await owner.api.list("tasks")).toHaveLength(1);
});

test("viewers and other workspaces cannot claim generations or approval receipts", async () => {
  const owner = await app.login("scope-owner@example.test", "Owner");
  const context = await app.workspace(owner);
  const viewer = await app.existingAccount(
    "scope-viewer@example.test",
    "Viewer",
  );
  const invitation = await (
    await owner.request("/api/auth/organization/invite-member", "POST", {
      email: "scope-viewer@example.test",
      role: "member",
    })
  ).json();
  await viewer.request("/api/auth/organization/accept-invitation", "POST", {
    invitationId: invitation.id,
  });
  await viewer.request("/api/auth/organization/set-active", "POST", {
    organizationId: context.workspace.id,
  });
  const viewerId = (await owner.api.listMembers()).find(
    (member) => member.email === "scope-viewer@example.test",
  )?.id;
  if (!viewerId) throw new Error("Viewer missing");
  const conversation = await owner.api.createConversation({ title: "Private" });
  await owner.api.shareConversation(conversation.id, { memberId: viewerId });
  const outsider = await app.existingAccount("scope-outsider@example.test");
  await app.legacyWorkspace(outsider, "Other workspace");
  const begin = {
    responseId: "answer",
    attemptId: "attempt",
    mode: "replace" as const,
  };
  await expect(
    viewer.api.beginAssistantGeneration(conversation.id, begin),
  ).rejects.toMatchObject({ code: "forbidden" });
  await expect(
    outsider.api.beginAssistantGeneration(conversation.id, begin),
  ).rejects.toMatchObject({ code: "not_found" });
  const mutation = {
    idempotencyKey: "scoped-call",
    mutation: {
      operation: "create" as const,
      type: "tasks" as const,
      input: { title: "Forbidden task" },
    },
  };
  await expect(
    viewer.api.applyChatMutation(conversation.id, mutation),
  ).rejects.toMatchObject({ code: "forbidden" });
  await expect(
    outsider.api.applyChatMutation(conversation.id, mutation),
  ).rejects.toMatchObject({ code: "not_found" });
  expect(await owner.api.list("tasks")).toHaveLength(0);
});

test("membership revocation prevents a detached generation from persisting", async () => {
  const owner = await app.login("revoked-generation@example.test", "Owner");
  const context = await app.workspace(owner);
  const successor = await app.existingAccount(
    "successor@example.test",
    "Successor",
  );
  const invitation = await (
    await owner.request("/api/auth/organization/invite-member", "POST", {
      email: "successor@example.test",
      role: "member",
    })
  ).json();
  await successor.request("/api/auth/organization/accept-invitation", "POST", {
    invitationId: invitation.id,
  });
  await successor.request("/api/auth/organization/set-active", "POST", {
    organizationId: context.workspace.id,
  });
  const successorContext = await (
    await successor.request("/api/context")
  ).json();
  const directory = await (
    await owner.request("/api/auth/organization/list-members")
  ).json();
  const ownerMembership = directory.members.find(
    (member: { userId: string }) => member.userId === context.user.id,
  );
  const successorMembership = directory.members.find(
    (member: { userId: string }) => member.userId === successorContext.user.id,
  );
  if (!ownerMembership || !successorMembership)
    throw new Error("Expected both owner memberships");
  expect(
    (
      await owner.request("/api/auth/organization/update-member-role", "POST", {
        memberId: successorMembership.id,
        role: "owner",
      })
    ).status,
  ).toBe(200);
  const conversation = await owner.api.createConversation({ title: "Revoked" });
  const generation = await owner.api.beginAssistantGeneration(conversation.id, {
    responseId: "revoked-answer",
    attemptId: "revoked-attempt",
    mode: "replace",
  });
  const recovery = beginChatStream({
    conversationId: conversation.id,
    responseId: generation.responseId,
    attemptId: generation.attemptId,
  });
  recovery.done = true;
  setChatStreamPersistence(
    recovery,
    {
      response: {
        id: generation.responseId,
        role: "assistant",
        parts: [{ type: "text", text: "Must not persist" }],
      },
      outcome: { status: "completed" },
      finishReason: "stop",
      generation: generation.generation,
    },
    { saved: false, error: "Injected failure" },
  );
  expect(
    (
      await successor.request("/api/auth/organization/remove-member", "POST", {
        memberIdOrEmail: ownerMembership.id,
      })
    ).status,
  ).toBe(200);
  await expect(
    owner.api.saveAssistantGeneration(conversation.id, generation.responseId, {
      attemptId: generation.attemptId,
      generation: generation.generation,
      revision: 1,
      blocks: [{ type: "text", text: "Must not persist" }],
      status: "final",
    }),
  ).rejects.toMatchObject({ code: "workspace_required" });
  expect(
    (
      await app.pool.query(
        "SELECT 1 FROM crm_messages WHERE id='revoked-answer'",
      )
    ).rowCount,
  ).toBe(0);
  const previousBackend = process.env.CRM_BACKEND_URL;
  process.env.CRM_BACKEND_URL = app.app.server.url.origin;
  try {
    const retry = await retryResponse(
      new Request(`http://localhost:3000/api/chat/${conversation.id}/stream`, {
        method: "PATCH",
        headers: owner.headers(),
        body: JSON.stringify({
          responseId: generation.responseId,
          attemptId: generation.attemptId,
        }),
      }),
      { params: Promise.resolve({ id: conversation.id }) },
    );
    expect(retry.status).toBe(403);
    expect(getChatStream(conversation.id)?.persistence).toBe("failed");
  } finally {
    recovery.persistence = "saved";
    acknowledgeChatStream(
      conversation.id,
      generation.responseId,
      generation.attemptId,
    );
    if (previousBackend === undefined) delete process.env.CRM_BACKEND_URL;
    else process.env.CRM_BACKEND_URL = previousBackend;
  }
});

test("failed results replay, retry with fresh owner auth, and acknowledge only after save", async () => {
  const owner = await app.login("recovery-owner@example.test", "Owner");
  const context = await app.workspace(owner);
  const viewer = await app.existingAccount(
    "recovery-viewer@example.test",
    "Viewer",
  );
  const invitation = await (
    await owner.request("/api/auth/organization/invite-member", "POST", {
      email: "recovery-viewer@example.test",
      role: "member",
    })
  ).json();
  await viewer.request("/api/auth/organization/accept-invitation", "POST", {
    invitationId: invitation.id,
  });
  await viewer.request("/api/auth/organization/set-active", "POST", {
    organizationId: context.workspace.id,
  });
  const viewerId = (await owner.api.listMembers()).find(
    (member) => member.email === "recovery-viewer@example.test",
  )?.id;
  if (!viewerId) throw new Error("Viewer missing");
  const conversation = await owner.api.createConversation({
    title: "Recovery",
  });
  await owner.api.shareConversation(conversation.id, { memberId: viewerId });
  const generation = await owner.api.beginAssistantGeneration(conversation.id, {
    responseId: "recoverable-answer",
    attemptId: "recoverable-attempt",
    mode: "replace",
  });
  const entry = beginChatStream({
    conversationId: conversation.id,
    responseId: generation.responseId,
    attemptId: generation.attemptId,
    prefix: [
      'data: {"type":"start","messageId":"recoverable-answer"}\n\n',
      'data: {"type":"text-start","id":"text"}\n\n',
      'data: {"type":"text-delta","id":"text","delta":"Recovered"}\n\n',
      'data: {"type":"text-end","id":"text"}\n\n',
      'data: {"type":"finish","finishReason":"stop"}\n\n',
    ],
  });
  entry.done = true;
  setChatStreamPersistence(
    entry,
    {
      response: {
        id: generation.responseId,
        role: "assistant",
        parts: [{ type: "text", text: "Recovered" }],
      },
      outcome: { status: "completed" },
      finishReason: "stop",
      generation: generation.generation,
    },
    { saved: false, error: "Injected detached save failure" },
  );
  const params = { params: Promise.resolve({ id: conversation.id }) };
  const request = (
    user: typeof owner,
    method: "GET" | "PATCH" | "DELETE",
    responseId = generation.responseId,
    attemptId = generation.attemptId,
  ) =>
    new Request(`http://localhost:3000/api/chat/${conversation.id}/stream`, {
      method,
      headers: user.headers(),
      body:
        method === "GET"
          ? undefined
          : JSON.stringify({ responseId, attemptId }),
    });
  const previousBackend = process.env.CRM_BACKEND_URL;
  process.env.CRM_BACKEND_URL = app.app.server.url.origin;
  try {
    const replay = await replayResponse(request(owner, "GET"), params);
    expect(replay.status).toBe(200);
    expect(await replay.text()).toContain("Recovered");
    const replacement = await generateResponse(
      new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: owner.headers(),
        body: JSON.stringify({
          conversationId: conversation.id,
          responseId: generation.responseId,
          attemptId: "must-not-replace",
          expectedAttemptId: generation.attemptId,
          mode: "replace",
          messages: [
            {
              id: "replacement-prompt",
              role: "user",
              parts: [{ type: "text", text: "Replace failed result" }],
            },
          ],
        }),
      }),
    );
    expect(replacement.status).toBe(409);
    expect(getChatStream(conversation.id)?.attemptId).toBe(
      generation.attemptId,
    );
    expect((await retryResponse(request(viewer, "PATCH"), params)).status).toBe(
      403,
    );
    expect(
      (await acknowledgeResponse(request(owner, "DELETE"), params)).status,
    ).toBe(409);
    expect(getChatStream(conversation.id)?.persistence).toBe("failed");
    expect((await retryResponse(request(owner, "PATCH"), params)).status).toBe(
      200,
    );
    expect((await owner.api.listMessages(conversation.id))[0].blocks).toEqual([
      { type: "text", text: "Recovered" },
    ]);
    expect(
      (await acknowledgeResponse(request(owner, "DELETE"), params)).status,
    ).toBe(204);
    expect(getChatStream(conversation.id)).toBeUndefined();

    const old = await owner.api.beginAssistantGeneration(conversation.id, {
      responseId: "conflict-answer",
      attemptId: "conflict-old",
      mode: "replace",
    });
    const conflict = beginChatStream({
      conversationId: conversation.id,
      responseId: old.responseId,
      attemptId: old.attemptId,
    });
    conflict.done = true;
    setChatStreamPersistence(
      conflict,
      {
        response: {
          id: old.responseId,
          role: "assistant",
          parts: [{ type: "text", text: "Stale" }],
        },
        outcome: { status: "completed" },
        finishReason: "stop",
        generation: old.generation,
      },
      { saved: false, error: "Injected conflict" },
    );
    await owner.api.beginAssistantGeneration(conversation.id, {
      responseId: old.responseId,
      attemptId: "conflict-new",
      expectedAttemptId: old.attemptId,
      mode: "replace",
    });
    expect(
      (
        await retryResponse(
          request(owner, "PATCH", old.responseId, old.attemptId),
          params,
        )
      ).status,
    ).toBe(409);
    expect(getChatStream(conversation.id)?.persistence).toBe("failed");
  } finally {
    const remaining = getChatStream(conversation.id);
    if (remaining) {
      remaining.persistence = "saved";
      acknowledgeChatStream(
        conversation.id,
        remaining.responseId,
        remaining.attemptId,
      );
    }
    if (previousBackend === undefined) delete process.env.CRM_BACKEND_URL;
    else process.env.CRM_BACKEND_URL = previousBackend;
  }
});

test("a startup failure without output permits an authenticated generation retry", async () => {
  const owner = await app.login("startup-retry@example.test");
  await app.workspace(owner);
  const conversation = await owner.api.createConversation({
    title: "Startup retry",
  });
  await owner.api.appendMessage(conversation.id, {
    id: "startup-retry-prompt",
    role: "user",
    blocks: [{ type: "text", text: "Retry startup" }],
  });
  const original = await owner.api.beginAssistantGeneration(conversation.id, {
    responseId: "startup-retry-answer",
    attemptId: "startup-original-attempt",
    mode: "replace",
  });
  await owner.api.saveAssistantGeneration(
    conversation.id,
    original.responseId,
    {
      attemptId: original.attemptId,
      generation: original.generation,
      revision: 1,
      blocks: [{ type: "text", text: "Original answer" }],
      status: "final",
    },
  );
  const previousBackend = process.env.CRM_BACKEND_URL;
  const previousEnabled = process.env.AI_ENABLED;
  const previousBaseUrl = process.env.AI_BASE_URL;
  const savedFetch = globalThis.fetch;
  let posts = 0;
  let providerCalls = 0;
  let failedIdentity: { responseId: string; attemptId: string } | undefined;
  const requests: Array<{
    responseId: string;
    attemptId: string;
    expectedAttemptId?: string;
    mode: "append" | "replace";
  }> = [];
  process.env.CRM_BACKEND_URL = app.app.server.url.origin;
  process.env.AI_ENABLED = "true";
  process.env.AI_BASE_URL = "http://injected-provider.test/v1";
  globalThis.fetch = (async (input, init) => {
    const path = String(input);
    if (path.startsWith(app.app.server.url.origin))
      return savedFetch(input, init);
    if (path === "/api/chat") {
      posts++;
      const body = JSON.parse(String(init?.body));
      requests.push(body);
      if (posts === 1) {
        const accepted = await owner.api.beginAssistantGeneration(
          conversation.id,
          {
            responseId: body.responseId,
            attemptId: body.attemptId,
            expectedAttemptId: body.expectedAttemptId,
            mode: body.mode,
          },
        );
        const failed = beginChatStream({
          conversationId: conversation.id,
          responseId: accepted.responseId,
          attemptId: accepted.attemptId,
        });
        failChatStream(failed, "Injected startup failure");
        failedIdentity = {
          responseId: accepted.responseId,
          attemptId: accepted.attemptId,
        };
        throw new TypeError("Injected lost startup response");
      }
      return generateResponse(
        new Request("http://localhost:3000/api/chat", {
          method: "POST",
          headers: owner.headers(),
          body: init?.body,
        }),
      );
    }
    if (path.endsWith("/stream")) {
      const request = new Request(
        `http://localhost:3000/api/chat/${conversation.id}/stream`,
        {
          method: init?.method,
          headers: owner.headers(),
          body: init?.body,
        },
      );
      const params = { params: Promise.resolve({ id: conversation.id }) };
      if (!init?.method || init.method === "GET")
        return replayResponse(request, params);
      if (init.method === "DELETE") return acknowledgeResponse(request, params);
    }
    if (path.endsWith("/stop")) return Response.json({ stopped: false });
    providerCalls++;
    const chunks = [
      {
        id: "startup-retry-completion",
        object: "chat.completion.chunk",
        created: 1,
        model: "injected-model",
        choices: [
          {
            index: 0,
            delta: { role: "assistant", content: "Recovered after startup" },
            finish_reason: null,
          },
        ],
      },
      {
        id: "startup-retry-completion",
        object: "chat.completion.chunk",
        created: 1,
        model: "injected-model",
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      },
    ];
    return new Response(
      `${chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("")}data: [DONE]\n\n`,
      { headers: { "content-type": "text/event-stream" } },
    );
  }) as typeof fetch;
  const session = new ChatSession(
    conversation,
    owner.api,
    await owner.api.listMessages(conversation.id),
  );
  try {
    await session.retry();
    for (let attempt = 0; attempt < 100; attempt++) {
      if (session.chat.status === "error") break;
      await Bun.sleep(10);
    }
    expect(session.chat.status).toBe("error");
    expect(failedIdentity).toBeDefined();
    const save = await retryResponse(
      new Request(`http://localhost:3000/api/chat/${conversation.id}/stream`, {
        method: "PATCH",
        headers: owner.headers(),
        body: JSON.stringify(failedIdentity),
      }),
      { params: Promise.resolve({ id: conversation.id }) },
    );
    expect(save.status).toBe(409);
    expect(await save.text()).toContain("failed before producing a result");
    await session.retry();
    for (let attempt = 0; attempt < 100; attempt++) {
      const messages = await owner.api.listMessages(conversation.id);
      if (messages.some((message) => message.role === "assistant")) break;
      await Bun.sleep(10);
    }
    expect(posts).toBe(2);
    expect(providerCalls).toBe(1);
    expect(requests.map((request) => request.responseId)).toEqual([
      original.responseId,
      original.responseId,
    ]);
    expect(requests.map((request) => request.expectedAttemptId)).toEqual([
      original.attemptId,
      original.attemptId,
    ]);
    expect(failedIdentity?.attemptId).not.toBe(original.attemptId);
    expect(
      (await owner.api.listMessages(conversation.id)).map((message) => ({
        id: message.id,
        role: message.role,
        blocks: message.blocks,
      })),
    ).toEqual([
      expect.objectContaining({
        role: "user",
        blocks: [{ type: "text", text: "Retry startup" }],
      }),
      {
        id: original.responseId,
        role: "assistant",
        blocks: [{ type: "text", text: "Recovered after startup" }],
      },
    ]);
  } finally {
    globalThis.fetch = savedFetch;
    if (previousBackend === undefined) delete process.env.CRM_BACKEND_URL;
    else process.env.CRM_BACKEND_URL = previousBackend;
    if (previousEnabled === undefined) delete process.env.AI_ENABLED;
    else process.env.AI_ENABLED = previousEnabled;
    if (previousBaseUrl === undefined) delete process.env.AI_BASE_URL;
    else process.env.AI_BASE_URL = previousBaseUrl;
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
