-- Printify shipping/tracking fields
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tracking_carrier" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tracking_url" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipped_at" timestamp;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivered_at" timestamp;
