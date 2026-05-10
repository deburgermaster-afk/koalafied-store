/**
 * Lightweight email sender.
 * Tries SendPulse (PULSE_API_KEY) → otherwise Resend (RESEND_API_KEY) → otherwise logs to console.
 */
type Mail = { to: string; subject: string; html: string; text?: string };

function parseFromHeader(from: string) {
  const match = from.match(/^(.*)<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { email: from.trim() };
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export async function sendMail(mail: Mail): Promise<{ ok: boolean; channel: string }> {
  const pulseKey = process.env.PULSE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const fromHeader = process.env.MAIL_FROM ?? "Koalafied <noreply@koalafied.store>";
  const from = parseFromHeader(fromHeader);

  if (pulseKey) {
    try {
      const response = await fetch("https://api.sendpulse.com/smtp/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pulseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: mail.subject,
          from,
          to: [{ email: mail.to, name: mail.to }],
          html: mail.html,
          text: mail.text ?? stripHtml(mail.html),
        }),
      });
      if (!response.ok) {
        console.error("SendPulse error", await response.text());
      } else {
        return { ok: true, channel: "pulse" };
      }
    } catch (e) {
      console.error("SendPulse exception", e);
    }
  }

  if (resendKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromHeader,
          to: [mail.to],
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        }),
      });
      if (!response.ok) {
        console.error("Resend error", await response.text());
        return { ok: false, channel: "resend" };
      }
      return { ok: true, channel: "resend" };
    } catch (e) {
      console.error("Resend exception", e);
      return { ok: false, channel: "resend" };
    }
  }

  console.log(
    `\n[mail:dev] To: ${mail.to}\nSubject: ${mail.subject}\n${mail.text ?? stripHtml(mail.html)}\n`
  );
  return { ok: true, channel: "console" };
}

export function otpEmail(code: string) {
  const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;background:#f5f4f0;padding:32px;color:#111">
    <div style="max-width:480px;margin:0 auto;background:#fff;padding:32px;border-radius:8px">
      <h1 style="margin:0 0 8px;font-size:22px">Your Koalafied sign-in code</h1>
      <p style="color:#555;margin:0 0 24px">Enter this code to continue your checkout. It expires in 10 minutes.</p>
      <div style="font-size:32px;letter-spacing:.4em;font-weight:700;text-align:center;background:#111;color:#fff;padding:18px 0;border-radius:4px">${code}</div>
      <p style="color:#888;font-size:12px;margin-top:24px">If you didn't request this, ignore this email.</p>
    </div></body></html>`;
  return {
    subject: `Your Koalafied code: ${code}`,
    html,
    text: `Your Koalafied sign-in code is ${code}. It expires in 10 minutes.`,
  };
}
