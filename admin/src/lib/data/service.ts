import type { z } from "zod";
import {
  type Activity,
  assistantGenerationBeginSchema,
  assistantGenerationWriteSchema,
  type Conversation,
  chatMutationRequestSchema,
  chatMutationResultSchema,
  conversationSchema,
  conversationShareSchema,
  type DataAdapter,
  DataError,
  idSchema,
  listInputSchema,
  listMembershipSchema,
  listUpdateSchema,
  type Message,
  messageSchema,
  messageUpdateSchema,
  noteInputSchema,
  type Person,
  patchSchema,
  type RecordKind,
  type RecordReference,
  type Records,
  recordSchemas,
  recordUpdateSchemas,
} from "./contracts";
import {
  type DataState,
  type Entity,
  entityReferences,
  messageReferences,
  type Store,
} from "./store";

export function parse<T extends z.ZodType>(
  schema: T,
  input: unknown,
): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new DataError(
      "validation",
      result.error.issues
        .map((i) => `${i.path.join(".") || "payload"}: ${i.message}`)
        .join("; "),
    );
  return result.data;
}
function entity(state: DataState, kind: Entity["kind"], id: string): Entity {
  parse(idSchema, id);
  const found = state.entities.get(id);
  if (!found || found.kind !== kind)
    throw new DataError("not_found", `${kind}/${id} was not found`);
  return found;
}
function record<K extends RecordKind>(
  state: DataState,
  kind: K,
  id: string,
): Records[K] {
  return entity(state, kind, id).value as Records[K];
}
function crmList(state: DataState, id: string) {
  parse(idSchema, id);
  const value = state.lists.get(id);
  if (!value) throw new DataError("not_found", "List was not found");
  return value;
}
function checkListRecord(state: DataState, type: RecordKind, id: string) {
  if (state.entities.get(id)?.kind !== type)
    throw new DataError(
      "validation",
      "Choose a record matching this list’s record type",
    );
}
function conversation(state: DataState, id: string): Conversation {
  return entity(state, "conversations", id).value as Conversation;
}
function ownedConversation(state: DataState, id: string): Conversation {
  const value = conversation(state, id);
  if (value.access !== "owner")
    throw new DataError(
      "forbidden",
      "Only the chat owner can change this conversation",
    );
  return value;
}
function conversationShares(state: DataState, id: string) {
  ownedConversation(state, id);
  return (state.conversationShares.get(id) ?? [])
    .flatMap((memberId) => {
      const member = state.members.get(memberId);
      return member ? [member] : [];
    })
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}
function checkRefs(state: DataState, refs: RecordReference[], unique = true) {
  const keys = new Set<string>();
  for (const ref of refs) {
    if (unique && keys.has(`${ref.type}/${ref.id}`))
      throw new DataError("validation", "Duplicate related record");
    keys.add(`${ref.type}/${ref.id}`);
    if (state.entities.get(ref.id)?.kind !== ref.type)
      throw new DataError(
        "validation",
        `Related ${ref.type}/${ref.id} does not exist`,
      );
  }
}
function validateEntity(state: DataState, entry: Entity) {
  checkRefs(state, entityReferences(entry));
  const value = entry.value;
  const person =
    "owner" in value
      ? value.owner
      : "assignee" in value
        ? value.assignee
        : null;
  if (person) {
    const member = state.members.get(person.id);
    if (!member)
      throw new DataError("validation", "Choose an existing team member");
    person.name = member.name;
  }
  if (
    entry.kind === "tasks" &&
    "relatedRecords" in entry.value &&
    entry.value.relatedRecords.some((r) => r.type === "tasks")
  )
    throw new DataError(
      "validation",
      "Tasks may relate only to accounts, contacts, and opportunities",
    );
}
function touch<T extends { updatedAt: string }>(value: T) {
  value.updatedAt = new Date(
    Math.max(Date.now(), Date.parse(value.updatedAt) + 1),
  ).toISOString();
}
function activity(
  value: Records[RecordKind],
  type: Activity["type"],
  summary: string,
  actor: Person | null,
) {
  touch(value);
  value.activity.push({
    id: crypto.randomUUID(),
    type,
    summary,
    actor,
    createdAt: value.updatedAt,
  });
}
function newBase() {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), createdAt: now, updatedAt: now };
}
function getMessage(state: DataState, conversationId: string, id: string) {
  conversation(state, conversationId);
  parse(idSchema, id);
  const message = state.messages.get(id);
  if (!message || message.conversationId !== conversationId)
    throw new DataError(
      "not_found",
      "Message was not found in this conversation",
    );
  return message;
}
function generationKey(conversationId: string, responseId: string) {
  return `${conversationId}\u0000${responseId}`;
}
function mutationKey(conversationId: string, idempotencyKey: string) {
  return `${conversationId}\u0000${idempotencyKey}`;
}
function mutationText(
  verb: "Created" | "Updated",
  type: RecordKind,
  name: string,
) {
  const prefix = `${verb} ${type.slice(0, -1)} “`;
  const suffix = "”.";
  return `${prefix}${name.slice(0, 1000 - prefix.length - suffix.length)}${suffix}`;
}
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

