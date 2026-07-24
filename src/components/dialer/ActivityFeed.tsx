"use client";

import type { ActivityEventSnapshot } from "@/lib/types";

const TYPE_COLOR: Record<string, string> = {
  DIALING: "text-state-warn",
  CALL_STATE: "text-state-info",
  DIAL_RESULT: "text-foreground/70",
  DISPOSITION: "text-state-live",
  VOICEMAIL_DETECTED: "text-state-voicemail",
  SESSION_STARTED: "text-accent",
  SESSION_ENDED: "text-state-danger",
  REP_ANSWERED: "text-accent",
  ERROR: "text-state-danger",
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityFeed({
  events,
}: {
  events: ActivityEventSnapshot[];
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-arena-border bg-arena-surface-raised p-4">
      <p className="text-[11px] uppercase tracking-wider text-foreground/50">
        Live Activity
      </p>
      <div className="mt-2 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {events.length === 0 && (
          <p className="text-sm text-foreground/30">
            Activity will appear here as the session runs.
          </p>
        )}
        {events.map((e) => (
          <div
            key={e.id}
            className="animate-rise-in flex gap-2 text-sm leading-tight"
          >
            <span className="shrink-0 font-mono text-xs text-foreground/40">
              {formatTime(e.createdAt)}
            </span>
            <span className={TYPE_COLOR[e.type] ?? "text-foreground/80"}>
              {e.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
