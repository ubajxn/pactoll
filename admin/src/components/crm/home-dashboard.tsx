"use client";

import { CornerDownLeft, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MentionInput } from "@/components/chat/mention-input";
import { PageHeader } from "@/components/crm/page-header";
import { TaskStatusIcon } from "@/components/crm/status-icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type DraftMention, mentionBlocks } from "@/lib/chat/mentions";
import { useChatSessions } from "@/lib/chat/session";
import type { Task } from "@/lib/data/contracts";
import { useData } from "@/lib/data/provider";
import { overdueTaskCount, upcomingTasks } from "@/lib/tasks";

function dateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function offsetDate(date: string, days: number) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return dateKey(next);
}

function dueLabel(dueDate: string, today: string) {
  if (dueDate === today) return "Today";
  if (dueDate === offsetDate(today, 1)) return "Tomorrow";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: dueDate.slice(0, 4) === today.slice(0, 4) ? undefined : "numeric",
  }).format(new Date(`${dueDate}T12:00:00`));
}

export function HomeDashboard() {
  const data = useData();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const today = dateKey();
  const visibleTasks = upcomingTasks(tasks, today);
  const overdueCount = overdueTaskCount(tasks, today);

  useEffect(() => {
    const refresh = () => setAttempt((value) => value + 1);
    window.addEventListener("crm:tasks-changed", refresh);
    return () => window.removeEventListener("crm:tasks-changed", refresh);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt explicitly retries the supplied adapter.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    data.list("tasks").then(
      (result) => {
        if (!cancelled) {
          setTasks(result);
          setLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [data, attempt]);

  return (
    <div className="relative -m-6 flex h-[calc(100dvh-41px)] min-h-0 flex-col overflow-hidden sm:-m-8 lg:-m-10">
      <PageHeader title="Up next" />
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-10 sm:px-8 sm:pt-14">
          <p className="text-sm font-medium">
            {new Intl.DateTimeFormat("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            }).format(new Date())}
          </p>
          <section aria-labelledby="upcoming-tasks" className="mt-8 pb-8">
            <div className="flex items-center justify-between gap-4">
              <h2
                id="upcoming-tasks"
                className="text-xs font-medium text-muted-foreground"
              >
                Tasks
              </h2>
              <div className="flex items-center gap-3">
                {!loading && !error && overdueCount > 0 && (
                  <Link
                    href="/tasks?due=Overdue"
                    className="text-xs text-destructive underline-offset-2 hover:underline focus-visible:rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {overdueCount} overdue
                  </Link>
                )}
                <Button
                  nativeButton={false}
                  size="xs"
                  variant="ghost"
                  render={<Link href="/tasks" />}
                >
                  View all
                </Button>
              </div>
            </div>
            <TaskList
              error={error}
              loading={loading}
              onRetry={() => setAttempt((value) => value + 1)}
              tasks={visibleTasks}
              today={today}
            />
          </section>
        </div>
        <div className="shrink-0 px-6 pb-6 pt-2 sm:px-8 sm:pb-8">
          <HomeChatComposer />
        </div>
      </div>
    </div>
  );
}

function TaskList({
  error,
  loading,
  onRetry,
  tasks,
  today,
}: {
  error: boolean;
  loading: boolean;
  onRetry: () => void;
  tasks: ReturnType<typeof upcomingTasks>;
  today: string;
}) {
  if (loading)
    return (
      <output aria-label="Loading upcoming tasks" className="mt-2 block">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex h-11 items-center gap-3">
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-4 w-56 max-w-[60%]" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </output>
    );
  if (error)
    return (
      <div role="alert" className="mt-4 flex items-center gap-3 text-sm">
        <p className="text-muted-foreground">Could not load tasks.</p>
        <Button size="xs" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  if (tasks.length === 0)
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        No upcoming tasks. You’re all caught up.
      </p>
    );
  return (
    <ul className="mt-2 divide-y" aria-label="Upcoming tasks">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link
            href={`/tasks/${encodeURIComponent(task.id)}`}
            className="group flex min-h-11 items-center gap-3 rounded-control px-1 text-sm outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <TaskStatusIcon status={task.status} />
            <span className="min-w-0 flex-1 truncate font-medium group-hover:underline">
              {task.title}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {dueLabel(task.dueDate, today)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function HomeChatComposer() {
  const sessions = useChatSessions();
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lock = useRef(false);
  const [input, setInput] = useState("");
  const [mentions, setMentions] = useState<DraftMention[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const message = input.trim();
    if (!message || pending || lock.current) return;
    lock.current = true;
    setPending(true);
    setError(null);
    try {
      const session = await sessions.create({
        title: message.slice(0, 80),
      });
      await session.send(message, mentionBlocks(input, mentions));
      router.push(`/chat/${session.conversation.id}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to start the chat. Please retry.",
      );
      inputRef.current?.focus();
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="relative rounded-lg border bg-background p-2 shadow-sm"
      >
        <MentionInput
          value={input}
          onChange={setInput}
          mentions={mentions}
          onMentionsChange={setMentions}
          inputRef={inputRef}
          disabled={pending}
          placeholder="Ask anything, or @mention a record or task…"
          onSubmit={() => void submit()}
        />
        <div className="flex min-h-7 items-center justify-end">
          <Button
            type="submit"
            size="icon"
            aria-label="Start chat"
            disabled={pending || !input.trim()}
            className="disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
          >
            {pending ? (
              <LoaderCircle className="animate-spin motion-reduce:animate-none" />
            ) : (
              <CornerDownLeft />
            )}
          </Button>
        </div>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
