"use client";

import { ArrowUpRight, Check, Link as LinkIcon, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  useEffect,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import type { RecordKind } from "@/lib/data/contracts";

type RecordTarget = { kind: RecordKind; id: string };

function recordHref({ kind, id }: RecordTarget) {
  return `/${kind}/${encodeURIComponent(id)}`;
}

export function shouldUseFullPageRecordLink(
  pathname: string,
  target: RecordTarget,
) {
  return pathname === recordHref(target);
}

type RecordNameLinkProps = RecordTarget &
  Omit<ComponentPropsWithoutRef<"a">, "href"> & {
    href?: string;
    scroll?: ComponentProps<typeof Link>["scroll"];
    prefetch?: ComponentProps<typeof Link>["prefetch"];
    onNavigate?: ComponentProps<typeof Link>["onNavigate"];
  };

/**
 * Opens a record in the intercepted panel first, then promotes a repeated
 * activation of that same name to the canonical full-page record route.
 */
export function RecordNameLink({
  kind,
  id,
  href,
  scroll,
  prefetch,
  onNavigate,
  ...props
}: RecordNameLinkProps) {
  const pathname = usePathname();
  const canonicalHref = recordHref({ kind, id });
  const target = href ?? canonicalHref;

  if (shouldUseFullPageRecordLink(pathname, { kind, id })) {
    return <a {...props} href={target} />;
  }

  return (
    <Link
      {...props}
      href={target}
      scroll={scroll}
      prefetch={prefetch}
      onNavigate={onNavigate}
    />
  );
}

export function OpenRecordPageButton({
  kind,
  id,
  disabled = false,
  className,
}: RecordTarget & { disabled?: boolean; className?: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const href = recordHref({ kind, id });
  const query = pathname === href ? params.toString() : "";
  return (
    <Button
      nativeButton={false}
      // A document navigation bypasses interception and opens the canonical page.
      render={(props) => (
        <a {...props} href={`${href}${query ? `?${query}` : ""}`}>
          {props.children}
        </a>
      )}
      variant="ghost"
      size="icon-sm"
      aria-label="Open full page"
      title="Open full page"
      disabled={disabled}
      className={className}
    >
      <ArrowUpRight className="size-4" />
    </Button>
  );
}

export function CopyRecordLinkButton({
  kind,
  id,
  iconOnly = false,
  disabled = false,
}: RecordTarget & { iconOnly?: boolean; disabled?: boolean }) {
  const [status, setStatus] = useState<"idle" | "copying" | "copied" | "error">(
    "idle",
  );
  useEffect(() => {
    if (status !== "copied") return;
    const timeout = window.setTimeout(() => setStatus("idle"), 2000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const label = status === "copied" ? "Link copied" : "Copy link";
  return (
    <div className="relative shrink-0">
      <Button
        variant={iconOnly ? "ghost" : "outline"}
        size={iconOnly ? "icon-sm" : "sm"}
        aria-label={label}
        title={label}
        disabled={disabled || status === "copying"}
        onClick={async () => {
          setStatus("copying");
          try {
            await navigator.clipboard.writeText(
              new URL(recordHref({ kind, id }), window.location.origin).href,
            );
            setStatus("copied");
          } catch {
            setStatus("error");
          }
        }}
      >
        {status === "copied" ? (
          <Check className="size-4" />
        ) : (
          <LinkIcon className="size-4" />
        )}
        {!iconOnly && label}
      </Button>
      <output className="sr-only">
        {status === "copied" ? "Link copied" : ""}
      </output>
      {status === "error" && (
        <p
          role="alert"
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-md border bg-popover p-2 text-xs text-popover-foreground shadow-md"
        >
          Could not copy the link. Try again.
        </p>
      )}
    </div>
  );
}

function RecordLinkActions({
  kind,
  id,
  disabled,
}: RecordTarget & { disabled: boolean }) {
  return (
    <>
      <CopyRecordLinkButton kind={kind} id={id} iconOnly disabled={disabled} />
      <OpenRecordPageButton kind={kind} id={id} disabled={disabled} />
    </>
  );
}

export function RecordPanelActions({
  record,
  disabled = false,
  onClose,
  closeLabel = "Close record details",
}: {
  record?: RecordTarget;
  disabled?: boolean;
  onClose: () => void;
  closeLabel?: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {record && (
        <RecordLinkActions
          key={`${record.kind}:${record.id}`}
          {...record}
          disabled={disabled}
        />
      )}
      <Button
        data-detail-close
        aria-label={closeLabel}
        title={closeLabel}
        onClick={onClose}
        size="icon-sm"
        variant="ghost"
      >
        <X className="size-4.5" />
      </Button>
    </div>
  );
}
