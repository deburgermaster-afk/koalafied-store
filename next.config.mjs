/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.koalafied.store" },
      { protocol: "https", hostname: "koalafied.store" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "images-api.printify.com" },
      { protocol: "https", hostname: "images.printify.com" },
      { protocol: "https", hostname: "i.ibb.co" },
    ],
  },
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
};

export default nextConfig;
