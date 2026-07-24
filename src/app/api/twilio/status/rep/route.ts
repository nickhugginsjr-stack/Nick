import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTwilioForm, verifyTwilioRequest } from "@/lib/twilio";
import { logActivity } from "@/lib/dialer";

const FAILURE_STATUSES = new Set(["busy", "no-answer", "failed", "canceled"]);

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

  const callStatus = params.CallStatus ?? "";
  const session = await prisma.dialSession.findUnique({
    where: { id: sessionId },
  });
  if (!session || session.status !== "ACTIVE") {
    return new NextResponse("", { status: 200 });
  }

  if (FAILURE_STATUSES.has(callStatus)) {
    await prisma.dialSession.update({
      where: { id: sessionId },
      data: { status: "ENDED", endedAt: new Date() },
    });
    await logActivity(
      sessionId,
      "SESSION_ENDED",
      "Could not reach your phone — session ended."
    );
  } else if (callStatus === "completed") {
    // Rep's own phone hung up entirely — the session is over.
    await prisma.dialSession.update({
      where: { id: sessionId },
      data: { status: "ENDED", endedAt: new Date() },
    });
    await logActivity(
      sessionId,
      "SESSION_ENDED",
      "Your phone disconnected — session ended."
    );
  }

  return new NextResponse("", { status: 200 });
}
