import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { customerSessionOptions, CustomerSession } from "./session";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getCustomerSession() {
  const c = await cookies();
  return getIronSession<CustomerSession>(c, customerSessionOptions);
}

export async function getCurrentCustomer() {
  const sess = await getCustomerSession();
  if (!sess.customerId) return null;
  const [row] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, sess.customerId))
    .limit(1);
  return row ?? null;
}

export async function upsertCustomerByEmail(email: string) {
  const lower = email.toLowerCase();
  const [existing] = await db
    .select()
    .from(customers)
    .where(eq(customers.email, lower))
    .limit(1);
  if (existing) {
    await db
      .update(customers)
      .set({ lastLoginAt: new Date() })
      .where(eq(customers.id, existing.id));
    return existing;
  }
  const [created] = await db
    .insert(customers)
    .values({ email: lower, lastLoginAt: new Date() })
    .returning();
  return created;
}
