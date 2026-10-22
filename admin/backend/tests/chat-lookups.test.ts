import { expect, test } from "bun:test";
import { getRecord, searchRecords } from "../../src/lib/chat/tools";
import { testApp } from "./helpers";

test("authenticated HTTP tools, sessions, and mentions persist across backend restarts", async () => {
  const app = await testApp();
  try {
    const user = await app.login();
    await app.workspace(user);
    const data = user.api;
    const task = await data.create("tasks", { title: "Exact mentioned task" });
    const reference = { type: "tasks" as const, id: task.id };
    const conversation = await data.createConversation({
      title: "Mention persistence",
    });
    await data.appendMessage(conversation.id, {
      role: "user",
      blocks: [{ type: "mention", label: task.title, reference }],
    });
    await app.restart();
    expect(
      (await searchRecords(data, { query: "Exact", kind: "tasks" })).results[0]
        .reference,
    ).toEqual(reference);
    expect((await getRecord(data, reference)).details).toContain(task.title);
    expect((await data.listMessages(conversation.id))[0].blocks).toEqual([
      { type: "mention", label: task.title, reference },
    ]);
  } finally {
    await app.close();
  }
});
