import type { ChatMessage } from "./types";

export type ActivityEntry = {
  id: string;
  kind: "reasoning" | "search" | "read" | "progress";
  text: string;
  detail?: string;
  state: "running" | "complete" | "error" | "stopped";
};

export function isActivityPart(part: ChatMessage["parts"][number]) {
  return (
    part.type === "reasoning" ||
    part.type === "tool-searchRecords" ||
    part.type === "tool-getRecord" ||
    (part.type === "data-block" && part.data.type === "progress")
  );
}

export function responseActivity(parts: ChatMessage["parts"], active: boolean) {
  return parts.flatMap((part, index): ActivityEntry[] => {
    const pending = active ? "running" : "stopped";
    if (part.type === "reasoning") {
      if (!part.text.trim()) return [];
      return [
        {
          id: `reasoning-${index}`,
          kind: "reasoning",
          text: part.text,
          state: part.state === "streaming" ? pending : "complete",
        },
      ];
    }
    if (part.type === "data-block" && part.data.type === "progress") {
      return [
        {
          id: `progress-${index}`,
          kind: "progress",
          text: part.data.text,
          state: part.data.status === "running" ? pending : "complete",
        },
      ];
    }
    if (part.type !== "tool-searchRecords" && part.type !== "tool-getRecord")
      return [];
    const search = part.type === "tool-searchRecords";
    const state =
      part.state === "output-error"
        ? "error"
        : part.state === "output-available"
          ? "complete"
          : pending;
    const text =
      state === "error"
        ? search
          ? "Search failed"
          : "Record lookup failed"
        : state === "stopped"
          ? search
            ? "Search stopped"
            : "Record lookup stopped"
          : part.state === "output-available"
            ? part.type === "tool-searchRecords"
              ? `Found ${part.output.total} matching ${part.output.total === 1 ? "record" : "records"}`
              : "Read record details"
            : search
              ? "Searching records and tasks…"
              : "Reading record details…";
    const detail =
      part.state === "output-error"
        ? part.errorText
        : part.type === "tool-searchRecords"
          ? part.input?.query
          : undefined;
    return [
      {
        id: part.toolCallId,
        kind: search ? "search" : "read",
        text,
        detail,
        state,
      },
    ];
  });
}
