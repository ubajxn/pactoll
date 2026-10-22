import { afterEach, beforeEach, expect, test } from "bun:test";
import { POST as stop } from "../../src/app/api/chat/[id]/stop/route";
import {
  DELETE as acknowledge,
  GET as resume,
} from "../../src/app/api/chat/[id]/stream/route";
import { POST as generate } from "../../src/app/api/chat/route";
import {
  beginChatStream,
  stopChatStream,
} from "../../src/lib/chat/stream-store";
import { type TestApp, testApp } from "./helpers";

let app: TestApp;
beforeEach(async () => {
  app = await testApp();
});
afterEach(async () => {
  await app.close();
});

async function setup() {
  const owner = await app.login("owner@example.test", "Chat Owner");
  const context = await app.workspace(owner);
  const viewer = await app.existingAccount(
    "viewer@example.test",
    "Chat Viewer",
  );
  async function inviteViewer() {
    const invitation = await (
      await owner.request("/api/auth/organization/invite-member", "POST", {
        email: "viewer@example.test",
        role: "member",
      })
    ).json();
    expect(
      (
        await viewer.request(
          "/api/auth/organization/accept-invitation",
          "POST",
          { invitationId: invitation.id },
        )
      ).status,
    ).toBe(200);
    await viewer.request("/api/auth/organization/set-active", "POST", {
      organizationId: context.workspace.id,
    });
  }
  await inviteViewer();
  const viewerId = (await owner.api.listMembers()).find(
    (member) => member.email === "viewer@example.test",
  )?.id;
  if (!viewerId) throw new Error("Invited member was not created");
  const conversation = await owner.api.createConversation({
    title: "Shared planning",
  });
  const message = await owner.api.appendMessage(conversation.id, {
    role: "user",
    blocks: [{ type: "text", text: "Workspace discussion" }],
  });
  return {
    owner,
    viewer,
    viewerId,
    context,
    conversation,
    message,
    inviteViewer,
  };
}

test("sharing is explicit, current-workspace only, idempotent and survives restart", async () => {
  const { owner, viewer, viewerId, context, conversation } = await setup();
  const outsider = await app.existingAccount("outsider@example.test");
  const other = await app.legacyWorkspace(outsider);
  expect(await viewer.api.listConversations()).toEqual([]);
  await expect(
    viewer.api.getConversation(conversation.id),
  ).rejects.toMatchObject({ code: "not_found" });
  expect(
    (await app.agent().request(`/api/conversations/${conversation.id}`)).status,
  ).toBe(401);
  for (const memberId of [context.user.id, other.user.id, "missing"])
    await expect(
      owner.api.shareConversation(conversation.id, { memberId }),
    ).rejects.toMatchObject({ code: "validation" });
  expect(
    (
      await owner.request(
        `/api/conversations/${conversation.id}/sharing`,
        "POST",
        { memberId: viewerId, access: "owner" },
      )
    ).status,
  ).toBe(400);
  expect(
    await owner.api.shareConversation(conversation.id, { memberId: viewerId }),
  ).toHaveLength(1);
  expect(
    await owner.api.shareConversation(conversation.id, { memberId: viewerId }),
  ).toHaveLength(1);
  expect((await owner.api.getConversation(conversation.id)).access).toBe(
    "owner",
  );
  expect((await viewer.api.getConversation(conversation.id)).access).toBe(
    "viewer",
  );
  expect((await viewer.api.listConversations()).map((chat) => chat.id)).toEqual(
    [conversation.id],
  );
  expect(await viewer.api.listMessages(conversation.id)).toHaveLength(1);
  await expect(
    outsider.api.getConversation(conversation.id),
  ).rejects.toMatchObject({ code: "not_found" });
  await expect(
    outsider.api.listConversationShares(conversation.id),
  ).rejects.toMatchObject({ code: "not_found" });
  await app.restart();
  expect(await owner.api.listConversationShares(conversation.id)).toHaveLength(
    1,
  );
  const response = await owner.api.appendMessage(conversation.id, {
    role: "assistant",
    status: "partial",
    blocks: [{ type: "text", text: "Working" }],
  });
  expect((await viewer.api.listMessages(conversation.id)).at(-1)?.status).toBe(
    "partial",
  );
  await owner.api.updateMessage(conversation.id, response.id, {
    status: "final",
    blocks: [{ type: "text", text: "Complete" }],
  });
  expect(
    (await viewer.api.listMessages(conversation.id)).at(-1)?.blocks,
  ).toEqual([{ type: "text", text: "Complete" }]);
  await owner.api.unshareConversation(conversation.id, viewerId);
  await owner.api.unshareConversation(conversation.id, viewerId);
  expect(await viewer.api.listConversations()).toEqual([]);
  await expect(
    viewer.api.getConversation(conversation.id),
  ).rejects.toMatchObject({ code: "not_found" });
  await expect(viewer.api.listMessages(conversation.id)).rejects.toMatchObject({
    code: "not_found",
  });
  expect(await owner.api.listMessages(conversation.id)).toHaveLength(2);
});

