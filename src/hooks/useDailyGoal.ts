"use client";

import { useEffect, useState } from "react";
import type { DailyProgress } from "@/lib/types";

const POLL_INTERVAL_MS = 30_000;

export function useDailyGoal() {
  const [progress, setProgress] = useState<DailyProgress | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/stats/daily", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data: DailyProgress = await res.json();
        if (!cancelled) setProgress(data);
      } catch {
        // Non-critical background stat; ignore transient failures.
      }
    }

    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return progress;
}
