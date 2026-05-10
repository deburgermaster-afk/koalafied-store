"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Price } from "./Price";
import type { HydratedLine } from "@/lib/cart";

interface ShippingAddress {
  name: string;
  phone: string;
  line1: string;
  suburb: string;
  postcode: string;
}

export function CheckoutFlow({ items = [] }: { items?: HydratedLine[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    suburb: "",
    postcode: "",
  });

  const subtotal = items.reduce((s, i) => s + i.priceCents * i.qty, 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.suburb || !formData.postcode) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      if (items.length === 0) {
        setError("Your cart is empty");
        setLoading(false);
        return;
      }

      const address: ShippingAddress = {
        name: formData.name,
        phone: formData.phone,
        line1: formData.address,
        suburb: formData.suburb,
        postcode: formData.postcode,
      };

      // Call checkout API to create Stripe session
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          address,
          shipping: {
            code: "auspost_standard",
            name: "Australia Post Standard",
            priceCents: 0, // For now, free shipping. Update based on your logic
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Checkout failed");
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.url) {
        // Clear cart and dispatch event before redirecting to Stripe
        await fetch("/api/cart", { method: "DELETE" });
        window.dispatchEvent(new CustomEvent("koalafied:cart"));
        window.location.href = data.url;
      } else {
        setError("Failed to create checkout session");
        setLoading(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-[#f8f8f6] p-6 rounded border border-line mb-6">
        <h2 className="font-semibold mb-4">Order Summary</h2>
        <div className="space-y-2 text-sm">
          {items.length === 0 ? (
            <p className="text-muted">Your cart is empty</p>
          ) : (
            <>
              {items.map((i) => (
                <div key={i.variantId} className="flex justify-between">
                  <span>{i.title} {i.variantLabel && `(${i.variantLabel})`} x {i.qty}</span>
                  <span><Price cents={i.priceCents * i.qty} /></span>
                </div>
              ))}
              <div className="border-t border-line pt-2 mt-2 font-semibold flex justify-between">
                <span>Total</span>
                <span><Price cents={subtotal} /></span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-[#f8f8f6] p-6 rounded border border-line">
        <h2 className="font-semibold mb-6">Checkout</h2>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border border-line px-3 py-2 text-sm"
            placeholder="Full name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-line px-3 py-2 text-sm"
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full border border-line px-3 py-2 text-sm"
            placeholder="+61 2 1234 5678"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address *</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full border border-line px-3 py-2 text-sm"
            placeholder="Street address"
            rows={2}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Suburb/City *</label>
            <input
              type="text"
              name="suburb"
              value={formData.suburb}
              onChange={handleChange}
              className="w-full border border-line px-3 py-2 text-sm"
              placeholder="Suburb"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Postcode *</label>
            <input
              type="text"
              name="postcode"
              value={formData.postcode}
              onChange={handleChange}
              className="w-full border border-line px-3 py-2 text-sm"
              placeholder="2000"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-white px-6 py-3 text-sm font-semibold disabled:opacity-50 mt-6"
        >
          {loading ? "Processing..." : "Proceed to Payment"}
        </button>
      </form>
      </div>
    </div>
  );
}
