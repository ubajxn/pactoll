"use client";

import { Menu } from "@base-ui/react/menu";
import {
  Ellipsis,
  MessageSquare,
  Pencil,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useChatSessions } from "@/lib/chat/session";
import { CHAT_CHANGED, refreshChats } from "@/lib/chat/types";
import type { Conversation } from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";

/** Saved recents from the authenticated data source. */
export function SidebarChats() {
  const data = useData();
  const pathname = usePathname();
  const router = useRouter();
  const sessions = useChatSessions();
  const [action, setAction] = useState<{
    kind: "rename" | "delete";
    conversation: Conversation;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const actionTrigger = useRef<HTMLElement | null>(null);
  const renameInput = useRef<HTMLInputElement | null>(null);
  const savingAction = useRef(false);
  const cancelRename = useRef(false);

  async function saveAction(restoreFocus = false) {
    if (!action || savingAction.current || cancelRename.current) return;
    if (action.kind === "rename" && !title.trim()) {
      setActionError("Enter a conversation title.");
      return;
    }
    savingAction.current = true;
    setPending(true);
    setActionError(null);
    try {
      const session = await sessions.load(action.conversation.id);
      if (action.kind === "rename") {
        session.conversation = await data.updateConversation(
          action.conversation.id,
          { title: title.trim() },
        );
        setConversations(
          (current) =>
            current?.map((conversation) =>
              conversation.id === session.conversation.id
                ? session.conversation
                : conversation,
            ) ?? null,
        );
      } else {
        if (
          session.chat.status === "submitted" ||
          session.chat.status === "streaming"
        ) {
          setActionError("Stop the response before deleting this chat.");
          return;
        }
        await session.persist();
        await data.deleteConversation(action.conversation.id);
        sessions.remove(action.conversation.id);
        const href = `/chat/${encodeURIComponent(action.conversation.id)}`;
        if (pathname === href || pathname.startsWith(`${href}/`))
          router.replace("/chat/new");
      }
      refreshChats();
      setAction(null);
      if (restoreFocus)
        requestAnimationFrame(() => actionTrigger.current?.focus());
    } catch {
      setActionError(
        action.kind === "rename"
          ? "The title could not be saved. Try again."
          : "The chat could not be deleted. Try again.",
      );
    } finally {
      savingAction.current = false;
      setPending(false);
    }
  }
  const { setOpenMobile } = useSidebar();
  const [conversations, setConversations] = useState<Conversation[] | null>(
    null,
  );
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [visibleCount, setVisibleCount] = useState(8);

  // biome-ignore lint/correctness/useExhaustiveDependencies: navigation and retry refresh the persistent sidebar.
  useEffect(() => {
    let disposed = false;
    let request = 0;
    async function refresh() {
      const current = ++request;
      setError(false);
      try {
        const recents = await data.listConversations();
        if (!disposed && current === request) setConversations(recents);
      } catch {
        if (!disposed && current === request) setError(true);
      }
    }
    void refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener(CHAT_CHANGED, refresh);
    return () => {
      disposed = true;
      window.removeEventListener("focus", refresh);
      window.removeEventListener(CHAT_CHANGED, refresh);
    };
  }, [data, pathname, attempt]);

  return (
    <>
      {conversations?.slice(0, visibleCount).map((conversation) => {
        const href = `/chat/${encodeURIComponent(conversation.id)}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const renaming =
          action?.kind === "rename" &&
          action.conversation.id === conversation.id;
        return (
          <SidebarMenuItem
            key={conversation.id}
            className="group-data-[collapsible=icon]:hidden"
          >
            {renaming ? (
              <div className="flex h-8 items-center gap-2 rounded-control pl-3 pr-1">
                <MessageSquare aria-hidden="true" className="size-4 shrink-0" />
                <Input
                  ref={renameInput}
                  aria-label="Conversation title"
                  aria-invalid={!!actionError}
                  aria-describedby={
                    actionError ? `rename-error-${conversation.id}` : undefined
                  }
                  aria-busy={pending}
                  className="h-7 px-1 text-sm"
                  value={title}
                  maxLength={200}
                  readOnly={pending}
                  onFocus={(event) => event.currentTarget.select()}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setActionError(null);
                  }}
                  onBlur={() => void saveAction()}
                  onKeyDown={(event) => {
                    if (event.nativeEvent.isComposing) return;
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void saveAction(true);
                    } else if (event.key === "Escape") {
                      event.preventDefault();
                      event.stopPropagation();
                      if (savingAction.current) return;
                      cancelRename.current = true;
                      setAction(null);
                      setActionError(null);
                      requestAnimationFrame(() =>
                        actionTrigger.current?.focus(),
                      );
                    }
                  }}
                />
              </div>
            ) : (
              <SidebarMenuButton
                render={<Link href={href} />}
                isActive={active}
                aria-current={active ? "page" : undefined}
                tooltip={conversation.title}
                className="gap-2 rounded-control data-active:font-normal has-[>svg:first-child]:pl-3"
                onClick={() => setOpenMobile(false)}
              >
                {conversation.access === "viewer" ? (
                  <Users aria-label="Shared with you" />
                ) : (
                  <MessageSquare aria-hidden="true" />
                )}
                <span>{conversation.title}</span>
              </SidebarMenuButton>
            )}
            {renaming && actionError && (
              <p
                id={`rename-error-${conversation.id}`}
                role="alert"
                className="px-3 py-1 text-xs text-destructive"
              >
                {actionError}
              </p>
            )}
            {conversation.access === "owner" && (
              <Menu.Root>
                <Menu.Trigger
                  render={
                    <SidebarMenuAction
                      showOnHover
                      className="top-1! right-0 size-6 rounded-control"
                    />
                  }
                  aria-label={`Chat options for ${conversation.title}`}
                  className={renaming ? "hidden" : undefined}
                  disabled={action?.kind === "rename"}
                  onClick={(event) => {
                    actionTrigger.current = event.currentTarget;
                  }}
                >
                  <Ellipsis aria-hidden="true" />
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner
                    side="bottom"
                    align="end"
                    sideOffset={4}
                    className="z-50"
                  >
                    <Menu.Popup
                      finalFocus={() => renameInput.current ?? true}
                      className="min-w-40 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md outline-none"
                    >
                      <Menu.Item
                        className="flex cursor-default items-center gap-2 rounded-control px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent"
                        onClick={() => {
                          cancelRename.current = false;
                          setTitle(conversation.title);
                          setActionError(null);
                          setAction({ kind: "rename", conversation });
                        }}
                      >
                        <Pencil className="size-4" /> Rename
                      </Menu.Item>
                      <Menu.Item
                        className="flex cursor-default items-center gap-2 rounded-control px-2 py-1.5 text-sm text-destructive outline-none data-highlighted:bg-destructive/10"
                        onClick={() => {
                          cancelRename.current = false;
                          setActionError(null);
                          setAction({ kind: "delete", conversation });
                        }}
                      >
                        <Trash2 className="size-4" /> Delete
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            )}
          </SidebarMenuItem>
        );
      })}
      {conversations && conversations.length > visibleCount && (
        <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
          <SidebarMenuButton
            type="button"
            className="rounded-control pl-9 text-muted-foreground"
            onClick={() => setVisibleCount((count) => count + 10)}
          >
            <span>Show more</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      {error && (
        <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
          <p
            role="alert"
            className="px-3 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:sr-only"
          >
            {conversations === null
              ? "Unable to load chats."
              : "Unable to refresh chats."}
          </p>
          <SidebarMenuButton
            onClick={() => setAttempt((value) => value + 1)}
            tooltip="Retry loading chats"
            aria-label="Retry loading chats"
            className="gap-2 rounded-control has-[>svg:first-child]:pl-3"
          >
            <RotateCcw aria-hidden="true" />
            <span>Retry</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      <Dialog
        open={action?.kind === "delete"}
        onOpenChange={(open) => {
          if (!open && !pending) setAction(null);
        }}
      >
        <DialogContent finalFocus={actionTrigger}>
          <DialogTitle>Delete this conversation?</DialogTitle>
          <DialogDescription>
            {action?.kind === "delete"
              ? `“${action.conversation.title}” and its messages will be permanently removed.`
              : ""}
          </DialogDescription>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void saveAction();
            }}
          >
            {actionError && (
              <p role="alert" className="text-sm text-destructive">
                {actionError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? "Deleting…" : "Delete conversation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
