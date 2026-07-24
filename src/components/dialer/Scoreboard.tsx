"use client";

import { useEffect, useState } from "react";
import type { SessionSnapshot } from "@/lib/types";

function formatClock(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-center px-3 py-1 min-w-[76px]">
      <span
        className={`text-xl font-bold tabular-nums leading-none ${
          accent ? "text-accent" : "text-foreground"
        }`}
      >
        {value}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-wider text-foreground/50">
        {label}
      </span>
    </div>
  );
}

export function Scoreboard({ snapshot }: { snapshot: SessionSnapshot }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { session, stateCounts, dispositionCounts, totalDials } = snapshot;
  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - new Date(session.startedAt).getTime()) / 1000)
  );
  const pace =
    elapsedSeconds > 30
      ? Math.round(totalDials / (elapsedSeconds / 3600))
      : 0;
  const goalPct = Math.min(
    100,
    Math.round((totalDials / Math.max(1, session.goal)) * 100)
  );
  const quarter = Math.min(
    4,
    Math.floor(totalDials / Math.max(1, session.goal / 4)) + 1
  );

  const conversations =
    (stateCounts.CONNECTED ?? 0) +
    (stateCounts.COMPLETED ?? 0) +
    (stateCounts.VOICEMAIL ?? 0);
  const appointments = dispositionCounts.APPOINTMENT ?? 0;
  const followUps = dispositionCounts.FOLLOW_UP ?? 0;
  const voicemails = dispositionCounts.VOICEMAIL ?? 0;
  const busy = stateCounts.BUSY ?? 0;
  const noAnswer = stateCounts.NO_ANSWER ?? 0;
  const failed = stateCounts.FAILED ?? 0;

  return (
    <div className="w-full border-b border-arena-border bg-arena-surface/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            <Stat label="Quarter" value={`Q${quarter}`} accent />
            <Stat label="Dials" value={totalDials} />
            <Stat label="Conversations" value={conversations} />
            <Stat label="Appointments" value={appointments} accent />
            <Stat label="Follow-ups" value={followUps} />
            <Stat label="Voicemails" value={voicemails} />
            <Stat label="Busy" value={busy} />
            <Stat label="No Answer" value={noAnswer} />
            <Stat label="Failed" value={failed} />
            <Stat label="Pace/hr" value={pace} />
            <Stat label="Time" value={formatClock(elapsedSeconds)} />
          </div>
          <div className="flex items-center gap-2 min-w-[180px]">
            <div className="flex-1 h-2 rounded-full bg-arena-surface-raised overflow-hidden border border-arena-border">
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${goalPct}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-foreground/60 whitespace-nowrap">
              {totalDials}/{session.goal}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
