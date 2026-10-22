import assert from "node:assert/strict";
import { test } from "node:test";
import { mentionSuggestions } from "../../src/lib/chat/mentions";
import { createMemoryAdapter } from "../../src/lib/data/memory";
import { loadSearchRecords } from "../../src/lib/search";

test("mentions sort by last edit before limiting results, including filtered matches", async () => {
  const data = createMemoryAdapter();
  for (let index = 0; index < 14; index++) {
    await data.create("accounts", {
      name: `${String.fromCharCode(65 + index)} company`,
    });
  }
  const records = (await loadSearchRecords(data)).map((record, index) => ({
    ...record,
    updatedAt: `2026-09-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
  }));
  for (const query of ["", "company"]) {
    const suggestions = mentionSuggestions(records, query);
    assert.equal(suggestions.length, 12);
    assert.equal(suggestions[0].title, "N company");
    assert.equal(suggestions.at(-1)?.title, "C company");
  }
  records[0].updatedAt = "2026-09-30T00:00:00.000Z";
  assert.equal(mentionSuggestions(records, "")[0].title, "A company");
  assert.equal(records[0].title, "A company");
});

test("mention associations contain only linked companies and opportunities", async () => {
  const data = createMemoryAdapter();
  const company = await data.create("accounts", {
    name: "Cedar Works",
    website: "https://cedar.example",
  });
  const contact = await data.create("contacts", {
    name: "Avery Chen",
    email: "avery@cedar.example",
    accountId: company.id,
  });
  const opportunity = await data.create("opportunities", {
    name: "Renewal",
    accountId: company.id,
    contactIds: [contact.id],
    stage: "proposal",
  });
  const task = await data.create("tasks", {
    title: "Follow up",
    relatedRecords: [
      { type: "accounts", id: company.id },
      { type: "contacts", id: contact.id },
      { type: "opportunities", id: opportunity.id },
    ],
  });
  const records = await loadSearchRecords(data);
  const associations = (id: string) =>
    records.find((record) => record.id === id)?.associatedNames;
  assert.deepEqual(associations(company.id), []);
  assert.deepEqual(associations(contact.id), ["Cedar Works"]);
  assert.deepEqual(associations(opportunity.id), ["Cedar Works"]);
  assert.deepEqual(associations(task.id), ["Cedar Works", "Renewal"]);
  // Search shows the primary association and keeps contacts searchable.
  assert.equal(
    records.find((record) => record.id === opportunity.id)?.subtitle,
    "Cedar Works",
  );
});
