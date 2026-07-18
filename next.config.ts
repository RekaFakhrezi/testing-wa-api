import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tambahkan baris ini (tanpa https://)
  allowedDevOrigins: ['benefit-tract-lynn-societies.trycloudflare.com'],
};

export default nextConfig;
