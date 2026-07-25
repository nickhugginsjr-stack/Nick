"use client";

import { useCallback } from "react";
import { useSessionPolling } from "@/hooks/useSessionPolling";
import { useSessionIdStorage } from "@/hooks/useSessionIdStorage";
import { ArenaBanner } from "@/components/dialer/ArenaBanner";
import { ArenaStage } from "@/components/dialer/ArenaStage";
import { StartScreen } from "@/components/dialer/StartScreen";
import { GameOverScreen } from "@/components/dialer/GameOverScreen";
import type { Disposition } from "@/lib/types";

export default function DialerArenaPage() {
  const [sessionId, setSessionId] = useSessionIdStorage();

  const { snapshot, refresh } = useSessionPolling(sessionId, {
    onMissing: () => setSessionId(null),
  });

  const handleStart = useCallback(
    async ({ repPhone, goal }: { repPhone?: string; goal: number }) => {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repPhone, goal }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.toString() ?? "Failed to start session.");
      }
      setSessionId(data.sessionId);
    },
    [setSessionId]
  );

  const handleDisposition = useCallback(
    async (callId: string, disposition: Disposition, notes: string) => {
      const res = await fetch("/api/dispositions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId, disposition, notes }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.toString() ?? "Failed to save.");
      }
      await refresh();
    },
    [refresh]
  );

  const handleConfirmDial = useCallback(
    async (callId: string) => {
      const res = await fetch(`/api/calls/${callId}/confirm-dial`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.toString() ?? "Failed to dial.");
      }
      await refresh();
    },
    [refresh]
  );

  const handleEndSession = useCallback(async () => {
    if (!sessionId) return;
    await fetch(`/api/session/${sessionId}/end`, { method: "POST" });
    await refresh();
  }, [sessionId, refresh]);

  const handleNewSession = useCallback(() => {
    setSessionId(null);
  }, [setSessionId]);

  if (!sessionId || !snapshot) {
    return (
      <div className="flex flex-1 flex-col">
        <ArenaBanner snapshot={null} />
        <StartScreen onStart={handleStart} />
      </div>
    );
  }

  if (snapshot.session.status === "ENDED") {
    return (
      <div className="flex flex-1 flex-col">
        <ArenaBanner snapshot={snapshot} />
        <GameOverScreen snapshot={snapshot} onNewSession={handleNewSession} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ArenaBanner snapshot={snapshot} />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4">
        <div className="flex items-center justify-end">
          <button
            onClick={handleEndSession}
            className="rounded-full border border-arena-border px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-foreground/50 transition hover:border-state-danger hover:text-state-danger"
          >
            End Session
          </button>
        </div>
        <ArenaStage
          currentCall={snapshot.currentCall}
          onDisposition={handleDisposition}
          onConfirmDial={handleConfirmDial}
        />
      </div>
    </div>
  );
}
