import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/bingo", destination: "/bingo/index.html", permanent: false }];
  },
};

export default nextConfig;
