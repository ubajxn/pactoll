"use client";
import { motion } from "motion/react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAnimatedHeight } from "@/hooks/use-animated-height";
import { authClient } from "@/lib/auth/client";
import { safeReturnTo } from "@/lib/auth/redirect";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function LoginForm({
  next = "/home",
  invalidLink = false,
  signupAllowed = false,
  invitationId,
  googleEnabled = false,
}: {
  next?: string;
  invalidLink?: boolean;
  signupAllowed?: boolean;
  invitationId?: string;
  googleEnabled?: boolean;
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

  async function signInWithGoogle() {
    setPending(true);
    setError("");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: safeReturnTo(next),
        newUserCallbackURL: `/onboarding?next=${encodeURIComponent(safeReturnTo(next))}`,
      });
    } catch {
      setError("Could not start Google sign-in. Try again.");
      setPending(false);
    }
  }

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
      {googleEnabled && (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 border-[#ddd8d0] bg-white text-[#2d3540] hover:bg-[#f5f3ef]"
            onClick={signInWithGoogle}
            disabled={pending}
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#ddd8d0]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#f5f3ef] px-3 text-[#999]">or</span>
            </div>
          </div>
        </>
      )}

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
