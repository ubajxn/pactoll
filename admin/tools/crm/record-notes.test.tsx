import "./dom";
import { afterEach, describe, test } from "bun:test";
import assert from "node:assert/strict";
import { act, StrictMode } from "react";
import { RecordNotes } from "../../src/components/crm/record-notes";
import type {
  DataAdapter,
  Note,
  RecordKind,
} from "../../src/lib/data/contracts";
import { createMemoryAdapter } from "../../src/lib/data/memory";
import { DataProvider } from "../../src/lib/data/provider";
import {
  blur,
  byText,
  changeValue,
  cleanupDom,
  click,
  deferred,
  flush,
  mount,
  settle,
  waitFor,
} from "./dom";

afterEach(cleanupDom);

function notesView({
  adapter,
  recordId,
  notes,
  kind = "accounts",
  readOnly = false,
  onChanged = () => {},
}: {
  adapter: DataAdapter;
  recordId: string;
  notes: Note[];
  kind?: RecordKind;
  readOnly?: boolean;
  onChanged?: () => void;
}) {
  return (
    <StrictMode>
      <DataProvider adapter={adapter}>
        <RecordNotes
          kind={kind}
          recordId={recordId}
          notes={notes}
          readOnly={readOnly}
          onChanged={onChanged}
        />
      </DataProvider>
    </StrictMode>
  );
}

