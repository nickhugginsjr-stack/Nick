"use client";

import { useRef, useState } from "react";
import Link from "next/link";

interface ImportRowError {
  row: number;
  reason: string;
}

interface ImportResult {
  imported: number;
  duplicates: number;
  skipped: number;
  errors: ImportRowError[];
}

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a .csv file first.");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/prospects/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Import failed.");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-12">
      <Link
        href="/"
        className="text-sm text-foreground/50 hover:text-foreground/80"
      >
        ← Back to Dialer
      </Link>

      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        Import Prospects
      </h1>
      <p className="mt-2 text-foreground/60">
        Upload a CSV of your prospect list. Columns can be in any order —
        we match by header name.
      </p>

      <div className="mt-6 rounded-xl border border-arena-border bg-arena-surface-raised p-4 text-sm">
        <p className="text-foreground/70">
          Expected columns (case-insensitive; extras are ignored):
        </p>
        <p className="mt-2 font-mono text-xs text-foreground/50">
          Business Name*, Owner Name*, Phone*, Industry, Address, City,
          State, Zip, Relationship Status, Script, Quick Facts
        </p>
        <p className="mt-2 text-xs text-foreground/40">
          * required. Phone numbers are normalized automatically (10-digit
          US numbers get a +1 added).
        </p>
        <a
          href="/prospect-import-template.csv"
          download
          className="mt-3 inline-block text-xs font-medium text-accent hover:underline"
        >
          Download a template CSV
        </a>
      </div>

      <div className="mt-6 rounded-xl border border-arena-border bg-arena-surface-raised p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:brightness-110"
        />
        <button
          onClick={handleUpload}
          disabled={!fileName || uploading}
          className="mt-4 rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading ? "Importing..." : "Import"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-state-danger/40 bg-state-danger/10 p-3 text-sm text-state-danger">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-6 rounded-xl border border-arena-border bg-arena-surface-raised p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-state-live">
                {result.imported}
              </p>
              <p className="text-[11px] uppercase tracking-wider text-foreground/50">
                Imported
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground/70">
                {result.duplicates}
              </p>
              <p className="text-[11px] uppercase tracking-wider text-foreground/50">
                Duplicates skipped
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-state-danger">
                {result.skipped}
              </p>
              <p className="text-[11px] uppercase tracking-wider text-foreground/50">
                Rows with errors
              </p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-arena-border/60 bg-arena-surface p-3">
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-foreground/60">
                  Row {e.row}: {e.reason}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
