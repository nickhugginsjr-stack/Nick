"use client";

import { useEffect, useState } from "react";
import { Press_Start_2P } from "next/font/google";
import type { SessionSnapshot } from "@/lib/types";

const arcade = Press_Start_2P({ weight: "400", subsets: ["latin"] });

// Measured proportions of the tip-off image: white scoreboard band, then
// the black scoreboard band, then the court/crowd art (decorative only).
const WHITE_ZONE_HEIGHT_PCT = 21.42;
const BLACK_ZONE_HEIGHT_PCT = 35.25;

function HeadlineStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={`${arcade.className} text-lg tabular-nums leading-none sm:text-3xl md:text-4xl ${
          accent ? "text-red-600" : "text-[#0a0a0a]"
        }`}
      >
        {value}
      </span>
      <span className="mt-1 text-[7px] uppercase tracking-widest text-black/60 sm:text-[10px] md:text-xs">
        {label}
      </span>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex h-[80%] flex-col items-center justify-center rounded-lg border border-white/15 bg-white/5 px-3 py-2 sm:px-4 sm:py-3">
      <span
        className={`${arcade.className} text-base leading-none text-accent sm:text-xl md:text-2xl`}
      >
        {value}
      </span>
      <span className="mt-1.5 text-[7px] uppercase tracking-widest text-white/50 sm:text-[9px] md:text-[10px]">
        {label}
      </span>
    </div>
  );
}

export function ArenaBanner({
  snapshot,
}: {
  snapshot: SessionSnapshot | null;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const stateCounts = snapshot?.stateCounts ?? {};
  const dispositionCounts = snapshot?.dispositionCounts ?? {};
  const totalDials = snapshot?.totalDials ?? 0;
  const goal = snapshot?.session.goal ?? 100;

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
  const goalPct = Math.min(
    100,
    Math.round((totalDials / Math.max(1, goal)) * 100)
  );

  const elapsedSeconds = snapshot
    ? Math.max(
        0,
        Math.floor((now - new Date(snapshot.session.startedAt).getTime()) / 1000)
      )
    : 0;
  const pace =
    snapshot && elapsedSeconds > 30
      ? Math.round(totalDials / (elapsedSeconds / 3600))
      : 0;
  const quarter = snapshot
    ? Math.min(4, Math.floor(totalDials / Math.max(1, goal / 4)) + 1)
    : 1;
  const mm = Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (elapsedSeconds % 60).toString().padStart(2, "0");

  const activity = snapshot?.activity ?? [];

  return (
    <div
      className="relative w-full overflow-hidden bg-black"
      style={{ aspectRatio: "1920 / 1079" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/arena-tipoff.webp"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* White scoreboard band: brand header + headline stats, evenly
          spaced so the gap above the header, between header and stats,
          and below the stats are all equal. */}
      <div
        className="absolute inset-x-0 top-0 flex flex-col items-center justify-evenly"
        style={{ height: `${WHITE_ZONE_HEIGHT_PCT}%` }}
      >
        <p className="text-center text-[9px] font-bold italic tracking-tight text-black/70 sm:text-sm md:text-base">
          Nu. Money&apos;s Sales Arena
        </p>
        <div className="flex items-center justify-center gap-6 sm:gap-14 md:gap-24">
          <HeadlineStat label="Dials" value={totalDials} />
          <HeadlineStat label="Conversations" value={conversations} />
          <HeadlineStat label="Appointments" value={appointments} accent />
        </div>
      </div>

      {/* Black scoreboard band: remaining KPIs + live play-by-play */}
      <div
        className="absolute inset-x-0 flex items-stretch"
        style={{
          top: `${WHITE_ZONE_HEIGHT_PCT}%`,
          height: `${BLACK_ZONE_HEIGHT_PCT}%`,
        }}
      >
        <div className="flex flex-1 items-center justify-center gap-2 overflow-x-auto px-2 sm:gap-3">
          <Kpi label="Quarter" value={`Q${quarter}`} />
          <Kpi label="Follow-ups" value={followUps} />
          <Kpi label="Voicemails" value={voicemails} />
          <Kpi label="Busy" value={busy} />
          <Kpi label="No Answer" value={noAnswer} />
          <Kpi label="Failed" value={failed} />
          <Kpi label="Pace/hr" value={pace} />
          <Kpi label="Goal" value={`${goalPct}%`} />
          <Kpi label="Time" value={`${mm}:${ss}`} />
        </div>

        <div className="hidden w-[34%] max-w-[280px] flex-col border-l border-white/10 bg-black/50 px-2 py-1.5 sm:flex md:px-3 md:py-2">
          <p className={`${arcade.className} text-[7px] text-accent md:text-[9px]`}>
            LIVE PLAY-BY-PLAY
          </p>
          <div className="mt-1 flex-1 space-y-0.5 overflow-y-auto md:mt-1.5 md:space-y-1">
            {activity.length === 0 && (
              <p className="text-[8px] text-white/30 md:text-[10px]">
                Waiting for activity...
              </p>
            )}
            {activity.slice(0, 8).map((e) => (
              <p
                key={e.id}
                className="truncate text-[8px] leading-tight text-white/70 md:text-[10px]"
              >
                {e.message}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
