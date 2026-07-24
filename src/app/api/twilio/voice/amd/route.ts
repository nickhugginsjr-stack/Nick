import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTwilioForm, verifyTwilioRequest } from "@/lib/twilio";
import { logActivity } from "@/lib/dialer";

export async function POST(request: Request) {
  const params = await parseTwilioForm(request);
  const url = new URL(request.url);
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
  if (!callId) return new NextResponse("Missing callId", { status: 400 });

  const answeredBy = params.AnsweredBy ?? "unknown";

  if (answeredBy.startsWith("machine")) {
    const call = await prisma.call.update({
      where: { id: callId },
      data: { state: "VOICEMAIL" },
      include: { prospect: true },
    });
    await logActivity(
      call.sessionId,
      "VOICEMAIL_DETECTED",
      `Possible voicemail at ${call.prospect.businessName} — you can leave a message.`
    );
  }

  return new NextResponse("", { status: 200 });
}
