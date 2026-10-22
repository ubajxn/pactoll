"use client";

import { Building2, Handshake, ListTodo, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useSidebar } from "@/components/ui/sidebar";
import { crmNavigation } from "@/lib/crm-navigation";
import { recordKinds } from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";
import {
  loadSearchRecords,
  matchesSearch,
  type SearchRecord,
} from "@/lib/search";

const SearchContext = createContext<() => void>(() => {});
export const useGlobalSearch = () => useContext(SearchContext);
const groups = {
  accounts: { title: "Accounts", icon: Building2 },
  contacts: { title: "Contacts", icon: Users },
  opportunities: { title: "Opportunities", icon: Handshake },
  tasks: { title: "Tasks", icon: ListTodo },
};
type SearchState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; records: SearchRecord[] };

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const data = useData();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<SearchState>({ status: "loading" });
  const returnFocus = useRef<HTMLElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const show = useCallback(() => {
    returnFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setQuery("");
    setSelection("");
    setState({ status: "loading" });
    setOpenMobile(false);
    setOpen(true);
  }, [setOpenMobile]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "k" ||
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        event.isComposing ||
        event.repeat
      )
        return;
      // Do not interrupt another dialog (for example a pending record deletion).
      if (
        !open &&
        document.querySelector('[role="dialog"]:not([data-mobile="true"])')
      )
        return;
      event.preventDefault();
      if (open) setOpen(false);
      else show();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, show]);

  // Refresh on each opening so newly created or edited records are searchable.
  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt retries failed loading.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState({ status: "loading" });
    loadSearchRecords(data).then(
      (records) => {
        if (!cancelled) {
          setState({ status: "ready", records });
          setSelection("");
        }
      },
      () => {
        if (!cancelled) setState({ status: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [data, open, attempt]);

  const pages = crmNavigation.filter((page) =>
    matchesSearch([page.title], query),
  );
  const hasQuery = query.trim().length > 0;
  const results =
    hasQuery && state.status === "ready"
      ? state.records.filter((record) => matchesSearch(record.keywords, query))
      : [];
  const firstRecord = recordKinds
    .map((kind) => results.find((record) => record.kind === kind))
    .find(Boolean);
  const firstValue = pages[0]
    ? `page:${pages[0].href}`
    : firstRecord
      ? `${firstRecord.kind}/${firstRecord.id}`
      : "";
  return (
    <SearchContext.Provider value={show}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="gap-0 overflow-hidden p-0 sm:max-w-xl"
          showCloseButton={false}
          initialFocus={input}
          finalFocus={() =>
            returnFocus.current?.isConnected &&
            returnFocus.current.getClientRects().length
              ? returnFocus.current
              : document.querySelector<HTMLElement>(
                  '[data-slot="sidebar-trigger"]',
                )
          }
        >
          <DialogTitle className="sr-only">Search CRM</DialogTitle>
          <DialogDescription className="sr-only">
            Search pages, accounts, contacts, opportunities, and tasks. Use
            arrow keys to choose a result and Enter to open it.
          </DialogDescription>
          <Command
            shouldFilter={false}
            loop
            value={selection || firstValue}
            onValueChange={setSelection}
          >
            <CommandInput
              ref={input}
              value={query}
              onValueChange={(value) => {
                setQuery(value);
                setSelection("");
              }}
              placeholder="Search pages and records…"
              aria-label="Search records"
            />
            <CommandList
              className="max-h-[min(60dvh,400px)]"
              aria-busy={hasQuery && state.status === "loading"}
            >
              {pages.length > 0 && (
                <CommandGroup heading="Pages">
                  {pages.map((page) => (
                    <CommandItem
                      key={page.href}
                      value={`page:${page.href}`}
                      onSelect={() => {
                        setOpen(false);
                        router.push(page.href);
                      }}
                    >
                      <page.icon aria-hidden="true" />
                      <span>{page.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {hasQuery && state.status === "loading" && (
                <output className="block p-8 text-center text-sm text-muted-foreground">
                  Loading records…
                </output>
              )}
              {hasQuery && state.status === "error" && (
                <div className="space-y-3 p-8 text-center">
                  <p role="alert" className="text-sm text-muted-foreground">
                    Unable to load records. Check your data connection and try
                    again.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAttempt((value) => value + 1)}
                  >
                    Retry
                  </Button>
                </div>
              )}
              {state.status === "ready" &&
                results.length === 0 &&
                pages.length === 0 && (
                  <output className="block p-8 text-center text-sm text-muted-foreground">
                    {state.records.length
                      ? "No matching pages or records. Try a different name or keyword."
                      : "No records yet. Records will appear here when added to your CRM."}
                  </output>
                )}
              {recordKinds.map((kind) => {
                const items = results.filter((record) => record.kind === kind);
                const group = groups[kind];
                return (
                  items.length > 0 && (
                    <CommandGroup key={kind} heading={group.title}>
                      {items.map((record) => (
                        <CommandItem
                          key={record.id}
                          value={`${kind}/${record.id}`}
                          onSelect={() => {
                            setOpen(false);
                            router.push(
                              `/${kind}/${encodeURIComponent(record.id)}`,
                            );
                          }}
                        >
                          <group.icon aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">
                            {record.title}
                          </span>
                          {record.subtitle && (
                            <span className="max-w-[45%] truncate text-xs text-muted-foreground">
                              {record.subtitle}
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )
                );
              })}
            </CommandList>
          </Command>
          <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <KbdGroup>
                  <Kbd aria-label="Arrow up">↑</Kbd>
                  <Kbd aria-label="Arrow down">↓</Kbd>
                </KbdGroup>
                Navigate
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Kbd aria-label="Enter">↵</Kbd>
                Open
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Close <Kbd>Esc</Kbd>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SearchContext.Provider>
  );
}