export function createDataService(
  store: Store,
  actor: Person | null = null,
): DataAdapter {
  const recordActivity = (
    value: Records[RecordKind],
    type: Activity["type"],
    summary: string,
  ) => activity(value, type, summary, actor);
  return {
    async listLists() {
      return store.read((s) =>
        [...s.lists.values()].sort(
          (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
        ),
      );
    },
    async getList(id) {
      return store.read((s) => crmList(s, id));
    },
    async createList(input) {
      return store.write((s) => {
        const { recordId, ...fields } = parse(listInputSchema, input);
        if (recordId) checkListRecord(s, fields.recordType, recordId);
        const value = {
          ...newBase(),
          ...fields,
          recordIds: recordId ? [recordId] : [],
        };
        s.lists.set(value.id, value);
        return value;
      });
    },
    async updateList(id, input) {
      return store.write((s) => {
        const value = crmList(s, id);
        Object.assign(value, parse(listUpdateSchema, input));
        touch(value);
        return value;
      });
    },
    async deleteList(id) {
      return store.write((s) => {
        crmList(s, id);
        s.lists.delete(id);
      });
    },
    async addToList(id, input) {
      return store.write((s) => {
        const value = crmList(s, id);
        const { recordId } = parse(listMembershipSchema, input);
        checkListRecord(s, value.recordType, recordId);
        if (!value.recordIds.includes(recordId)) {
          value.recordIds.push(recordId);
          touch(value);
        }
        return value;
      });
    },
    async removeFromList(id, recordId) {
      return store.write((s) => {
        const value = crmList(s, id);
        parse(idSchema, recordId);
        value.recordIds = value.recordIds.filter((id) => id !== recordId);
        touch(value);
      });
    },
    async listMembers() {
      return store.read((s) =>
        [...s.members.values()].sort(
          (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
        ),
      );
    },
    async list(kind) {
      return store.read((s) =>
        [...s.entities.values()]
          .filter((e) => e.kind === kind)
          .map((e) => e.value as Records[typeof kind])
          .sort(
            (a, b) =>
              a.createdAt.localeCompare(b.createdAt) ||
              a.id.localeCompare(b.id),
          ),
      );
    },
    async get(kind, id) {
      return store.read((s) => record(s, kind, id));
    },
    async create(kind, input, options) {
      return store.write((s) => {
        const value = {
          ...(parse(recordSchemas[kind], input) as object),
          ...newBase(),
          notes: [],
          activity: [],
        } as unknown as Records[typeof kind];
        const entry = { kind, value } as Entity;
        validateEntity(s, entry);
        recordActivity(value, "created", "Record created");
        s.entities.set(value.id, entry);
        if (options?.listId !== undefined) {
          const list = crmList(s, options.listId);
          checkListRecord(s, list.recordType, value.id);
          list.recordIds.push(value.id);
          touch(list);
        }
        return value;
      });
    },
    async update(kind, id, input) {
      return store.write((s) => {
        const value = record(s, kind, id);
        const update = parse(recordUpdateSchemas[kind], input);
        const wasIncomplete = "status" in value && value.status !== "completed";
        Object.assign(value, update);
        validateEntity(s, { kind, value } as Entity);
        recordActivity(
          value,
          wasIncomplete && "status" in value && value.status === "completed"
            ? "completed"
            : "updated",
          "Record updated",
        );
        return value;
      });
    },
    async delete(kind, id) {
      return store.write((s) => {
        record(s, kind, id);
        const dependent = [...s.entities.values()].find(
          (e) =>
            e.value.id !== id && entityReferences(e).some((r) => r.id === id),
        );
        const message = [...s.messages.values()].find((m) =>
          messageReferences(m).some((r) => r.id === id),
        );
        if (dependent || message)
          throw new DataError(
            "conflict",
            `Remove references from ${dependent ? `${dependent.kind}/${dependent.value.id}` : `conversation ${message?.conversationId}`} before deleting this record`,
          );
        s.entities.delete(id);
        for (const list of s.lists.values()) {
          if (!list.recordIds.includes(id)) continue;
          list.recordIds = list.recordIds.filter((recordId) => recordId !== id);
          touch(list);
        }
      });
    },
    async addNote(kind, id, input) {
      return store.write((s) => {
        const value = record(s, kind, id);
        const note = {
          ...parse(noteInputSchema, input),
          author: actor,
          ...newBase(),
        };
        value.notes.push(note);
        recordActivity(value, "note_added", "Note added");
        return note;
      });
    },
    async updateNote(kind, id, noteId, input) {
      return store.write((s) => {
        const value = record(s, kind, id);
        const note = value.notes.find((n) => n.id === noteId);
        if (!note)
          throw new DataError("not_found", "Note was not found in this record");
        Object.assign(
          note,
          parse(noteInputSchema.pick({ content: true }), input),
        );
        touch(note);
        recordActivity(value, "note_updated", "Note updated");
        return note;
      });
    },
    async deleteNote(kind, id, noteId) {
      return store.write((s) => {
        const value = record(s, kind, id);
        if (!value.notes.some((n) => n.id === noteId))
          throw new DataError("not_found", "Note was not found in this record");
        value.notes = value.notes.filter((n) => n.id !== noteId);
        recordActivity(value, "note_deleted", "Note deleted");
      });
    },
    async listActivity(kind, id) {
      return store.read((s) => record(s, kind, id).activity);
    },
    async listConversations() {
      return store.read((s) =>
        [...s.entities.values()]
          .filter((e) => e.kind === "conversations")
          .map((e) => e.value as Conversation)
          .sort(
            (a, b) =>
              b.updatedAt.localeCompare(a.updatedAt) ||
              a.id.localeCompare(b.id),
          ),
      );
    },
    async getConversation(id) {
      return store.read((s) => conversation(s, id));
    },
    async createConversation(input) {
      return store.write((s) => {
        const value: Conversation = {
          ...parse(conversationSchema, input),
          ...newBase(),
          access: "owner",
        };
        s.entities.set(value.id, { kind: "conversations", value });
        return value;
      });
    },
    async updateConversation(id, input) {
      return store.write((s) => {
        const value = ownedConversation(s, id);
        Object.assign(value, parse(patchSchema(conversationSchema), input));
        touch(value);
        return value;
      });
    },
    async deleteConversation(id) {
      return store.write((s) => {
        ownedConversation(s, id);
        s.entities.delete(id);
        s.conversationShares.delete(id);
        for (const [key, message] of s.messages)
          if (message.conversationId === id) s.messages.delete(key);
        for (const key of s.assistantGenerations.keys())
          if (key.startsWith(`${id}\u0000`)) s.assistantGenerations.delete(key);
        for (const [key, receipt] of s.chatMutationReceipts)
          if (receipt.conversationId === id) s.chatMutationReceipts.delete(key);
      });
    },
    async listMessages(id) {
      return store.read((s) => {
        conversation(s, id);
        return [...s.messages.values()]
          .filter((m) => m.conversationId === id)
          .sort((a, b) => a.sequence - b.sequence);
      });
    },
    async listConversationShares(id) {
      return store.read((s) => conversationShares(s, id));
    },
    async shareConversation(id, input) {
      return store.write((s) => {
        ownedConversation(s, id);
        const { memberId } = parse(conversationShareSchema, input);
        if (!s.members.has(memberId) || memberId === actor?.id)
          throw new DataError(
            "validation",
            "Choose another member of this workspace",
          );
        s.conversationShares.set(id, [
          ...new Set([...(s.conversationShares.get(id) ?? []), memberId]),
        ]);
        return conversationShares(s, id);
      });
    },
    async unshareConversation(id, memberId) {
      return store.write((s) => {
        ownedConversation(s, id);
        parse(idSchema, memberId);
        s.conversationShares.set(
          id,
          (s.conversationShares.get(id) ?? []).filter((id) => id !== memberId),
        );
      });
    },
    async appendMessage(id, input) {
      return store.write((s) => {
        const parent = ownedConversation(s, id);
        const fields = parse(messageSchema, input);
        const messageId = fields.id ?? crypto.randomUUID();
        if (
          fields.role === "assistant" &&
          s.assistantGenerations.has(generationKey(id, messageId))
        )
          throw new DataError(
            "conflict",
            "Generated assistant messages must use generation-aware persistence",
          );
        if (s.messages.has(messageId))
          throw new DataError(
            "conflict",
            "Message ID already exists; update the saved message instead",
          );
        const sequence =
          Math.max(
            0,
            ...[...s.messages.values()]
              .filter((m) => m.conversationId === id)
              .map((m) => m.sequence),
          ) + 1;
        const message: Message = {
          ...newBase(),
          ...fields,
          id: messageId,
          conversationId: id,
          sequence,
        };
        checkRefs(s, messageReferences(message), false);
        s.messages.set(message.id, message);
        touch(parent);
        return message;
      });
    },
    async updateMessage(id, messageId, input) {
      return store.write((s) => {
        ownedConversation(s, id);
        const message = getMessage(s, id, messageId);
        if (
          message.role === "assistant" &&
          s.assistantGenerations.has(generationKey(id, messageId))
        )
          throw new DataError(
            "conflict",
            "Generated assistant messages must use generation-aware persistence",
          );
        Object.assign(message, parse(messageUpdateSchema, input));
        checkRefs(s, messageReferences(message), false);
        touch(message);
        touch(conversation(s, id));
        return message;
      });
    },
    async beginAssistantGeneration(id, input) {
      return store.write((s) => {
        ownedConversation(s, id);
        const request = parse(assistantGenerationBeginSchema, input);
        const key = generationKey(id, request.responseId);
        const current = s.assistantGenerations.get(key);
        if (
          (current && current.attemptId !== request.expectedAttemptId) ||
          (!current && request.expectedAttemptId)
        )
          throw new DataError(
            "conflict",
            "A newer response attempt is already active",
          );
        const generation = (current?.generation ?? 0) + 1;
        const value = { ...request, generation, revision: 0 };
        s.assistantGenerations.set(key, value);
        return {
          responseId: request.responseId,
          attemptId: request.attemptId,
          generation,
          mode: request.mode,
        };
      });
    },
    async saveAssistantGeneration(id, responseId, input) {
      return store.write((s) => {
        const parent = ownedConversation(s, id);
        parse(idSchema, responseId);
        const request = parse(assistantGenerationWriteSchema, input);
        const key = generationKey(id, responseId);
        const current = s.assistantGenerations.get(key);
        if (
          !current ||
          current.attemptId !== request.attemptId ||
          current.generation !== request.generation
        )
          throw new DataError(
            "conflict",
            "This response attempt has been replaced",
          );
        const existing = s.messages.get(responseId);
        const sameWrite =
          request.revision === current.revision &&
          existing?.conversationId === id &&
          stableJson(existing.blocks) === stableJson(request.blocks) &&
          existing.status === request.status;
        if (sameWrite) return existing;
        if (request.revision <= current.revision)
          throw new DataError("conflict", "This response revision is stale");
        if (current.status === "final" && request.status !== "final")
          throw new DataError(
            "conflict",
            "A completed response cannot be replaced by a checkpoint",
          );
        const fields = {
          blocks: request.blocks,
          status: request.status,
          generation: {
            attemptId: request.attemptId,
            generation: request.generation,
          },
        };
        let message: Message;
        if (existing) {
          if (existing.conversationId !== id || existing.role !== "assistant")
            throw new DataError("conflict", "Response ID is already in use");
          Object.assign(existing, fields);
          checkRefs(s, messageReferences(existing), false);
          touch(existing);
          message = existing;
        } else {
          const sequence =
            Math.max(
              0,
              ...[...s.messages.values()]
                .filter((item) => item.conversationId === id)
                .map((item) => item.sequence),
            ) + 1;
          message = {
            ...newBase(),
            id: responseId,
            conversationId: id,
            sequence,
            role: "assistant",
            isDemo: false,
            ...fields,
          };
          checkRefs(s, messageReferences(message), false);
          s.messages.set(responseId, message);
        }
        current.revision = request.revision;
        current.status = request.status;
        touch(parent);
        return message;
      });
    },
    async applyChatMutation(id, input) {
      return store.write((s) => {
        ownedConversation(s, id);
        const request = parse(chatMutationRequestSchema, input);
        const key = mutationKey(id, request.idempotencyKey);
        const receipt = s.chatMutationReceipts.get(key);
        if (receipt) {
          if (stableJson(receipt.mutation) !== stableJson(request.mutation))
            throw new DataError(
              "conflict",
              "This approval key was already used for a different change",
            );
          return receipt.result;
        }
        const mutation = request.mutation;
        let value: Records[RecordKind];
        let verb: "Created" | "Updated";
        if (mutation.operation === "create") {
          value = {
            ...mutation.input,
            ...newBase(),
            notes: [],
            activity: [],
          } as Records[RecordKind];
          const entry = { kind: mutation.type, value } as Entity;
          validateEntity(s, entry);
          recordActivity(value, "created", "Record created");
          s.entities.set(value.id, entry);
          verb = "Created";
        } else {
          value = record(s, mutation.type, mutation.id);
          const wasIncomplete =
            "status" in value && value.status !== "completed";
          Object.assign(value, mutation.input);
          validateEntity(s, { kind: mutation.type, value } as Entity);
          recordActivity(
            value,
            wasIncomplete && "status" in value && value.status === "completed"
              ? "completed"
              : "updated",
            "Record updated",
          );
          verb = "Updated";
        }
        const name = "name" in value ? value.name : value.title;
        const result = parse(chatMutationResultSchema, {
          status: "success",
          text: mutationText(verb, mutation.type, name),
          records: [{ type: mutation.type, id: value.id }],
        });
        s.chatMutationReceipts.set(key, {
          conversationId: id,
          idempotencyKey: request.idempotencyKey,
          mutation,
          result,
        });
        return result;
      });
    },
  };
}
