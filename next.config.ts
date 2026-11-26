import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/pingos-dicen", destination: "/pingos-dicen/index.html", permanent: false },
      { source: "/bingo", destination: "/bingo/index.html", permanent: false },
      { source: "/copacabana", destination: "/copacabana/index.html", permanent: false },
    ];
  },
};

export default nextConfig;
