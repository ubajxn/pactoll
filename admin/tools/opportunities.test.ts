import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { opportunitySchema } from "../src/lib/data/contracts";
import { createMemoryAdapter } from "../src/lib/data/memory";
import {
  changeOpportunityStage,
  queryOpportunities,
  stageTotal,
} from "../src/lib/opportunities";

describe("opportunity pipeline", () => {
  test("opportunities only accept USD", () => {
    assert.equal(opportunitySchema.parse({ name: "Default" }).currency, "USD");
    assert.equal(
      opportunitySchema.safeParse({ name: "Other", currency: "EUR" }).success,
      false,
    );
  });
  test("search and AND filters select the same records used by table and board", async () => {
    const api = createMemoryAdapter({
      members: [
        { id: "test-member", name: "Alex", email: "alex@example.test" },
      ],
    });
    const [member] = await api.listMembers();
    const account = await api.create("accounts", { name: "Example Studio" });
    const first = await api.create("opportunities", {
      name: "Website",
      accountId: account.id,
      stage: "proposal",
      owner: { id: member.id, name: member.name },
    });
    await api.create("opportunities", {
      name: "Website renewal",
      accountId: account.id,
      stage: "won",
    });
    await api.create("opportunities", { name: "Other", stage: "proposal" });
    const params = new URLSearchParams({
      q: "studio",
      stage: "proposal",
      owner: member.id,
      account: account.id,
    });
    assert.deepEqual(
      queryOpportunities(
        await api.list("opportunities"),
        [account],
        params,
      ).map((record) => record.id),
      [first.id],
    );
    params.set("owner", "unassigned");
    assert.deepEqual(
      queryOpportunities(await api.list("opportunities"), [account], params),
      [],
    );
  });
  test("stage updates are optimistic and committed through the adapter", async () => {
    const api = createMemoryAdapter({
      members: [
        { id: "test-member", name: "Alex", email: "alex@example.test" },
      ],
    });
    const record = await api.create("opportunities", {
      name: "Example",
      amount: 1200,
    });
    const states: string[] = [];
    const result = await changeOpportunityStage(
      record,
      "won",
      async (id, stage) => {
        assert.deepEqual(states, ["won"]);
        return api.update("opportunities", id, { stage });
      },
      (next) => states.push(next.stage),
    );
    assert.deepEqual(states, ["won", "won"]);
    assert.equal((await api.get("opportunities", result.id)).stage, "won");
  });
  test("rejected callbacks roll back only the changed record and preserve parallel successes", async () => {
    const api = createMemoryAdapter({
      members: [
        { id: "test-member", name: "Alex", email: "alex@example.test" },
      ],
    });
    const first = await api.create("opportunities", { name: "First" });
    const second = await api.create("opportunities", { name: "Second" });
    const records = new Map([
      [first.id, first],
      [second.id, second],
    ]);
    let reject!: (error: Error) => void;
    const failure = changeOpportunityStage(
      first,
      "lost",
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
      (next) => {
        records.set(next.id, next);
      },
    );
    assert.equal(records.get(first.id)?.stage, "lost");
    await changeOpportunityStage(
      second,
      "won",
      (id, stage) => api.update("opportunities", id, { stage }),
      (next) => {
        records.set(next.id, next);
      },
    );
    reject(new Error("Injected failure"));
    await assert.rejects(failure, /Injected failure/);
    assert.deepEqual(records.get(first.id), first);
    assert.equal(records.get(second.id)?.stage, "won");
  });
  test("same-stage drops do not write and amounts total in USD", async () => {
    const api = createMemoryAdapter({
      members: [
        { id: "test-member", name: "Alex", email: "alex@example.test" },
      ],
    });
    const a = await api.create("opportunities", { name: "USD", amount: 100 });
    const b = await api.create("opportunities", {
      name: "Second opportunity",
      amount: 250,
    });
    await changeOpportunityStage(
      a,
      a.stage,
      () => {
        throw new Error("Must not write");
      },
      () => {
        throw new Error("Must not replace");
      },
    );
    assert.equal(a.currency, "USD");
    assert.equal(b.currency, "USD");
    assert.equal(stageTotal([a, b]), "$350.00");
    assert.equal(stageTotal([]), "$0.00");
  });
  test("close-date sorting keeps undated deals last in either direction", async () => {
    const api = createMemoryAdapter({
      members: [
        { id: "test-member", name: "Alex", email: "alex@example.test" },
      ],
    });
    const early = await api.create("opportunities", {
      name: "Early",
      closeDate: "2026-09-01",
    });
    const late = await api.create("opportunities", {
      name: "Late",
      closeDate: "2026-10-01",
    });
    const none = await api.create("opportunities", { name: "Undated" });
    const records = [none, late, early];
    assert.deepEqual(
      queryOpportunities(
        records,
        [],
        new URLSearchParams("sort=closeDate"),
      ).map((record) => record.id),
      [early.id, late.id, none.id],
    );
    assert.deepEqual(
      queryOpportunities(
        records,
        [],
        new URLSearchParams("sort=closeDate&direction=desc"),
      ).map((record) => record.id),
      [late.id, early.id, none.id],
    );
  });
});
