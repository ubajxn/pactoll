import type {
  AssistantGeneration,
  ChatMutationInput,
  ChatMutationResult,
  Conversation,
  CrmList,
  Member,
  Message,
  RecordKind,
  RecordReference,
  Records,
} from "./contracts";

export type Entity =
  | { kind: RecordKind; value: Records[RecordKind] }
  | { kind: "conversations"; value: Conversation };
export interface DataState {
  lists: Map<string, CrmList>;
  members: Map<string, Member>;
  entities: Map<string, Entity>;
  messages: Map<string, Message>;
  conversationShares: Map<string, string[]>;
  assistantGenerations: Map<
    string,
    AssistantGeneration & { revision: number; status?: Message["status"] }
  >;
  chatMutationReceipts: Map<
    string,
    {
      conversationId: string;
      idempotencyKey: string;
      mutation: ChatMutationInput;
      result: ChatMutationResult;
    }
  >;
}
export const emptyState = (): DataState => ({
  lists: new Map(),
  members: new Map(),
  entities: new Map(),
  messages: new Map(),
  conversationShares: new Map(),
  assistantGenerations: new Map(),
  chatMutationReceipts: new Map(),
});
export interface Store {
  read<T>(fn: (state: DataState) => T): T | Promise<T>;
  write<T>(fn: (state: DataState) => T): T | Promise<T>;
}
export function entityReferences(entity: Entity): RecordReference[] {
  if (entity.kind === "conversations") return [];
  const value = entity.value;
  const refs: RecordReference[] = [];
  if ("accountId" in value && value.accountId)
    refs.push({ type: "accounts", id: value.accountId });
  if ("contactIds" in value)
    refs.push(
      ...value.contactIds.map((id) => ({ type: "contacts" as const, id })),
    );
  if ("relatedRecords" in value) refs.push(...value.relatedRecords);
  return refs;
}
export function messageReferences(message: Message): RecordReference[] {
  return message.blocks.flatMap((block) => {
    if (block.type === "mention") return [block.reference];
    return "records" in block ? block.records : [];
  });
}
