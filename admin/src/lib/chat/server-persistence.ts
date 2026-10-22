import type { UIMessageStreamOutcome } from "ai";
import { type DataAdapter, DataError } from "@/lib/data/contracts";
import type { ChatMessage } from "./types";
import { toBlocks } from "./types";

export type GeneratedResponseSnapshot = {
  response: ChatMessage;
  outcome: UIMessageStreamOutcome;
  finishReason?: string;
  attemptId: string;
  generation: number;
};

function statusFor(
  outcome: UIMessageStreamOutcome,
  finishReason?: string,
): "partial" | "final" | "interrupted" {
  if (outcome.status === "completed" && finishReason !== "tool-calls")
    return "final";
  if (outcome.status === "failed" || outcome.status === "aborted")
    return "interrupted";
  return "partial";
}

/** The server is the sole writer for live generated assistant messages. */
export async function persistGeneratedResponse(
  data: DataAdapter,
  conversationId: string,
  snapshot: GeneratedResponseSnapshot,
) {
  const input = {
    attemptId: snapshot.attemptId,
    generation: snapshot.generation,
    revision: 1,
    blocks: toBlocks(snapshot.response),
    status: statusFor(snapshot.outcome, snapshot.finishReason),
  };
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await data.saveAssistantGeneration(
        conversationId,
        snapshot.response.id,
        input,
      );
      return { saved: true } as const;
    } catch (error) {
      lastError = error;
      const retryable =
        !(error instanceof DataError) ||
        error.code === "server" ||
        error.code === "unavailable";
      if (!retryable || attempt === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 25 * 2 ** attempt));
    }
  }
  return {
    saved: false,
    error:
      lastError instanceof DataError && lastError.code === "conflict"
        ? "This response could not be saved because its generation changed."
        : "The completed response could not be saved. Retry while this server is still running.",
  } as const;
}
