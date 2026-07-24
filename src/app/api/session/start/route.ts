import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  requireTwilioClient,
  requireTwilioNumber,
} from "@/lib/twilio";
import { logActivity, twimlUrl } from "@/lib/dialer";

const bodySchema = z.object({
  repPhone: z.string().min(1).optional(),
  goal: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  const existing = await prisma.dialSession.findFirst({
    where: { status: "ACTIVE" },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A session is already active.", sessionId: existing.id },
      { status: 409 }
    );
  }

  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const repPhone = parsed.data.repPhone ?? process.env.REP_PHONE_NUMBER;
  if (!repPhone) {
    return NextResponse.json(
      {
        error:
          "No rep phone number provided and REP_PHONE_NUMBER is not set.",
      },
      { status: 400 }
    );
  }

  const session = await prisma.dialSession.create({
    data: {
      repPhone,
      goal: parsed.data.goal ?? 100,
    },
  });

  try {
    const client = requireTwilioClient();
    const call = await client.calls.create({
      to: repPhone,
      from: requireTwilioNumber(),
      url: twimlUrl("/api/twilio/voice/rep-answered", {
        sessionId: session.id,
      }),
      statusCallback: twimlUrl("/api/twilio/status/rep", {
        sessionId: session.id,
      }),
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
    });

    await prisma.dialSession.update({
      where: { id: session.id },
      data: { repCallSid: call.sid },
    });

    await logActivity(
      session.id,
      "SESSION_STARTED",
      `Session started — calling ${repPhone}...`
    );
  } catch (err) {
    await prisma.dialSession.update({
      where: { id: session.id },
      data: { status: "ENDED", endedAt: new Date() },
    });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ sessionId: session.id });
}
