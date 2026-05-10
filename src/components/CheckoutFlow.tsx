"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ShippingAddress {
  name: string;
  phone: string;
  line1: string;
  suburb: string;
  postcode: string;
}

export function CheckoutFlow() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    suburb: "",
    postcode: "",
  });

  useEffect(() => {
    // Load cart from localStorage
    const cart = localStorage.getItem("cart");
    if (cart) {
      setCartItems(JSON.parse(cart));
    }
  }, []);

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

      if (cartItems.length === 0) {
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

      // For now, redirect to a simple checkout success
      // In a full implementation, this would integrate with Stripe
      const checkoutData = {
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        address,
        items: cartItems,
        total: cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0),
      };

      // Store checkout data in localStorage for processing
      localStorage.setItem("pending_checkout", JSON.stringify(checkoutData));

      // Redirect to checkout success (simplified flow)
      router.push("/checkout/success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
}
