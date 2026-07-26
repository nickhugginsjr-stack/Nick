import { NextResponse } from "next/server";
import { getDailyProgress } from "@/lib/dialer";

export async function GET() {
  const progress = await getDailyProgress();
  return NextResponse.json(progress);
}
