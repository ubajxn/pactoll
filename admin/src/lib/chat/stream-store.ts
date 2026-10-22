import type { UIMessageStreamOutcome } from "ai";
import type { ChatMessage } from "./types";

type Subscriber = ReadableStreamDefaultController<string>;

export type StreamPersistenceSnapshot = {
  response: ChatMessage;
  outcome: UIMessageStreamOutcome;
  finishReason?: string;
  generation: number;
};

export type StoredChatStream = {
  conversationId: string;
  responseId: string;
  attemptId: string;
  abortController: AbortController;
  signal: AbortSignal;
  chunks: string[];
  bufferedCharacters: number;
  subscribers: Set<Subscriber>;
  done: boolean;
  persistence: "pending" | "saved" | "failed" | "startup_failed";
  persistenceError?: string;
  persistenceSnapshot?: StreamPersistenceSnapshot;
  completedAt?: number;
  expires?: ReturnType<typeof setTimeout>;
};

type StreamRegistry = Map<string, StoredChatStream>;

const globalStreams = globalThis as typeof globalThis & {
  __crmChatStreams?: StreamRegistry;
};

if (!globalStreams.__crmChatStreams) globalStreams.__crmChatStreams = new Map();
const streams = globalStreams.__crmChatStreams;
const completedStreamTtlMs = 30 * 60 * 1000;
const maxCompletedStreams = 50;
const maxBufferedCharacters = 2_000_000;

function closeSubscribers(stream: StoredChatStream) {
  for (const subscriber of stream.subscribers) {
    try {
      subscriber.close();
    } catch {
      // A disconnected response may already have closed its controller.
    }
  }
  stream.subscribers.clear();
}

function remove(conversationId: string, stream: StoredChatStream) {
  if (streams.get(conversationId) !== stream) return false;
  streams.delete(conversationId);
  clearTimeout(stream.expires);
  closeSubscribers(stream);
  return true;
}

function pruneCompletedStreams() {
  const completed = [...streams.entries()]
    .filter(([, stream]) => stream.done)
    .sort(
      ([, left], [, right]) =>
        (left.completedAt ?? 0) - (right.completedAt ?? 0),
    );
  for (const [conversationId, stream] of completed.slice(
    0,
    Math.max(0, completed.length - maxCompletedStreams),
  ))
    remove(conversationId, stream);
}

function sse(value: unknown) {
  return `data: ${JSON.stringify(value)}\n\n`;
}

/** Rebuild the prior assistant before replaying a continuation into an empty SDK state. */
export function replayPrefix(
  message: ChatMessage | undefined,
  attemptId: string,
) {
  if (!message || message.role !== "assistant") return [];
  const chunks = [
    sse({
      type: "start",
      messageId: message.id,
      messageMetadata: message.metadata,
    }),
  ];
  for (const [index, part] of message.parts.entries()) {
    const id = `replay-${attemptId}-${index}`;
    if (part.type === "step-start") chunks.push(sse({ type: "start-step" }));
    else if (part.type === "text")
      chunks.push(
        sse({ type: "text-start", id }),
        sse({ type: "text-delta", id, delta: part.text }),
        sse({ type: "text-end", id }),
      );
    else if (part.type === "reasoning")
      chunks.push(
        sse({ type: "reasoning-start", id }),
        sse({ type: "reasoning-delta", id, delta: part.text }),
        sse({ type: "reasoning-end", id }),
      );
    else if (part.type === "data-block")
      chunks.push(sse({ type: "data-block", data: part.data }));
    else if (part.type.startsWith("tool-") && "toolCallId" in part) {
      const toolName = part.type.slice(5);
      chunks.push(
        sse({
          type: "tool-input-available",
          toolCallId: part.toolCallId,
          toolName,
          input: "input" in part ? part.input : undefined,
        }),
      );
      if (part.state === "output-available")
        chunks.push(
          sse({
            type: "tool-output-available",
            toolCallId: part.toolCallId,
            output: part.output,
          }),
        );
      else if (part.state === "output-error")
        chunks.push(
          sse({
            type: "tool-output-error",
            toolCallId: part.toolCallId,
            errorText: part.errorText,
          }),
        );
    }
  }
  return chunks;
}

