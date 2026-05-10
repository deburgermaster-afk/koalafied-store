"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProductDeleteButton({ productId, productTitle }: { productId: number; productTitle: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [err, setErr] = useState("");

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${productTitle}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setErr("");

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Delete failed");
      }

      router.refresh();
      router.push("/admin/products");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
      setIsDeleting(false);
    }
  }

  if (err) {
    return <span className="text-xs text-red-600">{err}</span>;
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-xs underline text-red-600 hover:text-red-800 disabled:opacity-50"
    >
      {isDeleting ? "deleting..." : "delete"}
    </button>
  );
}
