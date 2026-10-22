import { jsonSchema, tool, zodSchema } from "ai";
import { z } from "zod";
import {
  accountSchema,
  contactSchema,
  createRecordProposalInputSchema,
  type DataAdapter,
  idSchema,
  mutationProposalOutputSchema,
  opportunitySchema,
  recordKinds,
  recordUpdateSchemas,
  referenceSchema,
  taskSchema,
  updateRecordProposalInputSchema,
} from "@/lib/data/contracts";
import { matchesSearch, searchRecord } from "@/lib/search";

export const MAX_LOOKUPS = 8;

// LM Studio requires object parameters with top-level properties. Describe the
// payload variants inside `input`, but validate with the discriminated union so
// a record's fields must still match its selected type.
function mutationToolSchema<T extends { type: string; input: object }>(
  schema: z.ZodType<T>,
  parameters: z.ZodObject,
) {
  return jsonSchema<T>(() => zodSchema(parameters).jsonSchema, {
    validate: zodSchema(schema).validate,
  });
}

const createRecordInputSchema = createRecordProposalInputSchema;
const updateRecordInputSchema = updateRecordProposalInputSchema;
export const mutationOutputSchema = mutationProposalOutputSchema;
export type MutationToolName = "createRecord" | "updateRecord";
export type MutationToolCall = {
  toolName: MutationToolName;
  toolCallId: string;
  input: unknown;
};
export const searchInputSchema = z.object({
  query: z
    .string()
    .max(200)
    .describe(
      "Words to match across record fields; empty lists records. Do not use a full question.",
    ),
  kind: z
    .enum(recordKinds)
    .nullable()
    .describe(
      "Restrict to one entity type, or null for all records and tasks.",
    ),
  offset: z.number().int().min(0).max(100000).default(0),
});
const searchOutputSchema = z.object({
  total: z.number().int().nonnegative(),
  nextOffset: z.number().int().nullable(),
  results: z
    .array(
      z.object({
        reference: referenceSchema,
        name: z.string().max(1000),
        summary: z.string().max(1000),
      }),
    )
    .max(20),
});
const recordOutputSchema = z.object({
  reference: referenceSchema,
  details: z.string().max(24000),
  truncated: z.boolean(),
});

// Executed through the authenticated data adapter; tests inject isolated adapters.
export const crmTools = {
  searchRecords: tool({
    description:
      "Search current CRM accounts, contacts, opportunities and tasks. Returns exact IDs and short summaries, 20 at a time. Search names, owners, statuses, dates and other fields. Paginate with nextOffset; fetch details using getRecord. Ask for clarification when multiple matches are ambiguous.",
    inputSchema: searchInputSchema,
    outputSchema: searchOutputSchema,
  }),
  getRecord: tool({
    description:
      "Read a CRM record or task by exact type and ID, including its fields, relationships, notes and activity. Use directly for explicit @mentions; never guess an ID.",
    inputSchema: referenceSchema,
    outputSchema: recordOutputSchema,
  }),
  createRecord: tool({
    description:
      "Propose creating one CRM account, contact, opportunity, or task. The user must review and approve every proposed record before it is created. Supply only fields the user requested; do not infer facts or create duplicates.",
    inputSchema: mutationToolSchema(
      createRecordInputSchema,
      z.strictObject({
        type: z.enum(recordKinds),
        input: z.union([
          accountSchema,
          contactSchema,
          opportunitySchema,
          taskSchema,
        ]),
      }),
    ),
    outputSchema: mutationOutputSchema,
  }),
  updateRecord: tool({
    description:
      "Propose an update to exactly one CRM record or task. The user must review and approve the precise field changes before anything is changed. Use getRecord first when the current state matters, and send only the fields to change.",
    inputSchema: mutationToolSchema(
      updateRecordInputSchema,
      z.strictObject({
        type: z.enum(recordKinds),
        id: idSchema,
        input: z.union([
          recordUpdateSchemas.accounts,
          recordUpdateSchemas.contacts,
          recordUpdateSchemas.opportunities,
          recordUpdateSchemas.tasks,
        ]),
      }),
    ),
    outputSchema: mutationOutputSchema,
  }),
};

export async function searchRecords(data: DataAdapter, input: unknown) {
  const { query, kind, offset } = searchInputSchema.parse(input);
  const groups = await Promise.all(
    (kind ? [kind] : recordKinds).map(async (type) =>
      (await data.list(type))
        .filter((record) => matchesSearch([JSON.stringify(record)], query))
        .map((record) => {
          const item = searchRecord(type, record);
          return {
            reference: { type, id: record.id },
            name: item.title,
            summary: item.subtitle,
          };
        }),
    ),
  );
  const results = groups
    .flat()
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name) ||
        a.reference.type.localeCompare(b.reference.type) ||
        a.reference.id.localeCompare(b.reference.id),
    );
  return searchOutputSchema.parse({
    total: results.length,
    nextOffset: offset + 20 < results.length ? offset + 20 : null,
    results: results.slice(offset, offset + 20),
  });
}

export async function getRecord(data: DataAdapter, input: unknown) {
  const reference = referenceSchema.parse(input);
  const record = await data.get(reference.type, reference.id);
  const details = JSON.stringify(record);
  return recordOutputSchema.parse({
    reference,
    details: details.slice(0, 24000),
    truncated: details.length > 24000,
  });
}

export async function executeMutation(
  data: DataAdapter,
  conversationId: string,
  call: MutationToolCall,
) {
  if (call.toolName === "createRecord") {
    const request = createRecordInputSchema.parse(call.input);
    return mutationOutputSchema.parse(
      await data.applyChatMutation(conversationId, {
        idempotencyKey: call.toolCallId,
        mutation: { operation: "create", ...request },
      }),
    );
  }
  const request = updateRecordInputSchema.parse(call.input);
  return mutationOutputSchema.parse(
    await data.applyChatMutation(conversationId, {
      idempotencyKey: call.toolCallId,
      mutation: { operation: "update", ...request },
    }),
  );
}

export function denyMutation(call: MutationToolCall) {
  if (call.toolName === "createRecord") {
    createRecordInputSchema.parse(call.input);
    return mutationOutputSchema.parse({
      status: "permission_denied",
      text: "Permission denied. No CRM changes were made.",
      records: [],
    });
  }
  const request = updateRecordInputSchema.parse(call.input);
  return mutationOutputSchema.parse({
    status: "permission_denied",
    text: "Permission denied. No CRM changes were made.",
    records: [{ type: request.type, id: request.id }],
  });
}
