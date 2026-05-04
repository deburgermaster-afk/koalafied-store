import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  listPrintifyWebhooks,
  createPrintifyWebhook,
  deletePrintifyWebhook,
  PRINTIFY_WEBHOOK_TOPICS,
} from "@/lib/printify";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  try {
    const hooks = await listPrintifyWebhooks();
    return NextResponse.json({ ok: true, hooks, topics: PRINTIFY_WEBHOOK_TOPICS });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const secret = process.env.PRINTIFY_WEBHOOK_SECRET || undefined;

  try {
    if (action === "install_all") {
      const baseUrl: string = body.url
        ? String(body.url).replace(/\/$/, "")
        : process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
          `${req.nextUrl.protocol}//${req.nextUrl.host}`;
      const target = `${baseUrl}/api/webhooks/printify`;

      const existing = await listPrintifyWebhooks();
      const have = new Set(existing.map((h) => `${h.topic}|${h.url}`));
      const created: typeof existing = [];
      for (const topic of PRINTIFY_WEBHOOK_TOPICS) {
        if (have.has(`${topic}|${target}`)) continue;
        try {
          const h = await createPrintifyWebhook(topic, target, secret);
          created.push(h);
        } catch (e) {
          console.error("install webhook failed", topic, e);
        }
      }
      return NextResponse.json({ ok: true, target, created, existing });
    }

    if (action === "create") {
      const topic = String(body.topic ?? "");
      const url = String(body.url ?? "");
      if (!topic || !url) {
        return NextResponse.json({ ok: false, error: "topic and url required" }, { status: 400 });
      }
      const h = await createPrintifyWebhook(topic, url, secret);
      return NextResponse.json({ ok: true, hook: h });
    }

    if (action === "delete") {
      const id = String(body.id ?? "");
      if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
      const r = await deletePrintifyWebhook(id);
      return NextResponse.json({ ok: true, result: r });
    }

    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
