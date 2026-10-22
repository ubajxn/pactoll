import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  type DataAdapter,
  listRecordKinds,
} from "../../src/lib/data/contracts";
import { createMemoryAdapter } from "../../src/lib/data/memory";
import { createPostgresAdapter, migrate } from "../db";
import { type TestApp, testApp } from "./helpers";

for (const mode of ["memory", "http"] as const)
  describe(`${mode} record lists`, () => {
    let api: DataAdapter;
    let app: TestApp | undefined;
    beforeEach(async () => {
      if (mode === "http") {
        app = await testApp();
        api = (await app.login()).api;
      } else api = createMemoryAdapter();
    });
    afterEach(async () => {
      await app?.close();
      app = undefined;
    });

    test("typed list lifecycle, duplicate-safe membership and record-preserving removal", async () => {
      for (const recordType of listRecordKinds) {
        const first = await api.create(recordType, { name: "First" });
        const second = await api.create(recordType, { name: "Second" });
        const list = await api.createList({
          name: " Priority ",
          recordType,
          recordId: first.id,
        });
        expect(list.name).toBe("Priority");
        expect(list.recordIds).toEqual([first.id]);
        await Promise.all([
          api.addToList(list.id, { recordId: second.id }),
          api.addToList(list.id, { recordId: second.id }),
        ]);
        expect((await api.getList(list.id)).recordIds.toSorted()).toEqual(
          [first.id, second.id].toSorted(),
        );
        await api.updateList(list.id, { name: "Renamed" });
        expect(
          (await api.listLists()).find((item) => item.id === list.id)?.name,
        ).toBe("Renamed");
        await api.removeFromList(list.id, first.id);
        expect((await api.get(recordType, first.id)).name).toBe("First");
        await api.deleteList(list.id);
        expect((await api.get(recordType, second.id)).name).toBe("Second");
        await expect(api.getList(list.id)).rejects.toMatchObject({
          code: "not_found",
        });
      }
    });

    test("creation with membership is atomic and rejects wrong types, missing records and invalid names", async () => {
      const account = await api.create("accounts", { name: "Acme" });
      const list = await api.createList({
        name: "Contacts",
        recordType: "contacts",
      });
      const contact = await api.create(
        "contacts",
        { name: "Contact" },
        { listId: list.id },
      );
      expect((await api.getList(list.id)).recordIds).toEqual([contact.id]);
      await expect(
        api.create(
          "accounts",
          { name: "Should roll back" },
          { listId: list.id },
        ),
      ).rejects.toMatchObject({ code: "validation" });
      expect((await api.list("accounts")).map((record) => record.id)).toEqual([
        account.id,
      ]);
      await expect(
        api.createList({
          name: "Wrong type",
          recordType: "contacts",
          recordId: account.id,
        }),
      ).rejects.toMatchObject({ code: "validation" });
      await expect(
        api.addToList(list.id, { recordId: account.id }),
      ).rejects.toMatchObject({ code: "validation" });
      await expect(
        api.addToList(list.id, { recordId: "missing" }),
      ).rejects.toMatchObject({ code: "validation" });
      await expect(
        api.createList({ name: "  ", recordType: "accounts" }),
      ).rejects.toMatchObject({ code: "validation" });
      await expect(
        api.updateList(list.id, { recordType: "accounts" } as never),
      ).rejects.toMatchObject({ code: "validation" });
      expect(await api.listLists()).toHaveLength(1);
    });

    test("record deletion cleans memberships while reference conflicts preserve them", async () => {
      const account = await api.create("accounts", { name: "Acme" });
      const contact = await api.create("contacts", {
        name: "Related",
        accountId: account.id,
      });
      const list = await api.createList({
        name: "Accounts",
        recordType: "accounts",
        recordId: account.id,
      });
      await expect(api.delete("accounts", account.id)).rejects.toMatchObject({
        code: "conflict",
      });
      expect((await api.getList(list.id)).recordIds).toEqual([account.id]);
      await api.delete("contacts", contact.id);
      await api.delete("accounts", account.id);
      expect((await api.getList(list.id)).recordIds).toEqual([]);
    });
  });

describe("authenticated persisted lists", () => {
  let app: TestApp;
  beforeEach(async () => {
    app = await testApp();
  });
  afterEach(async () => {
    await app.close();
  });

  test("lists survive migrations/restart and enforce authentication, workspace and revoked membership", async () => {
    const owner = await app.login();
    const context = await app.workspace(owner);
    const record = await owner.api.create("accounts", {
      name: "Private workspace record",
    });
    const list = await owner.api.createList({
      name: "Priority",
      recordType: "accounts",
      recordId: record.id,
    });
    await migrate(app.pool);
    await app.restart();
    expect((await owner.api.getList(list.id)).recordIds).toEqual([record.id]);
    expect((await app.agent().request("/api/lists")).status).toBe(401);
    const outsider = await app.existingAccount();
    await app.legacyWorkspace(outsider);
    expect(await outsider.api.listLists()).toEqual([]);
    for (const action of [
      () => outsider.api.getList(list.id),
      () => outsider.api.updateList(list.id, { name: "Intrusion" }),
      () => outsider.api.deleteList(list.id),
      () => outsider.api.addToList(list.id, { recordId: record.id }),
      () => outsider.api.removeFromList(list.id, record.id),
    ])
      await expect(action()).rejects.toMatchObject({ code: "not_found" });
    await expect(
      outsider.api.createList({
        name: "Foreign",
        recordType: "accounts",
        recordId: record.id,
      }),
    ).rejects.toMatchObject({ code: "validation" });
    const foreign = await outsider.api.create("accounts", {
      name: "Foreign record",
    });
    await expect(
      owner.api.addToList(list.id, { recordId: foreign.id }),
    ).rejects.toMatchObject({ code: "validation" });
    // Database constraints defend against bypassing the service checks.
    await expect(
      app.pool.query(
        "INSERT INTO crm_list_records VALUES ($1,'accounts',$2,$3)",
        [context.workspace.id, list.id, foreign.id],
      ),
    ).rejects.toMatchObject({ code: "23503" });
    const contact = await owner.api.create("contacts", { name: "Wrong type" });
    await expect(
      app.pool.query(
        "INSERT INTO crm_list_records VALUES ($1,'accounts',$2,$3)",
        [context.workspace.id, list.id, contact.id],
      ),
    ).rejects.toMatchObject({ code: "23503" });
    const stale = createPostgresAdapter(app.pool, context);
    const replacement = await app.existingAccount();
    const replacementSession = await app.app.auth.api.getSession({
      headers: replacement.headers(),
    });
    await app.pool.query(
      `INSERT INTO member ("organizationId","userId",role,"createdAt") VALUES ($1,$2,'owner',now())`,
      [context.workspace.id, replacementSession?.user.id],
    );
    await app.pool.query(
      `DELETE FROM member WHERE "organizationId"=$1 AND "userId"=$2`,
      [context.workspace.id, context.user.id],
    );
    await expect(stale.listLists()).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(stale.getList(list.id)).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(
      stale.addToList(list.id, { recordId: record.id }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });
});
