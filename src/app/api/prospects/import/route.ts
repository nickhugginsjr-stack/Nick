import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseProspectCsv } from "@/lib/csvImport";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 2MB)." },
      { status: 400 }
    );
  }
  if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
    return NextResponse.json(
      {
        error:
          "Please upload a .csv file. In Excel: File → Save As → CSV (Comma delimited).",
      },
      { status: 400 }
    );
  }

  const text = await file.text();
  const { rows, errors } = parseProspectCsv(text);

  if (rows.length === 0) {
    return NextResponse.json({
      imported: 0,
      duplicates: 0,
      skipped: errors.length,
      errors,
    });
  }

  const existing = await prisma.prospect.findMany({
    where: { phone: { in: rows.map((r) => r.phone) } },
    select: { phone: true },
  });
  const existingPhones = new Set(existing.map((p) => p.phone));

  const toCreate = rows.filter((r) => !existingPhones.has(r.phone));
  const duplicates = rows.length - toCreate.length;

  if (toCreate.length > 0) {
    await prisma.prospect.createMany({
      data: toCreate.map((r) => ({
        businessName: r.businessName,
        ownerName: r.ownerName,
        phone: r.phone,
        industry: r.industry,
        addressLine1: r.addressLine1,
        city: r.city,
        state: r.state,
        zip: r.zip,
        relationshipStatus: r.relationshipStatus,
        script: r.script,
        quickFacts: r.quickFacts,
      })),
    });
  }

  return NextResponse.json({
    imported: toCreate.length,
    duplicates,
    skipped: errors.length,
    errors,
  });
}
