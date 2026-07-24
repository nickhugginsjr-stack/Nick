import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ content: z.string() });

/** Autosaves a single draft note tied to the in-progress call. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: callId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const call = await prisma.call.findUnique({ where: { id: callId } });
  if (!call) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  const existingDraft = await prisma.note.findFirst({
    where: { callId },
    orderBy: { createdAt: "desc" },
  });

  if (existingDraft) {
    await prisma.note.update({
      where: { id: existingDraft.id },
      data: { content: parsed.data.content },
    });
  } else {
    await prisma.note.create({
      data: {
        prospectId: call.prospectId,
        callId,
        content: parsed.data.content,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
