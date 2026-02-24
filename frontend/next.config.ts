import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://platform.twitter.com https://www.tiktok.com`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.tiktok.com https://platform.twitter.com",
              "connect-src 'self' " + (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"),
              "font-src 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' https://platform.twitter.com https://www.tiktok.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.tiktok.com https://platform.twitter.com",
              "connect-src 'self' " + (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"),
              "font-src 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
