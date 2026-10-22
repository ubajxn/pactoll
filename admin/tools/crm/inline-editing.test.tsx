import "./dom";
import { afterEach, describe, mock, test } from "bun:test";
import assert from "node:assert/strict";
import { type ReactNode, useState } from "react";
import { RecordForm } from "../../src/components/crm/create-record";
import {
  DetailOverlay,
  DetailOverlayProvider,
  DetailOverlaySlot,
  RecordDetailPanel,
} from "../../src/components/crm/detail-overlay";
import { DetailPage } from "../../src/components/crm/detail-page";
import { DetailSurface } from "../../src/components/crm/detail-surface";
import { InlineRecordFields } from "../../src/components/crm/inline-record-fields";
import {
  PageHeaderProvider,
  PageHeaderSlot,
} from "../../src/components/crm/page-header";
import { RecordDetails } from "../../src/components/crm/record-details";
import type {
  Account,
  DataAdapter,
  RecordKind,
  Records,
  Task,
} from "../../src/lib/data/contracts";
import { DataError } from "../../src/lib/data/contracts";
import { createMemoryAdapter } from "../../src/lib/data/memory";
import { DataProvider } from "../../src/lib/data/provider";
import {
  blur,
  byText,
  changeValue,
  cleanupDom,
  click,
  deferred,
  dispatchKey,
  flush,
  mount,
  mouseDown,
  settle,
  waitFor,
} from "./dom";

let detailSearch = "";

mock.module("next/navigation", () => ({
  usePathname: () => "/tasks",
  useSearchParams: () => new URLSearchParams(detailSearch),
  useRouter: () => ({ replace() {}, back() {} }),
}));

afterEach(async () => {
  detailSearch = "";
  await cleanupDom();
});

function detailPage(adapter: DataAdapter, kind: RecordKind, id: string) {
  return (
    <DataProvider adapter={adapter}>
      <PageHeaderProvider>
        <header>
          <PageHeaderSlot />
        </header>
        <DetailPage kind={kind} id={id} />
      </PageHeaderProvider>
    </DataProvider>
  );
}

test("standalone details render every record type without an overlay and update breadcrumbs on save", async () => {
  detailSearch = "q=kept&view=table";
  const data = createMemoryAdapter();
  const records = [
    ["accounts", await data.create("accounts", { name: "Account" })],
    ["contacts", await data.create("contacts", { name: "Contact" })],
    [
      "opportunities",
      await data.create("opportunities", { name: "Opportunity" }),
    ],
    ["tasks", await data.create("tasks", { title: "Task" })],
  ] as const;
  for (const [kind, record] of records) {
    const view = await mount(detailPage(data, kind, record.id));
    await waitFor(
      () => Boolean(document.querySelector("[data-record-page] input")),
      "record did not load",
    );
    assert.equal(document.querySelector("[data-record-detail]"), null);
    assert.equal(document.querySelector("table"), null);
    const breadcrumb = document.querySelector('nav[aria-label="Breadcrumb"]');
    assert.equal(
      breadcrumb?.querySelector("a")?.getAttribute("href"),
      `/${kind}?q=kept&view=table`,
    );
    const name = document.querySelector<HTMLInputElement>("input[type=text]");
    assert.ok(name);
    name.focus();
    await changeValue(name, `Renamed ${kind}`);
    await blur(name);
    await waitFor(
      () => breadcrumb?.querySelector("h1")?.textContent === `Renamed ${kind}`,
      "breadcrumb did not reflect saved title",
    );
    await view.unmount();
  }
});

test("record and task detail saves keep the active scroll position", async () => {
  const data = createMemoryAdapter();
  const account = await data.create("accounts", { name: "Account" });
  const task = await data.create("tasks", { title: "Task" });

  for (const [kind, record, panel] of [
    ["accounts", account, false],
    ["tasks", task, true],
  ] as const) {
    let scroller: HTMLElement;
    let saved = false;
    const details = (
      <RecordDetails
        kind={kind}
        record={record}
        onUpdated={() => {
          // A surrounding collection may update while the save completes.
          scroller.scrollTop = 0;
          saved = true;
        }}
      />
    );
    const view = await mount(
      <DataProvider adapter={data}>
        {panel ? (
          <DetailSurface toolbar={<span>Task</span>}>{details}</DetailSurface>
        ) : (
          <main id="main-content">{details}</main>
        )}
      </DataProvider>,
    );
    const scrollElement = document.querySelector<HTMLElement>(
      panel ? "[data-detail-scroll]" : "#main-content",
    );
    assert.ok(scrollElement);
    scroller = scrollElement;
    scroller.scrollTop = 184;

    const title =
      document.querySelector<HTMLInputElement>('input[type="text"]');
    assert.ok(title);
    title.focus();
    await changeValue(title, `Updated ${kind}`);
    await blur(title);
    await waitFor(
      () => saved && scroller.scrollTop === 184,
      `${kind} detail scroll was not restored after saving`,
    );
    assert.equal(title.value, `Updated ${kind}`);
    await view.unmount();
  }
});

