"use client";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import { MemberAvatar } from "@/components/crm/member-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prepareAvatar } from "@/lib/auth/avatar";
import { authClient } from "@/lib/auth/client";
import { useAccount } from "@/lib/auth/provider";

export function AccountSettings({
  workspace = false,
}: {
  workspace?: boolean;
}) {
  const account = useAccount();
  const router = useRouter();
  const [name, setName] = useState(
    workspace ? account.workspace.name : account.user.name,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [avatar, setAvatar] = useState(account.user.image ?? null);
  const [avatarPending, setAvatarPending] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarNotice, setAvatarNotice] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);
  const editable = !workspace || ["owner", "admin"].includes(account.role);

  async function updateAvatar(image: string | null) {
    setAvatarPending(true);
    setAvatarError("");
    setAvatarNotice("");
    try {
      const result = await authClient.updateUser({ image });
      if (result.error) {
        setAvatarError(result.error.message || "Could not update your photo");
        return;
      }
      setAvatar(image);
      setAvatarNotice(
        image ? "Profile photo updated." : "Profile photo removed.",
      );
      router.refresh();
      window.dispatchEvent(new Event("crm:members-changed"));
    } catch {
      setAvatarError("Could not update your photo. Try again.");
    } finally {
      setAvatarPending(false);
    }
  }

  async function chooseAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setAvatarError("");
    setAvatarNotice("");
    setAvatarPending(true);
    try {
      await updateAvatar(await prepareAvatar(file));
    } catch (error) {
      setAvatarError(
        error instanceof Error
          ? error.message
          : "Could not prepare this image.",
      );
      setAvatarPending(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setError("");
    const name = String(new FormData(event.currentTarget).get("name")).trim();
    if (!name) {
      setError("Enter a name");
      return;
    }
    setPending(true);
    try {
      const result = workspace
        ? await authClient.organization.update({
            organizationId: account.workspace.id,
            data: { name },
          })
        : await authClient.updateUser({ name });
      if (result.error)
        setError(result.error.message || "Could not save changes");
      else {
        setSaved(true);
        router.refresh();
        window.dispatchEvent(new Event("crm:members-changed"));
      }
    } catch {
      setError("Could not save changes. Try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="max-w-xl space-y-8">
      <div className="space-y-1">
        <h2 className="text-lg font-medium">
          {workspace ? "Company" : "Your profile"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {workspace
            ? "Manage the company name shown throughout your CRM."
            : "Manage how you appear to your teammates."}
        </p>
      </div>
      {!workspace && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <MemberAvatar
              member={{ name, image: avatar }}
              className="size-12! [&_[data-slot=avatar-fallback]]:text-base"
            />
            <div className="flex flex-wrap gap-2">
              <input
                ref={avatarInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label="Choose profile photo"
                onChange={(event) => void chooseAvatar(event)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={avatarPending || pending}
                onClick={() => avatarInput.current?.click()}
              >
                {avatarPending ? "Updating…" : "Change photo"}
              </Button>
              {avatar && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={avatarPending || pending}
                  onClick={() => void updateAvatar(null)}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
          {avatarError && (
            <p role="alert" className="text-sm text-destructive">
              {avatarError}
            </p>
          )}
          {avatarNotice && <output className="text-sm">{avatarNotice}</output>}
        </div>
      )}
      <form className="space-y-4" onSubmit={save}>
        <div className="space-y-1.5">
          <label htmlFor="account-name" className="text-sm">
            {workspace ? "Company name" : "Display name"}
          </label>
          <Input
            id="account-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
            disabled={pending || avatarPending || !editable}
          />
        </div>
        {!workspace && (
          <div className="space-y-1.5">
            <label htmlFor="account-email" className="text-sm">
              Verified email
            </label>
            <Input id="account-email" value={account.user.email} readOnly />
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {saved && <output className="text-sm">Changes saved.</output>}
        {editable && (
          <Button disabled={pending || avatarPending} type="submit">
            {pending ? "Saving…" : "Save changes"}
          </Button>
        )}
      </form>
    </section>
  );
}
