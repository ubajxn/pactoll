import { afterEach, beforeEach, expect, test } from "bun:test";
import { POST as stop } from "../../src/app/api/chat/[id]/stop/route";
import {
  DELETE as acknowledge,
  GET as resume,
} from "../../src/app/api/chat/[id]/stream/route";
import { POST as generate } from "../../src/app/api/chat/route";
import {
  beginChatStream,
  stopChatStream,
} from "../../src/lib/chat/stream-store";
import { type TestApp, testApp } from "./helpers";

let app: TestApp;
const avatar =
  "data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAABQBACdASpIAEgAPm02mUmkIyKhIUgAgA2JaQB2AAAT40aNGjRo0aNGjPwAAP7svY//+wd/+g7/9B3+qZ/5GQ25gAAAAAAA";
beforeEach(async () => {
  app = await testApp();
});
afterEach(async () => {
  await app.close();
});

test("profile and workspace names are validated and normalized on the server", async () => {
  const owner = await app.login();
  expect(
    (await owner.request("/api/auth/update-user", "POST", { name: "  " }))
      .status,
  ).toBe(400);
  expect(
    (
      await owner.request("/api/auth/organization/update", "POST", {
        data: { name: "  " },
      })
    ).status,
  ).toBe(400);
  const context = await app.workspace(owner, "  Valid Workspace  ");
  expect(context.workspace.name).toBe("Valid Workspace");
  expect(
    (
      await owner.request("/api/auth/organization/update", "POST", {
        organizationId: context.workspace.id,
        data: { name: "x".repeat(101) },
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await owner.request("/api/auth/organization/update", "POST", {
        organizationId: context.workspace.id,
        data: { name: "  Renamed Workspace  " },
      })
    ).status,
  ).toBe(200);
  expect(
    (await (await owner.request("/api/context")).json()).workspace.name,
  ).toBe("Renamed Workspace");
});

test("profile avatars are validated, persisted and removable", async () => {
  const owner = await app.login();
  await app.workspace(owner);
  expect(
    (
      await owner.request("/api/auth/update-user", "POST", {
        image: "data:image/png;base64,invalid",
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await owner.request("/api/auth/update-user", "POST", {
        image: avatar,
      })
    ).status,
  ).toBe(200);
  expect((await (await owner.request("/api/context")).json()).user.image).toBe(
    avatar,
  );
  const members = await (await owner.request("/api/members")).json();
  expect(members).toHaveLength(1);
  expect(members[0].image).toBe(avatar);
  expect(
    (
      await owner.request("/api/auth/update-user", "POST", {
        image: null,
      })
    ).status,
  ).toBe(200);
  expect(
    (await (await owner.request("/api/context")).json()).user.image,
  ).toBeNull();
});

test("email failures are reported and pending invitations can be resent after recovery", async () => {
  let failing = false;
  const mailApp = await testApp({
    sendEmail: async () => {
      if (failing) throw new Error("Injected SMTP outage");
    },
  });
  try {
    const owner = await mailApp.login("owner-delivery@example.test");
    await mailApp.workspace(owner);
    failing = true;
    expect(
      (
        await owner.request("/api/auth/sign-in/magic-link", "POST", {
          email: "owner-delivery@example.test",
        })
      ).status,
    ).toBe(503);
    expect(
      (
        await owner.request("/api/auth/organization/invite-member", "POST", {
          email: "delivery@example.test",
          role: "member",
        })
      ).status,
    ).toBe(503);
    expect(mailApp.emails).toHaveLength(1);
    const pending = await (
      await owner.request("/api/auth/organization/list-invitations")
    ).json();
    expect(pending).toHaveLength(1);
    expect(pending[0].status).toBe("pending");
    await mailApp.pool.query(
      "UPDATE invitation SET \"expiresAt\"=now()-interval '1 minute' WHERE id=$1",
      [pending[0].id],
    );
    failing = false;
    const resent = await owner.request(
      "/api/auth/organization/invite-member",
      "POST",
      {
        email: "delivery@example.test",
        role: "member",
        resend: true,
      },
    );
    expect(resent.status).toBe(200);
    expect(new Date((await resent.json()).expiresAt).getTime()).toBeGreaterThan(
      Date.now(),
    );
    expect(mailApp.emails).toHaveLength(2);
    expect(mailApp.emails.at(-1)?.to).toBe("delivery@example.test");
  } finally {
    await mailApp.close();
  }
});

async function joined() {
  const owner = await app.login("owner@example.test", "Workspace Owner");
  const context = await app.workspace(owner);
  const teammate = await app.existingAccount(
    "member@example.test",
    "Team Member",
  );
  const invite = await owner.request(
    "/api/auth/organization/invite-member",
    "POST",
    { email: "member@example.test", role: "member" },
  );
  expect(invite.status).toBe(200);
  const invitation = await invite.json();
  expect(app.emails.at(-1)?.text).toContain(`/invite/${invitation.id}`);
  expect(
    (
      await teammate.request(
        "/api/auth/organization/accept-invitation",
        "POST",
        { invitationId: invitation.id },
      )
    ).status,
  ).toBe(200);
  expect(
    (
      await teammate.request("/api/auth/organization/set-active", "POST", {
        organizationId: context.workspace.id,
      })
    ).status,
  ).toBe(200);
  return { owner, teammate, context };
}

test("API requires login and workspace membership; independent workspaces cannot read or assign each other's users", async () => {
  const anonymous = app.agent();
  for (const path of [
    "members",
    "accounts",
    "conversations",
    "conversations/missing/messages",
  ])
    expect((await anonymous.request(`/api/${path}`)).status).toBe(401);
  const owner = await app.login();
  expect((await owner.request("/api/accounts")).status).toBe(200);
  const context = await app.workspace(owner);
  const account = await owner.api.create("accounts", {
    name: "Private workspace record",
    owner: { id: context.user.id, name: context.user.name },
  });
  const outsider = await app.existingAccount();
  const other = await app.legacyWorkspace(outsider, "Other Workspace");
  expect(await outsider.api.list("accounts")).toEqual([]);
  await expect(outsider.api.get("accounts", account.id)).rejects.toMatchObject({
    code: "not_found",
  });
  await expect(
    outsider.api.create("contacts", { name: "Invalid", accountId: account.id }),
  ).rejects.toMatchObject({ code: "validation" });
  await expect(
    owner.api.update("accounts", account.id, {
      owner: { id: other.user.id, name: other.user.name },
    }),
  ).rejects.toMatchObject({ code: "validation" });
  expect(
    (
      await outsider.request("/api/auth/organization/set-active", "POST", {
        organizationId: context.workspace.id,
      })
    ).status,
  ).toBe(403);
  expect(
    (await owner.request("/api/members", "POST", { name: "Fake" })).status,
  ).toBe(404);
});

test("verified invitations, role permissions, profile renames, and member removal drive real owners", async () => {
  const { owner, teammate, context } = await joined();
  const [person] = (await owner.api.listMembers()).filter(
    (member) => member.email === "member@example.test",
  );
  const account = await owner.api.create("accounts", {
    name: "Account",
    owner: { id: person.id, name: person.name },
  });
  const opportunity = await owner.api.create("opportunities", {
    name: "Deal",
    accountId: account.id,
    owner: { id: person.id, name: person.name },
  });
  const task = await owner.api.create("tasks", {
    title: "Follow up",
    assignee: { id: person.id, name: person.name },
  });
  expect(
    (
      await teammate.request("/api/auth/update-user", "POST", {
        name: "Real Updated Name",
      })
    ).status,
  ).toBe(200);
  expect((await owner.api.get("accounts", account.id)).owner?.name).toBe(
    "Real Updated Name",
  );
  expect(
    (await owner.api.get("opportunities", opportunity.id)).owner?.name,
  ).toBe("Real Updated Name");
  expect((await owner.api.get("tasks", task.id)).assignee?.name).toBe(
    "Real Updated Name",
  );
  expect(
    (
      await teammate.request("/api/auth/organization/invite-member", "POST", {
        email: "third@example.test",
        role: "admin",
      })
    ).status,
  ).toBe(403);
  const directory = await (
    await owner.request("/api/auth/organization/list-members")
  ).json();
  const ownMembership = directory.members.find(
    (member: { userId: string }) => member.userId === context.user.id,
  );
  const member = directory.members.find(
    (member: { userId: string }) => member.userId === person.id,
  );
  expect(
    (
      await owner.request("/api/auth/organization/remove-member", "POST", {
        memberIdOrEmail: ownMembership.id,
      })
    ).ok,
  ).toBe(false);
  expect(
    (
      await teammate.request(
        "/api/auth/organization/update-member-role",
        "POST",
        { memberId: member.id, role: "owner" },
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await owner.request("/api/auth/organization/update-member-role", "POST", {
        memberId: member.id,
        role: "admin",
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await owner.request("/api/auth/organization/remove-member", "POST", {
        memberIdOrEmail: member.id,
      })
    ).status,
  ).toBe(200);
  expect((await owner.api.get("accounts", account.id)).owner).toBeNull();
  expect(
    (await owner.api.get("opportunities", opportunity.id)).owner,
  ).toBeNull();
  expect((await owner.api.get("tasks", task.id)).assignee).toBeNull();
  expect((await teammate.request("/api/accounts")).status).toBe(409);
  expect(await owner.api.listMembers()).toHaveLength(1);
  const note = await owner.api.addNote("accounts", account.id, {
    content: "Authenticated note",
    author: { id: person.id, name: person.name },
  });
  expect(note.author?.id).toBe(context.user.id);
  expect(
    (await owner.api.listActivity("accounts", account.id)).at(-1)?.actor?.id,
  ).toBe(context.user.id);
});

test("invitations cannot be accepted by a different email, after cancellation, or after expiration", async () => {
  const owner = await app.login("owner@example.test");
  await app.workspace(owner);
  const invitee = await app.existingAccount("invited@example.test");
  const invite = await (
    await owner.request("/api/auth/organization/invite-member", "POST", {
      email: "invited@example.test",
      role: "member",
    })
  ).json();
  expect(
    (
      await owner.request("/api/auth/organization/accept-invitation", "POST", {
        invitationId: invite.id,
      })
    ).ok,
  ).toBe(false);
  expect(
    (
      await owner.request("/api/auth/organization/cancel-invitation", "POST", {
        invitationId: invite.id,
      })
    ).ok,
  ).toBe(true);
  expect(
    (
      await invitee.request(
        "/api/auth/organization/accept-invitation",
        "POST",
        { invitationId: invite.id },
      )
    ).ok,
  ).toBe(false);
  const next = await (
    await owner.request("/api/auth/organization/invite-member", "POST", {
      email: "invited@example.test",
      role: "member",
    })
  ).json();
  await app.pool.query(
    "UPDATE invitation SET \"expiresAt\"=now()-interval '1 minute' WHERE id=$1",
    [next.id],
  );
  expect(
    (
      await invitee.request(
        "/api/auth/organization/accept-invitation",
        "POST",
        { invitationId: next.id },
      )
    ).ok,
  ).toBe(false);
});

test("chats and all generation/stream operations stay private even between workspace teammates", async () => {
  const { owner, teammate } = await joined();
  const conversation = await owner.api.createConversation({
    title: "Owner only",
  });
  await owner.api.appendMessage(conversation.id, {
    id: "private-message",
    role: "user",
    blocks: [{ type: "text", text: "Private" }],
  });
  expect(await teammate.api.listConversations()).toEqual([]);
  for (const operation of [
    () => teammate.api.getConversation(conversation.id),
    () => teammate.api.listMessages(conversation.id),
    () => teammate.api.updateConversation(conversation.id, { title: "Stolen" }),
    () => teammate.api.deleteConversation(conversation.id),
    () =>
      teammate.api.appendMessage(conversation.id, { role: "user", blocks: [] }),
    () =>
      teammate.api.updateMessage(conversation.id, "private-message", {
        blocks: [],
      }),
  ])
    await expect(operation()).rejects.toMatchObject({ code: "not_found" });
  const previousBackend = process.env.CRM_BACKEND_URL;
  const previousAI = process.env.AI_ENABLED;
  process.env.CRM_BACKEND_URL = app.app.server.url.origin;
  process.env.AI_ENABLED = "true";
  const generation = beginChatStream({
    conversationId: conversation.id,
    responseId: "private-response",
    attemptId: "private-attempt",
  });
  const params = { params: Promise.resolve({ id: conversation.id }) };
  const request = (path: string, method = "GET", body?: unknown) =>
    new Request(`http://localhost:3000/api/chat/${conversation.id}/${path}`, {
      method,
      headers: teammate.headers(),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  try {
    expect((await resume(request("stream"), params)).status).toBe(404);
    expect(
      (await acknowledge(request("stream", "DELETE", {}), params)).status,
    ).toBe(404);
    expect((await stop(request("stop", "POST", {}), params)).status).toBe(404);
    expect(
      (
        await generate(
          request("", "POST", {
            conversationId: conversation.id,
            attemptId: "attack-attempt",
            mode: "replace",
            messages: [
              {
                id: "attack",
                role: "user",
                parts: [{ type: "text", text: "Read private chat" }],
              },
            ],
          }),
        )
      ).status,
    ).toBe(404);
    expect(generation.signal.aborted).toBe(false);
    expect(
      (
        await resume(
          new Request(
            `http://localhost:3000/api/chat/${conversation.id}/stream`,
          ),
          params,
        )
      ).status,
    ).toBe(401);
  } finally {
    stopChatStream(conversation.id, "private-response", "private-attempt");
    if (previousBackend === undefined) delete process.env.CRM_BACKEND_URL;
    else process.env.CRM_BACKEND_URL = previousBackend;
    if (previousAI === undefined) delete process.env.AI_ENABLED;
    else process.env.AI_ENABLED = previousAI;
  }
});

test("magic links are hashed, single use, expiring, origin checked and rate limited; sign-out revokes access", async () => {
  const user = await app.login("auth@example.test");
  await app.workspace(user);
  const link = new URL(app.emails[0].text.match(/https?:\/\/\S+/)?.[0] || "");
  const replay = await app.agent().request(link.pathname + link.search);
  expect(replay.headers.get("location")).toContain("error=INVALID_TOKEN");
  expect((await user.request("/api/auth/sign-out", "POST", {})).ok).toBe(true);
  expect((await user.request("/api/accounts")).status).toBe(401);
  const other = app.agent();
  await other.request("/api/auth/sign-in/magic-link", "POST", {
    email: "auth@example.test",
    callbackURL: "/home",
  });
  const expired = new URL(
    app.emails.at(-1)?.text.match(/https?:\/\/\S+/)?.[0] || "",
  );
  const stored = await app.pool.query(
    "SELECT identifier,value FROM verification",
  );
  expect(JSON.stringify(stored.rows)).not.toContain(
    expired.searchParams.get("token"),
  );
  await app.pool.query(
    "UPDATE verification SET \"expiresAt\"=now()-interval '1 minute'",
  );
  expect(
    (await other.request(expired.pathname + expired.search)).headers.get(
      "location",
    ),
  ).toContain("error=");
  const crossOrigin = await fetch(
    new URL("/api/auth/sign-in/magic-link", app.app.server.url),
    {
      method: "POST",
      headers: {
        origin: "http://evil.test",
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: "blocked@example.test" }),
    },
  );
  expect(crossOrigin.status).toBe(403);
  let last = 0;
  for (let attempt = 0; attempt < 6; attempt++)
    last = (
      await other.request("/api/auth/sign-in/magic-link", "POST", {
        email: "limited@example.test",
      })
    ).status;
  expect(last).toBe(429);
});
