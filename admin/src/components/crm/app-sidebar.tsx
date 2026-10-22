"use client";

import {
  ArrowLeft,
  Building2,
  ChevronRight,
  ChevronsLeft,
  Plus,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { AccountMenu } from "@/components/auth/account-menu";
import {
  GlobalSearchProvider,
  useGlobalSearch,
} from "@/components/crm/global-search";
import { SidebarChats } from "@/components/crm/sidebar-chats";
import { SidebarLists } from "@/components/crm/sidebar-lists";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAnimatedHeight } from "@/hooks/use-animated-height";
import { crmNavigation } from "@/lib/crm-navigation";

export function AppSidebar({
  defaultListsOpen = true,
  defaultChatsOpen = true,
  defaultRecordsOpen = true,
  defaultMarketingOpen = true,
}: {
  defaultListsOpen?: boolean;
  defaultChatsOpen?: boolean;
  defaultRecordsOpen?: boolean;
  defaultMarketingOpen?: boolean;
}) {
  const { toggleSidebar, isMobile, setOpenMobile } = useSidebar();

  const pathname = usePathname();
  const isSettings =
    pathname === "/settings" || pathname.startsWith("/settings/");
  const activeLists = pathname.startsWith("/lists/");
  const [listsOpen, setListsOpen] = useState(defaultListsOpen || activeLists);
  const activeChats = pathname.startsWith("/chat/");
  const activeRecords = crmNavigation.some(
    (item) =>
      item.group === "records" &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );
  const activeMarketing = crmNavigation.some(
    (item) =>
      item.group === "marketing" &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );
  const [chatsOpen, setChatsOpen] = useState(defaultChatsOpen || activeChats);
  const [recordsOpen, setRecordsOpen] = useState(
    defaultRecordsOpen || activeRecords,
  );
  const [marketingOpen, setMarketingOpen] = useState(
    defaultMarketingOpen || activeMarketing,
  );
  const [previousPathname, setPreviousPathname] = useState(pathname);

  if (pathname !== previousPathname) {
    setPreviousPathname(pathname);
    if (activeLists) setListsOpen(true);
    if (activeChats) setChatsOpen(true);
    if (activeRecords) setRecordsOpen(true);
    if (activeMarketing) setMarketingOpen(true);
  }

  useEffect(() => {
    // biome-ignore lint/suspicious/noDocumentCookie: server-rendered browser-local preference.
    document.cookie = `sidebar_chats_open=${chatsOpen}; path=/; max-age=604800; SameSite=Lax`;
    // biome-ignore lint/suspicious/noDocumentCookie: server-rendered browser-local preference.
    document.cookie = `sidebar_records_open=${recordsOpen}; path=/; max-age=604800; SameSite=Lax`;
    // biome-ignore lint/suspicious/noDocumentCookie: server-rendered browser-local preference.
    document.cookie = `sidebar_lists_open=${listsOpen}; path=/; max-age=604800; SameSite=Lax`;
    // biome-ignore lint/suspicious/noDocumentCookie: server-rendered browser-local preference.
    document.cookie = `sidebar_marketing_open=${marketingOpen}; path=/; max-age=604800; SameSite=Lax`;
  }, [chatsOpen, recordsOpen, listsOpen, marketingOpen]);

  return (
    <GlobalSearchProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b px-2 py-2">
          <SidebarMenu>
            <SidebarMenuItem>
              {isSettings ? (
                <SidebarMenuButton
                  render={<Link href="/home" />}
                  aria-label="Back to CRM"
                  title="Back to CRM"
                  className="h-6 w-fit max-w-[calc(100%-1.5rem)] gap-2 rounded-control py-0 pr-3! has-[>svg:first-child]:pl-3 group-data-[collapsible=icon]:h-6! group-data-[collapsible=icon]:max-w-none group-data-[collapsible=icon]:py-0!"
                  onClick={() => setOpenMobile(false)}
                >
                  <ArrowLeft aria-hidden="true" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    Settings
                  </span>
                </SidebarMenuButton>
              ) : (
                <AccountMenu />
              )}
              {!isSettings && <HeaderSearch />}
              <SidebarMenuAction
                onClick={(event) => {
                  const menuItem = event.currentTarget.parentElement;
                  toggleSidebar();
                  if (!isMobile) {
                    requestAnimationFrame(() =>
                      menuItem
                        ?.querySelector<HTMLElement>(
                          'button[aria-label="Expand sidebar"], a[aria-label="Back to CRM"]',
                        )
                        ?.focus(),
                    );
                  }
                }}
                aria-label={isMobile ? "Close sidebar" : "Collapse sidebar"}
                title={isMobile ? "Close sidebar" : "Collapse sidebar"}
                className="top-0! right-0 size-6 rounded-control"
              >
                <ChevronsLeft aria-hidden="true" />
              </SidebarMenuAction>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="gap-4">
          {isSettings ? (
            <SidebarGroup>
              <SidebarGroupContent>
                <SettingsNavigation />
              </SidebarGroupContent>
            </SidebarGroup>
          ) : (
            <>
              <SidebarGroup>
                <SidebarGroupContent>
                  <NavigationItems group="main" label="Main navigation" />
                </SidebarGroupContent>
              </SidebarGroup>
              <NavigationGroup
                group="chats"
                label="Chats"
                open={chatsOpen}
                setOpen={setChatsOpen}
              />
              <NavigationGroup
                group="records"
                label="Records"
                open={recordsOpen}
                setOpen={setRecordsOpen}
              />
              <NavigationGroup
                group="marketing"
                label="Marketing"
                open={marketingOpen}
                setOpen={setMarketingOpen}
              />
              <NavigationGroup
                group="lists"
                label="Lists"
                open={listsOpen}
                setOpen={setListsOpen}
              />
            </>
          )}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </GlobalSearchProvider>
  );
}

