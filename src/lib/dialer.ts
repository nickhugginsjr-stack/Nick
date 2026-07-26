import { prisma } from "@/lib/prisma";
import { publicBaseUrl } from "@/lib/twilio";
import { CallState } from "@/generated/prisma/client";

/** Ring time (seconds) before a dial is treated as "no answer". */
export const DIAL_TIMEOUT_SECONDS = 20;

/** Minimum dials/day goal, tracked across every session in the day. */
export const DAILY_DIAL_GOAL = parseInt(
  process.env.DAILY_DIAL_GOAL ?? "100",
  10
);

export async function getDailyProgress() {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const dials = await prisma.call.count({
    where: { startedAt: { gte: startOfDay } },
  });

  return {
    dials,
    goal: DAILY_DIAL_GOAL,
    pct: Math.min(100, Math.round((dials / DAILY_DIAL_GOAL) * 100)),
  };
}

export async function logActivity(
  sessionId: string,
  type: string,
  message: string
) {
  await prisma.activityEvent.create({
    data: { sessionId, type, message },
  });
}

// Busy/no-answer are timing problems, not dead leads — retry each one
// once more (per session) before the queue is considered exhausted.
const RETRYABLE_STATES = new Set(["BUSY", "NO_ANSWER"]);
const MAX_ATTEMPTS_PER_PROSPECT = 2;

/**
 * Picks the next prospect to dial in a session: not on the do-not-call
 * list. Prefers prospects never attempted this session; once those run
 * out, retries busy/no-answer prospects from earlier in the same session
 * (skipping failed numbers and anything already dispositioned) before
 * the queue is truly empty.
 */
export async function getNextProspect(sessionId: string) {
  const callsThisSession = await prisma.call.findMany({
    where: { sessionId },
    select: { prospectId: true, state: true, disposition: true },
    orderBy: { startedAt: "asc" },
  });
  const attemptedIds = callsThisSession.map((c) => c.prospectId);

  const fresh = await prisma.prospect.findFirst({
    where: {
      id: attemptedIds.length ? { notIn: attemptedIds } : undefined,
      relationshipStatus: { not: "DO_NOT_CALL" },
    },
    orderBy: [{ lastContactedAt: "asc" }, { createdAt: "asc" }],
  });
  if (fresh) return fresh;

  const attemptCounts = new Map<string, number>();
  for (const c of callsThisSession) {
    attemptCounts.set(c.prospectId, (attemptCounts.get(c.prospectId) ?? 0) + 1);
  }

  const retryCandidateId = callsThisSession.find(
    (c) =>
      RETRYABLE_STATES.has(c.state) &&
      !c.disposition &&
      (attemptCounts.get(c.prospectId) ?? 0) < MAX_ATTEMPTS_PER_PROSPECT
  )?.prospectId;
  if (!retryCandidateId) return null;

  return prisma.prospect.findFirst({
    where: { id: retryCandidateId, relationshipStatus: { not: "DO_NOT_CALL" } },
  });
}

export function twimlUrl(path: string, params: Record<string, string> = {}) {
  const url = new URL(path, publicBaseUrl() + "/");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

const TERMINAL_AUTO_ADVANCE_STATUSES = new Set([
  "busy",
  "no-answer",
  "failed",
  "canceled",
]);

export function isAutoAdvanceOutcome(dialCallStatus: string) {
  return TERMINAL_AUTO_ADVANCE_STATUSES.has(dialCallStatus);
}

export function mapDialCallStatusToCallState(
  dialCallStatus: string
): CallState {
  switch (dialCallStatus) {
    case "busy":
      return "BUSY";
    case "no-answer":
      return "NO_ANSWER";
    case "failed":
    case "canceled":
      return "FAILED";
    case "completed":
      return "COMPLETED";
    default:
      return "COMPLETED";
  }
}

export async function getSessionSnapshot(sessionId: string) {
  const session = await prisma.dialSession.findUnique({
    where: { id: sessionId },
    include: {
      calls: {
        orderBy: { startedAt: "desc" },
        take: 1,
        include: {
          prospect: {
            include: {
              notes: { orderBy: { createdAt: "desc" }, take: 5 },
            },
          },
          notes: true,
        },
      },
    },
  });
  if (!session) return null;

  const [counts, activity, allCalls] = await Promise.all([
    prisma.call.groupBy({
      by: ["state"],
      where: { sessionId },
      _count: true,
    }),
    prisma.activityEvent.findMany({
      where: { sessionId },
      // id as a tiebreaker: cuids are monotonically increasing, so this
      // keeps insertion order stable when events share a createdAt tick.
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 30,
    }),
    prisma.call.findMany({
      where: { sessionId },
      select: { state: true, disposition: true, durationSeconds: true },
    }),
  ]);

  const stateCounts: Record<string, number> = {};
  for (const c of counts) {
    stateCounts[c.state] = c._count;
  }

  const dispositionCounts: Record<string, number> = {};
  for (const c of allCalls) {
    if (c.disposition) {
      dispositionCounts[c.disposition] =
        (dispositionCounts[c.disposition] ?? 0) + 1;
    }
  }

  const connectedDurations = allCalls
    .filter((c) => c.durationSeconds != null && c.state !== "QUEUED")
    .map((c) => c.durationSeconds as number);

  const rawCurrentCall = session.calls[0] ?? null;
  const currentCall = rawCurrentCall
    ? (() => {
        const { notes: prospectNotes, ...prospect } =
          rawCurrentCall.prospect;
        return {
          ...rawCurrentCall,
          prospect,
          previousNotes: prospectNotes.filter(
            (n) => n.callId !== rawCurrentCall.id
          ),
        };
      })()
    : null;

  return {
    session: {
      id: session.id,
      status: session.status,
      goal: session.goal,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      repPhone: session.repPhone,
    },
    currentCall,
    stateCounts,
    dispositionCounts,
    totalDials: allCalls.length,
    avgCallDurationSeconds: connectedDurations.length
      ? Math.round(
          connectedDurations.reduce((a, b) => a + b, 0) /
            connectedDurations.length
        )
      : 0,
    activity,
  };
}

export type SessionSnapshot = Awaited<
  ReturnType<typeof getSessionSnapshot>
>;
