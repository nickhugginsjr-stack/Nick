import { prisma } from "@/lib/prisma";
import { publicBaseUrl } from "@/lib/twilio";
import { CallState } from "@/generated/prisma/client";

/** Ring time (seconds) before a dial is treated as "no answer". */
export const DIAL_TIMEOUT_SECONDS = 20;

export async function logActivity(
  sessionId: string,
  type: string,
  message: string
) {
  await prisma.activityEvent.create({
    data: { sessionId, type, message },
  });
}

/**
 * Picks the next prospect to dial in a session: not on the do-not-call
 * list, and not already attempted during this session.
 */
export async function getNextProspect(sessionId: string) {
  const alreadyCalled = await prisma.call.findMany({
    where: { sessionId },
    select: { prospectId: true },
  });
  const excludeIds = alreadyCalled.map((c) => c.prospectId);

  return prisma.prospect.findFirst({
    where: {
      id: excludeIds.length ? { notIn: excludeIds } : undefined,
      relationshipStatus: { not: "DO_NOT_CALL" },
    },
    orderBy: [{ lastContactedAt: "asc" }, { createdAt: "asc" }],
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
      orderBy: { createdAt: "desc" },
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
