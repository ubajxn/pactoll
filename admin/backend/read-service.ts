import type { Pool, QueryResult, QueryResultRow } from "pg";
import type { WorkspaceContext } from "../src/lib/auth/types";
import {
  type Activity,
  accountSchema,
  type Conversation,
  type CrmList,
  type DataAdapter,
  DataError,
  idSchema,
  type Member,
  type Message,
  type Person,
  type RecordKind,
  type Records,
  recordKinds,
} from "../src/lib/data/contracts";
import { parse } from "../src/lib/data/service";
import type { Entity } from "../src/lib/data/store";

export type ReadOperation =
  | "listLists"
  | "getList"
  | "listMembers"
  | "list"
  | "get"
  | "listActivity"
  | "listConversations"
  | "getConversation"
  | "listConversationShares"
  | "listMessages";

export interface ReadPathMetric {
  operation: ReadOperation | "fullState";
  queryCount: number;
  returnedRows: number;
  dataRows: number;
  serializedBytes: number;
  elapsedMs: number;
}

export interface PostgresReadOptions {
  onRead?: (metric: ReadPathMetric) => void | Promise<void>;
}

export function reportReadMetric(
  options: PostgresReadOptions,
  metric: ReadPathMetric,
) {
  try {
    void Promise.resolve(options.onRead?.(metric)).catch(() => {});
  } catch {
    // Diagnostics must not turn a successful read into an application error.
  }
}

export interface EntityRow {
  id: string;
  kind: Entity["kind"];
  payload: Entity["value"];
  owner_id: string | null;
  created_by: string;
}

export function normalizeEntityValue(
  row: EntityRow,
  actorId: string,
  person: Person | null,
) {
  const value = row.payload;
  if (row.kind === "conversations")
    (value as Conversation).access =
      row.created_by === actorId ? "owner" : "viewer";
  if (row.kind === "accounts") {
    const fields = Object.fromEntries(
      Object.keys(accountSchema.shape)
        .filter((key) => key in value)
        .map((key) => [key, value[key as keyof typeof value]]),
    );
    try {
      Object.assign(value, accountSchema.parse(fields));
    } catch {
      // Imported data may not pass strict validation (e.g. bare URLs);
      // keep the raw payload rather than crashing the list endpoint.
    }
  }
  if ("owner" in value) value.owner = person;
  if ("assignee" in value) value.assignee = person;
  return value;
}

type ReadMethods = Pick<
  DataAdapter,
  | "listLists"
  | "getList"
  | "listMembers"
  | "list"
  | "get"
  | "listActivity"
  | "listConversations"
  | "getConversation"
  | "listConversationShares"
  | "listMessages"
>;

interface RecordRow extends EntityRow {
  person_id: string | null;
  person_name: string | null;
}

interface ConversationRow {
  id: string;
  payload: Conversation;
  created_by: string;
}

const recordSelect = `SELECT e.id,e.kind,e.payload,e.owner_id,e.created_by,
  owner_user.id AS person_id,owner_user.name AS person_name
  FROM crm_entities e
  LEFT JOIN member owner_member
    ON owner_member."organizationId"=e.organization_id
   AND owner_member."userId"=e.owner_id
  LEFT JOIN "user" owner_user ON owner_user.id=owner_member."userId"`;

function validateRecordKind(kind: unknown): asserts kind is RecordKind {
  if (!recordKinds.includes(kind as RecordKind))
    throw new DataError("validation", "Unsupported record kind");
}

