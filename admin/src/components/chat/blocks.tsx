"use client";

import { Check, Copy, ExternalLink, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import type { MutationToolCall } from "@/lib/chat/tools";
import type { ContentBlock, RecordReference } from "@/lib/data/contracts";

export function ChatMarkdown({ text }: { text: string }) {
  return (
    <div className="min-w-0 text-sm leading-7 wrap-break-word [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_h1]:text-xl [&_h2]:text-lg [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_table]:block [&_table]:overflow-x-auto [&_td]:border [&_td]:px-3 [&_th]:border [&_th]:px-3 [&_ul]:list-disc [&_ul]:pl-5">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) =>
            href?.startsWith("/") && !href.startsWith("//") ? (
              <Link href={href}>{children}</Link>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          img: ({ src, alt }) => (
            <a
              href={typeof src === "string" ? src : undefined}
              target="_blank"
              rel="noopener noreferrer"
            >
              {alt ? `[Image: ${alt}]` : "[Image]"}
            </a>
          ),
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}

export function RecordLinks({
  records,
  names = {},
}: {
  records: RecordReference[];
  names?: Record<string, string>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {records.map((record) => (
        <div
          key={`${record.type}/${record.id}`}
          className="flex min-w-0 items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <Link
            className="truncate rounded-sm text-left hover:underline focus-visible:outline-2"
            href={`/${record.type}/${encodeURIComponent(record.id)}`}
          >
            {names[record.id] || `${record.type} / ${record.id}`}
          </Link>
          <Link
            className="shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
            href={`/${record.type}/${encodeURIComponent(record.id)}`}
            aria-label={`Open ${names[record.id] || record.id}`}
          >
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      ))}
    </div>
  );
}

export function MutationPermissionRequest({
  call,
  state,
  output,
  errorText,
  disabled,
  onApprove,
  onDeny,
  subscribe,
  getDecisionState,
}: {
  call: MutationToolCall;
  state: string;
  output?: {
    status: "success" | "failure" | "permission_denied";
    text: string;
    records: RecordReference[];
  };
  errorText?: string;
  disabled?: boolean;
  onApprove: (call: MutationToolCall) => Promise<void>;
  onDeny: (call: MutationToolCall) => Promise<void>;
  subscribe?: (listener: () => void) => () => void;
  getDecisionState?: () => "idle" | "pending" | "completed";
}) {
  const decisionState = useSyncExternalStore(
    subscribe ?? (() => () => {}),
    getDecisionState ?? (() => "idle" as const),
    () => "idle" as const,
  );
  const pending = decisionState === "pending";
  const isPending = state === "input-available";
  const verb = call.toolName === "createRecord" ? "Create" : "Update";
  const run = async (approved: boolean) => {
    if (approved) await onApprove(call);
    else await onDeny(call);
  };
  return (
    <section className="space-y-3 rounded-xl border border-amber-300 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
      <div>
        <p className="text-sm font-medium">
          {isPending
            ? `Permission requested: ${verb} CRM record`
            : `${verb} CRM record`}
        </p>
        <p className="text-sm leading-7 text-muted-foreground">
          {isPending
            ? "Review the exact change before allowing the assistant to apply it."
            : state === "input-streaming"
              ? "Preparing the proposed change…"
              : output?.text || errorText || "The change could not be applied."}
        </p>
        {output?.records.length ? (
          <RecordLinks records={output.records} />
        ) : null}
      </div>
      <pre className="max-h-56 overflow-auto rounded-lg bg-background/70 p-3 text-sm whitespace-pre-wrap wrap-break-word">
        {JSON.stringify(call.input, null, 2)}
      </pre>
      {isPending && (
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={disabled || pending}
            onClick={() => void run(true)}
          >
            {pending ? "Applying…" : `Allow ${verb.toLowerCase()}`}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled || pending}
            onClick={() => void run(false)}
          >
            Deny
          </Button>
        </div>
      )}
    </section>
  );
}

export function ChatBlock({
  block,
  names,
}: {
  block: ContentBlock;
  names?: Record<string, string>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  if (block.type === "mention")
    return (
      <Link
        className="inline rounded bg-accent px-1 py-0.5 text-sm font-medium text-accent-foreground underline-offset-4 hover:underline"
        href={`/${block.reference.type}/${encodeURIComponent(block.reference.id)}`}
        title={`${block.reference.type} / ${block.reference.id}`}
      >
        @{block.label}
      </Link>
    );
  if (block.type === "text") return <ChatMarkdown text={block.text} />;
  if (block.type === "mutation_proposal") return null;
  if (block.type === "records")
    return <RecordLinks records={block.records} names={names} />;
  if (block.type === "progress")
    return (
      <p className="flex items-center gap-2 text-sm leading-7 text-muted-foreground">
        {block.status === "running" ? (
          <LoaderCircle className="size-3 animate-spin motion-reduce:animate-none" />
        ) : (
          <Check className="size-3" />
        )}
        {block.text}
        <span className="sr-only">{block.status}</span>
      </p>
    );
  if (block.type === "table")
    return (
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                {block.columns.map((column, i) => (
                  <th
                    key={`${i}-${column}`}
                    className="whitespace-nowrap px-4 py-2 font-medium"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={`${i}-${JSON.stringify(row)}`} className="border-t">
                  {row.map((cell, j) => (
                    <td key={`${i}-${j}-${cell}`} className="px-4 py-2">
                      {String(cell ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  if (block.type === "draft")
    return (
      <section className="space-y-3 rounded-xl border bg-muted/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium">{block.title}</h3>
          <span className="text-sm leading-7 text-muted-foreground">Draft</span>
        </div>
        <ChatMarkdown text={block.content} />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(block.content);
                setCopied(true);
              } catch {
                setError("Copy failed. Select and copy the draft text.");
              }
            }}
          >
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy draft"}
          </Button>
        </div>
        {error && <p role="alert">{error}</p>}
      </section>
    );
  if (block.type === "confirmation")
    return (
      <section className="space-y-3 rounded-xl border p-4">
        <h3 className="text-sm font-medium">
          {block.status === "pending"
            ? "Stored proposal"
            : `Change ${block.status}`}
        </h3>
        <p className="text-sm">{block.text}</p>
        <RecordLinks records={block.records} names={names} />
        {block.status === "pending" && (
          <p className="text-sm text-muted-foreground">
            Ask the assistant for a new proposal to apply this change.
          </p>
        )}
      </section>
    );
  if (block.type === "mutation_result")
    return (
      <section className="space-y-2 rounded-lg border p-4">
        <p className="text-xs font-medium uppercase tracking-wide">
          {block.status.replaceAll("_", " ")}
        </p>
        <p className="text-sm">{block.text}</p>
        <RecordLinks records={block.records} names={names} />
      </section>
    );
  return (
    <div
      role={block.type === "error" ? "alert" : "status"}
      className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/20"
    >
      <span className="font-medium">
        {block.type === "error" ? "Unable to complete" : "Please note"}:{" "}
      </span>
      {block.text}
    </div>
  );
}
