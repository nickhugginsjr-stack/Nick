"use client";

import { useState } from "react";
import type { CallSnapshot, Disposition } from "@/lib/types";
import { CALL_STATE_DISPLAY } from "@/lib/callStateDisplay";
import { ProspectCard } from "@/components/dialer/ProspectCard";
import { NotesPanel } from "@/components/dialer/NotesPanel";
import { ScriptPanel } from "@/components/dialer/ScriptPanel";
import { DispositionButtons } from "@/components/dialer/DispositionButtons";

const ANSWERED_STATES = new Set(["CONNECTED", "COMPLETED", "VOICEMAIL"]);

export function ArenaStage({
  currentCall,
  onDisposition,
}: {
  currentCall: CallSnapshot | null;
  onDisposition: (
    callId: string,
    disposition: Disposition,
    notes: string
  ) => Promise<void>;
}) {
  const [notesDraft, setNotesDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [trackedCallId, setTrackedCallId] = useState<string | null>(
    currentCall?.id ?? null
  );

  const existingNote = currentCall?.notes[currentCall.notes.length - 1];

  // Reset the draft when the active call changes (recommended "adjust
  // state during render" pattern rather than an effect).
  if (trackedCallId !== (currentCall?.id ?? null)) {
    setTrackedCallId(currentCall?.id ?? null);
    setNotesDraft(existingNote?.content ?? "");
  }

  if (!currentCall) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-24">
        <p className="animate-pulse-glow text-3xl font-bold tracking-widest text-state-warn">
          CONNECTING TO YOUR PHONE...
        </p>
        <p className="mt-3 text-sm text-foreground/50">
          Answer your phone to begin the session.
        </p>
      </div>
    );
  }

  const display = CALL_STATE_DISPLAY[currentCall.state];
  const answered = ANSWERED_STATES.has(currentCall.state);

  async function handleDisposition(disposition: Disposition) {
    if (!currentCall || submitting) return;
    setSubmitting(true);
    try {
      await onDisposition(currentCall.id, disposition, notesDraft);
      setNotesDraft("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <div className="flex flex-col items-center justify-center py-6">
        <p
          className={`text-4xl font-bold tracking-widest sm:text-5xl ${
            display.color
          } ${display.pulse ? "animate-pulse-glow" : ""}`}
        >
          {submitting ? "SAVING..." : display.label}
        </p>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_0.85fr] xl:grid-cols-[1fr_0.85fr_1fr]">
        <ProspectCard
          prospect={currentCall.prospect}
          previousNote={currentCall.previousNotes[0]?.content}
        />
        <NotesPanel
          key={currentCall.id}
          callId={currentCall.id}
          initialContent={existingNote?.content ?? ""}
          onContentChange={setNotesDraft}
        />
        <ScriptPanel industry={currentCall.prospect.industry} />
      </div>

      <div className="rounded-2xl border border-arena-border bg-arena-surface-raised p-4">
        {answered ? (
          <DispositionButtons
            disabled={submitting}
            onSelect={handleDisposition}
          />
        ) : (
          <p className="py-4 text-center text-sm text-foreground/40">
            Dispositions unlock once the call connects. Busy, failed, and
            unanswered calls advance automatically.
          </p>
        )}
      </div>
    </div>
  );
}
