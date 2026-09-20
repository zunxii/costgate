import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Route handlers at app/api/**/route.ts proxy to the backend themselves (BFF pattern).
  // Do NOT add rewrites for /api/* paths — they would bypass the route handlers.
};

export default nextConfig;
