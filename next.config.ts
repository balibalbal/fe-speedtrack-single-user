import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/:path*", // backend API kamu
      },
    ];
  },
};

export default nextConfig;
