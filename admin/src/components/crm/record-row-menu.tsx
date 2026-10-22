"use client";

import {
  Check,
  ListPlus,
  ListX,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { ListDialog } from "@/components/crm/list-dialog";
import {
  notifyListsChanged,
  useLists,
  useRecordList,
} from "@/components/crm/lists-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DataError, type ListRecordKind } from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";

export function RecordRowMenu({
  kind,
  record,
  disabled = false,
}: {
  kind: ListRecordKind;
  record: { id: string; name: string };
  disabled?: boolean;
}) {
  const data = useData();
  const directory = useLists();
  const currentList = useRecordList();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const [error, setError] = useState("");

  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const focusSearchOnOpen = useRef(false);
  const lists = directory.lists.filter(
    (list) =>
      list.recordType === kind &&
      list.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  async function mutate(
    action: () => Promise<unknown>,
    message: string,
    remove = false,
  ) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    directory.announce("");
    try {
      await action();
      directory.announce(message);
      setOpen(false);
      setDeleting(false);
      notifyListsChanged();
      if (remove) {
        document.getElementById("main-content")?.focus({ preventScroll: true });
        window.dispatchEvent(new Event(`crm:${kind}-changed`));
      }
    } catch (error) {
      setError(
        error instanceof DataError && error.code === "conflict"
          ? "This record is still referenced by another record or chat. Remove those relationships before deleting it."
          : error instanceof DataError
            ? error.message
            : "Could not save this change. Try again.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <>
      <DropdownMenu
        open={open}
        onOpenChange={(next) => {
          if (busy.current) return;
          setOpen(next);
          if (next) {
            setQuery("");
            setError("");
            directory.refresh();
          }
        }}
      >
        <DropdownMenuTrigger
          ref={trigger}
          render={<Button variant="ghost" size="icon-sm" />}
          disabled={disabled || pending}
          aria-label={`Actions for ${record.name}`}
          className="ml-auto shrink-0 text-muted-foreground opacity-0 group-hover/name-cell:opacity-100 group-focus-within/name-cell:opacity-100 data-popup-open:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-52 rounded-lg"
          aria-label={`Actions for ${record.name}`}
        >
          <DropdownMenuSub
            onOpenChange={(next, details) => {
              focusSearchOnOpen.current =
                next &&
                (details.event.type === "keydown" ||
                  details.reason === "trigger-press");
            }}
            onOpenChangeComplete={(next) => {
              if (next && focusSearchOnOpen.current) search.current?.focus();
            }}
          >
            <DropdownMenuSubTrigger className="rounded-control">
              <ListPlus />
              Add to list
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64 rounded-lg" sideOffset={4}>
              <div className="relative p-1">
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  ref={search}
                  aria-label="Search lists"
                  placeholder="Search lists…"
                  value={query}
                  className="h-8 pl-8"
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      !["ArrowDown", "ArrowUp", "Escape", "Tab"].includes(
                        event.key,
                      )
                    )
                      event.stopPropagation();
                  }}
                />
              </div>
              <div className="max-h-56 overflow-y-auto">
                {directory.loading ? (
                  <p className="px-2 py-3 text-xs text-muted-foreground">
                    Loading lists…
                  </p>
                ) : directory.error ? (
                  <DropdownMenuItem
                    closeOnClick={false}
                    className="rounded-control"
                    onClick={directory.refresh}
                  >
                    Could not load lists. Retry
                  </DropdownMenuItem>
                ) : lists.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-muted-foreground">
                    {query
                      ? "No matching lists."
                      : "No lists for this record type yet."}
                  </p>
                ) : (
                  lists.map((list) => {
                    const added = list.recordIds.includes(record.id);
                    return (
                      <DropdownMenuItem
                        key={list.id}
                        disabled={added || pending}
                        closeOnClick={false}
                        className="rounded-control"
                        onClick={() =>
                          void mutate(
                            () =>
                              data.addToList(list.id, { recordId: record.id }),
                            `Added to ${list.name}.`,
                          )
                        }
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {list.name}
                        </span>
                        {added && (
                          <>
                            <Check />
                            <span className="sr-only">Already added</span>
                          </>
                        )}
                      </DropdownMenuItem>
                    );
                  })
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="rounded-control"
                disabled={pending}
                onClick={() => {
                  setOpen(false);
                  setCreating(true);
                }}
              >
                <Plus />
                Create new list
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {currentList && (
            <DropdownMenuItem
              className="rounded-control"
              disabled={pending}
              closeOnClick={false}
              onClick={() =>
                void mutate(
                  () => data.removeFromList(currentList.id, record.id),
                  "Removed from list.",
                  true,
                )
              }
            >
              <ListX />
              Remove from this list
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="rounded-control"
            onClick={() => {
              setError("");
              setOpen(false);
              setDeleting(true);
            }}
          >
            <Trash2 />
            Delete record
          </DropdownMenuItem>
          {pending && (
            <output className="block px-2 py-2 text-xs">Saving…</output>
          )}
          {error && (
            <p
              role="alert"
              className="px-2 py-2 text-xs text-destructive whitespace-normal"
            >
              {error}
            </p>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ListDialog
        open={creating}
        onOpenChange={setCreating}
        recordType={kind}
        recordId={record.id}
        returnFocus={trigger}
        onSaved={(list) =>
          directory.announce(`Created ${list.name} and added ${record.name}.`)
        }
      />
      <Dialog
        open={deleting}
        onOpenChange={(next) => {
          if (!busy.current) setDeleting(next);
        }}
      >
        <DialogContent finalFocus={trigger} showCloseButton={!pending}>
          <DialogTitle>
            Delete{" "}
            {kind === "opportunities" ? "opportunity" : kind.slice(0, -1)}?
          </DialogTitle>
          <DialogDescription>
            Delete “{record.name}” and its notes and activity? It will be
            removed from every list. This cannot be undone.
          </DialogDescription>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setDeleting(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                void mutate(
                  () => data.delete(kind, record.id),
                  "Record deleted.",
                  true,
                )
              }
            >
              {pending ? "Deleting…" : "Delete record"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
