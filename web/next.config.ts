import type { NextConfig } from "next";
import path from "path";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

const nextConfig: NextConfig = {
  transpilePackages: ['@podcasts/shared'],
  // bullmq/ioredis are server-only — load via native require instead of
  // bundling. This also stops webpack from tracing bullmq's lazy, optional
  // '@valkey/valkey-glide' require (unused; we connect via ioredis).
  serverExternalPackages: ['bullmq', 'ioredis', '@valkey/valkey-glide'],
  turbopack: {
    root: path.join(__dirname, '..'),
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Podcast artwork URLs come from RSS feeds and are stable — cache
    // optimized variants for 31 days instead of the 60s default, which was
    // causing constant sharp re-optimization (native memory churn).
    minimumCacheTTL: 2678400,
    // Trim variant sizes to what the UI actually renders — each requested
    // size is a separate sharp job + cached buffer.
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [32, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        // Artwork hosts are arbitrary (RSS feeds), so https must stay open.
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
