import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool, type PoolClient } from "pg";

const __backendDir = dirname(fileURLToPath(import.meta.url));
import type { WorkspaceContext } from "../src/lib/auth/types";
import {
  type CrmList,
  DataError,
  type Member,
  type Message,
} from "../src/lib/data/contracts";
import { createDataService } from "../src/lib/data/service";
import {
  type DataState,
  type Entity,
  emptyState,
  entityReferences,
  messageReferences,
  type Store,
} from "../src/lib/data/store";
import { databaseUrl } from "./config";
import {
  createPostgresReadService,
  normalizeEntityValue,
  type PostgresReadOptions,
  reportReadMetric,
} from "./read-service";

export function openDatabase(connectionString = databaseUrl()) {
  return new Pool({ connectionString, max: 10, connectionTimeoutMillis: 5000 });
}

async function migrateOnce(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(740021)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS crm_schema_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
    );
    const directory = resolve(__backendDir, "migrations");
    const files = readdirSync(directory)
      .filter((name) => /^\d+_.*\.sql$/.test(name))
      .sort();
    const { rows } = await client.query<{ name: string; checksum: string }>(
      "SELECT name, checksum FROM crm_schema_migrations",
    );
    if (rows.some((row) => !files.includes(row.name)))
      throw new Error(
        "Database has an unknown migration; use the matching backend version",
      );
    for (const name of files) {
      const sql = readFileSync(resolve(directory, name), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const previous = rows.find((row) => row.name === name);
      if (previous) {
        if (previous.checksum !== checksum)
          throw new Error(`Applied migration ${name} was modified`);
        continue;
      }
      await client.query(sql);
      await client.query(
        "INSERT INTO crm_schema_migrations (name,checksum) VALUES ($1,$2)",
        [name, checksum],
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

export async function migrate(pool: Pool) {
  for (let attempt = 0; ; attempt++) {
    try {
      await migrateOnce(pool);
      return;
    } catch (error) {
      const constraint = (error as { constraint?: string }).constraint;
      if (constraint !== "organization_owner_count" || attempt >= 4)
        throw error;
      // Better Auth commits the organization before its initial owner member.
      // Releasing the failed migration lets that blocked member insert finish.
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

export async function readState(
  client: PoolClient,
  context: WorkspaceContext,
  observeRows?: (rows: unknown[]) => void,
): Promise<DataState> {
  const state = emptyState();
  const organizationId = context.workspace.id;
  const members = await client.query<Member>(
    `SELECT u.id, u.name, u.email, u.image FROM member m JOIN "user" u ON u.id=m."userId" WHERE m."organizationId"=$1`,
    [organizationId],
  );
  observeRows?.(members.rows);
  for (const member of members.rows) state.members.set(member.id, member);
  const entities = await client.query<{
    id: string;
    kind: Entity["kind"];
    payload: Entity["value"];
    owner_id: string | null;
    created_by: string;
  }>(
    `SELECT e.id,e.kind,e.payload,e.owner_id,e.created_by FROM crm_entities e
     WHERE e.organization_id=$1 AND (e.kind <> 'conversations' OR e.created_by=$2
       OR EXISTS (SELECT 1 FROM crm_conversation_shares s WHERE s.organization_id=e.organization_id AND s.conversation_id=e.id AND s.user_id=$2))`,
    [organizationId, context.user.id],
  );
  observeRows?.(entities.rows);
  for (const row of entities.rows) {
    const member = row.owner_id ? state.members.get(row.owner_id) : undefined;
    const person = member ? { id: member.id, name: member.name } : null;
    const value = normalizeEntityValue(row, context.user.id, person);
    state.entities.set(row.id, { kind: row.kind, value } as Entity);
  }
  const messages = await client.query<{ id: string; payload: Message }>(
    `SELECT m.id,m.payload FROM crm_messages m JOIN crm_entities e ON e.id=m.conversation_id
     WHERE e.organization_id=$1 AND e.kind='conversations' AND (e.created_by=$2
       OR EXISTS (SELECT 1 FROM crm_conversation_shares s WHERE s.organization_id=e.organization_id AND s.conversation_id=e.id AND s.user_id=$2))`,
    [organizationId, context.user.id],
  );
  observeRows?.(messages.rows);
  for (const row of messages.rows) state.messages.set(row.id, row.payload);
  const shares = await client.query<{
    conversation_id: string;
    user_id: string;
  }>(
    `SELECT s.conversation_id,s.user_id FROM crm_conversation_shares s
     JOIN crm_entities e ON e.id=s.conversation_id
     WHERE s.organization_id=$1 AND e.created_by=$2`,
    [organizationId, context.user.id],
  );
  observeRows?.(shares.rows);
  for (const row of shares.rows)
    state.conversationShares.set(row.conversation_id, [
      ...(state.conversationShares.get(row.conversation_id) ?? []),
      row.user_id,
    ]);
  const generations = await client.query<{
    conversation_id: string;
    response_id: string;
    attempt_id: string;
    generation: number;
    revision: number;
    mode: "append" | "replace";
    status?: Message["status"];
  }>(
    `SELECT g.conversation_id,g.response_id,g.attempt_id,g.generation,g.revision,g.mode,g.status
     FROM crm_chat_generations g JOIN crm_entities e
       ON e.organization_id=g.organization_id AND e.id=g.conversation_id
     WHERE g.organization_id=$1 AND e.created_by=$2`,
    [organizationId, context.user.id],
  );
  observeRows?.(generations.rows);
  for (const row of generations.rows)
    state.assistantGenerations.set(
      `${row.conversation_id}\u0000${row.response_id}`,
      {
        responseId: row.response_id,
        attemptId: row.attempt_id,
        generation: row.generation,
        revision: row.revision,
        mode: row.mode,
        status: row.status,
      },
    );
  const receipts = await client.query<{
    conversation_id: string;
    idempotency_key: string;
    payload: DataState["chatMutationReceipts"] extends Map<string, infer T>
      ? T
      : never;
  }>(
    `SELECT r.conversation_id,r.idempotency_key,r.payload
     FROM crm_chat_mutation_receipts r JOIN crm_entities e
       ON e.organization_id=r.organization_id AND e.id=r.conversation_id
     WHERE r.organization_id=$1 AND e.created_by=$2`,
    [organizationId, context.user.id],
  );
  observeRows?.(receipts.rows);
  for (const row of receipts.rows)
    state.chatMutationReceipts.set(
      `${row.conversation_id}\u0000${row.idempotency_key}`,
      row.payload,
    );
  const lists = await client.query<{ value: CrmList }>(
    `SELECT jsonb_build_object('id',l.id,'name',l.name,'recordType',l.record_type,
      'createdAt',l.created_at,'updatedAt',l.updated_at,
      'recordIds',COALESCE((SELECT jsonb_agg(r.record_id ORDER BY r.record_id) FROM crm_list_records r
        WHERE r.organization_id=l.organization_id AND r.list_id=l.id),'[]'::jsonb)) AS value
     FROM crm_lists l WHERE l.organization_id=$1`,
    [organizationId],
  );
  observeRows?.(lists.rows);
  for (const row of lists.rows) state.lists.set(row.value.id, row.value);
  return state;
}

export async function persistState(
  client: PoolClient,
  context: WorkspaceContext,
  before: DataState,
  after: DataState,
) {
  const organizationId = context.workspace.id;
  for (const [id, entry] of after.entities) {
    if (JSON.stringify(before.entities.get(id)) === JSON.stringify(entry))
      continue;
    const value = entry.value;
    const ownerId =
      "owner" in value
        ? value.owner?.id
        : "assignee" in value
          ? value.assignee?.id
          : null;
    if (before.entities.has(id)) {
      await client.query(
        "UPDATE crm_entities SET payload=$1,owner_id=$2 WHERE id=$3 AND organization_id=$4",
        [JSON.stringify(value), ownerId ?? null, id, organizationId],
      );
    } else {
      await client.query(
        "INSERT INTO crm_entities (id,organization_id,kind,created_by,owner_id,payload) VALUES ($1,$2,$3,$4,$5,$6)",
        [
          id,
          organizationId,
          entry.kind,
          context.user.id,
          ownerId ?? null,
          JSON.stringify(value),
        ],
      );
    }
  }
  // Only replace indexes for changed rows visible to this actor. Other users' chats
  // retain their references, which still prevent deletion of referenced records.
  for (const [id, entry] of after.entities) {
    if (JSON.stringify(before.entities.get(id)) === JSON.stringify(entry))
      continue;
    await client.query(
      "DELETE FROM crm_entity_links WHERE source_id=$1 AND organization_id=$2",
      [id, organizationId],
    );
    for (const ref of entityReferences(entry))
      await client.query(
        "INSERT INTO crm_entity_links VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
        [organizationId, id, ref.id],
      );
  }
  for (const [id, message] of after.messages) {
    if (JSON.stringify(before.messages.get(id)) === JSON.stringify(message))
      continue;
    if (before.messages.has(id))
      await client.query(
        "UPDATE crm_messages SET payload=$1 WHERE id=$2 AND organization_id=$3",
        [JSON.stringify(message), id, organizationId],
      );
    else
      await client.query(
        "INSERT INTO crm_messages (id,organization_id,conversation_id,sequence,payload) VALUES ($1,$2,$3,$4,$5)",
        [
          id,
          organizationId,
          message.conversationId,
          message.sequence,
          JSON.stringify(message),
        ],
      );
    await client.query(
      "DELETE FROM crm_message_links WHERE source_id=$1 AND organization_id=$2",
      [id, organizationId],
    );
    for (const ref of messageReferences(message))
      await client.query(
        "INSERT INTO crm_message_links VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
        [organizationId, id, ref.id],
      );
  }
  for (const id of before.messages.keys())
    if (!after.messages.has(id))
      await client.query(
        "DELETE FROM crm_messages WHERE id=$1 AND organization_id=$2",
        [id, organizationId],
      );
  // Detach outgoing references first, so a multi-record import/change can remove
  // several related entities without depending on Map iteration order.
  for (const id of before.entities.keys())
    if (!after.entities.has(id))
      await client.query(
        "DELETE FROM crm_entity_links WHERE source_id=$1 AND organization_id=$2",
        [id, organizationId],
      );
  for (const id of before.entities.keys())
    if (!after.entities.has(id))
      await client.query(
        "DELETE FROM crm_entities WHERE id=$1 AND organization_id=$2",
        [id, organizationId],
      );
  for (const id of before.lists.keys())
    if (!after.lists.has(id))
      await client.query(
        "DELETE FROM crm_lists WHERE organization_id=$1 AND id=$2",
        [organizationId, id],
      );
  for (const [id, list] of after.lists) {
    if (JSON.stringify(before.lists.get(id)) === JSON.stringify(list)) continue;
    await client.query(
      `INSERT INTO crm_lists (id,organization_id,name,record_type,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,updated_at=EXCLUDED.updated_at`,
      [
        id,
        organizationId,
        list.name,
        list.recordType,
        list.createdAt,
        list.updatedAt,
      ],
    );
    await client.query(
      "DELETE FROM crm_list_records WHERE organization_id=$1 AND list_id=$2",
      [organizationId, id],
    );
    for (const recordId of list.recordIds)
      await client.query(
        "INSERT INTO crm_list_records (organization_id,record_type,list_id,record_id) VALUES ($1,$2,$3,$4)",
        [organizationId, list.recordType, id, recordId],
      );
  }
  for (const [id, recipients] of after.conversationShares) {
    if (
      JSON.stringify(before.conversationShares.get(id) ?? []) ===
      JSON.stringify(recipients)
    )
      continue;
    await client.query(
      "DELETE FROM crm_conversation_shares WHERE organization_id=$1 AND conversation_id=$2",
      [organizationId, id],
    );
    for (const userId of recipients)
      await client.query(
        "INSERT INTO crm_conversation_shares (organization_id,conversation_id,user_id,owner_id) VALUES ($1,$2,$3,$4)",
        [organizationId, id, userId, context.user.id],
      );
  }
  for (const [key, generation] of after.assistantGenerations) {
    if (
      JSON.stringify(before.assistantGenerations.get(key)) ===
      JSON.stringify(generation)
    )
      continue;
    const [conversationId] = key.split("\u0000");
    await client.query(
      `INSERT INTO crm_chat_generations
         (organization_id,conversation_id,response_id,attempt_id,generation,revision,mode,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (organization_id,conversation_id,response_id) DO UPDATE SET
         attempt_id=EXCLUDED.attempt_id,generation=EXCLUDED.generation,
         revision=EXCLUDED.revision,mode=EXCLUDED.mode,status=EXCLUDED.status`,
      [
        organizationId,
        conversationId,
        generation.responseId,
        generation.attemptId,
        generation.generation,
        generation.revision,
        generation.mode,
        generation.status ?? null,
      ],
    );
  }
  for (const [key, receipt] of after.chatMutationReceipts) {
    if (
      JSON.stringify(before.chatMutationReceipts.get(key)) ===
      JSON.stringify(receipt)
    )
      continue;
    await client.query(
      `INSERT INTO crm_chat_mutation_receipts
         (organization_id,conversation_id,idempotency_key,payload)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (organization_id,conversation_id,idempotency_key) DO UPDATE
         SET payload=EXCLUDED.payload`,
      [
        organizationId,
        receipt.conversationId,
        receipt.idempotencyKey,
        JSON.stringify(receipt),
      ],
    );
  }
}

export function createPostgresStore(
  pool: Pool,
  context: WorkspaceContext,
  options: PostgresReadOptions = {},
): Store {
  async function transaction<T>(
    write: boolean,
    fn: (state: DataState) => T,
  ): Promise<T> {
    const client = await pool.connect();
    const started = performance.now();
    let queryCount = 0;
    let returnedRows = 0;
    let dataRows = 0;
    let serializedBytes = 0;
    const measuring = !write && options.onRead !== undefined;
    try {
      await client.query(
        write ? "BEGIN" : "BEGIN ISOLATION LEVEL REPEATABLE READ",
      );
      queryCount += 1;
      if (write)
        await client.query(
          "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
          [context.workspace.id],
        );
      const member = await client.query(
        'SELECT id FROM member WHERE "organizationId"=$1 AND "userId"=$2 FOR KEY SHARE',
        [context.workspace.id, context.user.id],
      );
      queryCount += 1;
      if (measuring) {
        returnedRows += member.rowCount ?? 0;
        serializedBytes += Buffer.byteLength(JSON.stringify(member.rows));
      }
      if (!member.rowCount)
        throw new DataError(
          "forbidden",
          "You no longer belong to this workspace",
        );
      const before = await readState(
        client,
        context,
        !measuring
          ? undefined
          : (rows) => {
              queryCount += 1;
              returnedRows += rows.length;
              dataRows += rows.length;
              serializedBytes += Buffer.byteLength(JSON.stringify(rows));
            },
      );
      const after = write ? structuredClone(before) : before;
      const result = fn(after);
      if (write) await persistState(client, context, before, after);
      await client.query("COMMIT");
      queryCount += 1;
      if (measuring)
        reportReadMetric(options, {
          operation: "fullState",
          queryCount,
          returnedRows,
          dataRows,
          serializedBytes,
          elapsedMs: performance.now() - started,
        });
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      const code = (error as { code?: string }).code;
      if (code === "23505")
        throw new DataError("conflict", "This item already exists");
      if (code === "23503")
        throw new DataError(
          "conflict",
          "This item is still referenced, or its related record or member is no longer available",
        );
      throw error;
    } finally {
      client.release();
    }
  }
  return {
    read: (fn) => transaction(false, fn),
    write: (fn) => transaction(true, fn),
  };
}
export const createPostgresAdapter = (
  pool: Pool,
  context: WorkspaceContext,
  options: PostgresReadOptions = {},
) => {
  const stateful = createDataService(createPostgresStore(pool, context), {
    id: context.user.id,
    name: context.user.name,
  });
  return {
    ...stateful,
    ...createPostgresReadService(pool, context, options),
  };
};

if (import.meta.main) {
  const pool = openDatabase();
  try {
    await migrate(pool);
    console.log(
      "PostgreSQL migrations applied (no sample users or records added)",
    );
  } finally {
    await pool.end();
  }
}
