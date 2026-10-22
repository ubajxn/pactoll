"use client";

import { Building2, Diamond, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ListDialog } from "@/components/crm/list-dialog";
import { useLists } from "@/components/crm/lists-provider";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export const listIcons = {
  accounts: Building2,
  contacts: UserRound,
  opportunities: Diamond,
};
export function SidebarLists() {
  const { lists, error, refresh } = useLists();
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <nav aria-label="Lists">
      <SidebarMenu>
        <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
          <SidebarMenuButton
            ref={trigger}
            tooltip="New list"
            className="gap-2 rounded-control has-[>svg:first-child]:pl-3"
            onClick={() => setCreating(true)}
          >
            <Plus />
            <span>New list</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {error && (
          <SidebarMenuItem>
            <SidebarMenuButton onClick={refresh}>
              Could not load lists. Retry
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        {lists.map((list) => {
          const href = `/lists/${encodeURIComponent(list.id)}`;
          const Icon = listIcons[list.recordType];
          return (
            <SidebarMenuItem key={list.id}>
              <SidebarMenuButton
                render={<Link href={href} />}
                isActive={pathname === href}
                aria-current={pathname === href ? "page" : undefined}
                tooltip={list.name}
                className="gap-2 rounded-control data-active:font-normal has-[>svg:first-child]:pl-3"
                onClick={() => setOpenMobile(false)}
              >
                <Icon />
                <span>{list.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
      <ListDialog
        open={creating}
        onOpenChange={setCreating}
        returnFocus={trigger}
        onSaved={(list) => {
          setOpenMobile(false);
          router.push(`/lists/${encodeURIComponent(list.id)}`);
        }}
      />
    </nav>
  );
}
