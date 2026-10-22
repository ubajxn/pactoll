import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/crm/app-sidebar";
import {
  DetailOverlayProvider,
  DetailOverlaySlot,
} from "@/components/crm/detail-overlay";
import { ListsProvider } from "@/components/crm/lists-provider";
import {
  PageHeaderProvider,
  PageHeaderSlot,
} from "@/components/crm/page-header";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccountProvider } from "@/lib/auth/provider";
import { safeReturnTo } from "@/lib/auth/redirect";
import { workspaceSession } from "@/lib/auth/server";
import { ChatSessionsProvider } from "@/lib/chat/session";
import { DataProvider } from "@/lib/data/provider";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const account = await workspaceSession(requestHeaders);
  const next = encodeURIComponent(
    safeReturnTo(requestHeaders.get("x-crm-return-to") ?? undefined),
  );
  if (account === "unauthorized") redirect(`/login?next=${next}`);
  if (account === "workspace_required") redirect(`/onboarding?next=${next}`);
  const preferences = await cookies();

  return (
    <AccountProvider value={account}>
      <DataProvider key={`${account.user.id}:${account.workspace.id}`}>
        <ListsProvider>
          <ChatSessionsProvider>
            <TooltipProvider>
              <SidebarProvider
                className="h-svh overflow-hidden"
                defaultOpen={
                  preferences.get("sidebar_state")?.value !== "false"
                }
              >
                <a
                  href="#main-content"
                  className="sr-only fixed left-4 top-4 z-50 rounded-md bg-background p-3 focus:not-sr-only"
                >
                  Skip to content
                </a>
                <AppSidebar
                  defaultListsOpen={
                    preferences.get("sidebar_lists_open")?.value !== "false"
                  }
                  defaultChatsOpen={
                    preferences.get("sidebar_chats_open")?.value !== "false"
                  }
                  defaultRecordsOpen={
                    preferences.get("sidebar_records_open")?.value !== "false"
                  }
                  defaultMarketingOpen={
                    preferences.get("sidebar_marketing_open")?.value !== "false"
                  }
                  defaultOperationsOpen={
                    preferences.get("sidebar_operations_open")?.value !== "false"
                  }
                  defaultFinanceOpen={
                    preferences.get("sidebar_finance_open")?.value !== "false"
                  }
                />
                <PageHeaderProvider>
                  <DetailOverlayProvider>
                    <SidebarInset className="min-h-0 min-w-0 [--detail-overlay-width:min(42rem,calc(100%_-_14rem))]">
                      <header className="group/page-header flex min-h-[calc(2.5rem+1px)] shrink-0 items-center gap-3 border-b px-3 py-1.5 sm:px-6">
                        <div className="flex items-center gap-2 md:hidden">
                          <SidebarTrigger className="size-6" />
                          <Separator
                            orientation="vertical"
                            className="h-4 data-vertical:self-center"
                          />
                        </div>
                        <PageHeaderSlot />
                      </header>
                      <div
                        id="main-content"
                        tabIndex={-1}
                        className="mx-auto flex min-h-0 w-full flex-1 flex-col gap-8 overflow-y-auto p-6 outline-none sm:p-8 lg:p-10"
                      >
                        {children}
                      </div>
                      <DetailOverlaySlot />
                    </SidebarInset>
                  </DetailOverlayProvider>
                </PageHeaderProvider>
              </SidebarProvider>
            </TooltipProvider>
          </ChatSessionsProvider>
        </ListsProvider>
      </DataProvider>
    </AccountProvider>
  );
}
