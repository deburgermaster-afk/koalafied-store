import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: NextRequest) {
  await requireAdmin();
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 8 MB)" }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // Prefer ImgBB if configured (free, permanent URLs).
  const key = process.env.IMGBB_API_KEY;
  if (key) {
    try {
      const fd = new FormData();
      fd.set("image", buf.toString("base64"));
      const r = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
        method: "POST",
        body: fd,
      });
      const j = (await r.json()) as {
        data?: { url: string; display_url: string; image?: { url: string } };
        error?: { message: string };
      };
      if (!r.ok || !j.data) {
        return NextResponse.json(
          { error: j.error?.message ?? "ImgBB upload failed" },
          { status: 502 }
        );
      }
      return NextResponse.json({
        url: j.data.image?.url ?? j.data.url,
        provider: "imgbb",
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Upload failed" },
        { status: 502 }
      );
    }
  }

  // Fallback (dev only): write to /public/uploads.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "IMGBB_API_KEY not set. Configure free key at imgbb.com." },
      { status: 503 }
    );
  }
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, safeName), buf);
  return NextResponse.json({ url: `/uploads/${safeName}`, provider: "local" });
}
