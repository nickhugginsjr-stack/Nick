"use client";

import { useEffect, useState } from "react";
import { Press_Start_2P } from "next/font/google";
import type { SessionSnapshot } from "@/lib/types";

const arcade = Press_Start_2P({ weight: "400", subsets: ["latin"] });

// Play-by-play color coding: white for routine progress, orange for
// negative/attention outcomes, money green for a good outcome (a
// disposition logged after an actual conversation).
const PBP_COLOR: Record<string, string> = {
  DIALING: "text-white/90",
  CALL_STATE: "text-white/90",
  SESSION_STARTED: "text-white/90",
  REP_ANSWERED: "text-white/90",
  DIAL_RESULT: "text-orange-400",
  SESSION_ENDED: "text-orange-400",
  VOICEMAIL_DETECTED: "text-orange-400",
  ERROR: "text-orange-400",
  DISPOSITION: "text-state-live",
};
const DEFAULT_PBP_COLOR = "text-white/70";

// Measured proportions of the tip-off image: white scoreboard band, then
// the black scoreboard band, then the court/crowd art (decorative only).
const WHITE_ZONE_HEIGHT_PCT = 21.42;
const BLACK_ZONE_HEIGHT_PCT = 35.25;

// Every size below scales continuously with viewport width (clamp(min,
// preferred-vw, max)) instead of jumping between fixed breakpoints, so
// the banner holds together at any window width — half-screen,
// full-screen, or in between — and responds naturally to browser zoom
// (which is itself a viewport-width change from the CSS engine's
// perspective).
const FLUID = {
  headlineValue: "clamp(1.1rem, 3.4vw, 2.5rem)",
  headlineLabel: "clamp(0.45rem, 0.85vw, 0.75rem)",
  headlineGap: "clamp(1rem, 5vw, 6rem)",
  brandHeader: "clamp(0.5rem, 1vw, 1rem)",
  kpiValue: "clamp(0.6rem, 1.5vw, 1.5rem)",
  kpiLabel: "clamp(0.4rem, 0.62vw, 0.65rem)",
  kpiPaddingX: "clamp(4px, 1vw, 16px)",
  kpiPaddingY: "clamp(3px, 0.8vw, 12px)",
  kpiGap: "clamp(2px, 0.6vw, 12px)",
  pbpHeader: "clamp(0.4rem, 0.75vw, 0.6rem)",
  pbpItem: "clamp(0.42rem, 0.72vw, 0.65rem)",
  pbpWidth: "clamp(80px, 22vw, 280px)",
  pbpPadding: "clamp(4px, 0.8vw, 12px)",
};

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
        className={`${arcade.className} tabular-nums leading-none ${
          accent ? "text-red-600" : "text-[#0a0a0a]"
        }`}
        style={{ fontSize: FLUID.headlineValue }}
      >
        {value}
      </span>
      <span
        className="mt-1 uppercase tracking-widest text-black/60"
        style={{ fontSize: FLUID.headlineLabel }}
      >
        {label}
      </span>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="flex h-[80%] flex-col items-center justify-center rounded-lg border border-white/15 bg-white/5"
      style={{
        paddingInline: FLUID.kpiPaddingX,
        paddingBlock: FLUID.kpiPaddingY,
      }}
    >
      <span
        className={`${arcade.className} leading-none text-accent`}
        style={{ fontSize: FLUID.kpiValue }}
      >
        {value}
      </span>
      <span
        className="mt-1.5 uppercase tracking-widest text-white/50"
        style={{ fontSize: FLUID.kpiLabel }}
      >
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
  const noAnswer = stateCounts.NO_ANSWER ?? 0;
  const failed = stateCounts.FAILED ?? 0;
  const goalPct = Math.min(
    100,
    Math.round((totalDials / Math.max(1, goal)) * 100)
  );

  const elapsedSeconds = snapshot
    ? Math.max(
        0,
        Math.floor(
          (now - new Date(snapshot.session.startedAt).getTime()) / 1000
        )
      )
    : 0;
  const pace =
    snapshot && elapsedSeconds > 30
      ? Math.round(totalDials / (elapsedSeconds / 3600))
      : 0;
  const quarter = snapshot
    ? Math.min(4, Math.floor(totalDials / Math.max(1, goal / 4)) + 1)
    : 1;
  const SESSION_CLOCK_SECONDS = 60 * 60;
  const remainingSeconds = Math.max(0, SESSION_CLOCK_SECONDS - elapsedSeconds);
  const mm = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (remainingSeconds % 60).toString().padStart(2, "0");

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

      {/* White scoreboard band: brand header (left) + headline stats */}
      <div
        className="absolute inset-x-0 top-0 flex items-center justify-center"
        style={{ height: `${WHITE_ZONE_HEIGHT_PCT}%` }}
      >
        <p
          className="absolute left-[1.2%] top-[8%] font-bold italic tracking-tight text-black/70"
          style={{ fontSize: FLUID.brandHeader }}
        >
          Nu. Money&apos;s Sales Arena
        </p>
        <div
          className="flex items-center justify-center"
          style={{ gap: FLUID.headlineGap }}
        >
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
        <div
          className="flex flex-1 items-center justify-center overflow-x-auto px-2"
          style={{ gap: FLUID.kpiGap }}
        >
          <Kpi label="Quarter" value={`Q${quarter}`} />
          <Kpi label="Follow-ups" value={followUps} />
          <Kpi label="Voicemails" value={voicemails} />
          <Kpi label="No Answer" value={noAnswer} />
          <Kpi label="Failed" value={failed} />
          <Kpi label="Pace/hr" value={pace} />
          <Kpi label="Goal" value={`${goalPct}%`} />
          <Kpi label="Time" value={`${mm}:${ss}`} />
        </div>

        <div
          className="flex flex-col border-l border-white/10 bg-black/50"
          style={{ width: FLUID.pbpWidth, padding: FLUID.pbpPadding }}
        >
          <p
            className={`${arcade.className} text-accent`}
            style={{ fontSize: FLUID.pbpHeader }}
          >
            LIVE PLAY-BY-PLAY
          </p>
          <div
            className="mt-1 flex-1 overflow-y-auto"
            style={{ rowGap: "0.2em" }}
          >
            {activity.length === 0 && (
              <p
                className="text-white/30"
                style={{ fontSize: FLUID.pbpItem }}
              >
                Waiting for activity...
              </p>
            )}
            {activity.slice(0, 8).map((e) => (
              <p
                key={e.id}
                className={`truncate leading-tight ${
                  PBP_COLOR[e.type] ?? DEFAULT_PBP_COLOR
                }`}
                style={{ fontSize: FLUID.pbpItem }}
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
