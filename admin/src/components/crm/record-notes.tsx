"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Note, RecordKind } from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";

const AUTOSAVE_DELAY = 700;

type NoteItem = {
  key: string;
  noteId: string | null;
  content: string;
};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export function RecordNotes({
  kind,
  recordId,
  notes,
  readOnly = false,
  onChanged,
}: {
  kind: RecordKind;
  recordId: string;
  notes: Note[];
  readOnly?: boolean;
  onChanged: () => void;
}) {
  const nextDraft = useRef(0);
  const [focusKey, setFocusKey] = useState("");
  const createDraft = (): NoteItem => ({
    key: `draft-${nextDraft.current++}`,
    noteId: null,
    content: "",
  });
  const [items, setItems] = useState<NoteItem[]>(() =>
    notes.length
      ? notes.map((note) => ({
          key: note.id,
          noteId: note.id,
          content: note.content,
        }))
      : readOnly
        ? []
        : [createDraft()],
  );

  const addDraft = () => {
    const draft = createDraft();
    setItems((current) => [...current, draft]);
    setFocusKey(draft.key);
  };
  const removeItem = (key: string) => {
    setItems((current) => {
      const remaining = current.filter((item) => item.key !== key);
      return remaining.length || readOnly ? remaining : [createDraft()];
    });
  };

  return (
    <section className="space-y-3">
      <div className="flex min-h-7 items-center justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-medium text-muted-foreground">
            Notes
          </h3>
        </div>
        {!readOnly && (
          <Button size="xs" variant="ghost" onClick={addDraft}>
            <Plus />
            Add note
          </Button>
        )}
      </div>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <NoteEditor
              key={item.key}
              item={item}
              index={index}
              kind={kind}
              recordId={recordId}
              readOnly={readOnly}
              autoFocus={focusKey === item.key}
              onCreated={(note) => {
                setItems((current) =>
                  current.map((candidate) =>
                    candidate.key === item.key
                      ? {
                          ...candidate,
                          noteId: note.id,
                          content: note.content,
                        }
                      : candidate,
                  ),
                );
              }}
              onRemoved={() => removeItem(item.key)}
              onChanged={onChanged}
            />
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground">No notes</p>
      )}
    </section>
  );
}

function NoteEditor({
  item,
  index,
  kind,
  recordId,
  readOnly,
  autoFocus,
  onCreated,
  onRemoved,
  onChanged,
}: {
  item: NoteItem;
  index: number;
  kind: RecordKind;
  recordId: string;
  readOnly: boolean;
  autoFocus: boolean;
  onCreated: (note: Note) => void;
  onRemoved: () => void;
  onChanged: () => void;
}) {
  const data = useData();
  const id = useId();
  const [draft, setDraft] = useState(item.content);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const draftRef = useRef(item.content);
  const committedRef = useRef(item.content);
  const noteIdRef = useRef(item.noteId);
  const editVersion = useRef(0);
  const queuedVersions = useRef(new Set<number>());
  const queue = useRef<Promise<void>>(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const save = () => {
    if (readOnly) return;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const version = editVersion.current;
    const content = draftRef.current.trim();
    if (!content) {
      if (noteIdRef.current) {
        setState("error");
        setError("A note can’t be empty. Delete it instead.");
      } else {
        setState("idle");
        setError("");
      }
      return;
    }
    if (content === committedRef.current && noteIdRef.current) {
      setState("saved");
      setError("");
      return;
    }
    if (queuedVersions.current.has(version)) return;

    queuedVersions.current.add(version);
    setPending((current) => current + 1);
    setState("saving");
    setError("");
    const request = queue.current.then(async () => {
      const noteId = noteIdRef.current;
      const note = noteId
        ? await data.updateNote(kind, recordId, noteId, { content })
        : await data.addNote(kind, recordId, { content, author: null });
      noteIdRef.current = note.id;
      committedRef.current = note.content;
      if (!noteId) onCreated(note);
      onChanged();
      if (mounted.current && editVersion.current === version) {
        draftRef.current = note.content;
        setDraft(note.content);
        setState("saved");
        setError("");
      }
    });
    queue.current = request.catch(() => undefined);
    void request
      .catch(() => {
        if (mounted.current && editVersion.current === version) {
          setState("error");
          setError("Could not save this note. Your text is still here.");
        }
      })
      .finally(() => {
        queuedVersions.current.delete(version);
        if (mounted.current) setPending((current) => Math.max(0, current - 1));
      });
  };

  const scheduleSave = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, AUTOSAVE_DELAY);
  };

  const remove = async () => {
    const noteId = noteIdRef.current;
    if (!noteId) {
      setConfirmingDelete(false);
      onRemoved();
      return;
    }
    setDeleteError("");
    setPending((current) => current + 1);
    try {
      await queue.current;
      await data.deleteNote(kind, recordId, noteId);
      onRemoved();
      onChanged();
      setConfirmingDelete(false);
    } catch {
      if (mounted.current)
        setDeleteError("Could not delete this note. Try again.");
    } finally {
      if (mounted.current) setPending((current) => Math.max(0, current - 1));
    }
  };

  const busy = pending > 0;
  const label = `Note ${index + 1}`;
  const hasContent = draft.trim().length > 0;
  return (
    <div className="group/note" data-note-id={noteIdRef.current ?? "draft"}>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Textarea
          id={id}
          value={draft}
          autoFocus={autoFocus}
          maxLength={50000}
          readOnly={readOnly}
          aria-invalid={state === "error"}
          aria-describedby={state === "error" ? `${id}-state` : undefined}
          aria-busy={state === "saving"}
          placeholder="Write a note…"
          className="min-h-24 resize-y pr-10"
          onChange={(event) => {
            editVersion.current += 1;
            draftRef.current = event.target.value;
            setDraft(event.target.value);
            setState("dirty");
            setError("");
            scheduleSave();
          }}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            if (timer.current) clearTimeout(timer.current);
            editVersion.current += 1;
            draftRef.current = committedRef.current;
            setDraft(committedRef.current);
            setState("idle");
            setError("");
            event.currentTarget.blur();
          }}
        />
        {!readOnly && hasContent && (
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            className="absolute top-2 right-2 text-muted-foreground opacity-70 hover:text-destructive group-focus-within/note:opacity-100 group-hover/note:opacity-100"
            aria-label={`Delete ${label.toLowerCase()}`}
            title={`Delete ${label.toLowerCase()}`}
            disabled={busy}
            onClick={() => {
              setDeleteError("");
              setConfirmingDelete(true);
            }}
          >
            <Trash2 />
          </Button>
        )}
      </div>
      {!readOnly && state === "error" && (
        <div
          id={`${id}-state`}
          className="mt-1 flex items-start justify-between gap-2 px-0.5 text-xs"
        >
          <output className="text-destructive" aria-live="polite">
            {error}
          </output>
          {draft.trim() && (
            <Button size="xs" variant="ghost" onClick={save}>
              Retry
            </Button>
          )}
        </div>
      )}
      <AlertDialog
        open={confirmingDelete}
        onOpenChange={(open) => {
          if (!busy) setConfirmingDelete(open);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {noteIdRef.current ? "Delete note?" : "Discard note?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {noteIdRef.current
                ? "This note will be permanently deleted. This can’t be undone."
                : "This unsaved note will be discarded."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-xs text-destructive">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy}
              onClick={() => void remove()}
            >
              {busy
                ? "Deleting…"
                : noteIdRef.current
                  ? "Delete note"
                  : "Discard note"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
