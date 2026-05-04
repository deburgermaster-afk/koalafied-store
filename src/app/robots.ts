import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/account", "/cart"] },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://koalafied.store"}/sitemap.xml`,
  };
}
