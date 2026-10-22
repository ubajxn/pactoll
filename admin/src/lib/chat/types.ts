import type { InferUITools, UIMessage } from "ai";
import type { ContentBlock, Message } from "@/lib/data/contracts";
import type { crmTools } from "./tools";

export type ChatMessage = UIMessage<
  {
    interrupted?: boolean;
    sentAt?: string;
    startedAt?: string;
    responseId?: string;
    attemptId?: string;
    generation?: number;
  },
  { block: ContentBlock },
  InferUITools<typeof crmTools>
>;
export function toChatMessage(message: Message): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    metadata: {
      interrupted: message.status !== "final",
      sentAt: message.updatedAt,
      responseId: message.generation ? message.id : undefined,
      attemptId: message.generation?.attemptId,
      generation: message.generation?.generation,
    },
    parts: message.blocks.map((block): ChatMessage["parts"][number] => {
      if (block.type === "text") return { type: "text", text: block.text };
      if (block.type === "mutation_proposal") {
        const type = `tool-${block.toolName}` as const;
        if (block.state === "failed")
          return {
            type,
            toolCallId: block.toolCallId,
            state: "output-error",
            input: block.input,
            errorText:
              block.errorText ?? "The approved change could not be applied.",
          } as ChatMessage["parts"][number];
        if (block.state !== "pending" && block.output)
          return {
            type,
            toolCallId: block.toolCallId,
            state: "output-available",
            input: block.input,
            output: block.output,
          } as ChatMessage["parts"][number];
        if (block.state !== "pending")
          return {
            type,
            toolCallId: block.toolCallId,
            state: "output-error",
            input: block.input,
            errorText: "The stored proposal result is incomplete.",
          } as ChatMessage["parts"][number];
        return {
          type,
          toolCallId: block.toolCallId,
          state: "input-available",
          input: block.input,
        } as ChatMessage["parts"][number];
      }
      return { type: "data-block", data: block };
    }),
  };
}

export function toBlocks(message: ChatMessage): ContentBlock[] {
  return message.parts.flatMap((part): ContentBlock[] => {
    if (part.type === "text") return [{ type: "text", text: part.text }];
    if (part.type === "data-block") return [part.data];
    if (
      part.type === "tool-createRecord" ||
      part.type === "tool-updateRecord"
    ) {
      if (part.state === "input-streaming") return [];
      const state =
        part.state === "input-available"
          ? "pending"
          : part.state === "output-error"
            ? "failed"
            : part.state === "output-available" &&
                part.output.status === "permission_denied"
              ? "denied"
              : part.state === "output-available"
                ? "approved"
                : "pending";
      return [
        {
          type: "mutation_proposal",
          toolName:
            part.type === "tool-createRecord" ? "createRecord" : "updateRecord",
          toolCallId: part.toolCallId,
          input: part.input,
          state,
          ...(part.state === "output-available" ? { output: part.output } : {}),
          ...(part.state === "output-error"
            ? { errorText: part.errorText }
            : {}),
        },
      ];
    }
    return [];
  });
}

export const CHAT_CHANGED = "crm:chats-changed";
export function refreshChats() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(CHAT_CHANGED));
}

/** Keep tool calls/results for the active loop; older turns can retrieve fresh data. */
export function requestMessages(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.role !== "system")
    .map((message, index, all) => ({
      id: message.id,
      role: message.role,
      metadata: message.metadata,
      parts: message.parts.flatMap((part): ChatMessage["parts"] => {
        if (part.type === "text") return [{ type: "text", text: part.text }];
        if (part.type === "data-block" && part.data.type === "mention")
          return [
            {
              type: "text",
              text: `@${part.data.label} (exact CRM reference: ${JSON.stringify(part.data.reference)})`,
            },
          ];
        if (
          index === all.length - 1 &&
          message.role === "assistant" &&
          (part.type === "step-start" ||
            part.type === "tool-searchRecords" ||
            part.type === "tool-getRecord" ||
            part.type === "tool-createRecord" ||
            part.type === "tool-updateRecord")
        )
          return [part];
        return [];
      }),
    }));
}
