import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tambahkan baris ini (tanpa https://)
  allowedDevOrigins: ['hughes-cord-different-joshua.trycloudflare.com'],
};

export default nextConfig;
