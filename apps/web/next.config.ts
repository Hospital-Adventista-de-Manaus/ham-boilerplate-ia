import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@app/shared-types'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
