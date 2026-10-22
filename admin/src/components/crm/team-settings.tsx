"use client";
import { Plus, Search } from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { MemberAvatar } from "@/components/crm/member-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { authClient } from "@/lib/auth/client";
import { useAccount } from "@/lib/auth/provider";

type TeamMember = {
  id: string;
  role: string;
  user: { id: string; name: string; email: string; image?: string | null };
};
type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date | string;
};
const roles = ["member", "admin", "owner"] as const;
const roleLabels: Record<(typeof roles)[number], string> = {
  member: "Staff — Operations & records",
  admin: "Manager — + Finance & marketing",
  owner: "Owner — Full access",
};

export function TeamSettings({ readOnly = false }: { readOnly?: boolean }) {
  const account = useAccount();
  const canManage = !readOnly && ["owner", "admin"].includes(account.role);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inviteButton = useRef<HTMLButtonElement>(null);
  const load = useCallback(async () => {
    setLoadError("");
    try {
      const all: TeamMember[] = [];
      let total = 0;
      do {
        const result = await authClient.organization.listMembers({
          query: {
            organizationId: account.workspace.id,
            limit: 100,
            offset: all.length,
          },
        });
        if (result.error || !result.data)
          throw new Error(result.error?.message || "Could not load members");
        total = result.data.total;
        all.push(...result.data.members);
        if (!result.data.members.length) break;
      } while (all.length < total);
      setMembers(all);
      if (canManage) {
        const result = await authClient.organization.listInvitations({
          query: { organizationId: account.workspace.id },
        });
        if (result.error)
          throw new Error(result.error.message || "Could not load invitations");
        setInvitations(
          (result.data || []).filter(
            (invitation) => invitation.status === "pending",
          ),
        );
      }
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Could not load team",
      );
    } finally {
      setLoading(false);
    }
  }, [account.workspace.id, canManage]);
  useEffect(() => {
    void load();
  }, [load]);
  async function action(
    run: () => Promise<{ error: { message?: string } | null }>,
    message: string,
  ) {
    setPending(true);
    setError("");
    setNotice("");
    try {
      const result = await run();
      if (result.error) {
        // A pending invitation can exist even when its email failed to send.
        await load();
        setError(result.error.message || "Could not save this change");
        return false;
      }
      await load();
      setNotice(message);
      return true;
    } catch {
      await load();
      setError("Could not save this change. Please try again.");
      return false;
    } finally {
      setPending(false);
    }
  }
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const role = String(form.get("role")) as "member" | "admin";
    if (
      await action(
        () =>
          authClient.organization.inviteMember({
            email,
            role,
            organizationId: account.workspace.id,
          }),
        `Invitation emailed to ${email}.`,
      )
    )
      setInviteOpen(false);
  }
  const visible = members.filter((member) =>
    `${member.user.name} ${member.user.email}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Team</h2>
          <p className="text-sm text-muted-foreground">
            Members of {account.workspace.name} can own records and follow up on
            tasks.
          </p>
        </div>
        {canManage && (
          <Button
            ref={inviteButton}
            variant="outline"
            size="sm"
            disabled={loading || pending}
            onClick={() => {
              setError("");
              setInviteOpen(true);
            }}
          >
            <Plus aria-hidden="true" />
            Invite member
          </Button>
        )}
      </div>
      {notice && <output className="text-sm">{notice}</output>}
      {error && !inviteOpen && !removing && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {loading ? (
        <output className="text-sm">Loading team…</output>
      ) : loadError ? (
        <div role="alert" className="space-y-3 text-sm">
          <p>{loadError}</p>
          <Button variant="outline" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute top-2 left-2.5 size-4 text-muted-foreground"
            />
            <Input
              aria-label="Search team members"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search members"
              className="pl-9"
            />
          </div>
          <ul className="divide-y rounded-control border">
            {visible.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center gap-3 px-4 py-2.5"
              >
                <MemberAvatar member={member.user} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {member.user.name || member.user.email}
                    {member.user.id === account.user.id && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        You
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
                {canManage &&
                (account.role === "owner" || member.role !== "owner") ? (
                  <>
                    <NativeSelect
                      aria-label={`Role for ${member.user.name || member.user.email}`}
                      value={member.role}
                      disabled={pending}
                      onChange={(event) => {
                        const role = event.target
                          .value as (typeof roles)[number];
                        void action(
                          () =>
                            authClient.organization.updateMemberRole({
                              memberId: member.id,
                              role,
                              organizationId: account.workspace.id,
                            }),
                          "Role updated.",
                        ).then((ok) => {
                          if (ok && member.user.id === account.user.id)
                            window.location.reload();
                        });
                      }}
                    >
                      {roles
                        .filter(
                          (role) =>
                            role !== "owner" || account.role === "owner",
                        )
                        .map((role) => (
                          <option key={role} value={role}>
                            {roleLabels[role]}
                          </option>
                        ))}
                    </NativeSelect>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        setError("");
                        setRemoving(member);
                      }}
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <span className="text-xs capitalize text-muted-foreground">
                    {member.role}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {!visible.length && (
            <p className="text-sm text-muted-foreground">
              No members match your search.
            </p>
          )}
          {!canManage && (
            <p className="text-xs text-muted-foreground">
              Company owners and admins manage invitations and membership.
            </p>
          )}
          {canManage && invitations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Pending invitations</h3>
              <ul className="divide-y rounded-lg border">
                {invitations.map((invitation) => (
                  <li
                    key={invitation.id}
                    className="flex flex-wrap items-center gap-2 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{invitation.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {invitation.role} ·{" "}
                        {new Date(invitation.expiresAt) <= new Date()
                          ? "Expired"
                          : "Awaiting acceptance"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        void action(
                          () =>
                            authClient.organization.inviteMember({
                              email: invitation.email,
                              role: invitation.role as "member" | "admin",
                              organizationId: account.workspace.id,
                              resend: true,
                            }),
                          "Invitation emailed again.",
                        )
                      }
                    >
                      Resend
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        void action(
                          () =>
                            authClient.organization.cancelInvitation({
                              invitationId: invitation.id,
                            }),
                          "Invitation canceled.",
                        )
                      }
                    >
                      Cancel
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => {
          if (!pending) setInviteOpen(open);
        }}
      >
        <DialogContent
          finalFocus={inviteButton}
          className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
          showCloseButton={false}
        >
          <DialogHeader className="gap-2">
            <DialogTitle>Invite a team member</DialogTitle>
            <DialogDescription>
              Send an email invitation to join {account.workspace.name}.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={invite}>
            <div className="grid gap-1.5">
              <label htmlFor="invite-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                required
                disabled={pending}
                placeholder="teammate@company.com"
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="invite-role" className="text-sm font-medium">
                Role
              </label>
              <NativeSelect
                id="invite-role"
                name="role"
                disabled={pending}
                wrapperClassName="w-full"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </NativeSelect>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setInviteOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="outline" disabled={pending}>
                {pending ? "Sending…" : "Send invitation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open && !pending) setRemoving(null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            Remove {removing?.user.name || removing?.user.email}?
          </DialogTitle>
          <DialogDescription>
            They will lose access to the company. Their record owners and task
            assignees will be cleared. Their login account remains available.
          </DialogDescription>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setRemoving(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={async () => {
                if (!removing) return;
                const removed = removing;
                if (
                  await action(
                    () =>
                      authClient.organization.removeMember({
                        memberIdOrEmail: removed.id,
                        organizationId: account.workspace.id,
                      }),
                    "Member removed.",
                  )
                ) {
                  setRemoving(null);
                  if (removed.user.id === account.user.id)
                    window.location.assign("/onboarding");
                }
              }}
            >
              {pending ? "Removing…" : "Remove member"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
