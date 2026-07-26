"use client";

import { useDailyGoal } from "@/hooks/useDailyGoal";

export function DailyGoalBar() {
  const progress = useDailyGoal();
  if (!progress) return null;

  const met = progress.dials >= progress.goal;

  return (
    <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 pt-3">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
        Daily Goal
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full border border-arena-border bg-arena-surface-raised">
        <div
          className={`h-full transition-all duration-500 ${
            met ? "bg-state-live" : "bg-accent"
          }`}
          style={{ width: `${progress.pct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs tabular-nums text-foreground/60">
        {progress.dials}/{progress.goal} ({progress.pct}%)
      </span>
    </div>
  );
}
