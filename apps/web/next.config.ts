import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@i2fin/core', '@i2fin/db', '@i2fin/schema'],
  experimental: {
    turbo: {},
  },
};

export default nextConfig;
