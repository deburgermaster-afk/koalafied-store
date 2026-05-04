"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pw }),
    });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setErr(j.error ?? "Login failed");
      return;
    }
    r.push("/admin");
    r.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        autoComplete="username"
        className="w-full border border-line px-4 py-3 text-sm bg-white"
      />
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="Password"
        autoComplete="current-password"
        className="w-full border border-line px-4 py-3 text-sm bg-white"
      />
      <button
        disabled={loading}
        className="w-full bg-ink text-white py-3 text-sm font-semibold disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      {err && <div className="text-sm text-red-600">{err}</div>}
    </form>
  );
}
