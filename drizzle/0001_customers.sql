-- Customers (passwordless email accounts)
CREATE TABLE IF NOT EXISTS "customers" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "phone" TEXT,
  "default_address" JSONB,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "last_login_at" TIMESTAMP
);

-- One-time email codes
CREATE TABLE IF NOT EXISTS "otp_codes" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "code_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "used_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "otp_codes_email_idx" ON "otp_codes" ("email");

-- Link orders to customer accounts
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_id" INTEGER REFERENCES "customers"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "orders_customer_idx" ON "orders" ("customer_id");
