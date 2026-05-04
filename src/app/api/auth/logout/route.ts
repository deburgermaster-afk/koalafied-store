import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer";

export async function POST() {
  const sess = await getCustomerSession();
  sess.destroy();
  return NextResponse.json({ ok: true });
}
