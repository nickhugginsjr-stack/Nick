"use client";

import { useCallback, useEffect, useState } from "react";
import type { SessionSnapshot } from "@/lib/types";

const POLL_INTERVAL_MS = 1200;

export function useSessionPolling(
  sessionId: string | null,
  options?: { onMissing?: () => void }
) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trackedSessionId, setTrackedSessionId] = useState(sessionId);

  // Reset stale data the moment the session id changes (recommended
  // "adjust state during render" pattern instead of an effect).
  if (trackedSessionId !== sessionId) {
    setTrackedSessionId(sessionId);
    setSnapshot(null);
    setError(null);
  }

  const onMissing = options?.onMissing;

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/session/${sessionId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setError("Session not found");
        onMissing?.();
        return;
      }
      const data: SessionSnapshot = await res.json();
      setSnapshot(data);
      setError(null);
    } catch {
      setError("Connection lost — retrying...");
    }
  }, [sessionId, onMissing]);

  useEffect(() => {
    if (!sessionId) return;
    // Subscribing to an external system (server state via polling) and
    // updating from its async callback is the sanctioned effect pattern;
    // the lint rule's static analysis can't see through the async boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [sessionId, refresh]);

  return { snapshot, error, refresh };
}
