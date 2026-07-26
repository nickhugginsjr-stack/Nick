"use client";

import { useEffect, useRef, useState } from "react";
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
  onConfirmDial,
}: {
  currentCall: CallSnapshot | null;
  onDisposition: (
    callId: string,
    disposition: Disposition,
    notes: string
  ) => Promise<void>;
  onConfirmDial: (callId: string) => Promise<void>;
}) {
  const [notesDraft, setNotesDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDial, setConfirmingDial] = useState(false);
  const confirmingRef = useRef(false);
  const [trackedCallId, setTrackedCallId] = useState<string | null>(
    currentCall?.id ?? null
  );

  const existingNote = currentCall?.notes[currentCall.notes.length - 1];

  // Reset per-call state when the active call changes (recommended
  // "adjust state during render" pattern rather than an effect).
  if (trackedCallId !== (currentCall?.id ?? null)) {
    setTrackedCallId(currentCall?.id ?? null);
    setNotesDraft(existingNote?.content ?? "");
    setConfirmingDial(false);
  }

  // Spacebar confirms the dial while a prospect is being previewed.
  useEffect(() => {
    if (!currentCall || currentCall.state !== "PREVIEW") return;
    confirmingRef.current = false;

    function handleKeydown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.code !== "Space") return;
      e.preventDefault();
      if (confirmingRef.current || !currentCall) return;
      confirmingRef.current = true;
      setConfirmingDial(true);
      onConfirmDial(currentCall.id).catch(() => {
        confirmingRef.current = false;
        setConfirmingDial(false);
      });
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [currentCall, onConfirmDial]);

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
  const previewing = currentCall.state === "PREVIEW";

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

  const headline = confirmingDial
    ? "DIALING..."
    : submitting
    ? "SAVING..."
    : display.label;

  return (
    <div className="@container flex flex-1 flex-col gap-4 py-4">
      <div className="flex flex-col items-center justify-center py-6">
        <p
          className={`text-4xl font-bold tracking-widest @xl:text-5xl ${
            display.color
          } ${display.pulse && !confirmingDial ? "animate-pulse-glow" : ""}`}
        >
          {headline}
        </p>
      </div>

      {previewing ? (
        <div className="mx-auto w-full max-w-2xl">
          <ProspectCard
            prospect={currentCall.prospect}
            previousNote={currentCall.previousNotes[0]?.content}
          />
          <p className="mt-4 text-center text-sm text-foreground/60">
            Press{" "}
            <span className="rounded border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono font-bold text-accent">
              SPACE
            </span>{" "}
            to dial {currentCall.prospect.businessName}.
          </p>
        </div>
      ) : (
        <>
          <div className="grid flex-1 grid-cols-1 gap-4 @3xl:grid-cols-[1fr_0.85fr] @5xl:grid-cols-[1fr_0.85fr_1fr]">
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
        </>
      )}
    </div>
  );
}
