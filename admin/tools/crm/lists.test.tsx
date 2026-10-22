import "./dom";
import { afterEach, expect, test } from "bun:test";
import { useState } from "react";
import { ListDialog } from "../../src/components/crm/list-dialog";
import { ListsProvider } from "../../src/components/crm/lists-provider";
import { RecordRowMenu } from "../../src/components/crm/record-row-menu";
import { DataError } from "../../src/lib/data/contracts";
import { createMemoryAdapter } from "../../src/lib/data/memory";
import { DataProvider } from "../../src/lib/data/provider";
import { changeValue, cleanupDom, click, flush, mount, waitFor } from "./dom";

afterEach(cleanupDom);
function element<T extends HTMLElement>(selector: string): T {
  const value = document.querySelector<T>(selector);
  if (!value) throw new Error(`Missing ${selector}`);
  return value;
}
function item(name: string) {
  const value = Array.from(
    document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
  ).find((element) => element.textContent?.trim() === name);
  if (!value) throw new Error(`Missing menu item ${name}`);
  return value;
}

test("row menu limits lists by type, searches, adds, and displays saved membership", async () => {
  const data = createMemoryAdapter();
  const record = await data.create("accounts", { name: "Acme" });
  const list = await data.createList({
    name: "Priority",
    recordType: "accounts",
  });
  await data.createList({ name: "Other accounts", recordType: "accounts" });
  await data.createList({ name: "Private contacts", recordType: "contacts" });
  await mount(
    <DataProvider adapter={data}>
      <ListsProvider>
        <RecordRowMenu kind="accounts" record={record} />
      </ListsProvider>
    </DataProvider>,
  );
  await flush();
  await click(element('button[aria-label="Actions for Acme"]'));
  await click(item("Add to list"));
  await waitFor(
    () => !!document.querySelector('[aria-label="Search lists"]'),
    "Search must appear",
  );
  expect(
    document.querySelector('[role="menu"][aria-labelledby]')?.textContent,
  ).not.toContain("Private contacts");
  await changeValue(element('input[aria-label="Search lists"]'), "prior");
  expect(document.body.textContent).not.toContain("Other accounts");
  await click(item("Priority"));
  await waitFor(
    () => !document.querySelector('[role="menu"]'),
    "Successful add closes the menu",
  );
  expect((await data.getList(list.id)).recordIds).toEqual([record.id]);
  await click(element('button[aria-label="Actions for Acme"]'));
  await click(item("Add to list"));
  await waitFor(
    () => document.body.textContent?.includes("Already added") ?? false,
    "Existing membership is marked",
  );
  expect(item("PriorityAlready added").getAttribute("aria-disabled")).toBe(
    "true",
  );
});

test("new list starts without a record type and uses the create dialog layout", async () => {
  const data = createMemoryAdapter();
  await mount(
    <DataProvider adapter={data}>
      <ListDialog open onOpenChange={() => {}} />
    </DataProvider>,
  );
  const dialog = element<HTMLElement>('[role="dialog"]');
  const typeTrigger = Array.from(
    dialog.querySelectorAll<HTMLButtonElement>("button"),
  ).find((button) => button.textContent?.includes("Select record type"));
  if (!typeTrigger) throw new Error("Missing record type trigger");
  expect(typeTrigger.querySelectorAll("svg")).toHaveLength(2);
  expect(dialog.className).toContain("sm:max-w-lg");
  expect(
    dialog.querySelector('[data-slot="dialog-header"]')?.className,
  ).toContain("gap-2");
  expect(dialog.querySelector('[data-slot="dialog-close"]')).toBeNull();

  await changeValue(element("input"), "Priority accounts");
  const submit = element<HTMLButtonElement>('button[type="submit"]');
  expect(submit.disabled).toBe(true);
});

test("create-from-record preserves the preselected type and form values on a failed save", async () => {
  const data = createMemoryAdapter();
  const record = await data.create("contacts", { name: "Alex" });
  let attempts = 0;
  const adapter = {
    ...data,
    createList: async (input: Parameters<typeof data.createList>[0]) => {
      attempts++;
      if (attempts === 1)
        throw new DataError("unavailable", "Try again shortly");
      return data.createList(input);
    },
  };
  function Harness() {
    const [open, setOpen] = useState(true);
    return (
      <ListDialog
        open={open}
        onOpenChange={setOpen}
        recordId={record.id}
        recordType="contacts"
      />
    );
  }
  await mount(
    <DataProvider adapter={adapter}>
      <Harness />
    </DataProvider>,
  );
  const typeTrigger = Array.from(
    document.querySelectorAll<HTMLButtonElement>("button[disabled]"),
  ).find((button) => button.textContent?.includes("Contacts"));
  if (!typeTrigger) throw new Error("Missing preselected record type");
  expect(typeTrigger.querySelectorAll("svg")).toHaveLength(2);
  await changeValue(element("input"), "Customers");
  await click(element('button[type="submit"]'));
  await waitFor(
    () => !!document.querySelector('[role="alert"]'),
    "Save failure is visible",
  );
  expect(element<HTMLInputElement>("input").value).toBe("Customers");
  expect(await data.listLists()).toEqual([]);
  await click(element('button[type="submit"]'));
  await waitFor(
    () => !document.querySelector('[role="dialog"]'),
    "Saved dialog closes",
  );
  const lists = await data.listLists();
  expect(lists[0]).toMatchObject({
    name: "Customers",
    recordType: "contacts",
    recordIds: [record.id],
  });
});

test("deleting requires confirmation and a failed delete keeps the record and retry available", async () => {
  const data = createMemoryAdapter();
  const record = await data.create("accounts", { name: "Acme" });
  let attempts = 0;
  const adapter = {
    ...data,
    delete: async () => {
      attempts++;
      throw new DataError("conflict", "Referenced");
    },
  };
  await mount(
    <DataProvider adapter={adapter}>
      <ListsProvider>
        <RecordRowMenu kind="accounts" record={record} />
      </ListsProvider>
    </DataProvider>,
  );
  await click(element('button[aria-label="Actions for Acme"]'));
  await click(item("Delete record"));
  expect(attempts).toBe(0);
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'),
  );
  const confirm = buttons.find(
    (button) => button.textContent === "Delete record",
  );
  if (!confirm) throw new Error("Missing delete confirmation");
  await click(confirm);
  await waitFor(
    () => !!document.querySelector('[role="alert"]'),
    "Delete conflict is visible",
  );
  expect(attempts).toBe(1);
  expect((await data.get("accounts", record.id)).name).toBe("Acme");
  expect(document.querySelector('[role="alert"]')?.textContent).toContain(
    "still referenced",
  );
});
