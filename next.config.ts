import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Disable canvas for server-side rendering
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
        "@napi-rs/canvas": false,
      };
    }
    return config;
  },
};

export default nextConfig;
