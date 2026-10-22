import { expect, test } from "bun:test";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Pool, PoolClient } from "pg";
import { migrate } from "../db";
import { isolatedDatabase } from "./helpers";

const preInvariantMigrations = [
  "001_auth.sql",
  "002_crm.sql",
  "003_chat_sharing.sql",
];

async function applyPreInvariantSchema(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "CREATE TABLE crm_schema_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
    );
    for (const name of preInvariantMigrations) {
      const sql = readFileSync(
        resolve(import.meta.dir, "../migrations", name),
        "utf8",
      );
      await client.query(sql);
      await client.query(
        "INSERT INTO crm_schema_migrations (name,checksum) VALUES ($1,$2)",
        [name, createHash("sha256").update(sql).digest("hex")],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function insertUser(pool: Pool, id: string, email: string) {
  await pool.query(
    `INSERT INTO "user" (id,name,email,"emailVerified","createdAt","updatedAt")
     VALUES ($1,$2,$3,true,now(),now())`,
    [id, email.split("@")[0], email],
  );
}

async function insertOrganization(pool: Pool, id: string, suffix: string) {
  await pool.query(
    `INSERT INTO organization (id,name,slug,"createdAt")
     VALUES ($1,$2,$3,now())`,
    [id, `Workspace ${suffix}`, `workspace-${suffix}`],
  );
}

async function insertMember(
  pool: Pool | PoolClient,
  organizationId: string,
  userId: string,
  role = "owner",
) {
  await pool.query(
    `INSERT INTO member (id,"organizationId","userId",role,"createdAt")
     VALUES ($1,$2,$3,$4,now())`,
    [randomUUID(), organizationId, userId, role],
  );
}

async function setupPreInvariantWorkspace(ownerCount = 2) {
  const database = await isolatedDatabase();
  await applyPreInvariantSchema(database.pool);
  const organizationId = randomUUID();
  await insertOrganization(database.pool, organizationId, randomUUID());
  const owners: string[] = [];
  for (let index = 0; index < ownerCount; index++) {
    const userId = randomUUID();
    owners.push(userId);
    await insertUser(
      database.pool,
      userId,
      `owner-${index}-${userId}@example.test`,
    );
    await insertMember(database.pool, organizationId, userId);
  }
  return { database, organizationId, owners };
}

async function waitForRelationLock(
  pool: Pool,
  relation: string,
  mode: string,
  granted: boolean,
) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const result = await pool.query<{ found: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM pg_locks
         WHERE database=(SELECT oid FROM pg_database WHERE datname=current_database())
           AND relation=$1::regclass AND mode=$2 AND granted=$3
       ) AS found`,
      [relation, mode, granted],
    );
    if (result.rows[0]?.found) return;
    await Bun.sleep(10);
  }
  throw new Error(
    `Timed out waiting for ${granted ? "granted" : "waiting"} ${mode} on ${relation}`,
  );
}

async function withDeadline<T>(promise: Promise<T>, label: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Timed out: ${label}`)),
          5_000,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

test("owner-count installation waits for active owner reductions before backfill", async () => {
  const { database, organizationId, owners } =
    await setupPreInvariantWorkspace();
  const writer = await database.pool.connect();
  let writerOpen = false;
  let migration: Promise<{ error?: unknown }> | undefined;
  try {
    await writer.query("BEGIN");
    writerOpen = true;
    await writer.query(
      `UPDATE member SET role='admin'
       WHERE "organizationId"=$1 AND "userId"=$2`,
      [organizationId, owners[0]],
    );
    migration = migrate(database.pool).then(
      () => ({}),
      (error) => ({ error }),
    );
    await waitForRelationLock(
      database.pool,
      "member",
      "ShareRowExclusiveLock",
      false,
    );
    await writer.query("COMMIT");
    writerOpen = false;
    const result = await withDeadline(migration, "owner migration");
    if (result.error) throw result.error;

    const count = await database.pool.query<{ owner_count: number }>(
      "SELECT owner_count FROM crm_organization_owner_counts WHERE organization_id=$1",
      [organizationId],
    );
    expect(count.rows[0]?.owner_count).toBe(1);
    expect(
      (
        await database.pool.query(
          `SELECT id FROM member
           WHERE "organizationId"=$1 AND crm_member_has_role(role, 'owner')`,
          [organizationId],
        )
      ).rowCount,
    ).toBe(1);
    await expect(
      database.pool.query(
        `UPDATE member SET role='admin'
         WHERE "organizationId"=$1 AND "userId"=$2`,
        [organizationId, owners[1]],
      ),
    ).rejects.toMatchObject({ constraint: "member_last_owner_update" });
  } finally {
    if (writerOpen) await writer.query("ROLLBACK");
    writer.release();
    if (migration) await withDeadline(migration, "migration cleanup");
    await database.close();
  }
});

