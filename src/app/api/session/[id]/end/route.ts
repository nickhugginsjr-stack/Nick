import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { twilioClient } from "@/lib/twilio";
import { getSessionSnapshot, logActivity } from "@/lib/dialer";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await prisma.dialSession.findUnique({ where: { id } });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.repCallSid && twilioClient) {
    try {
      await twilioClient.calls(session.repCallSid).update({
        status: "completed",
      });
    } catch {
      // Call may have already ended on its own; nothing more to do.
    }
  }

  await prisma.dialSession.update({
    where: { id },
    data: { status: "ENDED", endedAt: new Date() },
  });
  await logActivity(id, "SESSION_ENDED", "Session ended — game over.");

  const snapshot = await getSessionSnapshot(id);
  return NextResponse.json(snapshot);
}
