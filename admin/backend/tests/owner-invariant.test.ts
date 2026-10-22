import { afterEach, beforeEach, expect, test } from "bun:test";
import { type TestApp, testApp } from "./helpers";

let app: TestApp;
beforeEach(async () => {
  app = await testApp();
});
afterEach(async () => {
  await app.close();
});

async function twoOwners() {
  const first = await app.login("first-owner@example.test", "First Owner");
  const context = await app.workspace(first);
  const second = await app.existingAccount(
    "second-owner@example.test",
    "Second Owner",
  );
  const invitation = await (
    await first.request("/api/auth/organization/invite-member", "POST", {
      email: "second-owner@example.test",
      role: "owner",
    })
  ).json();
  expect(
    (
      await second.request("/api/auth/organization/accept-invitation", "POST", {
        invitationId: invitation.id,
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await second.request("/api/auth/organization/set-active", "POST", {
        organizationId: context.workspace.id,
      })
    ).status,
  ).toBe(200);
  const directory = await (
    await first.request("/api/auth/organization/list-members")
  ).json();
  const membership = (userId: string) => {
    const found = directory.members.find(
      (member: { userId: string }) => member.userId === userId,
    );
    if (!found) throw new Error(`Membership for ${userId} was not found`);
    return found as { id: string; userId: string; role: string };
  };
  return {
    first,
    second,
    context,
    firstMembership: membership(context.user.id),
    secondMembership: membership(
      (await (await second.request("/api/context")).json()).user.id,
    ),
  };
}

async function raceOwnerCount<T>(
  organizationId: string,
  run: () => Promise<T>,
) {
  const authContext = await app.app.auth.$context;
  const original = authContext.adapter.findMany;
  let arrivals = 0;
  let release = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  let rejectDeadline = (_error: Error) => {};
  const deadline = new Promise<never>((_resolve, reject) => {
    rejectDeadline = reject;
  });
  const timer = setTimeout(
    () =>
      rejectDeadline(new Error("Timed out waiting for both owner-count reads")),
    5_000,
  );
  authContext.adapter.findMany = (async (query) => {
    const rows = await original(query);
    const isOrganizationMemberRead =
      query.model === "member" &&
      query.where?.some(
        (clause) =>
          clause.field === "organizationId" && clause.value === organizationId,
      );
    if (isOrganizationMemberRead && arrivals < 2) {
      arrivals += 1;
      if (arrivals === 2) release();
      await Promise.race([released, deadline]);
    }
    return rows;
  }) as typeof original;
  try {
    const result = await run();
    expect(arrivals).toBe(2);
    return result;
  } finally {
    clearTimeout(timer);
    release();
    authContext.adapter.findMany = original;
  }
}

async function expectOneOwner(responses: Response[], organizationId: string) {
  expect(responses.map((response) => response.status).sort()).toEqual([
    200, 400,
  ]);
  const roles = await app.pool.query<{ role: string }>(
    'SELECT role FROM member WHERE "organizationId"=$1',
    [organizationId],
  );
  expect(
    roles.rows.filter((row) =>
      row.role
        .split(",")
        .map((role) => role.trim())
        .includes("owner"),
    ),
  ).toHaveLength(1);
}

test("concurrent self-demotions retain one workspace owner", async () => {
  const { first, second, context, firstMembership, secondMembership } =
    await twoOwners();
  const responses = await raceOwnerCount(context.workspace.id, () =>
    Promise.all([
      first.request("/api/auth/organization/update-member-role", "POST", {
        memberId: firstMembership.id,
        role: "admin",
      }),
      second.request("/api/auth/organization/update-member-role", "POST", {
        memberId: secondMembership.id,
        role: "admin",
      }),
    ]),
  );
  await expectOneOwner(responses, context.workspace.id);
});

test("concurrent self-removals retain one workspace owner", async () => {
  const { first, second, context, firstMembership, secondMembership } =
    await twoOwners();
  const responses = await raceOwnerCount(context.workspace.id, () =>
    Promise.all([
      first.request("/api/auth/organization/remove-member", "POST", {
        memberIdOrEmail: firstMembership.id,
      }),
      second.request("/api/auth/organization/remove-member", "POST", {
        memberIdOrEmail: secondMembership.id,
      }),
    ]),
  );
  await expectOneOwner(responses, context.workspace.id);
});

test("concurrent workspace leaves retain one workspace owner", async () => {
  const { first, second, context } = await twoOwners();
  const responses = await raceOwnerCount(context.workspace.id, () =>
    Promise.all([
      first.request("/api/auth/organization/leave", "POST", {
        organizationId: context.workspace.id,
      }),
      second.request("/api/auth/organization/leave", "POST", {
        organizationId: context.workspace.id,
      }),
    ]),
  );
  await expectOneOwner(responses, context.workspace.id);
});

test("mixed owner-reducing operations retain one workspace owner", async () => {
  const { first, second, context, firstMembership } = await twoOwners();
  const responses = await raceOwnerCount(context.workspace.id, () =>
    Promise.all([
      first.request("/api/auth/organization/update-member-role", "POST", {
        memberId: firstMembership.id,
        role: "admin",
      }),
      second.request("/api/auth/organization/leave", "POST", {
        organizationId: context.workspace.id,
      }),
    ]),
  );
  await expectOneOwner(responses, context.workspace.id);
});

test("comma-separated owner roles are enforced as exact tokens", async () => {
  const { context, firstMembership, secondMembership } = await twoOwners();
  await app.pool.query("UPDATE member SET role=$1 WHERE id=$2", [
    "admin, owner",
    firstMembership.id,
  ]);
  await app.pool.query("UPDATE member SET role=$1 WHERE id=$2", [
    "homeowner",
    secondMembership.id,
  ]);
  await expect(
    app.pool.query("UPDATE member SET role=$1 WHERE id=$2", [
      "admin",
      firstMembership.id,
    ]),
  ).rejects.toMatchObject({ constraint: "member_last_owner_update" });
  const owners = await app.pool.query(
    `SELECT id FROM member
     WHERE "organizationId"=$1
       AND crm_member_has_role(role, 'owner')`,
    [context.workspace.id],
  );
  expect(owners.rowCount).toBe(1);
  await app.pool.query("DELETE FROM organization WHERE id=$1", [
    context.workspace.id,
  ]);
  expect(
    (
      await app.pool.query('SELECT id FROM member WHERE "organizationId"=$1', [
        context.workspace.id,
      ])
    ).rowCount,
  ).toBe(0);
});
