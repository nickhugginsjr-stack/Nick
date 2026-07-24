import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { twilioClient } from "@/lib/twilio";
import { getSessionSnapshot, logActivity, twimlUrl } from "@/lib/dialer";
import type {
  Disposition,
  RelationshipStatus,
  TimelineEventType,
} from "@/generated/prisma/client";

const bodySchema = z.object({
  callId: z.string().min(1),
  disposition: z.enum([
    "APPOINTMENT",
    "FOLLOW_UP",
    "VOICEMAIL",
    "NO_ANSWER",
    "NOT_INTERESTED",
    "WRONG_NUMBER",
    "DO_NOT_CALL",
    "SAVE_AND_NEXT",
  ]),
  notes: z.string().optional(),
});

const TIMELINE_TYPE: Record<Disposition, TimelineEventType | null> = {
  APPOINTMENT: "APPOINTMENT",
  FOLLOW_UP: "FOLLOW_UP_CALL",
  VOICEMAIL: "NOTE",
  NO_ANSWER: null,
  NOT_INTERESTED: "NOTE",
  WRONG_NUMBER: "NOTE",
  DO_NOT_CALL: "NOTE",
  SAVE_AND_NEXT: null,
};

const TIMELINE_LABEL: Record<Disposition, string> = {
  APPOINTMENT: "Appointment Scheduled",
  FOLLOW_UP: "Follow-up",
  VOICEMAIL: "Left Voicemail",
  NO_ANSWER: "No Answer",
  NOT_INTERESTED: "Not Interested",
  WRONG_NUMBER: "Wrong Number",
  DO_NOT_CALL: "Do Not Call",
  SAVE_AND_NEXT: "Call Notes Saved",
};

const RELATIONSHIP_UPDATE: Partial<Record<Disposition, RelationshipStatus>> = {
  APPOINTMENT: "WARM",
  FOLLOW_UP: "FOLLOW_UP",
  DO_NOT_CALL: "DO_NOT_CALL",
};

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { callId, disposition, notes } = parsed.data;

  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: { session: true, prospect: true },
  });
  if (!call) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  if (notes && notes.trim().length > 0) {
    const existingDraft = await prisma.note.findFirst({
      where: { callId: call.id },
      orderBy: { createdAt: "desc" },
    });
    if (existingDraft) {
      await prisma.note.update({
        where: { id: existingDraft.id },
        data: { content: notes },
      });
    } else {
      await prisma.note.create({
        data: { prospectId: call.prospectId, callId: call.id, content: notes },
      });
    }
  }

  await prisma.call.update({
    where: { id: callId },
    data: { disposition },
  });

  const timelineType = TIMELINE_TYPE[disposition];
  if (timelineType) {
    await prisma.timelineEvent.create({
      data: {
        prospectId: call.prospectId,
        type: timelineType,
        label: TIMELINE_LABEL[disposition],
        notes: notes ?? undefined,
      },
    });
  }

  const relationshipUpdate = RELATIONSHIP_UPDATE[disposition];
  await prisma.prospect.update({
    where: { id: call.prospectId },
    data: {
      lastContactedAt: new Date(),
      ...(relationshipUpdate
        ? { relationshipStatus: relationshipUpdate }
        : {}),
    },
  });

  await logActivity(
    call.sessionId,
    "DISPOSITION",
    `${call.prospect.businessName}: ${TIMELINE_LABEL[disposition]}. Dialing next...`
  );

  if (call.session.repCallSid && twilioClient) {
    try {
      await twilioClient.calls(call.session.repCallSid).update({
        method: "POST",
        url: twimlUrl("/api/twilio/voice/next", {
          sessionId: call.sessionId,
        }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await logActivity(
        call.sessionId,
        "ERROR",
        `Could not advance to next call: ${message}`
      );
    }
  }

  const snapshot = await getSessionSnapshot(call.sessionId);
  return NextResponse.json(snapshot);
}
