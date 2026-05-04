import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer";

export async function GET() {
  const c = await getCurrentCustomer();
  if (!c) return NextResponse.json({ customer: null });
  return NextResponse.json({
    customer: {
      id: c.id,
      email: c.email,
      name: c.name,
      phone: c.phone,
      defaultAddress: c.defaultAddress,
    },
  });
}
