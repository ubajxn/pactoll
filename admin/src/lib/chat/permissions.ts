import type { MutationToolCall } from "./tools";
import type { ChatMessage } from "./types";

export function pendingMutationCalls(
  messages: ChatMessage[],
): MutationToolCall[] {
  return messages.flatMap((message) =>
    message.parts.flatMap((part): MutationToolCall[] => {
      if (
        (part.type === "tool-createRecord" ||
          part.type === "tool-updateRecord") &&
        part.state === "input-available"
      )
        return [
          {
            toolName:
              part.type === "tool-createRecord"
                ? "createRecord"
                : "updateRecord",
            toolCallId: part.toolCallId,
            input: part.input,
          },
        ];
      return [];
    }),
  );
}
