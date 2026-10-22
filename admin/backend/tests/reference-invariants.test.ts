import { afterEach, beforeEach, expect, test } from "bun:test";
import type { ContentBlock } from "../../src/lib/data/contracts";
import { migrate } from "../db";
import { type TestApp, testApp } from "./helpers";

let app: TestApp;
beforeEach(async () => {
  app = await testApp();
});
afterEach(async () => {
  await app.close();
});

async function teammate(
  owner: ReturnType<TestApp["agent"]>,
  organizationId: string,
) {
  const member = await app.existingAccount(
    "member@example.test",
    "Private Chat Owner",
  );
  const invitation = await (
    await owner.request("/api/auth/organization/invite-member", "POST", {
      email: "member@example.test",
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
    organizationId,
  });
  return member;
}

test("mentions reject cross-workspace records and protect records referenced by private chats", async () => {
  const owner = await app.login("owner@example.test");
  const context = await app.workspace(owner);
  const account = await owner.api.create("accounts", {
    name: "Shared account",
  });
  const member = await teammate(owner, context.workspace.id);
  const privateChat = await member.api.createConversation({ title: "Private" });
  await member.api.appendMessage(privateChat.id, {
    role: "user",
    blocks: [
      {
        type: "mention",
        label: account.name,
        reference: { type: "accounts", id: account.id },
      },
    ],
  });
  expect(await owner.api.listConversations()).toEqual([]);
  await expect(owner.api.delete("accounts", account.id)).rejects.toMatchObject({
    code: "conflict",
  });

  const outsider = await app.existingAccount("outsider@example.test");
  await app.legacyWorkspace(outsider, "Other Workspace");
  const foreign = await outsider.api.create("accounts", { name: "Foreign" });
  await expect(
    member.api.appendMessage(privateChat.id, {
      role: "user",
      blocks: [
        {
          type: "mention",
          label: foreign.name,
          reference: { type: "accounts", id: foreign.id },
        },
      ],
    }),
  ).rejects.toMatchObject({ code: "validation" });
});

test("mention migration links valid references and preserves invalid labels as text", async () => {
  const owner = await app.login();
  const context = await app.workspace(owner);
  const valid = await owner.api.create("accounts", { name: "Valid" });
  const wrongKind = await owner.api.create("accounts", { name: "Wrong kind" });
  const outsider = await app.existingAccount();
  const otherContext = await app.legacyWorkspace(outsider, "Other Workspace");
  const foreign = await outsider.api.create("accounts", { name: "Foreign" });
  const conversation = await owner.api.createConversation({ title: "Legacy" });
  const blocks: ContentBlock[] = [
    {
      type: "mention",
      label: "Valid label",
      reference: { type: "accounts", id: valid.id },
    },
    {
      type: "mention",
      label: "Missing label",
      reference: { type: "accounts", id: "missing" },
    },
    {
      type: "mention",
      label: "Wrong-kind label",
      reference: { type: "contacts", id: wrongKind.id },
    },
    {
      type: "mention",
      label: "Foreign label",
      reference: { type: "accounts", id: foreign.id },
    },
  ];
  const now = new Date().toISOString();
  await app.pool.query(
    "ALTER TABLE crm_messages DISABLE TRIGGER crm_message_mentions_sync",
  );
  await app.pool.query(
    `INSERT INTO crm_messages (id,organization_id,conversation_id,sequence,payload)
     VALUES ($1,$2,$3,1,$4)`,
    [
      "legacy-mentions",
      context.workspace.id,
      conversation.id,
      JSON.stringify({
        id: "legacy-mentions",
        conversationId: conversation.id,
        sequence: 1,
        role: "user",
        blocks,
        status: "final",
        isDemo: false,
        createdAt: now,
        updatedAt: now,
      }),
    ],
  );
  await app.pool.query(
    "DELETE FROM crm_schema_migrations WHERE name='005_message_mentions.sql'",
  );
  await migrate(app.pool);
  await migrate(app.pool);

  const oldWriter = await app.pool.connect();
  try {
    await oldWriter.query("BEGIN");
    await oldWriter.query(
      `INSERT INTO crm_messages (id,organization_id,conversation_id,sequence,payload)
       VALUES ($1,$2,$3,2,$4)`,
      [
        "concurrent-legacy-mention",
        context.workspace.id,
        conversation.id,
        JSON.stringify({
          id: "concurrent-legacy-mention",
          conversationId: conversation.id,
          sequence: 2,
          role: "user",
          blocks: [blocks[0]],
          status: "final",
          isDemo: false,
          createdAt: now,
          updatedAt: now,
        }),
      ],
    );
    await oldWriter.query(
      "DELETE FROM crm_message_links WHERE source_id=$1 AND organization_id=$2",
      ["concurrent-legacy-mention", context.workspace.id],
    );
    await oldWriter.query("COMMIT");
  } catch (error) {
    await oldWriter.query("ROLLBACK");
    throw error;
  } finally {
    oldWriter.release();
  }

  const [message, concurrentMessage] = await owner.api.listMessages(
    conversation.id,
  );
  expect(message.blocks).toEqual([
    blocks[0],
    { type: "text", text: "Missing label" },
    { type: "text", text: "Wrong-kind label" },
    { type: "text", text: "Foreign label" },
  ]);
  expect(
    (
      await app.pool.query(
        "SELECT target_id FROM crm_message_links WHERE source_id=$1",
        [message.id],
      )
    ).rows,
  ).toEqual([{ target_id: valid.id }]);
  expect(concurrentMessage.id).toBe("concurrent-legacy-mention");
  expect(
    (
      await app.pool.query(
        "SELECT target_id FROM crm_message_links WHERE source_id=$1",
        [concurrentMessage.id],
      )
    ).rows,
  ).toEqual([{ target_id: valid.id }]);
  expect(otherContext.workspace.id).not.toBe(context.workspace.id);
  await expect(owner.api.delete("accounts", valid.id)).rejects.toMatchObject({
    code: "conflict",
  });
  await owner.api.delete("accounts", wrongKind.id);
});
