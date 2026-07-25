import twilio from "twilio";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseTwilioForm,
  requireTwilioNumber,
  verifyTwilioRequest,
} from "@/lib/twilio";
import { DIAL_TIMEOUT_SECONDS, logActivity, twimlUrl } from "@/lib/dialer";

const { VoiceResponse } = twilio.twiml;

/**
 * Actually dials the prospect for an existing (PREVIEW) call — triggered
 * only via the rep's spacebar confirmation, which redirects their live
 * call here through the Twilio REST API.
 */
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

  const twiml = new VoiceResponse();
  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: { prospect: true },
  });

  if (!call || call.sessionId !== sessionId) {
    twiml.hangup();
    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  await prisma.call.update({
    where: { id: callId },
    data: { state: "DIALING_PROSPECT" },
  });

  await logActivity(
    sessionId,
    "DIALING",
    `Dialing ${call.prospect.businessName} (${call.prospect.ownerName})...`
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
    call.prospect.phone
  );

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
