import assert from "node:assert/strict";
import { test } from "node:test";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { asSchema, streamText } from "ai";
import { crmTools } from "../../src/lib/chat/tools";

test("chat sends object-shaped function parameters accepted by LM Studio", async () => {
  let requests = 0;
  const provider = createOpenAICompatible({
    name: "schema-test",
    baseURL: "http://provider.test/v1",
    fetch: Object.assign(
      async (...[_url, init]: Parameters<typeof fetch>) => {
        requests++;
        const body = JSON.parse(String(init?.body));
        assert.equal(body.tools.length, 4);
        for (const tool of body.tools) {
          const parameters = tool.function.parameters;
          assert.equal(parameters.type, "object", tool.function.name);
          assert.ok(parameters.properties, tool.function.name);
          assert.equal(parameters.oneOf, undefined);
          assert.equal(parameters.anyOf, undefined);
        }
        for (const name of ["createRecord", "updateRecord"]) {
          const parameters = body.tools.find(
            (tool: { function: { name: string } }) =>
              tool.function.name === name,
          ).function.parameters;
          assert.ok(parameters.properties.type);
          assert.ok(parameters.properties.input);
          assert.ok(parameters.required.includes("input"));
          if (name === "updateRecord") {
            assert.ok(parameters.required.includes("id"));
          }
        }
        return new Response(
          `data: ${JSON.stringify({
            id: "reply",
            model: "test",
            choices: [
              { index: 0, delta: { content: "Hello!" }, finish_reason: null },
            ],
          })}\n\ndata: ${JSON.stringify({
            id: "reply",
            model: "test",
            choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
          })}\n\ndata: [DONE]\n\n`,
          { headers: { "Content-Type": "text/event-stream" } },
        );
      },
      { preconnect: () => {} },
    ),
  });
  const result = streamText({
    model: provider.chatModel("test"),
    tools: crmTools,
    prompt: "Hello",
    maxRetries: 0,
  });
  assert.equal(await result.text, "Hello!");
  assert.equal(requests, 1);
});

test("mutation schemas retain type-specific validation and sparse updates", async () => {
  const create = asSchema(crmTools.createRecord.inputSchema);
  const update = asSchema(crmTools.updateRecord.inputSchema);
  assert.ok(create.validate);
  assert.ok(update.validate);
  for (const type of ["accounts", "contacts", "opportunities", "tasks"]) {
    const input = type === "tasks" ? { title: "Follow up" } : { name: "Acme" };
    assert.equal((await create.validate({ type, input })).success, true);
    assert.deepEqual(await update.validate({ type, id: "record-1", input }), {
      success: true,
      value: { type, id: "record-1", input },
    });
  }
  for (const input of [
    { type: "tasks", input: { name: "Wrong field" } },
    { type: "accounts", input: { title: "Wrong field" } },
    { type: "accounts", input: { name: "Acme", unknown: true } },
    { type: "contacts", input: { name: "Acme", email: "invalid" } },
    { type: "unknown", input: { name: "Acme" } },
  ]) {
    assert.equal((await create.validate(input)).success, false);
    assert.equal(
      (await update.validate({ ...input, id: "record-1" })).success,
      false,
    );
  }
  assert.equal(
    (await update.validate({ type: "tasks", input: { title: "Follow up" } }))
      .success,
    false,
  );
});
