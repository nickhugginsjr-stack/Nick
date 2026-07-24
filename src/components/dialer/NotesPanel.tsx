"use client";

import { useRef, useState } from "react";

/** Mount with `key={callId}` from the parent so state resets per call. */
export function NotesPanel({
  callId,
  initialContent,
  onContentChange,
}: {
  callId: string;
  initialContent: string;
  onContentChange: (content: string) => void;
}) {
  const [content, setContent] = useState(initialContent);
  const [saved, setSaved] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    setContent(value);
    onContentChange(value);
    setSaved(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/calls/${callId}/notes`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: value }),
        });
        setSaved(true);
      } catch {
        // Will retry on next keystroke's debounce cycle.
      }
    }, 600);
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-arena-border bg-arena-surface-raised p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-foreground/50">
          Notes
        </p>
        <span
          className={`text-[11px] transition-opacity ${
            saved ? "opacity-40" : "opacity-80 text-accent"
          }`}
        >
          {saved ? "Saved" : "Saving..."}
        </span>
      </div>
      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Type naturally while you talk..."
        className="mt-2 w-full flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
        autoFocus
      />
    </div>
  );
}
