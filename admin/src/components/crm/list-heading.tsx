"use client";

import { List, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ListDialog, listTypeLabels } from "@/components/crm/list-dialog";
import {
  notifyListsChanged,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataError } from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";

export function ListHeading() {
  const list = useRecordList();
  const data = useData();
  const router = useRouter();
  const trigger = useRef<HTMLButtonElement>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const [error, setError] = useState("");
  if (!list) return null;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <List className="size-4 shrink-0 text-muted-foreground" />
      <h1 className="truncate text-sm font-medium">{list.name}</h1>
      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
        {listTypeLabels[list.recordType]}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          ref={trigger}
          render={<Button size="icon-sm" variant="ghost" />}
          aria-label="List options"
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44 rounded-lg">
          <DropdownMenuItem
            className="rounded-control"
            onClick={() => setRenaming(true)}
          >
            <Pencil />
            Rename list
          </DropdownMenuItem>
          <DropdownMenuItem
            className="rounded-control"
            variant="destructive"
            onClick={() => {
              setError("");
              setDeleting(true);
            }}
          >
            <Trash2 />
            Delete list
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ListDialog
        list={list}
        open={renaming}
        onOpenChange={setRenaming}
        returnFocus={trigger}
      />
      <Dialog
        open={deleting}
        onOpenChange={(next) => {
          if (!busy.current) setDeleting(next);
        }}
      >
        <DialogContent finalFocus={trigger} showCloseButton={!pending}>
          <DialogTitle>Delete list?</DialogTitle>
          <DialogDescription>
            Delete “{list.name}”? Its records will stay in{" "}
            {listTypeLabels[list.recordType]}.
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
              onClick={async () => {
                if (busy.current) return;
                busy.current = true;
                setPending(true);
                try {
                  await data.deleteList(list.id);
                  notifyListsChanged();
                  router.replace(`/${list.recordType}`);
                } catch (error) {
                  setError(
                    error instanceof DataError
                      ? error.message
                      : "Could not delete list. Try again.",
                  );
                } finally {
                  busy.current = false;
                  setPending(false);
                }
              }}
            >
              {pending ? "Deleting…" : "Delete list"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
