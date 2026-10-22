import { z } from "zod";

export const recordKinds = [
  "accounts",
  "contacts",
  "opportunities",
  "tasks",
] as const;
export type RecordKind = (typeof recordKinds)[number];
export const stages = [
  "qualification",
  "discovery",
  "proposal",
  "negotiation",
  "won",
  "lost",
  "current_client",
  "shelved",
] as const;
export const idSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const text = z.string().trim().min(1).max(1000);
const body = z.string().max(50000);
const date = z.iso.date().nullable();
export const personSchema = z.strictObject({ id: idSchema, name: text });
export type Person = z.infer<typeof personSchema>;
export interface Member {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}
export const referenceSchema = z.strictObject({
  type: z.enum(recordKinds),
  id: idSchema,
});
export type RecordReference = z.infer<typeof referenceSchema>;
const refs = z.array(referenceSchema).max(100);
const owner = personSchema.nullable().default(null);
const accountId = idSchema.nullable().default(null);
const optionalUrl = z
  .union([z.url({ protocol: /^https?$/ }), z.literal("")])
  .default("");
export const relationshipTypes = [
  "target",
  "potential_client",
  "current_client",
  "vendor",
  "trade_publication",
  "industry_association",
  "competitor",
] as const;
export const accountSchema = z.strictObject({
  name: text,
  website: optionalUrl,
  industry: z.string().trim().max(200).default(""),
  revenue: z.number().finite().nonnegative().nullable().default(null),
  headcount: z.number().int().nonnegative().nullable().default(null),
  location: z.string().trim().max(300).default(""),
  linkedin: optionalUrl,
  facebook: optionalUrl,
  instagram: optionalUrl,
  twitter: optionalUrl,
  owner,
  relationshipType: z.enum(relationshipTypes).default("target"),
  steelProducts: z.string().trim().max(1000).default(""),
  steelNeeds: z.string().trim().max(1000).default(""),
  mediaProductionCosts: z.boolean().default(false),
  mediaPlacementCosts: z.boolean().default(false),
});
export const contactSchema = z.strictObject({
  name: text,
  email: z.union([z.email(), z.literal("")]).default(""),
  phone: z.string().max(100).default(""),
  role: z.string().max(200).default(""),
  accountId,
  owner,
});
export const opportunitySchema = z.strictObject({
  name: text,
  accountId,
  stage: z.enum(stages).default("qualification"),
  amount: z.number().finite().nonnegative().default(0),
  currency: z.literal("USD").default("USD"),
  owner,
  closeDate: date.default(null),
  contactIds: z.array(idSchema).max(100).default([]),
  nextStep: body.default(""),
});
export const taskSchema = z.strictObject({
  title: text,
  status: z
    .enum(["open", "in_progress", "completed", "canceled"])
    .default("open"),
  assignee: owner,
  dueDate: date.default(null),
  relatedRecords: refs.default([]),
});
export const recordSchemas = {
  accounts: accountSchema,
  contacts: contactSchema,
  opportunities: opportunitySchema,
  tasks: taskSchema,
};
export function patchSchema<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  const fields = Object.fromEntries(
    Object.entries(schema.shape).map(([key, field]) => [
      key,
      field instanceof z.ZodDefault ? field.removeDefault() : field,
    ]),
  ) as { [K in keyof T]: T[K] extends z.ZodDefault<infer U> ? U : T[K] };
  return z.strictObject(fields).partial();
}
export const recordUpdateSchemas = {
  accounts: patchSchema(accountSchema),
  contacts: patchSchema(contactSchema),
  opportunities: patchSchema(opportunitySchema),
  tasks: patchSchema(taskSchema),
};
export const createRecordProposalInputSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("accounts"), input: accountSchema }),
  z.strictObject({ type: z.literal("contacts"), input: contactSchema }),
  z.strictObject({
    type: z.literal("opportunities"),
    input: opportunitySchema,
  }),
  z.strictObject({ type: z.literal("tasks"), input: taskSchema }),
]);
export const updateRecordProposalInputSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("accounts"),
    id: idSchema,
    input: recordUpdateSchemas.accounts,
  }),
  z.strictObject({
    type: z.literal("contacts"),
    id: idSchema,
    input: recordUpdateSchemas.contacts,
  }),
  z.strictObject({
    type: z.literal("opportunities"),
    id: idSchema,
    input: recordUpdateSchemas.opportunities,
  }),
  z.strictObject({
    type: z.literal("tasks"),
    id: idSchema,
    input: recordUpdateSchemas.tasks,
  }),
]);
export const mutationProposalOutputSchema = z.strictObject({
  status: z.enum(["success", "failure", "permission_denied"]),
  text: z.string().max(1000),
  records: z.array(referenceSchema).max(1),
});
export const chatMutationInputSchema = z.union([
  z.strictObject({
    operation: z.literal("create"),
    type: z.literal("accounts"),
    input: accountSchema,
  }),
  z.strictObject({
    operation: z.literal("create"),
    type: z.literal("contacts"),
    input: contactSchema,
  }),
  z.strictObject({
    operation: z.literal("create"),
    type: z.literal("opportunities"),
    input: opportunitySchema,
  }),
  z.strictObject({
    operation: z.literal("create"),
    type: z.literal("tasks"),
    input: taskSchema,
  }),
  z.strictObject({
    operation: z.literal("update"),
    type: z.literal("accounts"),
    id: idSchema,
    input: recordUpdateSchemas.accounts,
  }),
  z.strictObject({
    operation: z.literal("update"),
    type: z.literal("contacts"),
    id: idSchema,
    input: recordUpdateSchemas.contacts,
  }),
  z.strictObject({
    operation: z.literal("update"),
    type: z.literal("opportunities"),
    id: idSchema,
    input: recordUpdateSchemas.opportunities,
  }),
  z.strictObject({
    operation: z.literal("update"),
    type: z.literal("tasks"),
    id: idSchema,
    input: recordUpdateSchemas.tasks,
  }),
]);
export type ChatMutationInput = z.input<typeof chatMutationInputSchema>;
export const chatMutationResultSchema = z.strictObject({
  status: z.literal("success"),
  text: z.string().max(1000),
  records: z.array(referenceSchema).length(1),
});
export type ChatMutationResult = z.infer<typeof chatMutationResultSchema>;
export const chatMutationRequestSchema = z.strictObject({
  idempotencyKey: z.string().min(1).max(200),
  mutation: chatMutationInputSchema,
});
export type ChatMutationRequest = z.input<typeof chatMutationRequestSchema>;
export const noteInputSchema = z.strictObject({
  content: z.string().trim().min(1).max(50000),
  author: personSchema.nullable().default(null),
});
export interface Note extends z.output<typeof noteInputSchema> {
  id: string;
  createdAt: string;
  updatedAt: string;
}
export interface Activity {
  id: string;
  type:
    | "created"
    | "updated"
    | "completed"
    | "note_added"
    | "note_updated"
    | "note_deleted";
  summary: string;
  actor: Person | null;
  createdAt: string;
}
export interface RecordBase {
  id: string;
  createdAt: string;
  updatedAt: string;
  notes: Note[];
  activity: Activity[];
}
export type Account = RecordBase & z.output<typeof accountSchema>;
export type Contact = RecordBase & z.output<typeof contactSchema>;
export type Opportunity = RecordBase & z.output<typeof opportunitySchema>;
export type Task = RecordBase & z.output<typeof taskSchema>;
export interface Records {
  accounts: Account;
  contacts: Contact;
  opportunities: Opportunity;
  tasks: Task;
}
export interface CreateRecords {
  accounts: z.input<typeof accountSchema>;
  contacts: z.input<typeof contactSchema>;
  opportunities: z.input<typeof opportunitySchema>;
  tasks: z.input<typeof taskSchema>;
}
export type UpdateRecord<K extends RecordKind> = Partial<CreateRecords[K]>;

