import { afterEach, beforeEach, expect, test } from "bun:test";
import type { WorkspaceContext } from "../../src/lib/auth/types";
import { createDataService } from "../../src/lib/data/service";
import { createPostgresAdapter, createPostgresStore } from "../db";
import type { ReadPathMetric } from "../read-service";
import { type TestApp, testApp } from "./helpers";

let app: TestApp;
beforeEach(async () => {
  app = await testApp();
});
afterEach(async () => {
  await app.close();
});

async function invite(
  owner: ReturnType<TestApp["agent"]>,
  context: WorkspaceContext,
  email: string,
  name: string,
) {
  const member = await app.existingAccount(email, name);
  const invitation = await (
    await owner.request("/api/auth/organization/invite-member", "POST", {
      email,
      role: "member",
    })
  ).json();
  expect(
    (
      await member.request("/api/auth/organization/accept-invitation", "POST", {
        invitationId: invitation.id,
      })
    ).status,
  ).toBe(200);
  await member.request("/api/auth/organization/set-active", "POST", {
    organizationId: context.workspace.id,
  });
  return {
    member,
    context: (await (
      await member.request("/api/context")
    ).json()) as WorkspaceContext,
  };
}

test("scoped reads do not hydrate unrelated record kinds or conversation messages", async () => {
  const owner = await app.login();
  const context = await app.workspace(owner);
  const account = await owner.api.create("accounts", { name: "Exact" });
  const selected = await owner.api.createConversation({ title: "Selected" });
  await owner.api.appendMessage(selected.id, {
    role: "user",
    blocks: [{ type: "text", text: "Selected message" }],
  });
  const unrelated = await owner.api.createConversation({ title: "Unrelated" });
  await owner.api.appendMessage(unrelated.id, {
    role: "user",
    blocks: [{ type: "text", text: "Initial unrelated message" }],
  });

  const metrics: ReadPathMetric[] = [];
  const adapter = createPostgresAdapter(app.pool, context, {
    onRead: (metric) => {
      metrics.push(metric);
    },
  });
  async function measured(run: () => Promise<unknown>) {
    metrics.length = 0;
    await run();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].queryCount).toBe(4);
    expect(metrics[0].returnedRows).toBe(metrics[0].dataRows + 1);
    return metrics[0];
  }
  async function sample() {
    return {
      members: await measured(() => adapter.listMembers()),
      exactRecord: await measured(() => adapter.get("accounts", account.id)),
      recordKind: await measured(() => adapter.list("accounts")),
      recents: await measured(() => adapter.listConversations()),
      conversation: await measured(() => adapter.getConversation(selected.id)),
      messages: await measured(() => adapter.listMessages(selected.id)),
    };
  }

  const before = await sample();
  for (let index = 0; index < 12; index++) {
    await owner.api.create("contacts", { name: `Unrelated contact ${index}` });
    await owner.api.appendMessage(unrelated.id, {
      role: "user",
      blocks: [{ type: "text", text: `Unrelated message ${index}` }],
    });
  }
  const after = await sample();
  for (const key of Object.keys(before) as (keyof typeof before)[])
    expect(after[key].dataRows).toBe(before[key].dataRows);
  expect(after.exactRecord.dataRows).toBe(1);
  expect(after.conversation.dataRows).toBe(1);
  expect(after.messages.dataRows).toBe(1);
  const diagnosticFailure = createPostgresAdapter(app.pool, context, {
    onRead: async () => {
      throw new Error("Injected diagnostics failure");
    },
  });
  expect(await diagnosticFailure.listMembers()).toHaveLength(1);
});

