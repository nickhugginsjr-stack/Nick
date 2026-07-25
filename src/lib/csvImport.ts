import Papa from "papaparse";
import { normalizePhoneUS } from "@/lib/phone";
import type { RelationshipStatus } from "@/generated/prisma/client";

export interface ImportedProspectRow {
  businessName: string;
  ownerName: string;
  phone: string;
  industry?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
  relationshipStatus: RelationshipStatus;
  script?: string;
  quickFacts?: string;
}

export interface ImportRowError {
  row: number;
  reason: string;
}

type MappedField = keyof Omit<ImportedProspectRow, "relationshipStatus"> | "relationshipStatus";

const HEADER_ALIASES: Record<string, MappedField> = {
  businessname: "businessName",
  business: "businessName",
  company: "businessName",
  companyname: "businessName",
  name: "businessName",
  ownername: "ownerName",
  owner: "ownerName",
  contactname: "ownerName",
  contact: "ownerName",
  phone: "phone",
  phonenumber: "phone",
  mobile: "phone",
  industry: "industry",
  address: "addressLine1",
  addressline1: "addressLine1",
  street: "addressLine1",
  city: "city",
  state: "state",
  zip: "zip",
  zipcode: "zip",
  postalcode: "zip",
  relationshipstatus: "relationshipStatus",
  status: "relationshipStatus",
  relationship: "relationshipStatus",
  script: "script",
  quickfacts: "quickFacts",
  notes: "quickFacts",
  facts: "quickFacts",
};

const VALID_STATUSES = new Set<RelationshipStatus>([
  "COLD",
  "WARM",
  "FOLLOW_UP",
  "CLIENT",
  "DO_NOT_CALL",
]);

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function parseProspectCsv(csvText: string): {
  rows: ImportedProspectRow[];
  errors: ImportRowError[];
} {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });

  const rows: ImportedProspectRow[] = [];
  const errors: ImportRowError[] = [];

  parsed.data.forEach((rawRow, idx) => {
    const rowNumber = idx + 2; // +1 for header row, +1 for 1-indexing
    const mapped: Partial<Record<MappedField, string>> = {};

    for (const [key, value] of Object.entries(rawRow)) {
      const field = HEADER_ALIASES[key];
      if (field && value != null && String(value).trim() !== "") {
        mapped[field] = String(value).trim();
      }
    }

    if (!mapped.businessName) {
      errors.push({ row: rowNumber, reason: "Missing business name" });
      return;
    }
    if (!mapped.ownerName) {
      errors.push({ row: rowNumber, reason: "Missing owner name" });
      return;
    }
    if (!mapped.phone) {
      errors.push({ row: rowNumber, reason: "Missing phone number" });
      return;
    }

    const normalizedPhone = normalizePhoneUS(mapped.phone);
    if (!normalizedPhone) {
      errors.push({
        row: rowNumber,
        reason: `Invalid phone number: "${mapped.phone}"`,
      });
      return;
    }

    let relationshipStatus: RelationshipStatus = "COLD";
    if (mapped.relationshipStatus) {
      const upper = mapped.relationshipStatus
        .toUpperCase()
        .replace(/[\s-]+/g, "_") as RelationshipStatus;
      if (VALID_STATUSES.has(upper)) {
        relationshipStatus = upper;
      }
    }

    rows.push({
      businessName: mapped.businessName,
      ownerName: mapped.ownerName,
      phone: normalizedPhone,
      industry: mapped.industry,
      addressLine1: mapped.addressLine1,
      city: mapped.city,
      state: mapped.state,
      zip: mapped.zip,
      relationshipStatus,
      script: mapped.script,
      quickFacts: mapped.quickFacts,
    });
  });

  return { rows, errors };
}
