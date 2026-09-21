import path from "path";
import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_STATIC: isPages ? "true" : "",
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

if (isPages) {
  nextConfig.output = "export";
  nextConfig.basePath = "/StockRoom";
  nextConfig.assetPrefix = "/StockRoom";
  nextConfig.trailingSlash = true;
}

export default nextConfig;
