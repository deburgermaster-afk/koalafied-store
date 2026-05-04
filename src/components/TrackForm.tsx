"use client";
import { useState } from "react";

type Event = { description: string; location: string; date: string };

export function TrackForm() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<{ status: string; events: Event[] } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setResult(null);
    try {
      const r = await fetch(`/api/track?code=${encodeURIComponent(code)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Tracking failed");
      const tr = j.data?.tracking_results?.[0];
      const events = tr?.trackable_items?.[0]?.events ?? [];
      setResult({ status: tr?.status ?? "Unknown", events });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not track");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. 33LBA0123456789"
          className="flex-1 border border-line px-4 py-3 text-sm"
        />
        <button disabled={loading} className="bg-ink text-white px-6 text-sm font-semibold">
          {loading ? "…" : "Track"}
        </button>
      </form>
      {err && <div className="text-sm text-red-600 mt-3">{err}</div>}
      {result && (
        <div className="mt-8">
          <div className="text-sm text-muted">Status</div>
          <div className="text-xl font-semibold mb-4">{result.status}</div>
          <ol className="border-l border-line pl-5 space-y-4">
            {result.events.map((ev, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-ink" />
                <div className="text-sm font-semibold">{ev.description}</div>
                <div className="text-xs text-muted">
                  {ev.location} • {new Date(ev.date).toLocaleString("en-AU")}
                </div>
              </li>
            ))}
            {result.events.length === 0 && (
              <li className="text-sm text-muted">No events yet — check back soon.</li>
            )}
          </ol>
        </div>
      )}
    </div>
  );
}
