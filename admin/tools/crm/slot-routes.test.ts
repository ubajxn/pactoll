import { test } from "bun:test";
import assert from "node:assert/strict";
import AccountCatchAll from "../../src/app/(crm)/accounts/@record/[...catchAll]/page";
import AccountSlot from "../../src/app/(crm)/accounts/@record/page";
import ContactCatchAll from "../../src/app/(crm)/contacts/@record/[...catchAll]/page";
import ContactSlot from "../../src/app/(crm)/contacts/@record/page";
import { shouldUseFullPageRecordLink } from "../../src/components/crm/record-detail-actions";

test("account and contact parallel slots explicitly clear unmatched navigation", () => {
  assert.equal(AccountSlot(), null);
  assert.equal(AccountCatchAll(), null);
  assert.equal(ContactSlot(), null);
  assert.equal(ContactCatchAll(), null);
});

test("an already-open record name promotes to its full detail page", () => {
  const record = { kind: "opportunities" as const, id: "deal/one" };

  assert.equal(
    shouldUseFullPageRecordLink("/opportunities/deal%2Fone", record),
    true,
  );
  assert.equal(shouldUseFullPageRecordLink("/opportunities", record), false);
  assert.equal(
    shouldUseFullPageRecordLink("/opportunities/another-deal", record),
    false,
  );
});