function NavigationGroup({
  group,
  label,
  open,
  setOpen,
}: {
  group: "chats" | "records" | "marketing" | "lists";
  label: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { state, isMobile } = useSidebar();

  // Keep primary destinations accessible in icon mode without changing preferences.
  const iconOnly = state === "collapsed" && !isMobile;
  const expanded = iconOnly || open;
  const panelId = useId();
  const { ref, motionProps } = useAnimatedHeight({ open: expanded });

  return (
    <SidebarGroup className="group/navigation-section">
      <SidebarGroupLabel
        render={
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => setOpen(!open)}
          />
        }
        className="w-full cursor-pointer rounded-control justify-start gap-1 pl-3 hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
      >
        <span>{label}</span>
        <ChevronRight
          aria-hidden="true"
          className={`opacity-0 transition-[opacity,rotate] duration-150 ease-in-out group-hover/navigation-section:opacity-100 motion-reduce:transition-none ${expanded ? "rotate-90" : ""}`}
        />
      </SidebarGroupLabel>
      <motion.div
        {...motionProps}
        id={panelId}
        inert={!expanded}
        aria-hidden={!expanded}
      >
        <div ref={ref} className="flow-root">
          <SidebarGroupContent>
            {group === "lists" ? (
              <SidebarLists />
            ) : (
              <NavigationItems group={group} label={label} />
            )}
          </SidebarGroupContent>
        </div>
      </motion.div>
    </SidebarGroup>
  );
}

function NavigationItems({
  group,
  label,
}: {
  group: (typeof crmNavigation)[number]["group"];
  label: string;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <nav aria-label={label}>
      <SidebarMenu>
        {crmNavigation
          .filter((item) => item.group === group)
          .map((item) => {
            const isNewChat = item.href === "/chat/new";
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.group === "settings" && pathname.startsWith("/settings/"));
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={
                    <Link
                      href={item.href}
                      onNavigate={() => {
                        if (
                          item.href === "/chat/new" &&
                          pathname === item.href
                        ) {
                          document
                            .getElementById("chat-message-input")
                            ?.focus();
                        }
                      }}
                    />
                  }
                  isActive={active}
                  aria-current={active ? "page" : undefined}
                  tooltip={item.title}
                  className="gap-2 rounded-control data-active:font-normal has-[>svg:first-child]:pl-3"
                  onClick={() => setOpenMobile(false)}
                >
                  {isNewChat ? (
                    <Plus aria-hidden="true" />
                  ) : (
                    <item.icon aria-hidden="true" />
                  )}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        {group === "chats" && <SidebarChats />}
      </SidebarMenu>
    </nav>
  );
}

function HeaderSearch() {
  const showSearch = useGlobalSearch();
  return (
    <SidebarMenuAction
      onClick={showSearch}
      aria-label="Search"
      title="Search (⌘K / Ctrl+K)"
      aria-keyshortcuts="Meta+K Control+K"
      className="top-0! right-6! size-6 rounded-control"
    >
      <Search aria-hidden="true" />
    </SidebarMenuAction>
  );
}

function SettingsNavigation() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const sections = [
    { title: "Profile", href: "/settings/profile", icon: UserRound },
    { title: "Company", href: "/settings/company", icon: Building2 },
    { title: "Team", href: "/settings/team", icon: Users },
  ];

  return (
    <nav aria-label="Settings">
      <SidebarMenu>
        {sections.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                isActive={active}
                aria-current={active ? "page" : undefined}
                tooltip={item.title}
                className="gap-2 rounded-control data-active:font-normal has-[>svg:first-child]:pl-3"
                onClick={() => setOpenMobile(false)}
              >
                <item.icon aria-hidden="true" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}
