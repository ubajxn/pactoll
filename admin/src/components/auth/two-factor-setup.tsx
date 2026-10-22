"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { useAccount } from "@/lib/auth/provider";

type SetupStep = "idle" | "qr" | "verify" | "backup" | "done";

export function TwoFactorSetup() {
  const account = useAccount();
  const [step, setStep] = useState<SetupStep>("idle");
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState(
    (account.user as Record<string, unknown>).twoFactorEnabled === true,
  );

  async function startEnable() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.twoFactor.enable({
        password,
      });
      if (result.error) {
        setError(result.error.message || "Could not enable 2FA.");
        setPending(false);
        return;
      }
      setTotpURI(result.data?.totpURI ?? "");
      setBackupCodes(result.data?.backupCodes ?? []);
      setStep("qr");
    } catch {
      setError("Failed to start 2FA setup.");
    } finally {
      setPending(false);
    }
  }

  async function verifySetup() {
    if (!code.trim()) return;
    setPending(true);
    setError("");
    try {
      const result = await authClient.twoFactor.verifyTotp({ code });
      if (result.error) {
        setError(result.error.message || "Invalid code. Try again.");
        setPending(false);
        return;
      }
      setStep("backup");
    } catch {
      setError("Verification failed.");
    } finally {
      setPending(false);
    }
  }

  async function disable() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.twoFactor.disable({ password });
      if (result.error) {
        setError(result.error.message || "Could not disable 2FA.");
        setPending(false);
        return;
      }
      setEnabled(false);
      setStep("idle");
      setPassword("");
    } catch {
      setError("Failed to disable 2FA.");
    } finally {
      setPending(false);
    }
  }

  if (enabled && step === "idle") {
    return (
      <section className="max-w-xl space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Two-factor authentication</h2>
          <p className="text-sm text-muted-foreground">
            2FA is enabled on your account. Your account is protected with an
            authenticator app.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <svg className="size-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          Two-factor authentication is active
        </div>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="disable-password" className="text-sm font-medium">
              Enter your password to disable 2FA
            </label>
            <Input
              id="disable-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
            />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button
            variant="outline"
            onClick={disable}
            disabled={pending || !password}
            className="text-destructive hover:text-destructive"
          >
            {pending ? "Disabling..." : "Disable 2FA"}
          </Button>
        </div>
      </section>
    );
  }

  if (step === "idle") {
    return (
      <section className="max-w-xl space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Two-factor authentication</h2>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account with a TOTP
            authenticator app like Google Authenticator, Authy, or 1Password.
          </p>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="enable-password" className="text-sm font-medium">
              Enter your password to enable 2FA
            </label>
            <Input
              id="enable-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
            />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button
            onClick={startEnable}
            disabled={pending || !password}
            className="bg-[#157070] text-white hover:bg-[#0f5858]"
          >
            {pending ? "Setting up..." : "Enable 2FA"}
          </Button>
        </div>
      </section>
    );
  }

  if (step === "qr") {
    return (
      <section className="max-w-xl space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Scan QR code</h2>
          <p className="text-sm text-muted-foreground">
            Scan this QR code with your authenticator app, then enter the 6-digit
            code it generates.
          </p>
        </div>

        <div className="flex justify-center rounded-lg border bg-white p-6">
          <TOTPQRCode uri={totpURI} />
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Can't scan? Enter the key manually
          </summary>
          <code className="mt-2 block break-all rounded border bg-muted px-3 py-2 text-xs">
            {totpURI}
          </code>
        </details>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="verify-code" className="text-sm font-medium">
              Verification code
            </label>
            <Input
              id="verify-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              disabled={pending}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  verifySetup();
                }
              }}
            />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button
            onClick={verifySetup}
            disabled={pending || code.length < 6}
            className="bg-[#157070] text-white hover:bg-[#0f5858]"
          >
            {pending ? "Verifying..." : "Verify and activate"}
          </Button>
        </div>
      </section>
    );
  }

  if (step === "backup") {
    return (
      <section className="max-w-xl space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Save your backup codes</h2>
          <p className="text-sm text-muted-foreground">
            Store these codes somewhere safe. Each code can only be used once if
            you lose access to your authenticator app.
          </p>
        </div>

        <div className="rounded-lg border bg-muted/40 p-4">
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((bc, i) => (
              <code key={i} className="rounded border bg-white px-3 py-1.5 text-center text-sm font-mono">
                {bc}
              </code>
            ))}
          </div>
        </div>

        <Button
          onClick={() => {
            setEnabled(true);
            setStep("done");
          }}
          className="bg-[#157070] text-white hover:bg-[#0f5858]"
        >
          I've saved my backup codes
        </Button>
      </section>
    );
  }

  return (
    <section className="max-w-xl space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <svg className="size-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
        Two-factor authentication is now active
      </div>
      <p className="text-sm text-muted-foreground">
        Your account is now protected. You'll be asked for a code from your
        authenticator app each time you sign in.
      </p>
    </section>
  );
}

function TOTPQRCode({ uri }: { uri: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && uri) {
      QRCode.toCanvas(canvasRef.current, uri, {
        width: 200,
        margin: 2,
        color: { dark: "#1a2a33", light: "#ffffff" },
      });
    }
  }, [uri]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded"
      aria-label="Scan this QR code with your authenticator app"
    />
  );
}
