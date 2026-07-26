"use client";

import { useEffect } from "react";
import { DISPOSITIONS, type Disposition } from "@/lib/types";

export function DispositionButtons({
  disabled,
  onSelect,
}: {
  disabled: boolean;
  onSelect: (disposition: Disposition) => void;
}) {
  useEffect(() => {
    if (disabled) return;
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const match = DISPOSITIONS.find((d) => d.shortcut === e.key);
      if (match) {
        e.preventDefault();
        onSelect(match.key);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [disabled, onSelect]);

  return (
    <div className="grid grid-cols-2 gap-2 @sm:grid-cols-4">
      {DISPOSITIONS.map((d) => (
        <button
          key={d.key}
          disabled={disabled}
          onClick={() => onSelect(d.key)}
          className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-arena-border bg-arena-surface px-3 py-4 transition hover:border-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="text-xs font-mono text-foreground/40 group-hover:text-accent">
            {d.shortcut}
          </span>
          <span className="text-sm font-semibold">{d.label}</span>
        </button>
      ))}
    </div>
  );
}
