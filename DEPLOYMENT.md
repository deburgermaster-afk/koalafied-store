# Koalafied Store — Deployment & Domain Setup

## Current Status

### ✅ Complete
- **GitHub Repository**: https://github.com/deburgermaster-afk/koalafied-store
  - All 137 files pushed (Next.js 16, Drizzle ORM, Printify integration, transparent product images)
- **Vercel Deployment**: https://koalafied-store.vercel.app (live & working)
- **Custom Domain**: `koalafeild.store` registered in Vercel project

### ⏳ DNS Propagating
- **Custom Domain**: `koalafeild.store`
- **DNS Status**: A record set to `76.76.21.21` (Vercel IP) ✓
- **Provider**: Dynadot
- **ETA**: Currently propagating (typically 15–30 minutes, max 48 hours)

---

## DNS Configuration (Current State)

At Dynadot, the **A record** for `koalafeild.store` is set to:

| Field | Value |
|-------|-------|
| **Record Type** | A |
| **Domain** | koalafeild.store |
| **IP Address** | 76.76.21.21 (Vercel) |
| **Status** | ✓ Configured |

**To verify it's working:**
```bash
dig koalafeild.store +short
# Should return: 76.76.21.21
```

Once DNS propagates, https://koalafeild.store will point to your Koalafied storefront.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16.2.4, React 19 RC, TypeScript |
| **Database** | Neon Postgres (serverless) |
| **ORM** | Drizzle ORM 0.36.4 |
| **Print Fulfillment** | Printify API |
| **Payments** | Stripe |
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
- Stripe keys
- Printify token & webhook secret
- ImgBB API key
- Resend API key
- And more

---

## Next Steps (After DNS Propagation)

1. **Verify domain**: Visit https://koalafeild.store (should load your store)
2. **Test SSL**: Certificate auto-provisioned by Vercel
3. **Monitor**: Check Vercel project dashboard for any alerts

---

## Troubleshooting

**DNS not updating after 30 minutes?**
- Flush local DNS: `sudo dscacheutil -flushcache` (Mac)
- Try different DNS: `dig koalafied.store @1.1.1.1` (Cloudflare)
- Check Dynadot dashboard: ensure A record shows `76.76.21.21`

**Domain returns 404?**
- May indicate DNS hasn't fully propagated yet
- Preview URL https://koalafied-store.vercel.app will always work

---

## Resources

- **Vercel Docs**: https://vercel.com/docs/projects/domains
- **GitHub Repo**: https://github.com/deburgermaster-afk/koalafied-store
- **Live Demo**: https://koalafied-store.vercel.app (while DNS updates)
