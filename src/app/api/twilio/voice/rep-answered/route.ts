import twilio from "twilio";
import { NextResponse } from "next/server";
import { parseTwilioForm, verifyTwilioRequest } from "@/lib/twilio";
import { logActivity, twimlUrl } from "@/lib/dialer";

const { VoiceResponse } = twilio.twiml;

export async function POST(request: Request) {
  const params = await parseTwilioForm(request);
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!verifyTwilioRequest(request.url, request.headers.get("X-Twilio-Signature"), params)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }
  if (!sessionId) {
    return new NextResponse("Missing sessionId", { status: 400 });
  }

  await logActivity(
    sessionId,
    "REP_ANSWERED",
    "You answered. Starting the session..."
  );

  const twiml = new VoiceResponse();
  twiml.redirect(
    { method: "POST" },
    twimlUrl("/api/twilio/voice/next", { sessionId })
  );

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
