"use client";

import { type RefObject, useEffect, useId, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  type DraftMention,
  mentionQuery,
  mentionSuggestions,
  updateMentions,
} from "@/lib/chat/mentions";
import { useData } from "@/lib/data/provider";
import { loadSearchRecords, type SearchRecord } from "@/lib/search";

export function MentionInput({
  value,
  onChange,
  mentions,
  onMentionsChange,
  inputRef,
  disabled,
  placeholder,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  mentions: DraftMention[];
  onMentionsChange: (mentions: DraftMention[]) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  disabled: boolean;
  placeholder: string;
  onSubmit: () => void;
}) {
  const data = useData();
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [caret, setCaret] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(0);
  const [records, setRecords] = useState<SearchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const query = mentionQuery(value, caret, mentions);
  const open = !!query && !dismissed && !disabled;
  const matches = mentionSuggestions(records, query?.query ?? "");
  const selected = Math.min(active, Math.max(0, matches.length - 1));

  // Refresh on each opening so newly created and renamed records are discoverable.
  // biome-ignore lint/correctness/useExhaustiveDependencies: explicit retry.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    loadSearchRecords(data)
      .then(
        (result) => {
          if (!cancelled) setRecords(result);
        },
        () => {
          if (!cancelled) setError(true);
        },
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [data, open, attempt]);
  useEffect(() => {
    if (open)
      listRef.current
        ?.querySelector(`[data-index="${selected}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [selected, open]);

  function select(record: SearchRecord) {
    if (!query) return;
    const token = `@${record.title}`;
    const next = `${value.slice(0, query.start)}${token} ${value.slice(query.end)}`;
    if (next.length > 20000) return;
    const mention = {
      start: query.start,
      end: query.start + token.length,
      label: record.title,
      reference: { type: record.kind, id: record.id },
    };
    onMentionsChange(
      [...updateMentions(value, next, mentions), mention].sort(
        (a, b) => a.start - b.start,
      ),
    );
    onChange(next);
    setDismissed(true);
    const position = mention.end + 1;
    setCaret(position);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(position, position);
    });
  }

  return (
    <div className="rounded-[inherit]">
      {open && (
        <div className="absolute -inset-x-px bottom-full z-20 mb-2 overflow-hidden rounded-[inherit] border bg-popover text-popover-foreground shadow-md">
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Records and tasks"
            aria-busy={loading}
            className="max-h-56 scroll-fade-y overflow-y-auto p-1"
          >
            {!loading &&
              !error &&
              matches.map((record, index) => (
                <div
                  key={`${record.kind}/${record.id}`}
                  id={`${listId}-${index}`}
                  role="option"
                  tabIndex={-1}
                  aria-selected={selected === index}
                  aria-label={[record.title, ...record.associatedNames].join(
                    " ",
                  )}
                  data-index={index}
                  className={`flex h-9 cursor-pointer items-center gap-2.5 overflow-hidden whitespace-nowrap rounded-md px-2 text-sm ${selected === index ? "bg-accent text-accent-foreground" : ""}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseMove={() => setActive(index)}
                  onClick={() => select(record)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") select(record);
                  }}
                >
                  <span className="min-w-0 truncate">
                    {record.title}
                    {record.associatedNames.length > 0 && (
                      <span className="ml-2 text-muted-foreground">
                        {record.associatedNames.join(", ")}
                      </span>
                    )}
                  </span>
                </div>
              ))}
          </div>
          {loading ? (
            <output className="block px-3 pb-3 pt-2 text-sm text-muted-foreground">
              Loading records…
            </output>
          ) : error ? (
            <div role="alert" className="px-3 pb-3 pt-2 text-sm">
              Could not load records.{" "}
              <button
                type="button"
                className="underline"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setAttempt((n) => n + 1)}
              >
                Retry
              </button>
            </div>
          ) : matches.length === 0 ? (
            <output className="block px-3 pb-3 pt-2 text-sm text-muted-foreground">
              No matching records or tasks.
            </output>
          ) : null}
        </div>
      )}
      <Textarea
        id="chat-message-input"
        ref={inputRef}
        rows={1}
        role="combobox"
        aria-label="Message"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={
          open && !loading && !error && matches.length
            ? `${listId}-${selected}`
            : undefined
        }
        value={value}
        onChange={(event) => {
          onMentionsChange(updateMentions(value, event.target.value, mentions));
          onChange(event.target.value);
          setCaret(event.target.selectionStart);
          setActive(0);
          setDismissed(false);
        }}
        onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
        onClick={() => setDismissed(false)}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget))
            setDismissed(true);
        }}
        disabled={disabled}
        placeholder={placeholder}
        className="max-h-40 min-h-8 resize-none border-0 bg-transparent p-1 text-sm leading-6 shadow-none ring-0 focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
        maxLength={20000}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (open) {
            if (event.key === "Escape") {
              event.preventDefault();
              setDismissed(true);
              return;
            }
            if (
              (event.key === "ArrowDown" || event.key === "ArrowUp") &&
              matches.length
            ) {
              event.preventDefault();
              setActive(
                (selected +
                  (event.key === "ArrowDown" ? 1 : -1) +
                  matches.length) %
                  matches.length,
              );
              return;
            }
            if (
              (event.key === "Enter" || event.key === "Tab") &&
              !event.shiftKey &&
              !loading &&
              !error &&
              matches.length
            ) {
              event.preventDefault();
              select(matches[selected]);
              return;
            }
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              return;
            }
          }
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
    </div>
  );
}
