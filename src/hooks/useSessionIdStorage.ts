"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "sos.sessionId";
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot() {
  return null;
}

/** Session id persisted to localStorage, synced across tabs/renders. */
export function useSessionIdStorage() {
  const sessionId = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const setSessionId = useCallback((id: string | null) => {
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    for (const listener of listeners) listener();
  }, []);

  return [sessionId, setSessionId] as const;
}
