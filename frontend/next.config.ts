import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL || "http://127.0.0.1:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/dashboard/:path*",
        destination: `${backendUrl}/api/dashboard/:path*`,
      },
    ];
  },
};

export default nextConfig;
