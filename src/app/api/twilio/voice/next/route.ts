import twilio from "twilio";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseTwilioForm,
  requireTwilioNumber,
  verifyTwilioRequest,
} from "@/lib/twilio";
import {
  DIAL_TIMEOUT_SECONDS,
  getNextProspect,
  logActivity,
  twimlUrl,
} from "@/lib/dialer";

const { VoiceResponse } = twilio.twiml;

export async function POST(request: Request) {
  const params = await parseTwilioForm(request);
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  if (
    !verifyTwilioRequest(
      request.url,
      request.headers.get("X-Twilio-Signature"),
      params
    )
  ) {
    return new NextResponse("Invalid signature", { status: 403 });
  }
  if (!sessionId) {
    return new NextResponse("Missing sessionId", { status: 400 });
  }

  const session = await prisma.dialSession.findUnique({
    where: { id: sessionId },
  });
  const twiml = new VoiceResponse();

  if (!session || session.status !== "ACTIVE") {
    twiml.hangup();
    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const prospect = await getNextProspect(sessionId);

  if (!prospect) {
    await prisma.dialSession.update({
      where: { id: sessionId },
      data: { status: "ENDED", endedAt: new Date() },
    });
    await logActivity(
      sessionId,
      "SESSION_ENDED",
      "No more prospects in the queue — session complete."
    );
    twiml.say("You've reached the end of your call list. Great work.");
    twiml.hangup();
    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const call = await prisma.call.create({
    data: {
      sessionId,
      prospectId: prospect.id,
      state: "DIALING_PROSPECT",
    },
  });

  await logActivity(
    sessionId,
    "DIALING",
    `Dialing ${prospect.businessName} (${prospect.ownerName})...`
  );

  const dial = twiml.dial({
    callerId: requireTwilioNumber(),
    timeout: DIAL_TIMEOUT_SECONDS,
    action: twimlUrl("/api/twilio/voice/dial-complete", {
      sessionId,
      callId: call.id,
    }),
    method: "POST",
  });

  // Answering Machine Detection is a premium feature Twilio blocks on
  // trial accounts ("Invalid or disallowed parameters provided"). Only
  // send these params once TWILIO_MACHINE_DETECTION=true is set, which
  // you can do after upgrading out of trial.
  const machineDetectionEnabled =
    process.env.TWILIO_MACHINE_DETECTION === "true";

  dial.number(
    {
      statusCallback: twimlUrl("/api/twilio/status/prospect", {
        sessionId,
        callId: call.id,
      }),
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
      ...(machineDetectionEnabled
        ? {
            machineDetection: "Enable" as const,
            amdStatusCallback: twimlUrl("/api/twilio/voice/amd", {
              callId: call.id,
            }),
            amdStatusCallbackMethod: "POST" as const,
          }
        : {}),
    },
    prospect.phone
  );

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
