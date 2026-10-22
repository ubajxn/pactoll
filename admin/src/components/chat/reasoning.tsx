"use client";

import {
  Check,
  ChevronRight,
  CircleAlert,
  FileSearch,
  Search,
  Square,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { responseActivity } from "@/lib/chat/activity";
import type { ChatMessage } from "@/lib/chat/types";

export function ProcessingStatus({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-center gap-2 text-sm leading-7 text-muted-foreground">
      <span className="shimmer">{children}</span>
    </div>
  );
}

export function elapsedSeconds(
  startedAt: string | undefined,
  now = Date.now(),
) {
  if (!startedAt) return null;
  const timestamp = Date.parse(startedAt);
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.round((now - timestamp) / 1000));
}

/** One disclosure and one observed timer for the entire assistant response. */
export function ResponseActivity({
  message,
  active,
}: {
  message: ChatMessage;
  active: boolean;
}) {
  const [elapsed, setElapsed] = useState<number | null>(null);
  const accumulated = useRef(0);
  const startedAt = message.metadata?.startedAt;
  useEffect(() => {
    if (!active) return;
    const localStarted = performance.now();
    const update = () => {
      const durableElapsed = elapsedSeconds(startedAt);
      setElapsed(
        durableElapsed ??
          Math.round(
            (accumulated.current + performance.now() - localStarted) / 1000,
          ),
      );
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => {
      window.clearInterval(timer);
      if (elapsedSeconds(startedAt) === null)
        accumulated.current += performance.now() - localStarted;
      update();
    };
  }, [active, startedAt]);

  const entries = responseActivity(message.parts, active);
  if (!entries.length) {
    const hasAnswer = message.parts.some(
      (part) => part.type === "text" && part.text.trim(),
    );
    return active && !hasAnswer ? (
      <ProcessingStatus>Thinking…</ProcessingStatus>
    ) : null;
  }
  const duration =
    elapsed === null
      ? ""
      : elapsed < 60
        ? ` for ${elapsed}s`
        : ` for ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
  const stopped =
    !active &&
    (message.metadata?.interrupted ||
      entries.some((entry) => entry.state === "stopped"));
  const failed = entries.some((entry) => entry.state === "error");
  const awaitingApproval =
    !active &&
    !stopped &&
    message.parts.some(
      (part) =>
        (part.type === "tool-createRecord" ||
          part.type === "tool-updateRecord") &&
        part.state === "input-available",
    );
  const current = entries.findLast(
    (entry) => entry.state === "running" && entry.kind !== "reasoning",
  );

  return (
    <details className="group/reasoning min-w-0">
      <summary
        data-streaming={active}
        className="flex w-full flex-wrap cursor-pointer list-none items-center gap-2 border-border/60 text-sm leading-6 text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring data-[streaming=true]:border-b data-[streaming=true]:pb-1.5 [&::-webkit-details-marker]:hidden"
      >
        <span className={active ? "shimmer" : undefined}>
          {active
            ? "Working"
            : stopped
              ? "Stopped"
              : awaitingApproval
                ? "Waiting for approval"
                : "Worked"}
          {!awaitingApproval &&
            (stopped ? duration.replace(" for ", " after ") : duration)}
        </span>
        {failed && <span className="text-destructive">· Lookup failed</span>}
        <ChevronRight
          aria-hidden="true"
          className="size-3.5 shrink-0 transition-transform duration-150 ease-in-out group-open/reasoning:rotate-90 motion-reduce:transition-none"
        />
        {active && current && (
          <span className="w-full group-open/reasoning:hidden">
            {current.text}
          </span>
        )}
      </summary>
      <div className="mt-1.5 space-y-2 border-l border-border/60 pl-3 text-sm leading-6">
        {entries.map((entry) => {
          if (entry.kind === "reasoning")
            return (
              <p
                key={entry.id}
                className="whitespace-pre-wrap wrap-break-word text-muted-foreground"
              >
                {entry.text}
              </p>
            );
          const Icon =
            entry.state === "error"
              ? CircleAlert
              : entry.state === "stopped"
                ? Square
                : entry.state === "complete"
                  ? Check
                  : entry.kind === "search"
                    ? Search
                    : FileSearch;
          return (
            <div
              key={entry.id}
              className="flex min-w-0 items-start gap-2 text-muted-foreground"
            >
              <Icon aria-hidden="true" className="mt-1 size-4 shrink-0" />
              <div className="min-w-0 wrap-break-word">
                <p
                  className={
                    entry.state === "error" ? "text-destructive" : undefined
                  }
                >
                  {entry.text}
                </p>
                {entry.detail && (
                  <p className="whitespace-pre-wrap">{entry.detail}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}
