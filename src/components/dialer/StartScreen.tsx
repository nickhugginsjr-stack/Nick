"use client";

import { useState } from "react";

export function StartScreen({
  onStart,
}: {
  onStart: (args: { repPhone?: string; goal: number }) => Promise<void>;
}) {
  const [repPhone, setRepPhone] = useState("");
  const [goal, setGoal] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      await onStart({ repPhone: repPhone || undefined, goal });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-foreground/40">
        Sales Operating System
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
        The system runs the process.
        <br />
        <span className="text-accent">You run the conversations.</span>
      </h1>

      <div className="mt-10 w-full max-w-sm space-y-3">
        <input
          type="tel"
          value={repPhone}
          onChange={(e) => setRepPhone(e.target.value)}
          placeholder="Your phone number (e.g. +15551234567)"
          className="w-full rounded-lg border border-arena-border bg-arena-surface px-4 py-3 text-center text-sm placeholder:text-foreground/30 focus:border-accent focus:outline-none"
        />
        <input
          type="number"
          value={goal}
          min={1}
          onChange={(e) => setGoal(parseInt(e.target.value, 10) || 1)}
          className="w-full rounded-lg border border-arena-border bg-arena-surface px-4 py-3 text-center text-sm placeholder:text-foreground/30 focus:border-accent focus:outline-none"
          aria-label="Dial goal"
        />
        <p className="text-xs text-foreground/40">
          Leave phone blank to use the default rep number configured on the
          server.
        </p>
      </div>

      <button
        onClick={handleStart}
        disabled={loading}
        className="mt-8 rounded-full bg-accent px-12 py-5 text-xl font-bold tracking-wide text-black shadow-[0_0_40px_rgba(242,183,5,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "CONNECTING..." : "START GAME"}
      </button>

      {error && <p className="mt-4 text-sm text-state-danger">{error}</p>}
    </div>
  );
}