describe("record notes", () => {
  test("an empty record starts with a textarea and creates a note after typing pauses", async () => {
    const data = createMemoryAdapter();
    const record = await data.create("accounts", { name: "Account" });
    let additions = 0;
    let changes = 0;
    const adapter: DataAdapter = {
      ...data,
      addNote: async (...args) => {
        additions++;
        return data.addNote(...args);
      },
    };
    const view = await mount(
      notesView({
        adapter,
        recordId: record.id,
        notes: record.notes,
        onChanged: () => changes++,
      }),
    );
    const textarea = document.querySelector<HTMLTextAreaElement>("textarea");
    assert.ok(textarea);
    assert.equal(textarea.placeholder, "Write a note…");
    assert.equal(
      document.body.textContent?.includes("Changes save automatically."),
      false,
    );
    assert.equal(document.querySelector('[aria-label="Delete note 1"]'), null);

    await changeValue(textarea, "   ");
    assert.equal(document.querySelector('[aria-label="Delete note 1"]'), null);

    await changeValue(textarea, "A plain-text note");
    assert.ok(document.querySelector('[aria-label="Delete note 1"]'));
    assert.equal(document.querySelector("output"), null);
    await act(() => new Promise((resolve) => setTimeout(resolve, 750)));
    await waitFor(() => additions === 1, "note was not automatically created");
    await waitFor(() => changes === 1, "save did not finish");
    assert.equal(document.querySelector("output"), null);

    assert.equal(changes, 1);
    assert.equal(
      (await data.get("accounts", record.id)).notes[0]?.content,
      "A plain-text note",
    );
    await view.unmount();
  });

  test("blur updates an existing note without losing a newer queued draft", async () => {
    const data = createMemoryAdapter();
    const record = await data.create("tasks", { title: "Task" });
    const note = await data.addNote("tasks", record.id, {
      content: "Original",
    });
    const first = deferred<Note>();
    const calls: string[] = [];
    let changes = 0;
    const adapter: DataAdapter = {
      ...data,
      updateNote: async (kind, id, noteId, input) => {
        calls.push(input.content);
        if (calls.length === 1) return first.promise;
        return data.updateNote(kind, id, noteId, input);
      },
    };
    const view = await mount(
      notesView({
        adapter,
        kind: "tasks",
        recordId: record.id,
        notes: [note],
        onChanged: () => changes++,
      }),
    );
    const textarea = document.querySelector<HTMLTextAreaElement>("textarea");
    assert.ok(textarea);
    textarea.focus();
    await changeValue(textarea, "Submitted first");
    await blur(textarea);
    await waitFor(() => calls.length === 1, "first update did not start");

    textarea.focus();
    await changeValue(textarea, "Newest draft");
    await blur(textarea);
    await settle(() => first.resolve({ ...note, content: "Submitted first" }));
    assert.equal(textarea.value, "Newest draft");
    await waitFor(() => calls.length === 2, "newer update was not queued");
    await waitFor(() => changes === 2, "queued save did not finish");

    assert.deepEqual(calls, ["Submitted first", "Newest draft"]);
    assert.equal(
      (await data.get("tasks", record.id)).notes[0]?.content,
      "Newest draft",
    );
    await view.unmount();
  });

  test("Add note creates and focuses another independent textarea", async () => {
    const data = createMemoryAdapter();
    const record = await data.create("contacts", { name: "Contact" });
    const first = await data.addNote("contacts", record.id, {
      content: "First note",
    });
    let changes = 0;
    const view = await mount(
      notesView({
        adapter: data,
        kind: "contacts",
        recordId: record.id,
        notes: [first],
        onChanged: () => changes++,
      }),
    );
    const add = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Add note",
    );
    assert.ok(add);
    await click(add);
    const textareas =
      document.querySelectorAll<HTMLTextAreaElement>("textarea");
    assert.equal(textareas.length, 2);
    assert.equal(document.activeElement, textareas[1]);

    await changeValue(textareas[1], "Second note");
    await blur(textareas[1]);
    await waitFor(() => changes === 1, "second note did not save");
    assert.deepEqual(
      (await data.get("contacts", record.id)).notes.map((note) => note.content),
      ["First note", "Second note"],
    );
    await view.unmount();
  });

  test("a failed save retains the draft and can be retried", async () => {
    const data = createMemoryAdapter();
    const record = await data.create("opportunities", { name: "Deal" });
    const note = await data.addNote("opportunities", record.id, {
      content: "Original",
    });
    let attempts = 0;
    let changes = 0;
    const adapter: DataAdapter = {
      ...data,
      updateNote: async (...args) => {
        attempts++;
        if (attempts === 1) throw new Error("offline");
        return data.updateNote(...args);
      },
    };
    const view = await mount(
      notesView({
        adapter,
        kind: "opportunities",
        recordId: record.id,
        notes: [note],
        onChanged: () => changes++,
      }),
    );
    const textarea = document.querySelector<HTMLTextAreaElement>("textarea");
    assert.ok(textarea);
    textarea.focus();
    await changeValue(textarea, "Kept after failure");
    await blur(textarea);
    await waitFor(
      () =>
        document.body.textContent?.includes("Could not save this note") ??
        false,
      "save error was not shown",
    );
    assert.equal(textarea.value, "Kept after failure");

    const retry = byText("Retry");
    assert.ok(retry);
    await click(retry);
    await waitFor(() => attempts === 2, "retry did not save");
    await waitFor(() => changes === 1, "retry did not finish");
    assert.equal(
      (await data.get("opportunities", record.id)).notes[0]?.content,
      "Kept after failure",
    );
    await view.unmount();
  });

  test("deletion is confirmed and read-only notes expose no mutations", async () => {
    const data = createMemoryAdapter();
    const account = await data.create("accounts", { name: "Account" });
    const note = await data.addNote("accounts", account.id, {
      content: "Delete me",
    });
    const view = await mount(
      notesView({ adapter: data, recordId: account.id, notes: [note] }),
    );
    const remove = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Delete note 1"]',
    );
    assert.ok(remove);
    await click(remove);
    const confirm = byText("Delete note");
    assert.ok(confirm);
    await click(confirm);
    await waitFor(
      () => document.querySelector("[role=alertdialog]") === null,
      "delete confirmation did not close",
    );
    assert.equal((await data.get("accounts", account.id)).notes.length, 0);
    assert.ok(document.querySelector("textarea"));
    await view.unmount();

    await mount(
      notesView({
        adapter: data,
        recordId: account.id,
        notes: [note],
        readOnly: true,
      }),
    );
    assert.equal(document.querySelector("textarea")?.readOnly, true);
    assert.equal(byText("Add note"), undefined);
    assert.equal(document.querySelector('[aria-label^="Delete note"]'), null);
    await flush();
  });
});
