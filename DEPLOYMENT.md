# Koalafied Store — Deployment & Domain Setup

## Current Status

### ✅ Complete
- **GitHub Repository**: https://github.com/deburgermaster-afk/koalafied-store
  - All 137 files pushed (Next.js 16, Drizzle ORM, Printify integration, transparent product images)
- **Vercel Deployment**: https://koalafied-store.vercel.app (live & working)
- **Custom Domain**: `koalafeild.store` registered in Vercel project

### ✅ Custom Domain Active
- **Custom Domain**: `koalafied.store`
- **DNS Status**: A record set to `76.76.21.21` (Vercel IP) ✓
- **Provider**: Dynadot
- **Status**: Configured and ready

---

## DNS Configuration (Current State)

At Dynadot, the DNS must be configured with a CNAME record (not A record):

| Field | Value |
|-------|-------|
| **Record Type** | CNAME |
| **Domain** | www.koalafied.store |
| **Target** | koalafied-store.vercel.app |
| **Status** | ⏳ To be configured |

**To verify it's working:**
```bash
dig www.koalafied.store +short
# Should return: koalafied-store.vercel.app or Vercel's IP
```

### Why CNAME instead of A record?
- A records don't work for Vercel custom domains in production
- CNAME allows Vercel to manage SSL certificates and route traffic correctly
- Apex domain (without www) has limitations; use www subdomain

### Redirect apex domain (optional)
After www.koalafied.store works, set up redirects in code or use Dynadot forwarding to point `koalafied.store` → `www.koalafied.store`

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16.2.4, React 19 RC, TypeScript |
| **Database** | Neon Postgres (serverless) |
| **ORM** | Drizzle ORM 0.36.4 |
| **Print Fulfillment** | Printify API |
| **Payments** | Stripe (Live Keys Configured) |
| **Email** | Resend |
| **Image Hosting** | ImgBB (product images with transparent backgrounds) |
| **Hosting** | Vercel |
| **Domain Registrar** | Dynadot |

---

## Environment Variables

All 18 env vars are deployed to Vercel production:
- `DATABASE_URL` — Neon connection
- `NEXT_PUBLIC_SITE_URL` — https://koalafied.store (once DNS updates)
- `SESSION_PASSWORD`, `ADMIN_PASSWORD_HASH`
- **Stripe keys (Live)** — configured for production payments
- Printify token & webhook secret
- ImgBB API key
- Resend API key
- And more

---

## Stripe Configuration

**Status**: ✅ Live keys configured

**Configured Keys**:
- `STRIPE_SECRET_KEY` — sk_live_51HSJDRLY1FrVVlgi...
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — pk_live_51HSJDRLY1FrVVlgi...
- `STRIPE_WEBHOOK_SECRET` — ⏳ Needs to be configured in Stripe Dashboard

**Next steps for Stripe**:
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Create a new webhook endpoint with URL: `https://koalafied.store/api/webhooks/stripe`
4. Subscribe to: `checkout.session.completed`
5. Copy the signing secret starting with `whsec_`
6. Add to Vercel environment variables: `STRIPE_WEBHOOK_SECRET=whsec_...`
7. Redeploy the application

**How it works**:
- Customer adds items to cart → Checkout creates Stripe session
- Stripe processes payment → Sends webhook with `checkout.session.completed`
- Webhook handler marks order as paid + auto-submits to Printify for fulfillment
- Customer gets confirmation email & tracking updates

---

## Next Steps (Configure Custom Domain)

### Step 1: Update DNS in Dynadot
1. Log in to [Dynadot](https://dynadot.com/account/domain/name/list.html)
2. Click on `koalafied.store` → **DNS Settings**
3. **Delete** the A record (76.76.21.21)
4. **Add CNAME record**:
   - Record Type: `CNAME`
   - Name: `www`
   - Value: `koalafied-store.vercel.app`
5. Keep the TXT record for verification
6. Save changes

### Step 2: Wait for DNS Propagation
```bash
# Check propagation (run until it returns the Vercel endpoint)
dig www.koalafied.store +short
```
Typically takes 5-30 minutes, max 48 hours.

### Step 3: Verify in Browser
- Visit `https://www.koalafied.store` (should load the store)
- SSL certificate auto-issued by Vercel
- Update `NEXT_PUBLIC_SITE_URL` once working

### Step 4: (Optional) Redirect Apex Domain
- Use Dynadot's domain forwarding to redirect `koalafied.store` → `www.koalafied.store`
- Or add redirect in Next.js middleware

---

## Troubleshooting

**Website still not loading?**
- ✅ DNS resolves: `dig www.koalafied.store` shows Vercel endpoint
- ⏳ Still timeout: DNS still propagating (wait 15-45 min)
- ❌ DNS shows 76.76.21.21: Wrong record type. Delete A record, add CNAME instead

**How to check DNS type:**
```bash
dig www.koalafied.store MX  # Check what type of record is there
nslookup www.koalafied.store 8.8.8.8  # Use Google DNS
```

**Vercel preview URL working but custom domain isn't?**
- Domain not added to Vercel project yet
- Go to [Vercel Domains Dashboard](https://vercel.com/dashboard/koalafied-store/settings/domains)
- Might need to add it there first

**SSL certificate not issued?**
- Requires CNAME record (not A record)
- Check Vercel project settings for certificate status
- May take 5-15 minutes after DNS propagates

**DNS not updating after 30 minutes?**
- Flush local DNS: `sudo dscacheutil -flushcache` (Mac)
- Try different DNS: `dig www.koalafied.store @1.1.1.1` (Cloudflare)
- Check Dynadot dashboard: ensure CNAME shows `koalafied-store.vercel.app`
- Verify you edited the right domain in Dynadot

---

## Resources

- **Vercel Docs**: https://vercel.com/docs/projects/domains
- **GitHub Repo**: https://github.com/deburgermaster-afk/koalafied-store
- **Live Demo**: https://koalafied-store.vercel.app (while DNS updates)
