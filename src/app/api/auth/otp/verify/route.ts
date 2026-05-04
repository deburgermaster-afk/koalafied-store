import { NextRequest, NextResponse } from "next/server";
import { consumeOtp } from "@/lib/otp";
import { getCustomerSession, upsertCustomerByEmail } from "@/lib/customer";

export async function POST(req: NextRequest) {
  const { email, code } = (await req.json().catch(() => ({}))) as {
    email?: string;
    code?: string;
  };
  if (!email || !code) {
    return NextResponse.json({ error: "Email and code required." }, { status: 400 });
  }
  const ok = await consumeOtp(email, code);
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid or expired code." },
      { status: 400 }
    );
  }
  const customer = await upsertCustomerByEmail(email);
  const sess = await getCustomerSession();
  sess.customerId = customer.id;
  sess.email = customer.email;
  sess.loggedInAt = Date.now();
  await sess.save();
  return NextResponse.json({
    ok: true,
    customer: {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      defaultAddress: customer.defaultAddress,
    },
  });
}