test("standalone details retain their shell while loading, failing, retrying and reporting missing records", async () => {
  const data = createMemoryAdapter();
  const record = await data.create("accounts", { name: "Recovered account" });
  const request = deferred<Account>();
  let calls = 0;
  const adapter: DataAdapter = {
    ...data,
    get: (() =>
      ++calls === 1
        ? request.promise
        : Promise.resolve(record)) as DataAdapter["get"],
  };
  const view = await mount(detailPage(adapter, "accounts", record.id));
  assert.equal(
    document.querySelector("[data-page-header] h1")?.textContent,
    "Loading record…",
  );
  await settle(() => request.reject(new Error("offline")));
  assert.match(
    document.querySelector('[role="alert"]')?.textContent ?? "",
    /Try again/,
  );
  const retry = Array.from(document.querySelectorAll("button")).find(
    (button) => button.textContent === "Retry",
  );
  assert.ok(retry);
  await click(retry);
  await waitFor(
    () =>
      document.querySelector("[data-page-header] h1")?.textContent ===
      record.name,
    "retry did not load the record",
  );
  await view.unmount();

  const missing: DataAdapter = {
    ...data,
    get: async () => {
      throw new DataError("not_found", "Record not found");
    },
  };
  await mount(detailPage(missing, "contacts", "missing"));
  assert.equal(
    document.querySelector("[data-page-header] h1")?.textContent,
    "Record not found",
  );
  assert.match(
    document.querySelector("[data-record-page]")?.textContent ?? "",
    /Back to Contacts/,
  );
});

async function fixture() {
  const data = createMemoryAdapter({
    members: [{ id: "member", name: "Alex", email: "alex@example.test" }],
  });
  const account = await data.create("accounts", { name: "Alpha" });
  const second = await data.create("accounts", { name: "Beta" });
  const third = await data.create("accounts", { name: "Gamma" });
  const opportunity = await data.create("opportunities", {
    name: "Deal",
    nextStep: "Initial step",
  });
  const task = await data.create("tasks", { title: "Follow up" });
  return { data, account, second, third, opportunity, task };
}

function InlineHarness({
  adapter,
  initial,
}: {
  adapter: DataAdapter;
  initial: Records[keyof Records];
}) {
  const [record, setRecord] = useState(initial);
  const kind =
    "industry" in record
      ? "accounts"
      : "email" in record
        ? "contacts"
        : "stage" in record
          ? "opportunities"
          : "tasks";
  return (
    <DataProvider adapter={adapter}>
      <InlineRecordFields kind={kind} record={record} onUpdated={setRecord} />
    </DataProvider>
  );
}

function inlineTrigger(field: string) {
  return document.querySelector<HTMLElement>(`button[id$='-${field}']`);
}

function inlinePickerValue(field: string) {
  return inlineTrigger(field)?.parentElement?.textContent ?? "";
}

function inlineOption(label: string) {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[role="option"]'),
  ).find((option) => option.textContent?.trim() === label);
}

async function selectInlineOption(field: string, label: string) {
  const trigger = inlineTrigger(field);
  assert.ok(trigger);
  await click(trigger);
  await waitFor(
    () => Boolean(inlineOption(label)),
    `${label} option did not open`,
  );
  const option = inlineOption(label);
  assert.ok(option);
  await click(option);
}

