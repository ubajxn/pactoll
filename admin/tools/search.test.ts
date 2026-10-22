import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createMemoryAdapter } from "../src/lib/data/memory";
import { loadSearchRecords, matchesSearch } from "../src/lib/search";

describe("global record search", () => {
  test("loads all four types and finds names, email, phone and owners", async () => {
    const data = createMemoryAdapter({
      members: [
        { id: "test-member", name: "Morgan", email: "morgan@example.test" },
      ],
    });
    const [member] = await data.listMembers();
    const account = await data.create("accounts", {
      name: "Café North",
      website: "https://north.example",
      owner: { id: member.id, name: member.name },
    });
    await data.create("contacts", {
      name: "Avery Chen",
      email: "avery@north.example",
      phone: "+1 555 0100",
      accountId: account.id,
    });
    await data.create("opportunities", {
      name: "North renewal",
      stage: "proposal",
      accountId: account.id,
    });
    await data.create("tasks", { title: "Call Avery" });
    const records = await loadSearchRecords(data);
    assert.equal(new Set(records.map((record) => record.kind)).size, 4);
    for (const query of [
      "cafe",
      "  CAFE   MORGAN ",
      "avery@north.example",
      "555 0100",
      "proposal",
      "call avery",
    ]) {
      assert.ok(
        records.some((record) => matchesSearch(record.keywords, query)),
      );
    }
    assert.equal(
      records.filter((record) => matchesSearch(record.keywords, "avery"))
        .length,
      2,
    );
    assert.equal(
      records.filter((record) => matchesSearch(record.keywords, "nonexistent"))
        .length,
      0,
    );
  });
  test("handles empty data and refreshes after changes", async () => {
    const data = createMemoryAdapter({
      members: [
        { id: "test-member", name: "Morgan", email: "morgan@example.test" },
      ],
    });
    assert.deepEqual(await loadSearchRecords(data), []);
    const record = await data.create("tasks", { title: "First name" });
    await data.update("tasks", record.id, { title: "Updated name" });
    assert.equal((await loadSearchRecords(data))[0].title, "Updated name");
  });
  test("rejects unavailable data instead of presenting incomplete results", async () => {
    const data = createMemoryAdapter({
      members: [
        { id: "test-member", name: "Morgan", email: "morgan@example.test" },
      ],
    });
    data.list = async () => {
      throw new Error("offline");
    };
    await assert.rejects(loadSearchRecords(data), /offline/);
  });
  test("finds record fields and related names, and distinguishes same-name records", async () => {
    const data = createMemoryAdapter({
      members: [
        { id: "test-member", name: "Morgan", email: "morgan@example.test" },
      ],
    });
    const account = await data.create("accounts", {
      name: "Café North",
      industry: "Manufacturing",
      location: "Berlin",
    });
    const contact = await data.create("contacts", {
      name: "Avery Chen",
      role: "Operations lead",
      accountId: account.id,
    });
    const opportunity = await data.create("opportunities", {
      name: "Annual renewal",
      accountId: account.id,
      contactIds: [contact.id],
      nextStep: "Send revised pricing",
      closeDate: "2026-10-01",
    });
    const other = await data.create("opportunities", {
      name: "Annual renewal",
    });
    const task = await data.create("tasks", {
      title: "Follow up",
      dueDate: "2026-09-30",
      relatedRecords: [{ type: "opportunities", id: opportunity.id }],
    });
    const records = await loadSearchRecords(data);
    const find = (query: string) =>
      records
        .filter((record) => matchesSearch(record.keywords, query))
        .map((record) => record.id);
    assert.deepEqual(find("account manufacturing berlin"), [account.id]);
    assert.deepEqual(find("contact cafe north operations"), [contact.id]);
    assert.deepEqual(find("opportunity cafe north"), [opportunity.id]);
    assert.deepEqual(find("opportunities cafe north avery"), [opportunity.id]);
    assert.deepEqual(find("revised pricing 2026-10-01"), [opportunity.id]);
    assert.deepEqual(find("tasks annual renewal"), [task.id]);
    assert.deepEqual(find("2026-09-30"), [task.id]);
    assert.deepEqual(find(task.id), [task.id]);
    const opportunityResult = records.find(
      (record) => record.id === opportunity.id,
    );
    assert.ok(opportunityResult);
    assert.equal(opportunityResult.subtitle, "Café North");
    assert.notEqual(
      opportunityResult.subtitle,
      records.find((record) => record.id === other.id)?.subtitle,
    );

    await data.update("accounts", account.id, { name: "New account name" });
    const refreshed = await loadSearchRecords(data);
    const contactResult = refreshed.find((record) => record.id === contact.id);
    assert.ok(contactResult);
    assert.ok(matchesSearch(contactResult.keywords, "new account name"));
    assert.ok(!matchesSearch(contactResult.keywords, "cafe north"));
  });
});
