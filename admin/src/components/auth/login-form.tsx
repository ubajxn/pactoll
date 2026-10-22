"use client";
import { motion } from "motion/react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAnimatedHeight } from "@/hooks/use-animated-height";
import { authClient } from "@/lib/auth/client";
import { safeReturnTo } from "@/lib/auth/redirect";

export function LoginForm({
  next = "/home",
  invalidLink = false,
  signupAllowed = false,
  invitationId,
}: {
  next?: string;
  invalidLink?: boolean;
  signupAllowed?: boolean;
  invitationId?: string;
}) {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState("");
  const { ref, motionProps } = useAnimatedHeight({ duration: 0.25 });
  const [error, setError] = useState(
    invalidLink
      ? "This sign-in link is invalid or has expired. Request a new one below."
      : "",
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const name = String(form.get("name") ?? "").trim();
    setPending(true);
    setError("");
    try {
      const callbackURL = `/onboarding?next=${encodeURIComponent(safeReturnTo(next))}`;
      const result = await authClient.signIn.magicLink({
        email,
        name: name || undefined,
        metadata: invitationId ? { invitationId } : undefined,
        callbackURL,
        newUserCallbackURL: callbackURL,
        errorCallbackURL: `/login?error=invalid_link&next=${encodeURIComponent(safeReturnTo(next))}`,
      });
      if (result.error)
        setError(
          result.error.message || "Could not send your link. Please try again.",
        );
      else setSent(email);
    } catch {
      setError(
        "Could not send your link. Check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-sm">
            Email
          </label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
            placeholder="you@company.com"
          />
        </div>
        {(signupAllowed || invitationId) && (
          <div className="space-y-1.5">
            <label htmlFor="login-name" className="text-sm">
              Your name{" "}
              <span className="text-muted-foreground">(for new accounts)</span>
            </label>
            <Input
              id="login-name"
              name="name"
              autoComplete="name"
              maxLength={100}
              disabled={pending}
            />
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending
            ? "Sending…"
            : sent
              ? "Send another link"
              : "Email me a sign-in link"}
        </Button>
      </form>
      <motion.div {...motionProps}>
        <div ref={ref}>
          <output className="block" aria-live="polite" aria-atomic="true">
            {sent && (
              <div className="pt-4">
                <p className="rounded-lg border bg-muted/40 p-3 text-sm [overflow-wrap:anywhere]">
                  Check {sent} for your sign-in link. It expires in 15 minutes.
                </p>
              </div>
            )}
          </output>
        </div>
      </motion.div>
    </>
  );
}
