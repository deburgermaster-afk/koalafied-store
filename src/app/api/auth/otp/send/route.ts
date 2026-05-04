import { NextRequest, NextResponse } from "next/server";
import { canSendOtp, generateOtp, persistOtp } from "@/lib/otp";
import { sendMail, otpEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  const lower = email.toLowerCase();
  if (!(await canSendOtp(lower))) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }
  const code = generateOtp();
  await persistOtp(lower, code);
  const mail = otpEmail(code);
  const sent = await sendMail({ to: lower, ...mail });

  // In dev fallback we expose the code so the user can complete the flow without SMTP.
  const devEcho =
    sent.channel === "console" && process.env.NODE_ENV !== "production"
      ? { devCode: code }
      : {};
  return NextResponse.json({ ok: true, ...devEcho });
}
