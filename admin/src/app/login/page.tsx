import { LoginForm } from "@/components/auth/login-form";
import { LoginImageCarousel } from "@/components/auth/login-carousel";
import { safeReturnTo } from "@/lib/auth/redirect";
import { registrationStatus } from "@/lib/auth/server";
import Image from "next/image";

export const metadata = { title: "Sign in" };

const images = [
  { src: "/images/blanking-line.jpg", alt: "Steel blanking line in operation" },
  { src: "/images/build-banner.jpg", alt: "PTP steel processing facility" },
  { src: "/images/build-banner-2.jpg", alt: "Steel coil processing" },
  { src: "/images/leveler.jpg", alt: "Precision leveler equipment" },
  { src: "/images/solar.jpg", alt: "Solar panel steel components" },
];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { signupAllowed } = await registrationStatus();
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID);
  const invitationId = /^\/invite\/([^/?]+)$/.exec(
    safeReturnTo(params.next),
  )?.[1];

  return (
    <main className="flex min-h-svh bg-[#f0f4f7]">
      {/* Left — form */}
      <div className="flex w-full flex-col justify-center px-8 py-12 sm:px-12 lg:w-[480px] lg:shrink-0 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10">
            <div className="mb-8 flex justify-center lg:justify-start">
              <div className="flex size-32 items-center justify-center rounded-full bg-[#157070] p-5 -mt-8 shadow-lg shadow-[#157070]/20">
                <Image
                  src="/images/ptp-logo-white.png"
                  alt="Pacific Toll Processing"
                  width={120}
                  height={120}
                  className="object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1a1a1a]">
              {signupAllowed ? "Set up your company" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#666]">
              {signupAllowed
                ? "Create the first account to get started."
                : "Sign in with a secure link sent to your email."}
            </p>
          </div>

          <LoginForm
            next={params.next}
            invalidLink={Boolean(params.error)}
            signupAllowed={signupAllowed}
            invitationId={invitationId}
            googleEnabled={googleEnabled}
          />

          <p className="mt-10 text-center text-xs text-[#999]">
            Pacific Toll Processing &middot; Carson, CA
          </p>
        </div>
      </div>

      {/* Right — rotating images */}
      <div className="relative hidden flex-1 lg:block">
        <LoginImageCarousel images={images} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#f0f4f7] via-transparent to-transparent" style={{ width: "80px" }} />
      </div>
    </main>
  );
}
