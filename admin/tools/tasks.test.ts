import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createMemoryAdapter } from "../src/lib/data/memory";
import {
  isOverdueTask,
  overdueTaskCount,
  taskMatchesStatusFilter,
  upcomingTasks,
} from "../src/lib/tasks";

describe("upcoming tasks", () => {
  test("returns actionable dated work from today onward in due-date order", async () => {
    const data = createMemoryAdapter();
    const today = await data.create("tasks", {
      title: "Today",
      dueDate: "2026-09-16",
    });
    const later = await data.create("tasks", {
      title: "Later",
      status: "in_progress",
      dueDate: "2026-09-18",
    });
    const overdue = await data.create("tasks", {
      title: "Overdue",
      dueDate: "2026-09-15",
    });
    const done = await data.create("tasks", {
      title: "Done",
      status: "completed",
      dueDate: "2026-09-17",
    });
    await data.create("tasks", { title: "Unscheduled" });

    assert.deepEqual(
      upcomingTasks(await data.list("tasks"), "2026-09-16").map(
        (task) => task.id,
      ),
      [today.id, later.id],
    );
    assert.equal(overdueTaskCount(await data.list("tasks"), "2026-09-16"), 1);
    assert.equal(isOverdueTask(overdue, "2026-09-16"), true);
    assert.equal(isOverdueTask(done, "2026-09-18"), false);
    assert.equal(taskMatchesStatusFilter(done, null), false);
    assert.equal(taskMatchesStatusFilter(done, "completed"), true);
    assert.equal(taskMatchesStatusFilter(overdue, null), true);
  });

  test("hides terminal tasks by default and reveals each with its status filter", async () => {
    const data = createMemoryAdapter();
    const canceled = await data.create("tasks", {
      title: "Canceled",
      status: "canceled",
      dueDate: "2026-09-10",
    });
    const completed = await data.create("tasks", {
      title: "Completed",
      status: "completed",
      dueDate: "2026-09-10",
    });

    assert.equal(taskMatchesStatusFilter(canceled, null), false);
    assert.equal(taskMatchesStatusFilter(completed, null), false);
    assert.equal(taskMatchesStatusFilter(canceled, "canceled"), true);
    assert.equal(taskMatchesStatusFilter(completed, "completed"), true);
    assert.equal(taskMatchesStatusFilter(completed, "open"), false);
  });

  test("limits the home list", async () => {
    const data = createMemoryAdapter();
    for (let index = 0; index < 4; index++)
      await data.create("tasks", {
        title: `Task ${index}`,
        dueDate: `2026-09-${16 + index}`,
      });
    assert.equal(
      upcomingTasks(await data.list("tasks"), "2026-09-16", 2).length,
      2,
    );
  });
});