const mutationProposalBlockSchema = z
  .strictObject({
    type: z.literal("mutation_proposal"),
    toolName: z.enum(["createRecord", "updateRecord"]),
    toolCallId: z.string().min(1).max(200),
    input: z.unknown(),
    state: z.enum(["pending", "approved", "denied", "failed"]),
    output: mutationProposalOutputSchema.optional(),
    errorText: z.string().min(1).max(5000).optional(),
  })
  .superRefine((proposal, context) => {
    const input =
      proposal.toolName === "createRecord"
        ? createRecordProposalInputSchema.safeParse(proposal.input)
        : updateRecordProposalInputSchema.safeParse(proposal.input);
    if (!input.success)
      context.addIssue({
        code: "custom",
        path: ["input"],
        message: "Proposal input does not match its tool",
      });
    const validState =
      (proposal.state === "pending" &&
        proposal.output === undefined &&
        proposal.errorText === undefined) ||
      (proposal.state === "approved" &&
        proposal.output?.status === "success" &&
        proposal.errorText === undefined) ||
      (proposal.state === "denied" &&
        proposal.output?.status === "permission_denied" &&
        proposal.errorText === undefined) ||
      (proposal.state === "failed" &&
        proposal.output === undefined &&
        proposal.errorText !== undefined);
    if (!validState)
      context.addIssue({
        code: "custom",
        message: "Proposal state requires matching output or error data",
      });
  });

