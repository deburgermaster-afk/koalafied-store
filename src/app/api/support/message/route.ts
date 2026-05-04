import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";
import { getCurrentCustomer } from "@/lib/customer";

const SUPPORT_TO = process.env.SUPPORT_EMAIL || "support@koalafied.store";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = String(body.message ?? "").trim();
    const topicRaw = String(body.topic ?? "general").trim();
    const orderId = body.orderId ? String(body.orderId).trim() : "";
    let email = String(body.email ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim();

    if (!message || message.length < 2) {
      return NextResponse.json({ ok: false, error: "Message required" }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json({ ok: false, error: "Message too long" }, { status: 400 });
    }

    const me = await getCurrentCustomer();
    if (me?.email) email = me.email;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
    }

    const topic = ["general", "order", "refund", "shipping", "product"].includes(topicRaw)
      ? topicRaw
      : "general";

    const subject =
      topic === "order" || orderId
        ? `Help with order ${orderId ? `#${orderId} ` : ""}— ${email}`
        : `Support: ${topic} — ${email}`;

    const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#111">
      <h2 style="margin:0 0 8px">New support message</h2>
      <p style="margin:0 0 4px"><strong>From:</strong> ${escapeHtml(name || email)} &lt;${escapeHtml(email)}&gt;</p>
      <p style="margin:0 0 4px"><strong>Topic:</strong> ${escapeHtml(topic)}</p>
      ${orderId ? `<p style="margin:0 0 4px"><strong>Order:</strong> #${escapeHtml(orderId)}</p>` : ""}
      ${me ? `<p style="margin:0 0 4px"><strong>Customer ID:</strong> ${me.id}</p>` : ""}
      <hr style="border:none;border-top:1px solid #ddd;margin:12px 0"/>
      <pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.5">${escapeHtml(message)}</pre>
    </body></html>`;

    await sendMail({
      to: SUPPORT_TO,
      subject,
      html,
      text: `From: ${name || email} <${email}>\nTopic: ${topic}${orderId ? `\nOrder: #${orderId}` : ""}\n\n${message}`,
    });

    return NextResponse.json({
      ok: true,
      reply:
        "Thanks — we've got your message and will reply to your email within a few hours (usually faster during AEST business hours).",
    });
  } catch (e) {
    console.error("support/message error", e);
    return NextResponse.json({ ok: false, error: "Failed to send" }, { status: 500 });
  }
}
