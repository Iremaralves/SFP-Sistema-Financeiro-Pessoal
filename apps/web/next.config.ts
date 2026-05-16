import type { NextConfig } from 'next';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const webpack = require('webpack');

const nextConfig: NextConfig = {
  transpilePackages: ['@i2fin/core', '@i2fin/db', '@i2fin/schema'],
  experimental: {
    turbo: {},
  },
  webpack: (config, { isServer }) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    if (!isServer) {
      // Strip node: protocol so webpack can handle built-ins via fallback below.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:(.+)$/, (resource: { request: string }) => {
          resource.request = resource.request.replace(/^node:/, '');
        }),
      );
      // Node built-ins used by @i2fin/core (parser, fingerprint) are server/CLI only.
      // Client components never call those functions; stub them to empty modules.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

export default nextConfig;
