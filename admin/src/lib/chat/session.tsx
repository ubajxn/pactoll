"use client";

import { Chat } from "@ai-sdk/react";
import {
  type ChatTransport,
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { createContext, type ReactNode, useContext, useState } from "react";
import type {
  ContentBlock,
  Conversation,
  CreateConversation,
  DataAdapter,
  Message,
} from "@/lib/data/contracts";
import { DataError } from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";
import {
  denyMutation,
  executeMutation,
  getRecord,
  MAX_LOOKUPS,
  type MutationToolCall,
  searchRecords,
} from "./tools";
import {
  type ChatMessage,
  refreshChats,
  requestMessages,
  toBlocks,
  toChatMessage,
} from "./types";

/** Lives in the application shell, so navigating to a record does not lose a stream. */
export class ChatSession {
  chat: Chat<ChatMessage>;
  saveError: string | null = null;
  private saved = new Map<string, string>();
  private pending = Promise.resolve();
  private responseId = crypto.randomUUID();
  private acceptedAttemptId: string | undefined;
  private dispatchedAttemptId: string | undefined;
  private regenerationTarget: ChatMessage | undefined;
  private dispatchUnconfirmed = false;
  private responseStartedAt = new Date().toISOString();
  private resumable: boolean;
  private lookupController = new AbortController();
  private timer: ReturnType<typeof setInterval> | undefined;
  private listeners = new Set<() => void>();
  private failedSnapshot: ChatMessage[] | null = null;
  private pendingPrompt: ChatMessage | null = null;
  private serverSaveFailed = false;
  private mutationDecisions = new Map<
    string,
    {
      choice: "approve" | "deny";
      state: "pending" | "completed";
      promise: Promise<void>;
    }
  >();
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSaveError = () => this.saveError;
  getMutationState = (toolCallId: string) =>
    this.mutationDecisions.get(toolCallId)?.state ?? "idle";
  get readOnly() {
    return this.conversation.access !== "owner";
  }
  private assertOwner() {
    if (this.readOnly)
      throw new DataError("forbidden", "This shared chat is view-only");
  }
  async refresh() {
    this.conversation = await this.data.getConversation(this.conversation.id);
    if (this.readOnly)
      this.chat.messages = (
        await this.data.listMessages(this.conversation.id)
      ).map(toChatMessage);
  }
  constructor(
    public conversation: Conversation,
    private data: DataAdapter,
    messages: Message[],
    transport?: ChatTransport<ChatMessage>,
  ) {
    this.resumable = transport === undefined;
    const latestGenerated = messages.findLast(
      (message) => message.role === "assistant" && message.generation,
    );
    if (latestGenerated?.generation) {
      this.responseId = latestGenerated.id;
      this.acceptedAttemptId = latestGenerated.generation.attemptId;
    }
    for (const message of messages)
      this.saved.set(
        message.id,
        JSON.stringify({ blocks: message.blocks, status: message.status }),
      );
    for (const message of messages)
      for (const part of toChatMessage(message).parts)
        if (
          (part.type === "tool-createRecord" ||
            part.type === "tool-updateRecord") &&
          part.state !== "input-available" &&
          part.state !== "input-streaming"
        )
          this.mutationDecisions.set(part.toolCallId, {
            choice:
              part.state === "output-available" &&
              part.output.status === "permission_denied"
                ? "deny"
                : "approve",
            state: "completed",
            promise: Promise.resolve(),
          });
    this.chat = new Chat<ChatMessage>({
      id: conversation.id,
      messages: messages.map(toChatMessage),
      generateId: () => crypto.randomUUID(),
      transport:
        transport ??
        new DefaultChatTransport({
          api: "/api/chat",
          prepareSendMessagesRequest: ({ messages: current, trigger }) => {
            const assistant =
              current.at(-1)?.role === "assistant" ? current.at(-1) : undefined;
            const expectedAttemptId =
              assistant?.metadata?.attemptId ?? this.acceptedAttemptId;
            const attemptId = crypto.randomUUID();
            const mode =
              trigger === "regenerate-message" || !assistant
                ? ("replace" as const)
                : ("append" as const);
            if (assistant?.metadata?.attemptId) {
              this.responseId = assistant.id;
              this.acceptedAttemptId = assistant.metadata.attemptId;
            }
            this.dispatchedAttemptId = attemptId;
            this.dispatchUnconfirmed = true;
            return {
              body: {
                conversationId: this.conversation.id,
                responseId: this.responseId,
                attemptId,
                expectedAttemptId,
                mode,
                startedAt:
                  assistant?.metadata?.startedAt ?? this.responseStartedAt,
                messages: requestMessages(current),
              },
            };
          },
        }),
      sendAutomaticallyWhen: ({ messages }) => this.canContinue(messages),
      onToolCall: async ({ toolCall }) => {
        if (toolCall.dynamic || this.lookupController.signal.aborted) return;
        const signal = this.lookupController.signal;
        const count =
          this.chat.messages
            .at(-1)
            ?.parts.filter((part) => part.type.startsWith("tool-")).length ?? 0;
        try {
          if (count > MAX_LOOKUPS)
            throw new Error(
              "Lookup limit reached. Answer with available information or ask the user to narrow the request.",
            );
          if (toolCall.toolName === "searchRecords") {
            const output = await this.lookup(
              searchRecords(this.data, toolCall.input),
              signal,
            );
            void this.chat.addToolOutput({
              tool: "searchRecords",
              toolCallId: toolCall.toolCallId,
              output,
            });
          } else if (toolCall.toolName === "getRecord") {
            const output = await this.lookup(
              getRecord(this.data, toolCall.input),
              signal,
            );
            void this.chat.addToolOutput({
              tool: "getRecord",
              toolCallId: toolCall.toolCallId,
              output,
            });
          }
        } catch (cause) {
          if (signal.aborted) return;
          void this.chat.addToolOutput({
            tool: toolCall.toolName,
            toolCallId: toolCall.toolCallId,
            state: "output-error",
            errorText:
              cause instanceof Error
                ? cause.message
                : "The record lookup failed. Please retry.",
          });
        }
      },
      onFinish: ({ messages: current, isAbort, isError, isDisconnect }) => {
        const continuing =
          !isAbort && !isError && !isDisconnect && this.canContinue(current);
        if (!continuing) clearInterval(this.timer);
        let finished = current.map((message, index) =>
          index === current.length - 1 && message.role === "assistant"
            ? {
                ...message,
                metadata: {
                  ...message.metadata,
                  interrupted: isAbort || isError || isDisconnect,
                  sentAt: continuing
                    ? message.metadata?.sentAt
                    : new Date().toISOString(),
                },
              }
            : message,
        );
        const streamed = finished.at(-1);
        if (
          streamed?.role === "assistant" &&
          streamed.metadata?.attemptId &&
          streamed.metadata.responseId
        ) {
          this.responseId = streamed.metadata.responseId;
          this.acceptedAttemptId = streamed.metadata.attemptId;
          if (streamed.metadata.attemptId === this.dispatchedAttemptId)
            this.dispatchUnconfirmed = false;
        } else if (
          (isAbort || isError || isDisconnect) &&
          this.regenerationTarget &&
          finished.at(-1)?.role !== "assistant"
        ) {
          finished = [...finished, this.regenerationTarget];
        }
        this.chat.messages = finished;
        const response = finished.at(-1);
        const streamedIdentity =
          response?.role === "assistant" &&
          response.metadata?.responseId &&
          response.metadata.attemptId
            ? {
                responseId: response.metadata.responseId,
                attemptId: response.metadata.attemptId,
              }
            : undefined;
        const shouldAcknowledge =
          !continuing &&
          !isAbort &&
          !isError &&
          !isDisconnect &&
          (!this.resumable || Boolean(streamedIdentity));
        const finishedIdentity = streamedIdentity ?? this.activeIdentity();
        void this.persist(finished, continuing).then(() => {
          if (shouldAcknowledge && !this.saveError)
            void this.acknowledgeResponse(finishedIdentity);
        });
      },
      onError: () => {
        clearInterval(this.timer);
      },
    });
  }
  persist(messages = this.chat.messages, partial = false) {
    if (this.readOnly)
      return Promise.reject(
        new DataError("forbidden", "This shared chat is view-only"),
      );
    // Capture immutable snapshots; serialize writes so a partial cannot overwrite a final.
    const snapshot = structuredClone(messages);
    this.pending = this.pending
      .then(async () => {
        for (const [index, message] of snapshot.entries()) {
          // Live assistant output has one authoritative server writer.
          if (message.role === "assistant" && message.metadata?.generation)
            continue;
          const value = {
            blocks: toBlocks(message),
            status:
              partial &&
              index === snapshot.length - 1 &&
              message.role === "assistant"
                ? ("partial" as const)
                : message.metadata?.interrupted
                  ? ("interrupted" as const)
                  : ("final" as const),
          };
          const encoded = JSON.stringify(value);
          if (this.saved.get(message.id) === encoded) continue;
          if (this.saved.has(message.id))
            await this.data.updateMessage(
              this.conversation.id,
              message.id,
              value,
            );
          else {
            try {
              await this.data.appendMessage(this.conversation.id, {
                id: message.id,
                role: message.role,
                ...value,
              });
            } catch (error) {
              // A prior request may have committed before its response was lost.
              if (!(error instanceof DataError) || error.code !== "conflict")
                throw error;
              const existing = (
                await this.data.listMessages(this.conversation.id)
              ).find(
                (saved) =>
                  saved.id === message.id && saved.role === message.role,
              );
              if (!existing) throw error;
              await this.data.updateMessage(
                this.conversation.id,
                message.id,
                value,
              );
            }
          }
          this.saved.set(message.id, encoded);
        }
        if (!this.serverSaveFailed) this.saveError = null;
        this.failedSnapshot = null;
        refreshChats();
      })
      .catch(() => {
        this.failedSnapshot = snapshot;
        this.saveError =
          "Your latest messages could not be saved. Keep this page open and retry saving.";
      })
      .finally(() => {
        for (const listener of this.listeners) listener();
      });
    return this.pending;
  }
  async send(text: string, blocks?: ContentBlock[]) {
    this.assertOwner();
    const parts: ChatMessage["parts"] = blocks
      ? blocks.map((block) =>
          block.type === "text"
            ? { type: "text" as const, text: block.text }
            : { type: "data-block" as const, data: block },
        )
      : [{ type: "text", text }];
    const samePendingPrompt =
      this.pendingPrompt &&
      JSON.stringify(this.pendingPrompt.parts) === JSON.stringify(parts);
    if (this.pendingPrompt && !samePendingPrompt) {
      const committed = (
        await this.data.listMessages(this.conversation.id)
      ).find(
        (message) =>
          message.id === this.pendingPrompt?.id && message.role === "user",
      );
      if (committed) {
        this.saved.set(
          committed.id,
          JSON.stringify({
            blocks: committed.blocks,
            status: committed.status,
          }),
        );
        this.addMessageIfMissing(toChatMessage(committed));
      }
      this.pendingPrompt = null;
    }
    const message: ChatMessage = samePendingPrompt
      ? (this.pendingPrompt as ChatMessage)
      : {
          id: crypto.randomUUID(),
          role: "user",
          parts,
        };
    this.pendingPrompt = message;
    const messages = this.chat.messages.some((item) => item.id === message.id)
      ? this.chat.messages
      : [...this.chat.messages, message];
    await this.persist(messages);
    if (this.saveError) throw new Error(this.saveError);
    this.addMessageIfMissing(message);
    this.pendingPrompt = null;
    this.responseId = crypto.randomUUID();
    this.acceptedAttemptId = undefined;
    this.dispatchedAttemptId = undefined;
    this.regenerationTarget = undefined;
    this.dispatchUnconfirmed = false;
    this.responseStartedAt = new Date().toISOString();
    this.lookupController = new AbortController();
    this.startCheckpointing();
    void this.chat.sendMessage({
      messageId: message.id,
      role: "user",
      parts: message.parts,
    });
  }
  async retry() {
    this.assertOwner();
    this.lookupController = new AbortController();
    if (this.dispatchUnconfirmed && this.resumable) {
      const dispatchedAttemptId = this.dispatchedAttemptId;
      await this.chat.resumeStream();
      if (dispatchedAttemptId && this.acceptedAttemptId === dispatchedAttemptId)
        return;
    }
    const last = this.chat.messages.at(-1);
    const assistant = last?.role === "assistant" ? last : undefined;
    if (assistant) {
      this.responseId = assistant.id;
      this.acceptedAttemptId =
        assistant.metadata?.attemptId ?? this.acceptedAttemptId;
      this.regenerationTarget = structuredClone(assistant);
    }
    this.dispatchUnconfirmed = true;
    this.responseStartedAt = new Date().toISOString();
    this.startCheckpointing();
    const targetId = this.regenerationTarget?.id;
    try {
      return await this.chat.regenerate({
        messageId: this.chat.messages.some((message) => message.id === targetId)
          ? targetId
          : undefined,
      });
    } catch (error) {
      clearInterval(this.timer);
      throw error;
    }
  }
  resume() {
    if (!this.resumable || this.readOnly) return Promise.resolve();
    return this.chat.resumeStream();
  }
  async stop() {
    this.assertOwner();
    this.lookupController.abort();
    const identity = this.activeIdentity();
    const remoteStop =
      this.resumable && identity
        ? fetch(`/api/chat/${encodeURIComponent(this.conversation.id)}/stop`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(identity),
            keepalive: true,
          }).catch(() => undefined)
        : Promise.resolve();
    await Promise.all([this.chat.stop(), remoteStop]);
  }
  approveMutation(call: MutationToolCall) {
    return this.resolveMutation(call, "approve");
  }
  denyMutation(call: MutationToolCall) {
    return this.resolveMutation(call, "deny");
  }
  async retrySave() {
    this.assertOwner();
    if (this.serverSaveFailed) {
      const identity = this.acceptedIdentity();
      if (!identity) return;
      const response = await fetch(
        `/api/chat/${encodeURIComponent(this.conversation.id)}/stream`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(identity),
        },
      ).catch(() => undefined);
      if (!response?.ok) return;
      this.serverSaveFailed = false;
      this.saveError = null;
      for (const listener of this.listeners) listener();
      await this.acknowledgeResponse();
      return;
    }
    await this.persist(this.failedSnapshot ?? this.chat.messages);
    if (!this.saveError && this.pendingPrompt)
      this.addMessageIfMissing(this.pendingPrompt);
  }
  private canContinue(messages: ChatMessage[]) {
    return (
      !this.readOnly &&
      !this.lookupController.signal.aborted &&
      !messages.at(-1)?.metadata?.interrupted &&
      (messages.at(-1)?.parts.filter((part) => part.type.startsWith("tool-"))
        .length ?? 0) <= MAX_LOOKUPS &&
      lastAssistantMessageIsCompleteWithToolCalls({ messages })
    );
  }
  private addMessageIfMissing(message: ChatMessage) {
    if (!this.chat.messages.some((item) => item.id === message.id))
      this.chat.messages = [...this.chat.messages, message];
  }
  private async lookup<T>(
    request: Promise<T>,
    signal: AbortSignal,
  ): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let abort = () => {};
    try {
      return await Promise.race([
        request,
        new Promise<never>((_, reject) => {
          abort = () => reject(new Error("Lookup stopped."));
          timer = setTimeout(
            () => reject(new Error("Record lookup timed out. Please retry.")),
            15000,
          );
          signal.addEventListener("abort", abort, { once: true });
          if (signal.aborted) abort();
        }),
      ]);
    } finally {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
    }
  }
  private startCheckpointing() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      void this.persist(this.chat.messages, true);
    }, 1000);
  }
  private async acknowledgeResponse(identity = this.acceptedIdentity()) {
    if (!this.resumable) return;
    if (!identity) return;
    const response = await fetch(
      `/api/chat/${encodeURIComponent(this.conversation.id)}/stream`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(identity),
        keepalive: true,
      },
    ).catch(() => undefined);
    if (response?.ok) return;
    if (response?.status === 409) {
      this.serverSaveFailed = true;
      const result = await response.json().catch(() => null);
      this.saveError =
        result?.message ??
        "The completed response could not be saved. Retry while this page is open.";
      for (const listener of this.listeners) listener();
    }
  }
  private activeIdentity() {
    if (this.dispatchedAttemptId)
      return {
        responseId: this.responseId,
        attemptId: this.dispatchedAttemptId,
      };
    return this.acceptedIdentity();
  }
  private acceptedIdentity() {
    const last = this.chat.messages.at(-1);
    const attemptId =
      (last?.role === "assistant" ? last.metadata?.attemptId : undefined) ??
      this.acceptedAttemptId;
    const responseId =
      last?.role === "assistant" && last.metadata?.attemptId
        ? last.id
        : this.responseId;
    return responseId && attemptId ? { responseId, attemptId } : undefined;
  }
  private resolveMutation(call: MutationToolCall, choice: "approve" | "deny") {
    if (this.readOnly)
      return Promise.reject(
        new DataError("forbidden", "This shared chat is view-only"),
      );
    const existing = this.mutationDecisions.get(call.toolCallId);
    if (existing) {
      if (existing.choice !== choice)
        return Promise.reject(
          new DataError("conflict", "This proposal already has a decision"),
        );
      return existing.promise;
    }
    const operation = (async () => {
      try {
        const output =
          choice === "approve"
            ? await executeMutation(this.data, this.conversation.id, call)
            : denyMutation(call);
        await this.chat.addToolOutput({
          tool: call.toolName,
          toolCallId: call.toolCallId,
          output,
        });
        await this.persist();
      } catch (cause) {
        if (
          choice === "approve" &&
          cause instanceof DataError &&
          (cause.code === "unavailable" || cause.code === "server")
        ) {
          this.mutationDecisions.delete(call.toolCallId);
          this.saveError =
            "The approval result is uncertain. Retry the same proposal; it will not apply twice.";
          for (const listener of this.listeners) listener();
          return;
        }
        await this.chat.addToolOutput({
          tool: call.toolName,
          toolCallId: call.toolCallId,
          state: "output-error",
          errorText:
            cause instanceof Error
              ? cause.message
              : "The approved change could not be applied.",
        });
        await this.persist();
      } finally {
        const decision = this.mutationDecisions.get(call.toolCallId);
        if (decision) decision.state = "completed";
        for (const listener of this.listeners) listener();
      }
    })();
    this.mutationDecisions.set(call.toolCallId, {
      choice,
      state: "pending",
      promise: operation,
    });
    for (const listener of this.listeners) listener();
    return operation;
  }
}

