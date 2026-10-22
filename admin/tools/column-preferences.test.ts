import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  constrainColumnOrder,
  moveColumn,
  normalizeColumns,
} from "../src/lib/column-preferences";

describe("collection column preferences", () => {
  test("repairs stale, duplicate and malformed settings and includes new columns", () => {
    assert.deepEqual(
      normalizeColumns(
        {
          order: ["email", "removed", "email", 7],
          hidden: ["removed", "name", "name"],
        },
        ["name", "email", "phone"],
      ),
      { order: ["email", "name", "phone"], hidden: ["name"] },
    );
    assert.deepEqual(
      normalizeColumns({ order: false, hidden: null }, ["name", "email"]),
      { order: ["name", "email"], hidden: [] },
    );
  });
  test("retains one column even if a cookie hides every column", () => {
    assert.deepEqual(
      normalizeColumns(
        { order: ["email", "name"], hidden: ["name", "email"] },
        ["name", "email"],
      ),
      { order: ["email", "name"], hidden: ["name"] },
    );
  });
  test("moves both directions without losing hidden columns or mutating the original", () => {
    const original = {
      order: ["name", "email", "phone", "role"],
      hidden: ["email"],
    };
    assert.deepEqual(moveColumn(original, "name", "role"), {
      order: ["email", "phone", "role", "name"],
      hidden: ["email"],
    });
    assert.deepEqual(moveColumn(original, "role", "name").order, [
      "role",
      "name",
      "email",
      "phone",
    ]);
    assert.deepEqual(original.order, ["name", "email", "phone", "role"]);
    assert.equal(moveColumn(original, "missing", "role"), original);
  });
  test("restores default hidden columns on reset", () => {
    assert.deepEqual(
      normalizeColumns(null, ["name", "nextStep"], ["nextStep"]),
      { order: ["name", "nextStep"], hidden: ["nextStep"] },
    );
  });
});

test("saved orders keep the primary column first and fixed tables use schema order", () => {
  const saved = { order: ["phone", "email", "name"], hidden: ["email"] };
  assert.deepEqual(constrainColumnOrder(saved, ["name", "email", "phone"]), {
    order: ["name", "phone", "email"],
    hidden: ["email"],
  });
  assert.deepEqual(
    constrainColumnOrder(saved, ["name", "email", "phone"], false),
    { order: ["name", "email", "phone"], hidden: ["email"] },
  );
});
