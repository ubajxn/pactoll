import assert from "node:assert/strict";
import { test } from "node:test";
import { latestActivityFirst } from "../src/lib/crm-activity";
import type { Activity } from "../src/lib/data/contracts";

test("CRM activity is displayed latest first without mutating adapter data", () => {
  const activity: Activity[] = [
    {
      id: "older",
      type: "created",
      summary: "Created",
      actor: null,
      createdAt: "2026-09-15T10:00:00.000Z",
    },
    {
      id: "newer",
      type: "updated",
      summary: "Updated",
      actor: null,
      createdAt: "2026-09-16T10:00:00.000Z",
    },
  ];

  assert.deepEqual(
    latestActivityFirst(activity).map((item) => item.id),
    ["newer", "older"],
  );
  assert.deepEqual(
    activity.map((item) => item.id),
    ["older", "newer"],
  );
});
