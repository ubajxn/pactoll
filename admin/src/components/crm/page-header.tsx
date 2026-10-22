"use client";

import { ChevronRight, MessageSquare, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, type ReactNode, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { crmNavigation } from "@/lib/crm-navigation";

const HeaderContext = createContext<HTMLElement | null>(null);

function useRouteHeading() {
  const pathname = usePathname();
  const route = crmNavigation.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (pathname.startsWith("/chat/"))
    return {
      title: pathname === "/chat/new" ? "New chat" : "Chat",
      icon: MessageSquare,
    };
  if (pathname.startsWith("/settings/")) {
    const section = pathname.split("/")[2];
    return {
      title: section.charAt(0).toUpperCase() + section.slice(1),
      icon: Settings,
    };
  }
  return route ?? { title: "CRM", icon: Settings };
}

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  return (
    <HeaderContext.Provider value={target}>
      <HeaderTargetContext.Provider value={setTarget}>
        {children}
      </HeaderTargetContext.Provider>
    </HeaderContext.Provider>
  );
}

const HeaderTargetContext = createContext<
  (target: HTMLDivElement | null) => void
>(() => {});

export function PageHeaderSlot() {
  const setTarget = useContext(HeaderTargetContext);
  return (
    <div
      ref={setTarget}
      className="flex min-w-0 flex-1 items-center [&:has(>[data-page-header])>[data-fallback]]:hidden"
    >
      <div data-fallback className="min-w-0">
        <PageHeading />
      </div>
    </div>
  );
}

export function PageHeading({ title }: { title?: string }) {
  const route = useRouteHeading();
  const Icon = route.icon;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
      <h1 className="truncate text-sm font-medium">{title ?? route.title}</h1>
    </div>
  );
}

export function PageBreadcrumbs({
  parent,
  title,
}: {
  parent: { title: string; href: string };
  title: string;
}) {
  const route = useRouteHeading();
  const Icon = route.icon;
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-2 text-sm">
        <li className="shrink-0">
          <Link
            href={parent.href}
            className="flex items-center gap-2 rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {parent.title}
          </Link>
        </li>
        <li aria-hidden="true" className="shrink-0 text-muted-foreground">
          <ChevronRight className="size-3.5" />
        </li>
        <li className="min-w-0">
          <h1
            aria-current="page"
            className="truncate font-medium"
            title={title}
          >
            {title}
          </h1>
        </li>
      </ol>
    </nav>
  );
}

export function PageHeader({
  children,
  title,
}: {
  children?: ReactNode;
  title?: string;
}) {
  const target = useContext(HeaderContext);
  return target
    ? createPortal(
        <div
          data-page-header
          className="flex min-w-0 flex-1 items-center justify-between gap-3"
        >
          {children ?? <PageHeading title={title} />}
        </div>,
        target,
      )
    : null;
}