export function createPostgresReadService(
  pool: Pool,
  context: WorkspaceContext,
  options: PostgresReadOptions = {},
): ReadMethods {
  const organizationId = context.workspace.id;
  const actorId = context.user.id;
  const measuring = options.onRead !== undefined;

  async function read<T>(
    operation: ReadOperation,
    run: (
      query: <Row extends QueryResultRow = QueryResultRow>(
        sql: string,
        values?: unknown[],
      ) => Promise<QueryResult<Row>>,
    ) => Promise<T>,
  ) {
    const client = await pool.connect();
    const started = performance.now();
    let queryCount = 0;
    let returnedRows = 0;
    let dataRows = 0;
    let serializedBytes = 0;
    const measuredQuery = async <Row extends QueryResultRow = QueryResultRow>(
      sql: string,
      values?: unknown[],
    ) => {
      queryCount += 1;
      const result = await client.query<Row>(sql, values);
      if (measuring) {
        returnedRows += result.rowCount ?? 0;
        serializedBytes += Buffer.byteLength(JSON.stringify(result.rows));
      }
      return result;
    };
    try {
      await measuredQuery("BEGIN ISOLATION LEVEL REPEATABLE READ");
      const membership = await measuredQuery(
        'SELECT id FROM member WHERE "organizationId"=$1 AND "userId"=$2 FOR KEY SHARE',
        [organizationId, actorId],
      );
      if (!membership.rowCount)
        throw new DataError(
          "forbidden",
          "You no longer belong to this workspace",
        );
      const dataQuery = async <Row extends QueryResultRow = QueryResultRow>(
        sql: string,
        values?: unknown[],
      ) => {
        const response = await measuredQuery<Row>(sql, values);
        if (measuring) dataRows += response.rowCount ?? 0;
        return response;
      };
      const result = await run(dataQuery);
      await measuredQuery("COMMIT");
      reportReadMetric(options, {
        operation,
        queryCount,
        returnedRows,
        dataRows,
        serializedBytes,
        elapsedMs: performance.now() - started,
      });
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  const recordValue = (row: RecordRow) =>
    normalizeEntityValue(
      row,
      actorId,
      row.person_id && row.person_name
        ? { id: row.person_id, name: row.person_name }
        : null,
    );

  async function exactRecord<K extends RecordKind>(
    operation: "get" | "listActivity",
    kind: K,
    id: string,
  ): Promise<Records[K]> {
    return read(operation, async (query) => {
      validateRecordKind(kind);
      parse(idSchema, id);
      const result = await query<RecordRow>(
        `${recordSelect}
         WHERE e.organization_id=$1 AND e.kind=$2 AND e.id=$3`,
        [organizationId, kind, id],
      );
      const row = result.rows[0];
      if (!row) throw new DataError("not_found", `${kind}/${id} was not found`);
      return recordValue(row) as Records[K];
    });
  }

  const conversationValue = (row: ConversationRow) =>
    normalizeEntityValue(
      {
        ...row,
        kind: "conversations",
        owner_id: null,
      },
      actorId,
      null,
    ) as Conversation;

  async function exactConversation(id: string) {
    return read("getConversation", async (query) => {
      parse(idSchema, id);
      const result = await query<ConversationRow>(
        `SELECT e.id,e.payload,e.created_by
         FROM crm_entities e
         WHERE e.organization_id=$1 AND e.kind='conversations' AND e.id=$3
           AND (e.created_by=$2 OR EXISTS (
             SELECT 1 FROM crm_conversation_shares s
             WHERE s.organization_id=e.organization_id
               AND s.conversation_id=e.id AND s.user_id=$2
           ))`,
        [organizationId, actorId, id],
      );
      const row = result.rows[0];
      if (!row)
        throw new DataError("not_found", `conversations/${id} was not found`);
      return conversationValue(row);
    });
  }

  function readLists(id?: string) {
    return read(id ? "getList" : "listLists", async (query) => {
      if (id !== undefined) parse(idSchema, id);
      const result = await query<{ value: CrmList }>(
        `SELECT jsonb_build_object('id',l.id,'name',l.name,'recordType',l.record_type,
          'createdAt',l.created_at,'updatedAt',l.updated_at,
          'recordIds',COALESCE((SELECT jsonb_agg(r.record_id ORDER BY r.record_id)
            FROM crm_list_records r WHERE r.organization_id=l.organization_id AND r.list_id=l.id),'[]'::jsonb)) AS value
         FROM crm_lists l WHERE l.organization_id=$1 AND ($2::text IS NULL OR l.id=$2)`,
        [organizationId, id ?? null],
      );
      return result.rows
        .map((row) => row.value)
        .sort(
          (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
        );
    });
  }

  return {
    listLists: () => readLists(),
    async getList(id) {
      const value = (await readLists(id))[0];
      if (!value) throw new DataError("not_found", "List was not found");
      return value;
    },
    listMembers() {
      return read("listMembers", async (query) => {
        const result = await query<Member>(
          `SELECT u.id,u.name,u.email,u.image
           FROM member m JOIN "user" u ON u.id=m."userId"
           WHERE m."organizationId"=$1`,
          [organizationId],
        );
        return result.rows.sort(
          (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
        );
      });
    },
    list<K extends RecordKind>(kind: K): Promise<Records[K][]> {
      return read("list", async (query) => {
        validateRecordKind(kind);
        const result = await query<RecordRow>(
          `${recordSelect}
           WHERE e.organization_id=$1 AND e.kind=$2`,
          [organizationId, kind],
        );
        return result.rows
          .map((row) => recordValue(row) as Records[K])
          .sort(
            (a, b) =>
              (a.createdAt ?? "").localeCompare(b.createdAt ?? "") ||
              (a.id ?? "").localeCompare(b.id ?? ""),
          );
      });
    },
    get<K extends RecordKind>(kind: K, id: string) {
      return exactRecord("get", kind, id);
    },
    async listActivity(kind, id): Promise<Activity[]> {
      return (await exactRecord("listActivity", kind, id)).activity;
    },
    listConversations() {
      return read("listConversations", async (query) => {
        const result = await query<ConversationRow>(
          `SELECT e.id,e.payload,e.created_by
           FROM crm_entities e
           WHERE e.organization_id=$1 AND e.kind='conversations'
             AND (e.created_by=$2 OR EXISTS (
               SELECT 1 FROM crm_conversation_shares s
               WHERE s.organization_id=e.organization_id
                 AND s.conversation_id=e.id AND s.user_id=$2
             ))`,
          [organizationId, actorId],
        );
        return result.rows
          .map(conversationValue)
          .sort(
            (a, b) =>
              b.updatedAt.localeCompare(a.updatedAt) ||
              a.id.localeCompare(b.id),
          );
      });
    },
    getConversation: exactConversation,
    listConversationShares(id) {
      return read("listConversationShares", async (query) => {
        parse(idSchema, id);
        const result = await query<{
          created_by: string;
          id: string | null;
          name: string | null;
          email: string | null;
          image: string | null;
        }>(
          `SELECT e.created_by,recipient.id,recipient.name,recipient.email,recipient.image
           FROM crm_entities e
           LEFT JOIN crm_conversation_shares actor_share
             ON actor_share.organization_id=e.organization_id
            AND actor_share.conversation_id=e.id AND actor_share.user_id=$2
           LEFT JOIN crm_conversation_shares share
             ON share.organization_id=e.organization_id
            AND share.conversation_id=e.id AND e.created_by=$2
           LEFT JOIN member recipient_member
             ON recipient_member."organizationId"=share.organization_id
            AND recipient_member."userId"=share.user_id
           LEFT JOIN "user" recipient ON recipient.id=recipient_member."userId"
           WHERE e.organization_id=$1 AND e.kind='conversations' AND e.id=$3
             AND (e.created_by=$2 OR actor_share.user_id IS NOT NULL)`,
          [organizationId, actorId, id],
        );
        const row = result.rows[0];
        if (!row)
          throw new DataError("not_found", `conversations/${id} was not found`);
        if (row.created_by !== actorId)
          throw new DataError(
            "forbidden",
            "Only the chat owner can change this conversation",
          );
        return result.rows
          .flatMap((recipient) =>
            recipient.id && recipient.name && recipient.email
              ? [
                  {
                    id: recipient.id,
                    name: recipient.name,
                    email: recipient.email,
                    image: recipient.image,
                  },
                ]
              : [],
          )
          .sort(
            (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
          );
      });
    },
    listMessages(id) {
      return read("listMessages", async (query) => {
        parse(idSchema, id);
        const result = await query<{ payload: Message | null }>(
          `SELECT message.payload
           FROM crm_entities conversation
           LEFT JOIN crm_messages message
             ON message.organization_id=conversation.organization_id
            AND message.conversation_id=conversation.id
           WHERE conversation.organization_id=$1
             AND conversation.kind='conversations' AND conversation.id=$3
             AND (conversation.created_by=$2 OR EXISTS (
               SELECT 1 FROM crm_conversation_shares share
               WHERE share.organization_id=conversation.organization_id
                 AND share.conversation_id=conversation.id AND share.user_id=$2
             ))`,
          [organizationId, actorId, id],
        );
        if (!result.rowCount)
          throw new DataError("not_found", `conversations/${id} was not found`);
        return result.rows
          .flatMap((row) => (row.payload ? [row.payload] : []))
          .sort((a, b) => a.sequence - b.sequence);
      });
    },
  };
}
