import { cn } from "cn";
import { Anvil } from "lucide-react";

export const platformName = "Pacific Toll Processing";

export function PlatformLogo({ className }: { className?: string }) {
  return (
    <Anvil aria-hidden="true" className={cn("size-4 shrink-0", className)} />
  );
}

export function PlatformName() {
  return <span className="font-semibold">{platformName}</span>;
}