test("scoped adapter preserves HTTP access, normalization, ordering, and revocation semantics", async () => {
  const owner = await app.login("owner@example.test", "Owner");
  const context = await app.workspace(owner);
  const { member: viewer, context: viewerContext } = await invite(
    owner,
    context,
    "viewer@example.test",
    "Viewer",
  );
  const viewerEntry = (await owner.api.listMembers()).find(
    (entry) => entry.id === viewerContext.user.id,
  );
  if (!viewerEntry) throw new Error("Viewer membership was not found");
  const account = await owner.api.create("accounts", {
    name: "Assigned",
    owner: { id: viewerEntry.id, name: "Stale name" },
  });
  const shared = await owner.api.createConversation({ title: "Shared" });
  await owner.api.appendMessage(shared.id, {
    role: "user",
    blocks: [{ type: "text", text: "First" }],
  });
  await owner.api.appendMessage(shared.id, {
    role: "assistant",
    blocks: [{ type: "text", text: "Second" }],
  });
  const privateChat = await owner.api.createConversation({ title: "Private" });
  await owner.api.shareConversation(shared.id, { memberId: viewerEntry.id });
  await viewer.request("/api/auth/update-user", "POST", {
    name: "Renamed Viewer",
  });

  const directOwner = createPostgresAdapter(app.pool, context);
  const directViewer = createPostgresAdapter(app.pool, viewerContext);
  const legacyOwner = createDataService(
    createPostgresStore(app.pool, context),
    {
      id: context.user.id,
      name: context.user.name,
    },
  );
  expect(await directOwner.listMembers()).toEqual(
    await legacyOwner.listMembers(),
  );
  expect(await directOwner.list("accounts")).toEqual(
    await legacyOwner.list("accounts"),
  );
  expect(await directOwner.get("accounts", account.id)).toEqual(
    await legacyOwner.get("accounts", account.id),
  );
  expect((await directOwner.get("accounts", account.id)).owner?.name).toBe(
    "Renamed Viewer",
  );
  expect(await directOwner.listActivity("accounts", account.id)).toEqual(
    await legacyOwner.listActivity("accounts", account.id),
  );
  expect(await directOwner.listConversations()).toEqual(
    await legacyOwner.listConversations(),
  );
  expect(await directOwner.getConversation(shared.id)).toEqual(
    await legacyOwner.getConversation(shared.id),
  );
  expect(await directOwner.listMessages(shared.id)).toEqual(
    await legacyOwner.listMessages(shared.id),
  );
  expect(await directOwner.listConversationShares(shared.id)).toEqual(
    await legacyOwner.listConversationShares(shared.id),
  );
  expect((await directViewer.getConversation(shared.id)).access).toBe("viewer");
  expect(
    (await directViewer.listMessages(shared.id)).map((item) => item.sequence),
  ).toEqual([1, 2]);
  await expect(
    directViewer.listConversationShares(shared.id),
  ).rejects.toMatchObject({ code: "forbidden" });
  await expect(
    directViewer.getConversation(privateChat.id),
  ).rejects.toMatchObject({
    code: "not_found",
  });
  for (const invalidKind of ["conversations", "unknown"]) {
    await expect(directViewer.list(invalidKind as never)).rejects.toMatchObject(
      { code: "validation" },
    );
    await expect(
      directViewer.get(invalidKind as never, privateChat.id),
    ).rejects.toMatchObject({ code: "validation" });
    await expect(
      directViewer.listActivity(invalidKind as never, privateChat.id),
    ).rejects.toMatchObject({ code: "validation" });
  }

  const outsider = await app.existingAccount("outsider@example.test");
  const otherContext = await app.legacyWorkspace(outsider, "Other Workspace");
  const directOutsider = createPostgresAdapter(app.pool, otherContext);
  await expect(
    directOutsider.get("accounts", account.id),
  ).rejects.toMatchObject({ code: "not_found" });
  await expect(directOutsider.getConversation(shared.id)).rejects.toMatchObject(
    { code: "not_found" },
  );

  expect(
    (
      await owner.request("/api/auth/organization/remove-member", "POST", {
        memberIdOrEmail: viewerEntry.email,
      })
    ).status,
  ).toBe(200);
  await expect(directViewer.listMembers()).rejects.toMatchObject({
    code: "forbidden",
  });
  await expect(directViewer.getConversation(shared.id)).rejects.toMatchObject({
    code: "forbidden",
  });
});
