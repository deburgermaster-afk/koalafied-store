import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    handle: text("handle").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    basePriceCents: integer("base_price_cents").notNull(),
    currency: text("currency").notNull().default("AUD"),
    active: boolean("active").notNull().default(true),
    featured: boolean("featured").notNull().default(false),
    sourceId: text("source_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({ handleIdx: uniqueIndex("products_handle_idx").on(t.handle) })
);

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt").notNull().default(""),
  position: integer("position").notNull().default(0),
});

export const variants = pgTable(
  "variants",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku"),
    priceCents: integer("price_cents").notNull(),
    available: boolean("available").notNull().default(true),
    option1: text("option1"),
    option2: text("option2"),
    option3: text("option3"),
    imageUrl: text("image_url"),
    sourceId: text("source_id"),
    printifyProductId: text("printify_product_id"),
    printifyVariantId: text("printify_variant_id"),
  },
  (t) => ({ productIdx: index("variants_product_idx").on(t.productId) })
);

export const productOptions = pgTable("product_options", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  values: jsonb("values").$type<string[]>().notNull().default([]),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  fulfillmentStatus: text("fulfillment_status").notNull().default("unfulfilled"),
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  shippingCents: integer("shipping_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  currency: text("currency").notNull().default("AUD"),
  customerId: integer("customer_id"),
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  shippingAddress: jsonb("shipping_address").$type<ShippingAddress | null>(),
  shippingMethod: text("shipping_method"),
  trackingCode: text("tracking_code"),
  trackingCarrier: text("tracking_carrier"),
  trackingUrl: text("tracking_url"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  printifyOrderId: text("printify_order_id"),
  printifyError: text("printify_error"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").references(() => variants.id),
  productTitle: text("product_title").notNull(),
  variantLabel: text("variant_label").notNull().default(""),
  qty: integer("qty").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  imageUrl: text("image_url"),
  printifyProductId: text("printify_product_id"),
  printifyVariantId: text("printify_variant_id"),
});

export type ShippingAddress = {
  name: string;
  line1: string;
  line2?: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  phone?: string;
};

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Variant = typeof variants.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  phone: text("phone"),
  defaultAddress: jsonb("default_address").$type<ShippingAddress | null>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
