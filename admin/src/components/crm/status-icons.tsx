import {
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CirclePause,
  CircleX,
  Square,
  SquareCheck,
  SquareX,
  Star,
} from "lucide-react";
import type { Task } from "@/lib/data/contracts";
import type { Stage } from "@/lib/opportunities";
import { cn } from "@/lib/utils";

const stageIcons = {
  qualification: CircleDashed,
  discovery: Circle,
  proposal: CircleDot,
  negotiation: CircleDot,
  won: CircleCheck,
  lost: CircleX,
  current_client: Star,
  shelved: CirclePause,
};
const stageColors = {
  qualification: "text-muted-foreground",
  discovery: "text-blue-500",
  proposal: "text-amber-500",
  negotiation: "text-violet-500",
  won: "text-emerald-600",
  lost: "text-muted-foreground",
  current_client: "text-sky-600",
  shelved: "text-stone-400",
};
export function StageIcon({ stage }: { stage: Stage }) {
  const Icon = stageIcons[stage];
  return (
    <Icon
      aria-hidden="true"
      className={cn("size-3.5 shrink-0", stageColors[stage])}
    />
  );
}

export function TaskStatusIcon({ status }: { status: Task["status"] }) {
  if (status === "in_progress") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="size-4 shrink-0 text-primary"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="3"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M12 6H7a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  const Icon = {
    open: Square,
    completed: SquareCheck,
    canceled: SquareX,
  }[status];
  return (
    <Icon
      aria-hidden="true"
      className={`size-4 shrink-0 ${status === "completed" ? "text-primary" : "text-muted-foreground"}`}
    />
  );
}
