import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { twilioClient } from "@/lib/twilio";
import { logActivity, twimlUrl } from "@/lib/dialer";

/**
 * Triggered by the rep pressing spacebar on a PREVIEW call: redirects
 * their live Twilio call to actually dial the previewed prospect.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: callId } = await params;

  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: { session: true, prospect: true },
  });

  if (!call) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }
  if (call.state !== "PREVIEW") {
    return NextResponse.json(
      { error: "This call is not awaiting confirmation." },
      { status: 409 }
    );
  }
  if (call.session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Session is not active." }, {
      status: 409,
    });
  }
  if (!call.session.repCallSid || !twilioClient) {
    return NextResponse.json(
      { error: "No live call to redirect (Twilio not configured?)." },
      { status: 409 }
    );
  }

  try {
    await twilioClient.calls(call.session.repCallSid).update({
      method: "POST",
      url: twimlUrl("/api/twilio/voice/dial-prospect", {
        sessionId: call.sessionId,
        callId: call.id,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logActivity(
      call.sessionId,
      "ERROR",
      `Could not dial ${call.prospect.businessName}: ${message}`
    );
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