// Stored presentation blocks only: no provider execution or mutation dispatch.
export const blockSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("text"), text: body }),
  z.strictObject({
    type: z.literal("mention"),
    reference: referenceSchema,
    label: text,
  }),
  z.strictObject({
    type: z.literal("progress"),
    text: body,
    status: z.enum(["running", "complete", "interrupted"]),
  }),
  z.strictObject({ type: z.literal("records"), records: refs }),
  z.strictObject({
    type: z.literal("table"),
    columns: z.array(text).max(50),
    rows: z
      .array(
        z
          .array(
            z.union([
              z.string().max(5000),
              z.number().finite(),
              z.boolean(),
              z.null(),
            ]),
          )
          .max(50),
      )
      .max(500),
  }),
  z.strictObject({ type: z.literal("draft"), title: text, content: body }),
  z.strictObject({ type: z.literal("warning"), text: body }),
  z.strictObject({
    type: z.literal("error"),
    text: body,
    recoverable: z.boolean(),
  }),
  z.strictObject({
    type: z.literal("confirmation"),
    actionId: idSchema,
    text: body,
    records: refs,
    status: z.enum(["pending", "confirmed", "cancelled"]),
  }),
  z.strictObject({
    type: z.literal("mutation_result"),
    text: body,
    records: refs,
    status: z.enum(["success", "partial_failure", "failure"]),
  }),
  mutationProposalBlockSchema,
]);
export type ContentBlock = z.infer<typeof blockSchema>;
export const conversationSchema = z.strictObject({
  title: text,
});
export type CreateConversation = z.input<typeof conversationSchema>;
export type UpdateConversation = Partial<CreateConversation>;
export interface Conversation extends z.output<typeof conversationSchema> {
  id: string;
  createdAt: string;
  updatedAt: string;
  access: "owner" | "viewer";
}
export const conversationShareSchema = z.strictObject({ memberId: idSchema });
export const messageSchema = z.strictObject({
  id: idSchema.optional(),
  role: z.enum(["user", "assistant", "system"]),
  blocks: z.array(blockSchema).max(100),
  status: z.enum(["partial", "final", "interrupted"]).default("final"),
  isDemo: z.boolean().default(false),
  generation: z
    .strictObject({
      attemptId: idSchema,
      generation: z.number().int().positive(),
    })
    .optional(),
});
export const messageUpdateSchema = patchSchema(
  messageSchema.pick({ blocks: true, status: true }),
);
export type AppendMessage = z.input<typeof messageSchema>;
export type UpdateMessage = z.input<typeof messageUpdateSchema>;
export interface Message extends Omit<z.output<typeof messageSchema>, "id"> {
  id: string;
  conversationId: string;
  sequence: number;
  createdAt: string;
  updatedAt: string;
}
export const assistantGenerationBeginSchema = z.strictObject({
  responseId: idSchema,
  attemptId: idSchema,
  expectedAttemptId: idSchema.optional(),
  mode: z.enum(["append", "replace"]),
});
export type AssistantGenerationBegin = z.infer<
  typeof assistantGenerationBeginSchema
