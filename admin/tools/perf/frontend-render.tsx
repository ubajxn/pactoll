import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  PathnameContext,
  SearchParamsContext,
} from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { ChatView } from "../../src/components/chat/workspace";
import { TaskCollection } from "../../src/components/crm/task-collection";
import { ChatSession, ChatSessionsProvider } from "../../src/lib/chat/session";
import { createMemoryAdapter } from "../../src/lib/data/memory";
import { DataProvider } from "../../src/lib/data/provider";
import { mount, waitFor } from "../crm/dom";

const data = createMemoryAdapter();
for (let index = 0; index < 250; index++)
  await data.create("tasks", {
    title: `Follow up with account ${index + 1}`,
    dueDate: "2026-09-26",
  });

const tableStart = performance.now();
const table = await mount(
  <PathnameContext.Provider value="/tasks">
    <SearchParamsContext.Provider value={new URLSearchParams()}>
      <DataProvider adapter={data}>
        <TaskCollection title="Tasks" />
      </DataProvider>
    </SearchParamsContext.Provider>
  </PathnameContext.Provider>,
);
await waitFor(
  () =>
    table.container.querySelectorAll(
      "button[aria-label^='Status of Follow up with account']",
    ).length === 250,
  "Task fixture did not render all 250 rows",
);
const tableMs = performance.now() - tableStart;
const tableNodes = table.container.querySelectorAll("*").length;
await table.unmount();

const messages = Array.from({ length: 200 }, (_, index) => ({
  id: `message-${index + 1}`,
  text: `Update ${index + 1}: **Account review** is ready for follow-up.`,
}));
const conversation = await data.createConversation({ title: "Render probe" });
for (const message of messages)
  await data.appendMessage(conversation.id, {
    role: "assistant",
    blocks: [{ type: "text", text: message.text }],
  });
const session = new ChatSession(
  conversation,
  data,
  await data.listMessages(conversation.id),
);
const router = {
  back() {},
  forward() {},
  refresh() {},
  push() {},
  replace() {},
  prefetch() {},
  bfcacheId: "render-probe",
};
const chatStart = performance.now();
const chat = await mount(
  <AppRouterContext.Provider value={router}>
    <DataProvider adapter={data}>
      <ChatSessionsProvider>
        <ChatView session={session} />
      </ChatSessionsProvider>
    </DataProvider>
  </AppRouterContext.Provider>,
);
await waitFor(
  () => chat.container.querySelectorAll('[role="log"] p').length === 200,
  "Chat fixture did not render all 200 messages",
);
const chatMs = performance.now() - chatStart;
const chatNodes = chat.container.querySelectorAll("*").length;
await chat.unmount();

process.stdout.write(
  `${JSON.stringify(
    {
      fixture: "isolated memory adapter, happy-dom, Bun",
      table: { rows: 250, nodes: tableNodes, renderMs: +tableMs.toFixed(1) },
      chat: { messages: 200, nodes: chatNodes, renderMs: +chatMs.toFixed(1) },
    },
    null,
    2,
  )}\n`,
);