test("viewers cannot write messages, alter chats or sharing, or operate any AI stream endpoint", async () => {
  const { owner, viewer, viewerId, conversation, message } = await setup();
  await owner.api.shareConversation(conversation.id, { memberId: viewerId });
  for (const operation of [
    () => viewer.api.updateConversation(conversation.id, { title: "Changed" }),
    () => viewer.api.deleteConversation(conversation.id),
    () =>
      viewer.api.appendMessage(conversation.id, { role: "user", blocks: [] }),
    () => viewer.api.updateMessage(conversation.id, message.id, { blocks: [] }),
    () => viewer.api.listConversationShares(conversation.id),
    () => viewer.api.shareConversation(conversation.id, { memberId: viewerId }),
    () => viewer.api.unshareConversation(conversation.id, viewerId),
  ])
    await expect(operation()).rejects.toMatchObject({ code: "forbidden" });
  const previousBackend = process.env.CRM_BACKEND_URL;
  const previousAI = process.env.AI_ENABLED;
  process.env.CRM_BACKEND_URL = app.app.server.url.origin;
  process.env.AI_ENABLED = "true";
  const active = beginChatStream({
    conversationId: conversation.id,
    responseId: "owner-response",
    attemptId: "owner-attempt",
  });
  const params = { params: Promise.resolve({ id: conversation.id }) };
  const request = (suffix: string, method = "GET", body?: unknown) =>
    new Request(`http://localhost:3000/api/chat/${conversation.id}/${suffix}`, {
      method,
      headers: viewer.headers(),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  try {
    expect((await resume(request("stream"), params)).status).toBe(403);
    expect((await stop(request("stop", "POST", {}), params)).status).toBe(403);
    expect(
      (await acknowledge(request("stream", "DELETE", {}), params)).status,
    ).toBe(403);
    expect(
      (
        await generate(
          request("", "POST", {
            conversationId: conversation.id,
            attemptId: "viewer-attempt",
            mode: "replace",
            messages: [
              {
                id: "viewer-message",
                role: "user",
                parts: [{ type: "text", text: "Generate" }],
              },
            ],
          }),
        )
      ).status,
    ).toBe(403);
    expect(active.signal.aborted).toBe(false);
    const record = await viewer.api.create("accounts", {
      name: "Normal workspace edit",
    });
    expect((await viewer.api.get("accounts", record.id)).name).toBe(
      "Normal workspace edit",
    );
    expect((await owner.api.getConversation(conversation.id)).title).toBe(
      "Shared planning",
    );
    expect(await owner.api.listMessages(conversation.id)).toHaveLength(1);
  } finally {
    stopChatStream(conversation.id, "owner-response", "owner-attempt");
    if (previousBackend === undefined) delete process.env.CRM_BACKEND_URL;
    else process.env.CRM_BACKEND_URL = previousBackend;
    if (previousAI === undefined) delete process.env.AI_ENABLED;
    else process.env.AI_ENABLED = previousAI;
  }
});

test("member removal revokes grants permanently, and deleting the chat removes grants", async () => {
  const { owner, viewer, viewerId, conversation, inviteViewer } = await setup();
  await owner.api.shareConversation(conversation.id, { memberId: viewerId });
  expect(
    (
      await owner.request("/api/auth/organization/remove-member", "POST", {
        memberIdOrEmail: "viewer@example.test",
      })
    ).status,
  ).toBe(200);
  expect(await owner.api.listConversationShares(conversation.id)).toEqual([]);
  await expect(
    viewer.api.getConversation(conversation.id),
  ).rejects.toMatchObject({ code: "workspace_required" });
  await inviteViewer();
  await expect(
    viewer.api.getConversation(conversation.id),
  ).rejects.toMatchObject({ code: "not_found" });
  await owner.api.shareConversation(conversation.id, { memberId: viewerId });
  await owner.api.deleteConversation(conversation.id);
  expect(
    (await app.pool.query("SELECT * FROM crm_conversation_shares")).rowCount,
  ).toBe(0);
  await expect(viewer.api.listMessages(conversation.id)).rejects.toMatchObject({
    code: "not_found",
  });
});

test("removing a chat's owner also revokes its shares; database rejects cross-workspace recipients", async () => {
  const { owner, viewer, viewerId, context } = await setup();
  const chat = await viewer.api.createConversation({
    title: "Member owned chat",
  });
  await viewer.api.shareConversation(chat.id, { memberId: context.user.id });
  expect((await owner.api.getConversation(chat.id)).access).toBe("viewer");
  const outsider = await app.existingAccount("outsider@example.test");
  const other = await app.legacyWorkspace(outsider);
  await expect(
    app.pool.query(
      "INSERT INTO crm_conversation_shares (organization_id,conversation_id,user_id,owner_id) VALUES ($1,$2,$3,$4)",
      [context.workspace.id, chat.id, other.user.id, viewerId],
    ),
  ).rejects.toMatchObject({ code: "23503" });
  await owner.request("/api/auth/organization/remove-member", "POST", {
    memberIdOrEmail: "viewer@example.test",
  });
  await expect(owner.api.getConversation(chat.id)).rejects.toMatchObject({
    code: "not_found",
  });
  expect(
    (await app.pool.query("SELECT * FROM crm_conversation_shares")).rowCount,
  ).toBe(0);
});
