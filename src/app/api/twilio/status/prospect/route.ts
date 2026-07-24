import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTwilioForm, verifyTwilioRequest } from "@/lib/twilio";
import { logActivity } from "@/lib/dialer";
import type { CallState } from "@/generated/prisma/client";

const INTERMEDIATE_STATE: Record<string, CallState> = {
  initiated: "DIALING_PROSPECT",
  ringing: "RINGING_PROSPECT",
  "in-progress": "CONNECTED",
};

const INTERMEDIATE_LABEL: Record<string, string> = {
  initiated: "Dialing",
  ringing: "Ringing",
  "in-progress": "Connected",
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

  const callStatus = params.CallStatus ?? "";
  const state = INTERMEDIATE_STATE[callStatus];

  // Terminal statuses (completed/busy/no-answer/failed) are handled
  // authoritatively by the <Dial> action callback; this endpoint only
  // tracks the live in-between states for the UI.
  if (state) {
    await prisma.call.update({
      where: { id: callId },
      data: {
        state,
        twilioCallSid: params.CallSid ?? undefined,
        connectedAt: state === "CONNECTED" ? new Date() : undefined,
      },
    });

    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: { prospect: true },
    });
    if (call) {
      await logActivity(
        sessionId,
        "CALL_STATE",
        `${call.prospect.businessName}: ${INTERMEDIATE_LABEL[callStatus]}`
      );
    }
  }

  return new NextResponse("", { status: 200 });
}
