"use client";
import { useEffect, useState } from "react";
import { Price } from "./Price";

type Locality = { suburb: string; postcode: string; state: string };

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;
type Customer = {
  id: number;
  email: string;
  name?: string | null;
  phone?: string | null;
  defaultAddress?: ShippingAddress | null;
};
type ShippingAddress = {
  name: string;
  line1: string;
  line2?: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  phone?: string;
};
type ShippingRate = { code: string; name: string; priceCents: number };

export function CheckoutFlow({
  subtotal,
  itemCount,
}: {
  subtotal: number;
  itemCount: number;
}) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [step, setStep] = useState<"email" | "code" | "address">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // address form state
  const [addr, setAddr] = useState<ShippingAddress>({
    name: "",
    line1: "",
    line2: "",
    suburb: "",
    state: "",
    postcode: "",
    country: "AU",
    phone: "",
  });
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [postcodeOptions, setPostcodeOptions] = useState<Locality[]>([]);
  const [postcodeQuery, setPostcodeQuery] = useState("");
  const [rates, setRates] = useState<ShippingRate[] | null>(null);
  const [shipping, setShipping] = useState<ShippingRate | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);

  // Load /api/auth/me
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => {
        if (j.customer) {
          setCustomer(j.customer);
          setEmail(j.customer.email);
          if (j.customer.defaultAddress) setAddr(j.customer.defaultAddress);
          setStep("address");
        }
      })
      .catch(() => {});
  }, []);

  // Auto suburb + state lookup when postcode is 4 digits
  useEffect(() => {
    if (!/^\d{4}$/.test(addr.postcode)) {
      setLocalities([]);
      return;
    }
    let abort = false;
    fetch(`/api/shipping/localities?postcode=${addr.postcode}`)
      .then((r) => r.json())
      .then((j) => {
        if (abort) return;
        const list: Locality[] = j.localities ?? [];
        setLocalities(list);
        if (list.length === 1) {
          setAddr((a) => ({ ...a, suburb: list[0].suburb, state: list[0].state }));
        } else if (list.length > 0 && !list.find((l) => l.suburb === addr.suburb)) {
          setAddr((a) => ({ ...a, suburb: "", state: list[0].state }));
        }
      })
      .catch(() => {});
    return () => {
      abort = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addr.postcode]);

  // Postcode combobox suggestions (typed query → AusPost search, debounced)
  useEffect(() => {
    const query = postcodeQuery.trim();
    if (query.length < 3) {
      setPostcodeOptions([]);
      return;
    }
    let abort = false;
    const t = setTimeout(() => {
      const params = new URLSearchParams({ q: query });
      if (addr.state) params.set("state", addr.state);
      fetch(`/api/shipping/localities?${params.toString()}`)
        .then((r) => r.json())
        .then((j) => {
          if (abort) return;
          setPostcodeOptions(j.localities ?? []);
        })
        .catch(() => {});
    }, 250);
    return () => {
      abort = true;
      clearTimeout(t);
    };
  }, [postcodeQuery, addr.state]);

  // Auto fetch shipping rates when postcode valid
  useEffect(() => {
    if (!/^\d{4}$/.test(addr.postcode)) {
      setRates(null);
      setShipping(null);
      return;
    }
    setLoadingRates(true);
    let abort = false;
    fetch(`/api/shipping/rates?postcode=${addr.postcode}&items=${itemCount}`)
      .then((r) => r.json())
      .then((j) => {
        if (abort) return;
        if (j.rates) {
          setRates(j.rates);
          setShipping((cur) => cur ?? j.rates[0] ?? null);
        }
      })
      .finally(() => !abort && setLoadingRates(false));
    return () => {
      abort = true;
    };
  }, [addr.postcode, itemCount]);

  async function sendCode() {
    setErr("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr("Enter a valid email.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "send_fail");
      if (j.devCode) setDevCode(j.devCode);
      setStep("code");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not send code.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setErr("");
    if (!/^\d{6}$/.test(code)) {
      setErr("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "verify_fail");
      setCustomer(j.customer);
      if (j.customer.defaultAddress) setAddr(j.customer.defaultAddress);
      else setAddr((a) => ({ ...a, name: j.customer.name ?? a.name, phone: j.customer.phone ?? a.phone }));
      setStep("address");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Invalid code.");
    } finally {
      setBusy(false);
    }
  }

  async function placeOrder() {
    setErr("");
    if (!addr.name || !addr.line1 || !addr.suburb || !addr.postcode || !addr.state) {
      setErr("Please complete your address.");
      return;
    }
    if (!shipping) {
      setErr("Select a shipping option.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipping, address: addr, postcode: addr.postcode }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "checkout_fail");
      window.location.href = j.url;
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Checkout failed.");
    } finally {
      setBusy(false);
    }
  }

  const total = subtotal + (shipping?.priceCents ?? 0);

  return (
    <div className="bg-[#f8f8f6] p-6 h-fit">
      <h2 className="font-semibold mb-4">Checkout</h2>

      {/* Step: Email */}
      {step === "email" && (
        <div className="space-y-3">
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-line px-3 py-2 text-sm bg-white"
          />
          <button
            onClick={sendCode}
            disabled={busy}
            className="w-full bg-ink text-white py-3 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send sign-in code"}
          </button>
          <p className="text-xs text-muted">
            We&apos;ll email you a one-time code to create or sign into your
            Koalafied account. No password needed.
          </p>
        </div>
      )}

      {/* Step: Code */}
      {step === "code" && (
        <div className="space-y-3">
          <p className="text-sm">
            Enter the 6-digit code we sent to <span className="font-semibold">{email}</span>.
          </p>
          {devCode && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              Dev code (no SMTP configured): <strong>{devCode}</strong>
            </p>
          )}
          <input
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full border border-line px-3 py-2 text-lg tracking-[0.4em] text-center bg-white"
          />
          <button
            onClick={verifyCode}
            disabled={busy}
            className="w-full bg-ink text-white py-3 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Verifying…" : "Verify & continue"}
          </button>
          <button
            onClick={() => {
              setStep("email");
              setCode("");
              setDevCode(null);
            }}
            className="w-full text-xs underline text-muted"
          >
            Use a different email
          </button>
        </div>
      )}

      {/* Step: Address */}
      {step === "address" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>
              Signed in as <span className="font-semibold text-ink">{customer?.email ?? email}</span>
            </span>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                setCustomer(null);
                setStep("email");
                setCode("");
                setEmail("");
              }}
              className="underline"
            >
              Sign out
            </button>
          </div>

          <Field label="Full name">
            <input
              value={addr.name}
              onChange={(e) => setAddr({ ...addr, name: e.target.value })}
              className="w-full border border-line px-3 py-2 text-sm bg-white"
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Phone">
            <input
              value={addr.phone ?? ""}
              onChange={(e) => setAddr({ ...addr, phone: e.target.value })}
              className="w-full border border-line px-3 py-2 text-sm bg-white"
              placeholder="04xx xxx xxx"
            />
          </Field>
          <Field label="Street address">
            <input
              value={addr.line1}
              onChange={(e) => setAddr({ ...addr, line1: e.target.value })}
              className="w-full border border-line px-3 py-2 text-sm bg-white"
              placeholder="123 George St"
            />
          </Field>
          <Field label="Apartment / unit (optional)">
            <input
              value={addr.line2 ?? ""}
              onChange={(e) => setAddr({ ...addr, line2: e.target.value })}
              className="w-full border border-line px-3 py-2 text-sm bg-white"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="State">
              <select
                value={addr.state}
                onChange={(e) => setAddr({ ...addr, state: e.target.value, suburb: "", postcode: "" })}
                className="w-full border border-line px-3 py-2 text-sm bg-white"
              >
                <option value="">Select state…</option>
                {AU_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Postcode">
              <input
                list="koalafied-postcodes"
                inputMode="numeric"
                maxLength={4}
                value={addr.postcode}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setAddr({ ...addr, postcode: v });
                  setPostcodeQuery(v);
                  // If user picked one of the suggestions, lock state too
                  const match = postcodeOptions.find((o) => o.postcode === v);
                  if (match) {
                    setAddr((a) => ({ ...a, postcode: v, state: match.state }));
                  }
                }}
                className="w-full border border-line px-3 py-2 text-sm bg-white"
                placeholder="2000"
              />
              <datalist id="koalafied-postcodes">
                {postcodeOptions.map((o) => (
                  <option key={`${o.postcode}-${o.suburb}`} value={o.postcode}>
                    {o.suburb}, {o.state}
                  </option>
                ))}
              </datalist>
            </Field>
          </div>
          <Field label="Suburb">
            <select
              value={addr.suburb}
              disabled={localities.length === 0}
              onChange={(e) => {
                const found = localities.find((l) => l.suburb === e.target.value);
                setAddr({
                  ...addr,
                  suburb: e.target.value,
                  state: found?.state ?? addr.state,
                });
              }}
              className="w-full border border-line px-3 py-2 text-sm bg-white disabled:opacity-50"
            >
              <option value="">
                {localities.length === 0
                  ? "Enter postcode to load suburbs…"
                  : "Select suburb…"}
              </option>
              {localities.map((l) => (
                <option key={l.suburb} value={l.suburb}>
                  {l.suburb}
                </option>
              ))}
            </select>
          </Field>

          {/* Live AusPost rates */}
          <div className="pt-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Shipping (Australia Post)
            </div>
            {loadingRates && <div className="text-xs text-muted">Fetching live rates…</div>}
            {rates && rates.length > 0 ? (
              <div className="space-y-2">
                {rates.map((r) => (
                  <label
                    key={r.code}
                    className="flex items-center justify-between gap-3 text-sm border border-line px-3 py-2 bg-white cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="ship"
                        checked={shipping?.code === r.code}
                        onChange={() => setShipping(r)}
                      />
                      {r.name}
                    </span>
                    <span className="font-semibold">
                      <Price cents={r.priceCents} />
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              !loadingRates && (
                <div className="text-xs text-muted">
                  Enter a valid 4-digit Australian postcode to see live shipping rates.
                </div>
              )
            )}
          </div>

          <div className="mt-4 space-y-1 text-sm border-t border-line pt-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>
                <Price cents={subtotal} />
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping ? <Price cents={shipping.priceCents} /> : "—"}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold pt-2">
              <span>Total</span>
              <span>
                <Price cents={total} />
              </span>
            </div>
          </div>

          <button
            onClick={placeOrder}
            disabled={busy || !shipping}
            className="mt-3 w-full bg-ink text-white py-3 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Redirecting…" : "Pay with Stripe"}
          </button>
        </div>
      )}

      {err && <div className="text-sm text-red-600 mt-3">{err}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wider text-muted mb-1">{label}</div>
      {children}
    </label>
  );
}
