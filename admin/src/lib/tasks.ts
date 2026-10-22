import type { Task } from "@/lib/data/contracts";

// Retain existing stored values so saved tasks and status URLs stay compatible.
export const taskStatusLabels: Record<Task["status"], string> = {
  open: "Todo",
  in_progress: "In progress",
  completed: "Done",
  canceled: "Canceled",
};

export const taskStatusOptions = Object.entries(taskStatusLabels).map(
  ([value, label]) => ({ value: value as Task["status"], label }),
);

/** Dated, actionable tasks ordered by the work that is due first. */
export function upcomingTasks(tasks: Task[], today: string, limit = 8) {
  return tasks
    .filter(
      (task): task is Task & { dueDate: string } =>
        (task.status === "open" || task.status === "in_progress") &&
        task.dueDate !== null &&
        task.dueDate >= today,
    )
    .sort(
      (a, b) =>
        a.dueDate.localeCompare(b.dueDate) ||
        a.title.localeCompare(b.title) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, limit);
}

export function overdueTaskCount(tasks: Task[], today: string) {
  return tasks.filter((task) => isOverdueTask(task, today)).length;
}

export function isOverdueTask(task: Task, today: string) {
  return (
    (task.status === "open" || task.status === "in_progress") &&
    task.dueDate !== null &&
    task.dueDate < today
  );
}

export function taskMatchesStatusFilter(task: Task, status: string | null) {
  if (status) return task.status === status;
  return task.status === "open" || task.status === "in_progress";
}
