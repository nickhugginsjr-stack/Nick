import { NextResponse } from "next/server";
import { getSessionSnapshot } from "@/lib/dialer";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snapshot = await getSessionSnapshot(id);
  if (!snapshot) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(snapshot);
}
