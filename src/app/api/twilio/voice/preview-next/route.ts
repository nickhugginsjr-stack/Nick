import twilio from "twilio";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTwilioForm, verifyTwilioRequest } from "@/lib/twilio";
import { getNextProspect, logActivity } from "@/lib/dialer";

const { VoiceResponse } = twilio.twiml;

/**
 * Picks the next prospect and holds the rep's line open while their info
 * is shown in the UI — it does NOT dial yet. The rep presses spacebar in
 * the app (POST /api/calls/[id]/confirm-dial), which redirects this same
 * live call to /api/twilio/voice/dial-prospect to actually place the call.
 */
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

  await prisma.call.create({
    data: {
      sessionId,
      prospectId: prospect.id,
      state: "PREVIEW",
    },
  });

  await logActivity(
    sessionId,
    "PREVIEW",
    `Next up: ${prospect.businessName} (${prospect.ownerName}) — press space to dial.`
  );

  // Hold the line silently until the rep confirms via spacebar, which
  // interrupts this call with a REST API update.
  twiml.pause({ length: 1800 });

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