test("migration retries while a committed organization waits for its initial owner", async () => {
  const database = await isolatedDatabase();
  await applyPreInvariantSchema(database.pool);
  const creatorId = randomUUID();
  const organizationId = randomUUID();
  const blocker = await database.pool.connect();
  let blockerOpen = false;
  let migration: Promise<{ error?: unknown }> | undefined;
  let ownerInsert: Promise<{ error?: unknown }> | undefined;
  try {
    await insertUser(database.pool, creatorId, `${creatorId}@example.test`);
    await insertOrganization(database.pool, organizationId, randomUUID());
    await blocker.query("BEGIN");
    blockerOpen = true;
    await blocker.query("LOCK TABLE organization IN ACCESS EXCLUSIVE MODE");

    migration = migrate(database.pool).then(
      () => ({}),
      (error) => ({ error }),
    );
    await waitForRelationLock(
      database.pool,
      "member",
      "ShareRowExclusiveLock",
      true,
    );
    ownerInsert = insertMember(database.pool, organizationId, creatorId).then(
      () => ({}),
      (error) => ({ error }),
    );
    await waitForRelationLock(
      database.pool,
      "member",
      "RowExclusiveLock",
      false,
    );
    await blocker.query("COMMIT");
    blockerOpen = false;

    const insertResult = await withDeadline(
      ownerInsert,
      "initial owner insert",
    );
    if (insertResult.error) throw insertResult.error;
    const migrationResult = await withDeadline(
      migration,
      "organization creation migration",
    );
    if (migrationResult.error) throw migrationResult.error;
    expect(
      (
        await database.pool.query(
          "SELECT owner_count FROM crm_organization_owner_counts WHERE organization_id=$1",
          [organizationId],
        )
      ).rows,
    ).toEqual([{ owner_count: 1 }]);
  } finally {
    if (blockerOpen) await blocker.query("ROLLBACK");
    blocker.release();
    if (ownerInsert) await withDeadline(ownerInsert, "owner insert cleanup");
    if (migration) await withDeadline(migration, "migration cleanup");
    await database.close();
  }
});

test("migration still rejects a genuinely ownerless legacy organization", async () => {
  const { database } = await setupPreInvariantWorkspace(1);
  try {
    await insertOrganization(database.pool, randomUUID(), randomUUID());
    await expect(
      withDeadline(migrate(database.pool), "ownerless migration rejection"),
    ).rejects.toMatchObject({ constraint: "organization_owner_count" });
    expect(
      (
        await database.pool.query(
          "SELECT to_regclass('crm_organization_owner_counts') AS relation",
        )
      ).rows,
    ).toEqual([{ relation: null }]);
  } finally {
    await database.close();
  }
});

test("single-company upgrade preserves the existing company, accounts, members and records", async () => {
  const { database, organizationId, owners } =
    await setupPreInvariantWorkspace();
  try {
    await database.pool.query(
      `INSERT INTO crm_entities (id,organization_id,kind,created_by,payload)
       VALUES ('preserved-account',$1,'accounts',$2,'{"id":"preserved-account","name":"Keep me"}')`,
      [organizationId, owners[0]],
    );
    const before = await database.pool.query("SELECT * FROM organization");
    await migrate(database.pool);
    await migrate(database.pool);
    expect(
      (await database.pool.query("SELECT * FROM organization")).rows,
    ).toEqual(before.rows);
    expect((await database.pool.query('SELECT id FROM "user"')).rowCount).toBe(
      2,
    );
    expect((await database.pool.query("SELECT id FROM member")).rowCount).toBe(
      2,
    );
    expect(
      (await database.pool.query("SELECT payload FROM crm_entities")).rows,
    ).toEqual([{ payload: { id: "preserved-account", name: "Keep me" } }]);
    expect(
      (await database.pool.query("SELECT signup_closed FROM crm_installation"))
        .rows,
    ).toEqual([{ signup_closed: true }]);
  } finally {
    await database.close();
  }
});

test("single-company upgrade completes unfinished setup for the earliest verified account", async () => {
  const database = await isolatedDatabase();
  try {
    await applyPreInvariantSchema(database.pool);
    const founder = randomUUID();
    await insertUser(database.pool, founder, "founder@example.test");
    await database.pool.query(
      'UPDATE "user" SET "createdAt"=now()-interval \'1 day\'',
    );
    await insertUser(database.pool, randomUUID(), "later@example.test");
    await migrate(database.pool);
    await migrate(database.pool);
    expect(
      (await database.pool.query("SELECT id FROM organization")).rowCount,
    ).toBe(1);
    expect(
      (await database.pool.query('SELECT "userId",role FROM member')).rows,
    ).toEqual([{ userId: founder, role: "owner" }]);
    expect((await database.pool.query('SELECT id FROM "user"')).rowCount).toBe(
      2,
    );
  } finally {
    await database.close();
  }
});
