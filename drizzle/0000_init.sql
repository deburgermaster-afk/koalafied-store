CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY,
  "handle" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "base_price_cents" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'AUD',
  "active" boolean NOT NULL DEFAULT true,
  "featured" boolean NOT NULL DEFAULT false,
  "source_id" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "products_handle_idx" ON "products" ("handle");

CREATE TABLE IF NOT EXISTS "product_images" (
  "id" serial PRIMARY KEY,
  "product_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "url" text NOT NULL,
  "alt" text NOT NULL DEFAULT '',
  "position" integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "variants" (
  "id" serial PRIMARY KEY,
  "product_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "sku" text,
  "price_cents" integer NOT NULL,
  "available" boolean NOT NULL DEFAULT true,
  "option1" text,
  "option2" text,
  "option3" text,
  "image_url" text,
  "source_id" text,
  "printify_product_id" text,
  "printify_variant_id" text
);
CREATE INDEX IF NOT EXISTS "variants_product_idx" ON "variants" ("product_id");

CREATE TABLE IF NOT EXISTS "product_options" (
  "id" serial PRIMARY KEY,
  "product_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "position" integer NOT NULL DEFAULT 0,
  "values" jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id" serial PRIMARY KEY,
  "stripe_session_id" text,
  "stripe_payment_intent_id" text,
  "status" text NOT NULL DEFAULT 'pending',
  "payment_status" text NOT NULL DEFAULT 'unpaid',
  "fulfillment_status" text NOT NULL DEFAULT 'unfulfilled',
  "subtotal_cents" integer NOT NULL DEFAULT 0,
  "shipping_cents" integer NOT NULL DEFAULT 0,
  "total_cents" integer NOT NULL DEFAULT 0,
  "currency" text NOT NULL DEFAULT 'AUD',
  "customer_email" text,
  "customer_name" text,
  "shipping_address" jsonb,
  "shipping_method" text,
  "tracking_code" text,
  "printify_order_id" text,
  "printify_error" text,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" serial PRIMARY KEY,
  "order_id" integer NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "variant_id" integer REFERENCES "variants"("id"),
  "product_title" text NOT NULL,
  "variant_label" text NOT NULL DEFAULT '',
  "qty" integer NOT NULL,
  "unit_price_cents" integer NOT NULL,
  "image_url" text,
  "printify_product_id" text,
  "printify_variant_id" text
);
