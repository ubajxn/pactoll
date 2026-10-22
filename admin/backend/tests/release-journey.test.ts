import { expect, test } from "bun:test";
import { searchRecords } from "../../src/lib/chat/tools";
import type { DataAdapter } from "../../src/lib/data/contracts";
import { createMemoryAdapter } from "../../src/lib/data/memory";
import { isOverdueTask, taskMatchesStatusFilter } from "../../src/lib/tasks";
import { testApp } from "./helpers";

async function salesJourney(data: DataAdapter) {
  for (const kind of [
    "accounts",
    "contacts",
    "opportunities",
    "tasks",
  ] as const)
    expect(await data.list(kind)).toEqual([]);

  const account = await data.create("accounts", { name: "Release account" });
  const contact = await data.create("contacts", {
    name: "Release contact",
    accountId: account.id,
  });
  const opportunity = await data.create("opportunities", {
    name: "Release opportunity",
    accountId: account.id,
    contactIds: [contact.id],
    stage: "qualification",
  });
  const task = await data.create("tasks", {
    title: "Release follow-up",
    dueDate: "2026-09-24",
    relatedRecords: [
      { type: "accounts", id: account.id },
      { type: "contacts", id: contact.id },
      { type: "opportunities", id: opportunity.id },
    ],
  });

  expect((await data.get("contacts", contact.id)).accountId).toBe(account.id);
  expect((await data.get("opportunities", opportunity.id)).contactIds).toEqual([
    contact.id,
  ]);
  expect((await data.get("tasks", task.id)).relatedRecords).toContainEqual({
    type: "opportunities",
    id: opportunity.id,
  });
  expect(
    (
      await searchRecords(data, { query: account.name, kind: "opportunities" })
    ).results.map((result) => result.reference.id),
  ).toContain(opportunity.id);
  expect(isOverdueTask(task, "2026-09-25")).toBe(true);
  expect(taskMatchesStatusFilter(task, null)).toBe(true);

  await data.update("opportunities", opportunity.id, { stage: "won" });
  expect((await data.get("opportunities", opportunity.id)).stage).toBe("won");
  await data.update("tasks", task.id, { status: "completed" });
  const completed = await data.get("tasks", task.id);
  expect(isOverdueTask(completed, "2026-09-25")).toBe(false);
  expect(taskMatchesStatusFilter(completed, null)).toBe(false);
  expect(taskMatchesStatusFilter(completed, "completed")).toBe(true);
  return { account, contact, opportunity, task };
}

test("empty authenticated installation supports the full sales follow-up journey", async () => {
  const app = await testApp();
  try {
    const owner = await app.login(
      "release-owner@example.test",
      "Release Owner",
    );
    const context = await app.workspace(owner, "Release Company");
    expect(context.workspace.name).toBe("Release Company");
    expect(
      (await owner.api.listMembers()).map((member) => member.name),
    ).toEqual(["Release Owner"]);
    const records = await salesJourney(owner.api);
    await app.restart();
    expect(
      (await owner.api.get("opportunities", records.opportunity.id)).stage,
    ).toBe("won");
    expect((await owner.api.get("tasks", records.task.id)).status).toBe(
      "completed",
    );
  } finally {
    await app.close();
  }
});

test("isolated memory fixture follows the same release journey", async () => {
  await salesJourney(createMemoryAdapter());
});
