import { cn } from "cn";

export const platformName = "Pacific Toll Processing";

export function PlatformLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded bg-[#2d3540] p-0.5",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/ptp-logo-white.png"
        alt="PTP"
        className="size-full object-contain"
      />
    </div>
  );
}

export function PlatformName() {
  return <span className="font-semibold">{platformName}</span>;
}
