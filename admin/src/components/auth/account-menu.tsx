"use client";

import { ChevronDown, LogOut, PanelLeftIcon, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MemberAvatar } from "@/components/crm/member-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth/client";
import { useAccount } from "@/lib/auth/provider";

export function AccountMenu() {
  const { user } = useAccount();
  const { isMobile, state, setOpenMobile, toggleSidebar } = useSidebar();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const name = user.name || user.email;
  const avatar = (
    <span className="flex size-4 shrink-0 items-center justify-center [&>[data-slot=avatar]]:size-5!">
      <MemberAvatar member={user} />
    </span>
  );

  async function signOut() {
    setSigningOut(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError(result.error.message || "Could not log out. Try again.");
      } else {
        window.location.assign("/login");
      }
    } catch {
      setError("Could not log out. Try again.");
    } finally {
      setSigningOut(false);
    }
  }

  if (!isMobile && state === "collapsed") {
    return (
      <SidebarMenuButton
        onClick={(event) => {
          const menuItem = event.currentTarget.parentElement;
          toggleSidebar();
          requestAnimationFrame(() =>
            menuItem
              ?.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')
              ?.focus(),
          );
        }}
        aria-label="Expand sidebar"
        title="Expand sidebar"
        className="h-6 rounded-control py-0 group-data-[collapsible=icon]:h-6! group-data-[collapsible=icon]:py-0!"
      >
        <span className="group-hover:hidden group-focus-visible/menu-button:hidden">
          {avatar}
        </span>
        <PanelLeftIcon
          aria-hidden="true"
          className="hidden group-hover:block group-focus-visible/menu-button:block"
        />
      </SidebarMenuButton>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton className="h-6 w-fit max-w-[calc(100%-3rem)] gap-2 rounded-control py-0 pl-3 pr-1!" />
        }
        aria-label={`Account menu for ${name}`}
        title={name}
      >
        {avatar}
        <span className="min-w-0 truncate font-medium">{name}</span>
        <ChevronDown
          aria-hidden="true"
          className="size-3! text-muted-foreground"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 rounded-lg">
        <DropdownMenuItem
          render={<Link href="/settings/profile" />}
          className="rounded-control"
          onClick={() => setOpenMobile(false)}
        >
          <Settings aria-hidden="true" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-control"
          disabled={signingOut}
          closeOnClick={false}
          onClick={signOut}
        >
          <LogOut aria-hidden="true" />
          {signingOut ? "Logging out…" : "Logout"}
        </DropdownMenuItem>
        {error && (
          <p role="alert" className="px-2 py-1.5 text-xs text-destructive">
            {error}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
