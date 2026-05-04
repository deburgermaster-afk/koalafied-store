import bcrypt from "bcryptjs";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { and, eq, isNull, gt, desc, sql } from "drizzle-orm";

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, 8);
}

export async function verifyOtp(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

const TTL_MIN = 10;
const RATE_LIMIT_PER_HOUR = 6;

export async function canSendOtp(email: string): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const rows = await db
    .select({ c: sql<number>`count(*)` })
    .from(otpCodes)
    .where(and(eq(otpCodes.email, email), gt(otpCodes.createdAt, since)));
  return Number(rows[0]?.c ?? 0) < RATE_LIMIT_PER_HOUR;
}

export async function persistOtp(email: string, code: string) {
  const codeHash = await hashOtp(code);
  await db.insert(otpCodes).values({
    email: email.toLowerCase(),
    codeHash,
    expiresAt: new Date(Date.now() + TTL_MIN * 60 * 1000),
  });
}

export async function consumeOtp(email: string, code: string): Promise<boolean> {
  const now = new Date();
  const rows = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email.toLowerCase()),
        isNull(otpCodes.usedAt),
        gt(otpCodes.expiresAt, now)
      )
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(5);

  for (const row of rows) {
    if (row.attempts >= 5) continue;
    const ok = await verifyOtp(code, row.codeHash);
    if (ok) {
      await db
        .update(otpCodes)
        .set({ usedAt: now })
        .where(eq(otpCodes.id, row.id));
      return true;
    } else {
      await db
        .update(otpCodes)
        .set({ attempts: row.attempts + 1 })
        .where(eq(otpCodes.id, row.id));
    }
  }
  return false;
}
