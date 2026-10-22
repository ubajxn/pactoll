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
  const [mode, setMode] = useState<"magic" | "password">("password");
  const { ref, motionProps } = useAnimatedHeight({ duration: 0.25 });
  const [error, setError] = useState(
    invalidLink
      ? "This sign-in link is invalid or has expired. Request a new one below."
      : "",
  );

  async function submitMagicLink(email: string, name: string) {
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
      setError(result.error.message || "Could not send your link. Please try again.");
    else setSent(email);
  }

  async function submitPassword(email: string, password: string) {
    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: safeReturnTo(next),
    });
    if (result.error) {
      setError(result.error.message || "Invalid email or password.");
    } else {
      window.location.href = safeReturnTo(next);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const name = String(form.get("name") ?? "").trim();
    const password = String(form.get("password") ?? "").trim();
    setPending(true);
    setError("");
    try {
      if (mode === "magic") {
        await submitMagicLink(email, name);
      } else {
        await submitPassword(email, password);
      }
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-sm font-medium text-[#2d3540]">
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

        {mode === "password" && (
          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-sm font-medium text-[#2d3540]">
              Password
            </label>
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={pending}
            />
          </div>
        )}

        {mode === "magic" && (signupAllowed || invitationId) && (
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

        <Button type="submit" className="w-full bg-[#c85a1a] text-white hover:bg-[#b04e16]" disabled={pending}>
          {pending
            ? "Signing in…"
            : mode === "password"
              ? "Sign in"
              : sent
                ? "Send another link"
                : "Email me a sign-in link"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          className="text-xs text-[#888] hover:text-[#c85a1a] transition-colors"
          onClick={() => {
            setMode(mode === "magic" ? "password" : "magic");
            setError("");
            setSent("");
          }}
        >
          {mode === "magic" ? "Sign in with password instead" : "Sign in with email link instead"}
        </button>
      </div>

      <motion.div {...motionProps}>
        <div ref={ref}>
          <output className="block" aria-live="polite" aria-atomic="true">
            {sent && mode === "magic" && (
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
