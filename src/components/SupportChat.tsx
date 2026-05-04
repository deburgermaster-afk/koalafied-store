"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "bot"; text: string; ts: number };
type Props = {
  defaultEmail?: string;
  defaultName?: string;
  initialOrderId?: string;
  initialTopic?: "general" | "order" | "refund" | "shipping" | "product";
  buttonLabel?: string;
};

const STORAGE_KEY = "koalafied:support-thread:v1";

export function SupportChat({
  defaultEmail = "",
  defaultName = "",
  initialOrderId = "",
  initialTopic = "general",
  buttonLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState(defaultName);
  const [orderId, setOrderId] = useState(initialOrderId);
  const [topic, setTopic] = useState<Props["initialTopic"]>(initialTopic);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-open if user clicked an external "open chat" button
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { orderId?: string; topic?: Props["initialTopic"]; prefill?: string }
        | undefined;
      if (detail?.orderId) setOrderId(detail.orderId);
      if (detail?.topic) setTopic(detail.topic);
      if (detail?.prefill) setInput(detail.prefill);
      setOpen(true);
    };
    window.addEventListener("koalafied:open-chat", handler as EventListener);
    return () => window.removeEventListener("koalafied:open-chat", handler as EventListener);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMsgs(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-50)));
    } catch {}
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs, open]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    if (!defaultEmail && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      setMsgs((m) => [
        ...m,
        { role: "bot", text: "Please enter a valid email so we can reply.", ts: Date.now() },
      ]);
      return;
    }
    setSending(true);
    setMsgs((m) => [...m, { role: "user", text, ts: Date.now() }]);
    setInput("");
    try {
      const r = await fetch("/api/support/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, email, name, orderId, topic }),
      });
      const j = await r.json();
      setMsgs((m) => [
        ...m,
        {
          role: "bot",
          text: r.ok ? j.reply ?? "Got it — we'll reply to your email shortly." : `Sorry: ${j.error ?? "something went wrong"}`,
          ts: Date.now(),
        },
      ]);
    } catch {
      setMsgs((m) => [
        ...m,
        { role: "bot", text: "Network error — please try again.", ts: Date.now() },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open support chat"
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 h-14 w-14 rounded-full bg-stone-900 text-white shadow-lg flex items-center justify-center hover:bg-stone-800 transition"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-36 right-4 sm:bottom-24 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[70vh] bg-white border border-line shadow-2xl flex flex-col">
          <div className="px-4 py-3 bg-stone-900 text-white flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">Koalafied support</div>
              <div className="text-[11px] text-stone-300">Live chat · we usually reply in minutes</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-stone-300 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Identity row (only if not logged in) */}
          {!defaultEmail && (
            <div className="grid grid-cols-2 gap-2 p-3 border-b border-line bg-[#f8f8f6]">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-8 px-2 text-xs border border-line bg-white"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="h-8 px-2 text-xs border border-line bg-white"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 p-3 border-b border-line bg-[#f8f8f6]">
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value as Props["initialTopic"])}
              className="h-8 px-2 text-xs border border-line bg-white"
            >
              <option value="general">General question</option>
              <option value="order">Help with an order</option>
              <option value="refund">Refund / cancel</option>
              <option value="shipping">Shipping / tracking</option>
              <option value="product">Product question</option>
            </select>
            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Order # (optional)"
              className="h-8 px-2 text-xs border border-line bg-white"
            />
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 text-sm bg-white min-h-[180px]">
            {msgs.length === 0 && (
              <div className="text-xs text-muted py-6 text-center">
                Hi! Tell us how we can help — we'll reply via email and right here.
              </div>
            )}
            {msgs.map((m, i) => (
              <div
                key={i}
                className={
                  "max-w-[85%] px-3 py-2 text-sm rounded-lg " +
                  (m.role === "user"
                    ? "ml-auto bg-stone-900 text-white"
                    : "bg-[#f1efe9] text-stone-800")
                }
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-line bg-white">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                placeholder={buttonLabel ?? "Type a message…"}
                className="flex-1 resize-none border border-line px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                className="h-9 px-3 text-sm font-medium bg-stone-900 text-white disabled:opacity-50"
              >
                {sending ? "…" : "Send"}
              </button>
            </div>
            <div className="text-[10px] text-muted mt-1.5 text-center">
              We reply via email · responses also appear here on this device.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SupportChat;
