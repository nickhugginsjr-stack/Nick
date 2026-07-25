import twilio from "twilio";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTwilioForm, verifyTwilioRequest } from "@/lib/twilio";
import {
  isAutoAdvanceOutcome,
  logActivity,
  mapDialCallStatusToCallState,
  twimlUrl,
} from "@/lib/dialer";

const { VoiceResponse } = twilio.twiml;

const OUTCOME_LABEL: Record<string, string> = {
  busy: "Busy",
  "no-answer": "No answer",
  failed: "Failed",
  canceled: "Canceled",
  completed: "Call ended",
};

export async function POST(request: Request) {
  const params = await parseTwilioForm(request);
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const callId = url.searchParams.get("callId");

  if (
    !verifyTwilioRequest(
      request.url,
      request.headers.get("X-Twilio-Signature"),
      params
    )
  ) {
    return new NextResponse("Invalid signature", { status: 403 });
  }
  if (!sessionId || !callId) {
    return new NextResponse("Missing sessionId/callId", { status: 400 });
  }

  const dialCallStatus = params.DialCallStatus ?? "failed";
  const durationSeconds = params.DialCallDuration
    ? parseInt(params.DialCallDuration, 10)
    : 0;
  const dialCallSid = params.DialCallSid;

  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: { prospect: true },
  });

  const twiml = new VoiceResponse();

  if (!call) {
    twiml.redirect(
      { method: "POST" },
      twimlUrl("/api/twilio/voice/preview-next", { sessionId })
    );
    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const newState = mapDialCallStatusToCallState(dialCallStatus);

  await prisma.call.update({
    where: { id: callId },
    data: {
      state: newState,
      endedAt: new Date(),
      durationSeconds,
      twilioCallSid: dialCallSid ?? call.twilioCallSid,
    },
  });

  await logActivity(
    sessionId,
    "DIAL_RESULT",
    `${call.prospect.businessName}: ${
      OUTCOME_LABEL[dialCallStatus] ?? dialCallStatus
    }`
  );

  if (isAutoAdvanceOutcome(dialCallStatus)) {
    twiml.redirect(
      { method: "POST" },
      twimlUrl("/api/twilio/voice/preview-next", { sessionId })
    );
  } else {
    // A human (or voicemail) answered and the call has now ended.
    // Hold the rep's line open — the frontend disposition submission
    // will interrupt this call via the REST API to dial the next prospect.
    twiml.pause({ length: 1800 });
  }

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
