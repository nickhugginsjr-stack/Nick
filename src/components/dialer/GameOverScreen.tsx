"use client";

import type { SessionSnapshot } from "@/lib/types";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-arena-border bg-arena-surface-raised px-4 py-3 text-center">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-foreground/50">
        {label}
      </p>
    </div>
  );
}

export function GameOverScreen({
  snapshot,
  onNewSession,
}: {
  snapshot: SessionSnapshot;
  onNewSession: () => void;
}) {
  const { session, stateCounts, dispositionCounts, totalDials } = snapshot;
  const conversations =
    (stateCounts.CONNECTED ?? 0) +
    (stateCounts.COMPLETED ?? 0) +
    (stateCounts.VOICEMAIL ?? 0);
  const goalPct = Math.round((totalDials / Math.max(1, session.goal)) * 100);

  const grade =
    goalPct >= 100
      ? "A+"
      : goalPct >= 85
      ? "A"
      : goalPct >= 70
      ? "B"
      : goalPct >= 50
      ? "C"
      : "D";

  const elapsedMs = session.endedAt
    ? new Date(session.endedAt).getTime() -
      new Date(session.startedAt).getTime()
    : 0;
  const elapsedMin = Math.round(elapsedMs / 60000);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-foreground/40">
        Game Over
      </p>
      <h1 className="mt-2 text-5xl font-bold tracking-tight">
        Session Grade: <span className="text-accent">{grade}</span>
      </h1>
      <p className="mt-2 text-foreground/60">
        {elapsedMin} minutes · {goalPct}% of goal
      </p>

      <div className="mt-8 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Calls" value={totalDials} />
        <Stat label="Conversations" value={conversations} />
        <Stat label="Appointments" value={dispositionCounts.APPOINTMENT ?? 0} />
        <Stat label="Follow-ups" value={dispositionCounts.FOLLOW_UP ?? 0} />
        <Stat label="Voicemails" value={dispositionCounts.VOICEMAIL ?? 0} />
        <Stat label="Busy" value={stateCounts.BUSY ?? 0} />
        <Stat label="No Answer" value={stateCounts.NO_ANSWER ?? 0} />
        <Stat
          label="Avg Call Length"
          value={`${snapshot.avgCallDurationSeconds}s`}
        />
      </div>

      <button
        onClick={onNewSession}
        className="mt-10 rounded-full border border-accent px-8 py-3 text-sm font-semibold uppercase tracking-wide text-accent transition hover:bg-accent/10"
      >
        Start New Session
      </button>
    </div>
  );
}
