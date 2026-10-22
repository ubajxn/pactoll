"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";

export function TwoFactorVerify() {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"totp" | "backup">("totp");

  async function verify() {
    if (!code.trim()) return;
    setPending(true);
    setError("");
    try {
      if (mode === "totp") {
        const result = await authClient.twoFactor.verifyTotp({ code });
        if (result.error) {
          setError(result.error.message || "Invalid code. Try again.");
        } else {
          window.location.href = "/home";
        }
      } else {
        const result = await authClient.twoFactor.verifyBackupCode({ code });
        if (result.error) {
          setError(result.error.message || "Invalid backup code.");
        } else {
          window.location.href = "/home";
        }
      }
    } catch {
      setError("Verification failed. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="two-factor-code" className="text-sm font-medium text-[#2d3540]">
          {mode === "totp" ? "Authentication code" : "Backup code"}
        </label>
        <Input
          id="two-factor-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={mode === "totp" ? "000000" : "Enter backup code"}
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={mode === "totp" ? 6 : 20}
          disabled={pending}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              verify();
            }
          }}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        onClick={verify}
        className="w-full bg-[#157070] text-white hover:bg-[#0f5858]"
        disabled={pending || !code.trim()}
      >
        {pending ? "Verifying..." : "Verify"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          className="text-xs text-[#888] hover:text-[#157070] transition-colors"
          onClick={() => {
            setMode(mode === "totp" ? "backup" : "totp");
            setCode("");
            setError("");
          }}
        >
          {mode === "totp" ? "Use a backup code instead" : "Use authenticator app instead"}
        </button>
      </div>
    </div>
  );
}