export function beginChatStream({
  conversationId,
  responseId,
  attemptId,
  prefix = [],
}: {
  conversationId: string;
  responseId: string;
  attemptId: string;
  prefix?: string[];
}) {
  const previous = streams.get(conversationId);
  if (previous) {
    previous.abortController.abort();
    remove(conversationId, previous);
  }
  const abortController = new AbortController();
  const stream: StoredChatStream = {
    conversationId,
    responseId,
    attemptId,
    abortController,
    signal: abortController.signal,
    chunks: [...prefix],
    bufferedCharacters: prefix.reduce((sum, chunk) => sum + chunk.length, 0),
    subscribers: new Set(),
    done: false,
    persistence: "pending",
  };
  streams.set(conversationId, stream);
  return stream;
}

/** Drain one exact attempt; obsolete readers can never mutate its replacement. */
export async function captureChatStream(
  stream: StoredChatStream,
  source: ReadableStream<string>,
) {
  const reader = source.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (streams.get(stream.conversationId) !== stream) continue;
      if (stream.bufferedCharacters + value.length > maxBufferedCharacters) {
        stream.persistence = "failed";
        stream.persistenceError =
          "The response exceeded the replay buffer limit.";
        stream.abortController.abort();
        break;
      }
      stream.chunks.push(value);
      stream.bufferedCharacters += value.length;
      for (const subscriber of stream.subscribers) {
        try {
          subscriber.enqueue(value);
        } catch {
          stream.subscribers.delete(subscriber);
        }
      }
    }
  } finally {
    reader.releaseLock();
    if (streams.get(stream.conversationId) === stream) {
      stream.done = true;
      stream.completedAt = Date.now();
      closeSubscribers(stream);
      stream.expires = setTimeout(
        () => remove(stream.conversationId, stream),
        completedStreamTtlMs,
      );
      stream.expires.unref?.();
      pruneCompletedStreams();
    }
  }
}

export function resumeChatStream(conversationId: string) {
  const stream = streams.get(conversationId);
  if (!stream) return null;
  let subscriber: Subscriber | undefined;
  return new ReadableStream<string>({
    start(controller) {
      for (const chunk of stream.chunks) controller.enqueue(chunk);
      if (stream.done) controller.close();
      else {
        subscriber = controller;
        stream.subscribers.add(controller);
      }
    },
    cancel() {
      if (subscriber) stream.subscribers.delete(subscriber);
    },
  });
}

export function getChatStream(conversationId: string) {
  return streams.get(conversationId);
}

export function setChatStreamPersistence(
  stream: StoredChatStream,
  snapshot: StreamPersistenceSnapshot,
  result: { saved: boolean; error?: string },
) {
  if (streams.get(stream.conversationId) !== stream) return false;
  stream.persistenceSnapshot = snapshot;
  stream.persistence = result.saved ? "saved" : "failed";
  stream.persistenceError = result.error;
  return true;
}

export function failChatStream(stream: StoredChatStream, error: string) {
  if (streams.get(stream.conversationId) !== stream) return false;
  stream.abortController.abort();
  stream.persistence = "startup_failed";
  stream.persistenceError = error;
  stream.done = true;
  stream.completedAt = Date.now();
  closeSubscribers(stream);
  stream.expires = setTimeout(
    () => remove(stream.conversationId, stream),
    completedStreamTtlMs,
  );
  stream.expires.unref?.();
  pruneCompletedStreams();
  return true;
}

export function acknowledgeChatStream(
  conversationId: string,
  responseId: string,
  attemptId: string,
) {
  const stream = streams.get(conversationId);
  if (!stream) return "missing" as const;
  if (stream.responseId !== responseId || stream.attemptId !== attemptId)
    return "replaced" as const;
  if (stream.persistence === "startup_failed") {
    remove(conversationId, stream);
    return "acknowledged" as const;
  }
  if (stream.persistence !== "saved") return stream.persistence;
  remove(conversationId, stream);
  return "acknowledged" as const;
}

export function stopChatStream(
  conversationId: string,
  responseId: string,
  attemptId: string,
) {
  const stream = streams.get(conversationId);
  if (
    !stream ||
    stream.responseId !== responseId ||
    stream.attemptId !== attemptId
  )
    return false;
  stream.abortController.abort();
  return true;
}
