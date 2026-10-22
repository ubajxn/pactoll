import type { Metadata } from "next";
import { TwoFactorVerify } from "@/components/auth/two-factor-verify";
import Image from "next/image";

export const metadata: Metadata = { title: "Two-factor authentication" };

export default function Page() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f0f4f7] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <div className="flex size-32 items-center justify-center rounded-full bg-[#157070] p-5 -mt-4 shadow-lg shadow-[#157070]/20">
            <Image
              src="/images/ptp-logo-white.png"
              alt="Pacific Toll Processing"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
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
