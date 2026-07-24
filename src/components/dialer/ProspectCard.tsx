"use client";

import type { ProspectSnapshot } from "@/lib/types";

const RELATIONSHIP_LABEL: Record<string, string> = {
  COLD: "Cold",
  WARM: "Warm",
  FOLLOW_UP: "Follow-up",
  CLIENT: "Client",
  DO_NOT_CALL: "Do Not Call",
};

function formatDate(value: string | null) {
  if (!value) return "No prior contact";
  return new Date(value).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ProspectCard({
  prospect,
  previousNote,
}: {
  prospect: ProspectSnapshot;
  previousNote?: string | null;
}) {
  const address = [prospect.addressLine1, prospect.city, prospect.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="animate-rise-in rounded-2xl border border-arena-border bg-arena-surface-raised p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {prospect.businessName}
          </h2>
          <p className="text-foreground/70">{prospect.ownerName}</p>
        </div>
        <span className="shrink-0 rounded-full border border-arena-border bg-arena-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-foreground/70">
          {RELATIONSHIP_LABEL[prospect.relationshipStatus] ??
            prospect.relationshipStatus}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Field label="Phone" value={prospect.phone} />
        <Field label="Industry" value={prospect.industry ?? "—"} />
        <Field label="Address" value={address || "—"} />
        <Field label="Last Contact" value={formatDate(prospect.lastContactedAt)} />
      </div>

      {prospect.quickFacts && (
        <div className="mt-4 rounded-lg border border-arena-border/60 bg-arena-surface px-3 py-2">
          <p className="text-[11px] uppercase tracking-wider text-foreground/50">
            Quick Facts
          </p>
          <p className="mt-1 text-sm text-foreground/90">
            {prospect.quickFacts}
          </p>
        </div>
      )}

      {previousNote && (
        <div className="mt-3 rounded-lg border border-arena-border/60 bg-arena-surface px-3 py-2">
          <p className="text-[11px] uppercase tracking-wider text-foreground/50">
            Previous Notes
          </p>
          <p className="mt-1 text-sm text-foreground/90">{previousNote}</p>
        </div>
      )}

      {prospect.script && (
        <div className="mt-3 rounded-lg border border-accent-soft/40 bg-accent/5 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wider text-accent">
            Script
          </p>
          <p className="mt-1 text-sm text-foreground/90">{prospect.script}</p>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-foreground/50">
        {label}
      </p>
      <p className="mt-0.5 font-medium text-foreground/90">{value}</p>
    </div>
  );
}
