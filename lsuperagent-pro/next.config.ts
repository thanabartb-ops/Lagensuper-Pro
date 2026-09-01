import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  basePath: process.env.PAGES_BASE_PATH,
  trailingSlash: true,
};

export default nextConfig;
