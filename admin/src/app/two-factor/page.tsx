import type { Metadata } from "next";
import { TwoFactorVerify } from "@/components/auth/two-factor-verify";
import Image from "next/image";

export const metadata: Metadata = { title: "Two-factor authentication" };

export default function Page() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f0f4f7] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <Image
            src="/images/ptp-logo-white.png"
            alt="Pacific Toll Processing"
            width={64}
            height={64}
            className="mb-3 object-contain"
            style={{ filter: "invert(1)" }}
          />
          <span className="text-lg font-semibold tracking-tight text-[#2d3540]">
            Pacific Toll Processing
          </span>
        </div>

        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-[#1a2a33]">
            Two-factor authentication
          </h1>
          <p className="mb-6 text-sm text-[#666]">
            Enter the code from your authenticator app to continue.
          </p>
          <TwoFactorVerify />
        </div>

        <p className="mt-6 text-center text-xs text-[#999]">
          Pacific Toll Processing &middot; Carson, CA
        </p>
      </div>
    </main>
  );
}
