import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  type DataAdapter,
  DataError,
  type RecordKind,
} from "../../src/lib/data/contracts";
import { createHttpAdapter } from "../../src/lib/data/http";
import { createMemoryAdapter } from "../../src/lib/data/memory";
import { type TestApp, testApp } from "./helpers";

const invalid = <T>(input: unknown) => input as T;
for (const mode of ["memory", "http"] as const)
  describe(`${mode} data contract`, () => {
    let api: DataAdapter;
    let app: TestApp | undefined;
    beforeEach(async () => {
      if (mode === "http") {
        app = await testApp();
        const owner = await app.login();
        await app.workspace(owner);
        api = owner.api;
      } else
        api = createMemoryAdapter({
          members: [
            {
              id: "fixture-member",
              name: "Test Owner",
              email: "owner@example.test",
            },
          ],
        });
    });
    afterEach(async () => {
      await app?.close();
      app = undefined;
    });

    test("task statuses persist and completing in-progress tasks records completion", async () => {
      const task = await api.create("tasks", { title: "Status transitions" });
      expect(task.status).toBe("open");
      for (const status of [
        "in_progress",
        "completed",
        "canceled",
        "open",
      ] as const) {
        await api.update("tasks", task.id, { status });
        expect((await api.get("tasks", task.id)).status).toBe(status);
        if (status === "completed") {
          expect(
            (await api.listActivity("tasks", task.id)).map(
              (event) => event.type,
            ),
          ).toContain("completed");
        }
      }
      await expect(
        api.update("tasks", task.id, invalid({ status: "unknown" })),
      ).rejects.toMatchObject({ code: "validation" });
    });

    for (const kind of [
      "accounts",
      "contacts",
      "opportunities",
      "tasks",
    ] as const)
      test(`${kind}: CRUD, immutable copies, strict patches, notes and activity`, async () => {
        expect(await api.list(kind)).toEqual([]);
        const value = await api.create(
          kind,
          kind === "tasks" ? { title: "Follow up" } : { name: "Example" },
        );
        expect(value.id).toBeString();
        expect(value.createdAt).toBeString();
        expect((await api.get(kind, value.id)).id).toBe(value.id);
        const note = await api.addNote(kind, value.id, {
          content: "First note",
        });
        expect((await api.get(kind, value.id)).notes[0].id).toBe(note.id);
        await api.updateNote(kind, value.id, note.id, {
          content: "Edited note",
        });
        expect((await api.get(kind, value.id)).notes[0].content).toBe(
          "Edited note",
        );
        await api.update(
          kind,
          value.id,
          kind === "tasks" ? { status: "completed" } : { name: "Renamed" },
        );
        const events = await api.listActivity(kind, value.id);
        expect(events.map((e) => e.type)).toEqual([
          "created",
          "note_added",
          "note_updated",
          kind === "tasks" ? "completed" : "updated",
        ]);
        value.notes.push(note);
        expect((await api.get(kind, value.id)).notes).toHaveLength(1);
        await api.deleteNote(kind, value.id, note.id);
        await expect(
          api.updateNote(kind, value.id, note.id, { content: "Missing" }),
        ).rejects.toMatchObject({ code: "not_found" });
        await expect(
          api.update(kind, value.id, invalid({ id: "overwrite" })),
        ).rejects.toMatchObject({ code: "validation" });
        await api.delete(kind, value.id);
        expect(await api.list(kind)).toEqual([]);
        await expect(api.get(kind, value.id)).rejects.toMatchObject({
          code: "not_found",
        });
        await expect(api.listActivity(kind, value.id)).rejects.toMatchObject({
          code: "not_found",
        });
      });
    test("account profile fields round-trip, clear and survive unrelated patches", async () => {
      const account = await api.create("accounts", {
        name: "Fieldstone",
        industry: "Energy",
        revenue: 12500000,
        headcount: 84,
        location: "Minneapolis, MN",
        linkedin: "https://linkedin.com/company/fieldstone",
      });
      expect(await api.get("accounts", account.id)).toMatchObject({
        revenue: 12500000,
        headcount: 84,
        industry: "Energy",
      });
      await api.update("accounts", account.id, { name: "Fieldstone Energy" });
      expect(await api.get("accounts", account.id)).toMatchObject({
        revenue: 12500000,
        headcount: 84,
      });
      await api.update("accounts", account.id, {
        revenue: null,
        headcount: null,
        linkedin: "",
      });
      expect(await api.get("accounts", account.id)).toMatchObject({
        revenue: null,
        headcount: null,
        linkedin: "",
      });
      for (const input of [
        { revenue: -1 },
        { headcount: 1.5 },
        { instagram: "javascript:alert(1)" },
        { facebook: "bad-url" },
      ]) {
        await expect(
          api.update("accounts", account.id, input),
        ).rejects.toMatchObject({ code: "validation" });
      }
    });
    test("validation rejects malformed fields, enums, related IDs, and partial mutations roll back", async () => {
      for (const [kind, input] of [
        ["accounts", { name: " " }],
        ["accounts", { name: "X", website: "javascript:alert(1)" }],
        ["contacts", { name: "X", email: "invalid" }],
        ["opportunities", { name: "X", stage: "unknown" }],
        ["opportunities", { name: "X", amount: -1 }],
        ["tasks", { title: "X", dueDate: "2026-02-30" }],
        ["tasks", { title: "X", status: "unknown" }],
        ["contacts", { name: "X", accountId: "missing" }],
      ] as const)
        await expect(api.create(kind, invalid(input))).rejects.toMatchObject({
          code: "validation",
        });
      const [member] = await api.listMembers();
      const a = await api.create("accounts", {
        name: "A",
        website: "https://example.com",
        owner: { id: member.id, name: member.name },
      });
      const c = await api.create("contacts", { name: "C", accountId: a.id });
      await api.update("accounts", a.id, { name: "B" });
      expect(await api.get("accounts", a.id)).toMatchObject({
        website: a.website,
        owner: a.owner,
      });
      await expect(
        api.update("contacts", c.id, {
          name: "Bad change",
          accountId: "missing",
        }),
      ).rejects.toMatchObject({ code: "validation" });
      expect((await api.get("contacts", c.id)).name).toBe("C");
      expect(await api.listActivity("contacts", c.id)).toHaveLength(1);
      await expect(api.get("contacts", a.id)).rejects.toMatchObject({
        code: "not_found",
      });
    });
    test("relationships restrict deletes; intentional detachment permits deletion", async () => {
      const a = await api.create("accounts", { name: "A" });
      const c = await api.create("contacts", { name: "C", accountId: a.id });
      const o = await api.create("opportunities", {
        name: "O",
        accountId: a.id,
        contactIds: [c.id],
      });
      const t = await api.create("tasks", {
        title: "T",
        relatedRecords: [{ type: "opportunities", id: o.id }],
      });
      for (const [kind, id] of [
        ["accounts", a.id],
        ["contacts", c.id],
        ["opportunities", o.id],
      ] as [RecordKind, string][])
        await expect(api.delete(kind, id)).rejects.toMatchObject({
          code: "conflict",
        });
      await api.update("tasks", t.id, { relatedRecords: [] });
      await api.delete("opportunities", o.id);
      await api.update("contacts", c.id, { accountId: null });
      await api.delete("accounts", a.id);
      await api.delete("contacts", c.id);
      await expect(
        api.create("tasks", {
          title: "X",
          relatedRecords: [{ type: "tasks", id: t.id }],
        }),
      ).rejects.toMatchObject({ code: "validation" });
    });
    test("only existing members can own records and failed assignment changes roll back", async () => {
      const [member] = await api.listMembers();
      const account = await api.create("accounts", {
        name: "Account",
        owner: { id: member.id, name: "Forged display name" },
      });
      expect(account.owner?.name).toBe(member.name);
      const task = await api.create("tasks", {
        title: "Task",
        assignee: { id: member.id, name: member.name },
      });
      await api.update("tasks", task.id, { assignee: null });
      expect((await api.get("tasks", task.id)).assignee).toBeNull();
      await expect(
        api.update("accounts", account.id, {
          name: "Rolled back",
          owner: { id: "missing", name: "Missing" },
        }),
      ).rejects.toMatchObject({ code: "validation" });
      expect((await api.get("accounts", account.id)).name).toBe("Account");
      await api.delete("accounts", account.id);
      expect(await api.listMembers()).toHaveLength(1);
    });
    test("note ownership is enforced", async () => {
      const a = await api.create("accounts", { name: "A" });
      const b = await api.create("accounts", { name: "B" });
      const note = await api.addNote("accounts", a.id, { content: "Owned" });
      await expect(
        api.deleteNote("accounts", b.id, note.id),
      ).rejects.toMatchObject({ code: "not_found" });
      await api.delete("accounts", a.id);
      expect((await api.get("accounts", b.id)).notes).toEqual([]);
    });
    test("conversation CRUD, recents, ordering, partial finalization and ownership", async () => {
      const first = await api.createConversation({
        title: "First",
      });
      const second = await api.createConversation({ title: "Second" });
      await expect(
        api.createConversation(
          invalid({ title: "Legacy context", context: [] }),
        ),
      ).rejects.toMatchObject({ code: "validation" });
      const partial = await api.appendMessage(first.id, {
        id: "saved-partial",
        role: "assistant",
        blocks: [{ type: "text", text: "Working" }],
        status: "partial",
      });
      const next = await api.appendMessage(first.id, {
        role: "user",
        blocks: [{ type: "text", text: "Hello" }],
      });
      expect([partial.sequence, next.sequence]).toEqual([1, 2]);
      await api.updateMessage(first.id, partial.id, {
        blocks: [{ type: "text", text: "Done" }],
        status: "final",
      });
      expect(
        (await api.listMessages(first.id)).map((m) => [m.id, m.status]),
      ).toEqual([
        [partial.id, "final"],
        [next.id, "final"],
      ]);
      await api.updateMessage(first.id, partial.id, {
        blocks: [{ type: "text", text: "Kept final" }],
      });
      expect((await api.listMessages(first.id))[0].status).toBe("final");
      await expect(
        api.appendMessage(first.id, {
          id: partial.id,
          role: "user",
          blocks: [],
        }),
      ).rejects.toMatchObject({ code: "conflict" });
      await expect(
        api.updateMessage(second.id, partial.id, { status: "interrupted" }),
      ).rejects.toMatchObject({ code: "not_found" });
      await api.updateMessage(first.id, partial.id, { status: "interrupted" });
      await api.updateConversation(first.id, { title: "Renamed" });
      expect((await api.getConversation(first.id)).title).toBe("Renamed");
      expect((await api.listConversations())[0].id).toBe(first.id);
      await expect(
        api.updateConversation(first.id, {
          title: " ",
        }),
      ).rejects.toMatchObject({ code: "validation" });
      await api.deleteConversation(first.id);
      await expect(api.listMessages(first.id)).rejects.toMatchObject({
        code: "not_found",
      });
      expect((await api.listConversations()).map((c) => c.id)).toEqual([
        second.id,
      ]);
    });
    test("structured blocks are validated and record links restrict deletion", async () => {
      const a = await api.create("accounts", { name: "A" });
      const contact = await api.create("contacts", { name: "Contact" });
      const c = await api.createConversation({ title: "Chat" });
      for (const blocks of [
        [{ type: "unrecognized" }],
        [{ type: "text", text: 123 }],
        [{ type: "records", records: [{ type: "accounts", id: "missing" }] }],
        [
          {
            type: "mention",
            label: "Missing",
            reference: { type: "accounts", id: "missing" },
          },
        ],
        [
          {
            type: "mention",
            label: "Wrong kind",
            reference: { type: "contacts", id: a.id },
          },
        ],
      ])
        await expect(
          api.appendMessage(c.id, invalid({ role: "assistant", blocks })),
        ).rejects.toMatchObject({ code: "validation" });
      const message = await api.appendMessage(c.id, {
        role: "assistant",
        isDemo: true,
        blocks: [
          {
            type: "mention",
            label: a.name,
            reference: { type: "accounts", id: a.id },
          },
          { type: "records", records: [{ type: "accounts", id: a.id }] },
          { type: "table", columns: ["Name"], rows: [["A"]] },
          { type: "draft", title: "Draft", content: "Hello" },
          { type: "warning", text: "Sample" },
          { type: "error", text: "Unavailable", recoverable: true },
          { type: "progress", text: "Stopped", status: "interrupted" },
          {
            type: "confirmation",
            actionId: "action",
            text: "Confirm",
            records: [],
            status: "pending",
          },
          {
            type: "mutation_result",
            text: "Sample result",
            records: [],
            status: "partial_failure",
          },
        ],
      });
      expect((await api.listMessages(c.id))[0].blocks).toEqual(message.blocks);
      await expect(api.delete("accounts", a.id)).rejects.toMatchObject({
        code: "conflict",
      });
      await expect(
        api.updateMessage(c.id, message.id, {
          blocks: [
            {
              type: "mention",
              label: "Missing",
              reference: { type: "contacts", id: "missing" },
            },
          ],
        }),
      ).rejects.toMatchObject({ code: "validation" });
      expect((await api.listMessages(c.id))[0].blocks).toEqual(message.blocks);
      await api.updateMessage(c.id, message.id, {
        blocks: [
          {
            type: "mention",
            label: contact.name,
            reference: { type: "contacts", id: contact.id },
          },
        ],
      });
      await expect(api.delete("contacts", contact.id)).rejects.toMatchObject({
        code: "conflict",
      });
      await api.updateMessage(c.id, message.id, { blocks: [] });
      await api.delete("accounts", a.id);
      await api.delete("contacts", contact.id);
    });
  });

test("HTTP failures never fall back to memory", async () => {
  const api = createHttpAdapter("http://127.0.0.1:1/api", async () => {
    throw new Error("Offline");
  });
  await expect(api.list("accounts")).rejects.toMatchObject({
    code: "unavailable",
  });
  await expect(
    api.create("accounts", { name: "Unsaved" }),
  ).rejects.toBeInstanceOf(DataError);
});
