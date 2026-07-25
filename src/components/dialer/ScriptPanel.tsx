"use client";

import { getNicheScript } from "@/lib/scripts";

export function ScriptPanel({ industry }: { industry: string | null }) {
  const niche = getNicheScript(industry);

  if (!niche) {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-arena-border bg-arena-surface-raised p-4">
        <p className="text-[11px] uppercase tracking-wider text-foreground/50">
          Script
        </p>
        <p className="mt-2 text-sm text-foreground/30">
          No niche script configured for{" "}
          {industry ? `"${industry}"` : "this industry"} yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto rounded-2xl border border-arena-border bg-arena-surface-raised p-4">
      <p className="text-[11px] uppercase tracking-wider text-accent">
        {niche.niche} Script
      </p>
      {niche.subtitle && (
        <p className="text-xs text-foreground/40">{niche.subtitle}</p>
      )}

      <div className="mt-3 space-y-3">
        {niche.sections.map((section) => (
          <div key={section.heading}>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
              {section.heading}
            </p>
            <div className="mt-1 space-y-1">
              {section.body.map((line, i) => (
                <p
                  key={i}
                  className="whitespace-pre-wrap text-sm text-foreground/80"
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
