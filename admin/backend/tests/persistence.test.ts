import { afterEach, beforeEach, expect, test } from "bun:test";
import { migrate } from "../db";
import { type TestApp, testApp } from "./helpers";

let app: TestApp;
beforeEach(async () => {
  app = await testApp();
});
afterEach(async () => {
  await app.close();
});

test("migrations are repeatable and concurrent writes preserve data and unique message order", async () => {
  await Promise.all([migrate(app.pool), migrate(app.pool)]);
  const migrations = await app.pool.query<{ name: string; checksum: string }>(
    "SELECT name,checksum FROM crm_schema_migrations ORDER BY name",
  );
  expect(migrations.rows.map((migration) => migration.name)).toEqual([
    "001_auth.sql",
    "002_crm.sql",
    "003_chat_sharing.sql",
    "004_atomic_workspace_owner.sql",
    "005_message_mentions.sql",
    "006_chat_recovery.sql",
    "007_single_company.sql",
    "008_lists.sql",
    "009_drop_import_tracking.sql",
  ]);
  expect(
    migrations.rows.every((migration) => migration.checksum.length === 64),
  ).toBe(true);
  expect(
    (
      await app.pool.query(
        "SELECT to_regclass('public.crm_imports') AS table_name",
      )
    ).rows[0]?.table_name,
  ).toBeNull();
  expect((await app.pool.query('SELECT * FROM "user"')).rowCount).toBe(0);
  const user = await app.login();
  await app.workspace(user);
  const account = await user.api.create("accounts", { name: "Concurrent" });
  await Promise.all([
    user.api.update("accounts", account.id, { name: "Updated" }),
    user.api.update("accounts", account.id, { industry: "Technology" }),
  ]);
  expect(await user.api.get("accounts", account.id)).toMatchObject({
    name: "Updated",
    industry: "Technology",
  });
  const conversation = await user.api.createConversation({ title: "Messages" });
  await Promise.all(
    Array.from({ length: 8 }, (_, index) =>
      user.api.appendMessage(conversation.id, {
        role: "user",
        blocks: [{ type: "text", text: String(index) }],
      }),
    ),
  );
  expect(
    (await user.api.listMessages(conversation.id)).map(
      (message) => message.sequence,
    ),
  ).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  const attempts = await Promise.allSettled(
    [1, 2].map(() =>
      user.api.appendMessage(conversation.id, {
        id: "duplicate",
        role: "user",
        blocks: [],
      }),
    ),
  );
  expect(
    attempts.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(1);
  await app.restart();
  expect(await user.api.listMessages(conversation.id)).toHaveLength(9);
});

test("database foreign keys enforce workspace references, even outside the request validator", async () => {
  const first = await app.login();
  const context = await app.workspace(first);
  const second = await app.existingAccount();
  const other = await app.legacyWorkspace(second);
  const a = await first.api.create("accounts", { name: "A" });
  const b = await second.api.create("accounts", { name: "B" });
  await expect(
    app.pool.query("INSERT INTO crm_entity_links VALUES ($1,$2,$3)", [
      context.workspace.id,
      a.id,
      b.id,
    ]),
  ).rejects.toMatchObject({ code: "23503" });
  await expect(
    app.pool.query("UPDATE crm_entities SET owner_id=$1 WHERE id=$2", [
      other.user.id,
      a.id,
    ]),
  ).rejects.toMatchObject({ code: "23503" });
});
