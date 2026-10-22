"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MemberAvatar } from "@/components/crm/member-picker";
import { RecordPicker } from "@/components/crm/record-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAccount } from "@/lib/auth/provider";
import { refreshChats } from "@/lib/chat/types";
import type { Member } from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";

export function ShareChatDialog({
  conversationId,
}: {
  conversationId: string;
}) {
  const data = useData();
  const account = useAccount();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [recipients, setRecipients] = useState<Member[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: explicit retry reloads current grants.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    setError("");
    setNotice("");
    setCopied(false);
    setSelected([]);
    Promise.all([
      data.listMembers(),
      data.listConversationShares(conversationId),
    ])
      .then(
        ([members, shares]) => {
          if (cancelled) return;
          setMembers(members);
          setRecipients(shares);
        },
        () => {
          if (!cancelled)
            setLoadError("Could not load sharing settings. Please retry.");
        },
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, conversationId, data, attempt]);

  async function change(memberId: string, remove = false) {
    if (pending) return;
    setPending(true);
    setError("");
    setNotice("");
    try {
      if (remove) {
        await data.unshareConversation(conversationId, memberId);
        setRecipients((current) =>
          current.filter((member) => member.id !== memberId),
        );
        setNotice("Access removed.");
      } else {
        setRecipients(
          await data.shareConversation(conversationId, { memberId }),
        );
        setSelected([]);
        setNotice("Chat shared. Copy the link to send it to your teammate.");
      }
      refreshChats();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sharing could not be updated. Please retry.",
      );
    } finally {
      setPending(false);
    }
  }

  const available = members.filter(
    (member) =>
      member.id !== account.user.id &&
      !recipients.some((recipient) => recipient.id === member.id),
  );
  return (
    <>
      <Button
        ref={trigger}
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Share conversation"
      >
        <Share2 className="size-4" />
        <span className="hidden sm:inline">Share</span>
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
      >
        <DialogContent
          finalFocus={trigger}
          className="max-h-[90dvh] grid-cols-1 overflow-y-auto"
        >
          <DialogTitle>Share conversation</DialogTitle>
          <DialogDescription>
            Give selected teammates view-only access to this chat and future
            messages. You keep control of messages and sharing.
          </DialogDescription>
          {loading ? (
            <output className="text-sm">Loading sharing settings…</output>
          ) : loadError ? (
            <div className="space-y-3">
              <p role="alert" className="text-sm text-destructive">
                {loadError}
              </p>
              <Button
                variant="outline"
                onClick={() => setAttempt((value) => value + 1)}
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (selected[0]) void change(selected[0]);
                }}
              >
                <RecordPicker
                  id="share-chat-member"
                  name="memberId"
                  label="Team member"
                  choices={available.map((member) => ({
                    id: member.id,
                    name: member.name,
                    keywords: [member.email],
                    icon: <MemberAvatar member={member} />,
                  }))}
                  value={selected}
                  onValueChange={setSelected}
                  emptyLabel="Choose a teammate"
                  searchLabel="Search team members"
                  disabled={pending || available.length === 0}
                />
                {available.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No other teammates are available. Manage your team in
                    Settings → Team.
                  </p>
                )}
                <Button type="submit" disabled={pending || !selected.length}>
                  {pending ? "Saving…" : "Share chat"}
                </Button>
              </form>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">People with access</h3>
                <p className="text-sm text-muted-foreground">You · Owner</p>
                {recipients.length ? (
                  <ul className="max-h-60 overflow-y-auto divide-y rounded-lg border">
                    {recipients.map((member) => (
                      <li
                        key={member.id}
                        className="flex items-center gap-3 p-3"
                      >
                        <MemberAvatar member={member} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {member.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {member.email} · Can view
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          aria-label={`Remove access for ${member.name}`}
                          onClick={() => void change(member.id, true)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Private — only you can view this chat.
                  </p>
                )}
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              {notice && <output className="text-sm">{notice}</output>}
              <div className="space-y-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        `${window.location.origin}/chat/${encodeURIComponent(conversationId)}`,
                      );
                      setCopied(true);
                      setError("");
                    } catch {
                      setError(
                        "Could not copy the link. Copy this chat's address from your browser.",
                      );
                    }
                  }}
                >
                  {copied ? <Check /> : <Copy />}
                  {copied ? "Link copied" : "Copy link"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  The link only works for people with access, signed into{" "}
                  {account.workspace.name}.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
