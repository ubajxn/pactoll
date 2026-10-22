"use client";

import { Building2, Handshake, ListTodo, Users } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { InlineRecordFields } from "@/components/crm/inline-record-fields";
import { RecordNotes } from "@/components/crm/record-notes";
import { latestActivityFirst } from "@/lib/crm-activity";
import type { Activity, RecordKind, Records } from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";

const icons = {
  accounts: Building2,
  contacts: Users,
  opportunities: Handshake,
  tasks: ListTodo,
};

const activityActions: Record<Activity["type"], string> = {
  created: "created",
  updated: "updated",
  completed: "completed",
  note_added: "added a note to",
  note_updated: "updated a note on",
  note_deleted: "deleted a note from",
};

function activityTime(createdAt: string, now: number | null) {
  const date = new Date(createdAt);
  if (now !== null) {
    const seconds = Math.max(0, (now - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RecordDetails({
  kind,
  record: source,
  readOnly = false,
  onUpdated,
}: {
  kind: RecordKind;
  record: Records[RecordKind];
  readOnly?: boolean;
  onUpdated?: (record: Records[RecordKind]) => void;
}) {
  const data = useData();
  const details = useRef<HTMLDivElement>(null);
  const scrollSnapshot = useRef<{ element: HTMLElement; top: number } | null>(
    null,
  );
  const [record, setRecord] = useState(source);
  const currentIdentity = useRef("");
  const refreshVersion = useRef(0);
  currentIdentity.current = `${kind}:${source.id}`;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => setRecord(source), [source]);
  useLayoutEffect(() => {
    const snapshot = scrollSnapshot.current;
    if (!snapshot) return;
    snapshot.element.scrollTop = snapshot.top;
    scrollSnapshot.current = null;
  });
  const preserveScroll = () => {
    const element = details.current?.closest<HTMLElement>(
      "[data-detail-scroll], #main-content",
    );
    if (element) scrollSnapshot.current = { element, top: element.scrollTop };
  };
  const refreshRecord = () => {
    const identity = `${kind}:${record.id}`;
    const version = ++refreshVersion.current;
    void data.get(kind, record.id).then(
      (updated) => {
        if (
          currentIdentity.current !== identity ||
          refreshVersion.current !== version
        )
          return;
        preserveScroll();
        setRecord(updated);
        onUpdated?.(updated);
      },
      () => undefined,
    );
    window.dispatchEvent(new Event(`crm:${kind}-changed`));
  };
  const Icon = icons[kind];
  const name = "name" in record ? record.name : record.title;
  return (
    <div ref={details}>
      <div className="mb-6 flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-control bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </div>
        <h2 className="min-w-0 flex-1 break-words pt-1.5 text-2xl font-medium leading-tight tracking-tight">
          {name}
        </h2>
      </div>
      <InlineRecordFields
        key={`${kind}:${record.id}`}
        kind={kind}
        record={record}
        readOnly={readOnly}
        onUpdated={(updated) => {
          if (currentIdentity.current !== `${kind}:${updated.id}`) return;
          preserveScroll();
          setRecord(updated);
          onUpdated?.(updated);
        }}
      />
      <div className="my-6 border-t" />
      <RecordNotes
        key={`notes:${kind}:${record.id}`}
        kind={kind}
        recordId={record.id}
        notes={record.notes}
        readOnly={readOnly}
        onChanged={refreshRecord}
      />
      <section className="mt-6 space-y-3">
        <h3 className="text-[13px] font-medium text-muted-foreground">
          Activity
        </h3>
        {record.activity.length ? (
          latestActivityFirst(record.activity).map((item) => (
            <p key={item.id} className="break-words text-[13px] leading-5">
              {item.actor?.name ?? "Workspace"} {activityActions[item.type]}{" "}
              {name}.{" "}
              <time
                className="ml-1 text-xs text-muted-foreground"
                dateTime={item.createdAt}
                title={new Date(item.createdAt).toLocaleString()}
              >
                {activityTime(item.createdAt, now)}
              </time>
            </p>
          ))
        ) : (
          <p className="text-[13px] text-muted-foreground">No activity</p>
        )}
      </section>
    </div>
  );
}