>;
export interface AssistantGeneration {
  responseId: string;
  attemptId: string;
  generation: number;
  mode: "append" | "replace";
}
export const assistantGenerationWriteSchema = z.strictObject({
  attemptId: idSchema,
  generation: z.number().int().positive(),
  revision: z.number().int().positive(),
  blocks: z.array(blockSchema).max(100),
  status: z.enum(["partial", "final", "interrupted"]),
});
export type AssistantGenerationWrite = z.infer<
  typeof assistantGenerationWriteSchema
>;
export type ErrorCode =
  | "unauthorized"
  | "workspace_required"
  | "validation"
  | "not_found"
  | "conflict"
  | "server"
  | "unavailable"
  | "forbidden"
  | "unsupported_media_type";
export interface ErrorResponse {
  error: { code: ErrorCode; message: string };
}
export class DataError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DataError";
  }
}
export const listRecordKinds = [
  "accounts",
  "opportunities",
  "contacts",
] as const;
export type ListRecordKind = (typeof listRecordKinds)[number];
export const listInputSchema = z.strictObject({
  name: z.string().trim().min(1, "Enter a list name").max(100),
  recordType: z.enum(listRecordKinds),
  recordId: idSchema.optional(),
});
export const listUpdateSchema = listInputSchema.pick({ name: true });
export const listMembershipSchema = z.strictObject({ recordId: idSchema });
export interface CrmList {
  id: string;
  name: string;
  recordType: ListRecordKind;
  recordIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DataAdapter {
  listLists(): Promise<CrmList[]>;
  getList(id: string): Promise<CrmList>;
  createList(input: z.input<typeof listInputSchema>): Promise<CrmList>;
  updateList(id: string, input: { name: string }): Promise<CrmList>;
  deleteList(id: string): Promise<void>;
  addToList(id: string, input: { recordId: string }): Promise<CrmList>;
  removeFromList(id: string, recordId: string): Promise<void>;
  listMembers(): Promise<Member[]>;
  list<K extends RecordKind>(kind: K): Promise<Records[K][]>;
  get<K extends RecordKind>(kind: K, id: string): Promise<Records[K]>;
  create<K extends RecordKind>(
    kind: K,
    input: CreateRecords[K],
    options?: { listId?: string },
  ): Promise<Records[K]>;
  update<K extends RecordKind>(
    kind: K,
    id: string,
    input: UpdateRecord<K>,
  ): Promise<Records[K]>;
  delete(kind: RecordKind, id: string): Promise<void>;
  addNote(
    kind: RecordKind,
    id: string,
    input: z.input<typeof noteInputSchema>,
  ): Promise<Note>;
  updateNote(
    kind: RecordKind,
    id: string,
    noteId: string,
    input: { content: string },
  ): Promise<Note>;
  deleteNote(kind: RecordKind, id: string, noteId: string): Promise<void>;
  listActivity(kind: RecordKind, id: string): Promise<Activity[]>;
  listConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation>;
  createConversation(input: CreateConversation): Promise<Conversation>;
  updateConversation(
    id: string,
    input: UpdateConversation,
  ): Promise<Conversation>;
  deleteConversation(id: string): Promise<void>;
  listConversationShares(id: string): Promise<Member[]>;
  shareConversation(id: string, input: { memberId: string }): Promise<Member[]>;
  unshareConversation(id: string, memberId: string): Promise<void>;
  listMessages(conversationId: string): Promise<Message[]>;
  appendMessage(conversationId: string, input: AppendMessage): Promise<Message>;
  updateMessage(
    conversationId: string,
    messageId: string,
    input: UpdateMessage,
  ): Promise<Message>;
  beginAssistantGeneration(
    conversationId: string,
    input: AssistantGenerationBegin,
  ): Promise<AssistantGeneration>;
  saveAssistantGeneration(
    conversationId: string,
    responseId: string,
    input: AssistantGenerationWrite,
  ): Promise<Message>;
  applyChatMutation(
    conversationId: string,
    input: ChatMutationRequest,
  ): Promise<ChatMutationResult>;
}
