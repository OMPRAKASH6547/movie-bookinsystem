import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow BUILD_DIR to avoid clashing with a running `next dev` lock on `.next`
  distDir: process.env.BUILD_DIR || ".next",
  output: "standalone",
  serverExternalPackages: ["pdfkit", "fontkit", "pdf-lib"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-DNS-Prefetch-Control", value: "on" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ],
    },
  ],
};

export default nextConfig;
