import { afterEach, beforeEach, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { migrate } from "../db";
import { type TestApp, testApp } from "./helpers";

let app: TestApp;
beforeEach(async () => {
  app = await testApp();
});
afterEach(async () => {
  await app.close();
});

type Agent = ReturnType<TestApp["agent"]>;
async function invite(owner: Agent, email = "invitee@example.test") {
  const response = await owner.request(
    "/api/auth/organization/invite-member",
    "POST",
    { email, role: "member" },
  );
  expect(response.status).toBe(200);
  return (await response.json()).id as string;
}
async function link(agent: Agent, email: string, invitationId?: string) {
  const response = await agent.request("/api/auth/sign-in/magic-link", "POST", {
    email,
    callbackURL: "/onboarding?next=/accounts",
    errorCallbackURL: "/login",
    metadata: invitationId ? { invitationId } : undefined,
  });
  expect(response.status).toBe(200);
  const message = app.emails.findLast((message) => message.to === email);
  const url = new URL(message?.text.match(/https?:\/\/\S+/)?.[0] || "");
  return url.pathname + url.search;
}
async function users() {
  return (
    await app.pool.query('SELECT email FROM "user" ORDER BY email')
  ).rows.map((row) => row.email);
}

test("first verified signup atomically owns the only company; existing logins need no selection", async () => {
  expect(await (await app.agent().request("/api/registration")).json()).toEqual(
    { signupAllowed: true },
  );
  const owner = await app.login("owner@example.test");
  const context = await (await owner.request("/api/context")).json();
  expect(context.role).toBe("owner");
  expect(context.workspace.name).toBe("My company");
  expect(await (await owner.request("/api/registration")).json()).toEqual({
    signupAllowed: false,
  });
  expect(
    (
      await owner.request("/api/auth/organization/create", "POST", {
        name: "Second",
        slug: "second",
      })
    ).status,
  ).toBe(403);
  await expect(
    app.pool.query(
      'INSERT INTO organization (name,slug,"createdAt") VALUES ($1,$2,now())',
      ["Second", "second"],
    ),
  ).rejects.toMatchObject({ constraint: "organization_single_company" });
  await app.restart();
  const again = await app.login("owner@example.test");
  expect(
    (await (await again.request("/api/context")).json()).workspace.id,
  ).toBe(context.workspace.id);
  await app.pool.query('UPDATE session SET "activeOrganizationId"=NULL');
  expect((await again.request("/api/context")).status).toBe(200);
});

test("later signup requires the invitation link and matching email, even with forged return URLs", async () => {
  const owner = await app.login();
  const id = await invite(owner);
  const stranger = app.agent();
  for (const body of [
    { email: "uninvited@example.test" },
    { email: "invitee@example.test", callbackURL: `/invite/${id}` },
    { email: "invitee@example.test", metadata: { invitationId: randomUUID() } },
    { email: "wrong@example.test", metadata: { invitationId: id } },
  ]) {
    const response = await stranger.request(
      "/api/auth/sign-in/magic-link",
      "POST",
      body,
    );
    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe("INVITATION_REQUIRED");
  }
  expect(await users()).toHaveLength(1);
  expect(app.emails).toHaveLength(2);
});

test("an invited new account verifies email and must accept before accessing company data", async () => {
  const owner = await app.login();
  const id = await invite(owner);
  const member = await app.login("invitee@example.test", "Invited person", id);
  expect((await member.request("/api/accounts")).status).toBe(409);
  expect(
    (
      await member.request("/api/auth/organization/create", "POST", {
        name: "Other",
        slug: "other",
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await member.request("/api/auth/organization/accept-invitation", "POST", {
        invitationId: id,
      })
    ).status,
  ).toBe(200);
  const context = await (await member.request("/api/context")).json();
  expect(context.role).toBe("member");
  expect(
    (
      await member.request("/api/auth/organization/accept-invitation", "POST", {
        invitationId: id,
      })
    ).ok,
  ).toBe(false);
  const again = await app.login("invitee@example.test");
  expect((await again.request("/api/accounts")).status).toBe(200);
  await owner.request("/api/auth/organization/remove-member", "POST", {
    memberIdOrEmail: "invitee@example.test",
  });
  expect((await again.request("/api/accounts")).status).toBe(409);
  expect(
    (
      await again.request("/api/auth/organization/create", "POST", {
        name: "Other",
        slug: "other",
      })
    ).status,
  ).toBe(403);
});

for (const change of ["canceled", "expired"] as const) {
  test(`${change} invitations cannot authorize signup, including links already sent`, async () => {
    const owner = await app.login();
    const id = await invite(owner);
    const member = app.agent();
    const url = await link(member, "invitee@example.test", id);
    if (change === "canceled")
      await owner.request("/api/auth/organization/cancel-invitation", "POST", {
        invitationId: id,
      });
    else
      await app.pool.query(
        "UPDATE invitation SET \"expiresAt\"=now()-interval '1 minute' WHERE id=$1",
        [id],
      );
    // A replacement invitation must not revive the canceled/expired token.
    if (change === "canceled") await invite(owner);
    const verified = await member.request(url);
    expect(verified.headers.get("location")).toContain(
      "error=INVITATION_REQUIRED",
    );
    expect(await users()).toHaveLength(1);
    if (change === "expired")
      expect(
        (
          await member.request("/api/auth/sign-in/magic-link", "POST", {
            email: "invitee@example.test",
            metadata: { invitationId: id },
          })
        ).status,
      ).toBe(403);
  });
}

test("simultaneous first signups create exactly one user, owner, and company", async () => {
  const first = app.agent();
  const second = app.agent();
  const firstLink = await link(first, "first@example.test");
  const secondLink = await link(second, "second@example.test");
  const authContext = await app.app.auth.$context;
  const original = authContext.adapter.create;
  let arrivals = 0;
  let release = () => {};
  const barrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  // Both signup hooks must see an empty installation before either insert.
  authContext.adapter.create = async (args) => {
    if (args.model === "user") {
      if (++arrivals === 2) release();
      await barrier;
    }
    return original(args);
  };
  let responses: Response[];
  try {
    responses = await Promise.all([
      first.request(firstLink),
      second.request(secondLink),
    ]);
  } finally {
    authContext.adapter.create = original;
    release();
  }
  expect(arrivals).toBe(2);
  expect(responses.every((response) => response.status < 500)).toBe(true);
  expect(
    responses.filter(
      (response) =>
        response.headers.get("location") ===
        "http://localhost:3000/onboarding?next=/accounts",
    ),
  ).toHaveLength(1);
  expect(await users()).toHaveLength(1);
  expect((await app.pool.query("SELECT id FROM organization")).rowCount).toBe(
    1,
  );
  expect(
    (await app.pool.query("SELECT id FROM member WHERE role='owner'")).rowCount,
  ).toBe(1);
  expect(
    (
      await app.agent().request("/api/auth/sign-in/magic-link", "POST", {
        email: "third@example.test",
      })
    ).status,
  ).toBe(403);
});

test("an old public signup token cannot gain permission by changing its callback to an invitation", async () => {
  const stranger = app.agent();
  const oldLink = await link(stranger, "later@example.test");
  const owner = await app.login();
  const id = await invite(owner, "later@example.test");
  const url = new URL(oldLink, "http://localhost:3000");
  url.searchParams.set("callbackURL", `/invite/${id}`);
  const response = await stranger.request(url.pathname + url.search);
  expect(response.headers.get("location")).toContain(
    "error=INVITATION_REQUIRED",
  );
  expect(await users()).toHaveLength(1);
});

test("migration rejects multiple legacy companies without deleting or combining data", async () => {
  const owner = await app.login();
  const first = await app.workspace(owner);
  const outsider = await app.existingAccount();
  const second = await app.legacyWorkspace(outsider);
  await app.pool.query(
    "DELETE FROM crm_schema_migrations WHERE name='007_single_company.sql'",
  );
  await expect(migrate(app.pool)).rejects.toThrow(
    "Single-company CRM requires one organization",
  );
  expect(
    (await app.pool.query("SELECT id FROM organization ORDER BY id")).rows
      .map((row) => row.id)
      .sort(),
  ).toEqual([first.workspace.id, second.workspace.id].sort());
  expect(await users()).toHaveLength(2);
});
