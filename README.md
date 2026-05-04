# KOALAFIED — Next.js Storefront

Uniqlo-inspired storefront for [koalafied.store](https://www.koalafied.store/).
Next.js 15 App Router · Tailwind · Drizzle on Neon · Stripe Checkout · Printify auto-fulfilment · Australia Post live rates & tracking · Fly.io deploy.

## Features
- **Floating bottom nav** (Home / Shop / Track / Cart with badge) — present on every public page.
- **Uniqlo-style UI**: oversized imagery, ample whitespace, clean type.
- **Full product catalog** scraped from `koalafied.store/products.json` — 12 products, all colors/sizes/variants/images.
- **Cart & checkout** via Stripe Checkout (`/api/checkout`).
- **Auto Printify orders** on `checkout.session.completed` webhook (`/api/webhooks/stripe`).
- **AusPost PAC API** for live rates at cart, and AusPost tracking on `/track`.
- **Admin panel** at `/admin` (password-protected) with order list, order detail, retry-Printify button, and Printify mapping overview.
- **Fly.io ready**: Dockerfile + `fly.toml` (Sydney region).

## Setup

```bash
# 1. install
npm install

# 2. configure env
cp .env.example .env
# edit .env — DATABASE_URL is already wired to your new Neon project

# 3. generate admin password
npx tsx scripts/admin-password.ts
# copy ADMIN_PASSWORD_HASH into .env

# 4. set up DB schema + seed products
npm run db:migrate
npm run db:seed

# 5. (once Printify keys are set) sync mapping
npm run printify:sync

# 6. dev
npm run dev
```

## Required env vars
| Var | What |
|---|---|
| `DATABASE_URL` | Neon Postgres URL (already filled). |
| `SESSION_PASSWORD` | 32+ char random string for admin cookie. |
| `ADMIN_PASSWORD_HASH` | bcrypt hash from `scripts/admin-password.ts`. |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe. |
| `PRINTIFY_API_TOKEN` / `PRINTIFY_SHOP_ID` | Printify (Settings → Connections → Personal access token). |
| `AUSPOST_API_KEY` / `AUSPOST_FROM_POSTCODE` | Australia Post PAC API ([signup](https://developers.auspost.com.au)). |

If a key is missing, integrations gracefully degrade (e.g. the cart shows flat-rate shipping when AusPost is unset).

## Stripe webhook setup
```
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```
Production: add endpoint `https://YOUR-DOMAIN/api/webhooks/stripe` in Stripe → Developers → Webhooks → event `checkout.session.completed`. Paste the signing secret into `STRIPE_WEBHOOK_SECRET`.

## Printify mapping
`scripts/printify-sync.ts` pulls all products from your Printify shop and matches by title + option (Color/Size). Re-run any time you add products. The admin panel at `/admin/products` shows mapped/unmapped counts. Orders with unmapped variants will be flagged — fix the mapping then click "Retry Printify submission" on the order.

## Australia Post
- **Rates** (cart): `GET /api/shipping/rates?postcode=XXXX&items=N` — uses PAC domestic parcel service.
- **Tracking** (public): `GET /api/track?code=XXX` — used by `/track` page.

## Deploy to Fly.io
```bash
fly launch --copy-config --no-deploy
fly secrets set DATABASE_URL=... SESSION_PASSWORD=... ADMIN_PASSWORD_HASH=... \
  STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... PRINTIFY_API_TOKEN=... \
  PRINTIFY_SHOP_ID=... AUSPOST_API_KEY=... AUSPOST_FROM_POSTCODE=2000 \
  NEXT_PUBLIC_SITE_URL=https://koalafied-store.fly.dev
fly deploy
```

After deploy, run migrations + seed once against the live DB:
```bash
DATABASE_URL=... npm run db:migrate
DATABASE_URL=... npm run db:seed
```

## Routes
- `/` — hero + featured grid
- `/shop` — all products, filter by category
- `/products/[handle]` — product detail with variant picker
- `/cart` — cart + AusPost rate calculator + Stripe checkout
- `/checkout/success` — confirmation
- `/track` — AusPost tracking lookup
- `/admin` — orders dashboard
- `/admin/orders/[id]` — order detail + Printify retry
- `/admin/products` — Printify mapping status

## Notes
- All product data, images, colors, sizes are imported live from the existing Shopify store via `products.json`. Re-run `npm run db:seed` whenever the source store updates.
- Currency is AUD by default; change `CURRENCY` env var to override.
