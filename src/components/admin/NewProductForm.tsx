"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Img = { url: string; alt?: string };

const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

export function NewProductForm() {
  const r = useRouter();
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [priceAud, setPriceAud] = useState("49.95");
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [images, setImages] = useState<Img[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [sizes, setSizes] = useState<string[]>(["S", "M", "L", "XL"]);

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  function toggleSize(s: string) {
    setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }
  function addColor() {
    const v = colorInput.trim();
    if (!v) return;
    if (!colors.includes(v)) setColors([...colors, v]);
    setColorInput("");
  }
  function removeColor(c: string) {
    setColors(colors.filter((x) => x !== c));
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setErr("");
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Upload failed");
        setImages((prev) => [...prev, { url: j.url, alt: title || file.name }]);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const cents = Math.round(parseFloat(priceAud) * 100);
    if (!title || !Number.isFinite(cents) || cents <= 0) {
      setErr("Title and price are required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          handle: handle || undefined,
          description,
          basePriceCents: cents,
          active,
          featured,
          images,
          sizes,
          colors,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      r.push("/admin/products");
      r.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="Basics">
        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="Koala Submission Tee"
          />
        </Field>
        <Field label="Handle (URL slug — auto if empty)">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="input"
            placeholder="koala-submission-tee"
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Base price (AUD)">
            <input
              value={priceAud}
              onChange={(e) => setPriceAud(e.target.value)}
              className="input"
              inputMode="decimal"
            />
          </Field>
          <Field label="Status">
            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                Featured
              </label>
            </div>
          </Field>
        </div>
      </Section>

      <Section title="Images">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => uploadFiles(e.target.files)}
          className="text-sm"
        />
        {uploading && <div className="text-xs text-muted mt-2">Uploading…</div>}
        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            {images.map((im, i) => (
              <div key={im.url} className="relative aspect-square bg-[#f5f4f0] border border-line">
                <Image src={im.url} alt={im.alt ?? ""} fill className="object-cover" sizes="120px" unoptimized />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 bg-white/90 text-ink text-[11px] px-2 py-0.5"
                >
                  remove
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Sizes">
        <div className="flex flex-wrap gap-2">
          {COMMON_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSize(s)}
              className={
                "border px-3 py-1.5 text-sm " +
                (sizes.includes(s) ? "bg-ink text-white border-ink" : "border-line bg-white")
              }
            >
              {s}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Colors / Variants (optional)">
        <div className="flex gap-2">
          <input
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addColor();
              }
            }}
            placeholder="e.g. Forest Green"
            className="input flex-1"
          />
          <button
            type="button"
            onClick={addColor}
            className="border border-line bg-white px-4 text-sm"
          >
            Add
          </button>
        </div>
        {colors.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {colors.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-2 border border-line bg-white px-3 py-1 text-sm"
              >
                {c}
                <button type="button" onClick={() => removeColor(c)} className="text-muted hover:text-ink">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-muted mt-3">
          Variants are auto-generated as <em>color × size</em> using the base price.
          You can map them to Printify products afterwards on the Products page.
        </p>
      </Section>

      {err && <div className="text-sm text-red-600">{err}</div>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="bg-ink text-white px-6 py-3 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save product"}
        </button>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border: 1px solid var(--color-line, #e5e3df);
          padding: 0.6rem 0.8rem;
          font-size: 0.875rem;
          background: white;
        }
      `}</style>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-white p-5">
      <h2 className="font-semibold mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
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