describe("inline record editing", () => {
  test("populated record relationships expose canonical links beside their edit control", async () => {
    const data = createMemoryAdapter();
    const account = await data.create("accounts", { name: "Cedar Works" });
    const contact = await data.create("contacts", {
      name: "Avery Chen",
      accountId: account.id,
    });
    const opportunity = await data.create("opportunities", {
      name: "Expansion",
      accountId: account.id,
      contactIds: [contact.id],
    });
    const task = await data.create("tasks", {
      title: "Follow up",
      relatedRecords: [{ type: "opportunities", id: opportunity.id }],
    });
    for (const [record, name, href, field] of [
      [contact, "Cedar Works", `/accounts/${account.id}`, "accountId"],
      [opportunity, "Avery Chen", `/contacts/${contact.id}`, "contactIds"],
      [task, "Expansion", `/opportunities/${opportunity.id}`, "relatedRecords"],
    ] as const) {
      const view = await mount(
        <InlineHarness adapter={data} initial={record} />,
      );
      await waitFor(
        () => Boolean(document.querySelector(`a[href='${href}']`)),
        `${name} link did not render`,
      );
      assert.ok(
        document
          .querySelector(`a[href='${href}']`)
          ?.textContent?.includes(name),
      );
      assert.ok(inlineTrigger(field));
      await view.unmount();
    }
  });

  test("Escape cancels input and textarea drafts without saving or closing the overlay", async () => {
    const { data, opportunity } = await fixture();
    let writes = 0;
    let closes = 0;
    const adapter: DataAdapter = {
      ...data,
      update: async (...args) => {
        writes++;
        return data.update(...args);
      },
    };
    const view = await mount(
      <DataProvider adapter={adapter}>
        <DetailOverlayProvider>
          <DetailOverlaySlot />
          <DetailOverlay onClose={() => closes++}>
            <InlineRecordFields
              kind="opportunities"
              record={opportunity}
              onUpdated={() => {}}
            />
          </DetailOverlay>
        </DetailOverlayProvider>
      </DataProvider>,
    );
    await waitFor(
      () => !document.querySelector("[aria-busy='true']"),
      "relationship choices did not load",
    );
    const name = document.querySelector<HTMLInputElement>('input[type="text"]');
    const textarea = document.querySelector<HTMLTextAreaElement>("textarea");
    assert.ok(name);
    assert.ok(textarea);

    name.focus();
    await changeValue(name, "Changed deal");
    const inputEscape = await dispatchKey(name, "Escape");
    textarea.focus();
    await changeValue(textarea, "Changed step");
    const textareaEscape = await dispatchKey(textarea, "Escape");
    await flush();

    assert.equal(inputEscape.defaultPrevented, true);
    assert.equal(textareaEscape.defaultPrevented, true);
    assert.equal(name.value, "Deal");
    assert.equal(textarea.value, "Initial step");
    assert.equal(writes, 0);
    assert.equal(closes, 0);
    await view.unmount();
  });

  test("blur and Enter save text and textarea values", async () => {
    const { data, account, opportunity } = await fixture();
    const calls: Array<{ id: string; input: object }> = [];
    const adapter: DataAdapter = {
      ...data,
      update: async (kind, id, input) => {
        calls.push({ id, input });
        return data.update(kind, id, input);
      },
    };
    let view = await mount(
      <InlineHarness adapter={adapter} initial={account} />,
    );
    const name = document.querySelector<HTMLInputElement>('input[type="text"]');
    assert.ok(name);
    name.focus();
    await changeValue(name, "Renamed by Enter");
    await dispatchKey(name, "Enter");
    await waitFor(() => calls.length === 1, "Enter did not save");
    assert.deepEqual(calls[0], {
      id: account.id,
      input: { name: "Renamed by Enter" },
    });
    await view.unmount();

    view = await mount(
      <InlineHarness adapter={adapter} initial={opportunity} />,
    );
    const textarea = document.querySelector<HTMLTextAreaElement>("textarea");
    assert.ok(textarea);
    textarea.focus();
    await changeValue(textarea, "Saved on blur");
    await blur(textarea);
    await waitFor(() => calls.length === 2, "blur did not save textarea");
    assert.deepEqual(calls[1], {
      id: opportunity.id,
      input: { nextStep: "Saved on blur" },
    });
    await view.unmount();
  });

  test("an earlier save acknowledgement preserves a newer unsaved draft", async () => {
    const { data, account } = await fixture();
    const first = deferred<Account>();
    const calls: object[] = [];
    const adapter: DataAdapter = {
      ...data,
      update: (async (kind, id, input) => {
        calls.push(input);
        if (calls.length === 1) return first.promise;
        return data.update(kind, id, input);
      }) as DataAdapter["update"],
    };
    const view = await mount(
      <InlineHarness adapter={adapter} initial={account} />,
    );
    const name = document.querySelector<HTMLInputElement>('input[type="text"]');
    assert.ok(name);
    name.focus();
    await changeValue(name, "Submitted A");
    await blur(name);
    await waitFor(() => calls.length === 1, "first save did not start");
    name.focus();
    await changeValue(name, "Draft B");

    await settle(() => first.resolve({ ...account, name: "Submitted A" }));
    assert.equal(name.value, "Draft B");
    await view.unmount();
  });

  for (const control of ["input", "textarea"] as const) {
    test(`${control} keeps a deliberate edit back to the previous committed value`, async () => {
      const { data, account, opportunity } = await fixture();
      const initial =
        control === "input"
          ? { ...account, name: "Original" }
          : { ...opportunity, nextStep: "Original" };
      const first = deferred<Records[RecordKind]>();
      const calls: object[] = [];
      const adapter: DataAdapter = {
        ...data,
        update: ((kind, id, input) => {
          calls.push(input);
          if (calls.length === 1) return first.promise;
          return data.update(kind, id, input);
        }) as DataAdapter["update"],
      };
      const view = await mount(
        <InlineHarness adapter={adapter} initial={initial} />,
      );
      const field = document.querySelector<
        HTMLInputElement | HTMLTextAreaElement
      >(control === "input" ? 'input[type="text"]' : "textarea");
      assert.ok(field);
      field.focus();
      await changeValue(field, "Submitted");
      await blur(field);
      await waitFor(() => calls.length === 1, "first save did not start");
      field.focus();
      await changeValue(field, "Original");

      const saved =
        control === "input"
          ? await data.update("accounts", initial.id, { name: "Submitted" })
          : await data.update("opportunities", initial.id, {
              nextStep: "Submitted",
            });
      await settle(() => first.resolve(saved));

      assert.equal(field.value, "Original");
      assert.equal(calls.length, 1);
      const persisted = await data.get(
        control === "input" ? "accounts" : "opportunities",
        initial.id,
      );
      assert.equal(
        control === "input"
          ? (persisted as Account).name
          : (persisted as typeof opportunity).nextStep,
        "Submitted",
      );
      await view.unmount();
    });

    test(`${control} queues a blurred edit back to the previous committed value`, async () => {
      const { data, account, opportunity } = await fixture();
      const initial =
        control === "input"
          ? { ...account, name: "Original" }
          : { ...opportunity, nextStep: "Original" };
      const first = deferred<Records[RecordKind]>();
      const calls: object[] = [];
      const adapter: DataAdapter = {
        ...data,
        update: ((kind, id, input) => {
          calls.push(input);
          if (calls.length === 1) return first.promise;
          return data.update(kind, id, input);
        }) as DataAdapter["update"],
      };
      const view = await mount(
        <InlineHarness adapter={adapter} initial={initial} />,
      );
      const field = document.querySelector<
        HTMLInputElement | HTMLTextAreaElement
      >(control === "input" ? 'input[type="text"]' : "textarea");
      assert.ok(field);
      field.focus();
      await changeValue(field, "Submitted");
      await blur(field);
      await waitFor(() => calls.length === 1, "first save did not start");
      field.focus();
      await changeValue(field, "Original");
      await blur(field);
      assert.equal(calls.length, 1);

      const saved =
        control === "input"
          ? await data.update("accounts", initial.id, { name: "Submitted" })
          : await data.update("opportunities", initial.id, {
              nextStep: "Submitted",
            });
      await settle(() => first.resolve(saved));
      await waitFor(() => calls.length === 2, "second save was not queued");
      await waitFor(
        () => field.getAttribute("aria-busy") === "false",
        "second save did not settle",
      );

      assert.equal(field.value, "Original");
      assert.deepEqual(calls, [
        control === "input" ? { name: "Submitted" } : { nextStep: "Submitted" },
        control === "input" ? { name: "Original" } : { nextStep: "Original" },
      ]);
      const persisted = await data.get(
        control === "input" ? "accounts" : "opportunities",
        initial.id,
      );
      assert.equal(
        control === "input"
          ? (persisted as Account).name
          : (persisted as typeof opportunity).nextStep,
        "Original",
      );
      await view.unmount();
    });
  }

  test("an old record save cannot replace the newly selected record", async () => {
    const { data, account, second } = await fixture();
    const save = deferred<Account>();
    const adapter: DataAdapter = {
      ...data,
      update: (() => save.promise) as DataAdapter["update"],
    };
    const shell = (id: string) => (
      <DataProvider adapter={adapter}>
        <DetailOverlayProvider>
          <DetailOverlaySlot />
          <RecordDetailPanel kind="accounts" id={id} onClose={() => {}} />
        </DetailOverlayProvider>
      </DataProvider>
    );
    const view = await mount(shell(account.id));
    await waitFor(
      () => document.body.textContent?.includes("Alpha") ?? false,
      "first record did not load",
    );
    const name = document.querySelector<HTMLInputElement>('input[type="text"]');
    assert.ok(name);
    name.focus();
    await changeValue(name, "Late Alpha");
    await blur(name);
    await view.rerender(shell(second.id));
    await waitFor(
      () => document.body.textContent?.includes("Beta") ?? false,
      "second record did not load",
    );
    await settle(() => save.resolve({ ...account, name: "Late Alpha" }));
    assert.match(document.body.textContent ?? "", /Beta/);
    assert.doesNotMatch(document.body.textContent ?? "", /Late Alpha/);
    await view.unmount();
  });

  test("a failed earlier choice does not roll back a newer selection", async () => {
    const { data, task } = await fixture();
    const first = deferred<Task>();
    const second = deferred<Task>();
    let writes = 0;
    const adapter: DataAdapter = {
      ...data,
      update: (() =>
        ++writes === 1
          ? first.promise
          : second.promise) as DataAdapter["update"],
    };
    const view = await mount(
      <InlineHarness adapter={adapter} initial={task} />,
    );
    await waitFor(
      () =>
        !document.querySelector("button[disabled][aria-labelledby*='status']"),
      "status field did not become ready",
    );
    const trigger = document.querySelector<HTMLElement>(
      "button[aria-labelledby*='status']",
    );
    assert.ok(trigger);
    await click(trigger);
    await waitFor(
      () => Boolean(byText("In progress")),
      `choice menu did not open: ${trigger.outerHTML}`,
    );
    const inProgress = byText("In progress");
    assert.ok(inProgress);
    await click(inProgress);
    await click(trigger);
    await waitFor(() => Boolean(byText("Done")), "choice menu did not reopen");
    const done = byText("Done");
    assert.ok(done);
    await click(done);
    assert.match(trigger.textContent ?? "", /Done/);

    await settle(() => first.reject(new Error("Injected failure")));
    await waitFor(() => writes === 2, "second choice save did not start");
    assert.match(trigger.textContent ?? "", /Done/);
    await settle(() => second.resolve({ ...task, status: "completed" }));
    await view.unmount();
  });

  test("a failed earlier picker save does not roll back a newer selection", async () => {
    const { data, account, second, third } = await fixture();
    const contact = await data.create("contacts", {
      name: "Contact",
      accountId: account.id,
    });
    const first = deferred<typeof contact>();
    const next = deferred<typeof contact>();
    let writes = 0;
    const adapter: DataAdapter = {
      ...data,
      update: (() =>
        ++writes === 1 ? first.promise : next.promise) as DataAdapter["update"],
    };
    const view = await mount(
      <InlineHarness adapter={adapter} initial={contact} />,
    );
    const trigger = inlineTrigger("accountId");
    assert.ok(trigger);
    await waitFor(
      () => !trigger.hasAttribute("disabled"),
      "picker did not load",
    );
    await click(trigger);
    await waitFor(
      () => Boolean(byText(second.name)),
      `picker did not open: ${trigger.outerHTML}`,
    );
    const beta = byText(second.name);
    assert.ok(beta);
    await click(beta);
    await click(trigger);
    await waitFor(() => Boolean(byText(third.name)), "picker did not reopen");
    const gamma = byText(third.name);
    assert.ok(gamma);
    await click(gamma);
    assert.match(inlinePickerValue("accountId"), /Gamma/);

    await settle(() => first.reject(new Error("Injected failure")));
    await waitFor(() => writes === 2, "second picker save did not start");
    assert.match(inlinePickerValue("accountId"), /Gamma/);
    await settle(() => next.resolve({ ...contact, accountId: third.id }));
    await view.unmount();
  });

  test("a reverted choice survives an older success and then succeeds or rolls back on its own result", async () => {
    for (const finalResult of ["success", "failure"] as const) {
      const { data, task } = await fixture();
      const first = deferred<Task>();
      const second = deferred<Task>();
      let writes = 0;
      const adapter: DataAdapter = {
        ...data,
        update: (() =>
          ++writes === 1
            ? first.promise
            : second.promise) as DataAdapter["update"],
      };
      const view = await mount(
        <InlineHarness adapter={adapter} initial={task} />,
      );

      await selectInlineOption("status", "In progress");
      await selectInlineOption("status", "Todo");
      assert.match(inlineTrigger("status")?.textContent ?? "", /Todo/);

      await settle(() => first.resolve({ ...task, status: "in_progress" }));
      await waitFor(() => writes === 2, "reverted choice save did not start");
      assert.match(inlineTrigger("status")?.textContent ?? "", /Todo/);

      if (finalResult === "success") {
        await settle(() => second.resolve({ ...task, status: "open" }));
        assert.match(inlineTrigger("status")?.textContent ?? "", /Todo/);
      } else {
        await settle(() => second.reject(new Error("Injected failure")));
        assert.match(inlineTrigger("status")?.textContent ?? "", /In progress/);
        assert.match(document.body.textContent ?? "", /Could not save/);
      }
      await view.unmount();
    }
  });

  test("a reverted relationship survives an older success and then succeeds or rolls back on its own result", async () => {
    for (const finalResult of ["success", "failure"] as const) {
      const { data, account, second } = await fixture();
      const contact = await data.create("contacts", {
        name: "Contact",
        accountId: account.id,
      });
      const first = deferred<typeof contact>();
      const reverted = deferred<typeof contact>();
      let writes = 0;
      const adapter: DataAdapter = {
        ...data,
        update: (() =>
          ++writes === 1
            ? first.promise
            : reverted.promise) as DataAdapter["update"],
      };
      const view = await mount(
        <InlineHarness adapter={adapter} initial={contact} />,
      );
      await waitFor(
        () => !inlineTrigger("accountId")?.hasAttribute("disabled"),
        "account picker did not load",
      );

      await selectInlineOption("accountId", second.name);
      await selectInlineOption("accountId", account.name);
      assert.match(inlinePickerValue("accountId"), /Alpha/);

      await settle(() => first.resolve({ ...contact, accountId: second.id }));
      await waitFor(() => writes === 2, "reverted picker save did not start");
      assert.match(inlinePickerValue("accountId"), /Alpha/);

      if (finalResult === "success") {
        await settle(() =>
          reverted.resolve({ ...contact, accountId: account.id }),
        );
        assert.match(inlinePickerValue("accountId"), /Alpha/);
      } else {
        await settle(() => reverted.reject(new Error("Injected failure")));
        assert.match(inlinePickerValue("accountId"), /Beta/);
        assert.match(document.body.textContent ?? "", /Could not save/);
      }
      await view.unmount();
    }
  });

  test("batched choice acknowledgements do not block a later external update", async () => {
    const { data, task } = await fixture();
    const first = deferred<Task>();
    const second = deferred<Task>();
    let writes = 0;
    let replaceRecord!: (record: Task) => void;
    const adapter: DataAdapter = {
      ...data,
      update: (() =>
        ++writes === 1
          ? first.promise
          : second.promise) as DataAdapter["update"],
    };
    function Harness() {
      const [record, setRecord] = useState(task);
      replaceRecord = setRecord;
      return (
        <DataProvider adapter={adapter}>
          <InlineRecordFields
            kind="tasks"
            record={record}
            onUpdated={(updated) => setRecord(updated as Task)}
          />
        </DataProvider>
      );
    }
    const view = await mount(<Harness />);

    await selectInlineOption("status", "In progress");
    await selectInlineOption("status", "Todo");
    await settle(() => {
      first.resolve({ ...task, status: "in_progress" });
      second.resolve({ ...task, status: "open" });
    });
    await waitFor(() => writes === 2, "batched choice writes did not settle");
    assert.match(inlineTrigger("status")?.textContent ?? "", /Todo/);

    await settle(() => replaceRecord({ ...task, status: "completed" }));
    assert.match(inlineTrigger("status")?.textContent ?? "", /Done/);
    await view.unmount();
  });

  test("batched picker acknowledgements do not block a later external update", async () => {
    const { data, account, second, third } = await fixture();
    const contact = await data.create("contacts", {
      name: "Contact",
      accountId: account.id,
    });
    const first = deferred<typeof contact>();
    const reverted = deferred<typeof contact>();
    let writes = 0;
    let replaceRecord!: (record: typeof contact) => void;
    const adapter: DataAdapter = {
      ...data,
      update: (() =>
        ++writes === 1
          ? first.promise
          : reverted.promise) as DataAdapter["update"],
    };
    function Harness() {
      const [record, setRecord] = useState(contact);
      replaceRecord = setRecord;
      return (
        <DataProvider adapter={adapter}>
          <InlineRecordFields
            kind="contacts"
            record={record}
            onUpdated={(updated) => setRecord(updated as typeof contact)}
          />
        </DataProvider>
      );
    }
    const view = await mount(<Harness />);
    await waitFor(
      () => !inlineTrigger("accountId")?.hasAttribute("disabled"),
      "account picker did not load",
    );

    await selectInlineOption("accountId", second.name);
    await selectInlineOption("accountId", account.name);
    await settle(() => {
      first.resolve({ ...contact, accountId: second.id });
      reverted.resolve({ ...contact, accountId: account.id });
    });
    await waitFor(() => writes === 2, "batched picker writes did not settle");
    assert.match(inlinePickerValue("accountId"), /Alpha/);

    await settle(() => replaceRecord({ ...contact, accountId: third.id }));
    assert.match(inlinePickerValue("accountId"), /Gamma/);
    await view.unmount();
  });

  test("batched text acknowledgements leave no phantom pending submission", async () => {
    const { data, account } = await fixture();
    const initial = { ...account, name: "Original" };
    const first = deferred<Account>();
    const reverted = deferred<Account>();
    const calls: object[] = [];
    const adapter: DataAdapter = {
      ...data,
      update: ((kind, id, input) => {
        calls.push(input);
        if (calls.length === 1) return first.promise;
        if (calls.length === 2) return reverted.promise;
        return data.update(kind, id, input);
      }) as DataAdapter["update"],
    };
    const view = await mount(
      <InlineHarness adapter={adapter} initial={initial} />,
    );
    const name = document.querySelector<HTMLInputElement>('input[type="text"]');
    assert.ok(name);

    name.focus();
    await changeValue(name, "Submitted");
    await blur(name);
    name.focus();
    await changeValue(name, "Original");
    await blur(name);
    await settle(() => {
      first.resolve({ ...initial, name: "Submitted" });
      reverted.resolve(initial);
    });
    await waitFor(
      () => calls.length === 2,
      "batched text writes did not settle",
    );

    name.focus();
    await changeValue(name, "Temporary");
    await changeValue(name, "Original");
    await blur(name);
    await flush();
    assert.equal(calls.length, 2);
    await view.unmount();
  });

  test("visible primitive labels are associated with their controls", async () => {
    const { data, account, opportunity } = await fixture();
    let view = await mount(<InlineHarness adapter={data} initial={account} />);
    const name =
      view.container.querySelector<HTMLInputElement>('input[type="text"]');
    assert.ok(name);
    assert.deepEqual(
      Array.from(name.labels ?? [], (label) => label.textContent?.trim()),
      ["Name"],
    );
    const numberLabels = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="number"]'),
      (input) => input.labels?.[0]?.textContent?.trim(),
    );
    assert.deepEqual(numberLabels, ["Annual revenue (USD)", "Headcount"]);
    await view.unmount();

    view = await mount(<InlineHarness adapter={data} initial={opportunity} />);
    const textarea =
      view.container.querySelector<HTMLTextAreaElement>("textarea");
    assert.ok(textarea);
    assert.deepEqual(
      Array.from(textarea.labels ?? [], (label) => label.textContent?.trim()),
      ["Next step"],
    );
    const date = view.container.querySelector<HTMLButtonElement>(
      'button[id$="-closeDate"]',
    );
    assert.equal(date?.labels?.[0]?.textContent?.trim(), "Close date");
    await view.unmount();
  });

  test("calendar selection and clearing save task due dates", async () => {
    const data = createMemoryAdapter();
    const task = await data.create("tasks", {
      title: "Calendar task",
      dueDate: "2026-09-20",
    });
    const view = await mount(<InlineHarness adapter={data} initial={task} />);
    const trigger = inlineTrigger("dueDate");
    assert.ok(trigger);
    await click(trigger);
    await waitFor(
      () => Boolean(document.querySelector('[data-slot="calendar"]')),
      "calendar did not open",
    );
    const day = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        '[data-slot="calendar"] button',
      ),
    ).find((button) => button.textContent?.trim() === "21");
    assert.ok(day);
    await click(day);
    await waitFor(
      () =>
        inlineTrigger("dueDate")?.textContent?.includes("Sep 21, 2026") ??
        false,
      "selected due date was not displayed",
    );
    assert.equal((await data.get("tasks", task.id)).dueDate, "2026-09-21");
    assert.match(inlineTrigger("dueDate")?.textContent ?? "", /Sep 21, 2026/);

    await click(inlineTrigger("dueDate") as HTMLElement);
    const clear = Array.from(
      document.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.trim() === "Clear date");
    assert.ok(clear);
    await click(clear);
    await waitFor(
      () =>
        inlineTrigger("dueDate")?.textContent?.includes("Set due date") ??
        false,
      "cleared due date was not displayed",
    );
    assert.equal((await data.get("tasks", task.id)).dueDate, null);
    await view.unmount();
  });

  test("task creation submits the date selected in the calendar", async () => {
    const data = createMemoryAdapter();
    let created: Task | undefined;
    const view = await mount(
      withData(
        data,
        <RecordForm
          kind="tasks"
          onSaved={(record) => {
            created = record as Task;
          }}
        />,
      ),
    );
    await waitFor(
      () =>
        !document
          .querySelector<HTMLButtonElement>('button[type="submit"]')
          ?.hasAttribute("disabled"),
      "task form stayed disabled",
    );
    const title =
      document.querySelector<HTMLInputElement>('input[name="name"]');
    assert.ok(title);
    await changeValue(title, "New dated task");
    const trigger = document.querySelector<HTMLButtonElement>(
      'button[id$="-dueDate"]',
    );
    assert.ok(trigger);
    await click(trigger);
    await waitFor(
      () => Boolean(document.querySelector('[data-slot="calendar"]')),
      "calendar did not open in task form",
    );
    const day = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        '[data-slot="calendar"] button',
      ),
    ).find((button) => button.textContent?.trim() === "15");
    assert.ok(day);
    await click(day);
    assert.equal(Boolean(created), false);
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`;
    assert.equal(
      document.querySelector<HTMLInputElement>('input[name="dueDate"]')?.value,
      expected,
    );
    const form = document.querySelector<HTMLFormElement>("form");
    assert.ok(form);
    assert.equal(new FormData(form).get("name"), "New dated task");
    const { act } = await import("react");
    await act(async () => form.requestSubmit());
    await waitFor(() => Boolean(created), "dated task was not created");
    assert.ok(created);
    assert.equal(created.dueDate, expected);
    await view.unmount();
  });
});

function withData(adapter: DataAdapter, children: ReactNode) {
  return <DataProvider adapter={adapter}>{children}</DataProvider>;
}

describe("relationship choice dependencies", () => {
  test("account create and inline edit load members without listing unrelated records", async () => {
    const data = createMemoryAdapter({
      members: [{ id: "member", name: "Alex", email: "alex@example.test" }],
    });
    const account = await data.create("accounts", { name: "Account" });
    const listed: RecordKind[] = [];
    const adapter: DataAdapter = {
      ...data,
      list: async (kind) => {
        listed.push(kind);
        throw new Error(`Unexpected ${kind} list`);
      },
    };
    let view = await mount(
      withData(adapter, <RecordForm kind="accounts" onSaved={() => {}} />),
    );
    await waitFor(
      () =>
        !document
          .querySelector<HTMLButtonElement>('button[type="submit"]')
          ?.hasAttribute("disabled"),
      "account form stayed disabled",
    );
    assert.deepEqual(listed, []);
    await view.unmount();

    view = await mount(
      withData(
        adapter,
        <InlineRecordFields
          kind="accounts"
          record={account}
          onUpdated={() => {}}
        />,
      ),
    );
    await waitFor(
      () =>
        !document
          .querySelector<HTMLButtonElement>("button[aria-labelledby*='owner']")
          ?.hasAttribute("disabled"),
      "account owner stayed disabled",
    );
    assert.deepEqual(listed, []);
    await view.unmount();
  });

  test("each kind loads only its required record collections and retry keeps defaults", async () => {
    const expectations: Array<[RecordKind, RecordKind[]]> = [
      ["contacts", ["accounts"]],
      ["opportunities", ["accounts", "contacts"]],
      ["tasks", ["accounts", "contacts", "opportunities"]],
    ];
    for (const [kind, expected] of expectations) {
      const data = createMemoryAdapter();
      await data.create("accounts", { name: "Account" });
      await data.create("contacts", { name: "Contact" });
      await data.create("opportunities", { name: "Opportunity" });
      const listed: RecordKind[] = [];
      let fail = true;
      const adapter: DataAdapter = {
        ...data,
        list: async (listedKind) => {
          listed.push(listedKind);
          if (fail && listedKind === expected[0]) {
            fail = false;
            throw new Error("Injected load failure");
          }
          return data.list(listedKind);
        },
      };
      const view = await mount(
        withData(
          adapter,
          <RecordForm
            kind={kind}
            initialStage={kind === "opportunities" ? "proposal" : undefined}
            onSaved={() => {}}
          />,
        ),
      );
      await waitFor(
        () => document.body.textContent?.includes("Could not load") ?? false,
        `${kind} did not show its required-data error`,
      );
      const retry = Array.from(document.querySelectorAll("button")).find(
        (button) => button.textContent === "Retry",
      );
      assert.ok(retry);
      await click(retry);
      await waitFor(
        () =>
          !document
            .querySelector<HTMLButtonElement>('button[type="submit"]')
            ?.hasAttribute("disabled"),
        `${kind} did not recover after retry`,
      );
      assert.deepEqual(Array.from(new Set(listed)), expected);
      if (kind === "opportunities") {
        const stage = document.querySelector(
          "button[aria-labelledby*='stage']",
        );
        assert.match(stage?.textContent ?? "", /Proposal/);
      }
      await view.unmount();
    }
  });
});

function statusItem(label: string) {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[role="menuitemradio"]'),
  ).find((item) => item.textContent?.trim() === label);
}

test("different task rows can save concurrently and a completed row leaves the default list", async () => {
  const { TaskCollection } = await import(
    "../../src/components/crm/task-collection"
  );
  const data = createMemoryAdapter();
  const first = await data.create("tasks", {
    title: "First task",
    dueDate: "2026-09-20",
  });
  const second = await data.create("tasks", {
    title: "Second task",
    dueDate: "2026-09-20",
  });
  const firstSave = deferred<Task>();
  const secondSave = deferred<Task>();
  const calls: Array<{ id: string; input: object }> = [];
  const adapter: DataAdapter = {
    ...data,
    update: ((_kind, id, input) => {
      calls.push({ id, input });
      return id === first.id ? firstSave.promise : secondSave.promise;
    }) as DataAdapter["update"],
  };
  const view = await mount(
    <DataProvider adapter={adapter}>
      <TaskCollection title="Tasks" />
    </DataProvider>,
  );
  await waitFor(
    () =>
      Boolean(
        document.querySelector("button[aria-label^='Status of First task']"),
      ),
    "task rows did not load",
  );

  const firstTrigger = document.querySelector<HTMLElement>(
    "button[aria-label^='Status of First task']",
  );
  const secondTrigger = document.querySelector<HTMLElement>(
    "button[aria-label^='Status of Second task']",
  );
  assert.ok(firstTrigger);
  assert.ok(secondTrigger);

  await mouseDown(firstTrigger);
  await waitFor(
    () => Boolean(statusItem("In progress")),
    "first status menu did not open",
  );
  const inProgress = statusItem("In progress");
  assert.ok(inProgress);
  await click(inProgress);
  await waitFor(() => calls.length === 1, "first status save did not start");
  assert.equal(
    document
      .querySelector("button[aria-label^='Status of First task']")
      ?.hasAttribute("disabled"),
    true,
  );
  assert.equal(
    document
      .querySelector("button[aria-label^='Status of Second task']")
      ?.hasAttribute("disabled"),
    false,
  );
  const disabledFirstTrigger = document.querySelector<HTMLElement>(
    "button[aria-label^='Status of First task']",
  );
  assert.ok(disabledFirstTrigger);
  await click(disabledFirstTrigger);
  await flush();
  assert.equal(calls.length, 1);

  const availableSecondTrigger = document.querySelector<HTMLElement>(
    "button[aria-label^='Status of Second task']",
  );
  assert.ok(availableSecondTrigger);
  await mouseDown(availableSecondTrigger);
  await waitFor(
    () => Boolean(statusItem("Done")),
    "second status menu did not open",
  );
  const done = statusItem("Done");
  assert.ok(done);
  await click(done);
  await waitFor(() => calls.length === 2, "second status save was dropped");
  assert.deepEqual(
    calls.map(({ id }) => id),
    [first.id, second.id],
  );

  await settle(() => {
    secondSave.resolve({ ...second, status: "completed" });
    firstSave.reject(new Error("Injected failure"));
  });
  await waitFor(
    () =>
      !document.querySelector("button[aria-label^='Status of Second task']"),
    "completed row remained in the active-task list",
  );
  assert.ok(
    document.querySelector("button[aria-label^='Status of First task']"),
    "failed task should remain visible for retry",
  );
  assert.match(document.body.textContent ?? "", /Could not update this task/);
  await view.unmount();
});
