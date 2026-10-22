"use client";

import { Chat, useChat } from "@ai-sdk/react";
import {
  Check,
  Copy,
  CornerDownLeft,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Square,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PageHeader, PageHeading } from "@/components/crm/page-header";
import { PlatformLogo, PlatformName } from "@/components/crm/platform-identity";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Message,
  MessageContent,
  MessageHeader,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { isActivityPart } from "@/lib/chat/activity";
import { type DraftMention, mentionBlocks } from "@/lib/chat/mentions";
import { formatMessageTime } from "@/lib/chat/message-time";
import { pendingMutationCalls } from "@/lib/chat/permissions";
import { type ChatSession, useChatSessions } from "@/lib/chat/session";
import {
  CHAT_CHANGED,
  type ChatMessage,
  refreshChats,
  toBlocks,
} from "@/lib/chat/types";
import { DataError } from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";
import { ChatBlock, MutationPermissionRequest } from "./blocks";
import { MentionInput } from "./mention-input";
import { ProcessingStatus, ResponseActivity } from "./reasoning";
import { useContextRecords } from "./record-context";
import { ShareChatDialog } from "./share-dialog";

const subscribeNone = () => () => {};
const noError = () => null;

export function ChatWorkspace({
  id,
  enabled = true,
}: {
  id?: string;
  enabled?: boolean;
}) {
  const sessions = useChatSessions();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: explicit retry.
  useEffect(() => {
    setSession(null);
    setMissing(false);
    if (!id) return;
    let cancelled = false;
    let polling: ReturnType<typeof setInterval> | undefined;
    let refreshing = false;
    let loadedSession: ChatSession | undefined;
    const failed = (cause: unknown) => {
      if (cancelled) return;
      loadedSession = undefined;
      sessions.remove(id);
      setSession(null);
      const inaccessible =
        cause instanceof DataError &&
        ["not_found", "forbidden", "workspace_required"].includes(cause.code);
      setMissing(inaccessible);
      if (inaccessible) refreshChats();
      setError(
        "This conversation is unavailable or you no longer have access.",
      );
      clearInterval(polling);
    };
    const refresh = async () => {
      if (
        !loadedSession?.readOnly ||
        refreshing ||
        document.visibilityState !== "visible"
      )
        return;
      refreshing = true;
      try {
        await loadedSession.refresh();
      } catch (cause) {
        failed(cause);
      } finally {
        refreshing = false;
      }
    };
    setError(null);
    sessions.load(id).then((loaded) => {
      if (cancelled) return;
      loadedSession = loaded;
      setSession(loaded);
      if (loaded.readOnly) polling = setInterval(() => void refresh(), 5000);
    }, failed);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      clearInterval(polling);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [id, sessions, attempt]);
  const activeSession = session?.conversation.id === id ? session : null;
  if (id && !activeSession)
    return error ? (
      <div className="space-y-4">
        <PageHeader
          title={missing ? "Chat not found" : "Unable to load chat"}
        />
        <p role="alert" className="text-sm text-muted-foreground">
          {error}
        </p>
        {!missing && (
          <Button onClick={() => setAttempt((n) => n + 1)}>Retry</Button>
        )}
        <Link className="ml-3 text-sm underline" href="/chat/new">
          Start a new chat
        </Link>
        <Link
          className="ml-3 text-sm underline"
          href={`/onboarding?next=${encodeURIComponent(`/chat/${id}`)}`}
        >
          Switch workspace
        </Link>
      </div>
    ) : (
      <output className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
        Loading conversation…
      </output>
    );
  return (
    <ChatView
      key={id || "new"}
      session={activeSession ?? undefined}
      enabled={enabled}
    />
  );
}

export function ChatView({
  session,
  enabled = true,
}: {
  session?: ChatSession;
  enabled?: boolean;
}) {
  const [emptyChat] = useState(() => new Chat<ChatMessage>({}));
  const chat = session?.chat ?? emptyChat;
  const readOnly = session?.readOnly ?? false;
  const { messages, status, error, stop, regenerate, clearError } = useChat({
    chat,
  });
  const savedError = useSyncExternalStore(
    session?.subscribe ?? subscribeNone,
    session?.getSaveError ?? noError,
    noError,
  );
  const [input, setInput] = useState("");
  const [mentions, setMentions] = useState<DraftMention[]>([]);
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [title, setTitle] = useState(session?.conversation.title ?? "New chat");
  useEffect(() => {
    if (!session) return;
    const syncTitle = () => setTitle(session.conversation.title);
    window.addEventListener(CHAT_CHANGED, syncTitle);
    return () => window.removeEventListener(CHAT_CHANGED, syncTitle);
  }, [session]);
  const [rename, setRename] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState<{ messageId: string } | null>(null);
  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [copied]);
  const recordsState = useContextRecords();
  const names = Object.fromEntries(
    recordsState.records.map((record) => [record.reference.id, record.name]),
  );
  const data = useData();
  const sessions = useChatSessions();
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const previousPermissionRequest = useRef<string | null>(null);
  const lock = useRef(false);
  const busy = status === "submitted" || status === "streaming";
  const permissionRequest = pendingMutationCalls(messages)[0];
  const permissionRequestId = permissionRequest?.toolCallId;

  useEffect(() => {
    if (!session && enabled) inputRef.current?.focus();
  }, [session, enabled]);

  useEffect(() => {
    const previous = previousPermissionRequest.current;
    previousPermissionRequest.current = permissionRequestId ?? null;
    if (previous && !permissionRequestId && !readOnly)
      inputRef.current?.focus();
  }, [permissionRequestId, readOnly]);

  async function submit(text = input) {
    if (readOnly || busy || lock.current || !enabled || !text.trim()) return;
    lock.current = true;
    setPending(true);
    setLocalError(null);
    try {
      if (session) {
        await session.send(text.trim(), mentionBlocks(text, mentions));
      } else {
        const created = await sessions.create({
          title: text.trim().slice(0, 80),
        });
        await created.send(text.trim(), mentionBlocks(text, mentions));
        // The shell owns the stream; navigate only after saving the user message.
        router.push(`/chat/${created.conversation.id}`);
      }
      setInput("");
      setMentions([]);
    } catch (cause) {
      setLocalError(
        cause instanceof Error
          ? cause.message
          : "Unable to send. Please retry.",
      );
    } finally {
      lock.current = false;
      setPending(false);
      inputRef.current?.focus();
    }
  }
  return (
    <div className="relative -m-6 flex h-[calc(100dvh-41px)] min-h-0 flex-col overflow-hidden sm:-m-8 lg:-m-10">
      <PageHeader>
        <div className="flex min-w-0 items-center gap-2">
          <PageHeading
            title={readOnly ? (session?.conversation.title ?? title) : title}
          />
          {session && !readOnly && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Rename conversation"
              className="opacity-0 group-hover/page-header:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
              disabled={pending}
              onClick={() => {
                setNewTitle(title);
                setRename(true);
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {session && !readOnly && (
            <ShareChatDialog conversationId={session.conversation.id} />
          )}
          {session && !readOnly && (
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={busy || pending}
              aria-label="Delete conversation"
              onClick={() => setDeleting(true)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
          <Button
            render={
              <Link
                href="/chat/new"
                onNavigate={() => {
                  if (!session) inputRef.current?.focus();
                }}
              />
            }
            nativeButton={false}
            variant="outline"
            size="sm"
            aria-label="New chat"
          >
            <Plus aria-hidden="true" />
            New chat
          </Button>
        </div>
      </PageHeader>
      {readOnly && (
        <p className="border-b bg-muted/30 px-5 py-2 text-xs text-muted-foreground">
          Shared with you · View only. New messages appear automatically; only
          the owner can send messages or manage access.
        </p>
      )}
      <div className="relative flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <MessageScrollerProvider
            autoScroll={messages.length > 0}
            defaultScrollPosition={messages.length ? "end" : "start"}
          >
            <MessageScroller className="flex-1" aria-label="Conversation">
              <MessageScrollerViewport>
                <MessageScrollerContent className="mx-auto w-full max-w-3xl gap-7 px-5 py-6 sm:px-8">
                  {messages.map((message) => {
                    const isPendingAssistant =
                      busy &&
                      message.role === "assistant" &&
                      message.id === messages.at(-1)?.id;
                    return (
                      <MessageScrollerItem
                        key={message.id}
                        messageId={message.id}
                      >
                        <Message
                          align={message.role === "user" ? "end" : "start"}
                        >
                          <MessageContent
                            className={
                              message.role === "user" ? "items-end" : ""
                            }
                          >
                            {message.role !== "user" && (
                              <MessageHeader className="gap-2 px-0">
                                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                  <PlatformLogo />
                                  <PlatformName />
                                </span>
                              </MessageHeader>
                            )}
                            <div
                              className={
                                message.role === "user"
                                  ? "max-w-[90%] space-y-3 rounded-2xl bg-muted/60 px-4 py-3"
                                  : "w-full min-w-0 space-y-2"
                              }
                            >
                              {message.role === "assistant" && (
                                <ResponseActivity
                                  message={message}
                                  active={isPendingAssistant}
                                />
                              )}
                              {message.parts.map((part, index) =>
                                message.role === "user" &&
                                part.type === "text" ? (
                                  <span
                                    key={`${message.id}-${index}`}
                                    className="whitespace-pre-wrap text-sm leading-7"
                                  >
                                    {part.text}
                                  </span>
                                ) : message.role === "assistant" &&
                                  isActivityPart(part) ? null : part.type ===
                                    "tool-createRecord" ||
                                  part.type === "tool-updateRecord" ? (
                                  part.state === "input-available" ? null : (
                                    <MutationPermissionRequest
                                      key={part.toolCallId}
                                      call={{
                                        toolName:
                                          part.type === "tool-createRecord"
                                            ? "createRecord"
                                            : "updateRecord",
                                        toolCallId: part.toolCallId,
                                        input: part.input,
                                      }}
                                      state={part.state}
                                      output={
                                        part.state === "output-available"
                                          ? part.output
                                          : undefined
                                      }
                                      errorText={
                                        part.state === "output-error"
                                          ? part.errorText
                                          : undefined
                                      }
                                      disabled={
                                        readOnly || busy || pending || !session
                                      }
                                      onApprove={(call) =>
                                        session?.approveMutation(call) ??
                                        Promise.resolve()
                                      }
                                      onDeny={(call) =>
                                        session?.denyMutation(call) ??
                                        Promise.resolve()
                                      }
                                      subscribe={session?.subscribe}
                                      getDecisionState={() =>
                                        session?.getMutationState(
                                          part.toolCallId,
                                        ) ?? "idle"
                                      }
                                    />
                                  )
                                ) : part.type === "text" ||
                                  part.type === "data-block" ? (
                                  <ChatBlock
                                    key={`${message.id}-${index}`}
                                    block={
                                      part.type === "text"
                                        ? { type: "text", text: part.text }
                                        : part.data
                                    }
                                    names={names}
                                  />
                                ) : null,
                              )}
                            </div>
                            {message.metadata?.interrupted && (
                              <p className="text-xs text-muted-foreground">
                                Response interrupted
                              </p>
                            )}
                            {message.role === "assistant" &&
                              !isPendingAssistant && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Copy response"
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(
                                          toBlocks(message)
                                            .filter((b) => b.type === "text")
                                            .map((b) => b.text)
                                            .join("\n\n"),
                                        );
                                        setCopied({ messageId: message.id });
                                      } catch {
                                        setLocalError(
                                          "Copy failed. Please select and copy the text.",
                                        );
                                      }
                                    }}
                                  >
                                    {copied?.messageId === message.id ? (
                                      <Check className="size-3.5" />
                                    ) : (
                                      <Copy className="size-3.5" />
                                    )}
                                  </Button>
                                  {!busy &&
                                    message.id === messages.at(-1)?.id &&
                                    !readOnly && (
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Retry response"
                                        title="Retry response"
                                        disabled={
                                          pending || !!savedError || !enabled
                                        }
                                        onClick={() =>
                                          void (session
                                            ? session.retry()
                                            : regenerate())
                                        }
                                      >
                                        <RotateCcw className="size-3.5" />
                                      </Button>
                                    )}
                                  {message.metadata?.sentAt && (
                                    <time
                                      dateTime={message.metadata.sentAt}
                                      title={new Date(
                                        message.metadata.sentAt,
                                      ).toLocaleString()}
                                      suppressHydrationWarning
                                      className="pointer-events-none whitespace-nowrap text-xs font-normal text-muted-foreground opacity-0 transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100 [@media(hover:none)]:opacity-100 motion-reduce:transition-none"
                                    >
                                      {formatMessageTime(
                                        message.metadata.sentAt,
                                      )}
                                    </time>
                                  )}
                                </div>
                              )}
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    );
                  })}
                  {status === "submitted" &&
                    messages.at(-1)?.role !== "assistant" && (
                      <output aria-live="polite">
                        <ProcessingStatus>Thinking…</ProcessingStatus>
                      </output>
                    )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
          <div className="mx-auto w-full max-w-3xl shrink-0 px-5 pb-4 pt-2 sm:px-8">
            {(localError || savedError || error) && (
              <div
                role="alert"
                className="mb-3 space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
              >
                <p>{localError || savedError || error?.message}</p>
                {savedError ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void session?.retrySave()}
                  >
                    Retry saving
                  </Button>
                ) : error ? (
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Retry response"
                    title="Retry response"
                    disabled={busy || !enabled}
                    onClick={() => {
                      clearError();
                      void (session ? session.retry() : regenerate());
                    }}
                  >
                    <RotateCcw className="size-3.5" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocalError(null)}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            )}
            {!enabled && !readOnly && (
              <output className="mb-3 text-sm text-muted-foreground">
                AI generation is unavailable. A model adapter must be enabled to
                send messages.
              </output>
            )}
            {!readOnly &&
              (permissionRequest ? (
                <MutationPermissionRequest
                  key={permissionRequest.toolCallId}
                  call={permissionRequest}
                  state="input-available"
                  disabled={busy || pending || !session}
                  onApprove={(call) =>
                    session?.approveMutation(call) ?? Promise.resolve()
                  }
                  onDeny={(call) =>
                    session?.denyMutation(call) ?? Promise.resolve()
                  }
                  subscribe={session?.subscribe}
                  getDecisionState={() =>
                    session?.getMutationState(permissionRequest.toolCallId) ??
                    "idle"
                  }
                />
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                  }}
                  className="relative rounded-lg border bg-background p-2 shadow-sm"
                >
                  <MentionInput
                    value={input}
                    onChange={setInput}
                    mentions={mentions}
                    onMentionsChange={setMentions}
                    inputRef={inputRef}
                    disabled={pending || !enabled}
                    placeholder="Ask anything, or @mention a record or task…"
                    onSubmit={() => void submit()}
                  />
                  <div className="flex min-h-7 items-center justify-end gap-2">
                    <div className="flex items-center gap-3">
                      {busy ? (
                        <Button
                          type="button"
                          size="icon"
                          aria-label="Stop response"
                          onClick={(event) => {
                            // Stop can synchronously turn this into the submit button.
                            event.preventDefault();
                            void (session ? session.stop() : stop());
                          }}
                        >
                          <Square
                            className="size-3"
                            fill="currentColor"
                            strokeWidth={0}
                          />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          size="icon"
                          className="disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
                          aria-label="Send message"
                          disabled={
                            pending || !!savedError || !input.trim() || !enabled
                          }
                        >
                          {pending ? (
                            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
                          ) : (
                            <CornerDownLeft className="size-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              ))}
          </div>
        </div>
      </div>
      <Dialog open={rename} onOpenChange={setRename}>
        <DialogContent>
          <DialogTitle>Rename conversation</DialogTitle>
          <DialogDescription>
            Choose a title you can find in recent chats.
          </DialogDescription>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!session || pending || !newTitle.trim()) return;
              setPending(true);
              try {
                session.conversation = await data.updateConversation(
                  session.conversation.id,
                  { title: newTitle.trim() },
                );
                setTitle(newTitle.trim());
                setRename(false);
                refreshChats();
              } catch {
                setLocalError("The title could not be saved.");
              } finally {
                setPending(false);
              }
            }}
          >
            <Input
              aria-label="Conversation title"
              value={newTitle}
              maxLength={200}
              onChange={(event) => setNewTitle(event.target.value)}
            />
            <Button type="submit" disabled={pending || !newTitle.trim()}>
              Save title
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent>
          <DialogTitle>Delete this conversation?</DialogTitle>
          <DialogDescription>
            “{title}” and its messages will be permanently removed.
          </DialogDescription>
          <div className="flex justify-end gap-2">
            <Button
              variant="destructive"
              disabled={pending || busy}
              onClick={async () => {
                if (!session || pending) return;
                setPending(true);
                try {
                  await data.deleteConversation(session.conversation.id);
                  sessions.remove(session.conversation.id);
                  refreshChats();
                  router.replace("/chat/new");
                } catch {
                  setLocalError("The conversation could not be deleted.");
                  setDeleting(false);
                } finally {
                  setPending(false);
                }
              }}
            >
              Delete conversation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