type Sessions = {
  load: (id: string) => Promise<ChatSession>;
  create: (input: CreateConversation) => Promise<ChatSession>;
  remove: (id: string) => void;
};
const SessionsContext = createContext<Sessions | null>(null);
export function ChatSessionsProvider({ children }: { children: ReactNode }) {
  const data = useData();
  const [sessions] = useState<Sessions>(() => {
    const cache = new Map<string, Promise<ChatSession>>();
    return {
      load(id) {
        const existing = cache.get(id);
        if (existing)
          return existing
            .then(async (session) => {
              await session.refresh();
              return session;
            })
            .catch((error) => {
              cache.delete(id);
              throw error;
            });
        const request = Promise.all([
          data.getConversation(id),
          data.listMessages(id),
        ])
          .then(([conversation, messages]) => {
            const session = new ChatSession(conversation, data, messages);
            void session.resume();
            return session;
          })
          .catch((error) => {
            cache.delete(id);
            throw error;
          });
        cache.set(id, request);
        return request;
      },
      async create(input) {
        const conversation = await data.createConversation(input);
        const session = new ChatSession(conversation, data, []);
        cache.set(conversation.id, Promise.resolve(session));
        refreshChats();
        return session;
      },
      remove(id) {
        cache.delete(id);
      },
    };
  });
  return (
    <SessionsContext.Provider value={sessions}>
      {children}
    </SessionsContext.Provider>
  );
}
export function useChatSessions() {
  const sessions = useContext(SessionsContext);
  if (!sessions) throw new Error("ChatSessionsProvider is required");
  return sessions;
}
